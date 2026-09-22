/* LIVING GALAXY — the two names js/asteroidgen/blackhole.js imports from
 * `three/addons/postprocessing/Pass.js`, and nothing else from three's
 * post-processing examples. The game does not vendor three/addons (its own
 * compact composer is js/postfx.js), so the import map points that one
 * specifier here. Same contract as three's own: a Pass has enabled /
 * needsSwap / clear / renderToScreen and a render(renderer, write, read);
 * a FullScreenQuad draws one material over the whole target. */
import { OrthographicCamera, Float32BufferAttribute, BufferGeometry, Mesh } from "three";

export class Pass {
  constructor() {
    this.isPass = true;
    this.enabled = true;
    this.needsSwap = true;
    this.clear = false;
    this.renderToScreen = false;
  }
  setSize() {}
  render() { console.error("Pass: .render() must be implemented in derived pass."); }
  dispose() {}
}

const _camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

/* one triangle that covers the screen: no diagonal seam, fewer vertices */
class FullscreenTriangleGeometry extends BufferGeometry {
  constructor() {
    super();
    this.setAttribute("position", new Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3));
    this.setAttribute("uv", new Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));
  }
}
const _geometry = new FullscreenTriangleGeometry();

export class FullScreenQuad {
  constructor(material) {
    this._mesh = new Mesh(_geometry, material);
  }
  dispose() { this._mesh.geometry.dispose(); }
  render(renderer) { renderer.render(this._mesh, _camera); }
  get material() { return this._mesh.material; }
  set material(value) { this._mesh.material = value; }
}
