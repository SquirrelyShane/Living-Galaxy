/* Architecture styles: the *language* a station is built in.
 *
 * An archetype says what a station is for; a style says how its builders
 * build. The style weights which body forms each module family may take
 * (see prefabs/forms.js), which decorative kit goes on afterwards, how the
 * hangar mouths are cut, which structural alloy the hull is skinned in and
 * which hull grammars it favours. Every station rolls its own instance of
 * each form, so two stations in the same style are cousins, not twins.
 *
 *   cathedral   naves, pointed arches, buttresses, spires, rose windows — the pilgrim orders
 *   bastion     sloped armour, faceted keeps, gun blisters, blast doors — military spec
 *   civic       clean stacked decks, window bands, terraces — cities and trade
 *   industrial  drums, stacks, pipe, hazard stripes, exposed frames — the works
 *   frontier    welded hulls of odd sizes, patches, girders, cables — free ports
 *   research    faceted white pods, glass strips, dishes, crystal masts
 *   agrarian    glazed vaults, domes, green under glass, sun-facing everything
 */
export const STYLES_ARCH = {
  cathedral: {
    label: "Cathedral", blurb: "the pilgrim orders build in naves and spires",
    forms: { vault: 4, lantern: 3, spindle: 2.5, prism: 1.5, stack: 1, block: 0.4, barrel: 0.8, cluster: 0.4, faceted: 0.3, keep: 0, wedge: 0.2, dome: 1.5 },
    decor: ["buttress", "spire", "arcade", "finial", "rose"],
    hangar: { throat: 4, blister: 2, bay: 1, recessed: 2, cradle: 0 },
    mouth: { pointed: 5, round: 2, rect: 0.3, hex: 0.2, oct: 0.3 },
    alloys: { bronze: 4, ti_beta: 2, al_sc: 1.5, ti64: 1 },
    hulls: { cathedral: 6, spindle: 1, torus: 0.6 },
    spine: "ribbed", greeble: "fine", lampColor: "#ffd9a0",
  },
  bastion: {
    label: "Bastion", blurb: "military spec: sloped plate, hard points, blast doors",
    forms: { keep: 4, faceted: 3, wedge: 2.5, block: 2, prism: 1.5, barrel: 0.8, stack: 1, vault: 0, lantern: 0, spindle: 0.3, cluster: 0.2, dome: 0.6 },
    decor: ["plates", "blister", "gunport", "sensorpod"],
    hangar: { blister: 4, recessed: 3, throat: 2, bay: 0.6, cradle: 0 },
    mouth: { rect: 3, oct: 3, hex: 2, round: 0.5, pointed: 0 },
    alloys: { hy_steel: 4, maraging: 2.5, ti64: 2, inconel: 0.5 },
    hulls: { bastion: 6, spindle: 1, cross: 0.8 },
    spine: "armoured", greeble: "plates", lampColor: "#bfe9ff",
  },
  civic: {
    label: "Civic", blurb: "stacked decks, terraces and a great many windows",
    forms: { stack: 3, block: 2, prism: 2, barrel: 1.5, dome: 1, vault: 0.8, lantern: 0.8, spindle: 1, cluster: 0.6, faceted: 0.5, keep: 0.2, wedge: 0.6 },
    decor: ["bands", "terrace", "antenna", "panels"],
    hangar: { bay: 2, blister: 3, recessed: 3, throat: 1.5, cradle: 0.2 },
    mouth: { rect: 2, round: 3, oct: 2, hex: 1, pointed: 0.3 },
    alloys: { al_li: 4, al_sc: 2, ti64: 1.5, al6061: 1 },
    hulls: { spindle: 3, drum: 2, cross: 2, torus: 1 },
    spine: "banded", greeble: "fine", lampColor: "#ffe3b0",
  },
  industrial: {
    label: "Industrial", blurb: "drums, stacks and pipe on an exposed frame",
    forms: { barrel: 4, block: 2, prism: 2, cluster: 2, stack: 1, cradle: 2, keep: 0.5, faceted: 0.4, wedge: 0.8, vault: 0.3, lantern: 0, spindle: 1, dome: 0.5 },
    decor: ["pipes", "stacks", "hazard", "vents", "frame"],
    hangar: { bay: 3, cradle: 3, blister: 2, recessed: 1, throat: 0.6 },
    mouth: { rect: 5, oct: 1, hex: 0.5, round: 0.5, pointed: 0 },
    alloys: { steel304: 4, al6061: 2, hy_steel: 1, inconel: 0.5 },
    hulls: { spindle: 3, lattice: 2, ziggurat: 2, cross: 1 },
    spine: "plain", greeble: "coarse", lampColor: "#fff0a0",
  },
  frontier: {
    label: "Frontier", blurb: "welded hulls of every size, patched and cabled",
    forms: { barrel: 3, cluster: 3, block: 2, faceted: 1.5, prism: 1.5, wedge: 1, cradle: 1.5, stack: 0.8, keep: 0.8, vault: 0.2, lantern: 0.1, spindle: 1, dome: 0.8 },
    decor: ["patches", "girders", "cables", "hazard", "gunport"],
    hangar: { bay: 3, blister: 2, cradle: 2, recessed: 1, throat: 1 },
    mouth: { rect: 3, hex: 2, oct: 2, round: 1, pointed: 0.1 },
    alloys: { steel304: 3, al6061: 3, mg_li: 0.5, hy_steel: 1 },
    hulls: { cluster: 3, ziggurat: 2, lattice: 1.5, spindle: 1 },
    spine: "welded", greeble: "coarse", lampColor: "#ff8a5a",
  },
  research: {
    label: "Research", blurb: "white facets, glass strips, crystal masts",
    forms: { faceted: 3, stack: 2, dome: 2, prism: 2, spindle: 1.5, lantern: 1, block: 1, barrel: 1, cluster: 1.5, vault: 0.3, keep: 0, wedge: 0.8, cradle: 0.3 },
    decor: ["glassstrip", "dish", "antenna", "panels"],
    hangar: { bay: 2, blister: 3, recessed: 2, throat: 1.5, cradle: 0.2 },
    mouth: { round: 3, oct: 3, hex: 2, rect: 1, pointed: 0.2 },
    alloys: { al_sc: 3, ti_beta: 2, al_li: 2, mg_li: 1 },
    hulls: { cluster: 4, spindle: 1.5, cross: 1 },
    spine: "banded", greeble: "fine", lampColor: "#a8dcff",
  },
  agrarian: {
    label: "Agrarian", blurb: "glazed vaults and domes, everything facing the light",
    forms: { dome: 3, vault: 3, barrel: 2, stack: 1, prism: 1.5, block: 1, spindle: 1, cluster: 1, lantern: 0.6, faceted: 0.3, keep: 0, wedge: 0.4 },
    decor: ["glazing", "bands", "pipes", "terrace"],
    hangar: { bay: 2, blister: 2, recessed: 2, throat: 1, cradle: 0.5 },
    mouth: { round: 4, rect: 2, oct: 1, hex: 0.5, pointed: 0.5 },
    alloys: { al_li: 3, al6061: 2, al_sc: 1, ti64: 0.5 },
    hulls: { torus: 5, spindle: 1, drum: 1 },
    spine: "banded", greeble: "fine", lampColor: "#c8ff9a",
  },
};
export const STYLE_KEYS = Object.keys(STYLES_ARCH);

/** Pick from a weight table with the rng. */
export function roll(rng, table, filter = null) {
  const pairs = Object.entries(table).filter(([k, w]) => w > 0 && (!filter || filter(k)));
  if (!pairs.length) return null;
  return rng.weighted(pairs);
}
