export const CallState = Object.freeze({
  IDLE: 'idle',
  RINGING_IN: 'ringing_in',
  RINGING_OUT: 'ringing_out',
  CONNECTING: 'connecting',
  ACTIVE: 'active',
  CLOSED: 'closed',
  MISSED: 'missed',
  REJECTED: 'rejected',
  UNREACHABLE: 'unreachable'
});

const GARBLE = '#%/\\*~+';

function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Emitter {
  constructor() { this._h = new Map(); }
  on(ev, fn) { (this._h.get(ev) || this._h.set(ev, []).get(ev)).push(fn); return () => this.off(ev, fn); }
  off(ev, fn) { const a = this._h.get(ev); if (a) { const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); } }
  emit(ev, payload) { const a = this._h.get(ev); if (a) for (const fn of a.slice()) fn(payload); }
}

let _lineId = 0;

export class TranscriptLine {
  constructor({ speaker, name, text, quality = 1, cps = 42, seed = 1 }) {
    this.id = ++_lineId;
    this.speaker = speaker;
    this.name = name;
    this.text = text;
    this.cps = cps;
    this.chars = 0;
    this.done = false;
    this.mask = TranscriptLine.mask(text, quality, seed);
  }
  static mask(text, quality, seed) {
    if (quality >= 0.999) return null;
    const rnd = mulberry(seed);
    const loss = Math.min(0.42, (1 - quality) * 0.55);
    const out = new Array(text.length);
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      out[i] = (c === ' ' || rnd() > loss) ? c : GARBLE[(rnd() * GARBLE.length) | 0];
    }
    return out.join('');
  }
  advance(dtMs) {
    if (this.done) return false;
    const src = this.mask || this.text;
    this.chars = Math.min(src.length, this.chars + (this.cps * dtMs) / 1000);
    if (this.chars >= src.length) { this.done = true; return true; }
    return false;
  }
  finish() { this.chars = (this.mask || this.text).length; this.done = true; }
  get visible() { return (this.mask || this.text).slice(0, Math.floor(this.chars)); }
}

export class CallSession extends Emitter {
  constructor(o = {}) {
    super();
    this.peerName = o.peerName || 'UNKNOWN';
    this.selfName = o.selfName || 'YOU';
    this.channel = o.channel || 'CH 1';
    this.rangeU = o.rangeU ?? 0;
    this.msPerUnit = o.msPerUnit ?? 2;
    this.quality = o.quality ?? 1;
    this.script = o.script || { start: null, nodes: {} };
    this.provider = o.provider || null;
    this.providerTimeoutMs = o.providerTimeoutMs ?? 4000;
    this.ringTimeoutMs = o.ringTimeoutMs ?? 15000;
    this.replyTimeoutMs = o.replyTimeoutMs ?? 0;
    this.seed = o.seed ?? 1337;
    this.live = !!o.live;
    this.hostile = !!o.hostile;
    this.peer = o.peer ?? null;
    this.kind = o.kind || (this.live ? 'peer' : 'npc');
    this.peerAnswerMs = o.answerMs;
    this.talkNode = o.talkNode ?? null;

    this.state = CallState.IDLE;
    this.lines = [];
    this.options = [];
    this.elapsedMs = 0;
    this.ringMs = 0;
    this.peerTyping = false;
    this._queue = [];
    this._clock = 0;
    this._node = null;
    this._rnd = mulberry(this.seed);
  }

  get lagMs() { return this.rangeU * this.msPerUnit; }
  get isRinging() { return this.state === CallState.RINGING_IN || this.state === CallState.RINGING_OUT; }
  get isLive() { return this.state === CallState.ACTIVE || this.state === CallState.CONNECTING; }
  get active() { return this.state === CallState.ACTIVE; }

  _set(state) {
    if (this.state === state) return;
    this.state = state;
    this.emit('state', state);
  }
  _at(delayMs, fn) { this._queue.push({ at: this._clock + Math.max(0, delayMs), fn }); }

  hail({ incoming = true } = {}) {
    this.ringMs = 0;
    this._set(incoming ? CallState.RINGING_IN : CallState.RINGING_OUT);
    this.emit('ring', { incoming });
    if (!incoming && !this.live) {
      this._at(this.peerAnswerMs ?? (1400 + this.lagMs * 2), () => {
        if (this.state !== CallState.RINGING_OUT) return;
        this._set(CallState.CONNECTING);
        this._at(this.lagMs + 180, () => { this._set(CallState.ACTIVE); this._enter(this.script.start); });
      });
    }
    return this;
  }

  accept() {
    if (!this.isRinging) return false;
    this._set(CallState.CONNECTING);
    this._at(this.lagMs + 180, () => {
      this._set(CallState.ACTIVE);
      if (!this.live) this._enter(this.script.start);
    });
    return true;
  }

  connect() {
    if (this.state === CallState.ACTIVE) return false;
    this._queue.length = 0;
    this._set(CallState.ACTIVE);
    return true;
  }

  receive(text, name) {
    if (!this.isLive) return null;
    return this._push('peer', name || this.peerName, String(text), this.quality);
  }

