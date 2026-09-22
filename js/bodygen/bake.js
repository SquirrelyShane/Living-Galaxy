/* LIVING GALAXY — the generator's surface, at the generator's own resolution,
 * on a mesh a phone can carry.
 *
 * Shane's asteroid generator draws its craters, grooves, grit, scarps, frost
 * and vein networks as GEOMETRY and per-vertex colour, for a survey mesh of
 * 56–158 cells a cube face. The game had been asking it for 7–12 cells, where
 * every one of those features falls between vertices: what came back was the
 * right silhouette wearing an averaged colour — a smooth grey potato that only
 * started to look like the rock as you closed to a few hundred metres.
 *
 * So a body is grown ONCE at a real detail (H cells a face) and baked:
 *
 *   - the generator's vertex lattice IS a texture already. Its cube-sphere puts
 *     every face on an (H+1)² grid, so each face's colour, metalness,
 *     roughness, emission and normal go straight into an atlas texel per
 *     vertex — six faces in a 3×2 sheet, no rasteriser, no UV unwrap. At H=48
 *     that sheet is 147×98 texels.
 *   - the mesh actually drawn is the same lattice sampled every H/L vertices
 *     (L cells a face), unwelded per face so each face carries its own atlas
 *     coordinates. Its corners ARE generator vertices, so the silhouette is the
 *     generator's; the shading between them reads the full-resolution normal.
 *
 * Texel centres sit exactly on the low mesh's vertices and a face never
 * samples outside its own block, so there is no seam bleed; a seam vertex has
 * the same data on every face that shares it, so there is no seam line.
 *
 * Pure data, no THREE — it runs in the grower worker (js/bodygen/worker.js) and
 * in node for the tests; js/bodygen/baked.js turns the arrays into a mesh.
 */

/** Vertex id at every (face, i, j) of the generator's cube-sphere, in its own build order. */
export function faceGrids(n) {
  const N1 = n + 1;
  const keyToId = new Map();
  const grids = new Int32Array(6 * N1 * N1);
  const c = [0, 0, 0];
  let next = 0, f = 0;
  /* the loop order, key and first-seen numbering of generator.js buildCubeSphere,
   * exactly: that is what makes a grid cell and a generator vertex the same thing */
  for (let k = 0; k < 3; k++) {
    const u = (k + 1) % 3, v = (k + 2) % 3;
    for (const side of [0, n]) {
      for (let j = 0; j <= n; j++) {
        for (let i = 0; i <= n; i++) {
          c[k] = side; c[u] = i; c[v] = j;
          const key = (c[0] * N1 + c[1]) * N1 + c[2];
          let id = keyToId.get(key);
          if (id === undefined) { id = next++; keyToId.set(key, id); }
          grids[(f * N1 + j) * N1 + i] = id;
        }
      }
      f++;
    }
  }
  return grids;
}

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

/**
 * Bake a grown body. `src` is the generator's vertex arrays (position, normal,
 * color, aMetal, aRough, aEmit) at detail `H`; `L` must divide `H`.
 *
 * Atlas A: rgb = √albedo (so dark carbonaceous rock survives 8 bits), a = metalness.
 * Atlas B: rgb = object-space normal ·½+½, a = roughness.
 * Atlas C: rgb = emission / emitScale — null when nothing on the body glows.
 */
export function bakeLattice(src, H, L) {
  if (H % L) throw new Error(`bake: L=${L} does not divide H=${H}`);
  const N1 = H + 1, step = H / L, M1 = L + 1;
  const grids = faceGrids(H);
  const W = 3 * N1, Ht = 2 * N1;
  const texA = new Uint8Array(W * Ht * 4);
  const texB = new Uint8Array(W * Ht * 4);
  let emitMax = 0;
  for (let i = 0; i < src.emit.length; i++) if (src.emit[i] > emitMax) emitMax = src.emit[i];
  const texC = emitMax > 1e-4 ? new Uint8Array(W * Ht * 4) : null;

  for (let f = 0; f < 6; f++) {
    const ox = (f % 3) * N1, oy = Math.floor(f / 3) * N1;
    for (let j = 0; j <= H; j++) {
      for (let i = 0; i <= H; i++) {
        const id = grids[(f * N1 + j) * N1 + i];
        const t = ((oy + j) * W + ox + i) * 4;
        texA[t] = Math.round(Math.sqrt(clamp01(src.color[id * 3])) * 255);
        texA[t + 1] = Math.round(Math.sqrt(clamp01(src.color[id * 3 + 1])) * 255);
        texA[t + 2] = Math.round(Math.sqrt(clamp01(src.color[id * 3 + 2])) * 255);
        texA[t + 3] = Math.round(clamp01(src.metal[id]) * 255);
        texB[t] = Math.round((src.normal[id * 3] * 0.5 + 0.5) * 255);
        texB[t + 1] = Math.round((src.normal[id * 3 + 1] * 0.5 + 0.5) * 255);
        texB[t + 2] = Math.round((src.normal[id * 3 + 2] * 0.5 + 0.5) * 255);
        texB[t + 3] = Math.round(clamp01(src.rough[id]) * 255);
        if (texC) {
          texC[t] = Math.round(clamp01(src.emit[id * 3] / emitMax) * 255);
          texC[t + 1] = Math.round(clamp01(src.emit[id * 3 + 1] / emitMax) * 255);
          texC[t + 2] = Math.round(clamp01(src.emit[id * 3 + 2] / emitMax) * 255);
          texC[t + 3] = 255;
        }
      }
    }
  }

  /* the drawn mesh: every step-th lattice vertex, one unwelded grid a face */
  const vpf = M1 * M1;
  const positions = new Float32Array(6 * vpf * 3);
  const normals = new Float32Array(6 * vpf * 3);
  const colors = new Float32Array(6 * vpf * 3);
  const uvs = new Float32Array(6 * vpf * 2);
  const index = new Uint32Array(6 * L * L * 6);
  let ti = 0;
  for (let f = 0; f < 6; f++) {
    const ox = (f % 3) * N1, oy = Math.floor(f / 3) * N1;
    const base = f * vpf;
    for (let j = 0; j <= L; j++) {
      for (let i = 0; i <= L; i++) {
        const hi = i * step, hj = j * step;
        const id = grids[(f * N1 + hj) * N1 + hi];
        const o = base + j * M1 + i;
        for (let a = 0; a < 3; a++) {
          positions[o * 3 + a] = src.position[id * 3 + a];
          normals[o * 3 + a] = src.normal[id * 3 + a];
          colors[o * 3 + a] = src.color[id * 3 + a];
        }
        uvs[o * 2] = (ox + hi + 0.5) / W;
        uvs[o * 2 + 1] = (oy + hj + 0.5) / Ht;
      }
    }
    /* the generator's winding: faces on the far side of an axis turn the other way */
    const far = f % 2 === 1;
    for (let j = 0; j < L; j++) {
      for (let i = 0; i < L; i++) {
        const a = base + j * M1 + i, b = a + 1, cc = a + M1 + 1, d = a + M1;
        if (far) { index[ti++] = a; index[ti++] = b; index[ti++] = cc; index[ti++] = a; index[ti++] = cc; index[ti++] = d; }
        else { index[ti++] = a; index[ti++] = cc; index[ti++] = b; index[ti++] = a; index[ti++] = d; index[ti++] = cc; }
      }
    }
  }
  return { H, L, W, Ht, texA, texB, texC, emitScale: emitMax, positions, normals, colors, uvs, index };
}
