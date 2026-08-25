// Slice 8 — ARIA's tools. Named actions against live game state, matched without a model.
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
const { initScene } = await imp('world/scene.js');
const { createSystem, updateSystem } = await imp('world/system.js');
const { createAsteroids } = await imp('world/asteroids.js');
const { initPlayerFx } = await imp('entities/player.js');
const { createNpcs } = await imp('entities/npcs.js');
<<<<<<< HEAD
const { initProjectiles } = await imp('systems/combat/projectiles.js');
const { initCombat } = await imp('systems/combat/combat.js');
const { initMining } = await imp('systems/industry/mining.js');
const { initWorldSim } = await imp('systems/platform/worldsim.js');
const { initMarket } = await imp('systems/trade/market.js');
const { initContracts } = await imp('systems/trade/contracts.js');
const { resetReputation } = await imp('systems/company/reputation.js');
const { createCharacter } = await imp('systems/crew/character.js');
const tools = await imp('systems/platform/tools.js');
const { ask } = await imp('systems/npc/assistant.js');
=======
const { initProjectiles } = await imp('systems/projectiles.js');
const { initCombat } = await imp('systems/combat.js');
const { initMining } = await imp('systems/mining.js');
const { initWorldSim } = await imp('systems/worldsim.js');
const { initMarket } = await imp('systems/market.js');
const { initContracts } = await imp('systems/contracts.js');
const { resetReputation } = await imp('systems/reputation.js');
const { createCharacter } = await imp('systems/character.js');
const tools = await imp('systems/tools.js');
const { ask } = await imp('systems/assistant.js');
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44

initScene(); recalcStats(); seedWorld(1337); createSystem(); createAsteroids();
initProjectiles(); initCombat(); initMining(); initPlayerFx(); createNpcs();
resetReputation(); initWorldSim(); initMarket(); initContracts();
<<<<<<< HEAD
createCharacter({ name: 'Tool', lineage: 'rim', corp: 'kestrel', career: 'pathfinder' });
=======
createCharacter({ name: 'Tool', lineage: 'rim', corp: 'long-dark', career: 'pathfinder' });
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
updateSystem(1);
S.running = true;

// ── manifest ─────────────────────────────────────────────────────────
console.log('\n— the instrument list —');
ok('tools are defined', tools.TOOL_KEYS.length >= 8, String(tools.TOOL_KEYS.length));
ok('every tool describes itself and its arguments',
   tools.TOOL_KEYS.every(k => tools.TOOLS[k].desc && Array.isArray(tools.TOOLS[k].args)));
ok('every tool is runnable', tools.TOOL_KEYS.every(k => typeof tools.TOOLS[k].run === 'function'));
ok('the manifest matches the tools', tools.toolManifest().length === tools.TOOL_KEYS.length);

// The safety property that shapes the whole list: a small model will occasionally misread
// a request, and the cost of that must never be more than a course you did not want.
ok('no tool spends money, sells cargo or fires',
   !tools.TOOL_KEYS.some(k => /buy|sell(?!Here)|fire|accept|hire|scrap|wipe/i.test(k)),
   tools.TOOL_KEYS.join(','));
{
  const credits = S.credits, ore = S.cargo.ore, hull = S.player.hull;
  for (const k of tools.TOOL_KEYS) tools.callTool(k, ['ore']);
  ok('running every tool changes no resource',
     S.credits === credits && S.cargo.ore === ore && S.player.hull === hull);
}

