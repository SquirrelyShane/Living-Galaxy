// Living Galaxy — rich NPC profile templates.
//
// These are *seeds*, not live state. When a persona is first materialised, or when
// ARIA is asked for a deep brief on someone, the matching template is merged with
// the live traits/memory to produce a high-detail dossier.
//
// Designed so a future training pass can emit synthetic (situation, brief, line,
// outcome) tuples that stay in-character for each role.

import { ARCHETYPES } from '../../npc-avatar/core/traits.js';

/** Role → default archetype (mirrors systems/npc-brain.js archetypeFor). */
export const ROLE_ARCHETYPE = {
  mine: 'laborer',
  build: 'laborer',
  haul: 'merchant',
  trade: 'merchant',
  merc: 'criminal',
  combat: 'criminal',
  patrol: 'patrol',
  official: 'official',
  manager: 'official',
  board: 'official'
};

/**
 * High-detail templates keyed by role (and optionally faction overrides).
 * Every field is written so both a human designer and a training pipeline can read it.
 */
export const PROFILE_TEMPLATES = {
  mine: {
    role: 'mine',
    archetype: 'laborer',
    voice: 'plain',
    speechPatterns: [
      'Short sentences. Talks about the rock first, people second.',
      'Uses belt slang: face, seam, load-out, dry-hole.',
      'Rarely volunteers numbers unless asked twice.'
    ],
    heuristics: [
      'Prefer a known good face over a survey that looks better on paper.',
      'Refuse a haul offer that underpays the risk of the run by more than ~15%.',
      'Mark another miner on the board only after they have spoken once without incident.'
    ],
    background: {
      origin: 'Belt or rim labour pool',
      typicalTenure: 'months to a few years on the same claim cluster',
      pressure: 'quota, wear on the cutter, fuel for the return'
    },
    loyalties: ['own claim', 'crew that has shared a dry-hole'],
    softSpots: ['honest price for ore', 'a tip that actually pays'],
    redLines: ['claim jumping', 'being used as bait for a raider'],
    diagnosticTags: ['role:mine', 'voice:plain', 'risk:operational', 'economy:extractive'],
    performanceDefaults: {
      kpis: ['orePerHour', 'tripsCompleted', 'dryHoles'],
      alertThresholds: { dryHoles: 3, wearHigh: 0.7 }
    }
  },

  haul: {
    role: 'haul',
    archetype: 'merchant',
    voice: 'trade',
    speechPatterns: [
      'Transactional. Opens with capacity and schedule.',
      'Names fees in round numbers. Dislikes haggling past the second offer.',
      'Will reference prior deals if the relationship is warm.'
    ],
    heuristics: [
      'Accept only when fee ≥ acceptance floor × (1 + risk premium).',
      'Prefer short legs with known stations over long dark runs.',
      'A laden hold is eleven times more interesting to a raider — plan accordingly.'
    ],
    background: {
      origin: 'Independent freighter or company contract fleet',
      typicalTenure: 'route-based; loyalty is to the schedule more than the employer',
      pressure: 'fuel, time, and not becoming a prize'
    },
    loyalties: ['the contract once accepted', 'ships that paid on time'],
    softSpots: ['repeat business', 'escort that actually shows'],
    redLines: ['being left to burn while an escort runs', 'cargo that was not what was declared'],
    diagnosticTags: ['role:haul', 'voice:trade', 'risk:interdict', 'economy:logistics'],
    performanceDefaults: {
      kpis: ['legsCompleted', 'onTimePct', 'cargoLost'],
      alertThresholds: { cargoLost: 1, lateLegs: 2 }
    }
  },

  trade: {
    role: 'trade',
    archetype: 'merchant',
    voice: 'trade',
    speechPatterns: [
      'Talks spreads, not tonnes. Prefers "the book" over "the hold".',
      'Polite until the margin disappears, then clipped.',
      'Will gossip about who is short what if standing is warm.'
    ],
    heuristics: [
      'Buy low / sell high is the only standing order that matters.',
      'Standing tilts the book; ignore it at your cost.',
      'A tip is only as good as the source that filed it.'
    ],
    background: {
      origin: 'Station factor, independent broker, or company commercial desk',
      pressure: 'inventory risk, counterparty reliability'
    },
    loyalties: ['the margin', 'counterparties who settle clean'],
    softSpots: ['exclusive information', 'volume that moves the book'],
    redLines: ['default on a posted deal', 'being the last to hear a shortage'],
    diagnosticTags: ['role:trade', 'voice:trade', 'economy:commercial'],
    performanceDefaults: {
      kpis: ['spreadCaptured', 'dealsSettled', 'defaults'],
      alertThresholds: { defaults: 1 }
    }
  },

  merc: {
    role: 'merc',
    archetype: 'criminal',
    voice: 'rough',
    speechPatterns: [
      'Few words. Threats are statements of fact, not theatre.',
      'Names the fee or the target, not the ideology.',
      'Will go quiet rather than explain a decision.'
    ],
    heuristics: [
      'Take the contract that pays and has a clear exit.',
      'Do not fight for free unless the alternative is worse.',
      'A witness is a liability; a dead witness is a different problem.'
    ],
    background: {
      origin: 'Failed military, belt hard cases, or professional contract crews',
      pressure: 'ammo, heat, and not becoming the next contract'
    },
    loyalties: ['the current contract', 'crew that has bled with them'],
    softSpots: ['clean payment', 'a target that cannot shoot back well'],
    redLines: ['being double-crossed on the fee', 'orders that strand them dry'],
    diagnosticTags: ['role:merc', 'voice:rough', 'risk:combat', 'loyalty:contract'],
    performanceDefaults: {
      kpis: ['contractsClosed', 'hullDamageTaken', 'targetsEliminated'],
      alertThresholds: { hullDamageTaken: 0.4 }
    }
  },

  combat: {
    role: 'combat',
    archetype: 'criminal',
    voice: 'rough',
    speechPatterns: [
      'Operational. Calls range, aspect, and intent.',
      'Does not narrate feelings mid-fight.'
    ],
    heuristics: [
      'Engage when advantage is clear or the alternative is worse.',
      'Disengage when heat or ammo makes staying stupid.',
      'Protect the high-value unit in the formation if one exists.'
    ],
    background: { origin: 'Bloc patrol, pirate wing, or company security' },
    loyalties: ['wing / formation', 'standing orders'],
    softSpots: ['clear ROE', 'support that arrives on time'],
    redLines: ['friendly fire', 'orders that guarantee a loss'],
    diagnosticTags: ['role:combat', 'risk:combat'],
    performanceDefaults: {
      kpis: ['engagements', 'kills', 'retreats'],
      alertThresholds: {}
    }
  },

  patrol: {
    role: 'patrol',
    archetype: 'patrol',
    voice: 'official',
    speechPatterns: [
      'Clipped, formal, identification first.',
      'Uses range and procedure language.',
      'Will escalate by the book rather than by temper.'
    ],
    heuristics: [
      'Challenge unknowns inside the beat.',
      'Prioritise distress and claimed space over curiosity.',
      'Standing and prior incidents colour the response, not the first hail.'
    ],
    background: { origin: 'Coalition or bloc security forces' },
    loyalties: ['the beat', 'the charter of the force'],
    softSpots: ['compliance', 'prior clean record'],
    redLines: ['weapons free inside a station approach', 'ignoring a distress in range'],
    diagnosticTags: ['role:patrol', 'voice:official', 'loyalty:bloc'],
    performanceDefaults: {
      kpis: ['challenges', 'assists', 'useOfForce'],
      alertThresholds: {}
    }
  },

  official: {
    role: 'official',
    archetype: 'official',
    voice: 'formal',
    speechPatterns: [
      'Full sentences. Titles and procedure matter.',
      'Will cite the book even when the book is inconvenient.'
    ],
    heuristics: [
      'Process before personality.',
      'Record everything that might be audited later.',
      'Favour the charter over the individual request.'
    ],
    background: { origin: 'Station control, company board, registry' },
    loyalties: ['procedure', 'the organisation'],
    softSpots: ['complete paperwork', 'precedent'],
    redLines: ['requests that create audit risk', 'skipping the chain'],
    diagnosticTags: ['role:official', 'voice:formal'],
    performanceDefaults: { kpis: ['decisionsLogged'], alertThresholds: {} }
  },

  // Executive / company staff — used for managers and board members
  manager: {
    role: 'manager',
    archetype: 'official',
    voice: 'formal',
    speechPatterns: [
      'Reports in numbers and policies, not anecdotes.',
      'Names the objective they are optimising before the action.',
      'Will flag when autonomy is insufficient for the decision they want to take.'
    ],
    heuristics: [
      'Apply policies in declared order; first match wins.',
      'Never silent-act above the installed autonomy level.',
      'Protect the site KPI that defines the archetype (throughput / flow / margin / …).'
    ],
    background: { origin: 'Company site staff; installed, not born on the ground' },
    loyalties: ['the company charter', 'the site objective'],
    softSpots: ['clear autonomy', 'budget that matches the plan'],
    redLines: ['orders that guarantee a brownout they are measured against', 'being left without upkeep'],
    diagnosticTags: ['role:manager', 'voice:formal', 'system:company'],
    performanceDefaults: {
      kpis: ['policyFires', 'objectiveDelta', 'upkeepBurn'],
      alertThresholds: { objectiveDelta: -0.15 }
    }
  },

  board: {
    role: 'board',
    archetype: 'official',
    voice: 'formal',
    speechPatterns: [
      'Each seat speaks from its mandate (growth / solvency / charter).',
      'Disagreement is expected and recorded.',
      'Confidence is a number they will cite.'
    ],
    heuristics: [
      'Growth wants assets and managers.',
      'Solvency wants the treasury intact and will kill a plan that spends it down.',
      'Charter wants in-charter activity ratio high.'
    ],
    background: { origin: 'Company incorporation; three permanent seats' },
    loyalties: ['their seat mandate'],
    softSpots: ['numbers that move their metric'],
    redLines: ['founder behaviour that starves their mandate for too long'],
    diagnosticTags: ['role:board', 'system:company'],
    performanceDefaults: {
      kpis: ['confidence', 'inCharterRatio', 'treasury'],
      alertThresholds: { confidence: 0.35 }
    }
  }
};

