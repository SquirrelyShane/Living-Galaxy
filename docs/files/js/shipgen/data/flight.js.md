# js/shipgen/data/flight.js

[index](../../../../README.md) · 122 lines · 9 symbols · 2 imports · 4 importers

## About

<!-- note:@file -->
Flight performance — first-order aerodynamics and propulsion figures for the hull on the cradle.

Regimes span continuum to free-molecular flow. Drag uses a shape-family base coefficient with a
regime multiplier (Newtonian blunt-body limit at hypersonic Mach, C_D → ~2.2 free-molecular) plus
appendage drag area from every mounted part that presents a face to the flow. Heating is the
Sutton–Graves stagnation-point estimate. Propulsion sums the drive pods: Isp, thrust, T/W, Δv
(Tsiolkovsky, propellant from fitted stores), and propulsive efficiency 2/(1+Ve/V) at the
regime speed. Stability is centre-of-pressure vs centre-of-mass along the hull.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `three` | `*` as `THREE` | external |
| 2 | `./drives.js` | `DRIVE_TYPES` | [js/shipgen/data/drives.js](drives.js.md) |

## Imported by

- [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md) — `DESIGN_REGIMES`
- [js/shipgen/generate.js](../generate.js.md) — `analyzeFlight`
- [js/shipgen/index.js](../index.js.md) — `REGIMES`, `DESIGN_REGIMES`, `HULL_CD`, `analyzeFlight`, `optimizeDrag`
- test/shipgen/test-flight.mjs _(outside js/)_ — `analyzeFlight`, `optimizeDrag`, `REGIMES`

## Exports

- [`REGIMES`](#s-REGIMES) · const — used by [js/shipgen/index.js](../index.js.md), test/shipgen/test-flight.mjs
- [`DESIGN_REGIMES`](#s-DESIGN_REGIMES) · const — used by [js/shipgen/builder/StarshipBuilder.js](../builder/StarshipBuilder.js.md), [js/shipgen/index.js](../index.js.md)
- [`HULL_CD`](#s-HULL_CD) · const — used by [js/shipgen/index.js](../index.js.md)
- [`analyzeFlight`](#s-analyzeFlight) · function — used by [js/shipgen/generate.js](../generate.js.md), [js/shipgen/index.js](../index.js.md), test/shipgen/test-flight.mjs
- [`optimizeDrag`](#s-optimizeDrag) · function — used by [js/shipgen/index.js](../index.js.md), test/shipgen/test-flight.mjs

## Effects

_none detected_

## Symbols

### <a id="s-_c"></a>`_c`

const · L3–3

<!-- note:_c -->
<!-- /note -->

### <a id="s-REGIMES"></a>`REGIMES`

const · **exported** · L5–10

<!-- note:REGIMES -->
<!-- /note -->

### <a id="s-DESIGN_REGIMES"></a>`DESIGN_REGIMES`

const · **exported** · L12–21

<!-- note:DESIGN_REGIMES -->
Design regimes — what the hull is built FOR. Chosen per class (or overridden in Drydock) and read by
the builder: proportions, nose, fairings, heat shield, conformal sensors, edgewise arrays, mount rules.
<!-- /note -->

### <a id="s-HULL_CD"></a>`HULL_CD`

const · **exported** · L23–26

<!-- note:HULL_CD -->
base drag coefficient by hull family at supersonic continuum, referenced to frontal area
<!-- /note -->

### <a id="s-NOSE_R"></a>`NOSE_R`

const · L27–27

<!-- note:NOSE_R -->
nose bluntness → effective nose radius as a fraction of beam (drives stagnation heating)
<!-- /note -->

### <a id="s-regimeCd"></a>`regimeCd(base, R)`

function · L29–33

- called by: [`analyzeFlight`](#s-analyzeFlight)

<!-- note:regimeCd -->
- L30 · `if (R.kn >= 1) return 2.1 + (base - 0.4) * 0.5;` — free-molecular: everything is a flat plate, shape barely matters
- L31 · `if (R.mach && R.mach > 5) return 0.9 + base * 0.85;` — hypersonic Newtonian: bluntness dominates
<!-- /note -->

### <a id="s-analyzeFlight"></a>`analyzeFlight(builder, regimeKey=, opts=)`

function · **exported** · L35–110

- calls: [`regimeCd`](#s-regimeCd)
- called by: [`optimizeDrag>evalCfg`](#s-optimizeDrag-evalCfg) · [`buildShip`](../generate.js.md#s-buildShip) _js/shipgen/generate.js_

<!-- note:analyzeFlight -->
- L41 · `const hullMass = (opts.hullMassKg ?? size.x * size.y * size.z * 0.55 * 180);` — ---- mass ----
- L41 · `const hullMass = (opts.hullMassKg ?? size.x * size.y * size.z * 0.55 * 180);` — structure: ~55% of the bounding box is enclosed volume at ~180 kg/m³ (pressurised spacecraft class)
- L43 · `const propMass = builder.mounted.filter(m => m.part.tags.includes("fluids") && m.part.pref` — stores carry ~6× their dry mass
- L46 · `const frontal = Math.PI * 0.25 * B * H * (HULL_CD[cls.body] > 1 ? 1.15 : 0.85);` — ---- drag ----
- L46 · `const frontal = Math.PI * 0.25 * B * H * (HULL_CD[cls.body] > 1 ? 1.15 : 0.85);` — boxy hulls fill their bounding rectangle
- L50 · `let a = w * h;` — frontal projection of the footprint box
- L60 · `const beta = mass / dragArea;` — ballistic coefficient kg/m²
- L61 · `const mu = 3.986e14, a = 6.371e6 + 200e3, Hs = 37e3;` — orbital lifetime at 200 km: time to fall one scale height
- L64 · `const Rn = Math.max(0.15, B * (NOSE_R[cls.nose] ?? 0.2));` — ---- heating (Sutton–Graves) at the re-entry point ----
- L67 · `const pods = builder.enginePods || [];` — ---- propulsion ----
- L77 · `const impinged = [];` — ---- plume impingement: any mounted part inside a drive cone ----
- L88 · `let cpZ = 0, cpA = 0, cgZ = 0, cgM = 0;` — ---- stability: pressure centre vs mass centre along the hull (nose-first flight) ----
- L88 · `let cpZ = 0, cpA = 0, cgZ = 0, cgM = 0;` — lateral (side) area distribution drives the weathercock: fins and drive pods aft, nose volume forward
- L97 · `const staticMargin = (zCp - zCg) / (L || 1);` — +: CP aft of CG → weathercock-stable nose first
- L99 · `const notes = [];` — ---- verdicts ----
<!-- /note -->

### <a id="s-optimizeDrag"></a>`optimizeDrag(build, baseCfg, regimeKey, {…}=)`

function · **exported** · L112–122

- calls: [`optimizeDrag>evalCfg`](#s-optimizeDrag-evalCfg) ×2

<!-- note:optimizeDrag -->
Drag optimiser: random search over seeds × proportions for the current class, keeping volume within
`volFloor` of the baseline. Returns the best config and the report line. `build(cfg)` must build without
touching the scene (a scratch StarshipBuilder).
<!-- /note -->

#### <a id="s-optimizeDrag-evalCfg"></a>`optimizeDrag>evalCfg(cfg)`

function · L113–113

- calls: [`analyzeFlight`](#s-analyzeFlight)
- called by: [`optimizeDrag`](#s-optimizeDrag) ×2

<!-- note:optimizeDrag>evalCfg -->
build(cfg) must return the StarshipBuilder that built cfg
<!-- /note -->
