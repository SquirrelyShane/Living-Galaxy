// Living Galaxy — station geometry, built from a Station Forge layout.
//
// Two builds of the same graph:
//
//   proxy(layout)     one slab per deck plus a spine and the docking arms — six or seven
//                     meshes, the silhouette you see from across the system.
//   interior(layout)  every compartment as real geometry, ~120 meshes, only worth paying
//                     for when the station fills the screen.
//
// world/system.js swaps between them through the LOD registry, so a station that is four
// pixels wide costs four pixels' worth of geometry. Materials are cached per category and
// shared across every station in the system: one MeshStandardMaterial per category, not
// one per room, which is the difference between ~1300 materials and eleven.
//
// Everything here is in layout metres. The caller scales the returned group so the
// station's on-screen size matches the radius the rest of the game already tunes against
// (docking range, approach standoff, scanner bands) — geometry changed, gameplay did not.

import { CATS, ROOM_H, DECK_H } from './station-forge.js';

const hexNum = h => parseInt(String(h).replace('#', ''), 16);

// ── shared materials ─────────────────────────────────────────────────
// Keyed by category + variant. Cleared only when the whole system is rebuilt.
const matCache = new Map();

function catMaterial(cat, variant) {
  const key = cat + '|' + variant;
  let m = matCache.get(key);
  if (m) return m;
  const col = hexNum((CATS[cat] || CATS.transit).hex);
  if (variant === 'breached') {
    m = new THREE.MeshBasicMaterial({ color: 0x46506a, wireframe: true, transparent: true, opacity: 0.4 });
  } else if (variant === 'struct') {
    m = new THREE.MeshStandardMaterial({ color: 0x1d4a63, metalness: 0.62, roughness: 0.44 });
  } else {
    m = new THREE.MeshStandardMaterial({
      color: col, metalness: 0.5, roughness: 0.42,
      emissive: col, emissiveIntensity: 0.10
    });
  }
  matCache.set(key, m);
  return m;
}

function hullMaterial(color) {
  const key = 'hull|' + color;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, metalness: 0.68, roughness: 0.36 });
    matCache.set(key, m);
  }
  return m;
}

/** Drop the shared material cache — called when the system is torn down and rebuilt. */
export function resetStationMaterials() {
  matCache.forEach(m => m.dispose && m.dispose());
  matCache.clear();
}

// ── geometry per module ──────────────────────────────────────────────

function arcGeometry(m, h) {
  const shape = new THREE.Shape();
  const cx = m.arcCentre.x, cz = m.arcCentre.z;
  const r0 = m.r - m.d / 2, r1 = m.r + m.d / 2;
  const ccw = m.th1 < m.th0;
  shape.absarc(cx, cz, r1, m.th0, m.th1, ccw);
  shape.absarc(cx, cz, r0, m.th1, m.th0, !ccw);
  // Ten curve segments, not sixteen: a corridor five metres wide does not repay the
  // extra triangles, and there are a dozen of these per station.
  const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 10 });
  g.rotateX(Math.PI / 2);
  g.translate(0, h / 2, 0);
  return g;
}

function moduleGeometry(m, h) {
  if (m.shape === 'arc') return arcGeometry(m, h);
  if (m.shape === 'round') return new THREE.CylinderGeometry(m.w / 2, m.w / 2, h, 12);
  if (m.shape === 'oct') {
    const g = new THREE.CylinderGeometry(m.w / 2, m.w / 2, h, 8);
    g.rotateY(Math.PI / 8);
    g.scale(1, 1, m.d / m.w);
    return g;
  }
  return new THREE.BoxGeometry(m.w, h, m.d);
}

// ── the full deck plan ───────────────────────────────────────────────

/**
 * Every compartment as geometry. Returns a Group whose children carry
 * `userData.roomId`, so a pick, a boarding action or a mission marker can name the
 * compartment it hit.
 */
