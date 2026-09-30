import { growBaked } from "./body.js";

const CACHE_CAP = 48;
const cache = new Map();
const pending = new Map();
const queue = [];
let worker = null;
let workerState = "none";
let busy = 0;
const inflight = new Map();
let seq = 1;

export const growerStats = { grown: 0, cached: 0, mainThread: 0, worker: 0, failed: 0, get state() { return workerState; }, get queued() { return queue.length; } };

function boot() {
  if (workerState !== "none") return;
  if (typeof Worker === "undefined" || !globalThis.document) { workerState = "dead"; return; }
  try {
    worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
    workerState = "booting";
    setTimeout(() => { if (workerState === "booting") { console.warn("grower worker did not boot, growing on the main thread"); die(); } }, 10000);
    worker.onmessage = (e) => {
      const m = e.data;
      if (m.ready) { workerState = "ready"; drain(); return; }
      if (m.fatal) { console.warn("grower worker failed, growing on the main thread:", m.fatal); die(); return; }
      const key = inflight.get(m.id);
      inflight.delete(m.id);
      busy--;
      const p = pending.get(key);
      if (p) {
        pending.delete(key);
        if (m.error) { growerStats.failed++; p.reject(new Error(m.error)); }
        else { growerStats.worker++; finish(key, m.d); p.resolve(m.d); }
      }
      drain();
    };
    worker.onerror = (e) => { console.warn("grower worker error, growing on the main thread:", e.message); die(); };
  } catch (err) {
    workerState = "dead";
  }
}

function die() {
  workerState = "dead";
  try { worker?.terminate(); } catch {}
  worker = null;
  busy = 0;
  for (const key of inflight.values()) if (pending.has(key) && !queue.includes(key)) queue.unshift(key);
  inflight.clear();
}

function finish(key, d) {
  growerStats.grown++;
  cache.set(key, d);
  if (cache.size > CACHE_CAP) cache.delete(cache.keys().next().value);
}

function drain() {
  if (workerState !== "ready") return;
  while (busy < 1 && queue.length) {
    const key = queue.shift();
    const p = pending.get(key);
    if (!p) continue;
    const id = seq++;
    inflight.set(id, key);
    busy++;
    worker.postMessage({ id, opts: p.opts });
  }
}

export function peek(key) {
  const d = cache.get(key);
  if (d) { cache.delete(key); cache.set(key, d); growerStats.cached++; }
  return d ?? null;
}

export function grow(key, opts) {
  const d = cache.get(key);
  if (d) return Promise.resolve(d);
  const had = pending.get(key);
  if (had) return had.promise;
  boot();
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  promise.catch(() => {});
  pending.set(key, { promise, resolve, reject, opts });
  queue.push(key);
  drain();
  return promise;
}

export function isPending(key) {
  return pending.has(key);
}

export function cancel(keep) {
  for (let i = queue.length - 1; i >= 0; i--) {
    const key = queue[i];
    if (keep(key)) continue;
    queue.splice(i, 1);
    pending.get(key)?.reject(new Error("cancelled"));
    pending.delete(key);
  }
}

export function pump(bootGrace = true) {
  if (workerState === "ready" || (workerState === "booting" && bootGrace)) return false;
  const key = queue.shift();
  if (key == null) return false;
  const p = pending.get(key);
  if (!p) return false;
  pending.delete(key);
  try {
    const d = growBaked(p.opts);
    growerStats.mainThread++;
    finish(key, d);
    p.resolve(d);
  } catch (err) {
    growerStats.failed++;
    p.reject(err);
  }
  return true;
}

export function resetGrower() {
  cache.clear();
  for (const p of pending.values()) p.reject(new Error("reset"));
  pending.clear();
  queue.length = 0;
}
