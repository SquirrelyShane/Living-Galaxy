# js/version.js

[index](../../README.md) · 7 lines · 5 symbols · 0 imports · 3 importers

## About

<!-- note:@file -->
LIVING GALAXY — Ad Astrum: what this build is.

One place, so the tab title, the HUD corner, the creation screen and the
relay's start-up banner cannot drift apart from one another.

`VERSION` is the product version and nothing else. Data-format versions live
with the data they describe — CRADLE_VERSION in js/npc/cradle.js, PACK_VERSION
in js/genome/spacer.js, the `.v1` suffix on a storage key — and move on their
own schedule, because a save format and a release are different things and
tying them together makes both harder to change.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/core/boot.js](core/boot.js.md) — `VERSION`
- [js/ui/hud.js](ui/hud.js.md) — `BUILD_LINE`
- test/boot.test.mjs _(outside js/)_ — `VERSION`

## Exports

- [`NAME`](#s-NAME) · const — **no importer in scanned roots**
- [`SUBTITLE`](#s-SUBTITLE) · const — **no importer in scanned roots**
- [`VERSION`](#s-VERSION) · const — used by [js/core/boot.js](core/boot.js.md), test/boot.test.mjs
- [`FULL_NAME`](#s-FULL_NAME) · const — **no importer in scanned roots**
- [`BUILD_LINE`](#s-BUILD_LINE) · const — used by [js/ui/hud.js](ui/hud.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-NAME"></a>`NAME`

const · **exported** · L1–1

<!-- note:NAME -->
<!-- /note -->

### <a id="s-SUBTITLE"></a>`SUBTITLE`

const · **exported** · L2–2

<!-- note:SUBTITLE -->
<!-- /note -->

### <a id="s-VERSION"></a>`VERSION`

const · **exported** · L3–3

<!-- note:VERSION -->
<!-- /note -->

### <a id="s-FULL_NAME"></a>`FULL_NAME`

const · **exported** · L5–5

<!-- note:FULL_NAME -->
"Living Galaxy — Ad Astrum" — the full mark, for a tab title or a banner.
<!-- /note -->

### <a id="s-BUILD_LINE"></a>`BUILD_LINE`

const · **exported** · L7–7

<!-- note:BUILD_LINE -->
"Living Galaxy — Ad Astrum 0.1" — the mark with the build on it.
<!-- /note -->
