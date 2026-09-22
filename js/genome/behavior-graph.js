/* Living Galaxy — BEHAVIOR GRAPH engine, ported verbatim from the genome-agent
 * project (v1.0) and rewrapped as an ES module.
 *
 * Not a tree: nodes may be entered from several parents and may link back into
 * branches that reach them. Every hop appends to a trace, and that trace is
 * what answers "what made me take this action" in an NPC's journal.
 */


const MAX_DEPTH = 64;

class GraphError extends Error {
  constructor(msg, code, detail) { super(msg); this.name = 'GraphError'; this.code = code; this.detail = detail; }
}

/**
 * Build a runnable graph from a node map.
 * @param {Object} def { id, root, nodes: { [id]: node } }
 */
function createGraph(def) {
  if (!def || !def.nodes) throw new GraphError('Graph needs a nodes map', 'BAD_GRAPH');
  const root = def.root || 'root';
  if (!def.nodes[root]) throw new GraphError(`Root node "${root}" not found`, 'NO_ROOT');
  const graph = {
    id: def.id || 'graph',
    root,
    fallback: def.fallback || null,
    nodes: def.nodes,
    meta: def.meta || {},
  };
  if (graph.fallback && !def.nodes[graph.fallback]) {
    throw new GraphError(`Fallback node "${graph.fallback}" not found`, 'NO_FALLBACK');
  }
  const report = validateGraph(graph);
  if (report.errors.length) throw new GraphError('Invalid graph', 'INVALID_GRAPH', report);
  graph.report = report;
  return graph;
}

/** All outgoing edges of a node, as [{to, kind, label}]. */
function edgesOf(node, id) {
  const out = [];
  switch (node.type) {
    case 'check':
    case 'gate':
      if (node.then) out.push({ to: node.then, kind: 'then' });
      if (node.else) out.push({ to: node.else, kind: 'else' });
      break;
    case 'switch':
      for (const k of Object.keys(node.cases || {})) out.push({ to: node.cases[k], kind: 'case', label: k });
      if (node.default) out.push({ to: node.default, kind: 'default' });
      break;
    case 'select':
      for (const o of node.options || []) out.push({ to: o.to, kind: 'option', label: o.why });
      break;
    case 'link':
      if (node.to) out.push({ to: node.to, kind: 'link' });
      break;
    case 'action':
      break;
    default:
      throw new GraphError(`Unknown node type "${node.type}" on ${id}`, 'BAD_NODE_TYPE');
  }
  return out;
}

/**
 * Static validation. Catches the failure modes a hand-authored graph
 * actually hits: dangling edges, unreachable nodes, action-less sinks.
 * Cycles are REPORTED, not rejected — they are how branches link back.
 */
function validateGraph(graph) {
  const errors = [], warnings = [];
  const ids = Object.keys(graph.nodes);

  for (const id of ids) {
    const n = graph.nodes[id];
    if (!n || !n.type) { errors.push(`Node ${id} has no type`); continue; }
    let es;
    try { es = edgesOf(n, id); } catch (e) { errors.push(e.message); continue; }
    for (const e of es) {
      if (!graph.nodes[e.to]) errors.push(`Node ${id} -> "${e.to}" does not exist`);
    }
    if (n.type === 'action' && !n.act) errors.push(`Action node ${id} has no act`);
    if (n.type !== 'action' && es.length === 0) errors.push(`Node ${id} (${n.type}) has no outgoing edges`);
    if (n.type === 'switch' && !n.default) warnings.push(`Switch ${id} has no default — unmatched keys will fail`);
    if (n.type === 'select' && (!n.options || n.options.length < 2)) warnings.push(`Select ${id} has fewer than 2 options`);
  }

  // reachability from root
  const seen = new Set([graph.root]);
  const stack = [graph.root];
  while (stack.length) {
    const id = stack.pop();
    const n = graph.nodes[id];
    if (!n) continue;
    for (const e of edgesOf(n, id)) if (graph.nodes[e.to] && !seen.has(e.to)) { seen.add(e.to); stack.push(e.to); }
  }
  for (const id of ids) if (!seen.has(id)) warnings.push(`Node ${id} is unreachable from root`);

  // cycle inventory (informational — cross-links are intentional)
  const cycles = [];
  const colour = {};
  const path = [];
  (function dfs(id) {
    if (!graph.nodes[id]) return;   // dangling edge: already reported above
    colour[id] = 1; path.push(id);
    for (const e of edgesOf(graph.nodes[id], id)) {
      if (colour[e.to] === 1) cycles.push(path.slice(path.indexOf(e.to)).concat(e.to));
      else if (!colour[e.to]) dfs(e.to);
    }
    path.pop(); colour[id] = 2;
  })(graph.root);

  const actions = ids.filter(i => graph.nodes[i] && graph.nodes[i].type === 'action');
  // fan-in: how many distinct parents each node has — the cross-link metric
  const fanIn = {};
  for (const id of ids) {
    if (!graph.nodes[id] || !graph.nodes[id].type) continue;
    let es; try { es = edgesOf(graph.nodes[id], id); } catch { continue; }
    for (const e of es) fanIn[e.to] = (fanIn[e.to] || 0) + 1;
  }
  const shared = ids.filter(i => (fanIn[i] || 0) > 1);

  return {
    errors, warnings, cycles,
    nodeCount: ids.length,
    actionCount: actions.length,
    edgeCount: ids.reduce((a, i) => a + edgesOf(graph.nodes[i], i).length, 0),
    sharedNodes: shared,
    reachable: seen.size,
  };
}

