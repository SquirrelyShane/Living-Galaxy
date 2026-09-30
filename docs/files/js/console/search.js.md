# js/console/search.js

[index](../../../README.md) · 69 lines · 7 symbols · 1 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — console global jump index.

The survivor of the CMD deck's search + flatten: a flat list of the leaves
that never belonged to a panel (registered by console.js at mount) plus
whatever every panel's `search()` returns right now, so crew names, drone
names, bodies, missions and upgrades are all one keystroke away.

  registerJump(spec), buildIndex(), query(q, limit) → hits, runHit(hit)
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `./console.js` | `closeConsole`, `console` as `con`, `jumpTo`, `noteRecent` | [js/console/console.js](console.js.md) |

## Imported by

- [js/console/console.js](console.js.md) — `query`, `registerJump`, `runHit`, `jumps`

## Exports

- [`jumps`](#s-jumps) · const — used by [js/console/console.js](console.js.md)
- [`registerJump`](#s-registerJump) · function — used by [js/console/console.js](console.js.md)
- [`buildIndex`](#s-buildIndex) · function — **no importer in scanned roots**
- [`query`](#s-query) · function — used by [js/console/console.js](console.js.md)
- [`runHit`](#s-runHit) · function — used by [js/console/console.js](console.js.md)
- [`run`](#s-run) · const — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-jumps"></a>`jumps`

const · **exported** · L3–3

<!-- note:jumps -->
Static jumps registered by console.js at mount.
<!-- /note -->

### <a id="s-registerJump"></a>`registerJump({…})`

function · **exported** · L5–11

- called by: [`registerStaticJumps>J`](console.js.md#s-registerStaticJumps-J) _js/console/console.js_

<!-- note:registerJump -->
<!-- /note -->

### <a id="s-label"></a>`label(p, subId)`

function · L13–16

- called by: [`buildIndex`](#s-buildIndex) ×3

<!-- note:label -->
<!-- /note -->

### <a id="s-buildIndex"></a>`buildIndex()`

function · **exported** · L18–34

- calls: [`label`](#s-label) ×3
- via [js/console/console.js](console.js.md): `con.panels.values`
- called by: [`query`](#s-query)

<!-- note:buildIndex -->
Rebuilds the searchable index: static jumps ∪ every panel's sub-tabs ∪ every panel's live search().
<!-- /note -->

### <a id="s-query"></a>`query(q, limit=)`

function · **exported** · L36–55

- calls: [`buildIndex`](#s-buildIndex)
- called by: [`mountConsole`](console.js.md#s-mountConsole) _js/console/console.js_ · [`paintHits`](console.js.md#s-paintHits) _js/console/console.js_

<!-- note:query -->
query(q, limit = 30) → [{ id, label, hint, path, run, status, close }]; label hits rank above keyword-only hits.
<!-- /note -->

### <a id="s-runHit"></a>`runHit(hit)`

function · **exported** · L57–67

- calls: [`closeConsole`](console.js.md#s-closeConsole) _js/console/console.js_ · [`jumpTo`](console.js.md#s-jumpTo) _js/console/console.js_ · [`noteRecent`](console.js.md#s-noteRecent) _js/console/console.js_ ×2
- called by: [`act`](console.js.md#s-act) _js/console/console.js_ · [`paintRecents`](console.js.md#s-paintRecents) _js/console/console.js_

<!-- note:runHit -->
run() if present else jumpTo(path); closes the console when the leaf opens another surface.
<!-- /note -->

### <a id="s-run"></a>`run`

const · **exported** · L69–69

<!-- note:run -->
<!-- /note -->
