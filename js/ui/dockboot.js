/* LIVING GALAXY — the berth, without flying the camera through the station.
 *
 * Port control's tractor pulls a hull gate → door → clamps, and the canopy is
 * bolted to the hull, so the last leg used to put the lens through the
 * station's own walls on the way to the bay (and the push out did it again in
 * reverse). The station meshes are not built to be seen from inside.
 *
 * So the canopy hands over to a transition at the door. On the way in, as the
 * hull reaches the aperture, the view dims into a boot sequence — the port's
 * systems coming up on your hull one line at a time (clamps, seal, umbilicals,
 * power, customs, deck) — while the tractor finishes the pull at five times
 * speed behind it; when the clamps close the sequence completes and fades onto
 * the station deck, whose panels boot in (css `.sd-boot`). On the way out the
 * sequence runs backwards and the canopy comes back once the hull is clear of
 * the door.
 *
 * `localStorage["lgaa.dockcine"] = "off"` turns it off (the docking smoke
 * measures the tractor path in real time).
 */

import { sim } from "../sim.js";
import { tractor } from "../stationworks.js";
import { stationById } from "../stations.js";
import { corpOfStation, standingLabel } from "../corps.js";

const DOC = globalThis.document ?? null;
export const DOCK_CINE = { rush: 5, fadeIn: 1.1, fadeOut: 0.8, settle: 1.2 };

const IN_LINES = [
  ["CLAMP ARMS", "ENGAGED"],
  ["HARD SEAL", "101.3 kPa"],
  ["UMBILICALS", "MATED"],
  ["POWER HANDOVER", "SHORE BUS"],
  ["CUSTOMS HANDSHAKE", "—"],
  ["DECK SYSTEMS", "ONLINE"],
];
const OUT_LINES = [
  ["DECK SYSTEMS", "STOWED"],
  ["POWER HANDOVER", "SHIP BUS"],
  ["UMBILICALS", "CLEAR"],
  ["CLAMP ARMS", "RELEASED"],
  ["EXIT LANE", "CLEAR"],
];

export const dockCine = { on: false, mode: null, opacity: 0, stId: null, lines: 0, doneAt: -1 };

function enabled() {
  try { return globalThis.localStorage?.getItem("lgaa.dockcine") !== "off"; } catch { return true; }
}

/** Seconds into the tractor path at which its last (pull) / first (push) leg starts / ends. */
function legMark() {
  const p = tractor.path ?? [];
  if (!p.length) return 0;
  return tractor.phase === "push" ? p[0].t : tractor.T - p[p.length - 1].t;
}

