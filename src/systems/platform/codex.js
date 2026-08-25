// Living Galaxy — the codex. A galaxy that is already there when you arrive.
//
// ## What this is for
//
// The galaxy has always been an *index*: fifty thousand nodes derived from one integer, and
// "what is in system 31,402" answered by calling `generateSystem()` on arrival. That is a
// good design and it is not going anywhere — it is why the chart can draw a thousand stars
// without generating a thousand systems.
//
// What it cannot do is answer a question about the galaxy as a whole. Which powers hold the
// spinward arm? Where is the nearest system with an ice field and a shipyard? Which of my
// neighbours has a foundry? Every one of those needs the systems to *exist* — and generating
// six hundred of them takes about a second and a half, which is a second and a half you
// cannot spend in the middle of a frame.
//
// So they are generated once, at boot, behind the loading screen, and archived. After that
// the galaxy is a database: queryable, sortable, and the same on every load.
//
// ## What is archived, and what is not
//
// A **summary**, not the plan. A full plan is a star, up to thirty worlds with their derived
// classifications, moon tables, belt compositions and station rosters — a few tens of
// kilobytes each, and six hundred of those is a payload nobody needs. What is stored is what
// a question about the galaxy could plausibly ask: the star, the shape of the system, what
// its fields are made of, what its berths do, and which powers are present.
//
// **The archive is a cache, not a source of truth.** Arriving in a system still calls
// `generateSystem()`, exactly as before, and the plan it returns is the world. If the archive
// disagrees, the archive is wrong and is rebuilt. This is the property that makes the whole
// feature safe to ship: nothing downstream reads the archive to decide what is real, and a
// pilot whose browser refuses IndexedDB gets a galaxy that behaves identically and a chart
// that knows a little less about places they have not been.
//
// ## Why it yields
//
// `build()` is a generator-driven loop that hands the frame back every `GEN.budgetMs`. The
// loading screen behind it is animating, a language model is streaming in on another thread,
// and a pregeneration pass that blocked for a second and a half would show up as exactly the
// thing a loading screen exists to prevent: a frozen picture.

import { GEN, GALAXY } from '../../core/config.js';
import { generateSystem, GENESIS_VERSION } from '../../world/genesis.js';
import { nodeAt, designation, GALAXY_VERSION } from '../../world/galaxy.js';
import { POWER_KEYS, POWERS } from '../../data/factions.js';
import { makeRng } from '../../core/rng.js';
import { STORES, get, putMany, count, clear, durable } from '../../core/store.js';

/**
 * Which powers hold a system, derived from where it is.
 *
 * Not stored on the node and not rolled fresh on arrival: derived, from the system seed and
 * the node's own arm and radius, so it is the same answer everywhere and costs nothing to
 * ask twice. A power's reach follows its bloc's character — the core-ward blocs hold the
 * inner galaxy, the frontier ones hold the rim — with enough noise that a border is a
 * region rather than a line.
 */
export function powersAt(node) {
  const r = makeRng((node.seed ^ 0x5bf03635) >>> 0);
  const coreness = 1 - Math.min(1, node.r / GALAXY.radius);   // 1 at the core, 0 at the rim
  const scored = POWER_KEYS.map(key => {
    const p = POWERS[key];
    // A power's own bias toward the core. Derived from its key so it is stable without the
    // faction table having to carry a field about galactic geography it knows nothing about.
    const bias = ((hash(key) % 1000) / 1000) * 0.9 + 0.05;
    const fit = 1 - Math.abs(bias - coreness);
    return { key, name: p.name, bloc: p.bloc, w: fit * (0.55 + r.next() * 0.9) };
  }).sort((a, b) => b.w - a.w);

  // One holder, one or two others with a presence. A system with every power in it is a
  // system with no politics.
  const others = 1 + (r.next() < 0.45 ? 1 : 0);
  return {
    holder: scored[0].key,
    present: scored.slice(0, 1 + others).map(s => s.key)
  };
}

/** What gets written per system. Deliberately small — see the header. */
export function summarise(galaxySeed, i, density) {
  const node = nodeAt(galaxySeed, i);
  const plan = generateSystem(node.seed, { density });
  const powers = powersAt(node);
  const belts = plan.belts.map(b => ({
    name: b.name,
    inner: b.inner,
    width: b.width,
    // The three biggest shares, which is what a "what is this field made of" question wants
    // and is a tenth of the bytes of the full mix.
    top: Object.entries(b.mix).sort((x, y) => y[1] - x[1]).slice(0, 3)
      .map(([k, v]) => [k, Math.round(v)])
  }));
  return {
    v: GEN.archiveVersion,
    i,
    seed: node.seed,
    name: designation(node),
    star: { name: plan.star.name, cls: plan.star.class, className: plan.star.className,
            lum: +plan.star.lum.toFixed(3) },
    x: Math.round(node.x), y: Math.round(node.y), z: Math.round(node.z),
    arm: node.arm,
    planets: plan.planets.length,
    // The worlds worth naming: anything the classifier called habitable, plus the giants,
    // because those are the two answers to "is that system worth the jump".
    worlds: plan.planets.map(p => ({ name: p.name, type: p.type })).slice(0, 6),
    belts,
    stations: plan.stations.map(s => ({ name: s.name, type: s.type, belt: s.belt || null })),
    shipyard: plan.stations.some(s => s.type === 'foundry'),
    powers,
    genesis: GENESIS_VERSION,
    galaxy: GALAXY_VERSION
  };
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i); h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ── building it ──────────────────────────────────────────────────────

