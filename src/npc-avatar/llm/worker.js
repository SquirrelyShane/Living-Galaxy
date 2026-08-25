// NPC_Avatar — inference worker. Runs OFF the main thread so nothing here ever stalls a
// game loop, WebGL, or input handling — this is the reason the worker exists at all, not
// a performance nicety. Loads transformers.js from a CDN inside the worker; if that
// fails (offline, blocked, unsupported), it reports back and the caller stays on the
// grammar tier, which was already the answer the player was shown.
//
// One model is loaded at a time. This mirrors llm/bridge.js's single-slot concurrency —
// there is never a reason for this worker to hold two models in memory when the router
// upstream never asks two questions at once.

let generator = null;
let loading = false;
let loadedModelId = null;

const CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.0';

async function ensureModel(modelId) {
  if (generator && loadedModelId === modelId) return generator;
  if (loading) throw new Error('still loading');
  loading = true;
  generator = null;
  try {
    const { pipeline, env } = await import(CDN);
    env.allowLocalModels = false;
    let device = 'wasm', dtype = 'q4';
    if (typeof navigator !== 'undefined' && navigator.gpu) {
      try { await navigator.gpu.requestAdapter(); device = 'webgpu'; dtype = 'q4f16'; }
      catch (e) { /* stay on wasm */ }
    }
    generator = await pipeline('text-generation', modelId, {
      device, dtype,
      progress_callback: p => {
        if (p.status === 'progress' && p.file && p.total) {
          post({ t: 'progress', file: p.file, pct: Math.round((p.loaded / p.total) * 100) });
        }
      }
    });
    loadedModelId = modelId;
    post({ t: 'ready', device, model: modelId });
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
        { role: 'system', content: m.system || '' },
        { role: 'user', content: m.prompt || '' }
      ];
      // Short by design: NPC one-liners, not conversation. A caller that genuinely
      // wants more should say so explicitly rather than this defaulting long.
      const out = await gen(messages, {
        max_new_tokens: m.maxTokens || 48,
        temperature: m.temperature != null ? m.temperature : 0.7,
        do_sample: true
      });
      let text = '';
      const g = out[0] && out[0].generated_text;
      if (Array.isArray(g)) text = (g[g.length - 1].content || '').trim();
      else if (typeof g === 'string') text = g.trim();
      post({ t: 'reply', id: m.id, text: text || '' });
    } catch (e) {
      post({ t: 'error', where: 'ask', id: m.id, msg: String(e && e.message || e) });
    }
  }
};
