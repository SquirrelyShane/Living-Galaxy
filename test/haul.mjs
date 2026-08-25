// Haul consignments, and the buttons that let you reach any of this.
//
// Two bugs, reported together, with the same root: something existed in the model and had
// no honest surface.
//
// **The haul.** A haul contract said "Haul 2,213 kg salvage to Colony Habitat" and put
// nothing in the hold, so the only way to fly it was to already own the goods. Loading the
// cargo at acceptance fixed that and opened a worse hole: the load was indistinguishable
// from the pilot's own cargo, so you could sell it at the station that had just handed it
// to you, abandon the contract, and walk away up. Measured on seed 42: **+12,038 cr
// against a contract that paid 8,264**, which made abandoning strictly better than
// delivering, and repeatable at every station with a haul on the board.
//
// The fix is that a consignment is *not yours*: it occupies the hold and counts against
// capacity, but it cannot be sold, it is handed over at the destination, and it goes back
// to the issuer if the contract fails.
//
// **The buttons.** `title` is a hover affordance and phones do not hover, so a column of
// eleven unlabelled glyphs is eleven buttons a player cannot identify. `◈` was Ops.

import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const { readFileSync } = await import('node:fs');
const html = readFileSync(new URL('index.html', ROOT), 'utf8');

const { S, recalcStats, cargoFree, cargoMass } = await imp('core/state.js');
const { seedWorld } = await imp('core/rng.js');
const { initScene } = await imp('world/scene.js');
const { createSystem } = await imp('world/system.js');
const { initMarket } = await imp('systems/trade/market.js');
const { COMMODITIES } = await imp('core/config.js');
const CO = await imp('systems/trade/contracts.js');
const EC = await imp('systems/trade/economy.js');

initScene();
recalcStats();
seedWorld(42);
createSystem();
initMarket();
CO.initContracts();

/** A station whose board actually has a haul on it, and that haul. */
// A haul this character can actually take. Since v1.02.39 a board is tiered and most of it
// is gated — taking the first haul on the first board found a Bonded job the test pilot
// holds no certificate for, and every assertion downstream of that accept then failed for
// a reason that had nothing whatever to do with consignment.
function findHaul() {
  for (const st of S.world.stations) {
    const b = CO.boardFor(st).filter(x => x.type === 'haul' && !CO.acceptBlocker(x));
    if (b.length) return { st, offer: b[0] };
  }
  return { st: null, offer: null };
}

function reset() {
  S.credits = 50000;
  S.time = 10;
  S.cargo.ore = 0; S.cargo.salvage = 0; S.cargo.data = 0;
  S.contracts.active = [];
}

// ── the load actually boards ─────────────────────────────────────────
console.log('\n— accepting a haul puts the cargo aboard —');
{
  reset();
  const { st, offer } = findHaul();
  ok('the board offers hauls at all', !!offer);
  S.docked = st;

  const before = S.cargo[offer.commodity] || 0;
  ok('accepting works', CO.acceptContract(offer) === true);
  ok('the load is in the hold', (S.cargo[offer.commodity] || 0) === before + offer.target,
     `${S.cargo[offer.commodity]} vs ${before + offer.target}`);
  ok('the contract records what it lent', offer.loaded === offer.target);
  ok('it takes up real capacity', cargoMass() >= offer.target);

  // Capacity has to be checked at acceptance, because there is nowhere to put an overflow.
  reset();
  const { st: st2, offer: offer2 } = findHaul();
  S.docked = st2;
  S.cargo.ore = S.stats.cargoCap;                 // hold full of the pilot's own ore
  const why = CO.acceptBlocker(offer2);
  ok('a full hold refuses the contract', typeof why === 'string' && why.length > 0, String(why));
  ok('and says the hold is the reason', /hold|free/i.test(String(why)));
}