/**
 * Drop edges that point at nodes which are not present, then drop whatever
 * that leaves unreachable. This is what makes a subset of behaviour packs a
 * valid graph instead of a pile of dangling references — compose whichever
 * domains a project needs and the rest is pruned rather than throwing.
 *
 * @param {Object} nodes  raw node map (mutated copy is returned)
 * @param {string} root
 * @param {string} fallback  node every severed edge is redirected to
 * @returns {{ nodes:Object, pruned:{edges:number, nodes:string[]} }}
 */
function pruneGraph(nodes, root = 'root', fallback = 'act.observe') {
  const out = Object.assign({}, nodes);
  if (!out[fallback]) throw new GraphError(`Prune fallback "${fallback}" is not in the node set`, 'NO_FALLBACK');
  let severed = 0;
  const here = id => !!out[id];

  for (const id of Object.keys(out)) {
    const n = Object.assign({}, out[id]);
    switch (n.type) {
      case 'check': case 'gate':
        if (n.then && !here(n.then)) { n.then = fallback; severed++; }
        if (n.else && !here(n.else)) { n.else = fallback; severed++; }
        break;
      case 'switch': {
        const cases = {};
        for (const k of Object.keys(n.cases || {})) {
          if (here(n.cases[k])) cases[k] = n.cases[k]; else severed++;
        }
        n.cases = cases;
        if (!n.default || !here(n.default)) { n.default = fallback; severed++; }
        break;
      }
      case 'select': {
        const before = (n.options || []).length;
        n.options = (n.options || []).filter(o => here(o.to));
        severed += before - n.options.length;
        if (!n.options.length) { n.options = [{ to: fallback, weight: 1, why: 'every option for this branch was pruned out of the build' }]; }
        if (n.default && !here(n.default)) n.default = fallback;
        break;
      }
      case 'link':
        if (n.to && !here(n.to)) { n.to = fallback; severed++; }
        break;
    }
    if (n.onLoop && !here(n.onLoop)) delete n.onLoop;
    out[id] = n;
  }

  // drop anything no longer reachable
  const seen = new Set([root]), stack = [root];
  while (stack.length) {
    const id = stack.pop();
    if (!out[id]) continue;
    for (const e of edgesOf(out[id], id)) if (out[e.to] && !seen.has(e.to)) { seen.add(e.to); stack.push(e.to); }
  }
  const dropped = Object.keys(out).filter(id => !seen.has(id));
  for (const id of dropped) delete out[id];

  return { nodes: out, pruned: { edges: severed, nodes: dropped } };
}

/**
 * Walk the graph to a terminal action.
 *
 * @param {Object} graph
 * @param {Object} ctx  arbitrary decision context handed to every predicate
 * @param {Object} [opts] { rng, entry, maxDepth }
 * @returns {{ action, params, node, trace, path, depth }}
 */
