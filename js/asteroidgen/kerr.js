/**
 * Kerr (spinning) black hole null geodesics — the DNGR prescription of
 * James, von Tunzelmann, Franklin & Thorne, "Gravitational lensing by spinning
 * black holes in astrophysics, and in the movie Interstellar",
 * Class. Quantum Grav. 32 (2015) 065001, appendix A.1. Units: G = c = M = 1.
 *
 *   Boyer–Lindquist metric functions        (A.2)
 *   FIDO orthonormal frame                  (A.3)
 *   P, R, Θ                                 (A.4)
 *   trapped photon orbits b_o(r_o), q_o     (A.5, A.6)
 *   camera direction → canonical momenta    (A.9–A.12), camera at rest in the FIDO frame (β = 0)
 *   super-Hamiltonian ray equations         (A.15), integrated backward in ζ with RK2
 *
 * Pure JS; blackhole.js carries a line-by-line GLSL copy (verified against this file).
 *
 * Mapping to the scene: the hole's spin axis is world −Y, so the prograde disk turns
 * +X → +Z like every other orbit in the app. BL Cartesian (x, y, z) = world (X, Z, −Y),
 * with the oblate embedding x = √(r²+a²) sinθ cosφ, y = √(r²+a²) sinθ sinφ, z = r cosθ.
 */

export const KERR_LOOKS = {
  // what Nolan & Franklin chose for Interstellar: a/M = 0.6, no Doppler or gravitational colour / brightness shifts
  interstellar: { spin: 0.6, shifts: 0, label: 'Interstellar (a = 0.6, no shifts)' },
  // what the hole would really look like spinning fast: lopsided, flattened shadow edge, beamed disk
  kerr: { spin: 0.999, shifts: 1, label: 'Kerr a = 0.999 (physical)' },
  schwarzschild: { spin: 0, shifts: 1, label: 'Schwarzschild a = 0 (physical)' },
};

export const KERR = { march: 28, stepK: 0.1, stepMin: 0.004, stepMax: 3, maxDTheta: 0.08, maxDPhi: 0.25, poleSin: 0.1, axisK: 0.3, diskOut: 26, T0: 9500 };

export function horizon(a) {
  return 1 + Math.sqrt(Math.max(0, 1 - a * a));
}

/** Prograde innermost stable circular orbit (Bardeen, Press & Teukolsky 1972). */
export function isco(a) {
  const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
  const z2 = Math.sqrt(3 * a * a + z1 * z1);
  return 3 + z2 - Math.sqrt((3 - z1) * (3 + z1 + 2 * z2));
}

/** (A.5, A.6): constants of unstably trapped photon orbits, r_o ∈ [r1, r2]. */
export function trappedOrbit(ro, a) {
  const b = -(ro ** 3 - 3 * ro * ro + a * a * ro + a * a) / (a * (ro - 1));
  const q = -(ro ** 3 * (ro ** 3 - 6 * ro * ro + 9 * ro - 4 * a * a)) / (a * a * (ro - 1) ** 2);
  return { b, q };
}
export function trappedRange(a) {
  return { r1: 2 * (1 + Math.cos((2 / 3) * Math.acos(-a))), r2: 2 * (1 + Math.cos((2 / 3) * Math.acos(a))) };
}

export function metric(r, th, a) {
  const c = Math.cos(th), s = Math.sin(th);
  const rho2 = r * r + a * a * c * c;
  const rho = Math.sqrt(rho2);
  const D = r * r - 2 * r + a * a;
  const Sig = Math.sqrt((r * r + a * a) ** 2 - a * a * D * s * s);
  return { rho, rho2, D, Sig, alpha: (rho * Math.sqrt(Math.max(D, 0))) / Sig, omega: (2 * a * r) / (Sig * Sig), varpi: (Sig * s) / rho };
}

export const worldToBL = (v) => [v[0], v[2], -v[1]];
export const blToWorld = (v) => [v[0], -v[2], v[1]];

/** BL Cartesian point → { r, th, ph } (oblate embedding). */
export function cartToBL([x, y, z], a) {
  const R2 = x * x + y * y + z * z;
  const w = R2 - a * a;
  const r = Math.sqrt(Math.max(1e-12, 0.5 * (w + Math.sqrt(w * w + 4 * a * a * z * z))));
  return { r, th: Math.acos(Math.max(-1, Math.min(1, z / r))), ph: Math.atan2(y, x) };
}
export function blToCart(r, th, ph, a) {
  const e = Math.sqrt(r * r + a * a) * Math.sin(th);
  return [e * Math.cos(ph), e * Math.sin(ph), r * Math.cos(th)];
}

