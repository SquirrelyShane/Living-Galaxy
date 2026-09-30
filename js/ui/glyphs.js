const BRAILLE = "⠁⠃⠇⠏⠟⠿⡿⣿⢸⡇⠶⠭⠪⠵⠳⠞⠜⠚⠙⠓⠋⠑⠡⠨⠰⠸⠴⠦⠖⠲⠺⠾⠽⠼⠻⠷⠯⠧⠗⠗⠝⠍⠉⠅";
const GEO = "◇◈◆▢▣◫◧◨◩◪◬◭◮○◌◍◎●◐◑◒◓◔◕▲△▴▵▷▹▸▻▼▽▾▿◁◃◂◅";
const BOX = "╱╲╳═║╬╪╫╠╣╦╩┼┿╂┃━┏┓┗┛┣┫┳┻";
export const ALPHABETS = { braille: BRAILLE, geo: GEO, box: BOX, all: BRAILLE + GEO + BOX };

export function mulberry(seedStr) {
  let n = 0;
  const s0 = String(seedStr);
  for (let i = 0; i < s0.length; i++) n = Math.imul(n ^ s0.charCodeAt(i), 2654435761) >>> 0;
  let s = n || 7;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickFrom(alpha, rnd) {
  const cps = [...alpha];
  return cps[Math.floor(rnd() * cps.length)];
}

export function glyphString(seed, n = 12, alpha = "all") {
  const rnd = mulberry(`glyph:${seed}`);
  const a = ALPHABETS[alpha] ?? ALPHABETS.all;
  let out = "";
  for (let i = 0; i < n; i++) out += pickFrom(a, rnd);
  return out;
}

export function sigil(seed) {
  const rnd = mulberry(`sigil:${seed}`);
  const n = 3 + (rnd() < 0.4 ? 1 : 0);
  const blocks = ["braille", "geo", "box", "braille"];
  let out = "";
  for (let i = 0; i < n; i++) out += pickFrom(ALPHABETS[blocks[Math.floor(rnd() * blocks.length)]], rnd);
  return out;
}

const CELLS_DEFAULT = 18;

export function glyphBar(host, spec = {}) {
  const cells = spec.cells ?? CELLS_DEFAULT;
  const alpha = ALPHABETS[spec.alpha] ?? ALPHABETS.all;
  const seed = spec.seed ?? spec.label ?? "bar";
  const glyphs = [...glyphString(seed, cells, spec.alpha ?? "all")];
  host.classList.add("gbar");
  if (spec.tone) host.dataset.tone = spec.tone;
  host.innerHTML = "";
  const head = document.createElement("div");
  head.className = "gbar-head";
  const lab = document.createElement("span");
  lab.className = "gbar-label";
  lab.textContent = spec.label ?? "";
  const val = document.createElement("span");
  val.className = "gbar-val";
  head.append(lab, val);
  const track = document.createElement("div");
  track.className = "gbar-track";
  const spans = [];
  for (let i = 0; i < cells; i++) {
    const s = document.createElement("span");
    s.className = "gcell";
    s.textContent = glyphs[i];
    track.append(s);
    spans.push(s);
  }
  host.append(head, track);

  const fmt = spec.format ?? ((v) => `${Math.round(v * 100)}`);
  let shown = spec.from ?? 0;
  let target = spec.value ?? 0;
  let raf = 0;
  const flick = mulberry(`flick:${seed}`);

  function paint(v, settling) {
    const lit = Math.round(v * cells);
    for (let i = 0; i < cells; i++) {
      const on = i < lit;
      spans[i].classList.toggle("lit", on);
      const lead = settling && i === lit && lit < cells;
      spans[i].classList.toggle("lead", lead);
      if (lead) spans[i].textContent = pickFrom(alpha, flick);
      else if (spans[i].textContent !== glyphs[i]) spans[i].textContent = glyphs[i];
    }
    val.textContent = fmt(v);
    host.style.setProperty("--fill", v.toFixed(3));
  }

  function step() {
    const d = target - shown;
    if (Math.abs(d) < 0.004) {
      shown = target;
      paint(shown, false);
      raf = 0;
      return;
    }
    shown += d * 0.14 + Math.sign(d) * 0.002;
    paint(shown, true);
    raf = requestAnimationFrame(step);
  }

  function set(v, animate = true) {
    target = Math.max(0, Math.min(1, v ?? 0));
    if (!animate || typeof requestAnimationFrame !== "function") {
      shown = target;
      paint(shown, false);
      return;
    }
    if (!raf) raf = requestAnimationFrame(step);
  }

  if (spec.animate === false) set(target, false);
  else { paint(shown, true); set(target, true); }
  return { set, el: host, sigil: sigil(seed) };
}

export function compileBlock(host, { title = "COMPILING RECORD", seed = "rec", rows = [], stagger = 90 } = {}) {
  host.classList.add("compile");
  host.innerHTML = "";
  const h = document.createElement("div");
  h.className = "compile-head";
  h.innerHTML = `<span class="compile-title"></span><span class="compile-sigil"></span>`;
  h.querySelector(".compile-title").textContent = title;
  host.append(h);
  const handles = [];
  const sig = h.querySelector(".compile-sigil");
  const flick = mulberry(`sig:${seed}`);
  let i = 0;
  for (const r of rows) {
    const d = document.createElement("div");
    host.append(d);
    const hd = glyphBar(d, { ...r, seed: r.seed ?? `${seed}:${r.label}`, value: 0, animate: false });
    handles.push(hd);
    const v = r.value;
    if (typeof setTimeout === "function") setTimeout(() => hd.set(v, true), stagger * i++);
    else hd.set(v, false);
  }
  const final = sigil(seed);
  let ticks = 0;
  const total = Math.max(6, rows.length * (stagger / 60) + 10);
  const done = new Promise((resolve) => {
    function spin() {
      ticks++;
      if (ticks >= total || typeof requestAnimationFrame !== "function") {
        sig.textContent = final;
        sig.classList.add("set");
        resolve(final);
        return;
      }
      let s = "";
      for (let k = 0; k < final.length; k++) s += pickFrom(ALPHABETS.all, flick);
      sig.textContent = s;
      requestAnimationFrame(() => setTimeout(spin, 40));
    }
    spin();
  });
  return { el: host, handles, done, sigil: final };
}
