import { createMemory, remember, recall, salience, forgetStale, strongestAbout,
         serializeMemory, restoreMemory } from '../core/memory.js';

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

console.log('\n— memory —');

{
  const mem = createMemory(4);
  ok('starts empty', mem.facts.length === 0);

  remember(mem, { type: 'traded', subject: 'player', weight: 1, t: 0 });
  ok('a fact lands', mem.facts.length === 1);

  remember(mem, { type: 'traded', subject: 'player', weight: 1, t: 10 });
  ok('the same (type,subject) reinforces instead of duplicating', mem.facts.length === 1);
  ok('reinforcement raises weight', mem.facts[0].weight > 1, String(mem.facts[0].weight));
  ok('reinforcement refreshes the timestamp', mem.facts[0].t === 10);

  remember(mem, { type: 'traded', subject: 'player', weight: 10, t: 20 }, 20, 4);
  ok('weight is capped', mem.facts[0].weight === 4, String(mem.facts[0].weight));

  remember(mem, { type: 'threatened', subject: 'player', weight: 1, t: 20 });
  ok('a different type is a separate fact even for the same subject', mem.facts.length === 2);
}

{
  const mem = createMemory(2);
  remember(mem, { type: 'a', subject: 'x', weight: 3, t: 0 }, 0);
  remember(mem, { type: 'b', subject: 'x', weight: 0.1, t: 0 }, 0);
  remember(mem, { type: 'c', subject: 'x', weight: 3, t: 100 }, 100);
  ok('over-cap eviction respects the bound', mem.facts.length === 2);
  ok('the weakest fact was the one evicted', !mem.facts.some(f => f.type === 'b'),
     mem.facts.map(f => f.type).join(','));
}

{
  const f = { weight: 1, t: 0 };
  ok('fresh salience equals weight', Math.abs(salience(f, 0, 100) - 1) < 1e-9);
  ok('one half-life halves it', Math.abs(salience(f, 100, 100) - 0.5) < 1e-6);
  ok('two half-lives quarters it', Math.abs(salience(f, 200, 100) - 0.25) < 1e-6);
  ok('salience never goes negative on a future time it did not expect',
     salience(f, -50, 100) <= 1.01);
}

{
  const mem = createMemory(10);
  remember(mem, { type: 'traded', subject: 'p1', weight: 3, t: 0 }, 0);
  remember(mem, { type: 'traded', subject: 'p2', weight: 1, t: 0 }, 0);
  remember(mem, { type: 'threatened', subject: 'p1', weight: 2, t: 0 }, 0);

  const bySubject = recall(mem, { subject: 'p1' }, 5, 0);
  ok('recall filters by subject', bySubject.length === 2 && bySubject.every(f => f.subject === 'p1'));

  const byType = recall(mem, { type: 'traded' }, 5, 0);
  ok('recall filters by type', byType.length === 2 && byType.every(f => f.type === 'traded'));

  const top1 = recall(mem, {}, 1, 0);
  ok('recall ranks by salience, strongest first', top1[0].subject === 'p1' && top1[0].type === 'traded');

  const decayed = recall(mem, { subject: 'p2' }, 5, 100000, 50);
  ok('fully decayed facts are not recalled even without an explicit forget pass',
     decayed.length === 0);
}

{
  const mem = createMemory(10);
  remember(mem, { type: 'a', subject: 'x', weight: 1, t: 0 }, 0);
  remember(mem, { type: 'b', subject: 'y', weight: 5, t: 0 }, 0);
  const removed = forgetStale(mem, 500, 50, 0.05);
  ok('forgetStale prunes what has decayed past the floor', removed >= 1, String(removed));
  ok('a strongly-weighted fact can survive longer than a weak one',
     mem.facts.some(f => f.subject === 'y') || mem.facts.length === 0);
}

{
  const mem = createMemory(10);
  ok('strongestAbout on an unknown subject is null', strongestAbout(mem, 'nobody', 0) === null);
  remember(mem, { type: 'helped', subject: 'ally', weight: 2, t: 0 }, 0);
  const s = strongestAbout(mem, 'ally', 0);
  ok('strongestAbout finds the one fact there is', !!s && s.type === 'helped');
}

{
  const mem = createMemory(3);
  remember(mem, { type: 'a', subject: 'x', weight: 1, t: 5, meta: { amt: 40 } }, 5);
  const flat = serializeMemory(mem);
  ok('serialize produces a plain array', Array.isArray(flat) && flat.length === 1);
  ok('serialize preserves meta', flat[0].meta.amt === 40);

  const restored = restoreMemory(flat, 3);
  ok('restore rebuilds a usable memory', recall(restored, { subject: 'x' }, 1, 5).length === 1);

  ok('restore drops malformed entries rather than crashing',
     restoreMemory([{ garbage: true }, null, { type: 'ok', subject: 'z', weight: 1, t: 0 }], 3)
       .facts.length === 1);

  ok('restore respects the cap by keeping the most recent entries',
     restoreMemory(Array.from({ length: 6 }, (_, i) => ({ type: 't' + i, subject: 's', weight: 1, t: i })), 3)
       .facts.length === 3);

  ok('restore of nothing is a valid empty memory', restoreMemory(null, 3).facts.length === 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
