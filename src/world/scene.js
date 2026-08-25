// Living Galaxy — renderer / camera / scene singletons.

import { $ } from '../core/utils.js';
import { FLIGHT } from '../core/config.js';

export let scene, camera, renderer;

<<<<<<< HEAD
// Current quality profile. Held here rather than imported from world/quality.js so the
=======
// Current quality profile. Held here rather than imported from systems/quality.js so the
>>>>>>> 1935cd184c7779d3b421a28a48b3b29b1c83bc44
// dependency runs one way: quality decides, the scene obeys, and the scene can be brought
// up before the controller exists.
let profile = { pixelRatio: 1.5, antialias: true, effects: 1, starfield: 1, lodBias: 1.25 };
let wantAntialias = true;

export function initScene() {
  const canvas = $('game-canvas');

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x00040c, 0.0000065);   // gentle — was 0.000075, which blacked out anything past the inner planets

  camera = new THREE.PerspectiveCamera(FLIGHT.fovCruise, innerWidth / innerHeight, 1.5, 400000);
  camera.rotation.order = 'YXZ';

  // logarithmicDepthBuffer is essential here: near 0.8 with far 260,000 destroys
  // depth precision, which made distant stars punch through solid planets.
  // Antialiasing is chosen once, here, from whatever the profile says at boot. It cannot
  // be changed later without rebuilding the context.
  antialiasAtBoot = !!profile.antialias;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: antialiasAtBoot,
    powerPreference: 'high-performance', logarithmicDepthBuffer: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(pixelRatio());
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  addEventListener('resize', onResize);
  addEventListener('orientationchange', () => setTimeout(onResize, 120));
  return { scene, camera, renderer };
}

function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(pixelRatio());
}

/**
 * The device's own pixel ratio, capped by the quality profile. Both halves matter: a
 * 3x phone screen rendered at 3x is nine times the fragment work of 1x for a difference
 * almost nobody can see at arm's length, and rendering *above* the device ratio is pure
 * waste, so the profile is a ceiling rather than a target.
 */
function pixelRatio() {
  const dpr = (typeof devicePixelRatio === 'number' ? devicePixelRatio : 1);
  activeRatio = Math.max(0.5, Math.min(dpr, profile.pixelRatio || 1));
  return activeRatio;
}

/**
 * Adopt a quality profile. Pixel ratio is live; antialiasing is not — it is fixed at
 * context creation and changing it would mean tearing down the WebGL context and every
 * buffer in it, which costs far more than the aliasing it would remove. The requested
 * value is recorded so the diagnostics panel can say "on next launch" honestly rather
 * than silently ignoring it.
 */
export function applyQuality(q) {
  profile = Object.assign({}, profile, q || {});
  wantAntialias = !!profile.antialias;
  if (renderer) renderer.setPixelRatio(pixelRatio());
  return profile;
}

let antialiasAtBoot = true;
let activeRatio = 1;

export const renderProfile = () => ({
  pixelRatio: profile.pixelRatio,
  effects: profile.effects,
  starfield: profile.starfield,
  lodBias: profile.lodBias,
  // The ratio actually in force, which is the device's own capped by the profile —
  // reported separately because "what we asked for" and "what we got" differ on any
  // device whose DPR is below the level's ceiling, and only one of them is useful.
  activePixelRatio: activeRatio,
  antialiasAtBoot,
  antialiasRequested: wantAntialias,
  antialiasNeedsRestart: wantAntialias !== antialiasAtBoot
});

export function render() {
  renderer.render(scene, camera);
}
