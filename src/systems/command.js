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
import { recordDiagnostic } from '../data/npc-kb/index.js';
import { pickHull, freeHulls, roster, hireHull, releaseHull, setHullMode, fleetRoster,
         transferHull, ownerOf, OWNER } from './fleet.js';

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

  // Bind a real contracted hull.
  //
  // Until v1.01.80 the asset was always synthetic — `wing-mil-patrol-30`, a name and a
  // role and no ship in the world. Now the roster is consulted first: an explicit
  // `contractId` wins, otherwise the best free hull whose role the order type accepts.
  // Only if the company has no roster at all do we fall back to the synthetic wing, and
  // that fallback exists purely so a save from v1.01.72–76 keeps working.
  const spec = FLEET_ORDER_TYPES[orderSpec.type];
  let contract = null;
  if (overrides.contractId) {
    contract = roster().find(c => c.id === overrides.contractId) || null;
    if (!contract) {
      return { ok: false, text: 'That hull is not under contract.', error: 'no-contract' };
    }
    if (contract.orderId) {
      return { ok: false, text: `${contract.name} is already on an objective.`, error: 'hull-busy' };
    }
    if (spec && spec.requires && !spec.requires.includes(contract.role)) {
      return {
        ok: false,
        error: 'hull-role',
        text: `${contract.name} is a ${contract.role} hull — ${spec.name} needs ${spec.requires.join(' or ')}.`
      };
    }
  } else if (roster().length) {
    contract = pickHull(spec && spec.requires);
    if (!contract) {
      const idle = freeHulls().length;
      const need = (spec && spec.requires) ? spec.requires.join('/') : 'a';
      return {
        ok: false,
        error: 'no-hull',
        text: idle
          ? `No free ${need} hull under contract — ${idle} idle, none of the right class.`
          : 'Every contracted hull is already on an objective.'
      };
    }
  }

  if (contract) {
    asset.id = contract.id;
    asset.name = contract.name;
    asset.role = contract.role;
    asset.contractId = contract.id;
    // A hull's own default mode wins unless the leaf or the caller said otherwise.
    if (!overrides.mode && !resolved.order.mode && contract.mode) orderSpec.mode = contract.mode;
  }

  // Optional: bind a real named asset if the caller supplied one.
  if (overrides.assetId) asset.id = overrides.assetId;
  if (overrides.assetName) asset.name = overrides.assetName;
  if (overrides.assetRole) asset.role = overrides.assetRole;
  if (overrides.mode) orderSpec.mode = overrides.mode;
  if (overrides.durationSec != null) orderSpec.durationSec = overrides.durationSec;
  if (overrides.target) orderSpec.target = overrides.target;

  asset.contractId = contract ? contract.id : (asset.contractId || null);

  const result = dispatchFleet(orderSpec.type, asset, {
    // A quota travels with the leaf. Without this the menu's "Quota 2,000 kg" dispatched
    // an objective with no quota at all, which then never completed.
    quotaKg: orderSpec.quotaKg != null ? orderSpec.quotaKg
           : (orderSpec.params && orderSpec.params.quotaKg != null ? orderSpec.params.quotaKg : undefined),
    mode: orderSpec.mode,
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
    context: {
      orderId: result.id, type: orderSpec.type, mode: orderSpec.mode,
      target: orderSpec.target, contractId: contract ? contract.id : null
    },
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
    active: fleetOrderReport(),
    hulls: fleetRoster()
  };
}

export { COMMAND_MENU, resolveMenuPath, intentFromUtterance, findNode, allLeaves, branchLabels };

/** Hire a hull by NPC name, through the same module Ops and ARIA already talk to. */
export function commandHire(npcName) {
  const r = hireHull(npcName);
  return r.ok
    ? { ok: true, text: `${r.contract.name} signed — ${r.contract.role} hull.`, contract: r.contract }
    : { ok: false, text: r.reason, error: 'hire' };
}

/** End a contract, recalling the hull's objective first if it has one. */
export function commandRelease(id) {
  const c = roster().find(x => x.id === id || x.name.toLowerCase() === String(id).toLowerCase());
  if (!c) return { ok: false, text: 'No such contract.', error: 'not-found' };
  if (c.orderId) recallFleet(c.orderId);
  const r = releaseHull(c.id);
  return r.ok ? { ok: true, text: `${c.name} released.` } : { ok: false, text: r.reason, error: 'release' };
}

/** Set the mode a hull's next objective defaults to. */
export function commandHullMode(id, mode) {
  const c = roster().find(x => x.id === id);
  if (!c) return { ok: false, text: 'No such contract.', error: 'not-found' };
  setHullMode(c.id, mode);
  return { ok: true, text: `${c.name} defaults to ${c.mode}.`, mode: c.mode };
}

/** Hand a hull to the pilot, or take one into the company. */
export function commandTransfer(id, to) {
  const r = transferHull(id, to);
  return r.ok
    ? { ok: true, text: `Transferred — now ${r.owner === 'player' ? 'your ship' : 'company property'}.`, owner: r.owner }
    : { ok: false, text: r.reason, error: 'transfer' };
}

export { fleetRoster, ownerOf, OWNER };
export { hullsAvailable, fleetBrief } from './fleet.js';
