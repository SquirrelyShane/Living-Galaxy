// Living Galaxy — the training card.
//
// A small panel that lives in the corner and never takes the screen. Three rules it
// follows, all of them reactions to how badly tutorials usually behave:
//
//   It never blocks. There is no modal, no forced click, no disabled control.
//   It can be put away. Dismiss keeps the training running and stops the card existing.
//   It ends by asking. The completion prompt is the only thing here that fills the
//     screen, and it exists because "you have finished the tutorial" with no question
//     attached is the moment most games lose the player.

import { $, el } from '../core/utils.js';
import { tutorialState, awaitingChoice, dismissTutorial, resumeTutorial,
<<<<<<< HEAD
         skipTutorial, startTutorial, finish, onTutorial, tutorialDone } from '../systems/platform/tutorial.js';
import { sfx } from '../systems/platform/audio.js';
=======
         skipTutorial, startTutorial, finish, onTutorial, tutorialDone } from '../systems/tutorial.js';
import { sfx } from '../systems/audio.js';
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44

let card, done, onNewGame = null;

export function initTutorial(newGameFn) {
  onNewGame = newGameFn || null;
  card = $('tut-card');
  done = $('tut-done');
  if (!card) return;

  const skip = $('tut-skip');
  if (skip) skip.addEventListener('click', () => { sfx.ui(); skipTutorial(); render(); });
  const hide = $('tut-hide');
  if (hide) hide.addEventListener('click', () => { sfx.ui(); dismissTutorial(); render(); });

  const cont = $('tut-continue');
  if (cont) cont.addEventListener('click', () => { sfx.ui(); choose('continue'); });
  const fresh = $('tut-newgame');
  if (fresh) fresh.addEventListener('click', () => { sfx.ui(); choose('newgame'); });

  onTutorial(render);
  render();
}

/** Offer training to a pilot who has never been offered it. */
export function offerTutorial() {
  if (tutorialDone()) return false;
  startTutorial();
  render();
  return true;
}

export function reopenTutorial() { resumeTutorial(); render(); }

function choose(which) {
  const res = finish(which);
  render();
  if (res.outcome === 'newgame' && onNewGame) onNewGame();
}

export function render() {
  if (!card) return;
  const s = tutorialState();

  // Completion prompt first — it supersedes the card.
  if (done) {
    const show = awaitingChoice();
    done.classList.toggle('hidden', !show);
    if (show) {
      const b = $('tut-done-body');
      if (b) {
        b.innerHTML =
          '<div class="tut-h">Training complete</div>' +
          '<p>You have a weapon bolted on, a hold you filled and emptied, a crew who know ' +
          'where they stand, and a radio that talks back. Everything after this is yours ' +
          'to decide.</p>' +
          '<p class="tut-sub">Carry on with this pilot, or take what you have learned into ' +
          'a fresh start with a different lineage, corporation and career — including the ' +
          'executive path, which begins with a company rather than a job.</p>';
      }
    }
  }

  if (!s.active || s.dismissed) { card.classList.add('hidden'); return; }
  card.classList.remove('hidden');

  const head = $('tut-step');
  if (head) head.textContent = `Training ${s.index + 1}/${s.total}`;
  const title = $('tut-title');
  if (title) title.textContent = s.title || '';
  const body = $('tut-body');
  if (body) body.textContent = s.body || '';
  const hint = $('tut-hint');
  if (hint) {
    hint.textContent = s.hint || '';
    hint.classList.toggle('hidden', !s.hint);
  }
  const bar = $('tut-bar');
  if (bar) bar.style.width = Math.round((s.index / s.total) * 100) + '%';
}
