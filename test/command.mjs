// The executive command surface: the menu tree, the shared resolver, and the knowledge
// base the dispatches write into.
//
// The whole point of v1.01.73 is that a button click and a spoken request cannot diverge —
// both go through `executeResolved`. That claim is only worth anything if something checks
// it, so the middle third of this suite dispatches the same order down both paths and
// compares the shapes. The rest guards the two things a hand-authored tree gets wrong:
// a leaf whose hull role the order type will refuse, and an utterance pattern that points
// at a node id nobody kept in step with the menu.

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
const { createSystem } = await imp('world/system.js');
const { initMarket } = await imp('systems/market.js');
const M = await imp('data/command-menu.js');
const C = await imp('systems/command.js');
const { FLEET_ORDER_TYPES, fleetOrderReport, updateFleetOrders } = await imp('systems/orders.js');
const { foundCompany, hasCompany } = await imp('systems/company.js');
const KB = await imp('data/npc-kb/index.js');

initScene();
recalcStats();
seedWorld(20260809);
createSystem();
initMarket();

const clearFleet = () => { S.fleetOrders = []; };
// The diagnostic log lives on globalThis, not in S — see the note in the bounded section.
const clearDiagnostics = () => { globalThis.__LG_DIAG__ = { events: [], bySubject: {} }; };
const reset = () => { clearFleet(); clearDiagnostics(); S.time = 1000; };

// ── the tree itself ──────────────────────────────────────────────────
console.log('\n— the menu is a tree of real orders —');
{
  const leaves = M.allLeaves();
  ok('the menu has branches', M.COMMAND_MENU.length > 0);
  ok('branch labels enumerate', M.branchLabels().length === M.COMMAND_MENU.length);
  ok('there are leaves to dispatch', leaves.length > 0);

  ok('every leaf carries an order', leaves.every(n => n.order && n.order.type));
  ok('every leaf id is unique',
     new Set(leaves.map(n => n.id)).size === leaves.length);
  ok('every leaf is findable by id', leaves.every(n => M.findNode(n.id) === n));

  const unknown = leaves.filter(n => !FLEET_ORDER_TYPES[n.order.type]);
  ok('every leaf names an order type orders.js implements', unknown.length === 0,
     unknown.map(n => `${n.id}→${n.order.type}`).join(', '));

  // The failure this catches: a leaf that reads well in the menu and is refused the
  // moment anyone presses it, because the order type wants a hull role the leaf omits.
  const mismatched = leaves.filter(n => {
    const spec = FLEET_ORDER_TYPES[n.order.type];
    if (!spec || !spec.requires) return false;
    const role = n.assetRole || 'combat';
    return !spec.requires.includes(role);
  });
  ok('no leaf asks for a hull its order type would refuse', mismatched.length === 0,
     mismatched.map(n => `${n.id}: ${n.assetRole || 'combat'}`).join(', '));

  const badMode = leaves.filter(n => n.order.mode && !['active', 'passive'].includes(n.order.mode));
  ok('every declared mode is active or passive', badMode.length === 0);

  const badDur = leaves.filter(n => n.order.durationSec != null &&
                                    !(n.order.durationSec >= 0 && Number.isFinite(n.order.durationSec)));
  ok('every declared duration is a finite non-negative number', badDur.length === 0);
}

// ── path resolution ──────────────────────────────────────────────────
console.log('\n— walking a path —');
{
  const branch = M.COMMAND_MENU[0];
  const sub = branch.children[0];
  const leaf = sub.children[0];

  ok('an empty path resolves to nothing', M.resolveMenuPath([]).ok === false);
  ok('a nonsense node is named in the error',
     /Unknown menu node/.test(M.resolveMenuPath(['no-such-branch']).error || ''));
  ok('stopping on a branch is not an order',
     M.resolveMenuPath([branch.id]).ok === false);
  ok('stopping on a submenu is not an order',
     M.resolveMenuPath([branch.id, sub.id]).ok === false);

  const r = M.resolveMenuPath([branch.id, sub.id, leaf.id]);
  ok('a full path resolves', r.ok === true);
  ok('it carries the leaf node', r.node === leaf);
  ok('it carries an asset with an id', !!(r.asset && r.asset.id));
  ok('the order is a copy, not the menu record', r.order !== leaf.order);

  r.order.type = 'tampered';
  ok('mutating a resolved order does not edit the menu',
     M.findNode(leaf.id).order.type !== 'tampered');
}

