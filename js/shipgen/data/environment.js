/* Yard environment shared by the builder and the scene: the drydock's key light is the sun.
 * Solar hardware is mounted on the faces that see it; radiators on the faces that don't. */
export const SUN_DIR = (() => { const v = [34, 46, 24]; const l = Math.hypot(...v); return v.map(x => x / l); })();
export const FACE_NORMALS = { top: [0, 1, 0], bottom: [0, -1, 0], port: [-1, 0, 0], star: [1, 0, 0], bow: [0, 0, -1], stern: [0, 0, 1] };
export function sunExposure(face) { const n = FACE_NORMALS[face]; return n[0] * SUN_DIR[0] + n[1] * SUN_DIR[1] + n[2] * SUN_DIR[2]; }