// ── individual tools ─────────────────────────────────────────────────
console.log('\n— instruments —');
{
  const r = tools.callTool('status');
  ok('status answers', r.ok && r.text.length > 20);
  ok('status reports the credits it can see', r.data.credits === S.credits);
}
{
  const planet = S.world.bodies.find(b => b.userData.kind === 'planet');
  const r = tools.callTool('plotCourse', [planet.userData.name]);
  ok('a course can be plotted by name', r.ok && S.warp.dest &&
     S.warp.dest.obj === planet, r.text);
  ok('the course reports its length', r.data.distance > 0);
  ok('a partial name still finds the body',
     tools.callTool('plotCourse', [planet.userData.name.slice(0, 4)]).ok);
  const miss = tools.callTool('plotCourse', ['Narnia']);
  ok('an unknown destination is refused, not guessed', miss.ok === false);
  ok('the refusal says what went wrong', /Narnia/.test(miss.text));
}
{
  const r = tools.callTool('bestPrice', ['ore']);
  ok('the best market is named', r.ok && r.data.station && r.data.price > 0, r.text);
  ok('a commodity that does not exist is refused',
     tools.callTool('bestPrice', ['unobtainium']).ok === false);
  ok('salvage and data are priced too',
     tools.callTool('bestPrice', ['salvage']).ok && tools.callTool('bestPrice', ['data']).ok);
}
{
  S.cargo.ore = 400;
  const r = tools.callTool('sellHere');
  ok('the local book is readable', r.text.length > 10, r.text);
  S.cargo.ore = 0; S.cargo.salvage = 0; S.cargo.data = 0;
  ok('an empty hold says so', /empty/i.test(tools.callTool('sellHere').text));
}
{
  // A previous test in this file plots a course, which leaves an approach live — clear it
  // so the assertion below is about findBelt rather than about what ran before it.
  S.approach = null;
  const r = tools.callTool('findBelt', [false]);
  ok('a field is found', r.ok && r.data.distance >= 0, r.text);
  ok('finding targets it', !!S.target);
  ok('it does not fly there unless asked', !S.approach);
}
{
  const r = tools.callTool('threats');
  ok('threats answers either way', r.ok && typeof r.data.count === 'number');
  ok('it reports how visible you are', r.data.signature > 0 && /running/.test(r.text), r.text);
}
{
  ok('contracts answers with none accepted', tools.callTool('contracts').ok);
  ok('standing lists every bloc', tools.callTool('standing').data.length === 3);
  const p = tools.callTool('pilot');
  ok('the pilot record reads back', p.ok && /Tool/.test(p.text), p.text);
  ok('link reports solo when there is no relay', /solo/i.test(tools.callTool('link').text));
  ok('performance answers', tools.callTool('performance').ok);
}

// ── failure handling ─────────────────────────────────────────────────
console.log('\n— failure —');
ok('an unknown tool is refused', tools.callTool('teleport').ok === false);
ok('the refusal names it', /teleport/.test(tools.callTool('teleport').text));
ok('a throwing tool does not take the panel down', (() => {
  const saved = tools.TOOLS.status.run;
  tools.TOOLS.status.run = () => { throw new Error('instrument fault'); };
  const r = tools.callTool('status');
  tools.TOOLS.status.run = saved;
  return r.ok === false && r.text.length > 0 && r.error === 'instrument fault';
})());
ok('missing arguments do not throw', tools.callTool('plotCourse', []).ok === false);
ok('a null argument does not throw', tools.callTool('bestPrice', [null]).ok === true);

// ── matching without a model ─────────────────────────────────────────
console.log('\n— phrasing —');
{
  const m = q => (tools.matchTool(q) || {}).tool;
  const planet = S.world.bodies.find(b => b.userData.kind === 'planet').userData.name;

  ok('a course request matches', m(`set course to ${planet}`) === 'plotCourse');
  ok('"take me to" matches', m(`take me to ${planet}`) === 'plotCourse');
  ok('the destination is extracted',
     tools.matchTool(`plot a course to ${planet}`).args[0].toLowerCase() === planet.toLowerCase(),
     JSON.stringify(tools.matchTool(`plot a course to ${planet}`)));
  ok('trailing punctuation is stripped',
     tools.matchTool(`fly to ${planet}?`).args[0].toLowerCase() === planet.toLowerCase());

  ok('a price question matches', m('where can I sell ore') === 'bestPrice');
  ok('the commodity is extracted', tools.matchTool('who pays best for salvage').args[0] === 'salvage');
  ok('selling here matches', m('what does this station pay') === 'sellHere');

  ok('a mining question matches', m('where is the nearest belt') === 'findBelt');
  ok('asking to be taken there sets the flag',
     tools.matchTool('take me to the belt to mine').args[0] === true);

  ok('a threat question matches', m('any pirates out there?') === 'threats');
  ok('a contract question matches', m('what jobs do I have') === 'contracts');
  ok('a standing question matches', m('what is my reputation') === 'standing');
  ok('a skill question matches', m('what are my skills') === 'pilot');
  ok('a link question matches', m('what is my ping') === 'link');
  ok('a status question matches', m('status report') === 'status');

  ok('an unrelated question matches nothing', tools.matchTool('what is a gas giant') === null);
  ok('an empty question matches nothing', tools.matchTool('') === null);
  ok('undefined does not throw', tools.matchTool(undefined) === null);
}

// ── through the assistant ────────────────────────────────────────────
console.log('\n— through ARIA —');
{
  const planet = S.world.bodies.find(b => b.userData.kind === 'planet').userData.name;
  S.warp.dest = null;
  const answer = await ask(`set course to ${planet}`);
  ok('asking ARIA actually sets the course', !!S.warp.dest, answer);
  ok('and the answer describes what it did', /course/i.test(answer), answer);

  const priced = await ask('where should I sell ore');
  ok('a price question is answered by the instrument', /pays/i.test(priced), priced);

  const chat = await ask('tell me about the Coalition');
  ok('a conversational question still falls through to the fallback',
     typeof chat === 'string' && chat.length > 0, chat);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
