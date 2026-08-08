import { MODELS, MODEL_KEYS, DEFAULT_MODEL, modelsByTier, probeBuiltIn } from '../llm/models.js';

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

console.log('\n— model registry —');

ok('the default model exists in the registry', !!MODELS[DEFAULT_MODEL]);
ok('every entry has a hub id, a param count and reasoning notes',
   MODEL_KEYS.every(k => MODELS[k].id && MODELS[k].params && MODELS[k].notes));
ok('every entry declares a tier', MODEL_KEYS.every(k => !!MODELS[k].tier));
ok('there is at least one entry at every tier the registry claims to cover',
   ['default', 'light', 'upgrade', 'director'].every(t => modelsByTier(t).length > 0));

{
  const out = await probeBuiltIn();
  ok('probeBuiltIn never throws in a plain Node environment', typeof out.available === 'boolean');
  ok('probing an environment with no built-in API reports unavailable', out.available === false);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
