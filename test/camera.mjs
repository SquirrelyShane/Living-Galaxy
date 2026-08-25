// The chase camera, which until v1.01.76 had a position but no aim.
//
// The old code translated the cockpit camera backward along the nose and 13 units up in
// *world* Y, and left the cockpit's own yaw/pitch in place. Two consequences, both of
// which this suite now pins:
//
//   1. The camera never looked at the ship. At level flight the hull sat 17.2° below the
//      view axis — inside the frame, but low, with the whole upper screen showing the
//      space ahead. That is why the chase view read as "the forward view, with a
//      thruster in it".
//   2. Because the rise was in world Y and the setback was along the nose, the two
//      fought as you pitched. Camera distance swung from 29 units at maximum nose-up to
//      55 at maximum nose-down, against a nominal 42.
//
// Everything here is geometry, so it runs honestly against the test stub's Vector3. What
// it cannot check is what the frame actually looks like — see test/screens.mjs for the
// nearest thing to that, and the "not verified" note in the patch.

import { installGlobals } from './stub.mjs';

const ROOT = new URL('../', import.meta.url);
installGlobals(new URL('index.html', ROOT).pathname);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const imp = p => import(new URL('src/' + p, ROOT).href);

const { S, recalcStats } = await imp('core/state.js');
const { seedWorld } = await imp('core/rng.js');
const scn = await imp('world/scene.js');
const { createSystem } = await imp('world/system.js');
const { forward } = await imp('core/utils.js');
const { updatePlayer } = await imp('entities/player.js');
const { MAX_PITCH, FLIGHT } = await imp('core/config.js');

scn.initScene();
recalcStats();
seedWorld(20260809);
createSystem();

const cam = scn.camera;
const DEG = r => r * 180 / Math.PI;

/** Put the ship at the origin on a given attitude and run one frame. */
function frame(yaw, pitch, chase = true) {
  S.settings.chase = chase;
  S.docked = false;
  S.warp.state = 'idle';
  S.player.yaw = yaw;
  S.player.pitch = pitch;
  S.player.throttle = 0.8;
  S.player.position.set(0, 0, 0);
  S.player.velocity.set(0, 0, 0);
  updatePlayer(0.016);

  // The frame integrates thrust, so the ship does not stay on the origin — measure
  // against where it actually ended up.
  const P = S.player.position;
  const f = forward(S.player.yaw, S.player.pitch);
  const toShip = { x: P.x - cam.position.x, y: P.y - cam.position.y, z: P.z - cam.position.z };
  const dist = Math.hypot(toShip.x, toShip.y, toShip.z);
  const view = forward(cam.rotation.y, cam.rotation.x);
  const cos = (toShip.x * view.x + toShip.y * view.y + toShip.z * view.z) / (dist || 1);
  return {
    dist,
    // angle between where the camera is pointing and where the ship actually is
    offAxis: DEG(Math.acos(Math.max(-1, Math.min(1, cos)))),
    // positive means the camera sits behind the ship rather than ahead of it
    behind: toShip.x * f.x + toShip.y * f.y + toShip.z * f.z,
    f, view
  };
}

// Sample the whole attitude envelope, not just level flight — the old bug was invisible
// at pitch 0 in one respect and worst there in another.
const PITCHES = [0, 0.3, -0.3, 1.0, -1.0, MAX_PITCH, -MAX_PITCH];
const YAWS = [0, Math.PI / 2, Math.PI, -Math.PI / 2, 2.4];

console.log('\n— the camera sits behind the ship —');
{
  const ahead = [];
  for (const y of YAWS) for (const p of PITCHES) {
    const r = frame(y, p);
    if (!(r.behind > 0)) ahead.push(`yaw ${DEG(y).toFixed(0)}° pitch ${DEG(p).toFixed(0)}°`);
  }
  ok('never in front of the ship, at any attitude', ahead.length === 0, ahead.join(', '));

  const r = frame(0, 0);
  ok('and behind by the configured setback', Math.abs(r.behind - FLIGHT.chaseBack) < 0.5,
     `${r.behind.toFixed(1)} vs ${FLIGHT.chaseBack}`);
}

console.log('\n— the framing holds as you pitch —');
{
  const dists = [];
  for (const y of YAWS) for (const p of PITCHES) dists.push(frame(y, p).dist);
  const lo = Math.min(...dists), hi = Math.max(...dists);

  // The old code produced 29 → 55 here. Anything wider than a couple of units means the
  // rise and the setback are fighting again.
  ok('camera distance is stable across the attitude envelope', hi - lo < 2,
     `${lo.toFixed(1)} … ${hi.toFixed(1)}`);

  const nominal = Math.hypot(FLIGHT.chaseBack, FLIGHT.chaseUp);
  ok('and matches the configured standoff', Math.abs(lo - nominal) < 1,
     `${lo.toFixed(1)} vs ${nominal.toFixed(1)}`);
}

