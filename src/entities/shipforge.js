// Living Galaxy — procedural ship hulls.
//
// What this replaces was thirty-seven lines: a cone, a box for wings, a box for a fin, and
// five colours in a lookup keyed by career. Every hull in the galaxy was that cone. A
// Nexis courier and a pirate raider differed by tint, and the tint was the only thing
// carrying the difference — so a hull you saw at range told you nothing you could act on
// until the HUD labelled it.
//
// This lofts a hull instead. A category declares a silhouette as radius keyframes down its
// own length, and the builder sweeps a ring along that profile, then hangs the category's
// kit on the result at real surface positions — containers on a freighter's dorsal spine,
// turrets on a warship's flanks, a habitation ring on a liner, cages on a slaver. The
// stats it reports are measured off the geometry that was actually built rather than
// declared alongside it.
//
// ## Length : beam is derived, not drawn
//
// The generator this came from had a defect worth keeping the fix visible for. Radial size
// came from a free-floating `scale` while length came from the category, so the two were
// unrelated draws and the ratio between them ran from 12:1 to **124:1** — a logistic hull
// three metres across and three hundred and forty-eight metres long. Every hull was a
// pencil, and the viewer looked broken rather than looking like it had thin ships in it.
//
// Radial scale is now derived from a per-category target length:beam, so girth tracks
// length however the length rolls. That is the same principle the world catalogue runs on:
// where two numbers have to agree, one of them is computed from the other.
//
// ## Determinism
//
// Seed plus category produces an identical hull, identical stats and an identical name,
// forever. This is not decoration — an NPC's hull is rebuilt whenever it respawns or the
// player jumps back into a system, and a raider that changed shape between visits would
// read as a different ship. The seeding runs through `core/rng.js` rather than the
// generator's own mulberry32, so hulls draw from the same stream discipline as everything
// else the seed decides.
//
// ## Orientation
//
// Hulls are built **nose at +Z**, which is what `Object3D.lookAt` wants and therefore what
// `entities/npcs.js` has always assumed. The player's chase cam uses the opposite basis;
// `shipmesh.js` owns that flip so this file has exactly one convention.
//
// Requires THREE in scope, like every other mesh builder here.

import { makeRng, hashString } from '../core/rng.js';

const lerp = (a, b, t) => a + (b - a) * t;
const pick = (r, a) => a[Math.floor(r() * a.length) | 0];
const rng = (r, a, b) => a + r() * (b - a);
const irng = (r, a, b) => Math.floor(a + r() * (b - a + 1));

/* ---------- category registry ----------
   Each entry: palette, silhouette keyframes, kit weights, stat model, LG class map. */
