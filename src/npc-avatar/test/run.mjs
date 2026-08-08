// Run every suite in order, in its own process, and report once.
// `node test/run.mjs` — add `--quiet` for headline-only output.
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const HERE = dirname(fileURLToPath(import.meta.url));
const quiet = process.argv.includes('--quiet');

const SUITES = [
  ['traits',   'personality axes, archetypes, jitter, drift'],
  ['memory',   'decay, reinforcement, bounded recall, persistence'],
  ['grammar',  'symbol expansion, weighting, when-gating, failure modes'],
  ['persona',  'traits + memory + grammar bound into one character'],
  ['router',   'the always-correct baseline and the budgeted LLM upgrade'],
  ['bridge',   'the worker-facing half of the LLM tier, with an injected fake worker'],
  ['models',   'the small-model registry'],
  ['pipeline', 'the whole thing composed together, end to end']
];

function run(name) {
  return new Promise(resolve => {
    const started = Date.now();
    const child = spawn(process.execPath, [join(HERE, name + '.test.mjs')], {
      stdio: quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit'
    });
    let out = '';
    if (quiet) {
      child.stdout.on('data', d => out += d);
      child.stderr.on('data', d => out += d);
    }
    child.on('close', code => {
      const ms = Date.now() - started;
      const m = out.match(/(\d+) passed, (\d+) failed/);
      resolve({ name, code, ms, summary: m ? `${m[1]} passed, ${m[2]} failed` : '', out });
    });
  });
}

let failedAny = false;
for (const [name, desc] of SUITES) {
  const r = await run(name);
  if (r.code !== 0) failedAny = true;
  if (quiet) {
    console.log(`${r.code === 0 ? ' ok  ' : 'FAIL '} ${name.padEnd(10)} ${String(r.ms).padStart(5)}ms  ${r.summary || desc}`);
    if (r.code !== 0) console.log(r.out.split('\n').filter(l => l.includes('FAIL')).map(l => '   ' + l).join('\n'));
  }
}
console.log(failedAny ? '\nsome suites failed\n' : '\nall suites green\n');
process.exit(failedAny ? 1 : 0);
