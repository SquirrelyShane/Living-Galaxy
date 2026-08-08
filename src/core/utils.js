// Living Galaxy — dependency-free helpers.

export const TAU = Math.PI * 2;

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
/** Frame-rate independent lerp. lambda = how sharply it converges. */
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];

export function wrapPi(a) {
  while (a > Math.PI) a -= TAU;
  while (a < -Math.PI) a += TAU;
  return a;
}

/**
 * Nose direction for a yaw/pitch pair. Writes into `out` if given.
 *
 * This MUST match the camera's world forward vector, which for
 * rotation.order = 'YXZ' with rotation.y = yaw and rotation.x = pitch is
 * Ry(yaw) * Rx(pitch) applied to (0,0,-1) = (-sin y cos p, sin p, -cos y cos p).
 * Getting the X sign wrong makes the ship fly sideways relative to the view at
 * every heading except 0 and 180, and throws the engine plume across the screen.
 */
export function forward(yaw, pitch, out) {
  const cp = Math.cos(pitch);
  const x = -Math.sin(yaw) * cp, y = Math.sin(pitch), z = -Math.cos(yaw) * cp;
  if (out) { out.set(x, y, z); return out; }
  return { x, y, z };
}

/** Inverse of forward(): yaw/pitch that points at a normalized direction. */
export function aimAngles(dir) {
  return { yaw: Math.atan2(-dir.x, -dir.z), pitch: Math.asin(clamp(dir.y, -1, 1)) };
}

export const fmtNum = n => Math.round(n).toLocaleString('en-US');
export const fmtCr = n => fmtNum(n) + ' cr';
export const fmtKm = n => (n >= 1000 ? (n / 1000).toFixed(1) + ' Mm' : Math.round(n) + ' km');
export const fmtMass = kg => (kg >= 1000 ? (kg / 1000).toFixed(1) + ' t' : Math.round(kg) + ' kg');

export const $ = id => document.getElementById(id);
export const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
