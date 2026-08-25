// Living Galaxy — what a job can be.
//
// The board had four verbs: haul, bounty, survey, supply. Two of them named no place at all
// — a bounty said "Raiders in the lanes. Destroy them; the board does not care where," and a
// survey said "Resolve detail on bodies nobody has bothered to look at properly." Four
// offers per station, refreshing every ninety seconds, drawn from four templates. You saw
// every job the game had inside two minutes and then you saw them again forever.
//
// The fix is the same one the world catalogue used, applied to work instead of to worlds.
//
// ## A template declares what it needs, and reality decides if it can be offered
//
// Every entry below states the kind of **place** it requires, as tags checked against
// `world/landmarks.js`. A template whose requirement no landmark satisfies is not offered.
// So:
//
//   - "Search the Hollow Drift for flight recorders" cannot be posted in a system with no
//     debris field, because there is nothing to search.
//   - "Sample the upper atmosphere" cannot be posted where every world is airless.
//   - "Chart the libration point" cannot be posted where nothing holds trojans.
//
// A job that names a place that does not exist is the same defect as an ice world in an
// inferno orbit, wearing different clothes. The generator does not need to decide how wrong
// is too wrong, because the wrong ones are unrepresentable.
//
// ## Why the text is a function, not a string
//
// `title` and `brief` take the resolved landmark. That is the whole reason a board of
// twenty templates does not read like a board of twenty templates: the *place* carries the
// variety, and there are dozens of places. "Survey 2 bodies" was the same sentence forever;
// "Resolve the cloud deck on Nyxan — Meridian wants the pressure profile before it commits
// a lander" is a different sentence in every system, from one template.
//
// Pure data and pure functions. No state, no DOM. `verb` names the completion check that
// `systems/contracts.js` runs; adding a template with an existing verb costs nothing.

/**
 * Completion verbs. A template picks one; contracts.js knows how to judge each.
 *
 *   deliver  — carry N kg of a commodity to a named place
 *   acquire  — have N kg of a commodity in the hold, anywhere
 *   destroy  — N kills, optionally scoped to a place
 *   scan     — resolve N bodies to a scan tier, optionally at a named place
 *   search   — N successful sweeps of a debris field
 *   visit    — be within range of a place (the cheap one; a courier run, a look)
 */
export const VERBS = ['deliver', 'acquire', 'destroy', 'scan', 'search', 'visit'];

const kg = (lo, hi) => ({ lo, hi });

/**
 * The catalogue.
 *
 * `needs` — tags a landmark must carry to host this job. `needs: null` means the job is
 *           sited at the posting station and asks nothing of the system.
 * `weight` — relative frequency once the template is eligible at all.
 * `pay`    — credit band before tier, standing and distance scaling.
 * `tiers`  — which difficulty tiers may post it. Omitted means all.
 */
