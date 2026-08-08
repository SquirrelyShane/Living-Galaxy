// Not a unit test of any one file — proof that traits, memory, grammar, persona and
// router actually compose the way the rest of the suite assumes. If this file breaks
// while every other suite is green, the modules are individually correct and jointly
// wrong, which is the failure mode unit tests miss.

import { createPersona, rememberEvent, say } from '../core/persona.js';
import { createRouter, requestLine } from '../core/router.js';

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

console.log('\n— pipeline —');

const GRAMMAR = {
  hail_contract: [
    { text: ctx => `${cap(ctx.name)} isn't interested in your excuses.`, weight: 1,
      when: ctx => ctx.traits.aggression > 0.5 },
    { text: ctx => `${cap(ctx.name)} would rather not do this.`, weight: 1,
      when: ctx => ctx.traits.aggression <= 0.5 },
    { text: () => 'You have crossed paths with this pilot before.', weight: 2,
      when: ctx => ctx.recall({ subject: 'player' }, 1).length > 0 }
  ]
};
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;

// ── a persona that has never met the player ─────────────────────────
{
  const merc = createPersona({ id: 'merc-1', name: 'Kell', archetype: 'criminal', faction: 'hostile', rng: () => 0.9 });
  const line = say(merc, GRAMMAR, 'hail_contract', {}, () => 0, 0);
  ok('a personality-appropriate line comes out with no memory at all',
     /Kell/.test(line), line);
}

// ── the same persona after an encounter ─────────────────────────────
{
  const merc = createPersona({ id: 'merc-2', name: 'Rask', archetype: 'criminal', faction: 'hostile', rng: () => 0.9 });
  rememberEvent(merc, { type: 'contract', subject: 'player', weight: 2 }, 10);
  const seq = [0.99, 0.01];                 // force the high-weight "we've met" rule to win
  let i = 0;
  const line = say(merc, GRAMMAR, 'hail_contract', {}, () => seq[i++ % seq.length], 20);
  ok('memory of the player changes what the same persona says',
     /crossed paths/.test(line), line);
}

// ── the router wraps say() without changing its guaranteed output ───
{
  const merc = createPersona({ id: 'merc-3', name: 'Voss', archetype: 'criminal', faction: 'hostile', rng: () => 0.9 });
  const router = createRouter();
  const r = requestLine(router, { persona: merc, grammar: GRAMMAR, situation: 'hail_contract',
                                   now: 0, rng: () => 0 });
  ok('with no LLM bridge attached, the router\'s text is exactly the grammar line',
     r.text === say(merc, GRAMMAR, 'hail_contract', {}, () => 0, 0));
  ok('and there is nothing to await', r.upgrade === null);
}

// ── the router upgrades a worthwhile line and falls back on failure ──
{
  const merc = createPersona({ id: 'merc-4', name: 'Bray', archetype: 'criminal', faction: 'hostile', rng: () => 0.9 });
  const router = createRouter({ worthy: s => s === 'hail_contract' });
  const goodBridge = { ready: () => true, request: () => Promise.resolve('Bray spits and says nothing further.') };
  const r1 = requestLine(router, { persona: merc, grammar: GRAMMAR, situation: 'hail_contract',
                                    now: 0, rng: () => 0, bridge: goodBridge });
  ok('the immediate line is still there while the upgrade is pending', typeof r1.text === 'string' && r1.text.length > 0);
  const upgraded = await r1.upgrade;
  ok('a working bridge produces the enriched line', upgraded === 'Bray spits and says nothing further.');

  const merc2 = createPersona({ id: 'merc-5', name: 'Ashe', archetype: 'criminal', faction: 'hostile', rng: () => 0.9 });
  const brokenBridge = { ready: () => true, request: () => Promise.reject(new Error('model unavailable')) };
  const r2 = requestLine(router, { persona: merc2, grammar: GRAMMAR, situation: 'hail_contract',
                                    now: 100, rng: () => 0, bridge: brokenBridge });
  const fallback = await r2.upgrade;
  ok('a broken bridge falls back to null, and the caller still had r2.text the whole time',
     fallback === null && r2.text.length > 0);
}

// ── a hundred ambient personas cost nothing worth measuring ──────────
{
  const start = Date.now();
  const crowd = Array.from({ length: 100 }, (_, i) =>
    createPersona({ id: 'amb-' + i, name: 'N' + i, archetype: 'laborer', rng: () => (i % 7) / 7 }));
  for (const p of crowd) say(p, GRAMMAR, 'hail_contract', {}, Math.random, 0);
  ok('a hundred grammar-tier lines resolve in a trivial amount of time',
     Date.now() - start < 200, `${Date.now() - start}ms`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
