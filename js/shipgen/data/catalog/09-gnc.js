import { P, INT } from "./_part.js";
/* 09 — GUIDANCE, NAVIGATION & TIMING */
export default {
  id: "d09", name: "09 Guidance, Navigation & Timing",
  sheet: {
    materials: "Fiber-optic / ring-laser gyros, cold-atom cells, low-noise CCD/CMOS, X-ray detector arrays",
    interfaces: "Flight computer, attitude control, comms time sync, engine gimbal loop",
    failures: "Gyro bias growth, tracker bloom from plume or sun, clock drift",
    industry: "Precision optics, atomic clock labs, detector fabs",
    range: "Attitude knowledge to arcseconds; deep-space position from one-way clock + pulsars"
  },
  groups: [
    { id: "d09.imu", name: "IMUs", parts: [
      P("gn.fog",       "Fiber-Optic Gyro IMU",            "hatch",  { size: 0.6, tags: INT, mass: 0.1, pwr: -1 }),
      P("gn.rlg",       "Ring-Laser Gyro IMU",             "hatch",  { size: 0.6, tags: INT, mass: 0.15, pwr: -1, lamp: "#ff4a5a" }),
      P("gn.coldatom",  "Cold-Atom Interferometer IMU",    "module", { size: 0.6, tags: INT, mass: 0.5, pwr: -3, heat: -1, cold: true, lamp: "#bfe4ff" })
    ]},
    { id: "d09.optical", name: "Star trackers / optical nav", parts: [
      P("gn.startrack", "Star Tracker",                    "optic",  { size: 0.6, tags: ["sensor"], mass: 0.15, pwr: -1 }),
      P("gn.sunsensor", "Sun / Horizon Sensor",            "hatch",  { size: 0.5, tags: ["sensor"], mass: 0.05, lamp: "#ffb03a" }),
      P("gn.navcam",    "Optical Navigation Camera",       "optic",  { size: 0.7, tags: ["sensor"], mass: 0.3, pwr: -2 })
    ]},
    { id: "d09.pulsar", name: "Pulsar / X-ray nav", parts: [
      P("gn.pulsar",    "Pulsar X-ray Navigation Detector","optic",  { size: 0.9, tags: ["sensor"], mass: 0.5, pwr: -3 }),
      P("gn.relproc",   "Relativistic Correction Processor","hatch", { size: 0.5, tags: INT, mass: 0.05, pwr: -1, lamp: "#cf8bff" })
    ]},
    { id: "d09.clock", name: "Deep-space clocks", parts: [
      P("gn.atomclock", "Deep-Space Atomic Clock",         "module", { size: 0.5, tags: INT, mass: 0.3, pwr: -2, lamp: "#5fd0ff", cold: true }),
      P("gn.gnss",      "GNSS Receiver (near-world)",      "hatch",  { size: 0.5, tags: ["sensor"], mass: 0.05, lamp: "#7dffbe" })
    ]},
    { id: "d09.rel", name: "Relative / formation nav", parts: [
      P("gn.altimeter", "Landing LIDAR Altimeter",         "sensorPod", { size: 0.7, faces: ["bottom"], tags: ["sensor", "scanner"], mass: 0.3, pwr: -3, lamp: "#7dffbe" }),
      P("gn.formation", "Formation-Flying Beacon",         "mast",   { size: 0.7, tags: ["sensor", "comm"], mass: 0.05 })
    ]}
  ]
};
