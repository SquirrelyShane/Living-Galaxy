import { P, INT } from "./_part.js";
/* 11 — SENSORS & SITUATIONAL AWARENESS */
export default {
  id: "d11", name: "11 Sensors & Situational Awareness",
  sheet: {
    materials: "Detector arrays, sapphire windows, scintillators, MEMS gas sensors, fiber strain gauges",
    interfaces: "Flight computer, collision-avoidance logic, ECLSS control loops",
    failures: "Window pitting, detector noise, calibration drift",
    industry: "Detector fabs, calibration ranges, optical shops",
    range: "Forward radar km–thousands of km; SHM networks thousands of channels"
  },
  groups: [
    { id: "d11.active", name: "LIDAR / radar", parts: [
      P("sw.lidar",     "Forward LIDAR",                   "sensorPod", { size: 0.8, tags: ["sensor", "scanner"], mass: 0.4, pwr: -3, lamp: "#7dffbe" }),
      P("sw.radar",     "Forward RADAR",                   "sensorPod", { size: 1.0, tags: ["sensor", "scanner"], mass: 0.7, pwr: -8, heat: 3 }),
      P("sw.sar",       "Synthetic Aperture Array",        "array",     { size: 0.9, tags: ["sensor"], mass: 0.9, pwr: -12, heat: 4, tint: "dark", mirror: true }),
      P("sw.scanhead",  "Scanning Sensor Turret",          "scanner",   { size: 0.9, tags: ["sensor", "scanner"], mass: 0.6, pwr: -6, heat: 2 })
    ]},
    { id: "d11.imaging", name: "Cameras & spectrometers", parts: [
      P("sw.debriscam", "Debris Camera Cluster",           "optic",     { size: 0.6, tags: ["sensor"], mass: 0.2, pwr: -1 }),
      P("sw.spectro",   "Imaging Spectrometer",            "optic",     { size: 0.9, tags: ["sensor", "science"], mass: 0.5, pwr: -3, cold: true }),
      P("sw.telescope", "Deep-Space Telescope",            "optic",     { size: 1.5, tags: ["science", "sensor"], mass: 2.0, pwr: -4, cold: true })
    ]},
    { id: "d11.env", name: "Dust / plasma / radiation monitors", parts: [
      P("sw.dosimeter", "Radiation Dosimeter Array",       "hatch",     { size: 0.5, tags: ["sensor"], mass: 0.05, lamp: "#ffb03a" }),
      P("sw.plasma",    "Plasma & Dust Detector Mast",     "mast",      { size: 1.1, tags: ["sensor"], mass: 0.2, pwr: -1 }),
      P("sw.ism",       "Interstellar Medium Particle Detector", "mast",{ size: 1.1, tags: ["sensor", "science"], mass: 0.2, pwr: -1 })
    ]},
    { id: "d11.cabin", name: "Cabin & structural health", parts: [
      P("sw.cabinair",  "Cabin Gas Sensor Array",          "hatch",     { size: 0.5, tags: INT, mass: 0.03, lamp: "#7dffbe" }),
      P("sw.acoustic",  "Acoustic Leak Detector Net",      "hatch",     { size: 0.5, tags: INT, mass: 0.03, lamp: "#ff4a5a" }),
      P("sw.shm",       "Structural Health Sensor Net",    "hatch",     { size: 0.6, tags: INT, mass: 0.1, lamp: "#5fd0ff" })
    ]}
  ]
};
