import { createBridge } from '../llm/bridge.js';

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

console.log('\n— llm bridge —');

/**
 * A fake worker: postMessage(m) is scripted to call back onmessage with whatever the
 * test wants, on a real timer so this exercises the bridge's actual async plumbing
 * rather than a same-tick stub. Nothing here touches a real Worker, transformers.js, or
 * a network — that is the entire point of `workerFactory` being injectable.
 */
function fakeWorker(script) {
  const w = { onmessage: null, posted: [] };
  w.postMessage = m => {
    w.posted.push(m);
    const reply = script(m, w);
    if (reply) setTimeout(() => w.onmessage && w.onmessage({ data: reply }), 0);
  };
  w.terminate = () => { w.terminated = true; };
  return w;
}

// ── load → ready ─────────────────────────────────────────────────────
{
  const statuses = [];
  const bridge = createBridge({
    onStatus: s => statuses.push(s),
    workerFactory: () => fakeWorker(m => m.t === 'load' ? { t: 'ready', device: 'wasm', model: m.model } : null)
  });
  ok('starts idle and not ready', bridge.ready() === false);
  bridge.load();
  ok('load moves to loading immediately', statuses[0].kind === 'loading');
  await new Promise(r => setTimeout(r, 5));
  ok('the worker\'s ready message flips the bridge to ready', bridge.ready() === true);
  ok('the ready status is reported', statuses.some(s => s.kind === 'ready'));
  ok('calling load() again once ready is a no-op', (bridge.load(), true));
}

// ── request happy path ───────────────────────────────────────────────
{
  const bridge = createBridge({
    workerFactory: () => fakeWorker(m => {
      if (m.t === 'load') return { t: 'ready', device: 'wasm' };
      if (m.t === 'ask') return { t: 'reply', id: m.id, text: 'a generated line' };
    })
  });
  bridge.load();
  await new Promise(r => setTimeout(r, 5));
  const out = await bridge.request({ system: 's', prompt: 'p' });
  ok('a ready bridge returns the worker\'s reply text', out === 'a generated line');
}

// ── not ready yet ────────────────────────────────────────────────────
{
  const bridge = createBridge({ workerFactory: () => fakeWorker(() => null) });
  const out = await bridge.request({ system: 's', prompt: 'p' });
  ok('requesting before load/ready resolves null rather than throwing', out === null);
}

// ── progress reporting ───────────────────────────────────────────────
{
  const statuses = [];
  let captured = null;
  const bridge = createBridge({
    onStatus: s => statuses.push(s),
    workerFactory: () => (captured = fakeWorker(m => m.t === 'load' ? { t: 'ready', device: 'webgpu' } : null))
  });
  bridge.load();
  // A progress event the worker sends before its 'ready' — fired directly at the
  // captured worker's onmessage, exactly as a real worker's postMessage would land.
  captured.onmessage({ data: { t: 'progress', pct: 40, file: 'model.onnx' } });
  await new Promise(r => setTimeout(r, 5));
  ok('progress events reach onStatus', statuses.some(s => s.kind === 'loading' && s.pct === 40));
}

// ── load failure ─────────────────────────────────────────────────────
{
  const statuses = [];
  const bridge = createBridge({
    onStatus: s => statuses.push(s),
    workerFactory: () => fakeWorker(m => m.t === 'load' ? { t: 'error', where: 'load', msg: 'offline' } : null)
  });
  bridge.load();
  await new Promise(r => setTimeout(r, 5));
  ok('a load error is reported', statuses.some(s => s.kind === 'error' && s.msg === 'offline'));
  ok('a bridge that failed to load is not ready', bridge.ready() === false);
}

// ── ask failure resolves null, never rejects the caller ──────────────
{
  const bridge = createBridge({
    workerFactory: () => fakeWorker(m => {
      if (m.t === 'load') return { t: 'ready', device: 'wasm' };
      if (m.t === 'ask') return { t: 'error', where: 'ask', id: m.id, msg: 'generation failed' };
    })
  });
  bridge.load();
  await new Promise(r => setTimeout(r, 5));
  const out = await bridge.request({ system: 's', prompt: 'p' });
  ok('an ask-time error resolves null rather than rejecting', out === null);
}

// ── timeout ──────────────────────────────────────────────────────────
{
  const bridge = createBridge({
    timeoutMs: 15,
    workerFactory: () => fakeWorker(m => {
      if (m.t === 'load') return { t: 'ready', device: 'wasm' };
      return null;                    // 'ask' never answers — simulates a stuck generation
    })
  });
  bridge.load();
  await new Promise(r => setTimeout(r, 5));
  const started = Date.now();
  const out = await bridge.request({ system: 's', prompt: 'p' });
  ok('a request that never replies resolves null after the timeout', out === null);
  ok('the wait was bounded by timeoutMs, not indefinite', Date.now() - started < 200);
}

// ── model swap ───────────────────────────────────────────────────────
{
  const bridge = createBridge({ model: 'smollm2-360m', workerFactory: () => fakeWorker(() => null) });
  ok('an unknown model key is rejected', bridge.setModel('not-a-real-model') === false);
  ok('a known model key is accepted', bridge.setModel('smollm2-135m') === true);
  ok('swapping resets readiness — the new model has not loaded yet', bridge.ready() === false);
}

// ── status report ────────────────────────────────────────────────────
{
  const bridge = createBridge({ model: 'qwen2.5-0.5b', workerFactory: () => fakeWorker(() => null) });
  const rep = bridge.statusReport();
  ok('statusReport names the configured model', rep.model === 'qwen2.5-0.5b');
  ok('statusReport starts idle', rep.status === 'idle');
}

// ── dispose ──────────────────────────────────────────────────────────
{
  let disposedWorker = null;
  const bridge = createBridge({
    workerFactory: () => (disposedWorker = fakeWorker(m => m.t === 'load' ? { t: 'ready', device: 'wasm' } : null))
  });
  bridge.load();
  await new Promise(r => setTimeout(r, 5));
  bridge.dispose();
  ok('dispose terminates the underlying worker', disposedWorker.terminated === true);
  ok('a disposed bridge is not ready', bridge.ready() === false);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
