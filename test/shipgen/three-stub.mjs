/* Minimal THREE stand-in for headless builder tests: real AABB math, no WebGL. */
class V3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this} setScalar(v){return this.set(v,v,v)}
 clone(){return new V3(this.x,this.y,this.z)} copy(v){return this.set(v.x,v.y,v.z)}
 add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this} sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this}
 subVectors(a,b){return this.set(a.x-b.x,a.y-b.y,a.z-b.z)} addVectors(a,b){return this.set(a.x+b.x,a.y+b.y,a.z+b.z)}
 multiplyScalar(k){this.x*=k;this.y*=k;this.z*=k;return this} divideScalar(k){return this.multiplyScalar(1/k)}
 multiply(v){this.x*=v.x;this.y*=v.y;this.z*=v.z;return this}
 length(){return Math.hypot(this.x,this.y,this.z)} normalize(){const l=this.length()||1;return this.multiplyScalar(1/l)}
 toArray(){return [this.x,this.y,this.z]} min(v){this.x=Math.min(this.x,v.x);this.y=Math.min(this.y,v.y);this.z=Math.min(this.z,v.z);return this}
 max(v){this.x=Math.max(this.x,v.x);this.y=Math.max(this.y,v.y);this.z=Math.max(this.z,v.z);return this}
 addScalar(k){this.x+=k;this.y+=k;this.z+=k;return this}}
class Euler{constructor(){this.x=0;this.y=0;this.z=0;this.order='XYZ'}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}}
class Obj3{constructor(){this.children=[];this.position=new V3();this.rotation=new Euler();this.scale=new V3(1,1,1);this.userData={};this.name='';this.id=Obj3.n=(Obj3.n||0)+1;this.parent=null}
 add(...os){for(const o of os){if(!o)throw new Error('add(undefined)');this.children.push(o);o.parent=this}return this}
 remove(o){this.children=this.children.filter(c=>c!==o)}
 traverse(f){f(this);for(const c of this.children)c.traverse(f)}
 clone(){const o=Object.create(Object.getPrototypeOf(this));Object.assign(o,this);o.position=this.position.clone();o.scale=this.scale.clone();
  o.rotation=new Euler().set(this.rotation.x,this.rotation.y,this.rotation.z);o.userData=JSON.parse(JSON.stringify(this.userData));o.children=this.children.map(c=>c.clone());return o}
 worldPos(){let p=this.position.clone();let n=this.parent;while(n){p.add(n.position);n=n.parent}return p}}
class Group extends Obj3{}
class Mesh extends Obj3{constructor(g,m){super();if(!g)throw new Error('Mesh with undefined geometry');if(!m)throw new Error('Mesh with undefined material');this.geometry=g;this.material=m;this.isMesh=true}}
class Color{constructor(c){this.c=c}lerp(){return this}setHSL(){return this}getHex(){return 0}setHex(){return this}setRGB(){return this}}
class Box3{constructor(min,max){this.min=min?min.clone():new V3(Infinity,Infinity,Infinity);this.max=max?max.clone():new V3(-Infinity,-Infinity,-Infinity)}
 isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}
 clone(){return new Box3(this.min,this.max)}
 expandByScalar(k){this.min.addScalar(-k);this.max.addScalar(k);return this}
 expandByPoint(p){this.min.min(p);this.max.max(p);return this}
 setFromCenterAndSize(c,s){this.min=c.clone().sub(s.clone().multiplyScalar(.5));this.max=c.clone().add(s.clone().multiplyScalar(.5));return this}
 getCenter(v){return v.addVectors(this.min,this.max).multiplyScalar(0.5)}
 getSize(v){return v.subVectors(this.max,this.min)}
 intersectsBox(b){return !(b.max.x<this.min.x||b.min.x>this.max.x||b.max.y<this.min.y||b.min.y>this.max.y||b.max.z<this.min.z||b.min.z>this.max.z)}
 setFromObject(o){this.min.set(Infinity,Infinity,Infinity);this.max.set(-Infinity,-Infinity,-Infinity);
  o.traverse(c=>{if(!c.isMesh)return;const M=worldMatrix(c);const ext=geoExtent(c.geometry);
    for(const sx of[-1,1])for(const sy of[-1,1])for(const sz of[-1,1]){const p=applyM(M,[sx*ext[0],sy*ext[1],sz*ext[2]]);this.expandByPoint(new V3(p[0],p[1],p[2]));}});return this}}