/** Orthonormalised FIDO directions e_r̂, e_θ̂, e_φ̂ in BL Cartesian (exact in the far field). */
export function fidoBasis(r, th, ph, a) {
  const s = Math.sin(th), c = Math.cos(th), cp = Math.cos(ph), sp = Math.sin(ph);
  const q = Math.sqrt(r * r + a * a);
  const norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return v.map((x) => x / l);
  };
  const ephi = [-sp, cp, 0];
  let er = norm([(r / q) * s * cp, (r / q) * s * sp, c]);
  let et = norm([q * c * cp, q * c * sp, -r * s]);
  // Gram–Schmidt (the embedding is not exactly orthogonal near the hole)
  const d = et[0] * er[0] + et[1] * er[1] + et[2] * er[2];
  et = norm([et[0] - d * er[0], et[1] - d * er[1], et[2] - d * er[2]]);
  return { er, et, ephi };
}

/**
 * (A.9–A.12) with β = 0: a ray leaving the camera along `dir` (BL Cartesian, outward) is the
 * time reverse of a photon arriving with propagation direction n = −dir.
 * Returns the state [r, θ, φ, p_r, p_θ] and constants { b, q }.
 */
export function initRay(posBL, dir, a) {
  const { r, th, ph } = cartToBL(posBL, a);
  const { er, et, ephi } = fidoBasis(r, th, ph, a);
  const n = [-dir[0], -dir[1], -dir[2]];
  let nr = n[0] * er[0] + n[1] * er[1] + n[2] * er[2];
  let nt = n[0] * et[0] + n[1] * et[1] + n[2] * et[2];
  let np = n[0] * ephi[0] + n[1] * ephi[1] + n[2] * ephi[2];
  const l = Math.hypot(nr, nt, np) || 1;
  nr /= l; nt /= l; np /= l;
  const m = metric(r, th, a);
  const EF = 1 / (m.alpha + m.omega * m.varpi * np);
  const pr = (EF * m.rho * nr) / Math.sqrt(Math.max(m.D, 1e-9));
  const pth = EF * m.rho * nt;
  const b = EF * m.varpi * np;
  const c = Math.cos(th), s2 = Math.max(Math.sin(th) ** 2, 1e-8);
  const q = pth * pth + c * c * ((b * b) / s2 - a * a);
  return { s: [r, th, ph, pr, pth], b, q };
}

/** (A.15): d/dζ of [r, θ, φ, p_r, p_θ]. */
export function derivs(s, a, b, q) {
  const [r, th, , pr, pth] = s;
  const sn = Math.sin(th), cs = Math.cos(th);
  const sn2 = Math.max(sn * sn, 1e-8);
  const snS = Math.abs(sn) < 1e-4 ? (sn < 0 ? -1e-4 : 1e-4) : sn;
  const a2 = a * a, r2 = r * r;
  const rho2 = r2 + a2 * cs * cs, rho4 = rho2 * rho2;
  const D = r2 - 2 * r + a2;
  const P = r2 + a2 - a * b;
  const K = (b - a) * (b - a) + q;
  const R = P * P - D * K;
  const Th = q - cs * cs * ((b * b) / sn2 - a2);
  const Dp = 2 * r - 2;
  const Rp = 4 * r * P - Dp * K;
  const dr = (D / rho2) * pr;
  const dth = pth / rho2;
  const dph = ((a * P) / D + (b - a) + (b * cs * cs) / sn2) / rho2;
  const dpr = (-pr * pr * (Dp * rho2 - 2 * r * D)) / (2 * rho4) + (pth * pth * r) / rho4 + (Rp * D * rho2 - R * (Dp * rho2 + 2 * r * D)) / (2 * D * D * rho4) - (Th * r) / rho4;
  const rho2t = -2 * a2 * cs * sn;
  const Thp = (2 * b * b * cs) / (snS * snS * snS) - 2 * a2 * cs * sn;
  const dpth = (rho2t / (2 * rho4)) * (pr * pr * D + pth * pth - R / D - Th) + Thp / (2 * rho2);
  return [dr, dth, dph, dpr, dpth];
}

/** Super-Hamiltonian (zero on a null ray) — for accuracy checks. */
export function hamiltonian(s, a, b, q) {
  const [r, th, , pr, pth] = s;
  const cs = Math.cos(th), sn2 = Math.max(Math.sin(th) ** 2, 1e-8);
  const rho2 = r * r + a * a * cs * cs;
  const D = r * r - 2 * r + a * a;
  const P = r * r + a * a - a * b;
  const R = P * P - D * ((b - a) ** 2 + q);
  const Th = q - cs * cs * ((b * b) / sn2 - a * a);
  return (D * pr * pr) / (2 * rho2) + (pth * pth) / (2 * rho2) - (R + D * Th) / (2 * D * rho2);
}

export function stepSize(r, a) {
  return Math.max(KERR.stepMin, Math.min(KERR.stepMax, KERR.stepK * (r - horizon(a) * 0.98)));
}

/**
 * One backward RK2 (midpoint) step. The step also caps the change in θ and φ, so rays that skim a
 * pole (where b/sin²θ and Θ'∝1/sin³θ get large) are resolved instead of blowing up.
 */
