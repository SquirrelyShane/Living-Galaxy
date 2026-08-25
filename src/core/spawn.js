// Living Galaxy — the simulation asking for something to exist.
//
// The third and last upward arrow, and the subtlest of the three.
//
// `entities/` sits **above** `systems/` in the layer contract, and that is not arbitrary: an
// NPC hull imports thirteen systems — combat, damage, tactics, deals, holds, market, fleet —
// because an NPC is an actor that *uses* the rules. Rules do not use actors.
//
// Except four times they did. `fleet.js` signing a contracted hull, `worldsim.js` raising a
// pirate bastion, `jump.js` repopulating a system, `net.js` building a mesh for a remote
// pilot — all of them needed a thing to come into being, and reached up to the constructor
// to do it.
//
// The need is real; the direction was wrong. So it is a factory registry, the same shape as
// `core/screens.js`: the simulation names *what should exist*, `entities/` registers *how to
// build one*, and with nothing registered the request returns null. A headless run — a
// server tick, a test that only cares about the economy — gets no mesh and carries on,
// which was never possible while the constructor was a hard import.
//
// Pure module: no DOM, no imports.

const factories = new Map();

/**
 * Register how to build a kind of thing. Returns an unregister.
 *
 * `entities/npcs.js` registers 'npc'; `entities/shipmesh.js` registers 'hull'.
 */
export function registerFactory(kind, build) {
  if (!kind || typeof build !== 'function') return () => {};
  factories.set(kind, build);
  return () => { if (factories.get(kind) === build) factories.delete(kind); };
}

/**
 * Ask for one. Returns whatever the factory made, or **null** when nothing is registered.
 *
 * Null rather than a throw, and callers are expected to handle it: "there is no renderer
 * here" is a legitimate state, not a fault. Every call site below the entity layer already
 * guarded its result for the case where a spawn was refused, so this changes nothing about
 * how they read.
 */
export function spawn(kind, ...args) {
  const build = factories.get(kind);
  if (!build) return null;
  try { return build(...args); } catch (e) { return null; }
}

/** What can currently be built. Diagnostics and the boot check. */
export const registeredFactories = () => [...factories.keys()].sort();

export function resetFactories() { factories.clear(); }
