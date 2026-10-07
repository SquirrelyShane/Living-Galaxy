const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, Number(n) || 0));
const freshCalib = () => ({ n: 0, hit: 0.5, brier: 0.25, secs: 0, cr: 0, bins: [0, 0, 0, 0].map(() => ({ n: 0, ok: 0 })) });
const fresh = () => ({ v: 2, identity: null, prefs: { port: {}, ore: {}, plan: {}, lane: {}, job: {} }, experience: { moves: {}, runs: 0, sky: null }, contexts: [], episodes: [], risk: { combat: 0.2, financial: 0.3, damage: 0.2 }, orders: { reserve: 15000, maxPurchase: 25000, repairBelow: 0.55, avoidHostiles: true, mode: 'balanced', steward: 0.25 }, authority: { navigation: true, combat: true, trading: true, repairs: true, refit: true, build: true, fabricate: true, hiring: true, dismissal: true, founding: true, treasury: true, settlement: true }, goals: [], decision: null, pending: [], learned: 0, calib: freshCalib(), forecast: null, shift: null, scene: null, wake: null });
export const WORKING_FLOOR = 800;
const INVESTMENT = new Set(['refit', 'founding', 'settlement']);
const UNCAPPED = new Set(['repairs', 'treasury']);
const DOMAIN = { mine: 'navigation', salvage: 'navigation', survey: 'navigation', sell: 'trading', route: 'trading', supply: 'trading', repair: 'repairs', yard: 'repairs' };
export const BREAK = { lowCharge: 0.25, lift: 0.2, top: 0.95, threatAt: 0.5, threatLift: 0.15 };
export const breakLine = (charge = 1, threat = 0) => Math.min(BREAK.top, ariaMind.orders.repairBelow
  + ((Number(charge) || 0) < BREAK.lowCharge ? BREAK.lift : 0)
  + clamp((clamp(threat) - BREAK.threatAt) / (1 - BREAK.threatAt)) * BREAK.threatLift);
export const domainOf = (action) => DOMAIN[action] ?? (String(action).startsWith('board:') || String(action).startsWith('chain:') ? 'navigation' : action);
export const reserveFor = (domain) => (UNCAPPED.has(domain) ? 0 : INVESTMENT.has(domain) ? ariaMind.orders.reserve : WORKING_FLOOR);
export const spendCap = (credits, action = 'trading') => { const d = domainOf(action); return Math.max(0, Math.min(UNCAPPED.has(d) ? Infinity : ariaMind.orders.maxPurchase, (Number(credits) || 0) - reserveFor(d))); };
export const ariaMind = fresh();
let resolver = () => null;
let extras = () => null;
export function bindPeopleLookup(fn) { resolver = fn; }
export function bindPacketExtras(fn) { extras = typeof fn === 'function' ? fn : () => null; }
export function resetMind(identity = null) { const prefs = ariaMind.prefs; const next = fresh(); Object.assign(prefs, next.prefs); Object.assign(ariaMind, next, { identity, prefs }); }
export function mindKey(sky, captain) { return `lgaa.aria.mind.v1:${sky}:${captain}`; }
export function saveMind(key) { try { globalThis.localStorage?.setItem(key, JSON.stringify(ariaMind)); return true; } catch { return false; } }
export function loadMind(key) {
  resetMind(key);
  try {
    const raw = JSON.parse(globalThis.localStorage?.getItem(key) ?? 'null');
    if (!raw || (raw.v !== 1 && raw.v !== 2)) return false;
    for (const k of ['prefs', 'experience', 'risk']) if (raw[k] && typeof raw[k] === 'object') Object.assign(ariaMind[k], raw[k]);
    setOrders(raw.orders ?? {});
    if (raw.v === 2) for (const k of Object.keys(ariaMind.authority)) if (typeof raw.authority?.[k] === 'boolean') ariaMind.authority[k] = raw.authority[k];
    ariaMind.contexts = Array.isArray(raw.contexts) ? migrateContexts(raw.contexts).slice(-CONTEXT_CAP) : [];
    ariaMind.episodes = Array.isArray(raw.episodes) ? raw.episodes.slice(-96) : [];
    ariaMind.learned = Math.max(0, Number(raw.learned) || 0);
    if (raw.calib && Array.isArray(raw.calib.bins) && raw.calib.bins.length === 4) ariaMind.calib = { ...freshCalib(), ...raw.calib, bins: raw.calib.bins.map(b => ({ n: Math.max(0, Number(b?.n) || 0), ok: Math.max(0, Number(b?.ok) || 0) })) };
    if (raw.wake && typeof raw.wake === 'object') ariaMind.wake = raw.wake;
    return true;
  } catch { return false; }
}
export function setOrders(patch) {
  const o = ariaMind.orders;
  for (const k of ['reserve', 'maxPurchase']) if (Number.isFinite(patch[k])) o[k] = clamp(patch[k], 0, 1e9);
  if (Number.isFinite(patch.repairBelow)) o.repairBelow = clamp(patch.repairBelow, 0.1, 0.95);
  if (Number.isFinite(patch.steward)) o.steward = clamp(patch.steward, 0, 1);
  if (typeof patch.avoidHostiles === 'boolean') o.avoidHostiles = patch.avoidHostiles;
  if (['imitate', 'optimize', 'balanced', 'directive'].includes(patch.mode)) o.mode = patch.mode;
}
export function remember({ at = 0, kind = 'event', summary = '', actors = [], place = null, importance = 0.5, consequences = {} }) {
  ariaMind.episodes.push({ at, kind, summary: String(summary).slice(0, 240), actors: actors.filter(x => typeof x === 'string').slice(0, 8), place, importance: clamp(importance), consequences });
  if (ariaMind.episodes.length > 96) ariaMind.episodes.splice(0, ariaMind.episodes.length - 96);
}
export function personMemory(id) { return { person: resolver(id), episodes: ariaMind.episodes.filter(e => e.actors.includes(id)) }; }

