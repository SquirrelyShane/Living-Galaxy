# Upgrading Living Galaxy

How to add things, and where they go.

Everything here is a *seam that already exists* — a place the project was built to be extended
at. If what you want to do is not on this list, that is a signal worth taking seriously: it
probably means a new seam, and a new seam is worth designing rather than working around.

`node test/all.mjs` runs 58 suites in about a minute. Run it. `test/architecture.mjs` will
tell you if a change put an import the wrong way round.

---

## The shape of the project

Six layers. **Dependencies run downhill only.**

```
main.js        the boot sequence — may reach anything
   │
   ├── ui/         screens and panels. Reads everything, is read by nothing.
   ├── entities/   the things that act: the player, NPCs, hulls
   ├── systems/    the simulation — grouped into eight domains
   ├── world/      the scene: generation, geometry, rendering, LOD
   ├── data/       catalogues. Facts about worlds, ships, minerals, missions, powers.
   └── core/       state, config, maths, rng, clock, and the ports. Depends on nothing.
```

`npc-avatar/` sits beside the stack: a self-contained dialogue engine with its own tests.
Anything may use it; it uses nothing here.

`systems/` is grouped by domain, and `core/config/` mirrors the same names:

| domain | what lives there | its tuning |
|---|---|---|
| `flight/` | approach, warp, jump, navplan, targeting, ephemeris, lagrange, fields | `config/flight.js` |
| `combat/` | combat, damage, weapons, projectiles, ordnance, detection, wear | `config/combat.js` |
| `trade/` | economy, market, holds, contracts, deals, missions | `config/trade.js` |
| `company/` | boardroom, career, fleet, orders, reputation, managers, dossier | `config/company.js` |
| `crew/` | crew, welfare, crew-log, character | `config/crew.js` |
| `industry/` | crafting, mining, planetary, research, survey, salvage, fitting | `config/industry.js` |
| `npc/` | npc-brain, npc-comms, npc-tactics, assistant, comms | `config/npc.js` |
| `platform/` | save, net, audio, input, display, telemetry, tools, worldsim | `config/sim.js`, `config/render.js` |

**If you are adding a system, it goes in one of those eight.** If it genuinely belongs in none
of them, that is a ninth domain and worth naming as one.

### Ports: how the simulation talks upward

A system may not import from `ui/` or `entities/`. When it needs something from up there, it
goes through a port in `core/`:

```js
import { toast, status } from '../../core/notify.js';   // tell the pilot something
import { requestScreen } from '../../core/screens.js';  // ask for a panel
import { spawn } from '../../core/spawn.js';            // ask for a thing to exist
```

With nothing registered these are silent no-ops returning `null`, which is what makes a
headless run work — a server tick, or a test that only cares about the economy. **Handle the
null.** `spawn('npc', …)` returning nothing is a legitimate state, not a fault.

Registration happens once, explicitly, in `main.js`. Not as an import side effect: nothing
under `systems/` imports `entities/` any more, so a factory registered at module scope is
silently absent wherever that module was not loaded.

---

## Add a world class

**Where:** `src/data/worldgen/worlds.js`

A class declares the envelope of conditions in which it can *physically exist*. The classifier
only selects from classes whose envelope contains a body's actual computed insolation, mass,
temperature and volatile inventory — so a frozen world in an inferno orbit is not unlikely, it
is unrepresentable.

```js
{ id: 'ferrous_desert', label: 'Ferrous Desert', category: 'terrestrial',
  S: [1.2, 4],              // insolation band, solar constants
  mass: [0.3, 4],           // Earth masses
  Tsurf: [280, 460],        // equilibrium temperature, kelvin
  density: 5.2, albedo: 0.14,
  atmosphere: ['co2_thin', 'exosphere'],   // best fit first; retention decides
  volatiles: [0, 0.2],
  surfaces: ['arid', 'barren'],
  ores: ['siderophile', 'silicate'],
  color: 0xa8674a, weight: 1.0,
  blurb: 'Iron oxide from pole to pole and not enough air to move it.' }
```

Then **add it to `src/data/worldgen/render-map.js`** — every class must name a `PLANET_TYPES`
key to be drawn as. `test/worldgen.mjs` asserts the map is complete in both directions; a class
with no mapping fails the suite rather than silently drawing as the wrong thing.

