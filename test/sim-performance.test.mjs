import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const storage = new Map();
globalThis.localStorage = {getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
globalThis.fetch = async()=>{throw new Error('offline test');};
const S = await import('../js/sim/sim.js');
const {makePilot} = await import('../js/flight/pilot.js');
const {stations,stepStations} = await import('../js/station/stations.js');
const {traffic,HOSTILE_ROLES} = await import('../js/npc/traffic.js');
const {impactors} = await import('../js/world/events/impactors.js');
const {RECIPES,stepProduction,stepStationWorks,worksHooks} = await import('../js/station/stationworks.js');
const {useGameStore} = await import('../js/core/store.js');

// Private guard and clock routines are compiled from the actual patched file,
// so mutations can be tested without unrelated combat resetting the fixtures.
const source = readFileSync(new URL('../js/sim/sim.js',import.meta.url),'utf8');
function privateRoutine(name,env) {
  const start=source.indexOf(`function ${name}(`);
  const code=source.slice(start,source.indexOf('\n}',start)+2);
  return new Function(...Object.keys(env),`${code};return ${name};`)(...Object.values(env));
}
{
  const contacts=[{stationId:'a',hp:0},{stationId:'a',hp:10},{stationId:'b',hp:10}];
  const ports=['a','b'].map(id=>({id,name:id,hostile:true,guards:2,x:12000,y:0,z:0,radius:60,vx:0,vy:0,vz:0}));
  const guards=privateRoutine('stepPorts',{contacts,stations:ports,sim:{time:0,ship:{pos:{x:0,y:0,z:0}}}});
  guards(.05);
  assert.equal(contacts.filter(c=>c.stationId==='a'&&c.hp>0).length,2);
  assert.equal(contacts.filter(c=>c.stationId==='b'&&c.hp>0).length,2);
  guards(.05);assert.equal(contacts.length,5,'do not spawn beyond capacity');
  contacts.splice(1,1,{stationId:'a',hp:0});
  guards(.05);assert.equal(contacts.filter(c=>c.stationId==='a'&&c.hp>0).length,2,'same-length contact replacement is seen');
  ports[0].x=12000.01;ports[0].guards=20;
  guards(.05);assert.equal(contacts.length,6,'out-of-range ports do not spawn');
  contacts.length=0;ports[0].x=0;ports[0].truceUntil=2;
  guards(.05);assert.equal(contacts.filter(c=>c.stationId==='a').length,0,'truce suppresses guards');
}
{
  const chunk=x=>({x,y:0,z:0,vx:0,vy:0,vz:0});
  const chunks=[chunk(8999),chunk(9000),chunk(9001),{...chunk(1),driven:true},{...chunk(1),orbitR:10}];
  const carry=privateRoutine('carryLoose',{chunks,CLOCK_CARRY_R:9000});
  carry({x:0,y:0,z:0},2,3,4,5,6,7);
  assert.deepEqual(chunks.slice(0,2).map(c=>[c.x,c.y,c.z,c.vx,c.vy,c.vz]),[[9001,3,4,5,6,7],[9002,3,4,5,6,7]]);
  assert.deepEqual(chunks.slice(2).map(c=>c.x),[9001,1,1],'outside, driven, and orbiting debris stay put');
}
function works(){return {lines:{},needs:{},stock:{slug:100,missile:0},cap:{},made:{plate:0},timers:{},suppliedAt:100};}
{
  const st={works:works(),sector:'military',stock:[{id:'steel',qty:5}]};
  RECIPES.testRecipe={batch:1,secs:1,needs:{steel:1},line:'test'};
  st.works.lines.test=1;st.works.needs.testRecipe=true;st.works.stock.testRecipe=0;st.works.cap.testRecipe=5;st.works.made.testRecipe=0;
  try {
    stepProduction(st,.5,100);assert.equal(st.works.stock.testRecipe,0);
    stepProduction(st,.5,100);assert.equal(st.works.stock.testRecipe,1);
    assert.equal(st.stock[0].qty,4,'production consumes resources once');
    st.stock[0].qty=0;stepProduction(st,1,100);
    assert.equal(st.works.stalls.testRecipe.need,'steel','resource shortage still stalls production');
  } finally {delete RECIPES.testRecipe;}
}
{
  const role=[...HOSTILE_ROLES][0];
  const port={id:'siege',gen:true,works:works(),sector:'military',stock:[],x:0,y:0,z:0,mounts:[{kind:'slug',damage:20,barrels:1,rate:1}]};
  const foe=(id,x,extra={})=>({id,role,job:'cruise',visible:true,x,y:0,z:0,hp:100,shield:0,...extra});
  stations.length=0;stations.push(port);
  traffic.length=0;traffic.push(foe('near',100),foe('same-distance',-100),foe('boundary',5200),foe('outside',5201),foe('down',1,{job:'down'}),foe('hidden',1,{visible:false}));
  const hits=[];const old=worksHooks.onBatteryHit;
  worksHooks.onBatteryHit=(n,amount)=>hits.push([n.id,amount]);
  try {
    stepStationWorks(.05,100,{pos:{x:100000,y:0,z:0}});
    assert.equal(port.siege.count,3);assert.equal(hits[0][0],'near','ties preserve traffic order');
    assert.equal(hits[0][1],20*.42*.05);
    traffic[0].job='down';traffic[1].job='down';hits.length=0;
    stepStationWorks(.05,100,{pos:{x:100000,y:0,z:0}});
    assert.equal(port.siege.count,1);assert.equal(hits.length,0,'boundary pressure does not select a target');
  } finally {worksHooks.onBatteryHit=old;stations.length=0;traffic.length=0;}
}

makePilot('PerformanceTest','terran','navigation',null);
S.launchSim('PerformanceTest','sol');
const sim=S.sim;
sim.ship.pos={x:1e7,y:1e7,z:1e7};sim.time=100;
const wp=S.addWaypointAt('Static route',1e7+500000,1e7,1e7);
sim.selected=wp.id;
sim.ship.yaw=-Math.PI/2;sim.ship.pitch=0;
const preview=()=>S.plotRoute(wp.id,{preview:true});
const first=preview();
sim.ship.yaw+=.0002;
const turned=preview();
assert.strictEqual(turned.hazards,first.hazards,'turning reuses preview geometry');
assert.notStrictEqual(turned,first,'published route snapshots are not mutated');
assert.deepEqual(turned,S.plotRoute(wp.id),'preview live values agree with fresh route');
sim.ship.mods={...sim.ship.mods,warp:2};
assert.deepEqual(preview(),S.plotRoute(wp.id),'spool tuning updates ETA inside cache window');
sim.ship.pos.x+=100;
const moved=preview();assert.notStrictEqual(moved.hazards,turned.hazards,'ship movement invalidates geometry');
wp.x+=500;
assert.deepEqual(preview(),S.plotRoute(wp.id),'waypoint movement invalidates geometry');
const hazard={id:'test-route-rock',name:'Test hazard',x:sim.ship.pos.x+5000,y:1e7+10000,z:1e7,r:10};
impactors.push(hazard);preview();
hazard.y=1e7; // same-length mutation within the preview cache interval
assert.ok(S.plotRoute(wp.id).hazards.some(h=>h.name==='Test hazard'),'fresh decision sees in-place hazard mutation');
impactors.pop();
S.publishHud([],[]);assert.ok(useGameStore.getState().route,'HUD still publishes routes');

// Both client and headless host must leave port poses on their final simulation time.
for(const advance of [()=>S.tickSim(.05),()=>S.tickSolHost(.05)]) {
  advance();
  const poses=stations.map(st=>[st.x,st.y,st.z,st.vx,st.vy,st.vz]);
  stepStations(sim.time);
  assert.deepEqual(stations.map(st=>[st.x,st.y,st.z,st.vx,st.vy,st.vz]),poses);
}
console.log('PASS: guard mutation/capacity/range/truce, clock carry boundaries, recipe extension/resources/stalls, siege boundaries/ties/deaths, live route alignment/ETA/movement/decisions, HUD, client and host station poses');
