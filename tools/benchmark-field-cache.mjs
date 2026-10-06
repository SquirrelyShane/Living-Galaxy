import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
const root = path.resolve(process.argv[2] ?? '.');
const steps = Number(process.argv[3] ?? 2000);
if (!Number.isInteger(steps) || steps < 1 || !globalThis.gc) throw new Error('Usage: node --expose-gc tools/benchmark-field-cache.mjs REPO_ROOT [STEPS]');
register(pathToFileURL(path.join(root, 'host/three-loader.mjs')));
const field = await import(pathToFileURL(path.join(root, 'js/world/field.js')));
const { currentSystem } = await import(pathToFileURL(path.join(root, 'js/world/bodies.js')));
const belt = currentSystem.belt ?? currentSystem.outerBelt;
if (!belt) throw new Error('Benchmark needs a system with a belt');
const radius = (belt.inner + belt.outer) / 2;
field.resetField();
globalThis.gc();
const before = process.memoryUsage().heapUsed, start = performance.now();
for (let i = 0; i < steps; i++) {
  const a = i / steps * Math.PI * 2;
  field.nearbyRocks({ x: Math.cos(a) * radius, y: 0, z: Math.sin(a) * radius }, 100 + i, 1);
}
const elapsed = performance.now() - start;
globalThis.gc();
const retained = process.memoryUsage().heapUsed - before;
const cache = field.fieldCacheStats?.() ?? null;
field.resetField();
globalThis.gc();
console.log(JSON.stringify({ steps, elapsed_ms: elapsed, retained_heap_mb: retained / 1048576, reset_heap_mb: (process.memoryUsage().heapUsed - before) / 1048576, cache }));
