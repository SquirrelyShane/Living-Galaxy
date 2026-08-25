import { expand, mergeGrammars, cap1 } from '../core/grammar.js';

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

console.log('\n— grammar —');

{
  const g = { greeting: ['hello there'] };
  ok('a single-rule symbol always resolves to that rule', expand(g, 'greeting') === 'hello there');
}

{
  const g = { missing: [] };
  ok('a missing symbol resolves visibly rather than throwing', expand({}, 'nope') === '#nope#');
  ok('an empty rule list resolves visibly too', expand(g, 'missing') === '#missing#');
}

{
  const g = { line: ['#greeting#, #name#.'], greeting: ['hi'], name: ['pilot'] };
  ok('recursion expands nested symbols', expand(g, 'line') === 'hi, pilot.');
}

{
  const g = { a: ['#b#'], b: ['#a#'] };
  const out = expand(g, 'a', {}, Math.random, 4);
  ok('runaway recursion is capped rather than infinite', out === '#a#' || out === '#b#', out);
}

{
  const g = { pick: ['x', 'x', 'x', 'y'] };      // 3:1 in favour of x
  let xs = 0;
  const seq = Array.from({ length: 400 }, (_, i) => (i % 400) / 400);
  let i = 0;
  const rng = () => seq[i++];
  for (let n = 0; n < 400; n++) if (expand(g, 'pick', {}, rng) === 'x') xs++;
  ok('weighting is respected by a swept rng', xs > 250 && xs < 350, String(xs));
}

{
  const g = {
    line: [
      { text: 'calm line', weight: 1, when: ctx => ctx.mood === 'calm' },
      { text: 'angry line', weight: 1, when: ctx => ctx.mood === 'angry' }
    ]
  };
  ok('when-gating picks only the matching rule', expand(g, 'line', { mood: 'angry' }) === 'angry line');
  ok('the other branch never fires', expand(g, 'line', { mood: 'calm' }) === 'calm line');
}

{
  const g = { line: [{ text: 'a', when: () => false }, { text: 'b', when: () => false }] };
  ok('an over-constrained rule set still answers rather than dead-ending',
     ['a', 'b'].includes(expand(g, 'line', {})));
}

{
  const g = { line: [{ text: ctx => `hello ${ctx.name}` }] };
  ok('a function leaf reads live context', expand(g, 'line', { name: 'Vasquez' }) === 'hello Vasquez');
}

{
  const g = { line: [{ text: () => { throw new Error('boom'); } }] };
  ok('a throwing leaf degrades to an empty string, not a crash', expand(g, 'line', {}) === '');
  const g2 = { line: [{ text: 'ok', when: () => { throw new Error('boom'); } }] };
  ok('a throwing when-clause is treated as false, not a crash', expand(g2, 'line', {}) === 'ok');
}

{
  const base = { a: ['base-a'], b: ['base-b'] };
  const voice = { a: ['voice-a'] };
  const merged = mergeGrammars(base, voice);
  ok('a later grammar overrides a matching symbol', expand(merged, 'a') === 'voice-a');
  ok('a symbol only in the base grammar survives the merge', expand(merged, 'b') === 'base-b');
}

ok('cap1 capitalises the first letter', cap1('pilot') === 'Pilot');
ok('cap1 on empty string is a no-op, not a crash', cap1('') === '');

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
