// Headless harness: just enough DOM + three.js to boot Living Galaxy in Node and run frames.
// Not a renderer — a correctness check that every code path executes.

import { readFileSync } from 'fs';

// ── DOM ──────────────────────────────────────────────────────────────
class ClassList {
  constructor(node) { this.node = node; this.set = new Set(); }
  add(...c) { c.forEach(x => x && this.set.add(x)); }
  remove(...c) { c.forEach(x => this.set.delete(x)); }
  toggle(c, on) { if (on === undefined) on = !this.set.has(c); on ? this.set.add(c) : this.set.delete(c); return on; }
  contains(c) { return this.set.has(c); }
  get value() { return [...this.set].join(' '); }
}

class Node2 {
  constructor(tag, id) {
    this.tagName = (tag || 'div').toUpperCase();
    this.id = id || '';
    this.children = [];
    this.parentElement = null;
    this.dataset = {};
    this.style = new Proxy({}, { get: (t, k) => t[k] || '', set: (t, k, v) => { t[k] = v; return true; } });
    this.classList = new ClassList(this);
    this._html = '';
    this.textContent = '';
    this.listeners = {};
    this.disabled = false;
    this.width = 300; this.height = 300;
    this.clientWidth = 300; this.clientHeight = 300;
  }
  set className(v) { this.classList.set = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return this.classList.value; }
  set innerHTML(v) { this._html = String(v); if (v === '') this.children = []; }
  get innerHTML() { return this._html; }
  appendChild(c) { c.parentElement = this; this.children.push(c); return c; }
  addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); }
  removeEventListener() {}
  setPointerCapture() {} releasePointerCapture() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: 300, height: 200, right: 300, bottom: 200 }; }
  closest() { return null; }
  querySelectorAll() { return []; }
  focus() {}
  getContext() { return ctx2d; }
  dispatch(type, ev = {}) { (this.listeners[type] || []).forEach(f => f(Object.assign({ preventDefault() {}, stopPropagation() {} }, ev))); }
}

const ctx2d = new Proxy({}, {
  get: (t, k) => {
    if (k === 'createRadialGradient') return () => ({ addColorStop() {} });
    if (k === 'getImageData') return () => ({ data: new Uint8ClampedArray(16) });
    if (k === 'putImageData') return () => {};
    if (typeof t[k] === 'undefined') return () => {};   // any other ctx method is a no-op
    return t[k];
  },
  set: (t, k, v) => { t[k] = v; return true; }
});

const nodes = new Map();
function makeIdsFromHtml(html) {
  const re = /id="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) nodes.set(m[1], new Node2('div', m[1]));
}

const doc = {
  body: new Node2('body'),
  // The display system sets classes and a font size on <html>, so the harness needs a
  // real node there rather than undefined — otherwise every palette test throws.
  documentElement: new Node2('html'),
  hidden: false,
  getElementById: id => nodes.get(id) || null,
  createElement: tag => new Node2(tag),
  querySelectorAll: sel => {
    if (sel === '.ship-btn') return shipButtons;
    if (sel === '.preset-btn') return presetButtons;
    if (sel === '#dock-tabs .tab') return dockTabs;
    if (sel === '#contact-tabs .ctab') return contactTabs;
    if (sel === '#fit-tabs .tab') return fitTabs;
    if (sel === '#crew-tabs .tab') return crewTabs;
    if (sel === '#navmap-tools .chip[data-filter]') return navChips;
    if (sel === '.collapsible h3') return [];
    return [];
  },
  addEventListener() {}
};
const shipButtons = [], presetButtons = [], dockTabs = [];
const contactTabs = [], fitTabs = [], crewTabs = [], navChips = [];