export const MISSION_TEMPLATES = {

  // ── salvage: the reason graveyards exist ───────────────────────────

  gravePicking: {
    verb: 'search', weight: 30, needs: ['graveyard'], skill: 'extraction', rep: 4,
    pay: [5200, 17000], count: [2, 5],
    title: (L) => `Work the ${L.name}`,
    brief: (L, ctx) =>
      `${ctx.station} is buying anything lifted out of the ${L.name} — ${L.grave.kind.toLowerCase()}, ` +
      `${L.grave.ageYears} years ago, ${L.grave.belligerentNames.join(' against ')}. ` +
      `${L.grave.eraText}. Bring back what the grapple finds; the desk is not asking what it is.`
  },

  graveRecords: {
    verb: 'search', weight: 22, needs: ['graveyard', 'records'], skill: 'sensors', rep: 5,
    pay: [7400, 21000], count: [3, 6],
    title: (L) => `Recover flight data — ${L.name}`,
    brief: (L, ctx) =>
      `Somebody at ${ctx.station} wants the recorders out of the ${L.name}, not the hull plate. ` +
      `Nav cores, targeting logs, anything that still holds a timestamp. ` +
      `The registry has questions about what happened out there and no answers.`
  },

  graveRelic: {
    verb: 'search', weight: 12, needs: ['graveyard', 'relics'], skill: 'sensors', rep: 8,
    pay: [11000, 34000], count: [5, 9], tiers: ['mid', 'high'],
    title: (L) => `Deep search — ${L.name}`,
    brief: (L, ctx) =>
      `A standing offer, and an old one. The ${L.name} has never been worked to the bottom, ` +
      `and ${ctx.station} will pay well above scrap for whatever is down there. ` +
      `Expect to spend real time in the field — the interesting things are not on the surface.`
  },

  graveOrdnance: {
    verb: 'search', weight: 14, needs: ['graveyard', 'hazardous'], skill: 'gunnery', rep: 6,
    pay: [8600, 23000], count: [3, 6], tiers: ['mid', 'high'],
    title: (L) => `Clear live ordnance — ${L.name}`,
    brief: (L) =>
      `The ${L.name} is still armed. Munitions that never found a target are drifting in it ` +
      `and the lane authority wants them lifted before somebody flies through at speed. ` +
      `Hazard pay is in the fee. So is the reason for it.`
  },

  graveSurvey: {
    verb: 'scan', weight: 16, needs: ['graveyard'], skill: 'sensors', rep: 3,
    pay: [3400, 11000], count: [1, 1],
    title: (L) => `Chart the ${L.name}`,
    brief: (L) =>
      `Nobody has run a proper sweep of the ${L.name} since it was made. ` +
      `Get close enough for a full resolution pass and log the debris envelope — ` +
      `the lane charts still show it as clear space.`
  },

  // ── survey: now with somewhere to go ───────────────────────────────

  surveyUncharted: {
    verb: 'scan', weight: 26, needs: ['planet', 'uncharted'], skill: 'sensors', rep: 3,
    pay: [3000, 10500], count: [1, 2],
    title: (L) => `Resolve ${L.name}`,
    brief: (L, ctx) =>
      `${L.name} is on the chart as a mass and a colour and nothing else. ` +
      `${ctx.station} wants a real profile before anyone commits a hull to it.`
  },

  surveyAtmosphere: {
    verb: 'scan', weight: 18, needs: ['planet', 'thick-atmosphere'], skill: 'sensors', rep: 4,
    pay: [4200, 13000], count: [1, 1],
    title: (L) => `Atmospheric profile — ${L.name}`,
    brief: (L) =>
      `${L.name} carries enough sky to be worth the instrument time. ` +
      `Pressure, composition, and where the deck breaks. A lander needs all three and ` +
      `the last survey to try it did not come back with any of them.`
  },

  surveyGiant: {
    verb: 'scan', weight: 14, needs: ['planet', 'giant'], skill: 'sensors', rep: 4,
    pay: [4800, 14500], count: [1, 1],
    title: (L) => `Sound the envelope — ${L.name}`,
    brief: (L) =>
      `Deep-atmosphere telemetry off ${L.name}. Sit in the gravity well long enough to ` +
      `get a column read. It is not dangerous so much as slow, and slow is why it is unclaimed.`
  },

  surveyLagrange: {
    verb: 'scan', weight: 20, needs: ['lagrange', 'uncharted'], skill: 'sensors', rep: 3,
    pay: [3400, 11500], count: [1, 1],
    title: (L) => `Chart ${L.name}`,
    brief: (L) =>
      `${L.name} has never been resolved. Things collect at libration points — ` +
      `that is what a libration point is for — and the board would like to know what has ` +
      `collected at this one. It may be nothing. Knowing it is nothing is worth the trip.`
  },

  // ── extraction ─────────────────────────────────────────────────────

  beltQuota: {
    verb: 'acquire', weight: 24, needs: ['belt'], skill: 'extraction', rep: 3,
    pay: [3600, 12500], kg: kg(500, 2400), commodity: 'ore',
    title: (L, ctx) => `Ore quota — ${L.name}`,
    brief: (L, ctx) =>
      `${ctx.station} is short on feedstock and the ${L.name} is the nearest face worth ` +
      `cutting. Bring the tonnage in; the desk does not care which rock it came off.`
  },

  // ── security ───────────────────────────────────────────────────────

  laneClearance: {
    verb: 'destroy', weight: 22, needs: ['station'], skill: 'gunnery', rep: 4,
    pay: [4400, 15000], count: [2, 5],
    title: (L) => `Clear the approach — ${L.name}`,
    brief: (L) =>
      `Raiders are working the ${L.name} approach and the berth traffic has noticed. ` +
      `Thin them out. The desk counts hulls, not intentions.`
  },

  beltRaiders: {
    verb: 'destroy', weight: 18, needs: ['belt'], skill: 'gunnery', rep: 4,
    pay: [4800, 15500], count: [2, 5],
    title: (L) => `Claim protection — ${L.name}`,
    brief: (L) =>
      `Somebody is shooting mining hulls in the ${L.name} and the crews have stopped going out. ` +
      `Make it somebody else's problem permanently.`
  },

  graveRaiders: {
    verb: 'destroy', weight: 16, needs: ['graveyard'], skill: 'gunnery', rep: 5,
    pay: [5600, 17500], count: [2, 4],
    title: (L) => `Break the scavengers — ${L.name}`,
    brief: (L) =>
      `The ${L.name} has attracted the kind of company that shoots at other salvagers. ` +
      `Clear them off it. Whoever is left gets the field.`
  },

  // ── freight ────────────────────────────────────────────────────────

  runTo: {
    verb: 'deliver', weight: 30, needs: ['station'], skill: 'commerce', rep: 3,
    pay: [3400, 12500], kg: kg(400, 2600),
    title: (L, ctx) => `Consignment to ${L.name}`,
    brief: (L, ctx) =>
      `${ctx.station} consigns a load to you for ${L.name}. Carry it and hand it over — ` +
      `the fee is the payment, the cargo is not yours to sell.`
  },

  shortfall: {
    verb: 'acquire', weight: 22, needs: null, skill: 'commerce', rep: 3,
    pay: [3600, 13000], kg: kg(300, 1800),
    title: (L, ctx) => `${ctx.station} is short`,
    brief: (L, ctx) =>
      `A shortfall at ${ctx.station} the local traffic has not covered. ` +
      `Bring it in and sell it here — the desk pays the contract rate, not the market rate.`
  },

  relief: {
    verb: 'deliver', weight: 14, needs: ['station', 'civilian'], skill: 'commerce', rep: 5,
    pay: [5200, 16000], kg: kg(600, 2200),
    title: (L) => `Relief run — ${L.name}`,
    brief: (L) =>
      `${L.name} has more people aboard than its supply contracts were written for. ` +
      `This is not an emergency yet and the point of the run is that it does not become one.`
  },

  // ── the quiet one ──────────────────────────────────────────────────

  lookAt: {
    verb: 'visit', weight: 10, needs: ['planet'], skill: 'sensors', rep: 2,
    pay: [1800, 6200], count: [1, 1], tiers: ['low'],
    title: (L) => `Eyes on ${L.name}`,
    brief: (L, ctx) =>
      `Somebody at ${ctx.station} wants a hull near ${L.name} and is not saying why. ` +
      `Get within visual range, log the pass, come back. It is exactly as simple as it sounds ` +
      `and the fee reflects that.`
  }
};

export const TEMPLATE_KEYS = Object.keys(MISSION_TEMPLATES);

/**
 * Does this template have somewhere to happen?
 *
 * The gate that makes the whole file work. A template with `needs: null` is always eligible;
 * anything else must find at least one landmark carrying every tag it asks for.
 */
export function sitesFor(tpl, marks) {
  if (!tpl.needs) return [null];
  return marks.filter(l => tpl.needs.every(t => l.tags.has(t)));
}

/** Every template that could be posted in this system right now, with its candidate sites. */
export function eligible(marks, tier) {
  const out = [];
  for (const key of TEMPLATE_KEYS) {
    const tpl = MISSION_TEMPLATES[key];
    if (tier && tpl.tiers && !tpl.tiers.includes(tier)) continue;
    const sites = sitesFor(tpl, marks);
    if (sites.length) out.push({ key, tpl, sites });
  }
  return out;
}