export const CATS={
 trade:{label:'Trade',accent:'#e0a94a',lg:'economic',
   pal:{hull:0x8a7a5e,trim:0x3b3226,glow:0xffc561,glass:0x9fd8ff},
   lb:4.5,sides:6,len:30,jitter:.03,
   keys:[{t:0,r:.26,w:1,h:.8},{t:.14,r:.5,w:1.05,h:.9},{t:.22,r:1,w:1.28,h:1},
         {t:.78,r:1,w:1.28,h:1},{t:.86,r:.86,w:1.1,h:1},{t:1,r:.72,w:1,h:.9}],
   engines:[3,5],eng:.62,dens:.34,
   kit:['containers','tanks','dish','strut'],
   roles:['bulk hauler','contract runs','ore & alloy freight','station resupply']},

 military:{label:'Military',accent:'#ff5c4d',lg:'military',
   pal:{hull:0x3d4750,trim:0x171c21,glow:0x7fd4ff,glass:0x86e0ff},
   lb:7,sides:8,len:34,jitter:.02,
   keys:[{t:0,r:.05,w:1,h:.6},{t:.1,r:.22,w:1.45,h:.5},{t:.36,r:.56,w:1.6,h:.55},
         {t:.7,r:.6,w:1.3,h:.72},{t:.86,r:.7,w:1.2,h:.82},{t:1,r:.54,w:1.1,h:.75}],
   engines:[4,6],eng:.5,dens:.62,
   kit:['turrets','wings','armor','dish','strut'],
   roles:['line combat','patrol wing','boarding suppression','escort duty']},

 economic:{label:'Economic',accent:'#f2e9d0',lg:'economic',
   pal:{hull:0xd9d3c4,trim:0xb08a3c,glow:0xffe9b0,glass:0x7fc9ff},
   lb:6,sides:14,len:26,jitter:0,
   keys:[{t:0,r:.09,w:1,h:.7},{t:.26,r:.55,w:1.2,h:.66},{t:.56,r:.6,w:1.15,h:.72},
         {t:.82,r:.45,w:1,h:.66},{t:1,r:.26,w:.9,h:.6}],
   engines:[2,2],eng:.8,dens:.28,
   kit:['windows','fins','dish'],
   roles:['executive transit','courier & bond runs','corp negotiation','market arbitrage']},

 logistic:{label:'Logistic',accent:'#5aa8ff',lg:'logistics',
   pal:{hull:0x5c6672,trim:0x232a33,glow:0x9fd0ff,glass:0xa8e2ff},
   lb:5,sides:8,len:34,jitter:.02,
   keys:[{t:0,r:.44,w:1.1,h:1},{t:.18,r:.5,w:1.15,h:1},{t:.26,r:.15,w:1,h:1},
         {t:.7,r:.15,w:1,h:1},{t:.78,r:.62,w:1.2,h:1.1},{t:1,r:.5,w:1,h:1}],
   engines:[4,4],eng:.6,dens:.3,
   kit:['spinepods','clamps','arms','dish'],
   roles:['modular pod ferry','yard tug','fleet resupply','wreck recovery']},

 civilian:{label:'Civilian',accent:'#8fd3ff',lg:'civilian',
   pal:{hull:0xb9c6d2,trim:0x2c3a48,glow:0xffe7c2,glass:0xcfefff},
   lb:8,sides:16,len:36,jitter:0,
   keys:[{t:0,r:.11,w:1,h:.8},{t:.13,r:.42,w:1,h:.82},{t:.22,r:.5,w:1,h:.85},
         {t:.8,r:.5,w:1,h:.85},{t:.92,r:.44,w:1,h:.8},{t:1,r:.28,w:.9,h:.72}],
   engines:[2,3],eng:.66,dens:.24,
   kit:['windows','ring','lifeboats','dish'],
   roles:['passenger liner','colonist transit','tourism circuit','crew rotation']},

 agriculture:{label:'Agriculture',accent:'#7ede7a',lg:'industrial',
   pal:{hull:0x7d8a6a,trim:0x2c3626,glow:0x9dffa0,glass:0xcaffd4},
   lb:3.4,sides:10,len:26,jitter:.02,
   keys:[{t:0,r:.24,w:1,h:.85},{t:.16,r:.6,w:1,h:.9},{t:.5,r:.86,w:1,h:1},
         {t:.84,r:.6,w:1,h:.95},{t:1,r:.44,w:.95,h:.85}],
   engines:[2,3],eng:.6,dens:.3,
   kit:['drums','domes','tanks','dish'],
   roles:['hydroponic barge','seed vault run','protein vat supply','famine relief']},

 medical:{label:'Medical',accent:'#ff8fa8',lg:'civilian',
   pal:{hull:0xe6ecef,trim:0xc0453f,glow:0xff9aa8,glass:0xd6f2ff},
   lb:5,sides:12,len:26,jitter:0,
   keys:[{t:0,r:.3,w:1,h:.85},{t:.2,r:.62,w:1.05,h:.9},{t:.7,r:.62,w:1.05,h:.9},
         {t:.86,r:.5,w:1,h:.85},{t:1,r:.38,w:.95,h:.8}],
   engines:[2,3],eng:.7,dens:.26,
   kit:['crossbay','ring','windows','lifeboats','dish'],
   roles:['triage response','plague quarantine','field hospital','evac & casualty lift']},

 slavers:{label:'Slavers',accent:'#c56bff',lg:'military',
   pal:{hull:0x4a3f3a,trim:0x1a1412,glow:0xff4d3d,glass:0x6a4a55},
   lb:5,sides:7,len:28,jitter:.34,
   keys:[{t:0,r:.18,w:1,h:.7},{t:.16,r:.5,w:1.3,h:.7},{t:.46,r:.76,w:1.2,h:.92},
         {t:.72,r:.6,w:1.4,h:.8},{t:1,r:.48,w:1,h:.7}],
   engines:[2,4],eng:.7,dens:.44,
   kit:['holdpods','ram','armor','turrets','strut'],
   roles:['raider — hostile','contraband cargo','bounty target','faction: outlaw']}
};

