// Living Galaxy — seed training corpus for onboard ARIA / NPC self-training.
//
// Each example is a complete (input → expected) pair that a future training or
// few-shot pipeline can consume without the game running. They are deliberately
// written against the profile + diagnostic schemas so synthetic data stays aligned
// with live behaviour.
//
// Quality is hand-set 0..1. Prefer high-quality seeds over volume; a model fine-tuned
// on noisy roleplay will invent facts the instruments already answer correctly.

/** @type {import('./schema.js').TrainingExample[]} */
export const TRAINING_SEED = [
  // ── dialogue ──────────────────────────────────────────────────────
  {
    id: 'dlg-checkin-ack',
    purpose: 'dialogue',
    quality: 0.95,
    tags: ['npc-comms', 'checkIn', 'acknowledgement'],
    input: {
      situation: 'checkIn',
      speaker: { name: 'Kestrel 04', role: 'mine', faction: 'independent' },
      listener: { name: 'Ore Runner 12', role: 'haul', faction: 'independent' },
      opener: 'Ore Runner 12, this is Kestrel 04. Marking you on my board.',
      relation: { exchanges: 0, warmth: 0 }
    },
    expected: {
      replyStyle: 'acknowledge the other party by name, confirm logged',
      example: 'Copy Kestrel 04. Logged.',
      antiPattern: 'Copy Ore Runner 12. Logged.' // self-ack is the bug we fixed
    }
  },
  {
    id: 'dlg-haul-offer-warm',
    purpose: 'dialogue',
    quality: 0.9,
    tags: ['npc-comms', 'haulOffer', 'warm'],
    input: {
      situation: 'haulOffer',
      speaker: { name: 'Face Cutter 7', role: 'mine' },
      listener: { name: 'Long Haul 3', role: 'haul' },
      relation: { exchanges: 4, warmth: 1.2 },
      offer: { kg: 1200, dest: 'Meridian', pay: 4800 }
    },
    expected: {
      replyStyle: 'reference prior terms, accept or counter briefly',
      example: 'Same terms as before. I\'ll swing by.',
      notes: 'Warm relation short-circuits the full negotiation line.'
    }
  },
  {
    id: 'dlg-merc-hail',
    purpose: 'dialogue',
    quality: 0.9,
    tags: ['hail', 'merc', 'contract'],
    input: {
      situation: 'merc-contract',
      speaker: { name: 'Rask', role: 'merc', archetype: 'criminal', traits: { aggression: 0.7, formality: 0.1 } },
      target: 'player',
      fee: 12000
    },
    expected: {
      replyStyle: 'terse, fee first, threat implied not spoken',
      example: 'Twelve thousand. You or the next name on the list.',
      notes: 'High aggression + low formality → no preamble.'
    }
  },

  // ── decision ──────────────────────────────────────────────────────
  {
    id: 'dec-haul-reject-low',
    purpose: 'decision',
    quality: 0.92,
    tags: ['deals', 'haul', 'reject'],
    input: {
      actor: { name: 'Long Haul 3', role: 'haul', traits: { greed: 0.65 } },
      offer: { kind: 'haul', kg: 1800, dest: 'Far Rim', pay: 2100 },
      acceptanceFloor: 3200,
      riskPremium: 0.2
    },
    expected: {
      decision: 'decline',
      reason: 'pay below acceptance floor after risk',
      diagnostic: {
        kind: 'decision',
        situation: 'haul-offer-refused',
        summary: 'Long Haul 3 refused 2100 for 1800 kg to Far Rim — below floor',
        salience: 0.7
      }
    }
  },
  {
    id: 'dec-manager-feed-refiners',
    purpose: 'decision',
    quality: 0.88,
    tags: ['manager', 'industrial', 'policy'],
    input: {
      manager: { id: 'foreman-alpha', archetype: 'industrial', autonomy: 2 },
      site: { power: 0.81, storage: 0.55, extractionIdle: true },
      policies: ['feedRefiners', 'shedNonEssential', 'raisePower', 'expandExtraction']
    },
    expected: {
      decision: 'feedRefiners',
      reason: 'First matching policy; extraction idle while refiners can take feed',
      diagnostic: {
        kind: 'manager',
        situation: 'policy:feedRefiners',
        summary: 'foreman-alpha applied feedRefiners',
        policiesFired: ['feedRefiners']
      }
    }
  },

  // ── diagnostic / brief ────────────────────────────────────────────
  {
    id: 'diag-board-low-confidence',
    purpose: 'diagnostic',
    quality: 0.9,
    tags: ['company', 'board', 'executive'],
    input: {
      company: {
        name: 'Vahn Holdings',
        charter: 'economic',
        treasury: 6200,
        confidence: 0.28,
        inCharter: 4,
        outCharter: 11,
        managers: 1
      }
    },
    expected: {
      briefContains: ['confidence', 'treasury', 'charter'],
      alerts: ['Board confidence critically low', 'Activity drifting outside charter'],
      tone: 'factual, urgent but not panicked'
    }
  },
  {
    id: 'diag-npc-deep-brief',
    purpose: 'brief',
    quality: 0.93,
    tags: ['aria', 'profile', 'who-is'],
    input: {
      query: 'Who is Rask and why are they hunting me?',
      profile: {
        name: 'Rask',
        role: 'merc',
        faction: 'hostile',
        traits: { aggression: 0.72, greed: 0.8, loyalty: 0.15, formality: 0.08 },
        recent: [{ type: 'contract', subject: 'player', weight: 2 }]
      }
    },
    expected: {
      answerStyle: 'name role, temperament in words, cite the contract memory, no invented biography',
      example: 'Rask is a contract merc — aggressive, self-interested, unattached. They have a live contract naming you. Expect a short hail and a fight if you refuse the fee.'
    }
  },

  // ── command (executive) ───────────────────────────────────────────
  {
    id: 'cmd-patrol-30s',
    purpose: 'command',
    quality: 0.9,
    tags: ['executive', 'fleet', 'patrol'],
    input: {
      mode: 'executive-hq',
      order: { type: 'patrol', target: 'sector-belt-north', durationSec: 30 },
      assets: [{ id: 'scout-2', role: 'combat', status: 'idle' }]
    },
    expected: {
      action: 'dispatch',
      confirm: 'Scout-2 assigned patrol of sector-belt-north, 30 s then auto-return.',
      timerVisible: true,
      onComplete: 'return to previous station / hold'
    }
  },
  {
    id: 'cmd-mine-quota',
    purpose: 'command',
    quality: 0.88,
    tags: ['executive', 'fleet', 'mine'],
    input: {
      mode: 'executive-hq',
      order: { type: 'extract', target: 'belt-prime', quotaKg: 4000, mode: 'multi-trip' },
      assets: [{ id: 'cutter-1', role: 'mine', cargoFree: 800 }]
    },
    expected: {
      action: 'dispatch',
      confirm: 'Cutter-1 extracting at belt-prime until 4000 kg or recall. Multi-trip; timer tracks progress.',
      timerVisible: true
    }
  },
  {
    id: 'cmd-aria-nl-map',
    purpose: 'command',
    quality: 0.85,
    tags: ['aria', 'executive', 'nl'],
    input: {
      utterance: 'Send the hauler to Meridian with whatever ore we have and come back',
      parsedIntent: { type: 'logistics', dest: 'Meridian', cargo: 'ore', return: true }
    },
    expected: {
      structuredOrder: {
        type: 'logistics',
        dest: 'Meridian',
        commodity: 'ore',
        returnAfter: true
      },
      confirmStyle: 'one sentence, names the ship and the leg'
    }
  }
];

/** Filter seed examples by purpose or tag. */
export function examplesWhere(pred) {
  return TRAINING_SEED.filter(pred);
}

export function examplesByPurpose(purpose) {
  return TRAINING_SEED.filter(e => e.purpose === purpose);
}

export function examplesByTag(tag) {
  return TRAINING_SEED.filter(e => (e.tags || []).includes(tag));
}
