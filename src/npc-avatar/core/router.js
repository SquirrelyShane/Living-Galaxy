// NPC_Avatar — router.
//
// The seam between the tier that always works and the tier that sometimes helps.
//
// `requestLine` never blocks and never fails: it computes the grammar-tier line
// synchronously (core/grammar.js, effectively free) and returns it immediately as
// `text`. If a language-model bridge is attached, has a free concurrency slot, the
// situation is marked worth the cost, and this particular character has not been asked
// recently, it *also* kicks off an async request and returns it as `upgrade` — a promise
// that resolves to a better line, or to `null` if the model was never asked, timed out,
// or errored. The caller shows `text` the instant it has it and swaps in `upgrade`'s
// result if and when it lands. Nothing in the game ever waits on a model.
//
// Three gates keep the model tier from being a cost centre instead of a feature:
//
//   **Concurrency.** `maxConcurrent` — on a phone this should be 1. A game asking three
//     background characters to think at once is asking for a stutter.
//   **Cooldown.** The same character will not be asked again inside `cooldown` seconds
//     no matter how often the situation recurs — a pilot mashing "reply" does not get to
//     burn the model's one slot on the same NPC over and over.
//   **Worthiness.** `worthy(situation, ctx)` is the caller's own judgement of which
//     moments earn the upgrade. Ambient chatter almost never should; a hail from the
//     mercenary who just took a contract on you almost always should.

import { say } from './persona.js';

/**
 * @param {object} [opts]
 * @param {number} [opts.maxConcurrent=1]
 * @param {number} [opts.cooldown=20]        seconds, in whatever time unit `now` uses
 * @param {(situation:string, ctx:object)=>boolean} [opts.worthy]
 */
export function createRouter(opts = {}) {
  return {
    maxConcurrent: opts.maxConcurrent != null ? opts.maxConcurrent : 1,
    cooldown: opts.cooldown != null ? opts.cooldown : 20,
    worthy: opts.worthy || (() => true),
    inFlight: 0,
    lastRequest: new Map()          // persona id -> game time of the last model request
  };
}

/**
 * @param {object} args
 * @param {object} args.persona
 * @param {object} args.grammar
 * @param {string} args.situation
 * @param {object} [args.ctx]
 * @param {*} [args.rng]
 * @param {number} [args.now]
 * @param {object|null} [args.bridge]     see llm/bridge.js — needs `.ready()` and `.request(req)`
 * @param {{system:string, prompt:string}|null} [args.llmRequest]  override the default prompt
 * @returns {{ text: string, upgrade: Promise<string|null>|null, reason: string }}
 */
export function requestLine(router, args) {
  const { persona, grammar, situation, ctx = {}, rng = Math.random, now = 0,
          bridge = null, llmRequest = null } = args;
  const text = say(persona, grammar, situation, ctx, rng, now);

  const gate = eligibility(router, persona, situation, ctx, bridge, now);
  if (!gate.ok) return { text, upgrade: null, reason: gate.reason };

  router.inFlight++;
  router.lastRequest.set(persona.id, now);
  const req = llmRequest || defaultRequest(persona, situation, text);
  const upgrade = Promise.resolve()
    .then(() => bridge.request(req))
    .then(out => { router.inFlight--; return out || null; })
    .catch(() => { router.inFlight--; return null; });

  return { text, upgrade, reason: 'requested' };
}

/** Exposed for UIs/diagnostics that want to explain why an upgrade did or didn't fire. */
export function eligibility(router, persona, situation, ctx, bridge, now) {
  if (!bridge || typeof bridge.ready !== 'function' || !bridge.ready()) {
    return { ok: false, reason: 'no-bridge' };
  }
  if (router.inFlight >= router.maxConcurrent) return { ok: false, reason: 'busy' };
  const last = router.lastRequest.get(persona.id);
  if (last != null && now - last < router.cooldown) return { ok: false, reason: 'cooldown' };
  if (!router.worthy(situation, ctx)) return { ok: false, reason: 'not-worth-it' };
  return { ok: true, reason: 'clear' };
}

function defaultRequest(persona, situation, grammarLine) {
  return {
    system: `You are ${persona.name}, a ${persona.archetype} aligned with ${persona.faction}. ` +
            `Reply in one short in-character sentence. Do not narrate actions, only speak.`,
    prompt: `Situation: ${situation}. A plain version of what you'd say: "${grammarLine}". ` +
            `Say it in your own voice.`
  };
}

export const routerReport = router => ({
  inFlight: router.inFlight,
  maxConcurrent: router.maxConcurrent,
  cooldown: router.cooldown,
  tracked: router.lastRequest.size
});
