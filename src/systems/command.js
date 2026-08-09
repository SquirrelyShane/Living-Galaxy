// Living Galaxy — executive command resolver.
//
// Single place that turns a menu path or a natural-language request into a
// structured fleet order and dispatches it. Ops UI and ARIA both call here so
// the two surfaces cannot emit different shapes.

import { S } from '../core/state.js';
import { hasCompany } from './company.js';
import { dispatchFleet, recallFleet, fleetOrderReport, FLEET_ORDER_TYPES } from './orders.js';
import {
  COMMAND_MENU, resolveMenuPath, intentFromUtterance, findNode, allLeaves, branchLabels
} from '../data/command-menu.js';
import { recordDiagnostic } from '../data/npc-kb/diagnostics.js';

/**
 * Execute a resolved menu payload (from resolveMenuPath or intentFromUtterance).
 * Returns { ok, text, order, error }.
 */
export function executeResolved(resolved, overrides = {}) {
  if (!resolved || !resolved.ok) {
    return { ok: false, text: (resolved && resolved.error) || 'Cannot resolve command', error: resolved && resolved.error };
  }
  if (!hasCompany()) {
    return { ok: false, text: 'No company on file — executive command requires a charter.', error: 'no-company' };
  }

  const orderSpec = Object.assign({}, resolved.order, overrides.order || {});
  const asset = Object.assign({}, resolved.asset, overrides.asset || {});

  // Optional: bind a real named asset if the caller supplied one.
  if (overrides.assetId) asset.id = overrides.assetId;
  if (overrides.assetName) asset.name = overrides.assetName;
  if (overrides.assetRole) asset.role = overrides.assetRole;
  if (overrides.mode) orderSpec.mode = overrides.mode;
  if (overrides.durationSec != null) orderSpec.durationSec = overrides.durationSec;
  if (overrides.target) orderSpec.target = overrides.target;

  const result = dispatchFleet(orderSpec.type, asset, {
    durationSec: orderSpec.durationSec,
    mode: orderSpec.mode,
    target: orderSpec.target,
    params: orderSpec.params || {}
  });

  if (typeof result === 'string') {
    return { ok: false, text: result, error: result };
  }

  recordDiagnostic({
    subjectId: asset.id,
    t: S.time || 0,
    kind: 'order',
    situation: `fleet:${orderSpec.type}`,
    summary: `${asset.name} dispatched: ${FLEET_ORDER_TYPES[orderSpec.type]?.name || orderSpec.type}` +
      (orderSpec.durationSec > 0 ? ` (${orderSpec.durationSec}s)` : ' (until recalled)') +
      (orderSpec.mode === 'passive' ? ' [passive]' : ''),
    context: { orderId: result.id, type: orderSpec.type, mode: orderSpec.mode, target: orderSpec.target },
    salience: 0.7,
    tags: ['fleet', orderSpec.type, orderSpec.mode || 'active', resolved.node?.branch || '']
  });

  const timer = orderSpec.durationSec > 0 ? ` · ${orderSpec.durationSec}s timer` : ' · until recalled';
  const mode = orderSpec.mode === 'passive' ? ' (passive)' : '';
  return {
    ok: true,
    text: `${asset.name} assigned ${FLEET_ORDER_TYPES[orderSpec.type]?.name || orderSpec.type}` +
          (orderSpec.target ? ` at ${orderSpec.target}` : '') + timer + mode + '.',
    order: result,
    node: resolved.node || null
  };
}

/** Dispatch by walking a menu path of node ids. */
export function commandByPath(pathIds, overrides) {
  return executeResolved(resolveMenuPath(pathIds), overrides);
}

/** Dispatch by leaf node id alone. */
export function commandById(leafId, overrides) {
  const node = findNode(leafId);
  if (!node || !node.order) {
    return { ok: false, text: `Unknown command leaf: ${leafId}`, error: 'unknown-leaf' };
  }
  return executeResolved({
    ok: true,
    node,
    order: Object.assign({}, node.order),
    asset: {
      id: 'wing-' + node.id,
      name: node.assetName || node.label,
      role: node.assetRole || 'combat'
    }
  }, overrides);
}

/**
 * Dispatch from free-form text. Used by ARIA tools and rule matching.
 * Returns the same { ok, text, order, error } shape.
 */
export function commandFromText(text, overrides) {
  const resolved = intentFromUtterance(text);
  return executeResolved(resolved, overrides);
}

/** Recall by order id or by asset name substring. */
export function commandRecall(query) {
  const list = fleetOrderReport();
  if (!list.length) return { ok: false, text: 'No fleet objectives to recall.', error: 'empty' };
  const q = String(query || '').toLowerCase();
  let hit = null;
  if (!q || q === 'all' || q === 'last') {
    hit = list[list.length - 1];
  } else {
    hit = list.find(f => f.id === query) ||
          list.find(f => (f.asset || '').toLowerCase().includes(q)) ||
          list.find(f => (f.type || '').toLowerCase() === q) ||
          list.find(f => (f.name || '').toLowerCase().includes(q));
  }
  if (!hit) return { ok: false, text: `No matching objective for "${query}".`, error: 'not-found' };
  recallFleet(hit.id);
  return { ok: true, text: `${hit.asset} recalled from ${hit.name}.`, orderId: hit.id };
}

/** Snapshot for UI / ARIA: branches, open fleet, leaf catalogue. */
export function commandCatalogue() {
  return {
    branches: branchLabels(),
    leaves: allLeaves().map(n => ({
      id: n.id,
      label: n.label,
      branch: n.order && (COMMAND_MENU.find(b => JSON.stringify(b).includes(n.id)) || {}).branch,
      type: n.order.type,
      mode: n.order.mode,
      durationSec: n.order.durationSec,
      target: n.order.target
    })),
    active: fleetOrderReport()
  };
}

export { COMMAND_MENU, resolveMenuPath, intentFromUtterance, findNode, allLeaves, branchLabels };