function rotM(e){const cx=Math.cos(e.x),sx=Math.sin(e.x),cy=Math.cos(e.y),sy=Math.sin(e.y),cz=Math.cos(e.z),sz=Math.sin(e.z);
 const Rx=[[1,0,0],[0,cx,-sx],[0,sx,cx]],Ry=[[cy,0,sy],[0,1,0],[-sy,0,cy]],Rz=[[cz,-sz,0],[sz,cz,0],[0,0,1]];
 const mul=(A,B)=>A.map((r,i)=>B[0].map((_,j)=>r.reduce((acc,_,k)=>acc+A[i][k]*B[k][j],0)));
 return e.order==='YXZ'?mul(Ry,mul(Rx,Rz)):mul(Rx,mul(Ry,Rz));}
// 4x4 as {R:3x3 (includes scale), t:[x,y,z]}
function localMatrix(o){const R=rotM(o.rotation);const S=[o.scale.x,o.scale.y,o.scale.z];const RS=R.map(r=>r.map((v,j)=>v*S[j]));return {R:RS,t:[o.position.x,o.position.y,o.position.z]};}
function composeM(P,L){const R=P.R.map((r,i)=>L.R[0].map((_,j)=>r.reduce((acc,_,k)=>acc+P.R[i][k]*L.R[k][j],0)));const t=applyM(P,L.t);return {R,t};}
function applyM(M,v){return [M.R[0][0]*v[0]+M.R[0][1]*v[1]+M.R[0][2]*v[2]+M.t[0],M.R[1][0]*v[0]+M.R[1][1]*v[1]+M.R[1][2]*v[2]+M.t[1],M.R[2][0]*v[0]+M.R[2][1]*v[1]+M.R[2][2]*v[2]+M.t[2]];}
function worldMatrix(o){let M=localMatrix(o);let n=o.parent;while(n){M=composeM(localMatrix(n),M);n=n.parent;}return M;}
function geoExtent(g){switch(g.type){case 'Box':return [.5,.5,.5];case 'Sphere':return [1,1,1];case 'Cyl':case 'Cone':return [1,.5,1];
 case 'Torus':{const t=g.args[1]??.4;return [1+t,1+t,t]}case 'Ring':return [1,1,0.01];default:return [1,1,1];}}
class Geo{constructor(t,a){this.type=t;this.args=a;this.userData={};for(const x of a||[])if(typeof x==='number'&&!isFinite(x))throw new Error('bad geometry arg in '+t)}dispose(){}translate(){return this}}
const mkGeo=t=>class extends Geo{constructor(...a){super(t,a)}};
const THREE={
 Group,Mesh,Color,Box3,Vector3:V3,MathUtils:{clamp:(v,a,b)=>Math.max(a,Math.min(b,v))},
 BoxGeometry:mkGeo('Box'),SphereGeometry:mkGeo('Sphere'),CylinderGeometry:mkGeo('Cyl'),
 ConeGeometry:mkGeo('Cone'),TorusGeometry:mkGeo('Torus'),RingGeometry:mkGeo('Ring'),CircleGeometry:mkGeo('Circle'),TorusKnotGeometry:mkGeo('Knot'),
 ExtrudeGeometry:mkGeo('Extrude'),Shape:class{moveTo(){}lineTo(){}closePath(){}},
 MeshStandardMaterial:class{constructor(o){Object.assign(this,o);this.userData={};if(!(this.color instanceof Color))this.color=new Color(this.color);if(!(this.emissive instanceof Color))this.emissive=new Color(this.emissive)}
   clone(){const m=new THREE.MeshStandardMaterial(this);m.userData={};return m}dispose(){}},
 PointLight:class extends Obj3{constructor(...a){super();this.args=a;this.isPointLight=true}},
 FrontSide:0,DoubleSide:2
};
THREE.MeshPhysicalMaterial=THREE.MeshStandardMaterial;
THREE.LatheGeometry=mkGeo('Lathe');THREE.Vector2=class{constructor(x=0,y=0){this.x=x;this.y=y}};

export { Group, Mesh, Color, Box3 };
export const { LatheGeometry, Vector2, MeshPhysicalMaterial, CircleGeometry, TorusKnotGeometry, Vector3, MathUtils, BoxGeometry, SphereGeometry, CylinderGeometry, ConeGeometry,
  TorusGeometry, RingGeometry, ExtrudeGeometry, Shape, MeshStandardMaterial, PointLight, FrontSide, DoubleSide } = THREE;
export default THREE;

