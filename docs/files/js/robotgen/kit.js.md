# js/robotgen/kit.js

[index](../../../README.md) · 348 lines · 36 symbols · 1 imports · 1 importers

## About

<!-- note:@file -->
robotgen/src/kit.js — career hardware. Everything a unit carries BECAUSE OF
THE JOB rather than because of the frame: payload pods on a flyer, chest and
hip modules on a ground unit, head modules, and the extra shoulder mounts the
bigger catalogue added. Kept out of attach.js so the catalogue can keep
growing without the frame builder growing with it.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./parts.js` | `put`, `group` | [js/robotgen/parts.js](parts.js.md) |

## Imported by

- [js/robotgen/attach.js](attach.js.md) — `EXTRA_MOUNTS`, `buildKit`

## Exports

- [`EXTRA_MOUNTS`](#s-EXTRA_MOUNTS) · const — used by [js/robotgen/attach.js](attach.js.md)
- [`buildKit`](#s-buildKit) · function — used by [js/robotgen/attach.js](attach.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-gatling"></a>`gatling(THREE, K, spec, rig, g, m, dims)`

function · L3–16

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×2 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×4

<!-- note:gatling -->
---------- extra shoulder mounts ----------
<!-- /note -->

### <a id="s-mortar"></a>`mortar(THREE, K, spec, rig, g, m, dims)`

function · L17–29

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×2 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×3

<!-- note:mortar -->
<!-- /note -->

### <a id="s-grenadeLauncher"></a>`grenadeLauncher(THREE, K, spec, rig, g, m, dims)`

function · L30–38

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×4

<!-- note:grenadeLauncher -->
<!-- /note -->

### <a id="s-radarMount"></a>`radarMount(THREE, K, spec, rig, g, m, dims)`

function · L39–47

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×4

<!-- note:radarMount -->
<!-- /note -->

### <a id="s-spotlight"></a>`spotlight(THREE, K, spec, rig, g, m, dims)`

function · L48–59

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×4

<!-- note:spotlight -->
<!-- /note -->

### <a id="s-jammerPod"></a>`jammerPod(THREE, K, spec, rig, g, m, dims)`

function · L60–68

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×3

<!-- note:jammerPod -->
<!-- /note -->

### <a id="s-netGun"></a>`netGun(THREE, K, spec, rig, g, m, dims)`

function · L69–78

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×2

<!-- note:netGun -->
<!-- /note -->

### <a id="s-taserMount"></a>`taserMount(THREE, K, spec, rig, g, m, dims)`

function · L79–88

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×3

<!-- note:taserMount -->
<!-- /note -->

### <a id="s-grappleMount"></a>`grappleMount(THREE, K, spec, rig, g, m, dims)`

function · L89–97

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×4

<!-- note:grappleMount -->
<!-- /note -->

### <a id="s-toolArm"></a>`toolArm(THREE, K, spec, rig, g, m, dims)`

function · L98–112

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×4 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×5

<!-- note:toolArm -->
<!-- /note -->

### <a id="s-ammoPack"></a>`ammoPack(THREE, K, spec, rig, g, m, dims)`

function · L113–118

- calls: [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×3

<!-- note:ammoPack -->
<!-- /note -->

### <a id="s-relayMast"></a>`relayMast(THREE, K, spec, rig, g, m, dims)`

function · L119–128

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×2 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×4

<!-- note:relayMast -->
<!-- /note -->

### <a id="s-hailer"></a>`hailer(THREE, K, spec, rig, g, m, dims)`

function · L129–136

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×3

<!-- note:hailer -->
<!-- /note -->

### <a id="s-EXTRA_MOUNTS"></a>`EXTRA_MOUNTS`

const · **exported** · L138–142

<!-- note:EXTRA_MOUNTS -->
<!-- /note -->

### <a id="s-podShell"></a>`podShell(THREE, K, spec, rig, parent, w, h, d, name)`

function · L144–147

- calls: [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×2
- called by: [`PODS.tank`](#s-PODS-tank)

<!-- note:podShell -->
---------- flyer payload pods ----------
<!-- /note -->

### <a id="s-PODS"></a>`PODS`

const · L148–240

<!-- note:PODS -->
<!-- /note -->

#### <a id="s-PODS-camera"></a>`PODS.camera(THREE, K, spec, rig, g, s)`

prop · L149–155

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×3

<!-- note:PODS.camera -->
<!-- /note -->

#### <a id="s-PODS-mapping"></a>`PODS.mapping(THREE, K, spec, rig, g, s)`

prop · L156–163

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×4

<!-- note:PODS.mapping -->
<!-- /note -->

#### <a id="s-PODS-thermal"></a>`PODS.thermal(THREE, K, spec, rig, g, s)`

prop · L164–167

- calls: [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×2

<!-- note:PODS.thermal -->
<!-- /note -->

#### <a id="s-PODS-relay"></a>`PODS.relay(THREE, K, spec, rig, g, s)`

prop · L168–172

- calls: [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×3

<!-- note:PODS.relay -->
<!-- /note -->

#### <a id="s-PODS-tank"></a>`PODS.tank(THREE, K, spec, rig, g, s)`

prop · L173–177

- calls: [`podShell`](#s-podShell) · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×2

<!-- note:PODS.tank -->
<!-- /note -->

#### <a id="s-PODS-cargo"></a>`PODS.cargo(THREE, K, spec, rig, g, s)`

prop · L178–182

- calls: [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×3

<!-- note:PODS.cargo -->
<!-- /note -->

#### <a id="s-PODS-munition"></a>`PODS.munition(THREE, K, spec, rig, g, s, p)`

prop · L183–190

- calls: [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×3

<!-- note:PODS.munition -->
<!-- /note -->

#### <a id="s-PODS-hailer"></a>`PODS.hailer(THREE, K, spec, rig, g, s)`

prop · L191–194

- calls: [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×2

<!-- note:PODS.hailer -->
<!-- /note -->

#### <a id="s-PODS-chute"></a>`PODS.chute(THREE, K, spec, rig, g, s)`

prop · L195–198

- calls: [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×2

<!-- note:PODS.chute -->
<!-- /note -->

#### <a id="s-PODS-sampler"></a>`PODS.sampler(THREE, K, spec, rig, g, s)`

prop · L199–206

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×3

<!-- note:PODS.sampler -->
<!-- /note -->

#### <a id="s-PODS-chem"></a>`PODS.chem(THREE, K, spec, rig, g, s)`

prop · L207–211

- calls: [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×3

<!-- note:PODS.chem -->
<!-- /note -->

#### <a id="s-PODS-rad"></a>`PODS.rad(THREE, K, spec, rig, g, s)`

prop · L212–216

- calls: [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×3

<!-- note:PODS.rad -->
<!-- /note -->

#### <a id="s-PODS-gpr"></a>`PODS.gpr(THREE, K, spec, rig, g, s)`

prop · L217–220

- calls: [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×2

<!-- note:PODS.gpr -->
<!-- /note -->

#### <a id="s-PODS-jammer"></a>`PODS.jammer(THREE, K, spec, rig, g, s)`

prop · L221–225

- calls: [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×2

<!-- note:PODS.jammer -->
<!-- /note -->

#### <a id="s-PODS-dronebay"></a>`PODS.dronebay(THREE, K, spec, rig, g, s)`

prop · L226–231

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×2

<!-- note:PODS.dronebay -->
<!-- /note -->

#### <a id="s-PODS-spotlight"></a>`PODS.spotlight(THREE, K, spec, rig, g, s)`

prop · L232–239

- calls: [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×3

<!-- note:PODS.spotlight -->
<!-- /note -->

### <a id="s-buildChest"></a>`buildChest(THREE, K, spec, rig, ctx)`

function · L242–274

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×2 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×15
- called by: [`buildKit`](#s-buildKit)

<!-- note:buildChest -->
---------- chest, hip and head modules ----------
<!-- /note -->

### <a id="s-buildHips"></a>`buildHips(THREE, K, spec, rig, ctx)`

function · L276–300

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×10
- called by: [`buildKit`](#s-buildKit)

<!-- note:buildHips -->
<!-- /note -->

### <a id="s-buildHeadModules"></a>`buildHeadModules(THREE, K, spec, rig)`

function · L302–323

- calls: [`group`](parts.js.md#s-group) _js/robotgen/parts.js_ ×2 · [`put`](parts.js.md#s-put) _js/robotgen/parts.js_ ×7
- called by: [`buildKit`](#s-buildKit)

<!-- note:buildHeadModules -->
<!-- /note -->

### <a id="s-buildKit"></a>`buildKit(THREE, K, spec, rig, ctx)`

function · **exported** · L325–348

- calls: [`buildChest`](#s-buildChest) · [`buildHeadModules`](#s-buildHeadModules) · [`buildHips`](#s-buildHips) · [`group`](parts.js.md#s-group) _js/robotgen/parts.js_
- called by: [`buildAttachments`](attach.js.md#s-buildAttachments) _js/robotgen/attach.js_

<!-- note:buildKit -->
---------- entry point ----------

- L331 · `const dims = ctx.dims;` — flyer stores, hung off the station the spec asked for
<!-- /note -->
