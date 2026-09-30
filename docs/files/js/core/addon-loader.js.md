# js/core/addon-loader.js

[index](../../../README.md) · 20 lines · 3 symbols · 1 imports · 1 importers

## About

<!-- note:@file -->
Try optional addon packs. Missing folders are not errors.
Delete addon/adult/ and this import fails quietly — core stays vanilla.

A pack that is not installed still costs one 404 in the network log, because
that is how a browser discovers a module is not there. The log line below is
what tells you it was expected rather than broken.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../crew/hooks.js` | `addons` | [js/crew/hooks.js](../crew/hooks.js.md) |
| 8 | `../../addon/${…}/index.js` | dynamic `import()` in `loadAddons` | runtime-resolved |

## Imported by

- [js/main.js](../main.js.md) — _side effect_

## Exports

- [`PACKS`](#s-PACKS) · const — **no importer in scanned roots**
- [`loadAddons`](#s-loadAddons) · function — **no importer in scanned roots**
- [`addonsReady`](#s-addonsReady) · const — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-PACKS"></a>`PACKS`

const · **exported** · L3–3

<!-- note:PACKS -->
<!-- /note -->

### <a id="s-loadAddons"></a>`loadAddons()`

function · async · **exported** · L5–18

- via [js/crew/hooks.js](../crew/hooks.js.md): `addons.mark`
- called by: [`addonsReady`](#s-addonsReady)

<!-- note:loadAddons -->
- L12 · `const missing = /Failed to fetch|not found|404|Cannot find module/i.test(String(err?.messa` — a missing folder is the normal case; anything else is the pack itself
  throwing, and that is worth seeing
<!-- /note -->

### <a id="s-addonsReady"></a>`addonsReady`

const · **exported** · L20–20

- calls: [`loadAddons`](#s-loadAddons)

<!-- note:addonsReady -->
Resolves once every pack has had its chance. Await it before reading `addons`.
<!-- /note -->
