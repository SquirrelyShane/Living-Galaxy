# js/asteroidgen/impact-sim.js

[index](../../../README.md) · 560 lines · 43 symbols · 1 imports · 2 importers

## About

<!-- note:@file -->
Impact Lab rigid-body simulation — pure (no DOM, no GPU), deterministic, fixed step.

Every body and fragment is a rigid piece with mass, a collision radius and a
principal inertia tensor (from its re-formed shape, or the body's vertex spread).

 - Mutual (softened) gravity: slow pieces fall back, graze, and settle on each other.
 - Torque-free rotation: angular momentum L is conserved in the world and
   ω = R·I⁻¹·Rᵀ·L, so elongated pieces tumble and precess instead of spinning
   on one axis.
 - Sphere contacts between armed pairs (pairs start armed only once apart, so
   neighbours inside the broken body do not explode): normal impulse with
   restitution (0 below the stick speed — rubble comes to rest on rubble),
   Coulomb friction, and the friction torque on both pieces.
 - Hard contacts become events → secondary debris (dust, ice, small rocks)
   sprayed around the contact at the pair's local velocity.
 - Shedding: while fragments are young they shed dust from their surfaces at
   v + ω × r, so the tumbling of each piece draws its own curling swirl lines.

Emitted particles are queued in sim.emitted (drained by the renderer). Linear
momentum is conserved exactly (pairwise gravity + equal/opposite impulses);
angular momentum is conserved up to positional correction.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./rng.js` | `RNG`, `hashString`, `unitVec` | [js/asteroidgen/rng.js](rng.js.md) |

## Imported by

- [js/render/impactfx.js](../render/impactfx.js.md) — `DustBuffer`, `RockBuffer`, `chunkLocal`
- [js/world/events/impacts.js](../world/events/impacts.js.md) — `ImpactSim`, `buildSimPieces`, `meshShape`, `ellipsoidInertia`, `quatToRows`, `SIM`

## Exports

- [`SIM`](#s-SIM) · const — used by [js/world/events/impacts.js](../world/events/impacts.js.md)
- [`quatToRows`](#s-quatToRows) · function — used by [js/world/events/impacts.js](../world/events/impacts.js.md)
- [`quatMul`](#s-quatMul) · function — **no importer in scanned roots**
- [`quatConj`](#s-quatConj) · function — **no importer in scanned roots**
- [`quatRotate`](#s-quatRotate) · function — **no importer in scanned roots**
- [`ellipsoidInertia`](#s-ellipsoidInertia) · function — used by [js/world/events/impacts.js](../world/events/impacts.js.md)
- [`ImpactSim`](#s-ImpactSim) · class — used by [js/world/events/impacts.js](../world/events/impacts.js.md)
- [`meshShape`](#s-meshShape) · function — used by [js/world/events/impacts.js](../world/events/impacts.js.md)
- [`buildSimPieces`](#s-buildSimPieces) · function — used by [js/world/events/impacts.js](../world/events/impacts.js.md)
- [`chunkShapes`](#s-chunkShapes) · function — **no importer in scanned roots**
- [`DustBuffer`](#s-DustBuffer) · class — used by [js/render/impactfx.js](../render/impactfx.js.md)
- [`RockBuffer`](#s-RockBuffer) · class — used by [js/render/impactfx.js](../render/impactfx.js.md)
- [`chunkLocal`](#s-chunkLocal) · function — used by [js/render/impactfx.js](../render/impactfx.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-SIM"></a>`SIM`

const · **exported** · L3–14

<!-- note:SIM -->
- L4 · `G: 0.35,` — escape speed ≈ 0.75 u/s from a unit asteroid, ≈ 1.4 from the planet
- L6 · `storeEvery: 2,` — 30 Hz track
- L12 · `shedRate: 70,` — dust per second per unit surface (decays)
- L13 · `eventDust: 420,` — dust per unit contact energy
<!-- /note -->

### <a id="s-dot"></a>`dot(a, b)`

function · L16–16

- called by: [`ImpactSim.contacts`](#s-ImpactSim-contacts) · [`ImpactSim.energy`](#s-ImpactSim-energy) ×2 · [`ImpactSim.fates`](#s-ImpactSim-fates) · [`ImpactSim.inertiaApply`](#s-ImpactSim-inertiaApply) ×6 · [`quatRotate`](#s-quatRotate) ×3

<!-- note:dot -->
<!-- /note -->

### <a id="s-cross"></a>`cross(a, b)`

function · L17–17

- called by: [`ImpactSim.angularMomentum`](#s-ImpactSim-angularMomentum) · [`ImpactSim.contacts`](#s-ImpactSim-contacts) ×4 · [`ImpactSim.secondary`](#s-ImpactSim-secondary) ×2 · [`ImpactSim.shed`](#s-ImpactSim-shed)

<!-- note:cross -->
<!-- /note -->

### <a id="s-quatToRows"></a>`quatToRows(q)`

function · **exported** · L19–26

- called by: [`ImpactSim.inertiaApply`](#s-ImpactSim-inertiaApply) · [`quatRotate`](#s-quatRotate) · [`rogueSpec`](../world/events/impacts.js.md#s-rogueSpec) _js/world/events/impacts.js_ · [`startStrike`](../world/events/impacts.js.md#s-startStrike) _js/world/events/impacts.js_

<!-- note:quatToRows -->
<!-- /note -->

### <a id="s-quatMul"></a>`quatMul(a, b)`

function · **exported** · L27–34

- called by: [`chunkLocal`](#s-chunkLocal) · [`integrateQuat`](#s-integrateQuat)

<!-- note:quatMul -->
<!-- /note -->

### <a id="s-quatConj"></a>`quatConj(q)`

function · **exported** · L35–35

- called by: [`chunkLocal`](#s-chunkLocal)

<!-- note:quatConj -->
<!-- /note -->

### <a id="s-quatRotate"></a>`quatRotate(q, v)`

function · **exported** · L36–39

- calls: [`dot`](#s-dot) ×3 · [`quatToRows`](#s-quatToRows)
- called by: [`chunkLocal`](#s-chunkLocal)

<!-- note:quatRotate -->
<!-- /note -->

### <a id="s-integrateQuat"></a>`integrateQuat(q, w, dt)`

function · L40–47

- calls: [`quatMul`](#s-quatMul)
- called by: [`ImpactSim.step`](#s-ImpactSim-step)

<!-- note:integrateQuat -->
<!-- /note -->

### <a id="s-ellipsoidInertia"></a>`ellipsoidInertia(m, axes, basis=)`

function · **exported** · L49–52

- called by: [`buildSimPieces`](#s-buildSimPieces) ×3 · [`startStrike`](../world/events/impacts.js.md#s-startStrike) _js/world/events/impacts.js_ ×2

<!-- note:ellipsoidInertia -->
Principal inertia of an ellipsoid (semi-axes a) of mass m, axes given as unit vectors
in the piece's local frame. Returns { moments, basis } with I = B·diag(moments)·Bᵀ.
<!-- /note -->

### <a id="s-ImpactSim"></a>`ImpactSim`

class · **exported** · L54–374

- called by: [`startCollision`](../world/events/impacts.js.md#s-startCollision) _js/world/events/impacts.js_ · [`startStrike`](../world/events/impacts.js.md#s-startStrike) _js/world/events/impacts.js_

<!-- note:ImpactSim -->
<!-- /note -->

#### <a id="s-ImpactSim-constructor"></a>`ImpactSim.constructor({…})`

method · L55–81

- calls: [`hashString`](rng.js.md#s-hashString) _js/asteroidgen/rng.js_ · [`new RNG`](rng.js.md#s-RNG) _js/asteroidgen/rng.js_

<!-- note:ImpactSim.constructor -->
@param {object} opts
  pieces: [{ kind, body, k, mass, radius, pos, vel, q (world, local→world), spin (world ω),
            inertia: { moments, basis (local unit vectors) }, color, ice, heat, cool, shed }]
  G, collide (false pre-impact), seed, t (start time since impact)

- L74 · `if (a.body !== b.body || Math.hypot(a.pos[0] - b.pos[0], a.pos[1] - b.pos[1], a.pos[2] - b` — pieces of the two different bodies collide from the start (no tunnelling through the target);
  neighbours within one broken body only once they have separated
- L78 · `this.frames = [];` — Float32Array per stored frame: N × 7 (pos, quat)
<!-- /note -->

#### <a id="s-ImpactSim-inertiaApply"></a>`ImpactSim.inertiaApply(P, x, inverse)`

method · L83–91

- calls: [`dot`](#s-dot) ×6 · [`quatToRows`](#s-quatToRows)

<!-- note:ImpactSim.inertiaApply -->
I·x (world) when inverse = false, I⁻¹·x when true, for the piece's current orientation.

- L86 · `const l = [R[0][0] * x[0] + R[1][0] * x[1] + R[2][0] * x[2], R[0][1] * x[0] + R[1][1] * x[` — world → local → principal
<!-- /note -->

#### <a id="s-ImpactSim-omega"></a>`ImpactSim.omega(P)`

method · L93–95

<!-- note:ImpactSim.omega -->
<!-- /note -->

#### <a id="s-ImpactSim-store"></a>`ImpactSim.store()`

method · L97–106

<!-- note:ImpactSim.store -->
<!-- /note -->

#### <a id="s-ImpactSim-step"></a>`ImpactSim.step()`

method · L108–137

- calls: [`integrateQuat`](#s-integrateQuat)

<!-- note:ImpactSim.step -->
<!-- /note -->

#### <a id="s-ImpactSim-contacts"></a>`ImpactSim.contacts()`

method · L139–196

- calls: [`cross`](#s-cross) ×4 · [`dot`](#s-dot)

<!-- note:ImpactSim.contacts -->
- L155 · `const im = a.invMass + b.invMass;` — push apart (mass-weighted)
- L173 · `const J = [n[0] * jn - (vt[0] / (vtl || 1)) * jt, n[1] * jn - (vt[1] / (vtl || 1)) * jt, n` — impulse on b (a gets the opposite)
<!-- /note -->

#### <a id="s-ImpactSim-secondary"></a>`ImpactSim.secondary(ev, a, b)`

method · L198–233

- calls: [`cross`](#s-cross) ×2 · [`ImpactSim.secondary>spray`](#s-ImpactSim-secondary-spray) ×2

<!-- note:ImpactSim.secondary -->
Secondary debris: dust sheet ⟂ the contact normal + ice + a few rocks, carried at the pair's velocity.
<!-- /note -->

##### <a id="s-ImpactSim-secondary-spray"></a>`ImpactSim.secondary>spray(count, kind)`

function · L211–230

- called by: [`ImpactSim.secondary`](#s-ImpactSim-secondary) ×2

<!-- note:ImpactSim.secondary>spray -->
<!-- /note -->

#### <a id="s-ImpactSim-shed"></a>`ImpactSim.shed()`

method · L235–263

- calls: [`cross`](#s-cross) · [`unitVec`](rng.js.md#s-unitVec) _js/asteroidgen/rng.js_

<!-- note:ImpactSim.shed -->
Young fragments shed surface dust at v + ω × r: each tumbling piece draws its own swirl.

- L256 · `size: isIce ? rng.range(0.04, 0.08) : rng.range(0.05, 0.13),` — fine grains: the swirl lines stay readable
<!-- /note -->

#### <a id="s-ImpactSim-advance"></a>`ImpactSim.advance(t, maxSteps=)`

method · L265–272

<!-- note:ImpactSim.advance -->
Step until sim time ≥ t (at most maxSteps per call, so a slow frame never stalls).
<!-- /note -->

#### <a id="s-ImpactSim-stateAt"></a>`ImpactSim.stateAt(i, t)`

method · L274–297

<!-- note:ImpactSim.stateAt -->
Interpolated { pos, q } for piece i at time t (clamped to the stored track).
<!-- /note -->

#### <a id="s-ImpactSim-momentum"></a>`ImpactSim.momentum()`

method · L299–303

<!-- note:ImpactSim.momentum -->
<!-- /note -->

#### <a id="s-ImpactSim-angularMomentum"></a>`ImpactSim.angularMomentum()`

method · L305–312

- calls: [`cross`](#s-cross)

<!-- note:ImpactSim.angularMomentum -->
<!-- /note -->

#### <a id="s-ImpactSim-energy"></a>`ImpactSim.energy()`

method · L314–325

- calls: [`dot`](#s-dot) ×2

<!-- note:ImpactSim.energy -->
<!-- /note -->

#### <a id="s-ImpactSim-centre"></a>`ImpactSim.centre()`

method · L327–338

<!-- note:ImpactSim.centre -->
Centre of mass position / velocity of all pieces.
<!-- /note -->

#### <a id="s-ImpactSim-fates"></a>`ImpactSim.fates()`

method · L340–353

- calls: [`dot`](#s-dot)

<!-- note:ImpactSim.fates -->
escaping: positive energy relative to the rest of the cluster and already well out.
<!-- /note -->

#### <a id="s-ImpactSim-clumps"></a>`ImpactSim.clumps()`

method · L355–373

- calls: [`ImpactSim.clumps>find`](#s-ImpactSim-clumps-find) ×3

<!-- note:ImpactSim.clumps -->
Groups of ≥ 2 pieces resting on each other (touching, slow relative motion).
<!-- /note -->

##### <a id="s-ImpactSim-clumps-find"></a>`ImpactSim.clumps>find(i)`

function · L358–358

- calls: [`ImpactSim.clumps>find`](#s-ImpactSim-clumps-find)
- called by: [`ImpactSim.clumps`](#s-ImpactSim-clumps) ×3 · [`ImpactSim.clumps>find`](#s-ImpactSim-clumps-find)

<!-- note:ImpactSim.clumps>find -->
<!-- /note -->

### <a id="s-meshShape"></a>`meshShape(positions, eigen3)`

function · **exported** · L376–392

- called by: [`chunkShapes`](#s-chunkShapes) · [`fracturedRogue`](../world/events/impacts.js.md#s-fracturedRogue) _js/world/events/impacts.js_

<!-- note:meshShape -->
Principal inertia axes of a mesh (local frame) from its vertex spread: { axes (semi, local units), basis }.
<!-- /note -->

### <a id="s-buildSimPieces"></a>`buildSimPieces(plan, bodies)`

function · **exported** · L394–443

- calls: [`ellipsoidInertia`](#s-ellipsoidInertia) ×3
- called by: [`startCollision`](../world/events/impacts.js.md#s-startCollision) _js/world/events/impacts.js_ · [`startStrike`](../world/events/impacts.js.md#s-startStrike) _js/world/events/impacts.js_

<!-- note:buildSimPieces -->
Rigid pieces for the post-impact sim from a plan.
@param {object} plan  planImpact() result
@param {Array} bodies [{ kind, q (world quat at impact), pos, scale, radius, mass, shape: meshShape(), fracture, ice, pieceColor(k) }]
<!-- /note -->

### <a id="s-chunkShapes"></a>`chunkShapes(geometry, count, eigen3)`

function · **exported** · L445–453

- calls: [`meshShape`](#s-meshShape)

<!-- note:chunkShapes -->
Per-chunk principal shapes (for pieces that do not re-form): { axes, basis } by chunk id.
<!-- /note -->

### <a id="s-DustBuffer"></a>`DustBuffer`

class · **exported** · L455–489

- called by: [`makeImpactFx>build`](../render/impactfx.js.md#s-makeImpactFx-build) _js/render/impactfx.js_

<!-- note:DustBuffer -->
Fixed-capacity GPU-ready dust / ice sprite buffer (unemitted slots stay hidden: t0 = 1e6).
<!-- /note -->

#### <a id="s-DustBuffer-constructor"></a>`DustBuffer.constructor(cap)`

method · L456–465

<!-- note:DustBuffer.constructor -->
<!-- /note -->

#### <a id="s-DustBuffer-push"></a>`DustBuffer.push(r)`

method · L466–476

<!-- note:DustBuffer.push -->
<!-- /note -->

#### <a id="s-DustBuffer-pushBlast"></a>`DustBuffer.pushBlast(D, t0=)`

method · L477–488

<!-- note:DustBuffer.pushBlast -->
planEjecta() dust block, emitted at t0.
<!-- /note -->

### <a id="s-RockBuffer"></a>`RockBuffer`

class · **exported** · L491–547

- called by: [`makeImpactFx>build`](../render/impactfx.js.md#s-makeImpactFx-build) _js/render/impactfx.js_

<!-- note:RockBuffer -->
Fixed-capacity instanced ejecta-rock buffer, one slot range per rock variant.
<!-- /note -->

#### <a id="s-RockBuffer-constructor"></a>`RockBuffer.constructor(cap, variants=)`

method · L492–507

<!-- note:RockBuffer.constructor -->
<!-- /note -->

#### <a id="s-RockBuffer-slot"></a>`RockBuffer.slot()`

method · L508–517

<!-- note:RockBuffer.slot -->
<!-- /note -->

#### <a id="s-RockBuffer-write"></a>`RockBuffer.write(i, {…})`

method · L518–527

<!-- note:RockBuffer.write -->
<!-- /note -->

#### <a id="s-RockBuffer-pushBlast"></a>`RockBuffer.pushBlast(K, t0=)`

method · L528–534

<!-- note:RockBuffer.pushBlast -->
planEjecta() rocks block (t0 = 0).
<!-- /note -->

#### <a id="s-RockBuffer-push"></a>`RockBuffer.push(rec)`

method · L535–546

- calls: [`unitVecFrom`](#s-unitVecFrom) ×2

<!-- note:RockBuffer.push -->
sim record (kind 3).
<!-- /note -->

### <a id="s-unitVecFrom"></a>`unitVecFrom(x)`

function · L549–554

- called by: [`RockBuffer.push`](#s-RockBuffer-push) ×2

<!-- note:unitVecFrom -->
<!-- /note -->

### <a id="s-chunkLocal"></a>`chunkLocal(meshPos, meshQ, scale, piecePos, pieceQ)`

function · **exported** · L556–560

- calls: [`quatConj`](#s-quatConj) · [`quatMul`](#s-quatMul) · [`quatRotate`](#s-quatRotate)
- called by: [`makeImpactFx>update`](../render/impactfx.js.md#s-makeImpactFx-update) _js/render/impactfx.js_

<!-- note:chunkLocal -->
Local chunk transform for the fracture shader: centre and orientation in the mesh's frame.
<!-- /note -->
