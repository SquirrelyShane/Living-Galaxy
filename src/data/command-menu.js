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
              // No timer. A quota objective that also carries a countdown completes on
              // whichever lands first, which in practice was always the countdown — the
              // hull had not finished its first run to the berth at 120s.
              type: 'extract', durationSec: 0, mode: 'active', target: 'belt',
              quotaKg: 2000,
              params: { quotaKg: 2000, singleLoad: false }
            }
          },
          {
            id: 'ind-extract-single',
            label: 'Single load — fill and return',
            prompt: 'One load, then return, then stand down.',
            assetRole: 'mine',
            assetName: 'Cutter wing',
            order: {
              // One hold's worth. The miner runs in at HOLD.minerRunAt of capacity, so the
              // quota is set below a full hold or the objective would need a second trip
              // to clear a target it called "single load".
              type: 'extract', durationSec: 0, mode: 'active', target: 'belt',
              quotaKg: 1800,
              params: { quotaKg: 1800, singleLoad: true }
            }
          },
          {
            id: 'ind-extract-passive',
            label: 'Passive extract — until recalled',
            prompt: 'Work the face, run each load in to the office, go again. Recall when ready.',
            assetRole: 'mine',
            assetName: 'Cutter wing',
            order: {
              // No quota and no timer: the loop repeats until somebody stops it. Each full
              // hold is run in to the company office and banked, then the hull goes back
              // out — which is what "passive" was always supposed to mean and never did.
              type: 'extract', durationSec: 0, mode: 'passive', target: 'belt',
              quotaKg: 0,
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
  },

  // ── v1.02.35: the construction desk ─────────────────────────────────
  //
  // A whole branch, because the `build` role had no entry anywhere in this tree — which is
  // the other half of "construction ships can do nothing". A job that exists in
  // `FLEET_ORDER_TYPES` but has no leaf here is reachable only from ARIA or the console,
  // and this project's own reachability rule says every player-facing verb needs a door.
  {
    id: 'construction',
    label: 'Construction',
    prompt: 'Construction desk. Build what we have on order, hire the crew out, or recover what is already floating.',
    branch: 'industrial',
    children: [
      {
        id: 'con-build',
        label: 'Erect company order book',
        prompt: 'Work our own projects. Treasury pays as the work goes in.',
        children: [
          {
            id: 'con-build-passive',
            label: 'Work the book — until recalled',
            prompt: 'Take the order book from the top and keep going.',
            assetRole: 'build', assetName: 'Construction crew',
            order: { type: 'construct', durationSec: 0, mode: 'passive', target: 'company',
                     params: { source: 'company' } }
          },
          {
            id: 'con-build-one',
            label: 'One project, then stand down',
            prompt: 'Finish the next project on the book and report.',
            assetRole: 'build', assetName: 'Construction crew',
            order: { type: 'construct', durationSec: 0, mode: 'active', target: 'company',
                     params: { source: 'company' } }
          }
        ]
      },
      {
        id: 'con-contract',
        label: 'Hire the crew out',
        prompt: 'Paid labour on somebody else\'s scaffold. Builds their thing, pays our people.',
        children: [
          {
            id: 'con-contract-passive',
            label: 'Contract labour — until recalled',
            prompt: 'Take whatever scaffold needs a crew.',
            assetRole: 'build', assetName: 'Construction crew',
            order: { type: 'construct', durationSec: 0, mode: 'passive', target: 'contract',
                     params: { source: 'contract' } }
          }
        ]
      },
      {
        id: 'con-salvage',
        label: 'Salvage sweep',
        prompt: 'Recover containers and wreckage and run them in.',
        children: [
          {
            id: 'con-salvage-passive',
            label: 'Sweep until recalled',
            prompt: 'Work the field. Run a full hold in and go again.',
            assetRole: 'build', assetName: 'Recovery crew',
            order: { type: 'salvage', durationSec: 0, mode: 'passive', target: 'field', params: {} }
          },
          {
            id: 'con-salvage-4k',
            label: 'Recover 4,000 kg then stand down',
            prompt: 'Four tonnes recovered and landed, then report.',
            assetRole: 'build', assetName: 'Recovery crew',
            order: { type: 'salvage', durationSec: 0, mode: 'active', target: 'field',
                     quotaKg: 4000, params: { quotaKg: 4000 } }
          }
        ]
      },
      {
        id: 'con-prospect',
        label: 'Prospecting run',
        prompt: 'Deep-scan a field so a later extraction order pays better.',
        children: [
          {
            id: 'con-prospect-passive',
            label: 'Prospect until fully read out',
            prompt: 'Stay on the field until the assay is full.',
            assetRole: 'build', assetName: 'Survey crew',
            order: { type: 'prospect', durationSec: 0, mode: 'passive', target: 'field', params: {} }
          }
        ]
      }
    ]
  },

  // ── the tender desk ─────────────────────────────────────────────────
  {
    id: 'support',
    label: 'Support',
    prompt: 'Support desk. Keep our own hulls working instead of bringing them home.',
    branch: 'logistic',
    children: [
      {
        id: 'sup-tender',
        label: 'Fleet tender',
        prompt: 'Run repairs out to whoever needs them.',
        children: [
          {
            id: 'sup-tender-passive',
            label: 'Stand by fleet — until recalled',
            prompt: 'Patch whoever is worst off, then the next.',
            assetRole: 'haul', assetName: 'Tender',
            order: { type: 'tender', durationSec: 0, mode: 'passive', target: 'fleet', params: {} }
          },
          {
            id: 'sup-tender-one',
            label: 'Restore one hull, then stand down',
            prompt: 'Take the worst casualty back to full and report.',
            assetRole: 'haul', assetName: 'Tender',
            order: { type: 'tender', durationSec: 0, mode: 'active', target: 'fleet', params: {} }
          }
        ]
      },
      {
        id: 'sup-hunt',
        label: 'Bounty hunt',
        prompt: 'Go and find them rather than wait on a lane.',
        children: [
          {
            id: 'sup-hunt-passive',
            label: 'Hunt until recalled',
            prompt: 'Sweep for hostiles and engage. Paid on kills.',
            assetRole: 'merc', assetName: 'Hunter',
            order: { type: 'hunt', durationSec: 0, mode: 'passive', target: 'hostiles', params: {} }
          },
          {
            id: 'sup-hunt-3',
            label: 'Three kills, then stand down',
            prompt: 'Three confirmed, then bring it home.',
            assetRole: 'merc', assetName: 'Hunter',
            order: { type: 'hunt', durationSec: 0, mode: 'active', target: 'hostiles',
                     params: { quotaKills: 3 } }
          }
        ]
      },
      {
        id: 'sup-arb',
        label: 'Arbitrage',
        prompt: 'Work the widest spread in the system.',
        children: [
          {
            id: 'sup-arb-ore',
            label: 'Ore spread — until recalled',
            prompt: 'Buy the cheapest ore, sell it at the dearest berth, repeat.',
            assetRole: 'trade', assetName: 'Factor',
            order: { type: 'arbitrage', durationSec: 0, mode: 'passive', target: 'market',
                     params: { commodity: 'ore' } }
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
