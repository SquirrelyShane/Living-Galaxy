import { loadSave, randomCallsign, useGameStore } from "./store.js";
import { setAudioMuted } from "./audio.js";
import { PUBLIC_ROOM } from "./bodies.js";
import { mountHud } from "./hud.js";
import { mountGame } from "./engine.js";
/* Side-effect import: deckmind registers itself on the crew pay cycle, so the
 * hands aboard live their own lives whether or not the CONSOLE is ever opened.
 * It reaches the same modules the console does; importing it here means the
 * crew do not start thinking only once you look at them. */
import "./crew/deckmind.js";
import "./addon-loader.js";
import { guard } from "./boot.js";

/* 0.3.27 — everything after the imports runs inside the guard, so a failure
 * while mounting is reported in the page rather than into a console nobody on
 * a phone is looking at. A link error in the imports above never reaches here
 * (the module does not run at all) — index.html's inline watchdog catches
 * that one and calls the same reporter. */
guard(() => {
const saved = loadSave();
useGameStore.setState({
  callsign: saved.callsign || randomCallsign(),
  scanned: saved.skies?.[PUBLIC_ROOM]?.scanned ?? [],
  beaconsGot: saved.skies?.[PUBLIC_ROOM]?.beacons ?? [],
  muted: saved.muted ?? false,
});
setAudioMuted(saved.muted ?? false);

const canvas = document.getElementById("view");
mountGame(canvas);
mountHud();
canvas.focus();
/* the watchdog stands down once the game is actually up */
globalThis.__lgBooted = true;
});
