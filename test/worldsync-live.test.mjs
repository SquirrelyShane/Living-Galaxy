// node --import ./test/three-register.mjs test/worldsync-live.test.mjs
import assert from 'node:assert/strict';
const {applyWorldSnapshot}=await import('../js/sim.js');
const {impactors}=await import('../js/impactors.js');
const {holes}=await import('../js/holes.js');
const {trafficDown}=await import('../js/npc/traffic.js');
impactors.push({id:'new-rock',x:99});holes.push({id:'new-hole'});trafficDown.test=200;
const stale={v:1,bodies:{},ports:{},lost:[],impactors:[],holes:[],trafficDown:{test:1}};
assert.equal(applyWorldSnapshot(stale,{includeLive:false}),true);
assert.equal(impactors[0].id,'new-rock');assert.equal(holes[0].id,'new-hole');assert.equal(trafficDown.test,200);
assert.equal(applyWorldSnapshot(stale),true);
assert.equal(impactors.length,0);assert.equal(holes.length,0);assert.equal(trafficDown.test,1);
console.log('worldsync live: PASS — real snapshot applier preserves live state during durable repairs; initial restore stays compatible');
