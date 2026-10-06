import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
const root=path.resolve(process.argv[2]);
const mode=process.argv[3] ?? 'host';
const steps=Number(process.argv[4] ?? 6000);
const dumpPath=process.argv[5];
if(!['host','client'].includes(mode)||!Number.isInteger(steps)||steps<1) throw new Error('Usage: node benchmark-sim.mjs REPO_ROOT host|client [STEPS] [STATE_OUTPUT]');
register(pathToFileURL(path.join(root,'host/three-loader.mjs')));
let seed=246813579;
Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const storage=new Map();
globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
globalThis.fetch=async()=>{throw new Error('Benchmark runs offline');};
const load=p=>import(pathToFileURL(path.join(root,p)));
const {sim,launchSim,tickSolHost,tickSim,publishHud}=await load('js/sim/sim.js');
const {makePilot}=await load('js/flight/pilot.js');
const {traffic}=await load('js/npc/traffic.js');
const {stations}=await load('js/station/stations.js');
const {BODIES}=await load('js/world/bodies.js');
makePilot('Benchmark','terran','navigation',null);
launchSim('Benchmark','sol');
sim.broadcast=()=>{};sim.send=()=>{};
if(mode==='client') {sim.worldAuthority=false;sim.clockSynced=true;}
const times=[];
let hudAcc=0, hudCalls=0;
const advance=()=>{
  if(mode==='host')tickSolHost(.05);
  else {
    tickSim(1/60);
    hudAcc+=1/60;
    if(hudAcc>.07){hudAcc=0;publishHud([],[]);hudCalls++;}
  }
};
for(let i=0;i<400;i++)advance();
const cpu=process.cpuUsage(), start=performance.now();
for(let i=0;i<steps;i++) {const at=performance.now();advance();times.push(performance.now()-at);}
const elapsed=performance.now()-start, used=process.cpuUsage(cpu);
times.sort((a,b)=>a-b);
if(dumpPath) {
  const {writeFileSync}=await import('node:fs');
  const take=(o,keys)=>Object.fromEntries(keys.map(k=>[k,o[k]]));
  writeFileSync(dumpPath,JSON.stringify({time:sim.time,traffic:traffic.map(n=>take(n,['id','role','job','state','x','y','z','vx','vy','vz','hp','shield'])),stations:stations.map(st=>take(st,['id','x','y','z','vx','vy','vz','stock','credits','works','siege','guns'])),ship:take(sim.ship,['pos','vel','hull','shieldCharge','charge','credits'])}));
}
console.log(JSON.stringify({mode,steps,elapsed_ms:elapsed,cpu_ms:(used.user+used.system)/1000,mean_ms:elapsed/steps,p50_ms:times[Math.floor(steps*.5)],p95_ms:times[Math.floor(steps*.95)],sim_time:sim.time,hudCalls,traffic:traffic.length,stations:stations.length,bodies:BODIES.length,memory_mb:process.memoryUsage().heapUsed/1048576}));
