# Living Galaxy — Ad Astrum

**Version 0.3**

A first-person solar system you fly from the pilot's seat. Public sky is Sol.
A private code grows a unique system — planets, moons, belts — you can edit and
host from Termux.

Vanilla ES modules. No build step, no npm dependencies, three.js vendored. Save
a file, refresh the browser, that is the whole loop.

This file is the single source of truth for what the game **is** and how to work
on it. What changed between releases lives in
[`CHANGELOG.md`](CHANGELOG.md).

---

## Contents

1. [Running it](#running-it)
2. [The module map](#the-module-map)
3. [Flying it](#flying-it) — the flight model, the cockpit, the console, power, turrets, the warp core, the chart
4. [The sky](#the-sky) — worlds, materials, rocks, ports, hulls, the working sky, impacts
5. [Nav, avoidance and the autopilot](#nav-avoidance-and-the-autopilot)
6. [People](#people) — names, races, careers, crew, company, contracts, drones, speech
7. [The generators](#the-generators) — shipgen, stationgen, robotgen, bodygen, npcspeechgen
8. [Audio](#audio)
9. [Menu art](#menu-art)
10. [The data model](#the-data-model)
11. [Tests](#tests)
12. [Notes for hacking on it](#notes-for-hacking-on-it)

---

## Running it

### Termux

```bash
pkg update
pkg install python
cd living-galaxy
python server.py
```

Open `http://127.0.0.1:8080/` in **Chrome or Firefox** on the phone (not the
Termux session). Rotate the phone — the cockpit rearranges for portrait and
landscape.

On another device on the same Wi-Fi, use your phone's IP instead of `127.0.0.1`
(`ifconfig` / `ip addr`). Desktop: `python3 server.py`, same URL.

`server.py` takes a port as its first argument (`python server.py 8124`) or from
`$PORT`; **8080** is the default. `LG_HOST=127.0.0.1` binds loopback only, for
a relay behind a tunnel or proxy; the default is every interface so the phone
can be joined over Wi-Fi. The browser smokes expect **8124**, which is
only a convention so a test run does not collide with the port you are playing
on.

### From the website

The other way to play is `https://living-galaxy.com/play/`, where the site
(a separate product line, `LivingGalaxy-Site`) serves this same folder
read-only and adds what a file server cannot: an **account**. Sign in at
CON › CORP › ACCOUNT (or on the site first — a signed-in browser that opens
`/play/` with nothing on the device loads your pilot before the start card
comes up) and everything `js/profile.js` files as the pilot's — callsign, corp,
fleet, refits, robots, missions, drones, ARIA's flying — syncs as one
versioned blob. Two devices that both changed get asked which copy wins;
nothing is ever overwritten silently. The site's news posts land on the GNN
desk. On a plain `server.py` none of this exists and the game says so in one
line; nothing else changes.

### What server.py is, besides a file server

It is also the relay for shared skies, and it is deliberately tiny and
in-memory:

| Route | What it carries |
| --- | --- |
| `POST /net/send` | ship state, hails, lines, beacons |
| `GET /net/poll` | everything since a sequence number, plus `born`, the room's shared clock zero |
| `GET /net/ping` | liveness |
| `GET`/`POST` `/net/world` | the host's sky snapshot — craters, lost ports, what the rocks did |
| `GET /cradle/all`, `POST /cradle/put` | the shared CRADLE ledger of people |
| `GET /gdb/all`, `POST /gdb/put` | the Galactic Database catalogue (0.3.54) — one light entry per person; the first filing wins the name; `gdb.json` |
| `POST /llm/proxy` | loopback pass-through to a llama.cpp on the same machine |

Every client runs sim time as `now - born`, so the ports, the traffic and the
markets line up for everybody by construction. What is *rolled* rather than
computed — rogue rocks, and what they did to worlds and ports — is not
line-uppable that way, so the longest-present live pilot in a room is its
**host**: they run the rocks and everyone else mirrors them (`js/worldsync.js`),
and `/net/world` is the snapshot a late joiner inherits so they arrive into the
same scarred system.

Joining jumps your clock by the room's whole age in one step (and a relay
restart can move it back). `shiftClock` carries the hull by where the world
it is beside actually is at the new time, velocity included (0.3.55) — a
straight line along the world's velocity, for a jump of hours, used to drop a
fresh spawn in the asteroid belt.

`cradle.json` beside `server.py` is the one thing written to disk. Delete it to
forget everyone — or leave it: it is capped (`CRADLE_MAX`, default 20,000) and
pruned on the flush thread, and what goes first is what is cheapest to lose. A
face in a crowd with no brain, no journal and a short history is somebody the
generator will happily make again; somebody who has held command is the reason
to keep a ledger at all. A `cradle.json` that will not parse is moved aside
under a timestamp rather than overwritten.

**One log per run.** `logs/` gets a file per server start, not per day:

```
logs/run-20260915-084500-1a2f.log     this run
logs/latest.log                          → holds the newest run's filename
```

so `ls logs/` is a session history and `tail -f logs/$(cat logs/latest.log)`
follows whatever is running. The four hex characters are the pid folded down, so
two servers started in the same second do not fight over one file. Every hit
gets a line — UTC to the millisecond, client, method, status, bytes, duration,
the target, and the Referer, which for an ES module import is the *importing*
module (`target=/js/npc/brain.js from=/js/npc/captain.js`). `/net/poll` and
`/net/ping` fire several times a second, so they roll into a one-line summary a
minute (`LOG_POLLS=1` for the raw lines). Old runs prune to the newest
`LOG_KEEP` (default 40; `0` keeps everything), because a file per run must not
quietly become ten thousand files.

**Employment never reaches the shared ledger.** `status: "aboard"` and
`employer: <callsign>` are facts about one client's run, and this file is the
thing that survives a restart — so `/cradle/put` strips them, and an existing
ledger is cleaned on load. An NPC captaining their own hull is filed as
`captain` with *themselves* as the employer and is kept, because that is a fact
about the sky.

A plain static server (`npx serve`, `http-server`, `python -m http.server`) runs
the game fine but answers those routes with 405/404: the client notices on the
first poll, logs one `[net] … no relay` line, stops posting ship state, and
looks again every 30 s — so a static host no longer floods the terminal.

**Before you expose the server past the LAN:** `/llm/proxy` still takes `_port`
and `_path` from the request body, and `logs/` and `cradle.json` are served as
static files with directory listing on. Lock the proxy to the llama port and a
known path list first.

---

## The module map

Everything you are likely to want to change, and where it lives. After a save,
refresh the browser — there is no build step.

### The sim

| File | What to change |
| --- | --- |
| `js/sim.js` | Spawn, survey, the warp core and its gating, collisions, crew/robot capacity, system toggles |
| `js/ship.js` | Thruster authority, reactor budget, load shedding, turret and mining modes, the trim sliders |
| `js/scale.js` | Radius and orbit curves, density, gravity constant, resource tiers, `remnantRadius` |
| `js/bodies.js` | Handmade Sol catalog, scaling and sphere-of-influence pass |
| `js/generate.js` | How private systems are grown |
| `js/archetypes.js` | The body database — palettes, surfaces, temperatures, ores |
| `js/materials.js` | Ores, minerals, tier-0 components, sector price tables; bulk per good and the hold curve (0.3.52) |
| `js/field.js` | Asteroid field density, rock size distribution, band names, taxonomic class per rock |
| `js/aria-pilot.js` | ARIA at the conn: plans your jobs (repair, sell, mine, survey, and — 0.3.06 — refit and build) off your own habits and hands them to the mission runner |
| `js/fabricate.js` | The fabrication solver and job queue: resolves a part down the whole recipe tree to raw ore, runs it on sim time at a port, delivers to the locker (leaf — no game imports) |
| `js/fabyard.js` | The deck's fabrication desk: the menu with margins, the bill before you commit, the one tap-through quantity button |
| `js/deckworks.js` | The whole DECK › WORKS tab — your fabrication desk, then the port's own defences, magazines and lines |
| `js/recorder.js` | The tape: every tap, order and mission step with the state it was taken in and what it earned, exportable as JSONL (leaf — no game imports) |
| `js/ui/fullscreen.js` | The canopy edge to edge: the fullscreen request, the portrait and wake locks, and the re-measure when the phone's bars move |
| `js/repair.js` | Yard repairs by the point and the hull-patch drone |
| `js/ui/dockboot.js` | The berth boot sequence over the canopy while the tractor finishes |
| `js/console/panels/work-tape.js` | CONSOLE › WORK › TAPE: what is on the tape, what you tend to do in a state like this one, and EXPORT |
| `js/rockgen.js` | Ore palettes and `oreLook()` (its hand-built hulls and crater canvases are no longer drawn) |
| `js/bodygen/bake.js`, `baked.js`, `grower.js`, `worker.js` | Generator bodies baked to atlases, their material, and growth off the main thread |
| `js/impactors.js` | Super asteroids: spawning, trajectories, strikes, rock-on-rock, fragment rogues |
| `js/impacts.js` | What happens after a rock connects: the rigid-body break-up run, its pieces as debris, the fragment hand-off |
| `js/holes.js` | Collapsed stars: transits and remnants, Kerr radii, gravity, what they eat, rarity, the wire |
| `js/debris.js` | Chunks, bursts, rubble rings, salvage (a chunk an impact run holds is `driven`) |
| `js/cataclysm.js` | What a world does when something big enough hits it, and what a star does when it stops being one — pure maths, headless-testable |
| `js/turrets.js` | Engagement rules, drones, ordnance, mining yield |
| `js/avoid.js` | The collision solver both the autopilot and the flight assist fly through |
| `js/autopilot.js` | The autopilot primitives, the belt clear, the watchdog |
| `js/contacts.js` | The contact register — what is on the chart and how it got there |
| `js/probes.js` | Probes and remote assay |

### The world around you

| File | What to change |
| --- | --- |
| `js/stations.js` | Port placement, mounts, docking, stock |
| `js/stationyard.js` | The glue to STATIONGEN: config, scale, port frame, doors, weapon mounts, works |
| `js/stationworks.js` | A port's fabrication lines |
| `js/stationdeck.js` | The docked deck — only what a port has: market, shipyard, desk, hall, works, drone and robot yards, refit, GNN, blueprint (the company books, fleet and logs are the console's, 0.3.45) |
| `js/deckhall.js` | The deck's HALL (0.3.49): your crew with TALK/SETTLE/PAY OFF inline, the hiring hall, the company's people on this floor with the LINE inline, and the registrar with a typed name — all in station style, never the console |
| `js/stationlife.js` | Settled staff: work, roles, life events, station births |
| `js/stationclock.js` | Port standard time (0.3.52): hours, days, weeks, shifts, day parts — the one clock everything asks |
| `js/stafflife.js` | A settled hand's working day (0.3.52): job, shift, hours, housing, needs, hour-by-hour plan, pay by hours worked, labour on the port's lines, the day log |
| `js/staffcare.js` | A settled hand's menu (0.3.53): WORK (job, shift, hours), HOME (housing), CARE (day off, a meal, a night out, a course) — drawn by the HALL and CORP › TOWN |
| `js/gdb.js` | The Galactic Database (0.3.54): every person the galaxy produces, catalogued once — unique names, look-alike checks per room, stable GDB numbers, census, search, the chronicle; relay-synced via `/gdb` |
| `js/staffline.js` | The company line: call a settled hand from anywhere, their calls and asks, regard, passage between ports |
| `js/economy.js` | Production lines, stock, the price curve |
| `js/blueprint.js` | Deterministic station deck plans, drawn blueprint-style |
| `js/npc/traffic.js` | The captains: roles, timetable, jobs, flags — and the flown state machine |
| `js/npc/flight.js` | How a hull actually flies: thrust, arrival braking, the lane drive, hull characteristics |
| `js/npc/combat.js` | NPC-vs-NPC combat: acquisition, hunts, gunnery, and the out-of-sight resolution |
| `js/npc/security.js` | The distress bus, the Security Directorate, and the response clock |
| `js/seclevel.js`, `js/secbadge.js` | The security ◆: green/yellow/red, heat, the player's SOS, the fine — and the diamond on the HUD and the deck |
| `js/npc/rogues.js` | Drone nests and the waves they send at ports, traffic and each other |
| `js/npc/flow.js` | Flow boats — the heartbeat |
| `js/npc/lanes.js` | Traffic corridors and lane-ways |
| `js/npc/battles.js` | Seeded ambush scheduling |
| `js/perf.js` | The frame budget: measures the frame, hands out a detail tier |
| `js/warpfx.js` | Warp streaks: the stretched star shell, the near tunnel, NPC drive wakes |
| `js/postfx.js` | Bloom and the black-hole lens pass — a compact composer, gated and latched by the frame budget |
| `js/rockfx.js` | Rubble on the rock you work, icy debris clouds on frosty rocks, shatter fields when a rock is cut out |
| `js/impactfx.js` | Draws an impact run: the fractured rock, blast sprites, ejecta rocks, flash and shock rings |
| `js/holefx.js` | Draws a hole: the Kerr lens (or its stand-in), rocks falling in, rogues torn apart by tides |
| `js/npc/brain.js` | The neural core an NPC captain flies with |
| `js/npc/captain.js` | Who holds the conn |
| `js/aria.js` | The house core that learns how *you* fly, and will fly for you |

### The cockpit

| File | What to change |
| --- | --- |
| `js/engine.js` | Cockpit camera, floating origin, meshes, lighting, rock buckets, LOD |
| `js/hud.js` | Dashboard, throttle slider, switchboard, map |
| `js/input.js` | Keyboard, gamepad, touch |
| `js/map.js` | The system chart: projection, pan/zoom, picking, warp lane, SHIPS directory |
| `js/console/` | The console: shell (`console.js`), jump index (`search.js`), DOM kit (`kit.js`), one panel per tab under `panels/` |
| `js/ui/chatbox.js` | The chatbox where the thumbstick used to be |
| `js/ui/charts.js` | Telemetry rings and sparklines |
| `js/comms/` | Call state machine, overlay, scripts, the director |
| `js/interior/` | The ship interior, the deck plan, boarding |
| `css/style.css` | Canopy, panel layout, portrait/landscape rules |
| `css/glass.css` | The B · Glass HUD skin, loaded after `style.css`, every rule `#hud`-scoped |
| `css/console.css` | The console sheet |

### People and paperwork

| File | What to change |
| --- | --- |
| `js/names.js`, `js/data/lexicons.js` | The name forge |
| `js/naming.js`, `js/vendor/stellar-names/` | Port names, and the wide human pools behind the forge's hand-picked ones |
| `js/insurance.js`, `js/ui/coverage.js` | Hull cover: tiers, premiums, claims, and who in the sky carries it |
| `js/defence.js` | Hull and shield pools off the frame, and what armour turns away |
| `server.py` | The local server, the relay, the ledger — and the console that watches all three |
| `js/races.js`, `js/careers/` | The fifteen races, the sixteen complexes and their ladders |
| `js/corps.js`, `js/data/factions.js` | The local outfits and the powers behind them |
| `js/genome/` | The 256-gene core, contextual expression, the decision-graph engine, and `spacer.js` — Living Galaxy's own entity types |
| `js/npc/cradle.js` | CRADLE: the record of every person |
| `js/crew.js`, `js/crew/` | The watch: roster, duties, talk, bonds, tiers, the deck graph, journals, romance, heritage, children, the brig, robots |
| `js/family.js` | Households, conception, heredity, pairing |
| `js/company.js`, `js/fleet.js`, `js/contracts.js` | The company, its hulls, the contract board |
| `js/npc/bounty.js` | The Marshal's board |
| `js/drones/` | Work drones: roles, behaviour, the shared work board, the corporations' drones |
| `js/gnn.js`, `js/chat.js` | The news desks and the chat bus |
| `js/npc/speech.js`, `js/speech/` | The open channel |
| `js/upgrades.js`, `js/refityard.js` | Refits and where they are fitted |
| `js/profile.js` | The run profile: what belongs to a pilot and what outlives them |
| `js/account.js`, `js/console/panels/corp-account.js` | The account: the pilot's storage namespace synced to living-galaxy.com, and the CON › CORP › ACCOUNT card |

### Experimental

`js/atmoworks.js` (terraforming that actually moves a world's temperature and
its climate band, saved with the sky), `js/icework.js` (the drill bench that
turns ice in the hold into water, breathing gas and clathrate volatiles),
`js/tutorial.js` (not a script — a set of checks against the live sky, so it
works in Sol and in a rolled sky alike) and `js/worldsync.js` are covered
together by `test/experimental.test.mjs`.

`js/tutorial.js` runs TRACKS, not one list. `intro` is the one that shows
itself on a fresh device. `js/tutorial-core.js` holds `core`, the MISSION CORE
walkthrough, which is started by the WORK editor the first time it refuses a
loop or a second step: it finds the nearest yard whose lines fit a core, pins
it, and walks the warp, the approach, the berth and the refit desk, lighting
the control each phase is talking about. A track that cuts in front of the
intro hands the card back where it found it. Covered by
`test/tutorial-core.test.mjs` and `test/smoke-coretutorial.mjs`.

### Vendored

`vendor/three.module.min.js` is the 3D engine — leave it unless you swap
Three.js versions. `index.html` and `shipyard.html` carry an import map so a
bare `import "three"` (which the ship generator does) resolves to that same
vendored build; in Node the tests get the same mapping from
`test/three-register.mjs`. The same map answers the one three/addons path the
asteroid generator's lens imports (`three/addons/postprocessing/Pass.js`) with
`js/asteroidgen/addons/Pass.js`, a two-class local copy.

---

## Flying it

### Flying on as the same pilot

From 0.3.42 the start card offers **Fly as <callsign>** whenever a pilot
record (`lgaa.pilot.v1`) and a save are on the device: race, rank, skills,
hulls, cover, purse, corp, fleet, refits and standing all come back, into the
sky you were last in, with no creation screen. **New pilot** is the creation
screen as before — a new run, which sweeps all of that — and asks first.

### Making a pilot

Type a callsign, hit **Create pilot**, and the sky starts loading behind the
screen while you fill out the record. The surface painter is the slow part of a
cold start, so the four steps of character creation are exactly the window it
needs — by the time you pick a sky the worlds are already painted. The loader
bar in the header tells you where it is up to.

**1 · Race.** Fifteen of them. Terran, T-Synth and Eridian are the named three;
the other twelve are the rest of the settled dark — Vantari, Korrash, Sef,
Ashwalker, Myrrin, Delvath, Oberlin, Haask, Veyd, Brann, Sirrah, Kethran. Each
one is a real set of multipliers on the hull you fly, not a portrait: attitude
authority, life-support draw, hull integrity, lock speed, impact shake, heat
tolerance, survey range, cargo volume, reactor output and the scrip in your
account when you undock. The card lists every one with the bad ones in red, so
a race is a trade you can read before you take it. Races also carry an affinity
— a head start in the skills that people raised that way tend to have — and
since p7 they bend the genome itself, so an Eridian navigator is *genetically* a
navigator rather than a Terran wearing a label.

**2 · Career.** Sixteen complexes: mining, healthcare, shipyard, component
manufacturing, logistics, energy, habitat construction, agriculture, research,
security, navigation, commerce, communications, terraforming, salvage and
education. Each is a seven-rung ladder from **A** to **G**, and picking one
shows you the whole climb before you commit — Surveyor to Extractor-General,
Triage Aide to Medical Director. A rung has duties written out, a book rate in
credits per cycle (half of it is your take, paid every cycle and cleared to
your account when you next dock), skill floors, time in grade, and the
certificate it awards you on the way up — the record of the climb, not a gate.
If you do not clear the rank-A bar at the door you are taken on as a
probationary aide on a reduced share until your first promotion.

**3 · Corporation.** Fifteen outfits grow with the system: five charter holders
holding one economic sector each, five alternates working the margins, and five
hostiles who stopped pretending. Signing on starts you in good standing with
one and its sector, and every port in the sky flies somebody's flag. Fly
**Independent** and nobody owes you a berth, but nobody owns your manifest
either. Roll a different system and you get fifteen different names, blurbs and
sector alignments.

**4 · Sky.** **Enter Sol** drops you into the shared, hand-built system.
**Roll a random system** grows one from a fresh seed: a star anywhere from a
blue B down to a red dwarf, six to a dozen worlds, moons, rings, one or two
belts, and sometimes a world that already had its catastrophe and is a rubble
field before you arrive. Roll again until you like the look of it. The name
field joins a named sky — type the same word as someone else and you get the
same system, which is how you fly together — and if you are on the same
`server.py`, you see each other and can talk (see **Comms**).

### Rank is earned by flying

Nothing about the career ladder is a menu you grind. Skills accrue from the
work you actually do, in fractions, while you do it — and a cycle in which you
did nothing teaches nothing (a port is a classroom at half pace while docked).
Whatever the next rung asks for that your day job does not cover, you study
toward between shifts; the **Studying** line on the Pilot tab names it. Feeds:

| Doing this | Feeds |
| --- | --- |
| Running the mining laser | Geology & Assay, Heavy Machinery |
| Mining in overdrive | Hazard Operations on top |
| Tractoring debris | Salvage |
| Any throttle at all | Piloting |
| Spooling or riding the warp core | Astrogation |
| Holding a signature lock | Data Operations |
| Turrets firing | Security Doctrine |
| Docked | Commerce (and Supply Chain on the clamps) |
| Buying and selling | Commerce, Supply Chain |
| Claiming a port | Law, Command |
| Dropping a beacon | Data Operations, Electronics |
| Surveying a world | Geology, Research |
| A kill | Security Doctrine, Command |
| Flying hot | Hazard Operations |
| Flying depressurised | Life Support |
| Flying through a brownout | Energy Systems |

Time in grade is real time in the seat — one cycle every ninety seconds of
flight. **CORP › PILOT** in the console is the record: name, standing title,
race, who you fly for and how they feel about you; your grade with its duties
and rate; and every unmet requirement for the next rung listed with the number
you have against the number you need, so a promotion is never a mystery. When
the bar is met the **PROMOTE** button goes live. Specialisations open at their
own rungs and are taken from the same tab; each one trims the hull — mining
yield, lock speed, warp spool, prices, standing, the salvage tractor — and the
trim is printed next to the name before you take it. **Lateral transfer** is
on the same tab: cycles carry over, the new ladder starts at A (B if the two
complexes share pipelines and you are senior), and a ladder you have already
climbed can be resumed where you left it.

Racial traits, the composed **Live modifiers** and corporate standing all have
their own sections there, so what your race and specialisation are doing to
the ship and what your flag is doing to prices are always readable rather than
folklore. Every race trait is live: attitude, life-support draw, hull, reactor,
hold, lock speed, impact shake, heat damage, survey range and starting scrip —
plus the Oberlin's line to the majors and the Sirrah's standing with hostiles.

### What flying feels like

**The lens is bolted to the hull.** There is no chase camera in normal play.
You look through the canopy from the flight seat, and where you look is where
the nose goes — panning *is* pointing. The hull swings to your line of sight
with real angular inertia, so small corrections are instant and hard flicks
have weight.

**Nothing slows you down that you did not pay for.** Thrust builds velocity and
velocity stays. Lateral, vertical and fine axial RCS let you translate without
turning; the retrograde BRAKE burns your vector off at 74 u/s²; flight ASSIST
trims sideways drift and station-keeps once you are nearly stopped. Turn it off
and every metre per second is yours to cancel.

**Speeds and holds are relative to the world you are at.** Planets sweep around
their star at tens of units a second. Your instruments, the brake and the assist
all work in the frame of whichever gravity well you are inside, so "stop" means
holding station over the planet — not freezing in a heliocentric frame the
planet is already leaving.

### Standing still

Everything out here is moving. The world beside you is sweeping around its star
at tens of units a second and curving as it goes, so holding a *velocity* is
not holding a *position* — that is why the ship used to drift when the readout
said zero.

Flight assist switches to station keeping once you are nearly stopped: it
captures the offset from whatever you are anchored to and flies that point.
Stopped means stopped relative to what is around you. Hold beside Earth and you
stay 1,644 u from it indefinitely while Earth itself covers 17.9 u/s.

### Scale

One world unit is 10 metres. The hull is 0.78 units — under 8 m on screen —
because everything out there should read as geology, not scenery.

| | radius | vs ship | surface g | escape | archetype |
| --- | --- | --- | --- | --- | --- |
| Luna | 1.6 km | 202× | 0.22 g | 41 u/s | Cratered moon |
| Mercury | 3.0 km | 382× | 0.54 g | 90 u/s | Scorched plain |
| Mars | 3.7 km | 475× | 0.68 g | 112 u/s | Rust desert |
| Earth | 5.5 km | 703× | 1.00 g | 166 u/s | Garden world |
| Saturn | 25 km | 3218× | 1.92 g | 491 u/s | Banded giant |
| Jupiter | 32 km | 4139× | 2.47 g | 632 u/s | Banded giant |
| Sol | 84 km | 10728× | 17.6 g | 2710 u/s | — |

Orbital periods are long enough that nothing visibly moves while you watch:
Earth takes about a day of play to go round, and roughly eighty minutes to
turn once on its axis.

Radii run through a power curve, so the gap between a moon and a gas giant is
not linear — it blows open. Everything else follows from size: mass, surface
gravity, escape velocity, sphere of influence, resource richness and rarity
tier. Big worlds pull harder, need more power to climb out of, and pay
exponentially better.

Orbits scale with them. Earth sits 612,000 units out, Pluto 7.1 million, and
the far side of the system is over fourteen million units from the near one. Under
continuous full burn a Sol–Pluto run is minutes of real thrust — which is also
minutes of reactor output you are not spending on anything else. The warp core
skips the boring part, but it will not do it just because you asked.

Gravity is patched-conic: you are always inside exactly one sphere of
influence — the deepest one containing you — and crossing a boundary
cross-fades to the parent. Orbits hold. Jupiter can capture you.

**Room between things** (0.3.60, `SPACING` in `js/bodies.js`). After scaling,
each planet's periapsis clears the apoapsis of the one inside it by 1.25 of
their two spheres summed (each capped at 12% of its orbit — this sky's giants
carry spheres a fifth to half their orbit wide, and spacing against those ran
away); neighbouring moons clear each other by three of their radii summed (the
old SOI clamp parked several on one orbit); and a belt keeps 1.2 spheres off
every planet's orbit, moving whole to the nearest clear lane (a dwarf is a
belt's own kind of body and only keeps its room about its mean orbit). A body
pushed outward keeps its orbital speed. In Sol that moves the main belt 37k
inward, off Jupiter's sphere (1,163k–1,418k), the Kuiper belt out past Neptune
(5,655k–6,799k, it used to run through Uranus and Neptune), and Pluto off
Neptune's orbit; the inner worlds do not move.

### The cockpit (portrait)

```
  top strip     VEL · CLS · ALT · G
                PWR · HULL · SHLD · O2 · CGO
                Earth 10.5 km · 0 contacts · SUR 0/11 · PRB 0/6 · 1×
  left thumb    POINT stick — pans the view, which points the nose
  above it      FWD  UP  MAP
                ◀   BRAKE  ▶
                AFT  DN  SCAN
  right dash    [1][2][3]  page tabs
                THRUST slider, 1% detents, red overdrive zone above 100%
                page 1 — FLIGHT   page 2 — OPS      page 3 — COMMS
                  SHLD  TURR        FLOOD  SENTRY     HAIL  LISTEN
                  ENG   CABIN       SALVG  MATCH      four spare
                  GRAV  ASST        PULSE  LEVEL      buttons
                  TURRETS           TIME              COMMS bus
                  MINER             THREAT            spare bus
                WARP ————————————— READY
```

The throttle and the warp core sit outside the pages — they are reachable
whichever one you are on.

**Page 2, the ops board:**

| Control | What it does |
| --- | --- |
| **FLOOD** | Hull floodlights. 8 kW, and the only way to see a night side up close |
| **SENTRY** | Watches for inbound rock. 5 kW |
| **SALVG** | Salvage tractor: reels debris inside 2200 u aboard as ore and alloy. 18 kW |
| **MATCH** | Continuous burn to match the locked world's own velocity, not the well's |
| **PULSE** | Active sensor sweep. 140 charge, holds long-range contacts for 30 s |
| **DOCK** | Dock or undock from the nearest port |
| **CLAIM** | Take a free port once its guns are down |
| **LEVEL** | Trims the nose back to the ecliptic |
| **TIME** | 1× / 8× / 40× |
| **THREAT** | The worst thing the sentry can see, and what it is aimed at |

**Page 3, comms:** **HAIL** calls whatever is locked, the port you are
clamped to, or the nearest port — and answers an incoming call. **LISTEN**
puts the open channels on the ticker. The **COMMS** bus reads the relay
state and who you are talking to.

Everything permanent lives in the top strip so the canopy stays clear. Messages
arrive as a card above the dash, hold for about seven seconds and then fade on
their own — tap one to lose it sooner.

The stick has a floating origin: wherever your thumb lands becomes centre, so
touching down never snaps the nose. There is a small deadzone, an expo curve
that softens the middle of the throw, and a low-pass that ramps a flick into a
sweep. All three are dialled from the console.

A phone browser with a URL bar and a nav bar leaves far less room than the
screen suggests, so the deck tightens at 760 px of viewport height and again at
640, where the gauge strip folds away.

### The glass HUD

Three candidate HUD layouts were built over one mock world and one engine, and
**B · Glass** is the one that shipped. `css/glass.css` loads after `style.css`
and every rule is `#hud`-scoped, so no control logic moved: brand and instrument
pills top-left, gauges card top-right, status/lock/notice/toast as one-line
glass strips under the pills, throttle and warp down the right edge, DOCK/HAIL
side keys (proxies to the retired dash-page buttons), the RCS cluster and a
vertical dock of tool chips bottom-right, and the **chatbox**
(`js/ui/chatbox.js` over `js/chat.js`) where the thumbstick was. The stick stays
in the DOM, hidden — dragging the sky already steers the nose. The dash's switch
pages are hidden; everything on them is in the console.

A typed line goes to the live call if one is up, otherwise to the nearest hull
or port in speech range, and is answered in character.

**The chip dock measures itself.** The tool column is bottom-anchored and grows
upward, and the RCS pad and the dash are stacked on top of it. That offset used
to be arithmetic over a hand-kept count of the chips, and it went stale twice —
once when the fullscreen chip landed, once when HOLD did — each time growing the
column past its own box so that ARIA was painted over AFT, DN and SCAN. The keys
laid out correctly, looked right, and could not be tapped. `js/hud.js` measures
the column now and publishes `--g-dock` in pixels, through a `ResizeObserver` so
a chip that merely unhides is caught too; the CSS arithmetic survives only as
the pre-JS fallback, and `test/hudlayout.test.mjs` fails if it drifts from the
markup. The comms puck is placed the same way, off the systems strip's measured
bottom — but only where it clears the dash, because on a short screen the dash
already rides up over the strip and moving the puck down there just lands it on
the throttle.

Later passes moved three more things: the throttle is a slim momentary track
that springs to zero on release with held presets (0/10/20/50/75/MAX) beside it,
**APPR** sits beside **WARP**, the chat box folds to its input with ↓ and the
unread badge counts the open tab, and a SHLD/ENG/TURR/ASST strip sits under the
gauges.

### The console

The dash carries what you touch while flying. Everything else lives behind
**CON** in the tool dock (or `B` / `Tab`): the numbers behind the gauges, and
every control that has no business being a thumb button. It replaced both the
old terminal and the CMD deck — one sheet, six panels, each with sub-tabs.
(Anywhere you see `CMD ›` or `TERM` in an older note, read `CONSOLE ›`.)

Opening it does not pause the sim — the sky keeps turning, the reactor keeps
working and your vector keeps running. Stick, throttle and RCS input stop
reaching the ship while it is up, so you can read without flying into
something. **HOLD** in the header is the one control that still reaches the
thrusters: it burns retrograde until you are stopped relative to whatever world
you are at.

| Panel | Sub-tabs | What is in it |
| --- | --- | --- |
| **SHIP** | STATUS · POWER · SYSTEMS · TRIM | Telemetry rings and sparklines, the well you are in, condition bars, motion, the maintenance backlog and who is on Engineering, alerts, the flight log; reactor, battery, the per-consumer load ledger and the reorderable **load-shed priority**; **postures** (Cruise / Combat / Mining / Docking / Dark set the whole board in one tap), ten master switches, the turret engagement rules, the mining modes and the flight row; the eleven trim sliders and the fitted refits |
| **NAV** | TARGETS · AUTOPILOT · MARKS · CONTACTS · SURVEY · ARIA | Locked body with full stats, lane status, WARP / SURVEY / APPROACH, every body nearest-first with LOCK and MARK; the mission autopilot's status, its ask banner and one-step orders with a thrust cap and a warp policy; waypoints with live range, bearing and elevation; everything on sensors with a per-contact relation toggle; the locked rock's class, composition and prospector's ticket; and what ARIA has learned about how you fly |
| **CREW** | ROSTER · TALK · BONDS · HOUSE · GENOME · LOG · SKY · BRIG | Who is aboard with all three relationship tracks, the conversations and staged acts, the ties between them and the children, the house rules, the body on file, the decision record, the crewed hulls out there, and the cell |
| **WORK** | MISSION · DRONES · FLEET | The mission editor and presets, your drones as cards with their orders, the company fleet |
| **MARKET** | PORT · HOLD · REFIT | Nearest port with DOCK / CLAIM and what it is short of; docked, the same PORT LEDGER / THEY SELL / THEY BUY / LOCKER & WORKS block the station deck shows; the hold with jettison and the ice bench; the refit rack at a yard |
| **CORP** | COMPANY · BOARD · PILOT · STANDING · GNN · MARSHAL · TOWN | Company treasury and book, contracts in hand and the port's offers, your record (rank, promotion, specialisations, transfer, skills, live modifiers), standing with every corporation, the GNN desks, the bounty board, and your settled staff ashore on the company line |

The **jump box** at the top searches all of it at once — every panel's rows
plus the leaves that never belonged to one (map, directory filters, deck plan,
hail, camera, time scale, pause, tutorial, mute, lane rigs, the port deck's
tabs when docked). Type, tap a hit or press Enter for the first one; the last
six things you jumped to sit in the RECENT row at the foot of the sheet. Chat
links from GNN bulletins and drone prompts open the console on the row they
are about. `window.__lg.console` exposes `openConsole(panel, sub,
{ focus })`, `jumpTo("work/drones#d3")`, `query(q)` and `registerJump(spec)`.

Two things only exist here. **Contact relations** are what make the turret rules
mean anything — CASTLE ignores them entirely and only answers what shoots you,
but every other rule reads the flag you set on this tab. And **load-shed
priority** decides what the bus cuts first when the battery bottoms out: put
shields above turrets for a fight, put the mining laser last if the cargo run
matters more than the guns.

The trim sliders are real handling changes, not preferences:

| Trim | Range | Trade |
| --- | --- | --- |
| Look sensitivity | 0.4 – 3.0 rad/s | Rate at full deflection. Default 1.15 |
| Look smoothing | 0.02 – 0.35 s | Ramps the stick in and out. Higher is heavier |
| Look expo | 0 – 1 | Softens the centre for fine aim. 0 is linear |
| RCS authority | 0.4 – 1.4× | Attitude and thruster gain. Twitchier and thirstier |
| Assist strength | 0 – 1.5× | Zero is pure momentum, nothing trims for you |
| Throttle limiter | 0.3 – 1.4× | Caps the slider. Set to 1.00 to lock overdrive out |
| Reactor output | 0.8 – 1.25× | Above 1.00 the core strains and slowly cooks the hull |
| Engagement range | 400 – 2200 u | Turrets hold fire beyond this |
| Turret cycle | 0.6 – 1.5× | Faster fire costs proportionally more power |
| Castle memory | 5 – 60 s | How long CASTLE keeps answering something that hit you |
| Mining reach | 500 – 1600 u | Overdrive adds 800 on top |
| O2 setpoint | 40 – 100% | Life support stops topping up here, and draws less |

Console panels build their DOM once per open or tab change and push refresher
closures (`ctx.push`), so live values tick at HUD rate without tearing the tree
out from under a slider you are mid-drag on. A panel is a module under
`js/console/panels/` exporting `{ id, title, order, subtabs, mount, paint,
unmount, search }`; `console.js` registers the six in fixed order and every
module under `js/console` imports in node with no `document`.

### Power is the whole game

The reactor makes 130 units/s. The battery holds 1600. Everything competes:

| System | Draw |
| --- | --- |
| Mains, idle | 7 |
| Thrust | throttle² × 96 (so 100% = 96, overdrive 140% = 188) |
| RCS | up to 22 |
| Shields | 28 (+16 while recharging) |
| Turrets | 15 armed, 34 firing |
| Mining laser | 24 closest / 58 overdrive |
| Warp core, spooling | 95 |
| Life support | 9 pressurised, 1.5 vented |
| Local gravity | 12 |

Full throttle with shields and turrets up runs a deficit. When the battery hits
zero the bus sheds load in order — mining, overdrive, shields, turrets, gravity,
life support — and each cut shows as an alarm. If there is nothing left to shed,
the mains get derated and you watch your thrust fall off. Long hauls are flown
dark.

The switches are trades, not decoration:

- **CABIN vented** — saves 7.5 units/s and the hull takes 12% less damage
  (nothing to blow out), at the cost of 16% RCS response: the crew is in
  hardsuits. Repressurising costs 140 charge.
- **GRAV off** — saves 12 units/s and gives 8% more attitude authority. On, the
  turret mounts have something to brace against and cycle faster.
- **ENGINE cold** — no thrust, almost no attitude authority, near-zero
  signature. You keep your vector.
- **O2** drains when the cabin is pressurised but life support is unpowered.
  Under 25 it costs you thrust and RCS.

### Turrets

Combat hardpoints cycle through seven engagement rules. **CASTLE is the
default**: cold until something puts energy into your shields or hull, then it
answers that contact and nothing else.

| Mode | Rule |
| --- | --- |
| OFF | Guns cold, no draw |
| CASTLE | Return fire only, 22-second retaliation window |
| PASSIVE | Track and report, never fire |
| NEUTRAL | Engage unaligned contacts |
| ENEMIES | Engage flagged hostiles |
| ALLIES | Engage allied contacts |
| FFA | Free fire, everything in range |

The industrial hardpoint is the mining laser: **OFF / CLOSEST / OVERDRIVE**.
Overdrive reaches 1900 units instead of 1100, cuts twice as fast, and draws
more than double. Rock yield scales with rock size on the same curve the worlds
use.

### Pointer lock

**P-LOCK** on the RCS cluster acquires whatever the reticle is nearest. The
signature builds while you hold it near the bore and decays when you look away;
a big close target resolves in a second, a small far one takes real patience.
The percentage reads out under the status line and as a box on the target.

Once it holds, **MATCH** flies the lock's own frame, so you hang motionless
beside a station or a moon while both of you sweep around the star. Look more
than sixty degrees off the bore and the lock breaks.

### The warp core

A warp is a commitment, not a button press. The core sits across the bottom of
the throttle panel and reads one of four things:

| Bar | Meaning |
| --- | --- |
| **READY** | Cyan. Lane is clear and you are in open space |
| **a reason** | Red. Why it will not engage right now |
| **SPOOL n%** | Charging. Six seconds, and the fill tracks it |
| **IN WARP** | Amber. Riding it in |

Two conditions have to hold, and they are checked every tick — not just when
you press it:

**You cannot warp inside a gravity well.** If the deepest sphere of influence
you are sitting in belongs to anything but the star, and it is actually pulling
on you, the bar reads `EARTH WELL` or `JUPITER WELL` and stays red. You must
burn out first. The star has its own exclusion of six solar radii. Since a warp
*arrives* at three planetary radii — inside the destination's well — every
arrival leaves you having to climb out before you can leave again.

What counts as "actually pulling on you" is the thing that took two patches to
get right, and it now has one invariant behind it:

> **If the readout rounds to 0.00 G, nothing is holding you.**

`WARP.wellG` (0.5 u/s², which is the HUD's G readout ×25) sets the edge;
`WARP.wellClear` is a **1.35-radii** geometric floor whose only job is to stop
you jumping out of the atmosphere, and `WARP.wellFar` caps even a gas giant at
8 radii. `WARP.wellFloorG` (0.005) is the hard invariant. The message carries
both numbers: `MERCURY WELL · 0.13g · 30 km OUT`. All of that is measured
against `remnantRadius(body)` — what is *left* of a world, not what it used to
be — so a world you broke up stops blocking warp like the planet it no longer
is.

**The lane has to be clear.** The core needs the straight line between here and
the arrival point, and it checks every body against a corridor 1.4 radii wide.
Park yourself on the far side of the star from Jupiter and the bar reads
`SOL IN LANE`. The chart draws this lane for the locked body — dashed green
when clear, dashed red with a ring around the offender when not.

Then it has to hold for six seconds while the core spools at 95 kW, which is
more than half the reactor. Fly into a well, lose the lane, cut the mains or
flatten the battery mid-spool and it aborts and cools. Tapping the bar again
stands it down cleanly. After a run the core needs eight seconds before it will
take another.

The practical effect is that warping somewhere is a small operation: shed load,
get clear of whatever you are orbiting, point at open sky, and hold it.

### The system chart

Tap **MAP** in the top bar or on the RCS cluster. The chart opens framed on
your own neighbourhood — the star and your ship both in view — because a real
system is mostly empty and the full plot crushes the inner worlds into one
smear. The ◎ button toggles between that and the whole system.

Drag to pan, pinch or use −/+ to zoom, tap a body to select it. Moons appear
once you have zoomed far enough in that their orbit is worth drawing; zoom to
Earth and Luna's ring resolves out of the dot. The belt shows as a shaded
annulus, probes as small squares, waypoints as diamonds, and your ship carries
a heading tick and a dashed velocity vector.

Selecting a body opens its sheet: radius in kilometres and in ship lengths,
mass, surface gravity, escape velocity, survey state, yield tier — and the live
lane status. Four actions sit under it:

| Action | What it does |
| --- | --- |
| **LOCK** | Makes it the warp and survey target |
| **WARP** | Hands the jump to nav: it climbs out of any well, comes about, plots, spools and gives the stick back on arrival — no nose-wrangling from a map |
| **MARK / FORGET** | Drops a GPS waypoint that tracks the body, or forgets a saved location |
| **CENTRE** | Zooms the chart to that world's sphere of influence |

**Tap anywhere.** Every tap on the chart opens a small menu on the spot — a
world, a port, a saved location, a transponder, or plain space (the menu names
the belt band: metal rim, stony commons, carbon rim, icy outer belt). A point in
space is a real warp node: **WARP** drops a jump point there and nav flies it;
**APPROACH** flies the whole leg and parks 500 u off it; **PROBE** throws a
drone at it that assays the cell on arrival (rock count, ores, veins, ice, hulls
nearby) and drops a saved location with the findings; **SCAN** is the same assay
instantly, within five sensor ranges; **SAVE** keeps the spot as a fix. Jump
points made by WARP vanish once you arrive; SAVE'd and probed fixes stay, and G
with one locked warps to it like any world.

Arrival is never inside a rock: the core walks you clear of anything it would
have dropped you into. Belt rocks only resolve within 120 km of the ship
(growing in over the last 30 km, so nothing pops). The old belt-wide haze is off
(`sim.showBeltHaze = true` before a sky loads restores it).

What is *on* the chart at all is the contact register's business — see
[Nav](#nav-avoidance-and-the-autopilot).

### EXT camera

Press **C** / the FPV button. Drag to orbit the hull, wheel or pinch to zoom
(1.4–40 u), two fingers to pan the look point, double-tap to reset. Dragging in
EXT never steers the nose — WASD, the stick and the arrows still do.

### Controls

| Control | What it does |
| --- | --- |
| Left stick / drag sky | Point the nose |
| Throttle slider · ↑ ↓ | Main engine, 1% steps, −40% to +140% |
| W A S D | Nose/camera up · left · down · right (arrows ← → also pan) |
| Shift | Boost — mains to the cap while held, back to the old setting on release |
| Shift+Ctrl | Cruise — hold the boosted setting until any thruster input (slider, ↑↓, X, brake, RCS); press again to drop it |
| X | Throttle to zero |
| ◀ ▶ UP DN FWD AFT · Q E R F | Lateral / vertical / fine axial RCS |
| BRAKE · Space | Retrograde burn |
| 1 2 3 4 5 6 | Shield · turret · engine · cabin · gravity · assist |
| T / Y | Cycle turret mode / mining mode |
| V | Survey the nearest body |
| G | Spool the warp core, or stand it down |
| B / Tab | Console |
| H | Hail · answer a call |
| M · C · Esc | Map · camera · pause |
| [ ] | Time scale |

Gamepad: left stick points, right stick is RCS, triggers are throttle.

---

## The sky

### What worlds are made of

Every body is an **archetype** — twenty-nine of them across rock, ocean, cloud,
gas, ice, moon and dwarf. The archetype fixes the palette, the surface painter,
the temperature band, the survey blurb and what you can dig out of it, and the
generator prefers archetypes that suit the orbit: cinder worlds close in,
snowballs and tholin dwarfs at the edge.

Surfaces are painted per-archetype rather than per-kind, so they read as
different places from orbit — lava cracks, dune fields, sulfur decks, cratered
maria with bright ejecta rims, fractured ice shells, methane lakes toward the
poles, and banded giants with belts, zones and a parked storm oval.

The paint is expensive, so the sky comes up flat-shaded and each world resolves
its real surface over the following frames. A full system builds in about two
seconds instead of twenty.

### Materials

Three layers, ninety-three entries.

**Ores** come out of rock and regolith — iron, bauxite, ilmenite, monazite,
platinum, uraninite, water and methane ice, tholins, helium-3, metallic
hydrogen. Each knows which body kinds carry it and what it refines into.

**Minerals** come out of a refinery: iron, titanium, cobalt, rare earths, and
the alloys above them — steel, stainless, superalloy, bronze — plus polymer,
glass, ceramic and fertiliser.

**Tier-0 components** are the first things worth calling parts, and every one
is buildable from the minerals and nothing else: steel plate, girder, hull
panel, bearing, motor, actuator, pump, turbine, heat exchanger, radiator,
wiring, capacitor, computer chip, sensor, flight controller, battery, fuel
cell, reactor rod, thruster bell, gyroscope, air scrubber, hydroponic rack,
ration pack, armour plate, shield coil.

**What a thing is worth is its inputs and the work** (0.3.47, `VALUE_RULE` in
`js/materials.js`). A refined mineral is its ore ÷ the refine yield × 1.3; a
made thing is the sum of its inputs × 1.18 — each stage of work adds the same
18%, so a part is worth more over its rock the deeper it sits, and a new
recipe prices itself. Ores are the unit and are not touched. Before, the table
was authored by hand and the graph showed it: a heat exchanger sold for 6.49×
the ore it ate and a battery for 5×, while a gyroscope — six stages deep, a
flight controller in it — sold for 1.25×. Now: shallow parts 1.5–1.7× (ration,
chip, battery, heat exchanger), the deepest 2.3–2.5× (gyroscope, actuator,
hydroponic rack, air scrubber). `test/balance.test.mjs` fails if a number in the table
drifts from the rule.

Every rock in the belt has a fixed composition set by its own hash, so a rock
is always the same rock. Mining pays out what is actually in it, surveys pay a
core sample of the world's archetype ores, and salvage pays whatever the wreck
was made of. **One mineral list** — the asteroid generator's own catalogue of
41 species was thrown away rather than carried alongside this one, because a
rock that assays "chalcopyrite" and then puts "copper ore" in the hold is two
games.

**The hold is a volume** (0.3.52). A hold is measured in **hold units (hu)**
and every good takes up room by its mass (`bulkOf`): hydrogen and helium-3
0.4 hu a unit, ices about 0.5, iron ore 0.93, platinum ore 1.73, uraninite
1.99 — ore never more than 2, finished goods up to 3.5. A hull's hold grows with
its cargo rating and has no ceiling (`holdForCargoRating`): the Fledgling about
1,200 hu (~670 platinum ore), the median hull ~21,700, the biggest ~461,000
(~266,000 platinum, ~495,000 iron). Cargo never changes how a hull flies.
`roomFor(ship, id)` is how many of one good still fit, and the desk sizes work
in units of the good it wants.

### Rocks that mean something

**A belt is mostly empty, and mostly rock** (`BELT` in `js/field.js`, 0.3.58).
22% of a belt's cells hold nothing; the rest hold one to eight rocks (2.7 a
cell on average, down from 6.3). Of the rocks, most are the belt's MATRIX —
silicates and regolith in the broad middle, iron-stone at the sunward rim,
carbon rock in the cold (78% of what you meet) — and only the rest carry what
their class is known for. A vein owns 3% of main-belt cells, not 7%, and 55%
of the rocks in one, not 80%. The cutter pulls 0.38 of the old gather rate's
base (was 0.5), and the odd rock that hides platinum is one in twenty at a
fortieth of the pull. Measured, the starter hull's MINE LOOP: 2,600–4,300 cr a
minute on 0.3.57, ~850–1,300 now — a living, and a vein is still the day you
remember.

Every rock in the game used to be the same object: `IcosahedronGeometry(1, 1)`,
flat-shaded, `0x8a8178`. A belt was four hundred copies of one grey pebble at
different sizes — and since the field's hash decides a rock's ore long before it
is drawn, none of that reached the canopy. You could fly through a platinum vein
and a carbon drift and not tell them apart.

Two layers fixed that, and both are still there because they answer different
questions.

**The field** (`js/engine.js`) is what makes a belt a belt on a phone, and since
0.3.02 every rock in it is the asteroid generator's. Each taxonomic class has two
**prototypes** grown at 32 cells a face and baked (see *Baked bodies* under *The
generators*), drawn as instances at three lattices by angular size — 768
triangles close, 192 at about eighty pixels, 48 at about twenty-five — eighteen
prototypes, a draw call per lattice. `LOOK` in `js/rockgen.js` still maps every
ore to a surface class and a tint that is a shift on grey; the instance leans
toward its rock's ore (harder on a rich one) with a lightness jitter off its seed,
so the rock you can see is the rock you are about to cut. A soft parallax dust
box follows the hull so a belt reads as speed rather than weather. Measured: 354
rocks for ~63,000 triangles.

**The handful you are near** get their own body (`js/asteroidgen/`, asked
through `js/bodygen/body.js`): one of seven body kinds (spheroid, ellipsoid,
elongate, contact binary, faceted fragment, rubble pile, spinning top), aged
craters and silhouette-biting basins, groove families, vein networks, bedrock
brightening on scarps, frost in the cold traps of an ice-bearing class, metal
standing proud of the matrix — grown in the worker at the device tier's detail,
baked, and mounted one a frame; whichever rock is locked or under the cutter
jumps the queue, and a rock flown past before its body grew is cancelled. Budget
from the device: `off` / `low` 4 / `full` 10 / `high` 18 bodies, off
`hardwareConcurrency`, `deviceMemory` and `prefers-reduced-motion`, overridable
with `localStorage["lgaa.rocks"]`.

**A rock sitting still wears nothing.** No crystals, rubble or ice clouds
(`js/rockfx.js` keeps them off on every tier; the seams are in the surface).
**When a rock is cut out it does not blink off** — the field's `brokenRocks`
queue tells the renderer, and the grown body goes up as a shatter field in its
own colours and ice budget, bursting out from where the rock was and let go over
its last nine seconds (48 s in all, three at most, off at the quality floor).

**The nine taxonomic classes sit on top of the radial bands, they do not replace
them.** Where you are in the belt decides which classes are plausible — the
sunward rim offers M, X and E; the cold outer fifth offers C, B, P and D — and
the rock's own hash picks one from that shortlist, with its ore coming out of
that class's suite. So the band design still reads the way it was designed to,
and two rocks a hundred metres apart can be a stony chondrite and an exposed
core fragment.

**The survey card** (CONSOLE › NAV › SURVEY) is the locked rock's class, what it
is made of, and a prospector's ticket. It runs the same ore-field maths over a
Fibonacci scatter of directions instead of over a mesh, so the card and the
canopy agree and the panel still works with the graphics gated off. Without the
**assay deck** refit you get the class and the headline — what a survey set
reads off a spectrum — and with it the whole suite.

The ticket is priced off **the cutter, not off mass**. The bulk-tonnage answer
is the honest physics one and useless: a 400 u body masses 3×10¹⁴ kg and assays
at four hundred *billion* credits, which tells a player nothing except that the
number is theatre. `turrets.js` already has a yield curve —
`(2.5 + (r/60)^1.5 · 5)` units a second, a rock cut out in about thirty-one
seconds — so the ticket is that total, split by what fraction of the face
assays as each ore, priced at the `value` the market pays.

### Ports

Stations come in five sectors — **logistic**, **military**, **industrial**,
**civilian** and **agricultural** — plus free ports, which are pirate holds.

Each sits one of three ways: in **free solar orbit**, **tethered** inside a
planet or moon's well and carried around by it, or bolted to a belt asteroid as
a **free port** with guns. Clear the guns and you can claim it.

Sectors decide the market. An industrial yard pays over the odds for raw ore
and sells plate and motors cheap; an agricultural ring exports calories and
wants phosphorus and pumps; a free port pays well and asks no questions.

**Every port is grown by the station generator** (`js/stationgen/`) from its
seed: a logistic port is a trade hub or a relay, a military one a star-fort
bastion in armour steel, a civilian one a habitat city, a research cluster or a
pilgrim sanctum in bronze with a nave a kilometre long, an industrial one a
works, a shipyard or a stepped foundry hulk, a free port a welded hold. Same
seed, same station, on every client. The hull is held still in the sky (rings
and drums spin inside it; a tethered port turns with its tether so the mouth
faces open sky) and every lane grows out of a real hangar mouth: one aperture,
two doors — the three entry ways come in by the port half, the three exit ways
leave by the starboard half — and they **funnel** out to the wide highway over
the first couple of kilometres. `js/stationyard.js` is the glue: config, scale
(1 u = 10 m), the port frame, the doors, the weapon mounts, the works.
`js/blueprint.js` grows the deck plan you walk around inside, deterministically
from the station id.

**Docking is by tractor, on request.** Ask for a berth — DOCK, or REQUEST DOCK
on the port's call — and from then on the entry lane's funnel or the hangar
mouth hands you to port control: a tractor lock (the beam is drawn) gathers
you square to the ENTRY door, walks the hull over the sill, down the bay and
onto the clamps on the arrivals side, and the deck opens. DOCK inside 250 u of
the mouth locks at once; from further out it files the berth and the lane
brings you in. A hull on the lane or in the mouth with no berth is left
alone — control rings the puck instead (request there, or clear the lane). DOCK
mid-pull and control lets go. Undocking hands the helm back to control for the
push out: across to the EXIT door, over the sill, up the exit lane's centre
way and past the funnel — outside the tractor's own reach — before it lets go
with way on. DOCK during the push is refused (the readout says DEPART), and
for the rest of that departure the port has you as *outbound*: it takes no
lock, does not hail you as a stray, and a DOCK tap from its exit lane only
files a berth — come round onto the entry lane and the tractor takes you at
the funnel. Lanes are 5 km approaches, drawn only inside 5 km of the lane
itself; a wrong-way call is never made while control has the helm.

Lane rigs are **off the canopy by default** (`sim.ui.lanesDrawn`, toggled from
the console's flight row), and lane discipline only bites while they are drawn.
DOCK from anywhere files a berth and engages the approach autopilot, which files
berths through `requestDock` — not `toggleDock`, which reads a flying approach
as a wave-off.

**Every port is a going concern** (`js/economy.js`). Each sector runs
production lines every twenty seconds — a foundry's smelter, alloy works,
rolling mill, motor shop, kiln and titanium cell; a grow ring's vats and
packing line; a habitat's draw on rations and water, which makes credits and
nothing else — and a line with an empty input *stalls*. Stock is moved by
everyone: the lines, the flow boats (an inbound copper boat that docks adds
its copper, an outbound plate boat that leaves takes its plate), the traffic
captains carrying real cargo between real ports (a trader loads whatever the
far end eats that is deepest on this floor; a miner brings home what it cut),
and you. Prices ride the stock against the port's target: bare shelves pay
and charge up to 1.3× book, a glut 0.8× (0.3.47), so selling a hold of ore into a
foundry drops the price behind you. Anything a port did not make and holds
far over target is re-exported a little each pass. The market tab opens with
the PORT LEDGER — lines running or stalled and on what, treasury, throughput,
shortages with what they pay — and every shelf carries a five-cell meter
against target, a trend arrow for the last pass, and SHORT or GLUT at the
extremes. Port control's "what are you buying" answers from the live
shortages, and the GNN markets desk carries a stalled port's want as a
bulletin with MARK BUYER.

**Boats are ships.** Flow boats fly a name (house prefix by sector, word,
pennant — `MV TAMARIN 14`, `AG SORREL 3`) and a hull class; the label reads
the name, and inside 1.5 km the class and manifest (`⇣ Copper ore ×32`).
Every hull on the board carries an anti-collision strobe drawn at a floor of
a few pixels, so a 30 m boat at 3 km is a blinking light, not nothing. The
board is fuller: ~57 captains (traders scale with the port count) and half
again as many flow boats per port.

**Ports make their own munitions.** Each port's fabrication lines (munitions
cells, drone lines, armour presses on its manifest) turn traded stock — steel,
titanium, wiring, chips, capacitors, controllers, thruster bells, batteries —
into slugs for its rails, missiles for its cells, interceptor drones for its
bays and armour plate for its market. A line short of a material stalls and
the Works tab on the deck says which one: fly it in and sell it and the
magazines fill. A trickle of NPC supply keeps the lines ticking over without you.

**Ports fight for you.** Every mount on a hull — point-defence clusters, railgun
and laser batteries, missile cells, the spinal mass driver and the siege laser
on a bastion — tracks the nearest **hostile of your current ship** inside its
range and answers it, spending magazines; its kills are its own, not your
bounty. Drone bays put interceptors out against anything hostile within 3 km
and recover them. A hostile free port turns the same guns on you until you
claim it.

### Hulls

Every hull in the sky — yours, the traffic, the peers on the same server — is
grown by the ship generator in `js/shipgen/` (19 hull doctrines, 11 drive
families, a 346-part catalogue with a bill of materials behind every part). The
fleet registry in `js/shipdb.js` is still the source of truth for what a hull
*is* — its silhouette grammar, its size, its dry mass, cargo, reactor, handling,
turrets and berths. `js/hullspec.js` is the bridge: it registers every registry
hull as a generator class (`lg:<id>`) carrying the def's own body, nose,
wings, engine count and weapon weight, picks a drive family for the complex and
tier, and fits a **buildable parts list** — the base doctrine for the hull's
kind of ship, re-fitted for the registry's reactor, crew and turrets, plus a
catalogue kit for every module the grammar names (a `drill` is a Regolith Drill
Boom, a `ring` is a Rotating Gravity Section, `radiators` are Deployable
Radiator Wings). The list is a property of the hull, not of the seed: every Ore
Sled carries the same manifest.

`js/shipforge.js` builds it. Same def + same seed is the same ship on every
client, so peers agree on what a hull looks like without shipping meshes.
Your own hull is built in **full** detail (lamps blink, sensors sweep,
turrets patrol, plumes follow the throttle); traffic and peers are built
**lite** — same silhouette and big fittings, no sub-metre clutter, and
everything that never moves baked into one draw per material, so a dozen
ships on screen cost a few dozen draws instead of thousands. Unit primitives
are swapped for coarser ones on the way in (a lamp bead does not need 500
triangles). The sky fills one hull per frame rather than all at once.

The yard prices what it fits. `js/shipcost.js` itemizes every catalogue part
from its bill of materials, with each raw stock the generator knows mapped
onto a mineral the refineries sell — a Claim Warden costs what its drill
booms, hopper, kilopower plant and pulse core cost in titanium, aluminium,
copper and uranium at book value, plus the frame and 18% yard labour, and
the same bill prints the raw stock you would need to bring instead. Since
0.3.59 each tier climbs faster than the one below (`TIER_SCALE`: A ×0.8 —
the only tier still under its parts bill — then B 1.6, C 2.6, D 4.5, E 6.5,
F 9, G 14): a B hull is half an hour of mining, a capital hull a career.

`shipyard.html` is the registry browser: every hull, its doctrine, drive,
manifest by catalogue section, flight figures and raw stock; toggle between
the full build and the traffic build to see what the sky pays for each.

### The working sky

**You start in the Fledgling.** One seat, one engine, one beacon: a trainer
skiff that answers the stick and forgives the mistakes you are about to
make. Hulls fly by their registry numbers — thrust, attitude, reactor and hold
all scale with the hull — so the trainer is quick and small and a colossus is a
slow, heavy thing with a power plant to match. Your complex signs its own line
over at the yard at the issue rate as your rank allows; the yard names it, and
the tutorial points you there.

**Everybody else is out there too.** Every sky carries a roster of 90 to 130
working hulls: traders and haulers running the ports, **supply runs** carrying
what the ports actually eat, miners cutting the belts, pickets on a slow sweep,
**security** answering calls, and **pirates** working out of the free ports.
They are labelled on the canopy, coloured by what they are — grey for working
hulls, blue for the law, red for raiders — the SHIPS directory on the chart
lists them nearest-first with what they are doing and who has the conn, and the
status line counts who is up.

**They fly.** A leg between two ports is a real crossing under real thrust, and
a hull is on the board and shootable for all of it. Long legs are flown in
three parts, the way you fly one: a sublight **run-out** clear of the port, the
**drive lit** across the middle — fast, but still tracked, because a contact
you can watch crossing the system is one you can warp ahead of and be waiting
for — and a sublight **run-in** that sheds the drive a long way short and comes
in slow and committed. The only thing that takes a hull off the board is being
inside a station ring. Hulls carry integrity, shields and guns off their
registry entry and their mass, so a laden hauler takes more killing than a
raider and will never outrun one.

**Raiders prowl.** A pirate picks something worth taking from most of the way
across the system, runs its own drive to get into the same volume, and closes
sublight. What it cannot do is catch a hull already under drive mid-crossing —
so raiders work the **approaches**, where traffic is slow and committed. The
dangerous places are the ends of a leg; the safe part of a run is the middle.
A supply run is the softest and richest thing in the sky, which is what makes
escorting one a job and taking one a plan.

**Somebody answers the radio.** Anything that gets shot at puts out a distress
call. The sky's **Security Directorate** — a chartered outfit that holds no
berths, flies every patrol and picket, and keeps quick-reaction wings ringed up
at the ports that pay for one — dispatches against it, and the canopy shows the
**response clock**: seconds until the first responder is on scene, or the plain
fact that nobody is coming. That number is the decision. Press the attack and
be gone before it lands, or do not start. Your standing with the directorate
decides whether the cavalry comes for *you*, and a call from the belt fringe
with every picket committed goes unanswered — which is what makes the patrolled
lanes worth something.

**The security ◆** (`js/seclevel.js`, `js/secbadge.js`, 0.3.48). A small
diamond in the HUD's brand pill — and in the station deck's header, because
docked the deck covers the HUD — says where you stand with the Directorate:

| ◆ | Means | SOS |
| --- | --- | --- |
| **GREEN · SAFE** | nothing against you; the Directorate covers you | open — a quick-reaction wing flies to *you* on the same honest clock the NPCs get (coverage 1, a wave of up to three, 150 s between calls; a wing that arrives to find nothing costs 1 standing) |
| **YELLOW · IN COMBAT** | hit by a contact, or your turrets fired, in the last 20 s | **open** when rogue drones or pirates are on you and you did not start it (0.3.56 — no P-LOCK attack, no first shot; turrets returning fire is self-defence); closed for a fight you picked, or one with anything else, until it has been quiet 20 s |
| **RED · WANTED** | heat ≥ 3 | never; the Directorate posts you (−15 standing) and its patrols read you as hostile and open fire |

**Heat** is what you have done: +1 an honest hull destroyed, +2 a Directorate
hull, +2 another pilot, +0.2 an honest hull you opened fire on that then called
for help. Pirates and rogue drones add nothing — they are the job. One point
cools every six minutes of sky time; it rides the pilot record
(`pilot.secHeat`), so a reload is not an amnesty; **PAY FINE** at any honest
port (1,200 cr a point, 800 minimum) clears it and buys back 8 standing. Tap
the diamond for the card: who polices the sky, why you are the colour you are,
SOS with its reason when closed, and the response clock once you have called.
In a shared sky only the host runs the Directorate, so a mirror's SOS says so.

**A fight that picked you** (0.3.56). The Directorate answers an SOS made
under attack as long as everything that hit you in the last 20 s is a rogue
drone, a hold's gun drone, a nest drone or a pirate, and you have not picked a
fight with anything still alive in the last 90 s — a P-LOCK on it while your
turrets fire, or firing on something that had not hit you inside 22 s. Your
turrets returning fire on an attacker is self-defence and changes nothing.
When the wing is on scene it checks whether what was on you is still at it:
if so the Directorate pays for the call — 120 cr a rogue drone, 160 a hold
gun drone, 200 a nest drone, 350 + 1.5 a point of hull for a pirate (900 at
most), capped at 2,500 cr and 5 standing a call — and its hulls put rounds on
the drones your turrets were fighting. A kill by the wing is the wing's: no
bounty and no heat for you.

**Fights are decided by the rounds.** Near you they are real ordnance that can
miss; out of sensor range the same fight resolves on the same numbers, so a
hull that loses out of sight is just as dead and the survivor carries its
damage into the next one. Fly out to a fight that started while you were
elsewhere and you find it in progress. Nobody knows the outcome in advance.

**What a hull can take.** Until 0.3.34 every hull in the game had exactly 100
hull and 100 shield — not a balance choice, but because `hullMaxOf()` read
`ship.hullMax ?? 100` and nothing ever set it. A 468,000 cr World Frame was as
fragile as a 4,400 cr skiff, and the NPCs had carried 150–280 hp per role all
along, so the player was the most fragile thing in the sky.

Pools come off the frame now: hull integrity follows mass, shield capacity
follows the reactor, on a cube-root curve — a G-frame is about nine times the
hull of an A, not the eight hundred that raw mass would give.

And damage has a **kind**. Kinetic is rounds and collisions, thermal is beams
and heat, EM is induction. A screen bleeds off energy well and stops *none* of
a round; plate is the reverse. That asymmetry is why a drone swarm goes
through a screen that shrugs off a laser, and why EM is the answer to a
heavily plated hull. Hardened plating, an ablative jacket, a Faraday mesh and
a screen lattice each answer one of those and not the others, so a refit is a
decision about what you expect to meet. Nothing exceeds 62% — there is no
immunity to anything.

**A hull can be lost, and a hull can be insured.** Until 0.3.33 nothing in
this sky could lose a hull and mean it — the player's ship clamped to twelve
points and coughed "hull breach contained", NPCs went dark and came back, and
only a contracted drone could actually die. Now hull at zero is a hull gone.

You are never stranded by it: the hull is struck off, the policy pays into
your purse, and you come to at the nearest port in whatever you still own —
the next hull on your books, or the trainer everyone starts in. A pilot who
never bought a hull loses the cargo and the trip back, not the game.

A policy covers one hull and one loss and is consumed by it. **Platinum** pays
100% of the hull, **Gold** 75, **Silver** 50, **Copper** 25, **Bronze** 10,
for premiums of 35 / 24 / 15 / 7 / 3 percent — flat enough that every tier is
a losing bet unless you expect to lose the hull about a third of the time, and
the dear end is very slightly the worse bet, because what you buy up there is
certainty.

Cover is written against what a hull costs **its owner**, never list. A
complex member buys in their own line at 45%, and cover at list would pay
1.00 for a hull bought at 0.45 — a fifth of the hull's price, profit, for
throwing your ship away, repeatable forever. Measured: 242 hull-and-tier
combinations would print money that way, the best of them +101,202 cr a loss.

Everyone else carries cover too. A drone's is bought with it and settles into
the company treasury. An NPC's is seeded off its id — liners and law run
platinum and gold, belt miners run bronze or nothing, pirates never — and what
it buys them is replacement speed, so you can read a lane's underwriting off
how well it keeps its traffic after a bad week.

**Rogue drones come from somewhere.** Two or three **nests** — derelicts with
something still running in them — sit out in the cold building drones, and send
**waves** at a target chosen before launch: a port, a hull working the lanes,
or a rival nest, because two machine intelligences building out of the same
belt are competitors. A wave on a port eats its magazines and drone racks
first, which is exactly what the port needs to fight it off. Ports defend
themselves whether or not you are watching.

**And they have weather.** A derelict yard building drones out of belt scrap
is not a tap. The sky runs a **tide** — a slow pressure made of three seeded
swells at periods that are not multiples of each other, so the pattern never
repeats on a schedule you could set a clock by. When the tide is out the nests
**hold**: nothing launches, and anything already out there breaks off and goes
home rather than loitering out its clock, so the belt is genuinely empty for
stretches long enough to work a claim in peace. When it comes in they build,
and the waves run large. The tide is deterministic in the sky seed and the
shared clock, which means two pilots in one room are in the same weather
without a byte crossing the wire — the same trick the belt and the timetables
already use. Over a real two-hour sky the belt now runs clear about a fifth of
the time and still peaks past fifty drones at the top of a surge; before, it
sat on fifteen, always.

**Lanes.** Every port runs two traffic corridors out of one side of its
ring on dock arms: a green **entry zone** and an amber **exit zone**, side
by side, 120 km long, each a translucent corridor ruled into **three
lane-ways** with marker beads down its edges and a gate at both ends. A
runner light chases along each corridor — outward on the exit, inward on
the entry — so from a long way out you can read which way each flows.
Every hull on the board is assigned a lane-way and keeps it: traffic burns
out along its way on the exit corridor before it warps and brakes in along
its way on the entry corridor to the clamps.

**Seeing them coming.** The canopy is the ship's smart HUD — the scanner and
the comms array drawn on the glass — so it shows what those actually have and
nothing else. Two beams run at once. The **broad sweep** covers everything in
range immediately and gives you a relation colour, a hull class and the kind
bracket; it is capped below identification, so no amount of sweeping produces
a name. The **narrow beam** works one contact at a time and is the only thing
that does: it points where you point, takes your locked target first, and
works the board itself when you are looking at nothing in particular. A hull
you have identified stays identified while it is in range.

Every contact carries a small colour-coded bracket saying *who is flying it*,
which is a different question from what it is to you: `[P]` a person at a
console, `[N]` a crewed hull, `[D]` a deployed drone, `[R]` an autonomous
machine with no crew and no parent. Relation colours the text — hostile red,
allied blue, neutral grey — and an unidentified return is drawn dimmer, because
the canopy should look like it knows less about it. A contact off-screen or
behind you gets an **edge** marker on the rim with a bearing to turn toward,
ranked and capped.

The **chart** shows what the dish can see and nothing else (0.3.50). A contact
is a hull inside scan range (12 km, × the phased-array refit), resolving from
a blob to a class to a name as you look at it. A hull with its lane drive lit
is not a contact — it leaves the chart the moment it lights and comes back
when it drops out near you. Your own fleet is the exception: yours to see,
anywhere, even under drive. (Until 0.3.50 a long-range band put every hull
under drive inside 1.4 million u on the chart as a blob, and the register kept
a live record per hull in the sky, five times a second, to draw them.)

**Everything that flies has a physical hull** — a generated ship or a generated
drone, never an abstract shape. A drone whose design is still growing, or one
too far out for a mesh, draws nothing at all rather than a placeholder.

**Lane discipline.** Inside a corridor the status line reads your lane and
way (`ENTRY LANE 2/3 · 42 km`). Fly a corridor against its flow — inbound
down the exit, outbound up the entry — and port control warns you after a
few seconds and docks a point of standing with the port's charter every ten
seconds you keep it up; dock off a clean entry-lane approach and the port
remembers that too. (This only applies while the lane rigs are drawn.)

**The heartbeat.** Beyond the named captains, every port runs a small **flow**:
a ring of light supply boats phased evenly through clamps → exit corridor
→ gone → entry corridor → clamps, sixteen at a freight hub, four at a
pirate hold, each with a manifest (inbound stores the port buys, outbound
goods it sells) that shows on the canopy inside 6 km. Something is always
arriving and something always leaving. Flow boats are not people: they are
not contacts, they cannot be shot, and they are drawn from a **hull pool**
— each (hull, variant) is forged once, lite, and every boat is an instance
that shares its geometry, with its own scale jitter and its own plumes.
About thirty templates carry a hundred boats; the GPU holds one copy of
each.

**How much of it is alive.** ~38 captains and ~100 flow boats are on the
timetable at all times. Hulls are built, drawn and labelled out to the sensor
range (`SENSOR_R` = 30,000 u = 300 km, ×1.8 while a survey pulse is out); past
1.3× that even the strobe goes. What is on the **chart**, though, is a separate
and much stingier question — see the contact register below. The belts read as a
haze band from anywhere in the system; the rocks themselves are diced out of the
field when you are inside one.

**Every hull you see going in or out of a port is a real one** (0.3.15). There
is no scenery traffic: the box shuttles that used to loop the hangar ways, the
parked box tug and the little sortie drones on the drone bays are gone. What
flies the bay instead is whoever is actually arriving or leaving — named
captains, flow boats, your work drones, the corporations' drones, other pilots
under their own tractor — along one path through the hangar (`js/npc/bay.js`):
in by the entry door onto the arrivals clamps, off the departures clamps and out
by the exit door, one line per lane-way so three arrivals do not stack. The path
ends on the lane's own door, so nothing pops at the aperture, and a heavy hull
coming off the cruise hot is walked down to a creep by the port's beam before it
reaches the door. A docked hull is inside the station, hidden; it is on the board
for every metre of the bay.

**Pirates** berth in the free ports and run sorties: clamps → exit corridor →
warp → lurk on the belt approaches → warp home. A PIRATE WATCH bulletin means
it: raids roll nine slots in ten instead of one in two, and the wings run a hull
bigger. A hull lost in an engagement — or one you put down yourself — leaves a
wreck the salvage tractor can take.

### Things fall

The system is not a diorama. Super asteroids arrive on their own trajectories
and fly the same gravity you do, which means passing a world bends them. A
shallow pass turns one onto a new heading and sends it somewhere else; a deep
one drops it into the surface.

They are an event, not the weather (0.3.60, `ROGUE` in `js/impactors.js`):
none in a sky's first five minutes, then one every seven minutes or so, two at
most. Most sail past you or past a world at 4.5–7 radii; one in about sixteen
is thrown to hit. Every rock is **flown before it is thrown** — the same
gravity it will fly, for eight minutes — and a pass that would come within 2.2
contact distances of any world is re-rolled, so a near miss stays a near miss.
A strike is steered onto its world, and never aimed at a **settled** one: the
world you start by, or any world with a port in its family's wells
(`rogueHooks.spare`, wired in `sim.js`). The frontier takes the hits; measured
with the ship parked by its home world, 3.7 world strikes an hour on 0.3.59
became none there, and 0.13–0.3 an hour on unsettled worlds.

When one connects, the world it hits does not walk away from it. Severity is
measured against the target — the rock that leaves a scar on a gas giant will
end a moon — and drives everything downstream:

- a **crater** appears where it landed, and stays there
- **mass is thrown off** as a debris burst that either rains back down, settles
  into a ring, or leaves the system
- the world **shrinks and darkens**, and past a certain point its **atmosphere
  is stripped**
- its **integrity** drops, and at zero it **breaks up**: the sphere becomes a
  core in a rubble field, its gravity falls to a third, and its survey stats
  are re-read from what is left

Its moons keep orbiting whatever remains. And what is left is what everything
downstream measures against: `remnantRadius(b)` in `js/scale.js` is one
definition of a shattered world — the 0.4 radii the canopy has always *drawn* it
at — used by the renderer, the impactor skin test, the sphere of influence, the
solver's well cutoff and the warp block alike. `refreshBody` cuts the mass index
and recomputes the SoI with it. On a 953 u world, measured:

| | intact | shattered |
|---|---|---|
| warp-block edge | 4964 u (5.2 radii) | 2937 u (3.1) |
| frame (SoI) | 3662 u | 2406 u |
| solver well | 26795 u | 6341 u |
| mass index | — | ×0.35 |

An intact world blocks exactly as it always did.

Anything that comes apart leaves debris, and debris is worth something — see
SALVG on the ops board. The sentry watches for inbound rock and puts the worst
one on the dash with a name, a range, and what it is going to hit.

**What a rogue rock looks like.** Rocks are catalogued the way the real
minor-planet registers do it — year, half-month letter, order letter, cycle
count — and most of them die as a designation. A big one gets talked about, and
a thing that gets talked about gets a name: *Blind Anvil*, *Grey Sister*,
*Ossuary*. Since those are the bodies you actually fly at, each live rogue grows
its **own** body off the same generator the belt uses (`js/bodygen/`): a
taxonomic class drawn on its own seed, real craters, a per-vertex mineral assay,
metal standing proud of the matrix, outcrops where a seam breaks the surface.

There are never more than two alive (`ROGUE.maxLive` in `js/impactors.js`). Each
rogue's body is requested from the grower the moment the rock exists, tens of
kilometres out, grown at the finest tier (H48 / 64 / 72 by device — the
generator's own survey detail on a full device) and baked; cached by id and
radius, so growth is paid once per rock per session. A rogue born from a
collision is a faceted fragment. A rock that strikes or
drifts past the despawn rim takes its body with it.

**What happens after a rock connects** (`js/impacts.js`, `js/impactfx.js`).
A strike used to throw a random burst. Now, if it lands within 320 km of the
ship, it runs the generator's Impact Lab physics at game scale: the rogue's own
body is grown and cut into sixteen solid Voronoi chunks; the break-up is planned
by specific energy against a size-dependent strength, nearest the contact first;
every piece leaves with the rock's velocity, its tumble and an ejection kick
that falls with mass; and a rigid-body run integrates it for 26 s — gravity set
so the world's surface pull in the run is the game's, sphere contacts with
restitution and friction, torque-free tumbling, secondary impacts that spray
dust, and young pieces shedding grains off their own spin. Crust thrown off the
crater rides the same run in the world's colours. The run lives in its own
frame (the world's centre, co-moving with its rail, in units of `L` world units
chosen so the rock's generated body sits at its own unit radius).

**The pieces are the salvage.** Every fragment and every crust piece is a chunk
in `js/debris.js` from the first tick — the tractor reels it, the cutter eats
it, a hole swallows it — but while the run holds it (`chunk.driven`) its
position is the run's. When the run ends the chunks are let go with the run's
velocities, and whatever came to rest on the world rained back down. The
crater, the ring, the heat and the integrity are still the cataclysm system's;
`damageBody` just skips its burst when a run is throwing the ejecta. A strike
too far away for anyone to see runs no physics and keeps the old burst.

The renderer draws the rock's fractured body with its detached chunks placed
from the run's track (glowing from the break, cooling, and re-forming into small
rounded asteroids a second or two after they leave), a dust sheet across the
contact normal, sparks, meshed ejecta rocks, the flash and two shock rings.

**Rock on rock.** Two rogues that overlap (`stepImpactors`, host only) both
break in a collision run. The biggest piece leaving the pair fast enough and at
least 90 u across becomes a rogue of its own when the run ends: a faceted
fragment carrying its parent's class, named "<parent> fragment", with a body
seed off its parent's (`…-R07`) — the generator's own send-rogue hand-off. A
mirror is told (`rockhit`) and runs the same break-up without spawning the heir;
the host's rock list carries that.

### Collapsed stars

The rarest cataclysm, and the only one that moves (`js/holes.js`,
`js/holefx.js`).

**Transit.** A neighbouring star collapses and its remnant is kicked through
this system on a straight line at 2,200–3,200 u/s. It is rolled once every ten
minutes of sky time, never in the first forty, never within three hours of the
last, at 5% — measured over 1,600 simulated hours, one every ~6 hours of play,
and an hour's session sees one about one time in ten. Four in ten are aimed to
pass inside a nearby world's Roche limit; the rest miss the ship by 110–240 km.
`summonHole()` (and `__lg.holes.summonHole` in the console) throws one now.

**Remnant.** A star that goes supernova collapses once the plateau breaks
(74 s): a hole where the star was, with the star's mass (it does not pull a
second time — the star is still in `BODIES`), the star's photosphere gone as a
collision surface and a heat source, and a bright fallback disk.

**Radii** are multiples of `rs`, a game-sized Schwarzschild radius
(1,500–2,300 u for a transit), off the Kerr maths the lens uses at a = 0.6:
horizon 0.9 rs (crossing it ends the hull), ISCO 1.9 rs (the burn radius), tidal
6 rs, danger 9 rs, disk 13 rs, warp shear 60 rs.

**What it does.** It pulls on everything that flies — a third of Sol's
parameter: 30 u/s² at 60 km, more than any engine inside 20 km. Warp geometry
will not hold inside 60 rs. Every quarter second it eats belt rocks inside its
tidal radius (a tunnel through the belt; `eatRocks` in `js/field.js`), shreds
any rogue that strays inside it, burns loose debris inside the ISCO (and makes
it glow inside the tidal radius), kills hulls under the ISCO and wears them
inside the tidal radius, loses ports inside 1.6 × ISCO and rakes guns and stock
inside 1.5 × tidal. A world inside its Roche distance — `R·∛(2μh/μw)`, ~25 km
round an Earth, ~33 km round a Jupiter — loses integrity every second through
`damageBody`, faster the deeper; its atmosphere goes first and what comes off is
thrown toward the hole. The ship feels the tides, then the disk's heat inside
the ISCO, then the horizon.

Accreted mass is kept by the radius it burned at, and the lens turns that into
disk rings — a hole that ate a rogue on its way through has a bright band there.
The dash warns at 420, 160 and 70 km; the news desk posts `COLLAPSAR INBOUND`,
`STELLAR COLLAPSE` and `ROCK ON ROCK`; the chart draws the shadow, the danger
ring at true scale and a transit's next minute; the canopy labels it from
anywhere; the avoidance solver treats it as a world with the danger radius for
a surface. In a shared sky the host rolls and eats; holes ride `wstate` and the
snapshot, and a mirror dead-reckons the straight line.

**The lens** is the generator's Kerr lens: every pixel's ray traced through a
spinning hole's spacetime with the DNGR equations *Interstellar* was rendered
with — shadow, photon ring, the thin disk lensed over and under, stars and
worlds behind it bent into arcs — as a pass in `js/postfx.js` over the scene
and its depth texture, so a hull in front stays a hull. 80 steps a pixel on a
touch device (traced at half resolution and merged over the full-resolution
scene by the lens's own mask), 170 on a desktop; a ray further out than a
pixel's worth of bending does no work. It is gated like bloom (on at frame-budget
tier 2, off below 1) and forced with `localStorage["lgaa.lens"]` = `on` / `off`.
Gated off, a shadow sphere and an unlensed disk stand in. Rocks the hole takes
near you spiral in, flatten into the disk plane, heat, stretch and burn at the
ISCO; a rogue it shreds is torn apart on screen by the generator's TidalBody
(its own grown body cut into chunks that peel off the tidal bulges, spaghettify
and burn) — visual only, the rogue is already gone from the sim.

---

## Nav, avoidance and the autopilot

### Flying like a pilot (0.3.51)

The ship moves where it points. Out of a well the autopilot climbs tilted
toward the lane; lining up for a jump (`flyTheLane`) it sheds any drift with the
nose ALONG the motion, pivots onto the lane under 80 u/s, and only then lights
the core; the jump itself flies the lane nose-first and turns to face the
target only in its last tenth. Before, the spool slid backwards at 600 u/s with
the nose 125–138° off the flight path, and every jump crabbed up to 24°.

### The contact register

`js/contacts.js` exists because `map.js` used to say so in its own comment:
*"every hull on the board, wherever it is — the chart always has the squawk"*.
224 hulls, named, at true position, forever. That is not a sensor picture, it is
omniscience, and it makes the scanner, the probes and the whole idea of a sensor
range ornamental.

So nothing is on the chart until you have earned it:

| level | what you get |
|---|---|
| 0 | not on the chart at all |
| 1 | a blob, inside a circle of how wrong it might be |
| 2 | hull class, heading, speed |
| 3 | name, corp, cargo |

Resolution rises while the scanner is on a bearing and **falls when it is not**,
so a lane you swept once does not stay lit all session. Identification range is
`SCAN.range` = 12,000 u (**120 km**), down from the old 300 km where everything
inside was identified the instant it entered. On the nose resolves fastest
(`SCAN.cone` is a 0.55 rad half-angle, with `SCAN.omni` 0.16 of the gain off
axis); close resolves faster than far; an active pulse resolves 2.6× faster; a
stale record is remembered for 240 s before it is dropped.

Four things skip all of it, because you do not need a dish for them: your own
hulls and your corp's structures, anything inside a landed probe's footprint
(9,000 u), the ports, and the worlds — which are on the chart because they are
charted.

Measured in play: **224 hulls in the sky, 0 on the chart** at spawn. Six seconds
with the nose on one takes it to level 3 by name. The tap-picker and the SHIPS
directory were the same leak in other clothes and read from the same register —
an unresolved return is listed as `unknown return · resolving 38%`.

### Avoidance

Neither the autopilot nor the flight assist ever looked at what was in front of
it. `js/avoid.js` is one solver with two customers: `apSteer()` is the single
funnel every autopilot mode flies through, so the avoidance lives there rather
than in each mode, and the flight assist gets it as a plain vector on
`ship.avoid` set by `sim.js` — the flight model does not learn what a station is.

**The hard part is knowing when not to act.** Mining is flying at a rock on
purpose; docking is flying at a station on purpose. A system that cannot tell
those from a collision takes away the two things the game is mostly about, so
`deliberate()` — the exemption list — is the load-bearing part, not the maths:
the docked port, the lock, the selected target, a filed berth, the tractor, an
approach, and the rock under the cutter.

Response ladder: **steer** → **steer and shed speed** (6 s) → **brake** (2.6 s).
The HUD says which of the three it is doing — `⚠ AVOIDING · Jupiter · 5.5s`,
`⚠ BRAKING · Jupiter · 0.0s`. A hull that turns on its own without saying why
reads as a bug.

Time-to-*closest-approach* is the wrong clock. A gas giant is 132 km across, so
by the time its centre is twenty seconds away the hull is long since inside it.
It solves time-to-**entry** into the exclusion sphere instead, which for a big
body is far earlier and for a rock is much the same. Warning distance therefore
scales with both speed and size:

| | 400 u/s | 1500 u/s | 3500 u/s |
|---|---|---|---|
| gas giant (r 132 km) | 264 km | 502 km | 952 km |
| terra (r 26 km) | 123 km | 366 km | 805 km |
| moon (r 7 km) | 98 km | 287 km | 287 km |

Four more rules came out of flying it inside a belt, where the first version was
worse than nothing:

- **Already inside is not "impact in 0.0 s".** The quadratic returns `tEnter = 0`
  forever once you are within the exclusion sphere, so a hull parked beside a
  moon, or cutting a rock next to one, sat at a permanent level-3 alarm.
  `approach()` reports `inside` and `outward`; leaving something is level 0.
- **Rocks are their own country.** One 22-second horizon at 2.4 radii gave a 26 u
  pebble an 86 u exclusion sphere, and inside a belt there is *always* one in the
  cone — so the solver never returned null, the hull braked, a stopped hull has
  no velocity, the solver returned null, the throttle opened, and it found the
  pebble again. Rocks get a 5.5 s horizon at 1.2 radii, and only a rock ≥130 u
  within 1.15 s may order a full brake. Gravel is steered around at speed;
  mountains stop you.
- **A dodge is committed.** The escape axis used to be re-derived five times a
  second and wandered with the geometry, so the hull crabbed around a hazard
  without ever getting past it. The same threat keeps the same way round for
  5.5 s, and the aim leads *past* the hazard's shoulder rather than sitting level
  with its middle.
- **A stopped hull is not blind.** Below 1 u/s `threatTo` used to return null
  outright, which is the worst possible moment to stop looking. It reports
  whatever the hull is overlapping.

Two matching rules live in `js/autopilot.js`: `apSteer` no longer zeroes the
stick while braking (a hull that braked stopped turning, stopped in front of the
same hazard, and braked at it again), and when avoiding, the throttle has a
floor — the old shaping gave 5% throttle whenever the nose was more than 72° off
the aim, and a dodge point is 90° off *by construction*, so "going around" meant
crawling sideways for minutes.

**The watchdog.** `apProgress` / `beginUnstick` / `apUnstick`: the leg measures
whether it is actually closing the range, and after 14 s of no closure — *and*
only when something is in the way or the hull has effectively stopped — it
commits to a break-out burn along the cheapest way out (straight up or down out
of the belt disc if it is in one), and puts a blind window on the hazard that
boxed it in so the solver stops re-raising the same alarm. It only arms where
closure is the point: not during climb, charge, align or the belt clear, all of
which stand still with respect to the target on purpose, and not on the
doorstep, where the braking curve is *meant* to crawl.

### The autopilot (mission-scripted, power-aware)

Only the player has an autopilot, and it takes orders the way a drone does. A
**mission** (`js/mission/script.js`) is a list of steps — GOTO · APPROACH ·
DOCK · UNDOCK · MINE · SELL · STASH · SMELT · BUY · CHARGE · WAIT · SURVEY ·
HOLD · SET — each with a target, an optional *until* condition (hold ≥ 90%,
charge ≥ 85%, time ≥ 60 s, credits, hull, docked, cargo of a good, loops;
`all` / `any` / `not` combine them), and per-step overrides of the thrust cap
and the warp policy; a loop row repeats the list ×N or until a condition
holds. `js/mission/run.js` walks the steps on the autopilot primitives
(`apLeg`, `apPark`, `apDock`, `apMine`, `apHold` in `js/autopilot.js`); the
executor lets go the moment you touch the stick and never flies while an NPC
holds the conn. The run is saved per sky and callsign on every step change and
comes back **paused** after a reload — nothing flies by itself.

**Where the orders come from.** AUX 6 / the approach bar and the chart's WARP /
APPROACH build one-step missions on the locked target; MINE HERE and the chart's
MINE LOOP build the MINE LOOP preset (seam → cut until the hold is full → best
port → sell / stash / smelt → charge → round again); PLAN… under the chart sheet
and CONSOLE › WORK › MISSION open the editor: presets (MINE LOOP, TRADE RUN,
SURVEY SWEEP, PATROL), your saved list (per pilot), step rows with a target
picker, an until builder and a loop row, RUN. CONSOLE › NAV › AUTOPILOT shows
the live status line, the current step, STOP / PAUSE / RESUME and the default
thrust-cap and warp chips the one-step buttons use. Loops and multi-step missions
need the **Mission core** refit (logistic or military yard); HUD one-steps and
the chart's loop always work.

**TRADE RUN flies a route** (0.3.19, `js/traderoutes.js`, `js/mission/tradeops.js`).
At the top of each round it picks the best buy-here-sell-there run from where
the hull is — every honest port's shelf against every other port's till, at the
exact prices the desks transact at, sized to the hold, the purse, the shelf and
the buyer's credits, legs with a world across the line left out, ranked by
credits a minute with the flight to the source included — docks at the source
(no undock if it is already there), buys the route's cargo, docks at the buyer
the cargo was bought for, sells that and nothing else (a haul contract's
consignment is never sold, not even by SELL "all"), charges, and goes round five
times. The route is saved with the run. CONSOLE › MARKET › ROUTES lists the best
eight from where you are with **FLY IT** (a one-off run of exactly that route)
and MARK; every market desk shows ROUTES FROM HERE. The port preference ARIA
learns now pulls a favourite in on a negative score instead of pushing it away.

**Thrust cap.** A step's cap (25 / 50 / 75 / 100% / OD) is a ceiling under the
power rule, never a floor: above 60% charge the mains may dip into the battery
for momentum (rated thrust at most); between 20% and 60% they hold the
*sustainable* setting — what the reactor can carry after everything else on
the bus; at the 20% floor the mains go cold and the hull coasts until the
reactor catches up. A pending jump adds a reserve (minimum charge + the
spool's own draw + margin) or nav waits with the mains off. The cutter runs
only during a MINE step. If the bus draws more than the reactor makes even at
rest, it stands down and tells you what to shed (1 2 5 for shields, turrets,
gravity; Y for the cutter).

**Warp policy.** `auto` — climb out of any well, charge, come about, plot,
jump. `ask` — the same, but the ship parks aligned and asks on the sys channel
(JUMP / SUBLIGHT / ABORT links; the NAV and WORK banners answer the same);
SUBLIGHT turns that step's policy to `never`. `never` — sublight only; long
legs are long, and the status line carries the phase so you can go below and
talk to the crew while it flies.

**A dropout is not an arrival.** The jump-only leg used to treat
`autopilot.jumped && warp.state !== "run"` as success and hand the stick back
with *"jump complete"* — while sitting in the rocks, hundreds of kilometres
short, having dropped out at 3% of the lane. `sim.warp.dropped` records what
ended a jump, `jumpEndedShort()` decides whether it was an arrival, and the leg
goes again (three tries, then an honest failure naming the hazard). Because the
leg climbs clear of the rock layer before plotting, a dropout at 3% now lands the
hull in clean space above the belt instead of inside it. Climbing does **not**
remove the belt crossing from the plot — the crossing is an annulus test on
radius and you are standing in the annulus. What it changes is where a dropout
puts you. Same odds, survivable outcome.

**The desk.** SELL sells ore and minerals at the port's bid; STASH leaves the
hold in a locker (LOCKER & WORKS on the market tab: STASH ALL / WITHDRAW);
SMELT runs every ore through the port's works at the refine table's ratios,
6% of the value kept — industrial, military and logistic ports have a
smelter; the chart loop's ON DOCK smelt falls back to a sale. DOCK targets
`best buyer` / `best smelter` / `nearest port` resolve through
`bestPortFor(plan)`, which weighs distance against what the port pays — and
asks ARIA first.

### ARIA

There has been a net since p8 (`js/npc/brain.js`) and a "house core" that
watches how you fly whenever nobody else holds the conn — one imitation label
every five seconds. It only ever seeded NPC captains. It never flew your ship
and never touched your autopilot, so what it learned went nowhere you could see.

`js/aria.js` is three things, all fed by what you **do**:

1. **Preferences.** Every time you sell at one port over two that were closer,
   or cut the chromite and leave the silicate next to it, that is a labelled
   example. `bestPortFor()` and the mining loop's rock scoring ask before they
   pick. Counts, not a net — a tally is honest about how much it has seen, and
   "you have done this fourteen times" is something a panel can say out loud.
   The lean is deliberately gentle (×0.75 … ×1.45, scaled by confidence): an
   autopilot that only went where you had been would never find you the better
   price, which is the entire point of it flying while you do something else.
2. **Advisories.** It learns which kinds of advice you act on. Ignore one four
   times running and it stops raising it; act on it once and it comes back,
   because people change what they care about.
3. **The conn** (the **ARIA** button on the flight HUD, 0.3.03). ARIA does not
   steer the stick; it plans jobs for the autopilot (`js/aria-pilot.js`) —
   repair when the hull is under 45%, the desk when the hold is 85% full, and
   otherwise the job *you* spend your time on (mine, sell, survey), counted off
   your own flying under `aria.prefs.job` — and the mission runner flies each
   one under the power rule, avoidance, warp policy and docking lane. Docked it
   buys hull and sells; under fire it sets CASTLE; on an overloaded bus it sheds.
   Touch the stick and you have the ship back. It has no berth, no wage and no
   morale and is not on the crew ladder.

At CONSOLE › NAV › **ARIA**: how much it has watched, what it thinks it knows
about where you sell and what you cut, what it has stopped telling you, and the
button. What ARIA has learned is filed against the **human**, not the character
— it survives retiring a pilot (see [the data model](#the-data-model)).

---

## People

### The name forge

`js/names.js` + `js/data/lexicons.js`. One seeded assembler, many tongues.

**Two corners of the naming system were never forged at all**, and by 0.3.32
they had run out. Ports came from five sector prefixes times seven suffixes —
175 names in the whole game, and across twelve systems 42% of ports carried a
name another port also had. Terran people drew a surname from a flat list of
65, which put "Piotr" in front of you 37 times in three thousand and repeated
the contact board with them, because a vessel's callsign is built off its
captain's surname.

`js/naming.js` is the seam that fixed it, over pools vendored from **Stellar
Names 1.2** (`js/vendor/stellar-names/`, licences and changes in its
`NOTICE.md`). Ports keep the sector word as their anchor — Bastion, Smelt,
Hookfall tell you what you are docking at before the market screen does — and
everything around it widened to 10,350 names, unique inside a sky by
construction. Terran given names and surnames gained thousands behind the
hand-picked lists, which stay as a *core* drawn a fifth of the time because
they were chosen for a global spread the vendored registry does not have.

The alien tongues were not touched and neither were the family *shapes* — the
veyd have no family name, the vantari carry a compound, T-Synth a foundry line
and a number. Those are lore, not small pools waiting to be filled. And naming
a port costs the station builder's generator nothing, so the same seed still
grows the same sky: same ports, same places, better names.
Nothing here is a list of names: names are built out of phonemes, so the supply
is effectively bottomless and a name carries information.

| | before | after |
|---|---|---|
| worlds, moons, stars | 27 roots × 14 tails = **378** names, one pool for everything | 8 sky tongues × a syllable forge, 3 registers — measured **62.9% spoken / 25.9% catalogue / 11.2% colonist** |
| people | 110 given × 50 surnames, one human pool for all 15 races | 15 race tongues, **4,379–5,000 distinct full names per race in 5,000 draws** |
| rogue asteroids | **13** names + a counter (the 14th rock was Kerrn again) | MPC-style provisional designations, collision-proof by construction, plus **2,400+** distinct earned names |

**How a word is made.** `onset + nucleus + coda`, per syllable, under rules that
are the difference between a name and keyboard mash: a syllable that closed on a
consonant is followed by a *light* onset only; a cluster onset has spent its
consonant budget, so its coda is trimmed; no onset repeats the one before it;
and reject anything four consonants deep, the same consonant three times, no
vowel, all vowels, over `min(11, 3 + 3 × syllables)` characters, or on the
tongue's own ban list.

**People.** Gender rides on the **ending**, the way most real tongues do it,
which is what makes the supply bottomless. A fraction of every draw takes the
neutral set regardless, so a crew list still tells you less than a face does —
`AMBIGUOUS` is **0.10** today, down from 0.18, because in a real tongue an
ambiguous ending reads as ambiguity and in an invented one it reads as nothing,
which readers fill in as male.

The **family name is the lore**, and its shape is per-race:

| race | shape | example |
|---|---|---|
| terran | a surname, 62% curated so familiar names survive | Dagny Orlov |
| oberlin | an employer and a grade — raised on contract | Saskia Kestrel Tier |
| tsynth | a foundry line and a number | Neirix Dione-8222 |
| sef | no surname, a hull | Noil of the Sind Gate |
| brann | a patronymic off a parent's given name | Ravard Telfsen |
| korrash | two halves of a clan | Brekokga Kazhath-Kakh |
| veyd | none at all | Vyenoelael |
| sirrah | a medical order | Nahla of Lila House |
| vantari / ashwalker | a compound | Glydis Grimward, Chertir Flintridge |

Children inherit through `childFamily()`, which knows the difference: a Sef
child gets `of the Sind Gate`, not `Gate`; a Brann child is named off a parent's
*given* name with the suffix their own gender takes; a Veyd child gets nothing
to inherit. Origins are built rather than listed too — 25 places × 17 twists,
plus a forged place name in the parent's own tongue.

**Worlds.** Every system draws **one tongue** and names its worlds from it, so a
sky sounds like one place — you can hear that Ophiath and Ophelune are
neighbours. Three registers sit on top: **spoken** (a name somebody gave it),
**catalogue** (`<star> b`, `<star> c`: nobody ever cared enough — weighted onto
the cold margins and hostile rock, and deliberately kept a minority, because a
nav list that is mostly `<star> b, <star> d, <star> g` is *less* varied than what
it replaced), and **colonist** (New Halloran, Ferreira's Hold, Providence, Fort
Zire). Which register a world gets keys off its archetype and whether anybody
could live there, so the name tells you something before you scan it. Moons read
off their parent: Roman numerals, `Major`/`Minor`, `Lesser`/`Far`, or a name of
their own; a parent that is itself a designation always numbers its moons.

**Rogue rocks** take provisional designations in the real minor-planet style —
year, half-month letter, order letter, cycle count (`2371 QG12`) — **built
entirely out of the spawn counter**, because a designation that rolls any part
of itself can collide, and a catalogue with two entries under one number is not
a catalogue. The half-month letter walks forward each time the order letters
wrap, so a session's rocks read as one survey working through a year. Only a
rock big enough to end a moon gets talked about long enough to earn a name, and
a sky tracks which names it has already issued.

**The guard.** A forge that draws from phonemes will eventually draw something
you did not want on a crew manifest — `Clitor` came out of the Oberlin tongue on
the second sampling run, and the Brann patronymic turned `Skanu` + `sdatter`
into something worse. `offensive()` rejects a blocklist anywhere in a word, plus
a second list only at word edges so ordinary names (Kassar, Titania) survive. It
runs on syllables, on the ending join, on family shapes, and on every composed
world, moon, rock and beacon name — checked per **word**, because a fragment
that exists only because two names sit next to each other ("Sera Petrosyan") is
not something anybody sees. `test/names.test.mjs` scans half a million names for
it on every run.

**One name, one person — the Galactic Database** (`js/gdb.js`, 0.3.54). The
forge makes names; the GDB decides which ones a person may have. Everybody the
galaxy produces is filed there — hiring halls, traffic captains, NPC hull
crews, flow-boat pilots, boarders, bounty marks, children born aboard and
ashore — and filing is where the checks live: a full name already on file is
never issued again (the given name is re-forged from the person's own seed, so
every device gets the same answer), and a given name that shares its first or
last three letters with somebody already in the ROOM (the hall plus your crew,
a hull's crew plus its captain, siblings and parents) is re-forged too. Once
filed, a person keeps their name, whatever the forge would say today. Each has
a stable GDB-XXXXXX number, first-filed and last-seen, and a status that death
sets for good. Hiring halls bring back only their own port's people (and
anyone you paid off there, first). The forge itself allows one doubled vowel
and one apostrophe per given name, ten letters at most, and re-rolls a family
name that echoes the given name's opening. CON › CREW › GDB is the census,
the search and the chronicle; the relay keeps the catalogue in `gdb.json`.

### Who is who: sex, gender, and printing it

Three separate things had to be right before the sky stopped reading as male.

**The body's sex** is `GENE.GENDER`, drawn **flat** against a narrow band
(`SEX_SPLIT` in `js/genome/spacer.js`). It was drawn on a bell curve once — the
engine draws every gene as the average of three uniforms — and a band wide
enough to mean anything at the centre swallowed a fifth of the population.

**Gender identity** is a separate roll taken off the genome as a whole
(`genomeRoll`, deterministic, costs no gene slot): the large majority are the
gender their body is, a few are not, and about one in twenty is neither.

**And something has to print it.** Of roughly thirty-five places the UI renders
a person, exactly *two* showed a pronoun. Everywhere else a person was a name in
an invented tongue with nothing beside it, and a reader with no ear for the
tongue fills that blank in with the default. `genderMark()` / `pronounOf()` in
`js/crew.js` are wired into the crew roster, the genome sheet, the brig, the
port deck's people list, the fleet rows, the yard chair, `describeNPC` and the
SHIPS directory — which had been throwing the captain away entirely
(`vesselStatus(n).split(" — ")[0]` kept the job and discarded the person).
Traffic captains carry `captainGender` and `captainPronouns` on the vessel, so
there is no CRADLE lookup per frame.

`SEX_SPLIT.female` is **0.615** today — one number, in one place, so it can be
moved in one edit. Measured over 6,000 people: **53.8% women / 40.5% men / 5.7%
nonbinary**, lowest race terran at 49%, highest delvath at 56%, and 31 of 56
captains in a live sky women with pronouns on the directory line.

### Corporations and the powers

`js/data/factions.js` is Living Galaxy's political layer, ported verbatim:
three blocs (Coalition, Independent, Outer), nine powers with a charter and a
temper, and a dated history from which every relationship is *derived* —
`relationOf(a, b)` sums the shifts the timeline records, so the fiction and
the mechanics cannot drift apart. `activeWars()` lists who is at war today.

Astra's fifteen local outfits (`js/corps.js`) are chartered under those powers:
majors fly Coalition paper, alternates signed nothing, hostiles are Outer.
`corpRelation(a, b)` is the powers' relationship plus the sky's own feuds
(two or three seeded quarrels and one old alliance per sky), and `corpWars()`
is the local list. A power's temper scales how fast its standing moves.

**Every NPC flies a flag.** Captains carry their home port's corporation
(pirates their hold's, the law a major's); flow boats carry their port's.
`corpOfVessel(n)` resolves it. Hails name the flag and its opinion of you,
the chart's vessel card shows FLAG, and `vesselStatus()` carries it. Shooting
an honest hull is a standing event with its flag, with its flag's allies (35%
of the loss) and with its flag's enemies (who approve). Raids pick prey whose
flag is at war with the raiders' — the corp war is in the traffic, not in a
text field.

### Comms

Everything out here has a radio. A port that sees you inside nine thousand
units calls you — traffic control, market, a berth — in its sector's voice.
A free port with its guns up makes a demand. The puck on the right rail
pulses; tap it for accept and reject, or press **H**. Let it ring and it
logs as a missed call.

Calling out is **HAIL**. Locked port, the port you are clamped to (that is
how you ask for undock clearance — and PRIORITY LANE costs eighty credits),
locked contact, or the nearest port. Drones do not answer. Replies are
chips under the transcript, and they mean something: a clearance opens the
clamps, a pirate toll moves credits and buys nine hundred seconds of quiet
from the guns, refusing a scan costs standing, and flying the port's flag
gets the docking fee waived.

**LISTEN** puts the open channel on the ticker. Signal quality eats characters,
not words; light-lag is real (0.02 ms per unit, so a far port takes a second to
answer), and past 240,000 units there is no carrier at all. Scripted calls run on
sim time — TIME compresses them, pause freezes them.

**The open channel is pilots, not ports.** `vesselUnit` used to name itself
after the *hull*, so the band read `Ortega 42 › Tamarin 14`, which is freight
manifests rather than a system with anyone in it. Traffic captains have been
real CRADLE people for a long time; the band just never used the name. Flow
boats had nobody filed for them, so `flowPilot()` forges one off the boat's own
id — the same boat is the same pilot every time you meet it, at the cost of a
name draw rather than a genome. `voiceName()` shortens to a first name (then
"Neve V.", then the full name) because the speech engine drops the name *into*
the sentence, and "I've marked Skreth on my board" is a transmission where
"I've marked Skreth Scorchspur on my board" is a mouthful.

**Ports are off the band** entirely: `syncBand` no longer pools stations and
`chatter` filters `isStation` from both speaker and candidate — belt and braces,
because `unitOf()` pushes a station onto the band when you talk to one and does
not take it off. Everything port control actually does still works, because none
of it went through the band: the approach hail, the lane hail, undock clearance,
the pirate demand and a hail you place yourself are all `CallSession` on the
puck. A station will still answer you if you talk to it.

**What is said on the band is true** (0.3.16). `js/npc/ground.js` answers
questions about the live sky — where a point is (`placeOf`), who is around a
port (`portCensus`), whether a hull is being shot and by whom (`underFire`),
which raiders and rogue drones are within range (`threatsNear`), and what is in
the rock at a claim (`claimSurvey`) — and nothing on the channel asserts a fact
it has not asked. `js/npc/reports.js` makes the first-hand calls from it:

- **MAYDAY** — only from a hull something is actually shooting (a fresh hit, an
  open distress call, or the victim of a live engagement), naming its hull, who
  is shooting and how many, where it really is, its real integrity, and the
  security ETA when a wing is dispatched. Raiders and drones never call one. It
  goes out at once, whatever else the band is doing, and repeats every 45 s
  while the shooting lasts.
- **PORT** — only from a hull inside 40 km of that port, with that port's real
  count: hulls about, on the entry lane, in the bay, going out, hostiles near
  the ring.
- **CLAIM** — a miner on its claim: the ore it is cutting, the commonest rock
  and the most valuable ore in reach with amounts and the price ratio, and any
  raiders (range, bearing) or rogue drones (and the nest they came out of) on
  the belt with it. What it hauls home is the ore it said pays.
- **PICKET** — a patrol's sweep, dirty or (now and then) clean.

The speech engine is still the voice of everything else, but its units and
callbacks are grounded (real hull integrity, real place, real threats and
bearings, a miner's grade off its claim; rogue drones have no voice) and each
topic that asserts a fact about the world — `askHelp`, `laneReport`,
`positionReport`, `oreTip`, `gradeReport`… — carries a `when` that also asks
whether it is true. Ask a hull about ore, danger, traffic or the lanes on a
call and the answer comes off the sky too.

**Other pilots.** `server.py` is also a relay. Anyone who launches into the same
sky on the same server shows up on your sensors as a peer contact and can be
hailed the same way. That call is live: a transmit row replaces the chips, what
you type crosses with real light-lag, and it runs on the wall clock because the
other pilot's time is not yours to compress. Busy pilots give a busy tone;
leaving the sky drops the call.

### Your company

Register at any honest port's desk (CREW tab, 2,500 cr): a charter (Astra's
sectors — Security, Extraction, Freight, Trading, Provisioning), a treasury
separate from your pocket, a book that remembers every credit, and three
board seats in deliberate tension (Expansion, Solvency, Charter). Revenue you
earn is booked in-charter or off-charter, which is what the Registrar's seat
cares about; the treasury takes FUND / DRAW at the desk.

### The contract board

The BOARD tab at any port and CONSOLE › CORP › BOARD (`js/contracts.js`, drawn
by `js/boardview.js` so the two cannot drift). Since 0.3.18 a desk is a port's
whole payroll: **thirty offers** re-posted every eight minutes, expiring whether
or not you look, posted by the port's charter holder **and the two or three
tenant outfits with offices on its ring** (a free port's tenants are the hostile
outfits), and nested as drop-downs: **department → issuer → offer**, takeable
first. Your own career's department opens by itself; FITS MY HULL and MY CAREER
narrow it.

| department | careers | jobs |
|---|---|---|
| Mining & Extraction | mining | cut ore for the works, ice runs, vein strikes (rare ore) |
| Freight & Logistics | logistics | consigned hauls, supply shortages, bonded courier parcels on a short clock |
| Trade & Procurement | commerce | procurement (names who sells it cheapest), consignment sales (a cut of the far port's price), restocks, tenders |
| Security & Bounties | security | named bounties, escorts, picket sweeps (fly and hold points), drone culls (N rogues out of a named nest) |
| Salvage & Recovery | salvage | wreck plate, wreck sites on the belt, drifting cargo pods (aboard at the site, paid to the finder) |
| Industry & Construction | manufacturing, construction, shipyard | refined materials, construction lifts and deliveries, yard parts |
| Energy & Fuel | energy | bunker fuel, reactor service |
| Survey & Science | research, navigation, terraforming | survey an unregistered world (SCAN it), assay samples, chart a lane to a beacon |
| Civic Services | healthcare, education, agriculture, communications | clinic supply, galley stores, relay service at a beacon, field trips |

Every department is posted at every honest port, your career's gets a floor of
three more (two of them Standard, no standing asked), and the rest is the port's
own business by **sector** (an industrial yard wants ore and girders, a habitat
medkits and rations) leaned by each issuer's **charter**. Every job is sized to
**the hull you are flying** — cargo work to your hold and to a purse (nobody
posts two hundred thousand credits of armour plate for a trainer), combat work
marked *needs an armed hull* until you fly one — and a delivery pays the port's
bid **plus** a premium and a fee, because a desk that pays under the market is a
desk nobody uses.

**A job with rock in it names a place** (0.3.20, `js/sites.js`). The desk picks
a stretch of belt when it posts the job — *the Kestrel Drift — 412 km out from
Smelt Station, bearing 214* — and accepting it opens a **site** there: four to
sixteen seeded rocks carrying the ore the job wants, laid into the field the
cells already grow (`field.js` asks `sites.js` for them per cell). They are
real rocks with real keys: they assay, they cut, they deplete, and the belt's
own mix is untouched around them, so a run to a site pays twice — the
contract's ore and whatever else is in that drift. Accepting puts the spot on
the chart and points MINE HERE / MINE LOOP at it (**MINE IT** on the in-hand
row hands it straight to the mining loop); delivering, abandoning or letting it
expire closes the seam. Ice runs look past the frost line, vein strikes lay a
tight rich pocket, assay jobs a small one; wreck and pod recoveries name a
drift the same way.

**Chain contracts** (0.3.21, `js/chains.js`, `js/data/chains.js`). Twenty-one
multi-stage jobs, four or five stages each, spread across every department —
mining 2, logistics 2, trade 2, security 2, salvage 2, industry 3, energy 2,
science 3, civic 3. A chain is posted one stage at a time: finish one and the
next is waiting, at the same port or at a neighbour the engine picks, and the
closing stage pays a bonus and a block of standing on top of its own pay.

Every stage names a KIND its own department already posts, so the engine builds
it from the same `KINDS` table a one-off comes from and then overrides the
tonnage, the good, the pay and the prose. A chain therefore cannot ask for a
mechanic the game does not have, and the numbers on it — amounts, ore names,
port and drift names — come from the live sky rather than from the author. A
mining stage still picks a drift and lays a seam in it.

A chain has exactly one home port in a sky: the chains are dealt out across the
honest ports, each to the best-hashing port of a sector it belongs in that is
not already carrying its share, so a chain is somewhere you can go back to and a
tour of the sky turns up work you have not seen. Abandoning or timing out on any
stage closes the whole file and cools it off for forty minutes. The board tags a
stage with its chain's name and `Stage 2 of 5`, and a strip at the top of the
desk says what you are running and where the next stage waits.

### ARIA plays it herself

**Headless playthroughs** (0.3.22, `js/ariaplay.js`, `tools/aria-play.mjs`). The
preference core (`js/aria.js`) learns from watching you fly. The other half is
ARIA flying a hull of her own. One terminal runs the world, `python3 server.py
8080`; a terminal per pilot runs a career in that same sky and the same relay
room:

```
node tools/aria-play.mjs --career mining   --minutes 20
node tools/aria-play.mjs --career commerce --minutes 20 --speed 12
node tools/aria-play.mjs --career security --minutes 20 --hull general_c
```

Flags: `--career --hull --minutes --speed --room --server --credits --name
--quiet --no-net`. Generation is deterministic, so every instance and every
browser tab builds the same sky; the runner pushes the same `t:"ship"` packet
`js/net.js` sends, so a player in a browser sees the bots working.

A MOVE is a kind of work with a target (`board:mining:vein`, `chain:trade`,
`route`, `mine`, `sell`), scored by credits per minute of sky over every run of
it, chosen epsilon-greedily with a hard lean toward her own department. The
brain lands in `logs/aria-brain-<career>.json` and is read back on the next run.
Every move is executed by machinery you use — `jobPlan(a)` turns a job in hand
into a MISSION, and the test asserts every plan it builds validates as a mission
you could have written yourself. Nothing moves the hull by hand, so a bad number
in her report is a bad number in the game: her first night out found a chain
stage that could outgrow the hold, a field trip that was uncompletable, and a
mining loop that came home with the wrong ore.

### Reading a career: the pit screen and the bench

**The screen** (0.3.24, `tools/aria-tty.mjs`). Each `aria-play` instance holds a
STATIC screen that repaints in place rather than scrolling: the pilot's name and
career in the career's own colour, the purse and the rate, bars for everything
that is a fraction of something (hold, charge, hull, job progress, the clock on
the contract), the move in hand, the helm, what the brain has learned, and a
short tail of events. One 256-colour hue per career and no two alike, so four
terminals side by side are legible at a glance. Plain ANSI — no curses, no
dependency, fine over ssh and in Termux — and piped to a file it falls back to
one line per change so `> run.log` stays greppable.

**The bench** (0.3.24, `tools/aria-bench.mjs`) is how a balance claim gets
settled:

```
node tools/aria-bench.mjs --minutes 25 --json before.json
node tools/aria-bench.mjs --minutes 25 --compare before.json
```

Every career from the same purse, in the same sky, off the same seed, for the
same minutes of sky, with the market's own numbers underneath — how many routes
are profitable, what the best one pays, and the mean sell ÷ buy across the top
twenty, which is the number that says whether trading is a trade or a printing
press. Each career flies in a process of its own: nine sim relaunches in one
process share a module graph, and the first version of this bench reported eight
of nine careers earning identical money without flying at all.

### ARIA looks, then flies

**The senses** (0.3.25, `js/aria/senses.js`). One call builds a snapshot of the
whole situation from the live sim, and every decision downstream reads that
rather than reaching into the world: the hull (integrity, charge, hold, guns,
whether it is in a belt), the space around it (every well and whether she is
inside one, hostiles, rogue nests, rock and which ores are in reach), every
honest port (distance, whether the corridor is clear, the shelf priced both
ways, shortages, what it pays over the odds for, the repair rate, your standing
— and its production lines, running or stalled and on what), the board by
department, and the market's best runs. It is cheap because the expensive
layers rebuild on their own cadence (ledgers 20 s, board 45 s, space 2 s), and
it is honest because one think is decided against one consistent picture.

`unpostedWork()` is what that buys you: a stalled production line is a standing
order nobody has written a contract for, and if somebody two ports over has the
thing on the shelf, that is a run with a reason. It is one of ARIA's moves
(`supply`).

**The navigator** (0.3.25, `js/aria/nav.js`). She locks the target (P-LOCK —
the core, the cutter and the turrets all read the lock), marks it on the chart,
and checks the corridor. A body inside the core's `losMargin` is a leg it will
refuse, so she computes a **dogleg** — a point out to the side of the blocker,
far enough that both halves are corridors the core will hold — and flies two
legs instead of failing one. If nothing clears it the job prices at infinity
and she takes other work. `legSeconds` prices a leg the way it is actually
flown: the climb out of the well, the spool, the run at the sim's own
55,000 u/s, the fall at the far end and the berth.

### The hold is a bag

**HOLD** (0.3.29, `js/holdview.js`) sits in the HUD tools row with the fill
percentage on it, and opens a slot grid: one slot per good, its quantity, the
tonnage it costs you, and what a unit is worth where you are standing — the
port's price when docked, book value when not, and the panel says which. Empty
slots are drawn as empty so the room left is visible rather than arithmetic.
**DUMP** and, when docked, **SELL** are the only two actions; a lot carried
under a haul contract is marked *consigned*, left out of what the hold is worth
to you, and has no buttons, because it is a contract and not cargo. The CGO
gauge opens it as well, in landscape — the gauge strip is `display: none` in
portrait, which is how the game is actually held.

### Why the belt does not rebuild itself

**The cell cache is not keyed on the clock** (0.3.28, `js/field.js`). A rock's
identity — its cell position, its radius, its class, its ore — does not depend
on the sky time at all. Only a ±60 u wobble and how worn it is do. The cache
used to be keyed on time anyway, so the whole 27-cell neighbourhood was thrown
away and regrown on every distinct clock value: every sub-tick, for ever.
Measured at the hull in a belt across the queries the game really makes, a
frame cost 0.70 ms with the clock running and 0.01 ms with it frozen — the
cache was worth 93× its keep and collected none of it, because in a running
game the clock always moves. Cells are grown once and kept; `refreshCell`
applies the wobble and the wear over them. 0.70 → 0.05 ms a frame.

`wearRock` used to call `forgetRocks()` on every call, and the cutter calls it
every frame it burns — so mining invalidated the entire belt sixty times a
second. It flushes only when a rock is finished and has to stop existing; wear
rides the refresh.

**One rock, one shape** (0.3.62, `js/engine.js`). A rock's prototype IS its
shape at every range: close aboard it is the same seed and rolls grown at the
device's finer lattice (on `low` the identical mesh), grown once per prototype
per session and shared — a close-aboard rock is a mesh on shared geometry with
its own material for its tint only. Before, the near body was grown off the
rock's own key: a different body (27% mean silhouette difference measured) and
a grow in the worker for every rock passed. A per-rock stretch (two axes pulled
in by up to a fifth, never out) is worn by instance and body alike, and the
instance lattices change only after clearing a threshold by a fifth either way
(`LOD_HYST`). A rock changes only when something happens to it: worn, shattered,
struck. The notes below predate it and describe the swap it removed.

**A rock keeps its own shape** (0.3.28, `js/engine.js`). A grown body is that
rock's real geometry and everything else draws as a class prototype, so a rock
crossing the body budget changes shape rather than fading — and on a phone the
budget is four. The grown set now has hysteresis: an incumbent ranks nearer
than it is, keeps its body out to a wider radius so the change happens at the
edge of the range, is safe from eviction for a moment after mounting, and is
never evicted in favour of something further away or while it is under your
lock or your cutter.

### When it will not start

**The boot guard** (0.3.27, `js/boot.js`). ES modules resolve named imports at
link time, so one file left a version behind its neighbours does not throw
where you can see it — the whole graph refuses to evaluate, nothing mounts, and
the static shell in `index.html` sits on screen over a canvas nothing drew to.
The page looks alive and is not, and the server log is clean because every file
was there; they just did not agree with each other.

`index.html` carries a classic-script watchdog that runs *before* the module
(nothing inside `js/` can report a failure to link `js/`), and `js/main.js`
runs inside `guard()`. If the game has not set `__lgBooted` eight seconds in
and something threw, the failure is put on the page in words — which module,
which export, and, via `EXPECTS`, which patch that export arrived in, so the
message is an instruction rather than a diagnosis. Chromium, Firefox and
Safari phrase a link error three different ways; all three are read. The panel
covers the shell rather than sitting behind it.

### ARIA runs the company

**The bridge's business side** (0.3.26, `js/aria/company.js`). A career in this
game is a company, and ARIA now runs one — off the same machinery the deck
gives you: `stationRoster`/`hireCrew` for the hall, `setDuty` for the watch
bill, `foundCompany`/`transfer`/`settleAsStaff` for the charter.

*Payroll first* — a wage is a bill every ninety seconds, so she will not sign a
hand she cannot carry for eight cycles out of what the run is actually earning
(the game's own first-hand scheme — half wage, no bonus — is the exception, and
she takes it). *Hire for the watch* — `WANTED` lists the trades worth a berth
per department, career trade first, and a hand with no post on the hull is a
passenger with an opinion. *A charter when there is something to charter* — at
around twelve thousand credits she registers the one that matches what she
earns from, because the Registrar's board seat scores exactly that. *Settle the
ones the ship is done with* — unhappy, unpostable or surplus hands go ashore as
staff and pay the treasury a share of a wage for ever. *And the treasury holds
the surplus, not the working capital* — `workingCapital()` is sized off the
hold she has to fill and stays aboard, or the next run cannot buy cargo.

The brain scores on **net worth** — purse plus treasury — because otherwise
every port call where she banked money read as a loss, and she would have
learnt, correctly and uselessly, that docking makes you poorer.

### The crane is not the till

**Cargo handling** (0.3.25, `js/dockwork.js`) — a game rule, the same for a
player and a bot. You agree a price and the money moves at once; the crane
books time at the berth. It scales with **tonnage**, not units, so eight shield
coils are quick and eight hundred rations are not; it is cumulative across one
port call; and a better cargo rig (`mods.handling`) works it off faster.
Undocking enforces it, so the deck button, the autopilot and the mission
executor all hit the same refusal and wait it out. Before this, a hold of
anything cost the same to move as a crate, and ARIA's credits-per-minute
counted the flying and not the loading.

### Why a consignment is priced as a consignment

**Lot pricing** (0.3.24, `js/economy.js` `lotMult`). Every trade used to move
the whole lot at the MARGINAL price — what one unit was worth — applied once per
unit. A hold of girders emptied into a port that wanted forty still fetched
bare-shelf money on the hundred and sixtieth. A lot now walks the port's own
stock curve as it lands, integrated over the fill, and `askPrice`, `bidPrice`,
`sellPriceAt`, `buyPriceAt`, `tradeBuy` and `tradeSell` all take the quantity.
`js/traderoutes.js` sizes a run and then prices both ends at that size, so the
route board's estimate is still exactly what the till will do.

The stock band narrowed with it: `PRICE_FLOOR` 0.6 → **0.72** and `PRICE_CEIL`
1.7 → **1.45**, because 0.6 … 1.7 is a 2.83× swing between a glutted source and
a bare buyer before the sector spread goes on top, and that is what let a round
trip double your money.

Those two took 46% out of route profit, and the bench showed they took the
careers down with them — a delivery's pay is built on the port's bid, and the
bid moved too. So the third lever: **`BOARD.pay`** in `js/contracts.js`, one
named constant on the posted pay of every job, at 1.7. It moves every department
at once, which is what parity wants and flavour does not; it is the number to
reach for when a career feels thin. Measured over nine careers × three seeds ×
eighteen minutes of sky: the best route went from **7.74× the median career to
2.53×**, the median career from 603 to 996 cr/min, the worst from −937 to +184,
and eight of nine careers now earn most from their own department's board
instead of from trade runs.

**0.3.47 — work for your credits.** That parity was bought by paying
everything more, and it showed in play: a Fledgling's first chain stage paid
4,192 cr against a 6,563 cr hull, a "cut 305 iron ore" job paid about 2.3× what
the ore fetched at the counter, a Sealed procurement 3.7× what its cargo was
worth, and a start purse was a fleet in an evening. So, all at once:

| Lever | Was | Now |
| --- | --- | --- |
| `BOARD.pay` | 1.7 | **1.0** — the desk pays what its text says |
| Bonded / Sealed tier | 1.55 / 2.4 | **1.35 / 1.8** |
| Goods jobs | tier × the whole cargo | the goods at the bid (ore/ice) or the **cheapest ask in the sky + 8%** (anything you can buy), and the tier scales only the premium and the fee |
| Freight (haul, courier, lift, consignment) | 25–60% of cargo value | **12–20%** + a fee |
| Chain closing bonus | as authored, 5,500–9,500 | **× 0.5** (`CHAIN.bonusK`) |
| Stock band | 0.72 … 1.45 | **0.8 … 1.3**, the curve's exponent solved so it lands on the floor where `GLUT_FRAC` says a glut starts (it had gone flat at 2× target — `economy.test` had been failing on it) |
| Finished-work bonus | ×1.12 / ×1.22 | **×1.08 / ×1.12** |
| Pirate bounty | 420 + 6/t + 600 rescue | **240 + 4/t + 350** |
| Your drone's bounty | 300 | **180** |
| Settled staff share | 45% of list wage | **32%** |

Bench, one seed each at 20 min and a 20,000 cr purse, before → after (the
bench counts purse + treasury, not cargo, so single runs swing): commerce
1,844 → 139–334 cr/min, manufacturing 1,304 → roughly break-even to 541,
energy 1,570 → 775–977, healthcare 811 → 158–255; the mean top-20 route spread
1.70× → 1.43×. A typical flying job now pays under a third of a starter hull.

### Who says what

**NPC chat is a seam, not a file** (0.3.23, `js/npc/chat.js`). The speech engine
still owns everything that is simulation — who speaks, to whom, about what, on
which channel, and what it does to regard, memory and corporate standing. A
registered VOICE only gets the finished beat and may re-word it:

```js
registerVoice({ id, rating, priority, channels, roles, topics,
                line(beat), reply(beat), chips(unit, turn) });
```

Returning `null` declines and the engine's own words stand; throwing also
declines, so a broken pack degrades to vanilla rather than to silence. RATING is
the gate and it starts at `core`: a voice is never consulted above the rating
the player set (`lgaa.npcchat.v1`), and the rating caps which channels it may
touch at all — `mature` a direct call and a hail, `adult` a direct call only, so
nothing above `core` can reach the open band. The 18+ pack registers a band
voice on those terms (`addon/adult/npc.js`) and declines unless the hull's
regard for you is already warm.

Tiers Standard / Bonded / Sealed pay ×1 / ×1.55 / ×2.4 and ask for standing
with the issuer (the blocker gives the number you need and the one you have).
**Refusing is free, abandoning is not**: an accepted job has a 25-minute
deadline (a courier's is shorter); letting it lapse or ABANDONing it costs
standing, and a haul's consignment (loaded on accept) goes back. You may hold
five. A job with somewhere to fly puts it on the chart on accept, and MARK puts
the next point back; the in-hand line says what is left (`3/5 drones`, `picket
2 (2/3) · holding 9s/15s`, `40/120 Steel · deliver at …`). Delivering pays,
moves standing with the issuer and through `corpRelation()` with its allies (+)
and enemies (−), trains the department's skill, and books revenue for the
company.

### The fleet

With a company registered and a member of staff settled at an industrial or
military yard, the CREW tab's FLEET section commissions hulls from the
treasury (the yard's raw-stock bill): miners for **extract** orders, haulers
for **haul**. A commissioned hull is a real hull on the board
(`npc/traffic.js spawnVessel`) with the settled hand in the chair, the
company's flag, and the same timetable a captain flies — belt claims and home,
or stock between ports — so it shows on the chart as a transponder and hails
like anyone else. Every delivery books the hull's real hold at the port's bid
(less the crew's 25%, which is the captain's pay) to the treasury; every cycle
costs upkeep (0.4% of the yard price). An overdrawn treasury loses the newest
hull to the yard. SELL BACK returns half the price. Six hulls at most.

### The Marshal's board and the brig

**CONSOLE › CORP › MARSHAL** (`js/npc/bounty.js`). Four marks on every lawful
port's board, deterministic per port per restock. Every one of them is wanted
**alive** and held somewhere you have to go. Marks are drawn from CRADLE first,
so the hand who walked off a hauler two skies ago and the one you paid off at
Foundry Hold are who turn up with a price on them.

The board shows both halves of the arithmetic before you sign anything: what it
pays (700 cr for walking off a contracted berth, up to 14,000 for piracy under
another flag) and what it costs (every mark belongs to an outfit; coming for one
of theirs costs **−9 standing scaled by the charge's heat** with them and a share
of that with everyone flying the same flag, spent whether you get them or not).
A desk never puts paper out on its own people or an ally's, so a ticket is always
somebody else's person. Three tickets to a hull, one attempt per rotation, a
clock on each; a mark you sign for and leave alone can be lifted by somebody
else. A capture is resolved as what you brought against what is there: crew
security aptitude and skill scaled by morale, marshal robots counting double,
against the mark's own genome and however many people are standing with them.
Nobody dies in it. Stand far enough under with anybody and there is **paper out
on you** — `bounty.playerPrice`, which the desk shows and hostile hulls read.

**The brig** (`js/crew/captive.js`) is somebody on the ledger with an outfit that
wants them back. Two numbers, and **both** have to move: **resistance** (how far
they are from giving you anything — starts 30–100 off their grit, loyalty and
pain threshold) and **regard** (what they make of *you*, separately). You can
wear somebody down without them thinking any better of you, and that is exactly
the captive who signs on and walks at the first port.

Ten things you can do. On the humane side — bring them a meal, get them clean
clothes, sit and talk, have the medic look at them, let them work out under
watch, move them out of the cell, put them on a watch, tell them how it stands —
which move both numbers the right way, slowly, and **resistance moves faster the
better they think of you**; that relationship is the whole shape of the system.
On the other side — press them, short rations, leave them in the dark — faster on
resistance, ruinous on regard and condition. They get you a delivery or a ransom
and never a crew member, and a Marshal will not take somebody under 35%
condition at all and docks the ticket 30% under 60%. Neglect is its own choice:
a captive nobody visits hardens by 2.5 a cycle, loses condition, and eventually
tries the hatch.

**Recruiting** needs resistance ≤ 28 *and* regard ≥ 55 — about ten cycles of
sustained attention for an offer at ~31%. A refusal costs regard and makes the
next one harder, so it is a judgement rather than a button. Four doors out of
the cell: hand over (pays, issuer +7), sell back (their outfit pays 1.45×, their
standing recovers, the issuer does not forgive it), let them go (their outfit
thinks better of you, the issuer does not), or a berth.

There is **no adult interaction in the brig** and there will not be one: the
adult layer is gated on two free people and mutual attraction at every rung, and
a prisoner whose resistance you are lowering in order to recruit them cannot
consent to anything. The crew ladder is where that part of the game lives.

### The genome

`js/genome/` is the genome-agent project's 256-gene core, its contextual
expression layer and its decision-graph engine, ported verbatim as ES modules —
same seed → same genome as the source project, so genomes cross between the two.
Nothing in them knows about Living Galaxy. `spacer.js` is the new part: Living Galaxy's own
entity types, race bias, compact codec, and every read the game makes of a
genome.

The engine ships ten entity types, all built for a fantasy bestiary.
`spacer.js` registers two more:

- **`spacer`** — 123 of the 256 gene slots. Every active gene is read by
  something the sim already simulates: watch performance, skill ceilings,
  temperament, who gets on with whom, how they age, what a child inherits. No
  magic, no venom, no wings, no photosynthesis, no corruption — those slots stay
  null, which costs nothing to store and can never leak into a phenotype.
- **`synth`** — a machine that holds a post. The same frame minus fertility,
  hormones, digestion and circadian drift, so a robot runs the same decision
  graph and never courts anyone or gets hungry.

Capabilities are floored per type rather than rolled: a spacer who drew 0.06
manual dexterity would be a spacer with no hands. Presence is by construction
(hands, speech, abstraction); the gene value decides *degree*, which is what the
graph weighs.

**Race bias lands on something the sim simulates.** `races.js` already holds
multipliers the sim honours, so rather than invent a second personality system,
those numbers bend the genome — a race with strong `lock` bends pattern
recognition, one with cheap `life` bends metabolism down, and every skill
affinity bends the genes that skill reads from. The foundry lines (`tsynth`) get
a tighter spread and low mutation: built to a specification, and it shows in the
population.

**The compact codec.** Only the active slots carry meaning, so `packGenome`
writes just those — `p1:spacer:<base64 of 123 bytes>:<checksum>`, 178 chars
against the engine form's 359; `p1:synth:…` is 128. A ledger of 500 people costs
about 90 KB rather than 190, and a checksum refuses an edited payload rather
than silently decoding it.

**Kinship, properly.** The engine's `relatedness()` is a raw similarity — two
unrelated people of the same species already read 0.5, because they are the same
species. `kinship()` measures the species baseline once per entity type (over
fixed seeds, so it is the same number on every device) and divides it out:
strangers 0.01–0.17, half-sibling ~0.37, parent/child ~0.52, full siblings ~0.54.
`KIN_BLOCK = 0.22`; above it two people do not pair off, in the cycle step *and*
in the deck graph's courting branch, whatever the rapport number says.

### CRADLE — the record of everybody

`js/npc/cradle.js`. Every record carries a genome, and the things that used to
be rolled are read off it: the five trait axes, the resting pulse, gender and
who they are drawn to, and the visible tells (height, build, hair, eyes, skin,
voice, low-light sight). Skills are still rank-scaled, but lifted where the body
suits the trade.

Fields: `genome`, `genomeType`, `fingerprint`, `aptitude`, `tells`, `ageCycles`,
`parents`, `kinship`, `journal`, `sex`. `ageCycles` is the life-stage clock —
rank buys years, so an Entry hand reads *prime* and a Director reads *mature*;
only somebody born aboard starts at zero.

**v1 records migrate deterministically.** `ensureGenome()` grows a genome from
the record's own seed — the seed is what made the person in the first place, so
the body it produces is the body they always had; it was simply never written
down. A stripped v1 record and a fresh v2 record from the same seed produce the
*same fingerprint*.

`save()` survives a full device: when `localStorage` refuses the write it sheds
the stored journals of everyone not currently aboard and retries once. A
person's genome and history are worth more than their last twelve watches.
`importLedger()` never loses a genome and merges journals instead of replacing
them — two devices saw different watches.

The CRADLE is **shared through `server.py` and outlives a run**, which caused a
real bug: `stationRoster` skips anyone the ledger marks `aboard` or `captain`,
so every session left more people flagged aboard a ship that no longer existed —
measured, 66 records marked aboard and a hall that should offer six offering
**two**. It believes the flag only about hands who are actually on this ship now.

### The deck: how a watch thinks

Once a pay cycle, every person aboard observes the hull, weighs what they need
against what they are for, walks a decision graph, and lives with the result.

- **`js/crew/deckgraph.js`** — 63+ nodes, 42 actions, 91 edges, 20 of them
  entered from more than one branch (it is a graph, not a tree), 0 validator
  errors. Built with the ported engine, so it gets the same validator, the same
  cycle-safe traversal and the same tracer. Branches: the emergency (boarding /
  battle / breach), crisis, the watch, the mess, own time, rest, other people,
  conflict, grievance, intimacy. Gating is by capability, not by role — a
  synthetic hand never reaches courting because `fertile` is false for its entity
  type, not because a flag said "robot".
- **`js/crew/deckacts.js`** — the effect table. Every terminal in the graph has
  exactly one entry; the suite fails if a graph action has no implementation or
  an implementation has no node, so the two cannot drift apart. Reductions scale
  by efficacy, costs do not: a tired hand pays the same fatigue for a watch and
  gets less out of it.
- **`js/crew/deckmind.js`** — the loop. Nine needs (`fatigue hunger social stress
  intimacy play grievance purpose upkeep`), each rising at a rate set by that
  person's genes and saturating rather than pinning, so a need that nothing is
  being done about can still lose an argument. A need nobody can meet is not
  free: somebody with no one to be close to, or nothing worth doing, comes off
  the watch a little worse each cycle. `buildContext(m, { peek: true })` reads
  a hand without living a watch for them (0.3.53 — the GENOME sheet used to
  drift every need on each repaint).
- **`js/crew/orders.js`** (0.3.53) — the captain's side: an order per need,
  run through `stepHand` with `{ order }` so it is a real watch (effect table,
  efficacy, journal record, learning) with the graph not consulted; HEAR THEM
  OUT on a grievance (`HEARD`: 0.35 less for five watches); TRAIN
  (`m.trainFocus`, study capped at the aptitude ceiling); ENCOURAGE / CURB on a
  learned habit (`learn.js` `coach`).
- **`js/crew/hull.js`** — the seam. A **hull** is whatever a watch is stood on,
  so the graph, the effect table and the journal go through it rather than
  reaching into `sim.ship` directly. That is what let the rest of the sky have
  crews at all:

| | player's hull | an NPC vessel |
|---|---|---|
| roster | `crew.aboard` | `v.crewList` |
| backlog | `duties.wear` | `v.wear` |
| rooms | the generated deck plan | named from the hand's trade |
| rota | `crewfx.shiftPhase` | split off the member id |
| alarm | boarding / breach / your own firefight | battle / breach |
| payroll | real | cycles off the board |

Everything the crew system already had stays where it was: `duties.js` moves
wear every two seconds, `crew.js` steps rapport and pays wages, `bonds.js` rolls
rivalries. Deckmind sits on the same `crewHooks.cycle` and adds the part that was
missing.

### The journal

`js/crew/journal.js` writes one full record per decision, in the shape
genome-agent writes, re-pointed at a hull: surroundings are the room and the
hull's state, holdings are wages owed, know-how and watches stood, and the world
that gets marked is the ship.

```
{ cycle, at, simTime, sky, hull, agent{id,name,species,stage,genome},
  observedSurroundings { room, roomKind, docked, port, underway, alarm,
                         hullState, present[], crewCount, perceptionClarity },
  observedSelf         { vitals, needs×9, phenotype, tier, holdings, stage, age,
                         alertness, comfort, limitingFactor, dominantDrive,
                         driveStrength, phase, threat },
  action               { id, label, kind, node, efficacy, blocked, blockedReason, target },
  whatMadeMeActThis    { path[], reasoning[], decisionDepth, crossLinksUsed,
                         alternativesConsidered[{option,probability,rationale}] },
  effectOnSelf, effectOnHoldings, effectOnOthers[], effectOnShip, summary }
```

Nothing is narrated after the fact. The record is written **from** the decision —
the trace the graph left, the deltas actually applied, the hull diffed before and
after — so the journal cannot drift from what happened. Every number is rounded
to 3 dp at write time.

Storage is deliberately asymmetric: **everything** in a 400-record session ring
in memory, and the last **12** in full on the CRADLE record, so a hand you signed
off at Foundry Hold turns up at Kessler Reach two skies later still carrying the
row about the night they stopped speaking to the cook. `exportJournals()` writes
the lot — every person, their genome, lineage and filed records — and
`importJournals()` reads it straight back.

### The deck brain

`js/npc/brain.js` already taught an NPC captain how to fly. Nothing taught
anybody how to *live* on a ship — and the journal was already writing the
training pairs. `js/crew/learn.js` is the same net, generalised (`createNet`,
backward compatible with every brain already on a ledger), over a different
question: nine needs, morale, the hull and the room in; nine categories of
thing-to-do out.

Trained **purely by outcome**, from the deltas the effect table actually applied,
against the person's own running average — an uncentred reward pushes every
category up and leaves the net flat. Measured over 90 watches: `social +0.29`,
`rest +0.22`, `study +0.18`, `duty +0.16`, `idle −0.26`, and different hands end
up believing different things.

It is a **prior, never a decision**: every `select` in the graph has its weights
bent by it, clamped to ×0.55…×1.8 and scaled by how much the person has lived
through, so a brand-new hand behaves exactly as they did before the net existed.
Weights ride in `rec.deckBrain` alongside the conn core. Work also earns
**standing with the captain** (`trust` on every duty action, spent by slacking),
which is what keeps a learner from concluding that the mess is always the better
option. `trainingCorpus()` writes the whole thing as JSONL — observation, label,
reward, reasoning, summary — for the llama.cpp side.

### Crews on every hull

`js/npc/npccrew.js` puts people on all ~160 vessels in `npc/traffic.js` and
`npc/flow.js`, deciding through the same graph. Three things keep it affordable
on a phone: crews are **built lazily, nearest first** (a hull you have never
scanned has no crew until it needs one); they are **not filed** (grown from a
deterministic seed and kept in memory — only somebody who *does* something, like
deserting, mutinying or being hired by you, is promoted into CRADLE, because 600
provisional strangers would be ~950 KB of localStorage nobody asked for); and
there is **a fixed work budget** of 18 full-graph steps a cycle, round-robin so
nobody stays abstract, with the rest drifting on a cheap model that moves the
same numbers. Measured: 30 cycles of the whole sky in ~90 ms.

What a soured watch does, in order: the hull stops earning → **pay falls
behind** → wear climbs because nobody is working the backlog → a hand **walks
off at the next port** (and is in that station's hiring hall when you dock) →
the watch **strikes** and the vessel comes off the board → a pirate crew below
the line **mutinies** and the ship changes role → the last hand off leaves a
**hulk**. Mood also feeds `v.crewCaution` and `v.crewFight`, and `vesselStatus`
gains a crew tag the SHIPS directory reads without `traffic.js` knowing crews
exist. **CONSOLE › CREW › SKY** shows nearest crewed hulls, watch mood, hull
backlog, whether they are being paid, and — inside sensor range — the last
decisions their deck filed, plus a band log of strikes, desertions, mutinies and
hulks.

### Talking to your crew

Tap a hand in the ship interior (or CONSOLE › CREW) and the dialogue tree is
theirs: *how's the watch*, *tell me about yourself* (race, origin, pronouns, who
they are drawn to), *good work* (trust up), *bonus* (100 cr, trust and morale
up), *sharpen up* (morale down — and their partner notices), their partner, their
children. Every hand has **trust** toward you, separate from morale.

Three topics come to TALK from the other direction (`js/crew/talk-wants.js`),
sorted to the top of the list because a flagged grievance should not be three
taps down a list of small talk:

- **⚑ They want a word** — a grievance (wages, named to the credit, or the state
  of the hull) or something they will not put in the log. Hearing them out buys
  trust; settling the shortfall clears it; brushing it off costs trust and the
  grievance stays. Unpaid wages are a grievance on their own, and a grievance has
  its own way into the graph (`grievance.entry`, reachable from the watch, the
  mess and quarters) rather than hanging off `social.entry` and needing company
  in the room.
- **How's your watch been?** — reads their last filed decision back in their own
  words, and *what they nearly did instead*.
- **You two are related** — when the registry says somebody aboard is family,
  they know, and you can put them on the same watch or keep them apart.

**Conversations carry on** (0.3.17). Every topic in the tree runs two or three
turns: the hand answers *and* carries it on, and your next options answer what
was just said — *what needs fixing* asks where you want them to start, *where
are you from* asks whether you send word home, *what do you want out of this*
asks to put a slice of each cycle aside. The end of a thread files what was
said, and a later conversation picks it up (`js/crew/talk-threads.js`, labels
marked **↻**) reading the ship as it is *now*:

| you said | later |
|---|---|
| "I'll help you get there" → "I'll match it" | the fund grows a tenth of their wage a cycle and the ship pays the match (or misses it, and they notice); ↻ names the real balance |
| "I'll talk to (the low hand)" | ↻ how they're doing — better, the same, or worse, off their morale since |
| "On the cycle, every cycle" | a short payroll brings ↻ back with the real shortfall; five clean cycles earn a thank-you |
| "Ten more cycles aboard" | ↻ ten cycles on, the raise comes due |
| "Watch the reactor for me" | ↻ reads the real maintenance backlog |
| "Keep the tally" | ↻ counts what's actually in your lockers across ports |

…and the survey marker, the night off, the kid at the board, the story they
told you, the mate you told them to make it up with. The greeting says when
somebody has something to pick up. One id is one topic: family.js's *How's the
watch?* stands aside while the richer *How's your watch been?* is on the board
(both were `watch`, and the tap ran whichever the lookup found first).

**Scenes** (`js/crew/beats.js`, marked **▶**) are the other half — stand a
watch, share the mess, ask what they're carrying, walk the port, ask to
dinner, an evening off the clock. A scene is a few stages written to follow one
another, and **each one waits on your answer**; the bar moves when you answer
and not before, and *Let it drop* walks away with nothing applied. What you say
leans the odds (every answer carries a `lean`, taken off the roll the scene's
resolve makes), so how you handled it is part of whether it lands. It ends in a
buff (trust / morale / spark) or a debuff. Only one runs across the whole crew
at a time: one captain, one conversation. An addon's beat that only has lines
plays them one "Go on" at a time.

The openers still come from a generated voice bank (`js/crew/voice-bank.js`,
`js/crew/voice.js`, built by `tools/gen-voice-bank.py`), **sampled, not
shuffled**, so the seed decides repetition — greetings seed on the cycle, so a
hand does not recite a new line every time the panel repaints. The scenes and
the follow-ups are written, not sampled, because a line that has to follow the
one before it cannot be drawn from a bag.

### Three tracks

`js/crew/tiers.js`. The deck runs three relationships and for a long time only
one had a vocabulary. A bare 0–100 number is a readout of a relationship, not
one:

```
FRIEND   wary → civil → shipmate → friend → confidant → sworn
MORALE   broken → sullen → steady → willing → high → fireproof
ROMANCE  strangers → noticed → interested → courting → together → bonded
```

Each rung has **hysteresis** (4 points), so a hand who has just become a friend
does not flicker back to shipmate on one bad watch. All three print on every
roster card.

They are load-bearing, not labels. `talk.js` had its own four-name ladder
(stranger/hand/confidant/friend at 0/25/50/75); that is gone, and the tree's
`tier: 0..3` names a rung on the **one** ladder. Nodes can also declare a
`need` — so "what keeps you up?" wants a steady mood, "stay on after this
contract?" wants a willing one, and "could you hold the conn?" wants a confidant
who is not sullen. A hand below the bar has an answer; it is just not that
answer.

### The romance ladder

`js/crew/romance.js`. There used to be one rung: rapport crossed 55, a die came
up, "official aboard". Now every rung is earned by something that happened on
the deck and is in the journal for it — a watch stood side by side, an ordinary
mess shift, a walk out at a port, a gift, something said in confidence, a row
mended. **Mutual attraction is a hard gate at every step**, not a coin flip at
the end; attraction is genome compatibility, what their watches have built, and
whether either of them is in any state to want anything. Close kin never start
the climb (`KIN_BLOCK`). A row costs spark; enough of them cost a rung. The last
two rungs are decisions — `PROPOSE` and `BOND` (at a port, in front of the
watch) — not thresholds.

Eleven actions in the graph: `NOTICE_THEM FLIRT GIVE_GIFT WALK_OUT CONFIDE
PROPOSE BOND PRIVATE_TIME JEALOUS_WORDS BREAK_OFF`. Ten everyday actions —
talking, eating together, cards, venting, mending a rivalry — also move a pair's
spark, so a relationship grows out of an ordinary evening rather than out of a
"romance mode". **Triangles** are a shape the graph reads and can act on;
**break-ups** happen when a couple is low and the spark has gone.

**Your identity** is on the CREW tab: gender and pronouns, who you are drawn to,
and the house rules — ROMANCE (off / crew only / all, meaning you too) and
FAMILIES. Outcomes are gender-specific by design: *ask them to dinner* only
works when the interest is mutual on paper, trust is there, and neither of you is
with someone; otherwise they decline in their own words. There is one door for
pairing with the player — `pairWithPlayer(m)` in `js/family.js` — which honours
`couldCourt` (mutual attraction, not kin, trust ≥ 55) and writes the ledger and
the log; both the TALK topic and the dinner beat go through it.

**CONSOLE › CREW › BONDS** shows THE LADDER: every pair with anything between
them, the rung, the spark, the draw, whether they are kin, the odds of a child a
night and the fertility behind it — and the pairs who are simply close and were
never going to be anything else, because hiding those made the panel read as
broken.

### Private evenings, and the addon

**Private evenings** in HOUSE RULES is off by default and is **fade to black
only**. It adds a rung for a couple who have a berth with a door to spare; that
step moves the ladder, morale and rapport, and rolls for a child. *Nothing in the
core depicts anything*, with the switch on or off, and **no explicit text lives
under `js/`**.

What the switch actually models is consequence: **privacy** (a spare berth — so
the quarters refit matters), **whether they are trying** (a contraception
toggle), **fertility** from the genome (`FERTILITY`, `GAMETE_QUALITY`) on a curve
across a life rather than a cliff, who carries and who sires, **twins** from
`LITTER_SIZE`, and the pregnancy filed on `household` exactly as before — so
gestation, birth, the real crossover heredity and the crèche are unchanged. With
it off the crew still pair off, still bond, and still have children through the
ordinary household path.

All 18+ lines and bed/try-for-child acts live in **`addon/adult/`**, separately.
`js/addon-loader.js` imports it if the file exists; a missing folder is not an
error. Delete `addon/adult/` to strip the pack — HOUSE grows an **18+ scenes**
chip only when the pack loaded. The core has been probed in a real browser both
ways.

### Families, children and the house

**Conception.** Partners aboard (a pair of hands, or a hand and you) may conceive
when FAMILIES is on and both are settled in: one carries, one sires (nonbinary
hands roll which from their seed; synthetics never). A pregnancy runs six cycles;
the child is a CRADLE record with both parents, a race from one, a berth (two
children share one) — and a **real crossover genome**: `conceive()` in
`js/family.js` does block recombination, dominance where the parents' genes say
so, gaussian mutation scaled by their own mutation genes, and a lineage stamp.
The five axes, the pulse, the identity and the tells are read off the result
rather than blended by hand — a child's caution is inherited because the genes
for it were.

**Raising them** (`js/crew/children.js`). `inheritance(child)` says what they
got, named, measured against the parents they got it from — a boon is not "the
genome rolled high", it is "this is better than **both** the people it came
from", which is the only comparison a parent would make. Plus each parent's
measured share (`kinship`, so ~37% and ~37%, not an assumption), kin aboard, and
the house. Four things a captain can do — stand the watch with them, teach them
the trade, put them on the terminal, let them shadow a watch — each moving a bond
that follows them into the hall and, where it applies, a real skill capped by
their own aptitude. `comeOfAge()` turns the description into a number: +4 in a
skill they beat both parents at, −3 in one they came in under both at, filed on
the record as `inherited`. A child raised to 55+ bond comes of age saying the
berth they want is this one. It all renders as a card in CONSOLE › CREW › BONDS.

**Talking with them** (`js/crew/childtalk.js`, 0.3.57). Eight things you can say
to a child — how are you doing, what did you learn, how are your parents, what
do you want to be, look out the port with me, a story, I'm proud of you, a
rule — and each is answered by who they are: little (under 6 cycles), a child,
or a teenager (16+); their temperament; what they have actually been taught;
their parents, aboard or gone; the bond you have put in; and where the ship is
(docked, the window is that port). A topic moves the bond once a watch. Every
few watches a child brings YOU a question — why the stars move when we turn,
can I fly the ship, where do people go when they die, why the grown-ups get the
good ration packs, why can't I sign on somewhere else, can I have a real watch
— with three answers; the answer moves the bond, and an honest one to a curious
child teaches a point, never past what the body can carry. And the grown-ups:
each watch a parent (or a hand) may do something with a child — reads them the
docking manual doing the voices, lets them run the pre-flight checklist, loses
an argument about the rota — into the crew log, and one time in three a point
of that adult's trade sticks.

**The house** (`js/crew/heritage.js`). Three generations of miners is a family
with rock in it, and **every complex works this way**, not just the drills. Two
parents in the same complex make a house; the child is the next generation of it,
born into the trade, and carries out of it: **taught** (starting skills, from
what the parents actually knew, scaled by the generation — 34% at the second,
+8% a generation, capped — and by the child's *own* aptitude, because a house can
teach but cannot make a body good at something it is not built for); **learn** (a
multiplier on how fast that career's skills go in afterwards, up to ×1.85 at the
fifth generation, read by STUDY and MENTOR); and **rank** (a child of the trade
walks into a hiring hall a rung or two above the bottom). A mixed house leans one
way deterministically from the child's seed and keeps the other as a smaller
second inheritance; two parents with no trade between them pass on no trade.
Measured over five generations of miners: taught geology 44 → 26 → 37 → 40 (the
dips are the children whose genomes had no head for rock), learn ×1.30 → ×1.48 →
×1.66 → ×1.84.

**Room.** When the household outgrows the hull (berths over capacity, the CREW
tab says so), settle a family at a port — the hand, their partner if crew, and
their children go together:

| | What happens |
| --- | --- |
| **SETTLE** (needs a company) | They go on the company's books at that port. Every cycle the company earns 32% of their list wage (45% before 0.3.47) plus a stipend per child. RECALL at that port brings the hand back aboard. |
| **PAY OFF** | Three cycles of wage as severance. They are released and *recorded*: the company's contacts list keeps their name and the port they were last seen at, the CRADLE keeps `lastContact`, and the port's hiring hall will show them again. |

**Berths** come from one place: `crewCapacity()` in `sim.js`, which is the hull
stat plus `upgradeFx("berths")`. The hiring hall used to read the hull stat
directly with the refit nowhere in it, while the robot yard read the composed
number — so buying berths changed nothing in the hall but still fitted a frame.
`robotCapacity()` sits on top and adds the frame-racks refit's slots, which do
**not** eat a crew berth.

### Station life

`js/stationlife.js`. A settled hand used to be a row in a ledger that produced a
number every cycle and never did anything else.

Every cycle, each settled member has a weighted chance of something happening,
and who they are and what kind of port they are on decide what: **promotion**
(five roles, each rung wanting a dozen more cycles served than the last),
**commendation**, **windfall**, **marriage**, **birth**, **feud**, **strike**,
**firing**, **industrial accident**, **an incident the port closes the file on**,
**transfer**. Nothing is decoration — each moves the treasury, the standing, the
board's confidence, or the rolls themselves. A cautious hand at a military port
is commended; a greedy one at a pirate hold is the one who goes missing. Deaths
are rare and cost the board's confidence and every colleague's mood.

**A pregnancy carried ashore.** `settleFamily()` used to delete a pregnancy when
its carrier took a berth. `carryPregnancyAshore()` hands it over instead: the
child is still coming, it is just coming somewhere with a hospital. It is born at
the port with a real crossover genome, grows on the station clock, and at 36
cycles goes on the rolls **as family** — no hall, no signing fee, its parent's
complex, and a share that starts above a stranger's.

Read at CONSOLE › CORP › **TOWN**: everyone by port with their role, household,
mood and whether they are about to walk, and the town log. Measured, 6 hands
settled at an industrial port over 200 cycles: marriages, births, seven children
come of age onto the rolls, promotions, feuds — **6 on the rolls → 14**.

**The company line** (`js/staffline.js`, 0.3.46). Settling somebody is not the
last time you speak to them. Every member of staff in this sky is on the line
from anywhere — CORP › TOWN, LINE on their row (or LINE beside them in a port's
HALL). A call reads their actual life back to you — role, cycles, mood,
partner, children, a baby due — and every topic moves the number it names:

| Topic | Does |
| --- | --- |
| HOW ARE THINGS? | the report; +2 regard once a cycle |
| SEND A BONUS | 3 cycles of their income from the treasury (pocket if it is dry); mood +12, regard +5; 3-cycle cooldown |
| RAISE THEIR CUT | they keep 10% more of the share (max three); mood +6, and +4 to the mood their port pulls them toward, for good |
| PUSH FOR PROMOTION | 5 cycles of income; wants 8 cycles served a rung (the rolls want 14) and mood 55+ |
| HOW'S THE FAMILY? | partner, children by age, the one on the way |
| MOVE THEM / COME OUT TO THE SHIP | passage (180 cr + 40/Mm, 45 s + 30 s/Mm) to a company port or to where you are docked; no income on the liner; they call when they land and the HALL has them for RECALL |
| LET THEM GO | severance (3 cycles of list wage), address kept — two taps |

**Regard** is the new number: seeded from their trust aboard when they settled,
it adds `(regard − 50) × 0.22` to the mood their port drifts them toward, so a
hand who trusted you settles happier and one who did not needs looking after.
**They call you**, too: the rolls' events (promotion, wedding, birth, a feud, a
strike, an accident) land in THE LINE as a message from the person, and a
member under mood 48 asks for something — a bonus, a raise, a move — with those
answers on the row. Three cycles unanswered costs 5 mood and 6 regard. The
towns (households, children, the town log) and the inbox ride in the
`lgaa-company` save — before 0.3.46 a reload lost every marriage and child.

**Port standard time and a working day** (`js/stationclock.js`,
`js/stafflife.js`, 0.3.52). Every port keeps the same clock: an hour is 30 s of
sky time, a day 24 hours (12 minutes at ×1), a pay cycle three hours, a week
seven days, day 1 opening at 06:00. It is on the title bar and in the station
deck's header. Each settled hand has a **job** at their port (by sector — the
smelter line, the cross-dock, the clinic, the grow ring), a **shift** (day
06–14, swing 14–22, night 22–06), **hours** (standard 8, overtime 10, part 5)
and **housing** (bunk free, cabin 12 cr/cycle, family quarters 30). Their day:
the shift, a meal, their own time (at home with a partner and children if they
have them), supper, eight hours asleep. **Needs** — tiredness, hunger, company
— move with what they are doing and lean on mood every hour. **Pay** is a 30%
retainer each cycle plus the rest for the hours worked, at a productivity read
off mood and tiredness; a standard day averages the old share. Each hand on
shift adds 3% to their port's production lines (max 30%). The rolls' events
lean on the hour — accidents at work, births at home — and a strike puts a
shift on the picket line. HALL › ON THIS FLOOR and CORP › TOWN show what each
person is doing now and their day log; calling someone at 02:00 wakes them.

**What you can do about it** (0.3.53). A settled hand's card — HALL › LINE on
the deck, or CORP › TOWN › LINE from anywhere — carries WORK · HOME · CARE
(`js/staffcare.js`): change their job, shift (nights +15% an hour, swing +5%)
or hours; move them out of the bunk room (cabin 12 cr/cycle, family quarters
30); give them a DAY OFF (their next shift, unpaid, once a day), STAND THEM A
MEAL (8 cr), A NIGHT OUT (30 cr), or SEND THEM ON A COURSE (4 cycles of their
income; their next shift is a training day and each course makes an hour of
their work worth 6% more, three at most).

Aboard, CON › CREW › GENOME has an **order** for every need
(`js/crew/orders.js`) — STAND DOWN, MESS CALL, SHARE A MEAL, EASE OFF / SHORE
LEAVE, TIME WITH / WRITE HOME, REC TIME, HEAR THEM OUT, GIVE A GOAL, CLEAR THE
BACKLOG. An order is a real watch through `deckmind.stepHand` — the effect
table, efficacy from their genes and how tired they are, a LOG record, a step
of learning — one a watch. TRAIN points their study at a skill, capped at the
body's aptitude ceiling; + / − on a LEARNED habit coaches it.

### Robot crew and refits

Robots are ROBOTGEN-built units per role (deckhand, engineer, medic, steward,
marshal, signals, line hand), deterministic per port, bought from the Robots tab
on a yard's deck. No wage, no morale, no romance, cannot hold the conn; they draw
kW on the bus, wear with the backlog, idle under 30% condition, and are serviced
by an engineer or SERVICE ALL at a yard. They persist per sky.

**Refits** (`js/upgrades.js`, MARKET › REFIT or the port deck's Refit tab) are
**39** purchasable upgrades with sector gating and 50% sell-back. All **16** hull
mod keys are on the table — `lock`, `gTol`, `heat`, `standing`, `blame` and
`menace` had never been purchasable at all — plus **23** distinct non-mod
effects, each wired to exactly one read site:

| effect | what it does | where it lands |
| --- | --- | --- |
| `berths` · `robotSlots` | crew capacity, and frames that are not berths | sim.js `crewCapacity`/`robotCapacity` |
| `repair` | hull points a cycle, either way | sim.js `tickHullRepair` |
| `crewWage` | payroll discount | crew.js `crewWageTotal` |
| `dropout` | core dropout odds in a lane | sim.js `stepWarp` |
| `assist` | RCS authority behind the avoidance | ship.js `stepTranslation` |
| `resolve` | how fast a contact resolves on the nose | contacts.js |
| `probeRange` | remote-scan reach | probes.js |
| `smelt` | what a smelter gives back | sim.js `smeltAll` |
| `social` | how fast shipboard bonds move | crew/tiers, romance |
| `learn` | how fast the conn learns you | aria.js / captain.js |
| `assay` · `medbay` | gate the survey card and births aboard | nav panel, family.js |

Four pairs are mutually exclusive, so a refit is a decision rather than a
shopping list: bloom regulator vs coil, phased array vs mast, multi-head cutter
vs lens, ghost transponder vs civil.

### Work drones

`js/drones/roles.js` is the catalogue, `ops.js` the behaviour. Nine roles, built
only at a port whose sector has that line:

| Role | Built at | Asks on roll-off | Does |
| --- | --- | --- | --- |
| Miner | industrial, claimed hold | home, start location | cuts belt rock at the site; full → waits for its hauler, else flies home, docks, stashes, goes back |
| Hauler | logistic, industrial | home, orders | passive: slot under one of your miners, else best NPC freight (14% of the buyer's bid); manual: you pick from the slot list |
| Combat | military, claimed hold | home, orders | passive defend around home · guard a slot (your ship, a drone, a port, a mark) · patrol points you set; answers relay alerts |
| Salvager | industrial, claimed hold | home, orders | works one site or chases fresh wreckage; stashes the plate |
| Surveyor | civilian, logistic | home, start location | sweeps out to 120 km, marks rich veins on the chart, offers to send a miner; big strikes go to GNN |
| Harvester | agricultural, industrial | home, orders, start location | ice: melts frost-pocket rock to water/methane/…; gas: skims a giant for hydrogen (sometimes He-3) |
| Courier | logistic, civilian | home, orders | auto: best margin near home on your account; route: a pair you pick |
| Relay | civilian, logistic, military | home, start location | parks and watches 30 km; raiders → chat alert with a mark, combat drones answer |
| Repair | industrial, military | home, who to look after | follows a ship/drone/port, patches hull from a charge it refills at home |

- Price = robotgen parts cost × `PRICE_K` (0.1), clamped 800–14,000 cr. A starter
  miner is ~3,000. One drone on a port's line at a time; cap `DRONE_CAP` (10)
  per sky.
- A drone rolls off in `setup` at its build port and posts in chat with a
  "Set up" link; docked there, CONSOLE › WORK › DRONES opens on it. Home defaults
  to the build port. `beginWork` takes defaults for anything unanswered.
- Runs on sim time in 0.5 s substeps (TIME ×8/×40 fast-forward it). Legs over
  16 km take a 30,000 u/s micro-warp, over 800,000 u the 55,000 u/s warp.
- Raiders inside 1.4 km wear a drone down; below 35% it limps home; at 0 it is
  lost and reports where (Mark wreck). Docked drones repair at 5%/s.
- Combat inside your contact range fires real `station`-faction rounds
  (`pdrone-<id>` owner → `noteDroneKill`); out of range the fight resolves on the
  numbers (7 dps vs 120 hp), bounty 300 cr, GNN security desk post.
- Rendered as robotgen machines (`droneforge` kinds = role ids) with labels
  `▹ NAME · note` and a cutter beam while mining.

**Drones are company property**: `buildOptions` blocks without a charter
(`hasCompany()`), the yard bills the treasury (`treasuryPay`), and freight,
bounties, a courier's trades and decommission refunds land in the treasury
(`treasuryEarn`), on the company book.

**`js/drones/board.js` is one work board**: `openFreight()` lists slots nobody
holds, `claim/touch/release` track who has what (claims expire in 15 min of
silence, so a dead drone frees its job). Your haulers, the corporations' drones
and — through the same calls — fleet hulls share it.

**`js/drones/npcdrones.js`**: every corporation with a port fields a small line
(`DRONE_LINE`, 0.3.59): majors a miner, a delivery hauler while the sky has
fewer than three (a guard after) and a repair drone; alts a miner and a guard;
holds a gun drone circling the port as a hostile contact that shoots inside
900 u. Miners deliver to their port's shelves; the three haulers are a freight
line on the board, local first and then anywhere. An honest port's **guard**
puts rounds on anything hostile within 3.5 km of its port (the kill is the
port's); its **repair drone** patches your hull within 2.6 km of the port when
you are undocked, 20 s out of a fight and not in bad standing. Same roles,
holds and speeds as yours; rendered as robots in the port's livery, labelled
by flag.

**Drones vs crewed hulls**: miner 36 / hauler 80 / salvager 48 / harvester 42 /
courier 30 units of hold (a crewed hauler carries hundreds), 36,000 u/s on the
lanes vs 30,000, 4 s on the clamps vs a crew's walk-off, and no need to eat,
sleep or be paid — but one raider inside 1.4 km and they are gone.

### GNN and the chat bus

**GNN** (`js/gnn.js`, `js/stations.js`) is one `GNN <Word> Station|Relay` per
sky, civilian berths, relay archetype, on its own seeded draw (`<sky>:gnn`) so
the other ports keep their seeds. `gnnPost({ desk, title, body, actions })`
archives on the desk and posts to chat channel `gnn` with links — `GNN desk ·
<station>` opens CONSOLE › CORP › GNN, or the station's own GNN tab when docked
there — plus up to two actions. Bulletins are auto-accepted: they never ring the
comms puck. Desks: news (impacts), markets (droughts, bonds, shortages), security
(engagements, outcomes), contractors (your drones' kills and strikes).

**The chat bus** (`js/chat.js`) is `post({ channel, from, text, links, tone })` →
`onChat(fn)` / `recent(n, channel)` / `follow(msg, i)`. Channels: local (the
speech band), gnn, drones, you, sys. The chatbox in the glass HUD is the surface;
the console's channel log lists the last 30 with their links.

---

## The generators

Five standalone projects feed the game. Each is vendored as-is under `js/` and
reached through one thin adapter, so a generator can be upgraded by dropping a
newer tree over its folder.

| Generator | Vendored at | Adapter | What it drives |
| --- | --- | --- | --- |
| NEWSHIPGEN | `js/shipgen/` (verbatim) | `js/shipforge.js`, `js/hullspec.js`, `js/shipcost.js`, `js/hullpool.js` | every hull: yours, traffic, flow boats, peers, the shipyard |
| STATIONGEN | `js/stationgen/` (verbatim + perf patches) | `js/stationyard.js`, `js/stationworks.js` | every port: hull, hangar mouths, lanes, mounts, works |
| ROBOTGEN v1.7 | `js/robotgen/` (verbatim) | `js/dronespec.js` (data), `js/droneforge.js` (meshes) | remote drones: port interceptors, free-port gun drones, your probes, crew robots |
| NPCSPEECHGEN | `js/speech/npc-speech.js` (one-phrase fix) | `js/npc/speech.js` | the open channel and TALK on hailed hulls and ports |
| asteroid-generator v1.01 | `js/asteroidgen/` (verbatim + `ores.js`, two generator parameters) | `js/bodygen/`, `js/rockfx.js`, `js/impacts.js`, `js/impactfx.js`, `js/holefx.js` | grown rocks and rogues, rubble, ice clouds, shatter, impact break-ups, the black-hole lens and tidal disruption, the survey card |

### The ship generator

Everything that builds a ship, and nothing that was the yard around it. Vanilla
ES modules, no build step, no npm; the only external dependency is `three`.

In LIVING GALAXY the package's `src/` contents live **directly at `js/shipgen/`** (there
is no `src/` wrapper, no `tools/` and no `demo.html` — the headless harness moved
to `test/shipgen/`), and nothing under `js/shipgen/` was modified:

```
js/shipgen/
  index.js              public API barrel — import from here
  generate.js           buildShip() facade + DEFAULT_CFG + randomConfig()
  anim.js               idle animation: plumes, spins, pulses, gimbals, lamps, sensor sweeps
  core/                 rng.js (seeded), geometry.js (shared geo/material factory, finishes)
  builder/              StarshipBuilder + its geometry passes
                          hull, drives, weapons, glazing, docking, placement, details, faces
  prefabs/              the 3D part meshes, by family (structure, power, acs, sensors,
                        docking, industrial, weapons, internal, extra)
  data/
    classes.js          19 ship classes: proportions, doctrine, regime, nose, arms
    drives.js           drive families and plume behaviour
    weapons.js          weapon families
    palettes.js         faction liveries
    loadouts.js         doctrine → parts-list rolls
    environment.js      sun direction / face exposure (drives radiator + solar placement)
    flight.js           DESIGN_REGIMES (a hard builder dependency) + analyzeFlight/optimizeDrag
    materials.js        raw materials and components
    bom.js              part → component → material bill of materials
    catalog/            the 346-part catalogue, 21 numbered sections
  ops/
    host.js             *** injection point: bind your scene here ***
    rig.js              index of what's mounted on the current hull
    ops.js              live systems: fire control, mining, docking, deployables, RCS, scans
    fx.js               transient effects: tracers, beams, missiles, flak, chunks, sparks
```

**Wiring.** `three` must resolve as a bare specifier. The generator's own README
suggests a CDN import map; **LIVING GALAXY does not use one** — `index.html` and
`shipyard.html` map `three` to `./vendor/three.module.min.js`, and
`test/three-register.mjs` gives Node the same mapping. Nothing in the package
imports `three/addons/` — the addons entry the yard needed (OrbitControls,
post-processing) went out with the scene layer.

```js
import { buildShip } from "./shipgen/index.js";
const ship = buildShip({ seed: "NX-4412", shipClass: "cruiser" });
scene.add(ship.root);
```

`buildShip(opts)` returns:

| field | what it is |
|---|---|
| `root` | `THREE.Group` — the hull, ready to add to any scene |
| `builder` | the `StarshipBuilder` instance: `size`, `occ` (collision boxes), `mounted`, `docks`, `mats`, `aero` |
| `cfg` | the fully-resolved config, including the rolled `loadout` |
| `anim` | animation registry for this hull (pass to `tick`) |
| `stats` | class, drive, regime, part/lamp counts, dock kinds, weapon names, plus `flight` and `bom` |

Every option is optional; see `DEFAULT_CFG` in `generate.js`. The useful ones:
`seed`, `shipClass`, `driveType`, `weaponSuite`, `designRegime`, `scale`,
`lengthBias`, `beamBias`, `complexity`, `armDensity`, the livery colours,
`finish`, and the boolean toggles (`weapons`, `sensors`, `scanners`, `mining`,
`docking`, `wings`, `greeble`, `lights`, `windows`) which prune the doctrine
loadout. Pass an explicit `loadout` (`{ partId: count }`) to skip the doctrine
roll entirely. Builds are deterministic: same seed + config → identical geometry,
every time. `releaseShip(root)` before dropping a hull frees the materials it
cloned; `randomConfig(seed)` gives a plausible random ship for fleets and
background traffic; `buildShip({ analyze: false })` skips the flight + BOM pass
when you are spawning many.

**Animation.** `anim.js` is a registry over the `userData` markers the builder
writes, with zero dependencies. `tick(ship.anim, dt, t, { throttle: 0.8 })` once
per frame; `ctx.throttle` (0–1) drives plume length, opacity and glow. Pass
`{ aim, aimAngles }` and turrets slew onto the aim point instead of running their
idle patrol arc. Each ship gets its own registry (`buildShip` already does);
`newRegistry()` and `collectInto(reg, root)` are exported for hulls you assemble
yourself.

**Live systems.** This layer used to reach straight into the yard's scene and its
global builder; it takes both by injection now.

```js
import { setOpsHost, opsBind, opsUpdate, ops } from "./shipgen/index.js";
const fxRoot = new THREE.Group();            // effects live here, not in your main graph
scene.add(fxRoot);
setOpsHost({ scene: fxRoot, toast: (msg) => hud.say(msg) });   // toast is optional
opsBind(ship.root, { builder: ship.builder });  // after each build
opsUpdate(dt, t);                                // once per frame
```

Then drive it through `ops`: `ops.throttle`, `ops.firing`, `ops.mining`,
`ops.docked`, `ops.deploy`, `ops.rcs`, `ops.showColliders`. `startMining()` /
`stopMining()` and `doScan(t)` are the two calls with setup work behind them.
Weapon behaviour comes from the part's own `turret.kind` / `launcher.kind`, so
the full set survived the extraction: beam, rail, coil, plasma, PDC, three-round
auto bursts with ejected brass, proximity-fused flak, particle, CIWS lance — and
the launcher ammo types torpedo, KKV, nuke, EMP, cluster, chaff, mine, plus the
default HE missile. `opsBind` spawns a target drone and a mining ore body into
the bound scene and adds a hidden collider-box group to the hull; both are
transient and the next `opsBind` clears them.

**Bill of materials and flight.** `ship.stats.bom` is
`{ massKg, fasteners, materials{}, components{} }`; `ship.stats.flight` is
`{ mass, cd, dragArea, beta, isp, thrustN, tw, staticMargin, lifetimeDays, notes }`.
Both are callable directly — `shipBom(builder, PARTS, drivePart)` and
`analyzeFlight(builder, regimeKey)` — plus `partBom(part)` for a single catalogue
entry and `optimizeDrag(...)` to search proportions for a lower-drag hull at
equal volume.

**What was removed from the source project**, with nothing left importing them:
`app.js`, `main.js`, `state.js`, `inspect.js`, `scene/scene.js` (renderer,
post-processing, starfield, lights, cradle), all of `ui/` (drydock, catalog
browser, ops panel, DOM helpers), `traffic.js` + `traffic/sim.js` (the spectator
lane), `index.html`, `traffic.html`, `css/`, `legacy/`, and the page-level tests
that drove a fake DOM. Everything the generator needed from them was either
inlined into `generate.js` (config defaults, loadout filtering, stats) or turned
into the injection point in `ops/host.js`. Three modules changed and everything
else is byte-identical to the source repo: `ops/fx.js` (scene import →
`fxScene()`), `ops/ops.js` (scene, builder and toast → `host` + `rig.builder`)
and `ops/rig.js` (gained a `builder` field). New: `generate.js`, `index.js`,
`ops/host.js`.

### Stations

`js/stationgen/` is **newer than the standalone STATIONGEN tree**: lamps are
recorded and baked into one instanced batch per spinning group
(`StationBuilder.bakeLamps`, `anim.js` `lampBatches`), and the static merge
treats a live group as its own merge root (`core/geometry.js`). Port those three
changes back to STATIONGEN before copying a newer STATIONGEN over this folder, or
keep them when merging.

### Drones (ROBOTGEN)

| Kind | Career / chassis | Seed | Size |
| --- | --- | --- | --- |
| `sdrone` port interceptor | Interceptor, fixed-wing | the port's name | 8 u |
| `guard` free-port gun | Sentry, hover | the port's name | 10 u |
| `probe` survey probe | Survey, fixed-wing | your callsign | 5 u |

- A port's drone line builds one design; the livery comes from its sector
  (`SECTOR_PALETTES` in `dronespec.js`, holds fly dark).
- `forgeDrone` bakes a robot's 80–110 meshes into one lit vertex-coloured mesh,
  one unlit lamp/optic mesh and one per see-through material: 2–4 draws.
  Metalness is capped at 0.3 and near-black liveries get a floor, so drones read
  under the canopy's single sun.
- Designs are templates handed out as clones (geometry and materials flagged
  `keep`); `droneBudget(n)` limits new designs per frame (the engine allows 2) and
  a placeholder flies until the design is ready. `releaseDrones()` runs on a sky
  change after the clones leave the scene.
- Gun drones turn their optics onto you; probes are drawn while in flight.
- The station deck's Works tab prints the design tag from the parts manifest:
  designation, career, chassis, mass, part count, endurance.

### Speech (NPCSPEECHGEN)

- `syncBand(pos)` mirrors up to 36 of the nearest traffic hulls and flow boats
  inside 140,000 u as speech units. (Ports are deliberately **not** pooled — see
  Comms.) Each unit's fields come from the sim: callsign, role, faction (the
  corporation's power; holds are `pirate`), task from the timetable job, cargo,
  damage, the port it deals with. Positions go in at 1/60, so "near" is 24–36 km
  and "can talk" 54 km.
- Exchanges run through the engine's `chooseTopic` → `exchange`, with its commit
  (memories, regard, obligations, log) restated in the bridge. The engine's own
  `tick()` is **not** used for talk: it also drifts unit state at random, which a
  mirror must not do. It is used, with an empty band, only to advance the speech
  clock to sim time.
- Chatter: about three slots in four are speech exchanges near you; the rest stay
  the ports' sector shop-talk (`call-scripts.js`). A hull that changes job opens
  to its port 70% of the time; the canned line is the fallback.
- TALK: port and vessel hails gain a TALK option — three quick lines chosen for
  who you are talking to, BACK, SIGN OFF — and a free-text box. `CallSession` has
  a `talkNode`: free text on a scripted call goes there, and the session's
  `provider` answers it through `talkTo()`.
- Regard for you is filed as auditable memory (`__lg.comms.regardOf`) and
  handed back as corporate standing: ×10 of the engine's regard delta. Gains are
  capped to one per hull per 600 s; losses always land.
- Shoot-downs near you become the hull the band remembers losing.
- Calibration dials were fitted offline (`selfTrain(6000, 3)`) and are baked into
  the bridge (`lengthLift 0.22`, `codaLift 0.26`, `questionLift 0.3`).
- The engine's stock phrases that name Living Galaxy places are localised to a
  port or world in the current sky (`localise()`).
- One change to the vendored file: `'all the can I have'` → `'all the hold will
  take'`. Its full self-test is green after it.

### The asteroid generator

Shane's asteroid generator (the drop-in labelled v1.01; its own README calls it
1.9.0) is vendored at `js/asteroidgen/`: `generator.js`, `debris.js`,
`fracture.js`, `tidal.js`, `kerr.js`, `blackhole.js`, `impact.js`,
`impact-sim.js`, `impact-shaders.js`, `rng.js`. Its page layer (`app.js`,
`collision.js`, `fx.js`, `batch*.js`, `planet.js`, `atmosphere.js`, the HTML) is
not. What changed, and nothing else:

- **`ores.js` is the game's.** The forty-species catalogue and the v1.01
  re-mapping table are both gone; `ORES` is built from `js/materials.js` plus
  `oreLook()` in `js/rockgen.js` (which gained an absolute `albedo` and a mineral
  `category` per ore — the generator's own v1.01 colours), and
  `ASTEROID_CLASSES` is `js/bodygen/classes.js` by reference. One mineral list.
- **`generator.js` takes three extra params**, each defaulting to exactly what it
  did before: a numeric `detail` (cells per cube-face edge), `featureScale`
  (seam width) and `featureDensity` (how many vein nets and spots a class
  weight buys). The generator draws its seams for a 56–158-cell survey mesh; a
  game body is 7–12, where a 0.04-chord vein falls between vertices and every
  rock assays as bare. The game runs 4 and 4: about 12% of a body's vertices
  show ore, and the rolls are unchanged, so a seed is still a seed.
- **The shaders are patched, not edited** (`js/bodygen/gl.js`,
  `js/holefx.js`): logarithmic-depth chunks added to every hand-written
  ShaderMaterial (this renderer uses a log depth buffer; without them a debris
  cloud sorts through the hull), a `uFade` master on the debris fields, and the
  lens's depth maths, far-plane unprojection and absolute distances made to
  work across a thirty-million-unit frustum.

**`js/bodygen/body.js`** is the adapter the game asks for a rock:
`rockParams(rock)` / `rogueParams(m, cls)` are the ONE place the rolls handed
to the generator are decided (the generator only draws a roll it was not given,
so handing it richness in one caller and not another shifts the stream and the
card describes a different rock), `generateBody()` returns the geometry in the
generator's unit frame with the `scale` that puts it at the rock's radius, and
`assayRock()` grows a coarse body (`DETAIL.assay`, cached) for the survey card.
Ore features are laid out in direction space off rolls that come before any
per-vertex work, so the card and the canopy see the same seams.

**Baked bodies** (0.3.02 — `js/bodygen/bake.js`, `baked.js`, `grower.js`,
`worker.js`). The generator's craters, grooves, grit and veins are geometry and
per-vertex colour for a survey mesh of 56–158 cells a face; the game used to grow
7–12, where all of it fell between vertices and a rock read as a smooth potato.
Now a body is grown at a real detail H and its lattice — which already puts every
cube face on an (H+1)² grid — goes straight into a 3×2 atlas, a texel a vertex:
√albedo + metalness, object-space normal + roughness, emission. The drawn mesh is
the same lattice every H/L vertices, unwelded per face, so its corners are
generator vertices and the shading between them reads the full-resolution
normal. `BAKE` in `body.js` holds the tiers (prototypes H32 at L 8/4/2; belt
bodies H32/48/64 at L8/16; rogues H48/64/72 at L12/16/24), and
`featureAt(H)` widens a seam only below the generator's own 56. Growth runs in a
module worker that loads the vendored graph itself (a worker has no import map,
so `three` is pointed at the vendored build and relative imports become blob
URLs); no worker falls back to one growth a frame on the main thread.
`generateBody()` and `DETAIL` remain for the survey card's no-renderer assay,
the impact run's fractured body and the tidal body at a hole.

**The ticket.** The generator paints ore as vein networks and spots — a few
percent to a sixth of a face, which is how a seam should read from a cockpit —
and a ticket priced off surface coverage would call every rock worthless while
the cutter fills the hold. So the surface decides *which* ores and in what
proportion (the class table as the prior, trusted less the less ore is showing,
and the ore the field hash gave the rock favoured so the headline matches the
hold), and each class's `grade` decides how much of the rock is ore: M 0.82,
X 0.70, E 0.62, V 0.58, S 0.56, B 0.50, D 0.48, C 0.46, P 0.44, scaled by
richness.

`rockfx.js`, `impacts.js` / `impactfx.js` and `holes.js` / `holefx.js` are
covered in *The sky*.

---

## Audio

`js/audio/` + a façade at `js/audio.js`. Nothing is loaded: every sound is
synthesised at the moment it plays, the same way every hull and every world is.
No wav files ship with the game.

### What was wrong

Not "the sounds are bad". The kit was four cues, and **`playWarn()` was called
from twenty places**:

| what happened | what you heard |
|---|---|
| No port in range | that tone |
| Not enough charge | that tone |
| Nothing under the reticle | that tone |
| Come about, you're off the lane | that tone |
| Warp aborted | that tone |
| A hostile hailed you | that tone |
| **A rock hit the hull** | that tone |
| **Hull breach contained** | that tone |

`playCollect()` covered docking *and* picking up cargo. `playScan()` covered a
survey pulse, an ore assay and a signature lock. Panels, viewpoints and the whole
of the interior had no sound at all. There was no limiter, so the one tone was
also the loudest thing in the game.

### The palette

Narrow on purpose: **pipe organ, sub-bass, air, wood, metal**. Six synthesis
primitives in `voices.js` and there is deliberately no `beep()` among them — the
moment a sine beep exists, somebody reaches for it.

Everything pitched is in one **A natural minor** set (`graph.js`), so a cue
landing on top of the bed is always in key with it. No major third anywhere,
which is most of why it reads as cold rather than cheerful. Measured over all 47
sounds: **median spectral centroid 1264 Hz, median 6.4% of energy above 4 kHz**.
The brightest cue is the survey ping, which is correct — a sonar return should be
the one bright thing.

### The four families that replaced one tone

- **deny** — you asked for something the game will not do. Soft, low, gone in a
  fifth of a second. It must not startle you. Peak 0.055.
- **caution** — needs attention, nothing is broken. Peak 0.116.
- **alarm** — something is actually wrong. Ducks everything else. Peak 0.330.
- **critical** — the ship may not survive the minute. Held, not repeated: a
  klaxon you cannot think through is one the player mutes, and then they lose
  every other cue too. Peak 0.382.

That is a **7× spread** between the softest refusal and the loudest alarm where
there used to be none. `test/smoke-audio.mjs` asserts the ordering.

### The bed

Seven held voices — deep, organ, fifth, hull, room, plant, void — that never stop
and never restart. Changing place crossfades them; a stop and a start is a glitch
and the ear catches it every time. Eight places: menu, cockpit, interior, docked,
belt, warp, combat, well.

On top of the place sit continuous modifiers, which is where the bed stops being
a set of rooms and becomes an instrument the game plays: **wellDepth** pulls the
whole bed down a fifth as you fall toward something enormous (mass made audible,
with no number on screen); **speed** opens the hull wash; **charge** drives the
reactor plant; **trauma** pushes the organ out and the floor in. Every 26 s in
the quiet places the fifth moves to a neighbouring note and back — without it the
bed becomes wallpaper inside about two minutes.

### Mixing

Five buses (`ui`, `world`, `alert`, `ambience`, `engine`) plus master, each saved
to localStorage, with sliders in the pause overlay. Alerts **duck** everything
else — a warning under a full engine bed and a station hum is a warning nobody
hears, and turning the alert up instead is how you get the thing this replaced.
Ducking rides on its own gain node per bus, separate from the player's level;
sharing one node is how a bus ends up stuck at 30% after an alert. A **hard
limiter** at −3 dB, and a **26-voice cap** with priority so a button tap can never
starve an alarm. Measured: 300 cues fired back to back settle at exactly 26 live
voices.

### What the measuring caught

Building this blind would have shipped silence. The primitives were wildly out of
scale with each other before they were measured against a reference tone:

| primitive | nominal | measured before | after |
|---|---|---|---|
| organ | 0.100 | 0.121 (**208%** of target) | 0.069 |
| wood | 0.100 | 0.009 (**9%**) | 0.038 |
| metal | 0.160 | 0.0008 (**0.5%**) | 0.082 |

`metal` was inaudible because a bank of high-Q bandpass filters passes almost
none of a broadband source. `wood` was inaudible because a 1.8 ms attack had
decayed before the waveform reached its first peak. The organ was twice as loud
as asked because `gain` meant "the fundamental" and the harmonic stack piled on
top — it is normalised now, so a six-harmonic organ and a three-harmonic one
match at the same setting.

### Listening to it

`tools/audio-lab.html` — served with the game, a button per cue and per bed, live
mixer, level meter. This is the one to open on a phone.

`tools/audiobake.mjs` renders every cue through an OfflineAudioContext to wav and
prints peak/RMS/duration:

```sh
python3 server.py 8124 &
node tools/audiobake.mjs "$(npm root -g)/playwright/index.mjs"
```

The game never needs those files — it exists so the kit can be auditioned without
flying to the situation that triggers each cue.

`test/smoke-audio.mjs` renders all 47 sounds and checks what actually describes
the problem, rather than that it ran: nothing silent, nothing clipping, the alert
hierarchy the right way up, the bed sitting under the cues on **RMS** (a bed is
continuous; it is its average that masks a transient), every cue decaying, the
palette still dark, and the voice cap holding.

---

## Menu art

`js/attract.js` + a seam in `js/engine.js`. Roughly 330 lines, no new assets,
nothing downloaded, nothing painted by hand.

**What was actually wrong.** The title screen was not missing a backdrop. It was
already rendering the whole generated system — sun, every planet, orbit lines,
beacons, belt haze. The menu camera sat **twenty-six star radii** out and aimed at
the barycentre, so for Sol that is ~696,000 u from a star that subtends about 4°,
with every planet at well under a pixel. The scene was full and the shot was
empty.

So this is a **camera director**, not a second scene. Everything in frame is the
same asset the game flies through: the same shipgen hull, the same painted planet
surface, the same ring texture, the same starfield.

- **Hero world** — rings first (a ringed giant is the one silhouette that reads
  instantly at phone width), then the largest giant, then whatever is biggest and
  is not the star.
- **Framing** — the camera swings on a slow arc around the hero, holding a fixed
  angle off the star vector so the light keeps raking across the limb instead of
  flattening it.
- **Hero hull** — one real `forgeShipScaled()` hull at lite detail, drifting
  across frame with its plumes animating, lit by the scene's own star light plus
  one cool fill so it reads as metal rather than a silhouette.
- **Nebula** — a seeded canvas painted once: two or three cloud regions, dust
  lanes, and field stars beneath the real point sprites. An opaque skybox with
  `renderOrder: -1000` and no depth write, so it goes down first and the whole
  system paints over it.
- **Orbit lines** are hidden while the shot is up. They are a navigation aid; at
  this camera they are meaningless straight scratches and they read as a
  rendering fault. Put back on teardown.

**The composition measures the card.** The start card is bottom-centred on a
phone and a **full-height left rail** in landscape (`@media (max-height: 560px)`).
The first pass hard-coded layouts and shipped a wide shot with the hero world
entirely behind the card, and a phone shot with the hull behind it. So it measures
instead: find the largest band of canvas the card does not cover, and compose
inside that. Subjects are placed at explicit screen positions, and the camera
standoff is **derived** from how large the hero should read in that band rather
than being a constant.

**Cost, and the way out of it:**

| quality | what runs | draws |
|---|---|---|
| `high` / `full` | nebula + forged hull + reframed camera | ~145 |
| `low` | reframed camera only | **14** |
| `off` | the old star-circle camera | ~162 |

`low` is the interesting one: it is *cheaper than the menu was before* and still
shows a ringed giant filling a third of the frame, because reframing a camera
costs nothing. That is the fallback — there is no baked image to ship or keep in
sync. Chosen automatically from `hardwareConcurrency`, `deviceMemory` and
`prefers-reduced-motion`; forced with
`localStorage.setItem("lgaa.attract", "low")` — `off | low | full | high`.

**Teardown.** It adds three things to the borrowed scene — nebula shell, hull,
rim light — and the smoke exists to prove all three are gone the moment the sim
launches, along with the orbit lines being restored and the camera handed back at
its own fov. Nothing is disposed that it did not create; `renderer.dispose()` is
never called. One subtlety worth keeping: `up` means *the director is driving the
menu*, not *it has built props*. At `low` it builds nothing and still owns the
camera and the orbit lines, and the engine needs to know to stop it on launch or
the lines never come back.

**Poster stills.** `tools/keyart.mjs` photographs the same scene at any size:

```sh
python3 server.py 8124 &
node tools/keyart.mjs "$(npm root -g)/playwright/index.mjs" --size 2560x1440
node tools/keyart.mjs "$(npm root -g)/playwright/index.mjs" --shots 6
```

`--shots N` re-rolls the sky N times — the fastest way to find a frame worth
keeping, and the composition is seeded so a sky you like is reproducible from its
seed forever. The UI is hidden with `display:none`, not `opacity`, because the
shot measures the card's rectangle and an invisible card still has one.

**Known, and not the director's fault:** the atmosphere shell
(`SphereGeometry(radius * 1.045)`, `BackSide`, `opacity 0.16`) draws over the
rings where they cross in front of the planet, which shows as a hard-edged
lighter trapezoid. It is in the existing renderer and shows in flight too — the
fix is a render-order or depth decision in `buildPlanet`.

---

## The data model

Nothing is a database. Three things hold state, and which one a piece of state
belongs in is a deliberate decision each time.

### 1. The seed

Most of the world is not stored at all — it is a function of a seed, recomputed
identically on every device. That is what lets two pilots on one `server.py` fly
the same sky without shipping any of it:

| Thing | Seeded from |
| --- | --- |
| The system: star, worlds, moons, rings, belts | the sky seed |
| A world's name and register | the sky's one tongue |
| Every rock's composition, class and shape | its own cell hash — a rock is always the same rock, and a mined one stays mined |
| A station's hull, mouths, lanes, mounts and works | its id |
| A station's deck plan | its id |
| A hull's geometry | the registry def + a seed |
| A drone design | the port's name (your probes: your callsign) |
| A person's body | their record's seed |
| Engagements | the sky seed, so every pilot in the room sees the same ambush with the same ending |
| A flow boat's pilot | the boat's own id |

`js/field.js` is the clearest case: the belt is 50,000 units wide, so it is never
built. It dices space into cells and hashes each cell's rocks deterministically;
fly away and back and the same rocks are in the same places.

### 2. localStorage — and who each key belongs to

Everything the game kept between sessions used to live in one flat pile of keys
that nothing ever swept, so a corporation founded by a pilot you retired was
still on the books when you made a new one, the old callsign was still on the
save, and the old hands were still filed as "aboard". You cannot start over in a
game that will not let you.

`js/profile.js` fixes that by saying out loud which of three things each key is.
It is a **leaf**: it touches storage and nothing else, so it can be imported from
anywhere without dragging the sim in behind it.

| Class | Keys | Why |
| --- | --- | --- |
| **DEVICE** | `lgaa.audio.mix`, `lgaa.rocks`, `lgaa.attract` | Belong to the machine. A new pilot does not re-tune the speakers, and wiping these would be rude |
| **RUN** | `lgaa-company`, `lgaa-fleet`, `lgaa-social`, `lgaa-save-v1`, `lgaa-save-v0`, `lgaa.con.recents.v1`, `lgaa.tutorial.v1`, `lgaa.tutorial.core.v1` | Belong to **one pilot's run**. A new pilot clears every one |
| **LEARNED** | `lgaa.aria.v1`, `lgaa.housebrain.v1` | Belong to the **human at the controls**, not the character. Deliberately kept — throwing away a session of learned flying to rename a character would be a worse bug than the one this file fixes |

And the half that made the bug hard to see: five subsystems write a key **keyed
by the sky and the callsign**, `lgaa.<thing>.v1:<skySeed>:<callsign>` —

```
lgaa.upgrades.v1:     refits fitted           js/upgrades.js
lgaa.robots.v1:       the robot roster        js/crew/robots.js
lgaa.missions.v1:     mission board state     js/mission/script.js
lgaa.mission.run.v1:  a mission part-flown    js/mission/run.js
lgaa.drones.v1:       drone standing orders   js/drones/ops.js
```

— which means `removeItem("lgaa.upgrades.v1")` removes nothing at all, and a
sweep written against the bare names would have looked like it worked while
clearing none of them. It also means the keys never stop accumulating (one set
per name you have ever flown under) and that flying under an *old* name hands you
that pilot's refits, robots, missions and part-flown contracts back. So these are
cleared by **prefix**, over the whole of localStorage, and the trailing colon is
deliberate: it matches `lgaa.missions.v1:Vex` and never some future
`lgaa.missions.v1b`.

`lgaa.profile.v1` is the profile itself. `lgaa.cradle.v1` is in **none** of
the three classes on purpose — see below.

### 3. CRADLE — the population, not the pilot

`lgaa.cradle.v1` locally, and `cradle.json` beside `server.py` for the shared
half. It is the sky's population rather than any one pilot's property: the hand
you dismissed at Foundry Hold should still be at Kessler Reach two pilots later.
What a new run clears there is only the **employment** — anybody filed as aboard
or captained by the pilot who just walked goes back in the pool, so the hiring
halls fill again (`releaseEmployed()` in `js/npc/cradle.js`). The server does the
same on its side, because an "aboard" flag is a fact about one client's run and
has no business being written to a shared ledger at all.

A record's genome is stored in the packed codec (`p1:spacer:<base64>:<checksum>`,
178 chars) rather than the engine's 359-char form, so 500 people cost ~90 KB
rather than ~190. Journals are the pressure valve: everything in a 400-record
session ring in memory, the last 12 in full on the record, and when localStorage
refuses a write `save()` sheds the stored journals of everyone not currently
aboard and retries once.

### What crosses the wire

Only what cannot be recomputed. Ship state and messages are latest-per-pilot and
a short ring buffer, both expiring; `born` is the room's shared clock zero;
`/net/world` carries the host's snapshot of what got *rolled* — craters, lost
ports, what the rocks did — because that is precisely the part a seed cannot
reproduce. Nothing about a peer's hull is shipped: the def id and seed are
enough, because the generator is deterministic.

---

## Tests

No test runner, no framework. Node's own module loader with an import hook that
maps bare `three` to the vendored build, and a Playwright binary you already have
globally.

### Node suites

```bash
node --import ./test/three-register.mjs test/<name>.test.mjs
```

| Suite | What it pins |
| --- | --- |
| `forge` | every hull forges, deterministic, lite budget |
| `hullspec` | parts lists, catalogue ids, yard prices by tier |
| `sky` | trainer start, hull tune, lane funnels, pirates, engagements, the yard, works, defences, tractor, the doors, the shattered-world well |
| `reactive` | the flown sky: crossings and the drive, hull characteristics, hostility, a staged hunt end to end (raider → radio → dispatch → arrival), damage and recovery, drone nests and waves, and the frame budget's hysteresis |
| `economy` | the ledger: price curve, lines and stalls, boats and captains moving stock — and, 0.3.24, that the stock band is worth under 2.1× end to end, that a consignment is priced as a consignment with the till agreeing with the quote, and that buying a shelf out costs more a unit than buying one off it |
| `chart` | point warp nodes, climb-and-jump, arrival clearance, probes/scans, WASD/boost/cruise |
| `autopilot` | the power rule, the mining loop end to end (seam → lane → tractor → sell → back out), stash and smelt |
| `avoid` | the solver: inside vs outward, the rock horizon, a committed dodge, the watchdog |
| `nav` | the well invariant against every body in a generated sky, geometry-vs-gravity counts, a hull flown at a world and *past* one, the exemption list, contact thresholds and the error curve |
| `mission` | mission scripts: serialize, validate, conditions, presets; MINE LOOP as a mission, thrust cap ceiling, warp never/ask, the ask links, pause/resume, a restored run (TRADE RUN end to end is in `trade`) |
| `portcontrol` | berths filed through `requestDock`, the tractor at the mouth, the push out |
| `people` | powers and corp wars, flags on every NPC, blame propagation, the company desk, dialogue outcomes, a birth, settle as staff / pay off and record |
| `board` | the desk: issuers, tier gates, accept/deliver/abandon/expire, hauls load on accept; the fleet: commission, a real hull on the board, a delivery booked, sell back |
| `genome` | the spacer/synth entity types, race bias, the codec and its checksum, kinship coefficients, v1 migration by fingerprint |
| `skycrew` | crews on every hull, the work budget, the souring ladder from unpaid to hulk |
| `crew-life` | roster, duties, talk trees and the one relationship ladder |
| `beats` | staged acts: the one-step beat, one-at-a-time, the dismissed hand, the reset, the honest tag, the ledger write, the gate, a hook that throws; 0.3.17: nothing advances by itself, answers move the bar and lean the outcome, every core scene is answerable |
| `bounty` | the Marshal's board, standing costs, both routes through the brig, all four doors, escapes and the clock |
| `gender` | 6,000 people: the ratio, per-race spread, pronouns on the directory line |
| `names` | distinct-name yield per race, hall duplicate rate, cross-race overlap, register mix, body-name collisions across 400 skies, designation uniqueness, and the obscenity scan over half a million names |
| `console` | every panel module imports headless, registry order, jumpTo paths, query() hits, the 600-line gate |
| `systems` | berths end to end, refit variety, the assay, station life, children, the three tracks, ARIA |
| `asteroids` | the generator on the game's one mineral list, seven body kinds, the assay against the canopy, the grade, the shader patches, impact runs (chunks held and let go, momentum, crust, a fragment heir), holes (Kerr radii, pull, warp shear, rarity, the belt tunnel, rogues, debris, ports, tides, the ship's zones, the wire, a star collapsing) and all of it through the sim |
| `upgrades` | every mod key buyable somewhere, twenty-plus distinct effects, every yard sector fitting something, every exclusion naming a real id |
| `profile` | a new pilot is a new run: which storage key belongs to the device, the run and the human; the callsign-suffixed families; releasing the last pilot's crew without demoting the sky's own captains; and the sweep that fails if a new key goes unclassified |
| `relay` | a static host is asked once, not forever: 404/405/501 on either endpoint writes the relay off, a burst coalesces by id, a dropped packet is still just a dropped packet |
| `dock` | berthing at fast and tethered ports by hand and by APPROACH, the clock chase carrying the hull, avoidance in the hazard's frame, lateral drift |
| `aria-repair` | yard repair pricing and limits, the patch drone, ARIA's job planner off your habits, ARIA at the conn through the autopilot and the stick taking it back, the covered berth pull |
| `bake` | every asteroid is the generator's: the bake lattice is its cube-sphere (vertex ids, winding), the atlas carries the fine surface, the drawn mesh subsamples the grown one, tiers divide, worker transfer, the grower's main-thread path |
| `power` | the bus: the starter carries its loadout, a fresh overload verdict and a re-engage after shedding, the stand-down naming switches in kW, no power from nothing on a flat battery, mains derate before life support, the brownout latch, `ship.draws` adding up to the load, the bench on the mining bus, a relaunch keeping its hull tune, the pilot's cutter handed back, retaking the conn at zero throttle |
| `hunt` | 0.3.01 outside the bus: the impact cap, zero-size guards, a stood-down spool, a lane through a hole refused, a hull lost at the horizon recovered at a port |
| `perf` | the bug hunt's findings, pinned by behaviour rather than a stopwatch — 0.3.28 adds that a later tick drifts the rocks without rebuilding the cell, that identity and ore do not depend on the clock, and that cutting updates wear without flushing the belt: the id indexes and that they survive outside mutation, the reused drone-threat scratch, the pooled sentry board, rock queries sharing cells but not arrays, and no top-level assignment through a binding its module cycles with |
| `chains` | 0.3.21: every department runs at least two chains and every stage is a kind that department already posts; a chain opens at exactly one port and is never posted twice; a stage posting says which stage it is and is priced off the live sky; a chain flown end to end advances at "same" and "next" ports, pays its bonus and its standing, and does not re-post; abandoning closes the file and it returns after the cool-off; the desk keeps its ordinary thirty postings |
| `npcchat` | 0.3.23: the rating gate (a higher-rated voice is never consulted, and an adult voice cannot touch the open band whatever it asks for); a voice that declines or throws leaves the engine's words; role and topic filters; every line of a real exchange is offered with topic, move, register and regard; a direct call is answered in the pack's words with the standing still the engine's; pack chips on the call panel only |
| `ariaplay` | 0.3.22/0.3.24: every career maps to a department; the brain scores by credits per minute and leans on your own career; she will not sign for more than the hold, for something with nowhere to buy it, or for a fight in a thin hull; every job plan validates as a mission; two careers flown headless close jobs and make money; and the pit screen — a colour per career, bars that are always the width they were asked for, a live frame that fits its columns, a piped fallback that writes once per change |
| `ariasense` | 0.3.25: one look covers hull, wells, contacts, belt, every port's shelf and production lines, the board and the market; it is a snapshot, it is cheap, and forgetting it forgets it; a stalled line is found as work nobody posted; a point behind a world is a blocked corridor and the dogleg clears both halves; a leg across the system costs more than one across the ring and neither is three seconds; P-LOCK holds and open space gets a mark instead; every job carries an honest estimate and every plan still validates as a mission |
| `hold` | 0.3.29: an empty hold still shows its empty slots; each slot carries quantity, tonnage (quantity × mass, not quantity) and a price a unit, most valuable first; a consignment is none of it yours, is left out of what the hold is worth, and can be neither dumped nor sold, while a partial one leaves the remainder yours; selling needs a berth; and the panel draws the slots, the empties, the consigned mark and the fill bar |
| `boot` | 0.3.27: a link failure is read from Chromium's, Firefox's and Safari's three different wordings; a missing file reads as a different problem; the words name the module, the export and the patch it arrived in, and an export the table has never heard of still gets a usable instruction; the panel is an alert that covers the shell and escapes rather than injects; the guard passes a working boot straight through and catches one that throws |
| `ariabiz` | 0.3.26: every department has a hiring list and a charter that matches what it earns from; she signs the career's own trade first, posts them to the watch the hull is short of, takes the first-hand rate on a run earning nothing but not a second hand, and pays somebody off when the bill outruns the earnings; the charter waits for the money; the treasury takes the surplus and leaves the working capital aboard, and a transfer moves net worth by nothing; a soured hand settles ashore and the books collect from them on the next cycle; and none of it happens in open space |
| `dockwork` | 0.3.25: handling grows with the lot and with tonnage rather than crates, is capped, and is faster with a better rig; the till is instant and the clamps are not; a second lot queues behind the first; the sim's clock works it off and then releases; leaving the berth ends it; a contract's cargo books the crane too |
| `sites` | 0.3.20: a spot is deterministic, in the belt, named, with a bearing and a range; a site's rocks are in the field at it, carry the job's ore, cut and deplete like any other, and the belt's own ores are still there; every rock job posts a place; accept opens the seam and points the loop at it, deliver and abandon close it |
| `trade` | 0.3.19: routes buy at one port's price and sell at another's for more, sized to hold/purse/shelf, ranked by cr/min; BUY with no good picks a route from here; SELL never sells a consignment; the port lean; TRADE RUN flown end to end buys at one port, sells at another and makes money; FLY IT builds exactly the route |
| `desk` | 0.3.18: thirty offers a port across nine departments, every career's department worked at three ports in four, a floor under yours; landlord and tenant issuers; the nested view; cargo sized to hold and purse, combat gated on guns; sector shapes the mix; picket sweep, survey, drone cull, procurement and cargo pod end to end |
| `converse` | 0.3.17: every tree topic carries on past its first answer and every path ends; follow-ups answer what was said; the hope fund, the mate you'd look after and a pay promise come back as ↻ threads reading the ship as it is now; one id one topic |
| `ground` | 0.3.16: speech units carry real hull, place and grade; maydays only from hulls really under fire (never a raider), naming real attackers, integrity and place; port reports only from hulls at that port with its real census; claim reports name the ores in reach, amounts, value and the raiders/drones on the belt; a finished claim hauls the ore it said pays; the engine's claim topics never fire untrue over a long band |
| `bay` | 0.3.15: no scenery shuttles or sorties in any built port; the bay path ends on the lane's own doors and stays inside the hangar; flow boats, captains and corporate drones fly it both ways with no jump across the handover |
| `spacing` | 0.3.60: across Sol and 30 skies no neighbouring planets inside 1.25 capped spheres, no neighbouring moons inside 3 radii, no belt inside 1.2 spheres of a planet's orbit, pushed planets keep their speed; Sol's belts off Jupiter and past Neptune; rogues: none in the first 5 min, 3–12 an hour, 2 at most, no stray lands, a spared world is never struck, strikes under 0.6 an hour; the sim spares the start world and every port's family |
| `portdrones` | 0.3.59: at most three delivery haulers in any sky; honest ports field miners, guards and repair drones, every major a repair drone, a hold only gun drones, your cap untouched; a guard kills a rogue drone off its port and the kill is the port's; a repair drone patches you out of a fight — not mid-fight, not at bad standing, not beyond its reach; each hull tier costs well over the one below |
| `belt` | 0.3.58: rocks per cell (2.7, was 6.3), empty cells, most rock is matrix, veins rare, a rock looks like what it carries, and the starter hull's MINE LOOP pays a living (100–1,500 cr/min) rather than a fortune |
| `childtalk` | 0.3.57: little / child / teen; eight topics answered from the child's own life (parents by name, the port out of the window, a teenager who wants out until you put the time in); a topic moves the bond once a watch; they ask, three answers, the bond moves, a curious child learns a point capped by the body (and a skill past it is never lowered); parents and hands do things with them in the log |
| `qrf` | 0.3.56: SOS open when a drone or pirate picked the fight, turrets returning fire is self-defence, a P-LOCK attack or a first shot closes it until the one you picked is dead or 90 s pass, an honest attacker keeps it closed, the call names the attacker, the wing pays once for hostiles found still on you (capped) and nothing when they are dead, and its rounds land on the drone with no heat to you |
| `spawn` | 0.3.55: a hull beside its world stays there — place and relative motion — through any clock jump: joining a day-41 room, joining before the first tick, a relay restart moving the clock back, a month-old room, the quarter-second chase |
| `gdb` | 0.3.54: no hall candidate at two ports; no look-alike names in a hall or a hull crew; no two people on file share a name; a person on file keeps their name when made again; a paid-off hand lives and returns where you left them; numbers, search, death, chronicle, merge (first filing wins), the device write; one flourish per name |
| `orders` | 0.3.53: a GENOME read is a peek; every need's order is a real watch in the LOG, one a watch; company, closeness, backlog, grievance heard, shore leave; TRAIN to the ceiling; ENCOURAGE/CURB; the settled hand's job, shift, hours, housing, day off, course, meal and night out |
| `stafflife` | 0.3.52: port standard time; a settled hand's day (8 h work, 8 h sleep, night shift, overtime, part-time, strike); needs, pay by hours, labour on the lines; accidents at work; the line knows the hour; the hold as hu with per-good bulk and no ceiling |
| `seclevel` | 0.3.48: GREEN with SOS open, a real wing flown to the player and a call that is not closed as "victim gone"; one call at a time; YELLOW from a hit or a round fired, clearing after 20 s; pirates add no heat, honest hulls and pilots do; RED closes SOS, drops Directorate standing, marks the hull an outlaw and turns patrol contacts hostile; heat rides the pilot record, cools, and is paid off at an honest port only |
| `line` | 0.3.46: regard from trust aboard and its lift on mood; every line topic moves the number it names (bonus, cut, promotion, family, passage, release) with its cooldown and limits; nobody earns in transit and the books count raises; the rolls' events reach the inbox; an ask is answered or lapses and costs; towns, children and the inbox survive a save; a port in another sky cannot be called |
| `nose` | 0.3.51: an autopilot jump out of a well — the ship moves where it points above 150 u/s, the drift is shed nose-first before the core is lit, the jump flies the lane at 0° and still arrives; a manual jump flies the lane nose-first |
| `chartquiet` | 0.3.50: nothing beyond the dish or under drive is on the chart, a hull leaves it the moment its drive lights, the register holds only what is near, your own fleet stays visible anywhere |
| `firstlight` | 0.3.61: index.html's modulepreload block is the static graph (`tools/preload.mjs --check`); FLY AS is painted from storage before the modules and a held tap is honoured; the same sky loaded twice keeps every port hull (same object, same frames, measured off its old holder), a different sky releases them; skins cached per sky |
| `balance` | 0.3.47: every mineral and part equals `VALUE_RULE`; the multiple over raw ore climbs with depth, nothing under 1.3× or over 3.6×; the curve still falls past twice target and lands on the floor; `BOARD.pay` is 1; a mining job pays 1.05–1.8× the bid, buying for the desk under 1.7× book, freight under 35% of cargo value; a flying job under 30% of a starter hull; the chain bonus is `CHAIN.bonusK` of authored; staff share ≤ 35% |
| `deck` | 0.3.45/0.3.49: every deck tab in index.html has a panel and every panel a tab; the treasury, fleet and flight log are not on the deck; the HALL never opens the console — crew TALK/SETTLE/PAY OFF inline, the company line inline, a registrar that takes a typed name |
| `robots`, `drones`, `droneops`, `speech`, `comms`, `careers`, `experimental` | the rest |

The generators carry their own harnesses:

```bash
node --import ./test/shipgen/register-stub.mjs test/shipgen/test-build.mjs    # 171 builds, AABB overlaps, mount rate
node --import ./test/shipgen/register-stub.mjs test/shipgen/test-flight.mjs   # every class × regime, the optimiser
node --import ./test/shipgen/register-stub.mjs test/shipgen/test-ops.mjs      # facade, determinism, anim, ops, fx cleanup
node --import ./test/shipgen/register-stub.mjs test/shipgen/audit-attach.mjs  # every mounted part touches hull
node --import ./test/shipgen/register-stub.mjs test/shipgen/audit-bom.mjs     # BOM resolves to raw materials
node --import ./test/three-register.mjs test/stationgen/test-build.mjs        # the station generator's harness
```

`test/shipgen/three-stub.mjs` is a minimal THREE stand-in with real AABB maths
and no WebGL, so the whole ship generator can be exercised in Node. It is a test
fixture — the library itself imports real `three`.

### Browser smokes

Every `smoke-*.mjs` drives a real browser through Playwright against a running
`server.py`. Start one on **:8124** first; the header of each script carries its
own invocation.

```bash
python3 server.py 8124 &
node test/smoke-<name>.mjs "$(npm root -g)/playwright/index.mjs"
```

| Smoke | What it drives |
| --- | --- |
| `smoke-ui` | creation compile block, CON opens the console, SYSTEMS rule grid, jump search, telemetry charts, hiring hall |
| `smoke-chart` | tap menu, steady plot, an unscanned sky drawing nothing and a dwelt-on hull appearing, EXT orbit, static-host net back-off, and (0.3.08) nothing clipped off the panel's right edge in either orientation |
| `smoke-docking` | pull by the entry door, push by the exit door, no re-dock, lane draw radius |
| `smoke-economy` | named boats and strobes on the board, PORT LEDGER on the deck |
| `smoke-mining` | the cutter's shutoff, watched across the whole event rather than sampled at one instant |
| `smoke-impact` | a strike drawn as the rock's fractured body with a blast, its pieces held as chunks and let go, a rock-on-rock collision with both bodies drawn, a cut-out rock going up as a shatter field |
| `smoke-blackhole` | the lens picked and run over scene depth, a shadow and a lit disk read back from the composer, the stand-in under a low tier, a belt tunnel with infall, a rogue torn apart, the chart and the canopy label |
| `smoke-freeze` | a live mission plus every console panel: the canopy keeps drawing, and a refresher that throws is dropped rather than taking the frame loop with it |
| `smoke-clipping` | every surface — HUD, all six console panels and their sub-tabs, the chart with directory and sheet, all eleven deck tabs — measured against its nearest overflow ancestor: content past an `overflow: hidden` edge is gone and fails, content past a scrollable edge is reported |
| `smoke-immersive` | the manifest and icons, the fullscreen chip asking the platform once and from a gesture, the HUD re-measuring on a bar change, **every visible HUD control hit-testing as itself** (0.3.07 — a control painted over, or one that never opted into `pointer-events`, is dead and looks fine), and the tape recording taps, orders and outcomes with ARIA's kept separate |
| `smoke-rocks` | every class prototype grown and baked, rocks drawn as generator bodies, distinct instance colours, no shards/crystals/dressing on a still rock, grown bodies from the worker, the triangle budget, nothing drawn outside the belt |
| `smoke-genome` | GENOME and LOG at 412 px with no sideways overflow, the ladder, HOUSE, SKY, the JSONL corpus export |
| `smoke-bounty` | the mix of people a player actually meets, signing for a mark, taking them, both panels at 412 px |
| `smoke-site` | 0.3.20: accept a mining job in a browser, fly to the drift it names, and the ore is in the rock with the belt's mix around it and the field drawing it |
| `smoke-trade` | 0.3.19: MARKET › ROUTES lists routes with FLY IT; WORK › PRESETS › TRADE RUN's RUN button starts it on a real route |
| `smoke-desk` | 0.3.18: the desk as nine department drop-downs nested by issuer, your career's open, accept keeps the drop-downs as they were, FITS MY HULL shows only takeable work, no sideways overflow at 412 px |
| `smoke-talk` | 0.3.17: on the talk view a scene opens on its answers, does not move by itself, moves the bar on an answer and plays to an outcome; a topic's answer carries on |
| `smoke-bay` | 0.3.15: parked off a mouth, a real hull is seen flying the bay, and no built port carries scenery traffic |
| `smoke-droneops`, `smoke-drones-speech` | drone orders, and the band |
| `smoke-attract` | the shot composes, the hull is on screen and not behind the card, orbits hidden, every added object gone in play |
| `smoke-audio` | all 47 sounds: nothing silent, nothing clipping, the alert hierarchy the right way up, the bed under the cues on RMS, the voice cap |
| `smoke-cataclysm`, `smoke-craters` | impacts and what they leave |
| `smoke-oneshape` | 0.3.62, on `low` and `full`: every close-aboard body is its instance's prototype (seed, silhouette within 5%, size and stretch), bodies share geometry, and an 18 km pass through the belt files no per-rock grows |
| `smoke-rogue` | a rogue rock grows its own baked body in the worker at the generator's resolution: class, assay, world radius, no crystals, and nothing left behind on despawn |
| `smoke-shared-sky` | two pages in one room |

**Known flakes**, reproduced at the same rate on untouched trees and tracked in
`Docs/PATCHES.md` rather than silenced: `smoke-shared-sky` disagrees about the
clock by several seconds under headless swiftshader (two heavy pages in one
Chromium — the gentle clock chase in `net.js` cannot catch a frame loop that
slow), and `smoke-docking`'s "push by the exit half" and `smoke-drones-speech`'s
"the probe in flight is drawn" each fail a minority of runs.

When a test and the code disagree about a *contract* that genuinely changed, the
assertion gets **rewritten to the new contract, not relaxed** — and the patch note
says which one and why. There are several worked examples in `Docs/PATCHES.md`.

---

## Notes for hacking on it

The world is about 2.4 million units across and the ship is a couple of units
long, so nothing absolute is ever handed to the GPU: `engine.js` keeps a floating
origin at the ship and renders everything relative to it, with a logarithmic
depth buffer. The star is a directional light — at these distances a point
light's falloff is unusable and the rays are parallel anyway.

`window.__lg` exposes the sim, ship, contacts, waypoints, trim setters and
mode cyclers for poking at from the browser console; `window.__lg.comms` has
the director, `hail()`, `hailStation(id)` and `hailContact(id)`;
`window.__lg.console` has `openConsole`, `jumpTo`, `query` and `registerJump`.
`window.__lgGL` exposes the scene, camera and renderer.

**Adding a module (0.3.61):** run `node tools/preload.mjs` so index.html's
`modulepreload` list carries it — the graph is ~34 imports deep, and without
the list every level is a round trip on the live site. `test/firstlight`
fails while the list is stale. A module that is only ever `import()`ed stays
off the list on purpose.

Three habits that have earned their keep:

- **A duplicate key in an object literal is silently won by the last one.** The
  avoidance HUD warning did not appear for an hour of debugging because
  `publishHud` already had a `threat` key further down — the warp route's
  obstruction list. The avoidance was working perfectly the whole time.
- **Two sources of truth is the bug.** Berths, the well edge, the relationship
  ladder, the mineral list and the run keys have all been the same bug wearing
  different clothes. When you find a number computed in two places, delete one.
- **Measure before you tune.** The audio primitives were out by 200× in one
  direction and 0.5% in the other, the rocks assayed at 100% ore, and the gender
  ratio was never the thing that made the sky read male. None of those were
  visible without a number.
