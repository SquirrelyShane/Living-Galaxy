# PATCH v1.01.75 — "Audit"

The slice that merges the `living-galaxy-74` line back onto `main` and pays down what it
carried in with it. Two unseeded-RNG bugs fixed, the ~1,475 lines of v1.01.72–74 command
and knowledge-base code given a suite of its own, two holes in the static audit closed,
and the version/patch-note drift reconciled. Save schema stays **16**.

---

## Why this slice

`living-galaxy-74` was green — 32/32 — and green was misleading in two directions.

Downward, because one suite was not reliably green at all: `deals` failed roughly one run
in seven, on `main` as much as on the branch. That was not flake, it was an unseeded
random call, and the same call is a desync source in a shared galaxy.

Upward, because the entire feature set the branch existed to deliver — the command menu,
the resolver, the NPC knowledge base — had no test touching it. It passed import
resolution and one smoke loop that called every ARIA tool with the argument `'ore'`. Green
meant *nothing regressed*, which is not the same claim as *this works*.

---

## Fixed

**`systems/npc-comms.js` drew from `Math.random()` on every path except the sweep.**

`rng` was initialised lazily inside `updateNpcComms()` and nowhere else, with
`const roll = () => (rng ? rng.next() : Math.random())` as the fallback. Any entry into
`exchange()` that did not come through the sweep — a direct call, a test, and any future
player-hail or command path — drew unseeded. That is what made `test/deals.mjs` fail
intermittently: whether a radio haul offer cleared the acceptance bar was a coin flip
against an unseeded generator.

The caching was a second bug underneath the first. `seedWorld()` clears the stream table
so streams re-derive from the new seed; a cached stream *object* keeps generating from the
old world. Any reseed — new game, load — would have left this system running on the
previous galaxy's numbers.

Now `const roll = () => stream('npc-comms').next()`, fetched per draw. That is the shape
`systems/orders.js` and `systems/contracts.js` already use. `test/deals.mjs` ran 15/15
deterministic afterwards.

**`systems/deals.js` carried dead RNG plumbing.** It imported `stream`, declared `rng`,
assigned it in `propose()`, and never drew from it. Removed — it implied `willAccept()`
was stochastic when it is not, which is exactly the wrong thing for a reader to believe
about the acceptance rule.

---

## Added

**`test/command.mjs`** — 99 checks over the surface v1.01.72–74 shipped without any.

| Section | What it guards |
|---|---|
| the tree | every leaf carries an order type `orders.js` implements, ids are unique, resolved orders are copies not menu records |
| hull roles | no leaf asks for a hull its order type would refuse — a leaf that reads well and is rejected the instant anyone presses it |
| paths | empty, unknown, and stop-on-a-branch all refuse rather than half-resolve |
| utterances | seven phrasings land on the expected order type; no pattern points at a node id the menu no longer holds |
| the company gate | both channels refuse without a charter, and refuse identically |
| **both channels agree** | the same leaf dispatched by id and by sentence produces the same type, branch, mode, duration, role and asset name — and two distinct records |
| overrides | a bound real asset, mode, duration and target all survive into the order |
| recall | by name, by "last", and a miss that recalls nothing |
| the knowledge base | a dispatch files a validating diagnostic against the asset; a refused dispatch files nothing |
| profiles | every role builds and validates; an unknown role falls back rather than failing |
| bounds | the fleet board caps at six, over-cap is refused not thrown, the diagnostic log culls |

The both-channels-agree section is the one worth keeping. v1.01.73's central claim is that
a click and a sentence cannot diverge; until now nothing checked it.

**`test/static.mjs` audited three of four stylesheets.** The list was hardcoded as
`['base','hud','overlays']` while `index.html` links `panels.css` too — so any selector
living only in `panels.css` was outside the audit. Now derived from the `<link>` tags in
the markup, so it cannot drift again.

**`test/static.mjs` never checked re-exports.** `export { x } from './y.js'` is not an
import statement, so the barrel in `src/data/npc-kb/index.js` was entirely unverified — a
name it re-exported that `schema.js` did not export would have failed at runtime, for
whoever imported the barrel, which for a barrel nothing imports is nobody. Four re-exports
now checked.

---

## Reconciled

- `package.json` said `1.01.70` while `version.js` said `1.01.74`.
- `test:cargo` and `test:wear` had no npm script despite being in the suite list.
- `PATCH_v1.01.71.md` and `PATCH_v1.01.72.md` did not exist. Both versions are in the
  CHANGELOG; the convention is one note per bump. Backfilled and marked as such.
- README still read `v1.01.70 "Consignment"`.
- `docs/OPEN_ITEMS.md` said it was revised at v1.01.70 while its body cited v1.01.74.

---

## Files touched

| File | Change |
|---|---|
| `src/systems/npc-comms.js` | seeded stream fetched per draw; `Math.random()` fallback gone |
| `src/systems/deals.js` | dead `rng` plumbing removed |
| `src/core/version.js` | 1.01.75 "Audit" |
| `package.json` | version synced; `test:cargo`, `test:wear`, `test:command` added |
| `test/command.mjs` | **new** — 99 checks |
| `test/all.mjs` | `command` suite registered |
| `test/static.mjs` | stylesheets derived from markup; re-export pass added |
| `README.md` | build line |
| `CHANGELOG.md` | this entry |
| `Patch-Notes/PATCH_v1.01.71.md` | **new** — backfilled |
| `Patch-Notes/PATCH_v1.01.72.md` | **new** — backfilled |
| `Patch-Notes/PATCH_v1.01.75.md` | **new** — this note |
| `docs/OPEN_ITEMS.md` | header; two new open items |

Everything else in this zip is the v1.01.72–74 work as it stood on the branch, unmodified.

---

## Verified

- `node test/all.mjs` — **33/33 suites, 2,736 checks, 0 failed.** Run twice.
- `node test/deals.mjs` — 15 consecutive runs, all green, after having failed 3/20 on
  `main` before the fix.
- `node src/npc-avatar/test/run.mjs` — 8/8 (this suite is not in `all.mjs`).
- `node test/static.mjs` — 703 imports and 4 re-exports across 133 modules, no problems.

## Not verified

- Nothing here was run in a browser. The dock exterior-view and Ops Staff paths are
  covered only to the depth `test/ui.mjs` simulates pointer events.
- The two open items filed below are **known and unfixed**, not addressed by this slice.

## Filed as open

- **The `npc-kb` diagnostic log is not persisted and not reset.** It lives on
  `globalThis.__LG_DIAG__`, not in `S` — absent from the save payload, and it survives a
  new game started in the same page load. Moving it into `S` is a schema bump, so it is a
  decision rather than a fix, and it wants making before the self-training loop starts
  treating that log as a corpus worth keeping.
- **Fleet order ids come from `Date.now()` and `Math.random()`** (`systems/orders.js:153`).
  Same class as the bug fixed above: not reproducible across a save/replay, and two peers
  in a shared galaxy will not agree on an id. Wants a seeded stream or a monotonic counter.
- `src/data/npc-kb/index.js` is the documented import surface and all four call sites use
  deep paths instead.