export const VERBS = ['mine', 'sell', 'survey', 'salvage', 'trade', 'repair', 'fabricate', 'refit', 'build', 'fight'];
const OP_VERB = { MINE: 'mine', SELL: 'sell', SMELT: 'sell', STASH: 'sell', SURVEY: 'survey', SALVAGE: 'salvage', BUY: 'trade', DELIVER: 'trade', FAB: 'fabricate', REPAIR: 'repair', REFIT: 'refit', BUILD: 'build' };
const OP_SKIP = new Set(['GOTO', 'HOLD', 'DOCK', 'UNDOCK', 'SET', 'WAIT', 'END']);
const ORDER_VERB = { cutter: 'mine', rig: 'salvage' };
const KEY_VERB = { mine: 'mine', sell: 'sell', survey: 'survey', salvage: 'salvage', route: 'trade', supply: 'trade', trade: 'trade', yard: 'repair', repair: 'repair', refit: 'refit', build: 'build', fabricate: 'fabricate', fight: 'fight' };
const CAT_VERB = { mining: 'mine', salvage: 'salvage', trade: 'trade', logistics: 'trade', energy: 'trade', civic: 'trade', science: 'survey', security: 'fight', industry: 'fabricate' };
const TAP_VERB = [[/\bsalvag|\brig\b|hulk/, 'salvage'], [/\bmin(e|ing)\b|cutter|\bseam/, 'mine'], [/survey|\bscan\b/, 'survey'], [/\bsell|smelt|stash/, 'sell'], [/\bbuy\b|trade|\broute/, 'trade'], [/repair|\byard\b/, 'repair'], [/fabric|\bworks\b/, 'fabricate'], [/refit|upgrade/, 'refit'], [/\bbuild/, 'build']];
export function verbOf(action, kind = null, arg = null) {
  const a = String(action ?? '');
  if (!a) return null;
  if (kind === 'mission') return OP_SKIP.has(a.toUpperCase()) ? null : OP_VERB[a.toUpperCase()] ?? a.toLowerCase();
  if (kind === 'order') return String(arg ?? '').toLowerCase() === 'off' ? null : ORDER_VERB[a.toLowerCase()] ?? null;
  if (kind === 'tap') { const text = `${a} ${arg ?? ''}`.toLowerCase(); for (const [re, v] of TAP_VERB) if (re.test(text)) return v; return null; }
  const low = a.toLowerCase();
  if (KEY_VERB[low]) return KEY_VERB[low];
  if (low.startsWith('board:') || low.startsWith('chain:')) return CAT_VERB[low.split(':')[1]] ?? 'trade';
  return OP_VERB[a.toUpperCase()] ?? low;
}

