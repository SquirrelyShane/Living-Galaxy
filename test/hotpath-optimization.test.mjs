import assert from 'node:assert/strict';
import { sim, launchSim } from '../js/sim/sim.js';
import { makePilot } from '../js/flight/pilot.js';
import { traffic, reindexTraffic, vesselById, LAW_ROLES } from '../js/npc/traffic.js';
import { waves, nests, rogueHooks, stepRogues, TIDE } from '../js/npc/rogues.js';
import { acquire, hostileTo, CLOSE_R, STALK_TOP } from '../js/npc/combat.js';
import { contacts, syncContacts, CONTACT_R, shots } from '../js/flight/turrets.js';
import { npcDrones } from '../js/drones/npcdrones.js';
import { threatsNear } from '../js/npc/ground.js';

makePilot('Hotpath', 'terran', 'navigation', null);
launchSim('Hotpath', 'sol');
TIDE.recall = false;
nests.length = 0;
waves.length = 0;
rogueHooks.onSiege = rogueHooks.onNestDown = null;
const st = { id: 'test-port', x: 0, y: 0, z: 0 };
const hull = (id, x = 0) => ({ id, x, y: 0, z: 0, hp: 100, job: 'outbound', visible: true, role: 'trader', speed: 0 });
const wave = id => ({ id: 'wave-' + id, drones: [id], nest: 'absent', state: 'outbound', expires: 1e9, target: {kind:'station', id:st.id} });
function roster(list, ws) { traffic.splice(0, traffic.length, ...list); waves.splice(0, waves.length, ...ws); reindexTraffic(); delete st.siegeDrones; }
roster([hull('a')], [wave('a')]);
stepRogues(1, .05, [st]);
assert.equal(st.siegeDrones, 1);
traffic[0] = hull('b');
waves[0] = wave('b');
stepRogues(2, .05, [st]);
assert.equal(waves[0].state, 'siege', 'same-length replacement is indexed freshly');
roster([{...hull('dead'), hp:0}, hull('live')], [wave('live'), wave('dead')]);
stepRogues(3, .05, [st]);
assert.deepEqual(traffic.map(n=>n.id), ['live']);
assert.deepEqual(waves.map(w=>w.id), ['wave-live'], 'removal does not invalidate remaining wave lookup');
roster([hull('dup',1e9), hull('dup')], [wave('dup')]);
stepRogues(4, .05, [st]);
assert.equal(waves[0].state, 'outbound', 'duplicate IDs retain Array.find first-match behavior');
roster([hull('later',1e9), hull('first')], [wave('later'),wave('first')]);
rogueHooks.onSiege = (_st,w) => { if(w.id==='wave-first') traffic[0]=hull('later'); };
stepRogues(5,.05,[st]);
assert.equal(waves[0].state,'siege','callback replacement is visible to subsequent waves');
rogueHooks.onSiege = () => { throw new Error('fixture'); };
assert.throws(()=>stepRogues(6,.05,[st]),/fixture/);
rogueHooks.onSiege=null;
traffic[0]=hull('after-error');waves.splice(0,waves.length,wave('after-error'));
stepRogues(7,.05,[st]);
assert.equal(waves[0].state,'siege','thrown callback leaves no persistent lookup cache');

function originalAcquire(n,radius) {
 let best=null,score0=0;
 for(const m of traffic) {
  if(m===n||m.job==='down'||m.visible===false||!hostileTo(n,m))continue;
  const d=Math.hypot(n.x-m.x,n.y-m.y,n.z-m.z);
  if(d>radius||(m.drive&&d>CLOSE_R)||(!(d<CLOSE_R)&&!(m.speed<=STALK_TOP*.55)))continue;
  if(m.huntedBy&&m.huntedBy!==n.id&&vesselById(m.huntedBy)?.hunt===m.id)continue;
  const cargo=m.carrying?.qty??m.cargo?.qty??0;
  const worth=LAW_ROLES.has(m.role)?.25:({supply:2.2,hauler:2,trader:1.6,miner:1.2}[m.role]??.8)+Math.min(1.6,cargo/120);
  const score=worth/(1+d/radius);
  if(score>score0){score0=score;best=m;}
 }
 return best;
}
let seed=12345;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
for(let run=0;run<100;run++) {
 const list=Array.from({length:70},(_,i)=>({...hull('f'+i,random()*1e5),y:random()*1e4,z:random()*1e4,role:['pirate','security','miner','trader'][i%4],speed:random()*1e4,drive:i%5===0,visible:i%7!==0,cargo:{qty:random()*200}}));
 roster(list,[]);
 for(const radius of [-1,0,100,5200,220000,Infinity])for(const n of list.slice(0,4))assert.strictEqual(acquire(n,radius),originalAcquire(n,radius),'target choice matches original scoring');
}
const hunter={...hull('hunter'),role:'pirate'};
roster([hunter,hull('edge',5200),hull('outside',5200+.0001)],[]);
assert.equal(acquire(hunter,5200)?.id,'edge','acquisition includes exact boundary');

sim.ship.pos.x=sim.ship.pos.y=sim.ship.pos.z=0;
npcDrones.units.length=0;
contacts.length=0;
roster([hull('in',CONTACT_R-.001),hull('edge',CONTACT_R),hull('out',CONTACT_R+.001)],[]);
syncContacts(sim.ship,new Map(),()=> 'neutral',10,0);
assert.deepEqual(contacts.filter(c=>c.kind==='npc').map(c=>c.id),['in','edge'],'sensor boundary remains inclusive');
for(const x of [899.999,900,900.001]) {
 contacts.length=0;traffic.length=0;shots.length=0;
 npcDrones.units.splice(0,npcDrones.units.length,{...hull('drone',x),hostile:true,role:'combat',home:'test-port',cooldown:0});
 contacts.push({id:'drone',kind:'drone',hp:100,cooldown:0,corpDrone:true});
 syncContacts(sim.ship,new Map(),()=> 'neutral',10,0);
 assert.equal(shots.length,x<900?1:0,'drone firing boundary remains exclusive');
}
npcDrones.units.length=0;
roster([{...hull('pirate',100),role:'pirate'},{...hull('rogue',-100),rogue:true}],[]);
assert.equal(threatsNear({x:0,y:0,z:0}).nearest.n.id,'pirate','equal-distance threat tie preserves pirate-first order');
console.log('PASS: rogue lookup replacement/removal/duplicates/callbacks, original acquisition equivalence, range boundaries, threat ties');