// ── the load is not yours ────────────────────────────────────────────
console.log('\n— a consignment is not the pilot\'s cargo —');
{
  reset();
  const { st, offer } = findHaul();
  S.docked = st;
  CO.acceptContract(offer);
  const key = offer.commodity;

  ok('it counts as consigned', CO.consignedFor(key) === offer.target);
  ok('and none of it is sellable', CO.sellableOf(key) === 0);

  const credits = S.credits;
  const got = EC.sell(key, st);
  ok('selling it at the issuing station earns nothing', got === 0);
  ok('the credits did not move', S.credits === credits);
  ok('and the load is still aboard', S.cargo[key] === offer.target);

  const all = EC.sellAll(st);
  ok('sell-all leaves it alone too', all === 0 && S.cargo[key] === offer.target);

  // The pilot's own cargo of the same commodity stays sellable — the consignment must not
  // freeze the whole stack.
  S.cargo[key] += 400;
  ok('the pilot\'s own share is still sellable', Math.round(CO.sellableOf(key)) === 400);
  const mine = EC.sell(key, st);
  ok('and it sells', mine > 0);
  ok('leaving exactly the consignment behind', Math.round(S.cargo[key]) === offer.target,
     `${Math.round(S.cargo[key])} vs ${offer.target}`);
  ok('the hold never goes negative', S.cargo[key] >= 0);
}

// ── handing it over ──────────────────────────────────────────────────
console.log('\n— delivery —');
{
  reset();
  const { st, offer } = findHaul();
  S.docked = st;
  CO.acceptContract(offer);
  const dest = S.world.stations.find(s => s.userData.name === offer.dest);
  ok('the destination is a real station', !!dest);

  ok('nothing is deliverable at the origin', CO.deliverableAt(st).length === 0);
  ok('it is deliverable at the destination', CO.deliverableAt(dest).length === 1);

  const wrongPlace = CO.deliverConsignment(st);
  ok('delivering at the wrong station moves nothing', wrongPlace === 0);
  ok('and the load stays aboard', S.cargo[offer.commodity] === offer.target);

  S.docked = dest;
  const credits = S.credits;
  const moved = CO.deliverConsignment(dest);
  ok('delivering at the destination hands the load over', moved === offer.target);
  ok('the hold is clear of it', Math.round(S.cargo[offer.commodity]) === 0);
  ok('the contract is credited', offer.progress >= offer.target);
  ok('nothing is left consigned', CO.consignedFor(offer.commodity) === 0);

  CO.updateContracts(0.1);
  ok('the contract completes', !CO.activeContracts().some(c => c.id === offer.id));
  ok('and pays exactly its fee', S.credits === credits + offer.pay,
     `${S.credits - credits} vs ${offer.pay}`);
}

// ── failure returns the goods ────────────────────────────────────────
console.log('\n— a contract that fails does not leave you the cargo —');
{
  reset();
  const { st, offer } = findHaul();
  S.docked = st;
  CO.acceptContract(offer);
  ok('the load is aboard', S.cargo[offer.commodity] === offer.target);

  CO.abandonContract(CO.activeContracts()[0]);
  ok('abandoning takes the load back', Math.round(S.cargo[offer.commodity]) === 0);
  ok('and nothing is left consigned', CO.consignedFor(offer.commodity) === 0);

  // Expiry is the same rule on a different trigger.
  reset();
  const { st: st3, offer: offer3 } = findHaul();
  S.docked = st3;
  CO.acceptContract(offer3);
  const live = CO.activeContracts()[0];
  live.deadline = S.time - 1;
  CO.updateContracts(0.1);
  ok('an expired haul takes the load back', Math.round(S.cargo[offer3.commodity]) === 0);
  ok('and the contract is gone', !CO.activeContracts().some(c => c.id === offer3.id));

  // A pilot cannot hand back what was shot out of them. Reclaim clamps rather than
  // driving the hold negative.
  reset();
  const { st: st4, offer: offer4 } = findHaul();
  S.docked = st4;
  CO.acceptContract(offer4);
  S.cargo[offer4.commodity] = 5;                  // raided down to almost nothing
  CO.abandonContract(CO.activeContracts()[0]);
  ok('a raided hold is not driven negative', S.cargo[offer4.commodity] >= 0,
     String(S.cargo[offer4.commodity]));
}