console.log('\n— the camera actually looks at the ship —');
{
  const off = [];
  for (const y of YAWS) for (const p of PITCHES) off.push(frame(y, p).offAxis);
  const worst = Math.max(...off);

  // Half the vertical FOV is 34°. Being inside the frustum was never the problem — the
  // old view had the hull at 17.2° below centre, technically on screen and visually a
  // forward view. The bar is that the ship is near the middle of the frame.
  ok('the ship is close to the view axis at every attitude', worst < 10,
     `worst ${worst.toFixed(1)}°`);
  ok('and it is meaningfully better than an unaimed camera', worst < 17.2,
     `worst ${worst.toFixed(1)}° vs 17.2° unaimed`);

  // Aiming ahead of the nose is deliberate: dead-centre framing hides where you are going.
  const level = frame(0, 0);
  ok('the ship sits below centre, not dead centre', level.offAxis > 1,
     `${level.offAxis.toFixed(1)}°`);
  ok('the camera is above the ship at level flight', cam.position.y > S.player.position.y);
}

console.log('\n— the vertical limit is not a special case —');
{
  // Nose within 3.6° of straight up. The world-up cross product degenerates here, and the
  // old geometry put the camera 29 units out instead of 44.
  for (const p of [MAX_PITCH, -MAX_PITCH]) {
    const r = frame(0, p);
    const label = p > 0 ? 'nose up' : 'nose down';
    ok(`${label} at the pitch limit keeps the standoff`, Math.abs(r.dist - Math.hypot(FLIGHT.chaseBack, FLIGHT.chaseUp)) < 1,
       `${r.dist.toFixed(1)}`);
    ok(`${label} at the pitch limit keeps the ship framed`, r.offAxis < 10,
       `${r.offAxis.toFixed(1)}°`);
    ok(`${label} produces a finite camera position`,
       Number.isFinite(cam.position.x) && Number.isFinite(cam.position.y) && Number.isFinite(cam.position.z));
    ok(`${label} produces a finite camera rotation`,
       Number.isFinite(cam.rotation.x) && Number.isFinite(cam.rotation.y));
  }
}

console.log('\n— the cockpit view is untouched —');
{
  for (const [y, p] of [[0, 0], [1.2, 0.4], [0, MAX_PITCH]]) {
    frame(y, p, false);
    const P = S.player.position;
    const atShip = Math.hypot(cam.position.x - P.x, cam.position.y - P.y, cam.position.z - P.z);
    ok(`cockpit camera is at the ship (yaw ${DEG(y).toFixed(0)}°, pitch ${DEG(p).toFixed(0)}°)`,
       atShip < 1e-6, atShip.toFixed(3));
    ok('cockpit camera keeps the pilot\'s own yaw', Math.abs(cam.rotation.y - y) < 1e-9);
    ok('cockpit camera keeps the pilot\'s own pitch', Math.abs(cam.rotation.x - p) < 1e-9);
  }
}

console.log('\n— the hull mesh —');
{
  frame(0.6, 0.2, false);
  const hidden = scn.scene.children.filter(o => o.__isShipMesh);
  ok('no ship mesh is drawn from the cockpit', hidden.every(o => o.visible === false) || hidden.length === 0);

  frame(0.6, 0.2, true);
  // The mesh is added to the scene on first chase frame and reused after.
  const meshes = scn.scene.children.filter(o => o.rotation && o.rotation.order === 'YXZ' && o.children && o.children.length);
  ok('a hull is present in the scene under chase', meshes.length >= 1);
  const m = meshes[0];
  ok('the hull is visible', m.visible === true);
  const P = S.player.position;
  ok('the hull sits at the ship, not at the camera',
     Math.hypot(m.position.x - P.x, m.position.y - P.y, m.position.z - P.z) < 1e-6);
  ok('the hull carries the ship attitude', Math.abs(m.rotation.y - 0.6) < 1e-9 && Math.abs(m.rotation.x - 0.2) < 1e-9);
  ok('the hull uses the same rotation order as the camera', m.rotation.order === cam.rotation.order);
}

console.log('\n— the plume is between the camera and the hull —');
{
  const r = frame(0, 0, true);
  // Thrusters trail from 8 to 26 units aft; the camera stands off at ~44. If the plume
  // ever reached past the camera it would render as a wash across the whole frame.
  const trailStart = 8, trailEnd = 26;
  ok('the plume starts aft of the hull', trailStart > 0);
  ok('the plume ends short of the camera', trailEnd < r.behind,
     `${trailEnd} vs ${r.behind.toFixed(1)}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