// ── utterances ───────────────────────────────────────────────────────
console.log('\n— plain language lands on the same tree —');
{
  ok('an empty utterance resolves to nothing', M.intentFromUtterance('').ok === false);
  ok('an unrelated utterance is refused',
     M.intentFromUtterance('make me a sandwich').ok === false);

  const cases = [
    ['patrol the sector', 'patrol'],
    ['sweep the corridor for 90 seconds', 'patrol'],
    ['escort the convoy', 'escort'],
    ['send a cutter to extract ore', 'extract'],
    ['haul that freight to the depot', 'logistics'],
    ['run a survey pass', 'survey_pass'],
    ['hold position on picket', 'station_keep']
  ];
  for (const [text, expect] of cases) {
    const r = M.intentFromUtterance(text);
    const got = r.ok ? r.order.type : `refused(${r.error})`;
    ok(`"${text}" → ${expect}`, r.ok && r.order.type === expect, `got ${got}`);
  }

  ok('"patrol until recalled" is passive',
     M.intentFromUtterance('patrol until recalled').order.mode === 'passive');
  ok('a bare patrol is active',
     M.intentFromUtterance('patrol the sector').order.mode !== 'passive');

  // The pattern table points at node ids by hand. A renamed node would break dispatch
  // silently and only for the spoken path, which is the harder one to notice.
  const utterances = cases.map(c => c[0]).concat([
    'patrol until recalled', 'escort for 3 min', 'extract a single load',
    'deliver personnel', 'deep survey', 'watch the trade lane'
  ]);
  const dangling = utterances.filter(u => {
    const r = M.intentFromUtterance(u);
    return r.ok && !M.findNode(r.node.id);
  });
  ok('no utterance resolves to a node the menu no longer holds', dangling.length === 0,
     dangling.join(', '));
}

// ── the company gate ─────────────────────────────────────────────────
console.log('\n— command is an executive surface —');
{
  reset();
  S.company = null;
  const leaf = M.allLeaves()[0];
  ok('there is no company to start', !hasCompany());

  const byId = C.commandById(leaf.id);
  ok('dispatch by id is refused without a charter', byId.ok === false);
  ok('and says why', byId.error === 'no-company');
  const byText = C.commandFromText('patrol the sector');
  ok('dispatch by voice is refused the same way', byText.error === 'no-company');
  ok('nothing was dispatched', fleetOrderReport().length === 0);

  foundCompany({ name: 'Test Pilot' }, { charter: 'military', name: 'Testworks' });
  ok('incorporating opens the surface', hasCompany());
}

// ── dispatch, both ways ──────────────────────────────────────────────
console.log('\n— a click and an utterance emit the same order —');
{
  reset();
  const viaText = C.commandFromText('patrol the sector');
  ok('the utterance dispatched', viaText.ok === true, viaText.text);
  ok('it returned an order record', !!(viaText.order && viaText.order.id));
  ok('the objective is running', fleetOrderReport().length === 1);
  const a = viaText.order;

  reset();
  const viaMenu = C.commandById(a.type === 'patrol' ? M.intentFromUtterance('patrol the sector').node.id : '');
  ok('the same leaf dispatched by id', viaMenu.ok === true, viaMenu.text);
  const b = viaMenu.order;

  ok('both produced the same order type', a.type === b.type);
  ok('both produced the same branch', a.branch === b.branch);
  ok('both produced the same mode', a.mode === b.mode);
  ok('both produced the same duration', a.durationSec === b.durationSec);
  ok('both produced the same asset role', a.assetRole === b.assetRole);
  ok('both name the same asset', a.assetName === b.assetName);

  // Ids are the one field that must differ — two dispatches are two objectives.
  ok('the two dispatches are distinct records', a.id !== b.id);
}

// ── overrides ────────────────────────────────────────────────────────
console.log('\n— the caller can bind a real asset —');
{
  reset();
  const leaf = M.intentFromUtterance('patrol the sector').node;
  const r = C.commandById(leaf.id, {
    assetId: 'npc-77', assetName: 'Kestrel', assetRole: 'combat',
    mode: 'passive', durationSec: 45, target: 'Belt Ridge'
  });
  ok('the override dispatched', r.ok === true, r.text);
  ok('the bound asset id is used', r.order.assetId === 'npc-77');
  ok('the bound name is used', r.order.assetName === 'Kestrel');
  ok('the mode override took', r.order.mode === 'passive');
  ok('the duration override took', r.order.durationSec === 45);
  ok('the target override took', r.order.target === 'Belt Ridge');
  ok('the reply names the target', /Belt Ridge/.test(r.text));
  ok('the reply flags passive', /passive/i.test(r.text));

  const bad = C.commandById('no-such-leaf');
  ok('an unknown leaf is refused', bad.ok === false && bad.error === 'unknown-leaf');
}

// ── recall ───────────────────────────────────────────────────────────
console.log('\n— recall —');
{
  reset();
  ok('recalling nothing is refused', C.commandRecall('all').error === 'empty');

  C.commandById(M.intentFromUtterance('patrol the sector').node.id,
                { assetId: 'a1', assetName: 'Kestrel' });
  C.commandById(M.intentFromUtterance('escort the convoy').node.id,
                { assetId: 'a2', assetName: 'Harrier' });
  ok('two objectives are running', fleetOrderReport().length === 2);

  ok('a name that matches nothing is refused',
     C.commandRecall('Nightingale').error === 'not-found');
  ok('and nothing was recalled', fleetOrderReport().length === 2);

  const byName = C.commandRecall('kestrel');
  ok('recall by asset name works', byName.ok === true);
  ok('it names the ship', /Kestrel/.test(byName.text));
  ok('one objective is left', fleetOrderReport().length === 1);

  const last = C.commandRecall('last');
  ok('"last" recalls the remaining one', last.ok === true);
  ok('the board is clear', fleetOrderReport().length === 0);
}

