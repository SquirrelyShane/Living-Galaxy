import { createPersona, rememberEvent, forgetOldMemories, opinionOf, say, brief,
         serializePersona, restorePersona } from '../core/persona.js';
import { AXES } from '../core/traits.js';

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

console.log('\n— persona —');

{
  const p = createPersona({ id: 'npc1', name: 'Foreman Deni', archetype: 'guard', rng: () => 0.5 });
  ok('id and name are carried through', p.id === 'npc1' && p.name === 'Foreman Deni');
  ok('an unset name falls back to id', createPersona({ id: 'x' }).name === 'x');
  ok('traits are populated', AXES.every(a => p.traits[a] != null));
  ok('memory starts empty', p.memory.facts.length === 0);
  ok('rev starts at zero', p.rev === 0);
}

{
  const p = createPersona({ id: 'p2', archetype: 'merchant', traits: { aggression: 0, sociability: 0, greed: 0, loyalty: 0, verbosity: 0, formality: 0 } });
  ok('a fully-specified traits object is used as-is rather than re-derived',
     AXES.every(a => p.traits[a] === 0));
}

{
  const p = createPersona({ id: 'p3', archetype: 'merchant', rng: () => 0.5 });
  rememberEvent(p, { type: 'traded', subject: 'player', weight: 1 }, 10);
  ok('rememberEvent files a fact', p.memory.facts.length === 1);
  ok('rememberEvent bumps rev', p.rev === 1);

  const before = p.traits.loyalty;
  rememberEvent(p, { type: 'betrayed', subject: 'player', weight: 2 }, 20,
                { driftAxis: 'loyalty', driftAmount: -0.3 });
  ok('an opted-in drift moves the named trait', p.traits.loyalty < before);

  const beforeAgg = p.traits.aggression;
  rememberEvent(p, { type: 'helped', subject: 'player', weight: 1 }, 30);
  ok('a fact with no drift option leaves traits untouched', p.traits.aggression === beforeAgg);
}

{
  const p = createPersona({ id: 'p4', rng: () => 0.5 });
  rememberEvent(p, { type: 'a', subject: 'x', weight: 0.01 }, 0);
  const removed = forgetOldMemories(p, 100000, 10, 0.5);
  ok('forgetOldMemories reaches into the persona\'s own memory', removed >= 1, String(removed));
}

{
  const p = createPersona({ id: 'p5', rng: () => 0.5 });
  ok('opinionOf with no history is null', opinionOf(p, 'stranger', 0) === null);
  rememberEvent(p, { type: 'threatened', subject: 'stranger', weight: 1 }, 0);
  const o = opinionOf(p, 'stranger', 0);
  ok('opinionOf surfaces the strongest relevant fact', !!o && o.type === 'threatened');
}

{
  const g = {
    greet: [
      { text: () => 'default greeting' },
      { text: () => 'wary greeting', when: ctx => ctx.recall({ subject: 'player' }, 1).length > 0 }
    ]
  };
  const p = createPersona({ id: 'p6', rng: () => 0.5 });
  ok('say() works with no memory at all', say(p, g, 'greet', {}, () => 0, 0) === 'default greeting');

  rememberEvent(p, { type: 'threatened', subject: 'player', weight: 1 }, 0);
  ok('say() exposes recall() to the grammar\'s when-clauses',
     say(p, g, 'greet', {}, () => 1, 0) === 'wary greeting');

  ok('a missing situation degrades visibly rather than throwing',
     say(p, g, 'no-such-situation', {}, Math.random, 0) === '#no-such-situation#');
}

{
  const p = createPersona({ id: 'p7', name: 'Ives', archetype: 'scholar', rng: () => 0.5 });
  rememberEvent(p, { type: 'helped', subject: 'player', weight: 2, meta: { where: 'belt' } }, 5);
  const b = brief(p, 5, { memoryLines: 2 });
  ok('brief carries identity', b.name === 'Ives' && b.archetype === 'scholar');
  ok('brief reduces traits to words, not raw numbers', Array.isArray(b.descriptors) &&
     b.descriptors.every(d => typeof d === 'string'));
  ok('brief carries recent memory with meta intact',
     b.recent.length === 1 && b.recent[0].meta.where === 'belt');
  ok('brief never leaks the raw trait object', b.traits === undefined);
}

{
  const p = createPersona({ id: 'p8', name: 'Test', archetype: 'guard', faction: 'coalition', rng: () => 0.5 });
  rememberEvent(p, { type: 'traded', subject: 'x', weight: 1, meta: { amt: 12 } }, 3);
  const flat = serializePersona(p);
  ok('serialize is plain JSON-safe data', JSON.parse(JSON.stringify(flat)).id === 'p8');

  const restored = restorePersona(flat);
  ok('restore rebuilds identity', restored.id === 'p8' && restored.faction === 'coalition');
  ok('restore rebuilds traits', AXES.every(a => restored.traits[a] === p.traits[a]));
  ok('restore rebuilds memory', restored.memory.facts.length === 1);
  ok('restore resets rev rather than carrying it forward', restored.rev === 0);

  ok('restore of garbage is null, not a crash', restorePersona({}) === null);
  ok('restore of null is null', restorePersona(null) === null);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
