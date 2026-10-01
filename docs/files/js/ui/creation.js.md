# js/ui/creation.js

[index](../../../README.md) · 412 lines · 27 symbols · 9 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — pilot creation.

Four steps between the callsign and the sky: race, career, corporation,
destination. The 3D backdrop keeps rendering the whole time, which is the
real reason this screen exists — every world's surface is being painted a
frame at a time while you read about the Vantari.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../crew/races.js` | `RACES`, `raceById`, `traitLines`, `traitsOf` | [js/crew/races.js](../crew/races.js.md) |
| 2 | `../careers/skills.js` | `SKILLS` | [js/careers/skills.js](../careers/skills.js.md) |
| 3 | `./glyphs.js` | `compileBlock` | [js/ui/glyphs.js](glyphs.js.md) |
| 4 | `../corp/corps.js` | `byTier`, `buildCorps`, `corps` | [js/corp/corps.js](../corp/corps.js.md) |
| 5 | `../flight/pilot.js` | `careerCatalog`, `makePilot` | [js/flight/pilot.js](../flight/pilot.js.md) |
| 6 | `../economy/materials.js` | `SECTORS` | [js/economy/materials.js](../economy/materials.js.md) |
| 7 | `../core/profile.js` | `startRun` | [js/core/profile.js](../core/profile.js.md) |
| 8 | `../corp/company.js` | `resetCompany` | [js/corp/company.js](../corp/company.js.md) |
| 9 | `../npc/cradle.js` | `releaseEmployed` | [js/npc/cradle.js](../npc/cradle.js.md) |

## Imported by

- [js/ui/hud.js](hud.js.md) — `mountCreation`

## Exports

- [`mountCreation`](#s-mountCreation) · function — used by [js/ui/hud.js](hud.js.md)

## Effects

- **dom.create** — `‹tag›` (el:14) · `input` (mountCreation>renderSky:280, mountCreation.show:380)
- **dom.id** — `‹id›` ($:21) · `create` (mountCreation:25) · `create-body` (mountCreation:26) · `create-steps` (mountCreation:27) · `create-sum` (mountCreation:28) · `create-back` (mountCreation:29) · `create-next` (mountCreation:30) · `callsign` (mountCreation>nameOk:60, mountCreation>finish:355, mountCreation.show:388, mountCreation.show:390, mountCreation.show:396) · `create-callsign` (mountCreation>needName:62) · `create-title` (mountCreation.show:377) · `load-fill` (mountCreation.progress:408) · `load-text` (mountCreation.progress:409)
- **dom.query** — `button` (mountCreation>setStep:42, mountCreation>render:346) · `button[data-step]` (mountCreation:52)
- **event.dispatch** — `input on c` (mountCreation.show:392)
- **event.listen** — `click on b → (inline)` (mountCreation:53, mountCreation>renderRace:84, mountCreation>renderCareer:116, mountCreation>renderCorp:188) · `click on backBtn → (inline)` (mountCreation:55) · `click on nextBtn → (inline)` (mountCreation:67) · `click on indie → (inline)` (mountCreation>renderCorp:202) · `click on go → (inline)` (mountCreation>renderSky:228) · `click on sol → (inline)` (mountCreation>renderSky:249) · `click on rnd → (inline)` (mountCreation>renderSky:253) · `click on launch → (inline)` (mountCreation>renderSky:272) · `click on join → (inline)` (mountCreation>renderSky:287) · `input on f → (inline)` (mountCreation.show:389)
- **timer** — `setTimeout` (mountCreation>needName:65, mountCreation.show:395)

## Symbols

### <a id="s-STEPS"></a>`STEPS`

const · L11–11

<!-- note:STEPS -->
<!-- /note -->

### <a id="s-el"></a>`el(tag, cls, text)`

function · L13–18

- called by: [`mountCreation>detail`](#s-mountCreation-detail) ×2 · [`mountCreation>renderCareer`](#s-mountCreation-renderCareer) ×19 · [`mountCreation>renderCompile`](#s-mountCreation-renderCompile) · [`mountCreation>renderCorp`](#s-mountCreation-renderCorp) ×15 · [`mountCreation>renderRace`](#s-mountCreation-renderRace) ×12 · [`mountCreation>renderSky`](#s-mountCreation-renderSky) ×20
- effects: dom.create `‹tag›`

<!-- note:el -->
<!-- /note -->

### <a id="s-S"></a>`$(id)`

function · L20–22

- called by: [`mountCreation`](#s-mountCreation) ×6 · [`mountCreation.progress`](#s-mountCreation-progress) ×2 · [`mountCreation.show`](#s-mountCreation-show) ×4 · [`mountCreation>finish`](#s-mountCreation-finish) · [`mountCreation>nameOk`](#s-mountCreation-nameOk) · [`mountCreation>needName`](#s-mountCreation-needName)
- effects: dom.id `‹id›`

<!-- note:$ -->
<!-- /note -->

### <a id="s-mountCreation"></a>`mountCreation(opts)`

function · **exported** · L24–412

- calls: [`careerCatalog`](../flight/pilot.js.md#s-careerCatalog) _js/flight/pilot.js_ · [`$`](#s-S) ×6 · [`mountCreation>close`](#s-mountCreation-close) · [`mountCreation>nameOk`](#s-mountCreation-nameOk) · [`mountCreation>needName`](#s-mountCreation-needName) · [`mountCreation>setStep`](#s-mountCreation-setStep) ×3
- via [js/flight/pilot.js](../flight/pilot.js.md): `careerCatalog.sort`
- called by: [`mountHud`](hud.js.md#s-mountHud) _js/ui/hud.js_
- effects: dom.id `create` · dom.id `create-body` · dom.id `create-steps` · dom.id `create-sum` · dom.id `create-back` · dom.id `create-next` · dom.query `button[data-step]` · event.listen `click`

<!-- note:mountCreation -->
@param opts.onLaunch  (seed) => void
@param opts.fixedSky  () => seed | null — 0.3.74: the system is already chosen (guest: Sol; hangar: its pick)
@param opts.onSeed    (seed) => void   preview a sky without launching
@param opts.rollSeed  () => string
@param opts.textureProgress () => ({done, total})

- L59 · `let askName = false;` — 0.3.75: a new pilot from the hangar is NAMED here, on the record, not on the start card
- L296 · `let compileKey = "";` — The record compiling as you choose: every pick adds rows, the bars fill
  in the machine's own script, and the sigil settles when the bars do.
<!-- /note -->

#### <a id="s-mountCreation-isOpenCareer"></a>`mountCreation>isOpenCareer(id)`

function · L37–37

- called by: [`mountCreation.show`](#s-mountCreation-show) · [`mountCreation>finish`](#s-mountCreation-finish) · [`mountCreation>stepDone`](#s-mountCreation-stepDone)

<!-- note:mountCreation>isOpenCareer -->
<!-- /note -->

#### <a id="s-mountCreation-firstOpen"></a>`mountCreation>firstOpen()`

function · L38–38

- called by: [`mountCreation>finish`](#s-mountCreation-finish)

<!-- note:mountCreation>firstOpen -->
<!-- /note -->

#### <a id="s-mountCreation-setStep"></a>`mountCreation>setStep(n)`

function · L40–47

- calls: [`mountCreation>render`](#s-mountCreation-render) · [`mountCreation>stepDone`](#s-mountCreation-stepDone)
- called by: [`mountCreation`](#s-mountCreation) ×3 · [`mountCreation.show`](#s-mountCreation-show)
- effects: dom.query `button`

<!-- note:mountCreation>setStep -->
<!-- /note -->

#### <a id="s-mountCreation-stepDone"></a>`mountCreation>stepDone(i)`

function · L49–50

- calls: [`mountCreation>isOpenCareer`](#s-mountCreation-isOpenCareer)
- called by: [`mountCreation>render`](#s-mountCreation-render) ×2 · [`mountCreation>setStep`](#s-mountCreation-setStep)

<!-- note:mountCreation>stepDone -->
<!-- /note -->

#### <a id="s-mountCreation-nameOk"></a>`mountCreation>nameOk()`

function · L60–60

- calls: [`$`](#s-S)
- called by: [`mountCreation`](#s-mountCreation) · [`mountCreation>finish`](#s-mountCreation-finish)
- effects: dom.id `callsign`

<!-- note:mountCreation>nameOk -->
<!-- /note -->

#### <a id="s-mountCreation-needName"></a>`mountCreation>needName()`

function · L61–66

- calls: [`$`](#s-S)
- called by: [`mountCreation`](#s-mountCreation) · [`mountCreation>finish`](#s-mountCreation-finish)
- effects: dom.id `create-callsign` · timer `setTimeout`

<!-- note:mountCreation>needName -->
<!-- /note -->

#### <a id="s-mountCreation-detail"></a>`mountCreation>detail(title, ...kids)`

function · L69–74

- calls: [`el`](#s-el) ×2
- called by: [`mountCreation>renderCorp`](#s-mountCreation-renderCorp) · [`mountCreation>renderRace`](#s-mountCreation-renderRace)

<!-- note:mountCreation>detail -->
---- panels ----
<!-- /note -->

#### <a id="s-mountCreation-renderRace"></a>`mountCreation>renderRace()`

function · L76–105

- calls: [`raceById`](../crew/races.js.md#s-raceById) _js/crew/races.js_ · [`traitLines`](../crew/races.js.md#s-traitLines) _js/crew/races.js_ · [`el`](#s-el) ×12 · [`mountCreation>detail`](#s-mountCreation-detail) · [`mountCreation>render`](#s-mountCreation-render)
- called by: [`mountCreation>render`](#s-mountCreation-render)
- effects: event.listen `click`

<!-- note:mountCreation>renderRace -->
<!-- /note -->

#### <a id="s-mountCreation-renderCareer"></a>`mountCreation>renderCareer()`

function · L107–158

- calls: [`el`](#s-el) ×19 · [`mountCreation>render`](#s-mountCreation-render)
- called by: [`mountCreation>render`](#s-mountCreation-render)
- effects: event.listen `click`

<!-- note:mountCreation>renderCareer -->
<!-- /note -->

#### <a id="s-mountCreation-renderCorp"></a>`mountCreation>renderCorp()`

function · L160–214

- calls: [`byTier`](../corp/corps.js.md#s-byTier) _js/corp/corps.js_ · [`el`](#s-el) ×15 · [`mountCreation>detail`](#s-mountCreation-detail) · [`mountCreation>render`](#s-mountCreation-render) ×2
- via [js/corp/corps.js](../corp/corps.js.md): `corps.find`
- called by: [`mountCreation>render`](#s-mountCreation-render)
- effects: event.listen `click`

<!-- note:mountCreation>renderCorp -->
<!-- /note -->

#### <a id="s-mountCreation-renderSky"></a>`mountCreation>renderSky()`

function · L216–294

- calls: [`el`](#s-el) ×20 · [`mountCreation>finish`](#s-mountCreation-finish) ×4 · [`mountCreation>render`](#s-mountCreation-render)
- called by: [`mountCreation>render`](#s-mountCreation-render)
- effects: event.listen `click` · dom.create `input`

<!-- note:mountCreation>renderSky -->
- L217 · `const fixed = opts.fixedSky?.() ?? null;` — 0.3.74 — the system is already decided: a guest flies in Sol, and a
  signed-in pilot is made in the system the hangar chose. One button.
- L255 · `choice.corpId = "";` — the fifteen outfits are grown from the seed — the one picked in step 3
  does not exist in the new sky, so the flag goes back to Independent
<!-- /note -->

#### <a id="s-mountCreation-renderCompile"></a>`mountCreation>renderCompile()`

function · L297–323

- calls: [`raceById`](../crew/races.js.md#s-raceById) _js/crew/races.js_ · [`traitsOf`](../crew/races.js.md#s-traitsOf) _js/crew/races.js_ · [`el`](#s-el) · [`compileBlock`](glyphs.js.md#s-compileBlock) _js/ui/glyphs.js_
- called by: [`mountCreation>render`](#s-mountCreation-render)

<!-- note:mountCreation>renderCompile -->
- L320 · `if (key === compileKey) return;` — same record: keep the animation running across re-renders
<!-- /note -->

##### <a id="s-mountCreation-renderCompile-format"></a>`mountCreation>renderCompile.format()`

prop · L302–302

<!-- note:mountCreation>renderCompile.format -->
<!-- /note -->

##### <a id="s-mountCreation-renderCompile-format-2"></a>`mountCreation>renderCompile.format~2()`

prop · L305–305

<!-- note:mountCreation>renderCompile.format~2 -->
<!-- /note -->

##### <a id="s-mountCreation-renderCompile-format-3"></a>`mountCreation>renderCompile.format~3()`

prop · L310–310

<!-- note:mountCreation>renderCompile.format~3 -->
<!-- /note -->

##### <a id="s-mountCreation-renderCompile-format-4"></a>`mountCreation>renderCompile.format~4()`

prop · L311–311

<!-- note:mountCreation>renderCompile.format~4 -->
<!-- /note -->

##### <a id="s-mountCreation-renderCompile-format-5"></a>`mountCreation>renderCompile.format~5()`

prop · L314–314

<!-- note:mountCreation>renderCompile.format~5 -->
<!-- /note -->

#### <a id="s-mountCreation-render"></a>`mountCreation>render()`

function · L326–349

- calls: [`raceById`](../crew/races.js.md#s-raceById) _js/crew/races.js_ · [`mountCreation>renderCareer`](#s-mountCreation-renderCareer) · [`mountCreation>renderCompile`](#s-mountCreation-renderCompile) · [`mountCreation>renderCorp`](#s-mountCreation-renderCorp) · [`mountCreation>renderRace`](#s-mountCreation-renderRace) · [`mountCreation>renderSky`](#s-mountCreation-renderSky) · [`mountCreation>stepDone`](#s-mountCreation-stepDone) ×2
- via [js/corp/corps.js](../corp/corps.js.md): `corps.find`
- called by: [`mountCreation>renderCareer`](#s-mountCreation-renderCareer) · [`mountCreation>renderCorp`](#s-mountCreation-renderCorp) ×2 · [`mountCreation>renderRace`](#s-mountCreation-renderRace) · [`mountCreation>renderSky`](#s-mountCreation-renderSky) · [`mountCreation>setStep`](#s-mountCreation-setStep)
- effects: dom.query `button`

<!-- note:mountCreation>render -->
<!-- /note -->

#### <a id="s-mountCreation-finish"></a>`mountCreation>finish(seed)`

function · L351–364

- calls: [`startRun`](../core/profile.js.md#s-startRun) _js/core/profile.js_ · [`resetCompany`](../corp/company.js.md#s-resetCompany) _js/corp/company.js_ · [`makePilot`](../flight/pilot.js.md#s-makePilot) _js/flight/pilot.js_ · [`releaseEmployed`](../npc/cradle.js.md#s-releaseEmployed) _js/npc/cradle.js_ · [`$`](#s-S) · [`mountCreation>close`](#s-mountCreation-close) · [`mountCreation>firstOpen`](#s-mountCreation-firstOpen) · [`mountCreation>isOpenCareer`](#s-mountCreation-isOpenCareer) · [`mountCreation>nameOk`](#s-mountCreation-nameOk) · [`mountCreation>needName`](#s-mountCreation-needName)
- called by: [`mountCreation>renderSky`](#s-mountCreation-renderSky) ×4
- effects: dom.id `callsign`

<!-- note:mountCreation>finish -->
- L357 · `releaseEmployed(null, "Paid off when their pilot retired");` — A NEW PILOT IS A NEW RUN. This is the only place in the game that knows
  that for certain, so it is the only place that can say it.
  
  Without this the last pilot's corporation was still on the books —
  name, treasury, board and all — their fleet was still parked, their
  callsign was still on the save, and their crew were still filed as
  aboard a ship that no longer existed. A page refresh brought every bit
  of it back, because all of it was in localStorage and nothing ever swept
  it. js/core/profile.js holds the list of what is a run's and what is the
  device's; this clears the first and leaves the second.
  
  Order matters: release the old crew BEFORE the storage sweep (the sweep
  does not touch the CRADLE, but the in-memory reset below is what makes
  the release stick), and start the run BEFORE makePilot, so nothing the
  new pilot writes is swept out behind them.
<!-- /note -->

#### <a id="s-mountCreation-close"></a>`mountCreation>close()`

function · L366–370

- called by: [`mountCreation`](#s-mountCreation) · [`mountCreation>finish`](#s-mountCreation-finish)

<!-- note:mountCreation>close -->
<!-- /note -->

#### <a id="s-mountCreation-show"></a>`mountCreation.show(o=)`

prop · L373–403

- calls: [`buildCorps`](../corp/corps.js.md#s-buildCorps) _js/corp/corps.js_ · [`$`](#s-S) ×4 · [`mountCreation>isOpenCareer`](#s-mountCreation-isOpenCareer) · [`mountCreation>setStep`](#s-mountCreation-setStep)
- effects: dom.id `create-title` · dom.create `input` · dom.id `callsign` · event.listen `input` · event.dispatch `input` · timer `setTimeout`

<!-- note:mountCreation.show -->
show({ askName }) — askName: the callsign is typed here (hangar NEW PILOT), not taken from the start card

- L392 · `c.dispatchEvent(new Event("input", { bubbles: true }));` — the start card's own listener keeps the store's callsign in step
- L397 · `if (!corps.length) buildCorps(Math.random);` — Corporations belong to the sky that is loaded behind this screen.
- L401 · `if (choice.corpId === null) choice.corpId = "";` — Nobody starts owing a corporation anything. Independent is the honest
  default so the step is never a dead end with a dead Next button.
<!-- /note -->

#### <a id="s-mountCreation-isOpen"></a>`mountCreation.isOpen()`

prop · L404–404

<!-- note:mountCreation.isOpen -->
<!-- /note -->

#### <a id="s-mountCreation-progress"></a>`mountCreation.progress(done, total)`

prop · L405–410

- calls: [`$`](#s-S) ×2
- effects: dom.id `load-fill` · dom.id `load-text`

<!-- note:mountCreation.progress -->
Called from the HUD paint so the loader reads true.
<!-- /note -->
