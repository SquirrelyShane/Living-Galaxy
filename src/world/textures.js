// Living Galaxy — procedural planet textures painted to canvas at boot. Cached per
// body class, so twelve planets share ~a dozen textures instead of one each.
// Every generator degrades to a blank texture when there's no 2d context (headless).

const surfCache = new Map();
const cloudCache = new Map();

function canvas2d(w, h) {
  const cv = (typeof document !== 'undefined' && document.createElement)
    ? document.createElement('canvas') : null;
  const g = cv && cv.getContext ? cv.getContext('2d') : null;
  if (!g || typeof g.createRadialGradient !== 'function') return null;
  cv.width = w; cv.height = h;
  return { cv, g };
}

const hex = n => '#' + ('000000' + (n >>> 0).toString(16)).slice(-6);

function shade(hexNum, f) {
  const r = Math.min(255, Math.max(0, ((hexNum >> 16) & 255) * f)) | 0;
  const g = Math.min(255, Math.max(0, ((hexNum >> 8) & 255) * f)) | 0;
  const b = Math.min(255, Math.max(0, (hexNum & 255) * f)) | 0;
  return `rgb(${r},${g},${b})`;
}

/** Solid surface: terrain mottling, latitude bands for giants, storm ovals. */
export function planetTexture(typeKey, t, rng) {
  if (surfCache.has(typeKey)) return surfCache.get(typeKey);
  const W = 512, H = 256;
  const made = canvas2d(W, H);
  if (!made) { const tex = new THREE.Texture(); surfCache.set(typeKey, tex); return tex; }
  const { cv, g } = made;

  g.fillStyle = hex(t.color);
  g.fillRect(0, 0, W, H);

  if (t.bands) {
    // gas giant: horizontal belts and zones, wavy so they don't read as stripes
    const bands = 14 + Math.floor(rng.next() * 10);
    for (let i = 0; i < bands; i++) {
      const y = (i / bands) * H;
      const h = H / bands * (0.7 + rng.next() * 0.9);
      const f = 0.72 + rng.next() * 0.6;
      g.fillStyle = shade(t.color, f);
      g.globalAlpha = 0.55;
      // draw the band as a wobbling ribbon
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= W; x += 16) {
        g.lineTo(x, y + Math.sin((x / W) * Math.PI * (2 + i % 3)) * (h * 0.16));
      }
      g.lineTo(W, y + h); g.lineTo(0, y + h);
      g.closePath(); g.fill();
    }
    g.globalAlpha = 1;
    // swirling storms — one great spot plus lesser vortices
    const storms = 3 + Math.floor(rng.next() * 4);
    for (let i = 0; i < storms; i++) {
      const big = i === 0;
      const cx = rng.next() * W;
      const cy = H * (0.25 + rng.next() * 0.5);
      const rx = (big ? 46 : 14) + rng.next() * (big ? 34 : 18);
      const ry = rx * (0.45 + rng.next() * 0.25);
      const grd = g.createRadialGradient(cx, cy, 1, cx, cy, rx);
      grd.addColorStop(0, shade(t.color, big ? 1.75 : 1.4));
      grd.addColorStop(0.55, shade(t.color, big ? 1.25 : 1.15));
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.save(); g.translate(cx, cy); g.scale(1, ry / rx); g.translate(-cx, -cy);
      g.fillStyle = grd;
      g.beginPath(); g.arc(cx, cy, rx, 0, Math.PI * 2); g.fill();
      g.restore();
    }
  } else {
    // rocky / icy / ocean: blotchy terrain, then craters or continents
    const blobs = 220;
    for (let i = 0; i < blobs; i++) {
      const x = rng.next() * W, y = rng.next() * H;
      const r = 6 + rng.next() * 46;
      const f = 0.6 + rng.next() * 0.75;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, shade(t.color, f));
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    // hot worlds get glowing fissures; cold ones get bright frost caps
    if (t.glow) {
      for (let i = 0; i < 90; i++) {
        const x = rng.next() * W, y = rng.next() * H;
        g.strokeStyle = shade(t.glow, 1.1 + rng.next() * 0.7);
        g.globalAlpha = 0.5 + rng.next() * 0.5;
        g.lineWidth = 1 + rng.next() * 2.5;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + (rng.next() - 0.5) * 60, y + (rng.next() - 0.5) * 34);
        g.stroke();
      }
      g.globalAlpha = 1;
    }
    // polar caps
    const capF = 1.5;
    g.fillStyle = shade(t.color, capF);
    g.globalAlpha = 0.55;
    g.beginPath(); g.ellipse(W / 2, 0, W * 0.62, H * 0.11, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(W / 2, H, W * 0.62, H * 0.11, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
  }

  // Force every pixel fully opaque — canvas globalAlpha draws can leave residual alpha
  // that Mesh materials treat as transparency and let stars punch through the disk.
  try {
    const img = g.getImageData(0, 0, W, H);
    const d = img.data;
    for (let i = 3; i < d.length; i += 4) d[i] = 255;
    g.putImageData(img, 0, 0);
  } catch (e) { /* tainted / headless */ }

  const tex = new THREE.Texture(cv);
  tex.needsUpdate = true;
  if (tex.wrapS !== undefined) { tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping; }
  surfCache.set(typeKey, tex);
  return tex;
}

