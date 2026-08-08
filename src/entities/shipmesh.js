// Living Galaxy — a visible hull. Used by the chase cam for your own ship and by
// the multiplayer layer for other pilots. Nose points -Z to match the flight basis.

const COLORS = {
  military: 0xff5555, industrial: 0xffaa22, logistics: 0x55ff77,
  economic: 0xff66ff, civilian: 0x88ccff
};

export function buildShip(classKey) {
  const col = COLORS[classKey] || 0x88ccff;
  const g = new THREE.Group();
  g.rotation.order = 'YXZ';

  const hull = new THREE.Mesh(
    new THREE.ConeGeometry(3.2, 11, 6),
    new THREE.MeshStandardMaterial({ color: col, metalness: 0.6, roughness: 0.35,
      emissive: col, emissiveIntensity: 0.15 })
  );
  hull.rotation.x = -Math.PI / 2;          // tip +Y → -Z
  g.add(hull);

  const dark = new THREE.MeshStandardMaterial({ color: 0x223347, metalness: 0.8, roughness: 0.3 });
  const wing = new THREE.Mesh(new THREE.BoxGeometry(12, 0.7, 3.4), dark);
  wing.position.z = 2.2;
  g.add(wing);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.5, 3), dark);
  fin.position.set(0, 2, 2.4);
  g.add(fin);

  const lt = new THREE.PointLight(col, 0.5, 60);
  lt.position.z = 5;
  g.add(lt);
  return g;
}
