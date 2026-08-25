// Contracting as a company.
//
// The find that produced this patch, stated first because it is the whole point: **an
// executive could not reach the contract board at all.** v1.02.39 gave every station a named
// desk, three tiers of work and a gate the career ladder opens, shipped it with 58 green
// checks, and every one of those checks was run against a character who could fly. The board
// lives in the dock overlay; docking requires flying; the career is defined by not flying.
// Five careers had a progression loop and the sixth — the one ten patches were spent on —
// had a screen showing it a ladder it could not touch.
//
// That is the v1.02.31 fault exactly: a surface built for a pilot, handed to somebody who is
// not one, and technically present.
//
// What this suite pins:
//
//   1. **The way in exists**, from the surface the career actually uses.
//   2. **The whole system on one screen**, grouped by power and ordered by standing — the
//      decision .39 created and the dock UI structurally cannot express.
//   3. **Accepting assigns a hull**, and the two acts share a fate. Neither half happens
//      alone: a contract with nobody flying it is a deadline that will be missed, and .39's
//      own rule is that abandoning costs.
//   4. **A job no hull can fly is refused before it is accepted**, in words.
//   5. **What the hull delivers is what the contract is credited for**, settling down the
//      same path a flown contract does — standing, corp war, career rung and all.

import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);
const fs = await import('node:fs');
const src = p => fs.readFileSync(new URL('src/' + p, ROOT).pathname, 'utf8');
const html = fs.readFileSync(new URL('index.html', ROOT).pathname, 'utf8');

const { S, recalcStats } = await imp('core/state.js');
const { seedWorld } = await imp('core/rng.js');
const { CONTRACTS } = await imp('core/config.js');
const BR = await imp('systems/company/boardroom.js');
const CO = await imp('systems/trade/contracts.js');
const D = await imp('systems/company/dossier.js');
const F = await imp('data/factions.js');
const ORD = await imp('systems/company/orders.js');
const FL = await imp('systems/company/fleet.js');
// The entity factories are a boot step, not an import side effect — see core/spawn.js.
const { registerNpcFactories } = await imp('entities/npcs.js');
const { registerHullFactory } = await imp('entities/shipmesh.js');
registerNpcFactories(); registerHullFactory();
const { createCharacter } = await imp('systems/crew/character.js');
const { initScene } = await imp('world/scene.js');
const { createSystem } = await imp('world/system.js');
const { initWorldSim } = await imp('systems/platform/worldsim.js');

initScene(); recalcStats(); seedWorld(7731); S.seed = 7731; createSystem(); initWorldSim();
S.time = 100;
createCharacter({ name: 'Chair', lineage: 'core', corp: 'meridian', career: 'executive' });
CO.initContracts();

// ── 1. the door ──────────────────────────────────────────────────────
console.log('\n— a founder can reach the work —');
{
  ok('the command deck has a way to the board', /id="exec-board"/.test(html));
  ok('bound to the boardroom', /exec-board[\s\S]{0,240}openBoardroom/.test(src('ui/execdeck.js')));
  ok('the screen exists', /id="boardroom-overlay"/.test(html));
  ok('the frame loop keeps it live',
     /tickBoardroom\(dt\)/.test(src('main.js')) && /initBoardroom\(\)/.test(src('main.js')));
  // Order matters: the mirror has to run before the settlement pass that reads it.
  const m = src('main.js');
  ok('the mirror runs before contracts settle',
     m.indexOf('updateBoardroom()') < m.indexOf('updateContracts(dt)') &&
     m.indexOf('updateBoardroom()') > 0);

  // The character this is all for genuinely cannot use the old road.
  const { canPilot } = await imp('systems/company/career.js');
  ok('and this character still cannot fly to a station', canPilot() === false);
}

