# js/genome/behavior-graph.js

[index](../../../README.md) · 301 lines · 19 symbols · 0 imports · 3 importers

## About

<!-- note:@file -->
Living Galaxy — BEHAVIOR GRAPH engine, ported verbatim from the genome-agent
project (v1.0) and rewrapped as an ES module.

Not a tree: nodes may be entered from several parents and may link back into
branches that reach them. Every hop appends to a trace, and that trace is
what answers "what made me take this action" in an NPC's journal.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/crew/deckgraph.js](../crew/deckgraph.js.md) — `createGraph`
- [js/crew/deckmind.js](../crew/deckmind.js.md) — `decide`, `explainTrace`
- test/genome.test.mjs _(outside js/)_ — `decide`

## Exports

- [`createGraph`](#s-createGraph) — used by [js/crew/deckgraph.js](../crew/deckgraph.js.md)
- [`validateGraph`](#s-validateGraph) — **no importer in scanned roots**
- [`pruneGraph`](#s-pruneGraph) — **no importer in scanned roots**
- [`decide`](#s-decide) — used by [js/crew/deckmind.js](../crew/deckmind.js.md), test/genome.test.mjs
- [`edgesOf`](#s-edgesOf) — **no importer in scanned roots**
- [`explainTrace`](#s-explainTrace) — used by [js/crew/deckmind.js](../crew/deckmind.js.md)
- [`pathString`](#s-pathString) — **no importer in scanned roots**
- [`toMermaid`](#s-toMermaid) — **no importer in scanned roots**
- [`GraphError`](#s-GraphError) — **no importer in scanned roots**
- [`MAX_DEPTH`](#s-MAX_DEPTH) — **no importer in scanned roots**

## Effects

- **bus.on** — `‹ctx› on node` (decide:222)

## Symbols

### <a id="s-MAX_DEPTH"></a>`MAX_DEPTH`

const · **exported** · L1–1

<!-- note:MAX_DEPTH -->
<!-- /note -->

### <a id="s-GraphError"></a>`GraphError`

class · **exported** · L3–5

- called by: [`createGraph`](#s-createGraph) ×4 · [`decide`](#s-decide) ×6 · [`edgesOf`](#s-edgesOf) · [`pruneGraph`](#s-pruneGraph)

<!-- note:GraphError -->
<!-- /note -->

#### <a id="s-GraphError-constructor"></a>`GraphError.constructor(msg, code, detail)`

method · L4–4

<!-- note:GraphError.constructor -->
<!-- /note -->

### <a id="s-createGraph"></a>`createGraph(def)`

function · **exported** · L7–25

- calls: [`new GraphError`](#s-GraphError) ×4 · [`validateGraph`](#s-validateGraph)
- called by: [`deckGraph`](../crew/deckgraph.js.md#s-deckGraph) _js/crew/deckgraph.js_

<!-- note:createGraph -->
Build a runnable graph from a node map.
@param {Object} def { id, root, nodes: { [id]: node } }
<!-- /note -->

### <a id="s-edgesOf"></a>`edgesOf(node, id)`

function · **exported** · L27–51

- calls: [`new GraphError`](#s-GraphError)
- called by: [`pruneGraph`](#s-pruneGraph) · [`toMermaid`](#s-toMermaid) · [`validateGraph`](#s-validateGraph) ×5

<!-- note:edgesOf -->
All outgoing edges of a node, as [{to, kind, label}].
<!-- /note -->

### <a id="s-validateGraph"></a>`validateGraph(graph)`

function · **exported** · L53–111

- calls: [`edgesOf`](#s-edgesOf) ×5
- called by: [`createGraph`](#s-createGraph)

<!-- note:validateGraph -->
Static validation. Catches the failure modes a hand-authored graph
actually hits: dangling edges, unreachable nodes, action-less sinks.
Cycles are REPORTED, not rejected — they are how branches link back.

- L71 · `const seen = new Set([graph.root]);` — reachability from root
- L81 · `const cycles = [];` — cycle inventory (informational — cross-links are intentional)
- L85 · `if (!graph.nodes[id]) return;` — dangling edge: already reported above
- L95 · `const fanIn = {};` — fan-in: how many distinct parents each node has — the cross-link metric
<!-- /note -->

### <a id="s-pruneGraph"></a>`pruneGraph(nodes, root=, fallback=)`

function · **exported** · L113–161

- calls: [`edgesOf`](#s-edgesOf) · [`new GraphError`](#s-GraphError) · [`pruneGraph>here`](#s-pruneGraph-here) ×8

<!-- note:pruneGraph -->
Drop edges that point at nodes which are not present, then drop whatever
that leaves unreachable. This is what makes a subset of behaviour packs a
valid graph instead of a pile of dangling references — compose whichever
domains a project needs and the rest is pruned rather than throwing.

@param {Object} nodes  raw node map (mutated copy is returned)
@param {string} root
@param {string} fallback  node every severed edge is redirected to
@returns {{ nodes:Object, pruned:{edges:number, nodes:string[]} }}

- L151 · `const seen = new Set([root]), stack = [root];` — drop anything no longer reachable
<!-- /note -->

#### <a id="s-pruneGraph-here"></a>`pruneGraph>here(id)`

function · L117–117

- called by: [`pruneGraph`](#s-pruneGraph) ×8

<!-- note:pruneGraph>here -->
<!-- /note -->

### <a id="s-decide"></a>`decide(graph, ctx, opts=)`

function · **exported** · L163–274

- calls: [`new GraphError`](#s-GraphError) ×6
- called by: [`stepHand`](../crew/deckmind.js.md#s-stepHand) _js/crew/deckmind.js_
- effects: bus.on `‹ctx›`

<!-- note:decide -->
Walk the graph to a terminal action.

@param {Object} graph
@param {Object} ctx  arbitrary decision context handed to every predicate
@param {Object} [opts] { rng, entry, maxDepth }
@returns {{ action, params, node, trace, path, depth }}

- L177 · `trace.push({ node: id, type: node.type, outcome: 'revisit-break', reason: 'this branch had` — A back-link fired twice in one decision — the situation is
  genuinely ambiguous. Bail to the node's own fallback rather than spin.
- L179 · `let escaped = false;` — walk back up the path for the nearest ancestor that declares a loop exit
- L264 · `if (graph.fallback) {` — Exhausted without landing on an action. In a cross-linked graph this is a
  legitimate outcome, not a crash — take the declared fallback if there is one.
<!-- /note -->

### <a id="s-explainTrace"></a>`explainTrace(trace)`

function · **exported** · L276–281

- called by: [`stepHand`](../crew/deckmind.js.md#s-stepHand) _js/crew/deckmind.js_

<!-- note:explainTrace -->
Render a trace as the plain-language chain of reasoning behind an action.
This is the "what made me take this action" field, verbatim.
<!-- /note -->

### <a id="s-pathString"></a>`pathString(path)`

function · **exported** · L283–283

<!-- note:pathString -->
Compact one-line form: "root > threat.check > survival.entry > flee"
<!-- /note -->

### <a id="s-toMermaid"></a>`toMermaid(graph)`

function · **exported** · L285–299

- calls: [`edgesOf`](#s-edgesOf) · [`toMermaid>safe`](#s-toMermaid-safe) ×5

<!-- note:toMermaid -->
Mermaid source for the whole graph. Handy for eyeballing the cross-links.
<!-- /note -->

#### <a id="s-toMermaid-action"></a>`toMermaid.action(id)`

prop · L287–287

<!-- note:toMermaid.action -->
<!-- /note -->

#### <a id="s-toMermaid-select"></a>`toMermaid.select(id)`

prop · L287–287

<!-- note:toMermaid.select -->
<!-- /note -->

#### <a id="s-toMermaid-switch"></a>`toMermaid.switch(id)`

prop · L288–288

<!-- note:toMermaid.switch -->
<!-- /note -->

#### <a id="s-toMermaid-check"></a>`toMermaid.check(id)`

prop · L288–288

<!-- note:toMermaid.check -->
<!-- /note -->

#### <a id="s-toMermaid-gate"></a>`toMermaid.gate(id)`

prop · L289–289

<!-- note:toMermaid.gate -->
<!-- /note -->

#### <a id="s-toMermaid-link"></a>`toMermaid.link(id)`

prop · L289–289

<!-- note:toMermaid.link -->
<!-- /note -->

#### <a id="s-toMermaid-safe"></a>`toMermaid>safe(s)`

function · L290–290

- called by: [`toMermaid`](#s-toMermaid) ×5

<!-- note:toMermaid>safe -->
<!-- /note -->
