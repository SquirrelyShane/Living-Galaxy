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
<<<<<<< HEAD

/** Top-level branches matching the five company / planetary axes. */
export const COMMAND_MENU = [
  {
    id: 'military',
    label: 'Military',
    prompt: 'Military desk. Patrol, escort, or hold a sector.',
=======
//
// Expanded v1.03 — significantly more choice, depth, durations, modes, targets,
// quotas, and specialized sub-branches while preserving the original leaf → order contract.

/** Top-level branches matching the company / planetary axes + support & construction desks. */
export const COMMAND_MENU = [
  // ═══════════════════════════════════════════════════════════════════════════
  // MILITARY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'military',
    label: 'Military',
    prompt: 'Military desk. Patrol, escort, intercept, blockade, raid, or hold a sector.',
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
    branch: 'military',
    children: [
      {
        id: 'mil-patrol',
        label: 'Patrol',
<<<<<<< HEAD
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
=======
        prompt: 'How long and how aggressively should the wing hold the sector?',
        children: [
          {
            id: 'mil-patrol-quick',
            label: 'Quick options',
            prompt: 'Short-duration sweeps.',
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
                id: 'mil-patrol-60',
                label: 'Extended sweep — 60 seconds',
                prompt: 'One-minute active sweep of the local sector.',
                assetRole: 'combat',
                assetName: 'Patrol wing',
                order: { type: 'patrol', durationSec: 60, mode: 'active', target: 'local-sector' }
              },
              {
                id: 'mil-patrol-90',
                label: 'Standard beat — 90 seconds',
                prompt: 'Ninety-second beat of the local sector.',
                assetRole: 'combat',
                assetName: 'Patrol wing',
                order: { type: 'patrol', durationSec: 90, mode: 'active', target: 'local-sector' }
              }
            ]
          },
          {
            id: 'mil-patrol-long',
            label: 'Long-duration options',
            prompt: 'Extended presence without constant micromanagement.',
            children: [
              {
                id: 'mil-patrol-300',
                label: 'Long beat — 5 minutes',
                prompt: 'Five-minute active patrol circuit.',
                assetRole: 'combat',
                assetName: 'Patrol wing',
                order: { type: 'patrol', durationSec: 300, mode: 'active', target: 'local-sector' }
              },
              {
                id: 'mil-patrol-600',
                label: 'Extended presence — 10 minutes',
                prompt: 'Ten-minute sector presence, then return.',
                assetRole: 'combat',
                assetName: 'Patrol wing',
                order: { type: 'patrol', durationSec: 600, mode: 'active', target: 'local-sector' }
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
            id: 'mil-patrol-aggressive',
            label: 'Aggressive / area denial',
            prompt: 'Higher engagement posture or specific target zones.',
            children: [
              {
                id: 'mil-patrol-aggro-90',
                label: 'Aggressive sweep — 90 seconds',
                prompt: 'Challenge every contact. High readiness.',
                assetRole: 'combat',
                assetName: 'Interceptor wing',
                order: {
                  type: 'patrol', durationSec: 90, mode: 'aggressive', target: 'local-sector',
                  params: { engagement: 'high', challenge: true }
                }
              },
              {
                id: 'mil-patrol-aggro-passive',
                label: 'Aggressive hold — until recalled',
                prompt: 'Deny the sector. Engage on contact, stay until recalled.',
                assetRole: 'combat',
                assetName: 'Interceptor wing',
                order: {
                  type: 'patrol', durationSec: 0, mode: 'aggressive', target: 'local-sector',
                  params: { engagement: 'high', challenge: true }
                }
              },
              {
                id: 'mil-patrol-outer',
                label: 'Outer marker sweep — 3 minutes',
                prompt: 'Patrol the outer approaches rather than the core sector.',
                assetRole: 'combat',
                assetName: 'Perimeter wing',
                order: {
                  type: 'patrol', durationSec: 180, mode: 'active', target: 'outer-marker',
                  params: { zone: 'perimeter' }
                }
              }
            ]
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
          }
        ]
      },
      {
        id: 'mil-escort',
        label: 'Escort',
<<<<<<< HEAD
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
=======
        prompt: 'Assign an escort. Duration, posture, and protected asset?',
        children: [
          {
            id: 'mil-escort-timed',
            label: 'Timed legs',
            prompt: 'Fixed-duration escort assignments.',
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
              },
              {
                id: 'mil-escort-300',
                label: 'Extended leg — 5 minutes',
                assetRole: 'combat',
                assetName: 'Escort wing',
                order: { type: 'escort', durationSec: 300, mode: 'active', target: 'designated-hull', params: { protectId: null } }
              }
            ]
          },
          {
            id: 'mil-escort-special',
            label: 'Special escort postures',
            prompt: 'Convoy, VIP, or continuous cover.',
            children: [
              {
                id: 'mil-escort-convoy',
                label: 'Convoy cover — until destination',
                prompt: 'Stay with the convoy until it reaches the designated berth.',
                assetRole: 'combat',
                assetName: 'Convoy escort',
                order: {
                  type: 'escort', durationSec: 0, mode: 'active', target: 'convoy',
                  params: { protectId: null, formation: 'convoy', returnAfter: false }
                }
              },
              {
                id: 'mil-escort-vip',
                label: 'VIP close escort — 4 minutes',
                prompt: 'Tight formation on a high-value hull. Maximum readiness.',
                assetRole: 'combat',
                assetName: 'VIP escort',
                order: {
                  type: 'escort', durationSec: 240, mode: 'aggressive', target: 'designated-hull',
                  params: { protectId: null, formation: 'close', priority: 'vip' }
                }
              },
              {
                id: 'mil-escort-passive',
                label: 'Continuous cover — until recalled',
                prompt: 'Remain with the protected asset indefinitely. Alerts on threat only.',
                assetRole: 'combat',
                assetName: 'Escort wing',
                order: {
                  type: 'escort', durationSec: 0, mode: 'passive', target: 'designated-hull',
                  params: { protectId: null }
                }
              }
            ]
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
          }
        ]
      },
      {
        id: 'mil-keep',
<<<<<<< HEAD
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
=======
        label: 'Station-keep / picket',
        prompt: 'Hold relative to a station, site, or jump point and report contacts.',
        children: [
          {
            id: 'mil-keep-station',
            label: 'Near station / site',
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
              },
              {
                id: 'mil-keep-aggro',
                label: 'Aggressive picket',
                prompt: 'Challenge unknown contacts. High readiness.',
                assetRole: 'combat',
                assetName: 'Picket',
                order: {
                  type: 'station_keep', durationSec: 0, mode: 'aggressive', target: 'nearest-station',
                  params: { engagement: 'high' }
                }
              }
            ]
          },
          {
            id: 'mil-keep-special',
            label: 'Special positions',
            children: [
              {
                id: 'mil-keep-jump',
                label: 'Jump-point picket — until recalled',
                prompt: 'Hold the jump approach and report every transit.',
                assetRole: 'combat',
                assetName: 'Jump picket',
                order: {
                  type: 'station_keep', durationSec: 0, mode: 'active', target: 'jump-point',
                  params: { reportTransits: true }
                }
              },
              {
                id: 'mil-keep-asteroid',
                label: 'Asteroid-field overwatch — 5 minutes',
                prompt: 'Cover a mining cluster from a standoff position.',
                assetRole: 'combat',
                assetName: 'Overwatch',
                order: {
                  type: 'station_keep', durationSec: 300, mode: 'active', target: 'asteroid-field',
                  params: { standoff: true }
                }
              }
            ]
          }
        ]
      },
      {
        id: 'mil-intercept',
        label: 'Intercept / pursuit',
        prompt: 'Close with a designated contact or unknown bogey.',
        children: [
          {
            id: 'mil-intercept-quick',
            label: 'Quick intercept — 45 seconds',
            prompt: 'Close and identify, then stand by for further orders.',
            assetRole: 'combat',
            assetName: 'Interceptor',
            order: {
              type: 'intercept', durationSec: 45, mode: 'active', target: 'designated-contact',
              params: { action: 'identify' }
            }
          },
          {
            id: 'mil-intercept-force',
            label: 'Forced stop — 2 minutes',
            prompt: 'Close, match velocity, and compel compliance.',
            assetRole: 'combat',
            assetName: 'Interceptor',
            order: {
              type: 'intercept', durationSec: 120, mode: 'aggressive', target: 'designated-contact',
              params: { action: 'force-stop' }
            }
          },
          {
            id: 'mil-intercept-pursuit',
            label: 'Pursuit — until recalled or target lost',
            prompt: 'Chase the contact across the system. Do not disengage without orders.',
            assetRole: 'combat',
            assetName: 'Pursuit wing',
            order: {
              type: 'intercept', durationSec: 0, mode: 'aggressive', target: 'designated-contact',
              params: { action: 'pursue', maxRange: 'system' }
            }
          }
        ]
      },
      {
        id: 'mil-blockade',
        label: 'Blockade / denial',
        prompt: 'Deny transit through a choke point or approach.',
        children: [
          {
            id: 'mil-blockade-soft',
            label: 'Soft blockade — 5 minutes',
            prompt: 'Warn and turn away non-cleared traffic. No kinetic engagement unless fired upon.',
            assetRole: 'combat',
            assetName: 'Blockade wing',
            order: {
              type: 'blockade', durationSec: 300, mode: 'active', target: 'chokepoint',
              params: { rules: 'warn-first' }
            }
          },
          {
            id: 'mil-blockade-hard',
            label: 'Hard blockade — until recalled',
            prompt: 'No transit without explicit clearance. Engage violators.',
            assetRole: 'combat',
            assetName: 'Blockade wing',
            order: {
              type: 'blockade', durationSec: 0, mode: 'aggressive', target: 'chokepoint',
              params: { rules: 'deny-all' }
            }
          }
        ]
      },
      {
        id: 'mil-raid',
        label: 'Raid / strike',
        prompt: 'Short, focused offensive action against a fixed or mobile target.',
        children: [
          {
            id: 'mil-raid-quick',
            label: 'Hit-and-run — 90 seconds',
            prompt: 'Strike the objective and withdraw immediately.',
            assetRole: 'combat',
            assetName: 'Strike wing',
            order: {
              type: 'raid', durationSec: 90, mode: 'aggressive', target: 'designated-objective',
              params: { doctrine: 'hit-and-run' }
            }
          },
          {
            id: 'mil-raid-suppress',
            label: 'Suppression run — 3 minutes',
            prompt: 'Keep the objective under pressure for the full window.',
            assetRole: 'combat',
            assetName: 'Strike wing',
            order: {
              type: 'raid', durationSec: 180, mode: 'aggressive', target: 'designated-objective',
              params: { doctrine: 'suppress' }
            }
          }
        ]
      },
      {
        id: 'mil-train',
        label: 'Training / exercise',
        prompt: 'Live-fire or simulated drills that do not commit to real combat posture.',
        children: [
          {
            id: 'mil-train-45',
            label: 'Gunnery drill — 45 seconds',
            assetRole: 'combat',
            assetName: 'Training wing',
            order: {
              type: 'training', durationSec: 45, mode: 'active', target: 'local-sector',
              params: { drill: 'gunnery' }
            }
          },
          {
            id: 'mil-train-formation',
            label: 'Formation practice — 2 minutes',
            assetRole: 'combat',
            assetName: 'Training wing',
            order: {
              type: 'training', durationSec: 120, mode: 'active', target: 'local-sector',
              params: { drill: 'formation' }
            }
          },
          {
            id: 'mil-train-passive',
            label: 'Continuous readiness drills — until recalled',
            assetRole: 'combat',
            assetName: 'Training wing',
            order: {
              type: 'training', durationSec: 0, mode: 'passive', target: 'local-sector',
              params: { drill: 'readiness' }
            }
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
          }
        ]
      }
    ]
  },

