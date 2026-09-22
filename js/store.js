import { BEACONS, PUBLIC_ROOM, surveyIds } from "./bodies.js";

const SAVE_KEY = "lgaa-save-v1";
const SAVE_KEY_V1 = "lgaa-save-v0";
const listeners = new Set();

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === 2) {
        return {
          callsign: parsed.callsign,
          muted: parsed.muted,
          skies: parsed.skies ?? {},
        };
      }
    }
    const v1raw = localStorage.getItem(SAVE_KEY_V1);
    if (v1raw) {
      const v1 = JSON.parse(v1raw);
      return {
        callsign: v1.callsign,
        muted: v1.muted,
        skies: {
          [PUBLIC_ROOM]: { scanned: v1.scanned ?? [], beacons: v1.beacons ?? [] },
        },
      };
    }
  } catch {
    /* ignore */
  }
  return { skies: {} };
}

export function skyProgress(seed) {
  return loadSave().skies[seed] ?? { scanned: [], beacons: [], terraform: {}, terraBonds: [] };
}

export function randomCallsign() {
  const n = Math.floor(10 + Math.random() * 89);
  const names = ["Vesper", "Kepler", "Nyx", "Helion", "Icarus", "Sable", "Orion", "Lumen"];
  return `${names[Math.floor(Math.random() * names.length)]}-${n}`;
}

function notify() {
  for (const fn of listeners) fn(state);
}

const state = {
  phase: "menu",
  callsign: "Pilot",
  room: PUBLIC_ROOM,
  isPublic: true,
  systemName: "Sol",
  speed: 0,
  closing: 0,
  throttle: 0,
  boost: false,
  /* cockpit instrumentation */
  charge: 1600,
  chargePct: 1,
  load: 0,
  reactor: 130,
  hull: 100,
  shieldCharge: 100,
  o2: 100,
  gLoad: 0,
  debuffs: [],
  brownout: false,
  systems: {
    engines: true,
    shields: true,
    turrets: true,
    pressurized: true,
    gravity: true,
    assist: true,
  },
  powered: {
    engines: true,
    shields: true,
    turrets: true,
    mining: true,
    gravity: true,
    lifeSupport: true,
    overdrive: true,
  },
  throttleCap: 1.4,
  lights: false,
  sentry: true,
  salvage: false,
  matchLock: false,
  pulse: false,
  pulseLeft: 0,
  debris: 0,
  impactors: 0,
  threat: null,
  lockName: null,
  lockProgress: 0,
  locked: false,
  lockDist: 0,
  holding: false,
  credits: 2500,
  dockedAt: null,
  port: null,
  terminalOpen: false,
  termHold: false,
  waypointName: null,
  waypointDist: 0,
  strain: 0,
  turretMode: "castle",
  miningMode: "off",
  targetName: null,
  targetHostile: false,
  contacts: 0,
  miningActive: false,
  miningProgress: 0,
  cargo: 0,
  cargoCap: 400,
  dominantName: null,
  dominantG: 0,
  altitude: 0,
  escapeV: 0,
  nearest: "earth",
  nearestDist: 0,
  selected: "earth",
  scanned: [],
  beaconsGot: [],
  beaconTotal: BEACONS.length,
  surveyTotal: surveyIds().length,
  timeScale: 1,
  labels: [],
  response: null,   // the live distress clock (npc/security.js)
  peers: [],
  joined: false,
  toast: null,
  muted: false,
  mapOpen: false,
  surveyComplete: false,
  warping: false,
  warpState: "idle",
  warpProgress: 0,
  warpBlock: "",
  route: null,
  flash: 0,
  noticeAbout: null,
  terraform: {},
  terraBonds: [],
  warpCool: 0,
  heat: 0,
  bodyPlots: [],
  shipXZ: { x: 0, z: 0 },
  notice: "Survey the system. Fly close and scan.",
  noticeAge: 0,
  setCallsign(v) {
    state.callsign = String(v).slice(0, 18);
    notify();
  },
  setRoom(v, isPublic) {
    state.room = v;
    state.isPublic = isPublic;
    notify();
  },
  setPhase(phase) {
    state.phase = phase;
    notify();
  },
  setMuted(muted) {
    state.muted = muted;
    state.persist();
    notify();
  },
  setMapOpen(mapOpen) {
    state.mapOpen = mapOpen;
    notify();
  },
  setToast(toast) {
    state.toast = toast;
    notify();
  },
  patchHud(p) {
    Object.assign(state, p);
    notify();
  },
  persist() {
    const prev = loadSave();
    const blob = {
      version: 2,
      callsign: state.callsign,
      muted: state.muted,
      skies: {
        ...prev.skies,
        [state.room]: { scanned: state.scanned, beacons: state.beaconsGot, terraform: state.terraform ?? {}, terraBonds: state.terraBonds ?? [] },
      },
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(blob));
    } catch {
      /* quota */
    }
  },
};

export const useGameStore = Object.assign(
  (selector) => selector(state),
  {
    getState: () => state,
    setState(partial) {
      const next = typeof partial === "function" ? partial(state) : partial;
      Object.assign(state, next);
      notify();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  },
);
