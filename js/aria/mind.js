const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, Number(n) || 0));
const fresh = () => ({ v: 2, identity: null, prefs: { port: {}, ore: {}, plan: {}, lane: {}, job: {} }, experience: { moves: {}, runs: 0, sky: null }, contexts: [], episodes: [], risk: { combat: 0.2, financial: 0.3, damage: 0.2 }, orders: { reserve: 15000, maxPurchase: 25000, repairBelow: 0.55, avoidHostiles: true, mode: 'balanced' }, authority: { navigation: true, combat: true, trading: true, repairs: true, refit: true, build: true, fabricate: true, hiring: true, dismissal: true, founding: true, treasury: true, settlement: true }, goals: [], decision: null, pending: [], learned: 0 });
export const WORKING_FLOOR = 800;
const INVESTMENT = new Set(['refit', 'founding', 'settlement']);
const UNCAPPED = new Set(['repairs', 'treasury']);
const DOMAIN = { mine: 'navigation', salvage: 'navigation', survey: 'navigation', sell: 'trading', route: 'trading', supply: 'trading', repair: 'repairs', yard: 'repairs' };
export const BREAK = { lowCharge: 0.25, lift: 0.2, top: 0.95 };
export const breakLine = (charge = 1) => Math.min(BREAK.top, ariaMind.orders.repairBelow + ((Number(charge) || 0) < BREAK.lowCharge ? BREAK.lift : 0));
export const domainOf = (action) => DOMAIN[action] ?? (String(action).startsWith('board:') || String(action).startsWith('chain:') ? 'navigation' : action);
export const reserveFor = (domain) => (UNCAPPED.has(domain) ? 0 : INVESTMENT.has(domain) ? ariaMind.orders.reserve : WORKING_FLOOR);
export const spendCap = (credits, action = 'trading') => { const d = domainOf(action); return Math.max(0, Math.min(UNCAPPED.has(d) ? Infinity : ariaMind.orders.maxPurchase, (Number(credits) || 0) - reserveFor(d))); };
export const ariaMind = fresh();
let resolver = () => null;
export function bindPeopleLookup(fn) { resolver = fn; }
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
    ariaMind.contexts = Array.isArray(raw.contexts) ? raw.contexts.slice(-256) : [];
    ariaMind.episodes = Array.isArray(raw.episodes) ? raw.episodes.slice(-96) : [];
    ariaMind.learned = Math.max(0, Number(raw.learned) || 0);
    return true;
  } catch { return false; }
}
export function setOrders(patch) {
  const o = ariaMind.orders;
  for (const k of ['reserve', 'maxPurchase']) if (Number.isFinite(patch[k])) o[k] = clamp(patch[k], 0, 1e9);
  if (Number.isFinite(patch.repairBelow)) o.repairBelow = clamp(patch.repairBelow, 0.1, 0.95);
  if (typeof patch.avoidHostiles === 'boolean') o.avoidHostiles = patch.avoidHostiles;
  if (['imitate', 'optimize', 'balanced', 'directive'].includes(patch.mode)) o.mode = patch.mode;
}
export function remember({ at = 0, kind = 'event', summary = '', actors = [], place = null, importance = 0.5, consequences = {} }) {
  ariaMind.episodes.push({ at, kind, summary: String(summary).slice(0, 240), actors: actors.filter(x => typeof x === 'string').slice(0, 8), place, importance: clamp(importance), consequences });
  if (ariaMind.episodes.length > 96) ariaMind.episodes.splice(0, ariaMind.episodes.length - 96);
}
export function personMemory(id) { return { person: resolver(id), episodes: ariaMind.episodes.filter(e => e.actors.includes(id)) }; }
export function learnTape(r) {
  if (!r?.d || r.d.reset || r.d.partial || !r.s || !['player', 'aria'].includes(r.by)) return false;
  const key = `${r.by}:${r.kind}:${r.act}`;
  const bucket = `${Math.floor(clamp(r.s.hull) * 4)}:${Math.floor(clamp(r.s.hold) * 4)}:${r.s.hz > 0 ? 1 : 0}:${r.s.dk ? 1 : 0}`;
  let c = ariaMind.contexts.find(c => c.key === key && c.bucket === bucket);
  if (!c) { c = { key, bucket, action: r.act, by: r.by, n: 0, cr: 0, hull: 0, dt: 0 }; ariaMind.contexts.push(c); }
  c.n++; c.cr += Number(r.d.cr) || 0; c.hull += Number(r.d.hull) || 0; c.dt += Number(r.d.dt) || 0;
  if (ariaMind.contexts.length > 256) ariaMind.contexts.shift();
  ariaMind.learned++;
  if (r.by === 'player') {
    ariaMind.risk.combat += 0.02 * ((r.s.hz > 0 ? 1 : 0) - ariaMind.risk.combat);
    ariaMind.risk.damage += 0.02 * ((1 - clamp(r.s.hull)) - ariaMind.risk.damage);
    ariaMind.risk.financial += 0.02 * ((r.d.cr < 0 ? 1 : 0) - ariaMind.risk.financial);
  }
  if (r.d.hull < -0.15 || Math.abs(r.d.cr) > 5000) remember({ at: r.s.t, kind: 'tape', summary: `${r.by}: ${r.act}; observed ${Math.round(r.d.cr)} cr, ${Math.round(r.d.hull * 100)}% hull`, importance: 0.8, consequences: r.d });
  if (ariaMind.identity && ariaMind.learned % 20 === 0) saveMind(ariaMind.identity);
  return true;
}
export function contextualScore(action, state) {
  if (!state) return { lean: 0, confidence: 0, samples: 0 };
  const bucket = `${Math.floor(clamp(state.hull) * 4)}:${Math.floor(clamp(state.hold) * 4)}:${state.hz > 0 ? 1 : 0}:${state.dk ? 1 : 0}`;
  const near = ariaMind.contexts.filter(c => c.by === 'player' && c.bucket === bucket);
  const n = near.reduce((s, c) => s + c.n, 0);
  const hits = near.filter(c => c.action.toLowerCase() === action.toLowerCase()).reduce((s, c) => s + c.n, 0);
  return { lean: n ? hits / n : 0, confidence: Math.min(0.95, n / (n + 12)), samples: n };
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
export function decideMind({ action, why = '', state = {}, steps = [], alternatives = [], at = 0 }) {
  const learned = contextualScore(action ?? '', state);
  const risk = clamp((1 - clamp(state.hull ?? 1)) * 0.5 + (state.hz > 0 ? 0.5 : 0));
  const m = ariaMind.experience.moves[action];
  const confidence = Math.min(0.95, 0.35 + learned.confidence * 0.35 + (m ? m.runs / (m.runs + 8) * 0.25 : 0));
  ariaMind.goals = [{ level: 'primary', goal: 'Keep captain and vessel alive' }, { level: 'strategic', goal: 'Follow captain standing orders' }, { level: 'operational', goal: action ?? 'Hold position' }, { level: 'immediate', goal: steps[0] ?? 'Observe' }];
  ariaMind.decision = { action, why, at, risk, confidence, samples: learned.samples, steps: steps.slice(0, 16), alternatives: alternatives.slice(0, 8) };
  return ariaMind.decision;
}
export function explanationPacket() { return JSON.parse(JSON.stringify({ v: 1, goals: ariaMind.goals, decision: ariaMind.decision, orders: ariaMind.orders, risk: ariaMind.risk, memories: ariaMind.episodes.slice(-4), instruction: 'Explain or discuss this structured decision. Do not issue simulation commands.' })); }

export function policyScore(action, base, state = {}) {
  const context = contextualScore(action, state);
  const mode = ariaMind.orders.mode;
  const m = ariaMind.experience.moves[action];
  const outcome = m?.secs >= 30 ? clamp(m.cr / Math.max(1, m.secs) / 100, -0.3, 0.3) : 0;
  if (mode === 'imitate') return base + context.lean * context.confidence;
  if (mode === 'optimize') return base + outcome;
  if (mode === 'directive') return base;
  return base + context.lean * context.confidence * 0.35 + outcome;
}

export function learnOutcome(action, secs, cr, ok, at = 0) {
  const m = ariaMind.experience.moves[action] ??= { runs: 0, secs: 0, cr: 0, fails: 0 };
  m.runs++; m.secs += Math.max(0, Number(secs) || 0); m.cr += Number(cr) || 0;
  if (!ok) m.fails++;
  ariaMind.experience.runs++;
  remember({ at, kind: 'job', summary: `${action}: ${ok ? 'completed' : 'failed'}, ${Math.round(cr)} cr in ${Math.round(secs)}s`, consequences: { cr, secs, ok } });
}
