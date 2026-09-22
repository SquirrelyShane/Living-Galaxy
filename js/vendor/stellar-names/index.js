/* Living Galaxy — Stellar Names 1.2, vendored.
 *
 * Upstream: https://github.com/ (Stellar Names 1.2, MIT). Name data is the
 * ARIN `arincli` lists (Apache-2.0). Licences and provenance in ./NOTICE.md.
 *
 * CHANGED FROM UPSTREAM — two edits, both about payload:
 *
 *   1. The `human-names.js` import is gone. That file is the optional 1.97 MB
 *      FinNLP pool, reached only through `humanSource: 'finnlp'`, and it is
 *      unclassified — no gender labels — which is the opposite of what this
 *      game wants. `humanSource` now accepts 'arincli' only and throws on
 *      anything else rather than silently falling back.
 *   2. `classified-names.js` beside this file carries a trimmed surname list.
 *      See its own header.
 *
 * Nothing else is touched: same generator, same sequence for a given seed,
 * same API. The game does not call this directly — js/naming.js is the seam.
 */
import { CLASSIFIED_NAMES } from './classified-names.js';
export { CLASSIFIED_NAMES };
/** Stellar Names v1.2.0 — dependency-free, deterministic space-sim names. */
export const CATEGORIES = Object.freeze(['station','planet','moon','asteroid','rogueAsteroid','npcMale','npcFemale','robot']);
export const STYLES = Object.freeze(['frontier','corporate','mythic','scientific']);
const words = s => s.split('|');
export const DEFAULT_DATA = Object.freeze(Object.fromEntries(Object.entries({
 onset: 'Al|Ar|Bel|Cal|Cer|Cor|Da|Del|El|Er|Fal|Gal|Hel|Ith|Ka|Kel|Lor|Mar|Mor|Na|Nel|Or|Per|Quel|Ra|Sar|Sol|Tal|Ter|Ul|Val|Vel|Vor|Xan|Yar|Zel',
 middle: 'a|ae|an|ar|e|en|er|i|il|in|o|on|or|u|ur|yth',
 ending: 'ra|ria|ron|ris|nus|nia|lon|lis|thea|th|mir|dor|dara|va|vos|tis|tor|sia|nus|rea|via|dan',
 frontier: 'Amber|Ash|Copper|Crimson|Distant|Dust|Ember|Far|Frost|Golden|Iron|Last|Lost|New|Outer|Pale|Quiet|Red|Silver|Stone|Sun|Wild',
 place: 'Reach|Haven|Crossing|Rest|Horizon|Landing|Harbor|Watch|Prospect|Refuge|Crown|Frontier|Vale|Garden|Bastion|Drift',
 corporate: 'Asterion|Helix|Meridian|Kestrel|Novaris|Polaris|Zenith|Vanguard|Solace|Axiom|Nexum|Argent|Halcyon|Orbis|Cobalt|Trident',
 mythic: 'Astraea|Nyx|Erebus|Eos|Hyperion|Themis|Hecate|Aether|Janus|Vesta|Fortuna|Aurora|Atlas|Thalassa|Tethys|Mnemosyne',
 station: 'Anchorage|Station|Orbital|Exchange|Shipyard|Citadel|Spindle|Gateway|Relay|Depot|Terminal|Habitat|Ring|Outpost',
 moon: 'Lantern|Echo|Tear|Mirror|Warden|Companion|Pearl|Cinder|Shard|Veil|Halo|Sentinel',
 rock: 'Anvil|Hammer|Tooth|Flint|Knuckle|Nugget|Spur|Crag|Boulder|Splinter|Claw|Obsidian',
 rogue: 'Exile|Wanderer|Outcast|Nomad|Vagrant|Pilgrim|Wayfarer|Stranger|Drifter|Renegade|Voyager|Ghost',
 robot: 'PIP|AXI|NOVA|MICA|BOLT|ECHO|VEX|KITE|LUMA|NIX|ARGO|SABLE|TESS|RUNE|DOT|ION',
 role: 'Engineering|Medical|Navigation|Logistics|Security|Science|Maintenance|Communications',
 series: 'ENG|MED|NAV|LOG|SEC|SCI|MNT|COM',
 catalog: 'NGC|HD|HIP|TYC|NX|GL|KEP|TR'
}).map(([k,v]) => [k,Object.freeze(words(v))]).concat([['male',CLASSIFIED_NAMES.male],['female',CLASSIFIED_NAMES.female],['surname',CLASSIFIED_NAMES.surname]])));
function hash(value) { let h=2166136261; for(const c of value) h=Math.imul(h^c.charCodeAt(0),16777619); return h>>>0; }
function string(value,label) { if(typeof value!=='string'||!value.trim()||value.length>120) throw new TypeError(`${label} must be a nonempty string of at most 120 characters`); return value.trim(); }
export class NameGenerator {
 constructor({seed='stellar-names',data={},humanSource='arincli'}={}) {
  if(!['string','number'].includes(typeof seed)||typeof seed==='number'&&!Number.isFinite(seed)) throw new TypeError('seed must be a string or finite number');
  if(humanSource!=='arincli') throw new RangeError("humanSource must be 'arincli' (the FinNLP pool is not bundled in this build)");
  this.humanSource=humanSource; this.customHumanData=['male','female','surname'].some(k=>Object.hasOwn(data,k));
  this.seed=String(seed); this.state=hash(this.seed); this.used=new Set(); this.data={...DEFAULT_DATA};
  for(const [k,v] of Object.entries(data)) { if(!Object.hasOwn(DEFAULT_DATA,k)) throw new TypeError(`Unknown word list: ${k}`); if(!Array.isArray(v)||!v.length) throw new TypeError(`${k} must be a nonempty array`); this.data[k]=v.map(x=>string(x,k)); }
 }
 random() { this.state=(this.state+0x6D2B79F5)>>>0; let t=this.state; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }
 pick(key) { const a=this.data[key]; return a[Math.floor(this.random()*a.length)]; }
 integer(min,max) { return min+Math.floor(this.random()*(max-min+1)); }
 world() { return this.pick('onset')+(this.random()<0.45?this.pick('middle'):'')+this.pick('ending'); }
 /** Generate a structured record. unique applies across this instance. */
 generate(category,options={}) {
  if(!CATEGORIES.includes(category)) throw new RangeError(`Unknown category: ${category}`);
  const {style='frontier',unique=true,parent,surname,role}=options;
  if(!STYLES.includes(style)) throw new RangeError(`Unknown style: ${style}`);
  if(typeof unique!=='boolean') throw new TypeError('unique must be boolean');
  if(parent!==undefined) string(parent,'parent'); if(surname!==undefined) string(surname,'surname');
  if(role!==undefined&&!this.data.role.includes(role)) throw new RangeError('role must match an entry in data.role');
  for(let attempt=0;attempt<2000;attempt++) {
   let name,details={};
   const number=()=>String(this.integer(1,9999)).padStart(4,'0');
   const base=()=>style==='mythic'?`${this.pick('mythic')} ${this.integer(1,99)}`:style==='corporate'?`${this.pick('corporate')}-${number()}`:style==='scientific'?`${this.pick('catalog')} ${number()}`:this.world();
   switch(category) {
    case 'npcMale': case 'npcFemale': {
     const firstName=this.pick(category==='npcMale'?'male':'female'),familyName=surname===undefined?this.pick('surname'):surname.trim();
     name=`${firstName} ${familyName}`; details={firstName,surname:familyName,gender:category==='npcMale'?'male':'female',nameClassification:this.customHumanData?'custom':this.humanSource==='arincli'?'source-labeled':'unclassified',nameSource:this.customHumanData?'custom':this.humanSource}; break;
    }
    case 'robot': { const r=role??this.pick('role'),idx=this.data.role.indexOf(r),model=this.data.series[idx%this.data.series.length],serial=number(),callSign=this.pick('robot'); name=`${callSign} / ${model}-${serial}`; details={callSign,model,serial,role:r}; break; }
    case 'station': name=`${style==='frontier'?`${this.pick('frontier')} ${this.pick('place')}`:base()} ${this.pick('station')}`; break;
    case 'planet': name=style==='frontier'&&this.random()<0.35?`${this.pick('frontier')} ${this.pick('place')}`:base(); break;
    case 'moon': name=parent?`${parent.trim()} ${style==='scientific'?String.fromCharCode(98+this.integer(0,24)):this.pick('moon')}`:`${base()} ${this.pick('moon')}`; if(parent) details.parent=parent.trim(); break;
    case 'asteroid': { const designation=`AST-${number()}-${this.integer(10,99)}`; name=style==='scientific'?designation:`${this.pick('frontier')} ${this.pick('rock')} (${designation})`; details.designation=designation; break; }
    case 'rogueAsteroid': { const designation=`ROG-${number()}-${this.integer(10,99)}`; name=style==='scientific'?designation:`${style==='mythic'?this.pick('mythic'):this.pick('frontier')} ${this.pick('rogue')} (${designation})`; details={designation,trajectory:'unbound'}; break; }
   }
   const key=name.toLocaleLowerCase('en-US');
   if(unique&&this.used.has(key)) continue;
   if(unique) this.used.add(key);
   return {name,category,style,...details};
  }
  throw new RangeError('Unique name pool exhausted after 2000 attempts. Expand word lists or use unique:false.');
 }
 name(category,options={}) { return this.generate(category,options).name; }
 batch(category,count=10,options={}) {
  if(!Number.isInteger(count)||count<0||count>10000) throw new RangeError('count must be an integer from 0 to 10000');
  const oldState=this.state,oldUsed=new Set(this.used);
  try { return Array.from({length:count},()=>this.generate(category,options)); }
  catch(e) { this.state=oldState; this.used=oldUsed; throw e; }
 }
 reserve(names) { if(!Array.isArray(names)) throw new TypeError('names must be an array'); const keys=names.map(n=>string(n,'name').toLocaleLowerCase('en-US')); keys.forEach(k=>this.used.add(k)); }
 reset() { this.state=hash(this.seed); this.used.clear(); }
 snapshot() { return {version:2,humanSource:this.humanSource,seed:this.seed,state:this.state,used:[...this.used]}; }
 restore(s) { if(!s||s.version!==2||s.humanSource!==this.humanSource||s.seed!==this.seed||!Number.isInteger(s.state)||s.state<0||s.state>4294967295||!Array.isArray(s.used)||s.used.some(x=>typeof x!=='string')) throw new TypeError('Invalid snapshot or mismatched seed'); this.state=s.state; this.used=new Set(s.used); }
}
export default NameGenerator;
