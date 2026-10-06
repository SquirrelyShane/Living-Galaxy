import assert from 'node:assert/strict';
import { createResolutionController } from '../js/render/resolution.js';
import { flyStep } from '../js/npc/flight.js';
import { stationLane, lanePoint, laneCentre, subLaneOffset, spreadAt } from '../js/npc/lanes.js';
import { currentSystem, applySystem } from '../js/world/bodies.js';
import { generateSystem } from '../js/world/generate.js';
import { CELL_CACHE_LIMIT, fieldCacheStats, nearbyRocks, rockByKey, resetField, wearRock, depleted } from '../js/world/field.js';

const resolution = createResolutionController(3);
assert.equal(resolution.ratio, 2);
for (let i=0;i<59;i++) resolution.update(0,1/60,3);
assert.equal(resolution.ratio,2,'a transient load does not resize the canvas');
assert.equal(resolution.update(0,1/60,3),1,'sustained low tier lowers resolution');
for(let i=0;i<479;i++) resolution.update(3,1/60,3);
assert.equal(resolution.ratio,1,'recovery waits eight seconds');
assert.equal(resolution.update(3,1/60,3),2);
assert.equal(resolution.update(3,1/60,1.2),1.2,'DPR decrease clamps immediately');
const lowDpr=createResolutionController(1);
for(let i=0;i<120;i++)lowDpr.update(0,1/60,1);
assert.equal(lowDpr.ratio,1,'normal-DPR screens stay at native resolution');
const jitter=createResolutionController(2);
for(let i=0;i<180;i++)jitter.update(i%2?0:3,1/60,2);
assert.equal(jitter.ratio,2,'alternating tier does not repeatedly allocate buffers');

for(const speed of [0,10,1000])for(const evade of [0,1]) {
  const n={x:0,y:0,z:0,vx:speed,vy:2,vz:3,yaw:0,pitch:0,fly:{top:100,accel:30,turn:.6,jink:0,jinkW:1}};
  flyStep(n,.05,1000,100,200,{top:100,evade,faceGoal:true});
  assert.equal(n.speed,Math.hypot(n.vx,n.vy,n.vz),'reported speed equals final velocity in capped/uncapped flight');
  assert.ok(Number.isFinite(n.x)&&Number.isFinite(n.yaw));
}
for(const withPort of [false,true]) {
  const st={x:100,y:200,z:300,radius:100,seed:.5};
  if(withPort)st.port={x:1,y:2,z:3,dir:{x:0,y:0,z:1},side:{x:1,y:0,z:0},up:{x:0,y:1,z:0},entry:{x:0,y:0,z:0},exit:{x:0,y:0,z:1},wayGap:40,halfH:30,halfW:50,d:10};
  for(const which of ['entry','exit'])for(const u of [-1,0,.1,.45,1,3])for(const k of [0,1,2]) {
    const f=stationLane(st),centre=laneCentre(f,which,u,{});
    const lat=subLaneOffset(k)*spreadAt(f,u).k;
    assert.deepEqual(lanePoint(st,which,u,{},k),{x:st.x+centre.x+f.side.x*lat,y:st.y+centre.y+f.side.y*lat,z:st.z+centre.z+f.side.z*lat});
  }
}

resetField();
const belt=currentSystem.belt??currentSystem.outerBelt;
assert.ok(belt,'Sol provides a belt');
const radius=(belt.inner+belt.outer)/2;
let origin=null,original=null;
for(let i=0;i<100&&!original;i++) {
  const a=i*.003;
  const pos={x:Math.cos(a)*radius,y:0,z:Math.sin(a)*radius};
  const rocks=nearbyRocks(pos,100,1);
  if(rocks.length) {origin=pos;original={...rocks[0]};}
}
assert.ok(original);
wearRock(original.key,.4);
for(let i=0;i<2000;i++) {
  const a=i/2000*Math.PI*2;
  nearbyRocks({x:Math.cos(a)*radius,y:0,z:Math.sin(a)*radius},100+i,1);
  assert.ok(fieldCacheStats().cells<=CELL_CACHE_LIMIT,'cache remains bounded during exploration');
}
assert.equal(depleted.get(original.key),.4,'eviction preserves partial mining');
const regenerated=rockByKey(original.key,100);
assert.ok(regenerated);
assert.equal(regenerated.worn,.4);
for(const key of ['key','bx','by','bz','x','y','z','r','ore','cls'])assert.deepEqual(regenerated[key],original[key],'regenerated cell preserves '+key);
wearRock(original.key,1);
assert.equal(rockByKey(original.key,101),null,'fully depleted rocks stay depleted after regeneration');
const same=nearbyRocks(origin,101,1);
assert.strictEqual(nearbyRocks(origin,101,1),same,'same-query memo still returns the same array');
applySystem(generateSystem('upgrade-cache-other'));
nearbyRocks(origin,102,1);
assert.ok(fieldCacheStats().cells<=CELL_CACHE_LIMIT,'system switch resets cached geometry');
resetField();assert.equal(fieldCacheStats().cells,0);
console.log('PASS: resolution hysteresis/DPR/jitter, capped and uncapped NPC speed, lane geometry, bounded cache, deterministic regeneration, partial/full depletion, memo reuse, system changes');
