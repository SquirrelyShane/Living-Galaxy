import { AXES, ARCHETYPES, ARCHETYPE_KEYS, makeTraits, driftTrait, describeTraits } from '../core/traits.js';

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

console.log('\n— traits —');

ok('every archetype defines every axis', ARCHETYPE_KEYS.every(k => AXES.every(a => ARCHETYPES[k][a] != null)));
ok('every archetype has a voice tag', ARCHETYPE_KEYS.every(k => typeof ARCHETYPES[k].voice === 'string'));

{
  const seq = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];   // no jitter at rng=0.5 (spread term is 0)
  let i = 0;
  const rng = () => seq[i++ % seq.length];
  const t = makeTraits('guard', {}, rng);
  ok('unjittered traits equal the archetype baseline',
     AXES.every(a => Math.abs(t[a] - ARCHETYPES.guard[a]) < 1e-9), JSON.stringify(t));
  ok('voice carries through from the archetype', t.voice === ARCHETYPES.guard.voice);
}

{
  const t = makeTraits('criminal', { aggression: 0.9 }, () => 0.5);
  ok('an override wins over the archetype baseline', Math.abs(t.aggression - 0.9) < 1e-9);
}

{
  const t = makeTraits('nonexistent-archetype', {}, () => 0.5);
  ok('an unknown archetype falls back rather than throwing', AXES.every(a => t[a] != null));
}

{
  let calls = 0;
  const rng = () => { calls++; return Math.random(); };
  makeTraits('merchant', {}, rng);
  ok('rng is actually consulted per axis', calls === AXES.length, String(calls));
}

{
  const t = makeTraits('guard', {}, () => 1);         // maximal jitter
  ok('jitter never pushes a trait out of [0,1]', AXES.every(a => t[a] >= 0 && t[a] <= 1), JSON.stringify(t));
}

{
  const t = { aggression: 0.5, sociability: 0.5, greed: 0.5, loyalty: 0.5, verbosity: 0.5, formality: 0.5 };
  driftTrait(t, 'aggression', 0.3);
  ok('drift moves the named axis', Math.abs(t.aggression - 0.8) < 1e-9);
  driftTrait(t, 'aggression', 0.5);
  ok('drift clamps at the ceiling', t.aggression === 1);
  driftTrait(t, 'aggression', -5);
  ok('drift clamps at the floor', t.aggression === 0);
  const before = JSON.stringify(t);
  driftTrait(t, 'not-an-axis', 0.5);
  ok('an unknown axis is a no-op, not a crash', JSON.stringify(t) === before);
}

{
  const extreme = { aggression: 0.9, sociability: 0.1, greed: 0.9, loyalty: 0.9, verbosity: 0.5, formality: 0.5 };
  const d = describeTraits(extreme);
  ok('extreme axes produce descriptors', d.length >= 3, d.join(','));
  ok('middling axes are skipped', !d.includes('even-tempered'));
  const flat = { aggression: 0.5, sociability: 0.5, greed: 0.5, loyalty: 0.5, verbosity: 0.5, formality: 0.5 };
  ok('an entirely middling character has nothing notable to say', describeTraits(flat).length === 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