/* ---------- naming ---------- */
const NAMES={
 trade:{a:['Ledger','Freeport','Longhaul','Cargo','Tariff','Bulkline'],b:['Mule','Drayman','Carrack','Hopper','Wain']},
 military:{a:['Vigil','Ironbrand','Sable','Bastion','Requiem','Pike'],b:['Lance','Cutter','Bulwark','Talon','Sabre']},
 economic:{a:['Meridian','Solvent','Prospect','Concord','Bourse'],b:['Envoy','Signet','Broker','Aurum','Clarion']},
 logistic:{a:['Yardline','Dependable','Tandem','Anchor','Relay'],b:['Tug','Spine','Dockhand','Ferryman','Rigger']},
 civilian:{a:['Bright','Homeward','Aurora','Wanderlight','Kindly'],b:['Passage','Sojourn','Liner','Promenade','Voyager']},
 agriculture:{a:['Green','Harvest','Furrow','Vernal','Seedline'],b:['Grange','Bloom','Silo','Trellis','Orchard']},
 medical:{a:['Mercy','Lucent','Vigilant','Sanctum','Calm'],b:['Ward','Lazaret','Caduceus','Respite','Aegis']},
 slavers:{a:['Ragged','Broken','Gnash','Hollow','Chain'],b:['Yoke','Coffle','Maw','Shackle','Vulture']}
};
export function shipName(r,cat){const n=NAMES[cat];
  return pick(r,n.a)+' '+pick(r,n.b)+' '+String.fromCharCode(65+irng(r,0,25))+'-'+irng(r,100,989);}

/* ---------- geometry helpers ---------- */
function sampleKeys(keys,t){
  let a=keys[0],b=keys[keys.length-1];
  for(let i=0;i<keys.length-1;i++){ if(t>=keys[i].t&&t<=keys[i+1].t){a=keys[i];b=keys[i+1];break;} }
  const span=(b.t-a.t)||1, k=(t-a.t)/span, s=k*k*(3-2*k);
  const g=(o,d)=>o===undefined?d:o;
  return {r:lerp(g(a.r,1),g(b.r,1),s), w:lerp(g(a.w,1),g(b.w,1),s),
          h:lerp(g(a.h,1),g(b.h,1),s), y:lerp(g(a.y,0),g(b.y,0),s)};
}
/* Ring-lofted hull. Returns geometry + a port() lookup so modules snap to the real surface. */
export function loftHull(o){
  const {keys,sides,len,scale,segs=30,jitter=0,rnd}=o;
  const pos=[],idx=[],jit=[];
  for(let i=0;i<=segs;i++) jit.push(jitter?1+(rnd()-0.5)*jitter:1);
  for(let i=0;i<=segs;i++){
    const t=i/segs,k=sampleKeys(keys,t),j=jit[i];
    for(let s=0;s<sides;s++){
      const a=(s/sides)*Math.PI*2;
      pos.push(Math.cos(a)*k.r*k.w*scale*j, Math.sin(a)*k.r*k.h*scale*j + k.y*scale, (0.5-t)*len);
    }
  }
  for(let i=0;i<segs;i++)for(let s=0;s<sides;s++){
    const a=i*sides+s,b=i*sides+(s+1)%sides,c=(i+1)*sides+s,d=(i+1)*sides+(s+1)%sides;
    idx.push(a,c,b,b,c,d);
  }
  const nose=pos.length/3; pos.push(0,sampleKeys(keys,0).y*scale,len*0.5);
  for(let s=0;s<sides;s++) idx.push(nose,s,(s+1)%sides);
  const tail=pos.length/3; pos.push(0,sampleKeys(keys,1).y*scale,-len*0.5);
  const off=segs*sides;
  for(let s=0;s<sides;s++) idx.push(tail,off+(s+1)%sides,off+s);
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setIndex(idx); g.computeVertexNormals();
  // volume estimate for mass
  let vol=0;
  for(let i=0;i<segs;i++){const t=(i+.5)/segs,k=sampleKeys(keys,t);
    vol+=Math.PI*(k.r*k.w*scale)*(k.r*k.h*scale)*(len/segs);}
  const port=(t)=>{const k=sampleKeys(keys,t);
    return {z:(0.5-t)*len, x:k.r*k.w*scale, y:k.r*k.h*scale, cy:k.y*scale};};
  return {geo:g,port,vol};
}
const box=(w,h,d)=>{const g=new THREE.BoxGeometry(w,h,d);
  g.userData.ext=Math.max(w,h,d)*.5; return g;};
