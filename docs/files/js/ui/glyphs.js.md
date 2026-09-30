# js/ui/glyphs.js

[index](../../../README.md) · 160 lines · 15 symbols · 0 imports · 5 importers

## About

<!-- note:@file -->
LIVING GALAXY — the glyph kit.

A "hieroglyphic" that the interface writes in: strings drawn from three
unicode blocks every phone ships glyphs for (braille patterns, geometric
shapes, box drawing), chosen by a seeded generator so the same person or
hull always writes the same sigil. Progress bars are written in it too —
a bar filling is the machine compiling a record, cell by cell, the lead
cell flickering through candidates before it settles.

No dependencies, no layout opinions: it renders into whatever element it
is given and animates with requestAnimationFrame when there is a window.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/console/panels/corp-town.js](../console/panels/corp-town.js.md) — `sigil`
- [js/console/panels/corp.js](../console/panels/corp.js.md) — `sigil`
- [js/npc/speech.js](../npc/speech.js.md) — `mulberry`
- [js/station/deckhall.js](../station/deckhall.js.md) — `glyphBar`, `sigil`
- [js/ui/creation.js](creation.js.md) — `compileBlock`

## Exports

- [`ALPHABETS`](#s-ALPHABETS) · const — **no importer in scanned roots**
- [`mulberry`](#s-mulberry) · function — used by [js/npc/speech.js](../npc/speech.js.md)
- [`glyphString`](#s-glyphString) · function — **no importer in scanned roots**
- [`sigil`](#s-sigil) · function — used by [js/console/panels/corp-town.js](../console/panels/corp-town.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), [js/station/deckhall.js](../station/deckhall.js.md)
- [`glyphBar`](#s-glyphBar) · function — used by [js/station/deckhall.js](../station/deckhall.js.md)
- [`compileBlock`](#s-compileBlock) · function — used by [js/ui/creation.js](creation.js.md)

## Effects

- **dom.create** — `div` (glyphBar:51, glyphBar:59, compileBlock:122, compileBlock:132) · `span` (glyphBar:53, glyphBar:56, glyphBar:63)
- **dom.query** — `.compile-title` (compileBlock:125) · `.compile-sigil` (compileBlock:128)
- **timer** — `requestAnimationFrame` (glyphBar>step:101, glyphBar>set:111, compileBlock>spin:155) · `setTimeout` (compileBlock:137, compileBlock>spin:155)

## Symbols

### <a id="s-BRAILLE"></a>`BRAILLE`

const · L1–1

<!-- note:BRAILLE -->
<!-- /note -->

### <a id="s-GEO"></a>`GEO`

const · L2–2

<!-- note:GEO -->
<!-- /note -->

### <a id="s-BOX"></a>`BOX`

const · L3–3

<!-- note:BOX -->
<!-- /note -->

### <a id="s-ALPHABETS"></a>`ALPHABETS`

const · **exported** · L4–4

<!-- note:ALPHABETS -->
<!-- /note -->

### <a id="s-mulberry"></a>`mulberry(seedStr)`

function · **exported** · L6–17

- called by: [`flowPilot`](../npc/speech.js.md#s-flowPilot) _js/npc/speech.js_ · [`compileBlock`](#s-compileBlock) · [`glyphBar`](#s-glyphBar) · [`glyphString`](#s-glyphString) · [`sigil`](#s-sigil)

<!-- note:mulberry -->
<!-- /note -->

### <a id="s-pickFrom"></a>`pickFrom(alpha, rnd)`

function · L19–22

- called by: [`compileBlock>spin`](#s-compileBlock-spin) · [`glyphBar>paint`](#s-glyphBar-paint) · [`glyphString`](#s-glyphString) · [`sigil`](#s-sigil)

<!-- note:pickFrom -->
<!-- /note -->

### <a id="s-glyphString"></a>`glyphString(seed, n=, alpha=)`

function · **exported** · L24–30

- calls: [`mulberry`](#s-mulberry) · [`pickFrom`](#s-pickFrom)
- called by: [`glyphBar`](#s-glyphBar)

<!-- note:glyphString -->
A deterministic string of `n` glyphs for a seed. `alpha` names an ALPHABETS entry.
<!-- /note -->

### <a id="s-sigil"></a>`sigil(seed)`

function · **exported** · L32–39

- calls: [`mulberry`](#s-mulberry) · [`pickFrom`](#s-pickFrom)
- called by: [`lineCard`](../console/panels/corp-town.js.md#s-lineCard) _js/console/panels/corp-town.js_ · [`mountCompany`](../console/panels/corp.js.md#s-mountCompany) _js/console/panels/corp.js_ · [`mountPilot`](../console/panels/corp.js.md#s-mountPilot) _js/console/panels/corp.js_ · [`crewSection`](../station/deckhall.js.md#s-crewSection) _js/station/deckhall.js_ · [`floorSection`](../station/deckhall.js.md#s-floorSection) _js/station/deckhall.js_ · [`hallSection`](../station/deckhall.js.md#s-hallSection) _js/station/deckhall.js_ · [`compileBlock`](#s-compileBlock) · [`glyphBar`](#s-glyphBar)

<!-- note:sigil -->
The short mark a record signs with: 3–4 glyphs, mixed blocks, stable per seed.
<!-- /note -->

### <a id="s-CELLS_DEFAULT"></a>`CELLS_DEFAULT`

const · L41–41

<!-- note:CELLS_DEFAULT -->
---- glyph bar ------------------------------------------------------------
&lt;div class="gbar">
  &lt;div class="gbar-head">&lt;span class="gbar-label">…&lt;/span>&lt;span class="gbar-val">…&lt;/span>&lt;/div>
  &lt;div class="gbar-track">&lt;span class="gcell lit">⠿&lt;/span>…&lt;/div>
&lt;/div>
<!-- /note -->

### <a id="s-glyphBar"></a>`glyphBar(host, spec=)`

function · **exported** · L43–117

- calls: [`glyphBar>paint`](#s-glyphBar-paint) · [`glyphBar>set`](#s-glyphBar-set) ×2 · [`glyphString`](#s-glyphString) · [`mulberry`](#s-mulberry) · [`sigil`](#s-sigil)
- called by: [`hallSection`](../station/deckhall.js.md#s-hallSection) _js/station/deckhall.js_ ×2 · [`compileBlock`](#s-compileBlock)
- effects: dom.create `div` · dom.create `span`

<!-- note:glyphBar -->
Render (or re-render) a glyph bar into `host`.
@param host   element
@param spec   { label, value 0..1, seed, cells, alpha, tone: "cyan"|"amber"|"ok"|"hot", format(value)->string, animate: bool, from: 0..1 }
Returns a handle { set(value, animate), el }.
<!-- /note -->

#### <a id="s-glyphBar-paint"></a>`glyphBar>paint(v, settling)`

function · L77–89

- calls: [`pickFrom`](#s-pickFrom)
- called by: [`glyphBar`](#s-glyphBar) · [`glyphBar>set`](#s-glyphBar-set) · [`glyphBar>step`](#s-glyphBar-step) ×2

<!-- note:glyphBar>paint -->
- L84 · `if (lead) spans[i].textContent = pickFrom(alpha, flick);` — the machine trying candidates
<!-- /note -->

#### <a id="s-glyphBar-step"></a>`glyphBar>step()`

function · L91–102

- calls: [`glyphBar>paint`](#s-glyphBar-paint) ×2
- effects: timer `requestAnimationFrame`

<!-- note:glyphBar>step -->
<!-- /note -->

#### <a id="s-glyphBar-set"></a>`glyphBar>set(v, animate=)`

function · L104–112

- calls: [`glyphBar>paint`](#s-glyphBar-paint)
- called by: [`glyphBar`](#s-glyphBar) ×2
- effects: timer `requestAnimationFrame`

<!-- note:glyphBar>set -->
<!-- /note -->

### <a id="s-compileBlock"></a>`compileBlock(host, {…}=)`

function · **exported** · L119–160

- calls: [`compileBlock>spin`](#s-compileBlock-spin) · [`glyphBar`](#s-glyphBar) · [`mulberry`](#s-mulberry) · [`sigil`](#s-sigil)
- called by: [`mountCreation>renderCompile`](creation.js.md#s-mountCreation-renderCompile) _js/ui/creation.js_
- effects: dom.create `div` · dom.query `.compile-title` · dom.query `.compile-sigil` · timer `setTimeout`

<!-- note:compileBlock -->
A "compile" — several bars filling in sequence with a stagger, plus a
sigil line that resolves last. `rows`: [{ label, value, seed, tone, format }].
Returns { el, handles, done: Promise }.

- L140 · `const final = sigil(seed);` — the sigil flickers while the bars run, then settles
<!-- /note -->

#### <a id="s-compileBlock-spin"></a>`compileBlock>spin()`

function · L144–156

- calls: [`pickFrom`](#s-pickFrom)
- called by: [`compileBlock`](#s-compileBlock)
- effects: timer `requestAnimationFrame` · timer `setTimeout`

<!-- note:compileBlock>spin -->
<!-- /note -->
