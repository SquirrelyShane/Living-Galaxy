// NPC_Avatar — grammar.
//
// A small Tracery-style expander. This is Tier 2 of the brain, and it is the tier that
// matters most for a phone: it costs nothing — no model, no worker, no await — and it is
// what makes a hundred ambient NPCs feel individually voiced instead of reading from the
// same three lines. The language-model tier exists to enrich the handful of moments that
// are actually worth the cost; the grammar tier is what every character has all the time.
//
// A grammar is a plain object: `{ symbolName: [rule, rule, ...], ... }`. A rule is either
// a string, or `{ text, weight, when }`:
//
//   text   — a string containing `#otherSymbol#` tokens to recurse into, OR a function
//            `(ctx) => string` for anything that needs a live value (a name, a number,
//            a place) rather than a fixed line.
//   weight — relative pick probability, default 1. A character who is more aggression
//            should not need a different grammar, just rules that raise their own
//            weight `when` aggression is high.
//   when   — `(ctx) => boolean`. Gates the rule out entirely rather than just weighting
//            it down, for lines that would be actively wrong outside a condition (a
//            "we've met before" line with no prior memory of the listener).
//
// `ctx` is caller-supplied and typically carries `{ traits, memory, ...situation }` — the
// grammar file authors decide what conditions and interpolations they want to read from
// it. This module has no opinion about what goes in ctx; it only expands symbols.

const TOKEN = /#([\w-]+)#/g;

/**
 * Expand `symbol` against `grammar` using `ctx` for conditions/interpolation and `rng`
 * (anything exposing `.next()` in [0,1), or a plain function) for rule selection.
 *
 * A missing symbol resolves to `#symbol#` literally rather than throwing — a visibly
 * broken token in a test or in play is a bug report; a thrown exception mid-frame is an
 * outage. `maxDepth` guards against a grammar that recurses into itself.
 */
export function expand(grammar, symbol, ctx = {}, rng = Math.random, maxDepth = 6) {
  const next = typeof rng === 'function' ? rng : () => rng.next();
  return expandOne(grammar, symbol, ctx, next, maxDepth);
}

function expandOne(grammar, symbol, ctx, next, depth) {
  if (depth <= 0) return `#${symbol}#`;
  const rules = grammar[symbol];
  if (!rules || !rules.length) return `#${symbol}#`;

  const normalized = rules.map(r => (typeof r === 'string' ? { text: r, weight: 1 } : r));
  let pool = normalized.filter(r => !r.when || safeWhen(r.when, ctx));
  if (!pool.length) pool = normalized;              // an over-constrained rule set still answers

  const total = pool.reduce((a, r) => a + (r.weight || 1), 0);
  let roll = next() * total;
  let chosen = pool[pool.length - 1];
  for (const r of pool) {
    roll -= (r.weight || 1);
    if (roll <= 0) { chosen = r; break; }
  }

  const raw = typeof chosen.text === 'function' ? safeFn(chosen.text, ctx) : chosen.text;
  return String(raw).replace(TOKEN, (_, name) => expandOne(grammar, name, ctx, next, depth - 1));
}

// A bad `when`/`text` function should degrade the line, not crash the frame it fires in.
function safeWhen(fn, ctx) { try { return !!fn(ctx); } catch (e) { return false; } }
function safeFn(fn, ctx) { try { return fn(ctx); } catch (e) { return ''; } }

/** Merge grammars — a per-NPC "voice pack" layered over a shared base. Later wins. */
export function mergeGrammars(...grammars) {
  const out = {};
  for (const g of grammars) for (const k in g) out[k] = g[k];
  return out;
}

// ── shared helpers grammar authors reach for constantly ────────────────
export const cap1 = s => s ? s[0].toUpperCase() + s.slice(1) : s;
export const pick = (arr, next) => arr[Math.floor((typeof next === 'function' ? next() : next.next()) * arr.length)];