const cyl=(rt,rb,h,s)=>{const g=new THREE.CylinderGeometry(rt,rb,h,s||8);
  g.userData.ext=Math.max(rt,rb,h*.5); return g;};

/* ---------- builder ---------- */
export function buildHull(seed, catKey, opts = {}) {
  const cat = CATS[catKey];
  if (!cat) throw new Error('shipforge: unknown category ' + catKey);

  // One stream per hull identity, through core/rng.js. `hashString` is FNV-1a and is
  // documented there as stable across runs and platforms, which is the property this needs:
  // a raider rebuilt on a later visit has to come back the same ship.
  const stream = makeRng((hashString(String(seed) + '/' + catKey)) >>> 0);
  const r = () => stream.next();

  const root = new THREE.Group();
  const len = cat.len * rng(r, .85, 1.2);
  // radial scale is derived from the category's target length:beam, so hulls are
  // ships rather than pencils however the length rolls
  let maxRW=0;
  cat.keys.forEach(k=>{const g=(v,d)=>v===undefined?d:v;
    maxRW=Math.max(maxRW,g(k.r,1)*g(k.w,1));});
  const scale=len/(2*maxRW*cat.lb)*rng(r,.9,1.15);

  const M={
    hull:new THREE.MeshStandardMaterial({color:cat.pal.hull,metalness:.5,roughness:.62,flatShading:true,side:THREE.DoubleSide}),
    trim:new THREE.MeshStandardMaterial({color:cat.pal.trim,metalness:.75,roughness:.4,flatShading:true,side:THREE.DoubleSide}),
    dark:new THREE.MeshStandardMaterial({color:0x14181d,metalness:.85,roughness:.35,flatShading:true,side:THREE.DoubleSide}),
    glow:new THREE.MeshBasicMaterial({color:cat.pal.glow}),
    glass:new THREE.MeshBasicMaterial({color:cat.pal.glass}),
    line:new THREE.LineBasicMaterial({color:cat.pal.glow,transparent:true,opacity:.55})
  };
  const H=loftHull({keys:cat.keys,sides:cat.sides,len,scale,jitter:cat.jitter,rnd:r});
  const hull=new THREE.Mesh(H.geo,M.hull); root.add(hull);

  // bounding radius, accumulated as parts land — no post-hoc scene measurement needed
  let maxR=0;
  cat.keys.forEach(k=>{const g=(v,d)=>v===undefined?d:v;
    maxR=Math.max(maxR,g(k.r,1)*Math.max(g(k.w,1),g(k.h,1))*scale*(1+cat.jitter*.5));});
  let R=Math.hypot(len*.5,maxR);

  const add=(g,m,x,y,z,rx,ry,rz)=>{const o=new THREE.Mesh(g,m);
    o.position.set(x,y,z);o.rotation.set(rx||0,ry||0,rz||0);root.add(o);
    R=Math.max(R,Math.hypot(x,y,z)+(g.userData.ext||scale*.5));
    return o;};
  const both=(fn)=>{fn(1);fn(-1);};
  const P=H.port;

  /* --- engines --- */
  const nEng=irng(r,cat.engines[0],cat.engines[1]);
  const tail=P(1), er=cat.eng*scale*rng(r,.8,1.1)*(tail.x/scale||1);
  const bank=[];
  for(let i=0;i<nEng;i++){
    const a=(i/nEng)*Math.PI*2 + (nEng<3?Math.PI/2:0);
    const rad=nEng===1?0:tail.x*.62;
    const ex=Math.cos(a)*rad, ey=Math.sin(a)*rad*.7+tail.cy;
    add(cyl(er*.8,er,er*2.2,10),M.dark,ex,ey,tail.z-er*.9,Math.PI/2,0,0);
    const gl=add(new THREE.CircleGeometry(er*.72,12),M.glow,ex,ey,tail.z-er*1.95);
    gl.rotation.y=Math.PI; bank.push(gl);
  }

  /* --- kit modules --- */
  const kit={
    containers(){ // stacked freight cans on the mid dorsal + flanks
      const rows=irng(r,3,6);
      for(let i=0;i<rows;i++){
        const t=lerp(.28,.72,rows===1?.5:i/(rows-1)), p=P(t);
        const w=p.x*.5,h=p.y*.42,d=len*.09;
        add(box(w*2,h,d),M.trim,0,p.cy+p.y*.98,p.z);
        both(s=>add(box(w*.8,h*1.5,d),M.hull,s*p.x*.95,p.cy,p.z));
      }
    },
    tanks(){ both(s=>{const p=P(.6);
      add(cyl(p.y*.34,p.y*.34,len*.3,10),M.trim,s*p.x*1.25,p.cy-p.y*.3,p.z,Math.PI/2,0,0);
      add(box(p.x*.5,p.y*.1,p.y*.1),M.dark,s*p.x*1.05,p.cy-p.y*.3,p.z);});},
    strut(){ both(s=>{const p=P(.5);
      add(box(p.x*.16,p.y*.1,len*.5),M.dark,s*p.x*1.0,p.cy+p.y*.4,p.z);});},
    turrets(){ const n=irng(r,3,6);
      for(let i=0;i<n;i++){const t=rng(r,.25,.8),p=P(t),up=r()<.6?1:-1;
        const base=add(cyl(p.y*.2,p.y*.26,p.y*.16,8),M.dark,0,p.cy+up*p.y*.95,p.z);
        add(box(p.y*.1,p.y*.1,p.y*.9),M.trim,0,p.cy+up*p.y*1.12,p.z+p.y*.35);
        base.userData.t=1;}
    },
    wings(){ both(s=>{const p=P(.55),w=p.x*1.5,th=p.y*.14;
      const g=box(w,th,len*.26); const m=add(g,M.hull,s*(p.x+w*.5),p.cy-p.y*.1,p.z);
      m.rotation.z=s*-0.12;
      add(cyl(th*1.6,th*1.6,len*.2,8),M.dark,s*(p.x+w*.9),p.cy-p.y*.1,p.z,Math.PI/2,0,0);
      add(box(th*2,th*2,len*.1),M.trim,s*(p.x+w*.55),p.cy-p.y*.3,p.z+len*.1);});},
    armor(){ const n=irng(r,4,8);
      for(let i=0;i<n;i++){const t=rng(r,.2,.9),p=P(t),a=rng(r,0,Math.PI*2);
        const m=add(box(p.x*.7,p.y*.08,len*.1),M.trim,
          Math.cos(a)*p.x*.92,p.cy+Math.sin(a)*p.y*.92,p.z);
        m.rotation.z=a;}
    },
    windows(){ const n=Math.floor(len*1.4);
      for(let i=0;i<n;i++){const t=lerp(.2,.85,i/(n-1)),p=P(t);
        both(s=>add(box(.06*scale,.12*scale,len*.02),M.glass,s*p.x*1.01,p.cy+p.y*.25,p.z));}
      const p=P(.18);
      add(box(p.x*1.2,p.y*.22,p.x*.3),M.glass,0,p.cy+p.y*.7,p.z);},
    fins(){ both(s=>{const p=P(.75);
      const m=add(box(p.x*.9,p.y*.06,len*.18),M.trim,s*(p.x*1.3),p.cy,p.z);
      m.rotation.z=s*.5;});},
    ring(){ const p=P(.5);
      const m=add(new THREE.TorusGeometry(p.x*1.35,p.y*.09,8,28),M.trim,0,p.cy,p.z);
      m.rotation.x=Math.PI/2; m.userData.spin=.15;
      both(s=>add(box(p.x*.4,p.y*.08,p.y*.08),M.dark,s*p.x*1.1,p.cy,p.z));},
    lifeboats(){ const n=irng(r,4,7);
      for(let i=0;i<n;i++){const t=lerp(.3,.8,i/(n-1)),p=P(t);
        both(s=>add(cyl(p.y*.1,p.y*.13,p.y*.4,7),M.hull,s*p.x*1.06,p.cy-p.y*.5,p.z,Math.PI/2,0,0));}},
    spinepods(){ const n=irng(r,3,5);
      for(let i=0;i<n;i++){const t=lerp(.32,.66,n===1?.5:i/(n-1)),p=P(t);
        const w=len*.09;
        both(s=>{add(box(w*.9,w*.9,w*1.4),M.hull,s*w*.8,p.cy,p.z);
          add(box(w*.2,w*.2,w*.3),M.glow,s*w*.8,p.cy+w*.5,p.z);});
        add(box(w*1.8,w*.16,w*.16),M.dark,0,p.cy,p.z);}},
    clamps(){ const p=P(.8);
      both(s=>{const m=add(box(p.x*.2,p.y*1.1,p.y*.3),M.dark,s*p.x*1.1,p.cy,p.z);m.rotation.z=s*.2;});},
    arms(){ both(s=>{const p=P(.12);
      const m=add(box(p.x*.16,p.y*.16,len*.22),M.trim,s*p.x*.9,p.cy-p.y*.5,p.z-len*.1);
      m.rotation.x=.25; add(box(p.x*.3,p.y*.2,p.y*.2),M.dark,s*p.x*.9,p.cy-p.y*.75,p.z+len*.02);});},
    drums(){ const n=irng(r,2,3);
      for(let i=0;i<n;i++){const t=lerp(.35,.7,n===1?.5:i/(n-1)),p=P(t);
        both(s=>{const R=p.y*.85;
          const d=add(cyl(R,R,p.y*.9,14),M.glass,s*(p.x+R*1.1),p.cy,p.z,0,0,Math.PI/2);
          d.material=new THREE.MeshStandardMaterial({color:cat.pal.glow,emissive:cat.pal.glow,
            emissiveIntensity:.35,transparent:true,opacity:.6,flatShading:true,side:THREE.DoubleSide});
          d.userData.spin=1.1*s;
          add(cyl(R*1.02,R*1.02,p.y*.16,14),M.trim,s*(p.x+R*1.1),p.cy,p.z,0,0,Math.PI/2);
          add(box(p.x*.25,p.y*.12,p.y*.12),M.dark,s*p.x*.9,p.cy,p.z);});}},
    domes(){ const n=irng(r,3,5);
      for(let i=0;i<n;i++){const t=rng(r,.25,.8),p=P(t);
        const d=new THREE.SphereGeometry(p.y*.3,10,6,0,Math.PI*2,0,Math.PI/2);
        const m=add(d,M.glow,rng(r,-.4,.4)*p.x,p.cy+p.y*.95,p.z);
        m.material=new THREE.MeshBasicMaterial({color:cat.pal.glow,transparent:true,opacity:.5});}},
    crossbay(){ const p=P(.45);
      add(box(p.x*1.6,p.y*.5,len*.22),M.hull,0,p.cy+p.y*.7,p.z);
      add(box(p.x*.9,p.y*.06,len*.04),M.glow,0,p.cy+p.y*.96,p.z+len*.001);
      add(box(p.x*.25,p.y*.06,len*.14),M.glow,0,p.cy+p.y*.96,p.z);
      both(s=>add(box(p.x*.1,p.y*.1,p.y*.1),M.glow,s*p.x*1.02,p.cy+p.y*.5,p.z-len*.1));},
    holdpods(){ const n=irng(r,3,6);
      for(let i=0;i<n;i++){const t=rng(r,.25,.8),p=P(t),w=len*.07;
        both(s=>{const c=new THREE.BoxGeometry(w,w,w*1.3);
          const cage=new THREE.LineSegments(new THREE.EdgesGeometry(c),M.line);
          cage.position.set(s*p.x*1.2,p.cy+rng(r,-.4,.4)*p.y,p.z); root.add(cage);
          add(box(w*.9,w*.2,w*1.2),M.dark,s*p.x*1.2,p.cy+rng(r,-.4,.4)*p.y,p.z);
          add(box(p.x*.3,w*.12,w*.12),M.trim,s*p.x*1.0,p.cy,p.z);});}},
    ram(){ const p=P(.06);
      add(cyl(0,p.x*1.1,len*.16,6),M.trim,0,p.cy,p.z+len*.06,-Math.PI/2,0,0);
      const n=irng(r,3,6);
      for(let i=0;i<n;i++){const t=rng(r,.15,.5),q=P(t),a=rng(r,0,Math.PI*2);
        const m=add(cyl(0,q.y*.1,q.y*.7,5),M.dark,
          Math.cos(a)*q.x*.9,q.cy+Math.sin(a)*q.y*.9,q.z);
        m.rotation.z=-a+Math.PI/2;}},
    dish(){ const p=P(.3);
      const d=add(new THREE.SphereGeometry(p.y*.34,10,6,0,Math.PI*2,0,Math.PI/2.4),M.trim,
        rng(r,-.3,.3)*p.x,p.cy+p.y*1.05,p.z);
      d.rotation.x=-.9; d.userData.spin=.08;
      add(box(p.y*.06,p.y*.4,p.y*.06),M.dark,d.position.x,p.cy+p.y*.85,p.z);}
  };
  cat.kit.forEach(k=>kit[k]&&kit[k]());

  // running lights — every hull gets them, colour-keyed to the category
  for(let i=0;i<6;i++){const t=lerp(.15,.9,i/5),p=P(t);
    both(s=>add(box(.05*scale,.05*scale,.05*scale),M.glow,s*p.x*1.02,p.cy+p.y*.6,p.z));}

  /* --- stats derived from the actual geometry --- */
  // 1 world unit = 10 m, so enclosed volume in m³ = vol * 1000
  const vol=H.vol, m3=vol*1000;
  const mass=m3*cat.dens*0.3*rng(r,.85,1.15);            // tonnes
  const thrust=nEng*Math.pow(er,2)*114000*rng(r,.9,1.15); // kN
  const twr=thrust/Math.max(mass*9.81,1);
  const cargo=Math.round(m3*(catKey==='trade'?.45:catKey==='logistic'?.35:catKey==='agriculture'?.3:.09));
  const CREW={civilian:.006,medical:.004,military:.0012,slavers:.0005,
    economic:.0004,agriculture:.0003,logistic:.0002,trade:.00008};
  const crew=Math.max(1,Math.round(m3*(CREW[catKey]||.0004)));
  const stats={
    dryMass:Math.round(mass),thrust:Math.round(thrust),twr:+twr.toFixed(2),
    cargoCap:cargo,crew:crew,
    turnRate:+(38/Math.pow(mass,.32)*(catKey==='military'?2.1:1)).toFixed(2),
    energyMW:Math.round(nEng*er*46+vol*30),
    shield:Math.round(vol*100*(catKey==='military'?1.5:catKey==='slavers'?.9:.5)),
    armor:Math.round(mass*(catKey==='military'?.35:catKey==='slavers'?.3:.12)),
    hullHP:Math.round(mass*.6),
    hardpoints:catKey==='military'?irng(r,4,8):catKey==='slavers'?irng(r,2,5):irng(r,0,2),
    lengthM:Math.round(len*10),beamM:Math.round(2*maxRW*scale*10)
  };
  const dna = { seed, category: catKey, scale: +scale.toFixed(3), length: +len.toFixed(2),
    sides: cat.sides, engines: nEng, kit: cat.kit.slice() };

  // ── fit the hull to the size the caller needs ─────────────────────
  //
  // The category's own `len` is in the generator's units, where a hull runs 22–43 across
  // the categories. LG sizes a ship from `NPC_TYPES.size`, and a drone has to stay a drone
  // next to a command ship. So the caller passes the length it wants and the whole root is
  // scaled uniformly to match.
  //
  // Uniform, and applied to the group rather than baked into the geometry, for two reasons:
  // the length:beam ratio the category worked to survives untouched, and the geometry stays
  // shareable between every hull that wants this silhouette — which is what lets
  // `entities/npcs.js` keep caching hulls instead of minting one per ship.
  let fit = 1;
  if (opts.targetLength > 0) {
    fit = opts.targetLength / Math.max(1e-6, len);
    root.scale.setScalar(fit);
  }

  return {
    root, stats, dna, name: shipName(r, catKey), radius: R * fit, fit,
    role: pick(r, cat.roles), glow: bank, accent: cat.accent, cat,
    lgClass: cat.lg
  };
}

/** Every category key, for the audit sweep and the batch sheet. */
export const CATEGORY_KEYS = Object.keys(CATS);
