/* Main-drive families. plume/flare/light scale the exhaust visuals; hot = core colour.
 * Add a family here AND a drive_<key>() builder in src/builder/drives.js. */
/* isp: specific impulse (s) · kNm2: thrust per m² of nozzle exit area at full throttle · halfAngle: plume cone (deg)
 * · atmo: may light inside an atmosphere. Figures are engineering order-of-magnitude for a mature industrial base. */
export const DRIVE_TYPES = {
  fusion:     { label: "Fusion Torch",     plume: 1.0,  flare: 1.0,  light: 2.4, hot: "#ffffff", isp: 100000, kNm2: 900,  halfAngle: 10, atmo: false },
  ion:        { label: "Ion Grid",         plume: 1.5,  flare: 0.35, light: 1.1, hot: "#cfe8ff", isp: 5000,   kNm2: 0.4,  halfAngle: 25, atmo: false },
  plasma:     { label: "Plasma Lance",     plume: 1.9,  flare: 0.8,  light: 2.8, hot: "#ffffff", isp: 6000,   kNm2: 12,   halfAngle: 12, atmo: false },
  antimatter: { label: "Antimatter Ring",  plume: 2.2,  flare: 1.3,  light: 3.4, hot: "#ffffff", isp: 400000, kNm2: 1500, halfAngle: 8,  atmo: false },
  pulse:      { label: "Pulse Detonation", plume: 1.2,  flare: 0.9,  light: 2.2, hot: "#fff2d0", isp: 3000,   kNm2: 60,   halfAngle: 18, atmo: false },
  vector:     { label: "Vectored Chem",    plume: 0.85, flare: 0.7,  light: 1.8, hot: "#ffd9a0", isp: 340,    kNm2: 600,  halfAngle: 15, atmo: true },
  hydrogen:   { label: "Hydrogen Chem",    plume: 0.95, flare: 1.15, light: 2.1, hot: "#ffcf8f", isp: 450,    kNm2: 560,  halfAngle: 15, atmo: true },
  micro:      { label: "Micro-Emitter Array", plume: 1.2,  flare: 0.15, light: 0.6, hot: "#e8d8ff", isp: 8000, kNm2: 0.02, halfAngle: 30, atmo: false },
  hall:       { label: "Hall Array",       plume: 1.7,  flare: 0.28, light: 1.2, hot: "#dff2ff", isp: 2500,   kNm2: 0.9,  halfAngle: 30, atmo: false },
  ntr:        { label: "Nuclear Thermal",  plume: 1.35, flare: 0.65, light: 2.1, hot: "#d7c8ff", isp: 900,    kNm2: 420,  halfAngle: 14, atmo: false },
  gravitic:   { label: "Gravitic Coil",    plume: 0.0,  flare: 0.25, light: 1.7, hot: "#bfffe4", isp: Infinity, kNm2: 8,  halfAngle: 0,  atmo: true }
};
