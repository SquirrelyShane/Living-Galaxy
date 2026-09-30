# js/robotgen/spec.js

[index](../../../README.md) · 714 lines · 54 symbols · 1 imports · 5 importers

## About

<!-- note:@file -->
robotgen/src/spec.js — deterministic robotic NPC spec generator.
Pure data: no THREE, no DOM. Safe to run in Node, a worker, or the page.

Mass and cost are NOT guessed: once the spec is drawn, `data/bom.js` picks the
unit out of the shared parts catalogue (the same one NEWSHIPGEN and STATIONGEN
quote from) and the manifest's own mass becomes `spec.stats.massKg`. The old
volume estimate survives as `stats.frameEstimateKg` — it is what sizes the
parts (a heavy frame gets heavy legs), and the parts then weigh themselves.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./data/bom.js` | `robotBom` | [js/robotgen/data/bom.js](data/bom.js.md) |

## Imported by

- [js/crew/robots.js](../crew/robots.js.md) — `generateRobot`
- [js/drones/dronespec.js](../drones/dronespec.js.md) — `generateRobot`
- [js/robotgen/build.js](build.js.md) — `LEGGED`, `FLYING`
- [js/robotgen/world.js](world.js.md) — `generateRobot`, `makeRng`, `PALETTES`
- test/drones.test.mjs _(outside js/)_ — `SPEC_VERSION`

## Exports

- [`SPEC_VERSION`](#s-SPEC_VERSION) · const — used by test/drones.test.mjs
- [`makeRng`](#s-makeRng) · function — used by [js/robotgen/world.js](world.js.md)
- [`LOCOMOTION`](#s-LOCOMOTION) · const — **no importer in scanned roots**
- [`LEGGED`](#s-LEGGED) · const — used by [js/robotgen/build.js](build.js.md)
- [`FLYING`](#s-FLYING) · const — used by [js/robotgen/build.js](build.js.md)
- [`HEAD_TYPES`](#s-HEAD_TYPES) · const — **no importer in scanned roots**
- [`TORSO_SHAPES`](#s-TORSO_SHAPES) · const — **no importer in scanned roots**
- [`INSIGNIA`](#s-INSIGNIA) · const — **no importer in scanned roots**
- [`OPTIC_LAYOUTS`](#s-OPTIC_LAYOUTS) · const — **no importer in scanned roots**
- [`ANTENNA_TYPES`](#s-ANTENNA_TYPES) · const — **no importer in scanned roots**
- [`HANDS`](#s-HANDS) · const — **no importer in scanned roots**
- [`SHOULDER_MOUNTS`](#s-SHOULDER_MOUNTS) · const — **no importer in scanned roots**
- [`ARMOR_SLOTS`](#s-ARMOR_SLOTS) · const — **no importer in scanned roots**
- [`ARMOR_STYLES`](#s-ARMOR_STYLES) · const — **no importer in scanned roots**
- [`LIMB_TYPES`](#s-LIMB_TYPES) · const — **no importer in scanned roots**
- [`BACK_UNITS`](#s-BACK_UNITS) · const — **no importer in scanned roots**
- [`CHEST_MODULES`](#s-CHEST_MODULES) · const — **no importer in scanned roots**
- [`HIP_MODULES`](#s-HIP_MODULES) · const — **no importer in scanned roots**
- [`PAYLOADS`](#s-PAYLOADS) · const — **no importer in scanned roots**
- [`SIGHTS`](#s-SIGHTS) · const — **no importer in scanned roots**
- [`MUZZLES`](#s-MUZZLES) · const — **no importer in scanned roots**
- [`MAGS`](#s-MAGS) · const — **no importer in scanned roots**
- [`UNDERBARREL`](#s-UNDERBARREL) · const — **no importer in scanned roots**
- [`PALETTES`](#s-PALETTES) · const — used by [js/robotgen/world.js](world.js.md)
- [`ROLES`](#s-ROLES) · const — **no importer in scanned roots**
- [`ROLE_KEYS`](#s-ROLE_KEYS) · const — **no importer in scanned roots**
- [`CAREER_CLASSES`](#s-CAREER_CLASSES) · const — **no importer in scanned roots**
- [`bias`](#s-bias) · function — **no importer in scanned roots**
- [`generateRobot`](#s-generateRobot) · function — used by [js/crew/robots.js](../crew/robots.js.md), [js/drones/dronespec.js](../drones/dronespec.js.md), [js/robotgen/world.js](world.js.md)
- [`applyPartsMass`](#s-applyPartsMass) · function — **no importer in scanned roots**
- [`describe`](#s-describe) · function — **no importer in scanned roots**
- [`randomSeed`](#s-randomSeed) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-SPEC_VERSION"></a>`SPEC_VERSION`

const · **exported** · L3–3

<!-- note:SPEC_VERSION -->
<!-- /note -->

### <a id="s-xmur3"></a>`xmur3(str)`

function · L5–16

- called by: [`makeRng`](#s-makeRng)

<!-- note:xmur3 -->
---------- rng ----------
<!-- /note -->

### <a id="s-mulberry32"></a>`mulberry32(a)`

function · L17–24

- called by: [`makeRng`](#s-makeRng)

<!-- note:mulberry32 -->
<!-- /note -->

### <a id="s-makeRng"></a>`makeRng(seed)`

function · **exported** · L25–53

- calls: [`mulberry32`](#s-mulberry32) · [`xmur3`](#s-xmur3)
- called by: [`generateRobot`](#s-generateRobot) · [`generatePopulation`](world.js.md#s-generatePopulation) _js/robotgen/world.js_

<!-- note:makeRng -->
<!-- /note -->

#### <a id="s-makeRng-f"></a>`makeRng.f()`

prop · L30–30

<!-- note:makeRng.f -->
<!-- /note -->

#### <a id="s-makeRng-range"></a>`makeRng.range(a, b)`

prop · L31–31

<!-- note:makeRng.range -->
<!-- /note -->

#### <a id="s-makeRng-int"></a>`makeRng.int(a, b)`

prop · L32–32

<!-- note:makeRng.int -->
<!-- /note -->

#### <a id="s-makeRng-pick"></a>`makeRng.pick(arr)`

prop · L33–33

<!-- note:makeRng.pick -->
<!-- /note -->

#### <a id="s-makeRng-chance"></a>`makeRng.chance(p)`

prop · L34–34

<!-- note:makeRng.chance -->
<!-- /note -->

#### <a id="s-makeRng-weighted"></a>`makeRng.weighted(table)`

prop · L35–42

<!-- note:makeRng.weighted -->
<!-- /note -->

#### <a id="s-makeRng-some"></a>`makeRng.some(arr, n)`

prop · L43–47

<!-- note:makeRng.some -->
- L43 · `some: (arr, n) => {` — n distinct picks, order-stable
<!-- /note -->

#### <a id="s-makeRng-gauss"></a>`makeRng.gauss(mu, sd)`

prop · L48–51

<!-- note:makeRng.gauss -->
<!-- /note -->

### <a id="s-clamp"></a>`clamp(v, a, b)`

function · L55–55

- called by: [`generateRobot`](#s-generateRobot) ×5

<!-- note:clamp -->
<!-- /note -->

### <a id="s-r3"></a>`r3(v)`

function · L56–56

- called by: [`applyPartsMass`](#s-applyPartsMass) ×3 · [`genAttachments`](#s-genAttachments) ×3 · [`genAttachments>mount`](#s-genAttachments-mount) · [`genFinish`](#s-genFinish) ×2 · [`generateRobot`](#s-generateRobot) ×41

<!-- note:r3 -->
<!-- /note -->

### <a id="s-LOCOMOTION"></a>`LOCOMOTION`

const · **exported** · L58–58

<!-- note:LOCOMOTION -->
---------- taxonomy ----------
<!-- /note -->

### <a id="s-LEGGED"></a>`LEGGED`

const · **exported** · L59–59

<!-- note:LEGGED -->
<!-- /note -->

### <a id="s-FLYING"></a>`FLYING`

const · **exported** · L60–60

<!-- note:FLYING -->
<!-- /note -->

### <a id="s-HEAD_TYPES"></a>`HEAD_TYPES`

const · **exported** · L61–62

<!-- note:HEAD_TYPES -->
<!-- /note -->

### <a id="s-TORSO_SHAPES"></a>`TORSO_SHAPES`

const · **exported** · L63–63

<!-- note:TORSO_SHAPES -->
<!-- /note -->

### <a id="s-INSIGNIA"></a>`INSIGNIA`

const · **exported** · L64–64

<!-- note:INSIGNIA -->
<!-- /note -->

### <a id="s-OPTIC_LAYOUTS"></a>`OPTIC_LAYOUTS`

const · **exported** · L65–65

<!-- note:OPTIC_LAYOUTS -->
<!-- /note -->

### <a id="s-ANTENNA_TYPES"></a>`ANTENNA_TYPES`

const · **exported** · L66–66

<!-- note:ANTENNA_TYPES -->
<!-- /note -->

### <a id="s-HANDS"></a>`HANDS`

const · **exported** · L67–67

<!-- note:HANDS -->
<!-- /note -->

### <a id="s-SHOULDER_MOUNTS"></a>`SHOULDER_MOUNTS`

const · **exported** · L69–71

<!-- note:SHOULDER_MOUNTS -->
--- attachments ---
<!-- /note -->

### <a id="s-ARMOR_SLOTS"></a>`ARMOR_SLOTS`

const · **exported** · L72–72

<!-- note:ARMOR_SLOTS -->
<!-- /note -->

### <a id="s-ARMOR_STYLES"></a>`ARMOR_STYLES`

const · **exported** · L73–73

<!-- note:ARMOR_STYLES -->
<!-- /note -->

### <a id="s-LIMB_TYPES"></a>`LIMB_TYPES`

const · **exported** · L74–76

<!-- note:LIMB_TYPES -->
<!-- /note -->

### <a id="s-BACK_UNITS"></a>`BACK_UNITS`

const · **exported** · L77–79

<!-- note:BACK_UNITS -->
<!-- /note -->

### <a id="s-CHEST_MODULES"></a>`CHEST_MODULES`

const · **exported** · L80–80

<!-- note:CHEST_MODULES -->
<!-- /note -->

### <a id="s-HIP_MODULES"></a>`HIP_MODULES`

const · **exported** · L81–81

<!-- note:HIP_MODULES -->
<!-- /note -->

### <a id="s-PAYLOADS"></a>`PAYLOADS`

const · **exported** · L82–83

<!-- note:PAYLOADS -->
<!-- /note -->

### <a id="s-SIGHTS"></a>`SIGHTS`

const · **exported** · L84–84

<!-- note:SIGHTS -->
<!-- /note -->

### <a id="s-MUZZLES"></a>`MUZZLES`

const · **exported** · L85–85

<!-- note:MUZZLES -->
<!-- /note -->

### <a id="s-MAGS"></a>`MAGS`

const · **exported** · L86–86

<!-- note:MAGS -->
<!-- /note -->

### <a id="s-UNDERBARREL"></a>`UNDERBARREL`

const · **exported** · L87–87

<!-- note:UNDERBARREL -->
<!-- /note -->

### <a id="s-PALETTES"></a>`PALETTES`

const · **exported** · L89–110

<!-- note:PALETTES -->
<!-- /note -->

### <a id="s-ROLES"></a>`ROLES`

const · **exported** · L112–145

<!-- note:ROLES -->
---------- careers ----------
   Each role is a career path: what the unit is built for, what it is allowed to
   carry, and which chassis families the yard puts it on. `kit` is the career
   equipment pool the generator draws from — that is what makes a firefighter
   read as a firefighter rather than a repainted labourer.
<!-- /note -->

### <a id="s-ROLE_KEYS"></a>`ROLE_KEYS`

const · **exported** · L146–146

<!-- note:ROLE_KEYS -->
<!-- /note -->

### <a id="s-CAREER_CLASSES"></a>`CAREER_CLASSES`

const · **exported** · L147–147

<!-- note:CAREER_CLASSES -->
<!-- /note -->

### <a id="s-PREFIX"></a>`PREFIX`

const · L149–149

<!-- note:PREFIX -->
<!-- /note -->

### <a id="s-NICK_A"></a>`NICK_A`

const · L150–150

<!-- note:NICK_A -->
<!-- /note -->

### <a id="s-NICK_B"></a>`NICK_B`

const · L151–151

<!-- note:NICK_B -->
<!-- /note -->

### <a id="s-bias"></a>`bias(table, mults)`

function · **exported** · L153–160

- called by: [`generateRobot`](#s-generateRobot) ×3

<!-- note:bias -->
blend a weight table with a bias map — the draw COUNT never changes, so a
   world only shifts the odds, it does not desynchronise a seed
<!-- /note -->

### <a id="s-generateRobot"></a>`generateRobot(seed, opts=)`

function · **exported** · L162–414

- calls: [`applyPartsMass`](#s-applyPartsMass) · [`bias`](#s-bias) ×3 · [`clamp`](#s-clamp) ×5 · [`genAttachments`](#s-genAttachments) · [`genFinish`](#s-genFinish) · [`makeRng`](#s-makeRng) · [`r3`](#s-r3) ×41
- called by: [`robotDesign`](../crew/robots.js.md#s-robotDesign) _js/crew/robots.js_ · [`droneSpec`](../drones/dronespec.js.md#s-droneSpec) _js/drones/dronespec.js_ · [`generatePopulation`](world.js.md#s-generatePopulation) _js/robotgen/world.js_

<!-- note:generateRobot -->
---------- generation ----------

- L164 · `const W = opts.world || null;` — see src/world.js
- L173 · `if (W && W.loco && FLYING.has(loco) && !W.loco[loco]) loco = W.noAirDrive || 'hover';` — a rotor or a wing needs air. On a vacuum world the bias zeroes both, and an
  air career whose whole table zeroed out would otherwise fall back to it —
  so the frame is rebuilt on the world's own substitute drive instead.
- L176 · `const sizeK = W && W.sizeScale ? W.sizeScale : 1;` — an airframe is small even when the career normally is not
- L188 · `const torsoShape = opts.torso && TORSO_SHAPES.includes(opts.torso) ? opts.torso : rng.weig` — torso — on a flyer this is the fuselage / airframe pod
- L214 · `const headType = opts.head && HEAD_TYPES.includes(opts.head) ? opts.head : rng.weighted(bi` — head
- L262 · `let armCount = flying ? (rng.chance(0.15) ? 1 : 0) : rng.int(R.arms[0], R.arms[1]);` — arms
- L286 · `const L = { type: loco };` — locomotion
- L322 · `L.rotors = rng.weighted({ 3: 1, 4: 6, 6: 2, 8: 1 }) | 0;` — multirotor scout: booms out of the pod, rotors on top of them
- L337 · `L.wing = rng.weighted({ straight: 3, swept: 3, delta: 2, blended: 2, canard: 1 });` — small fixed-wing scout: a fuselage, a wing, a tail and one or two motors
- L359 · `const kitN = R.kitN ? rng.int(R.kitN[0], Math.min(R.kitN[1], R.kit.length)) : 1;` — career kit — drawn before the derived stats so mass can include it
- L362 · `const volume = torsoW * torsoD * torsoH * (1 + armorTier * 0.18);` — derived stats (no rng past this point except designation)
- L401 · `behavior: {` — hooks for NPC_Avatar / dialogue layers
<!-- /note -->

### <a id="s-applyPartsMass"></a>`applyPartsMass(spec)`

function · **exported** · L416–435

- calls: [`robotBom`](data/bom.js.md#s-robotBom) _js/robotgen/data/bom.js_ · [`r3`](#s-r3) ×3
- called by: [`generateRobot`](#s-generateRobot)

<!-- note:applyPartsMass -->
Re-weigh the unit from the parts manifest. No rng here: same spec in, same
   numbers out, and the sheet, the physics and the yard all agree.

- L429 · `S.energyKwh = bom.energyKwh;` — endurance is the pack the manifest actually carries divided by the draw the
  manifest actually pulls, at 85% usable — not a number picked to sound right
- L430 · `const gen = Math.max(0, bom.pwrW) / 1000;` — fuel cell / solar / isotope
- L431 · `const floor = Math.max(0.02, spec.flying ? S.drawKw * 0.35 : 0);` — a wing or an isotope trickle can stretch a shift, but nothing on a flyer
  pays for its own rotors: the net draw never falls below a third of the load
<!-- /note -->

### <a id="s-biasTable"></a>`biasTable(table, mults)`

function · L437–442

- called by: [`genAttachments`](#s-genAttachments) ×3 · [`genAttachments>limbPick`](#s-genAttachments-limbPick) · [`genAttachments>pickShoulder`](#s-genAttachments-pickShoulder)

<!-- note:biasTable -->
---------- attachments ----------
   Drawn after the base spec so an existing seed keeps the robot it had.
<!-- /note -->

### <a id="s-genAttachments"></a>`genAttachments(rng, spec, W)`

function · L443–647

- calls: [`biasTable`](#s-biasTable) ×3 · [`genAttachments>limbPick`](#s-genAttachments-limbPick) ×2 · [`genAttachments>mount`](#s-genAttachments-mount) ×2 · [`genAttachments>pickShoulder`](#s-genAttachments-pickShoulder) ×2 · [`r3`](#s-r3) ×3
- called by: [`generateRobot`](#s-generateRobot)

<!-- note:genAttachments -->
- L451 · `if (spec.flying) {` — --- flying units carry pods, not shoulder cannon ---
- L486 · `if (spec.locomotion.type === 'plane') {` — wing stores come in pairs on a plane that has wings to hang them from
- L515 · `const survey = role === 'survey' || role === 'scout' || role === 'recon' || role === 'insp` — --- ground / heavy frames ---
- L552 · `if (shoulder.L && shoulder.R && rng.chance(0.45)) shoulder.R = null;` — asymmetry reads better
- L554 · `const panels = [];` — additive armor: more panels the higher the tier, plus a wildcard or two
<!-- /note -->

#### <a id="s-genAttachments-pickShoulder"></a>`genAttachments>pickShoulder()`

function · L516–543

- calls: [`biasTable`](#s-biasTable)
- called by: [`genAttachments`](#s-genAttachments) ×2

<!-- note:genAttachments>pickShoulder -->
<!-- /note -->

#### <a id="s-genAttachments-mount"></a>`genAttachments>mount(type)`

function · L544–550

- calls: [`r3`](#s-r3)
- called by: [`genAttachments`](#s-genAttachments) ×2

<!-- note:genAttachments>mount -->
<!-- /note -->

#### <a id="s-genAttachments-limbPick"></a>`genAttachments>limbPick()`

function · L578–599

- calls: [`biasTable`](#s-biasTable)
- called by: [`genAttachments`](#s-genAttachments) ×2

<!-- note:genAttachments>limbPick -->
limb replacements now include the career tools, so a welder reads as a welder
<!-- /note -->

### <a id="s-genFinish"></a>`genFinish(rng, spec)`

function · L649–662

- calls: [`r3`](#s-r3) ×2
- called by: [`generateRobot`](#s-generateRobot)

<!-- note:genFinish -->
---------- finish ----------
   Surface treatment, drawn last so it never disturbs anything above it.
<!-- /note -->

### <a id="s-describe"></a>`describe(spec)`

function · **exported** · L664–688

- calls: [`kitLine`](#s-kitLine)

<!-- note:describe -->
---------- readable sheet ----------
<!-- /note -->

### <a id="s-kitLine"></a>`kitLine(spec)`

function · L690–710

- called by: [`describe`](#s-describe)

<!-- note:kitLine -->
<!-- /note -->

### <a id="s-randomSeed"></a>`randomSeed()`

function · **exported** · L712–714

<!-- note:randomSeed -->
<!-- /note -->
