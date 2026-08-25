// Individuals, not categories.
//
// The report: "if built just for 6 is a constraint that's limiting exposure and depth, open
// it up to be unique per npc and player. They start out with 0 standing, besides the
// bonuses from character creation."
//
// Both halves were true. Every gate in the game asked "which of six are you" — six fleet
// roles, six careers, three reputation blocs — and a category with twelve order types
// behind it is a bottleneck with a name. And standing started at +10 Coalition / −20 Outer
// for *everybody*: a stance nobody had taken, applied before the character had done
// anything.
//
// What this suite pins:
//
//   1. **Zero means zero.** A character with no lineage or corporation bonus toward a power
//      is at exactly 0 with it, and the old bloc-wide head start is gone.
//   2. **Individuals differ.** Two NPCs of the same role are measurably different people,
//      deterministically, without either of them being stored.
//   3. **The gate explains itself.** A refusal names the thing that is missing. A gate that
//      will not say what it wants is what makes progression feel arbitrary.
//   4. **The corp war is mechanical.** Standing with one power moves standing with its
//      rivals, in the direction the *timeline* implies — because `relationOf()` derives
//      relationships from `HISTORY` rather than reading a second table beside it.

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
const { seedWorld } = await imp('core/rng.js');
<<<<<<< HEAD
const { createCharacter } = await imp('systems/crew/character.js');
const D = await imp('systems/company/dossier.js');
=======
const { createCharacter } = await imp('systems/character.js');
const D = await imp('systems/dossier.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
const F = await imp('data/factions.js');
const { SKILL_KEYS, LINEAGE_POWERS, CORP_POWERS, startingStanding } = await imp('data/origins.js');
const { REP } = await imp('core/config.js');

recalcStats();
seedWorld(20260814);
S.seed = 20260814;

// ── 1. the lore is data, not prose ───────────────────────────────────
console.log('\n— the powers —');
{
  ok('there are more than three organisations now', F.POWER_KEYS.length >= 8,
     String(F.POWER_KEYS.length));
  ok('every power belongs to a bloc the game already knows',
     F.POWER_KEYS.every(k => F.BLOC_KEYS.includes(F.POWERS[k].bloc)));
  ok('every bloc has at least one power',
     F.BLOC_KEYS.every(b => F.powersOf(b).length > 0),
     F.BLOC_KEYS.filter(b => !F.powersOf(b).length).join(','));

  for (const k of F.POWER_KEYS) {
    const p = F.POWERS[k];
    // A power that cannot refuse you work is a description string, not a faction.
    ok(`${k} is fully declared`,
       !!p.name && !!p.short && !!p.blurb && !!p.doctrine && !!p.charter &&
       Array.isArray(p.hires) && p.hires.length > 0 && !!p.temper,
       JSON.stringify({ n: !!p.name, b: !!p.blurb, h: (p.hires || []).length }));
  }
  ok('every power has a colour the UI can use',
     F.POWER_KEYS.every(k => typeof F.POWERS[k].color === 'number'));
  ok('tempers are sane',
     F.POWER_KEYS.every(k => {
       const t = F.POWERS[k].temper;
       return t.gain > 0 && t.loss > 0 && t.memory >= 0 && t.memory <= 1;
     }));
}

console.log('\n— the history —');
{
  ok('there is a timeline', F.HISTORY.length >= 8, String(F.HISTORY.length));
  ok('it is in order', F.HISTORY.every((e, i) => i === 0 || e.year >= F.HISTORY[i - 1].year));
  ok('every entry is dated and titled',
     F.HISTORY.every(e => typeof e.year === 'number' && !!e.title && !!e.text));
  ok('every named participant is a real power',
     F.HISTORY.every(e => (e.powers || []).every(p => !!F.POWERS[p])),
     F.HISTORY.flatMap(e => e.powers || []).filter(p => !F.POWERS[p]).join(','));
  ok('every shift names a real pair',
     F.HISTORY.every(e => Object.keys(e.shift || {}).every(pair =>
       pair.split(':').every(p => !!F.POWERS[p]))));
  ok('the current year is the last entry', F.NOW === F.HISTORY[F.HISTORY.length - 1].year);

  // The point of deriving rather than declaring: a documented war has to *be* a war.
  const wars = F.activeWars();
  ok('the timeline produces live hostilities', wars.length > 0, String(wars.length));
  ok('every war is mutual enough to name', wars.every(w => w.value <= -0.5));
  ok('wars carry a label', wars.every(w => !!w.label));

  // The Kessler Claim is the war the fiction is loudest about; it had better be one.
  ok('Kessler and the Directorate are hostile',
     F.relationOf('kessler', 'aurelian') <= -0.5,
     String(F.relationOf('kessler', 'aurelian')));
  ok('and Meridian regards Aurelian as a partner',
     F.relationOf('meridian', 'aurelian') > 0.2, String(F.relationOf('meridian', 'aurelian')));
  ok('a power is allied with itself', F.relationOf('meridian', 'meridian') === 1);
  ok('an unknown power is neutral rather than an exception',
     F.relationOf('nobody', 'meridian') === 0);
  ok('relations are bounded',
     F.POWER_KEYS.every(a => F.POWER_KEYS.every(b => {
       const v = F.relationOf(a, b);
       return v >= -1 && v <= 1;
     })));
  ok('every power has a history entry to show',
     F.POWER_KEYS.filter(k => F.historyOf(k).length > 0).length >= 8,
     String(F.POWER_KEYS.filter(k => F.historyOf(k).length > 0).length));
}

// ── 2. zero means zero ───────────────────────────────────────────────
console.log('\n— everybody starts at nothing —');
{
  ok('the bloc baseline is zero across the board',
     Object.values(REP.start).every(v => v === 0), JSON.stringify(REP.start));

  createCharacter({ name: 'Rook', lineage: 'core', corp: 'meridian', career: 'prospector' });
  const me = D.playerDossier();
  const head = startingStanding('core', 'meridian');

  ok('the player has a dossier', !!me && me.kind === 'player');
  ok('it knows the career', me.career === 'prospector');
  // Every power the birth and employer said nothing about is at exactly zero.
  const untouched = F.POWER_KEYS.filter(k => head[k] === undefined);
  ok('there are powers the creation bonus says nothing about', untouched.length > 0,
     String(untouched.length));
  ok('and standing with every one of them is exactly zero',
     untouched.every(k => D.standingWith(me, k) === 0),
     untouched.filter(k => D.standingWith(me, k) !== 0).join(','));
  ok('the powers it does name are the only ones moved',
     Object.keys(head).every(k => D.standingWith(me, k) === Math.max(-100, Math.min(100, head[k]))),
     Object.keys(head).map(k => `${k}:${D.standingWith(me, k)}/${head[k]}`).join(' '));
  ok('a Core-born Meridian hire is liked by Meridian', D.standingWith(me, 'meridian') > 0);
  ok('and has no opinion either way from Freewake', D.standingWith(me, 'freewake') === 0);

  // The head start is not an *action* — it must not have bled into rivals or been logged.
  ok('the head start did not bleed into rivals',
     D.standingWith(me, 'severance') === (head.severance || 0));
  ok('and is not in the history log', (me.history || []).length === 0);

  // A different birth is a different person.
  createCharacter({ name: 'Vale', lineage: 'rim', corp: 'long-dark', career: 'pathfinder' });
  const other = D.playerDossier();
  ok('a different origin produces different standing',
     JSON.stringify(other.standing) !== JSON.stringify(me.standing));
  ok('every lineage declares power-level bonuses',
     Object.keys(LINEAGE_POWERS).length >= 4);
  ok('every corporation does too', Object.keys(CORP_POWERS).length >= 4);
  ok('every bonus names a real power',
     [...Object.values(LINEAGE_POWERS), ...Object.values(CORP_POWERS)]
       .every(t => Object.keys(t).every(k => !!F.POWERS[k])));
}

// ── 3. individuals ───────────────────────────────────────────────────
console.log('\n— two of the same role are two different people —');
{
  const a = D.npcDossier('Kestrel 04', { role: 'merc', faction: 'independent' });
  const b = D.npcDossier('Kestrel 09', { role: 'merc', faction: 'independent' });
  ok('both have dossiers', !!a && !!b);
  ok('they are different people',
     JSON.stringify(a.proficiency) !== JSON.stringify(b.proficiency) ||
     JSON.stringify(a.standing) !== JSON.stringify(b.standing));
  ok('each has traits', a.traits.length >= 2 && b.traits.length >= 2);
  ok('each is competent at something', SKILL_KEYS.some(k => a.proficiency[k] > 0.2));
  ok('nobody is competent at everything',
     !SKILL_KEYS.every(k => a.proficiency[k] > 0.7));
  ok('proficiency is bounded 0..1',
     SKILL_KEYS.every(k => a.proficiency[k] >= 0 && a.proficiency[k] <= 1));
  ok('standing is bounded',
     F.POWER_KEYS.every(k => Math.abs(a.standing[k]) <= 100));

  // Deterministic and free until they matter.
  ok('a derived dossier is not stored', a.derived === true);
  const again = D.npcDossier('Kestrel 04', { role: 'merc', faction: 'independent' });
  ok('regenerating gives the same person', JSON.stringify(again) === JSON.stringify(a));
  D.adjustStanding(a, 'kestrel', 5, 'test');
  ok('doing something to them stores them', D.dossiers()['Kestrel 04'] === a);
  ok('and it is no longer derived', a.derived === false);

  // A hostile is somebody the Directorate wants and Kessler does not mind.
  const raider = D.npcDossier('Vex 11', { role: 'combat', faction: 'pirate' });
  ok('a hostile stands well with Kessler', raider.standing.kessler > 0,
     String(raider.standing.kessler));
  ok('and badly with the Directorate', raider.standing.aurelian < 0,
     String(raider.standing.aurelian));
}

// ── 4. the gate explains itself ──────────────────────────────────────
console.log('\n— qualification —');
{
  createCharacter({ name: 'Rook', lineage: 'core', corp: 'meridian', career: 'enforcer' });
  const me = D.playerDossier();

  ok('no requirement is always satisfied', D.qualifies(me, null).ok === true);
  ok('an empty requirement is satisfied', D.qualifies(me, {}).ok === true);

  const hard = { skills: { gunnery: 0.9 }, standing: { aurelian: 80 }, quals: ['writ'] };
  const gate = D.qualifies(me, hard);
  ok('an unreachable requirement is refused', gate.ok === false);
  ok('and it says why in words', typeof gate.why === 'string' && gate.why.length > 10, gate.why);
  ok('and lists everything missing, not just the first', gate.missing.length === 3,
     JSON.stringify(gate.missing.map(m => m.kind)));
  ok('a missing skill reports both need and have',
     gate.missing.some(m => m.kind === 'skill' && m.need > 0 && m.have >= 0));
  ok('a missing standing names the power in words',
     gate.missing.some(m => m.kind === 'standing' && !!m.name));

  // Awarding closes exactly one gap.
  D.award(me, 'writ');
  ok('a qualification can be awarded', me.quals.includes('writ'));
  ok('awarding twice does not duplicate',
     (D.award(me, 'writ'), me.quals.filter(q => q === 'writ').length === 1));
  ok('and the gate now reports one fewer gap', D.qualifies(me, hard).missing.length === 2);
}

// ── 5. the ladder ────────────────────────────────────────────────────
console.log('\n— the career ladder —');
{
  ok('every career has a ladder',
     ['enforcer', 'prospector', 'hauler', 'broker', 'pathfinder', 'executive']
       .every(c => !!D.ladderFor(c)));
  for (const c of Object.keys(D.LADDER)) {
    const L = D.LADDER[c];
    ok(`${c} has five rungs`, L.rungs.length === 5, String(L.rungs.length));
    ok(`${c}'s first rung is free`, Object.keys(L.rungs[0].needs || {}).length === 0);
    ok(`${c}'s rungs all grant something or are the floor`,
       L.rungs.every((r, i) => i === 0 || (r.grants || []).length > 0));
    // A ladder whose requirements do not rise is a list.
    //
    // Measured as the *peak* skill asked for, not the sum. The sum was the first thing I
    // wrote and it is wrong: a rung asking extraction 0.72 + engineering 0.45 sums higher
    // than the top rung asking extraction 0.88 alone, so a perfectly ordered ladder failed.
    // The top rung dropping its secondary skill is deliberate — mastery of the core skill
    // is the last gate — and the peak is what expresses that.
    const peak = L.rungs.map(r => Math.max(0, ...Object.values(r.needs.skills || {})));
    ok(`${c}'s requirements rise`, peak.every((v, i) => i === 0 || v >= peak[i - 1]),
       peak.map(v => v.toFixed(2)).join(','));
    // ...and the top rung has to actually be near mastery, or the ladder tops out early.
    ok(`${c} tops out near mastery`, peak[peak.length - 1] >= 0.85,
       String(peak[peak.length - 1]));
    ok(`${c}'s standing gates name real powers`,
       L.rungs.every(r => Object.keys(r.needs.standing || {}).every(p => !!F.POWERS[p])));
  }

  // Nobody starts more than one rung up.
  //
  // They did. The first cut of the ladder asked 20% of a primary skill for rung 1, and
  // career plus lineage hand out 10–60% — so a Core-born broker began at **rung 2 of 5**,
  // handed 40% of their own progression before doing anything. That is the old "+10
  // Coalition at creation" fault wearing different clothes, and it is exactly what this
  // patch is about. Asserted across every career and lineage rather than on one sample.
  {
    const { LINEAGE_KEYS, LINEAGES } = await imp('data/origins.js');
    const worst = [];
    for (const career of Object.keys(D.LADDER)) {
      for (const lin of LINEAGE_KEYS) {
        createCharacter({ name: 'X', lineage: lin, corp: LINEAGES[lin].corps[0], career });
        const d = D.playerDossier();
        D.refreshRung(d);
        if (d.rung > 1) worst.push(`${career}/${lin}:${d.rung}`);
      }
    }
    ok('no birth starts a character above the first rung', worst.length === 0,
       worst.slice(0, 4).join(' '));
  }

  // ...and the bottom rung is a real place somebody can be, not a formality every start
  // skips. A Nexis-born gun begins at rung 1 because that lineage *is* already armed —
  // which is the right answer. A Core-born one does not.
  createCharacter({ name: 'Rook', lineage: 'core', corp: 'meridian', career: 'enforcer' });
  const me = D.playerDossier();
  D.refreshRung(me);
  ok('an ordinary birth starts at the bottom', me.rung === 0, String(me.rung));

  const next = D.nextRung(me);
  ok('there is a next rung to describe', !!next);
  ok('it names itself', !!next.title && !!next.key);
  ok('it says what it grants', (next.grants || []).length > 0);
  ok('and exactly what is missing', next.missing.length > 0 && !!next.why, next.why);

  // Climb it for real, through the same numbers a player would move.
  S.character.spent = S.character.spent || {};
  S.character.spent.gunnery = 4;
  me.proficiency = D.playerDossier().proficiency;
  ok('proficiency followed the skill sheet', me.proficiency.gunnery >= 0.35,
     String(me.proficiency.gunnery));
  ok('the rung advances', D.refreshRung(D.playerDossier()) >= 1,
     String(D.playerDossier().rung));
  ok('and the grant is now held', D.grantsOf(D.playerDossier()).includes('bounty-low'),
     D.grantsOf(D.playerDossier()).join(','));

  // Standing gates bite: rung 2 for an enforcer needs the Directorate.
  const me2 = D.playerDossier();
  S.character.spent.gunnery = 6;
  me2.proficiency = D.playerDossier().proficiency;
  me2.standing.aurelian = 0;
  ok('a skill alone does not buy a standing rung', D.highestRung(me2) === 1,
     String(D.highestRung(me2)));
  me2.standing.aurelian = 40;
  ok('and standing unlocks it', D.highestRung(me2) >= 2, String(D.highestRung(me2)));
}

// ── 6. the corp war is mechanical ────────────────────────────────────
console.log('\n— working for one costs you with the other —');
{
  createCharacter({ name: 'Rook', lineage: 'core', corp: 'meridian', career: 'broker' });
  const me = D.playerDossier();
  for (const k of F.POWER_KEYS) me.standing[k] = 0;

  const before = Object.assign({}, me.standing);
  D.adjustStanding(me, 'aurelian', 30, 'ran a Directorate escort');

  ok('the power you worked for likes you more', me.standing.aurelian > before.aurelian);
  ok('its enemy likes you less', me.standing.kessler < before.kessler,
     `${before.kessler} → ${me.standing.kessler}`);
  ok('its partner warms slightly', me.standing.meridian > before.meridian,
     `${before.meridian} → ${me.standing.meridian}`);
  ok('an indifferent party does not move',
     Math.abs(me.standing.drossgate - before.drossgate) < 6,
     `${before.drossgate} → ${me.standing.drossgate}`);
  ok('the action is in the history log', (me.history || []).length === 1);
  ok('and the log says who and why',
     me.history[0].power === 'aurelian' && /escort/.test(me.history[0].reason));

  // Temper matters: Severance forgives slowly and punishes hard.
  const t = F.POWERS.severance.temper;
  ok('a grudge-holding power punishes harder than it rewards', t.loss > t.gain);

  // Bounded, whatever you do.
  for (let i = 0; i < 40; i++) D.adjustStanding(me, 'aurelian', 30, 'grind');
  ok('standing cannot exceed the ceiling', me.standing.aurelian <= 100);
  ok('nor fall below the floor',
     F.POWER_KEYS.every(k => me.standing[k] >= -100),
     F.POWER_KEYS.filter(k => me.standing[k] < -100).join(','));
  ok('the history log is bounded', me.history.length <= 24, String(me.history.length));
}

// ── 7. the report, and persistence ───────────────────────────────────
console.log('\n— what the screen gets —');
{
  createCharacter({ name: 'Rook', lineage: 'belter', corp: 'freewake', career: 'hauler' });
  const me = D.playerDossier();
  const r = D.dossierReport(me);
  ok('a report is produced', !!r);
  ok('it names the career and the rung', !!r.careerName && !!r.rungTitle);
  ok('it lists every rung with a reached flag',
     r.rungs.length === 5 && r.rungs.filter(x => x.reached).length >= 1);
  ok('it carries standing with every power', r.standing.length === F.POWER_KEYS.length);
  ok('every standing row has a colour and a bloc',
     r.standing.every(x => typeof x.color === 'number' && !!x.bloc));
  ok('traits are resolved to names, not keys',
     r.traits.every(t => !!t.name));
  ok('a null dossier reports nothing rather than throwing', D.dossierReport(null) === null);

  ok('bloc standing averages its powers',
     Math.abs(D.blocStanding(me, 'independent') -
       F.powersOf('independent').reduce((a, p) => a + D.standingWith(me, p), 0) /
       F.powersOf('independent').length) < 1e-9);

  // Persistence: stored records survive, derived ones rebuild.
  D.npcDossier('Ghost 01', { role: 'haul' });         // derived, never touched
  D.adjustStanding(D.npcDossier('Real 01', { role: 'haul' }), 'freewake', 12, 'a delivery');
  const wire = JSON.parse(JSON.stringify(D.serializeDossiers()));
  ok('a touched NPC is persisted', !!wire['Real 01']);
  ok('an untouched one is not', !wire['Ghost 01']);
  ok('the player is persisted', !!wire.__player);

  D.restoreDossiers(wire);
  ok('restore brings back the touched record', !!D.dossiers()['Real 01']);
  ok('with standing intact', D.dossiers()['Real 01'].standing.freewake > 0);
  ok('and a rebuilt record is complete',
     F.POWER_KEYS.every(k => typeof D.dossiers()['Real 01'].standing[k] === 'number'));
  ok('restoring junk is safe',
     (D.restoreDossiers(null), Object.keys(D.dossiers()).length === 0));
}

<<<<<<< HEAD
// ── 8. the door ──────────────────────────────────────────────────────
//
// v1.02.36 shipped every section above green and nothing in the game read a word of it.
// By this project's own rule that is a system which does not exist, so the screen gets
// the same treatment the numbers got: not "is it declared", but "does it render, and can
// a player reach it from where they actually are".
console.log('\n— the screen, and the way in —');
{
  const fs = await import('node:fs');
  const html = fs.readFileSync(new URL('index.html', ROOT).pathname, 'utf8');
  const src = p => fs.readFileSync(new URL('src/' + p, ROOT).pathname, 'utf8');

  createCharacter({ name: 'Rook', lineage: 'core', corp: 'meridian', career: 'enforcer' });

  const UI = await imp('ui/dossier.js');
  UI.initDossier();
  ok('the file opens', (UI.openDossier(), UI.dossierOpen() === true));

  // The stub strips tags out of innerHTML and keeps the text, so these assert what a
  // player would read rather than that a function was called.
  const txt = id => (document.getElementById(id) || {}).textContent || '';
  const raw = id => (document.getElementById(id) || {}).innerHTML || '';
  ok('it is the right person', txt('dossier-name') === 'Rook');
  ok('it says where they are on the track', /rung 1 of 5/.test(txt('dossier-role')),
     txt('dossier-role'));
  ok('the hexagon has a point for every skill',
     (raw('dossier-radar').match(/<circle/g) || []).length === SKILL_KEYS.length);
  ok('every skill has a bar', (raw('dossier-skills').match(/class="drow"/g) || []).length === SKILL_KEYS.length);
  ok('every power has a standing row',
     (raw('dossier-standing').match(/class="dpow"/g) || []).length === F.POWER_KEYS.length);
  ok('a fresh character is mostly unknown rather than mostly hated',
     /\/ 9 KNOWN/.test(txt('dossier-standsum')), txt('dossier-standsum'));
  ok('all five rungs are drawn', (raw('dossier-ladder').match(/class="drung/g) || []).length === 5);
  // The gate has to state its price on the screen, not only in `qualifies()`.
  ok('the next rung breaks out what it wants',
     (raw('dossier-ladder').match(/class="dneed"/g) || []).length > 0);
  ok('and says so in a sentence too', txt('dossier-next').length > 10, txt('dossier-next'));
  ok('the wars are on screen', /ACTIVE/.test(txt('dossier-warcount')));
  ok('so is the timeline',
     (raw('dossier-history').match(/class="dev"/g) || []).length === F.HISTORY.length);

  // One power's file, which is the whole reason standing rows are tappable.
  UI.openPower('meridian');
  ok('a power file opens onto the right power', txt('power-name') === F.POWERS.meridian.name);
  ok('it carries the doctrine', txt('power-doctrine').length > 10);
  ok('it regards the other eight',
     (raw('power-rels').match(/class="drel"/g) || []).length === F.POWER_KEYS.length - 1);
  ok('and it says what they think of you', /Meridian/.test(txt('power-standing')),
     txt('power-standing'));

  ok('the file closes', (UI.closeDossier(), UI.dossierOpen() === false));

  // An NPC goes through the identical component — the claim of v1.02.36 is that the
  // player is one record among many, and a screen that special-cases them denies it.
  UI.openDossier(D.npcDossier('Kestrel 04', { role: 'merc', faction: 'independent' }));
  ok('an NPC renders in the same screen', txt('dossier-name') === 'Kestrel 04');
  ok('and reads as a contact, not as you', /Contact/.test(txt('dossier-role')));
  UI.closeDossier();

  // Reachability. Three surfaces, because a career that cannot fly still has a standing
  // to climb and a pilot mid-flight should not have to dock to see the gate.
  ok('the flight HUD has a way in', /id="btn-file"/.test(html));
  ok('bound to the dossier', /btn-file[\s\S]{0,120}openDossier/.test(src('ui/controls.js')));
  ok('the office deck has one', /id="exec-dossier"/.test(html));
  ok('bound too', /exec-dossier[\s\S]{0,200}openDossier/.test(src('ui/execdeck.js')));
  ok('a locked ship has one', /id="target-file"/.test(html));
  ok('bound to the locked contact', /target-file[\s\S]{0,200}openLockedDossier/.test(src('ui/hud.js')));
  ok('and it is hidden for things that are not people',
     /setFlag\('target-file', 'hidden', t\.kind !== 'ship'\)/.test(src('ui/hud.js')));
  ok('the stylesheet is loaded', /css\/dossier\.css/.test(html));
  ok('the player screen is kept live by the frame loop',
     /tickDossier\(dt\)/.test(src('main.js')) && /initDossier\(\)/.test(src('main.js')));
}

=======
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
