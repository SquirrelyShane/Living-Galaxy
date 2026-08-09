// Living Galaxy — curated executive command dialogue menu.
//
// A hierarchical menu tree the Ops / HQ surface and ARIA both read. Every leaf
// resolves to the *same* structured fleet-order object that `dispatchFleet` accepts,
// so a button click and a natural-language request cannot diverge.
//
// Shape of a node:
//   id, label, prompt?     — dialogue line shown to the pilot
//   branch?                — industrial | logistic | economic | civilian | military
//   children?              — submenu
//   order?                 — { type, durationSec?, mode?, target?, params? }
//   assetRole?             — preferred hull role for the order
//   assetName?             — display name for the wing when no real asset is bound yet
//
// Leaves carry `order`. Internal nodes carry `children`. The UI walks the tree;
// `resolveMenuPath` / `intentFromUtterance` turn a selection or a sentence into an order.

/** Top-level branches matching the five company / planetary axes. */
export const COMMAND_MENU = [
  {
    id: 'military',
    label: 'Military',
    prompt: 'Military desk. Patrol, escort, or hold a sector.',
    branch: 'military',
    children: [
      {
        id: 'mil-patrol',
        label: 'Patrol',
        prompt: 'How long should the wing hold the sector?',
        children: [
          {
            id: 'mil-patrol-30',
            label: 'Quick sweep — 30 seconds',
            prompt: 'Thirty-second sweep, then auto-return.',
            assetRole: 'combat',
            assetName: 'Patrol wing',
            order: { type: 'patrol', durationSec: 30, mode: 'active', target: 'local-sector' }
          },
          {
            id: 'mil-patrol-90',
            label: 'Standard beat — 90 seconds',
            prompt: 'Ninety-second beat of the local sector.',
            assetRole: 'combat',
            assetName: 'Patrol wing',
            order: { type: 'patrol', durationSec: 90, mode: 'active', target: 'local-sector' }
          },
          {
            id: 'mil-patrol-passive',
            label: 'Passive watch — until recalled',
            prompt: 'Hold the sector passively. Alerts only on exception; no auto-return timer.',
            assetRole: 'combat',
            assetName: 'Watch wing',
            order: { type: 'patrol', durationSec: 0, mode: 'passive', target: 'local-sector' }
          }
        ]
      },
      {
        id: 'mil-escort',
        label: 'Escort',
        prompt: 'Assign an escort. Duration of the leg?',
        children: [
          {
            id: 'mil-escort-60',
            label: 'Short leg — 60 seconds',
            assetRole: 'combat',
            assetName: 'Escort wing',
            order: { type: 'escort', durationSec: 60, mode: 'active', target: 'designated-hull', params: { protectId: null } }
          },
          {
            id: 'mil-escort-180',
            label: 'Long leg — 3 minutes',
            assetRole: 'combat',
            assetName: 'Escort wing',
            order: { type: 'escort', durationSec: 180, mode: 'active', target: 'designated-hull', params: { protectId: null } }
          }
        ]
      },
      {
        id: 'mil-keep',
        label: 'Station-keep',
        prompt: 'Hold relative to a station or site and report contacts.',
        children: [
          {
            id: 'mil-keep-active',
            label: 'Active reporting',
            assetRole: 'combat',
            assetName: 'Picket',
            order: { type: 'station_keep', durationSec: 0, mode: 'active', target: 'nearest-station' }
          },
          {
            id: 'mil-keep-passive',
            label: 'Passive hold',
            assetRole: 'combat',
            assetName: 'Picket',
            order: { type: 'station_keep', durationSec: 0, mode: 'passive', target: 'nearest-station' }
          }
        ]
      }
    ]
  },

  {
    id: 'industrial',
    label: 'Industrial',
    prompt: 'Industrial desk. Extract ore, work a face, or deepen a survey pass.',
    branch: 'industrial',
    children: [
      {
        id: 'ind-extract',
        label: 'Extract',
        prompt: 'Mining objective. Quota and tempo?',
        children: [
          {
            id: 'ind-extract-2k',
            label: 'Quota 2,000 kg — multi-trip',
            prompt: 'Cut until 2,000 kg is in the book. Multiple trips allowed.',
            assetRole: 'mine',
            assetName: 'Cutter wing',
            order: {
              type: 'extract', durationSec: 120, mode: 'active', target: 'belt',
              params: { quotaKg: 2000, singleLoad: false }
            }
          },
          {
            id: 'ind-extract-single',
            label: 'Single load — fill and return',
            prompt: 'One load, then return. Timer tracks the leg.',
            assetRole: 'mine',
            assetName: 'Cutter wing',
            order: {
              type: 'extract', durationSec: 90, mode: 'active', target: 'belt',
              params: { quotaKg: null, singleLoad: true }
            }
          },
          {
            id: 'ind-extract-passive',
            label: 'Passive extract — until recalled',
            prompt: 'Keep the face working. No auto-return; recall when ready.',
            assetRole: 'mine',
            assetName: 'Cutter wing',
            order: {
              type: 'extract', durationSec: 0, mode: 'passive', target: 'belt',
              params: { quotaKg: null, singleLoad: false }
            }
          }
        ]
      },
      {
        id: 'ind-survey',
        label: 'Survey pass',
        prompt: 'Orbital survey of a body — no ground team.',
        children: [
          {
            id: 'ind-survey-45',
            label: 'Single pass — 45 seconds',
            assetRole: 'mine',
            assetName: 'Survey wing',
            order: { type: 'survey_pass', durationSec: 45, mode: 'active', target: 'nearest-body', params: { bodyName: null } }
          },
          {
            id: 'ind-survey-120',
            label: 'Deep pass — 2 minutes',
            assetRole: 'mine',
            assetName: 'Survey wing',
            order: { type: 'survey_pass', durationSec: 120, mode: 'active', target: 'nearest-body', params: { bodyName: null } }
          }
        ]
      }
    ]
  },

  {
    id: 'logistic',
    label: 'Logistical',
    prompt: 'Logistics desk. Move cargo, people, or empty hulls between points.',
    branch: 'logistic',
    children: [
      {
        id: 'log-haul',
        label: 'Haul cargo',
        prompt: 'Logistics run. Return leg?',
        children: [
          {
            id: 'log-haul-return',
            label: 'Deliver and return — 90 seconds',
            assetRole: 'haul',
            assetName: 'Hauler wing',
            order: {
              type: 'logistics', durationSec: 90, mode: 'active', target: 'nearest-station',
              params: { commodity: 'ore', returnAfter: true }
            }
          },
          {
            id: 'log-haul-oneway',
            label: 'One-way delivery — 60 seconds',
            assetRole: 'haul',
            assetName: 'Hauler wing',
            order: {
              type: 'logistics', durationSec: 60, mode: 'active', target: 'nearest-station',
              params: { commodity: 'ore', returnAfter: false }
            }
          },
          {
            id: 'log-haul-passive',
            label: 'Passive route — until recalled',
            assetRole: 'haul',
            assetName: 'Hauler wing',
            order: {
              type: 'logistics', durationSec: 0, mode: 'passive', target: 'nearest-station',
              params: { commodity: 'ore', returnAfter: true }
            }
          }
        ]
      },
      {
        id: 'log-people',
        label: 'Transport personnel',
        prompt: 'Move crew or passengers between stations / sites.',
        children: [
          {
            id: 'log-people-90',
            label: 'Personnel transfer — 90 seconds',
            assetRole: 'haul',
            assetName: 'Courier wing',
            order: {
              type: 'logistics', durationSec: 90, mode: 'active', target: 'nearest-station',
              params: { commodity: 'personnel', returnAfter: true }
            }
          }
        ]
      }
    ]
  },

  {
    id: 'economic',
    label: 'Economic',
    prompt: 'Economic desk. Station-keeping for market presence, or hold a trade lane.',
    branch: 'economic',
    children: [
      {
        id: 'eco-keep',
        label: 'Market presence',
        prompt: 'Hold near a trade hub and report the book.',
        children: [
          {
            id: 'eco-keep-active',
            label: 'Active presence',
            assetRole: 'trade',
            assetName: 'Factor wing',
            order: { type: 'station_keep', durationSec: 0, mode: 'active', target: 'trade-hub' }
          },
          {
            id: 'eco-keep-passive',
            label: 'Passive presence',
            assetRole: 'trade',
            assetName: 'Factor wing',
            order: { type: 'station_keep', durationSec: 0, mode: 'passive', target: 'trade-hub' }
          }
        ]
      },
      {
        id: 'eco-lane',
        label: 'Watch a trade lane',
        prompt: 'Patrol a corridor used by haulers — military hull preferred.',
        children: [
          {
            id: 'eco-lane-90',
            label: 'Lane watch — 90 seconds',
            assetRole: 'combat',
            assetName: 'Lane wing',
            order: { type: 'patrol', durationSec: 90, mode: 'active', target: 'trade-lane' }
          }
        ]
      }
    ]
  },

  {
    id: 'civilian',
    label: 'Civilian',
    prompt: 'Civilian desk. Survey passes and station-keeping for habitation support.',
    branch: 'civilian',
    children: [
      {
        id: 'civ-survey',
        label: 'Survey pass',
        prompt: 'Chart a body from orbit.',
        children: [
          {
            id: 'civ-survey-45',
            label: 'Chart pass — 45 seconds',
            assetRole: 'mine',
            assetName: 'Chart wing',
            order: { type: 'survey_pass', durationSec: 45, mode: 'active', target: 'nearest-body', params: { bodyName: null } }
          }
        ]
      },
      {
        id: 'civ-keep',
        label: 'Support station-keep',
        prompt: 'Hold near a habitation site.',
        children: [
          {
            id: 'civ-keep-passive',
            label: 'Passive support',
            assetRole: 'haul',
            assetName: 'Support wing',
            order: { type: 'station_keep', durationSec: 0, mode: 'passive', target: 'habitation' }
          }
        ]
      }
    ]
  }
];