/** Cloud deck: transparent sheet of wisps that rides above the surface. */
export function cloudTexture(typeKey, t, rng) {
  if (cloudCache.has(typeKey)) return cloudCache.get(typeKey);
  const W = 512, H = 256;
  const made = canvas2d(W, H);
  if (!made) { const tex = new THREE.Texture(); cloudCache.set(typeKey, tex); return tex; }
  const { cv, g } = made;

  g.clearRect(0, 0, W, H);
  const tint = t.atmo ? t.atmo.color : 0xffffff;
  const puffs = t.bands ? 150 : 110;
  for (let i = 0; i < puffs; i++) {
    const x = rng.next() * W;
    const y = t.bands
      ? (Math.floor(rng.next() * 14) / 14) * H + (rng.next() - 0.5) * 10   // hug the belts
      : rng.next() * H;
    const rx = (t.bands ? 40 : 18) + rng.next() * 46;
    const ry = rx * (t.bands ? 0.16 : 0.42) * (0.6 + rng.next() * 0.8);
    const a = 0.10 + rng.next() * 0.30;
    const grd = g.createRadialGradient(x, y, 0, x, y, rx);
    grd.addColorStop(0, `rgba(255,255,255,${a})`);
    grd.addColorStop(0.5, `rgba(${(tint >> 16) & 255},${(tint >> 8) & 255},${tint & 255},${a * 0.5})`);
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y);
    g.fillStyle = grd;
    g.beginPath(); g.arc(x, y, rx, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  const tex = new THREE.Texture(cv);
  tex.needsUpdate = true;
  if (tex.wrapS !== undefined) { tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping; }
  cloudCache.set(typeKey, tex);
  return tex;
}

/**
 * Soft radial glow for additive sprites.
 *
 * A SpriteMaterial with no `map` renders as a flat quad, so an additive sprite
 * without one shows up as a hard-edged translucent SQUARE — which is exactly what
 * the star glare was doing. Every glow sprite needs an alpha falloff to read as
 * light rather than geometry.
 */
let glowCache = null;
export function glowTexture() {
  if (glowCache) return glowCache;
  const S = 128;
  const made = canvas2d(S, S);
  if (!made) { glowCache = new THREE.Texture(); return glowCache; }
  const { cv, g } = made;
  const c = S / 2;
  const grd = g.createRadialGradient(c, c, 0, c, c, c);
  // tight white core, long soft tail, hard zero at the rim so the quad edge never shows
  grd.addColorStop(0.00, 'rgba(255,255,255,1)');
  grd.addColorStop(0.10, 'rgba(255,246,220,0.92)');
  grd.addColorStop(0.26, 'rgba(255,214,140,0.42)');
  grd.addColorStop(0.52, 'rgba(255,190,110,0.14)');
  grd.addColorStop(0.78, 'rgba(255,180,100,0.035)');
  grd.addColorStop(1.00, 'rgba(255,180,100,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);
  glowCache = new THREE.Texture(cv);
  glowCache.needsUpdate = true;
  return glowCache;
}