The `S` bands share their boundaries with `surfaceState()` in `world/stellar.js`
(30 / 4 / 1.5 / 0.35 / 0.12). Do not invent new thresholds — the classifier and the surface
engine reading different numbers is the original bug this catalogue was built to end.

**Do not edit the catalogue files to add LG-specific opinions.** `worlds.js`, `atmospheres.js`,
`minerals.js` and `smallbodies.js` are byte-identical to the generator they came from so a
re-import is a copy rather than a merge. LG's opinions live in `render-map.js`.

---

## Add a mission type

**Where:** `src/data/missions/templates.js`

A template declares the kind of *place* it needs, as tags checked against
`world/landmarks.js`. A template no landmark satisfies is never offered.

```js
iceHarvest: {
  verb: 'acquire', weight: 18,
  needs: ['planet', 'frozen', 'airless'],   // every tag must be present
  skill: 'extraction', rep: 4,
  pay: [4200, 13000], kg: { lo: 400, hi: 1800 }, commodity: 'ore',
  title: (L) => `Ice quota — ${L.name}`,
  brief: (L, ctx) =>
    `${ctx.station} wants volatiles and ${L.name} is the nearest body still holding any.`
}
```

`verb` must be one of `deliver`, `acquire`, `destroy`, `scan`, `search`, `visit` — those are
the completion checks `systems/trade/contracts.js` knows how to judge. Adding a template with
an existing verb costs nothing. **Adding a new verb means three edits:** the `VERBS` list,
`baselineFor()` and the polling switch in `updateContracts()`, plus an entry in `TYPE_FOR_VERB`
so the contract's `type` follows what the work actually is.

`title` and `brief` are **functions of the resolved landmark**. That is what stops twenty
templates reading like twenty templates — the place carries the variety, and there are dozens
of places.

### Add a landmark kind

`world/landmarks.js`, in `landmarks()`. Return the uniform shape:

```js
{ id: 'moon:' + name, kind: 'moon', name, label, detail,
  orbit, tags: new Set([...]), at: (o) => { /* live position */ } }
```

Every existing template that filters on tags you supply will start targeting it immediately —
that is the point of the uniform shape. Tag what a place **is**, not what it is near: a debris
field inside a belt is `in-belt`, never `belt`, or the ore-quota templates will start posting
mining contracts against a graveyard.

---

## Add a battle kind

**Where:** `src/data/worldgen/battles.js`

Same rule as world classes: declare the circumstances under which it could have happened.

```js
mutiny: {
  name: 'Mutiny',
  needs: { nearStation: false, minAgeYears: 5, maxAgeYears: 200 },
  yields: { relic: 1.4, data: 1.8, salvage: 1.2, ordnance: 0.3 },
  scale: [0.4, 0.8], spread: [0.6, 1.1], hazard: 0.8,
  blurb: 'The hull is intact and the boats are gone.'
}
```

`test/missions.mjs` sweeps every plausible site and asserts at least one kind fits each. If
your `needs` are narrow enough to leave a hole, that suite finds it — a site no kind matches
means a system silently generates fewer debris fields than its seed asked for.

---

## Add a ship silhouette

**Where:** `src/entities/shipforge.js`, the `CATS` table.

```js
survey: { label: 'Survey', accent: '#7fe0c0', lg: 'industrial',
  pal: { hull: 0x6a8a86, trim: 0x223330, glow: 0x9fffe4, glass: 0xcffff2 },
  lb: 6, sides: 12, len: 28, jitter: 0.02,
  keys: [ /* radius keyframes down the hull */ ],
  engines: [2, 3], eng: 0.6, dens: 0.3,
  kit: ['dish', 'windows', 'fins'],
  roles: ['deep survey', 'probe tender'] }
```

`lb` is the **target length:beam** and radial scale is derived from it. Do not set radial size
independently — that was the original defect and it produced hulls 124:1, three metres across
and three hundred metres long.

Then decide who flies it, in `src/entities/shipmesh.js`: `PLAYER_POOL` for careers,
`HOSTILE_POOL` for what the world spawns. Keeping those two apart is why a player career is
never handed a slaver hull.

**Bound the variety.** `HULL_KIND` in `entities/npcs.js` gives each NPC type a small fixed
number of hulls, minted once and shared. A unique hull per ship means one GPU upload per ship
and no batching — the fault the hull cache was built to fix.

---

## Add an NPC topic

**Where:** `src/data/npc-kb/topics.js`

A topic returns a **semantic record**, never a sentence. `data/npc-kb/grammar.js` realises it.

