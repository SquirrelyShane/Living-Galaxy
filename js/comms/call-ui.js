// js/comms/call-ui.js — LIVING GALAXY comms overlay (vanilla, no deps)
// Usage:
//   import { CallUI } from './comms/call-ui.js';
//   const ui = new CallUI({ mount: document.getElementById('hud') });
//   ui.attach(session);                 // session = CallSession
//   // in your frame loop:  ui.tick(dtMs * timeScale);
// The director (comms.js) owns sessions; this only paints one at a time plus
// the open-channel ticker for traffic you are overhearing.
import { CallState } from './call-session.js';

const SVG = {
  hail: '<svg class="cx-puck__glyph" viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="2.2"/><path d="M7.4 16.6a6.5 6.5 0 0 1 0-9.2M16.6 7.4a6.5 6.5 0 0 1 0 9.2M4.2 19.8a11 11 0 0 1 0-15.6M19.8 4.2a11 11 0 0 1 0 15.6"/></svg>',
  yes: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg>',
  no: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

export class CallUI {
  constructor({ mount, waveBars = 9, autoExpand = true } = {}) {
    if (!mount) throw new Error('CallUI: mount required');
    this.session = null;
    this.minimized = false;
    this.autoExpand = autoExpand;
    this._offs = [];
    this._rows = new Map();
    this._wavePhase = 0;

    const root = el('div', 'cx');
    // puck
    const puck = el('button', 'cx-puck',
      `<span class="cx-puck__ring"></span><span class="cx-puck__ring"></span>${SVG.hail}`);
    puck.type = 'button';
    puck.setAttribute('aria-label', 'Comms');
    puck.hidden = true;
    puck.addEventListener('click', () => this._onPuck());

    // accept / reject
    const answer = el('div', 'cx-answer',
      `<button class="cx-yes" type="button" aria-label="Accept call">${SVG.yes}</button>` +
      `<button class="cx-no" type="button" aria-label="Reject call">${SVG.no}</button>`);
    answer.hidden = true;
    answer.querySelector('.cx-yes').addEventListener('click', () => this.accept());
    answer.querySelector('.cx-no').addEventListener('click', () => this.reject());

    // panel
    const panel = el('div', 'cx-panel');
    panel.hidden = true;
    const head = el('div', 'cx-head');
    const who = el('div', 'cx-head__who', '—');
    const wave = el('div', 'cx-wave');
    wave.dataset.src = 'idle';
    for (let i = 0; i < waveBars; i++) wave.appendChild(document.createElement('i'));
    const meta = el('div', 'cx-head__meta', '');
    const minBtn = el('button', null, '–'); minBtn.type = 'button'; minBtn.setAttribute('aria-label', 'Collapse');
    const endBtn = el('button', 'cx-end', 'END'); endBtn.type = 'button';
    minBtn.addEventListener('click', () => this.toggleMinimized());
    endBtn.addEventListener('click', () => this.session && this.session.end('hangup'));
    head.append(who, wave, el('div', 'cx-head__sp'), meta, minBtn, endBtn);

    const log = el('div', 'cx-log');
    log.addEventListener('click', () => this.session && this.session.skipReveal());
    const replies = el('div', 'cx-replies');

    // free-form line — live calls to another pilot, or a keyboard hook on NPC calls
    const say = el('form', 'cx-say');
    say.hidden = true;
    const sayIn = document.createElement('input');
    sayIn.type = 'text'; sayIn.maxLength = 140; sayIn.autocomplete = 'off'; sayIn.placeholder = 'transmit…';
    sayIn.setAttribute('aria-label', 'Transmit');
    const sayBtn = el('button', 'cx-tx', 'TX'); sayBtn.type = 'submit';
    say.append(sayIn, sayBtn);
    say.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.session && this.session.say(sayIn.value)) sayIn.value = '';
    });

    // open-channel ticker: traffic between other stations and ships, overheard
    const chatter = el('div', 'cx-chatter');
    chatter.hidden = true;
    const chTag = el('span', 'cx-chatter__tag', '');
    const chTxt = el('span', 'cx-chatter__txt', '');
    chatter.append(chTag, chTxt);

    panel.append(head, log, replies, say);
    root.append(puck, answer, panel, chatter);
    mount.appendChild(root);

    Object.assign(this, { root, puck, answer, panel, head, who, wave, meta, log, replies, say, sayIn, chatter, chTag, chTxt });
    this._chatterUntil = 0;
    this._chatterMs = 0;
  }

  /** Paint one overheard line. Fades on its own after `holdMs` of ticked time. */
  showChatter(tag, text, holdMs = 6500, tone = 'neutral') {
    this.chTag.textContent = tag;
    this.chTxt.textContent = text;
    this.chatter.dataset.tone = tone;
    this.chatter.hidden = false;
    this._chatterMs = 0;
    this._chatterUntil = holdMs;
  }

  hideChatter() { this.chatter.hidden = true; this._chatterUntil = 0; }

  // --- binding -------------------------------------------------------------
  attach(session) {
    this.detach();
    this.session = session;
    this._rows.clear();
    this.log.textContent = '';
    this.replies.textContent = '';
    this.minimized = false;
    this.panel.removeAttribute('data-min');

    const on = (ev, fn) => this._offs.push(session.on(ev, fn));
    on('state', () => this._sync());
    on('line', l => this._addRow(l));
    on('update', () => this._paintLast());
    on('options', o => this._paintOptions(o));
    on('typing', t => { this.wave.dataset.src = t ? 'peer' : 'idle'; });
    on('closed', () => this._sync());
    for (const l of session.lines) this._addRow(l);
    this._paintOptions(session.options);
    this._sync();
    return this;
  }

  detach() {
    for (const off of this._offs) off();
    this._offs.length = 0;
    this.session = null;
    this.puck.hidden = true;
    this.answer.hidden = true;
    this.panel.hidden = true;
    this.say.hidden = true;
  }

  // --- actions -------------------------------------------------------------
  _onPuck() {
    const s = this.session;
    if (!s) return;
    if (s.isRinging) {
      const outgoing = s.state === CallState.RINGING_OUT;
      this.answer.querySelector('.cx-yes').hidden = outgoing;   // outgoing → cancel only
      this.answer.hidden = !this.answer.hidden;
      return;
    }
    if (s.isLive) this.toggleMinimized();
  }
  accept() { this.answer.hidden = true; this.session && this.session.accept(); }
  reject() { this.answer.hidden = true; this.session && this.session.reject(); }
  toggleMinimized() {
    this.minimized = !this.minimized;
    this.panel.toggleAttribute('data-min', this.minimized);
    this._scroll();
  }

  // --- render --------------------------------------------------------------
  _sync() {
    const s = this.session;
    if (!s) return;
    const ringing = s.isRinging;
    const live = s.isLive;
    const dead = [CallState.CLOSED, CallState.MISSED, CallState.REJECTED, CallState.UNREACHABLE, CallState.IDLE].includes(s.state);

    this.puck.hidden = dead;
    if (ringing) {
      this.puck.dataset.ring = s.state === CallState.RINGING_OUT ? 'out' : (s.hostile ? 'hostile' : 'in');
      this.puck.dataset.state = 'ring';
    } else {
      delete this.puck.dataset.ring;
      this.puck.dataset.state = live ? 'live' : '';
    }
    if (!ringing) this.answer.hidden = true;

    this.panel.hidden = !live;
    this.say.hidden = !(live && (s.live || s.talkNode));
    this.sayIn.placeholder = s.live ? 'transmit…' : 'say something…';
    if (live && this.autoExpand && this.minimized === false) this.panel.removeAttribute('data-min');
    this.who.textContent = s.peerName;
    this._meta();
    if (dead) { this.wave.dataset.src = 'idle'; this.replies.textContent = ''; }
  }

  _meta() {
    const s = this.session;
    if (!s) return;
    const q = Math.round(s.quality * 100);
    const lag = s.lagMs >= 1000 ? `${(s.lagMs / 1000).toFixed(1)}s` : `${Math.round(s.lagMs)}ms`;
    this.meta.textContent = `${s.channel} · ${Math.round(s.rangeU)}u · ${lag} · ${q}% · ${s.clock}`;
  }

  _addRow(line) {
    // the session only ever reveals its last line: a line still typing out when the next one
    // lands would freeze half-written, so finish it and paint it whole first
    const s = this.session;
    const i = s ? s.lines.indexOf(line) : -1;
    const prev = i > 0 ? s.lines[i - 1] : null;
    if (prev) {
      if (!prev.done) prev.finish();
      const n = this._rows.get(prev.id);
      if (n) { n.textContent = prev.visible; n.classList.remove('cx-caret'); }
    }
    const row = el('div', 'cx-row');
    row.dataset.sp = line.speaker;
    const tag = el('div', 'cx-row__tag', line.speaker === 'self' ? '«' : line.speaker === 'peer' ? '»' : '·');
    const txt = el('div', 'cx-row__txt', '');
    row.append(tag, txt);
    this.log.appendChild(row);
    this._rows.set(line.id, txt);
    this._paintLast();
    this._scroll();
  }

  _paintLast() {
    const s = this.session;
    if (!s) return;
    const line = s.lines[s.lines.length - 1];
    if (!line) return;
    const node = this._rows.get(line.id);
    if (!node) return;
    node.textContent = line.visible;
    node.classList.toggle('cx-caret', !line.done);
    this.wave.dataset.src = line.done ? 'idle' : line.speaker;
    /* reading scrollHeight forces layout: only pin the log once the line has landed whole */
    if (line.done) this._scroll();
  }

  _paintOptions(options) {
    this.replies.textContent = '';
    for (const o of options || []) {
      const chip = el('button', 'cx-chip', o.label);
      chip.type = 'button';
      chip.dataset.tone = o.tone || 'neutral';
      if (o.end) chip.dataset.end = '1';
      chip.addEventListener('click', () => this.session && this.session.choose(o.id));
      this.replies.appendChild(chip);
    }
  }

  _scroll() { this.log.scrollTop = this.log.scrollHeight; }

  // --- clock ---------------------------------------------------------------
  /** Call once per frame with scaled dt (ms). Drives the session and the waveform. */
  tick(dtMs) {
    if (!this.chatter.hidden) {
      this._chatterMs += dtMs;
      if (this._chatterMs >= this._chatterUntil) this.hideChatter();
    }
    const s = this.session;
    if (!s) return;
    s.tick(dtMs);
    if (!this.panel.hidden) {
      /* the meta line moves at the pace of a clock, not a frame: ~4 Hz is plenty */
      this._metaMs = (this._metaMs || 0) + dtMs;
      if (this._metaMs >= 250) { this._metaMs = 0; this._meta(); }
      this._wave(dtMs);
    }
  }

  _wave(dtMs) {
    const speaking = this.wave.dataset.src !== 'idle';
    this._wavePhase += dtMs / 90;
    const bars = this.wave.children;
    for (let i = 0; i < bars.length; i++) {
      const a = speaking
        ? 0.18 + Math.abs(Math.sin(this._wavePhase + i * 0.9)) * 0.82 * (0.5 + 0.5 * Math.sin(this._wavePhase * 0.37 + i))
        : 0.08 + 0.04 * Math.sin(this._wavePhase * 0.25 + i);
      bars[i].style.transform = `scaleY(${Math.max(0.08, a).toFixed(3)})`;
    }
  }

  destroy() { this.detach(); this.root.remove(); }
}

export default CallUI;
