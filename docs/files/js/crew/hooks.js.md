# js/crew/hooks.js

[index](../../../README.md) · 32 lines · 6 symbols · 0 imports · 6 importers

## About

<!-- note:@file -->
Living Galaxy — optional addon hooks.

Core never imports addon code. An addon folder that is present registers
here; if the folder is deleted the game keeps vanilla talk, romance and
fade-to-black private evenings. Restricted models can build against core
without reading the 18+ pack.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/console/panels/crew.js](../console/panels/crew.js.md) — `runHooks`
- [js/core/addon-loader.js](../core/addon-loader.js.md) — `addons`
- [js/crew/beats.js](beats.js.md) — `runHooks`
- [js/crew/romance.js](romance.js.md) — `runHooks`
- [js/crew/talk.js](talk.js.md) — `runHooks`
- test/beats.test.mjs _(outside js/)_ — `addHook`, `runHooks`, `addons`

## Exports

- [`addHook`](#s-addHook) · function — used by test/beats.test.mjs
- [`runHooks`](#s-runHooks) · function — used by [js/console/panels/crew.js](../console/panels/crew.js.md), [js/crew/beats.js](beats.js.md), [js/crew/romance.js](romance.js.md), [js/crew/talk.js](talk.js.md), test/beats.test.mjs
- [`listHooks`](#s-listHooks) · function — **no importer in scanned roots**
- [`addons`](#s-addons) · const — used by [js/core/addon-loader.js](../core/addon-loader.js.md), test/beats.test.mjs

## Effects

_none detected_

## Symbols

### <a id="s-buckets"></a>`buckets`

const · L1–6

<!-- note:buckets -->
What each bucket is handed, and what it is expected to give back.

  beats           () => Beat[]                     see crew/beats.js CORE_BEATS
                  A Beat may carry `replaces: "&lt;topicId>"`, and the staged
                  version then takes that topic's place in the TALK list.
  talkTopics      (m, c) => Topic[]                see crew/talk-trees.js
  onPrivateNight  (a, b, res) => void              res is the fade-to-black
                  result: { ok, conceived, chance, carrier, sire }
  houseRules      (root, kit) => void              kit is the console kit —
                  { el, section, note, row, button, group, chips, setBar,
                    social, setSocial, loadSocial, repaint }
                  Build with `row(root, label, { value, hint })` so the row
                  matches every other row on the sheet.
<!-- /note -->

### <a id="s-addHook"></a>`addHook(name, fn)`

function · **exported** · L8–15

<!-- note:addHook -->
<!-- /note -->

### <a id="s-runHooks"></a>`runHooks(name, ...args)`

function · **exported** · L17–23

- called by: [`mountHouse`](../console/panels/crew.js.md#s-mountHouse) _js/console/panels/crew.js_ · [`beatsFor`](beats.js.md#s-beatsFor) _js/crew/beats.js_ · [`privateNight`](romance.js.md#s-privateNight) _js/crew/romance.js_ · [`allNodes`](talk.js.md#s-allNodes) _js/crew/talk.js_

<!-- note:runHooks -->
<!-- /note -->

### <a id="s-listHooks"></a>`listHooks(name)`

function · **exported** · L25–27

<!-- note:listHooks -->
<!-- /note -->

### <a id="s-addons"></a>`addons`

const · **exported** · L29–32

<!-- note:addons -->
<!-- /note -->

#### <a id="s-addons-mark"></a>`addons.mark(id, on=)`

prop · L31–31

<!-- note:addons.mark -->
<!-- /note -->
