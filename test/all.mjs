// Run every suite in order, in its own process, and report once.
// `node test/all.mjs` is the gate a patch has to pass before it ships.
// Add `--quiet` for CI-style output (headline lines only).

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const HERE = dirname(fileURLToPath(import.meta.url));
const quiet = process.argv.includes('--quiet');
const only = process.argv.find(a => a.startsWith('--only='));

const SUITES = [
  ['static',   'import resolution, exports, element ids, asset paths'],
  ['core',     'version, rng streams, clock, fault guards, save schema'],
  ['flight',   'flight model, assist authority, course planner geometry'],
  ['combat',   'damage types, broadphase agreement, seekers, point defence'],
  ['world',    'reputation matrix, detection, population pressure, persistence'],
  ['character','lineage/corp/career creation, two progression tracks, licences, agents'],
  ['crew',     'speciality vs post, watches, morale, casualties, recruiting'],
  ['economy',  'contract board, fitting budgets, station supply chains'],
  ['industry', 'blueprints, bills of materials, manufacturing, planetary sites'],
  ['interface','hud write budget, bindings, gamepad, display settings, fatigue'],
  ['render',   'adaptive quality, interpolation, level of detail, audio mix'],
  ['netsync',  'clock sync, snapshot buffer, delta encoding'],
  ['tools',    'ARIA instruments against live game state'],
  ['preflight','interlocks, training, comms, companies, automated managers'],
  ['avatar',   'NPC personas, memory-driven dialogue, the language-model tier'],
  ['layout',   'HUD geometry — nothing hides behind the bottom dock'],
  ['celestial','moon classes, surface features, atmospheric interference, ephemeris'],
  ['ordnance', 'ammunition feeds, magazines, armour penetration, thermal load, weapon groups'],
  ['npc-tactics','NPC magazines, heat, nerve, calls for help, and memory that decides'],
  ['npc-comms', 'NPC-to-NPC exchanges, relationships, gossip, overhearing'],
  ['deals',     'the ledger — obligations, reliability, settlement and default'],
  ['crew-log',  'the flight log, crew telemetry, trends, diagnosis and ARIA readouts'],
  ['welfare',   'shore leave, quarters, galley, infirmary and training'],
  ['research',  'findings, projects, permanent effects and the blueprint gate'],
  ['cargo',     'real holds — spills, interception, short deliveries, manifests'],
  ['wear',      'module condition — per-event accrual, degraded output, servicing'],
  ['reachability','every player-facing verb has a door — see docs/REACHABILITY_AUDIT.md'],
  ['run',      'simulation: flight, combat, mining, trade, warp, save'],
  ['warp-nav', 'autopilot navigation geometries'],
  ['ui',       'panels and controls through simulated pointer events'],
  ['net',      'relay server, host authority, resume, with real WebSocket clients'],
  ['soak',     'two hours of game time — leaks, drift, bounded lists']
];

const wanted = only ? only.slice(7).split(',') : SUITES.map(s => s[0]);

function run(name) {
  return new Promise(resolve => {
    const started = Date.now();
    const child = spawn(process.execPath, [join(HERE, name + '.mjs')], {
      stdio: quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit'
    });
    let out = '';
    if (quiet) {
      child.stdout.on('data', d => { out += d; });
      child.stderr.on('data', d => { out += d; });
    }
    child.on('close', code => {
      const ms = Date.now() - started;
      if (quiet) {
        const tail = out.trim().split('\n').filter(l => /passed|problem|FAIL/.test(l)).slice(-2).join(' · ');
        console.log(`${code ? 'FAIL' : ' ok '}  ${name.padEnd(9)} ${String(ms + 'ms').padStart(7)}  ${tail}`);
      }
      resolve({ name, code, ms });
    });
    child.on('error', () => resolve({ name, code: 1, ms: Date.now() - started }));
  });
}

const results = [];
for (const [name, blurb] of SUITES) {
  if (!wanted.includes(name)) continue;
  if (!quiet) console.log(`\n══ ${name} — ${blurb} ══`);
  results.push(await run(name));
}

const failed = results.filter(r => r.code);
const total = results.reduce((s, r) => s + r.ms, 0);
console.log(`\n${results.length - failed.length}/${results.length} suites green in ${(total / 1000).toFixed(1)}s`);
if (failed.length) console.log('failed: ' + failed.map(f => f.name).join(', '));
process.exit(failed.length ? 1 : 0);
