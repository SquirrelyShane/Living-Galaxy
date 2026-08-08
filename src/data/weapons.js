// Living Galaxy — weapon modules. Ships mount one primary; the hull sets what it can
// take, and better mounts are bought at a shipyard.
//   kind:  'energy' drains the bank hard but never runs dry; 'projectile' is cheap on
//          power; 'missile' tracks; 'utility' doesn't damage at all.
//   dtype: which damage type the round carries — see DAMAGE in core/config.js.
//          em shreds shields, kinetic punches armour, thermal burns structure.
//   optimal / falloff: full damage inside `optimal`, decaying over `falloff` units to
//          DAMAGE.falloffFloor. This is what stops a scatter beam from being a sniper
//          rifle and a railgun from being a knife.
//
// The type spread is the point. There is no weapon that is best against everything:
// a pirate at full shields wants EM, the same pirate stripped to plating wants kinetic.

export const WEAPON_MODULES = {
  pulse:    {name:'Pulse laser',      kind:'energy',     dtype:'thermal', damage:10, speed:760,  life:1.20,
             optimal:420, falloff:380,
             cooldown:0.19, energy:3.0, color:0x66ddff, price:0,     desc:'Standard-issue emitter · thermal'},
  beam:     {name:'Beam projector',   kind:'energy',     dtype:'thermal', damage:7,  speed:1400, life:0.55,
             optimal:560, falloff:300,
             cooldown:0.07, energy:2.2, color:0x88ffee, price:15600,  desc:'Rapid low-yield stream, superb tracking · thermal'},
  scatter:  {name:'Scatter beam',     kind:'energy',     dtype:'em',      damage:6,  speed:620,  life:0.95,
             optimal:240, falloff:200,
             cooldown:0.11, energy:1.9, color:0xaaffcc, price:7800,  desc:'Wide, cheap, close range · EM, melts shields'},
  autocan:  {name:'Autocannon',       kind:'projectile', dtype:'kinetic', damage:14, speed:900,  life:1.10,
             optimal:480, falloff:420,
             cooldown:0.16, energy:0.9, color:0xffcc66, price:12300,  desc:'High rate of fire, minimal power draw · kinetic'},
  gauss:    {name:'Gauss driver',     kind:'projectile', dtype:'kinetic', damage:24, speed:1100, life:1.00,
             optimal:700, falloff:500,
             cooldown:0.62, energy:7.5, color:0xffd070, price:0,     desc:'Heavy slug, slow cycle · kinetic'},
  railgun:  {name:'Railgun',          kind:'projectile', dtype:'kinetic', damage:52, speed:1800, life:1.30,
             optimal:1250, falloff:700,
             cooldown:1.25, energy:16,  color:0xfff0a0, price:29400,  desc:'Punches through armor at range · kinetic'},
  missile:  {name:'Missile rack',     kind:'missile',    dtype:'thermal', damage:44, speed:520,  life:4.5,
             cooldown:1.60, energy:5.0, color:0xff8844, price:22200,  desc:'Seeks the locked target · thermal', track:2.6},
  torpedo:  {name:'Torpedo tube',     kind:'missile',    dtype:'kinetic', damage:110,speed:340,  life:6.5,
             cooldown:3.40, energy:12,  color:0xff6622, price:40500, desc:'Slow, devastating, needs a lock · kinetic', track:1.5},
  decoy:    {name:'Decoy buoy',       kind:'utility',    dtype:'em',      damage:0,  speed:120,  life:14,
             cooldown:6.0,  energy:8.0, color:0xaaffff, price:11400,  desc:'Drops a buoy that pulls missile locks'}
};

export const WEAPON_KEYS = Object.keys(WEAPON_MODULES);

/** Weapons of a given damage type — the shipyard filters with this. */
export const weaponsOfType = t => WEAPON_KEYS.filter(k => WEAPON_MODULES[k].dtype === t);
