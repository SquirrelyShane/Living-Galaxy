// Living Galaxy — keep a bad frame from being a dead game.
//
// One throw inside the frame loop used to take the whole loop down with it: no render,
// no input, a black canopy and a console trace nobody on a phone will ever read. Frame
// phases now run inside a guard. A phase that throws is skipped for that frame; a phase
// that keeps throwing gets parked so the log cannot fill with the same stack 60 times a
// second, and the pilot is told once, in plain language.
//
// Every fault is also written to a physical log file when the runtime can do that
// (Node tests, soak runs, headless). In the browser the same text is kept in memory and
// can be downloaded as `living-galaxy-faults.log` from the diagnostics panel or via
// `LG.downloadLog()`.

import { DIAG } from './config.js';
import { VERSION } from './version.js';

const log = [];
const failures = new Map();
const parked = new Set();
let onFault = null;

// ── physical file sink (Node only) ───────────────────────────────────
const FILE_NAME = 'living-galaxy-faults.log';
let filePath = null;
let fsMod = null;
let pathMod = null;
let sinkReady = false;
let sinkQueue = [];

function isNode() {
  return typeof process !== 'undefined' && !!(process.versions && process.versions.node);
}

/** Kick off async module loads once; buffer lines until the file is open. */
function ensureSink() {
  if (sinkReady || !isNode()) return;
  sinkReady = true;
  Promise.all([import('node:fs'), import('node:path'), import('node:url')])
    .then(([fs, path, url]) => {
      fsMod = fs;
      pathMod = path;
      const here = path.dirname(url.fileURLToPath(import.meta.url));
      // src/core → project root → logs/
      const dir = path.resolve(here, '..', '..', 'logs');
      try { fs.mkdirSync(dir, { recursive: true }); } catch (_) { /* exists */ }
      filePath = path.join(dir, FILE_NAME);
      fs.writeFileSync(filePath,
        `# Living Galaxy fault log · v${VERSION}\n# started ${new Date().toISOString()}\n\n`,
        'utf8');
      const queued = sinkQueue.splice(0);
      for (const line of queued) {
        try { fs.appendFileSync(filePath, line + '\n', 'utf8'); } catch (_) {}
      }
    })
    .catch(() => { filePath = null; });
}

function writeToFile(entry) {
  if (!isNode()) return;
  ensureSink();
  const stamp = new Date().toISOString();
  const line = `[${stamp}] [${entry.where}] ${entry.message}` +
    (entry.stack ? `\n  ${String(entry.stack).replace(/\n/g, '\n  ')}` : '');
  if (fsMod && filePath) {
    try { fsMod.appendFileSync(filePath, line + '\n', 'utf8'); } catch (_) {}
  } else {
    sinkQueue.push(line);
  }
}

/** Hook a UI reaction (toast) without diagnostics importing the UI. */
export function setFaultHandler(fn) { onFault = fn; }

export function record(where, err) {
  const entry = {
    t: Math.round((typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now())),
    where,
    message: err && err.message ? err.message : String(err),
    stack: err && err.stack ? String(err.stack).split('\n').slice(0, 6).join('\n') : null
  };
  log.push(entry);
  if (log.length > DIAG.maxLog) log.shift();
  writeToFile(entry);
  return entry;
}

/**
 * Run `fn` and swallow anything it throws.
 * @returns {boolean} true if the phase ran clean.
 */
export function guard(where, fn, arg) {
  if (!DIAG.guard) { fn(arg); return true; }
  if (parked.has(where)) return false;
  try {
    fn(arg);
    return true;
  } catch (err) {
    const n = (failures.get(where) || 0) + 1;
    failures.set(where, n);
    const entry = record(where, err);
    if (n === 1 && onFault) onFault(`${where} fault — system offline this frame`);
    if (n >= DIAG.maxRepeats) {
      parked.add(where);
      if (onFault) onFault(`${where} parked after repeated faults — see LG.diagnostics()`);
      writeToFile({
        where,
        message: `PARKED after ${n} repeats — phase will not run again until unpark()`,
        stack: null
      });
    }
    if (typeof console !== 'undefined') console.error(`[LG ${where}]`, entry.message);
    return false;
  }
}

/** Bring a parked phase back — for the console, after a hot fix or a state repair. */
export function unpark(where) {
  if (where) { parked.delete(where); failures.delete(where); }
  else { parked.clear(); failures.clear(); }
}

/** Snapshot for the console and for bug reports. */
export function diagnostics() {
  return {
    version: VERSION,
    parked: [...parked],
    failures: Object.fromEntries(failures),
    log: log.slice(),
    logFile: filePath
  };
}

export const isParked = where => parked.has(where);
export const faultCount = () => log.length;

/**
 * Render the in-memory fault log as plain text suitable for a bug report or a download.
 */
export function formatLog() {
  const lines = [
    `# Living Galaxy fault log · v${VERSION}`,
    `# exported ${new Date().toISOString()}`,
    `# parked: ${[...parked].join(', ') || '(none)'}`,
    `# failures: ${JSON.stringify(Object.fromEntries(failures))}`,
    ''
  ];
  for (const e of log) {
    lines.push(`[${e.t}] [${e.where}] ${e.message}`);
    if (e.stack) lines.push('  ' + e.stack.replace(/\n/g, '\n  '));
  }
  if (!log.length) lines.push('(no faults recorded)');
  return lines.join('\n');
}

/**
 * Trigger a browser download of the fault log as a `.log` file.
 * No-ops under Node (the physical file is already being written to logs/).
 */
export function downloadLog() {
  if (typeof document === 'undefined') return false;
  const text = formatLog();
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = FILE_NAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
  return true;
}

/** Path of the on-disk log when running under Node, else null. */
export function logFilePath() {
  ensureSink();
  return filePath;
}

/** Last-resort net for anything outside the frame loop (event handlers, workers). */
export function installGlobalHandlers(scope) {
  if (!scope || !scope.addEventListener) return;
  scope.addEventListener('error', e => record('window', e.error || e.message || e));
  scope.addEventListener('unhandledrejection', e => record('promise', e.reason || e));
}
