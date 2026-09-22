/* Mount-face frame: normals and the euler that stands a +Y module on each face.
 * top/bottom/port/star/bow/stern — bottom rolls (not pitches) so local -Z still points at the bow. */
export function faceNormal(f) {
  return f === "top" ? [0, 1, 0] : f === "bottom" ? [0, -1, 0]
       : f === "port" ? [-1, 0, 0] : f === "star" ? [1, 0, 0]
       : f === "bow" ? [0, 0, -1] : [0, 0, 1];
}

/* euler that stands a +Y module upright on the given face */
export function faceEuler(f) {
  if (f === "top") return [0, 0, 0];
  if (f === "bottom") return [0, 0, Math.PI];   // roll, not pitch: keeps local -Z pointing at the bow
  if (f === "port") return [0, 0, Math.PI / 2];
  if (f === "star") return [0, 0, -Math.PI / 2];
  if (f === "bow") return [-Math.PI / 2, 0, 0];
  return [Math.PI / 2, 0, 0];
}

export function faceRotation(face) {
  if (face === "top") return 0;
  if (face === "bottom") return Math.PI;
  if (face === "right") return -Math.PI / 2;
  return Math.PI / 2;
}
