/* LIVING GALAXY — every asteroid is the generator's, at the generator's resolution.
 *
 *   node --import ./test/three-register.mjs test/bake.test.mjs
 *
 * 0.3.02. What is pinned: the bake's lattice IS the generator's cube-sphere
 * (same vertex ids, same winding), the atlases carry the fine surface texel for
 * vertex, the drawn mesh is a true subsample of the grown one, the tiers divide,
 * and the grower's main-thread path grows, caches and cancels.
 */

const { generateAsteroid, buildCubeSphere } = await import("../js/asteroidgen/generator.js");
const { faceGrids, bakeLattice } = await import("../js/bodygen/bake.js");
const { growBaked, BAKE, featureAt, bakedTransfer } = await import("../js/bodygen/body.js");
const G = await import("../js/bodygen/grower.js");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

/* ---- the lattice ----------------------------------------------------------- */
for (const n of [8, 16]) {
  const { dirs } = buildCubeSphere(n);
  const g = faceGrids(n);
  const N1 = n + 1;
  const warp = (i) => (i === 0 ? -1 : i === n ? 1 : Math.tan((2 * i / n - 1) * Math.PI / 4));
  let bad = 0, f = 0;
  const c = [0, 0, 0];
  for (let k = 0; k < 3; k++) {
    const u = (k + 1) % 3, v = (k + 2) % 3;
    for (const side of [0, n]) {
      for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
        c[k] = side; c[u] = i; c[v] = j;
        const p = [warp(c[0]), warp(c[1]), warp(c[2])], l = Math.hypot(...p);
        const id = g[(f * N1 + j) * N1 + i];
        for (let a = 0; a < 3; a++) if (Math.abs(dirs[id * 3 + a] - p[a] / l) > 1e-5) bad++;
      }
      f++;
    }
  }
  ok(bad === 0, `n=${n}: every (face, i, j) is the generator's own vertex (${bad} mismatches)`);
  ok(Math.max(...g) === dirs.length / 3 - 1, `n=${n}: the grid covers all ${dirs.length / 3} vertices`);
}

/* ---- a bake ------------------------------------------------------------------ */
{
  const H = 32, L = 8;
  const a = generateAsteroid({ seed: "bake-test", classId: "M", radiusM: 1500, detail: H });
  const at = a.geometry.attributes;
  const src = { position: at.position.array, normal: at.normal.array, color: at.color.array, metal: at.aMetal.array, rough: at.aRough.array, emit: at.aEmit.array };
  const b = bakeLattice(src, H, L);
  ok(b.W === 3 * (H + 1) && b.Ht === 2 * (H + 1), `atlas is ${b.W}×${b.Ht} — a texel a vertex, six faces`);
  ok(b.index.length / 3 === 12 * L * L, `drawn mesh is 12·L² = ${b.index.length / 3} triangles`);
  /* texel ↔ vertex: pick a grid vertex and compare the atlas against the attributes */
  const grids = faceGrids(H), N1 = H + 1;
  let worst = 0;
  for (const [f, i, j] of [[0, 0, 0], [2, 17, 5], [5, H, H], [3, 9, 31]]) {
    const id = grids[(f * N1 + j) * N1 + i];
    const t = ((Math.floor(f / 3) * N1 + j) * b.W + (f % 3) * N1 + i) * 4;
    worst = Math.max(worst, Math.abs((b.texA[t] / 255) ** 2 - Math.min(1, src.color[id * 3])), Math.abs(b.texB[t + 1] / 255 * 2 - 1 - src.normal[id * 3 + 1]), Math.abs(b.texB[t + 3] / 255 - src.rough[id]));
  }
  ok(worst < 0.03, `the atlas carries the fine surface (worst texel error ${worst.toFixed(4)})`);
  /* every drawn vertex is a grown vertex: the silhouette is the generator's */
  let off = 0;
  const grown = new Set();
  for (let i = 0; i < src.position.length; i += 3) grown.add(`${src.position[i].toFixed(5)},${src.position[i + 1].toFixed(5)},${src.position[i + 2].toFixed(5)}`);
  for (let i = 0; i < b.positions.length; i += 3) if (!grown.has(`${b.positions[i].toFixed(5)},${b.positions[i + 1].toFixed(5)},${b.positions[i + 2].toFixed(5)}`)) off++;
  ok(off === 0, `every drawn vertex is one of the grown body's (${off} strays)`);
  /* winding: the generator's, i.e. outward for a star-shaped body */
  let inward = 0;
  for (let t = 0; t < b.index.length; t += 3) {
    const P = (k) => [b.positions[k * 3], b.positions[k * 3 + 1], b.positions[k * 3 + 2]];
    const A = P(b.index[t]), B = P(b.index[t + 1]), C = P(b.index[t + 2]);
    const e1 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], e2 = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
    const nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
    if (nx * (A[0] + B[0] + C[0]) + ny * (A[1] + B[1] + C[1]) + nz * (A[2] + B[2] + C[2]) < 0) inward++;
  }
  ok(inward < b.index.length / 3 * 0.02, `faces wind outward (${inward} of ${b.index.length / 3} inward, a concave dimple or two)`);
  let threw = false;
  try { bakeLattice(src, H, 5); } catch { threw = true; }
  ok(threw, "an L that does not divide H is refused");
  a.geometry.dispose();
}

