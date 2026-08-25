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
  ['architecture','the layer contract — dependency direction, ports, cycles and shape'],
  ['static',   'import resolution, exports, element ids, asset paths'],
  ['core',     'version, rng streams, clock, fault guards, save schema'],
  ['flight',   'flight model, assist authority, course planner geometry'],
  ['combat',   'damage types, broadphase agreement, seekers, point defence'],
  ['world',    'reputation matrix, detection, population pressure, persistence'],
  ['character','lineage/corp/career creation, two progression tracks, licences, agents'],
  ['dossier',  'individuals — nine powers, derived corp wars, zero standing, the career ladder'],
  ['desks',    'a station posts for a named power; tiers, gates, and the loop from work to rung'],
  ['boardroom','contracting as a company — every desk on one screen, a hull on every job'],
  ['crew',     'speciality vs post, watches, morale, casualties, recruiting'],
  ['economy',  'contract board, fitting budgets, station supply chains'],
  ['industry', 'blueprints, bills of materials, manufacturing, planetary sites'],
  ['interface','hud write budget, bindings, gamepad, display settings, fatigue'],
  ['render',   'adaptive quality, interpolation, level of detail, audio mix'],
  ['particles','one pool, a real budget, and colour that means something'],
  ['fields',   'gravity wells you can see, and belts as bands beyond mesh range'],
  ['netsync',  'clock sync, snapshot buffer, delta encoding'],
  ['tools',    'ARIA instruments against live game state'],
  ['contacts', 'one sensor picture for chart, list and canopy — and the hull ARIA can fly'],
  ['ownership','whose hull is that, how far the array reaches, and who can shoot whom'],
  ['autopilot','ARIA at the stick — the needs model, the pad checklist, and working beside a crew'],
  ['reasoner', 'the fact table, the decision tree, the advisory, arrays and the farm'],
  ['crew-talk','the ship talking to itself — the corpus, who speaks, and when nobody should'],
  ['parley',   'opening a channel, how close a jump stops, and what the ship is for'],
  ['boot',     'durable storage, the pregenerated archive, and pilots that outlive a flight'],
  ['audio',    'the drive, the generative bed, and dialogue that arrives at a speed'],
  ['preflight','interlocks, training, comms, companies, automated managers'],
  ['avatar',   'NPC personas, memory-driven dialogue, the language-model tier'],
  ['layout',   'HUD geometry — nothing hides behind the bottom dock'],
  ['genesis',  'procedural systems — determinism, playability guarantees, and that a plan builds'],
  ['galaxy',   'the galaxy as an index over genesis — one integer, fifty thousand systems'],
  ['chart',    'the galactic chart, and jumping — a refusal with a number, an arrival that is whole'],
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
  ['command',   'the executive command tree, the shared resolver, the NPC knowledge base'],
  ['executive', 'late incorporation, contracted hulls, the self-training loop'],
  ['execdeck',  'the command surface — flight lock, the deck, the chart return path, telemetry'],
  ['lanes',     'contracted hulls arrive, undock, open routes; passive is not a countdown'],
  ['pilotage',  'company hulls route around gravity wells; a well collapses the bubble'],
  ['jobs',      'every sellable hull has work — the coverage matrix, and every job has a body'],
  ['works',     'refit, commissioning, extraction that pays the company'],
  ['comms-work','generated NPC dialogue, and work for the other five order types'],
  ['corpo',     'belt assignment, the pay cycle, the fleet alarm, lock range'],
  ['hangar',    'the extraction flight cycle, parked hulls, ship ownership'],
  ['haul',      'haul consignments — loading, selling, delivery, failure; tool-button labels'],
  ['camera',    'chase camera framing — standoff, aim, the pitch limit'],
  ['screens',   'static screens drawn as text — labels, widths, what the panels say'],
  ['grammar',   'NPC speech — typed slots, frame selection and the sentence sweep'],
  ['missions',  'the mission board — landmarks, graveyards, salvage and the template gate'],
  ['worldgen',  'the world catalogue, classify-by-condition, real units and deep time'],
  ['shipforge', 'procedural hulls — proportion, determinism, scaling and the career seam'],
  ['reachability','every player-facing verb has a door — see docs/REACHABILITY_AUDIT.md'],
  ['run',      'simulation: flight, combat, mining, trade, warp, save'],
  ['warp-nav', 'autopilot navigation geometries'],
  ['ui',       'panels and controls through simulated pointer events'],
  ['vault',    'the encrypted store — seal/unseal, tamper rejection, tickets, rooms, motion'],
  ['net',      'galaxy server protocol — rooms, host per system, resume, with real clients'],
  ['galaxy-server', 'the durable galaxy — accounts, the wallet, world deltas across restarts'],
  ['beacon',   'galaxy.local — the mDNS responder, packet maths and a live answer'],
  ['certs',    'self-issued TLS — DER generator, real handshake, half-state healing'],
  ['portal',   'the web suite — routes, gzip/cache, accounts over http, forum, admin gate'],
  ['soak',     'two hours of game time — leaks, drift, bounded lists']
];

const wanted = only ? only.slice(7).split(',') : SUITES.map(s => s[0]);

// Some suites take flags when run under the aggregate. `screens` draws coloured panels
// for a phone terminal; that is the point of running it alone, and noise inside a 33-suite
// log. It still asserts either way.
const SUITE_ARGS = { screens: ['--plain', '--quiet'] };

function run(name) {
  return new Promise(resolve => {
    const started = Date.now();
    const child = spawn(process.execPath, [join(HERE, name + '.mjs'), ...(SUITE_ARGS[name] || [])], {
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
