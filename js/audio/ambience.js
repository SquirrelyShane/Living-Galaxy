import { NOTE, degree, ensureAudio } from "./graph.js";
import { heldDrone, heldAir } from "./voices.js";

const RATE = 0.25;

let layers = null;
let running = false;
let timer = null;
let ctxKind = "menu";
let target = {};
let lastBreath = 0;
let breathAt = 0;

function build() {
  if (layers) return layers;
  const k = ensureAudio();
  if (!k) return null;
  layers = {
    deep: heldDrone(NOTE.A0, { harmonics: [1, 2], gain: 0, cut: 220, space: 0.35 }),
    organ: heldDrone(NOTE.A1, { harmonics: [1, 2, 3, 5, 8], gain: 0, cut: 900, space: 0.75 }),
    fifth: heldDrone(degree(4, 1), { harmonics: [1, 2, 3], gain: 0, cut: 1400, space: 0.8 }),
    hull: heldAir({ gain: 0, freq: 260, q: 0.6, space: 0.2 }),
    room: heldAir({ gain: 0, freq: 900, q: 0.5, type: "lowpass", space: 0.15 }),
    plant: heldDrone(degree(2, 1), { harmonics: [1, 2, 4, 7], gain: 0, cut: 600, type: "triangle", space: 0.3 }),
    void: heldAir({ gain: 0, freq: 3200, q: 0.8, space: 0.9 }),
  };
  return layers;
}

const PLACES = {
  menu:     { deep: 0.072, organ: 0.0612, fifth: 0.036, hull: 0.0, room: 0.0, plant: 0.0, void: 0.0216 },
  cockpit:  { deep: 0.0702, organ: 0.0312, fifth: 0.0156, hull: 0.039, room: 0.0156, plant: 0.0234, void: 0.0172 },
  interior: { deep: 0.0518, organ: 0.0222, fifth: 0.0074, hull: 0.0, room: 0.0666, plant: 0.037, void: 0.0 },
  docked:   { deep: 0.0592, organ: 0.0259, fifth: 0.0148, hull: 0.0074, room: 0.0444, plant: 0.0666, void: 0.0059 },
  belt:     { deep: 0.0546, organ: 0.0234, fifth: 0.0312, hull: 0.0312, room: 0.0, plant: 0.0156, void: 0.0429 },
  warp:     { deep: 0.144, organ: 0.054, fifth: 0.0432, hull: 0.0936, room: 0.0, plant: 0.0144, void: 0.0288 },
  combat:   { deep: 0.1258, organ: 0.0148, fifth: 0.0, hull: 0.0518, room: 0.0, plant: 0.0296, void: 0.0148 },
  well:     { deep: 0.1178, organ: 0.0496, fifth: 0.0434, hull: 0.0248, room: 0.0, plant: 0.0124, void: 0.0186 },
};

export const PLACE_IDS = Object.keys(PLACES);

export function placeFor(state = {}) {
  if (state.phase === "menu") return "menu";
  if (state.interior) return "interior";
  if (state.docked) return "docked";
  if (state.warp) return "warp";
  if (state.combat) return "combat";
  if (state.wellDepth > 0.55) return "well";
  if (state.inBelt) return "belt";
  return "cockpit";
}

export function updateAmbience(state = {}, dt = 0) {
  if (!running) return;
  const L = build();
  if (!L) return;

  breathAt += dt;
  if (breathAt < RATE) return;
  const step = breathAt;
  breathAt = 0;

  const place = placeFor(state);
  const base = PLACES[place] ?? PLACES.cockpit;
  if (place !== ctxKind) {
    ctxKind = place;
    target = { ...base };
  }

  const speed = Math.max(0, Math.min(1, (state.speed ?? 0) / 260));
  const well = Math.max(0, Math.min(1, state.wellDepth ?? 0));
  const charge = Math.max(0, Math.min(1, state.charge ?? 1));
  const alarm = Math.max(0, Math.min(1, state.alarm ?? 0));

  const want = {
    deep: base.deep * (1 + well * 0.75 + alarm * 0.35),
    organ: base.organ * (1 - alarm * 0.55),
    fifth: base.fifth * (1 - alarm * 0.8),
    hull: base.hull + speed * 0.09,
    room: base.room,
    plant: base.plant * (0.45 + charge * 0.75),
    void: base.void * (1 - well * 0.5),
  };

  const ms = place === "warp" || place === "combat" ? 450 : 1400;
  for (const key of Object.keys(want)) L[key]?.set(want[key], ms);

  L.deep?.freq(NOTE.A0 * (1 - well * 0.22), 2200);
  L.organ?.freq(NOTE.A1 * (1 - well * 0.16), 2600);
  L.hull?.cutoff(220 + speed * 900, 900);
  L.void?.cutoff(2600 + (1 - well) * 1800, 2400);

  lastBreath += step;
  const quiet = place === "menu" || place === "cockpit" || place === "belt" || place === "well";
  if (quiet && lastBreath > 26) {
    lastBreath = 0;
    const notes = [degree(4, 1), degree(2, 1), degree(6, 1), degree(3, 1)];
    L.fifth?.freq(notes[Math.floor(Math.random() * notes.length)], 9000);
  } else if (!quiet) {
    lastBreath = 0;
  }
}

export function startAmbience() {
  if (running) return;
  if (!build()) return;
  running = true;
  ctxKind = "";
  breathAt = RATE;
}

export function stopAmbience(ms = 900) {
  running = false;
  if (!layers) return;
  for (const l of Object.values(layers)) l?.set(0, ms);
}

export function disposeAmbience() {
  running = false;
  if (timer) { clearInterval(timer); timer = null; }
  if (layers) for (const l of Object.values(layers)) l?.stop(300);
  layers = null;
  ctxKind = "menu";
}

export const ambience = {
  get running() { return running; },
  get place() { return ctxKind; },
  set(place) {
    if (!PLACES[place]) return false;
    startAmbience();
    ctxKind = place;
    const L = build();
    if (!L) return false;
    for (const key of Object.keys(PLACES[place])) L[key]?.set(PLACES[place][key], 700);
    return true;
  },
  levels() { return PLACES[ctxKind] ? { ...PLACES[ctxKind] } : null; },
};