/** Flatten every leaf for lookup by id. */
export function allLeaves(nodes = COMMAND_MENU, acc = []) {
  for (const n of nodes) {
    if (n.order) acc.push(n);
    if (n.children) allLeaves(n.children, acc);
  }
  return acc;
}

/** Find a node by id anywhere in the tree. */
export function findNode(id, nodes = COMMAND_MENU) {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const hit = findNode(id, n.children);
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * Resolve a path of node ids (root → … → leaf) into a dispatchable payload.
 * Returns { ok, order, asset, node, error }.
 */
export function resolveMenuPath(pathIds) {
  if (!Array.isArray(pathIds) || !pathIds.length) {
    return { ok: false, error: 'Empty menu path' };
  }
  let nodes = COMMAND_MENU;
  let node = null;
  for (const id of pathIds) {
    node = (nodes || []).find(n => n.id === id) || null;
    if (!node) return { ok: false, error: `Unknown menu node: ${id}` };
    nodes = node.children || null;
  }
  if (!node.order) return { ok: false, error: 'Path does not end on an order' };
  return {
    ok: true,
    node,
    order: Object.assign({}, node.order),
    asset: {
      id: 'wing-' + node.id,
      name: node.assetName || node.label,
      role: node.assetRole || 'combat'
    }
  };
}

/**
 * Map a free-form utterance onto a leaf when possible.
 * Conservative: only high-confidence patterns. Returns the same shape as resolveMenuPath.
 */
export function intentFromUtterance(text) {
  const q = String(text || '').toLowerCase();
  if (!q.trim()) return { ok: false, error: 'Empty request' };

  // Patrol
  if (/\bpatrol\b/.test(q) || /\bsweep\b/.test(q) || /\bbeat\b/.test(q)) {
    if (/\bpassive\b|\buntil recalled\b|\bhold watch\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-patrol', 'mil-patrol-passive']);
    }
    if (/\b90|ninety|standard\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-patrol', 'mil-patrol-90']);
    }
    return resolveMenuPath(['military', 'mil-patrol', 'mil-patrol-30']);
  }

  // Escort
  if (/\bescort\b/.test(q)) {
    if (/\b3\s*min|long|180\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-escort', 'mil-escort-180']);
    }
    return resolveMenuPath(['military', 'mil-escort', 'mil-escort-60']);
  }

  // Extract / mine
  if (/\b(extract|mine|mining|cutter|quota)\b/.test(q)) {
    if (/\bpassive\b|\buntil recalled\b/.test(q)) {
      return resolveMenuPath(['industrial', 'ind-extract', 'ind-extract-passive']);
    }
    if (/\bsingle\b|\bone load\b|\bfill and return\b/.test(q)) {
      return resolveMenuPath(['industrial', 'ind-extract', 'ind-extract-single']);
    }
    return resolveMenuPath(['industrial', 'ind-extract', 'ind-extract-2k']);
  }

  // Logistics / haul
  if (/\b(logistics|haul|hauler|deliver|cargo run|freight)\b/.test(q)) {
    if (/\bpassive\b|\buntil recalled\b/.test(q)) {
      return resolveMenuPath(['logistic', 'log-haul', 'log-haul-passive']);
    }
    if (/\bone[- ]way\b|\bno return\b/.test(q)) {
      return resolveMenuPath(['logistic', 'log-haul', 'log-haul-oneway']);
    }
    if (/\bpersonnel|crew|people|passengers?\b/.test(q)) {
      return resolveMenuPath(['logistic', 'log-people', 'log-people-90']);
    }
    return resolveMenuPath(['logistic', 'log-haul', 'log-haul-return']);
  }

  // Survey
  if (/\b(survey|chart|assay pass)\b/.test(q)) {
    if (/\bdeep|2\s*min|120\b/.test(q)) {
      return resolveMenuPath(['industrial', 'ind-survey', 'ind-survey-120']);
    }
    return resolveMenuPath(['industrial', 'ind-survey', 'ind-survey-45']);
  }

  // Station-keep / presence
  if (/\b(station[- ]?keep|picket|presence|hold position)\b/.test(q)) {
    if (/\bmarket|trade hub|factor\b/.test(q)) {
      return resolveMenuPath(['economic', 'eco-keep',
        /\bpassive\b/.test(q) ? 'eco-keep-passive' : 'eco-keep-active']);
    }
    if (/\bhabit|civilian|support\b/.test(q)) {
      return resolveMenuPath(['civilian', 'civ-keep', 'civ-keep-passive']);
    }
    return resolveMenuPath(['military', 'mil-keep',
      /\bpassive\b/.test(q) ? 'mil-keep-passive' : 'mil-keep-active']);
  }

  // Lane watch
  if (/\b(trade lane|lane watch)\b/.test(q)) {
    return resolveMenuPath(['economic', 'eco-lane', 'eco-lane-90']);
  }

  return { ok: false, error: 'No matching command in the menu' };
}

/** Top-level labels for UI chrome. */
export function branchLabels() {
  return COMMAND_MENU.map(n => ({ id: n.id, label: n.label, prompt: n.prompt, branch: n.branch }));
}
