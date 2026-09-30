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
