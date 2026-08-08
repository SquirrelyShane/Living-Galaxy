// NPC_Avatar — model registry.
//
// One place that knows which small models are worth pointing a browser at for NPC
// one-liners, and why. This is the part of the project most likely to go stale fastest —
// the small-model field moves in months, not years — so every entry carries the
// reasoning, not just an id, and `DEFAULT_MODEL` is the one choice this file actually
// commits to.
//
// Sizing logic for a phone running one background NPC's dialogue at a time (see
// core/router.js's concurrency gate — this project never asks more than one model
// request to be in flight together, so "fits on a phone" means one instance, not a
// crowd):
//
//   **default**  — the everyday pick. Small enough to load and hold on a mid-range
//     phone over WASM if WebGPU is unavailable, good enough at short in-character
//     replies to be worth the wait.
//   **light**    — a fallback if `default` is too slow on a given device, or if a
//     project wants to try running two personas' worth of dialogue without WebGPU.
//   **upgrade**  — a step up in reply quality for projects that can assume a more
//     capable device or that only ever need the model for a single high-value
//     character (a station controller, a named agent) rather than a general pool.
//   **director** — reserved for a single narrator-class character, not for concurrent
//     NPC dialogue. Only worth loading if a project specifically wants one character
//     to reason, not just talk.

export const MODELS = {
  'smollm2-360m': {
    id: 'HuggingFaceTB/SmolLM2-360M-Instruct',
    params: '360M', tier: 'default',
    notes: 'The safe default. Already proven running in this project family on a phone ' +
           'over the worker+WASM fallback path — start here before trying anything else.'
  },
  'smollm2-135m': {
    id: 'HuggingFaceTB/SmolLM2-135M-Instruct',
    params: '135M', tier: 'light',
    notes: 'Smallest in the SmolLM2 family. Faster load and lower memory than the 360M ' +
           'at a real quality cost — worth trying if the default stutters on WASM-only ' +
           'devices, or before assuming a device simply cannot run this tier at all.'
  },
  'qwen2.5-0.5b': {
    id: 'Qwen/Qwen2.5-0.5B-Instruct',
    params: '0.5B', tier: 'default',
    notes: 'A same-weight-class alternative to SmolLM2-360M with strong instruction ' +
           'following for its size. Worth an A/B if SmolLM2 dialogue reads too flat for ' +
           'a particular archetype.'
  },
  'qwen3-0.6b': {
    id: 'Qwen/Qwen3-0.6B',
    params: '0.6B', tier: 'upgrade',
    notes: 'Dual think/no_think mode. Force no_think for NPC one-liners — the reasoning ' +
           'mode is not worth the latency for a background character\u2019s dialogue, ' +
           'but the plain mode is a genuine step up over the 360M-class models.'
  },
  'smollm3-3b': {
    id: 'HuggingFaceTB/SmolLM3-3B',
    params: '3B', tier: 'director',
    notes: 'Reserve for one narrator or quest-critical character, on hardware that can ' +
           'plausibly hold it — desktop, or a flagship phone over WebGPU. Do not use ' +
           'this for the general ambient-NPC pool; the router\u2019s concurrency gate ' +
           'protects against it being asked to, but the load time alone is not worth ' +
           'paying for a character the player meets once.'
  }
};
export const MODEL_KEYS = Object.keys(MODELS);
export const DEFAULT_MODEL = 'smollm2-360m';

export const modelsByTier = tier => MODEL_KEYS.filter(k => MODELS[k].tier === tier);

/**
 * Browser built-in on-device models (Chrome's Prompt API / "Gemini Nano" and equivalents)
 * are deliberately not in the registry above. They cost zero download, which is the
 * single biggest win a mobile deployment could ask for — but availability is currently
 * inconsistent across Chromium forks, some of which (Brave among them) strip the
 * on-device model plumbing entirely for privacy reasons. `probeBuiltIn()` below is the
 * honest way to find out: feature-detect at runtime, never assume from the browser name.
 */
export async function probeBuiltIn() {
  try {
    const g = typeof self !== 'undefined' ? self : globalThis;
    const LM = g.LanguageModel || (g.ai && g.ai.languageModel);
    if (!LM) return { available: false, reason: 'no-api' };
    const avail = typeof LM.availability === 'function' ? await LM.availability()
                : typeof LM.capabilities === 'function' ? (await LM.capabilities()).available
                : 'unknown';
    return { available: avail === 'available' || avail === 'readily', reason: String(avail) };
  } catch (e) {
    return { available: false, reason: 'probe-failed' };
  }
}
