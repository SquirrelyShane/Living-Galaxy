# js/ui/hangar.js

[index](../../../README.md) · 112 lines · 10 symbols · 0 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — the hangar: choose a system, then a pilot. (0.3.74)

For a signed-in, verified account on living-galaxy.com the start card is
this, in this order:

  1. THE SYSTEM — Sol (the live, shared sky), a random system, or a named one
     a friend gave you. The backdrop grows the system you pick.
  2. THE PILOTS the account keeps IN THAT SYSTEM — callsign, career, purse,
     when last flown — each with FLY. Only metadata is listed (GET /api/save,
     a few hundred bytes); the pilot you pick is the only one fetched.
  3. NEW PILOT — up to MAX_PILOTS an account; made in the system chosen above.

Guests never see it: they fly in Sol and are not kept (js/net/account.js
eraseGuest). A page with no site behind it keeps the old FLY AS / CREATE.

No DOM at import; mountHangar() builds into the element it is given.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/ui/hud.js](hud.js.md) — `mountHangar`

## Exports

- [`SOL_ALIASES`](#s-SOL_ALIASES) · const — **no importer in scanned roots**
- [`skyOf`](#s-skyOf) · function — **no importer in scanned roots**
- [`pilotsBySky`](#s-pilotsBySky) · function — **no importer in scanned roots**
- [`mountHangar`](#s-mountHangar) · function — used by [js/ui/hud.js](hud.js.md)

## Effects

- **dom.create** — `‹tag›` (mountHangar>el:26)
- **event.listen** — `click on b → fn` (mountHangar>btn:27)

## Symbols

### <a id="s-SOL_ALIASES"></a>`SOL_ALIASES`

const · **exported** · L1–1

<!-- note:SOL_ALIASES -->
<!-- /note -->

### <a id="s-skyOf"></a>`skyOf(p)`

function · **exported** · L2–2

- called by: [`pilotsBySky`](#s-pilotsBySky)

<!-- note:skyOf -->
<!-- /note -->

### <a id="s-pilotsBySky"></a>`pilotsBySky(pilots)`

function · **exported** · L4–12

- calls: [`skyOf`](#s-skyOf)
- called by: [`mountHangar>render`](#s-mountHangar-render)

<!-- note:pilotsBySky -->
Pilots grouped by the system they fly in: Map(sky → [pilot]).
<!-- /note -->

### <a id="s-ago"></a>`ago(t)`

function · L14–21

- called by: [`mountHangar>render`](#s-mountHangar-render)

<!-- note:ago -->
<!-- /note -->

### <a id="s-mountHangar"></a>`mountHangar(opts)`

function · **exported** · L23–112

- calls: [`mountHangar>render`](#s-mountHangar-render)
- called by: [`mountHud>setMode`](hud.js.md#s-mountHud-setMode) _js/ui/hud.js_

<!-- note:mountHangar -->
@param opts.root       element to build into
@param opts.account    js/net/account.js `account`
@param opts.maxPilots  MAX_PILOTS
@param opts.system     () => current seed
@param opts.setSystem  (seed) => void   — also grows the backdrop
@param opts.rollSeed   () => seed
@param opts.clean      (text) => seed   — a typed sky name, sanitised
@param opts.describe   (seed) => one-line system summary
@param opts.name       (seed) => system name
@param opts.onFly      async (pilot, seed) => void
@param opts.onNew      (seed) => void
@param opts.onDelete   async (pilot) => boolean
<!-- /note -->

#### <a id="s-mountHangar-el"></a>`mountHangar>el(tag, cls, text)`

function · L26–26

- called by: [`mountHangar>btn`](#s-mountHangar-btn) · [`mountHangar>render`](#s-mountHangar-render) ×17
- effects: dom.create `‹tag›`

<!-- note:mountHangar>el -->
<!-- /note -->

#### <a id="s-mountHangar-btn"></a>`mountHangar>btn(cls, text, fn)`

function · L27–27

- calls: [`mountHangar>el`](#s-mountHangar-el)
- called by: [`mountHangar>render`](#s-mountHangar-render) ×7
- effects: event.listen `click`

<!-- note:mountHangar>btn -->
<!-- /note -->

#### <a id="s-mountHangar-render"></a>`mountHangar>render()`

function · L31–101

- calls: [`ago`](#s-ago) · [`mountHangar>btn`](#s-mountHangar-btn) ×7 · [`mountHangar>el`](#s-mountHangar-el) ×17 · [`mountHangar>pick`](#s-mountHangar-pick) ×4 · [`mountHangar>render`](#s-mountHangar-render) ×2 · [`pilotsBySky`](#s-pilotsBySky)
- called by: [`mountHangar`](#s-mountHangar) · [`mountHangar.setNote`](#s-mountHangar-setNote) · [`mountHangar>pick`](#s-mountHangar-pick) · [`mountHangar>render`](#s-mountHangar-render) ×2

<!-- note:mountHangar>render -->
- L37 · `root.append(el("p", "hangar-step", "1 · System"));` — 1 · system
- L56 · `const here = groups.get(seed) ?? [];` — 2 · pilots here
- L57 · `const loading = opts.account.pilots == null;` — 0.3.75: the list is on its way
- L86 · `const others = [...groups.entries()].filter(([k]) => k !== seed);` — elsewhere: a quick way over to the systems the other pilots fly in
- L94 · `const full = !loading && pilots.length >= opts.maxPilots;` — 3 · new pilot
<!-- /note -->

#### <a id="s-mountHangar-pick"></a>`mountHangar>pick(seed)`

function · L103–108

- calls: [`mountHangar>render`](#s-mountHangar-render)
- called by: [`mountHangar>render`](#s-mountHangar-render) ×4

<!-- note:mountHangar>pick -->
<!-- /note -->

#### <a id="s-mountHangar-setNote"></a>`mountHangar.setNote(t)`

prop · L111–111

- calls: [`mountHangar>render`](#s-mountHangar-render)

<!-- note:mountHangar.setNote -->
<!-- /note -->
