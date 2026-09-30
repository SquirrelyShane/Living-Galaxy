/* Tests the production client module with controlled transport/simulation dependencies.
 * node test/worldsync-revision.test.mjs — no browser or experimental VM flags. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const ctx={calls:0,applies:[],logs:[],live:[],trafficDown:{},response:null,fetch:null,room:null,message:null};
const sim={time:20,toast:'',timeScale:1};
const net={room:'sol',hostId:'__sol_authority__'};
globalThis.__worldsyncTest={
  gnn:{gnnBroadcastWire:()=>[]},
  net:{net,fetchWorld:async()=>{ctx.calls++;return ctx.fetch?ctx.fetch():structuredClone(ctx.response)},lonely:()=>false,onRoom:fn=>ctx.room=fn,onMessage:fn=>ctx.message=fn,pushWorld:async()=>({})},
  sim:{sim,applyRemoteRockHit:()=>{},applyRemoteStrike:()=>{},worldSnapshot:()=>({}),logEvent:msg=>ctx.logs.push(msg),applyWorldSnapshot:(snap,options)=>{ctx.applies.push({snap,options});if(options.includeLive)ctx.live=snap.impactors;return true}},
  holes:{adoptHoles:()=>{},holeWire:()=>[]},
  impactors:{adoptImpactors:wire=>ctx.live=wire,impactorWire:()=>ctx.live,setImpactorAuthority:()=>{}},
  traffic:{markVesselDown:()=>{},trafficDown:ctx.trafficDown,traffic:[],vesselById:()=>null}
};
const groups={'../comms/gnn.js':'gnn','./net.js':'net','../sim/sim.js':'sim','../world/events/holes.js':'holes','../world/events/impactors.js':'impactors','../npc/traffic.js':'traffic'};
let source=await readFile(new URL('../js/net/worldsync.js',import.meta.url),'utf8');
source=source.replace(/import \{([^}]+)\} from "([^"]+)";/g,(_,names,path)=>{
  const group=groups[path];assert.ok(group,`dependency mapped: ${path}`);
  const code=names.split(',').map(n=>n.trim()).map(n=>`export const ${n}=globalThis.__worldsyncTest.${group}.${n};`).join('\n');
  return `import {${names}} from ${JSON.stringify('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))};`;
});
const ws=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
ws.mountWorldSync();
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const body=n=>({integrity:n,radius:10,thermal:30,craters:[{nx:1,ny:0,nz:0,r:2,depth:1,depth0:1,seed:3}]});
function response(revision,seq,bodies={earth:body(.9)}){return {worldRevision:revision,wseq:seq,world:{v:1,bodies,ports:{},lost:[],impactors:[{id:'old-rock',x:0}],holes:[],trafficDown:{old:1}}};}
async function poll(revision,seq){ctx.room({host:false,wseq:seq,worldRevision:revision});await settle();}
ws.resetWorldSync();ctx.response=response('A',1);await poll('A',1);
assert.equal(ctx.calls,1);assert.equal(ctx.applies[0].options.includeLive,true);
assert.equal(ctx.logs.filter(x=>x.startsWith('Sky snapshot applied')).length,1);
sim.toast='pilot message';
ctx.message('__sol_authority__',{t:'wstate',impactors:[{id:'new-rock',x:50}],trafficDown:{fresh:80}});
for(let seq=2;seq<=13;seq++)await poll('A',seq);
assert.equal(ctx.calls,1,'checkpoint saves alone do not fetch');
assert.equal(ctx.applies.length,1,'checkpoint saves do not rebuild damaged bodies');
assert.equal(sim.toast,'pilot message');assert.equal(ctx.live[0].id,'new-rock');
ctx.response=response('B',14,{earth:{...body(.9),thermal:2,craters:[{...body(.9).craters[0],depth:.5}]},mars:body(.5)});
await poll('B',14);
assert.equal(ctx.calls,2);assert.deepEqual(Object.keys(ctx.applies[1].snap.bodies),['mars'],'only changed geometry reaches apply');
assert.equal(ctx.applies[1].options.includeLive,false,'later repair excludes live state');
assert.equal(ctx.live[0].id,'new-rock');assert.equal(ctx.trafficDown.fresh,80);
assert.equal(sim.toast,'pilot message');assert.equal(ctx.logs.filter(x=>x.startsWith('Sky snapshot applied')).length,1);
await poll('B',15);assert.equal(ctx.calls,2);
ctx.fetch=async()=>{throw new Error('offline')};await poll('C',16);assert.equal(ws.worldsync.revisionSeen,'B');
ctx.fetch=null;ctx.response=response('C',17,{earth:body(.7)});await poll('C',17);assert.equal(ws.worldsync.revisionSeen,'C');
// Initial sync racing a live update must not delete a newly created rogue either.
ws.resetWorldSync();let release;ctx.fetch=()=>new Promise(resolve=>release=resolve);
ctx.room({host:false,wseq:18,worldRevision:'D'});
ctx.message('__sol_authority__',{t:'wstate',impactors:[{id:'race-rock',x:99}]});
release(response('D',18));await settle();assert.equal(ctx.applies.at(-1).options.includeLive,false);assert.equal(ctx.live[0].id,'race-rock');
// A response from a previous room must not apply after reset.
let oldRelease;ws.resetWorldSync();ctx.fetch=()=>new Promise(resolve=>oldRelease=resolve);ctx.room({host:false,wseq:19,worldRevision:'E'});
const before=ctx.applies.length;ws.resetWorldSync();oldRelease(response('E',19));await settle();assert.equal(ctx.applies.length,before);assert.equal(ws.worldsync.applied,false);
ctx.fetch=null;ctx.response={world:null,wseq:20};await poll('F',20);assert.equal(ws.worldsync.applied,false,'empty initial snapshot stays retryable');
console.log('worldsync revision: PASS — no periodic reload, changed-body repair, first-only notice, live-state races, retry and room-reset guards');
delete globalThis.__worldsyncTest;