  unreachable() {
    if (this.state === CallState.CLOSED) return false;
    this._queue.length = 0;
    this.options = [];
    this._set(CallState.UNREACHABLE);
    this.emit('closed', { reason: 'unreachable' });
    return true;
  }

  reject() {
    if (!this.isRinging) return false;
    this._set(CallState.REJECTED);
    this.emit('closed', { reason: 'rejected' });
    return true;
  }

  end(reason = 'ended') {
    if (this.state === CallState.CLOSED) return false;
    this.options = [];
    this._queue.length = 0;
    this.peerTyping = false;
    this._set(CallState.CLOSED);
    this.emit('closed', { reason });
    return true;
  }

  choose(optionId) {
    if (!this.active) return false;
    const opt = this.options.find(o => o.id === optionId);
    if (!opt) return false;
    this.options = [];
    this.emit('options', this.options);
    this._push('self', this.selfName, opt.text ?? opt.label, 1);
    this.emit('choice', opt);
    if (opt.end) { this._at(this.lagMs + 400, () => this.end('ended')); return true; }
    this._at(this.lagMs + 120, () => this._enter(opt.next));
    return true;
  }

  say(text) {
    if (!this.active) return false;
    text = String(text).trim();
    if (!text) return false;
    this._push('self', this.selfName, text, 1);
    this.emit('say', text);
    if (!this.live) this._at(this.lagMs + 120, () => this._enter(this.talkNode ?? this._node?.next ?? this._node?.id));
    return true;
  }

  system(text) { this._push('sys', 'SYS', text, 1); }

  async _enter(nodeId) {
    const node = this.script.nodes?.[nodeId];
    if (!node) { this.end('ended'); return; }
    this._node = { id: nodeId, ...node };
    this.peerTyping = true;
    this.emit('typing', true);

    let text = node.text;
    let options = node.options;

    if (this.provider) {
      try {
        const res = await this._withTimeout(
          this.provider({ history: this.lines, node: this._node, session: this }),
          this.providerTimeoutMs
        );
        if (res?.text) text = res.text;
        if (res?.options) options = res.options;
      } catch {}
    }

    this.peerTyping = false;
    this.emit('typing', false);
    this._push('peer', this.peerName, text, this.quality);
    this.emit('node', this._node);

    const opts = (options || []).map((o, i) => ({
      id: o.id || `${nodeId}:${i}`,
      label: o.label,
      text: o.text || o.label,
      next: o.next,
      end: !!o.end,
      effect: o.effect || null,
      tone: o.tone || 'neutral'
    }));
    this._pendingOptions = opts;
    if (node.end) this._at(this._speakMs(text) + 600, () => this.end('ended'));
  }

  _withTimeout(p, ms) {
    return new Promise((res, rej) => {
      let done = false;
      this._at(ms, () => { if (!done) { done = true; rej(new Error('provider timeout')); } });
      Promise.resolve(p).then(v => { if (!done) { done = true; res(v); } }, e => { if (!done) { done = true; rej(e); } });
    });
  }

  _speakMs(text) { return (String(text).length / 42) * 1000; }

  _push(speaker, name, text, quality) {
    const line = new TranscriptLine({
      speaker, name, text, quality,
      cps: speaker === 'self' ? 90 : 42,
      seed: (this._rnd() * 1e9) | 0
    });
    this.lines.push(line);
    this.emit('line', line);
    return line;
  }

  skipReveal() { const l = this.lines[this.lines.length - 1]; if (l && !l.done) { l.finish(); this._flushOptions(); this.emit('update'); } }

  _flushOptions() {
    if (this._pendingOptions) {
      this.options = this._pendingOptions;
      this._pendingOptions = null;
      this._replyMs = 0;
      this.emit('options', this.options);
    }
  }

  tick(dtMs) {
    if (this.state === CallState.CLOSED || this.state === CallState.IDLE) return;
    this._clock += dtMs;

    if (this._queue.length) {
      const due = this._queue.filter(q => q.at <= this._clock);
      if (due.length) {
        this._queue = this._queue.filter(q => q.at > this._clock);
        for (const q of due) q.fn();
      }
    }

    if (this.isRinging) {
      this.ringMs += dtMs;
      if (this.ringTimeoutMs && this.ringMs >= this.ringTimeoutMs) {
        const out = this.state === CallState.RINGING_OUT;
        this._set(out ? CallState.UNREACHABLE : CallState.MISSED);
        this.emit('closed', { reason: out ? 'unreachable' : 'missed' });
      }
      return;
    }

    if (this.isLive) {
      this.elapsedMs += dtMs;
      const last = this.lines[this.lines.length - 1];
      if (last && !last.done) {
        const shown = Math.floor(last.chars);
        if (last.advance(dtMs)) this._flushOptions();
        if (last.done || Math.floor(last.chars) !== shown) this.emit('update');
      } else if (this._pendingOptions) {
        this._flushOptions();
      } else if (this.options.length && this.replyTimeoutMs) {
        this._replyMs = (this._replyMs || 0) + dtMs;
        if (this._replyMs >= this.replyTimeoutMs) {
          this._replyMs = 0;
          this.emit('reply_timeout');
        }
      }
    }
  }

  get clock() {
    const s = Math.floor(this.elapsedMs / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
}

export default CallSession;