```js
warnStorm: {
  channel: 'local', weight: 9, cooldown: 220,
  when: (a, b) => role(a, 'mine') && near(a, b),
  say: [
    ({ a, b, bucket }) => ({
      act: 'warn',
      register: registerOf(a),
      object: clause('the field is throwing dust'),   // ← tag what kind of thing it is
      where: place(null, { bucket }),
      vocative: b.name
    }),
    ({ a }) => ({ act: 'ack', register: registerOf(a), verb: 'hold' })
  ],
  filesFrom: { type: 'warned', weight: 0.8 }
}
```

**Tag every slot.** `npSlot`, `clause`, `imperative`, `complement`, `adverbial`, `proper`. An
untagged string defaults to a noun phrase, and a clause landing in a noun-phrase frame is how
the game came to say *"There is buy me something at the next berth."* Frames declare what they
take and the realiser filters on it, so a mistagged slot produces a wrong-but-grammatical
sentence rather than nonsense — but tag it correctly and it says what you meant.

- `npSlot` — "a fat seam", "2 contacts". Can stand alone after "There is".
- `clause` — "the independent has form". A sentence already.
- `complement` — "you a favour". Only makes sense after its verb.
- `imperative` — "say that closer".
- `adverbial` — a place or manner phrase. Never the object of a transitive verb.

`test/grammar.mjs` sweeps every topic across 24 seeds looking for doubled articles, stranded
punctuation, fragments and stative progressives. Add a topic and it is swept automatically.

### Add a frame

`FRAMES` in `data/npc-kb/grammar.js`. Declare `needs` (slots you cannot build without) **and
`takes`** (what kind of thing each slot may hold):

```js
{ id: 'inform-because', acts: ['inform'],
  needs: ['subject', 'verb', 'object'],
  takes: { object: [SLOT.CLAUSE], where: [SLOT.ADVERBIAL] },
  when: m => !STATIVE.has(String(m.verb)),      // optional extra refusal
  build: (m, g) => `${g.cap(m.subject)} ${conjugate(m.verb, m.agr)} — ${m.object}.` }
```

`test/architecture.mjs` asserts every noun-phrase frame declares itself as one.

---

## Add tuning

`core/config/<domain>.js`, matching the systems domain it tunes. `core/config.js` re-exports
all twelve, so `import { COMBAT } from '../../core/config.js'` keeps working — reach for the
domain file directly when you want one domain and know where it lives.

`test/reachability.mjs` will tell you if you add a key nothing reads. That is not pedantry: it
catches a config block wired to a feature that was never finished, which is otherwise invisible
forever.

---

## Add a screen

`ui/`, and register it in `main.js`. If a *system* needs to open it, register it as a screen:

```js
registerScreen('hangar', openHangar);        // in main.js
requestScreen('hangar');                     // from anywhere in systems/
```

Do not import the panel from a system. `test/architecture.mjs` fails on it.

---

## Things that will fail the suite

| You did | What fails | Why |
|---|---|---|
| imported `ui/` from `systems/` | `architecture` | the inversion that made every system need a DOM |
| added a `systems/*.js` at the top level | `architecture` | pick a domain |
| let a module past 1,600 lines | `architecture` | that is how `config.js` became 1,727 |
| added an import cycle | `architecture` | the budget has no slack on purpose |
| added a world class with no render mapping | `worldgen` | it would draw as the wrong thing |
| added a config key nothing reads | `reachability` | a feature that was never finished |
| added a template with an unknown verb | `missions` | it could never complete |
| made an NPC say something ungrammatical | `grammar` | 336 lines swept per run |
| gave two command-deck buttons the same label | `chart` | there were two called CHART for two patch levels |
| broke determinism | `genesis`, `missions`, `shipforge` | a save is a seed; two clients must agree |

---

## The one rule behind most of this

**Where two numbers have to agree, derive one from the other.**

- A world class's temperature gate is computed from its insolation band.
- An atmosphere's molar mass is computed from its composition.
- `AU_IN_UNITS` is forced by the habitable-zone formula `genesis.js` already used.
- A hull's radial scale is derived from its target length:beam.
- Existential number is read off the noun phrase, not a parallel counter.
- A contract's `type` follows the verb its template named.

Every one of those was two hand-typed values that drifted apart first. When you find yourself
writing a number that has to match another number, that is the moment to compute it instead.
