// Slice — sound: the drive, the bed, and dialogue that arrives at a speed.
//
// Audio is hard to test and easy to leave untested, and the bug that produced this slice is
// exactly the kind that survives: a music bed that was two static oscillators sounded, to
// every player, like a constant engine hum — and nothing in the suite could tell the
// difference between "a bed is running" and "a bed that is worth having is running".
//
// So the assertions here are about *movement*: that a mood declares different values from
// its neighbours, that the drive responds to the lever, that the scheduler books ahead
// rather than at, and that the typewriter never loses a line however it is interrupted.
// None of that needs a speaker.

import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const { S } = await imp('core/state.js');
const { AUDIO } = await imp('core/config.js');
const audio = await imp('systems/platform/audio.js');
const music = await imp('systems/platform/music.js');
const tw = await imp('ui/typewriter.js');

// ── the mix has a drive in it ────────────────────────────────────────
console.log('\n— the drive —');
{
  ok('there is an engine bus', AUDIO.buses.engine > 0, String(AUDIO.buses.engine));
  const E = AUDIO.engine;
  ok('the drive is tuned', !!E);
  ok('full throttle is above idle', E.fullHz > E.idleHz, `${E.idleHz} → ${E.fullHz}`);
  ok('but not by an octave — that is a car, not a ship',
     E.fullHz / E.idleHz < 2, (E.fullHz / E.idleHz).toFixed(2));
  ok('the noise layer opens with power', E.airMaxHz > E.airMinHz * 3);
  ok('idle is audible but quiet', E.idleGain > 0 && E.idleGain < 0.4, String(E.idleGain));

  // Without an AudioContext (this suite, and any browser that refuses one) every one of
  // these has to be a no-op rather than a throw. That is the property the boot path needs.
  audio.initAudio();
  ok('the drive reports nothing when there is no context',
     audio.engineReport().running === false);
  let threw = false;
  try { audio.updateAudio(0.016); } catch (e) { threw = true; }
  ok('and updating it does not throw', !threw);
}

// ── the bed is music, not a drone ────────────────────────────────────
console.log('\n— the bed —');
{
  ok('there are four moods', music.MOOD_KEYS.length === 4, music.MOOD_KEYS.join(','));

  const specs = music.MOOD_KEYS.map(k => music.moodSpec(k));
  ok('every mood declares a chord, a scale and a step',
     specs.every(m => m.chord.length >= 3 && m.scale.length >= 5 && m.step > 0));

  // The drone had one number that differed between moods: the filter cutoff. If a mood is
  // only a cutoff, it is the same sound with a tone control, which is what it sounded like.
  const roots = new Set(specs.map(m => m.root));
  const steps = new Set(specs.map(m => m.step));
  const densities = new Set(specs.map(m => m.density));
  ok('moods differ in key', roots.size === specs.length, [...roots].join(','));
  ok('and in pace', steps.size === specs.length, [...steps].join(','));
  ok('and in how much they play', densities.size >= 3, [...densities].join(','));

  const calm = music.moodSpec('calm'), combat = music.moodSpec('combat');
  ok('combat is denser than calm', combat.density > calm.density);
  ok('combat is faster than calm', combat.step < calm.step);
  ok('combat is lower than calm', combat.root < calm.root);

  // Rests are the character. A density of 1 would be a note on every step, which is a
  // sequencer demo rather than an ambient bed.
  ok('every mood leaves silence in it', specs.every(m => m.density < 0.7),
     specs.map(m => m.density).join(','));

  ok('nothing is running without a context', music.bedRunning() === false);
  ok('and a mood cannot be moved to when nothing is playing', music.moveBed('combat') === false);
  ok('the report says so plainly', music.bedReport().running === false);
  ok('starting without a context is refused, not thrown',
     music.startBed(null, null) === undefined || music.bedRunning() === false);

  // The public surface every existing caller uses has to survive the rewrite.
  ok('audio.js still exposes the music API',
     ['startMusic', 'stopMusic', 'setMood', 'musicMood', 'moodFor', 'updateAudio']
       .every(k => typeof audio[k] === 'function'));
  ok('moodFor still answers with a mood name',
     music.MOOD_KEYS.includes(audio.moodFor()), audio.moodFor());
}

// ── dialogue arrives at a speed ──────────────────────────────────────
console.log('\n— spoken dialogue —');
{
  const node = () => ({
    dataset: {}, classList: { _s: new Set(), add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); }, contains(c) { return this._s.has(c); } },
    textContent: '', isConnected: true
  });
  S.settings.typewriter = true;
  tw.resetTypewriter();

  const a = node();
  const run = tw.type(a, 'Nothing on the band. Stay sharp.', { key: 'k1', kind: 'chatter' });
  ok('a line starts empty', a.textContent === '');
  ok('the whole line is on the node from the first frame',
     a.dataset.full === 'Nothing on the band. Stay sharp.');
  ok('and it is marked as arriving', a.classList.contains('typing'));
  ok('something is in flight', tw.typingCount() === 1);

  run.finish();
  ok('finishing writes the whole line', a.textContent === 'Nothing on the band. Stay sharp.');
  ok('and clears the caret', !a.classList.contains('typing'));
  ok('and nothing is left in flight', tw.typingCount() === 0);

  // Rule 2: a key is told once, whatever the panel does afterwards.
  const b = node();
  const again = tw.type(b, 'Nothing on the band. Stay sharp.', { key: 'k1', kind: 'chatter' });
  ok('a line already told is written whole, not re-typed', again === null);
  ok('with its text intact', b.textContent === 'Nothing on the band. Stay sharp.');
  ok('alreadyTold agrees', tw.alreadyTold('k1') === true);

  // Rule 1: interruption never loses text.
  const c = node();
  tw.type(c, 'Coalition wing, hold your lane.', { key: 'k2' });
  tw.finishAll();
  ok('finishAll completes everything in flight',
     c.textContent === 'Coalition wing, hold your lane.' && tw.typingCount() === 0);

  // Rule 3 and the accessibility switch: off means instant, always.
  S.settings.typewriter = false;
  const d = node();
  const off = tw.type(d, 'Understood.', { key: 'k3' });
  ok('with spoken dialogue off nothing animates', off === null);
  ok('and the line is simply there', d.textContent === 'Understood.');
  S.settings.typewriter = true;

  // An empty line is a real case — a generated reply can come back blank.
  const e = node();
  ok('an empty line does not animate', tw.type(e, '', { key: 'k4' }) === null);
  ok('and leaves an empty node', e.textContent === '');

  // Voices are stable and varied — the whole point of pitching per speaker.
  ok('the same name is always the same voice',
     tw.voiceOf('Aryn-093') === tw.voiceOf('Aryn-093'));
  const voices = new Set(['Aryn-093', 'Kestrel Vane', 'Nexis Drone', 'ARIA', 'Halon Cold Store']
    .map(tw.voiceOf));
  ok('and different names mostly are not', voices.size >= 4, String(voices.size));

  ok('sfx has a typing tone', typeof audio.sfx.type === 'function');
  let threw2 = false;
  try { audio.sfx.type(7); } catch (err) { threw2 = true; }
  ok('which is a no-op without a context', !threw2);

  tw.resetTypewriter();
  ok('a reset forgets what was told', tw.alreadyTold('k1') === false);
}

// ── the settings that carry it ───────────────────────────────────────
console.log('\n— remembered —');
{
  ok('spoken dialogue defaults on', S.settings.typewriter !== false);
  ok('the systems drawer defaults closed', S.settings.systemsDetail === false);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