export function buildInterior(layout) {
  const g = new THREE.Group();
  g.name = 'station-interior';

  for (const m of layout.modules) {
    const deck = layout.decks[m.deck];
    if (!deck) continue;
    const h = m.kind === 'room' ? ROOM_H : (m.cap ? ROOM_H * 0.7 : ROOM_H * 0.62);
    const mat = m.breached ? catMaterial('void', 'breached')
              : (m.structural && m.kind !== 'room') ? catMaterial(m.cat, 'struct')
              : catMaterial(m.cat, 'room');

    const mesh = new THREE.Mesh(moduleGeometry(m, h), mat);
    mesh.position.set(m.x, deck.y + h / 2 + 0.4, m.z);
    mesh.rotation.y = -m.rot;
    mesh.userData.roomId = m.id;
    mesh.userData.roomName = m.name;
    g.add(mesh);
  }

  // Elevator shafts: anything flagged spansDecks that stacks with a twin above or below.
  const stacks = {};
  layout.modules.filter(m => m.spansDecks).forEach(m => {
    const k = Math.round(m.x) + '/' + Math.round(m.z);
    (stacks[k] = stacks[k] || []).push(m);
  });
  for (const list of Object.values(stacks)) {
    if (list.length < 2) continue;
    const ys = list.map(m => layout.decks[m.deck].y);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 2.8, (y1 - y0) + DECK_H * 0.4, 8, 1, true),
      catMaterial('transit', 'struct'));
    shaft.position.set(list[0].x, (y0 + y1) / 2, list[0].z);
    g.add(shaft);
  }

  return g;
}

// ── the distant silhouette ───────────────────────────────────────────

/**
 * A cheap stand-in: one slab per deck sized to that deck's own footprint, a spine through
 * the stack, and a nub for each docking arm so the shape still reads as the same station
 * from far away. Six to ten meshes regardless of how many compartments the layout has.
 */
export function buildProxy(layout, color) {
  const g = new THREE.Group();
  g.name = 'station-proxy';
  const hull = hullMaterial(color);

  layout.decks.forEach(dk => {
    let r = 0;
    for (const m of layout.modules) {
      if (m.deck !== dk.index) continue;
      r = Math.max(r, Math.hypot(m.x, m.z) + m.span * 0.5);
    }
    if (r < 1) return;
    const slab = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.82, r * 0.82, ROOM_H * 1.6, 8), hull);
    slab.rotation.y = Math.PI / 8;
    slab.position.y = dk.y;
    g.add(slab);
  });

  const spanY = Math.max(DECK_H, (layout.decks.length - 1) * DECK_H + DECK_H);
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(layout.bounds.r * 0.10, layout.bounds.r * 0.10, spanY, 8), hull);
  g.add(spine);

  // Docking arms are what a pilot actually aims at, so they survive into the proxy.
  for (const m of layout.modules) {
    if (m.key !== 'dock-arm') continue;
    const deck = layout.decks[m.deck];
    if (!deck) continue;
    const nub = new THREE.Mesh(new THREE.BoxGeometry(m.w, ROOM_H, m.d), catMaterial('docking', 'room'));
    nub.position.set(m.x, deck.y, m.z);
    nub.rotation.y = -m.rot;
    g.add(nub);
  }

  return g;
}

// ── teardown ─────────────────────────────────────────────────────────

/**
 * Dispose a built group's geometry and drop it from its parent. Materials are shared and
 * deliberately left alone — the next station to come into range wants them.
 */
export function disposeGroup(group) {
  if (!group) return;
  group.traverse(o => { if (o.geometry && o.geometry.dispose) o.geometry.dispose(); });
  if (group.parent) group.parent.remove(group);
  group.clear ? group.clear() : (group.children.length = 0);
}

/**
 * World-space berths, in layout metres, one per docking arm: where a ship physically
 * parks and which way it faces. Approach and traffic control can use these instead of
 * pretending every station is a sphere.
 */
export function berthsOf(layout) {
  const out = [];
  for (const m of layout.modules) {
    if (m.key !== 'dock-arm') continue;
    const deck = layout.decks[m.deck];
    if (!deck) continue;
    // The arm's single port faces back into the station, so the berth faces the far way.
    const facing = m.ports && m.ports[0] ? m.ports[0].a + Math.PI : m.rot;
    out.push({ id: m.id, name: m.name, deck: m.deck, x: m.x, y: deck.y, z: m.z, facing });
  }
  return out;
}