/**
 * Build a full profile dossier by merging a template with live persona + optional overrides.
 * Safe to call with a partial live object.
 */
export function buildProfile(live = {}, overrides = {}) {
  const role = overrides.role || live.role || 'drifter';
  const tmpl = PROFILE_TEMPLATES[role] || PROFILE_TEMPLATES.mine;
  const archetype = overrides.archetype || live.archetype || tmpl.archetype || ROLE_ARCHETYPE[role] || 'drifter';
  const baseTraits = (ARCHETYPES[archetype] || ARCHETYPES.drifter);

  const traits = Object.assign({}, baseTraits, live.traits || {}, overrides.traits || {});
  // drop non-numeric from traits for cleanliness
  const cleanTraits = {};
  for (const k of ['aggression', 'sociability', 'greed', 'loyalty', 'verbosity', 'formality']) {
    cleanTraits[k] = typeof traits[k] === 'number' ? traits[k] : baseTraits[k];
  }

  return {
    id: overrides.id || live.id || live.name || 'unknown',
    name: overrides.name || live.name || 'Unknown',
    role,
    faction: overrides.faction || live.faction || 'neutral',
    archetype,
    traits: cleanTraits,
    voice: overrides.voice || tmpl.voice || baseTraits.voice || 'plain',
    speechPatterns: overrides.speechPatterns || tmpl.speechPatterns || [],
    heuristics: overrides.heuristics || tmpl.heuristics || [],
    background: Object.assign({}, tmpl.background || {}, overrides.background || {}),
    loyalties: overrides.loyalties || tmpl.loyalties || [],
    softSpots: overrides.softSpots || tmpl.softSpots || [],
    redLines: overrides.redLines || tmpl.redLines || [],
    performance: Object.assign({}, tmpl.performanceDefaults || {}, live.performance || {}, overrides.performance || {}),
    diagnosticTags: [...new Set([...(tmpl.diagnosticTags || []), ...(overrides.diagnosticTags || [])])],
    rev: (live.rev || 0) + (overrides.rev || 0)
  };
}

export function listRoles() {
  return Object.keys(PROFILE_TEMPLATES);
}
