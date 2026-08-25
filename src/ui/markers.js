// Living Galaxy — contact brackets on the canopy.
//
// ## The gap this fills
//
// A belt rock is 3 to 20 units across. The rocks in a field sit roughly 700 units apart,
// because a belt is a band tens of thousands of units around and a few thousand wide, and
// three hundred rocks spread over that is a *sparse* place — which is correct, and is what
// a real belt is like, and is also why flying into one looked like flying into nothing.
// At six hundred metres a ten-unit rock is a couple of pixels of dark grey against black.
//
// So the chart showed a field, the telemetry pane listed it, and out of the canopy there
// was nothing to fly at. The rocks were there the whole time. Nothing pointed at them.
//
// Brackets are the answer every space sim reaches for eventually, and they are the right
// one here for a reason specific to this project: **the sensor already knows**. The contact
// list is computed once in `systems/flight/contacts.js`; this file projects that same list
// onto the screen. It cannot show you something the chart does not, and it cannot miss
// something the chart has, because there is only one list.
//
// ## Why this is a canvas and not DOM nodes
//
// Forty contacts is forty absolutely-positioned nodes, restyled every frame. The HUD has a
// whole write-budget apparatus (see `ui/hud.js`) because DOM writes at frame rate are the
// most expensive thing on a phone in this project. A single canvas is one element, and the
// draw is forty `strokeRect` calls.
//
// ## Why the tap handling lives in `ui/controls.js`
//
// The canvas is `pointer-events: none`. A full-screen overlay that accepts pointers would
// eat every steering drag, and the fix for that — hit-testing on the overlay and forwarding
// misses to the canopy — is a worse version of what the canopy already does. So the canopy
// keeps the pointer, and on a tap that did not turn into a drag it asks `pickMarker()`
// whether anything was under the finger. Drag to steer, tap to lock, one pointer path.

import { S } from '../core/state.js';
import { camera } from '../world/scene.js';
import { $, fmtKm } from '../core/utils.js';
import { contacts } from '../systems/flight/contacts.js';
import { canPilot } from '../systems/company/career.js';

/** Total brackets drawn. A budget, not a sensor rule — the list itself is not truncated. */
const MAX_MARKERS = 36;
/** How many rocks may take part. Rocks are the many; ships and berths are the few. */
const MAX_ROCKS = 22;
/** How many carry a name and a range. Beyond this they are a bracket and nothing else. */
const LABELLED = 10;
/** Finger radius, in CSS pixels, for `pickMarker`. */
export const PICK_RADIUS = 34;

/**
 * Angular size above which a thing does not need a bracket, in radians-ish (radius over
 * distance). A gas giant filling a third of the canopy does not need to be pointed at; a
 * station you are docking with does not either. Rocks never reach this, which is the point.
 */
const OBVIOUS = 0.06;

const KIND_COLOUR = {
  asteroid: 'rgba(220,190,120,',
  station:  'rgba(150,200,255,',
  planet:   'rgba(126,200,255,',
  moon:     'rgba(126,200,255,',
  star:     'rgba(255,220,112,',
  lagrange: 'rgba(170,140,255,',
  pilot:    'rgba(120,255,170,'
};
const FACTION_COLOUR = {
  hostile:  'rgba(255,90,60,',
  friendly: 'rgba(110,200,255,',
  merc:     'rgba(255,238,85,',
  worker:   'rgba(150,220,150,'
};

let canvas = null, ctx = null, dpr = 1;
let placed = [];          // { x, y, contact } in CSS pixels — what `pickMarker` searches
let t = 0;

export function initMarkers() {
  canvas = $('contact-markers');
  if (!canvas || !canvas.getContext) { canvas = null; return; }
  ctx = canvas.getContext('2d');
  resize();
  addEventListener('resize', resize);
}

function resize() {
  if (!canvas) return;
  dpr = Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, 2);
  canvas.width = Math.max(1, Math.floor(innerWidth * dpr));
  canvas.height = Math.max(1, Math.floor(innerHeight * dpr));
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/** Nothing to bracket when there is no canopy to bracket it on. */
function suppressed() {
  return !S.running || S.docked || !canPilot() || S.warp.state === 'warping' ||
         !!S.settings.hideMarkers;
}

const _v = new THREE.Vector3();

/**
 * Redraw. Called once per rendered frame from the UI phase, but only actually redrawn at
 * 30 Hz — a bracket moving at orbital speed does not need sixty updates a second, and the
 * projection maths is the expensive half.
 */
