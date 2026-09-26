/* Node 22+ dedicated Sol simulation. No browser, account or renderer. */
import {register} from 'node:module';
import {writeFileSync, mkdirSync, renameSync} from 'node:fs';
import {dirname} from 'node:path';
register(new URL('./three-loader.mjs', import.meta.url));
const relay = process.env.SOL_RELAY_URL || 'http://127.0.0.1:8080';
const token = process.env.SOL_HOST_TOKEN;
if (!token) throw new Error('SOL_HOST_TOKEN is required');
if (!['127.0.0.1','localhost','[::1]'].includes(new URL(relay).hostname)) throw new Error('Host connects to a loopback relay only');
const hostId='__sol_authority__';
const fetchNative=globalThis.fetch;
globalThis.fetch=(url, options={})=>fetchNative(new URL(url, relay), options);
async function api(path, body) {
  const response=await fetchNative(relay+path,{method:body===undefined?'GET':'POST',headers:{'X-Sol-Token':token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(8000)});
  if(!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}
const saved=await api('/net/sol-host'); // Do not start a new world while the relay is unreachable.
const storage=new Map(Object.entries(saved.hostState?.storage || {}));
globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k),get length(){return storage.size},key:i=>[...storage.keys()][i]??null};
const {sim, launchSim, tickSolHost, worldSnapshot, applyWorldSnapshot}=await import('../js/sim.js');
const {gnn,gnnPost,gnnBroadcastWire}=await import('../js/gnn.js');
const {stations}=await import('../js/stations.js');
const {traffic,trafficDown,markVesselDown}=await import('../js/npc/traffic.js');
const {hullWire,adoptHulls}=await import('../js/worldsync.js');
const {net}=await import('../js/net.js');
net.selfId=hostId;net.host=true;net.hostId=hostId;net.room='sol';net.online=true;
launchSim('Sol Observatory','sol');
sim.selfId=hostId;
if(saved.world) {
  if(!applyWorldSnapshot(saved.world)) throw new Error('Unsupported stored world format; refusing to overwrite it');
  sim.time=Number(saved.world.time)||0;
  if(Array.isArray(saved.hostState?.hulls)) adoptHulls(saved.hostState.hulls);
  for (const st of stations) {
    const record=saved.hostState?.stationEconomy?.[st.id];
    if(record){st.stock=record.stock;st.credits=record.credits;st.econ=record.econ;}
  }
  for(const p of (saved.world.gnn||[]).slice(-80)) gnn.posts.push({...p,source:'simulation',actions:[]});
}
const runId=crypto.randomUUID();
let reportAt=Number(saved.hostState?.reportAt)||sim.time;
let stopped=false, cursor=-1, last=performance.now(), debt=0, lastPoll=0, lastSave=0;
let lastSuccess=Date.now();
const pending=[];
sim.send=(data,to)=>{if(pending.length<300) pending.push({room:'sol',from:hostId,kind:'msg',to,data});};
sim.broadcast=()=>{}; // The observatory is not a visible player ship.
gnnPost({desk:'news',title:saved.world?'Sol observatory resumed':'Sol observatory online',body:'The dedicated Sol simulation host is active. Shared-system broadcasts continue without connected players.'});
// Distinguish host sessions even if local gnn ids repeat.
function wire(){return gnnBroadcastWire().map(p=>({...p,id:runId+':'+p.id}));}
function checkpoint(){return {world:{...worldSnapshot(),gnn:wire()},hostState:{storage:Object.fromEntries(storage),hulls:hullWire(null,traffic.length),stationEconomy:Object.fromEntries(stations.filter(s=>s.stock).map(s=>[s.id,{stock:s.stock,credits:s.credits,econ:s.econ}])),reportAt}};}
async function save(){await api('/net/sol-host',checkpoint());lastSuccess=Date.now();}
await save();
console.log(`Sol host ready: restored=${Boolean(saved.world)} time=${sim.time.toFixed(1)} stations=${stations.length}`);
const statusPath=process.env.SOL_STATUS_FILE;
function status(){if(!statusPath)return;mkdirSync(dirname(statusPath),{recursive:true});writeFileSync(statusPath+'.tmp',JSON.stringify({updatedAt:Date.now(),simulationTime:sim.time,lastCheckpointAt:lastSuccess,gnnCount:gnn.posts.length}));renameSync(statusPath+'.tmp',statusPath);}
async function loop(){
  while(!stopped){
    const now=performance.now();debt+=Math.min((now-last)/1000,2);last=now;
    let steps=0;
    while(debt>=.05 && steps++<20){tickSolHost(.05);debt-=.05;}
    if(sim.time-reportAt>=300){
      reportAt=sim.time;
      const active=traffic.filter(n=>n.job!=='down').length;
      gnnPost({desk:'news',title:'Sol system watch',body:`Observatory census: ${stations.length} stations and ${active} active NPC vessels tracked at simulation time ${Math.floor(sim.time)} seconds.`});
    }
    try{
      if(now-lastPoll>=2000){
        lastPoll=now;
        const poll=await api('/net/poll?room=sol&self='+hostId+'&since='+cursor);
        cursor=poll.seq;
        // Preserve the existing player-reported vessel-down interaction.
        for(const m of poll.msgs||[]){const d=m.data;if(d?.t==='vdown' && typeof d.id==='string'){markVesselDown(d.id,sim.time);if(Number.isFinite(d.until))trafficDown[d.id]=d.until;}}
        const w=worldSnapshot();
        await api('/net/send',{room:'sol',from:hostId,kind:'msg',data:{t:'wstate',impactors:w.impactors,holes:w.holes,trafficDown:w.trafficDown,hulls:hullWire(null,46)}});
      }
      while(pending.length){await api('/net/send',pending[0]);pending.shift();}
      if(now-lastSave>=5000){await save();lastSave=now;status();}
    }catch(error){
      console.error('Relay/checkpoint unavailable:',error.message);
      // Do not evolve an uncheckpointed fork indefinitely. systemd retries from committed state.
      if(Date.now()-lastSuccess>30000) throw new Error('No checkpoint acknowledged for 30 seconds');
    }
    await new Promise(resolve=>setTimeout(resolve,25));
  }
  await save();status();console.log('Sol checkpoint committed; stopping');
}
process.on('SIGTERM',()=>{stopped=true});process.on('SIGINT',()=>{stopped=true});
await loop();