const META_KEY = 'archive';

/** What the stored archive claims about itself, or null. */
export async function manifest() {
  return await get(STORES.meta, META_KEY);
}

/**
 * Is the archive on disk the one this build and these settings want?
 *
 * Four ways it can be stale, and all four have to force a rebuild rather than a partial
 * one: a different galaxy, a different scale, a generator that has since changed its output,
 * or an archive format this build does not read. A half-migrated archive is worse than none,
 * because the half that is stale looks exactly like the half that is not.
 */
export function stale(man, want) {
  if (!man) return true;
  return man.galaxySeed !== want.galaxySeed ||
         man.depth !== want.depth ||
         man.density !== want.density ||
         man.genesis !== GENESIS_VERSION ||
         man.galaxy !== GALAXY_VERSION ||
         man.v !== GEN.archiveVersion;
}

/**
 * Build the archive, yielding between chunks.
 *
 * @param {object} want  { galaxySeed, depth, density }
 * @param {Function} [onProgress]  ({ done, total, system, phase }) after every chunk
 * @returns {Promise<object>} the manifest that was written
 */
export async function build(want, onProgress) {
  const total = Math.max(1, want.depth | 0);
  const report = onProgress || (() => {});
  const man = await manifest();

  if (!stale(man, want) && (await count(STORES.codex)) >= total) {
    report({ done: total, total, phase: 'cached', system: null });
    return man;
  }

  await clear(STORES.codex);
  report({ done: 0, total, phase: 'clearing', system: null });

  let done = 0;
  while (done < total) {
    const t0 = now();
    const batch = [];
    // Two bounds on a chunk, and both are needed. `GEN.chunk` keeps the transaction small;
    // `GEN.budgetMs` keeps the *frame* small, and it is the one that matters on a slow phone,
    // where sixteen systems can take longer than a frame all on their own.
    while (done < total && batch.length < GEN.chunk && now() - t0 < GEN.budgetMs) {
      const s = summarise(want.galaxySeed, done, want.density);
      batch.push([String(done), s]);
      done++;
    }
    await putMany(STORES.codex, batch);
    report({ done, total, phase: 'building',
             system: batch.length ? batch[batch.length - 1][1] : null });
    await yieldFrame();
  }

  const written = {
    v: GEN.archiveVersion,
    galaxySeed: want.galaxySeed,
    depth: total,
    density: want.density,
    genesis: GENESIS_VERSION,
    galaxy: GALAXY_VERSION,
    durable: durable(),
    built: Date.now()
  };
  await putMany(STORES.meta, [[META_KEY, written]]);
  report({ done: total, total, phase: 'done', system: null });
  return written;
}

const now = () => (typeof performance !== 'undefined' && performance.now
  ? performance.now() : Date.now());

/**
 * Hand the frame back.
 *
 * `requestAnimationFrame` where there is one, because that is what actually lets the loading
 * screen paint; a plain timeout headless and in a background tab, where rAF never fires and
 * a pregeneration pass that waited for it would hang for ever.
 */
function yieldFrame() {
  return new Promise(resolve => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    if (typeof requestAnimationFrame === 'function' &&
        (typeof document === 'undefined' || !document.hidden)) requestAnimationFrame(finish);
    // Raced with a timer, always. `requestAnimationFrame` does not fire in a background tab,
    // and a build that awaits one there stops for as long as the tab is hidden — which looks
    // exactly like a hang to somebody who switched away and came back. The timer is the
    // floor; whichever arrives first wins and the other is ignored.
    setTimeout(finish, 50);
  });
}

// ── reading it ───────────────────────────────────────────────────────

/** One archived system by node index, or null if it was never archived. */
export async function systemAt(i) {
  return await get(STORES.codex, String(i));
}

/** How many systems are on disk. */
export const archived = () => count(STORES.codex);

/**
 * A one-line description of the archive for the loading screen and Settings.
 *
 * Says whether it is durable, because "regenerated every boot" and "read from disk" are
 * different products from the player's side and only one of them is worth the wait.
 */
export function archiveLine(man) {
  if (!man) return 'No archive — systems are generated on arrival.';
  return `${man.depth} systems archived · density ${man.density.toFixed(1)} · ` +
         (man.durable ? 'on disk' : 'in memory only, this session');
}
