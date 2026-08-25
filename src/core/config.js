// Living Galaxy — the tuning barrel.
//
// Every number that balances the game, in one import, as it always has been. The contents
// moved into `core/config/` at v1.02.52 — twelve files mirroring the `systems/` domains —
// and this re-exports all of them so nothing that imports `core/config.js` had to change.
//
// Which is the point: a 1,727-line module is not improved by making four hundred call sites
// edit their import line. Reach for `core/config/combat.js` when you want one domain and
// know where it lives; keep importing this when you want three values from three domains.

export * from './config/base.js';
export * from './config/ships.js';
export * from './config/combat.js';
export * from './config/flight.js';
export * from './config/trade.js';
export * from './config/industry.js';
export * from './config/company.js';
export * from './config/crew.js';
export * from './config/world.js';
export * from './config/npc.js';
export * from './config/render.js';
export * from './config/sim.js';