<<<<<<< HEAD
  {
    id: 'industrial',
    label: 'Industrial',
    prompt: 'Industrial desk. Extract ore, work a face, or deepen a survey pass.',
=======
  // ═══════════════════════════════════════════════════════════════════════════
  // INDUSTRIAL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'industrial',
    label: 'Industrial',
    prompt: 'Industrial desk. Extract ore, work a face, deepen a survey, or refine.',
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
    branch: 'industrial',
    children: [
      {
        id: 'ind-extract',
<<<<<<< HEAD
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
=======
        label: 'Extract / mine',
        prompt: 'Mining objective. Quota, tempo, and load policy?',
        children: [
          {
            id: 'ind-extract-quota',
            label: 'Quota-based',
            prompt: 'Stop when the book hits the target mass.',
            children: [
              {
                id: 'ind-extract-1k',
                label: 'Quota 1,000 kg — multi-trip',
                prompt: 'Cut until 1,000 kg is banked. Multiple trips allowed.',
                assetRole: 'mine',
                assetName: 'Cutter wing',
                order: {
                  type: 'extract', durationSec: 0, mode: 'active', target: 'belt',
                  quotaKg: 1000,
                  params: { quotaKg: 1000, singleLoad: false }
                }
              },
              {
                id: 'ind-extract-2k',
                label: 'Quota 2,000 kg — multi-trip',
                prompt: 'Cut until 2,000 kg is in the book. Multiple trips allowed.',
                assetRole: 'mine',
                assetName: 'Cutter wing',
                order: {
                  type: 'extract', durationSec: 0, mode: 'active', target: 'belt',
                  quotaKg: 2000,
                  params: { quotaKg: 2000, singleLoad: false }
                }
              },
              {
                id: 'ind-extract-5k',
                label: 'Quota 5,000 kg — multi-trip',
                prompt: 'Heavy cut. Five tonnes before stand-down.',
                assetRole: 'mine',
                assetName: 'Cutter wing',
                order: {
                  type: 'extract', durationSec: 0, mode: 'active', target: 'belt',
                  quotaKg: 5000,
                  params: { quotaKg: 5000, singleLoad: false }
                }
              },
              {
                id: 'ind-extract-10k',
                label: 'Quota 10,000 kg — multi-trip',
                prompt: 'Major extraction order. Ten tonnes.',
                assetRole: 'mine',
                assetName: 'Cutter wing',
                order: {
                  type: 'extract', durationSec: 0, mode: 'active', target: 'belt',
                  quotaKg: 10000,
                  params: { quotaKg: 10000, singleLoad: false }
                }
              }
            ]
          },
          {
            id: 'ind-extract-load',
            label: 'Load-policy options',
            prompt: 'Single load vs continuous work.',
            children: [
              {
                id: 'ind-extract-single',
                label: 'Single load — fill and return',
                prompt: 'One load, then return, then stand down.',
                assetRole: 'mine',
                assetName: 'Cutter wing',
                order: {
                  type: 'extract', durationSec: 0, mode: 'active', target: 'belt',
                  quotaKg: 1800,
                  params: { quotaKg: 1800, singleLoad: true }
                }
              },
              {
                id: 'ind-extract-double',
                label: 'Two loads then stand down',
                prompt: 'Fill, run in, fill again, run in, then report.',
                assetRole: 'mine',
                assetName: 'Cutter wing',
                order: {
                  type: 'extract', durationSec: 0, mode: 'active', target: 'belt',
                  quotaKg: 3600,
                  params: { quotaKg: 3600, singleLoad: false, maxTrips: 2 }
                }
              },
              {
                id: 'ind-extract-passive',
                label: 'Passive extract — until recalled',
                prompt: 'Work the face, run each load in to the office, go again. Recall when ready.',
                assetRole: 'mine',
                assetName: 'Cutter wing',
                order: {
                  type: 'extract', durationSec: 0, mode: 'passive', target: 'belt',
                  quotaKg: 0,
                  params: { quotaKg: null, singleLoad: false }
                }
              }
            ]
          },
          {
            id: 'ind-extract-timed',
            label: 'Timed extraction windows',
            prompt: 'Work for a fixed duration regardless of mass.',
            children: [
              {
                id: 'ind-extract-120',
                label: 'Timed cut — 2 minutes',
                assetRole: 'mine',
                assetName: 'Cutter wing',
                order: {
                  type: 'extract', durationSec: 120, mode: 'active', target: 'belt',
                  params: { singleLoad: false }
                }
              },
              {
                id: 'ind-extract-300',
                label: 'Timed cut — 5 minutes',
                assetRole: 'mine',
                assetName: 'Cutter wing',
                order: {
                  type: 'extract', durationSec: 300, mode: 'active', target: 'belt',
                  params: { singleLoad: false }
                }
              }
            ]
          },
          {
            id: 'ind-extract-special',
            label: 'Special targets',
            prompt: 'High-value or restricted faces.',
            children: [
              {
                id: 'ind-extract-rare',
                label: 'Rare-ore focus — 3,000 kg',
                prompt: 'Prioritize rare and exotic deposits. Ignore common rock.',
                assetRole: 'mine',
                assetName: 'Specialist cutter',
                order: {
                  type: 'extract', durationSec: 0, mode: 'active', target: 'rare-belt',
                  quotaKg: 3000,
                  params: { quotaKg: 3000, oreFilter: 'rare', singleLoad: false }
                }
              },
              {
                id: 'ind-extract-ice',
                label: 'Ice / volatiles — 4,000 kg',
                prompt: 'Cut ice and volatiles for life-support and fuel feedstock.',
                assetRole: 'mine',
                assetName: 'Ice cutter',
                order: {
                  type: 'extract', durationSec: 0, mode: 'active', target: 'ice-field',
                  quotaKg: 4000,
                  params: { quotaKg: 4000, oreFilter: 'ice', singleLoad: false }
                }
              }
            ]
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
          }
        ]
      },
      {
        id: 'ind-survey',
        label: 'Survey pass',
<<<<<<< HEAD
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
=======
        prompt: 'Orbital or deep survey of a body — no ground team.',
        children: [
          {
            id: 'ind-survey-quick',
            label: 'Quick / standard passes',
            children: [
              {
                id: 'ind-survey-45',
                label: 'Single pass — 45 seconds',
                assetRole: 'mine',
                assetName: 'Survey wing',
                order: { type: 'survey_pass', durationSec: 45, mode: 'active', target: 'nearest-body', params: { bodyName: null } }
              },
              {
                id: 'ind-survey-90',
                label: 'Standard survey — 90 seconds',
                assetRole: 'mine',
                assetName: 'Survey wing',
                order: { type: 'survey_pass', durationSec: 90, mode: 'active', target: 'nearest-body', params: { bodyName: null } }
              },
              {
                id: 'ind-survey-120',
                label: 'Deep pass — 2 minutes',
                assetRole: 'mine',
                assetName: 'Survey wing',
                order: { type: 'survey_pass', durationSec: 120, mode: 'active', target: 'nearest-body', params: { bodyName: null } }
              }
            ]
          },
          {
            id: 'ind-survey-extended',
            label: 'Extended / multi-body',
            children: [
              {
                id: 'ind-survey-300',
                label: 'Full system skim — 5 minutes',
                prompt: 'Rapid survey of every unsurveyed body in the current system.',
                assetRole: 'mine',
                assetName: 'Survey wing',
                order: {
                  type: 'survey_pass', durationSec: 300, mode: 'active', target: 'system',
                  params: { multiBody: true }
                }
              },
              {
                id: 'ind-survey-passive',
                label: 'Continuous survey — until recalled',
                prompt: 'Keep scanning until the assay database is complete or recalled.',
                assetRole: 'mine',
                assetName: 'Survey wing',
                order: {
                  type: 'survey_pass', durationSec: 0, mode: 'passive', target: 'nearest-body',
                  params: { bodyName: null, continuous: true }
                }
              }
            ]
          }
        ]
      },
      {
        id: 'ind-refine',
        label: 'Refine / process',
        prompt: 'Process raw ore into refined product at a refinery or onboard.',
        children: [
          {
            id: 'ind-refine-batch',
            label: 'Process one batch — 2 minutes',
            assetRole: 'mine',
            assetName: 'Refinery crew',
            order: {
              type: 'refine', durationSec: 120, mode: 'active', target: 'refinery',
              params: { batch: 1 }
            }
          },
          {
            id: 'ind-refine-quota',
            label: 'Refine 5,000 kg then stand down',
            assetRole: 'mine',
            assetName: 'Refinery crew',
            order: {
              type: 'refine', durationSec: 0, mode: 'active', target: 'refinery',
              quotaKg: 5000,
              params: { quotaKg: 5000 }
            }
          },
          {
            id: 'ind-refine-passive',
            label: 'Continuous refining — until recalled',
            assetRole: 'mine',
            assetName: 'Refinery crew',
            order: {
              type: 'refine', durationSec: 0, mode: 'passive', target: 'refinery',
              params: {}
            }
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
          }
        ]
      }
    ]
  },

