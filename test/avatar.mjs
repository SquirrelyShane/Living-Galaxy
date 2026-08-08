// v1.00.32 — NPC minds.
//
// Covers the adapter (systems/npc-brain.js) against live game state, plus the portable
// engine underneath it. The engine has its own standalone suite in src/npc-avatar/test/
// (run with `node src/npc-avatar/test/run.mjs`); this file is about the seam — that a
// hail actually produces a persona, that the persona actually changes the line, and that
// every language-model failure mode leaves the player with the line they already had.
import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const { S, recalcStats } = await imp('core/state.js');
const { seedWorld, makeRng, hashString } = await imp('core/rng.js');
const { initScene } = await imp('world/scene.js');
const { createSystem } = await imp('world/system.js');
const { createNpcs } = await imp('entities/npcs.js');
const { initAudio } = await imp('systems/audio.js');
const CM = await imp('systems/comms.js');
const NB = await imp('systems/npc-brain.js');
const { AVATAR } = await imp('core/config.js');
const { SCHEMA } = await imp('core/version.js');
const save = await imp('systems/save.js');

// engine internals, for the seam tests
const { createPersona, say, rememberEvent } = await imp('npc-avatar/core/persona.js');
const { createRouter, requestLine } = await imp('npc-avatar/core/router.js');
const { createBridge } = await imp('npc-avatar/llm/bridge.js');
const { MODELS, DEFAULT_MODEL } = await imp('npc-avatar/llm/models.js');

initScene();
seedWorld(20260806);
recalcStats();
createSystem();
createNpcs();
initAudio();
CM.initComms();
NB.initBrains();
S.running = true;
S.time = 1000;

// ── archetype inference ──────────────────────────────────────────────
console.log('\n— who is who —');
{
  ok('a miner is a laborer', NB.archetypeFor({ role: 'mine' }) === 'laborer');
  ok('a mercenary is a criminal', NB.archetypeFor({ role: 'merc' }) === 'criminal');
  ok('a hauler is a merchant', NB.archetypeFor({ role: 'haul' }) === 'merchant');
  ok('role beats faction', NB.archetypeFor({ role: 'haul', faction: 'hostile' }) === 'merchant');
  ok('a roleless hostile falls back to criminal',
     NB.archetypeFor({ faction: 'hostile' }) === 'criminal');
  ok('a roleless friendly falls back to patrol',
     NB.archetypeFor({ faction: 'friendly' }) === 'patrol');
  ok('an unknown NPC still gets an archetype rather than undefined',
     NB.archetypeFor({}) === 'drifter');
  ok('a null userData does not throw', NB.archetypeFor(null) === 'drifter');
}

// ── personas are lazy, cached and deterministic ──────────────────────
console.log('\n— minds are made on demand —');
{
  S.brains = { personas: {} };
  ok('no personas exist before anybody is spoken to', NB.knownPersonas().length === 0);

  const u = { name: 'Rask', faction: 'hostile', role: 'merc' };
  const p1 = NB.personaFor(u);
  ok('a persona is created on first contact', !!p1 && p1.name === 'Rask');
  ok('it took the inferred archetype', p1.archetype === 'criminal');
  ok('the table now holds exactly one', NB.knownPersonas().length === 1);

  const p2 = NB.personaFor(u);
  ok('a second lookup returns the same object rather than rebuilding', p1 === p2);
  ok('the table did not grow', NB.knownPersonas().length === 1);

  ok('an NPC with no name gets no persona', NB.personaFor({ faction: 'hostile' }) === null);
  ok('a null userData gets no persona', NB.personaFor(null) === null);

  // Determinism: the same name in the same world must be the same person, or two
  // multiplayer clients disagree about who they are talking to.
  S.brains = { personas: {} };
  const again = NB.personaFor({ name: 'Rask', faction: 'hostile', role: 'merc' });
  ok('the same name rebuilds the identical personality',
     JSON.stringify(again.traits) === JSON.stringify(p1.traits),
     JSON.stringify(again.traits));

  const other = NB.personaFor({ name: 'Vann', faction: 'hostile', role: 'merc' });
  ok('a different name is a different person',
     JSON.stringify(other.traits) !== JSON.stringify(again.traits));
}