export function updateMarkers(dt) {
  if (!ctx) return;
  t += dt || 0;
  if (t < 1 / 30) return;
  t = 0;

  ctx.clearRect(0, 0, innerWidth, innerHeight);
  placed = [];
  if (suppressed() || !camera) return;

  const list = choose();
  ctx.lineWidth = 1;
  ctx.font = '9px ui-monospace,monospace';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    const pos = c.obj && c.obj.position;
    if (!pos) continue;

    // Behind the camera or off the edge. `project` puts NDC z past 1 for anything behind
    // the near plane, which is the only reliable test — a point behind you still lands
    // inside the x/y box, mirrored, and would be drawn on the wrong side of the screen.
    _v.copy(pos).project(camera);
    if (_v.z > 1 || Math.abs(_v.x) > 1 || Math.abs(_v.y) > 1) continue;

    const x = (_v.x * 0.5 + 0.5) * innerWidth;
    const y = (-_v.y * 0.5 + 0.5) * innerHeight;

    // Bracket size follows the object, floored so a rock is always a finger-sized thing to
    // aim at and capped so a nearby station does not draw a bracket the size of the screen.
    const radius = radiusOf(c);
    const ang = radius / Math.max(c.d, 1);
    if (ang > OBVIOUS && c.kind !== 'asteroid') continue;   // you can already see it
    const half = Math.max(7, Math.min(26, ang * innerHeight * 0.6));

    // Ownership wins over faction for colour, because it is the more actionable fact: a
    // worker hull is a worker hull, and whether it is *yours* is what decides whether you
    // are about to make an expensive mistake with the fire button.
    const owned = c.own && c.own !== 'none' && c.own !== 'corp';
    const base = owned ? c.ownColour
               : FACTION_COLOUR[c.faction] || KIND_COLOUR[c.kind] || 'rgba(190,220,245,';
    const locked = !!(S.target && S.target.obj === c.obj);
    const alpha = locked ? 0.95 : c.kind === 'asteroid' ? 0.55 : 0.7;

    ctx.strokeStyle = base + alpha + ')';
    corners(x, y, half);
    // A second bracket outside the first for anything with an owner. Shape rather than only
    // colour, so it survives being looked at on a phone in sunlight and does not depend on
    // the player having learned a palette.
    if (owned || c.own === 'corp') {
      ctx.strokeStyle = base + (alpha * 0.45) + ')';
      corners(x, y, half + 4);
    }

    // A rock with nothing left in it is drawn hollow — still a landmark, visibly not worth
    // the trip. Without this a worked-out field looks exactly like a fresh one.
    if (c.kind === 'asteroid' && !c.spent) {
      ctx.fillStyle = base + (alpha * 0.5) + ')';
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }

    if (i < LABELLED) {
      ctx.fillStyle = base + (alpha * 0.85) + ')';
      ctx.fillText(c.name, x + half + 4, y - 4);
      ctx.fillStyle = base + (alpha * 0.5) + ')';
      // The operator's name beside the range. "Bulk Hauler · 1.4 Mm" told you nothing about
      // who you were looking at; "Bulk Hauler · 1.4 Mm · Kestrel" is the difference between
      // a target and a client.
      ctx.fillText(fmtKm(c.d) + (c.owner ? ' · ' + c.owner : ''), x + half + 4, y + 6);
    }

    placed.push({ x, y, contact: c });
  }
}

/** Four corner ticks rather than a box — a box hides the thing it is pointing at. */
function corners(x, y, h) {
  const k = Math.max(3, h * 0.42);
  ctx.beginPath();
  ctx.moveTo(x - h, y - h + k); ctx.lineTo(x - h, y - h); ctx.lineTo(x - h + k, y - h);
  ctx.moveTo(x + h - k, y - h); ctx.lineTo(x + h, y - h); ctx.lineTo(x + h, y - h + k);
  ctx.moveTo(x + h, y + h - k); ctx.lineTo(x + h, y + h); ctx.lineTo(x + h - k, y + h);
  ctx.moveTo(x - h + k, y + h); ctx.lineTo(x - h, y + h); ctx.lineTo(x - h, y + h - k);
  ctx.stroke();
}

function radiusOf(c) {
  if (c.kind === 'asteroid') return c.obj.radius || 6;
  const u = c.obj.userData || {};
  return u.radius || u.size || 12;
}

/**
 * Which contacts get a bracket.
 *
 * Not simply "the nearest thirty-six". A belt puts forty rocks inside sensor range, and a
 * straight distance cut would spend the whole budget on gravel and hide the raider closing
 * behind it. Ships, berths and places are never crowded out; rocks get what is left, up to
 * their own cap.
 */
function choose() {
  const all = contacts();
  const rocks = [];
  const rest = [];
  for (const c of all) {
    if (c.kind === 'belt') continue;              // a band, not a point — the chart draws it
    if (c.kind === 'asteroid') rocks.push(c);
    else rest.push(c);
  }
  const keepRocks = Math.min(MAX_ROCKS, Math.max(0, MAX_MARKERS - rest.length));
  return rest.slice(0, MAX_MARKERS - keepRocks).concat(rocks.slice(0, keepRocks))
             .sort((a, b) => a.d - b.d);
}

/**
 * What is under a finger at (x, y), in CSS pixels, or null.
 *
 * Reads the *drawn* positions rather than re-projecting, so the thing you tap is the thing
 * you saw. Re-projecting would be a frame out of date at best and disagree with the screen
 * at worst, which is the sort of near-miss that reads as a broken tap target.
 */
export function pickMarker(x, y) {
  let best = null, bd = PICK_RADIUS * PICK_RADIUS;
  for (const m of placed) {
    const d = (m.x - x) ** 2 + (m.y - y) ** 2;
    if (d < bd) { bd = d; best = m.contact; }
  }
  return best;
}

/** What is currently bracketed. For the suite, and for anything that wants to assert it. */
export const markerCount = () => placed.length;
