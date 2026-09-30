import { loadSave, randomCallsign, useGameStore } from "./core/store.js";
import { setAudioMuted } from "./audio/index.js";
import { PUBLIC_ROOM } from "./world/bodies.js";
import { mountHud } from "./ui/hud.js";
import { mountGame } from "./render/engine.js";
import "./crew/deckmind.js";
import "./core/addon-loader.js";
import { guard } from "./core/boot.js";
import { mountAccount } from "./net/account.js";
import { flushCompany } from "./corp/company.js";
import { sim, persistNow } from "./sim/sim.js";
import { pilot, title } from "./flight/pilot.js";

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
mountAccount({
  meta: () => { const s = useGameStore.getState(); return { callsign: s.callsign, career: pilot.character ? title() : pilot.complexId, sky: s.room, credits: (sim.ship?.credits ?? 0) }; },
  flushers: [flushCompany, persistNow],
});
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") persistNow(); });
window.addEventListener("pagehide", () => persistNow());
globalThis.__lgBooted = true;
});