// ── the exploit itself ───────────────────────────────────────────────
console.log('\n— the accept-sell-abandon loop —');
{
  reset();
  const start = S.credits;
  const { st, offer } = findHaul();
  S.docked = st;

  CO.acceptContract(offer);
  EC.sellAll(st);
  CO.abandonContract(CO.activeContracts()[0]);

  ok('the loop no longer turns a profit', S.credits <= start,
     `${S.credits - start}`);
  ok('and it costs you, as failing a contract should', S.credits < start);
  ok('the hold is empty afterwards',
     Object.keys(COMMODITIES).every(k => Math.round(S.cargo[k]) === 0));
}

// ── supply is a different contract ───────────────────────────────────
console.log('\n— supply still works the old way —');
{
  reset();
  // Supply means "we are short, bring some in" — you source it and sell it here, so a sale
  // is the delivery. It must not have been swept up in the haul change.
  const supply = { id: 'sup-test', type: 'supply', issuer: 'independent', station: 'x',
                   skill: 'commerce', commodity: 'ore', dest: S.world.stations[1].userData.name,
                   pay: 900, rep: 2, target: 50, progress: 0,
                   expires: S.time + 999, deadline: S.time + 999, base: { sold: 0 } };
  S.contracts.active.push(supply);
  ok('supply consigns nothing', CO.consignedFor('ore') === 0);

  S.cargo.ore = 200;
  ok('the pilot\'s ore is fully sellable', CO.sellableOf('ore') === 200);
  EC.sell('ore', S.world.stations[1]);
  ok('selling at the destination credits a supply contract', supply.progress >= 50,
     String(supply.progress));
}

// ── the buttons ──────────────────────────────────────────────────────
console.log('\n— the tool column is legible —');
{
  const col = /<div id="tool-column">([\s\S]*?)<\/div>/.exec(html);
  ok('the tool column exists in the markup', !!col);

  const buttons = [...col[1].matchAll(/<button id="([^"]+)"[^>]*title="([^"]*)"[^>]*>([^<]*)<\/button>/g)]
    .map(m => ({ id: m[1], title: m[2], label: m[3] }));
  ok('every tool button was parsed', buttons.length >= 10, String(buttons.length));

  ok('every tool button carries a title', buttons.every(b => b.title.trim().length > 0),
     buttons.filter(b => !b.title.trim()).map(b => b.id).join(', '));
  ok('every tool button carries a face', buttons.every(b => b.label.trim().length > 0),
     buttons.filter(b => !b.label.trim()).map(b => b.id).join(', '));

  const ops = buttons.find(b => b.id === 'btn-ops');
  ok('there is an Ops button', !!ops);
  ok('and it says so in words, not a glyph', /OPS/i.test(ops.label), ops.label);
  ok('its title names what is behind it', /ops|order|company/i.test(ops.title), ops.title);

  // `title` is a hover affordance and there is no hover on a phone. Any button whose face
  // is a bare symbol is, on the target device, unlabelled — so the ones that survive as
  // glyphs have to be the ones whose meaning is conventional.
  const GLYPH_OK = new Set(['btn-level', 'btn-audio', 'btn-settings', 'btn-comms', 'btn-save']);
  const cryptic = buttons.filter(b =>
    !GLYPH_OK.has(b.id) && !/[A-Za-z]/.test(b.label));
  ok('no unconventional button is glyph-only', cryptic.length === 0,
     cryptic.map(b => `${b.id}="${b.label}"`).join(', '));

  // The column does not scroll on a phone, so a label wider than the button is a label
  // that gets clipped rather than one that wraps.
  const wide = buttons.filter(b => /[A-Za-z]/.test(b.label) && b.label.trim().length > 4);
  ok('no label is wider than the narrowest button fits', wide.length === 0,
     wide.map(b => `${b.id}="${b.label}"`).join(', '));
}

// ── the dock signposts it ────────────────────────────────────────────
console.log('\n— the dock points at Ops —');
{
  const dockSrc = readFileSync(new URL('src/ui/dock.js', ROOT), 'utf8');
  ok('the dock can open Ops', /openOps\(/.test(dockSrc));
  ok('it offers the executive desk when you hold a charter',
     /OPEN OPS/.test(dockSrc));
  ok('and offers registration when you do not',
     /REGISTER A COMPANY CHARTER/.test(dockSrc));

  const opens = (dockSrc.match(/openOps\('staff'\)/g) || []).length;
  ok('every branch of the station tab has a way through', opens >= 3, String(opens));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
