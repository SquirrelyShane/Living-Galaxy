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
import { mountAccount } from "./account.js";
import { flushCompany } from "./company.js";
import { sim, persistNow } from "./sim.js";
import { pilot, title } from "./pilot.js";

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
/* 0.3.40 — the account: probes for living-galaxy.com behind this origin and,
 * when it is there, keeps the pilot's storage namespace synced to it. Wired
 * last so its hidden-tab flush runs after every module's own. */
mountAccount({
  meta: () => { const s = useGameStore.getState(); return { callsign: s.callsign, career: pilot.character ? title() : pilot.complexId, sky: s.room, credits: (sim.ship?.credits ?? 0) }; },
  flushers: [flushCompany, persistNow],
});
/* 0.3.41 — the wallet and the survey log are written when the tab goes to
 * the background, on every host: the account flush above only runs with a
 * site behind the origin, and a phone switching apps is the common case. */
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") persistNow(); });
window.addEventListener("pagehide", () => persistNow());
/* the watchdog stands down once the game is actually up */
globalThis.__lgBooted = true;
});