<<<<<<< HEAD
  {
    id: 'logistic',
    label: 'Logistical',
    prompt: 'Logistics desk. Move cargo, people, or empty hulls between points.',
=======
  // ═══════════════════════════════════════════════════════════════════════════
  // LOGISTICAL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'logistic',
    label: 'Logistical',
    prompt: 'Logistics desk. Move cargo, people, fuel, or empty hulls between points.',
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
    branch: 'logistic',
    children: [
      {
        id: 'log-haul',
        label: 'Haul cargo',
<<<<<<< HEAD
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
=======
        prompt: 'Logistics run. Commodity, return leg, and duration?',
        children: [
          {
            id: 'log-haul-ore',
            label: 'Ore / bulk',
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
            id: 'log-haul-other',
            label: 'Other commodities',
            children: [
              {
                id: 'log-haul-fuel',
                label: 'Fuel / propellant run — 90 seconds',
                assetRole: 'haul',
                assetName: 'Tanker wing',
                order: {
                  type: 'logistics', durationSec: 90, mode: 'active', target: 'nearest-station',
                  params: { commodity: 'fuel', returnAfter: true }
                }
              },
              {
                id: 'log-haul-parts',
                label: 'Spare parts / modules — 2 minutes',
                assetRole: 'haul',
                assetName: 'Hauler wing',
                order: {
                  type: 'logistics', durationSec: 120, mode: 'active', target: 'nearest-station',
                  params: { commodity: 'parts', returnAfter: true }
                }
              },
              {
                id: 'log-haul-rare',
                label: 'Rare materials — one-way 3 minutes',
                assetRole: 'haul',
                assetName: 'Secure hauler',
                order: {
                  type: 'logistics', durationSec: 180, mode: 'active', target: 'designated-station',
                  params: { commodity: 'rare', returnAfter: false, secure: true }
                }
              }
            ]
          },
          {
            id: 'log-haul-extended',
            label: 'Extended / multi-stop',
            children: [
              {
                id: 'log-haul-circuit',
                label: 'Three-stop circuit — 5 minutes',
                prompt: 'Visit three designated berths in sequence, then return.',
                assetRole: 'haul',
                assetName: 'Hauler wing',
                order: {
                  type: 'logistics', durationSec: 300, mode: 'active', target: 'circuit',
                  params: { commodity: 'mixed', stops: 3, returnAfter: true }
                }
              },
              {
                id: 'log-haul-empty',
                label: 'Reposition empty hull — 60 seconds',
                prompt: 'Move an empty hull to a new berth or yard.',
                assetRole: 'haul',
                assetName: 'Ferry',
                order: {
                  type: 'logistics', durationSec: 60, mode: 'active', target: 'designated-berth',
                  params: { commodity: 'empty', returnAfter: false }
                }
              }
            ]
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
          }
        ]
      },
      {
        id: 'log-people',
        label: 'Transport personnel',
<<<<<<< HEAD
        prompt: 'Move crew or passengers between stations / sites.',
=======
        prompt: 'Move crew, passengers, or specialists between stations / sites.',
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
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
<<<<<<< HEAD
=======
          },
          {
            id: 'log-people-180',
            label: 'Long transfer — 3 minutes',
            assetRole: 'haul',
            assetName: 'Courier wing',
            order: {
              type: 'logistics', durationSec: 180, mode: 'active', target: 'designated-station',
              params: { commodity: 'personnel', returnAfter: true }
            }
          },
          {
            id: 'log-people-evac',
            label: 'Emergency evacuation — until complete',
            prompt: 'Pull all non-essential personnel from the designated site.',
            assetRole: 'haul',
            assetName: 'Evac wing',
            order: {
              type: 'logistics', durationSec: 0, mode: 'active', target: 'designated-site',
              params: { commodity: 'personnel', returnAfter: false, priority: 'evac' }
            }
          },
          {
            id: 'log-people-specialists',
            label: 'Specialist team delivery — 2 minutes',
            prompt: 'Deliver a construction, medical, or survey team and stand by.',
            assetRole: 'haul',
            assetName: 'Courier wing',
            order: {
              type: 'logistics', durationSec: 120, mode: 'active', target: 'designated-site',
              params: { commodity: 'specialists', returnAfter: false }
            }
          }
        ]
      },
      {
        id: 'log-refuel',
        label: 'Refuel / resupply',
        prompt: 'Top up fuel, life support, or ammunition at a depot or tender.',
        children: [
          {
            id: 'log-refuel-self',
            label: 'Self-refuel at depot — 60 seconds',
            assetRole: 'haul',
            assetName: 'Tanker',
            order: {
              type: 'refuel', durationSec: 60, mode: 'active', target: 'depot',
              params: { targetSelf: true }
            }
          },
          {
            id: 'log-refuel-fleet',
            label: 'Refuel designated hull — 90 seconds',
            assetRole: 'haul',
            assetName: 'Tanker',
            order: {
              type: 'refuel', durationSec: 90, mode: 'active', target: 'designated-hull',
              params: { targetSelf: false }
            }
          },
          {
            id: 'log-refuel-passive',
            label: 'Stand-by tanker — until recalled',
            assetRole: 'haul',
            assetName: 'Tanker',
            order: {
              type: 'refuel', durationSec: 0, mode: 'passive', target: 'fleet',
              params: {}
            }
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
          }
        ]
      }
    ]
  },

