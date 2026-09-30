export const host = {
  scene: null,
  toast: () => {},
};

export function setOpsHost({ scene, toast } = {}) {
  if (scene) host.scene = scene;
  if (toast) host.toast = toast;
  return host;
}

export function fxScene() {
  if (!host.scene) throw new Error("ops: no scene bound — call setOpsHost({ scene }) before opsBind()");
  return host.scene;
}
