# js/asteroidgen/impact.js

[index](../../../README.md) · 216 lines · 22 symbols · 1 imports · 1 importers

## About

<!-- note:@file -->
Impact physics for the collision demo — pure functions (no DOM, no GPU).

Disruption uses a specific-energy criterion: Q = ½·μ·v² / m_body against a
size-dependent strength Q* = Q0 · m^0.4 (bigger bodies are gravity-bound and
harder to disperse). The destroyed fraction f = clamp(Q / Q*) decides how
many Voronoi chunks, nearest the contact point first, break away.

v1.8: no rails. Each fragment leaves with its parent's velocity, the parent's
spin (ω × r — bodies tumble on arbitrary axes) and an ejection kick away from
the contact whose speed falls with fragment mass (∝ m^-1/6: big pieces are
slow). Survivors take whatever momentum is left, so total momentum is exactly
conserved. From there impact-sim.js integrates everything (mutual gravity,
piece-on-piece collisions, torque-free tumbling). Ejecta here is only the
instantaneous blast; shedding and secondary-impact debris come from the sim.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./rng.js` | `RNG`, `hashString`, `powerLaw`, `gauss`, `unitVec` | [js/asteroidgen/rng.js](rng.js.md) |

## Imported by

- [js/world/events/impacts.js](../world/events/impacts.js.md) — `planImpact`, `planEjecta`, `samplePalette`

## Exports

- [`IMPACT`](#s-IMPACT) · const — **no importer in scanned roots**
- [`contactTime`](#s-contactTime) · function — **no importer in scanned roots**
- [`setupApproach`](#s-setupApproach) · function — **no importer in scanned roots**
- [`rotate`](#s-rotate) · function — **no importer in scanned roots**
- [`rotateT`](#s-rotateT) · function — **no importer in scanned roots**
- [`planImpact`](#s-planImpact) · function — used by [js/world/events/impacts.js](../world/events/impacts.js.md)
- [`planMomentum`](#s-planMomentum) · function — **no importer in scanned roots**
- [`planEjecta`](#s-planEjecta) · function — used by [js/world/events/impacts.js](../world/events/impacts.js.md)
- [`composeAxisAngle`](#s-composeAxisAngle) · function — **no importer in scanned roots**
- [`rogueHandoff`](#s-rogueHandoff) · function — **no importer in scanned roots**
- [`samplePalette`](#s-samplePalette) · function — used by [js/world/events/impacts.js](../world/events/impacts.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-IMPACT"></a>`IMPACT`

const · **exported** · L3–3

<!-- note:IMPACT -->
<!-- /note -->

### <a id="s-sub"></a>`sub(a, b)`

function · L5–5

- called by: [`contactTime`](#s-contactTime) ×2 · [`planImpact`](#s-planImpact) ×3 · [`planImpact>plan`](#s-planImpact-plan) ×6 · [`setupApproach`](#s-setupApproach) ×2

<!-- note:sub -->
<!-- /note -->

### <a id="s-add"></a>`add(a, b)`

function · L6–6

- called by: [`planEjecta`](#s-planEjecta) ×6 · [`planEjecta>sheetDir`](#s-planEjecta-sheetDir) ×2 · [`planImpact`](#s-planImpact) ×2 · [`planImpact>plan`](#s-planImpact-plan) ×7 · [`planImpact>plan>world`](#s-planImpact-plan-world) · [`planMomentum`](#s-planMomentum) ×2 · [`setupApproach`](#s-setupApproach) ×2

<!-- note:add -->
<!-- /note -->

### <a id="s-mul"></a>`mul(a, s)`

function · L7–7

- called by: [`norm`](#s-norm) · [`planEjecta`](#s-planEjecta) ×5 · [`planEjecta>sheetDir`](#s-planEjecta-sheetDir) ×3 · [`planImpact`](#s-planImpact) ×5 · [`planImpact>plan`](#s-planImpact-plan) ×10 · [`planImpact>plan>world`](#s-planImpact-plan-world) · [`planMomentum`](#s-planMomentum) ×2 · [`setupApproach`](#s-setupApproach) ×2

<!-- note:mul -->
<!-- /note -->

### <a id="s-dot"></a>`dot(a, b)`

function · L8–8

- called by: [`contactTime`](#s-contactTime) ×3 · [`len`](#s-len) · [`rotate`](#s-rotate) ×3

<!-- note:dot -->
<!-- /note -->

### <a id="s-len"></a>`len(a)`

function · L9–9

- calls: [`dot`](#s-dot)
- called by: [`norm`](#s-norm) · [`planImpact`](#s-planImpact) · [`planImpact>plan`](#s-planImpact-plan) ×2

<!-- note:len -->
<!-- /note -->

### <a id="s-norm"></a>`norm(a)`

function · L10–10

- calls: [`len`](#s-len) · [`mul`](#s-mul)
- called by: [`planEjecta`](#s-planEjecta) · [`planEjecta>sheetDir`](#s-planEjecta-sheetDir) · [`planImpact`](#s-planImpact) · [`planImpact>plan`](#s-planImpact-plan) ×2

<!-- note:norm -->
<!-- /note -->

### <a id="s-cross"></a>`cross(a, b)`

function · L11–11

- called by: [`planEjecta`](#s-planEjecta) ×2 · [`planImpact>plan`](#s-planImpact-plan) ×2

<!-- note:cross -->
<!-- /note -->

### <a id="s-contactTime"></a>`contactTime(pA, vA, pB, vB, R)`

function · **exported** · L13–24

- calls: [`dot`](#s-dot) ×3 · [`sub`](#s-sub) ×2

<!-- note:contactTime -->
Earliest t ≥ 0 at which two spheres moving linearly touch (null if never).
<!-- /note -->

### <a id="s-setupApproach"></a>`setupApproach({…})`

function · **exported** · L26–36

- calls: [`add`](#s-add) ×2 · [`mul`](#s-mul) ×2 · [`sub`](#s-sub) ×2

<!-- note:setupApproach -->
Initial states so two bodies meet at `impactAt` seconds.
drift: common velocity of the pair (the whole encounter moves; nothing is parked at the origin).
@param {object} p { speed, angleDeg, rA, rB, mA, mB, impactAt, drift }

- L28 · `const b = R * Math.sin((Math.max(0, Math.min(75, angleDeg)) * Math.PI) / 180) * 0.92;` — impact parameter
<!-- /note -->

### <a id="s-rotate"></a>`rotate(R, v)`

function · **exported** · L38–40

- calls: [`dot`](#s-dot) ×3
- called by: [`planImpact>plan>world`](#s-planImpact-plan-world)

<!-- note:rotate -->
<!-- /note -->

### <a id="s-rotateT"></a>`rotateT(R, v)`

function · **exported** · L41–43

<!-- note:rotateT -->
<!-- /note -->

### <a id="s-planImpact"></a>`planImpact(A, B, {…}=)`

function · **exported** · L45–112

- calls: [`add`](#s-add) ×2 · [`len`](#s-len) · [`mul`](#s-mul) ×5 · [`norm`](#s-norm) · [`planImpact>plan`](#s-planImpact-plan) ×2 · [`sub`](#s-sub) ×3 · [`hashString`](rng.js.md#s-hashString) _js/asteroidgen/rng.js_ · [`new RNG`](rng.js.md#s-RNG) _js/asteroidgen/rng.js_
- called by: [`startCollision`](../world/events/impacts.js.md#s-startCollision) _js/world/events/impacts.js_ · [`startStrike`](../world/events/impacts.js.md#s-startStrike) _js/world/events/impacts.js_

<!-- note:planImpact -->
Plan the break-up at the moment of contact.
@param {object} A,B { pos, vel, spin (world ω), mass, radius, scale, rot (3×3 rows, world = rot·local),
                      fracture: { centroids, counts, morph? }, strength? (Q* multiplier), reform? [min,max] s }
@returns {{ contact, normal, energy, relativeSpeed, cm, momentum, bodies: [{ fraction, detached, velPost, spinPost, massPost, totalChunks }] }}
<!-- /note -->

#### <a id="s-planImpact-plan"></a>`planImpact>plan(body, sign)`

function · L55–108

- calls: [`add`](#s-add) ×7 · [`cross`](#s-cross) ×2 · [`len`](#s-len) ×2 · [`mul`](#s-mul) ×10 · [`norm`](#s-norm) ×2 · [`planImpact>plan>world`](#s-planImpact-plan-world) ×3 · [`sub`](#s-sub) ×6 · [`unitVec`](rng.js.md#s-unitVec) _js/asteroidgen/rng.js_ ×2
- called by: [`planImpact`](#s-planImpact) ×2

<!-- note:planImpact>plan -->
- L76 · `dir = norm(add(dir, mul(n, -sign * 0.35)));` — away from the other body, no tunnelling
- L77 · `const sp = vrel * (IMPACT.eject[0] + IMPACT.eject[1] * closeness) * rng.range(0.6, 1.3) *` — bigger pieces leave slower
- L79 · `const rim = cross(spin, sub(w, body.pos));` — the parent's tumble flings its surface
- L82 · `const kick = mul(unitVec(rng), (sp / Math.max(0.15, size)) * rng.range(0.15, 0.45));` — the kick also spins the piece up: multi-axis, faster for small pieces
- L97 · `const massPost = body.mass - detached.reduce((s, p) => s + p.mass, 0);` — survivors keep the rest of the parent's momentum exactly
- L102 · `const tot = detached.reduce((s, p) => s + p.mass, 0);` — nothing left to absorb the balance: share it out so momentum still closes
<!-- /note -->

##### <a id="s-planImpact-plan-world"></a>`planImpact>plan>world(c)`

function · L64–64

- calls: [`add`](#s-add) · [`mul`](#s-mul) · [`rotate`](#s-rotate)
- called by: [`planImpact>plan`](#s-planImpact-plan) ×3

<!-- note:planImpact>plan>world -->
<!-- /note -->

### <a id="s-planMomentum"></a>`planMomentum(plan)`

function · **exported** · L114–121

- calls: [`add`](#s-add) ×2 · [`mul`](#s-mul) ×2

<!-- note:planMomentum -->
Total linear momentum of a plan's pieces + survivors.
<!-- /note -->

### <a id="s-planEjecta"></a>`planEjecta({…}, paletteA, paletteB, {…}=)`

function · **exported** · L123–177

- calls: [`add`](#s-add) ×6 · [`composeAxisAngle`](#s-composeAxisAngle) · [`cross`](#s-cross) ×2 · [`mul`](#s-mul) ×5 · [`norm`](#s-norm) · [`planEjecta>pick`](#s-planEjecta-pick) ×2 · [`planEjecta>sheetDir`](#s-planEjecta-sheetDir) ×3 · [`hashString`](rng.js.md#s-hashString) _js/asteroidgen/rng.js_ · [`powerLaw`](rng.js.md#s-powerLaw) _js/asteroidgen/rng.js_ ×3 · [`new RNG`](rng.js.md#s-RNG) _js/asteroidgen/rng.js_ · [`unitVec`](rng.js.md#s-unitVec) _js/asteroidgen/rng.js_ ×5
- called by: [`startCollision`](../world/events/impacts.js.md#s-startCollision) _js/world/events/impacts.js_ · [`startStrike`](../world/events/impacts.js.md#s-startStrike) _js/world/events/impacts.js_

<!-- note:planEjecta -->
Instantaneous blast: dust sheet (mostly ⟂ impact normal), sparks, meshed rocks.
base velocity = the pair's centre-of-mass velocity plus the local surface motion,
so the sheet is carried along and skewed by the bodies' tumble.
Every particle carries t0 = 0 (emitted at impact); impact-sim adds later waves.

- L164 · `const sp = v * powerLaw(rng, 0.3, 2.4, 1.4) * Math.pow(s / 0.06, -0.5);` — bigger rocks slower
- L170 · `K.spin2.set([ax2[0], ax2[1], ax2[2], rng.range(0.1, 1.2)], i * 4);` — precession: tumble axis wanders
<!-- /note -->

#### <a id="s-planEjecta-pick"></a>`planEjecta>pick()`

function · L130–133

- called by: [`planEjecta`](#s-planEjecta) ×2

<!-- note:planEjecta>pick -->
<!-- /note -->

#### <a id="s-planEjecta-sheetDir"></a>`planEjecta>sheetDir(normalSpread)`

function · L134–137

- calls: [`add`](#s-add) ×2 · [`mul`](#s-mul) ×3 · [`norm`](#s-norm) · [`gauss`](rng.js.md#s-gauss) _js/asteroidgen/rng.js_
- called by: [`planEjecta`](#s-planEjecta) ×3

<!-- note:planEjecta>sheetDir -->
<!-- /note -->

### <a id="s-composeAxisAngle"></a>`composeAxisAngle(te, o, p, axis, ang, s)`

function · **exported** · L179–186

- called by: [`planEjecta`](#s-planEjecta)

<!-- note:composeAxisAngle -->
<!-- /note -->

### <a id="s-rogueHandoff"></a>`rogueHandoff(escaping, bodyInfo)`

function · **exported** · L188–205

<!-- note:rogueHandoff -->
The biggest escaping piece leaves for the survey deck as a new asteroid —
its own seed (parent seed + chunk), the parent's class, a size from its volume share.
@param {Array<{ body, k, size, speed }>} escaping  from ImpactSim.fates()

- L188 · `export function rogueHandoff(escaping, bodyInfo` — [{ seed, classId, radiusM, kind, fracture }]
<!-- /note -->

### <a id="s-samplePalette"></a>`samplePalette(colorArray, n=, seed=)`

function · **exported** · L207–216

- calls: [`hashString`](rng.js.md#s-hashString) _js/asteroidgen/rng.js_ · [`new RNG`](rng.js.md#s-RNG) _js/asteroidgen/rng.js_
- called by: [`fracturedRogue`](../world/events/impacts.js.md#s-fracturedRogue) _js/world/events/impacts.js_

<!-- note:samplePalette -->
Sample a small palette from a vertex-colour attribute array.
<!-- /note -->
