# js/vendor/stellar-names/index.js

[index](../../../../README.md) · 99 lines · 21 symbols · 1 imports · 1 importers · **vendored — comments stay in the source, never migrated**

## About

<!-- note:@file -->
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 19 | `./classified-names.js` | `CLASSIFIED_NAMES` | [js/vendor/stellar-names/classified-names.js](classified-names.js.md) |

## Imported by

- [js/world/naming.js](../../world/naming.js.md) — `NameGenerator`

## Exports

- `CLASSIFIED_NAMES` — **no importer in scanned roots**
- [`CATEGORIES`](#s-CATEGORIES) · const — **no importer in scanned roots**
- [`STYLES`](#s-STYLES) · const — **no importer in scanned roots**
- [`DEFAULT_DATA`](#s-DEFAULT_DATA) · const — **no importer in scanned roots**
- [`NameGenerator`](#s-NameGenerator) · class — used by [js/world/naming.js](../../world/naming.js.md)
- `default` · Identifier — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-CATEGORIES"></a>`CATEGORIES`

const · **exported** · L22–22

<!-- note:CATEGORIES -->
<!-- /note -->

### <a id="s-STYLES"></a>`STYLES`

const · **exported** · L23–23

<!-- note:STYLES -->
<!-- /note -->

### <a id="s-words"></a>`words(s)`

function · L24–24

- called by: [`DEFAULT_DATA`](#s-DEFAULT_DATA)

<!-- note:words -->
<!-- /note -->

### <a id="s-DEFAULT_DATA"></a>`DEFAULT_DATA`

const · **exported** · L25–41

- calls: [`words`](#s-words)

<!-- note:DEFAULT_DATA -->
<!-- /note -->

### <a id="s-hash"></a>`hash(value)`

function · L42–42

- called by: [`NameGenerator.constructor`](#s-NameGenerator-constructor) · [`NameGenerator.reset`](#s-NameGenerator-reset)

<!-- note:hash -->
<!-- /note -->

### <a id="s-string"></a>`string(value, label)`

function · L43–43

- called by: [`NameGenerator.constructor`](#s-NameGenerator-constructor) · [`NameGenerator.generate`](#s-NameGenerator-generate) ×2 · [`NameGenerator.reserve`](#s-NameGenerator-reserve)

<!-- note:string -->
<!-- /note -->

### <a id="s-NameGenerator"></a>`NameGenerator`

class · **exported** · L44–98

- called by: [`openSkyNames`](../../world/naming.js.md#s-openSkyNames) _js/world/naming.js_ · [`portNameSpace`](../../world/naming.js.md#s-portNameSpace) _js/world/naming.js_

<!-- note:NameGenerator -->
<!-- /note -->

#### <a id="s-NameGenerator-constructor"></a>`NameGenerator.constructor({…}=)`

method · L45–51

- calls: [`hash`](#s-hash) · [`string`](#s-string)

<!-- note:NameGenerator.constructor -->
<!-- /note -->

#### <a id="s-NameGenerator-random"></a>`NameGenerator.random()`

method · L52–52

<!-- note:NameGenerator.random -->
<!-- /note -->

#### <a id="s-NameGenerator-pick"></a>`NameGenerator.pick(key)`

method · L53–53

<!-- note:NameGenerator.pick -->
<!-- /note -->

#### <a id="s-NameGenerator-integer"></a>`NameGenerator.integer(min, max)`

method · L54–54

<!-- note:NameGenerator.integer -->
<!-- /note -->

#### <a id="s-NameGenerator-world"></a>`NameGenerator.world()`

method · L55–55

<!-- note:NameGenerator.world -->
<!-- /note -->

#### <a id="s-NameGenerator-generate"></a>`NameGenerator.generate(category, options=)`

method · L57–86

- calls: [`NameGenerator.generate>base`](#s-NameGenerator-generate-base) ×3 · [`NameGenerator.generate>number`](#s-NameGenerator-generate-number) ×3 · [`string`](#s-string) ×2

<!-- note:NameGenerator.generate -->
<!-- /note -->

##### <a id="s-NameGenerator-generate-number"></a>`NameGenerator.generate>number()`

function · L66–66

- called by: [`NameGenerator.generate`](#s-NameGenerator-generate) ×3 · [`NameGenerator.generate>base`](#s-NameGenerator-generate-base) ×2

<!-- note:NameGenerator.generate>number -->
<!-- /note -->

##### <a id="s-NameGenerator-generate-base"></a>`NameGenerator.generate>base()`

function · L67–67

- calls: [`NameGenerator.generate>number`](#s-NameGenerator-generate-number) ×2
- called by: [`NameGenerator.generate`](#s-NameGenerator-generate) ×3

<!-- note:NameGenerator.generate>base -->
<!-- /note -->

#### <a id="s-NameGenerator-name"></a>`NameGenerator.name(category, options=)`

method · L87–87

<!-- note:NameGenerator.name -->
<!-- /note -->

#### <a id="s-NameGenerator-batch"></a>`NameGenerator.batch(category, count=, options=)`

method · L88–93

<!-- note:NameGenerator.batch -->
<!-- /note -->

#### <a id="s-NameGenerator-reserve"></a>`NameGenerator.reserve(names)`

method · L94–94

- calls: [`string`](#s-string)

<!-- note:NameGenerator.reserve -->
<!-- /note -->

#### <a id="s-NameGenerator-reset"></a>`NameGenerator.reset()`

method · L95–95

- calls: [`hash`](#s-hash)

<!-- note:NameGenerator.reset -->
<!-- /note -->

#### <a id="s-NameGenerator-snapshot"></a>`NameGenerator.snapshot()`

method · L96–96

<!-- note:NameGenerator.snapshot -->
<!-- /note -->

#### <a id="s-NameGenerator-restore"></a>`NameGenerator.restore(s)`

method · L97–97

<!-- note:NameGenerator.restore -->
<!-- /note -->