export const CONTEXT_CAP = 256;
export function migrateContexts(list) {
  const out = [];
  for (const c of list) {
    if (!c || typeof c.action !== 'string' || typeof c.key !== 'string' || !(c.n > 0)) continue;
    const parts = c.key.split(':');
    if (parts.length < 3) { out.push(c); continue; }
    const verb = parts[1] === 'order' ? null : verbOf(parts.slice(2).join(':'), parts[1]);
    if (!verb) continue;
    const key = `${parts[0]}:${verb}`;
    const m = out.find(x => x.key === key && x.bucket === c.bucket);
    if (m) { m.n += c.n; m.cr += Number(c.cr) || 0; m.hull += Number(c.hull) || 0; m.dt += Number(c.dt) || 0; m.last = Math.max(m.last ?? 0, c.last ?? 0); }
    else out.push({ key, bucket: c.bucket, action: verb, by: c.by ?? parts[0], n: c.n, cr: Number(c.cr) || 0, hull: Number(c.hull) || 0, dt: Number(c.dt) || 0, last: c.last ?? 0 });
  }
  return out;
}
export const FADE = { contexts: 14400, outcomes: 7200, after: 60 };
const KERNEL = { hull: 1.4, hold: 1.4, hz: 0.8, dk: 1.0, chg: 0.5, width: 0.32 };
const fade = (dt, half) => (dt >= FADE.after ? Math.pow(0.5, dt / half) : 1);
const cellOf = (s) => `${Math.floor(clamp(s.hull) * 4)}:${Math.floor(clamp(s.hold) * 4)}:${s.hz > 0 ? 1 : 0}:${s.dk ? 1 : 0}`;
const pointOf = (s) => ({ hull: clamp(s.hull), hold: clamp(s.hold), hz: s.hz > 0 ? 1 : 0, dk: s.dk ? 1 : 0, chg: s.chg == null ? null : clamp(s.chg) });
function centreOf(c) {
  if (c.f) return c.f;
  const [h, k, z, d] = String(c.bucket ?? '').split(':').map(Number);
  return { hull: Math.min(1, ((h || 0) + 0.5) / 4), hold: Math.min(1, ((k || 0) + 0.5) / 4), hz: z ? 1 : 0, dk: d ? 1 : 0, chg: null };
}
function nearness(a, b) {
  let d2 = 0;
  for (const k of ['hull', 'hold', 'hz', 'dk', 'chg']) { if (a[k] == null || b[k] == null) continue; const d = a[k] - b[k]; d2 += KERNEL[k] * d * d; }
  return Math.exp(-d2 / (2 * KERNEL.width * KERNEL.width));
}
export function learnTape(r) {
  if (!r?.d || r.d.reset || r.d.partial || !r.s || !['player', 'aria'].includes(r.by)) return false;
  const at = Number(r.s.t) || 0;
  if (r.by === 'player') {
    ariaMind.risk.combat += 0.02 * ((r.s.hz > 0 ? 1 : 0) - ariaMind.risk.combat);
    ariaMind.risk.damage += 0.02 * ((1 - clamp(r.s.hull)) - ariaMind.risk.damage);
    ariaMind.risk.financial += 0.02 * ((r.d.cr < 0 ? 1 : 0) - ariaMind.risk.financial);
  }
  ariaMind.learned++;
  const verb = verbOf(r.act, r.kind, r.arg);
  if (verb) {
    const key = `${r.by}:${verb}`;
    const bucket = cellOf(r.s);
    const p = pointOf(r.s);
    let c = ariaMind.contexts.find(c => c.key === key && c.bucket === bucket);
    if (!c) { c = { key, bucket, action: verb, by: r.by, n: 0, cr: 0, hull: 0, dt: 0, last: at, f: p }; ariaMind.contexts.push(c); }
    const keep = fade(at - (c.last ?? at), FADE.contexts);
    if (keep < 1) { c.n *= keep; c.cr *= keep; c.hull *= keep; c.dt *= keep; }
    c.n++; c.cr += Number(r.d.cr) || 0; c.hull += Number(r.d.hull) || 0; c.dt += Number(r.d.dt) || 0;
    c.f ??= centreOf(c);
    for (const k of ['hull', 'hold', 'hz', 'dk']) c.f[k] += (p[k] - c.f[k]) / c.n;
    if (p.chg != null) c.f.chg = c.f.chg == null ? p.chg : c.f.chg + (p.chg - c.f.chg) / c.n;
    c.last = Math.max(c.last ?? at, at);
    if (ariaMind.contexts.length > CONTEXT_CAP) {
      let worst = -1;
      for (let i = 0; i < ariaMind.contexts.length; i++) {
        const x = ariaMind.contexts[i];
        if (x === c) continue;
        if (worst < 0) { worst = i; continue; }
        const w = ariaMind.contexts[worst];
        if (x.n < w.n || (x.n === w.n && (x.last ?? 0) < (w.last ?? 0))) worst = i;
      }
      if (worst >= 0) ariaMind.contexts.splice(worst, 1);
    }
  }
  if (r.d.hull < -0.15 || Math.abs(r.d.cr) > 5000) remember({ at: r.s.t, kind: 'tape', summary: `${r.by}: ${r.act}; observed ${Math.round(r.d.cr)} cr, ${Math.round(r.d.hull * 100)}% hull`, importance: 0.8, consequences: r.d });
  if (ariaMind.identity && ariaMind.learned % 20 === 0) saveMind(ariaMind.identity);
  return true;
}
export function contextualScore(action, state) {
  if (!state) return { lean: 0, confidence: 0, samples: 0 };
  const verb = verbOf(action);
  const here = pointOf(state);
  let mass = 0, hits = 0, n = 0;
  for (const c of ariaMind.contexts) {
    if (c.by !== 'player') continue;
    const w = nearness(here, centreOf(c)) * c.n;
    if (w < 1e-4) continue;
    mass += w; n += c.n;
    if (verbOf(c.action) === verb) hits += w;
  }
  return { lean: mass ? hits / mass : 0, confidence: Math.min(0.95, mass / (mass + 12)), samples: Math.round(n), mass };
}
export function riskAversion() {
  return clamp(1 - 2 * ariaMind.risk.combat, 0.15, 1) * (ariaMind.orders.avoidHostiles ? 1 : 0.5);
}
export function authorize(action, { cost = 0, credits = Infinity, at = 0 } = {}) {
  if (!Number.isFinite(cost) || cost < 0 || Number.isNaN(credits)) return { ok: false, why: "invalid spending quote" };
  const domain = domainOf(action);
  const capped = !UNCAPPED.has(domain);
  const why = ariaMind.authority[domain] !== true ? `${domain} authority withheld`
    : capped && cost > ariaMind.orders.maxPurchase ? 'purchase exceeds captain limit'
    : capped && cost > 0 && credits - cost < reserveFor(domain) ? 'captain reserve protected' : null;
  if (why) { const id = `${domain}:${why}`; if (!ariaMind.pending.some(p => p.id === id)) ariaMind.pending.push({ id, domain, action, cost, why, at }); if (ariaMind.pending.length > 16) ariaMind.pending.shift(); }
  return { ok: !why, why };
}

