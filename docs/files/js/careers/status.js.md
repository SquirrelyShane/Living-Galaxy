# js/careers/status.js

[index](../../../README.md) · 55 lines · 7 symbols · 1 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY 0.3.80 — which careers a new pilot can take.

All sixteen complexes stay in the game: NPCs, crew, children, the hiring hall,
the job board and the ship lines use every one. This table only decides what a
PLAYER may enrol in, at creation and by lateral transfer. A career is `open`
when it has every item of `OPEN_GATE` — the bar Mining cleared:

- `verb` — its own thing to do in flight, used minute to minute (the cutter)
- `site` — a place in the world the verb happens (belt sites, 0.3.20)
- `board` — its own department with jobs that use the verb
- `feeds` — the verb feeds its primary skills A→G (careers.test)
- `tutorial` — its own branch in the core tutorial
- `hull` — career defaults + an issued line that fits the verb
- `aria` — ARIA can fly the verb (aria-play --career)
- `bench` — aria-bench within band of Mining
- `smoke` — a browser smoke that runs the loop end to end

`has` on a planned career is the 0.3.80 audit of what already exists; `missing`
is the rest, which is the checklist for its arc. `CAREER_ARCS` is the order —
docs/CAREER_ROADMAP.md is the plan behind it. Flipping a career open is one
line here plus its gate test; nothing else reads the table.

Saves are never broken by it: a pilot already enrolled in a planned career
keeps flying it and can resume a held ladder; makePilot() itself does not
check, so tools/aria-play.mjs and aria-bench.mjs still run every career.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./complexes.js` | `COMPLEX_IDS` | [js/careers/complexes.js](complexes.js.md) |

## Imported by

- [js/flight/pilot.js](../flight/pilot.js.md) — `careerStatus`
- test/careerstatus.test.mjs _(outside js/)_ — `CAREER_STATUS`, `OPEN_GATE`, `careerStatus`, `isCareerOpen`, `openCareers`

## Exports

- [`OPEN_GATE`](#s-OPEN_GATE) · const — used by test/careerstatus.test.mjs
- [`CAREER_ARCS`](#s-CAREER_ARCS) · const — **no importer in scanned roots**
- [`CAREER_STATUS`](#s-CAREER_STATUS) · const — used by test/careerstatus.test.mjs
- [`careerStatus`](#s-careerStatus) · function — used by [js/flight/pilot.js](../flight/pilot.js.md), test/careerstatus.test.mjs
- [`isCareerOpen`](#s-isCareerOpen) · function — used by test/careerstatus.test.mjs
- [`openCareers`](#s-openCareers) · function — used by test/careerstatus.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-OPEN_GATE"></a>`OPEN_GATE`

const · **exported** · L3–13

<!-- note:OPEN_GATE -->
<!-- /note -->

### <a id="s-CAREER_ARCS"></a>`CAREER_ARCS`

const · **exported** · L15–23

<!-- note:CAREER_ARCS -->
<!-- /note -->

### <a id="s-CAREER_STATUS"></a>`CAREER_STATUS`

const · **exported** · L25–42

<!-- note:CAREER_STATUS -->
<!-- /note -->

### <a id="s-arcOf"></a>`arcOf`

const · L44–44

<!-- note:arcOf -->
<!-- /note -->

### <a id="s-careerStatus"></a>`careerStatus(id)`

function · **exported** · L46–51

- called by: [`isCareerOpen`](#s-isCareerOpen) · [`careerCatalog`](../flight/pilot.js.md#s-careerCatalog) _js/flight/pilot.js_ · [`transferOptions`](../flight/pilot.js.md#s-transferOptions) _js/flight/pilot.js_ · [`tryTransfer`](../flight/pilot.js.md#s-tryTransfer) _js/flight/pilot.js_

<!-- note:careerStatus -->
- L? · `return { id, ...s, open: true, arc, eta: arc ? arc.minor : "", missing: OPEN_GATE.filter((` — A planned feature loop is still a selectable career. `state` and `missing`
  describe its roadmap, while `open` describes pilot access.
<!-- /note -->

### <a id="s-isCareerOpen"></a>`isCareerOpen(id)`

function · **exported** · L53–53

- calls: [`careerStatus`](#s-careerStatus)

<!-- note:isCareerOpen -->
<!-- /note -->

### <a id="s-openCareers"></a>`openCareers()`

function · **exported** · L55–55

- via [js/careers/complexes.js](complexes.js.md): `COMPLEX_IDS.filter`

<!-- note:openCareers -->
<!-- /note -->
