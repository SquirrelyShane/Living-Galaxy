# js/core/addon-loader.js

[index](../../../README.md) · 31 lines · 4 symbols · 1 imports · 1 importers

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
| 18 | `../../addon/${…}/index.js` | dynamic `import()` in `loadAddons` | runtime-resolved |

## Imported by

- [js/main.js](../main.js.md) — _side effect_

## Exports

- [`PACKS`](#s-PACKS) · const — **no importer in scanned roots**
- [`loadAddons`](#s-loadAddons) · function — **no importer in scanned roots**
- [`addonsReady`](#s-addonsReady) · const — **no importer in scanned roots**

## Effects

- **net.fetch** — `‹(new)› HEAD` (installed:8)

## Symbols

### <a id="s-PACKS"></a>`PACKS`

const · **exported** · L3–3

<!-- note:PACKS -->
<!-- /note -->

### <a id="s-installed"></a>`installed(id)`

function · async · L5–13

- called by: [`loadAddons`](#s-loadAddons)
- effects: net.fetch `‹(new)›`

<!-- note:installed -->
A pack folder that is there but fails to load (a stale import path, a syntax error) used to be
reported as "not installed", because a failed sub-import in a browser says "Failed to fetch" just
as a missing folder does. Ask the server whether index.js exists and only then decide which it is.
<!-- /note -->

### <a id="s-loadAddons"></a>`loadAddons()`

function · async · **exported** · L15–29

- calls: [`installed`](#s-installed)
- via [js/crew/hooks.js](../crew/hooks.js.md): `addons.mark`
- called by: [`addonsReady`](#s-addonsReady)

<!-- note:loadAddons -->
- L? · `const missing = /Failed to fetch|not found|404|Cannot find module/i.test(String(err?.messa` — a missing folder is the normal case; anything else is the pack itself
  throwing, and that is worth seeing
<!-- /note -->

### <a id="s-addonsReady"></a>`addonsReady`

const · **exported** · L31–31

- calls: [`loadAddons`](#s-loadAddons)

<!-- note:addonsReady -->
Resolves once every pack has had its chance. Await it before reading `addons`.
<!-- /note -->