<<<<<<< HEAD
  {
    id: 'economic',
    label: 'Economic',
    prompt: 'Economic desk. Station-keeping for market presence, or hold a trade lane.',
=======
  // ═══════════════════════════════════════════════════════════════════════════
  // ECONOMIC
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'economic',
    label: 'Economic',
    prompt: 'Economic desk. Market presence, trade-lane watch, arbitrage, or negotiation.',
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
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
<<<<<<< HEAD
=======
          },
          {
            id: 'eco-keep-timed',
            label: 'Timed market watch — 5 minutes',
            assetRole: 'trade',
            assetName: 'Factor wing',
            order: {
              type: 'station_keep', durationSec: 300, mode: 'active', target: 'trade-hub',
              params: { reportBook: true }
            }
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
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
<<<<<<< HEAD
=======
          },
          {
            id: 'eco-lane-300',
            label: 'Extended lane watch — 5 minutes',
            assetRole: 'combat',
            assetName: 'Lane wing',
            order: { type: 'patrol', durationSec: 300, mode: 'active', target: 'trade-lane' }
          },
          {
            id: 'eco-lane-passive',
            label: 'Continuous lane presence — until recalled',
            assetRole: 'combat',
            assetName: 'Lane wing',
            order: { type: 'patrol', durationSec: 0, mode: 'passive', target: 'trade-lane' }
          },
          {
            id: 'eco-lane-escort',
            label: 'Lane escort duty — 4 minutes',
            prompt: 'Ride with commercial traffic and provide cover.',
            assetRole: 'combat',
            assetName: 'Lane escort',
            order: {
              type: 'escort', durationSec: 240, mode: 'active', target: 'trade-lane',
              params: { formation: 'lane' }
            }
          }
        ]
      },
      {
        id: 'eco-arb',
        label: 'Arbitrage / spread trading',
        prompt: 'Work price differences across berths or systems.',
        children: [
          {
            id: 'eco-arb-ore',
            label: 'Ore spread — until recalled',
            prompt: 'Buy the cheapest ore, sell it at the dearest berth, repeat.',
            assetRole: 'trade',
            assetName: 'Factor',
            order: {
              type: 'arbitrage', durationSec: 0, mode: 'passive', target: 'market',
              params: { commodity: 'ore' }
            }
          },
          {
            id: 'eco-arb-fuel',
            label: 'Fuel spread — until recalled',
            assetRole: 'trade',
            assetName: 'Factor',
            order: {
              type: 'arbitrage', durationSec: 0, mode: 'passive', target: 'market',
              params: { commodity: 'fuel' }
            }
          },
          {
            id: 'eco-arb-parts',
            label: 'Parts & modules spread — 10 minutes',
            assetRole: 'trade',
            assetName: 'Factor',
            order: {
              type: 'arbitrage', durationSec: 600, mode: 'active', target: 'market',
              params: { commodity: 'parts' }
            }
          },
          {
            id: 'eco-arb-opportunistic',
            label: 'Opportunistic any-commodity — until recalled',
            prompt: 'Scan the book continuously and take the widest available spread.',
            assetRole: 'trade',
            assetName: 'Factor',
            order: {
              type: 'arbitrage', durationSec: 0, mode: 'passive', target: 'market',
              params: { commodity: 'any', opportunistic: true }
            }
          }
        ]
      },
      {
        id: 'eco-negotiate',
        label: 'Negotiate / contract',
        prompt: 'Open or refresh trade contracts, docking rights, or supply agreements.',
        children: [
          {
            id: 'eco-negotiate-supply',
            label: 'Supply contract — 3 minutes',
            assetRole: 'trade',
            assetName: 'Factor',
            order: {
              type: 'negotiate', durationSec: 180, mode: 'active', target: 'trade-hub',
              params: { contractType: 'supply' }
            }
          },
          {
            id: 'eco-negotiate-docking',
            label: 'Docking / berth rights — 2 minutes',
            assetRole: 'trade',
            assetName: 'Factor',
            order: {
              type: 'negotiate', durationSec: 120, mode: 'active', target: 'station',
              params: { contractType: 'docking' }
            }
          },
          {
            id: 'eco-negotiate-passive',
            label: 'Standing negotiation presence — until recalled',
            assetRole: 'trade',
            assetName: 'Factor',
            order: {
              type: 'negotiate', durationSec: 0, mode: 'passive', target: 'trade-hub',
              params: { contractType: 'any' }
            }
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
          }
        ]
      }
    ]
  },

<<<<<<< HEAD
  {
    id: 'civilian',
    label: 'Civilian',
    prompt: 'Civilian desk. Survey passes and station-keeping for habitation support.',
=======
  // ═══════════════════════════════════════════════════════════════════════════
  // CIVILIAN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'civilian',
    label: 'Civilian',
    prompt: 'Civilian desk. Survey passes, station-keeping for habitation, medical, and colony support.',
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
    branch: 'civilian',
    children: [
      {
        id: 'civ-survey',
<<<<<<< HEAD
        label: 'Survey pass',
        prompt: 'Chart a body from orbit.',
=======
        label: 'Survey / chart',
        prompt: 'Chart a body from orbit or map a habitation zone.',
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
        children: [
          {
            id: 'civ-survey-45',
            label: 'Chart pass — 45 seconds',
            assetRole: 'mine',
            assetName: 'Chart wing',
            order: { type: 'survey_pass', durationSec: 45, mode: 'active', target: 'nearest-body', params: { bodyName: null } }
<<<<<<< HEAD
=======
          },
          {
            id: 'civ-survey-120',
            label: 'Detailed habitation survey — 2 minutes',
            prompt: 'Focus on landing sites, resources, and hazard mapping.',
            assetRole: 'mine',
            assetName: 'Chart wing',
            order: {
              type: 'survey_pass', durationSec: 120, mode: 'active', target: 'habitation-candidate',
              params: { focus: 'habitation' }
            }
          },
          {
            id: 'civ-survey-passive',
            label: 'Continuous charting — until recalled',
            assetRole: 'mine',
            assetName: 'Chart wing',
            order: {
              type: 'survey_pass', durationSec: 0, mode: 'passive', target: 'nearest-body',
              params: { continuous: true }
            }
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
          }
        ]
      },
      {
        id: 'civ-keep',
        label: 'Support station-keep',
<<<<<<< HEAD
        prompt: 'Hold near a habitation site.',
=======
        prompt: 'Hold near a habitation site or colony.',
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
        children: [
          {
            id: 'civ-keep-passive',
            label: 'Passive support',
            assetRole: 'haul',
            assetName: 'Support wing',
            order: { type: 'station_keep', durationSec: 0, mode: 'passive', target: 'habitation' }
<<<<<<< HEAD
=======
          },
          {
            id: 'civ-keep-active',
            label: 'Active colony overwatch',
            prompt: 'Report traffic, anomalies, and resource status.',
            assetRole: 'haul',
            assetName: 'Support wing',
            order: {
              type: 'station_keep', durationSec: 0, mode: 'active', target: 'habitation',
              params: { reportStatus: true }
            }
          },
          {
            id: 'civ-keep-timed',
            label: 'Timed support — 10 minutes',
            assetRole: 'haul',
            assetName: 'Support wing',
            order: {
              type: 'station_keep', durationSec: 600, mode: 'active', target: 'habitation'
            }
          }
        ]
      },
      {
        id: 'civ-medical',
        label: 'Medical / rescue',
        prompt: 'Medical support, search-and-rescue, or quarantine assistance.',
        children: [
          {
            id: 'civ-med-standby',
            label: 'Medical standby — until recalled',
            assetRole: 'haul',
            assetName: 'Med wing',
            order: {
              type: 'medical', durationSec: 0, mode: 'passive', target: 'fleet',
              params: { role: 'standby' }
            }
          },
          {
            id: 'civ-med-rescue',
            label: 'Search & rescue — 5 minutes',
            prompt: 'Locate and recover personnel or small craft in distress.',
            assetRole: 'haul',
            assetName: 'Rescue wing',
            order: {
              type: 'medical', durationSec: 300, mode: 'active', target: 'distress',
              params: { role: 'sar' }
            }
          },
          {
            id: 'civ-med-evac',
            label: 'Casualty evacuation — until complete',
            assetRole: 'haul',
            assetName: 'Medevac',
            order: {
              type: 'medical', durationSec: 0, mode: 'active', target: 'designated-site',
              params: { role: 'evac' }
            }
          }
        ]
      },
      {
        id: 'civ-colony',
        label: 'Colony support',
        prompt: 'Deliver supplies, technicians, or temporary infrastructure to a colony.',
        children: [
          {
            id: 'civ-colony-supply',
            label: 'Supply drop — 3 minutes',
            assetRole: 'haul',
            assetName: 'Colony support',
            order: {
              type: 'logistics', durationSec: 180, mode: 'active', target: 'colony',
              params: { commodity: 'colony-supplies', returnAfter: false }
            }
          },
          {
            id: 'civ-colony-tech',
            label: 'Technician rotation — 4 minutes',
            assetRole: 'haul',
            assetName: 'Colony support',
            order: {
              type: 'logistics', durationSec: 240, mode: 'active', target: 'colony',
              params: { commodity: 'technicians', returnAfter: true }
            }
          },
          {
            id: 'civ-colony-passive',
            label: 'Standing colony support — until recalled',
            assetRole: 'haul',
            assetName: 'Colony support',
            order: {
              type: 'station_keep', durationSec: 0, mode: 'passive', target: 'colony',
              params: { supportRole: true }
            }
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
          }
        ]
      }
    ]
  },