const BIN_EDGES = [0.5, 0.65, 0.8];
const binOf = (p) => { const i = BIN_EDGES.findIndex(e => p < e); return i < 0 ? BIN_EDGES.length : i; };
export function calibrated(p) {
  const b = ariaMind.calib.bins[binOf(clamp(p))];
  return b.n >= 3 ? clamp((clamp(p) * 5 + b.ok) / (5 + b.n), 0.05, 0.95) : clamp(p, 0.05, 0.95);
}
export function forecast({ key, p = null, secs = null, cr = null, at = 0 } = {}) {
  ariaMind.forecast = { key, p: clamp(p ?? ariaMind.decision?.raw ?? 0.5), secs: Number.isFinite(secs) && secs > 0 ? secs : null, cr: Number.isFinite(cr) ? cr : null, at };
  return ariaMind.forecast;
}
export function settleForecast(key, secs, cr, ok) {
  const f = ariaMind.forecast;
  if (!f || f.key !== key) return null;
  ariaMind.forecast = null;
  const c = ariaMind.calib;
  const a = c.n < 10 ? 1 / (c.n + 1) : 0.1;
  const y = ok ? 1 : 0;
  c.n++;
  c.hit += a * (y - c.hit);
  c.brier += a * ((f.p - y) * (f.p - y) - c.brier);
  if (ok && f.secs && secs > 0) c.secs += a * (Math.log(secs / f.secs) - c.secs);
  if (ok && f.cr != null && Math.abs(f.cr) > 50 && cr > 0 && f.cr > 0) c.cr += a * (Math.log(cr / f.cr) - c.cr);
  const b = c.bins[binOf(f.p)];
  b.n++; b.ok += y;
  return { p: f.p, ok, secsRatio: f.secs && secs > 0 ? secs / f.secs : null, crRatio: f.cr > 0 && cr > 0 ? cr / f.cr : null };
}
export function calibReport() {
  const c = ariaMind.calib;
  const labels = ['under 50%', '50–65%', '65–80%', 'over 80%'];
  return { n: c.n, hit: c.hit, brier: c.brier, slower: Math.exp(c.secs), richer: Math.exp(c.cr), bins: c.bins.map((b, i) => ({ said: labels[i], n: b.n, came: b.n ? b.ok / b.n : null })) };
}