/* ---- extras so app/ops modules can be smoke-tested headless ---- */
Obj3.prototype.updateMatrixWorld = function () {};
Obj3.prototype.localToWorld = function (v) { const M = worldMatrix(this); const p = applyM(M, [v.x, v.y, v.z]); return v.set(p[0], p[1], p[2]); };
Obj3.prototype.getWorldPosition = function (v) { return this.localToWorld(v.set(0, 0, 0)); };
Obj3.prototype.worldToLocal = function (v) { const M = worldMatrix(this); const d = [v.x - M.t[0], v.y - M.t[1], v.z - M.t[2]]; // inverse of R (assume orthonormal*scale≈1)
  return v.set(M.R[0][0]*d[0]+M.R[1][0]*d[1]+M.R[2][0]*d[2], M.R[0][1]*d[0]+M.R[1][1]*d[1]+M.R[2][1]*d[2], M.R[0][2]*d[0]+M.R[1][2]*d[1]+M.R[2][2]*d[2]); };
V3.prototype.addScaledVector = function (v, k) { this.x += v.x*k; this.y += v.y*k; this.z += v.z*k; return this; };
V3.prototype.lerpVectors = function (a, b, k) { return this.set(a.x+(b.x-a.x)*k, a.y+(b.y-a.y)*k, a.z+(b.z-a.z)*k); };
V3.prototype.distanceTo = function (v) { return Math.hypot(this.x-v.x, this.y-v.y, this.z-v.z); };
V3.prototype.lengthSq = function () { return this.x*this.x+this.y*this.y+this.z*this.z; };
Color.prototype.getHex = function () { return 0; };
class Quaternion { setFromUnitVectors() { return this; } }
class BufferAttribute { constructor(arr, n) { this.array = arr; this.itemSize = n; this.count = arr.length / n; } getX(i){return this.array[i*3]} getY(i){return this.array[i*3+1]} getZ(i){return this.array[i*3+2]} setXYZ(i,x,y,z){this.array[i*3]=x;this.array[i*3+1]=y;this.array[i*3+2]=z;} }
class BufferGeometry extends Geo { constructor() { super('Buffer', []); this.attributes = {}; } setAttribute(k, a) { this.attributes[k] = a; } computeVertexNormals() {} }
class IcosahedronGeometry extends BufferGeometry { constructor(r, d) { super(); const n = 42; const arr = new Float32Array(n*3); for (let i=0;i<n;i++){arr[i*3]=r*Math.sin(i);arr[i*3+1]=r*Math.cos(i*1.3);arr[i*3+2]=r*Math.sin(i*0.7);} this.attributes.position = new BufferAttribute(arr, 3); this.type='Ico'; this.args=[r,d]; } }
class Points extends Obj3 { constructor(g, m) { super(); this.geometry = g; this.material = m; } }
class Box3Helper extends Obj3 { constructor(b, c) { super(); this.box = b; this.material = { transparent: false, opacity: 1 }; } }
class Clock { constructor() { this.elapsedTime = 0; } getDelta() { this.elapsedTime += 1/60; return 1/60; } }
Object.assign(THREE, { Quaternion, BufferAttribute, BufferGeometry, IcosahedronGeometry, Points, Box3Helper, Clock,
  OctahedronGeometry: mkGeo('Octa'), DodecahedronGeometry: mkGeo('Dodeca'),
  MeshBasicMaterial: THREE.MeshStandardMaterial, PointsMaterial: THREE.MeshStandardMaterial,
  AdditiveBlending: 2, NormalBlending: 1 });
export { Quaternion, BufferAttribute, BufferGeometry, IcosahedronGeometry, Points, Box3Helper, Clock };
export const { OctahedronGeometry, DodecahedronGeometry, MeshBasicMaterial, PointsMaterial, AdditiveBlending, NormalBlending } = THREE;
Object.defineProperty(Obj3.prototype, "quaternion", { get() { return this._q || (this._q = new Quaternion()); } });
Obj3.prototype.updateWorldMatrix = function () {};
V3.prototype.dot = function (v) { return this.x*v.x + this.y*v.y + this.z*v.z; };
Obj3.prototype.getWorldQuaternion = function (q) { return q || new Quaternion(); };
Quaternion.prototype.copy = function () { return this; };
V3.prototype.lerp = function (v, k) { this.x += (v.x-this.x)*k; this.y += (v.y-this.y)*k; this.z += (v.z-this.z)*k; return this; };
/* spectator page needs: fog, raycaster, world-position helpers */
class FogExp2 { constructor(c, d) { this.color = new Color(c); this.density = d; } }
class Raycaster { setFromCamera() {} intersectObjects() { return []; } }
Object.assign(THREE, { FogExp2, Raycaster });
export { FogExp2, Raycaster };