// ── globals ──────────────────────────────────────────────────────────
export function installGlobals(htmlPath) {
  makeIdsFromHtml(readFileSync(htmlPath, 'utf8'));
  for (const k of ['military','industrial','logistics','economic','civilian']) { const b = new Node2('button'); b.dataset.class = k; shipButtons.push(b); }
  for (const pct of [-25, 0, 25, 50, 100]) { const b = new Node2('button'); b.dataset.pct = String(pct); presetButtons.push(b); }
  for (const t of ['trade', 'service', 'refit', 'hulls', 'modules', 'board', 'pilot', 'crew', 'station']) { const b = new Node2('button'); b.dataset.tab = t; dockTabs.push(b); }
  for (const c of ['all', 'ship', 'station', 'body', 'belt']) { const b = new Node2('button'); b.dataset.cat = c; contactTabs.push(b); }
  for (const t of ['slots', 'locker', 'stats']) { const b = new Node2('button'); b.dataset.fittab = t; fitTabs.push(b); }
  for (const t of ['roster', 'hire', 'depts']) { const b = new Node2('button'); b.dataset.crewtab = t; crewTabs.push(b); }
  for (const f of ['planet', 'station', 'belt', 'ship']) { const b = new Node2('button'); b.dataset.filter = f; navChips.push(b); }

  global.document = doc;
  global.window = global;
  global.innerWidth = 390;
  global.innerHeight = 780;
  global.devicePixelRatio = 2;
  global.location = { reload() {} };
  global.localStorage = {
    _d: {},
    getItem(k) { return k in this._d ? this._d[k] : null; },
    setItem(k, v) { this._d[k] = String(v); },
    removeItem(k) { delete this._d[k]; }
  };
  global.addEventListener = () => {};
  global.setTimeout = setTimeout;
  global.clearTimeout = clearTimeout;
  global.requestAnimationFrame = () => 0;
  global.AudioContext = undefined;
  global.THREE = makeThree();
  return { doc, nodes };
}

