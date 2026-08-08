// Living Galaxy — asteroid belts. Each belt has its own mineral profile, so where
// you mine decides what you haul. Weights are relative shares of a rock's yield.

export const MINERALS = {
  iron:      {name:'Iron',      value:6,   color:0x9a8878},
  silicate:  {name:'Silicates', value:3,   color:0x8a8070},
  nickel:    {name:'Nickel',    value:11,  color:0xa8a090},
  copper:    {name:'Copper',    value:16,  color:0xc07a44},
  titanium:  {name:'Titanium',  value:34,  color:0xb8c0c8},
  platinum:  {name:'Platinum',  value:78,  color:0xd8e0e8},
  iridium:   {name:'Iridium',   value:120, color:0xe0e8f0},
  volatiles: {name:'Volatiles', value:22,  color:0x88ccdd}
};

export const BELTS = [
  { key:'inner', name:'Cinder Belt', inner:6900, width:900, count:150,
    rockR:[2.5,11], hue:0.06, sat:0.22, light:[0.20,0.42],
    // hot inner belt: common metal, almost no rares
    mix:{ iron:44, silicate:34, nickel:14, copper:6, titanium:1.6, platinum:0.3, iridium:0.05, volatiles:0 } },

  { key:'main', name:'Meridian Belt', inner:10500, width:2600, count:300,
    rockR:[2.5,18], hue:0.07, sat:0.18, light:[0.22,0.50],
    // the workhorse field — balanced, where most miners sit
    mix:{ iron:34, silicate:26, nickel:18, copper:11, titanium:7, platinum:2.6, iridium:0.5, volatiles:0.9 } },

  { key:'trojan', name:'Kharon Trojans', inner:19000, width:1100, count:90,
    rockR:[4,22], hue:0.10, sat:0.10, light:[0.26,0.55],
    // sparse but rich: the rare-metal field worth the trip and the pirates
    mix:{ iron:16, silicate:12, nickel:14, copper:12, titanium:22, platinum:15, iridium:7, volatiles:2 } },

  { key:'outer', name:'Obscura Rime', inner:29000, width:2400, count:120,
    rockR:[3,16], hue:0.54, sat:0.16, light:[0.34,0.62],
    // cold field: ices and volatiles, little metal
    mix:{ iron:12, silicate:14, nickel:5, copper:3, titanium:4, platinum:1.4, iridium:0.4, volatiles:60 } }
];

// ── planetary rings ──────────────────────────────────────────────────
// The first rocks in this game that do not orbit the star.
//
// A ring is a mining field like any other — same records, same cutter, same market — but
// its rocks are held by a planet rather than by Solaris, so everything about it is
// expressed relative to a parent body. That distinction is the whole of the work: a belt
// is a radius from the origin, and a ring is a radius from something that is itself
// moving. See systems/fields.js for the one place that knows the difference.
//
// Rings are volatile fields, not metal fields. A gas giant's ring is water and ammonia ice
// that never accreted, so it pays in the one commodity the inner belts have almost none of
// — which is the reason to make the trip rather than mine the Meridian belt like everyone
// else.
export const RING_PROFILE = {
  count: 54, rockR: [1.8, 7], hue: 0.52, sat: 0.14, light: [0.42, 0.72],
  mix: { volatiles: 62, silicate: 20, iron: 8, nickel: 4, copper: 2.5,
         titanium: 2, platinum: 1.2, iridium: 0.3 }
};

/**
 * The field descriptor for a ringed body's ring, in the same shape as a BELTS row so that
 * every consumer of `S.world.belts` can hold both without a second code path. `inner` and
 * `width` are measured from the *parent*, and `parentName` is what says so.
 *
 * The radii match the ring mesh in world/system.js (1.4 to 2.2 body radii) deliberately:
 * a field you can mine and a band you can see have to be the same band, or the rocks are
 * somewhere the ring visibly is not.
 */
export function ringFieldFor(body) {
  const u = body.userData;
  return {
    key: 'ring:' + u.name,
    name: `${u.name} Ring`,
    parentName: u.name,
    inner: u.radius * 1.4,
    width: u.radius * 0.8,
    count: RING_PROFILE.count,
    rockR: RING_PROFILE.rockR,
    hue: RING_PROFILE.hue, sat: RING_PROFILE.sat, light: RING_PROFILE.light,
    mix: RING_PROFILE.mix
  };
}

/** Roll a concrete mineral breakdown (percent by mass) for one rock. */
export function rollComposition(belt, rng) {
  const out = {};
  let total = 0;
  for (const k in belt.mix) {
    const w = belt.mix[k];
    if (w <= 0) continue;
    const v = w * (0.55 + rng.next() * 0.9);
    out[k] = v; total += v;
  }
  for (const k in out) out[k] = (out[k] / total) * 100;
  return out;
}

/** Credits per kg for a given composition. */
export function compositionValue(comp) {
  let v = 0;
  for (const k in comp) v += (comp[k] / 100) * (MINERALS[k] ? MINERALS[k].value : 5);
  return v;
}