<<<<<<< HEAD
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
=======
  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTRUCTION
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'construction',
    label: 'Construction',
    prompt: 'Construction desk. Build what we have on order, hire the crew out, salvage, prospect, or demolish.',
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
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
<<<<<<< HEAD
            assetRole: 'build', assetName: 'Construction crew',
            order: { type: 'construct', durationSec: 0, mode: 'passive', target: 'company',
                     params: { source: 'company' } }
=======
            assetRole: 'build',
            assetName: 'Construction crew',
            order: {
              type: 'construct', durationSec: 0, mode: 'passive', target: 'company',
              params: { source: 'company' }
            }
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
          },
          {
            id: 'con-build-one',
            label: 'One project, then stand down',
            prompt: 'Finish the next project on the book and report.',
<<<<<<< HEAD
            assetRole: 'build', assetName: 'Construction crew',
            order: { type: 'construct', durationSec: 0, mode: 'active', target: 'company',
                     params: { source: 'company' } }
=======
            assetRole: 'build',
            assetName: 'Construction crew',
            order: {
              type: 'construct', durationSec: 0, mode: 'active', target: 'company',
              params: { source: 'company' }
            }
          },
          {
            id: 'con-build-priority',
            label: 'Priority project — until complete',
            prompt: 'Ignore queue order; work the flagged high-priority item first.',
            assetRole: 'build',
            assetName: 'Construction crew',
            order: {
              type: 'construct', durationSec: 0, mode: 'active', target: 'company',
              params: { source: 'company', priority: true }
            }
          },
          {
            id: 'con-build-timed',
            label: 'Timed construction window — 10 minutes',
            assetRole: 'build',
            assetName: 'Construction crew',
            order: {
              type: 'construct', durationSec: 600, mode: 'active', target: 'company',
              params: { source: 'company' }
            }
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
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
<<<<<<< HEAD
            assetRole: 'build', assetName: 'Construction crew',
            order: { type: 'construct', durationSec: 0, mode: 'passive', target: 'contract',
                     params: { source: 'contract' } }
=======
            assetRole: 'build',
            assetName: 'Construction crew',
            order: {
              type: 'construct', durationSec: 0, mode: 'passive', target: 'contract',
              params: { source: 'contract' }
            }
          },
          {
            id: 'con-contract-one',
            label: 'One contract job, then stand down',
            assetRole: 'build',
            assetName: 'Construction crew',
            order: {
              type: 'construct', durationSec: 0, mode: 'active', target: 'contract',
              params: { source: 'contract' }
            }
          },
          {
            id: 'con-contract-highpay',
            label: 'Highest-paying contract only — until recalled',
            prompt: 'Skip low-margin work. Only take the best rate available.',
            assetRole: 'build',
            assetName: 'Construction crew',
            order: {
              type: 'construct', durationSec: 0, mode: 'passive', target: 'contract',
              params: { source: 'contract', minRate: 'high' }
            }
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
          }
        ]
      },
      {
        id: 'con-salvage',
        label: 'Salvage sweep',
<<<<<<< HEAD
        prompt: 'Recover containers and wreckage and run them in.',
=======
        prompt: 'Recover containers, wreckage, and debris and run them in.',
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
        children: [
          {
            id: 'con-salvage-passive',
            label: 'Sweep until recalled',
            prompt: 'Work the field. Run a full hold in and go again.',
<<<<<<< HEAD
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
=======
            assetRole: 'build',
            assetName: 'Recovery crew',
            order: { type: 'salvage', durationSec: 0, mode: 'passive', target: 'field', params: {} }
          },
          {
            id: 'con-salvage-2k',
            label: 'Recover 2,000 kg then stand down',
            assetRole: 'build',
            assetName: 'Recovery crew',
            order: {
              type: 'salvage', durationSec: 0, mode: 'active', target: 'field',
              quotaKg: 2000, params: { quotaKg: 2000 }
            }
          },
          {
            id: 'con-salvage-4k',
            label: 'Recover 4,000 kg then stand down',
            prompt: 'Four tonnes recovered and landed, then report.',
            assetRole: 'build',
            assetName: 'Recovery crew',
            order: {
              type: 'salvage', durationSec: 0, mode: 'active', target: 'field',
              quotaKg: 4000, params: { quotaKg: 4000 }
            }
          },
          {
            id: 'con-salvage-wreck',
            label: 'Specific wreck recovery — until complete',
            prompt: 'Focus on a designated hull or debris field.',
            assetRole: 'build',
            assetName: 'Recovery crew',
            order: {
              type: 'salvage', durationSec: 0, mode: 'active', target: 'designated-wreck',
              params: { focus: 'wreck' }
            }
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
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
<<<<<<< HEAD
            assetRole: 'build', assetName: 'Survey crew',
            order: { type: 'prospect', durationSec: 0, mode: 'passive', target: 'field', params: {} }
=======
            assetRole: 'build',
            assetName: 'Survey crew',
            order: { type: 'prospect', durationSec: 0, mode: 'passive', target: 'field', params: {} }
          },
          {
            id: 'con-prospect-quick',
            label: 'Quick prospect — 90 seconds',
            assetRole: 'build',
            assetName: 'Survey crew',
            order: {
              type: 'prospect', durationSec: 90, mode: 'active', target: 'field',
              params: {}
            }
          },
          {
            id: 'con-prospect-deep',
            label: 'Deep assay — 5 minutes',
            prompt: 'Maximum resolution scan. Expensive in time, high value data.',
            assetRole: 'build',
            assetName: 'Survey crew',
            order: {
              type: 'prospect', durationSec: 300, mode: 'active', target: 'field',
              params: { resolution: 'deep' }
            }
          }
        ]
      },
      {
        id: 'con-demolish',
        label: 'Demolish / clear',
        prompt: 'Take down structures, clear debris fields, or strip a site for reuse.',
        children: [
          {
            id: 'con-demolish-one',
            label: 'Demolish one structure — until complete',
            assetRole: 'build',
            assetName: 'Demolition crew',
            order: {
              type: 'demolish', durationSec: 0, mode: 'active', target: 'designated-structure',
              params: {}
            }
          },
          {
            id: 'con-demolish-field',
            label: 'Clear debris field — until recalled',
            assetRole: 'build',
            assetName: 'Demolition crew',
            order: {
              type: 'demolish', durationSec: 0, mode: 'passive', target: 'debris-field',
              params: {}
            }
          },
          {
            id: 'con-demolish-timed',
            label: 'Timed clearance — 8 minutes',
            assetRole: 'build',
            assetName: 'Demolition crew',
            order: {
              type: 'demolish', durationSec: 480, mode: 'active', target: 'site',
              params: {}
            }
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
          }
        ]
      }
    ]
  },