// ── 2. the whole system, by desk ─────────────────────────────────────
console.log('\n— every desk at once —');
{
  const desks = BR.systemBoard();
  ok('there is more than one desk', desks.length > 1, String(desks.length));
  ok('each is a real power', desks.every(d => !!F.POWERS[d.power]));
  ok('each carries the colour the data assigns it',
     desks.every(d => d.color === F.POWERS[d.power].color));
  ok('each says what it thinks of you', desks.every(d => typeof d.standing === 'number'));
  ok('the best-regarded desk is first',
     desks.every((d, i) => i === 0 || d.standing <= desks[i - 1].standing),
     desks.map(d => `${d.short}:${d.standing}`).join(' '));

  const offers = desks.flatMap(d => d.offers);
  ok('the board is populated', offers.length >= 8, String(offers.length));
  ok('every offer names the berth it is posted at', offers.every(o => !!o.station));
  ok('every offer knows whether it is open to you', offers.every(o => typeof o.eligible === 'boolean'));
  ok('and a closed one says why', offers.filter(o => !o.eligible).every(o => (o.why || '').length > 8));

  // The claim this screen exists to make: it shows work at berths the player is not at.
  const here = S.docked && S.docked.userData.name;
  ok('it shows work somewhere other than where you are standing',
     offers.some(o => o.station !== here), here || 'nowhere');
}

// ── 3. which hulls may fly what ──────────────────────────────────────
console.log('\n— the office asks the same question dispatch does —');
{
  for (const type of Object.keys(BR.CONTRACT_WORK)) {
    const w = BR.CONTRACT_WORK[type];
    ok(`${type} maps to a real fleet order`, !!ORD.FLEET_ORDER_TYPES[w.order], w.order);
    // Not restated: read from the order it becomes, so the office cannot drift from the
    // dispatcher and start promising work that is refused a line later.
    ok(`${type}'s roles come from that order`,
       BR.rolesFor(type) === ORD.FLEET_ORDER_TYPES[w.order].requires);
    ok(`${type} is measured by a field the work step writes`,
       ['delivered', 'bodiesDone', 'kills', 'contacts', 'runs'].includes(w.count), w.count);
  }
}

// ── 4. no hull, no promise ───────────────────────────────────────────
console.log('\n— a job nobody can fly is refused before it is taken —');
{
  const offer = BR.systemBoard().flatMap(d => d.offers).find(o => o.eligible);
  ok('there is open work', !!offer, 'none eligible');

  const c = offer.contract;
  const held = CO.activeContracts().length;
  ok('with an empty fleet the office refuses', !!BR.tenderBlocker(c), BR.tenderBlocker(c) || '');
  ok('and names what is missing', /hull/i.test(BR.tenderBlocker(c) || ''),
     BR.tenderBlocker(c) || '');
  ok('the refusal costs nothing', BR.tender(c) === null);
  // The important half: a refused tender must not leave a promise behind. Accepting is a
  // deadline with a standing penalty on it, and half-accepting is the worst outcome there is.
  ok('and takes no contract with it', CO.activeContracts().length === held);
}

