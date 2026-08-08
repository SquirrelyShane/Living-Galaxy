// Living Galaxy — shipboard AI worker. The whole point of this file is the thread
// it runs on: SmolLM lives HERE, in a Web Worker, so token generation can peg a
// core without ever freezing the game loop. transformers.js picks WebGPU when the
// browser has it and falls back to WASM when it doesn't.

let TF = null;
let generator = null;

self.onmessage = async e => {
  const m = e.data;
  try {
    if (m.type === 'load') {
      self.postMessage({ type: 'status', text: 'Fetching runtime…' });
      TF = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.1');
      TF.env.allowLocalModels = false;
      const device = (typeof navigator !== 'undefined' && navigator.gpu) ? 'webgpu' : 'wasm';
      self.postMessage({ type: 'status', text: `Loading ${m.model} on ${device}…` });
      generator = await TF.pipeline('text-generation', m.model, {
        dtype: 'q4', device,
        progress_callback: p => {
          if (p.status === 'progress' && p.total) {
            self.postMessage({ type: 'progress', pct: Math.round(p.loaded / p.total * 100), file: p.file });
          }
        }
      });
      self.postMessage({ type: 'ready', device });

    } else if (m.type === 'chat') {
      if (!generator) { self.postMessage({ type: 'error', msg: 'Model not loaded' }); return; }
      const streamer = new TF.TextStreamer(generator.tokenizer, {
        skip_prompt: true, skip_special_tokens: true,
        callback_function: t => self.postMessage({ type: 'token', t })
      });
      await generator(m.messages, {
        max_new_tokens: m.max || 160, temperature: 0.7, do_sample: true, streamer
      });
      self.postMessage({ type: 'done' });
    }
  } catch (err) {
    self.postMessage({ type: 'error', msg: String((err && err.message) || err) });
  }
};