// ── three.js stub ────────────────────────────────────────────────────
function makeThree() {
  class Vector3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    setScalar(s) { this.x = this.y = this.z = s; return this; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    clone() { return new Vector3(this.x, this.y, this.z); }
    add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
    addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
    multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
    divideScalar(s) { return this.multiplyScalar(1 / s); }
    lengthSq() { return this.x ** 2 + this.y ** 2 + this.z ** 2; }
    length() { return Math.sqrt(this.lengthSq()); }
    normalize() { const l = this.length() || 1; return this.divideScalar(l); }
    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
    distanceToSquared(v) { return (this.x - v.x) ** 2 + (this.y - v.y) ** 2 + (this.z - v.z) ** 2; }
    distanceTo(v) { return Math.sqrt(this.distanceToSquared(v)); }
    lerp(v, t) { this.x += (v.x - this.x) * t; this.y += (v.y - this.y) * t; this.z += (v.z - this.z) * t; return this; }
    lerpVectors(a, b, t) { this.x = a.x + (b.x - a.x) * t; this.y = a.y + (b.y - a.y) * t; this.z = a.z + (b.z - a.z) * t; return this; }
    project() { this.x = 0.1; this.y = 0.1; this.z = 0.5; return this; }
  }
  class Euler { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; this.order = 'XYZ'; } copy(e) { this.x = e.x; this.y = e.y; this.z = e.z; return this; } }
  class Quaternion { rotateTowards() { return this; } copy() { return this; } }
  class Color {
    constructor(hex = 0xffffff) { this.setHex(hex); }
    setHex(h) { this.r = ((h >> 16) & 255) / 255; this.g = ((h >> 8) & 255) / 255; this.b = (h & 255) / 255; return this; }
    setHSL(h, s, l) { this.r = l; this.g = l; this.b = l; return this; }
    getHex() { return ((this.r * 255) << 16) | ((this.g * 255) << 8) | (this.b * 255); }
    clone() { const c = new Color(); c.r = this.r; c.g = this.g; c.b = this.b; return c; }
  }
  class Matrix4 { constructor() { this.elements = new Array(16).fill(0); } }
  class Object3D {
    constructor() {
      this.position = new Vector3(); this.rotation = new Euler(); this.scale = new Vector3(1, 1, 1);
      this.quaternion = new Quaternion(); this.children = []; this.userData = {};
      this.matrix = new Matrix4(); this.visible = true; this.frustumCulled = true; this.up = new Vector3(0, 1, 0);
    }
    add(o) { this.children.push(o); return this; }
    remove(o) { const i = this.children.indexOf(o); if (i >= 0) this.children.splice(i, 1); return this; }
    lookAt() {}
    updateMatrix() {}
    updateProjectionMatrix() {}
  }
  class BufferAttribute {
    constructor(array, itemSize) { this.array = array; this.itemSize = itemSize; this.count = array.length / itemSize; this.needsUpdate = false; }
    setXYZ(i, x, y, z) { this.array[i * 3] = x; this.array[i * 3 + 1] = y; this.array[i * 3 + 2] = z; }
    getX(i) { return this.array[i * 3]; } getY(i) { return this.array[i * 3 + 1]; } getZ(i) { return this.array[i * 3 + 2]; }
    setUsage() { return this; }
  }
  class BufferGeometry {
    constructor() { this.attributes = {}; this.drawRange = { start: 0, count: Infinity }; }
    setAttribute(n, a) { this.attributes[n] = a; return this; }
    setDrawRange(s, c) { this.drawRange = { start: s, count: c }; }
    computeVertexNormals() {}
    dispose() {}
  }
  const geo = (n = 24) => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
    return g;
  };
  class Mesh extends Object3D { constructor(g, m) { super(); this.geometry = g; this.material = m; } }
  class Points extends Mesh {}
  class Line extends Mesh {}
  class LineSegments extends Mesh {}
  class InstancedMesh extends Mesh {
    constructor(g, m, count) {
      super(g, m); this.count = count;
      this.instanceMatrix = new BufferAttribute(new Float32Array(count * 16), 16);
      this.instanceColor = new BufferAttribute(new Float32Array(count * 3), 3);
    }
    setMatrixAt() {} setColorAt() {}
  }
  const mat = () => ({ color: new Color(), opacity: 1, setHex() {} });
  const matWithColor = (o = {}) => { const m = Object.assign(mat(), o); m.color = { setHex() {} }; return m; };

  return {
    Vector3, Euler, Quaternion, Color, Matrix4, Object3D, BufferGeometry, BufferAttribute,
    Mesh, Points, Line, LineSegments, InstancedMesh,
    Sprite: class extends Object3D { constructor(m) { super(); this.material = m || { opacity: 1 }; } },
    SpriteMaterial: class {
      constructor(o = {}) {
        Object.assign(this, o);
        this.color = new Color(o.color || 0xffffff);
        this.opacity = o.opacity ?? 1;
      }
    },
    Group: class extends Object3D {},
    Scene: class extends Object3D { constructor() { super(); this.fog = null; } },
    PerspectiveCamera: class extends Object3D { constructor(f, a, n, fa) { super(); this.fov = f; this.aspect = a; } },
    WebGLRenderer: class { constructor(o) { this.domElement = o.canvas; } setSize() {} setPixelRatio() {} render() {} },
    PointLight: class extends Object3D {}, AmbientLight: class extends Object3D {},
    Texture: class { constructor() { this.needsUpdate = false; } },
    FogExp2: class {}, ACESFilmicToneMapping: 4, AdditiveBlending: 2, BackSide: 1, DoubleSide: 2,
    DynamicDrawUsage: 35048,
    SphereGeometry: class { constructor() { return geo(); } },
    BoxGeometry: class { constructor() { return geo(); } },
    ConeGeometry: class { constructor() { return geo(); } },
    CylinderGeometry: class { constructor() { return geo(); } },
    TorusGeometry: class { constructor() { return geo(); } },
    RingGeometry: class { constructor() { return geo(); } },
    OctahedronGeometry: class { constructor() { return geo(); } },
    IcosahedronGeometry: class { constructor() { return geo(); } },
    DodecahedronGeometry: class { constructor() { return geo(20); } },
    MeshStandardMaterial: class { constructor(o) { return matWithColor(o); } },
    MeshBasicMaterial: class { constructor(o) { return matWithColor(o); } },
    PointsMaterial: class { constructor() { return matWithColor(); } },
    LineBasicMaterial: class { constructor() { return matWithColor(); } },
    MathUtils: { clamp: (v, a, b) => Math.min(Math.max(v, a), b), lerp: (a, b, t) => a + (b - a) * t, degToRad: d => d * Math.PI / 180, radToDeg: r => r * 180 / Math.PI }
  };
}
