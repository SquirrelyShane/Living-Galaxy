// NPC_Avatar — LLM bridge.
//
// Generalizes the worker-management dance this project's host game already proved out
// for its ship AI (load → progress → ready, with a rule-based/grammar answer available
// the entire time) into something router.js can drive without knowing a worker exists.
//
// The contract `core/router.js` relies on is exactly two methods:
//
//   bridge.ready()          → boolean, synchronous
//   bridge.request(req)     → Promise<string|null>, NEVER rejects
//
// `request` resolving `null` covers every failure mode uniformly — not loaded, worker
// missing, timed out, threw — so the router's fallback path (keep the grammar-tier line)
// never needs to know which one happened. `workerFactory` is injectable specifically so
// this file is unit-testable without ever constructing a real Worker or touching a CDN;
// the default factory is the only part of this file a browser test would exercise.

import { MODELS, DEFAULT_MODEL } from './models.js';

const defaultWorkerFactory = () => new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

/**
 * @param {object} [opts]
 * @param {string} [opts.model]            key into llm/models.js MODELS
 * @param {number} [opts.timeoutMs=6000]
 * @param {(status:object)=>void} [opts.onStatus]  {kind:'loading'|'ready'|'error'|'unsupported', ...}
 * @param {()=>object} [opts.workerFactory] returns anything with postMessage + onmessage —
 *   swap this in tests to avoid a real Worker.
 */
export function createBridge(opts = {}) {
  const state = {
    model: MODELS[opts.model] ? opts.model : DEFAULT_MODEL,
    timeoutMs: opts.timeoutMs || 6000,
    onStatus: opts.onStatus || (() => {}),
    workerFactory: opts.workerFactory || defaultWorkerFactory,
    worker: null,
    status: 'idle',              // idle | loading | ready | error | unsupported
    device: null,
    pending: new Map(),
    nextId: 1
  };

  function handle(m) {
    if (m.t === 'progress') {
      state.onStatus({ kind: 'loading', pct: m.pct || 0, file: m.file });
    } else if (m.t === 'ready') {
      state.status = 'ready';
      state.device = m.device;
      state.onStatus({ kind: 'ready', device: m.device, model: state.model });
    } else if (m.t === 'reply') {
      const p = state.pending.get(m.id);
      if (p) { state.pending.delete(m.id); p.resolve(m.text); }
    } else if (m.t === 'error') {
      if (m.where === 'load') {
        state.status = 'error';
        state.onStatus({ kind: 'error', msg: m.msg });
      }
      if (m.id != null) {
        const p = state.pending.get(m.id);
        if (p) { state.pending.delete(m.id); p.resolve(null); }
      }
    }
  }

  function load() {
    if (state.status === 'ready' || state.status === 'loading') return;
    if (typeof Worker === 'undefined' && !opts.workerFactory) {
      state.status = 'unsupported';
      state.onStatus({ kind: 'unsupported' });
      return;
    }
    state.status = 'loading';
    state.onStatus({ kind: 'loading', pct: 0 });
    try {
      state.worker = state.workerFactory();
    } catch (e) {
      state.status = 'error';
      state.onStatus({ kind: 'error', msg: 'worker failed to start' });
      return;
    }
    state.worker.onmessage = ev => handle(ev.data);
    state.worker.postMessage({ t: 'load', model: MODELS[state.model].id });
  }

  /**
   * Switch models. Only meaningful once idle again — a caller that wants to change tier
   * mid-session should let in-flight requests finish (or accept they resolve null) first.
   */
  function setModel(key) {
    if (!MODELS[key]) return false;
    state.model = key;
    state.status = 'idle';
    state.device = null;
    return true;
  }

  function ready() { return state.status === 'ready'; }
  function statusReport() {
    return { status: state.status, model: state.model, device: state.device,
             inFlight: state.pending.size };
  }

  /**
   * @param {{system:string, prompt:string, maxTokens?:number, temperature?:number}} req
   * @returns {Promise<string|null>} never rejects
   */
  function request(req) {
    if (state.status !== 'ready' || !state.worker) return Promise.resolve(null);
    const id = state.nextId++;
    return new Promise(resolve => {
      let done = false;
      const timer = setTimeout(() => {
        if (done) return;
        done = true;
        state.pending.delete(id);
        resolve(null);
      }, state.timeoutMs);
      state.pending.set(id, {
        resolve: text => { if (done) return; done = true; clearTimeout(timer); resolve(text || null); }
      });
      state.worker.postMessage({
        t: 'ask', id, model: MODELS[state.model].id,
        system: req.system, prompt: req.prompt,
        maxTokens: req.maxTokens, temperature: req.temperature
      });
    });
  }

  function dispose() {
    if (state.worker && typeof state.worker.terminate === 'function') state.worker.terminate();
    state.worker = null;
    state.status = 'idle';
    state.pending.clear();
  }

  return { load, ready, request, setModel, statusReport, dispose };
}