export function mountDockBoot() {
  if (!DOC) return () => {};
  const root = DOC.createElement("div");
  root.id = "dock-boot";
  root.className = "dockboot hidden";
  root.innerHTML = `<div class="db-frame"><div class="db-head"><b class="db-port">PORT</b><span class="db-sub">port link</span></div><ol class="db-lines"></ol><div class="db-bar"><i></i></div><div class="db-foot">tractor has the helm</div></div>`;
  DOC.body.appendChild(root);
  const $ = (sel) => root.querySelector(sel);
  const list = $(".db-lines");
  let built = "";
  let lastWall = performance.now();
  let deckWasOpen = false;
  /* the deck's panels come up one at a time once it opens (css .sd-boot) */
  const bootDeck = () => {
    const deck = DOC.getElementById("station-deck");
    const open = Boolean(deck && !deck.classList.contains("hidden"));
    if (open && !deckWasOpen) {
      deck.classList.remove("sd-boot"); void deck.offsetWidth; deck.classList.add("sd-boot");
      setTimeout(() => deck.classList.remove("sd-boot"), 1300);
    }
    deckWasOpen = open;
  };

  function build(mode, st) {
    const key = `${mode}:${st?.id}`;
    if (built === key) return;
    built = key;
    const co = corpOfStation(st);
    const lines = (mode === "out" ? OUT_LINES : IN_LINES).map(([a, b]) => [a, a === "CUSTOMS HANDSHAKE" ? (co ? `${co.name.toUpperCase()} · ${standingLabel(co.standing).toUpperCase()}` : "FREE PORT") : b]);
    list.replaceChildren(...lines.map(([a, b]) => {
      const li = DOC.createElement("li");
      li.innerHTML = `<span>${a}</span><em>${b}</em><s>[ .. ]</s>`;
      return li;
    }));
    $(".db-port").textContent = st?.name?.toUpperCase() ?? "PORT";
    $(".db-sub").textContent = mode === "out" ? `${st?.sector ?? ""} · departure` : `${st?.sector ?? ""} · port link`;
  }

  return function paintDockBoot() {
    bootDeck();
    const now = performance.now();
    const wall = Math.min(0.25, (now - lastWall) / 1000);
    lastWall = now;
    const ship = sim.ship;
    let want = 0, progress = 0, mode = null;
    if (enabled() && sim.phase === "play" && tractor.active && tractor.path?.length) {
      const mark = legMark();
      if (tractor.phase === "pull") {
        mode = "in";
        want = Math.min(1, Math.max(0, (tractor.t - (mark - DOCK_CINE.fadeIn)) / DOCK_CINE.fadeIn));
        progress = Math.max(0, Math.min(0.9, (tractor.t - mark) / Math.max(0.1, tractor.T - mark) * 0.9));
        tractor.rush = want >= 1 ? DOCK_CINE.rush : 1;
      } else if (tractor.phase === "push") {
        mode = "out";
        want = tractor.t < mark ? 1 : Math.max(0, 1 - (tractor.t - mark) / DOCK_CINE.fadeOut);
        progress = Math.min(1, tractor.t / Math.max(0.1, mark));
        tractor.rush = tractor.t < mark ? DOCK_CINE.rush : 1;
      }
      dockCine.stId = tractor.stId;
      dockCine.doneAt = -1;
    } else if (dockCine.mode === "in" && ship?.dockedAt) {
      /* clamps closed: finish the sequence, then let the deck through */
      mode = "in";
      if (dockCine.doneAt < 0) dockCine.doneAt = now;
      const since = (now - dockCine.doneAt) / 1000;
      progress = 1;
      want = since < DOCK_CINE.settle ? 1 : Math.max(0, 1 - (since - DOCK_CINE.settle) / DOCK_CINE.fadeOut);
      if (want <= 0) mode = null;
    }
    if (!mode) {
      dockCine.opacity = Math.max(0, dockCine.opacity - wall / DOCK_CINE.fadeOut);
      if (dockCine.opacity <= 0) { dockCine.on = false; dockCine.mode = null; root.classList.add("hidden"); return; }
      root.style.opacity = dockCine.opacity.toFixed(3);
      return;
    }
    dockCine.on = true;
    dockCine.mode = mode;
    dockCine.opacity = want;
    build(mode, stationById(dockCine.stId ?? ship?.dockedAt));
    root.classList.toggle("hidden", want <= 0.001);
    root.style.opacity = want.toFixed(3);
    const items = list.children;
    const lit = Math.floor(progress * items.length + 1e-6);
    dockCine.lines = lit;
    for (let i = 0; i < items.length; i++) {
      const li = items[i];
      const on = i < lit;
      if (li.classList.contains("on") !== on) {
        li.classList.toggle("on", on);
        li.querySelector("s").textContent = on ? "[ OK ]" : i === lit ? "[ >> ]" : "[ .. ]";
      } else if (i === lit) li.querySelector("s").textContent = (now / 250 | 0) % 2 ? "[ >> ]" : "[ >  ]";
    }
    $(".db-bar i").style.width = `${Math.round(progress * 100)}%`;
    $(".db-foot").textContent = mode === "in" ? (progress >= 1 ? "clamps closed · deck coming up" : "tractor has the helm · pulling in") : "tractor has the helm · pushing out";
  };
}