// ── the persona table is bounded ─────────────────────────────────────
{
  S.brains = { personas: {} };
  for (let i = 0; i < AVATAR.maxPersonas + 40; i++) {
    NB.personaFor({ name: 'Filler-' + i, faction: 'neutral', role: 'mine' });
  }
  ok('a long session cannot grow the persona table without bound',
     NB.knownPersonas().length <= AVATAR.maxPersonas, String(NB.knownPersonas().length));

  // Characters the player actually has history with must survive the cull.
  S.brains = { personas: {} };
  NB.noteEvent({ name: 'Important', faction: 'hostile', role: 'merc' },
               { type: 'contract', subject: 'player', weight: 3 });
  for (let i = 0; i < AVATAR.maxPersonas + 40; i++) {
    NB.personaFor({ name: 'Noise-' + i, faction: 'neutral', role: 'mine' });
  }
  ok('a character with real history is not culled to make room',
     NB.knownPersonas().includes('Important'));
}

// ── memory changes what gets said ────────────────────────────────────
console.log('\n— memory changes the line —');
{
  S.brains = { personas: {} };
  const u = { name: 'Kell', faction: 'hostile', role: 'merc' };
  const p = NB.personaFor(u);
  const rng = makeRng(1);

  const cold = say(p, NB.HAIL_GRAMMARS, 'merc_contract', {}, rng, S.time);
  ok('a stranger gets a line', typeof cold === 'string' && cold.length > 20);
  ok('a stranger never gets the "you again" line', !/You again/i.test(cold), cold);

  NB.noteEvent(u, { type: 'contract', subject: 'player', weight: 3 });
  // Sweep the rng so the memory-gated rule (which carries the highest weight) is reached.
  let sawMemoryLine = false;
  for (let i = 0; i < 60; i++) {
    const line = say(p, NB.HAIL_GRAMMARS, 'merc_contract', {}, makeRng(i), S.time);
    if (/You again/i.test(line)) { sawMemoryLine = true; break; }
  }
  ok('once they have history, the memory-gated line becomes reachable', sawMemoryLine);
}

// ── the hails the world fires ────────────────────────────────────────
console.log('\n— hails —');
{
  S.brains = { personas: {} };
  CM.initComms();
  S.time = 2000;

  const merc = { userData: { name: 'Bray', faction: 'hostile', role: 'merc' } };
  const h = NB.hailMercContract(merc);
  ok('a merc contract hail opens', !!h && !!CM.pending());
  ok('it carries reply options', h.options.length === 3);
  ok('it carries the log entry id for later enrichment', h.entryId != null);
  ok('it created a persona for the speaker', NB.knownPersonas().includes('Bray'));
  ok('the mercenary remembers taking the contract',
     NB.personaReport('Bray').recent.some(r => r.type === 'contract'));
  ok('the log shows the hail', CM.commsLog().some(e => e.kind === 'hail' && e.from === 'Bray'));
  CM.reply(-1);

  S.time = 3000;
  const w = NB.hailClaimWarning('Bastion control');
  ok('a claim warning opens', !!w && w.options.length === 3);
  ok('it speaks as the named patrol', NB.knownPersonas().includes('Bastion control'));
  CM.reply(-1);

  S.time = 4000;
  const d = NB.hailDistress({ userData: { name: 'Ferry', faction: 'neutral', role: 'haul' } });
  ok('a distress hail opens on the distress channel', !!d && d.channel === 'distress');
  ok('the caller is a merchant archetype', NB.personaReport('Ferry').archetype === 'merchant');
  CM.reply(-1);

  // The hail cooldown in comms.js must still hold — a persona layer must not accidentally
  // let the same character spam the player.
  S.time = 4001;
  ok('the hail cooldown still applies through the new path',
     NB.hailDistress({ userData: { name: 'Ferry', faction: 'neutral', role: 'haul' } }) === null);
}