/* ---- tiers ------------------------------------------------------------------ */
{
  const tiers = [BAKE.proto, ...Object.values(BAKE.belt), ...Object.values(BAKE.rogue)];
  ok(tiers.every((t) => t.L.every((L) => t.H % L === 0)), "every tier's L divides its H");
  ok(BAKE.rogue.full.H >= 56 && featureAt(BAKE.rogue.full.H) === 1, `a rogue on a full device grows at the generator's own survey detail (H${BAKE.rogue.full.H}, features ×${featureAt(BAKE.rogue.full.H)})`);
  ok(BAKE.proto.H >= 32, `even the belt prototypes are grown at ${BAKE.proto.H} cells a face (0.3 drew 7–12)`);
}

/* ---- growBaked: the worker's job, run here -------------------------------- */
{
  const d = growBaked({ seed: "rogue:2346 GD", classId: "S", radiusM: 6400, H: 48, L: [16, 8] });
  ok(d.meshes.length === 2 && d.meshes[0].L === 16 && d.meshes[1].L === 8, "one bake, a mesh per L");
  ok(d.meta.triangles === 3072 && d.meta.grownTriangles === 12 * 48 * 48, `draws ${d.meta.triangles} triangles carrying a ${d.meta.grownTriangles}-triangle surface`);
  ok(d.meta.suite?.length > 0 && d.meta.value > 0 && typeof d.meta.cls === "string", `the assay rides along (${d.meta.suite.length} ores, ${Math.round(d.meta.value)} cr, class ${d.meta.cls})`);
  ok(Math.abs(d.meta.scale - 640 / d.meta.meshRadius) < 1e-6, "scale puts the unit-frame body at the rock's radius");
  const bufs = bakedTransfer(d);
  ok(bufs.length >= 12 && bufs.every((x) => x instanceof ArrayBuffer), `everything crosses to the main thread by transfer (${bufs.length} buffers)`);
  ok(typeof structuredClone === "function" && structuredClone(d.meta).cls === d.meta.cls, "the metadata is cloneable (no functions, no THREE objects)");
}

/* ---- the grower's main-thread path ----------------------------------------- */
{
  G.resetGrower();
  const p1 = G.grow("k1", { seed: "a", classId: "C", radiusM: 500, H: 16, L: [8] });
  const p2 = G.grow("k1", { seed: "a", classId: "C", radiusM: 500, H: 16, L: [8] });
  ok(p1 === p2, "a key already waiting is not queued twice");
  G.grow("k2", { seed: "b", classId: "S", radiusM: 500, H: 16, L: [8] });
  ok(G.growerStats.state === "dead", `no worker in node: the main-thread path (${G.growerStats.state})`);
  ok(G.pump() === true && G.peek("k1") && !G.peek("k2"), "one body a pump, in request order");
  G.cancel((key) => key !== "k2");
  ok(G.pump() === false && !G.peek("k2"), "a cancelled request is dropped, not grown");
  const d = await p1;
  ok(d.meta.cls === "C" && G.peek("k1") === d, "the promise resolves to the cached body");
}

console.log(`bake: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
