// Living Galaxy — planetary body database. 20 body classes with real physical
// character: size, surface colour, atmosphere, gravity and satellite counts.
// `gravity` drives warp-disruption radius; `atmo` drives the shell shader look.

export const PLANET_TYPES = {
  lava:        {name:'Lava',            r:[52,88],   color:0xff5522, glow:0xff7733, emissive:0.55,
                atmo:{color:0xff8844, opacity:0.22, thick:1.10}, gravity:1.15, moons:[0,1], temp:[620,1400]},
  molten:      {name:'Molten core',     r:[60,96],   color:0xd93a10, glow:0xff6a20, emissive:0.62,
                atmo:{color:0xff6633, opacity:0.26, thick:1.12}, gravity:1.30, moons:[0,1], temp:[900,1800]},
  barren:      {name:'Barren rock',     r:[28,58],   color:0x8a8073, glow:0,        emissive:0.10,
                atmo:null,                                        gravity:0.55, moons:[0,2], temp:[-160,120]},
  ironCore:    {name:'Iron world',      r:[40,70],   color:0x9a8a7a, glow:0,        emissive:0.12,
                atmo:null,                                        gravity:1.60, moons:[0,1], temp:[-120,300]},
  carbon:      {name:'Carbon world',    r:[44,74],   color:0x2b2b33, glow:0,        emissive:0.08,
                atmo:{color:0x554455, opacity:0.10, thick:1.05}, gravity:1.10, moons:[0,2], temp:[-40,420]},
  terrestrial: {name:'Terrestrial',     r:[62,92],   color:0x2f9a58, glow:0,        emissive:0.16,
                atmo:{color:0x66aaff, opacity:0.24, thick:1.09}, gravity:1.00, moons:[1,3], temp:[-30,45]},
  ocean:       {name:'Ocean world',     r:[68,104],  color:0x1f6fbf, glow:0,        emissive:0.18,
                atmo:{color:0x88ccff, opacity:0.28, thick:1.10}, gravity:1.05, moons:[1,2], temp:[-10,38]},
  desert:      {name:'Desert',          r:[50,84],   color:0xc9954a, glow:0,        emissive:0.14,
                atmo:{color:0xddaa66, opacity:0.16, thick:1.07}, gravity:0.85, moons:[0,2], temp:[10,90]},
  tundra:      {name:'Tundra',          r:[54,86],   color:0x8fa8b0, glow:0,        emissive:0.15,
                atmo:{color:0xaaccdd, opacity:0.20, thick:1.08}, gravity:0.92, moons:[0,2], temp:[-70,5]},
  ice:         {name:'Ice world',       r:[46,88],   color:0xbfe4f0, glow:0,        emissive:0.20,
                atmo:{color:0xcceeff, opacity:0.14, thick:1.06}, gravity:0.78, moons:[0,3], temp:[-210,-60]},
  methaneIce:  {name:'Methane ice',     r:[58,96],   color:0x5f9ec4, glow:0,        emissive:0.18,
                atmo:{color:0x77bbdd, opacity:0.22, thick:1.09}, gravity:0.88, moons:[1,3], temp:[-190,-120]},
  methaneSea:  {name:'Liquid methane',  r:[64,98],   color:0x3a6f8a, glow:0,        emissive:0.17,
                atmo:{color:0xd8b060, opacity:0.34, thick:1.13}, gravity:0.72, moons:[0,2], temp:[-185,-150]},
  sulfur:      {name:'Sulfur world',    r:[38,66],   color:0xe0c040, glow:0xffd050, emissive:0.30,
                atmo:{color:0xffe070, opacity:0.18, thick:1.07}, gravity:0.68, moons:[0,1], temp:[-60,180]},
  toxic:       {name:'Toxic greenhouse',r:[58,90],   color:0xbfa04a, glow:0,        emissive:0.22,
                atmo:{color:0xe8d070, opacity:0.42, thick:1.16}, gravity:1.08, moons:[0,1], temp:[280,480]},
  radioactive: {name:'Irradiated',      r:[44,76],   color:0x6ec04a, glow:0x88ff55, emissive:0.34,
                atmo:{color:0x99ff66, opacity:0.20, thick:1.09}, gravity:0.95, moons:[0,2], temp:[40,260]},
  crystalline: {name:'Crystalline',     r:[42,72],   color:0x9a6ad0, glow:0xbb88ff, emissive:0.36,
                atmo:{color:0xbb99ff, opacity:0.16, thick:1.07}, gravity:0.90, moons:[0,2], temp:[-120,60]},
  superEarth:  {name:'Super-Earth',     r:[96,140],  color:0x4a8f6a, glow:0,        emissive:0.16,
                atmo:{color:0x77bbcc, opacity:0.26, thick:1.10}, gravity:2.10, moons:[2,5], temp:[-20,60]},
  gasGiant:    {name:'Gas giant',       r:[150,240], color:0xd6a95c, glow:0,        emissive:0.14,
                atmo:{color:0xe8c88a, opacity:0.30, thick:1.06}, gravity:2.60, moons:[3,7], temp:[-150,-90],
                bands:true, rings:0.7},
  heliumGiant: {name:'Helium giant',    r:[140,215], color:0xe8dcc0, glow:0,        emissive:0.15,
                atmo:{color:0xfff0d0, opacity:0.26, thick:1.06}, gravity:2.30, moons:[2,6], temp:[-170,-110],
                bands:true, rings:0.4},
  methaneGiant:{name:'Methane giant',   r:[120,190], color:0x2f6fd0, glow:0,        emissive:0.18,
                atmo:{color:0x6699ff, opacity:0.30, thick:1.07}, gravity:2.20, moons:[2,6], temp:[-215,-160],
                bands:true, rings:0.5}
};

const PLANET_KEYS = Object.keys(PLANET_TYPES);

/** Bodies actually placed in Solaris. Original six keep their names for continuity. */
export const SYSTEM_PLANETS = [
  {name:'Aether',   type:'barren',       orbit:2800},
  {name:'Vulcan',   type:'lava',         orbit:4800},
  {name:'Cinder',   type:'sulfur',       orbit:6400},
  {name:'Gaia',     type:'terrestrial',  orbit:8200},
  {name:'Meridian', type:'ocean',        orbit:9800},
  {name:'Kharon',   type:'ironCore',     orbit:12000},
  {name:'Titanus',  type:'gasGiant',     orbit:14500},
  {name:'Vesper',   type:'toxic',        orbit:17200},
  {name:'Nereid',   type:'methaneIce',   orbit:21000},
  {name:'Halcyon',  type:'heliumGiant',  orbit:25500},
  {name:'Obscura',  type:'methaneGiant', orbit:32000},
  {name:'Threnody', type:'crystalline',  orbit:38000}
];
