# js/core/boot.js

[index](../../../README.md) · 92 lines · 6 symbols · 1 imports · 3 importers

## About

<!-- note:@file -->
LIVING GALAXY — the boot guard: a game that fails to start says why.

0.3.27. A patch series is applied by unzipping changed files over a tree,
and the one thing that can go wrong is applying some of them. ES modules
resolve named imports at LINK time, so one module that is a version behind
its neighbours does not throw where you can see it — the entire graph never
evaluates. Nothing registers, nothing mounts, and the page sits there with
the static shell from index.html and a black canvas behind it.

That is exactly what happened: `js/sim/sim.js` from 0.3.25 imports `lotMult`
from `js/economy/economy.js`, which gained it in 0.3.24, and a tree where 0.3.24 had
not been applied booted to a black screen with nothing in the console the
player would ever look at. The server log was clean — every file 200, no
404 — because every file was THERE. They just did not agree with each other.

So the entry point catches it and puts it on the screen, in the page, in
words: what failed, which module, which named export, and which patch that
export arrived in. A build that cannot run should be able to tell you that
in one look, on the device it failed on, without a debugger.

`EXPECTS` is the map from a named export to the version that introduced it.
Adding to it is optional — the panel still names the module and the missing
export without it — but naming the patch turns "something is broken" into
"re-apply 0.3.24", which is the difference between a bug report and a fix.

- L86 · `if (globalThis.addEventListener) {` — A link error in the entry module itself never reaches `guard`, because the
  module never runs. index.html's inline fallback is what catches that one;
  this listener catches the later ones (a dynamic import, a worker).
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../version.js` | `VERSION` | [js/version.js](../version.js.md) |

## Imported by

- [js/main.js](../main.js.md) — `guard`
- test/boot.test.mjs _(outside js/)_ — `EXPECTS`, `readFailure`, `explain`, `showFailure`, `guard`
- index.html _(outside js/)_ — `(entry)`

## Exports

- [`EXPECTS`](#s-EXPECTS) · const — used by test/boot.test.mjs
- [`readFailure`](#s-readFailure) · function — used by test/boot.test.mjs
- [`explain`](#s-explain) · function — used by test/boot.test.mjs
- [`showFailure`](#s-showFailure) · function — used by test/boot.test.mjs
- [`guard`](#s-guard) · function — used by [js/main.js](../main.js.md), test/boot.test.mjs

## Effects

- **dom.create** — `div` (showFailure:57)
- **dom.id** — `boot-fail` (@file:88)
- **event.listen** — `error on globalThis → (inline)` (@file:87)

## Symbols

### <a id="s-EXPECTS"></a>`EXPECTS`

const · **exported** · L3–14

<!-- note:EXPECTS -->
export name → the patch it arrived in. Only exports that moved BETWEEN files need listing.
<!-- /note -->

### <a id="s-esc"></a>`esc(s)`

function · L16–16

- called by: [`explain`](#s-explain) ×5 · [`showFailure`](#s-showFailure) ×3

<!-- note:esc -->
<!-- /note -->

### <a id="s-readFailure"></a>`readFailure(err)`

function · **exported** · L18–30

- called by: [`showFailure`](#s-showFailure)

<!-- note:readFailure -->
Read a link failure. Browsers word it differently — Chromium says "does not
provide an export named 'x'", Firefox "doesn't provide an export named: x",
Safari "Importing binding name 'x' is not found" — so all three are matched
rather than one of them.
<!-- /note -->

### <a id="s-explain"></a>`explain(f)`

function · **exported** · L32–51

- calls: [`esc`](#s-esc) ×5
- called by: [`showFailure`](#s-showFailure)

<!-- note:explain -->
The words for a failure, as a person reading them on a phone needs them.
<!-- /note -->

### <a id="s-showFailure"></a>`showFailure(err)`

function · **exported** · L53–73

- calls: [`esc`](#s-esc) ×3 · [`explain`](#s-explain) · [`readFailure`](#s-readFailure)
- called by: [`@file`](#) · [`guard`](#s-guard)
- effects: dom.create `div`

<!-- note:showFailure -->
Put it on the screen. The shell in index.html is still there, so this covers
it rather than fighting it — a black canvas with a working menu over it is
the most misleading thing the game can show.

- L70 · `} catch {` — if even this cannot run, the console line below is all there is
<!-- /note -->

### <a id="s-guard"></a>`guard(start)`

function · **exported** · L75–84

- calls: [`showFailure`](#s-showFailure)
- called by: [`@file`](../main.js.md#) _js/main.js_

<!-- note:guard -->
Run the game, and turn a failure into words. `start` is the rest of the
boot: everything after the imports, so an error thrown while mounting is
caught the same way a link error is.
<!-- /note -->

## Module-level calls

- calls: [`showFailure`](#s-showFailure)