export function decideMind({ action, why = '', state = {}, steps = [], alternatives = [], at = 0 }) {
  const learned = contextualScore(action ?? '', state);
  const risk = clamp(Math.max((1 - clamp(state.hull ?? 1)) * 0.5 + (state.hz > 0 ? 0.5 : 0), state.th != null ? (1 - clamp(state.hull ?? 1)) * 0.5 + clamp(state.th) * 0.5 : 0));
  const m = ariaMind.experience.moves[action];
  const raw = Math.min(0.95, 0.35 + learned.confidence * 0.35 + (m ? m.runs / (m.runs + 8) * 0.25 : 0));
  ariaMind.goals = [{ level: 'primary', goal: 'Keep captain and vessel alive' }, { level: 'strategic', goal: 'Follow captain standing orders' }, { level: 'operational', goal: action ?? 'Hold position' }, { level: 'immediate', goal: steps[0] ?? 'Observe' }];
  ariaMind.decision = { action, why, at, risk, confidence: calibrated(raw), raw, samples: learned.samples, steps: steps.slice(0, 16), alternatives: alternatives.slice(0, 8) };
  return ariaMind.decision;
}
export function explanationPacket() {
  let more = null;
  try { more = extras(); } catch { more = null; }
  return JSON.parse(JSON.stringify({ v: 2, goals: ariaMind.goals, decision: ariaMind.decision, orders: ariaMind.orders, risk: ariaMind.risk, scene: ariaMind.scene, shift: ariaMind.shift, calibration: calibReport(), ...(more && typeof more === 'object' ? more : {}), memories: ariaMind.episodes.slice(-4), instruction: 'Explain or discuss this structured decision. Do not issue simulation commands.' }));
}

export function policyScore(action, base, state = {}, { ratio = false } = {}) {
  const context = contextualScore(action, state);
  const mode = ariaMind.orders.mode;
  const lean = context.lean * context.confidence;
  if (ratio) {
    if (mode === 'imitate') return base * (1 + lean);
    if (mode === 'balanced') return base * (1 + lean * 0.35);
    return base;
  }
  const m = ariaMind.experience.moves[action];
  const outcome = m?.secs >= 30 ? clamp(m.cr / Math.max(1, m.secs) / 100, -0.3, 0.3) : 0;
  if (mode === 'imitate') return base + lean;
  if (mode === 'optimize') return base + outcome;
  if (mode === 'directive') return base;
  return base + lean * 0.35 + outcome;
}

export function learnOutcome(action, secs, cr, ok, at = 0) {
  const m = ariaMind.experience.moves[action] ??= { runs: 0, secs: 0, cr: 0, fails: 0 };
  m.w ??= m.runs; m.wf ??= m.fails;
  const keep = fade((Number(at) || 0) - (m.at ?? at), FADE.outcomes);
  if (keep < 1) { m.secs *= keep; m.cr *= keep; m.w *= keep; m.wf *= keep; }
  m.runs++; m.w++; m.secs += Math.max(0, Number(secs) || 0); m.cr += Number(cr) || 0;
  if (!ok) { m.fails++; m.wf++; }
  m.at = Math.max(m.at ?? 0, Number(at) || 0);
  ariaMind.experience.runs++;
  remember({ at, kind: 'job', summary: `${action}: ${ok ? 'completed' : 'failed'}, ${Math.round(cr)} cr in ${Math.round(secs)}s`, consequences: { cr, secs, ok } });
}
export function discount(match, keep = 0.5, why = '', at = 0) {
  let n = 0;
  for (const [key, m] of Object.entries(ariaMind.experience.moves)) {
    if (!match(key)) continue;
    m.w ??= m.runs; m.wf ??= m.fails;
    m.secs *= keep; m.cr *= keep; m.w *= keep; m.wf *= keep;
    n++;
  }
  ariaMind.shift = { at, why: String(why).slice(0, 160), moves: n };
  return n;
}
