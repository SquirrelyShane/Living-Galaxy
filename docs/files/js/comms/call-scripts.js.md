# js/comms/call-scripts.js

[index](../../../README.md) · 400 lines · 31 symbols · 0 imports · 2 importers

## About

<!-- note:@file -->
js/comms/call-scripts.js — what the other end of the channel says.

Every script is a small dialogue tree: { start, nodes: { id: { text, options?, end? } } }.
Options can carry an `effect(ctx)` — the director runs it when the pilot picks
that line, so a bribe costs credits and a clearance actually opens the clamps.
The factories take the station/contact so the words carry its name and sector.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/comms/comms.js](comms.js.md) — `approachScript`, `guardScript`, `laneScript`, `marketScript`, `newsScript`, `pirateScript`, `portScript`, `trafficLines`, `undockScript`, `vesselScript`
- test/comms.test.mjs _(outside js/)_ — `undockScript`, `pirateScript`, `chatterExchange`

## Exports

- [`approachScript`](#s-approachScript) · function — used by [js/comms/comms.js](comms.js.md)
- [`laneScript`](#s-laneScript) · function — used by [js/comms/comms.js](comms.js.md)
- [`undockScript`](#s-undockScript) · function — used by [js/comms/comms.js](comms.js.md), test/comms.test.mjs
- [`newsScript`](#s-newsScript) · function — used by [js/comms/comms.js](comms.js.md)
- [`marketScript`](#s-marketScript) · function — used by [js/comms/comms.js](comms.js.md)
- [`pirateScript`](#s-pirateScript) · function — used by [js/comms/comms.js](comms.js.md), test/comms.test.mjs
- [`guardScript`](#s-guardScript) · function — used by [js/comms/comms.js](comms.js.md)
- [`portScript`](#s-portScript) · function — used by [js/comms/comms.js](comms.js.md)
- [`chatterExchange`](#s-chatterExchange) · function — used by test/comms.test.mjs
- [`llamaProvider`](#s-llamaProvider) · function — **no importer in scanned roots**
- [`vesselScript`](#s-vesselScript) · function — used by [js/comms/comms.js](comms.js.md)
- [`trafficLines`](#s-trafficLines) · function — used by [js/comms/comms.js](comms.js.md)

## Effects

- **net.fetch** — `‹url› POST` (llamaProvider:343)

## Symbols

### <a id="s-VOICE"></a>`VOICE`

const · L1–8

<!-- note:VOICE -->
<!-- /note -->

### <a id="s-short"></a>`short(name)`

function · L10–10

- called by: [`approachScript`](#s-approachScript) · [`chatterExchange`](#s-chatterExchange) ×2 · [`laneScript`](#s-laneScript) · [`pirateScript`](#s-pirateScript) · [`portScript`](#s-portScript) · [`undockScript`](#s-undockScript)

<!-- note:short -->
<!-- /note -->

### <a id="s-pick"></a>`pick(rnd, arr)`

function · L11–11

- called by: [`chatterExchange`](#s-chatterExchange)

<!-- note:pick -->
<!-- /note -->

### <a id="s-approachScript"></a>`approachScript(st, ctx)`

function · **exported** · L13–77

- calls: [`short`](#s-short)
- called by: [`portScript`](#s-portScript) · [`stepIncoming`](comms.js.md#s-stepIncoming) _js/comms/comms.js_

<!-- note:approachScript -->
---- NPC → player: a port sees you on approach ---------------------------
<!-- /note -->

#### <a id="s-approachScript-effect"></a>`approachScript.effect()`

prop · L45–45

<!-- note:approachScript.effect -->
<!-- /note -->

#### <a id="s-approachScript-effect-2"></a>`approachScript.effect~2()`

prop · L59–59

<!-- note:approachScript.effect~2 -->
<!-- /note -->

### <a id="s-laneScript"></a>`laneScript(st, ctx, where=)`

function · **exported** · L79–107

- calls: [`short`](#s-short)
- called by: [`stepIncoming`](comms.js.md#s-stepIncoming) _js/comms/comms.js_

<!-- note:laneScript -->
---- port → a hull on its lane or in its mouth with no berth -------------
<!-- /note -->

#### <a id="s-laneScript-effect"></a>`laneScript.effect()`

prop · L102–102

<!-- note:laneScript.effect -->
<!-- /note -->

### <a id="s-undockScript"></a>`undockScript(st, ctx)`

function · **exported** · L109–160

- calls: [`short`](#s-short)
- called by: [`hail`](comms.js.md#s-hail) _js/comms/comms.js_

<!-- note:undockScript -->
---- player → port while docked: clearance to leave ---------------------
<!-- /note -->

#### <a id="s-undockScript-effect"></a>`undockScript.effect()`

prop · L130–130

<!-- note:undockScript.effect -->
<!-- /note -->

#### <a id="s-undockScript-effect-2"></a>`undockScript.effect~2()`

prop · L147–150

<!-- note:undockScript.effect~2 -->
<!-- /note -->

#### <a id="s-undockScript-effect-3"></a>`undockScript.effect~3()`

prop · L156–156

<!-- note:undockScript.effect~3 -->
<!-- /note -->

### <a id="s-newsScript"></a>`newsScript(report, ctx)`

function · **exported** · L162–207

- called by: [`stepNews`](comms.js.md#s-stepNews) _js/comms/comms.js_

<!-- note:newsScript -->
---- GNN: the news desk --------------------------------------------------
A major planetary impact goes out as a galactic news broadcast. It rings
the puck like any contact; answer it and the bulletin types itself out on
the transcript. The desk does not take questions — but it will mark the
site on your chart.

- L169 · `const casualties = [];` — the body count — the blast wave's paperwork
<!-- /note -->

#### <a id="s-newsScript-effect"></a>`newsScript.effect()`

prop · L197–197

<!-- note:newsScript.effect -->
<!-- /note -->

#### <a id="s-newsScript-effect-2"></a>`newsScript.effect~2()`

prop · L202–202

<!-- note:newsScript.effect~2 -->
<!-- /note -->

### <a id="s-marketScript"></a>`marketScript(line, action=)`

function · **exported** · L209–224

- called by: [`stepBattles`](comms.js.md#s-stepBattles) _js/comms/comms.js_ · [`stepMarkets`](comms.js.md#s-stepMarkets) _js/comms/comms.js_ ×3

<!-- note:marketScript -->
One-node desk reads: droughts and terraform bonds ride the same channel.
<!-- /note -->

#### <a id="s-marketScript-effect"></a>`marketScript.effect()`

prop · L220–220

<!-- note:marketScript.effect -->
<!-- /note -->

### <a id="s-pirateScript"></a>`pirateScript(st, ctx)`

function · **exported** · L226–265

- calls: [`short`](#s-short)
- called by: [`hailStation`](comms.js.md#s-hailStation) _js/comms/comms.js_ · [`stepIncoming`](comms.js.md#s-stepIncoming) _js/comms/comms.js_

<!-- note:pirateScript -->
---- NPC → player: a free port with its guns up -------------------------
<!-- /note -->

#### <a id="s-pirateScript-effect"></a>`pirateScript.effect()`

prop · L249–252

<!-- note:pirateScript.effect -->
<!-- /note -->

#### <a id="s-pirateScript-effect-2"></a>`pirateScript.effect~2()`

prop · L257–260

<!-- note:pirateScript.effect~2 -->
<!-- /note -->

### <a id="s-guardScript"></a>`guardScript(c)`

function · **exported** · L267–277

- called by: [`hailContact`](comms.js.md#s-hailContact) _js/comms/comms.js_

<!-- note:guardScript -->
---- player → drone/guard: nobody civil is listening --------------------
<!-- /note -->

### <a id="s-portScript"></a>`portScript(st, ctx)`

function · **exported** · L279–283

- calls: [`approachScript`](#s-approachScript) · [`short`](#s-short)
- called by: [`hailStation`](comms.js.md#s-hailStation) _js/comms/comms.js_

<!-- note:portScript -->
---- port answers a cold hail from open space ---------------------------
<!-- /note -->

### <a id="s-CHATTER"></a>`CHATTER`

const · L285–316

<!-- note:CHATTER -->
---- NPC ↔ NPC: what the open channels sound like -----------------------
<!-- /note -->

### <a id="s-chatterExchange"></a>`chatterExchange(a, b, rnd)`

function · **exported** · L318–325

- calls: [`chatterExchange>fill`](#s-chatterExchange-fill) · [`pick`](#s-pick) · [`short`](#s-short) ×2

<!-- note:chatterExchange -->
One overheard exchange between two ports: [{from, to, text}, …]
<!-- /note -->

#### <a id="s-chatterExchange-fill"></a>`chatterExchange>fill(t)`

function · L323–323

- called by: [`chatterExchange`](#s-chatterExchange)

<!-- note:chatterExchange>fill -->
<!-- /note -->

### <a id="s-deadProviders"></a>`deadProviders`

const · L327–327

<!-- note:deadProviders -->
llama.cpp (OpenAI-compatible) provider for a local inference server.
Falls back silently to the scripted node if the server is slow or down —
CallSession already guards it with providerTimeoutMs.

One warning, then stop asking. A voice provider that answers 404/405/501 is
not there, and the scripted lines are a complete fallback — so a call still
works, it just stops paying a dead round trip per line.
<!-- /note -->

### <a id="s-providerGone"></a>`providerGone(status, url)`

function · L328–332

- called by: [`llamaProvider`](#s-llamaProvider)

<!-- note:providerGone -->
<!-- /note -->

### <a id="s-llamaProvider"></a>`llamaProvider({…}=)`

function · **exported** · L334–361

- calls: [`providerGone`](#s-providerGone)
- effects: net.fetch `‹url›`

<!-- note:llamaProvider -->
- L356 · `if (!res.ok) { providerGone(res.status, url); return null; }` — `fetch` only REJECTS on a network failure. A 404 from a misconfigured
  host, or a 500 with a JSON error body, RESOLVES — so without this check
  `res.json()` either throws a SyntaxError into a silent catch upstream or
  quietly yields undefined, and every node of every call re-issues the
  dead request forever. Same shape as the /cradle/put flood.
- L359 · `return text ? { text } : null;` — options stay scripted → choices remain authored
<!-- /note -->

### <a id="s-vesselScript"></a>`vesselScript(n, status, ctx)`

function · **exported** · L363–381

- called by: [`hailContact`](comms.js.md#s-hailContact) _js/comms/comms.js_

<!-- note:vesselScript -->
---- NPC traffic answers a hail -------------------------------------------

@param n       traffic hull (js/npc/traffic.js)
@param status  vesselStatus(n) line
@param ctx     { market: string, crewLine: string }
<!-- /note -->

### <a id="s-trafficLines"></a>`trafficLines(n, job, rnd)`

function · **exported** · L383–400

- calls: [`trafficLines>pick`](#s-trafficLines-pick) ×3
- called by: [`onVesselTransition`](comms.js.md#s-onVesselTransition) _js/comms/comms.js_

<!-- note:trafficLines -->
What a hull says on the open channel when its job changes. [fromLine, replyLine] or null.
<!-- /note -->

#### <a id="s-trafficLines-pick"></a>`trafficLines>pick(arr)`

function · L386–386

- called by: [`trafficLines`](#s-trafficLines) ×3

<!-- note:trafficLines>pick -->
<!-- /note -->