function decide(graph, ctx, opts = {}) {
  const rng = opts.rng || Math.random;
  const maxDepth = opts.maxDepth || MAX_DEPTH;
  let id = opts.entry || graph.root;

  const trace = [];
  const path = [];
  const visited = new Set();

  for (let depth = 0; depth < maxDepth; depth++) {
    const node = graph.nodes[id];
    if (!node) throw new GraphError(`Traversal hit missing node "${id}"`, 'MISSING_NODE', { path });

    if (visited.has(id)) {
      // A back-link fired twice in one decision — the situation is
      // genuinely ambiguous. Bail to the node's own fallback rather than spin.
      trace.push({ node: id, type: node.type, outcome: 'revisit-break', reason: 'this branch had already been considered this tick, so I stopped going round' });
      if (node.onLoop && graph.nodes[node.onLoop]) { id = node.onLoop; continue; }
      // walk back up the path for the nearest ancestor that declares a loop exit
      let escaped = false;
      for (let k = path.length - 1; k >= 0; k--) {
        const anc = graph.nodes[path[k]];
        if (anc && anc.onLoop && graph.nodes[anc.onLoop] && !visited.has(anc.onLoop)) {
          id = anc.onLoop; escaped = true; break;
        }
      }
      if (escaped) continue;
      if (graph.fallback && !visited.has(graph.fallback)) { id = graph.fallback; continue; }
      break;
    }
    visited.add(id);
    path.push(id);

    if (node.type === 'action') {
      const params = node.params ? node.params(ctx) : {};
      trace.push({
        node: id, type: 'action', outcome: node.act,
        reason: typeof node.why === 'function' ? node.why(ctx) : (node.why || `committed to ${node.act}`),
      });
      return { action: node.act, params, node: id, trace, path, depth };
    }

    if (node.type === 'link') {
      trace.push({ node: id, type: 'link', outcome: node.to, reason: node.why || `handed off to ${node.to}` });
      id = node.to;
      continue;
    }

    if (node.type === 'check' || node.type === 'gate') {
      const r = !!node.test(ctx);
      const next = r ? node.then : node.else;
      trace.push({
        node: id, type: node.type, outcome: r ? 'then' : 'else', next,
        reason: typeof node.why === 'function' ? node.why(ctx, r)
              : (node.why ? `${node.why} -> ${r ? 'yes' : 'no'}` : `${id}: ${r}`),
      });
      if (!next) throw new GraphError(`Node ${id} has no ${r ? 'then' : 'else'} branch`, 'DEAD_BRANCH', { path });
      id = next;
      continue;
    }

    if (node.type === 'switch') {
      const key = node.on(ctx);
      const next = (node.cases && node.cases[key]) || node.default;
      trace.push({
        node: id, type: 'switch', outcome: String(key), next,
        reason: typeof node.why === 'function' ? node.why(ctx, key) : (node.why ? `${node.why}: ${key}` : `${id} -> ${key}`),
      });
      if (!next) throw new GraphError(`Switch ${id} had no case for "${key}" and no default`, 'NO_CASE', { path });
      id = next;
      continue;
    }

    if (node.type === 'select') {
      const scored = [];
      let total = 0;
      for (const o of node.options) {
        if (o.guard && !o.guard(ctx)) continue;
        const w = Math.max(0, typeof o.weight === 'function' ? o.weight(ctx) : (o.weight ?? 1));
        if (w <= 0) continue;
        scored.push({ to: o.to, w, why: o.why });
        total += w;
      }
      if (!scored.length) {
        if (node.default && graph.nodes[node.default]) {
          trace.push({ node: id, type: 'select', outcome: 'no-viable-option', next: node.default, reason: 'every option was guarded out' });
          id = node.default; continue;
        }
        throw new GraphError(`Select ${id} had no viable options`, 'NO_OPTIONS', { path });
      }
      let r = rng() * total, pick = scored[scored.length - 1];
      for (const s of scored) { r -= s.w; if (r <= 0) { pick = s; break; } }
      trace.push({
        node: id, type: 'select', outcome: pick.to, next: pick.to,
        reason: pick.why || `weighted pick ${(pick.w / total * 100).toFixed(0)}%`,
        considered: scored.map(s => ({ to: s.to, p: +(s.w / total).toFixed(3), why: s.why })),
      });
      id = pick.to;
      continue;
    }

    throw new GraphError(`Unknown node type "${node.type}" at ${id}`, 'BAD_NODE_TYPE', { path });
  }

  // Exhausted without landing on an action. In a cross-linked graph this is a
  // legitimate outcome, not a crash — take the declared fallback if there is one.
  if (graph.fallback) {
    const fb = graph.nodes[graph.fallback];
    if (fb && fb.type === 'action') {
      trace.push({ node: graph.fallback, type: 'action', outcome: fb.act,
                   reason: 'every branch I tried looped back on itself, so I fell back to watching and waiting' });
      return { action: fb.act, params: fb.params ? fb.params(ctx) : {}, node: graph.fallback,
               trace, path: path.concat(graph.fallback), depth: path.length, exhausted: true };
    }
  }
  throw new GraphError('Decision exceeded max depth without reaching an action', 'DEPTH_EXCEEDED', { path, trace });
}

/**
 * Render a trace as the plain-language chain of reasoning behind an action.
 * This is the "what made me take this action" field, verbatim.
 */
function explainTrace(trace) {
  return trace
    .filter(t => t.type !== 'link' || t.reason)
    .map(t => t.reason)
    .filter(Boolean);
}

/** Compact one-line form: "root > threat.check > survival.entry > flee" */
function pathString(path) { return path.join(' > '); }

/** Mermaid source for the whole graph. Handy for eyeballing the cross-links. */
function toMermaid(graph) {
  const lines = ['graph TD'];
  const shape = { action: id => `${id}(["${id}"])`, select: id => `${id}{{"${id}"}}`,
                  switch: id => `${id}{"${id}"}`, check: id => `${id}{"${id}"}`,
                  gate: id => `${id}{"${id}"}`, link: id => `${id}[/"${id}"/]` };
  const safe = s => s.replace(/[^A-Za-z0-9_]/g, '_');
  for (const id of Object.keys(graph.nodes)) {
    const n = graph.nodes[id];
    lines.push('  ' + (shape[n.type] || (x => `${x}["${x}"]`))(safe(id)).replace(safe(id) + '(["', safe(id) + '(["'));
    for (const e of edgesOf(n, id)) {
      lines.push(`  ${safe(id)} -->${e.label ? `|${e.label}|` : ''} ${safe(e.to)}`);
    }
  }
  return lines.join('\n');
}

export { createGraph, validateGraph, pruneGraph, decide, edgesOf, explainTrace, pathString, toMermaid, GraphError, MAX_DEPTH };