// ── 5. accepting assigns a hull ──────────────────────────────────────
console.log('\n— taking the work puts a ship on it —');
{
  ok('the fleet starts empty', FL.fleetRoster().length === 0, String(FL.fleetRoster().length));

  // Commission a freighter through the yard the career actually uses. Cheaper than
  // fabricating a roster entry, and it means this suite would notice if commissioning
  // stopped producing a hull the boardroom can see.
  S.credits = 900000;
  const co = await imp('systems/company/company.js');
  if (!co.hasCompany()) co.foundCompany('Testworks');
  co.transfer(400000);
  const built = FL.commissionHull('haul');
  ok('the yard laid a freighter down', !!built && built.ok !== false,
     (built && built.reason) || '');
  const now = FL.fleetRoster();
  ok('the company has a freighter', now.some(h => h.role === 'haul'),
     now.map(h => h.role).join(',') || 'none');

  const freighter = now.find(h => h.role === 'haul');
  const board = BR.systemBoard().flatMap(d => d.offers);
  const job = board.find(o => o.eligible && (o.contract.type === 'haul' || o.contract.type === 'supply'));
  ok('there is freight on the board', !!job, board.filter(o => o.eligible).map(o => o.contract.type).join(','));

  if (job && freighter) {
    const c = job.contract;
    ok('the office accepts it', !BR.tenderBlocker(c, freighter), BR.tenderBlocker(c, freighter) || '');
    const order = BR.tender(c, freighter);
    ok('a fleet order comes back', !!order && !!order.id);
    ok('the contract is held', CO.activeContracts().some(x => x.id === c.id));
    ok('and it knows which hull is flying it', !!c.tendered && c.tendered.hullId === freighter.id);
    ok('the order is linked by jobId, not by contractId',
       order.params.jobId === c.id && order.contractId !== c.id);
    // `contractId` on a fleet order already means the hull's own paperwork. Overloading it
    // would silently rebind the ship to the haul job.
    ok('the hull’s own paperwork is untouched',
       order.contractId === null || order.contractId !== c.id);
    ok('the order runs until the job is done, not for a default clock',
       order.durationSec === 0, String(order.durationSec));
    ok('the hull is no longer free', FL.fleetRoster().find(h => h.id === freighter.id).busy === true);
    ok('the boardroom reports it as flying',
       BR.boardroomReport().held.some(h => h.contract.id === c.id && h.flying));

    // ── 6. what the hull delivers is what the contract is credited for ──
    console.log('\n— the hull’s work is the contract’s progress —');
    const before = c.progress;
    order.delivered = Math.round(c.target * 0.5);
    BR.updateBoardroom();
    ok('progress follows the hull', c.progress > before, `${before} → ${c.progress}`);

    // A recalled and redispatched hull starts a fresh counter; a bar that falls is a bug
    // report, so the mirror is monotonic.
    order.delivered = 1;
    BR.updateBoardroom();
    ok('and never goes backwards', c.progress > 1, String(c.progress));

    // Settlement runs down the ordinary path — including standing with the desk, its
    // enemies, and the career rung.
    const me = D.playerDossier();
    for (const k of F.POWER_KEYS) me.standing[k] = 0;
    const credits = S.credits;
    order.delivered = c.target + 1;
    BR.updateBoardroom();
    CO.updateContracts(0.1);
    ok('the contract completes', !CO.activeContracts().some(x => x.id === c.id));
    ok('and pays', S.credits > credits, `${credits} → ${S.credits}`);
    ok('the desk that posted it thinks better of you',
       D.standingWith(me, c.issuer) > 0, String(D.standingWith(me, c.issuer)));

    // Standing down keeps the promise and releases the ship. A second hull, because the
    // first is still bound to the objective it just finished — which is correct behaviour
    // and not something this section should be quietly working around.
    // The yard bills the *treasury*, not the wallet — capitalise the company first, which
    // is the same order of operations a player follows.
    S.credits = 900000;
    co.transfer(400000);
    FL.commissionHull('haul');
    const other = BR.systemBoard().flatMap(d => d.offers)
      .find(o => o.eligible && BR.CONTRACT_WORK[o.contract.type]);
    if (other && BR.crewFor(other.contract).length) {
      const c2 = other.contract;
      const t2 = BR.tender(c2, BR.crewFor(c2)[0]);
      ok('a second job can be tendered', !!c2.tendered,
         t2 ? '' : (BR.tenderBlocker(c2, BR.crewFor(c2)[0]) || 'tender returned null'));
      BR.standDown(c2);
      ok('standing down releases the hull', !c2.tendered);
      ok('but keeps the contract', CO.activeContracts().some(x => x.id === c2.id));
    } else {
      ok('a second job can be tendered', false,
         `eligible=${BR.systemBoard().flatMap(d => d.offers).filter(o => o.eligible).length} ` +
         `free=${FL.fleetRoster().filter(h => h.alive && !h.busy).map(h => h.role).join(',')}`);
    }
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