export function rk2(s, a, b, q) {
  const k1 = derivs(s, a, b, q);
  // θ may not close more than axisK of its remaining gap to the axis in one step (resolves the approach to a pole hop)
  const h = -Math.min(stepSize(s[0], a), KERR.maxDTheta / (Math.abs(k1[1]) + 1e-9), KERR.maxDPhi / (Math.abs(k1[2]) + 1e-9), (KERR.axisK * Math.abs(Math.sin(s[1]))) / (Math.abs(k1[1]) + 1e-9));
  const m = s.map((x, i) => x + k1[i] * h * 0.5);
  const k2 = derivs(m, a, b, q);
  return s.map((x, i) => x + k2[i] * h);
}

/**
 * Boyer–Lindquist coordinates are singular on the spin axis (b/sin²θ, Θ' ∝ 1/sin³θ). A ray that comes within
 * sinθ < poleSin of the axis hops straight across it in Cartesian space (a few percent of r, where the path is
 * locally straight) and is re-initialised from its position and direction on the far side.
 * Returns null when no hop is needed.
 */
export function poleHop(s, a, b) {
  if (Math.abs(Math.sin(s[1])) >= KERR.poleSin) return null;
  const P = blToCart(s[0], s[1], s[2], a);
  const d = exitDirection(s, a, b); // direction the traced ray is travelling
  const dxy = d[0] * d[0] + d[1] * d[1];
  const tStar = dxy > 1e-12 ? -(P[0] * d[0] + P[1] * d[1]) / dxy : 0;
  if (tStar <= 0) return null; // already moving away from the axis
  const L = 2 * tStar + 0.002 * s[0];
  const Q = [P[0] + d[0] * L, P[1] + d[1] * L, P[2] + d[2] * L];
  return initRay(Q, d, a);
}

/** Outgoing sky direction (BL Cartesian) of a ray that has left the march sphere. */
export function exitDirection(s, a, b) {
  const [r, th, ph, pr, pth] = s;
  const m = metric(r, th, a);
  const { er, et, ephi } = fidoBasis(r, th, ph, a);
  const nr = (pr * Math.sqrt(Math.max(m.D, 1e-9))) / m.rho, nt = pth / m.rho, np = b / m.varpi;
  const n = [0, 1, 2].map((i) => nr * er[i] + nt * et[i] + np * ephi[i]);
  const l = Math.hypot(n[0], n[1], n[2]) || 1;
  return [-n[0] / l, -n[1] / l, -n[2] / l];
}

/** Redshift g = ν_camera / ν_emitted for a prograde circular equatorial emitter at r (camera far away). */
export function diskRedshift(r, b, a) {
  const r15 = Math.pow(r, 1.5);
  const ut = (r15 + a) / (Math.pow(r, 0.75) * Math.sqrt(Math.max(1e-6, r15 - 3 * Math.sqrt(r) + 2 * a)));
  const Om = 1 / (r15 + a);
  return 1 / (ut * (1 - Om * b));
}

/**
 * Trace one camera ray (BL Cartesian position / direction, M units) to capture, escape or step limit.
 * Returns { fate: 'captured' | 'escaped' | 'steps', steps, exitDir, disk: [{ r, ph, g }], hmax, state }.
 */
export function traceRay(posBL, dir, a, { steps = 400, march = KERR.march } = {}) {
  const ray = initRay(posBL, dir, a);
  let s = ray.s;
  const rh = horizon(a);
  const disk = [];
  let hmax = 0;
  let hops = 0;
  for (let i = 0; i < steps; i++) {
    const hop = poleHop(s, a, ray.b);
    if (hop) {
      s = hop.s;
      ray.b = hop.b;
      ray.q = hop.q;
      hops++;
    }
    const prev = s;
    s = rk2(s, a, ray.b, ray.q);
    hmax = Math.max(hmax, Math.abs(hamiltonian(s, a, ray.b, ray.q)));
    if (Math.cos(prev[1]) * Math.cos(s[1]) < 0) {
      const f = Math.cos(prev[1]) / (Math.cos(prev[1]) - Math.cos(s[1]));
      const r = prev[0] + (s[0] - prev[0]) * f;
      disk.push({ r, ph: prev[2] + (s[2] - prev[2]) * f, g: r > isco(a) ? diskRedshift(r, ray.b, a) : 0 });
    }
    if (s[0] < rh * 1.01) return { fate: 'captured', steps: i + 1, disk, hmax, b: ray.b, q: ray.q, state: s };
    if (s[0] > march && s[0] > prev[0]) return { fate: 'escaped', steps: i + 1, exitDir: exitDirection(s, a, ray.b), disk, hmax, b: ray.b, q: ray.q, state: s, hops };
  }
  return { fate: 'steps', steps, disk, hmax, b: ray.b, q: ray.q, state: s };
}

/** Planck radiance ratios at the film's R, G, B wavelengths for temperature T relative to T0. */
export function blackbodyRGB(T, T0 = KERR.T0) {
  const lam = [610e-9, 550e-9, 465e-9];
  const B = (l, t) => 1 / (Math.pow(l, 5) * (Math.exp(1.4388e-2 / (l * t)) - 1));
  return lam.map((l) => B(l, Math.max(T, 200)) / B(l, T0));
}