<<<<<<< HEAD
  // ── the tender desk ─────────────────────────────────────────────────
  {
    id: 'support',
    label: 'Support',
    prompt: 'Support desk. Keep our own hulls working instead of bringing them home.',
=======
  // ═══════════════════════════════════════════════════════════════════════════
  // SUPPORT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'support',
    label: 'Support',
    prompt: 'Support desk. Keep our own hulls working, hunt bounties, run tenders, or perform special tasks.',
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
    branch: 'logistic',
    children: [
      {
        id: 'sup-tender',
<<<<<<< HEAD
        label: 'Fleet tender',
        prompt: 'Run repairs out to whoever needs them.',
=======
        label: 'Fleet tender / repair',
        prompt: 'Run repairs, ammo, and life-support out to whoever needs them.',
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
        children: [
          {
            id: 'sup-tender-passive',
            label: 'Stand by fleet — until recalled',
            prompt: 'Patch whoever is worst off, then the next.',
<<<<<<< HEAD
            assetRole: 'haul', assetName: 'Tender',
=======
            assetRole: 'haul',
            assetName: 'Tender',
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
            order: { type: 'tender', durationSec: 0, mode: 'passive', target: 'fleet', params: {} }
          },
          {
            id: 'sup-tender-one',
            label: 'Restore one hull, then stand down',
            prompt: 'Take the worst casualty back to full and report.',
<<<<<<< HEAD
            assetRole: 'haul', assetName: 'Tender',
            order: { type: 'tender', durationSec: 0, mode: 'active', target: 'fleet', params: {} }
=======
            assetRole: 'haul',
            assetName: 'Tender',
            order: { type: 'tender', durationSec: 0, mode: 'active', target: 'fleet', params: {} }
          },
          {
            id: 'sup-tender-priority',
            label: 'Priority repair — designated hull',
            prompt: 'Ignore queue; restore the flagged hull first.',
            assetRole: 'haul',
            assetName: 'Tender',
            order: {
              type: 'tender', durationSec: 0, mode: 'active', target: 'designated-hull',
              params: { priority: true }
            }
          },
          {
            id: 'sup-tender-ammo',
            label: 'Ammunition & ordnance resupply — 3 minutes',
            assetRole: 'haul',
            assetName: 'Tender',
            order: {
              type: 'tender', durationSec: 180, mode: 'active', target: 'fleet',
              params: { focus: 'ordnance' }
            }
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
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
<<<<<<< HEAD
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
=======
            assetRole: 'merc',
            assetName: 'Hunter',
            order: { type: 'hunt', durationSec: 0, mode: 'passive', target: 'hostiles', params: {} }
          },
          {
            id: 'sup-hunt-1',
            label: 'One kill, then stand down',
            assetRole: 'merc',
            assetName: 'Hunter',
            order: {
              type: 'hunt', durationSec: 0, mode: 'active', target: 'hostiles',
              params: { quotaKills: 1 }
            }
          },
          {
            id: 'sup-hunt-3',
            label: 'Three kills, then stand down',
            prompt: 'Three confirmed, then bring it home.',
            assetRole: 'merc',
            assetName: 'Hunter',
            order: {
              type: 'hunt', durationSec: 0, mode: 'active', target: 'hostiles',
              params: { quotaKills: 3 }
            }
          },
          {
            id: 'sup-hunt-5',
            label: 'Five kills, then stand down',
            assetRole: 'merc',
            assetName: 'Hunter',
            order: {
              type: 'hunt', durationSec: 0, mode: 'active', target: 'hostiles',
              params: { quotaKills: 5 }
            }
          },
          {
            id: 'sup-hunt-specific',
            label: 'Hunt designated target — until complete',
            prompt: 'Focus exclusively on the named or tagged hostile.',
            assetRole: 'merc',
            assetName: 'Hunter',
            order: {
              type: 'hunt', durationSec: 0, mode: 'aggressive', target: 'designated-hostile',
              params: { focus: 'specific' }
            }
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
          }
        ]
      },
      {
<<<<<<< HEAD
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
=======
        id: 'sup-scout',
        label: 'Scout / reconnaissance',
        prompt: 'Gather intelligence without committing to engagement.',
        children: [
          {
            id: 'sup-scout-quick',
            label: 'Quick scout — 60 seconds',
            assetRole: 'combat',
            assetName: 'Scout',
            order: {
              type: 'scout', durationSec: 60, mode: 'passive', target: 'local-sector',
              params: { stealth: true }
            }
          },
          {
            id: 'sup-scout-deep',
            label: 'Deep reconnaissance — 5 minutes',
            assetRole: 'combat',
            assetName: 'Scout',
            order: {
              type: 'scout', durationSec: 300, mode: 'passive', target: 'designated-zone',
              params: { stealth: true, depth: 'deep' }
            }
          },
          {
            id: 'sup-scout-passive',
            label: 'Continuous recon screen — until recalled',
            assetRole: 'combat',
            assetName: 'Scout',
            order: {
              type: 'scout', durationSec: 0, mode: 'passive', target: 'system',
              params: { stealth: true }
            }
          }
        ]
      },
      {
        id: 'sup-special',
        label: 'Special support tasks',
        prompt: 'Less common but useful support orders.',
        children: [
          {
            id: 'sup-decoy',
            label: 'Decoy / distraction — 3 minutes',
            prompt: 'Draw attention or fire away from a protected asset.',
            assetRole: 'combat',
            assetName: 'Decoy wing',
            order: {
              type: 'decoy', durationSec: 180, mode: 'active', target: 'designated-zone',
              params: {}
            }
          },
          {
            id: 'sup-jam',
            label: 'Electronic warfare / jam — 2 minutes',
            prompt: 'Disrupt sensors or communications in a local area.',
            assetRole: 'combat',
            assetName: 'EW wing',
            order: {
              type: 'ew', durationSec: 120, mode: 'active', target: 'local-sector',
              params: { mode: 'jam' }
            }
          },
          {
            id: 'sup-minefield',
            label: 'Lay defensive minefield — until complete',
            prompt: 'Deploy a limited defensive mine pattern and report.',
            assetRole: 'combat',
            assetName: 'Minelayer',
            order: {
              type: 'minefield', durationSec: 0, mode: 'active', target: 'designated-zone',
              params: { pattern: 'defensive' }
            }
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
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
<<<<<<< HEAD
=======
 * Expanded to cover the much larger menu tree.
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
 */
export function intentFromUtterance(text) {
  const q = String(text || '').toLowerCase();
  if (!q.trim()) return { ok: false, error: 'Empty request' };

<<<<<<< HEAD
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

=======
  // ── Patrol / sweep / beat ──────────────────────────────────────────────
  if (/\b(patrol|sweep|beat)\b/.test(q)) {
    if (/\baggressive|deny|challenge\b/.test(q)) {
      if (/\buntil recalled|passive|hold\b/.test(q)) {
        return resolveMenuPath(['military', 'mil-patrol', 'mil-patrol-aggressive', 'mil-patrol-aggro-passive']);
      }
      return resolveMenuPath(['military', 'mil-patrol', 'mil-patrol-aggressive', 'mil-patrol-aggro-90']);
    }
    if (/\bouter|perimeter|marker\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-patrol', 'mil-patrol-aggressive', 'mil-patrol-outer']);
    }
    if (/\bpassive\b|\buntil recalled\b|\bhold watch\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-patrol', 'mil-patrol-long', 'mil-patrol-passive']);
    }
    if (/\b10\s*min|600|extended presence\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-patrol', 'mil-patrol-long', 'mil-patrol-600']);
    }
    if (/\b5\s*min|300|long beat\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-patrol', 'mil-patrol-long', 'mil-patrol-300']);
    }
    if (/\b90|ninety|standard\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-patrol', 'mil-patrol-quick', 'mil-patrol-90']);
    }
    if (/\b60|one[- ]?minute|extended sweep\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-patrol', 'mil-patrol-quick', 'mil-patrol-60']);
    }
    return resolveMenuPath(['military', 'mil-patrol', 'mil-patrol-quick', 'mil-patrol-30']);
  }

  // ── Escort ─────────────────────────────────────────────────────────────
  if (/\bescort\b/.test(q)) {
    if (/\bconvoy\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-escort', 'mil-escort-special', 'mil-escort-convoy']);
    }
    if (/\bvip|close escort\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-escort', 'mil-escort-special', 'mil-escort-vip']);
    }
    if (/\bpassive|continuous|until recalled\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-escort', 'mil-escort-special', 'mil-escort-passive']);
    }
    if (/\b5\s*min|300|extended leg\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-escort', 'mil-escort-timed', 'mil-escort-300']);
    }
    if (/\b3\s*min|long|180\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-escort', 'mil-escort-timed', 'mil-escort-180']);
    }
    return resolveMenuPath(['military', 'mil-escort', 'mil-escort-timed', 'mil-escort-60']);
  }

  // ── Intercept / pursuit ────────────────────────────────────────────────
  if (/\b(intercept|pursuit|pursue|force[- ]?stop)\b/.test(q)) {
    if (/\bpursue|pursuit|chase\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-intercept', 'mil-intercept-pursuit']);
    }
    if (/\bforce|compel|stop\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-intercept', 'mil-intercept-force']);
    }
    return resolveMenuPath(['military', 'mil-intercept', 'mil-intercept-quick']);
  }

  // ── Blockade ───────────────────────────────────────────────────────────
  if (/\bblockade\b/.test(q)) {
    if (/\bhard|deny[- ]?all|aggressive\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-blockade', 'mil-blockade-hard']);
    }
    return resolveMenuPath(['military', 'mil-blockade', 'mil-blockade-soft']);
  }

  // ── Raid / strike ──────────────────────────────────────────────────────
  if (/\b(raid|strike|hit[- ]?and[- ]?run|suppress)\b/.test(q)) {
    if (/\bsuppress\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-raid', 'mil-raid-suppress']);
    }
    return resolveMenuPath(['military', 'mil-raid', 'mil-raid-quick']);
  }

  // ── Training ───────────────────────────────────────────────────────────
  if (/\b(training|drill|exercise|gunnery|formation practice)\b/.test(q)) {
    if (/\bformation\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-train', 'mil-train-formation']);
    }
    if (/\bpassive|continuous|readiness\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-train', 'mil-train-passive']);
    }
    return resolveMenuPath(['military', 'mil-train', 'mil-train-45']);
  }

  // ── Extract / mine ─────────────────────────────────────────────────────
  if (/\b(extract|mine|mining|cutter|quota)\b/.test(q)) {
    if (/\brare\b/.test(q)) {
      return resolveMenuPath(['industrial', 'ind-extract', 'ind-extract-special', 'ind-extract-rare']);
    }
    if (/\bice|volatiles?\b/.test(q)) {
      return resolveMenuPath(['industrial', 'ind-extract', 'ind-extract-special', 'ind-extract-ice']);
    }
    if (/\bpassive\b|\buntil recalled\b/.test(q)) {
      return resolveMenuPath(['industrial', 'ind-extract', 'ind-extract-load', 'ind-extract-passive']);
    }
    if (/\bsingle\b|\bone load\b|\bfill and return\b/.test(q)) {
      return resolveMenuPath(['industrial', 'ind-extract', 'ind-extract-load', 'ind-extract-single']);
    }
    if (/\btwo loads?|double\b/.test(q)) {
      return resolveMenuPath(['industrial', 'ind-extract', 'ind-extract-load', 'ind-extract-double']);
    }
    if (/\b10[,.]?000|10k\b/.test(q)) {
      return resolveMenuPath(['industrial', 'ind-extract', 'ind-extract-quota', 'ind-extract-10k']);
    }
    if (/\b5[,.]?000|5k\b/.test(q)) {
      return resolveMenuPath(['industrial', 'ind-extract', 'ind-extract-quota', 'ind-extract-5k']);
    }
    if (/\b1[,.]?000|1k\b/.test(q)) {
      return resolveMenuPath(['industrial', 'ind-extract', 'ind-extract-quota', 'ind-extract-1k']);
    }
    if (/\b2\s*min|120\b/.test(q)) {
      return resolveMenuPath(['industrial', 'ind-extract', 'ind-extract-timed', 'ind-extract-120']);
    }
    if (/\b5\s*min|300\b/.test(q)) {
      return resolveMenuPath(['industrial', 'ind-extract', 'ind-extract-timed', 'ind-extract-300']);
    }
    return resolveMenuPath(['industrial', 'ind-extract', 'ind-extract-quota', 'ind-extract-2k']);
  }

  // ── Survey ─────────────────────────────────────────────────────────────
  if (/\b(survey|chart|assay pass)\b/.test(q)) {
    if (/\bdeep|2\s*min|120\b/.test(q)) {
      return resolveMenuPath(['industrial', 'ind-survey', 'ind-survey-quick', 'ind-survey-120']);
    }
    if (/\b5\s*min|300|system\b/.test(q)) {
      return resolveMenuPath(['industrial', 'ind-survey', 'ind-survey-extended', 'ind-survey-300']);
    }
    if (/\bpassive|continuous|until recalled\b/.test(q)) {
      return resolveMenuPath(['industrial', 'ind-survey', 'ind-survey-extended', 'ind-survey-passive']);
    }
    if (/\b90|standard\b/.test(q)) {
      return resolveMenuPath(['industrial', 'ind-survey', 'ind-survey-quick', 'ind-survey-90']);
    }
    return resolveMenuPath(['industrial', 'ind-survey', 'ind-survey-quick', 'ind-survey-45']);
  }

  // ── Refine ─────────────────────────────────────────────────────────────
  if (/\b(refine|process ore|refinery)\b/.test(q)) {
    if (/\bpassive|continuous|until recalled\b/.test(q)) {
      return resolveMenuPath(['industrial', 'ind-refine', 'ind-refine-passive']);
    }
    if (/\b5[,.]?000|quota\b/.test(q)) {
      return resolveMenuPath(['industrial', 'ind-refine', 'ind-refine-quota']);
    }
    return resolveMenuPath(['industrial', 'ind-refine', 'ind-refine-batch']);
  }

  // ── Logistics / haul ───────────────────────────────────────────────────
  if (/\b(logistics|haul|hauler|deliver|cargo run|freight)\b/.test(q)) {
    if (/\bfuel|propellant|tanker\b/.test(q)) {
      return resolveMenuPath(['logistic', 'log-haul', 'log-haul-other', 'log-haul-fuel']);
    }
    if (/\bparts|modules?\b/.test(q)) {
      return resolveMenuPath(['logistic', 'log-haul', 'log-haul-other', 'log-haul-parts']);
    }
    if (/\brare\b/.test(q)) {
      return resolveMenuPath(['logistic', 'log-haul', 'log-haul-other', 'log-haul-rare']);
    }
    if (/\bcircuit|multi[- ]?stop|three[- ]?stop\b/.test(q)) {
      return resolveMenuPath(['logistic', 'log-haul', 'log-haul-extended', 'log-haul-circuit']);
    }
    if (/\bempty|reposition|ferry\b/.test(q)) {
      return resolveMenuPath(['logistic', 'log-haul', 'log-haul-extended', 'log-haul-empty']);
    }
    if (/\bpassive\b|\buntil recalled\b/.test(q)) {
      return resolveMenuPath(['logistic', 'log-haul', 'log-haul-ore', 'log-haul-passive']);
    }
    if (/\bone[- ]way\b|\bno return\b/.test(q)) {
      return resolveMenuPath(['logistic', 'log-haul', 'log-haul-ore', 'log-haul-oneway']);
    }
    if (/\bpersonnel|crew|people|passengers?\b/.test(q)) {
      if (/\bevac|emergency\b/.test(q)) {
        return resolveMenuPath(['logistic', 'log-people', 'log-people-evac']);
      }
      if (/\bspecialist\b/.test(q)) {
        return resolveMenuPath(['logistic', 'log-people', 'log-people-specialists']);
      }
      if (/\b3\s*min|180|long\b/.test(q)) {
        return resolveMenuPath(['logistic', 'log-people', 'log-people-180']);
      }
      return resolveMenuPath(['logistic', 'log-people', 'log-people-90']);
    }
    return resolveMenuPath(['logistic', 'log-haul', 'log-haul-ore', 'log-haul-return']);
  }

  // ── Refuel ─────────────────────────────────────────────────────────────
  if (/\b(refuel|resupply|tanker)\b/.test(q)) {
    if (/\bpassive|stand[- ]?by|until recalled\b/.test(q)) {
      return resolveMenuPath(['logistic', 'log-refuel', 'log-refuel-passive']);
    }
    if (/\bfleet|designated|other\b/.test(q)) {
      return resolveMenuPath(['logistic', 'log-refuel', 'log-refuel-fleet']);
    }
    return resolveMenuPath(['logistic', 'log-refuel', 'log-refuel-self']);
  }

  // ── Station-keep / presence / picket ───────────────────────────────────
  if (/\b(station[- ]?keep|picket|presence|hold position)\b/.test(q)) {
    if (/\bmarket|trade hub|factor\b/.test(q)) {
      if (/\b5\s*min|timed\b/.test(q)) {
        return resolveMenuPath(['economic', 'eco-keep', 'eco-keep-timed']);
      }
      return resolveMenuPath(['economic', 'eco-keep',
        /\bpassive\b/.test(q) ? 'eco-keep-passive' : 'eco-keep-active']);
    }
    if (/\bhabit|civilian|support|colony\b/.test(q)) {
      if (/\bactive\b/.test(q)) {
        return resolveMenuPath(['civilian', 'civ-keep', 'civ-keep-active']);
      }
      if (/\b10\s*min|timed\b/.test(q)) {
        return resolveMenuPath(['civilian', 'civ-keep', 'civ-keep-timed']);
      }
      return resolveMenuPath(['civilian', 'civ-keep', 'civ-keep-passive']);
    }
    if (/\bjump\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-keep', 'mil-keep-special', 'mil-keep-jump']);
    }
    if (/\basteroid|overwatch\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-keep', 'mil-keep-special', 'mil-keep-asteroid']);
    }
    if (/\baggressive\b/.test(q)) {
      return resolveMenuPath(['military', 'mil-keep', 'mil-keep-station', 'mil-keep-aggro']);
    }
    return resolveMenuPath(['military', 'mil-keep', 'mil-keep-station',
      /\bpassive\b/.test(q) ? 'mil-keep-passive' : 'mil-keep-active']);
  }

  // ── Lane watch ─────────────────────────────────────────────────────────
  if (/\b(trade lane|lane watch|lane escort)\b/.test(q)) {
    if (/\bescort\b/.test(q)) {
      return resolveMenuPath(['economic', 'eco-lane', 'eco-lane-escort']);
    }
    if (/\bpassive|continuous|until recalled\b/.test(q)) {
      return resolveMenuPath(['economic', 'eco-lane', 'eco-lane-passive']);
    }
    if (/\b5\s*min|300|extended\b/.test(q)) {
      return resolveMenuPath(['economic', 'eco-lane', 'eco-lane-300']);
    }
    return resolveMenuPath(['economic', 'eco-lane', 'eco-lane-90']);
  }

  // ── Arbitrage ──────────────────────────────────────────────────────────
  if (/\b(arbitrage|spread|buy low|sell high)\b/.test(q)) {
    if (/\bfuel\b/.test(q)) {
      return resolveMenuPath(['economic', 'eco-arb', 'eco-arb-fuel']);
    }
    if (/\bparts|modules?\b/.test(q)) {
      return resolveMenuPath(['economic', 'eco-arb', 'eco-arb-parts']);
    }
    if (/\bany|opportunistic\b/.test(q)) {
      return resolveMenuPath(['economic', 'eco-arb', 'eco-arb-opportunistic']);
    }
    return resolveMenuPath(['economic', 'eco-arb', 'eco-arb-ore']);
  }

  // ── Negotiate ──────────────────────────────────────────────────────────
  if (/\b(negotiate|contract|docking rights|supply agreement)\b/.test(q)) {
    if (/\bdocking|berth\b/.test(q)) {
      return resolveMenuPath(['economic', 'eco-negotiate', 'eco-negotiate-docking']);
    }
    if (/\bpassive|standing|until recalled\b/.test(q)) {
      return resolveMenuPath(['economic', 'eco-negotiate', 'eco-negotiate-passive']);
    }
    return resolveMenuPath(['economic', 'eco-negotiate', 'eco-negotiate-supply']);
  }

  // ── Construction / build ───────────────────────────────────────────────
  if (/\b(construct|build|construction|order book)\b/.test(q)) {
    if (/\bcontract|hire out|scaffold\b/.test(q)) {
      if (/\bhigh[- ]?pay|best rate\b/.test(q)) {
        return resolveMenuPath(['construction', 'con-contract', 'con-contract-highpay']);
      }
      if (/\bone|single|stand down\b/.test(q)) {
        return resolveMenuPath(['construction', 'con-contract', 'con-contract-one']);
      }
      return resolveMenuPath(['construction', 'con-contract', 'con-contract-passive']);
    }
    if (/\bpriority\b/.test(q)) {
      return resolveMenuPath(['construction', 'con-build', 'con-build-priority']);
    }
    if (/\b10\s*min|timed\b/.test(q)) {
      return resolveMenuPath(['construction', 'con-build', 'con-build-timed']);
    }
    if (/\bone project|stand down\b/.test(q)) {
      return resolveMenuPath(['construction', 'con-build', 'con-build-one']);
    }
    return resolveMenuPath(['construction', 'con-build', 'con-build-passive']);
  }

  // ── Salvage ────────────────────────────────────────────────────────────
  if (/\b(salvage|recover|wreckage|debris)\b/.test(q)) {
    if (/\bwreck|specific\b/.test(q)) {
      return resolveMenuPath(['construction', 'con-salvage', 'con-salvage-wreck']);
    }
    if (/\b4[,.]?000|4k\b/.test(q)) {
      return resolveMenuPath(['construction', 'con-salvage', 'con-salvage-4k']);
    }
    if (/\b2[,.]?000|2k\b/.test(q)) {
      return resolveMenuPath(['construction', 'con-salvage', 'con-salvage-2k']);
    }
    return resolveMenuPath(['construction', 'con-salvage', 'con-salvage-passive']);
  }

  // ── Prospect ───────────────────────────────────────────────────────────
  if (/\b(prospect|assay|deep[- ]?scan)\b/.test(q)) {
    if (/\bdeep|5\s*min|300\b/.test(q)) {
      return resolveMenuPath(['construction', 'con-prospect', 'con-prospect-deep']);
    }
    if (/\bquick|90\b/.test(q)) {
      return resolveMenuPath(['construction', 'con-prospect', 'con-prospect-quick']);
    }
    return resolveMenuPath(['construction', 'con-prospect', 'con-prospect-passive']);
  }

  // ── Demolish ───────────────────────────────────────────────────────────
  if (/\b(demolish|clear|tear down|strip)\b/.test(q)) {
    if (/\bfield|debris\b/.test(q)) {
      return resolveMenuPath(['construction', 'con-demolish', 'con-demolish-field']);
    }
    if (/\b8\s*min|timed\b/.test(q)) {
      return resolveMenuPath(['construction', 'con-demolish', 'con-demolish-timed']);
    }
    return resolveMenuPath(['construction', 'con-demolish', 'con-demolish-one']);
  }

  // ── Tender / repair ────────────────────────────────────────────────────
  if (/\b(tender|repair|patch|restore hull)\b/.test(q)) {
    if (/\bpriority|designated\b/.test(q)) {
      return resolveMenuPath(['support', 'sup-tender', 'sup-tender-priority']);
    }
    if (/\bammo|ordnance\b/.test(q)) {
      return resolveMenuPath(['support', 'sup-tender', 'sup-tender-ammo']);
    }
    if (/\bone|single|stand down\b/.test(q)) {
      return resolveMenuPath(['support', 'sup-tender', 'sup-tender-one']);
    }
    return resolveMenuPath(['support', 'sup-tender', 'sup-tender-passive']);
  }

  // ── Hunt / bounty ──────────────────────────────────────────────────────
  if (/\b(hunt|bounty|hunter)\b/.test(q)) {
    if (/\bspecific|designated|named\b/.test(q)) {
      return resolveMenuPath(['support', 'sup-hunt', 'sup-hunt-specific']);
    }
    if (/\bfive|5\b/.test(q)) {
      return resolveMenuPath(['support', 'sup-hunt', 'sup-hunt-5']);
    }
    if (/\bthree|3\b/.test(q)) {
      return resolveMenuPath(['support', 'sup-hunt', 'sup-hunt-3']);
    }
    if (/\bone|1\b/.test(q)) {
      return resolveMenuPath(['support', 'sup-hunt', 'sup-hunt-1']);
    }
    return resolveMenuPath(['support', 'sup-hunt', 'sup-hunt-passive']);
  }

  // ── Scout ──────────────────────────────────────────────────────────────
  if (/\b(scout|recon|reconnaissance)\b/.test(q)) {
    if (/\bdeep|5\s*min\b/.test(q)) {
      return resolveMenuPath(['support', 'sup-scout', 'sup-scout-deep']);
    }
    if (/\bpassive|continuous|until recalled\b/.test(q)) {
      return resolveMenuPath(['support', 'sup-scout', 'sup-scout-passive']);
    }
    return resolveMenuPath(['support', 'sup-scout', 'sup-scout-quick']);
  }

  // ── Medical / rescue ───────────────────────────────────────────────────
  if (/\b(medical|rescue|sar|medevac|casualty)\b/.test(q)) {
    if (/\bevac|casualty\b/.test(q)) {
      return resolveMenuPath(['civilian', 'civ-medical', 'civ-med-evac']);
    }
    if (/\bsearch|sar|rescue\b/.test(q)) {
      return resolveMenuPath(['civilian', 'civ-medical', 'civ-med-rescue']);
    }
    return resolveMenuPath(['civilian', 'civ-medical', 'civ-med-standby']);
  }

  // ── Colony support ─────────────────────────────────────────────────────
  if (/\b(colony|habitation support)\b/.test(q)) {
    if (/\btech|technician\b/.test(q)) {
      return resolveMenuPath(['civilian', 'civ-colony', 'civ-colony-tech']);
    }
    if (/\bpassive|standing|until recalled\b/.test(q)) {
      return resolveMenuPath(['civilian', 'civ-colony', 'civ-colony-passive']);
    }
    return resolveMenuPath(['civilian', 'civ-colony', 'civ-colony-supply']);
  }

>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
  return { ok: false, error: 'No matching command in the menu' };
}

/** Top-level labels for UI chrome. */
export function branchLabels() {
  return COMMAND_MENU.map(n => ({ id: n.id, label: n.label, prompt: n.prompt, branch: n.branch }));
}
