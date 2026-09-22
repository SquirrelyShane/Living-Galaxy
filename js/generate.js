import { PUBLIC_ROOM, SOL_BEACONS, SOL_BODIES, } from "./bodies.js";
import { archetypeById, rollArchetypeAt, tempBand } from "./archetypes.js";
import { skyNaming, worldName, moonName, beaconName } from "./names.js";
function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return () => {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    };
}
function mulberry32(seed) {
    return () => {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
export function rngFromSeed(seed) {
    return mulberry32(xmur3(seed)());
}
function range(rng, a, b) {
    return a + rng() * (b - a);
}
function irange(rng, a, b) {
    return Math.floor(range(rng, a, b + 1));
}
function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
}
function chance(rng, p) {
    return rng() < p;
}
const ROCKY = ["#9a8f84", "#b08a6a", "#8c7b6a", "#c4a882", "#7a6e66", "#a89888"];
const CLOUD = ["#d4b896", "#e0c4a0", "#c9b38a", "#d8c3a6"];
const TERRA = ["#6b9ac4", "#5a8f7a", "#4f7ea8", "#6a9b8c", "#3d7a6a"];
const GAS = ["#c4a07a", "#d2b48c", "#b8946a", "#c9b07a", "#a89070", "#cbb08c"];
const ICE = ["#9ad4d6", "#4a6ec8", "#7eb0d0", "#8ec4c8", "#5b7ec0"];
const DWARF = ["#cbb9a8", "#b9a898", "#d0c0b0"];
const MOON = ["#c5c0b6", "#b8b2a8", "#d2ccc2", "#9a948c", "#c8c2b4"];
const STARS = [
    { color: "#cfe0ff", radius: 14.5, label: "B", weight: 0.5 },
    { color: "#eaf0ff", radius: 12.1, label: "A", weight: 1 },
    { color: "#f4f0e4", radius: 10.2, label: "F", weight: 1.6 },
    { color: "#ffb56b", radius: 8.4, label: "G", weight: 2.2 },
    { color: "#ff8f5c", radius: 6.8, label: "K", weight: 2.2 },
    { color: "#ff7348", radius: 5.4, label: "M", weight: 2.6 },
    { color: "#ff5f3c", radius: 4.1, label: "red dwarf", weight: 1.4 },
];

function pickWeighted(rng, arr) {
    const total = arr.reduce((s, x) => s + (x.weight ?? 1), 0);
    let r = rng() * total;
    for (const x of arr) {
        r -= x.weight ?? 1;
        if (r <= 0) return x;
    }
    return arr[arr.length - 1];
}
/* Worlds used to be one root plus one tail — 27 x 14, three hundred and
 * seventy-eight names for every body in every sky, shared between stars,
 * planets and moons. They come out of js/names.js now: each system draws a
 * tongue and names its worlds from it, so a sky sounds like one place, and a
 * world that nobody settled often never got past its survey designation.
 *
 * Archetypes that mean somebody could actually live there. A world with
 * people on it tends to be named after whoever got there first. */
const SETTLED_ARCH = new Set(["garden", "archipelago", "jungle", "steppe", "tundra", "dying"]);
function atmoFor(kind, color) {
    if (kind === "rocky" || kind === "moon" || kind === "dwarf" || kind === "star")
        return undefined;
    return color;
}
const HINTS = {
    star: ["Photosphere in range. Do not linger."],
    rocky: ["Cratered crust. Thin or no air.", "Iron plains. Keep your visor down.", "Old lava, now cold."],
    cloud: ["Opaque deck. Radar only.", "A pressure house under pale haze."],
    terra: ["Open sky, weather, coastlines.", "A living world. Treat it as such."],
    gas: ["Banded hydrogen. Watch the radiation.", "A giant with a long memory of storms."],
    ice: ["Methane cold. Fast winds.", "A pale giant at the edge of the light."],
    moon: ["Grey stone. Quiet.", "A waypoint, not a home.", "Captured ice and dust."],
    dwarf: ["Ice and rock at the chart's margin."],
};
const BLURBS = {
    star: ["The mass that holds this sky together."],
    rocky: ["A scorched inner world.", "Too close to keep an ocean."],
    cloud: ["Beautiful from a distance. Hostile up close."],
    terra: ["The system's best argument for staying."],
    gas: ["Most of the system's leftover mass, still unsettled."],
    ice: ["Far, fast, and dimmer than it looks on the map."],
    moon: ["Caught in someone else's well."],
    dwarf: ["Not a giant. Still a destination."],
};
function makeBody(rng, partial) {
    /* An archetype that names its own atmosphere colour gets it (applied in
     * scaleBody); only arch-less bodies fall back to the generic kind tint. */
    const archAtmo = partial.arch ? archetypeById(partial.arch)?.atmo : undefined;
    return {
        ...partial,
        atmo: partial.atmo ?? (archAtmo ? undefined : atmoFor(partial.kind, partial.color)),
        scanHint: pick(rng, HINTS[partial.kind]),
        blurb: pick(rng, BLURBS[partial.kind]),
    };
}
export function generateSystem(seedRaw) {
    const seed = seedRaw.trim() || PUBLIC_ROOM;
    if (seed === PUBLIC_ROOM || seed.toLowerCase() === "sol") {
        return {
            seed: PUBLIC_ROOM,
            name: "Sol",
            bodies: SOL_BODIES,
            beacons: SOL_BEACONS,
            belt: { inner: 72, outer: 84, count: 240 },
            /* the Kuiper belt: Sol's ice country, so every gas and volatile is
             * cuttable here too — no sky is short of anything a bench can use */
            outerBelt: { inner: 190, outer: 232, count: 260 },
            starClass: "G",
        };
    }
    const rng = rngFromSeed(`lg:${seed}`);
    const used = new Set();
    const sky = skyNaming(seed);
    const starName = sky.star;
    used.add(starName);
    const star = pickWeighted(rng, STARS);
    const bodies = [
        makeBody(rng, {
            id: "sun",
            name: starName,
            kind: "star",
            radius: star.radius,
            orbit: 0,
            period: 1,
            phase: 0,
            inclination: 0,
            eccentricity: 0,
            spin: 0.03 + rng() * 0.04,
            color: star.color,
        }),
    ];
    /* Systems vary a lot more than Sol does: some are all rock, some are a
     * chain of giants, some carry a world that already came apart. */
    const flavour = rng();
    const rocky = flavour < 0.22;   // dense inner system, few giants
    const giants = flavour > 0.78;  // giant chain

    const slots = [{ kind: "rocky", rMul: [0.48, 0.9] }];
    if (chance(rng, rocky ? 0.9 : 0.55)) slots.push({ kind: "rocky", rMul: [0.5, 1.05] });
    slots.push({ kind: chance(rng, 0.55) ? "cloud" : "rocky", rMul: [0.85, 1.32] });
    slots.push({
        kind: chance(rng, rocky ? 0.5 : 0.72) ? "terra" : chance(rng, 0.5) ? "cloud" : "rocky",
        rMul: [1.05, 1.65],
    });
    slots.push({ kind: "rocky", rMul: [0.62, 1.15] });
    slots.push({ kind: "gas", rMul: giants ? [4.2, 6.6] : [3.2, 5.4] });
    if (chance(rng, giants ? 0.95 : 0.78)) slots.push({ kind: "gas", rMul: [2.6, 4.8], rings: true });
    if (chance(rng, giants ? 0.7 : 0.25)) slots.push({ kind: "gas", rMul: [2.2, 4] });
    if (chance(rng, 0.88)) slots.push({ kind: "ice", rMul: [1.7, 2.9], rings: chance(rng, 0.3) });
    if (chance(rng, 0.7)) slots.push({ kind: "ice", rMul: [1.55, 2.4] });
    if (chance(rng, 0.62)) slots.push({ kind: "dwarf", rMul: [0.28, 0.6] });
    if (chance(rng, 0.45)) slots.push({ kind: "dwarf", rMul: [0.22, 0.44] });
    if (chance(rng, 0.3)) slots.push({ kind: "dwarf", rMul: [0.2, 0.4] });
    let orbit = range(rng, 16, 22);
    let belt = null;
    let beltPlaced = false;
    let pIndex = 0;
    for (let s = 0; s < slots.length; s++) {
        const slot = slots[s];
        if (!beltPlaced && slot.kind === "gas") {
            const inner = orbit + range(rng, 4, 8);
            const width = range(rng, 8, 16);
            belt = { inner, outer: inner + width, count: irange(rng, 180, 360) };
            orbit = belt.outer + range(rng, 8, 14);
            beltPlaced = true;
        }
        else {
            orbit *= range(rng, 1.32, 1.58);
        }
        const palette = slot.kind === "rocky"
            ? ROCKY
            : slot.kind === "cloud"
                ? CLOUD
                : slot.kind === "terra"
                    ? TERRA
                    : slot.kind === "gas"
                        ? GAS
                        : slot.kind === "ice"
                            ? ICE
                            : DWARF;
        const id = `p${pIndex}`;
        const radius = range(rng, slot.rMul[0], slot.rMul[1]);
        /* Where it sits decides what it probably is. */
        const band = tempBand(s + 0.5, slots.length);
        const arch = rollArchetypeAt(slot.kind, rng, band);
        /* And what it is decides how it got its name. */
        const { name } = worldName(sky, { kind: slot.kind, arch: arch.id, index: pIndex, settled: SETTLED_ARCH.has(arch.id) }, rng, used);
        const planet = makeBody(rng, {
            id,
            name,
            arch: arch.id,
            kind: slot.kind,
            radius,
            orbit,
            period: Math.max(18, orbit * range(rng, 1.8, 2.6)),
            phase: range(rng, 0, Math.PI * 2),
            inclination: range(rng, -0.04, 0.08) * (slot.kind === "dwarf" ? 2.4 : 1),
            eccentricity: range(rng, 0.01, slot.kind === "dwarf" ? 0.24 : 0.09),
            spin: (chance(rng, 0.12) ? -1 : 1) * range(rng, 0.05, 0.45),
            color: pick(rng, palette),
            rings: slot.rings || (slot.kind === "gas" && chance(rng, 0.18)),
        });
        /* Some systems have already had their catastrophe. */
        if (slot.kind !== "gas" && slot.kind !== "star" && chance(rng, 0.07)) planet.bornShattered = true;
        bodies.push(planet);
        pIndex++;
        const moonChance = slot.kind === "gas" || slot.kind === "ice" ? 0.9 : slot.kind === "terra" ? 0.72 : 0.22;
        if (chance(rng, moonChance)) {
            const moons = slot.kind === "gas" ? irange(rng, 1, 6) : slot.kind === "ice" ? irange(rng, 1, 4) : irange(rng, 1, 2);
            for (let m = 0; m < moons; m++) {
                const marc = rollArchetypeAt("moon", rng, band === "furnace" || band === "hot" ? "hot" : band);
                bodies.push(makeBody(rng, {
                    id: `${id}-m${m}`,
                    arch: marc.id,
                    name: moonName(name, m, sky, rng, used),
                    kind: "moon",
                    radius: range(rng, 0.16, Math.min(0.62, radius * 0.4)),
                    orbit: radius * range(rng, 2.3, 4.6) + m * range(rng, 1.05, 1.9),
                    period: range(rng, 8, 22),
                    phase: range(rng, 0, Math.PI * 2),
                    inclination: range(rng, -0.1, 0.1),
                    eccentricity: range(rng, 0.01, 0.08),
                    spin: range(rng, 0.04, 0.12),
                    color: pick(rng, MOON),
                    parent: id,
                }));
            }
        }
    }
    /* Every sky gets a main belt and an outer ice belt. The main belt's bands
     * carry every metal, stone and carbon ore; the outer belt carries every
     * ice and gas — so whatever the trade, and whichever sky the tutorial
     * finds itself in, the material it needs exists somewhere out there. */
    if (!belt) {
        const inner = range(rng, 60, 90);
        belt = { inner, outer: inner + range(rng, 8, 16), count: irange(rng, 140, 260) };
    }
    let outerBelt = null;
    {
        const inner = Math.max(belt.outer + 40, range(rng, 180, 300));
        outerBelt = { inner, outer: inner + range(rng, 20, 50), count: irange(rng, 160, 320) };
    }
    const beacons = [];
    const nBeacons = irange(rng, 5, 8);
    const maxOrbit = Math.max(...bodies.filter((b) => !b.parent).map((b) => b.orbit), 80);
    for (let i = 0; i < nBeacons; i++) {
        beacons.push({
            id: `b${i}`,
            name: beaconName(sky, i, rng),
            orbit: range(rng, 22, maxOrbit * 0.95),
            period: range(rng, 60, 1400),
            phase: range(rng, 0, Math.PI * 2),
            inclination: range(rng, -0.14, 0.14),
        });
    }
    return { seed, name: starName, catalogue: sky.catalogue, bodies, beacons, belt, outerBelt, starClass: star.label };
}
export function spawnBodyId(system) {
    const terra = system.bodies.find((b) => b.kind === "terra");
    if (terra)
        return terra.id;
    const planets = system.bodies.filter((b) => !b.parent && b.kind !== "star");
    return planets[Math.min(2, planets.length - 1)]?.id ?? "sun";
}
export function describeSystem(system) {
    return {
        planets: system.bodies.filter((b) => !b.parent && b.kind !== "star").length,
        moons: system.bodies.filter((b) => b.kind === "moon").length,
        belt: Boolean(system.belt),
        belts: (system.belt ? 1 : 0) + (system.outerBelt ? 1 : 0),
        ringed: system.bodies.filter((b) => b.rings).length,
        shattered: system.bodies.filter((b) => b.bornShattered).length,
        star: system.starClass ?? "G",
    };
}