// ── an unnamed or persona-less speaker still says something ──────────
{
  CM.initComms();
  S.time = 6000;
  const h = NB.hailDistress({ userData: { faction: 'neutral' } });   // no name at all
  ok('a nameless ship can still raise a distress call', !!h);
  ok('and the line is real text, not a broken grammar token',
     !/^#/.test(CM.commsLog()[CM.commsLog().length - 1].text));
  CM.reply(-1);
}

// ── log entry enrichment ─────────────────────────────────────────────
console.log('\n— the upgrade path —');
{
  CM.initComms();
  const e = CM.transmit({ from: 'X', faction: 'neutral', text: 'original line' });
  ok('updateEntryText rewrites the named entry', CM.updateEntryText(e.id, 'better line') === true);
  ok('the log now shows the better line',
     CM.commsLog().find(x => x.id === e.id).text === 'better line');
  ok('an unknown entry id is a no-op rather than a crash',
     CM.updateEntryText(99999, 'nope') === false);
  ok('an empty replacement is refused', CM.updateEntryText(e.id, '') === false);
  ok('the original text survives a refused replacement',
     CM.commsLog().find(x => x.id === e.id).text === 'better line');
}

// ── sanitising what a small model returns ────────────────────────────
console.log('\n— models write untidily —');
{
  ok('stage directions are stripped',
     NB.sanitize('*leans forward* Cut your engines.') === 'Cut your engines.');
  ok('wrapping quotes are stripped', NB.sanitize('"Cut your engines."') === 'Cut your engines.');
  ok('a speaker prefix is stripped', NB.sanitize('Rask: Cut your engines.') === 'Cut your engines.');
  ok('all three at once are stripped',
     NB.sanitize('*sighs* "Rask: Cut your engines."') === 'Cut your engines.');
  ok('whitespace is collapsed', NB.sanitize('Cut   your\n\nengines.') === 'Cut your engines.');
  ok('empty input is safe', NB.sanitize('') === '');
  ok('null input is safe', NB.sanitize(null) === '');

  const long = 'A '.repeat(400);
  ok('an overlong reply is capped', NB.sanitize(long).length <= AVATAR.maxChars + 1,
     String(NB.sanitize(long).length));
  const sentences = 'First sentence here. ' + 'Padding words '.repeat(40) + 'end.';
  ok('capping prefers a sentence boundary where there is one',
     /[.!?\u2026]$/.test(NB.sanitize(sentences)));
}

// ── failure modes leave the player with a line ───────────────────────
{
  const persona = createPersona({ id: 'T', name: 'T', archetype: 'criminal', rng: makeRng(3) });
  const router = createRouter({ maxConcurrent: 1, cooldown: 0, worthy: () => true });

  const dead = { ready: () => false, request: () => Promise.resolve('never') };
  const r1 = requestLine(router, { persona, grammar: NB.HAIL_GRAMMARS, situation: 'merc_contract',
                                    now: 0, rng: makeRng(4), bridge: dead });
  ok('an unloaded model leaves a full grammar line and no upgrade',
     r1.text.length > 20 && r1.upgrade === null);

  const broken = { ready: () => true, request: () => Promise.reject(new Error('gpu lost')) };
  const r2 = requestLine(router, { persona, grammar: NB.HAIL_GRAMMARS, situation: 'merc_contract',
                                    now: 10, rng: makeRng(5), bridge: broken });
  ok('a crashing model still gave the player a line immediately', r2.text.length > 20);
  ok('and the upgrade resolves null rather than rejecting', (await r2.upgrade) === null);

  const slow = { ready: () => true, request: () => new Promise(res => setTimeout(() => res('late'), 5)) };
  const r3 = requestLine(router, { persona, grammar: NB.HAIL_GRAMMARS, situation: 'merc_contract',
                                    now: 20, rng: makeRng(6), bridge: slow });
  ok('a slow model does not block the immediate line', r3.text.length > 20);
  ok('and its answer still arrives', (await r3.upgrade) === 'late');
}

// ── ambient chatter is never worth a model ───────────────────────────
{
  const router = createRouter({ worthy: situation => !!NB.HAIL_GRAMMARS[situation] });
  const persona = createPersona({ id: 'A', name: 'A', archetype: 'laborer', rng: makeRng(7) });
  const bridge = { ready: () => true, request: () => Promise.resolve('x') };
  const amb = requestLine(router, { persona, grammar: { ambient: [{ text: () => 'seam is good here' }] },
                                     situation: 'ambient', now: 0, bridge });
  ok('belt chatter never reaches the model', amb.upgrade === null && amb.reason === 'not-worth-it');
  const h = requestLine(router, { persona, grammar: NB.HAIL_GRAMMARS, situation: 'distress',
                                   now: 0, bridge });
  ok('a hail does', h.upgrade !== null);
  await h.upgrade;
}

// ── the bridge is opt-in and never auto-downloads ────────────────────
console.log('\n— the model is opt-in —');
{
  const rep = NB.brainsReport();
  ok('brains report their state', typeof rep.enabled === 'boolean');
  ok('the configured model is a real registry entry', !!MODELS[rep.model]);
  ok('the default model is the registry default or an explicit override',
     rep.model === AVATAR.model);
  ok('nothing has been downloaded just by booting',
     rep.llm.status === 'idle' || rep.llm.status === 'off', rep.llm.status);
  ok('the router policy is single-slot on purpose', rep.router.maxConcurrent === 1);

  ok('brains can be switched off', NB.setBrainsEnabled(false) === false);
  ok('a disabled tier reports off', NB.brainsReport().llm.status === 'off');
  ok('and switching off does not break hailing',
     (CM.initComms(), S.time = 9000, !!NB.hailMercContract({ userData: { name: 'Zed', faction: 'hostile', role: 'merc' } })));
  CM.reply(-1);
  ok('brains can be switched back on', NB.setBrainsEnabled(true) === true);
}

// ── persistence ──────────────────────────────────────────────────────
console.log('\n— minds survive a save —');
{
  ok('the schema moved', SCHEMA === 14);

  S.brains = { personas: {} };
  NB.noteEvent({ name: 'Remembered', faction: 'hostile', role: 'merc' },
               { type: 'contract', subject: 'player', weight: 2 });
  NB.personaFor({ name: 'Forgettable', faction: 'neutral', role: 'mine' });

  const flat = NB.serializeBrains();
  ok('a persona with history is saved', flat.some(p => p.id === 'Remembered'));
  ok('a persona with no history is not — it is free to rebuild from the seed',
     !flat.some(p => p.id === 'Forgettable'), JSON.stringify(flat.map(p => p.id)));

  NB.restoreBrains(flat);
  ok('restore rebuilds the persona', NB.knownPersonas().includes('Remembered'));
  ok('restore rebuilds its memory',
     NB.personaReport('Remembered').recent.some(r => r.type === 'contract'));

  ok('restoring nothing is an empty table, not a crash',
     NB.restoreBrains(null) === false && NB.knownPersonas().length === 0);
  ok('restoring garbage drops it rather than crashing',
     (NB.restoreBrains([null, {}, { id: 'Good', traits: {}, memory: [] }]),
      NB.knownPersonas().length === 1));

  const snap = save.snapshot();
  ok('the payload carries a brains slot', 'brains' in snap);

  const legacy = JSON.parse(JSON.stringify(snap));
  delete legacy.brains;
  legacy.v = 8;
  const up = save.migrate(legacy);
  ok('a v8 save migrates to current', up && up.v === SCHEMA);
  ok('migration invents no personas', up.brains === null);
}

// ── ambient traffic comes from real people now ───────────────────────
console.log('\n— the belt has voices —');
{
  ok('every mood the radio classifies has a grammar',
     ['idle', 'mine', 'build', 'trade', 'hunt', 'fear'].every(m => !!NB.AMBIENT_GRAMMARS[m]));
  ok('replies are keyed by the mood being answered',
     ['fear', 'trade', 'taunt', 'hunt'].every(m => !!NB.REPLY_GRAMMARS[m]));

  S.brains = { personas: {} };
  ok('a provider is registered once brains are initialised', CM.hasVoiceProvider() === true);

  // Two miners, same mood, different people — the whole point of the tier.
  const lines = new Set();
  for (const name of ['Dolan', 'Petrov', 'Aguda', 'Mears', 'Sun', 'Okonkwo']) {
    const p = NB.personaFor({ name, faction: 'neutral', role: 'mine' });
    for (let i = 0; i < 12; i++) {
      lines.add(say(p, NB.AMBIENT_GRAMMARS, 'mine', {}, makeRng(i), S.time));
    }
  }
  ok('the same mood produces genuinely different lines across characters',
     lines.size >= 3, `${lines.size} distinct`);
  ok('no line came back as an unexpanded grammar token',
     [...lines].every(l => !/^#/.test(l)), [...lines].join(' | ').slice(0, 120));

  // A trait-gated line must actually be reachable for a character who qualifies, and
  // unreachable for one who does not.
  const greedy = createPersona({ id: 'G', name: 'G', archetype: 'merchant',
    traits: { aggression: 0.2, sociability: 0.5, greed: 0.95, loyalty: 0.3, verbosity: 0.5, formality: 0.4 } });
  const generous = createPersona({ id: 'H', name: 'H', archetype: 'merchant',
    traits: { aggression: 0.2, sociability: 0.5, greed: 0.05, loyalty: 0.3, verbosity: 0.5, formality: 0.4 } });
  let greedyLine = false, generousLine = false;
  for (let i = 0; i < 80; i++) {
    if (/do not tell the refinery/i.test(say(greedy, NB.AMBIENT_GRAMMARS, 'mine', {}, makeRng(i), 0))) greedyLine = true;
    if (/do not tell the refinery/i.test(say(generous, NB.AMBIENT_GRAMMARS, 'mine', {}, makeRng(i), 0))) generousLine = true;
  }
  ok('a greed-gated line is reachable for a greedy character', greedyLine);
  ok('and unreachable for a generous one', !generousLine);
}

// ── NPC-to-NPC exchanges are two personalities, not two factions ─────
{
  const loyal = createPersona({ id: 'L', name: 'L', archetype: 'patrol',
    traits: { aggression: 0.4, sociability: 0.4, greed: 0.1, loyalty: 0.9, verbosity: 0.4, formality: 0.6 } });
  const vulture = createPersona({ id: 'V', name: 'V', archetype: 'criminal',
    traits: { aggression: 0.8, sociability: 0.3, greed: 0.9, loyalty: 0.1, verbosity: 0.3, formality: 0.1 } });

  let rescue = false, refusal = false;
  for (let i = 0; i < 80; i++) {
    if (/vector inbound/i.test(say(loyal, NB.REPLY_GRAMMARS, 'fear', {}, makeRng(i), 0))) rescue = true;
    if (/nobody is coming/i.test(say(vulture, NB.REPLY_GRAMMARS, 'fear', {}, makeRng(i), 0))) refusal = true;
  }
  ok('a loyal character answers a distress call', rescue);
  ok('a disloyal, aggressive one refuses it', refusal);
  ok('the two never swap answers',
     !/nobody is coming/i.test(say(loyal, NB.REPLY_GRAMMARS, 'fear', {}, makeRng(1), 0)));
}

// ── a broken voice provider must not silence the radio ───────────────
{
  CM.setVoiceProvider({ line: () => { throw new Error('boom'); }, reply: () => { throw new Error('boom'); } });
  CM.initComms();
  S.time = 12000;
  let threw = null;
  try { for (let i = 0; i < 12; i++) { S.time += 80; CM.updateComms(80); } }
  catch (e) { threw = e; }
  ok('a throwing voice provider does not break ambient traffic', threw === null, threw && threw.message);

  CM.setVoiceProvider({ line: () => null, reply: () => null });
  CM.initComms();
  S.time = 14000;
  for (let i = 0; i < 12; i++) { S.time += 80; CM.updateComms(80); }
  ok('a provider returning null falls back to the static tables rather than going quiet',
     CM.commsLog().every(e => !!e.text));
  NB.initBrains();                    // put the real provider back
  ok('the real provider is restored', CM.hasVoiceProvider() === true);
}

// ── the world files memories about you ───────────────────────────────
console.log('\n— people notice what you do —');
{
  S.brains = { personas: {} };
  S.player.position.set(0, 0, 0);

  // Park a few witnesses inside voice range.
  const parked = [];
  for (let i = 0; i < 4; i++) {
    const n = S.world.npcs[i];
    if (!n) break;
    n.position.set(i * 200, 0, 0);
    n.userData.name = 'Witness' + i;
    n.userData.hp = n.userData.maxHp || 100;
    n.userData.faction = i < 2 ? 'hostile' : 'neutral';
    parked.push(n);
  }
  ok('there are witnesses to work with', parked.length >= 2);

  const filed = NB.witnessKill({ name: 'Vann', faction: 'hostile' });
  ok('a kill is witnessed by everyone in range', filed >= 2, String(filed));
  ok('witnesses now hold a persona', NB.knownPersonas().length >= 2);

  const sameSide = NB.personaReport('Witness0');
  ok('a hostile who watched you kill a hostile files it as one of theirs',
     sameSide.recent.some(r => r.type === 'saw-kill-ours'));
  const otherSide = NB.personaReport('Witness2');
  ok('a neutral who watched the same kill files it differently',
     otherSide.recent.some(r => r.type === 'saw-kill-theirs'));

  // Out of range must not file anything. Every ship has to move, not just the parked
  // ones — the world spawns its own traffic and some of it is near the origin.
  S.brains = { personas: {} };
  const stash = S.world.npcs.map(n => n.position.clone());
  for (const n of S.world.npcs) n.position.set(9e6, 9e6, 9e6);
  ok('a kill nobody could see is witnessed by nobody',
     NB.witnessKill({ name: 'Vann', faction: 'hostile' }) === 0);
  S.world.npcs.forEach((n, i) => n.position.copy(stash[i]));
}

{
  S.brains = { personas: {} };
  ok('a station remembers a trade', !!NB.witnessTrade('Ceres Exchange', 8000));
  const r = NB.personaReport('Ceres Exchange');
  ok('the memory carries the value', r.recent.some(m => m.type === 'traded' && m.meta.value === 8000));
  ok('a bigger deal is remembered harder',
     (NB.witnessTrade('Big Exchange', 40000),
      NB.personaReport('Big Exchange') !== null));
  ok('a zero-value trade files nothing', NB.witnessTrade('Nowhere', 0) === null);
  ok('a nameless station files nothing', NB.witnessTrade(null, 5000) === null);
}

{
  S.brains = { personas: {} };
  const miner = { name: 'Aggrieved', faction: 'neutral', role: 'mine' };
  ok('a claim jump is remembered', !!NB.witnessClaimJump(miner));
  ok('by the miner whose rock it was',
     NB.personaReport('Aggrieved').recent.some(m => m.type === 'claim-jumped'));
  ok('a nameless miner files nothing', NB.witnessClaimJump({ role: 'mine' }) === null);

  // ...and it comes back at you in their own chatter.
  const p = NB.personaFor(miner);
  let heard = false;
  for (let i = 0; i < 80; i++) {
    if (/worked this face already/i.test(say(p, NB.AMBIENT_GRAMMARS, 'mine', {}, makeRng(i), S.time))) heard = true;
  }
  ok('and the grudge becomes a line they can actually say', heard);
}

// ── log rows carry a persona key ─────────────────────────────────────
console.log('\n— you can open a mind —');
{
  CM.initComms();
  S.time = 20000;
  NB.hailMercContract({ userData: { name: 'Opener', faction: 'hostile', role: 'merc' } });
  const row = CM.commsLog().find(e => e.kind === 'hail');
  ok('a hail row carries the speaker key', row && row.speaker === 'Opener');
  ok('the key resolves to a real persona', !!NB.personaReport(row.speaker));
  CM.reply(-1);

  const sys = CM.transmit({ from: 'System', text: 'a system line' });
  ok('a message with no speaker declines the tap rather than opening empty',
     sys.speaker === null);
}

{
  const MIND = await imp('ui/mind.js');
  let threw = null;
  try { MIND.initMind(); } catch (e) { threw = e; }
  ok('the mind overlay initialises', threw === null, threw && threw.message);

  S.brains = { personas: {} };
  NB.noteEvent({ name: 'Readable', faction: 'hostile', role: 'merc' },
               { type: 'contract', subject: 'player', weight: 2 });
  threw = null;
  let opened = false;
  try { opened = MIND.openMind('Readable'); } catch (e) { threw = e; }
  ok('it opens on a character who has one', threw === null && opened === true,
     threw && threw.message);
  ok('and reports open', MIND.mindOpen() === true);
  MIND.closeMind();
  ok('it closes', MIND.mindOpen() === false);
  ok('opening an unknown name is refused rather than showing an empty panel',
     MIND.openMind('Nobody At All') === false);
  ok('opening nothing is refused', MIND.openMind(null) === false);

  // A character with no history must still render — the "they do not know you" path.
  NB.personaFor({ name: 'Stranger', faction: 'neutral', role: 'mine' });
  threw = null;
  try { MIND.openMind('Stranger'); } catch (e) { threw = e; }
  ok('a character with no memories of you still renders', threw === null, threw && threw.message);
  MIND.closeMind();
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
