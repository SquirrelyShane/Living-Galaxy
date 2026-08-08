# Living Galaxy

**v1.01.40 "Shore"** · save schema 14 · 2,460 checks across twenty-nine suites ·
`CHANGELOG.md` for the history, `docs/SLICE_PLAN.md` for how it was built,
`PATCH_v1.01.40.md` for what changed.
`docs/CREW_ROADMAP.md` for where the crew work is going.
`docs/REACHABILITY_AUDIT.md` for what exists and cannot yet be reached.
`docs/NPC_ROADMAP.md` for where the NPC work is going.

Browser-based 3D space RPG. Vanilla JS ES modules, no build step, no npm. three.js r134
is the only external dependency and it loads as a classic script tag, so every module
just uses the `THREE` global.

---

This document grew by accretion across nine patches and was rewritten as one piece for
1.0. It runs from "how do I start it" through to "how do I change it", and you can stop
reading at any heading without missing something you needed earlier.

**Contents** — [Getting started](#getting-started) · [The pilot](#the-pilot) ·
[Flying](#flying) · [The ship](#the-ship) · [The system](#the-system) ·
[Making a living](#making-a-living-1) · [The interface](#the-interface) ·
[Other people](#other-people) · [Under the hood](#under-the-hood)

---


# Getting started

## Running it

ES modules need a real HTTP origin — `file://` will fail on CORS. From the project root:

```sh
python3 -m http.server 8080
```

Then open `http://localhost:8080/` in Brave. That's the same server you're already using
for the other projects; nothing else is needed.

### Going offline

The three.js tag points at cdnjs. To vendor it, download `three.min.js` once, drop it in
`vendor/`, and change the second-to-last line of `index.html`:

```html
<script src="vendor/three.min.js"></script>
```

`main.js` shows a readable message on screen if `THREE` is missing, instead of failing silently.

## Controls

**Touch** — drag anywhere to steer · pitch bar on the right · throttle bar bottom-left ·
FIRE / MINE / NAV / WARP grid bottom-right · tap a contact in the list to lock it ·
the dock prompt appears when you're slow and close to a station.

**Keyboard** — `W`/`S` throttle, `A`/`D` yaw, arrows pitch, `X` cut throttle, `Z` level,
`Space` fire, `M` mine, `J` warp, `N` nav map, `G` dock, `Tab` cycle target.


# The pilot

## Who you are

A flight starts with four questions, not a hull.

**Lineage** — where you were raised. Core-born from the inner habitats, Belt-born from the
Meridian field, Rim drifters from past where the patrols turn around, and Nexis defectors:
machine-descended minds that walked out of a drone shoal and have been distrusted by
everyone ever since. Lineage sets your starting skill ranks and your *affinities* — how
fast each skill climbs from doing the work — never a flat bonus. A Belter learns the belt
faster than a Core-born ever will, but the Core-born still gets there. No lineage is better
than another at everything, and the test suite enforces that.

**Corporation** — two per lineage. Who trained you and who still has your file. Standing,
starting credits, and one concrete perk: staff rates at the yard, an overbuilt hold, a
survey package, emissions discipline.

**Career** — Enforcer, Prospector, Hauler, Broker or Pathfinder. Decides the hull you
launch in and the one licence you already hold.

**Your agent** — not a choice, a consequence. The same Coalition bounty liaison greets a
Core-born kid and a Nexis defector very differently, and then hands you three jobs that
teach the game without a tutorial existing.

## Getting better at things

Two tracks, because they answer different questions.

**Skills rise from use.** Mine ore and Extraction climbs; land damage and Gunnery climbs;
close deals and Commerce climbs. This track is honest — it says what you have actually been
doing, and it cannot be gamed into a build you never flew.

**Points are earned per level and spent anywhere.** This is the track that lets you decide
something: a prospector who wants to learn to shoot has a route that does not involve being
shot at for six hours first.

They stack — a spent point sits on top of earned ranks. Ranks cost 42% more each time, so
early ones come quickly and rank 10 is a commitment. Sensors is worth knowing about
specially: it extends your detection range *and* cuts your own signature, because the skill
is about understanding emissions and that cuts both ways.

**Licences** are the hybrid gate. Your career grants one on day one; every other hull is
unlocked later by a skill rank plus a fee, and being over-qualified discounts the fee.
Owning a hull and being certified to fly it are separate things — you can salvage your way
into a gunship long before anyone will sign for you.

The Pilot tab at any station shows the sheet, your current assignment, every skill with its
progress to the next rank, and what it would cost to certify for a hull you cannot yet fly.


# Flying

## Flight assist

Assist is two pieces of hardware, not a rule. RCS quads null the part of your velocity
that is not going where the nose points; the main engine runs retrograde when you centre
the throttle. Both are capped as a multiple of the hull's own rated acceleration
(`FLIGHT.rcsAuthority`, `brakeAuthority`) and both fade as the energy bank empties, down
to a cold-gas floor.

The consequence worth knowing before you fly: **turning costs speed.** The sideways
component is removed, not rotated, so hauling the nose around bleeds momentum — and a
damaged hull, a full hold, or a flat battery all have less authority to correct with. The
**Drift** row on the flight-data panel is how much of your velocity is going somewhere
other than where you are pointing; it goes amber when the RCS has run out of authority and
you are, for the moment, a passenger.

Assist off is genuinely Newtonian. Nothing changes without thrust.

## Approach, match and interact

Everything in Solaris orbits — and orbital speeds are tuned to stay under sublight,
so nothing can outrun you anymore. Two buttons on the target panel handle the rest:

**APPROACH** flies you to the lock: stations get a hold point just off the approach
corridor, planets get the edge of their gravity well, asteroids get mining range.
The autopilot leads moving targets and brakes in the target's reference frame.

**MATCH** velocity-matches instantly — the ship rides along with whatever is locked,
holding its current offset while the target orbits. That is how you sit on a rock
and mine it, or hold formation off a station. Throttle or dragging the stick breaks it.

Station flow: approach → the controller hails you (each category has its own voice)
→ request clearance → the tractor beam takes the ship onto the pad → station
services open. Undocking pushes you clear of the structure.

Planet flow: approach → stable orbit outside the gravity well → SCAN reads minerals,
volatiles, biosigns and temperature → PROBE (consumable, resupply at any station's
service desk) lands for the full picture and returns survey data by the kilogram —
a commodity that sells best at economic hubs. All survey numbers derive from the
world seed, so every pilot reads the same planet.

The target panel's ▾ arrow expands a detail drawer: full spectrometry assay for
asteroids (iron/nickel/platinum/silicates and estimated value), survey results for
planets, hull and bounty for ships.

The belt is 520 rocks deep now, and not all of its shadows are empty: a share of
the pirates and drones lie in ambush behind rocks and on planetary night sides —
dark, off contacts, invisible to target cycling — until you wander close or put a
round into one.

## Gravity wells

Every massive body destabilises a warp signature lock within a radius that scales with
its mass and is capped against its own size. You cannot spool inside a well, and warp
drops out if you enter one. Arriving at a body means arriving at its well edge — the
approach autopilot closes the last stretch. The course planner builds a visibility graph over the
blocking wells and searches it with A*, so a target behind two or three bodies is a single
hop and the choice of which side to pass is made on total route length rather than on
whichever way the search happened to look first.

## A note on the cockpit camera

The camera sits exactly at the ship's origin, which means anything drawn at the ship's
own position lands on top of the near plane. The 3D exhaust particle cloud is off by
default for this reason (`VIEW.showThrusters` in `config.js`) — on mobile GPUs the
sprites expand instead of clipping and wash out the screen. Throttle feedback comes from
`#engine-glow`, a CSS wash on the canopy, which costs nothing and can't produce artifacts.
Turn the particles back on when you add an external camera.

## Chase camera

The ▣ button (or the boot-screen setting it remembers) swaps the cockpit for a
chase view with your hull visible and the engine plume finally on screen. Cockpit
view stays the default.


# The ship

## Career hulls

You start in a **civilian** hull and own only that one. The military, industrial,
logistics and economic hulls are career ships you must **buy at a shipyard** (any
station's Refit tab). Hulls you own swap for free; the ship-class buttons show a lock and
price for hulls you don't. NPCs follow the same rule — a ship is a ship someone paid for.
Owned hulls persist in your save.

## Weapon modules

Nine mounts across four kinds — energy (pulse, beam, scatter), projectile (autocannon,
gauss, railgun), missile (missile rack, torpedo) and utility (decoy buoy). Bought and
swapped at any shipyard; the mounted module drives your damage, rate of fire, projectile
speed and power draw.

### Damage types

Every weapon carries one of three types, and every hull is soft to one of them:

| | vs shield | vs armour | vs hull |
|---|---|---|---|
| **kinetic** — autocannon, gauss, railgun, torpedo | 0.72 | **1.30** | 1.00 |
| **thermal** — pulse, beam, missile | 1.00 | 0.70 | **1.25** |
| **EM** — scatter | **1.40** | 0.80 | 0.85 |

EM shreds shields and struggles against plating. Kinetic punches armour and gets shrugged
off by shields. Thermal burns structure and is soaked by plating. Nothing is best against
everything, which is the point — a loadout is a bet about what you expect to fight.

The multiplier is applied at each layer, so a round that overpenetrates is re-scaled on the
way into the next one. The target drawer tells you which layer a locked ship is running and
what it is soft to, so this is a choice you can make rather than arithmetic happening
off-screen.

### Range bands

Weapons have an `optimal` and a `falloff`. Full damage inside optimal, decaying to 25% past
it. Scatter is optimal to 240 units, railgun to 1250 — a shotgun is not a sniper rifle.
Falloff is judged when you pull the trigger, against the lock: a target that runs afterwards
does not weaken the slug already in the air.

### Missiles and decoys

A missile captures its lock at launch and steers at an intercept point, not at where the
target is now. It can also lose you: leave the seeker cone and the round flies on
ballistically, permanently. The decoy buoy drops behind the ship and can pull a seeker off
you — each missile is judged once, on first meeting a buoy.

### Point defence

The point-defence grid shoots incoming rounds down *in flight*, inside 260 units, and throws
sparks when it connects. It was previously a dice roll that deleted damage after the round
had already hit you.

## Fitting is a budget

Two independent ceilings, both of which you can exceed.

**Power** is MW, generated by the hull and drawn by every module. **CPU** is bandwidth —
how much the flight computer can actually run. They do not correlate, so a fit can be
power-comfortable and CPU-starved or the reverse, and "fit the most expensive thing in
every slot" stops being a strategy.

Going over does not refuse you. It degrades: power overload costs shield regen, recharge
and bank capacity; CPU overload costs sensor range, scan rate and weapon tracking. Both are
capped so an overloaded ship is always still flyable — a fit you cannot fly home would be a
soft-lock, not a tradeoff. A civilian shuttle with its slots filled by the hungriest modules
available runs about 20% over on both and has to choose; an industrial hull carries the same
loadout comfortably. Engineering rank raises both ceilings.

The Refit screen shows both as fractions, amber when tight and red when over.

## Advanced upgrades

The Refit tab (any station's shipyard) is now two tiers:

**Core refits** — the six incremental boosts (shield, armor, cargo, thrust, weapon,
mining), bought repeatedly.

**Advanced modules** — six capability unlocks, each gated behind a core refit at some
level, that change how the ship plays rather than just scaling a number:

- *Regenerative shield matrix* (needs Shield L2) — shields recharge 2.4× faster and
  start recovering sooner after a hit.
- *Reactor overclock* (Thrust L2) — bigger energy bank and faster recharge; sustains
  guns, warp and mining far longer.
- *Deep-field sensor array* (Mining L2) — +60% scanner range, so rocks, contacts and
  ambushes resolve much sooner.
- *Warp field tuner* (Thrust L3) — faster warp cruise and quicker spool.
- *Nanite repair bay* (Armor L2) — slowly rebuilds armor then hull while out of combat.
- *Point-defense grid* (Weapon L3) — auto-intercepts a share of incoming fire before it
  reaches your hull.

Locked modules show their prerequisite in the shipyard. Everything persists in your save.


# The system

## Celestial bodies

Twenty planetary classes in `src/data/planets.js` — lava, molten, barren, iron, carbon,
terrestrial, ocean, desert, tundra, ice, methane ice, liquid-methane sea, sulfur, toxic
greenhouse, irradiated, crystalline, super-Earth, and gas/helium/methane giants. Each
class fixes a radius range, surface colour, atmosphere (colour, opacity, thickness),
gravity, temperature range and satellite count; individual worlds are then seeded within
those ranges, so no two systems look alike. Twelve are placed in Solaris.

**Planets are solid.** The surface is fully opaque and depth-writing; only the thin
atmosphere shell above it is translucent, and that shell never writes depth. The old
see-through look was a depth-precision failure, not transparency — a 0.8 near plane
against a 260,000 far plane left distant stars and planet surfaces at indistinguishable
depth values. The renderer now uses a logarithmic depth buffer.

## Belts and minerals

Four fields, each with its own mineral profile: the hot **Cinder Belt** (common metal),
the balanced **Meridian Belt**, the sparse but rare-rich **Kharon Trojans** (platinum and
iridium, and the pirates that come with them), and the icy **Obscura Rime** (volatiles).
Every rock rolls a concrete composition, and what it's worth per kilo follows from that.

## The sky

A 360° procedural nebula skybox wraps the system — cold and warm cloud banks with
baked star specks — painted to a canvas at boot (no image files) and mapped inside a
130,000-unit sphere. It's tuned dark enough that distant planets and their beacons still
read against it, light enough to show detail. The point-cloud starfield sits on top for
crisp near stars. Both are seeded off the world seed, so every pilot on the same seed
sees the same sky, and both use a *separate* RNG so the sky never perturbs where planets
or NPCs generate.

## Station modules

Eight station classes, each with hardpoint slots and a set of pre-fitted modules.
Fourteen module types (`src/data/stations.js`) carry a power budget and a real bonus:
reactors and solar arrays generate; atmosphere plants and gravity rings make a station
habitable; deflector shields and radiation baffles stop weapons, debris and hard
radiation; cargo containers raise what the station will buy; landing pads berth drones,
NPC haulers and players; drone bays launch workers; exchange floors tighten spreads;
refineries pay an ore premium; shipyards sell hulls. Modules auto-attach to the next open
slot as construction completes. The dock's Station tab shows the full fit.

## Your crew

People aboard are two things at once, and the distinction is the whole system.

**Speciality** is what someone trained as — what they level, what their experience always
accrues toward. **Post** is where they are standing right now. Posting is free and
reversible: before a fight put everyone on the guns, in the belt put them on the rig.
Standing somewhere you were not trained for costs 55% of your output and most of your
learning rate, and those costs are the point — moving somebody used to cost half their
career, which meant nobody ever did it. Retraining, which changes what a person *is*, is
the expensive operation.

**Watches.** Crew can be stood down. Off watch they contribute nothing and recover fatigue
at nearly the docked rate, so rotating a watch is the answer to a long haul rather than
"stop playing and dock". Auto-rotate relieves the exhausted and puts a rested body in their
place, but it will never stand the last crewman at a manned post down — a short-handed ship
stays short-handed and says so.

**Morale** answers to pay, to how tired the crew is, to how many of them are covering jobs
they were not trained for, to shore leave, and to deaths.

**Casualties.** A hit that reaches structure can injure someone on watch — never someone
you deliberately sent to rest. Injury drags output down and heals slowly under way, fast
docked, and much faster with damage control manned. Death only takes a crewman who was
already badly hurt, so losing a veteran is the end of a bad run rather than one unlucky
frame. Station infirmaries will patch everyone up for a fee.

**They eat.** Provisions come out of the same material stock everything else does —
nutrient concentrate and water ice — and life support draws power per head. Hunger is a rate
rather than a switch: a ship that runs out does not stop, its crew simply gets worse at
everything over hours and says so on the roster. The Ledger shows how many hours of
provisions you have left.

**Resolve** is how hard someone is to talk into something, and it is used in both
directions from the same roll. It is the chance you fail to persuade them onto a post they
hate, and the chance an enemy influence net bounces off. A crew of pliable people does what
you ask *and* what a boarding party's negotiator asks — a Zealot cannot be moved by anyone,
and a Hollow can be moved by everyone.

**Promotion.** One crewman at level 5 or above can be made **overseer**. They stop manning a
station entirely — you give up your best person's department bonus — and in exchange
everyone else works better, learns faster and eats less, because somebody competent is
finally running the watch bill.

**Experience comes from events**, not from time. Kills, breaches, scans, trades, crossings
and delivered contracts each pay into the department that did the work, with a share to
everyone on watch. Sitting docked does almost nothing, which is the correct amount for
sitting docked.

Recruits turn over at every station every few minutes, and the pool is deterministic for a
given seed and moment — two pilots on the same relay see the same faces.

## Standing orders

The ◈ button. Everything you own used to be idle unless you were personally flying it;
these are teams you send out to work while you are somewhere else.

**Scout teams** sweep for contacts and leads. **Survey crews** set down and work a world
properly, permanently raising its assay so every extractor you ever build there pays out
better. **Reclamation units** cut up whatever is drifting and bring back bulk material.

Dispatched crew are off the roster until they return — not manning a post, not there for the
fight you did not know was coming. Orders can go wrong: people come back hurt, and
occasionally they do not come back. An errand that always pays would be a button rather than
a decision.

The ⚖ button is the **Ledger**: credits, payroll, site upkeep, provisions runway, life
support draw, contracts held and standing with all three blocs, plus a holdings tab for every
planetary site you own. Upkeep in particular had been invisible, which is a bad property for
a recurring cost.

## Building things

Every module, weapon, ammunition type and piece of personal kit has a **bill of materials**
behind it — 235 blueprints drawing on 76 materials, from iron ore through refined alloys to
circuitry and cultured biologicals. Buying at a shipyard still works and always will; this
is the other route, and it exists because a game with a mining laser, a hold and a market
ought to let you close the loop yourself.

Materials live in their own **stock**, separate from the cargo hold. Ore in the hold is a
commodity you sell by the tonne; refined titanium is a component you count in units and
spend on a specific thing.

Jobs take **hours**, not frames, and materials are consumed when you queue a job rather than
when it delivers — so three queued jobs cannot each spend the same titanium and then fail
twenty minutes later for reasons you can no longer see. Engineering rank speeds it up, to a
point.

## Planetary industry

The twenty planet types stopped being decoration. Each has a resource table where richness
multiplies extraction, and the resources are where physics puts them: helium-3 on gas giants
and airless regolith, uranium in old crust, biology only where water or a managed atmosphere
supports it.

Building a world goes in one order:

**Planet type → Command Centre → Branch → Facilities**

The **command centre** is typed to the ground. A crust anchor needs bedrock, a sea platform
needs a liquid column, a skyhook needs a deep atmosphere to float in. Above them all is the
**Planetary Industrial Complex** — ten slots — which is reached *through* a tier-2 site
rather than straight from an outpost, and which keeps the facilities you already installed.

**Branches** are the same five words as the career paths: military, industrial, logistic,
economic, civilian. A Prospector who lands on a world finds "Industrial" waiting rather than
a fresh vocabulary. Industrial drills, smelts and assembles; logistic stores and lifts;
economic prices and finances; civilian houses, farms and researches; military holds the
claim the others make worth taking.

Three constraints shape a site, deliberately different in kind. **Slots** are a hard cap.
**Power** is a budget you raise by spending slots, and running short browns the site out
rather than stopping it. **Workforce** from habitation multiplies output, with diminishing
returns, so the answer is never simply "all habitation blocks".

A PIC with an assembly line builds ship modules and weapons from the catalogue, which is the
point of the whole thing: it makes you independent of every shipyard in the system.

## The living world

The system runs itself whether or not you're watching. `systems/worldsim.js` and the
role logic in `entities/npcs.js` drive a 63-ship roster:

- **Pirates & Nexis drones (36)** — raiders and hunter drones; a share lie in ambush in
  belt and planet shadows, dark until you close or shoot one. Drones are shield boats that
  brawl in close (bring EM); raiders are plated and skirmish at mid range (bring kinetic).
- **Coalition patrols (12)** — organized into four wings of three, sweeping routes and
  hunting hostiles on their own.
- **Belt miners (6)** — work the asteroids for real, depleting ore over time.
- **Builders (5)** — Coalition and pirate crews ferry material to construction sites.
- **Mercenaries (3)** — hired to hunt marks. A capture contract *disables* the target
  and boards it rather than killing; a kill contract executes.

**Reputation.** Three blocs — Coalition, pirate, independent — each holding an opinion of
you from -100 to +100, moved by what you actually do. The blocs have opinions about *each
other* too, so helping one costs you with its enemies and there is no route to being
everyone's friend. Standing decides what stations sell you, what bounties pay, and who
shoots first: fall far enough with the Coalition and their patrols hunt you exactly the way
they hunt pirates. Killing an unarmed belt miner costs you with the independents even though
nobody was paying you for it.

**Being seen.** Whether a lurker notices you is a contest between its sensor and your
signature, and signature is yours to manage: mass, throttle, whether you have fired in the
last second and a half, whether you are in warp. A cold hull coasting with an empty hold is
roughly a third as visible as a laden hauler under full burn with its guns lit — so slipping
past a picket is a real option, not a dice roll. The Signature row on the flight-data panel
is the number to watch, and an ambusher commits at 55% of the range at which it can see you.

**Population.** The roster is an outcome, not a constant. Raiders grow where there is
undefended traffic to prey on and where a bastion is standing; patrols are dispatched in
response to raiders. Clear a wave and the Coalition presence thins out again. It settles
around sixty-odd ships, but it gets there by argument rather than by decree.

**Being locked.** Seeing you, holding a firing solution on you and being able to reach you
are three different ranges. A hostile has to hold you inside its lock envelope — a little
over half its sensor range — for the better part of two seconds before it has a solution,
and the solution breaks, along with the contact, once you are well outside it. Running away
works.

Reach is a fourth thing. Most hulls cannot shoot past what they can lock; seekers, drone
shoals and fleet elements reach roughly twice as far, because their rounds finish the job
themselves.

**How they fight.** Every hull has an engagement envelope — brawler, skirmish or standoff
— so a drone with a 430-unit gun and a bastion with an 1150-unit driver no longer want the
same distance. NPC damage falls off past their own hold band, so a standoff battery dragged
into a knife fight is fighting badly, not just fighting closer.

**Construction & territory.** Sites accumulate delivered material until they complete
into a real station. A pirate **bastion** (defensive station) *claims the space around
it* — fly in and you're in hostile territory. Industrial, economic and habitat builds
never claim; only the defensive station does. Kill a bastion and its claim collapses,
and the pirates schedule a rebuild.

**Getting boarded.** Mercenary disabling fire can't breach your hull — at 15% it leaves
you dark: drives cold, guns down. If a boarder reaches you, they take your cargo and a
cut of your credits, then release you. If the boarder dies first, your systems reboot.
It's a robbery mechanic, not a death — you keep the ship.

## Hazards

Solaris Prime is not scenery. Inside 1,100 km of its surface the corona cooks the hull —
shields first, then armor, then structure — and warp drops out on its mass shadow before
you get that close. You spawn at 3,400 km, clear of the corona and near the inner station
ring. `STAR` in `config.js` controls the radius, the danger band and the damage rate.


# Making a living

## Making a living

**The board.** Every station posts contracts — haul, supply, bounty, survey — that expire
whether or not you look at them. What you are offered, and what it pays, depends on what
the issuing bloc thinks of you: below −30 they will not deal with you at all, and above
zero the fee climbs with your standing.

Refusing is free. **Abandoning is not.** Accepting is a promise with a deadline, a slate
capped at three, and a standing hit plus 15% of the fee if you drop it or run out of time
— deliberately more than one completion pays, so reading before accepting is worth doing.
Without that, "accept everything and see what sticks" would be the only strategy and the
board would not be a decision.

**Prices mean something now.** Station modules consume and produce against stockpiles: a
refinery eats ore and makes salvage, a drone bay produces ore, a shipyard eats salvage. A
refinery that has run dry genuinely bids ore up; one choking on stock stops paying for it.
A high price somewhere is information about what is happening there, not a die roll.

## Market

Every station keeps its own price book. Prices random-walk, revert toward a structural
bias (a refinery wants ore), and move against volume — NPC background trade and your own
selling both leave a mark. Dumping 20 t of ore visibly moves that station's price.

## ARIA

The dockside assistant has **instruments** as well as opinions. Ask it to set a course and
it sets the course; ask where to sell ore and it names the station, the price, and whether
they are short of it. It can report threats and how visible you are, your contracts, your
standing, your own record, and the state of the link.

Nothing ARIA can do costs you anything. The instruments plot, name, target and read — none
of them sells cargo, buys a hull, accepts a contract or fires a weapon. A model small enough
to run on a phone will occasionally misread a request, and the worst outcome of that should
be a course you did not want, which is one tap to cancel.

All of it works **without** a model: there is a phrase matcher in front, so the instruments
answer instantly on a device that will never download one. The model makes the phrasing
flexible; it is not what makes the tools work.

### The model

The ◆ button opens ARIA. It answers from **live telemetry** immediately in a rule-based
mode — hull, cargo, threats, where to sell — with real numbers pulled from game state,
no download required.

Tap **Load local model** and it pulls SmolLM2-360M-Instruct (via transformers.js) and
runs it **in a Web Worker**. That's the whole point: inference never touches the render
thread, so token generation can't freeze the game the way a main-thread model does.
WebGPU is used when the device has it, quantized wasm otherwise. Every answer has a
9-second timeout that falls back to the rule-based reply, and if the model can't load
(offline, unsupported) the assistant simply stays in rule-based mode — the game never
depends on it.

First model load is a sizeable download over the network; after that the browser
caches the weights. On Termux/mobile without WebGPU, expect slow generation — the
rule-based mode is there precisely so the assistant is useful regardless.


# The interface

## Interface

Hull and weapon selection live in the shipyard (dock → Ships), not on a permanent bottom
bar — that space is camera now.

The HUD is a military-technical tactical readout: gunmetal-glass panels with hard clipped
corners and corner-bracket accents, phosphor-amber for data and cautions, cyan for live
systems, red for threats. Gauges are segmented; readouts are tabular monospace. It's a
pure CSS layer over the same markup, so nothing about the controls changed — only the look.

## System overview (nav map)

The NAV button opens the system chart. It now shows the asteroid belt as a shaded
annulus rather than 520 dots, draws your scanner-radius ring, and resolves **individual
rocks only inside that radius** — the rest of the belt stays an anonymous band until you
close in. Tap any body for its detail, then choose:

- **Warp here** — spool the drive and jump. Fast, costs energy. Warping to the belt aims
  at the nearest point on its mid-orbit.
- **Approach (slow)** — sublight autopilot. Crossing the system this way takes many
  minutes; it's for short hops or arriving quietly.
- **Select** — just lock it as a target.

## Settings and access

The ⚙ button opens four tabs.

**Access** carries the thing worth knowing about: hostile and friendly are the most
important distinction in the game, and in the standard palette they are red and blue —
exactly the pair that red-green colour blindness collapses. There are deutan-safe,
tritan-safe and high-contrast palettes, and an option to prefix every contact with a shape
so colour is never the only channel. Every palette is a redefinition of the same CSS
custom properties, so no code branches on which one is active.

**Display** has text scale (85–160%, applied to the root font size so the whole interface
scales, not just the panels) and reduced motion.

**Controls** rebinds any action. It listens for the next key you press rather than showing
a menu of key names, because a menu would have to enumerate every key on every layout and
would still be wrong for someone. A key can only mean one thing — binding it somewhere else
takes it from where it was. Gamepads work on the standard mapping with proportional sticks.

**Diagnostics** shows frame times, simulation steps, dropped catch-up, the HUD write
budget and any captured faults. `LG.report()` gives you all of it as one pasteable string.

## How it draws

**Quality adapts.** The renderer watches the 95th-percentile frame time — not the average,
because on a phone the average is nearly always fine and the p95 is what you feel as a
stutter — and sheds or adds work accordingly. It drops fast and climbs slowly, waits after
every change so it cannot chase its own tail, and starts from a guess based on the device
rather than spending two seconds at Ultra working out that this is a phone. The Render tab
says which level is active and why, and locking one manually turns the controller off.

**The world is drawn between simulation steps.** The simulation runs at a fixed 60 Hz; on a
120 Hz screen that used to mean half the frames showed a position one step stale, which
reads as judder that no frame counter will show you. Positions are now blended between the
last two steps — and the true position is put straight back before anything else reads it,
because the whole value of a fixed step is that the simulation is exact.

**Detail follows screen size, not distance.** A gas giant 20,000 km out is bigger on your
screen than a station 2,000 km out, and the one that is bigger on screen is the one whose
detail you can actually see. Bodies below about a sixth of a percent of screen height are
culled outright.

**Sound has a mix.** Four buses — effects, alerts, engines, music — through a limiter.
Alerts duck everything else rather than trying to be louder than it. Shots have distance
and doppler, and a shot out of earshot is not played at all. The music is a generated drone
that moves between calm, working, tense and combat without ever cutting.


# Other people

## Multiplayer

Run the relay next to the HTTP server:

```sh
python3 server.py                # ws://0.0.0.0:8765, seed 1337
python3 server.py --port=9000 --seed=42
```

Other pilots on your network join by putting `ws://<your-ip>:8765` in the boot screen. The
server owns the world seed, so every client generates the identical Solaris from it.

**Shared NPCs.** As of 0.10 the oldest connected pilot is the **host**: their client
simulates the world and broadcasts it, and everyone else receives it. If the host leaves,
the next-oldest takes over — and because every client already generates the same world from
the same seed, the handover is a change of who is authoritative rather than a
resynchronisation. Before this, every pilot fought their own private Nexis.

The relay still contains **no game logic**, and that is deliberate: its entire contribution
is knowing which client is allowed to send NPC updates. That is what keeps it a stdlib
Python file you can run in Termux with nothing installed, which is why anyone can host.

**Remote pilots are drawn 280 ms in the past**, blended between two snapshots that have
*both already arrived*, with clocks synchronised against the relay. The lag is invisible;
the benefit is that nothing ever snaps. Lose signal and your slot is held for 90 seconds,
so a phone that goes through a tunnel comes back as itself.

**What is not shared:** pilot-versus-pilot damage. Remote tracers are visual, and shots
resolve on the shooter's own client. Shared *hostile* NPCs are what 0.10 delivers;
authoritative PvP is a different design with different failure modes.

The Diagnostics panel has a Link section — host, round trip, clock offset, buffer depth
and traffic.


# Under the hood

## The loop

Mine the belt → haul ore to an industrial hub (they pay 1.4×) → sell → buy refits →
survive further out, where the bounties are worth more. Salvage from wrecks sells best at
economic and military stations. Coalition patrols fight pirates whether or not you're
watching, so the population shifts on its own.

Cargo has mass, and mass moves TWR. A full 18 t industrial hold genuinely handles worse.

## Layout

```
index.html              markup only — no inline CSS or JS
css/base.css            reset, canvas, cockpit shell, toast
css/hud.css             panels, bars, throttle, pitch, buttons, responsive rules
css/overlays.css        warp FX, nav map, station panel, boot screen

src/core/config.js      every tuning number in the game
src/core/state.js       the single mutable state object + derived ship stats
src/core/utils.js       math and formatting helpers
src/core/version.js     build identity + save schema number
src/core/rng.js         seeded PRNG and named deterministic streams
src/core/clock.js       fixed-step simulation clock + frame telemetry
src/core/diagnostics.js frame-phase error guards, fault log

src/world/scene.js      renderer / camera / scene singletons
src/world/starfield.js  background sky
src/world/system.js     star, planets, moons, stations + orbits
src/data/moons.js       moon classes — moons are typed worlds, not grey spheres
src/data/features.js    surface features, requirement-declared
src/systems/ephemeris.js analytic orbital prediction, intercept, transfer windows
src/systems/fields.js   belts and rings — the one place that knows the difference
src/systems/lagrange.js L4/L5 points and the deep-space sites that collect there
src/data/anomalies.js   one-shot deep-space sites and what they pay
src/systems/ordnance.js ammunition feeds, damage types, armour penetration
src/systems/magazine.js what is aboard, what is chambered, what a shot spends
src/systems/groups.js   which hardpoints answer which trigger
src/systems/npc-tactics.js NPC stances, magazines, heat, nerve, grudges
src/systems/npc-comms.js  NPC-to-NPC exchanges and the relationships they leave
src/systems/deals.js      the ledger — obligations, reliability, settlement, default
src/systems/fields.js   one authority for where a mining field is — belts and rings
src/world/asteroids.js  instanced belt with ore reserves

src/entities/player.js  flight model, energy budget, thruster FX
src/entities/npcs.js    spawning, faction AI, population upkeep

src/systems/projectiles.js  pooled bolts, swept collision, seekers, decoys
src/systems/broadphase.js   spatial hash that feeds the swept test its candidates
src/systems/damage.js       damage types, resistances, range falloff
src/systems/reputation.js   three blocs, coupling matrix, consequences
src/systems/detection.js    signature and the sensor contest
src/systems/character.js    skills, practice, levels, points, licences
src/systems/missions.js     the five agent chains
src/systems/contracts.js    the generated, expiring contract board
src/systems/input.js        named actions, key bindings, gamepad
src/systems/display.js      palettes, text scale, reduced motion
src/systems/crafting.js     material stock, bills of materials, the job queue
src/systems/planetary.js    sites, facilities, power, workforce, production
src/systems/orders.js       standing orders — scouts, survey crews, reclamation
src/ui/ops.js               the operations and ledger overlay
src/data/crafting/          76 materials and 235 blueprints, by category
src/data/planetary/         worlds, command centres, and the five branch folders
src/systems/quality.js      adaptive render quality off measured frame time
src/world/interpolate.js    drawing between fixed simulation steps
src/world/lod.js            screen-size level of detail and culling
src/systems/netsync.js      clock sync, snapshot buffer, delta encoding
src/systems/tools.js        ARIA's instruments — actions against live game state
src/ui/settings.js          settings and diagnostics overlay
src/data/origins.js         lineages, corporations, careers, agents
src/ui/creation.js          the four-step creation overlay
src/systems/combat.js       damage, explosions, wreck loot, death/respawn
src/systems/weapons.js      player guns
src/systems/mining.js       mining beam
src/systems/targeting.js    lock management + reticle
src/systems/warp.js         spool / cruise / drop-out state machine
src/systems/navplan.js      visibility-graph course planner (pure geometry)
src/systems/economy.js      docking, trade, repair, refits
src/systems/save.js         versioned saves, migrations, backup, export/import
src/systems/audio.js        WebAudio synth, no asset files

src/ui/hud.js           throttled readouts, contacts, target panel
src/ui/controls.js      pointer + keyboard input
src/ui/navmap.js        2D system chart, course plotting
src/ui/dock.js          station interface
src/ui/toast.js         transient messages (standalone to avoid import cycles)

src/main.js             boot sequence and the one ordered frame loop

docs/SLICE_PLAN.md      how the project is cut up, and what each patch does
PATCH_v0.2.md           the current patch note
CHANGELOG.md            every release, newest first
test/all.mjs            runs every suite
```

Frame order in `main.js` matters: warp can override flight, flight moves the ship,
everything else reacts to where it ended up.

## Tuning

Everything balanceable is in `src/core/config.js`: hull stats, weapon damage, NPC counts
and aggression, commodity prices, station price multipliers, upgrade costs and curves,
flight assist strength, warp speed and energy drain.

Warp is the travel mechanic, so its numbers are the ones most worth playing with. A full
system crossing should cost most of the energy bank but not strand you.

## Debugging

`window.LG` is the console handle. From the Brave console:

```js
LG.S.credits = 50000
LG.S.player.position.set(0, 0, 11000)   // drop yourself in the belt
LG.S.world.npcs.length

LG.version                 // '0.2.0'
LG.perf()                  // { fps, avg, p95, worst, steps, stalls }
LG.diagnostics()           // captured faults, parked phases
LG.unpark('combat')        // bring a parked frame phase back
LG.rng('npc').next()       // draw from a named world stream
```

Saves live under the key in `config.js` (`SAVE_KEY`). The boot screen has a wipe button.
`LG.reputation()` prints your standing with each bloc.

The world persists as of schema 4: reputation, construction sites and their progress,
territory claims, stations you financed into existence, and which rocks you have mined out.
The belt is stored as deltas against the seeded field, so a save records the handful of rocks
you actually worked rather than all 520 — and a claim is stored as a *place* that respawns
its bastion, so the claim and the ship enforcing it can never disagree about whether it
exists.
`LG.save.export()` returns the whole flight as text and `LG.save.import(text)` restores
it — that is how a flight moves between phones or browsers, because `localStorage` never
will. `LG.save.restore()` rolls back to the previous autosave.

### Frame phases

The loop runs each phase inside an error guard: `flight`, `world`, `combat`, `sim`,
`net`, `ui`, `save`. A phase that throws is skipped for that frame and logged rather
than taking the loop down with it; a phase that keeps throwing is parked and you are
told once. `LG.diagnostics()` names it. This is why a bad frame is now a missing HUD
update instead of a black canopy.

### The simulation clock

Simulation runs on a fixed 1/60 s step (`CLOCK` in `config.js`) and renders once per
frame, so flight, collision and warp integrate identically at 30, 60 or 120 fps.
Real time accumulates; catch-up is capped at `maxSteps` and the remainder is dropped,
which is what stops a backgrounded tab from simulating four seconds in one lurch.
`LG.perf().stalls` counts how often that happened. Setting `CLOCK.fixedStep = false`
restores the old variable-step behaviour if you need to compare.

## Verification

Headless Node harness under `test/` — a stubbed DOM and three.js, no browser needed:

```sh
node test/all.mjs          # every suite, in order — the gate a patch has to pass
node test/all.mjs --quiet  # one line per suite
npm test                   # same thing

node test/static.mjs   # import resolution, named exports, element ids, asset paths
node test/core.mjs     # 56 checks: version, rng streams, clock, fault guards, save schema
node test/flight.mjs   # 44 checks: flight model, assist authority, planner geometry
node test/combat.mjs   # 66 checks: damage types, broadphase, seekers, point defence
node test/world.mjs    # 81 checks: reputation, detection, population, persistence
node test/character.mjs # 101 checks: creation, progression, licences, agent chains
node test/economy.mjs  # 85 checks: contracts, fitting budgets, supply chains
node test/interface.mjs # 62 checks: hud budget, bindings, gamepad, display, fatigue
node test/render.mjs   # 76 checks: quality, interpolation, lod, audio mix
node test/netsync.mjs  # 49 checks: clock sync, snapshot buffer, delta encoding
node test/tools.mjs    # 55 checks: ARIA instruments and the model-free matcher
node test/crew.mjs     # 99 checks: posts, watches, morale, casualties, recruiting
node test/industry.mjs # 159 checks: blueprints, manufacturing, planetary sites
node test/soak.mjs     # 38 checks: two hours of game time, hunting leaks and drift
node test/run.mjs      # 205 simulation checks
node test/warp-nav.mjs # autopilot navigation, 5 approach geometries
node test/ui.mjs       # 109 UI checks, boots main.js as the browser would
node test/net.mjs      # real relay server + real WebSocket clients
```

1,531 checks across eighteen suites, plus a two-hour soak. There is no npm install — `package.json`
exists for the scripts, not for dependencies.

`run.mjs` covers flight and speed caps, weapon hits, the damage cascade, kills and
bounties, mining and cargo mass, docking and trade, the warp state machine, targeting,
save/load, and a 60-second endurance run. `ui.mjs` drives every panel and control through
simulated pointer events. `static.mjs` catches import typos and HUD ids absent from markup.
`core.mjs` proves the things nothing else can observe from the outside: that two seeds
give two galaxies and one seed gives one, that 30 fps and 60 fps simulate the same
amount of time, that a throwing phase does not stop the loop, and that a save written
by v0.1 still loads.

The world is seeded, so every suite is deterministic and reproducible. `net.mjs`
starts a real `server.py` subprocess and drives three genuine WebSocket clients
through the full join / state / fire / roster / leave flow.

**Autopilot, honestly.** As of 0.3 the planner is a visibility graph over gravity wells
searched with A*, not the old greedy recursion. `warp-nav.mjs` passes 5/5 with every trip
completing in a single hop, and the suite now includes a sweep that plans across 20 seeds,
every planet, five start positions — 1200/1200 courses geometrically clear, 421 of which
needed waypoints. That last number is the one that matters: it says the sweep is
exercising the planner rather than counting how often a straight line happens to work.

It is not infinite, and the limits are deliberate. `NAV.maxObstacles` caps how many bodies
one plan considers and `NAV.maxWaypoints` caps the legs it will return, so a pathological
geometry gets a good route rather than a perfect one. If no clean graph route exists at
all, the planner hands back the best single sidestep it can reach and the stall watchdog
re-plots from further along. After `WARP.stallLimit` attempts the course is abandoned out
loud — manual warp, point the nose and hold, always works and a re-plot costs nothing.
