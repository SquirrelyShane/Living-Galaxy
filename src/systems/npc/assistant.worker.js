// Living Galaxy — assistant inference worker. Runs OFF the main thread so the game
// loop, WebGL and input never stall on token generation. Loads transformers.js from a
// CDN inside the worker; if that fails (offline, blocked), it reports back and the
// main thread falls back to the rule-based helper. Nothing here touches the DOM.

import { MODELS, DEFAULT_MODEL } from '../../npc-avatar/llm/models.js';

let generator = null;
let loading = false;
// Which model this worker ended up holding. Set by the first `load` that arrives and not
// changed afterwards: swapping weights inside a live worker means holding two sets in
// memory at once on a device chosen for having very little of it.
let chosen = null;

// One source for which model this is. The id used to be hardcoded here *and* declared in
// core/config.js under a different repository name — three declarations, two of which
// disagreed. `npc-avatar/llm/models.js` is the registry the rest of the project keys into,
// so this worker reads it too rather than carrying a fourth opinion.
const CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2';

async function ensureModel(key) {
  if (generator) return generator;
  if (loading) throw new Error('still loading');
  loading = true;
  chosen = chosen || (MODELS[key] ? key : DEFAULT_MODEL);
  const MODEL = MODELS[chosen].id;
  try {
    const { pipeline, env } = await import(CDN);
    env.allowLocalModels = false;          // pull weights from the HF hub / CDN cache
    // WebGPU when the device has it, wasm otherwise. Quantized so a phone can hold it.
    let device = 'wasm', dtype = 'q4';
    if (typeof navigator !== 'undefined' && navigator.gpu) {
      try { await navigator.gpu.requestAdapter(); device = 'webgpu'; dtype = 'q4f16'; }
      catch (e) { /* stay on wasm */ }
    }
    generator = await pipeline('text-generation', MODEL, {
      device, dtype,
      progress_callback: p => {
        if (p.status === 'progress' && p.file && p.total)
          post({ t: 'progress', file: p.file, pct: Math.round((p.loaded / p.total) * 100) });
      }
    });
    post({ t: 'ready', device, model: chosen, params: MODELS[chosen].params });
    return generator;
  } finally {
    loading = false;
  }
}

function post(m) { self.postMessage(m); }

self.onmessage = async ev => {
  const m = ev.data;
  if (m.t === 'load') {
    try { await ensureModel(m.model); }
    catch (e) { post({ t: 'error', where: 'load', msg: String(e && e.message || e) }); }
    return;
  }
  if (m.t === 'ask') {
    try {
      const gen = await ensureModel(m.model);
      const messages = [
        { role: 'system', content: m.system },
        { role: 'user', content: m.prompt }
      ];
      const out = await gen(messages, { max_new_tokens: 120, temperature: 0.6, do_sample: true });
      let text = '';
      const g = out[0] && out[0].generated_text;
      if (Array.isArray(g)) text = (g[g.length - 1].content || '').trim();
      else if (typeof g === 'string') text = g.trim();
      post({ t: 'reply', id: m.id, text: text || '(no response)' });
    } catch (e) {
      post({ t: 'error', where: 'ask', id: m.id, msg: String(e && e.message || e) });
    }
  }
};