// ── the catalogue ────────────────────────────────────────────────────
console.log('\n— the catalogue ARIA and Ops read —');
{
  reset();
  const cat = C.commandCatalogue();
  ok('it lists branches', cat.branches.length === M.COMMAND_MENU.length);
  ok('it lists every leaf', cat.leaves.length === M.allLeaves().length);
  ok('every catalogue entry has an id and a label',
     cat.leaves.every(l => l.id && l.label));
  ok('every catalogue entry names an implemented order type',
     cat.leaves.every(l => !!FLEET_ORDER_TYPES[l.type]));
  ok('an empty board reports no active objectives', cat.active.length === 0);

  C.commandFromText('patrol the sector');
  ok('a dispatch shows up in the catalogue', C.commandCatalogue().active.length === 1);
}

// ── the knowledge base ───────────────────────────────────────────────
console.log('\n— dispatches are filed in the knowledge base —');
{
  reset();
  ok('the log starts empty', KB.recentDiagnostics(10).length === 0);

  C.commandById(M.intentFromUtterance('patrol the sector').node.id,
                { assetId: 'npc-77', assetName: 'Kestrel' });

  const filed = KB.diagnosticsFor('npc-77');
  ok('the dispatch was filed against the asset', filed.length === 1);
  ok('it is filed as an order', filed[0].kind === 'order');
  ok('the summary names the ship', /Kestrel/.test(filed[0].summary));
  ok('it carries the order id', !!filed[0].context.orderId);
  ok('it is tagged for the fleet', filed[0].tags.includes('fleet'));
  ok('salience is inside its bounds', filed[0].salience > 0 && filed[0].salience <= 1);
  ok('it validates against the schema', KB.validateDiagnostic(filed[0]).ok !== false);

  ok('a refused dispatch files nothing',
     (C.commandById('no-such-leaf'), KB.diagnosticsFor('npc-77').length === 1));
}

// ── role profiles ────────────────────────────────────────────────────
console.log('\n— role profiles —');
{
  const roles = KB.listRoles();
  ok('there are roles on file', roles.length > 0);
  const built = roles.map(r => KB.buildProfile({ role: r, name: 'Subject ' + r }));
  ok('every role builds a profile', built.every(Boolean));
  ok('every role keeps its own template', built.every((p, i) => p.role === roles[i]));
  ok('every built profile validates',
     built.every(p => KB.validateProfile(p).ok !== false));
  ok('every required field is present',
     built.every(p => KB.PROFILE_REQUIRED.every(f => p[f] !== undefined)));
  ok('every profile carries the six numeric traits',
     built.every(p => ['aggression', 'sociability', 'greed', 'loyalty', 'verbosity', 'formality']
       .every(k => typeof p.traits[k] === 'number')));

  // An unknown role falls back rather than returning nothing — a character with a role
  // nobody wrote a template for still has to be able to speak.
  const stranger = KB.buildProfile({ role: 'sandwich-artist', name: 'Nobody' });
  ok('an unknown role still yields a usable profile', !!stranger);
  ok('and it validates', KB.validateProfile(stranger).ok !== false);
  ok('and it keeps the name it was given', stranger.name === 'Nobody');

  ok('the training corpus is seeded', KB.TRAINING_SEED.length > 0);
  ok('every training purpose is one the schema knows',
     KB.TRAINING_SEED.every(e => KB.TRAINING_PURPOSES.includes(e.purpose)));
  ok('the corpus can be filtered by purpose',
     KB.examplesByPurpose(KB.TRAINING_SEED[0].purpose).length > 0);
}

// ── the board stays bounded ──────────────────────────────────────────
console.log('\n— it stays bounded under load —');
{
  reset();
  const leaf = M.intentFromUtterance('patrol the sector').node.id;
  for (let i = 0; i < 40; i++) C.commandById(leaf, { assetId: 'a' + i, assetName: 'Ship ' + i });
  const running = fleetOrderReport().length;
  ok('the fleet board is capped', running <= 6, `${running} running`);

  const over = C.commandById(leaf, { assetId: 'spill', assetName: 'Spill' });
  ok('dispatching past the cap is refused, not thrown', over.ok === false);
  ok('and the refusal explains itself', typeof over.text === 'string' && over.text.length > 0);

  for (let i = 0; i < 400; i++) {
    C.commandById(leaf, { assetId: 'flood', assetName: 'Flood' });
    KB.recordDiagnostic({ subjectId: 'flood', t: i, kind: 'order', situation: 'x', summary: 'y', salience: 0.1 });
  }
  ok('the diagnostic log is capped', KB.diagnosticsFor('flood').length < 400);

  updateFleetOrders(1000);
  ok('objectives with a timer run out rather than pile up', fleetOrderReport().length <= 6);
  ok('nothing left is negative on the clock',
     fleetOrderReport().every(f => f.remaining >= 0));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
