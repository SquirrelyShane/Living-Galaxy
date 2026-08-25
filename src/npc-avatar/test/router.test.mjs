import { createRouter, requestLine, eligibility, routerReport } from '../core/router.js';
import { createPersona } from '../core/persona.js';

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

console.log('\n— router —');

const GRAMMAR = { hail: [{ text: () => 'grammar-tier line' }] };
const persona = () => createPersona({ id: 'npc-x', name: 'X', archetype: 'guard', rng: () => 0.5 });

function fakeBridge({ ready = true, replyWith = 'llm line', delayMs = 0, throws = false } = {}) {
  return {
    ready: () => ready,
    request: (req) => new Promise((resolve, reject) => {
      setTimeout(() => { throws ? reject(new Error('boom')) : resolve(replyWith); }, delayMs);
    })
  };
}

// ── the guaranteed baseline ─────────────────────────────────────────
{
  const router = createRouter();
  const r = requestLine(router, { persona: persona(), grammar: GRAMMAR, situation: 'hail', now: 0 });
  ok('with no bridge, text resolves synchronously', r.text === 'grammar-tier line');
  ok('with no bridge, there is no upgrade', r.upgrade === null);
  ok('the reason is reported as no-bridge', r.reason === 'no-bridge');
}

// ── happy path ───────────────────────────────────────────────────────
{
  const router = createRouter();
  const bridge = fakeBridge({ replyWith: 'better line' });
  const r = requestLine(router, { persona: persona(), grammar: GRAMMAR, situation: 'hail', now: 0, bridge });
  ok('text is still available immediately even when an upgrade is requested', r.text === 'grammar-tier line');
  ok('an upgrade promise is returned', r.upgrade instanceof Promise);
  const out = await r.upgrade;
  ok('the upgrade resolves to the bridge\'s reply', out === 'better line');
  ok('inFlight returns to zero after the request settles', router.inFlight === 0);
}

// ── concurrency gate ─────────────────────────────────────────────────
{
  const router = createRouter({ maxConcurrent: 1 });
  const bridge = fakeBridge({ delayMs: 20 });
  const first = requestLine(router, { persona: persona(), grammar: GRAMMAR, situation: 'hail', now: 0, bridge });
  ok('the first request takes the only slot', router.inFlight === 1);
  const second = requestLine(router, { persona: { ...persona(), id: 'npc-y' }, grammar: GRAMMAR,
                                        situation: 'hail', now: 0, bridge });
  ok('a second request while the slot is busy gets no upgrade', second.upgrade === null);
  ok('the second request still gets its grammar-tier text', second.text === 'grammar-tier line');
  ok('the busy reason is reported', second.reason === 'busy');
  await first.upgrade;
  ok('the slot frees once the first request settles', router.inFlight === 0);
}

// ── cooldown gate ────────────────────────────────────────────────────
{
  const router = createRouter({ cooldown: 30 });
  const bridge = fakeBridge();
  const p = persona();
  const first = requestLine(router, { persona: p, grammar: GRAMMAR, situation: 'hail', now: 0, bridge });
  ok('the first request for a persona is allowed', first.upgrade !== null);
  await first.upgrade;
  const soon = requestLine(router, { persona: p, grammar: GRAMMAR, situation: 'hail', now: 5, bridge });
  ok('the same persona asked again inside the cooldown is refused', soon.upgrade === null);
  ok('the refusal reason is cooldown', soon.reason === 'cooldown');
  const later = requestLine(router, { persona: p, grammar: GRAMMAR, situation: 'hail', now: 40, bridge });
  ok('the same persona asked again after the cooldown is allowed', later.upgrade !== null);
}

// ── worthiness gate ──────────────────────────────────────────────────
{
  const router = createRouter({ worthy: (situation) => situation === 'hail' });
  const bridge = fakeBridge();
  const worth = requestLine(router, { persona: persona(), grammar: GRAMMAR, situation: 'hail', now: 0, bridge });
  ok('a worthwhile situation is allowed', worth.upgrade !== null);
  await worth.upgrade;               // free the slot so the next check isolates worthiness, not concurrency
  const notWorth = requestLine(router, { persona: { ...persona(), id: 'npc-z' }, grammar: GRAMMAR,
                                          situation: 'ambient', now: 0, bridge });
  ok('an unworthy situation never touches the bridge', notWorth.upgrade === null);
  ok('the refusal reason is not-worth-it', notWorth.reason === 'not-worth-it');
}

// ── failure modes resolve null, never throw ─────────────────────────
{
  const router = createRouter();
  const bridge = fakeBridge({ throws: true });
  const r = requestLine(router, { persona: persona(), grammar: GRAMMAR, situation: 'hail', now: 0, bridge });
  const out = await r.upgrade;
  ok('a rejecting bridge resolves the upgrade to null rather than throwing', out === null);
  ok('the slot is released even after a rejection', router.inFlight === 0);
}
{
  const router = createRouter();
  const bridge = fakeBridge({ ready: false });
  const r = requestLine(router, { persona: persona(), grammar: GRAMMAR, situation: 'hail', now: 0, bridge });
  ok('a not-ready bridge behaves exactly like no bridge at all', r.upgrade === null && r.reason === 'no-bridge');
}

// ── eligibility() is introspectable on its own ───────────────────────
{
  const router = createRouter();
  const g = eligibility(router, persona(), 'hail', {}, null, 0);
  ok('eligibility reports no-bridge without needing a full request', g.ok === false && g.reason === 'no-bridge');
}

// ── reporting ────────────────────────────────────────────────────────
{
  const router = createRouter({ maxConcurrent: 2, cooldown: 15 });
  const rep = routerReport(router);
  ok('routerReport surfaces the configured policy', rep.maxConcurrent === 2 && rep.cooldown === 15);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
