# Changelog

Living Galaxy — Ad Astrum. Newest first.

Versions are `MAJOR.MINOR` for a body of work and `MAJOR.MINOR.PP` for a fix on
top of one, and every release carries its own patch file — `0.2` and `0.2.01`
are different zips and never the same one twice.

What the game *is* and how to work on it lives in [`README.md`](README.md).

---

## 0.3.54 — 2026-09-25

One name, one person: the Galactic Database.

Reported: everybody has similar names, or the same names. Measured on 0.3.53,
the forge was not running out — 1,950 distinct given names in 2,000 draws per
people — it was three other things:

| | 0.3.53 | 0.3.54 |
| --- | --- | --- |
| hall candidates also offered at another port | **65 of 174 (37%)** | 0 |
| hiring halls with two look-alike given names | 9% | 0% |
| NPC hull crews with two look-alike given names | — | 0% (103 crews) |
| people in a sky with no catalogue entry | NPC crews, flow pilots, boarders, marks | none |
| two people on file sharing a full name | possible | never (census: 0) |

1. **Hiring halls shared one pool.** Half of every hall came from the whole
   sky's pool, and every candidate any hall had shown went into it — so the
   first port's people were offered again at every port after it. A hall now
   brings back only the people who live at THAT port (offered there before,
   or paid off there — a hand you pay off lives where you left them and comes
   back to that hall first). One drifter from elsewhere, now and then.
2. **Nothing checked the room.** A people's names are meant to sound alike;
   eight of them on one list shared a first or last three letters more often
   than not. Filing into a group — a hall (with your own crew counted), a
   hull's crew (with its captain), siblings and parents — re-forges a given
   name that looks like a roommate's.
3. **Most people were never filed.** NPC hull crews, flow-boat pilots,
   boarders and bounty marks were forged on the spot and forgotten.

**The GDB** (`js/gdb.js`, new) catalogues everyone the galaxy produces:
halls, captains, hull crews, pilots, boarders, marks, children born aboard
and ashore. A full name is never issued twice — a clash is re-forged from the
person's own seed (only the given name; the family is theirs), so every
device gets the same answer. Somebody already on file keeps their name when
regenerated: a captain is the same person next session. Each person has a
stable number (GDB-XXXXXX), a first-filed and last-seen record, and a status;
deaths are filed and stick. The relay keeps the catalogue too (`/gdb/all`,
`/gdb/put`, `gdb.json` beside server.py, first filing wins the name), local
first like CRADLE.

**CON › CREW › GDB** — the census (catalogued, living, deceased, peoples, and
"names shared", which should read 0), search by name / number / people /
trade / title, filters (this sky, galaxy, captains, crews, halls, born,
dead), a FILE card per person, and **the chronicle**: every line the ledger's
histories hold, newest first.

**The forge, tidied** (`js/names.js`): one doubled vowel and one apostrophe
per given name at most ("Z'hesskiisaa" was three flourishes), never the same
letter three times running, ten letters at most (was twelve), a family name
that echoes the given name's opening is re-rolled ("Thregruka Thregargh"),
and the Haask and Veyd — five endings a gender — got more.

Files: `js/gdb.js` (new), `js/console/panels/crew-gdb.js` (new),
`js/console/panels/crew.js`, `js/names.js`, `js/data/lexicons.js`,
`js/crew.js`, `js/sim.js`, `js/hud.js`, `js/family.js`, `js/stationlife.js`,
`js/npc/traffic.js`, `js/npc/npccrew.js`, `js/npc/bounty.js`,
`js/npc/speech.js`, `js/interior/boarding.js`, `js/profile.js`, `server.py`, `.gitignore`,
`js/version.js`, `README.md`; tests `test/gdb.test.mjs` (new, 30),
`test/smoke-gdb.mjs` (new, 10), `test/server.test.mjs` (+6), `test/profile.test.mjs`.

**Server:** the relay needs a restart to pick up the `/gdb` endpoints. Until
it has them, the game keeps the catalogue on the device and says so once in
the browser console.

---

## 0.3.53 — 2026-09-25

Doing something about it: a menu for settled hands, and buttons on the genome.

**Settled hands: WORK · HOME · CARE** (`js/staffcare.js`, new). On a settled
hand's card — the port's HALL › LINE in station style, or CON › CORP › TOWN ›
LINE from anywhere in the sky:

| | What | What it does |
| --- | --- | --- |
| WORK | job | any job their port has (by sector); a curious hand likes a change, most do not |
| | shift | day / swing / night — nights pay **+15%** an hour, swing +5%; most people dislike nights |
| | hours | standard 8, overtime 10, part-time 5 — a greedy hand likes overtime |
| HOME | housing | bunk (free), private cabin (12 cr/cycle), family quarters (30) — better sleep, better mood |
| CARE | DAY OFF | their next shift given back, unpaid, once a day; mood +4 |
| | STAND THEM A MEAL | 8 cr — fed, a little less alone |
| | A NIGHT OUT | 30 cr — company, and a late one |
| | SEND ON A COURSE | 4 cycles of their income — their next shift is a training day; each course makes an hour of their work worth 6% more (three at most) |

Money comes from the treasury, or your pocket when it is dry, and all of it
lands in their day log.

**GENOME: every stat you can act on has a button** (`js/crew/orders.js`, new).
CON › CREW › GENOME:

- **CARRYING** — each of the nine needs has an **order**: Tiredness → STAND
  DOWN, Hunger → MESS CALL, Company → SHARE A MEAL (with whoever they get on
  with best), Strain → EASE OFF (docked: SHORE LEAVE, 60 cr), Closeness → TIME
  WITH their partner (or WRITE HOME), Something to do → REC TIME, Grievance →
  HEAR THEM OUT, Purpose → GIVE A GOAL, Work outstanding → CLEAR THE BACKLOG.
  An order is a **real watch**: the same effect table and efficacy as their
  own choice, filed in their LOG with "the captain's orders" as the reason,
  and learned from. One a watch. Hearing a grievance does not remove its cause
  — wages, a rival, a neglected hull — but for five watches it weighs 0.35
  less, and the row tells you what the cause is.
- **APTITUDE** — TRAIN a skill and they study toward it, up to the ceiling
  their body sets and no further; having a goal slows how fast purpose runs out.
- **LEARNED** — + / − (ENCOURAGE / CURB) on a habit is a word from you: four
  steps of the same learning their watches do, in the situation they are in,
  counted as one thing lived through. Once a habit a watch.
- **TEMPERAMENT** is genes — nothing to press — so each trait now says what it
  does aboard.

**Fixed: the GENOME sheet was tiring people out.** Building a hand's decision
context drifted every need a step, and the sheet built one on every repaint —
keyed on tiredness, so an open sheet on a seasoned hand ran their needs to the
ceiling in a handful of frames (and charged morale for it). Reading a hand is
now a peek (`buildContext(m, { peek: true })`).

Files: `js/staffcare.js` (new), `js/crew/orders.js` (new), `js/stafflife.js`,
`js/company.js`, `js/deckhall.js`, `js/console/panels/corp-town.js`,
`js/console/panels/crew-gene.js`, `js/crew/deckmind.js`, `js/crew/deckacts.js`,
`js/crew/learn.js`, `css/style.css`, `css/console.css`, `js/version.js`,
`README.md`; tests `test/orders.test.mjs` (new, 44), `test/smoke-orders.mjs`
(new, 21).

---

## 0.3.52 — 2026-09-25

Mine a lot more; a port clock; settled hands with a working day.

**The hold is a volume, and it has no ceiling.** Reported: capped at about 250
platinum ore. The hold was a count of units with a curve that topped out at
four times a skiff's. Now it is **hold units (hu)**: every good takes up room by
its mass (`bulkOf` in `js/materials.js` — hydrogen 0.4 hu a unit, iron ore 0.93,
platinum ore 1.73, uraninite 1.99; ore caps at 2), and a hull's hold grows with
its cargo rating with no top (`holdForCargoRating`):

| Hull | Hold | Iron ore | Platinum ore |
| --- | --- | --- | --- |
| Fledgling (starter) | ~1,200 hu | ~1,250 | ~670 (was ~250) |
| median hull (cargo 260) | ~21,700 hu | ~23,000 | ~12,500 |
| Slipway (cargo 2,000) | ~150,000 hu | ~160,000 | ~87,000 |
| the biggest (cargo 6,500) | ~461,000 hu | ~495,000 | ~266,000 |

Cargo still has no effect on flight. The desk sizes jobs in units of *that*
good (`hullFit().capFor(id)`), buying and hauling check room for that good
(`roomFor`), and the market/hold screens read hu. Company hulls keep their old
hold curve and a port only buys what its treasury can pay for, so the fleet's
books don't jump twentyfold.

**Port standard time** (`js/stationclock.js`, new). An hour is 30 s of sky
time, a day 24 hours (12 minutes at ×1), a pay cycle three hours, a week seven
days; day 1 opens at 06:00. Shifts: day 06–14, swing 14–22, night 22–06. The
title bar shows it (☀/◐/☾, day and time; tap-hold for the weekday and shift),
the HUD darkens a touch at night, and the station deck's header reads the
port's hour and which shift is on the docks.

**A working life ashore** (`js/stafflife.js`, new). Every settled hand now has
a **job** at their port (smelter line, cross-dock, clinic, grow ring … by
sector), a **shift**, **hours** (standard 8, overtime 10, part-time 5) and
**housing** (bunk, cabin, family quarters). Hour by hour they work, eat, have
their own time — at home with their partner and kids if they have them,
somewhere that suits them if not — eat again and sleep eight hours. Night
shift sleeps through the afternoon.

- **Needs** — tiredness, hunger, company — rise and fall with what they are
  doing and lean on their mood every hour. Better housing sleeps better.
- **Pay follows the work**: a 30% retainer every cycle, the rest for hours
  actually worked at a productivity read off mood and tiredness. A standard day
  averages out at the old share.
- **The port gets busier**: each hand on shift adds 3% to their port's
  production lines (capped at 30%).
- **The rolls lean on the hour**: accidents happen at work, not in bed; births
  at home; commendations on the floor. A strike puts the shift on the picket
  line for a day.
- **A day log** per person. HALL › ON THIS FLOOR and CON › CORP › TOWN show
  what each hand is doing right now and for how long, how they are holding up,
  and their day so far. Ring someone at 02:00 on the company line and you wake
  them (it costs a little mood).

**ARIA doglegs.** A leg round a planet used to end at a fixed point off its
shoulder that she had to park on exactly; off Jupiter the well would not let
her hold still and she sat 17 km short, braking, for ten minutes. A dogleg now
ends as soon as the next corridor is clear.

Files: `js/materials.js`, `js/ship.js`, `js/shipdb.js`, `js/sim.js`,
`js/contracts.js`, `js/fleet.js`, `js/economy.js`, `js/company.js`,
`js/stationlife.js`, `js/staffline.js`, `js/stationclock.js` (new),
`js/stafflife.js` (new), `js/hud.js`, `js/stationdeck.js`, `js/deckhall.js`,
`js/console/panels/corp-town.js`, `js/console/panels/market.js`,
`js/holdview.js`, `js/traderoutes.js`, `js/ariaplay.js`, `js/aria/senses.js`,
`js/mission/run.js`, `js/mission/tradeops.js`, `js/drones/ops.js`,
`index.html`, `css/glass.css`, `css/style.css`, `css/console.css`,
`js/version.js`, `README.md`; tests `test/stafflife.test.mjs` (new, 46),
`hold`, `sky`, `desk`, `ariabiz`, `aria-repair` updated for hold units.

---

## 0.3.51 — 2026-09-25

The nose goes where the ship goes.

Reported: warping or approaching, the ship flew sideways — not like a pilot
flying it. Measured on an autopilot jump out of Earth's well, the angle between
the nose and the flight path (relative to the well the canopy shows):

| Phase | 0.3.50 | 0.3.51 |
| --- | --- | --- |
| climb out of the well | 2–13° | 1–9° |
| align + spool | **125–138°** (sliding backwards at 600 u/s) | 0–3°, a brief pivot at walking pace |
| the jump itself | 0° → **24°** crabbed by the end | **0°** until the core lets go |

Three causes, three fixes:

- **The spool was held, not flown.** The autopilot swung the nose onto the
  lane and then did nothing while the climb's 800 u/s carried on in another
  direction. Lining up for a jump is now what a pilot does
  (`flyTheLane` in `js/autopilot.js`): carrying real drift off the lane, the
  nose goes ALONG the motion and brakes; under 80 u/s it pivots onto the lane;
  on the lane, mains and the core. The core is not lit while more than 80 u/s
  of drift is still being carried.
- **The climb went straight up.** Out of a well it now climbs tilted toward
  the lane (never less than half radial, so it still gains height every tick),
  so most of its speed is already going the right way.
- **The jump turned the whole way.** The run interpolated the nose from where
  it started to "facing the target on arrival" while the hull moved in a
  straight line — every stand-off drop point off to one side of its target
  crabbed the jump. Now it comes onto the lane in the first tenth, flies it
  nose-first, and turns to face the target in the last tenth as the core lets
  go. Manual jumps get this too.

Cost: shedding the drift before spooling adds about 12 s to a jump out of a
well (Earth → Mars autopilot: 55 s end to end). Approaches were already
tracking the nose within 1–9° relative to the port being flown to.

Files: `js/autopilot.js`, `js/sim.js`, `js/version.js`, `README.md`,
`test/nose.test.mjs` (new, 7).

---

## 0.3.50 — 2026-09-25

The nav map stops tracking the whole sky.

Every NPC with its lane drive lit, anywhere inside 1.4 million u, was a blob on
the chart — the 0.2.x "long-range band" in `js/contacts.js` — so the map showed
traffic streaking across the system, and the register created and updated a
record for every hull in the sky at 5 Hz to draw it (68 hulls in the test sky,
32 under drive at any moment).

- The band is gone. A contact is what the dish sees: inside scan range, and not
  under drive. A hull that lights its drive leaves the chart at once instead of
  sliding off as a blob; one out of range is never allocated a record. Measured:
  **7 register records for 68 hulls** instead of one per hull.
- Your own fleet is unchanged — yours to see anywhere, even under drive.
- The canopy's labels read the same register, so they follow the same rule.
- Other pilots were never on the nav map; they are drawn only in the 3D view,
  and only where the relay puts them.

Files: `js/contacts.js`, `js/version.js`, `README.md`, `test/nav.test.mjs`
(the band's test is now its absence), `test/chartquiet.test.mjs` (new, 8),
`test/smoke-chart.mjs` (comment).

---

## 0.3.49 — 2026-09-25

Bug hunt on 0.3.48: the HUD's top edge, the deck HALL, the registrar, and
what the SOS was doing wrong.

**Reported, fixed**

- **The title bar rests across the very top.** It was a pill card top-left;
  0.3.48's security ◆ made it wide and tall enough to run under the gauges
  card and push "AD ASTRUM" onto the instrument pills. It is a thin
  full-width strip now — mark, series, sky, and the ◆ pinned to its right end
  — and everything else hangs from under it (`--pad-t` inside `#hud`).
- **Top-right panels overlapping.** The systems strip sat at a fixed +100 under
  a gauges card 112 px tall, so SHLD/ENG covered the card's CGO row (on 0.3.44
  too). The right column stacks itself now: the strip hangs from the card's
  real bottom, and the throttle card gives up height rather than being drawn
  under it (`stackRightColumn` in `js/hud.js`).
- **The call icon in the top right.** The comms puck's slot search scored
  "above the systems strip" as free because the gauges card is a readout, so
  every call parked the puck over PWR/HULL/SHLD — on 0.3.44 as well, at every
  portrait size tested. In portrait it is never above the strip now.
- **The message card covering the response panel.** The hazard line and the
  response clock were given the same `top`, and the message card sat 12 px
  below it, so "◈ RESPONSE 12s · <hull>" was under the card exactly when a
  fight was on. The left column stacks itself too — only what is showing, in
  order — and the card, toast and hazard lines stop short of the strip.
- **"EARTH" over "Turrets armed".** A message took its title from the lock,
  the reticle or the nearest world whether or not it was about it. A name the
  text does not mention is not what it is about: those messages are **SHIP**.
- **The HALL keeps you in the station.** Your crew are on the deck now in its
  own style — TALK opens the conversation inline (the same talk view the
  interior deck uses), SETTLE and PAY OFF ask twice — and the company's people
  on this floor get the company LINE inline. Nothing in the HALL opens the
  console (`js/deckhall.js`, split out of `stationdeck.js` for the 600-line gate).
- **A typed company name.** The registrar is back on the deck (HALL, when you
  have no company) with a name field, a charter and REGISTER. CON › CORP ›
  COMPANY has the field too — and its rebuild key held the live purse, so
  any credit moving while you typed rebuilt the card and wiped the field.

**Found in the hunt, fixed**

- An SOS made before the shooting started was "quiet" and closed after 70 s —
  before a wing from across the ring could arrive. It holds until the wing is
  due.
- An SOS nobody could answer stayed open for its full five minutes and blocked
  the next call ("a wing is already on its way"). It no longer blocks, and a
  new call closes the dead one first.
- 0.3.47 cut the staff share 45% → 32% only for hands settled after it; the
  rolls you already had kept booking 45% forever. They are re-rated once on
  load, off their list wage (station-born family keep their own number).
- A crew member settled or paid off from inside TALK left the hall showing
  them; it redraws.

Files: `js/hud.js`, `js/deckhall.js` (new), `js/stationdeck.js`,
`js/console/panels/corp.js`, `js/company.js`, `js/seclevel.js`,
`js/npc/security.js`, `css/glass.css`, `css/style.css`, `js/version.js`,
`README.md`, `test/deck.test.mjs` (39), `test/seclevel.test.mjs` (+4),
`test/line.test.mjs` (+2), `test/smoke-ui.mjs` and `test/smoke-line.mjs`
(the HALL's crew and LINE are on the deck now — smoke-line's old check was
passing on a stale console card), `test/smoke-hall.mjs` (new, 25: both portrait
sizes; the bar, the right rail, SHIP, the response clock, the puck, HALL ›
TALK inline, a typed registration).

---

## 0.3.48 — 2026-09-25

The security ◆. One diamond that says where you stand with the law.

A small diamond sits in the HUD's brand pill, top left — and in the station
deck's header, because docked the deck covers the HUD and that is where the
fine gets paid.

- **GREEN · SAFE** — nothing against you; the sky's policing corporation (the
  Directorate, `npc/security.js`) covers you. **SOS · CALL QRF** puts *your*
  call on the same distress bus the NPCs use: coverage 1, up to three hulls,
  the same honest response clock on the HUD. One call at a time, 150 s between
  calls; a wing that arrives to find nothing costs 1 standing.
- **YELLOW · IN COMBAT** — a contact hit you, or your turrets fired, in the
  last 20 s. SOS is closed until it has been quiet: call early.
- **RED · WANTED** — heat 3 or more. No SOS; the Directorate posts you (−15
  standing) and its patrols go hostile on your board and open fire.

**Heat**: +1 an honest hull destroyed, +2 a Directorate hull, +2 another
pilot, +0.2 an honest hull you fired on that called for help. Pirates and rogue
drones add nothing. A point cools every 6 minutes; it rides the pilot record
(`pilot.secHeat`), so a reload is not an amnesty. **PAY FINE** at any honest
port (1,200 cr a point, 800 minimum) clears it and buys back 8 standing — not
at a free port.

Tap the diamond for the card: who polices the sky, why you are the colour you
are, SOS (with its reason when closed), the live response clock once you have
called, the fine when you carry heat and are docked. In a shared sky only the
host runs the Directorate, so a mirror's SOS says so rather than pretending.

Under the hood: `callForHelp` takes a coverage override and a call from
`"self"` resolves its scene through `securityHooks.selfVictim` — before, a call
whose victim was not in the traffic list closed itself on the first tick as
"victim gone". `turrets.js` marks `ship.lastFireAt`, flips patrol contacts to
hostile for an outlaw, and lets them shoot.

Files: `js/seclevel.js` (new), `js/secbadge.js` (new), `js/npc/security.js`,
`js/sim.js` (wiring, kills, the step), `js/turrets.js`, `js/pilot.js`
(`secHeat` on the record), `js/hud.js`, `css/glass.css`, `js/version.js`,
`README.md`, `test/seclevel.test.mjs` (new, 29), `test/smoke-seclevel.mjs`
(new, 15: green → card → SOS dispatched → yellow → red on the deck → fine).

---

## 0.3.47 — 2026-09-25

Work for your credits. Prices follow the recipe; the desk pays what it says.

Reported from play: missions pay too much, prices are not balanced, and the
higher-tier items do not match what goes into them. All three were true, and
the third was the root of more than it looked.

**Every value is its inputs.** The mineral and component values were authored
one at a time. Run through the graph they were upside down: a heat exchanger
sold for **6.49×** the ore it ate, a battery 5×, ammunition 4.9× — and a
gyroscope, six stages deep with a flight controller in it, **1.25×**. The
cheap shallow parts were the money; the deep ones were not worth building.
`VALUE_RULE` in `js/materials.js` now prices everything: refined mineral =
ore ÷ yield × 1.3, anything made = Σ inputs × 1.18. Each stage adds the same
18%, so the multiple over raw ore climbs with depth (1.5× shallow → 2.5×
deepest), and a new recipe prices itself. The table is still written out for
reading; a test fails if it drifts. Ores are untouched — they are the unit.
Some examples, old → new: heat exchanger 610 → 155, battery 690 → 215, chip
900 → 360, armour plate 1,250 → 590, gyroscope 2,157 → 3,950, actuator 491 →
905, air scrubber 520 → 1,140.

**The desk pays what its text says.**
- `BOARD.pay` 1.7 → **1.0**. A "cut 305 iron ore" job paid about 2.3× the
  counter; a Fledgling's first chain stage paid 4,192 cr against a 6,563 cr hull.
- Tiers: Bonded 1.55 → **1.35**, Sealed 2.4 → **1.8**.
- A job that pays for goods pays the goods and a premium, and the tier scales
  **only the premium and the fee** — a Sealed procurement multiplied the whole
  cargo by the tier and then by `BOARD.pay` and paid 3.7× what it was worth.
  Anything you can buy is priced off the **cheapest ask in the sky + 8%**, not
  the book; ore and ice you cut are still paid over the bid.
- Freight is a commission: haul 60% → 20% of cargo value, courier 25% → 15%,
  consignment 30% → 12%, construction lift 35% → 15%, pod finder 40% → 15%.
- Chain closing bonuses × **0.5** (`CHAIN.bonusK`; authored 5,500–9,500).
- Chain stage floor 450 → 300 cr.

**Less money for nothing.** Pirate bounty 420 + 6/t + 600 for a rescue →
240 + 4/t + 350; your drone's bounty 300 → 180; a settled hand books 32% of a
list wage to the company, not 45%.

**The market.** The stock band 0.72…1.45 → **0.8…1.3**, and the finished-work
bonus 1.12/1.22 → 1.08/1.12. The curve's exponent is now solved from the band
so it lands on the floor where `GLUT_FRAC` says a glut starts — at 0.45 it went
flat at 2× target, which is why `economy.test` had been failing on 0.3.44.
`trade.test`'s other failure on 0.3.44 was a stale equality from before lot
pricing (a route is quoted for a lot, so its average buy sits at or above the
first unit's price); it asserts that now.

**Found on the way:** a closed or abandoned job's mining site stayed in
`sim.autoPlan.seam`, so the next free MINE flew back to it — ARIA dropped a vein
strike and then crawled 800,000 u across the system to the same empty site for
twenty minutes. Settling a job now clears the seam it set.

**Measured** (`tools/aria-bench.mjs`, one seed, 20 min, 20,000 cr purse —
single runs swing, the bench counts purse and treasury but not cargo):
commerce 1,844 → 139–334 cr/min, manufacturing 1,304 → roughly break-even
to 541, energy 1,570 → 775–977, healthcare 811 → 158–255; mean top-20 route
spread 1.70× → 1.43×. What is still rich: a well-capitalised trade run (best
~1,900 cr/min on a 20k purse) — see "next" in the report.

Files: `js/materials.js` (VALUE_RULE, `derivedValue`, the table, finished
bonus), `js/contracts.js`, `js/chains.js`, `js/economy.js`, `js/company.js`,
`js/staffline.js` (severance off the new share), `js/drones/ops.js`,
`js/sim.js` (pirate bounty), `js/version.js`, `README.md`,
`test/balance.test.mjs` (new, 19), `test/economy.test.mjs` (the ceiling, not
1.4), `test/trade.test.mjs` (lot-aware route check), `test/chains.test.mjs`
(the scaled bonus), `test/fabricate.test.mjs` (the best part is 2–3.6×, not a
6.5× faucet), `test/ariaplay.test.mjs` (the charter she registers is capital:
one procurement no longer pays for the registrar with change).

---

## 0.3.46 — 2026-09-25

The company line. A settled hand is still somebody you can reach.

Settling a member was the last conversation you had with them. They became
a row in CORP › TOWN and a number every cycle; the only thing left to do was
fly back to their port and RECALL them from the hall. What happened to them
after that — promoted, married, a child, a strike — was a log line.

**Call them.** CORP › TOWN, **LINE** on anybody's row (or **LINE** beside
them in a port's HALL) opens their card: where they are, role, cycles, mood,
regard, the last six things either of you said, and what you can do about it
from anywhere in this sky — HOW ARE THINGS?, SEND A BONUS, RAISE THEIR CUT,
PUSH FOR PROMOTION, HOW'S THE FAMILY?, MOVE THEM (to a company port), COME
OUT TO THE SHIP (passage to where you are docked, then RECALL in the HALL),
LET THEM GO (two taps, severance, address kept). What they say is read off
their real life, not a bank: the port, the rung, the partner, the children by
age, the baby due. Every button says what it costs and why it is greyed.

**They call you.** Every event the rolls file about a person lands in **THE
LINE** as a message from them, with a HUD toast for the big ones. A member
sliding under mood 48 **asks** — a bonus, a raise, a move — and the answers
are buttons on that row. Leave it three cycles and it costs mood and regard.

**Regard** is what they think of you as an employer: their trust aboard,
carried ashore at settle, and it lifts or sinks the mood their port pulls them
to. Raises lift it for good. Nobody earns on a liner; the books count raises.

**Found on the way:** households, station children and the town log were never
saved — a reload quietly un-married everybody and the kids were gone. They
ride in the company's own save now (same `lgaa-company` key, no new storage).
`staffAt()` no longer counts someone who is between ports.

Files: `js/staffline.js` (new), `js/console/panels/corp-town.js` (new — TOWN
moved out of `corp.js`, which is on the 600-line gate), `js/console/panels/corp.js`
(TOWN import, LINE on COMPANY › PEOPLE, search entries for the line and every
member), `js/company.js` (regard/list wage at settle, cut and transit in the
books, `tickLine`, the towns in the save), `js/stationlife.js` (events call
`hearFrom`, regard in the mood target, nothing happens in transit),
`js/stationdeck.js` (LINE in the HALL), `css/console.css`, `js/version.js`,
`README.md`, `test/line.test.mjs` (new, 39), `test/smoke-line.mjs` (new, 15:
a real call, a bonus, the inbox answer, the deck jump).

---

## 0.3.45 — 2026-09-25

The station deck is the station's. Only port panels on it.

Docked, the deck and CON showed the same things twice. The deck's **CREW**
tab carried the roster line, the company registrar, the treasury with
DRAW/FUND, the whole fleet with SELL BACK and the yard's commission list, and
the crew log — every one of those is also a console page (CON › CREW,
CON › CORP › COMPANY, CON › WORK › FLEET). The deck's **LOG** was `sim.log`,
the flight log that CON › SHIP › STATUS already prints.

- **LOG** is gone from the deck.
- **CREW** is now **HALL**: berths and payroll on one line with a
  **CON › CREW** jump, the port's hiring hall, and the company's people who
  live on *this* floor (RECALL). No registrar, treasury or fleet — without a
  company the section is one **CON › CORP** jump.
- DRONES' "Register a company" jump goes to CON › CORP › COMPANY instead of
  the old deck tab; two console notes that still sent you to "the port
  deck's Crew tab" say where the registrar is now.

Left on the deck, all of it port-only: MARKET, SHIPYARD, BOARD, HALL, WORKS,
DRONES, ROBOTS, REFIT, GNN (at a GNN relay), BLUEPRINT.

Files: `index.html`, `js/stationdeck.js`, `js/console/panels/work-fleet.js`,
`js/console/panels/work-drones.js`, `js/version.js`, `README.md`,
`test/deck.test.mjs` (new, 35), `test/smoke-ui.mjs` (clicks HALL, looks for
the CON › CREW jump).

---

## 0.3.44 — 2026-09-24

The shared sky survives the relay restarting underneath it.

Now that the relay sits behind living-galaxy.com, it gets restarted: a
cloudflared bounce, `install.sh --update` restarting `lg-relay`, a reboot.
Two things did not survive that, measured in two real browsers through the
site's pass-through (`test/smoke-relay-restart.mjs`):

**The room is reborn and nobody says so.** A relay restart starts the ring
and its cursor over at zero, and `born` moves. A client still holding its
old, larger cursor asked for "everything after 9" of a ring that had seen
two messages — and got nothing, for every hail, scan and beacon, until the
new ring outgrew the old number. A pilot who stayed connected through a
restart never heard another word (smoke: `heard [1]` before the fix,
`[1,2]` after). `js/net.js` now treats a moved `born` as a fresh join:
adopt the new cursor, do not replay the ring, resync the clock.

**The ledger gave up.** `js/npc/cradle.js` pulled the server's records once,
at connect, and switched pushes off for the session after four failures. A
relay down for the five seconds of a launch — or the site answering 503 —
meant that session never saw the sky's people and never shared its own. The
pull now backs off and comes back (5 s, 15 s, 45 s, then every two
minutes); the push gate reopens for one try a minute after it shut; any
success resets the count. A static host (404/405/501) is still written off
exactly once. `test/relayretry.test.mjs` (16, fake fetch and timers).

Files: `js/net.js`, `js/npc/cradle.js`, `js/version.js`,
`test/relayretry.test.mjs` (new), `test/smoke-relay-restart.mjs` (new, 15:
kill and restart the relay under two pilots through lgsite; fails 3 checks
with the `born` fix reverted).

---

## 0.3.43 — 2026-09-23

Site bulletins link back; the pilots board in the ACCOUNT card.

Goes with `LivingGalaxy-Site-0.1.1`, where every published news item owns
a discussion thread in Announcements and `/api/news` carries `url`,
`discuss` and `replies`, and `/pilots` + `/api/leaderboard` rank synced
pilots by purse.

- A bulletin from the site carries **READ** (its page) and **DISCUSS (n)**
  (its thread, with the reply count). Both repeat — a link is not a thing
  you do once — and both open in a new tab on the site's own origin. Only a
  same-origin path becomes a button: a scheme or a `//host` in the feed is
  ignored. A 0.1.0 site's feed has neither and gets no buttons.
- CON › CORP › ACCOUNT has a **TOP PILOTS** card: the top ten by purse,
  callsigns only, with a link to the full board. Fetched when the card
  builds, at most once a minute; a site without the board shows "not up
  yet"; a plain `server.py` shows nothing new.

Files: `js/account.js`, `js/console/panels/corp-account.js`,
`js/version.js`, `test/account.test.mjs` (120), `test/smoke-account.mjs`
(28: DISCUSS opens the real thread in a new tab; the board lists the synced
pilot).

---

## 0.3.42 — 2026-09-23

FLY AS <callsign>. The pilot comes back.

Found while testing 0.3.41, and the bug behind "saves by account" all along.

**What was happening.** Nothing about the pilot was ever written anywhere.
Race, career, rank, skills, certs, specialisation, the hulls bought at the
yard, the cover on them, corp standing — all of it lived in memory and was
rebuilt from scratch by `makePilot()` on the creation screen, which every
launch went through, and which is a NEW RUN: `js/profile.js` sweeps the corp,
the fleet, the save, the refits and the missions behind it. Measured in a
browser before building this: purse 99,999 on disk, 3,100 after "Create
pilot" with the same callsign; corps regrown from the seed put every standing
back to the tier default. A returning player was a new character in the
trainer with the starting purse, and the account (0.3.40) faithfully synced
that.

**The record.** `lgaa.pilot.v1` — a RUN key, so it travels with the account
and a new pilot sweeps it — carries who the pilot is (`serializePilot()`:
race, career, the whole character, probation, payout) and what the sim owns
for them (hulls, the active hull, the player's policies, a standing table per
sky). `restorePilot()` refuses a bad one — wrong version, no character, a race
that does not exist — and touches nothing when it does.

**The start card** shows **Fly as <callsign>** when a record and a save are on
the device, with "New pilot" stepped back to a ghost. FLY AS restores the
record, sets the callsign, and launches into the sky the pilot was last in
(`lastSky` in the save) — no creation screen. A restored pilot does not
collect the sign-on standing again; standing per sky is applied after the
corps are regrown, before anything reads it. **New pilot asks first**,
naming what it sweeps and that the account copy follows on the next sync.

**When it writes.** At launch; with the wallet's 30 s writer whenever the
record is dirty (a skill point landed, a cycle ticked, a promotion, a
transfer, a specialisation, a payout — the seconds between are not dirty);
at once on a hull bought, switched, insured or lost; on the tab hiding.

**Verified.** 37 headless checks (`test/continue.test.mjs`; seven reverted
behaviours each fail it), a browser smoke of the real card
(`test/smoke-continue.mjs`: rank, skill, hull, purse and sky kept across a
reload, the dialog dismissed leaves the record alone), and the account smoke
now flies device B on as device A's restored pilot.

Files: `js/pilot.js`, `js/sim.js`, `js/store.js`, `js/hud.js`,
`js/profile.js`, `js/stationdeck.js`, `index.html`, `css/style.css`,
`js/version.js`, `test/continue.test.mjs` (new), `test/smoke-continue.mjs`
(new), `test/smoke-account.mjs`.

---

## 0.3.41 — 2026-09-23

The wallet is part of the save.

Requested: wallet credits persist.

`ship.credits` was whatever `makeShip()` and the race bonus issued, every
launch — 2,500 plus the race's head start — and a session's trade was gone on
reload while the corp treasury beside it survived. The account page (0.3.40)
put the number on a table and made it obvious.

- `lgaa-save-v1` carries `credits`. `persist()` writes it from the store,
  which `publishHud` keeps current every frame; a NaN never overwrites a good
  purse; a save from before this patch reads as **null**, not zero, so an old
  save launches with the starting purse rather than broke.
- The launch restores it AFTER `applyRaceToShip` — the race bonus is a new
  pilot's and is not paid again every morning.
- While credits move the sim writes the save every 30 s (`WALLET_EVERY`);
  scans, beacons and atmo works write at once as before; nothing is
  stringified when nothing changed.
- `persistNow()` (exported from `sim.js`) writes on `visibilitychange` →
  hidden and on `pagehide`, on every host — the phone switching apps is the
  common case, and the 0.3.40 account flush only ran with a site behind the
  origin. It refuses outside play.
- The ACCOUNT conflict card shows **Purse** beside Treasury.

**Honest note.** On its own this is invisible in play: `Create pilot` starts a
new run and sweeps the save (that is what `js/profile.js` is for), so a
restored purse only shows up once there is a way to fly on as the SAME pilot.
That is 0.3.42, found while testing this one.

Files: `js/store.js`, `js/sim.js`, `js/main.js`, `js/account.js`,
`js/console/panels/corp-account.js`, `js/version.js`, `test/wallet.test.mjs`
(18; five reverted behaviours each fail it), `test/account.test.mjs`.

---

## 0.3.40 — 2026-09-23

The pilot follows you: accounts, cloud saves and site news, from inside the
game. This is the game's half of the website (`LivingGalaxy-Site-0.1.0`, its
own zip and runbook); the site's half is the account, the forum, the news
desk and the save store.

Requested: a website suite for account creation and email registration so
character saves are by account; news and updates that show in the game.

**What syncs.** `js/profile.js` already said what belongs to a pilot —
`RUN_KEYS`, the callsign-suffixed families, `LEARNED_KEYS`, the profile record
— and `js/account.js` syncs exactly that as one blob. Device settings (mixer,
rock quality, fullscreen, the attract flag) and the CRADLE (the sky's people,
which the relay already shares) stay on the device, and a blob from the
server can never write outside that scope whatever it contains.

**Where it works.** Only when the game is served by the site at
`living-galaxy.com/play/` — same origin, so the site's own cookie and CSRF
model (HttpOnly session, `X-Requested-With` as the proof) is reused with no
CORS and no token anywhere in a URL. The module probes `/api/me` once at boot;
a phone's `server.py` or a static host answers 404 and every account feature
becomes one line — *"Play from living-galaxy.com to carry this pilot across
devices"* — and nothing else changes. Verified on both.

**Versions, and the only question it ever asks.** Every upload carries the
server version this device last synced to. A second device writing in
between makes the next upload a **409**, and the CON › CORP › ACCOUNT card
puts both copies side by side — callsign, corp, treasury, when — with KEEP
THIS DEVICE and USE THE ACCOUNT COPY. The same card appears on first sign-in
when both the device and the account already hold a pilot. Taking the account
copy rewrites storage and reloads: two dozen modules read their keys at
launch, and swapping a pilot under a running sim is how saves get eaten. A
signed-in device that has NOT changed since its last sync takes a newer
account copy automatically at the menu (the phone-then-desk case) and only
offers it while flying.

**When.** A hash of the snapshot gates every upload: every two minutes while
playing, when the tab hides (after every module's own hidden-flush, hence the
`setTimeout`), on `pagehide` with `keepalive`, and on SYNC NOW. Never two
uploads within 15 s; the site allows 60 per ten minutes.

**News.** `/api/news` is read once a launch and each unseen item lands on the
GNN news desk, oldest first, tagged by kind (`PATCH NOTES ·`, `UPDATE ·`,
`EVENT ·`), site markup stripped, at most five a boot. The seen-set is a
DEVICE key: a new pilot does not re-read the patch notes.

**The start card** carries one line under the callsign when a site is
behind the origin: who is signed in, or the single link to sign in, or
"loading your pilot from the account…".

**Also in this patch — a save bug found on the way.** The launch persist
wrote `terraform: {}` for the sky (the store had no terraform state yet) and
the atmo works' progress was gone from the save until the next scan or
beacon wrote it back — two reloads in a row without scanning lost it.
`launchSim` now carries the applied snapshot into the store before that
persist. `company.js` exports `flushCompany()` so a snapshot never reads a
1.5-second-old book.

**Site-side changes made for this (in `LivingGalaxy-Site-0.1.0`):** the game
page under `/play/` gets its own CSP with the response nonce stamped onto
every `<script>` (the site's page CSP had blocked the importmap and the boot
watchdog — the first cut booted to a black canvas); `js/data/` and
`js/shipgen/data/` are served (the first cut refused every `/data/` path —
same black canvas); `/net/*` and `/cradle/*` pass through to the game's own
`server.py` so the shared sky is online from `/play/` on the same origin,
with the tunnel routing those paths straight to :8080 in production.

**`server.py` takes `LG_HOST`.** Default unchanged (`0.0.0.0`, so a phone
on Wi-Fi is still joinable from the next device); `LG_HOST=127.0.0.1` keeps a
relay that sits behind the tunnel off the LAN entirely, which is how the
site's `deploy/lg-relay.service` runs it.

Files: `js/account.js` (new), `js/console/panels/corp-account.js` (new),
`js/console/panels/corp.js`, `js/profile.js`, `js/company.js`, `js/main.js`,
`js/sim.js`, `index.html`, `css/style.css`, `js/version.js`, `server.py`,
`test/account.test.mjs` (101, both against a stand-in API and the real
`lgsite.py` when `../site` is present), `test/smoke-account.mjs` (19: the
game served by the site, signed in from the console, the pilot carried to a
second browser, the relay online through the pass-through).

---

## 0.3.39 — 2026-09-22

NPC and drone hulls are measured the way the player's are.

Requested: do the NPC and drone hull toughness numbers.

**A correction first.** I had described these as flat per-role numbers that
ignored the frame. That was wrong — `hullPerf` has always scaled them by mass.
The fault was narrower and stranger: the scale was
`clamp(massT / 60, 0.6, 2.4)`, linear and **clamped**, against a registry
whose mass runs from 9 t to 7,500 t. It saturates at 144 t.

| tier | mass | hp before | hp after |
|---|---|---|---|
| A | 12 t | 156 | 153 |
| B | 34 t | **156** | 216 |
| C | 90 t | 390 | 297 |
| D | 260 t | 624 | 422 |
| E | 700 t | **624** | 585 |
| F | 2,200 t | **624** | 853 |
| G | 7,500 t | **624** | 1,279 |

Four tiers with no difference between them at the top, two at the bottom. A
7,500-tonne capital hull was exactly as hard to kill as a 144-tonne one, and
the player's own pools — rebuilt in 0.3.34 — had quietly overtaken them: a G
frame gave the player 920 hull against an NPC's 624 in the same ship.

It is the **same power curve the player uses** now, off the same exponent in
`js/defence.js`, so both sides of a fight are measured one way. Spread across
the registry: **x4.0 → x9.2**, against the player's x9.2. Screens come off the
reactor rather than the mass, as the player's do.

**And two roles had no entry at all.** `supply` and `rogue` were in `ACCEL`
and `TURN` but never in `TOUGH`, so both fell through to `DEFAULT_TOUGH` — a
generic 160/60 nobody had tuned for them. That is the same shape as the gun
bug in 0.3.35: a default quietly catching whatever nobody remembered to list,
and the reason the new test walks the role list rather than checking names.

A nest drone now has numbers of its own: **90 hp and 20 shield** at the
reference frame, against a trader's 150/60. Scrap welded round a gun, dying
easily — the wave is the threat, not the unit. With 0.3.35's damage cut that
makes a belt fight shorter in both directions: about 2.5 s of turret fire per
drone against the 8 s it used to take.

`test/defence.test.mjs` goes to 59 assertions. Reverting the curve fails ten
of them and prints the old numbers back: `156, 156, 390, 624, 624, 624, 624`.

Changed: `js/npc/flight.js`, `test/defence.test.mjs`.

---

## 0.3.38 — 2026-09-22

The comms icon comes home, and a call can be answered again.

Reported: the incoming-comms icon gets pushed to the left side when not in
fullscreen, forcing a trip to fullscreen to answer. **This was 0.3.37's doing,
and it was worse than it looked.**

0.3.37 taught the comms puck to find a free slot by measurement, and among the
candidates were the left edge of the canopy. Two faults followed.

**The answer buttons did not go with it.** `.cx-answer` — accept and reject —
is positioned at `--cx-rail-right + 72px`, which is to say FURTHER from the
right edge than the puck. Move the puck to the left edge and that arithmetic
puts the buttons off the side of the screen entirely. The puck was reachable
and the call was not answerable, which is exactly what was reported. Going
fullscreen changed the viewport enough to pick a different slot, which is why
that worked around it.

**And moving it at all was the wrong idea in portrait.** A pilot learns where
the comms button is. A button that crosses the canopy because the screen got
shorter is worse than one sitting slightly close to a switch.

So:

- **The cluster is placed as one thing.** Puck and answer row are both
  collision-tested and both must be on screen; a slot that would strand the
  buttons is rejected outright. The row takes its usual place to the puck's
  left, or **flips to its right** when the puck is near an edge, and js/hud.js
  publishes `--g-answer-right` so the CSS follows — including the
  `pointer: coarse` rule, which is the one that applies on a phone.
- **In portrait the puck stays on the right rail.** Only the height is chosen.
  The far side is a landscape-only option, where the right rail is the
  throttle card from top to bottom and there is genuinely nothing else.
- **Candidates come from the real gaps**, not from fractions of the screen.
  Everything already on that column is sorted and the puck is offered each gap
  between one obstacle and the next, centred. A fixed ladder had been landing
  eight pixels inside the dash at 360x740 while a clear 64px band sat unused.
- **Candidates are scored, not just accepted or rejected.** Least overlap
  wins, with distance from home breaking ties — so where nothing is free the
  puck takes the smallest nuisance rather than falling back to a fixed
  position that sat on the CUT switch, and where several are free it takes the
  one under the systems strip rather than the first clear patch of sky.
- **Re-measured after the HUD exists.** The first search runs while `#hud` is
  still `hidden`, measuring a screen that is not there. A few late passes fix
  the slot once there is something to measure.

Hit-tested with a call ringing across twelve viewports: **zero covered
controls, and the answer buttons on screen and tappable in every one.**

`test/hudlayout.test.mjs` goes to 44 assertions, including that every
`.cx-answer` rule takes the measured offset — the coarse-pointer one had its
own hard-coded copy, and that is the rule a phone uses.

Changed: `js/hud.js`, `css/comms.css`, `test/hudlayout.test.mjs`.

---

## 0.3.37 — 2026-09-21

Bugs.

Five, found by chasing the three flaky tests I had been reporting rather than
re-reporting them. Two were real faults in the game; two were tests measuring
something other than what they claimed; one was a CSS row that could not
shrink.

### The shared clock could sit five seconds out, permanently

`js/net.js` chased the room's clock only when it was more than **2.5 seconds**
out, and did nothing inside that band. So one pilot could settle 2.4 s ahead of
the room and another 2.4 s behind — **4.8 s apart from each other, for ever**.
Measured in two real browsers: 4.3 s, 4.5 s, 5.6 s, 6.8 s. Everything the
shared clock drives — timetables, rock positions, who sees what and when — was
that far apart.

Two more faults in the same seven lines. The gains were **inverted**: more
than 12 s out corrected at 20% a poll while 6–12 s out corrected at 60%, so
the worse the drift the slower it closed, and nothing ever reached zero. And
the whole middle branch was gated on `sim.timeScale === 1`, which silently
disabled the chase around anyone joining at 40×.

Now one proportional chase, a gain that **rises** with the error, and a dead
zone of a quarter second. Modelled over the same offsets:

| offset | settles at (before) | settles at (after) |
|---|---|---|
| 2.4s | 2.40s — never closes | **0.24s** |
| 8s | 2.08s | **0.20s** |
| 40s | 1.77s | **0.22s** |

Worst case between two pilots: **4.8 s → 0.49 s**. In live browsers each
client now sits 0.6–1.3 s from the room clock, against a 2.5 s floor before.

### Two tests were measuring themselves

`smoke-shared-sky` read pilot A, then read pilot B, and asserted their
`sim.time` values were within three seconds. Under swiftshader with two WebGL
contexts a single `page.evaluate()` blocks on the page's main thread for
**0.6 to 4 seconds** — so the two readings were taken seconds apart in wall
time and the assertion was measuring the probe's own latency. A serial gap of
2502 ms produced a "2.89 s clock disagreement"; 3112 ms produced 3.60 s.

The pages are probed in parallel now, and the real question — *is each client
in step with the room* — is asked of each client about **itself**, with
`sim.time` and the room clock read inside the same evaluate where no latency
can get between them. The cross-check is on `born`, the room's clock zero,
which is exact, shared, and cannot be tripped by a busy test machine.

`smoke-droneops` asserted a GNN bulletin left **nothing** ringing. Port control
hails a hull that has just arrived, so a perfectly correct call from
"<port> CONTROL" was usually up at that moment — failing four runs in four by
the end. It now snapshots the comms session before the post and asserts the
bulletin started no new call and rang nobody from the news desk, which is what
it always meant.

### Every HUD control is finally on top of its own pixels

The short-screen collisions left open in 0.3.31, hit-tested across **twelve
viewports**:

| viewport | covered in 0.3.29 | 0.3.36 | now |
|---|---|---|---|
| 412×915 | 4 | 0 | **0** |
| 915×412 | 3 | 2 | **0** |
| 360×640 | 6 | 5 | **0** |
| 412×600 | 3 | 1 | **0** |

plus 320×568, 390×844, 428×926, 360×740, 768×1024, 844×390, 1024×768 and
412×732, all clean.

**The comms puck is placed by search.** A fixed offset cannot answer where it
goes, because what is beside it changes with the breakpoint *and* the
orientation — in landscape the systems strip is on the far side of the canopy.
It now tries a handful of slots and takes the first that collides with
nothing, falling back to the CSS number if none does. Critically, what it
avoids is **controls, not cards**: avoiding whole panels leaves no free 58px
square anywhere on a 915×412 screen, because the dash owns the full height of
the right column — but most of a card is readout, and sitting over a number
costs nothing while sitting over MAX costs you the button.

**The pulse rings were eating taps.** `.cx-puck__ring` sits at `opacity: 0`
unless a call is ringing and `inset: -2px` puts it two pixels proud of the
puck on every side. An invisible element still takes pointer events. It is
`pointer-events: none` now, which it always should have been.

**The systems strip reserved space for a card that is not drawn.** It sits at
`pad-t + 100px` to clear the gauges — and the `max-height: 640px` breakpoint
hides the gauges. Eighty-eight pixels held for nothing, on the shortest screen
in the game, which is what pushed the dash up over the strip and put CUT under
the throttle header.

**And a grid row that could not shrink.** `#hud .dash` used
`grid-template-rows: 1fr auto`, and a bare `1fr` carries an implicit
`min-height: auto` — the row never shrinks below its content's minimum. At the
620px breakpoint the dash is 150px tall, the throttle would not compress, and
the WARP / APPR row was drawn straight over the throttle's MAX button.
`minmax(0, 1fr)` is the row that was actually meant.

`test/hudlayout.test.mjs` grows to 37 assertions covering all of it.

Changed: `js/net.js`, `js/hud.js`, `css/comms.css`, `css/glass.css`,
`css/style.css`, `test/hudlayout.test.mjs`, `test/smoke-shared-sky.mjs`,
`test/smoke-droneops.mjs`.

---

## 0.3.36 — 2026-09-21

The server grew a console.

Requested: a `server.py` with coloured text, a statistics submenu showing live
figures, a submenu for chat logging, and a separate one for logging.

Three screens, each a live view and a menu, chosen by a single keypress:

- **`1` STATISTICS** — uptime, request count and rate (now and a 60-second
  average), bytes served, p50/p95 latency and the slowest path, a 40-second
  sparkline, a bar per status code, the method mix, every relay room with its
  pilot count and current host, ledger size and write activity, the LLM proxy
  if it has been used, and the busiest paths as bars. `r` zeroes the counters.
- **`2` CHAT LOG** — every hail, line and beacon crossing the relay as it is
  sent, with room, sender, recipient and kind. `f` writes it to
  `logs/chat.log`, `n` cycles a room filter, `c` clears the held lines.
- **`3` REQUEST LOG** — the request log as it is written, 404s in red and 304s
  dimmed. `p` turns raw `/net/poll` lines on without a restart (previously
  only the `LOG_POLLS` environment variable, set before launch), `e` toggles
  mirroring to the terminal.

`?` lists the keys from anywhere. Colour is plain ANSI — nothing to install,
and `NO_COLOR=1` drops the escapes while keeping the console.

**The console is opt-out by detection, not by flag, and that is the load-bearing
design decision.** Every browser smoke in `test/` starts the server as
`python3 server.py 8124 > log 2>&1 &`. A console that read a key in that
process would block forever; one that repainted would fill the smoke's log
with escape codes. So it opens only when **stdin and stdout are both
terminals** — which a redirect makes false. Redirect either and the server
prints its banner and serves in silence, exactly as it always did. `LG_MENU=0`
forces that off explicitly.

**Chat is separated from the request log on purpose.** The request log answers
"did that module load"; the chat log answers "what did anyone say". Mixing
them made both harder to read. The relay is the only place a message can enter
the game, so one hook in `Relay.send` catches every hail — and states are
deliberately excluded, because a screen full of position updates is not a chat
log. The book reads the text out of whichever key `js/chat.js` used (`text`,
`line`, `body`, `message`, `say`) and falls back to compact JSON rather than
dropping anything.

Under the hood: statistics are per-second buckets rather than a running
average, because what you want while watching a phone join a room is what is
happening *now*, and an average over the whole run hides exactly that. The log
keeps a ring alongside the file, so the LOG screen costs no disk reads and
still works if the file cannot be opened. `Relay.describe()` and
`Cradle.describe()` compute their rows under the same locks the live
structures use and hand back plain values, so the console thread never
iterates a room a handler thread is writing to. The one lock nesting is
relay → stats and nothing goes the other way.

The relay protocol is untouched — same endpoints, same shapes, same
semantics.

New suite `test/server.test.mjs`, 38 assertions: it starts the server exactly
as the smokes do and checks the banner carries **no escape codes at all**, that
the whole relay protocol still answers (states, messages, `since=-1` fresh
joins, host election, world snapshots, the ledger), that the chat book finds
text under every key shape and never logs a state, and that the run log is
still written. Making the console ignore the terminal check fails it — the
server does not even come up, which is precisely what it would have done to
every other suite.

Changed: `server.py`, `js/version.js`, `test/server.test.mjs` (new).

---

## 0.3.35 — 2026-09-21

The drones that were actually killing you.

Reported, twice: drones are what destroy you, and quickly. **0.3.34 answered
the second half of that and got the first half wrong, and the second report
was still correct.**

### What went wrong

`js/turrets.js` has two loops that shoot at the player. `stepDrones` fires the
ambient swarm the file spawns itself. `stepPirates` fires **everything in
`HOSTILE_ROLES`** — and `js/npc/rogues.js` does `HOSTILE_ROLES.add("rogue")`,
so the 0.3.30 nest wave drones, the ones that swarm the belt, were on the
pirate profile:

| shooter | damage | cycle | dps |
|---|---|---|---|
| ambient swarm drone | 4 | 2.20s | 1.82 |
| **nest wave drone** | **6** | **1.16s** | **5.19** |
| actual pirate | 6 | 1.16s | 5.19 |

A nest drone was doing **2.9× what a drone does**, and 0.3.34's "drone damage
7 → 4" never touched it. Worse, 0.3.34 *measured* the change against the
ambient loop and published those numbers, so the patch notes claimed a trainer
got 18 s against seven drones and 7 s against a surge. Measured end to end
through the real chain — traffic → syncContacts → stepPirates → fire →
stepShots → applyDamage — what actually shipped was **6 s and 3 s**.

There was a comment, added in 0.3.34, reading *"pirate rounds stay where they
were: a crewed hull shooting at you is meant to be more dangerous than a
machine that wandered out of a nest"* — written directly above the line that
was giving machines out of nests a crewed raider's gun.

### The fix

The gun is a **per-role profile** now, not one number for everything hostile.
A rogue takes `DRONE_DMG` on the drone's cadence and gets no engagement wing
bonus, because a wave is not a wing. Pirates are untouched — verified
identical, 15 s and 6 s before and after.

And since it had been asked for twice, the drone gun itself comes down again,
4 → 3.

Measured through the real chain, trainer / C-frame / E-frame:

| | 0.3.34 shipped | 0.3.35 |
|---|---|---|
| 3 nest drones | 15s / 31s / 69s | **246s / survives / survives** |
| 7 nest drones | 6s / 11s / 23s | **27s / 63s / 184s** |
| 15 — a full surge | 3s / 5s / 10s | **10s / 21s / 45s** |

A fifteen-drone surge lands 20 dps where it landed 78.

### The real lesson

Not "check the number" — one gun for everything in a set that other modules
can `add()` to is a bug waiting for the next arrival. New suite
`test/hostilegun.test.mjs`, 26 assertions, and the load-bearing one walks
`HOSTILE_ROLES` at runtime and fails if any member lacks its own profile. A
role added without one can no longer silently inherit a raider's gun. Run
against 0.3.34 it fails 14 assertions.

`DRONE_DMG` in `js/turrets.js` is the one constant to raise if the belt ever
feels toothless; 4 puts a trainer back to 19 s and 8 s.

Changed: `js/turrets.js`, `js/version.js`, `test/hostilegun.test.mjs` (new).

---

## 0.3.34 — 2026-09-21

A hull can take a hit, and some hulls can take more than others.

Reported: rogue drones are what kill you, and quickly — damage taken needs
balancing against mitigation from shields, hull and armour resistances.

**Measured first, and the measurement was the story.** Every hull in the game
had exactly 100 hull and 100 shield. Not a balance choice: `hullMaxOf()` read
`ship.hullMax ?? 100` and **nothing anywhere ever set `hullMax`**. A 468,000 cr
World Frame at 7,500 tonnes was as fragile as a 4,400 cr Buoy Skiff at nine.
Tier bought thrust, cargo and reactor and not one point of survivability.

Worse, the NPCs were never like this — `TOUGH` in `js/npc/flight.js` has given
them 150 to 280 hp and 50 to 170 shield for ages. **The player was the most
fragile thing in the sky**, and had been the whole time.

Time to kill, against the real damage model, before:

| | 3 drones | 7 drones | 12 | 15 |
|---|---|---|---|---|
| any hull, A through G | 26s | **8s** | 5s | **4s** |

Identical down the entire registry, because the numbers had nowhere to come
from. The best armour refit in the game bought 0.9 extra seconds. And since
0.3.33 a hull at zero is a hull gone for good.

### Three things, meant to be read together

**Pools come off the frame**, from data that already existed on all 121 hulls.
Hull integrity follows mass, shield capacity follows reactor. Mass spans 833×
across the tiers, so the curve is a cube root rather than a line — a G-frame
is about nine times the hull of an A, not eight hundred.

**Resistances**, which did not exist at all. Damage now has a KIND — kinetic,
thermal or EM — and shields and armour are good at opposite things. A screen
bleeds off energy and stops **none** of a round; plate is excellent against
mass and nearly useless against induction. That asymmetry is why a drone swarm
goes through a screen that laughs at a laser, and why EM is the answer to a
heavily plated hull. Everything is capped at 62%: nothing is ever immune.

**Drone damage 7 → 4**, because after all of the above a rogue swarm was still
the fastest way to lose a hull you had just paid to insure. Pirate rounds are
untouched at 6–8 — a crewed hull shooting at you should be worse than a
machine that wandered out of a nest.

After:

| hull | 3 drones | 7 drones | 12 | 15 |
|---|---|---|---|---|
| A · 12 t | 73s | **18s** | 9s | **7s** |
| C · 90 t | 282s | 38s | 18s | 14s |
| E · 700 t | survives | 91s | 39s | 29s |
| G · 7,500 t | survives | 344s | 107s | 75s |

A trainer gets eighteen seconds against a pack instead of eight, and seven
against a full surge instead of under four — enough to decide to run, not
enough to ignore the belt. And buying a bigger hull is now a survivability
decision as well as a cargo one.

**Armour is something you can buy.** Hardened plating carries +12% kinetic,
the ablative jacket +16% thermal, and two new refits answer the gaps: a
**Faraday mesh** (+18% EM) and a **screen lattice**, which gives the field
something to bite mass with — 10% kinetic on the shield where a bare screen
has none. Each is good at one thing and no help at another, so a refit is a
decision about what you expect to meet. Resistances are summed rather than
multiplied and deliberately kept out of the `mods` bag, which is a product
over `MOD_KEYS` — a nested object in there would be multiplied into NaN by the
first race effect that touched it.

**Knock-ons, all checked.** The HUD gauges divided hull and shields by a
literal 100, so a 920-point frame would have pegged the bar at nine times full;
they read the ship's own maximum now. The refit yard prints the profile.
Repair scales with the pool — a full patch-up is 2,860 cr on an A and 23,920
on a G — which as a *share of hull value* actually falls with tier, 49% to 5%.
A refit that raises the pool heals into the new headroom rather than leaving
the bar at 300/920.

New suite `test/defence.test.mjs`, 46 assertions: pools monotonic up the tiers
and sane across all 121 hulls, shields and armour opposed, the cap holding
under absurd stacking, damage kinds reaching the ship through `applyDamage`,
and the time-to-kill numbers above pinned with fixed phase offsets rather than
`Math.random` so it is a measurement and not a lottery. Flattening the pools
and reverting drone damage fails 8 of them and reproduces the old world
exactly — every hull dying at the same seventeen seconds.

Two existing suites learned the new model: `test/experimental.test.mjs` had
asserted telemetry hull samples were literally `100`, and `test/upgrades.test.mjs`
required every refit to carry `mods` or `fx` — `resist` is a third kind of
effect now.

Changed: `js/defence.js` (new), `js/ship.js`, `js/sim.js`, `js/turrets.js`,
`js/upgrades.js`, `js/refityard.js`, `js/hud.js`, `test/defence.test.mjs` (new),
`test/experimental.test.mjs`, `test/upgrades.test.mjs`.

---

## 0.3.33 — 2026-09-21

Hulls can be lost, and hulls can be insured.

Requested: player, NPC and drone hulls need insurance, it costs credits, and
the tier decides the payout — Platinum 100%, Gold 75, Silver 50, Copper 25,
Bronze 10 of the worth of the hull lost.

**First there had to be something to insure against.** Nothing in this game
could lose a hull and mean it. The player's ship clamped to twelve points and
said "hull breach contained"; NPCs went dark for ten minutes and came back on
the same route; only a contracted drone could actually die, and when it did
you simply ate the loss. So the emergency stop is gone: hull at zero is a
hull lost.

**You are never stranded.** The hull is struck off your books, the policy pays
into your purse, and you come to at the nearest port in whatever you still
own — the next hull on your list, or the trainer everyone starts in, which is
what `currentShipId()` already falls back to. A pilot who never bought a hull
loses the cargo and the trip back, and not the game. A dead end would be a
worse game than a harsh one.

**A policy covers one hull and one loss, and is consumed by it.** No renewals,
no billing cycle, no lapse state. You buy cover for the hull you are about to
fly, and after it settles you decide again.

| tier | pays | premium | break-even loss rate |
|---|---|---|---|
| Platinum | 100% | 35% | 35% |
| Gold | 75% | 24% | 32% |
| Silver | 50% | 15% | 30% |
| Copper | 25% | 7% | 28% |
| Bronze | 10% | 3% | 30% |

Deliberately flat, and every tier is a losing bet unless you expect to lose
the hull about a third of the time. The high tiers are very slightly the worse
bet because what you are buying up there is certainty, and certainty is never
free.

**Cover is written against what a hull costs ITS OWNER, not list — and that is
the whole design.** The yard sells to a complex member in their own line at 45%
(`ISSUE_RATE`). Had cover been written at list, platinum would pay 1.00 for a
hull bought at 0.45 with a 0.35 premium: a 20% profit for throwing your ship
away, repeatable forever. Measured over the registry, writing at list would
open **242 hull-and-tier combinations that print money**, the best of them
+101,202 cr per deliberate loss. Written at the owner's own price, not one of
the 605 combinations is ever profitable to claim on purpose, and
`test/insurance.test.mjs` checks all of them.

**Drones** were already the one hull that could die for good, so they are the
one that most wanted covering. Cover is chosen once on the DRONES panel and
applies to the next commission; the premium is added to the build price in a
single treasury transaction, the policy attaches when the drone rolls off the
line, and a settlement pays back into the treasury. A drone that is *scrapped*
has its cover torn up unpaid — sold is not lost.

Policies live in a Map, not in the drone save file, so a reload would have
quietly voided cover the treasury had already paid for. Each drone remembers
its tier and its value, and the policy is written back from that on load.

**NPCs** carry cover too, seeded off the vessel id so a shared sky agrees
without a byte crossing the wire, and the distribution is a fact about the
operator: liners and law carry platinum and gold, belt miners carry bronze,
copper or nothing, pirates carry nothing at all. The mechanical meaning is
replacement speed — a covered operator has the money and is back on the board
in as little as 45% of the base time, an uninsured one takes 35% longer. You
can read a lane's underwriting off how well it keeps its traffic after a bad
week.

New suite `test/insurance.test.mjs`, 89 assertions: the tier table, single-use
policies, settling at the value written rather than the value today, the
exploit sweep over every hull and tier, the NPC distribution, and what
actually happens to you when the hull goes.

**Also: `test/ariaplay.test.mjs` is no longer flaky.** It failed about one run
in three — "1 jobs finished, 2 dropped", "40,000 → 2,180 cr" — because
`beginPlay()` took a seeded generator but `tickSim()` runs the whole world,
and combat, flight and traffic roll `Math.random` directly. Pinned the way
`test/reactive.test.mjs` already pins its sky. The thresholds are untouched:
the answer to a test that fails a third of the time is to stop the inputs
moving, not to lower the bar until the noise fits under it. Five runs, five
passes.

Changed: `js/insurance.js` (new), `js/ui/coverage.js` (new), `js/sim.js`,
`js/drones/ops.js`, `js/npc/traffic.js`, `js/stationdeck.js`,
`js/console/panels/work-drones.js`, `test/insurance.test.mjs` (new),
`test/ariaplay.test.mjs`.

---

## 0.3.32 — 2026-09-21

Ports and people stop repeating themselves.

Reported: there is a lot of reuse in station names and NPC pilot names. Both
halves were true, and both turned out to be arithmetic rather than opinion.

**Ports.** They came from five sector prefixes times seven suffixes — 35 names
per sector, 175 in the entire game. Measured across twelve systems: **42% of
ports carried a name another port also had**, and one system in five had a
duplicate inside itself, two ports on the same chart with the same name.

**People.** The forge itself was fine — the alien tongues measure around 2,900
distinct first names in 3,000. Terran was not. It drew a curated given name
62% of the time from a pool of 122, and a surname from a flat list of **65**.
Over three thousand terrans: "Piotr" 37 times. And since a vessel's callsign is
built from its captain's surname, the contact board repeated along with them.

**Stellar Names 1.2** is vendored into `js/vendor/stellar-names/`, trimmed:
the optional 1.97 MB FinNLP pool is not bundled, every list is filtered through
the forge's own `offensive()` check, and the surname list is sampled at a fixed
stride down to 8,000. 140 KB of JS against a 5.6 MB tree, 10 ms to parse.
Licences (MIT, Apache-2.0), upstream hashes and a full statement of changes are
in `js/vendor/stellar-names/NOTICE.md`.

`js/naming.js` is the seam. The sector word stays the anchor — a port called
Bastion or Smelt or Hookfall tells you what you are docking at before the
market screen does — and everything around it widens: **10,350 names**, three
shapes, uniqueness inside a sky guaranteed by construction rather than hoped
for.

| | before | after |
|---|---|---|
| port name space | 175 | **10,350** |
| two ports in one system share a name | 20% of systems | **0 of 400** |
| ports sharing a name across 12 systems | 42% | **3%** |
| terran surnames in 3,000 draws | 65 | **2,161** |
| terran given names in 3,000 draws | 1,266 | **2,483** |
| commonest terran given name | Piotr ×37 | **Anders ×9** |

**What this deliberately does not touch.** The alien tongues are left alone —
a korrash called "Aaliyah Aardema" would be a bug, not a fix — and so are the
family *shapes*, which are lore and not small pools waiting to be filled: the
veyd have no family name, the vantari carry a 12×12 compound, T-Synth carry a
foundry line and a number. The hand-picked terran lists stay too, as a *core*
drawn 20% of the time behind the wide pool, because they were chosen for a
deliberately global spread and the vendored registry skews European-American.
The split is tuned on measurements, with the table in `js/data/lexicons.js`.

**A name is not allowed to move a station.** The first cut of this drew from
the station builder's own seeded generator a variable number of times, which
shifted every draw after it — Sol quietly went from eight ports to eleven and
five suites failed, none of them about names. `stationName()` now costs the
caller's generator nothing, and `js/stations.js` makes the old two draws and
discards them on purpose. Same seed, same ports, same places, same hulls
parked at them. Only better named.

GNN's relay words went from 8 to 24 for the same reason: two systems apart
could both host "GNN Herald Station", which is a navigation problem rather
than a branding one.

New suite `test/naming.test.mjs`, 35 assertions, measuring the complaint
directly — collision rates, that a port still reads as its sector, that naming
twenty ports draws nothing from the caller's generator, that the vendored pools
span the alphabet and pass the forge's filter, and that the alien tongues and
family shapes are untouched. Reverting the two mechanisms fails 8 of them and
reproduces the original numbers: 65 surnames, commonest ×31, 17% of systems
with a duplicate.

Changed: `js/naming.js` (new), `js/vendor/stellar-names/` (new),
`js/stations.js`, `js/names.js`, `js/data/lexicons.js`,
`test/naming.test.mjs` (new).

---

## 0.3.31 — 2026-09-21

Controls that are on top of their own pixels.

Not reported — found by the browser smoke while checking 0.3.30, which means
it had been shipped and was waiting to be flown into.

**AFT, DN and SCAN were untappable.** The right-hand chip column is
bottom-anchored and grows upward; the RCS pad and the dash are stacked on top
of it by `--g-dock`, which was arithmetic over `--g-tools` — a count of the
chips, kept by hand in `css/glass.css`. 0.3.29 added the HOLD chip without
raising it, so the column grew 30 px past the box reserved for it and painted
ARIA over the pad's bottom row. The keys laid out correctly, looked right, and
did nothing.

The comment in that file describes this exact failure happening in 0.3.06, when
the fullscreen chip was added. A number someone has to remember to bump is not
a derivation; it is the same bug with extra steps. **So hud.js measures the
column now** and publishes `--g-dock` in pixels — on resize, on orientation
change, through a `ResizeObserver` so a chip that merely *unhides* is caught,
and again once web fonts land. Add a chip and there is nothing to maintain.
Measured live at 412×915 it comes out at 206 px, which is exactly what the
corrected arithmetic gives — so the fallback is right too, and
`test/hudlayout.test.mjs` fails if it ever drifts from the markup again.

**The CGO gauge did nothing when tapped.** 0.3.29 made it a button, but
`.gauges` is `pointer-events: none` so the canopy stays draggable through it.
A gauge that is a button has to take its events back, or it is decoration with
a cursor on it. Every tap was landing on the 3D canvas behind it.

**ASST and CUT were under the comms puck.** The same failure one rail over: the
puck hangs at a fixed 150 px down the right edge, a number that cleared the
systems strip when it was written. Measured, the strip now runs to y=208 and
the puck starts at y=160 — its pulse ring on ASST, its left edge on CUT. Flight
assist and the cutter, both untappable. The strip is measured too, and the puck
hangs below it.

*But only where there is room.* On a short screen the dash card rides up until
it already overlaps the strip — at 360×640 the dash starts at y=172 and the
strip runs to 208, a collision of its own — so dropping the puck below the
strip there only moves it onto the throttle. The measured rail is published
when the puck clears the dash at it and left unset otherwise, which keeps the
short screen exactly as it was instead of trading one covered control for six.

Hit-tested in a real browser, every visible HUD control against
`elementFromPoint`, four viewports:

| viewport | covered before | covered after |
|---|---|---|
| 412×915 portrait | 4 | **0** |
| 412×600 portrait | 3 | **1** |
| 360×640 portrait | 6 | **5** |
| 915×412 landscape | 3 | **2** |

**Still open, and pre-existing:** at 360×640 the dash card overlaps the systems
strip outright, which puts CUT under the throttle header whatever the puck
does; the puck sits on the throttle's preset ticks in landscape; and the warp
label covers MAX on a 600 px-tall screen. All three are on 0.3.29 as well.
They are a short-screen layout job, not a stale constant, and want their own
patch.

New suite `test/hudlayout.test.mjs`, 25 assertions, reading the source: the
chip-count fallback still matches the markup, the room check is still there and
the fallback is still the conservative one (a fallback equal to the measurement
makes the check a no-op), and every control inside a `pointer-events: none`
card opts back in. Reverting to the 0.3.29 values fails it by name.

Changed: `js/hud.js`, `css/glass.css`, `css/style.css`, `css/comms.css`,
`test/hudlayout.test.mjs` (new).

---

## 0.3.30 — 2026-09-21

The belt has weather.

Reported: rogue drones swarm the belts — they need to not always be there, and
not always the same number of them.

Both halves of that were exactly true. Every nest rolled the same fixed chance
(`WAVE_CHANCE`) on the same fixed cadence (`WAVE_SLOT`, 210 s), waves lived ten
minutes (`WAVE_TTL`), and the nests are seeded *inside* the belt radius, so
their waves crossed it constantly. Three nests on that arithmetic settle on a
constant: measured over two hours of a real seeded sky, the belt was occupied
94% of the time and averaged fifteen drones. Not a difficulty setting — a fixed
cost on every claim you ever work.

A derelict yard putting drones together out of whatever drifts past is not a
tap. It builds up, it spends itself, and it goes quiet. So the sky now runs a
**tide**: a slow pressure, 0…1, made of three seeded swells at 1450 s, 640 s
and 3100 s — deliberately not multiples of one another, so the pattern does not
repeat on anything you could set a clock by — raised to the 1.7 power so the
bottom is broad and flat. Long quiets, sharp surges.

- **Below `calm` (0.26) the nests hold.** Nothing launches. The nest is still
  out there and still worth breaking; it is just not sending anything.
- **A wave caught out by an outgoing tide is recalled** rather than left to
  expire: it breaks off and flies home, so a lull actually empties the belt
  instead of waiting ten minutes to.
- **The launch chance rides the tide**, up to ×2.1 at full surge.
- **So does the size of a wave.** A quiet sky that does send something sends
  two; a surge sends a swarm. The old flat 3–8 every time was much of what made
  the belt feel like a fixed cost.

The tide is deterministic in the sky seed and the shared clock, so two pilots
in one room get the same quiet and the same swarm without exchanging anything —
the same trick the belt and the timetables already use. `rogueReport()` now
carries it, so the console can say what the belt is doing.

Measured, two hours of a real sky, same seed, before → after:

| sky | clear before | clear after | mean before | mean after | peak after |
|---|---|---|---|---|---|
| sol | 6% | **21%** | 17.5 | **10.0** | 47 |
| proxima | 4% | **13%** | 17.6 | **10.1** | 42 |
| vega | 3% | **29%** | 14.1 | **7.3** | 36 |

Quiet arrives in usable stretches — up to fifteen minutes of clear belt, not a
flicker between waves — and a surge still peaks past fifty drones, which is the
half of this that should not have been fixed.

New suite `test/rogues.test.mjs`, 28 assertions, covering the curve, the seeding,
the hold, the recall, the size response, and — because the complaint was about
what the belt *felt* like, not about a curve — two hours of a real flown sky
counting hulls. Flattening the tide fails ten of them, including "the belt is
genuinely empty some of the time".

Changed: `js/npc/rogues.js`, `test/rogues.test.mjs` (new).

---

## 0.3.29 — 2026-09-21

The hold is a bag you can open.

Reported: there is no way to see or edit what the ship is carrying — there
should be a small slot panel showing the hold and what is in it, because that
is where the ore goes.

Everything the ship carried lived behind one number: the CGO gauge, a bar and a
total. You could see the hold was 84% full and nothing about what was in it —
not which ore, not what it was worth, and not which of it was somebody else's
consignment that you are being paid to carry and must not sell. The only way to
find out was to dock and read the trade desk.

**HOLD** now sits in the tools row beside CON and Map, and carries the fill
percentage on it. It opens a slot grid: one slot per good, the quantity on it,
the tonnage it is costing you, and what a unit is worth *where you are standing*
— the port's own price when you are docked, book value when you are not, and it
says which. Empty slots are drawn as empty, so how much room is left is
something you can see rather than a percentage you have to do arithmetic on.
Ore slots are tinted as rock.

Two things you can do to it from the seat, and only two — everything else about
trading is still the deck's job. **DUMP** drops it. **SELL** appears only when
you are docked. Neither will touch a consignment: a lot carried under a haul
contract is marked *consigned*, is left out of what the hold is worth to you,
and has no buttons at all. A partial consignment leaves the remainder yours and
dumping takes only your share.

The CGO gauge opens it too — but only in landscape, because the gauge strip is
`display: none` in portrait, which is how the game is actually held. That is
why the button is in the tools row and not only on the gauge.

Files: `js/holdview.js` (new), `js/hud.js`, `index.html`, `css/style.css`,
`test/hold.test.mjs` (new).

---

## 0.3.28 — 2026-09-21

The belt stops rebuilding itself under you.

Reported: asteroids regenerating while you are parked next to them — *"I'm next
to one and it keeps being generated into a different one"* — and the whole
field seeming to re-render whenever you are near it.

It was two things, and the second one is why it was worst exactly when you were
mining.

**The cell cache was keyed on the clock.** A rock is a pure function of its
cell — where it sits, how big it is, what class it is, what ore it holds — and
of the sky time, which is the only reason it was keyed that way. But the *only*
thing the clock actually decides is a ±60 u wobble and how worn it is.
Everything else is fixed. Keying the cache on time meant the whole 27-cell
neighbourhood was thrown away and grown again on every distinct clock value:
every sub-tick, for ever, whether or not anything had changed.

Measured at the hull inside a belt, one frame of the queries the game actually
makes — the renderer at span 2, plus six span-1 callers (turrets, autopilot,
avoidance, drones):

| | before | after |
|---|---|---|
| standing in a belt | 0.70 ms/frame | **0.05 ms/frame** |
| …with the cutter running | 0.79 ms/frame | **0.09 ms/frame** |

The cell is now grown once and kept. The wobble and the wear are refreshed over
the rocks that already exist — two trig calls and a map lookup each — instead
of re-deriving eight hashes, a taxonomic class and an ore for every rock in
range, sixty times a second.

**And cutting a rock threw the whole belt away.** `wearRock` called
`forgetRocks()` on every call, and the cutter calls it every frame it is
burning. So while mining — the one moment you are certainly parked next to a
rock and looking at it — the entire neighbourhood was invalidated and rebuilt
sixty times a second. It only flushes now when a rock is actually finished and
has to stop existing; wear itself rides the same refresh, so there is nothing
to invalidate.

### And a rock keeps its own shape

A grown body is that rock's real geometry; everything else in the belt draws as
one of a handful of class prototypes. So a rock crossing the body budget does
not fade — it changes shape. The set was recomputed by rank every frame with a
hard cut at the budget, and on a phone the budget is **four**: drifting through
the belt, nine different rocks fought over those four slots and swapped ten
times in two and a half seconds.

Three changes, all hysteresis:

* An incumbent ranks as `BODY_KEEP` nearer than it is, so a challenger has to
  be properly closer to take the slot rather than a metre closer for one frame.
* It keeps its body out to `BODY_FAR` × the grow radius, so the change of shape
  happens at the edge of the range where a rock is a few pixels across, not at
  arm's length.
* A body mounted in the last `BODY_HOLD` seconds is not evicted, and nothing
  evicts the rock under your lock or your cutter — nor one that is *nearer*
  than the rock asking for its slot, which the old least-recently-used rule
  would happily do.

A body that is mounted now also stays drawn while its rock is in range, rather
than being hidden the moment this frame's ranking put it outside the top slice.
The pool is capped at the budget either way, so it costs nothing that was not
already paid for — and it was that hide-and-unhide that turned a one-frame
reordering into a rock visibly changing and changing back.

Measured the same way: nine rocks and ten swaps became seven and six, the
budget stopped wasting a slot (three of four in use, now four of four), and the
rock nearest the hull holds its own geometry in every frame of the run.

Files: `js/field.js`, `js/sites.js`, `js/engine.js`, `test/perf.test.mjs`.

---

## 0.3.27 — 2026-09-21

A half-applied patch says so, instead of showing you a black screen.

Reported: 0.3.26 booted to the creation card with nothing rendering behind it.
The server log was clean — every module 200 or 304, not one 404 — which is
exactly what made it hard to see.

**What it was.** `js/sim.js` from 0.3.25 imports `lotMult` from
`js/economy.js`, which gained it in 0.3.24. In that folder 0.3.24 had never
been applied, so three files — `js/economy.js`, `js/traderoutes.js` and
`js/drones/ops.js`, the only three unique to that patch — were still the
0.3.23 versions. Every other file in the series had arrived, because
`contracts.js` and `sim.js` are carried by 0.3.25 as well.

ES modules resolve named imports at LINK time, before a line of anybody's code
runs. So a missing export is not an error at the call site — it is the whole
graph refusing to evaluate. Nothing mounts, nothing registers, and the static
shell in `index.html` is left on screen over a canvas nothing ever drew to.
The page looks alive and is not.

**This patch carries those three files**, so applying it repairs the tree in
one go. No need to re-apply 0.3.24 — doing that now would put 0.3.24's older
`sim.js`, `contracts.js` and `ariaplay.js` back over the newer ones.

### And it cannot fail silently again

`js/boot.js`. The entry point runs inside a guard, and `index.html` carries a
small classic-script watchdog that runs *before* the module — because a link
error in the entry module means nothing inside `js/` gets the chance to report
it. Eight seconds after load, if the game has not set `__lgBooted` and
something did throw, the failure goes on the screen in words:

> **This build is half-patched**
> ./economy.js does not provide **lotMult**, but another module was updated to
> expect it. Some files in this folder are a version behind the rest.
> *Re-apply **0.3.24** over this folder — that is the patch lotMult arrived in —
> then any later patches again, in order.*

`EXPECTS` maps an export to the patch it arrived in, which is what turns
"something is broken" into an instruction. Chromium, Firefox and Safari word a
link failure three different ways and all three are read. The panel covers the
shell rather than sitting behind it, because a black canvas under a
working-looking menu is the most misleading thing this page can show. It only
speaks when something actually threw, so a slow device is never accused of
being broken, and the message is escaped rather than injected.

Files: `js/boot.js` (new), `js/main.js`, `index.html`, `css/style.css`,
`js/economy.js`, `js/traderoutes.js`, `js/drones/ops.js` (the three 0.3.24
files, carried here to repair a tree that missed them), `test/boot.test.mjs`
(new).

---

## 0.3.26 — 2026-09-21

A career is a business, not a job list.

A career in this game already was a company: you sign hands off a hiring hall,
post them to watches, register a charter, settle people at ports where they
earn you a share of a wage for ever, and a board of three sits above you being
unhappy about different things. ARIA did none of it. She flew a one-seat hull
with an empty roster and an empty treasury for the whole of every run — a
courier with ambitions.

`js/aria/company.js` is the bridge's business side, and it is the same
machinery the deck gives you: `stationRoster` and `hireCrew` for the hall,
`setDuty` for the watch bill, `foundCompany`, `transfer` and `settleAsStaff`
for the charter. Nothing here has an economy of its own. If ARIA can afford a
hand, so can you, on the same terms, at the same desk.

**Payroll first.** A wage is a standing bill against the purse every ninety
seconds. She will not sign a hand she cannot carry for eight cycles out of what
the run is actually earning, because a ship that cannot make payroll loses the
crew *and* the morale — and morale is what the watch bill is worth. The one
exception is the first-hand scheme the game already runs: half wage, no bonus,
and she takes it even on a run earning nothing, because that is what the scheme
is for. The second hand is a bill and is treated as one. When the bill outruns
the earnings she pays somebody off, most expensive hand with no post first.

**Hire for the watch, not for the roster.** A hand is worth a wage if the hull
has a post for them — Engineering works off the maintenance backlog, Cargo
stows the hold, Medbay keeps the rest of them upright — or if their trade is
the career's own. `WANTED` is that list per department, career trade first, and
a second engineer scores below a first. New hands are posted to the watch the
hull is short of rather than defaulted to their trade.

**A charter when there is something to charter.** Registration is 2,500 cr and
an office. She waits until the run is clearly paying, then registers the
charter that matches what she actually earns from — a miner takes an Extraction
Charter, a gun takes a Security one, a trader takes Trading — because the
Registrar's seat on the board scores exactly that.

**Settle the ones the ship is done with.** A hand who is unhappy aboard, has no
post, or is surplus to the watch bill is worth more ashore: settled staff pay
the treasury a share of their list wage every cycle, for ever, and it is the
only income in the game that does not need the hull to be anywhere.

**And the treasury holds the surplus, not the working capital.** A treasury
that has swallowed the money the next run was going to buy cargo with is not a
treasury, it is a mistake — the first version of this banked everything above
six thousand credits and left her unable to afford a single route.
`workingCapital()` is sized off the hold she has to fill and the run she could
actually afford, bounded both ways, and it stays aboard; the rest is banked and
drawn back when the purse gets thin.

### Net worth, not the purse

Giving her a treasury broke the scoring on contact: every move that ended with
a port call scored as a loss, because the money had not gone anywhere — it had
gone into the company. A business is measured by what it is worth, so the brain
now learns from `netWorth()` — purse plus treasury — and the screen shows the
split. Without that fix she would have learnt, correctly and uselessly, that
docking makes you poorer.

The screen gained a BRIDGE line (`4/6 crew · 3 posted · 500 cr/cycle · morale
81 · Ninefold Extraction · 2 ashore · 18,400 cr banked`) and a BOARD line with
the three seats' verdicts and the company's confidence. The bench's per-career
rows now carry crew, staff ashore and treasury, so "does this career build
anything" is a question it can answer.

Files: `js/aria/company.js` (new), `js/ariaplay.js`, `tools/aria-tty.mjs`,
`tools/aria-play.mjs`, `tools/aria-bench.mjs`, `test/ariabiz.test.mjs` (new),
`test/ariaplay.test.mjs`.

---

## 0.3.25 — 2026-09-21

ARIA flies like a pilot, in the sky you are actually in.

Reported, from a real run: the bots pick destinations without looking, do not
lock or mark anything, ignore gravity wells, decide from three numbers instead
of from the system, and finish port calls in a single frame so nothing costs
what it should. And they boot a private copy of Sol beside yours instead of
joining it.

### She looks before she chooses

`js/aria/senses.js`. One call builds a SNAPSHOT of the whole situation from the
live sim, and everything downstream reads that rather than reaching into the
world itself: the hull (integrity, charge, hold, what is in it, whether it is
armed, whether it is in a belt), the space around it (every well and whether
she is inside one, hostiles in weapons range, rogue nests, rock under the nose
and which ores are in reach), every honest port (distance, whether the corridor
to it is clear, its shelf priced both ways, what it is short of, what it will
pay over the odds for, the repair rate, your standing with the owner — and its
PRODUCTION LINES, running or stalled and on what), the board by department, and
the market's own best runs.

It is a snapshot rather than a set of getters for two reasons. It is cheap —
two hundred looks in a few milliseconds, because the expensive layers rebuild
on their own cadence (ledgers every 20 s, the board every 45, space every 2)
rather than per tick. And it is honest: every decision in one think is made
against one consistent picture, the way a pilot decides from what the panel
said when they looked at it.

**A stalled line is a standing order nobody posted.** `unpostedWork()` reads
the ledgers rather than the board: the smelter at Smelt Station has stalled on
iron ore, Furrow Ring has iron ore on the shelf, and the port will pay shortage
prices for it — that is a trade run with a reason, and it is now one of the
moves she can take (`supply`). Reading the ports instead of only the adverts is
the difference between a bot and a trader.

### She flies it like a pilot

`js/aria/nav.js`. She **locks** the target (`selectBody` — P-LOCK, which is
what the warp core, the cutter and the turrets all read; a bot that never locks
has its guns pointed at whatever is nearest), **marks** it on the chart so a
human in the same sky can see where she thinks she is going, and then checks
the corridor. A body inside the core's own `losMargin` is a leg it will refuse
— and the executor's answer to a refused leg was to keep trying, which is how a
run spent twenty minutes at "cruise · 387 km" and got dropped for being stuck.
She now computes a **dogleg**: a point out to the side of the blocker, far
enough that *both* halves are corridors the core will hold, and flies two legs
instead of failing one. If nothing clears it, the job prices at infinity and
she takes different work — which is an answer, not a failure.

**And a leg costs what a leg costs.** `legSeconds` prices the climb out of
whatever well is holding her, the spool, the run at the sim's own 55,000 u/s,
the fall at the far end and the berth. The old estimate divided distance by a
flat cruise number and returned *three and a half seconds* for a four-minute
leg, which is why she would rate a job four hundred kilometres away above one
at the port she was standing on. Every job on the desk now carries an honest
estimate and they are ranked on it.

### The crane is not the till

`js/dockwork.js`, and it is a game rule, not a bot rule — the same for you.

Every trade in the game settled in one frame: a hundred and sixty girders left
the hold, the credits landed and the clamps let go on the same tick. So a hold
of anything cost the same to move as a crate, and ARIA's credits-per-minute
counted the flying and not the loading, which means the 0.3.24 bench measured a
game nobody plays.

You still agree a price and the money moves at once. The CRANE books time at
the berth — scaled by TONNAGE, not units, so eight shield coils are quick and
eight hundred rations are not; cumulative across one port call, so a buy and a
sell on the same visit wait for both; faster with a better cargo rig
(`mods.handling`). Undocking is what enforces it, so the deck button, the
autopilot and the mission executor all hit the same refusal and wait it out:
*"Smelt Station control: cargo handling — loading 120 stainless · 10 s. Clamps
stay on."*

### She joins your sky

The relay client now **joins** before it flies (`tools/aria-net.mjs`). A room
is born when its first pilot enters it, every client chases `now − born`, and
the timetables, the belt drift and the port lanes are all functions of that
clock — so a bot on its own clock is in the same sky at a different hour. It
now adopts the room's clock, and if another pilot holds the sky it pulls their
snapshot of it rather than growing its own rocks. The runner says which it got:
*"joined sol: 1 other hull, clock in step, sky from p4a91c"*.

### And it forgets what it learned under different rules

A brain is worth what the rules it was learned under are still worth. The run
in the report carried `route` at 11,209 cr/min — a number from before 0.3.24
took 46% out of trade routes — and kept picking it in a sky where it no longer
existed. A brain now carries a signature (the build, the price band, the pay
constant); a mismatch is discarded rather than believed, and the runner says so
on the way in.

Files: `js/aria/senses.js` (new), `js/aria/nav.js` (new), `js/dockwork.js`
(new), `js/ariaplay.js`, `js/sim.js`, `js/contracts.js`, `js/profile.js`,
`tools/aria-net.mjs`, `tools/aria-play.mjs`, `tools/aria-tty.mjs`,
`test/ariasense.test.mjs` (new), `test/dockwork.test.mjs` (new).

Next: crew and the corporation — hiring, settling and running a company from
the bridge, so a career is a business and not just a job list.

---

## 0.3.24 — 2026-09-20

The market notices a full hold; ARIA gets a terminal you can read.

Two things in one version because the second is how the first was measured.

### The screens

`tools/aria-tty.mjs`. A scrolling log is a bad instrument — you cannot see at a
glance whether a career is making money, what it is doing right now, or how far
through the job it is. Each instance now holds a STATIC screen that repaints in
place: the pilot's name and career in the career's own colour, the purse and the
rate, bars for everything that is a fraction of something (hold, charge, hull,
job progress, the clock on the contract), the move in hand, what the helm is
doing about it, what the brain has learned so far, and a short tail of events
under it.

One 256-colour hue per career and no two alike — mining orange, commerce gold,
logistics cyan, security red, salvage rust, energy lime, research violet,
healthcare pink, agriculture green. Run four terminals side by side and the four
careers are legible without reading a word. Plain ANSI: no curses, no
dependency, works over ssh and in Termux. Piped to a file it falls back to one
line per change, so `> run.log` still produces something you can grep.

`tools/aria-bench.mjs` is the instrument the rebalance needed: every career
flown from the same purse, in the same sky, off the same seed, for the same
minutes of sky, and a table at the end with the market's own numbers under it.
`--json` writes it, `--compare` diffs two runs. Each career flies in a PROCESS
OF ITS OWN — the first version ran them in one, and reported eight of nine
careers earning identical money without flying at all, which is a fact about the
harness and not about the game.

### The rebalance

0.3.22 left a note: trade routes were clearing 43,590 cr in a three-minute run
while the best mining contract paid 2,700 cr/min. The bench turned that note
into a measurement — nine careers, three exploration seeds each, eighteen
minutes of sky apiece, same purse, same sky — and found something worse than
the note said. The best route paid **7.7× the median career**, and the careers
that did best were the ones that gave up and traded.

Sell ÷ buy on the top twenty routes averaged **2.17×**: a hop doubled your
money. Three causes, all fixed.

**A lot moved at one price.** Every trade priced the whole consignment at the
MARGINAL price — what a single unit was worth — and applied it a hundred and
sixty times. A hold of girders emptied into a port that wanted forty still
fetched bare-shelf money on the hundred and sixtieth, and the shelf you had just
filled did not find out until the next economy tick. `lotMult` in
`js/economy.js` now walks the port's own stock curve as the lot lands,
integrated over the fill; `askPrice`, `bidPrice`, `sellPriceAt`, `buyPriceAt`,
`tradeBuy` and `tradeSell` all take the quantity, and `js/traderoutes.js` sizes
a run and then prices BOTH ends at that size — so the route board's estimate is
still exactly what the till will do. It is not a penalty on trading. It is the
reason to find a second buyer.

**The band was too wide.** `PRICE_FLOOR` 0.6 and `PRICE_CEIL` 1.7 is a 2.83×
swing between a glutted source and a bare buyer, before the sector spread
(another 1.3–1.6×) goes on top. That is where a doubling per hop came from: buy
at the floor, sell at the ceiling, fly the same two ports forever. Narrowed to
**0.72 … 1.45** — a 2.01× swing, which still makes a shortage worth flying to
and a glut worth avoiding.

**And the desk did not pay enough.** Those two took 46% out of route profit,
which was the point — but the first re-measurement showed they took the careers
down with them, because a delivery's pay is built on the port's bid and the bid
moved too. The median career fell from 603 to 465 cr/min and the ratio barely
improved. So the other half: `BOARD.pay`, one named constant on the posted pay
of every job (`js/contracts.js`), at **1.7**. It moves every department at once,
which is what you want for parity and not what you want for flavour, and it is
the number to reach for when a career feels thin.

Measured, before and after, same bench:

| | before | after |
|---|---|---|
| mean sell ÷ buy, top 20 routes | 2.17× | **1.70×** |
| top sell ÷ buy | 2.18× | **1.63×** |
| best route | 4,670 cr/min | **2,523 cr/min** |
| best single trade run | 23,400 cr | **12,642 cr** |
| **best route ÷ median career** | **7.74×** | **2.53×** |
| median career | 603 cr/min | **996 cr/min** |
| worst career | −937 cr/min | **+184 cr/min** |
| best ÷ worst career | 2,331× | **14.7×** |
| careers earning most from `route` | — | 1 of 9 |

Eight of nine careers now make their money on their own department's board.
No career loses money over a run any more. Trading is still the best pure-profit
path in the game and should be — it is now two and a half times the median
career rather than nearly eight.

Per-career figures move a lot between seeds (a career's band over three seeds
can be 500–2,400 cr/min), so the table above reports medians and the aggregate
ratios are the load-bearing numbers. `--seeds` exists because of that.

### What ARIA found while it was being measured

Every one of these is a bug the bench surfaced by flying into it:

* **She flew a hull at six per cent for a whole run.** There was no yard in her
  head at all. There is now — a repair move, a repair on arrival at any yard,
  and a break-off rule that abandons the job and runs when the hull drops under
  30%. Both are rate-limited, because the first version spent a whole bench
  doing break-off, dock, spend what was left, take another job, break off: 146
  moves and 98 cr a minute.
* **A picket sweep parked on the dock.** A picket point is a station target with
  an offset on it, and flying to "the station" put her nineteen kilometres from
  the point the contract was watching. Every visit target is now resolved
  through the desk's own `targetPos` — the same function the contract checks you
  against.
* **A drone cull is flown from on top of the nest.** It cost a patrol boat 88%
  of its hull in seventy-three seconds. She stands five kilometres off it now,
  and goes out with the guns hot and the shields up rather than cold.
* **The crew packed the hold with the wrong rock.** 0.3.22 taught the cutter and
  the drone miners to prefer the ore a contract named. They now also stop
  loading anything else once the hold is past 70% on a job that named one — a
  contract that cannot be finished because the crew filled the hold with a
  better rock is the crew's fault, not the belt's.

### Still open

Security remains the weakest career, and honestly so: rogue-nest combat needs
manoeuvring the autopilot does not do, so ARIA's brain scores those jobs at zero
and stops taking them, which is the scoring working rather than the career
working. That is 0.3.25's problem, and the bench is now the way to tell whether
it got fixed.

Files: `tools/aria-tty.mjs` (new), `tools/aria-bench.mjs` (new),
`tools/aria-play.mjs`, `js/economy.js`, `js/sim.js`, `js/traderoutes.js`,
`js/ariaplay.js`, `js/contracts.js`, `js/drones/ops.js`,
`test/economy.test.mjs`, `test/trade.test.mjs`, `test/ariaplay.test.mjs`.

---

## 0.3.23 — 2026-09-20

NPC chat comes apart from the engine that drives it.

Reported: separate out NPC chat, so an improved addon dialogue pack can supply
it.

Until now "what an NPC says" and "how the band decides who says it" were one
file. `js/npc/speech.js` built the band, picked the pair, picked the topic,
ran the exchange and put the speech engine's own words straight into the comms
log. There was no seam — so no pack could give a hull a different voice without
editing core, and the 18+ pack could reach crew talk and nothing else.

**The seam** (`js/npc/chat.js`). The ENGINE still decides everything that is
simulation: who speaks, to whom, about what, on which channel, and what it does
to regard, memory and corporate standing. A registered VOICE only gets the
finished beat and may re-word it:

```js
registerVoice({
  id: "my-pack", rating: "core", priority: 5, channels: ["direct"],
  roles: ["mine"], topics: ["ore"],
  line(beat) { … },      // one line of an open-band exchange
  reply(beat) { … },     // an answer on a call you opened
  chips(unit, turn) { … } // extra things you can say to this hull
});
```

A beat carries the text, the channel, the topic, the move, the frame, the turn,
both speech units, the speaker's role and register, the regard between them and
the game entity behind the voice. Returning `null` declines and the core words
stand, which is the normal case; **throwing also declines** — a broken pack
degrades to vanilla, never to silence, and the throw is counted in the report
rather than swallowed.

**Rating is the gate, and it is off.** `core` is the vanilla band and is what
every install starts at. A voice declares the rating it writes at and is never
consulted above the rating the player has set themselves; the setting is
remembered per device (`lgaa.npcchat.v1`). Because the open channel is a public
room, a rating also caps the channels it may touch at all: `mature` may dress a
direct call and a hail, `adult` may dress a direct call and nothing else — so
an adult voice cannot reach open-band chatter even if it asks for it.

**The 18+ pack gets a band voice** (`addon/adult/npc.js`). Registered at
`adult`, confined to `direct`, gated on the house-rules switch, and it declines
unless the hull's regard for you is already warm — regard is the engine's own
auditable number, so "somebody you have flown with" is a fact and not a mood. It
draws from the pack's talk bag only: the act bags belong to a private scene
between two people who chose it, and who is listening on a comms channel is an
open question.

Files: `js/npc/chat.js` (new), `js/npc/speech.js`, `js/hud.js`, `js/profile.js`,
`addon/adult/npc.js` (new), `addon/adult/index.js`, `test/npcchat.test.mjs` (new).

---

## 0.3.22 — 2026-09-20

ARIA plays the game, in a terminal, with no renderer.

Reported: ARIA should be able to run playthroughs — a script that runs the game
without rendering in another terminal, one terminal for the world and one per
pilot, different hulls for different career paths, so she can learn to play
them.

One terminal runs the world:

```
python3 server.py 8080
```

and a terminal per pilot runs a career in that same sky, in the same room:

```
node tools/aria-play.mjs --career mining   --minutes 20
node tools/aria-play.mjs --career commerce --minutes 20
node tools/aria-play.mjs --career security --minutes 20 --hull general_c
```

Each instance boots the sky from its seed — generation is deterministic, so
every instance and every browser tab builds the same one — flies a hull of the
career's own line, and pushes its position to the relay `js/net.js` already
uses, so a player in a browser on that server sees ARIA out there working.

**The brain** (`js/ariaplay.js`) is small on purpose. A MOVE is a kind of work
with a target (`board:mining:vein`, `chain:trade`, `route`, `mine`, `sell`);
every run of a move is scored by the only number that matters, credits per
minute of sky; choosing is epsilon-greedy with a hard lean toward her own
career's department, so a miner learns mining first but can still find out that
a route pays better. The brain is written to `logs/aria-brain-<career>.json` and
read back, so a career gets better the more it is run.

Every move is executed by machinery the player uses — the contract desk, the
trade routes, the mission executor, the autopilot. `jobPlan(a)` turns a job in
hand into a MISSION, and the test asserts every plan it builds `validate()`s as
a mission you could have written yourself. Nothing reaches into the sim and
moves the hull by hand, so a bad number in ARIA's report is a bad number in the
game.

**What she taught us on the first night out**, and what got fixed:

* A chain stage's `qtyK` could take an order past the hold. You could accept it
  and never finish it. Chain tonnage is now capped at 92% of the hull.
* A field trip to Venus was uncompletable. A body target's position is the
  body's *centre*, and the visit radius was a flat 15 km — which is inside the
  planet. Body targets now count at their own survey range (`visitRadius`).
* A mining loop sent for nickel came home with a hold of whatever it brushed
  past. Under autopilot the cutter now works the ore the contract named while
  there is any in reach, and the drone miners do the same; your own hand at the
  cutter is unchanged, and so is a free run. The belt's other ores are still
  there to cut — the point of a job site was always that a run pays twice.
* A buy-and-bring job with nowhere to buy it is a hold full of nothing and a
  broken contract. She checks the shelves, the purse and the margin first.

Files: `js/ariaplay.js` (new), `tools/aria-play.mjs` (new), `tools/aria-net.mjs`
(new), `js/contracts.js`, `js/autopilot.js`, `js/turrets.js`, `js/sim.js`,
`js/drones/ops.js`, `test/ariaplay.test.mjs` (new).

---

## 0.3.21 — 2026-09-20

Work that remembers you: chain contracts.

Reported: make sure each career has deep-reaching missions, and some that are
chains requiring multiple stages — for every career path, not just mining.

A one-off job is a transaction. A CHAIN is a relationship: four or five stages
posted one at a time, each one an ordinary board job, strung on a story that
moves. A furnace relit charge by charge. A manifest that keeps not saying what
is in the case. A ring section built out girder by girder. Finish a stage and
the next one is waiting — here, or at the port the desk sends you to — and the
last one pays a bonus and a block of standing on top of the stage's own pay.

**21 chains, 98 stages, every department covered**: mining 2, logistics 2,
trade 2, security 2, salvage 2, industry 3, energy 2, science 3, civic 3. Each
was written by an author working only in its own department, so the work sounds
like the trade it comes from.

**A chain invents no mechanics.** Every stage names a KIND its own department
already posts (`mine`, `courier`, `tender`, `patrol`, `pod`, `reactor`,
`assay`, `relay`…), and the engine builds the stage from that kind and then
overrides the tonnage, the good, the pay and the prose. Which means a chain
stage is something the game already knows how to complete, and the numbers in
it — amounts, ore names, port names, drift names — are the live sky's, not the
author's. A mining stage still picks a drift and lays a seam in it (0.3.20).

**A chain starts in exactly one place.** Chains are dealt out across the honest
ports of a sky, each to the best-hashing port of a sector it belongs in that is
not already carrying its share, so a chain is somewhere you can go back to and
a tour of the sky turns up work you have not seen. `at: "same"` posts the next
stage at the port you are standing in; `at: "next"` sends you to a neighbour the
engine picks and names.

**Breaking one off closes the file.** Abandon or run out of time on any stage
and the whole chain drops and cools off for forty minutes before it returns —
the desk is not going to hand you stage four after you walked away from stage
two.

The board shows a chain stage with its chain's name and `Stage 2 of 5` where the
tier would be, an opener carries the chain's blurb, the closing stage says what
the bonus is, and a strip at the top of the desk lists what you are running and
where the next stage is waiting.

Files: `js/data/chains.js` (new), `js/chains.js` (new), `js/contracts.js`,
`js/boardview.js`, `css/style.css`, `test/chains.test.mjs` (new).

---

## 0.3.20 — 2026-09-20

A job with rock in it tells you where the rock is.

Reported: mining missions should pre-generate a patch of asteroids in a belt
section the desk picks, and give you somewhere to warp to — with the ore the
job wants seeded *into* the belt that is already there, so the other ores are
still worth cutting while you are out there.

**`js/sites.js`** — job sites. The desk picks a stretch of belt when it posts
the job (`pickSpot`): an angle near the port's own, a radius inside a real
belt, a name, a bearing and a range — *the Kestrel Drift — 412 km out from
Smelt Station, bearing 214* — deterministic in its seed, so the posting, the
chart and the rock all agree. Accepting opens a **site**: 4–16 rocks laid in a
sphere around the spot (denser at the heart), carrying the job's ore, cutting
rich, drawn as the asteroid class that actually holds that ore, with real keys
(`site:<jobId>:<i>`) so they assay, cut, wear and disappear through exactly the
same paths as the field's own rock.

`js/field.js` asks for them per cell (`siteRocksInCell`, one bounding-box test
per site) and lays them **on top of** what the cell already grows — a site is a
good seam inside an ordinary belt, not a replacement for it. The test sky's
sample: 5 job rocks with 18 other ores in reach. Opening or closing a site
clears the rock caches through `siteHooks.onChange`.

**On the board.** Mine, ice run, vein strike and assay jobs all carry a spot;
the posting says where it is; accepting puts it on the chart, points
`sim.autoPlan.seam` at it (so MINE HERE and MINE LOOP work the site) and adds a
**MINE IT** button to the in-hand row that hands it to the mining loop. The
in-hand line reads "0/120 Chromite · cut it in the Kestrel Drift" until the ore
is aboard, then "deliver at …". Ice runs take a spot past the frost line, vein
strikes a tight rich pocket, assay jobs a small one. Wreck recoveries and cargo
pods name a drift too, which also ended two postings sharing a title.

Delivering, abandoning, letting a job expire or resetting the board closes the
seam, and the belt goes back to exactly what it was.

**Tests.** New `test/sites.test.mjs` (30): spots are deterministic, in the
belt, named, bearing and range; a site's rocks are in `nearbyRocks` at the
spot, all carry the ore, cut rich, are the right class, and the cell's own
count and ores are unchanged around them; a site rock wears out and vanishes
like any other; `siteReport` counts what is left; closing restores the cell;
every rock job on every desk posts a place; accept → seam + chart + autopilot
seam; deliver → paid and the seam closed; abandon → closed. New
`test/smoke-site.mjs` flies it in a browser. `smoke-rocks` and `smoke-mining`
green.

All 49 node suites green.

---

## 0.3.19 — 2026-09-20

TRADE RUN works, and trading pays.

Reported from play: the working preset build "Trade" doesn't work, and a trading
career has no way to make money.

**Why TRADE RUN lost money every round.** It was `DOCK nearest-port → BUY
(good: null) → DOCK best-buyer → SELL all → CHARGE`, and every part of that
conspired:

1. *BUY picked the cheapest thing on the shelf.* With no good named it asked
   `bestPortFor("sell")` for one "best buyer" — scored on the value of the hold
   **before** buying (empty, so 0 everywhere) plus distance, so the port you
   were docked at won — and then took the good with the best margin *at that
   port*, which is `0 − price`: the cheapest line.
2. *"Best buyer" was the same port.* Twenty cheap units barely moved the score,
   so step 3 resolved to the port you were at, `EXEC.DOCK` saw you docked there
   and returned done at once, and step 4 sold the goods straight back at the bid
   — below the ask you had just paid. A guaranteed loss.
3. *Rounds two and three never left the port* — "nearest port" was already
   satisfied, and UNDOCK was only ever inserted once, at start.
4. *SELL "all" sold everything* — including a haul contract's consignment and
   your mined ore — and ignored a port that ran out of credits.
5. *The port preference pushed favourites away.* `score *= preferenceFor(...)`
   on a negative (distance-only) score makes a favoured port *less* attractive.
   It touched MINE LOOP as well.

**`js/traderoutes.js`** — the trader's instrument. For a hull with a hold and a
purse, every buy-at-A-sell-at-B run between honest ports: the good, the units
(what A has, what the hold takes, what you can pay, what B's till can pay out),
the margin at the exact prices the desks transact at (`buyPriceAt` /
`sellPriceAt` — a trade moves the whole lot at one price, so the estimate *is*
the transaction), the profit, and the time to fly it from where you are. Legs
with a world across the line right now are left out (the autopilot would refuse
them). Ranked by credits a minute.

**TRADE RUN flies a route** (`presets()`; the trade ops live in the new
`js/mission/tradeops.js` — `run.js` is on the 600-line gate):
`DOCK the route's source → BUY the route's cargo → DOCK the route's buyer → SELL
the route's cargo → CHARGE`, five rounds. Two new ref kinds, `trade-source` and
`trade-dest`. The route is picked when the source dock resolves at the top of
each round and kept to the sell, so the buyer is the port the cargo was bought
*for*; a run that starts docked at its route's source doesn't undock first; the
round's net is logged ("+23,270 cr on the round"); the route is saved with the
run, so a reload mid-round still knows where the cargo is going. No route that
pays from here → a clear failure, not a loss.

Also fixed, for every mission: BUY with no good now takes the best route *whose
source is this port*; SELL "all" sells only what is ours (`sellable()` subtracts
consignments) and a till that runs dry is reported, not swallowed; the port lean
divides a negative score instead of multiplying it.

**MARKET › ROUTES** (new sub-tab): the best eight routes from where you are,
with hold, purse and cr/min, **FLY IT** (a one-off run of exactly that route:
dock A, buy, dock B, sell) and MARK; and a RUN for the TRADE RUN loop. Every
market desk (console and deck) gains ROUTES FROM HERE — the three best runs off
this shelf, each with FLY IT. With 0.3.18's Trade & Procurement department on
every desk (procurement, consignment sales, restocks, tenders), a trader has a
loop, a tool and a job board.

**Tuning note, not a change:** the sector price tables make some component runs
very fat (the test sky's best was electric motors, Smelt Station → Garrison
Hold, 50 × +406 = 20,300 cr in about five minutes). Each run moves the stock
curves and the margin closes, but if trading out-earns mining by too much the
lever is `PRICE_CEIL`/the sector multipliers in economy.js and materials.js.

**Tests.** New `test/trade.test.mjs` (17): routes are real, sized and ranked; a
thin purse sees only what it can pay for; BUY-from-here; a consignment is not
sellable; the port lean; **TRADE RUN flown end to end** — it buys at one port,
sells at another, and ends the round with more money (20,000 → 43,786 cr in 3.4
minutes of sky time on the test sky); FLY IT builds exactly the route. New
`test/smoke-trade.mjs`: MARKET › ROUTES in a browser, and WORK › PRESETS › TRADE
RUN's RUN button starting on a real route. `smoke-clipping` (MARKET › ROUTES
included), `smoke-freeze` and `smoke-ui` green.

All 48 node suites green.

---

## 0.3.18 — 2026-09-20

The desk is a port's whole payroll, and every career has work on it.

Reported from play: mining is getting good, but the other careers have no way
to earn — pick trading and there is no money in it, because the stations don't
post proper board missions for your hull or their type. More than six are
needed, because corporations use the stations too and they all need workers for
every facet; and they should be categorised in drop-down menus.

What the desk was: **five offers** per port (fewer — bounty/escort/haul could
roll null), all from the port's one corporation, from two families picked by
its charter (so an economic port only ever posted supply and haul, an industrial
one mine and supply), in one flat list, sized to nothing — and every delivery
paid **0.55–0.7 of the bid**, less than selling the same cargo at the market
counter, while the text said "over the bid".

**Thirty offers a port, from the landlord and its tenants.** `issuersAt(st)` is
the port's charter holder plus two or three civil outfits with an office on the
ring (not at war with the landlord; a free port's tenants are the hostile
outfits). Each posts work, and it is the issuer who pays, whose standing gates
the tier, and who remembers an abandoned job.

**Nine departments, and every career has one** (`CATEGORIES`): Mining &
Extraction; Freight & Logistics; Trade & Procurement; Security & Bounties;
Salvage & Recovery; Industry & Construction (manufacturing, construction,
shipyard); Energy & Fuel; Survey & Science (research, navigation, terraforming);
Civic Services (healthcare, education, agriculture, communications). Twenty-nine
kinds of job across them, on six mechanics — deliver, haul (consigned), kill,
visit (fly waypoints and hold), survey (SCAN a world), escort:

| new | what completes it |
|---|---|
| ice run, vein strike, materials, construction, yard parts, fuel, reactor service, assay samples, clinic supply, galley stores | the goods aboard at the desk |
| procurement, restock, tender | the goods aboard at the desk — and the posting names the port that sells it cheapest and its ask |
| consignment sale, courier, construction lift | loaded on accept, delivered at the far port |
| picket sweep, chart a lane, relay service, field trip, wreck site | fly each point (a body, a beacon, a point off a port or on the belt) and hold it; report at the desk |
| cargo pod | fly to it and hold: the pod comes aboard at the site; deliver it |
| survey | the world on the register (`sim.scanned`) |
| drone cull | N rogue drones put down, anywhere (`noteDestroyed`, called by sim.js for every NPC kill) |

**Every department at every honest port**, a floor of three more in **your
career's** department (two of them Standard — no standing asked), then the
port's own mix: weights by **sector** (an industrial yard is mostly mining and
industry, a habitat civic and trade, a military port security) leaned by each
issuer's **charter**. No port posts the same run twice.

**Sized to the hull you are flying** (`hullFit()`). Cargo work is sized to your
hold *and* to a purse that grows with tier and gently with the hold, so a
trainer isn't offered 200,000 cr of armour plate and a barge sees barge-sized
jobs. Combat work (bounty, escort, picket, cull) reads *Needs an armed hull —
the Fledgling carries no guns* until you fly one. A job bigger than your hold
says so. The desk re-rolls when your hold or your career changes.

**Deliveries pay over the market now**: the port's bid **plus** a premium
(0.25–1.0 by kind, scaled by tier) and a fee. The standing blocker gives
numbers ("wants standing 15 — you have 10"), not two labels that could read the
same. You may hold **five** jobs (was three). Accepting a job with somewhere to
fly puts it on the chart; the in-hand line says what is left (`3/5 drones`,
`picket 2 (2/3) · holding 9s/15s`, `40/120 Steel · deliver at …`) with a MARK
button for the next point.

**Drop-downs** (`js/boardview.js`, one renderer for CONSOLE › CORP › BOARD and
the station deck's BOARD tab): department → issuer → offer, takeable first, each
department's summary showing its count, how many you can take and the best pay;
your career's opens by itself; ALL / FITS MY HULL / MY CAREER; open drop-downs
stay open across repaints and accepts. Touch targets 44 px under
`pointer: coarse`, offers stack their buttons under the text on a phone.

**Tests.** New `test/desk.test.mjs` (35): full desks everywhere; eight-plus
departments at every honest port; every career's department worked at three
ports in four; a trader's always has work, two of it Standard; no duplicate
postings; eighteen-plus kinds across one sky; landlord and tenant issuers and whose work is
whose; the nested view's shape, order and sort; cargo sized to a 60 vs 2000 hold;
combat gated on guns and opened by an armed hull; industrial vs civilian mix;
picket sweep, survey, drone cull, procurement and cargo pod end to end.
`board.test.mjs` updated for issuers (the standing check follows the issuer). New
`test/smoke-desk.mjs`: the drop-downs in a browser at 412 px. `smoke-clipping`
green across every deck tab and console panel.

All 47 node suites green.

---

## 0.3.17 — 2026-09-20

Crew conversations carry on, and nothing plays itself.

Two things reported from play: conversations don't flow together — there's no
next part — and sometimes a conversation goes into a progress bar that runs on
its own without any input.

**The progress bar was the staged acts** (`js/crew/beats.js`). `playBeat` ran a
`setInterval` at 680–820 ms: it showed three lines, filled the bar, rolled the
outcome and applied it, and the only control while it ran was *Stop*. The three
lines were three independent draws from three separate voice-bank bags
(`beat_watch_0`, `_1`, `_2`), so they did not follow one another either. And the
act buttons sat at the top of the topic list with labels close to topics ("Share
the mess" beside "Mess talk", "Stand a watch with them" beside "How's the
watch?"), which is how you ended up in one without meaning to.

Every core act is now a **scene**: two or three stages, written to follow one
another (with trait variants), each waiting on the captain's answer. No timer
anywhere. The bar moves when you answer; *Let it drop* walks away with nothing
applied. Each answer carries a `lean` — some depend on who you are talking to
(silence suits a gritty hand, a joke does not suit a cautious one) — and the sum
comes off the roll the scene's own `resolve` makes, so what you said is part of
whether it lands, and an addon's resolve gets that for free. An addon beat with
only `steps()` plays each line on a *Go on*. Scenes are marked **▶** on the talk
view so they read apart from one-line topics. `advanceBeat(memberId, choiceId)`
answers from outside; the stop function carries `.advance()` and `.stage()`.

**Every talk topic is a conversation now** (`js/crew/talk-trees.js`). The engine
could always chain — a choice's `say` could return `{ text, choices }` — but no
core node used it: every exchange was one opener, one answer, one closing line.
All sixteen topics now run two or three turns, and the follow-up options answer
what was just said: *What needs fixing?* → "You're on Engineering" → "clamps or
the coolant?"; *Where are you from?* → "Do you miss it?" → "Do you ever send
word home, captain?"; *What do you want out of this?* → "I'll help you get
there" → "Can I put a little of each cycle aside?"; *Mess talk* → "I'll talk to
Vey" → "Want me to sit with Vey first?"; and so on down the tree.

**And the next time you sit down with them, it's the next part**
(`js/crew/talk-threads.js`). The tree has always set flags — `hopeBacked`,
`longLane`, `looksAfter`, `watchesReactor`, `kidBerth`, `connOffered` — and
nothing ever read one back. Fourteen **↻** topics are the other ends of those
threads, and each reads the ship as it is now:

- **the hope fund** — "I'll match it" is a real promise: every cycle a tenth of
  the hand's wage goes in and the ship pays the match, or misses it (morale, a
  log line, and they mention it). ↻ names the real balance; adding to it moves
  the number they say.
- **the mate you'd look after** — ↻ reads that hand's morale against what it was
  when you said it: better, the same, or "did you actually talk to them?".
- **payroll** — after "on the cycle, every cycle", a short payroll brings ↻ back
  with the real shortfall and a way to settle it; five clean cycles earn a
  thank-you.
- **the raise** — "ten more cycles aboard" comes due ten cycles later.
- **the reactor** reads the real maintenance backlog; **the tally** counts
  what's in your lockers across ports at book; plus the survey marker, the night
  off, the kid at the board, the story they told you, the mate they're making it
  up with, your fear, and the conn habits.

The greeting says when somebody has something to pick up.

**One id, one topic.** family.js's *How's the watch?* and talk-wants.js's *How's
your watch been?* were both `watch`. The lookup found the WANT node first, so
tapping the family topic ran the other one — and when that one was hidden or
cooling down, the tap answered with nothing. The base topic now stands aside
while the richer one is on the board and comes back when it isn't.

**Tests.** New `test/converse.test.mjs` (26): no empty line on any path through
the tree for four temperaments, every thread ends (at most three turns), 80 %+
of topics carry on, follow-ups offer new answers, the hope fund and the ship's
match move real credits and come back named, the mate's morale is read as it is
now both ways, a pay promise returns with the real shortfall and settles it, no
duplicate ids. `test/beats.test.mjs` drives scenes by answering them (the waits
are gone) and adds: three seconds on a scene has not moved, an answer that isn't
offered moves nothing, an answer moves one stage and opens the next with what
you said, answers lean the outcome and on the same roll can decide it, every
core scene is answerable. New `test/smoke-talk.mjs` does the same on the real
talk view in a browser.

All 46 node suites green; `smoke-talk` green.

---

## 0.3.16 — 2026-09-20

The band only says what is true.

Three things were reported from play: a hull claiming lots of traffic around a
station wasn't anywhere near that station; calls for help came from hulls
nothing was shooting; and miners never said anything useful — no pirates on the
belt, no rogue drones, no ore worth more than the rest, no amounts. All three
had the same cause. The speech unit a hull speaks through was built off the job
string, not the sky:

| field | was | now |
|---|---|---|
| hull | 55 if the job read `engaged`, 30 if `fleeing`, else 100 | the hull's real `hp / hpMax` |
| under fire | (nothing — `hurt` stood in for it) | `underFire()`: a hit inside 25 s, an open distress call still being hit, or the victim of a live engagement |
| place | the port it was **bound for** (`toName`) | where it **is**: a port inside 40 km, a belt, or nowhere |
| ore grade | a hash of the hull id, fixed for life | the book value per unit of the rock at its claim |
| threats | pirate-faction units on the 36-hull band within 30 km (rogue drones missed); bearing `rng() × 360` | raiders **and** rogue drones in the sky within 30 km; the real bearing |
| lane traffic | every band unit within 36 km of the speaker | the census of the port the speaker is at |

So a hull 40 km out in open space "read a busy lane off" the port it was flying
to; a pirate wing member (job `engaged`, hp 55) broadcast "taking fire" to
another pirate; a trader actually being shot kept quiet until its job changed.

**`js/npc/ground.js`** answers questions about the live sky and nothing else:
`placeOf`, `portCensus`, `underFire`, `threatsNear`, `claimSurvey` (every ore on
the rocks within one cell of a claim, the units a cutter would get off each at
the game's own yield curve, book value, rich seams, ranked by value).

**`js/npc/reports.js`** — first-hand calls built from it at the moment they are
said, by a hull that is where the claim is:

- *MAYDAY* — "Mayday, mayday — Wayline Hauler AISAIL-53, taking fire from two
  raiders off Smelt Station. Hull at 55 percent. Security says 18 seconds. Any
  armed hull in range, I could use a hand." Never from a raider or a drone;
  goes out at once (comms checks every 2 s); repeats every 45 s while the
  shooting lasts.
- *PORT* — only from a hull inside 40 km of the port, with that port's count:
  "Traffic's thick around Smelt Station — six hulls inside 40 km, two on the
  entry lane, two in the bay, three going out."
- *CLAIM* — "Cutting iridium ore on the belt out past Smelt Station; mostly
  silicates (about 20,800 units), but there's a rich seam of iridium ore in
  reach, about 11,600 units — better than ten times the price of the silicates;
  some uraninite too, about 750 units. Heads up: a raider on the belt with me,
  nearest 25 km at bearing 90. A rogue drone working this side, 18 km off."
- *PICKET* — a patrol's real sweep; the clean ones only now and then.

They share the chatter clock with the speech engine (half the ticks), and a
miner starting on its claim or coming in with a load says so through them
instead of the stock "hold is full" / "cutting the sunward face" lines.

**What a miner says it cuts is what it hauls.** A finished claim sends home the
ore with the most money in reach (`trafficHooks.claimOre`), not a name drawn
when the timetable was written — so the port's shelf gains the ore the band
heard about.

**The speech engine, held to the sky.** Units and callbacks are grounded as in
the table; rogue drones have no voice on the band (they have no captain). Topics
that assert a fact get a second `when`: `askHelp`/`refuseHelp` need a hull under
fire and not a raider asking; `rescueReport` needs the shooting over;
`positionReport` ("board is clear this side") needs a clear board; `laneReport`
needs a hull at a port; `oreTip`/`gradeReport`/`claimDispute` need a miner on a
claim; `smallTalk`'s quiet-belt lines need a quiet belt; `routeAdvice` (beacon
nets and busy corridors nothing in the sky backs) is off. The vendored engine
takes the grounded callbacks through one new option, `opts.ground` — the only
line changed in it — so what a hull tells **you** on a call is held to the same
sky: ask about ore, danger, traffic or the lanes and the answer is the survey,
the threat board or the port census.

**Tests.** New `test/ground.test.mjs` (36 checks): real hull and place on the
units; no mayday without fire, a mayday with the real attacker, integrity and
place, never from a raider, and the engine's `askHelp` shut for a raider and for
a hull no longer under fire; 400 ticks of port reports all from hulls at the
port with the real census; a claim survey that only names ores in reach, ranked;
claim reports naming the cut ore, the richest ore with an amount, a clean belt,
a raider with range, a rogue drone; a finished claim hauling the paying ore; the
same answers through a call; and 300 rounds of the band with no lane report away
from a port, no call for help without fire, no false "board is clear" and no
route gossip.

All 45 node suites green; `smoke-ui` green; `smoke-drones-speech` fails the same
two checks it fails on an untouched 0.3.14.

---

## 0.3.15 — 2026-09-20

Only real hulls go in and out of a hangar.

**The scenery traffic is gone.** Every hangar the station generator grew came
dressed with one or two box "shuttles" per way, looping from the gantry to the
back wall and out again on a sine, a parked box "tug", and — on every drone-bay
module — two to four little cone drones flying a sortie loop out of the tubes
and back. None of it was anything: no hull, no captain, no cargo, nothing on the
board. It existed because nothing real ever flew the bay — named captains
vanished at the mouth and reappeared at the station's centre, flow boats popped
in and out at the aperture, drones docked at 1.2 station radii. The dressing
hid that. Now it is removed and the thing it hid is fixed.

`stationgen/builder/hangar.js` and `prefabs/modules.js` no longer build the
shuttles, the tug or the sorties. They still make the random draws those used,
so every seed grows the same port it always did — nothing else about a station
moves. The roof crane stays; it is a crane.

**The bay is flown** — `js/npc/bay.js`, pure data, the same frame the tractor
uses (`st.hangars[0]`, the port frame the lanes grow from):

| run | path | time |
|---|---|---|
| in | entry door → a third into the bay → the arrivals clamps | 9 s |
| out | the departures clamps → a third into the bay → exit door | 7 s |

Each lane-way (0..2) has its own line, spread across its half of the aperture,
and the door end of every line is exactly `lanePoint(st, which, 0, way)` — the
lane's own mouth point — so a hull leaving the bay is already on its lane-way
and one arriving by its lane-way is already at the start of its bay line.

Who flies it:

- **Named captains** (`npc/traffic.js`): two new states. `berth` — at the entry
  door the cargo lands (unchanged: the ledger keys on it) and the hull flies in
  to the clamps before it is filed docked and hidden. `unberth` — clamps off,
  the cargo lifts, and the hull comes off the departures clamps and out by the
  exit door before `launch` takes it down the exit lane. The job reads
  `approach`/`outbound` throughout, so the directory, speech and comms see
  nothing new.
- **Flow boats** (`npc/flow.js`): the last 9 s of an arrival and the first 7 s
  of a departure are the bay; the lane part of each run is the rest of the same
  budget, so the timetable and every transition the economy keys on are
  unchanged. `lane: "bay"` while inside.
- **Your work drones and the corporations' drones** (`drones/ops.js`,
  `drones/npcdrones.js`): they home on the entry door instead of 1.2 station
  radii, fly the bay at two thirds of a hull's time while filed docked (so
  stash, repair and recall apply the moment they reach the door), and leave by
  the exit door. The renderer draws a docked drone only while it has a bay run
  on it.
- **Other pilots** already flew it — the tractor broadcasts its own positions.

Three things that were wrong the first time:

*A hull has to arrive at the pace it flies the bay.* Heavy hulls come off the
cruise hot and brake at their own accel, and the old capture window was
`speed × dt × 1.6` — **world** speed, which on a tethered port includes the
port's own orbit at hundreds of u/s — so a hull could be "at the door" 480 u out
and slide in. The capture is measured in the port's frame now, the approach top
speed falls with range inside 600 u (`max(24, d × 0.45)`), and a harbour brake
walks anything still hot down to that line.

*The handover blends, it does not snap.* Whatever small offset a hull reaches the
door with — a coarse tick, the capture ring — is carried into the bay run and
blended out over its first 40 %, measured from where the hull was at *this* tick
(flyStep integrates to the next, the port has not moved yet).

*A drone's capture ring rides the port.* A drone steps in half-second slices;
the port it is homing on moved since the last one. The ring is 6 u plus 0.6 s of
the port's own velocity, and the bay run absorbs the rest.

**Tests.** New `test/bay.test.mjs` (332 checks): no shuttles or sorties in any
built port; every bay path ends on its lane's door, stays inside the hangar and
is continuous; arrivals and departures use different clamps; flow boats fly it
both ways with no jump; captains berth and launch through it with no jump in the
port's frame; corporate drones dock and launch through it. New
`test/smoke-bay.mjs` sees a real hull in the bay in a browser. Updated:
`stationgen/test-build.mjs` now asserts there are *no* sorties or shuttles;
`sky.test.mjs` counts a flow boat inside the bay as on its way; `board.test.mjs`
steps the ports while its fleet hull runs (a hull creeping into a bay is flying
at a moving door); `reactive.test.mjs` no longer picks a downed hull as "a
crewed hull to test against".

All 44 node suites and the station generator's harness green; `smoke-docking`,
`smoke-economy` and `smoke-bay` green. `smoke-drones-speech` fails its hail check
exactly as it does on an untouched 0.3.14 (no hull on contacts at that instant).

---

## 0.3.14 — 2026-09-19

The presets run without the core, and the refusal now leads somewhere.

**The presets are builtin.** MINE LOOP, TRADE RUN, SURVEY SWEEP and PATROL are
all multi-step, and three of the four loop — so the Mission-core gate refused
every one of them. A pilot with no core had *no* multi-step autopilot at all,
including the four plans the game ships with and puts at the top of the editor.
The core is meant to gate plans you WRITE. All four carry `builtin: true` now
and fly as they are; each has its own RUN button in the PRESETS section rather
than only a chip that copies it into the editor.

COPY still works and the copy is yours — `fresh()` strips `builtin` along with
`preset`, so "duplicate MINE LOOP, then edit it" is not a way around the core.

**The refusal explains itself, and then walks you there.** "Refit at a logistic
or military yard" is not an instruction anybody can follow the first time they
read it. Which yard. Where. How much. What menu. So the two gates in the WORK
editor — a second step, and a loop — now raise a MISSION CORE NEEDED block that
says what the core is, what it costs (7,500 cr, or 11,000 for the Conn learning
core that carries one), and that the presets fly without it. Beside OK is SHOW
ME HOW, which shuts the console and starts a walkthrough. The walkthrough also
starts itself on the *first* refusal, once per device.

`js/tutorial.js` runs TRACKS now instead of one list of steps, and
`js/tutorial-core.js` is the new one — six phases, on the same contract as the
intro steps, advancing on measured state rather than on taps:

| phase | clears when |
|---|---|
| WHAT IT IS | NEXT — the only phase with nothing to measure |
| THE YARD | the nearest fitting yard is locked (SET COURSE), or AUTO FLY takes it |
| WARP | you are inside the core's own arrival radius for that port |
| APPROACH | you are inside the berthing ring |
| DOCK | the berth is taken |
| REFIT | the core is actually aboard |

The yard it names is real and **pinned** on the first look, because a
nearest-port that moves while you fly to it is how a pilot ends up chasing two
stations. AUTO FLY hands the whole trip to the autopilot as a one-step DOCK —
which is `builtin`, so it flies without the very core it is going to buy.

**And it points at the control.** Each phase names a selector and the card
lights it: WARP, APPR, the DOCK switch on dash page 2, DECK on page 3. Exactly
one thing is lit at a time.

Three things that had to be got right and were not, first time:

*The mark is an attribute, not a class.* `hud.js` writes `warpBar.className`
outright every frame, so a class on `#btn-warp` — the one button the
walkthrough most needs to point at — lasted about 16 ms. `[data-tutor-hi]`
survives a repaint and still reaches CSS. Caught by the browser smoke; both
node suites were happy.

*The warp phase asks geometry, not the string.* `warpBlock()` reports the FIRST
thing wrong, so a ship sitting on the berth with its mains cold reads MAINS
COLD, and a phase that matched on "ALREADY THERE" would never clear. It
measures against the node's own `arriveR` instead — and the card still prints
whatever `warpBlock()` says as the live reason the core is dark, wells and
blocked lanes included.

*THE YARD has no NEXT.* It had one, and a pilot who tapped SET COURSE and then
NEXT inside half a second skipped the warp phase entirely, because SET COURSE
had already satisfied the step. NEXT exists only where there is nothing to
measure — the rule was in the file's own header.

A short landscape phone hides the tutorial card outright (`glass.css`, the
`max-height: 620px` block). Right for a card that shows itself; wrong for this
one, which is on screen because the pilot asked for it, so `.tutor.tutor-core`
overrides it.

**Test contract changed.** `test/mission.test.mjs` asserted that a PRESET was
refused without a core. That was the bug, not the contract. It now asserts that
a preset flies coreless, and that a mission the pilot builds — multi-step, or
looped, or a COPY of a preset — is still refused. New:
`test/tutorial-core.test.mjs` (36 assertions) and `test/smoke-coretutorial.mjs`,
which drives the real console overlay and reads the card behind it — the seam
no node suite can reach, and where the 0.3.12 bug lived. That smoke flaked once
on a fixed wait after a teleport; it polls for the phase it expects now, up to
three seconds, which is an assertion rather than a timing hope. Five runs
clean.

---

## 0.3.13 — 2026-09-19

The dearer mission core did nothing.

Found while answering "what is a nav core": there are TWO upgrades that carry a
mission computer, and only one of them worked.

| | price | declares | unlocked missions |
|---|---|---|---|
| Mission core (`nav_core`) | 7,500 | `missions: true` | yes |
| Conn learning core (`conn_learner`) | 11,000 | `missions: true` | **no** |

The Conn learning core's own blurb says it "carries a mission computer", and it
sets `fx: { missions: true }` in the upgrade table — but both gates, the one in
`startMission` and the editor's, read `hasUpgrade("nav_core")` by ID. So the
more expensive core advertised the capability, charged 3,500 cr more, and left
the WORK editor locked exactly as before.

Asked as a capability now — `missionCore()` is `hasUpgrade("nav_core") ||
fx("missions")` — which is what the fx table was there for. Verified all three
ways: nothing fitted refuses a two-step mission, and either core starts it.

It lives in `js/mission/script.js` rather than `run.js` for the usual reason:
run.js sits on the 600-line gate, so the helper went where there was room and
run.js changed by zero lines.

---


## 0.3.12 — 2026-09-19

The mission editor was not broken. It was locked, and it never said so.

Reported from play: deleting a step from the mining loop and then adding a DOCK
or a STASH does nothing, and the options for editing amounts are gone.

### What was actually happening

Every one of those taps was being REFUSED, correctly, by the Mission core gate:
without `nav_core` fitted the autopilot flies one step at a time, so ADD STEP
declines once a mission has a step in it. Three things then conspired to make a
working rule look like a dead editor:

1. **The refusal was invisible.** It went to `sim.notice`, which paints on the
   HUD — and the console is a full-screen sheet drawn OVER the HUD. Every "no"
   this editor gave while it was open went somewhere the pilot could not look.
2. **The chip lied.** `chips()` latches its selection before calling `onPick`,
   so DOCK lit up as though it had been taken. A chip that highlights and then
   does nothing reads as a bug, every time.
3. **Nothing opened, so there was nothing to edit.** No step was added, so no
   step sheet appeared — which is exactly what "lost the ability to edit amount
   and other options" looks like from the outside.

RUN had the same shape: a four-step preset with no core is refused by
`startMission`, and that reason went to the same place nobody could see. Tapping
RUN appeared to do nothing at all.

This is why it did not reproduce at first — the harness fitted a Mission core
before driving the editor, which is the one condition under which everything
works.

### The fix is honesty, not a new rule

The gate stays; it is a real piece of progression. What changed is that it
speaks:

- **ADD STEP says `ADD STEP · LOCKED`** when a mission already has a step and no
  core is fitted, explains why in a line under it, and the chips are genuinely
  `disabled` — so they do not light, and the tap does not silently die.
- **Refusals render in the panel**, in a `⚠ NOT DONE` block with an OK to
  dismiss, as well as going to the HUD for when the console is shut.
- **RUN reports why it would not start**, instead of appearing inert.
- **Loops** give the same visible answer rather than a notice behind the sheet.

Verified both ways: with no core the chips are disabled, DOCK does not light and
the step count does not move; fit a core and the same tap adds step 5 and opens
its sheet with the target options on it.

### Worth knowing

The four presets are not `builtin`, so without a Mission core they can be looked
at but not run — the MISSION tab is essentially read-only until that refit. That
is the existing design and this release does not change it, but it is now
visible from inside the panel rather than discovered by tapping things that do
not respond. A core is 7,500 cr at a logistic or military yard.

---


## 0.3.11 — 2026-09-19

The economy balances, the belt gives half as much, and ARIA knows what a works
is for.

### Eleven recipes rebalanced — not eight

0.3.10 reported five loss-making components and three alloys. Re-running it
properly found **eleven**: the earlier scan missed Platinum (0.73×), Iridium
(0.65×) and Uranium (0.70×), which have no `from` recipe and so were never in
the alloy sweep — they are refine-only minerals whose ORE costs more than the
refined metal sells for. A twelfth, Rare earths (0.88×), surfaced once the
others moved.

Values raised so every recipe clears 1.25× over its raw ore:

| | was | now | | | was | now |
|---|---|---|---|---|---|---|
| Gyroscope | 1,120 | 2,157 | | Stainless | 78 | 127 |
| Bearing set | 120 | 228 | | Bronze | 62 | 102 |
| Hydroponic rack | 470 | 687 | | Fertiliser | 27 | 47 |
| Fluid pump | 350 | 489 | | Platinum | 380 | 650 |
| Linear actuator | 380 | 491 | | Iridium | 520 | 1,000 |
| Rare earths | 168 | 239 | | Uranium | 440 | 786 |

**Nothing is loss-making now; the median is unchanged at 1.65× and the spread
still runs 1.11× to 6.49×**, so fabricating stays a choice rather than a faucet.

Worth saying why values and not recipe inputs: a first attempt applied a target
at every *tier*, which compounds — a Gyroscope came out at 9,033 cr. Measuring
against the FULL cascade to ore instead touches only what is actually broken.

**A test contract was rewritten and TIGHTENED.** 0.3.10 asserted that a minority
of recipes were loss-making, which was true then. It now asserts that *none*
are — which the old shape could never have caught if a future table edit
reintroduced one.

### Ports pay for finished work they cannot do

Selling a motor back to the industrial yard that builds motors used to pay the
same as selling it to a farm that cannot make one, so the chain ended at the
counter it started at. A port that makes a thing has no reason to want yours.

Fabricated tiers now carry a demand bonus at ports that neither build them nor
already have an explicit appetite — ×1.12 on minerals, ×1.22 on components. An
Electric motor: **269 cr at the yard that builds them, 471 cr anywhere else.**
Ore is dug rather than made and is untouched, so hauling rock is exactly as it
was.

### The belt gives half as much

`MINE_YIELD = 0.5` in js/turrets.js — one named constant, because now that ore
is the input to a fabrication chain rather than just a thing to sell, the cut
rate is the tap on the whole economy.

**And the cutter stows itself on a full hold.** It used to keep burning bus
power into a beam that landed nothing, which at half the gather rate is a long
time to waste. Once per fill, with a notice. The stow goes through a hook
because `turrets.js` is a leaf that may not import `sim.js`.

### A CUT switch

On the systems strip under SHLD / ENG / TURR / ASST, spanning both columns. One
tap on, one tap off, remembering which mode it was in, and the label follows the
state (OFF / CUTTING / O/DRIVE). It is deliberately NOT on the `data-sys`
contract — the cutter is a mode, not a boolean — so hud.js wires it by hand.
OVERDRIVE stays where it was, on the console and the existing cycle.

### ARIA stops at the works

Two things decide it, and they are different in kind on purpose.

**The rule.** Hold over 55%, a fab-capable yard in range, and a part that clears
1.4× against its raw ore — then it docks, puts the ore on the line and sells
what is left. Placed AHEAD of "sell" in the planner because it is a better
answer to the same question, a full hold, not a different one.

**The tape.** `fabLeaning()` reads the k-nearest states on your own tape
(js/recorder.js) and asks what YOU did in situations like this one. Lean toward
the works and the margin bar comes down; run ore straight to the desk every time
and it goes up and ARIA keeps selling. It can only move the bar by a third
either way — a tape with three records in it should not be able to talk the
planner into anything.

A bug worth recording: the first cut took the top ten lines by margin and
planned those. A hold of iron ore and carbon makes steel plate at 1.57×, and
steel plate is nowhere near the top ten (heat exchangers are, and that ore
cannot touch them) — so ARIA sat in a belt full of usable ore and concluded
there was nothing to build. It walks the menu in margin order now and stops
after four that are actually makeable, which costs 3 ms.

### The lines, from anywhere

CONSOLE › WORK shows PORT LINES: every job on every port's line with its
progress, how long is left and a PULL, so a job running at a berth you left
twenty minutes ago is visible without flying back to look at it.

### A cycle that nearly shipped broken

`miningHooks.onHoldFull = …` at sim.js's top level throws
`Cannot access 'miningHooks' before initialization`: sim.js and turrets.js are a
cycle, and a `const` export is in its temporal dead zone while the other
module's body runs. It is hung at launch instead. Caught by the console suite,
which imports every module cold — exactly what that test is for.

---


## 0.3.10 — 2026-09-19

Ore becomes the parts the ports sell.

### The half of the graph nobody could reach

`js/materials.js` has had three tiers since the beginning. ORES carry `refine`
— what a unit becomes at a smelter. MINERALS and COMPONENTS carry `from` — what
a unit is built out of. Steel is iron 3 + carbon 1. A motor is copper 4, steel 2
and a bearing. A bearing is stainless and bronze.

**Only the first arrow was ever executed.** `smeltAll()` turned ore into
minerals and that was the end of it: nothing turned minerals into steel, or
steel into a plate, or copper and a bearing into a motor. The top of the graph
was data nobody could reach, while the ports sold the very components it
describes. That is what this adds.

### A job resolves the whole tree

`js/fabricate.js` (new, a leaf — it imports the materials table and nothing
else; the clock, the stock, the credits and the locker are injected, so the
solver and the queue both drive headless).

Ask for 5 steel plate and it works down: 5 plate ← 15 steel ← 47 iron + 16
carbon ← 77 iron ore and 27 carbonaceous rock. Ask for a motor and it plans the
bearing, and the stainless inside the bearing, and the steel inside that.
Checked in the tests: the graph is **acyclic**, and **every component reduces to
ores you can cut** — no component needs an input you cannot mine.

It uses the nearest thing to the finished part first. Holding steel, a plate
takes the steel; it does not smelt fresh iron and leave the steel on the shelf.
So bringing half-finished stock shortens the job instead of being ignored.

And it says what to bring. A 2% scrap allowance means an exact arithmetic bill
comes up short, which would be baffling, so the plan carries `need` — the
shopping list including scrap. Bringing exactly that always runs.

### Where, who pays, and how long

- **At a port.** A port builds what it *sells*, and an industrial yard builds
  anything — that is the existing `services`/`sells` data in the SECTORS table
  doing the gating rather than a second list invented here to drift out of date.
- **On the clock.** A job runs on sim time, so TIME ×8 and ×40 run the line.
  Nothing is instant: you queue it and fly.
- **Into the locker.** Always, never the hold, because a job outlives the visit
  that ordered it. Come back and the parts are ashore.
- **Your account or the company's.** A company job draws on the locker alone
  (nobody is aboard to unload) and pays from the treasury, so it runs while you
  are somewhere else entirely. Pulling a job off the line hands the materials
  back.

`FAB` is a mission op (18 ops now), so ARIA and hand-written missions can queue
work the same way they REFIT and BUILD.

### The number the panel will not hide

Running the recipes for the first time turned up something the tables have been
carrying all along: **five of the thirty component recipes cost more in ore than
the part is worth.** A Gyroscope is 1,726 cr of ore for an 1,120 cr part. So are
Bearing set, Hydroponic rack, Fluid pump and Linear actuator, and three of the
alloys (stainless, bronze, fertiliser) go the same way.

That is a fact about the data, not about this module, and it is yours to
rebalance or keep. What this does is refuse to hide it: every line shows its
multiple against raw ore, the losers render in the warning colour, and the quote
says "WORSE than selling the ore raw (0.65×)" before you commit. A yard that
quietly takes 1,700 cr of ore for an 1,100 cr part is worse than one that says
so. The median recipe is 1.65×, so most of the board is worth running.

### The deck

CONSOLE/DECK › WORKS leads with your own desk now: what is on the line with a
PULL, the port's menu sorted by margin, and — once you pick something — the
bill, the production chain in one line, the run time, the fee and the worth.

Quantity is **one button you tap through**: 1 → 5 → 10 → 25 → 50 → 100 → MAX.
MAX is a mode rather than a number, re-read from the stock every repaint, so
loading more ore raises the job instead of leaving a stale figure on the
button. It is a binary search over the planner rather than arithmetic, because
the cascade reuses part-finished stock — ten plates do not cost ten times one
plate when you are already holding steel.

### Moved

The whole WORKS tab is `js/deckworks.js` now. `js/stationdeck.js` sat at
*exactly* 599 lines against the 600-line gate, so a panel that needed to grow
had to grow somewhere else; the file is 554 lines now with two dead imports
gone with it.

### Tests

`fabricate.test.mjs` (17) drives the solver and the queue against a fake port
with no sim: the graph is acyclic and ore-complete, the cascade bottoms out in
ores, the shopping list is sufficient, near stock is used before deep stock, the
margin is reported honestly including the loss-makers, the sector gate holds,
and the queue takes materials up front, runs on the clock, delivers to the
locker, refunds a pull, caps a port at three lines and refuses a job it cannot
supply without charging for it.

---


## 0.3.09 — 2026-09-18

Both flaky tests fixed at the cause, and the sweep that found five hidden menus.

### `reactive.test.mjs` is seeded

It flew a live sky and then asserted things about what happened in it, with
nothing pinning the rolls. `resetRogues()` already seeds off the sky seed, but
combat and flight call `Math.random()` directly — gun cooldowns, hit rolls, the
jink a hull flies — and those decide who is alive, who is hunting and how many
hulls are left in `traffic` when the assertions run.

Unseeded it drifted two ways: "a drone takes anything crewed" failed about one
run in eight, and the **assertion count itself moved** (93 vs 95), because
several blocks are guarded on what the sky happens to contain. A suite whose
own shape changes run to run cannot tell you what regressed.

One mulberry32 installed before the sky launches — three lines, identical on
every machine, which `Math.random` explicitly is not. The engine is untouched;
this is the test pinning its inputs, which is where a seed belongs. **96 passed
five runs running, same count every time.**

The assertion it was failing was also wrong about itself: `traffic.find(...)`
can come back empty when every crewed hull is down, and `hostileTo(a, undefined)`
is false — which read as the rule being broken rather than as "there was
nothing to test it against". It says which now.

### `smoke-chart`'s dwell waits for the resolve

It pinned the ship beside a hull, slept **six seconds of wall clock**, then
asserted the contact had reached level 2. But the scanner integrates on SIM
time, which only advances when a frame runs, and headless swiftshader runs at
single-figure fps with real variance — so a slow run got fewer seconds of
scanning and failed for reasons that had nothing to do with the scanner.

It polls the thing under test now and stops the moment it is true, with a 30 s
ceiling and the real cost reported either way. It resolves in **0.6 s of sim
time**, so the test is also about ten times faster than the sleep it replaced.
A slow machine now takes longer; it does not fail.

### The sweep: five menus nobody could find

Two of them, and 0.3.07's dead buttons, and 0.3.08's clipped chart, are all one
bug class — content that lays out correctly and is unreachable — so the sweep
is now a smoke rather than a one-off audit. `smoke-clipping` walks the HUD,
all six console panels and every one of their sub-tabs, the chart with its
directory and sheet open, and all eleven station-deck tabs, and measures every
element against its nearest overflow-managing ancestor.

The distinction it draws is the one that matters:

- past an `overflow: hidden` ancestor, the content is **gone** — no gesture
  reveals it. That fails the smoke.
- past an `auto`/`scroll` ancestor it is reachable by swiping. That is reported
  and never failed: a design question, not a defect.

Both rows it found were the second kind, and both were worth fixing anyway:

**The console sub-tab row.** At 412px, NAV's CONTACTS, CREW's BRIG and HOUSE,
and CORP's STANDING and GNN all sat past the right edge. HOUSE and GNN were not
even partly visible. The row scrolled sideways, so they were technically
reachable — by a horizontal swipe on a surface where every other gesture is
vertical, with nothing on screen saying there was anything to swipe to.

**The station deck's tab row**, same thing at eleven tabs: BLUEPRINT and LOG up
to 111px out.

Both wrap now instead of scrolling. It costs one extra line of chips on the
console and two on the deck at phone width, and nothing at all on a wide screen
where they already fit. Sweep after: **0 clipped, 0 scrollable, everywhere.**

Not a bug, since it looked like one: the boot lines that show through the port
ledger for a moment after docking are the 0.3.03 berth cine mid-fade. It ends
at `display: none` and paints nothing — checked, because a screenshot taken a
second after the clamps land makes it look like a stuck layer.

---


## 0.3.08 — 2026-09-18

The chart stops cutting its right-hand edge off.

Reported from play: in fullscreen the menus are pushed off to the right — the
chart's X button, the distance column in the port directory, the end of the
legend and CENTRE on the body sheet all gone past the edge of the screen.

### It was not fullscreen

It reproduces windowed, at 412x915, with nothing else changed. Fullscreen only
made it obvious: `max-height: calc(100dvh - 24px)` means a taller viewport
gives a taller panel, the directory and the sheet draw more rows, and more of
the clipped content is on screen to notice. The chart has been doing this the
whole time.

### What it actually was

`.overlay .panel.chart` is a grid with one column, declared `1fr`.

A grid item's default `min-width: auto` means **a track can never be narrower
than its widest item's min-content**. The head carries five 46px tool buttons,
the legend is a row of seven entries and the sheet's action row is four
buttons — each of those has a min-content wider than the panel at phone width,
so the `1fr` column resolved to **382px inside a 362px content box**. Twenty
pixels wider than the box holding it.

`.overlay .panel.chart` is also `overflow: hidden`, so the excess was not
scrolled and did not warn — it was simply cut off the right edge and gone.

`minmax(0, 1fr)` lets the track floor at zero, so it is capped by the panel
rather than by its contents, and the children wrap and ellipsis the way they
were always written to. Measured: the track goes 382px → 362px and the count of
elements extending past the panel's content box goes 19 → 0.

The landscape template (`1fr 15rem`) had the identical trap and got the same
treatment, and `.chart-plot` gained the `min-width: 0` it needed to go with its
existing `min-height: 0`.

### Tests

`smoke-chart` now opens the port directory, puts a world in the sheet — the
busiest the panel ever gets — and asserts that nothing inside it extends past
its own content box, in **both** orientations, since landscape has its own
template. It reports the resolved track width so a regression says what the
column did rather than just that something moved.

It runs at the very end, after the dwell section: that section moves the ship
and reopens the chart, and everything above it cares where both of those are.

### Known, not caused here

`smoke-chart`'s "dwelling on a hull resolves it" came up level 1 once in about
eight runs on this tree and has not repeated (3/3 and 3/3 since, same hull,
level 3). It waits a fixed six seconds of wall clock for the scanner to
integrate, so under headless swiftshader a slow run simply gets fewer frames of
scanning. Same family as the frame-count assertion corrected in 0.3.06: it
should wait on sim time or on the level itself, not on a stopwatch. Left alone
rather than quietly loosened.

---


## 0.3.07 — 2026-09-18

Dead buttons removed, and six more found that nobody knew were dead.

Reported from play: the DOCK and HAIL keys under WARP and APPROACH have not
worked in several patches — take them off and move the thruster pad up.

### Why they were dead

Not the mechanism. They forwarded their tap to the real control on the retired
dash pages (`[data-proxy]`, js/ui/chatbox.js) and the APPROACH bar still uses
exactly that and works fine.

`.hud` is `pointer-events: none` (css/style.css) so the pilot can drag the sky
through the gaps between readouts, and **every interactive child has to opt back
in with `pointer-events: auto`**. `.panel` does. `.rcs` does. `.side-keys` never
did — so those two keys painted their live status (`DOCK 15km`, `HAIL PICKET`),
looked completely alive, and passed every tap straight through to the canvas.
Tapping DOCK panned the sky.

### What else that was hiding

The check written for this (below) found the same failure on the **systems
strip** — SHLD, ENG, TURR, ASST. The four switches a pilot reaches for first,
showing UP / ON / ARMED / ON, taking no taps at all, for the same one missing
line. They work now.

### And one of mine

`--g-dock` is the box reserved at the bottom of the right-hand column for the
tool chips, and it was a hand-tuned number per breakpoint: 146px, which is
exactly 5 × 26px + 4 × 4px. **0.3.06 added the fullscreen chip and made it
six**, so the stack grew 30px past its own box and covered the bottom row of the
RCS pad — AFT, DN and SCAN laid out correctly, hit-tested as `#btn-aria`, and
took no taps. My regression, one patch old.

`--g-dock` is derived now:

```css
--g-tools: 6;
--g-dock: calc(var(--g-tools) * var(--g-tool-h) + (var(--g-tools) - 1) * var(--g-tool-gap));
```

Add a chip, raise `--g-tools` by one, and every breakpoint follows — custom
properties substitute at use time, so the media queries only say how tall a chip
is there. Three hard-coded `height: …px !important` overrides went with it.

### What moved

The side keys are gone, and the RCS pad took their row: it sits directly under
WARP/APPROACH now and is 96px rather than 74px, so the three rows are ~32px
instead of ~23px — a real touch target. The dash's offset dropped the `--g-keys`
term with it. Verified at 412×915, 412×700 and in landscape.

**DOCK and HAIL are not gone as functions** — both are still on their dash
buttons and both are still CON commands (`dock`, `hail`), which is what the
docking smoke drives. Nothing lost but two keys that never worked.

### The test that found it

A control can lay out perfectly and still be dead because something is painted
over it, or because it never opted into taking a tap. That is invisible in a
screenshot and it throws nothing, which is how two of these survived for patches
and one shipped a day ago. So `smoke-immersive` now hit-tests the centre of
every visible HUD control against `elementFromPoint` and fails if what comes
back is not that control — plus a specific check that all nine thruster keys are
tappable, and that DOCK and HAIL are still reachable from CON.

It found the systems strip on its first run.

### Known, not caused here

`reactive.test.mjs` fails its "a drone takes anything crewed" assertion
occasionally, on this tree and on 0.3.06 alike, and its assertion *count* varies
run to run (93 vs 95) — so that suite is not seeded. Left alone rather than
quietly adjusted; it wants a seed, not a looser bound.

---


## 0.3.06 — 2026-09-18

Edge to edge, a tape of how you actually play, and ARIA spending the takings.

### The canopy goes edge to edge

One UI has no system-wide switch for the status and gesture bars, so it is the
page's job to ask. Two routes, and the game now does both.

**A fullscreen chip on the tool strip** (`js/ui/fullscreen.js`, new). Chromium on
Android hides both bars for a page in fullscreen, and the request has to come
from a real user gesture — so the module only ever asks from the tap handler,
returns a result instead of throwing when the platform says no, and puts the
reason on the HUD. Two things ride along because they only work there: the
portrait lock (`screen.orientation.lock` is specified as fullscreen-only) and a
screen wake lock, so a long burn does not dim out. The wake lock is **re-taken
on visibilitychange** — the browser drops it whenever the page is backgrounded,
which is the bug you would otherwise hit the first time you read a message
mid-run. The choice is remembered, and since fullscreen cannot be re-entered
without a gesture, the next tap anywhere restores it.

**Installable to the home screen** (`manifest.webmanifest`, `icons/`, new).
`display: "fullscreen"` rather than `standalone` — standalone keeps the status
bar. Launched from the icon there are no bars, no address bar and no tap needed,
and the chip takes itself off the strip because there is nothing left to hide.
Note for Termux: install needs a secure context, so serve to `http://localhost`
or `http://127.0.0.1` on the phone itself. Over a LAN IP the browser will not
offer the install and `display: fullscreen` never applies.

**The re-layout is the part that actually breaks.** The HUD measures from
`visualViewport` and the chart plot from a `getBoundingClientRect`, and Android
animates the bars away over a few hundred ms while `fullscreenchange` fires at
the *start* of that — so one resize on the event measures the height you are
leaving. It nudges three times across the animation instead.

### The tape: (state, action, outcome)

`js/recorder.js` (new, a leaf — no game imports, the world read is handed in).

ARIA learned from counts: you sold at Kessler nine times, so it leans Kessler.
Honest and cheap, but a tally of CHOICES with no record of the SITUATION cannot
answer the question that matters — *what would he have done HERE?* A count says
you mine 60% of the time. It cannot say that you mine when the hold is empty and
the hull is fine, and that under half hull you break off and go home, which is
the difference between flying like the pilot and flying like the average of one.

So every tap, order and mission step is filed with a 16-feature read of the ship
and the world at that instant, and what credits, hull and hold did over the next
half-minute is settled onto the record afterwards — a row carries its own reward
signal. Fixed key order, numbers only: a record is a feature vector as it
stands. The ring holds 4,000 and the newest 1,200 survive a reload.

Taps are captured by one passive capture-phase listener that resolves whichever
control the touch landed on, rather than a call bolted into a few hundred
handlers. Missions go on through `missionHooks.onStep`/`onEnd`, which already
existed in the runner and which nothing had claimed — a record per STEP is
better data than one per mission, because "docked, so sell" and "hold full, so
break off" are separate decisions.

**Every record says who acted.** aria.js is emphatic that a core trained on its
own output converges on its own habits and calls that your taste, and it is
right. ARIA's records are kept — they are useful for training ARIA — but they
are labelled, and every reader defaults to the pilot's own hands.

CONSOLE › WORK › TAPE (`js/console/panels/work-tape.js`, new) shows the split,
a k-nearest "what would I do here" over the live state, and EXPORT to JSONL
through a Blob, because the pilot is on a phone with no server to POST to.

### ARIA buys things

A watch that only mines and sells ends where it started with a bigger number on
the credit line. A pilot does not fly that way, so ARIA has two new jobs: it
docks and **refits** the kit its job wants, or puts a **drone** on a line to work
while the ship works somewhere else. Two new mission ops, `REFIT` and `BUILD`
(15 ops → 17), usable in a hand-written mission too.

Deliberately cautious, because it is spending your money without being asked: a
15,000 cr reserve it will not touch, one purchase per five minutes, nothing
bought with a hurt hull or a hostile close, and only at a port near enough that
the trip costs less than the kit returns. WHAT it buys is chosen by the job you
actually do, not by price — the cutter that helps a miner is worth more to you
than whatever is cheapest. Drones come out of the company treasury, not your
credit line, and there is no drone without a charter.

### A bug the smoke found

`snapshot()` reused a cached world read within 0.35 s, written as
`t - lastSnapAt < gap`. But **`sim.time` is per-sky and restarts at zero on a
launch**, so after every sky change the new time is *below* the last one seen,
that test stayed true, and every record filed for the next several minutes
carried one frozen state from the previous sky. Silently wrong training data is
worse than none. A backwards clock is now always a fresh read, and it closes the
records it orphaned with `d.reset` — "the outcome was never observed", which is
a different thing from "the outcome was zero".

### Tests

`recorder.test.mjs` (13) drives the whole tape headless with a fake world, which
is what building it as a leaf buys. `aria-invest.test.mjs` (37) is mostly the
refusals — the reserve, the cooldown, a hurt hull, no company, no treasury, two
strikes. `smoke-immersive.mjs` covers the manifest, the chip, the gesture-shaped
request, the re-layout, the tape end to end and the TAPE panel.

**A test contract changed, and was rewritten rather than relaxed.**
`mission.test.mjs` asserted fifteen ops; it asserts seventeen, and names them.

**One smoke assertion is deliberately relative.** The TAPE panel's frame check
compares against the same machine's frame rate a moment earlier instead of an
absolute count: headless swiftshader runs at single-figure fps, and an absolute
threshold there is a coin flip rather than a test — the same mistake the chart
smoke made before 0.3.05. What is being asserted is that the panel costs the
canopy nothing, which is what a relative measure actually says.

---


## 0.3.05 — 2026-09-17

One panel could stop the game drawing. Not any more.

Reported from play: "warping then going into the CON will make the rendering
freeze and not come out of it" — ARIA had the conn, the core was spooling, and
the canopy froze on the tap that opened **WORK**.

### The bug

`js/console/panels/work.js` builds its live autopilot card with
`card("AUTOPILOT", "")` — and `kit.card` only creates the `<small>` subtitle when
it is given a hint, which `""` is not. The card's refresher then wrote
`c.head.querySelector("small").textContent` **every frame a mission was
active**, on `null`.

### Why that froze the whole canopy

The console paints from the HUD paint, and the HUD paints from the ENGINE's own
frame tick:

```
engine tick → sim.publishHud → store notify → hud paint → console paint
            → panel refreshers → TypeError
```

The throw came straight back up through the tick and aborted it **before
`renderer.render()`**. The next frame opened the same panel and threw in the
same place. Nothing recovered it but a reload. Any active mission — an
auto-warp, an approach, or ARIA, which always has one — plus WORK open was
enough.

### The fixes

1. The card is built with a real subtitle, and the refresher checks for it.
2. **A panel can no longer reach the render loop.** `runRefreshers()` runs each
   refresher in its own try/catch; one that throws is logged once and dropped
   from the list, and the rest of the console still paints. (Panel `mount` and
   `paint` were already guarded — the refresher loop, in two places, was not.)
3. **Nor can anything else in the HUD.** The whole HUD paint is wrapped: the
   chart, a readout, a panel — whatever it is, the canopy keeps drawing and the
   first three failures are logged.

### Tests

New `smoke-freeze` browser smoke: with a mission flying, every console panel is
opened in turn and the canopy is measured still drawing frames with no page
error — first under an auto-warp, then with ARIA at the conn (the reported
case) — and a refresher that throws on purpose is shown to be dropped rather
than fatal. It dies on 0.3.04 at WORK, which is the bug.

**A test contract was rewritten, not relaxed.** `smoke-chart` asserted
`chevrons < inSky * 0.05`, and it was the wrong contract measured the wrong
way. A chevron is not a name: `map.js` draws the arrow for anything the
register has *tracked* (level 2), holding back only boats, which stay a dot
until identified. So the count it capped was the track count, which the sensor
legitimately fills close aboard -- a port's own traffic at a few hundred u
resolves whether you have scanned or not. Real runs on this tree swing between
0 and 9 arrows out of ~152 hulls, straddling the 5% line, so the check was a
coin flip; it fails on 0.3.03 and 0.3.04 too, which is how it was caught --
nothing in the docking or freeze work caused it.

The behaviour 0.2.x actually removed is the transponder feed: the chart used to
put every hull in the sky on the plate *with its name on*. That contract is
about names and it is exact, not statistical. The smoke now reads the chart's
own label text and asserts no hull's true name is printed without a level-3
identification behind it (a level-2 track prints its class instead), plus the
structural half -- an arrow only ever sits on a tracked contact. One leak is a
failure. Verified green across three runs spanning the full 0-to-9 swing.

---

## 0.3.04 — 2026-09-17

The approach docks again.

Reported from play on 0.3.03: APPROACH circles stations and never docks, a
manual DOCK is never caught by the tractor, and so the berth transition never
plays. Four causes stacked; the first one is why it showed up now.

### What was wrong

- **The shared-sky clock yanked the ports out from under the hull.** Served by
  `server.py` (as 0.3.03 advised), the client chases the room's world clock:
  a phone whose frame loop runs slower than the capped 0.1 s tick falls behind
  and `sim.time` is jumped forward 35–60% of the gap on every poll. Every world
  and port is a function of that clock, so they leapt along their rails while
  the hull stayed put — measured in headless Chromium, a 147 u/s port moving
  ~1 s per jump. The autopilot read ~140 u/s of closure the whole time while the
  range opened, and circled at 4–5 km indefinitely. `shiftClock()` (sim.js) now
  carries the hull through a jump in the frame it is flying in (the port it is
  docking at, else its well); `net.js` calls it instead of writing `sim.time`.
- **The hull flew in the wrong frame.** Assist, BRAKE and hold all worked
  relative to the well you were in, so beside a port carried round its world at
  50–490 u/s, braking stopped you in the *world's* frame while the port sailed
  on. With a berth filed, or the autopilot flying to a port inside 30 km, the
  hull now flies in that port's frame (`sim.dockPort`).
- **The avoidance solver dodged the port's own world.** A tethered port sits at
  2.2–5.6 of its world's radii and the solver's pad is 2.4 radii, so it braked
  on the lane ("avoid · Minong k"). While docking there, that world counts by
  its surface only (`surface` in threatTo, pad 1.15). And the solver judged
  worlds and ports as frozen against the hull's world velocity: a hull holding
  station on a moving port read "2.5 s from the moon" forever. It now solves in
  each hazard's own frame (`avoidAim` too).
- **Sideways speed became an orbit.** Cruise, gate and lane only capped TOTAL
  relative speed and thrust only pointed at the target, so a hull with lateral
  speed settled at the cap with thrust as the centripetal pull. `drifting()`
  brakes out lateral or opening speed first. The cruise brake deadband had
  also never worked (it tested a phase it had just overwritten).

### Measured

Node, manual DOCK from 1.2 km out on the entry lane at every port in
Vesiaphou: 6 of 10 berthed on 0.3.03 (and on the uploaded 0.3 — the frame and
avoidance faults are old; the clock jump, browser-only, is what made it
universal); 10 of 10 on 0.3.04, 30–39 s. APPROACH from 40 km into every port of
five skies (Sol, Vesiaphou, Kestrel, Orrin, Tarn): 44 of 44, 127–188 s. Headless
Chromium against `server.py` with the relay live, APPROACH to a 147 u/s port:
0.3.03 circled at 4–5 km until the run timed out; 0.3.04 tractor, boot sequence,
berth.

### Tests

New `dock` suite (11): a tethered port on a fast world docked by hand from its
lane, APPROACH to a 276 u/s port, a 1.5 s clock jump leaving the hull where it was
against the port, the solver in the hazard's frame (riding with a world is not a
threat, closing on it is), and drift detection. It fails on 0.3.03.

---

## 0.3.03 — 2026-09-17

ARIA works the ship, the hull can be fixed, and the berth stops flying the
camera through the station.

Reported from play: a way for ARIA to take the conn and play like the pilot;
no way to repair the ship (station repair, repair drones, or a locally stored
repair); the three-stage docking pull moves the camera through the station —
use a transition into a boot-up sequence that shows in the station panels; and
a server log full of `/net/poll` and `/cradle/all` 404s. Chose: ARIA on a HUD
button as a full autopilot, yard repair plus an own repair drone, and a cut to
a boot-up sequence.

### ARIA at the conn (`js/aria-pilot.js`, new)

- **What was wrong.** ARIA held the conn like a crew captain: once a second it
  picked a reflex and steered — a pan and a throttle at the target, with no
  avoidance, no power rule, no warp plotting, no lane, and nothing to do on
  arrival. It could point at a belt; it could not work one. The only way to hand
  it the ship was CONSOLE › NAV.
- **Now it is a planner over the autopilot.** It hands the mission runner one
  job at a time — *repair* (hull under 45%: nearest yard, DOCK, REPAIR), *sell*
  (hold 85%: dock where you sell, SELL / SMELT / STASH per your plan), *mine*
  (seam to 90%, the desk, a repair if the port has a yard), *survey* (the
  nearest unlogged world) — so it flies under the power rule, the avoidance
  solver, the warp policy and the docking lane like your own autopilot does.
- **"Like I do" is counted.** Every five seconds of your own flying is
  labelled by what you were doing (captain.js already took that label for the
  house core) and tallied under `aria.prefs.job`; a mission you start yourself
  counts two or three. ARIA picks the job you do most that the ship can do here,
  says why ("you survey 92% of the time; Ceres is not in the log"), and with
  nothing to go on mines if there is a belt. Port and ore preferences still lean
  where it sells and what it cuts.
- Docked between jobs it buys hull and sells a hold; under fire it puts the guns
  on CASTLE; on a bus that cannot refill itself it cuts gravity and the cutter
  instead of standing down.
- **ARIA button** on the flight HUD (above CON). One tap hands it the ship,
  one tap — or touching the stick, mid-job or between jobs — takes it back and
  stops its job. CONSOLE › NAV shows the watch (jobs, credits, what it is doing
  and why) and your job split.
- `REPAIR` is a mission step (15 ops) for your own plans too.

### Repairs (`js/repair.js`, new)

- **Yard.** Docked at a port whose sector lists the repair service (logistic,
  military, industrial, civilian and free ports; agricultural docks do not),
  hull sells by the point: 26 cr at a neutral port, leaning by sector
  (industrial ×0.8 … free port ×1.4) and ±30% on your standing with the
  operator. A **REPAIR** chip on the deck header does the lot (or as much as you
  can pay — it never charges for more), and the REFIT tab opens with a HULL
  section: PATCH 25 or FULL, with the price.
- **Hull-patch drone** (refit, 6,800 cr at industrial, military and logistic
  yards). A welding drone in a bay on your own hull — no charter, no home port:
  once nothing has hit you for six seconds it goes out and patches 0.6 hull a
  second, billed at 14 kW on the ops board (it shows on the ledger, sheds in a
  brownout, and goes back in the moment you are hit).

### The berth (`js/ui/dockboot.js`, new)

- **What was wrong.** The tractor pulls gate → door → clamps and the canopy is
  bolted to the hull, so the last leg put the lens through the station's walls
  (and the push out did it again).
- **Now** as the hull reaches the door the canopy dims into a boot sequence —
  clamp arms, hard seal, umbilicals, power handover, a customs handshake with
  the port's operator and your standing, deck systems — while the tractor
  finishes the pull at five times speed behind it. When the clamps close the
  sequence completes and fades onto the station deck, whose panels boot in one
  at a time. Undocking runs it backwards until the hull is clear of the door.
  The path itself is unchanged; only its clock runs faster while covered.
  `localStorage["lgaa.dockcine"] = "off"` turns it off.

### The log

- Those 404s mean the game is being served by `python3 -m http.server 8080`,
  which has no relay and no ledger: the shared sky and the NPC ledger stay
  local, and the client looks for a relay again every 30 seconds. **Run
  `python3 server.py 8080` instead.** The client now also backs off on a static
  host — 30 s, 1, 2, 4, 8 min, then every 10 min — so the log goes quiet.

### Tests

New `aria-repair` suite (31): yard quote, patch, never over-charging, full, the
standing lean, no yard undocked, REPAIR validates; the patch drone's rate, bus
draw, under-fire and whole-hull stops; ARIA's plan with no habits, a surveyor's
habits, a full hold and a hurt hull; ARIA handing the autopilot a job and still
working 8 s later, the stick taking it back and stopping the job; and a covered
pull landing on the berth at ×5. `mission`'s op count is 15 (REPAIR). The 600-line
gate held: the deck's REPAIR chip lives in `refityard.js`, the panel boot in
`dockboot.js`.

---

## 0.3.02 — 2026-09-17

Every asteroid is the generator's, at the generator's resolution.

Reported from play on 0.3.01: the rocks were not the asteroid generator's
procedural asteroids — "some weird shape with white squares on it" that only
rendered almost right when really close. Rubble and clouds around a rock sitting
still are not wanted.

### Why they looked wrong

- **The generator was asked for a mesh too coarse to hold anything it draws.**
  Its craters, grooves, scarps, grit, frost and vein networks are geometry and
  per-vertex colour laid out for a survey mesh of 56–158 cells a cube face. The
  game grew bodies at 7–12, where every one of those features falls between
  vertices; the triplanar crater texture that was meant to cover for it was
  never passed to the material. What came back was the right outline wearing an
  averaged colour — a smooth potato. Side by side at the same framing, the
  generator's own H56 render and the game's H10 body are not recognisably the
  same rock.
- **The belt field was not the generator at all.** Hundreds of rocks drew as
  three hand-deformed icosahedra from `js/rockgen.js` in a tint; only the four to
  eighteen nearest ever became generator bodies.
- **The white squares** were the outcrop crystals (emissive octahedra floored at
  a metre and a half, so a speck at range and a tile up close), the belt's vein
  shards, and square dust points.

### What it does now

- **Bake** (`js/bodygen/bake.js`, new). The generator's cube-sphere already puts
  every face on an (H+1)² lattice, so its vertex data IS a texture: colour,
  metalness, roughness, emission and the object-space normal go straight into a
  3×2 atlas, a texel a vertex (147×98 at H48), no rasteriser, no unwrap. The mesh
  actually drawn is the same lattice sampled every H/L vertices, unwelded per
  face — its corners are generator vertices, so the silhouette is the
  generator's, and the shading between them reads the full-resolution normal.
  The atlas keeps √albedo so a carbonaceous rock survives 8 bits. Measured: a
  3,072-triangle body carrying a 27,648-triangle surface renders next to the
  generator's native 37,632-triangle one with the same craters, ridges and
  seams in the same places.
- **Grower worker** (`js/bodygen/worker.js`, `grower.js`, new). Growing at H48
  is ~90 ms in node and several times that on a phone, so it happens off the
  frame loop. The vendored generator imports bare `three` and a module worker
  has no import map, so the worker loads the module graph itself (fetch, point
  `three` at the vendored build, rewrite relative imports to blob URLs) —
  vendored files untouched. Results are cached per key; requests for a rock
  you have flown away from are cancelled; mounting is one a frame. No worker, or
  one that does not boot in 10 s, falls back to one growth a frame on the main
  thread.
- **Baked material** (`js/bodygen/baked.js`, new): a MeshStandardMaterial that
  reads the atlases, one shared program, instanced or not.
- **The belt**: every class has two prototypes grown at H32 and drawn at three
  lattices (768 / 192 / 48 triangles by angular size) — eighteen prototypes,
  the rock's own ore and a lightness jitter on the instance tint. Measured in
  the belt: 354 rocks, 10 of 18 prototypes on screen, 102 distinct instance
  colours, 63k triangles.
- **Grown bodies** (close aboard) and **rogues**: baked per rock by device
  tier — belt H32/48/64, rogue H48/64/72 (`BAKE` in `js/bodygen/body.js`). The
  assay is taken off the fine surface. A rogue no longer wears a shared
  placeholder hull; its body is requested the moment it exists, tens of
  kilometres out.
- **Gone**: outcrop crystals, vein shards, seated rubble and ice clouds around
  a rock (`rockfx` keeps the shatter when a rock is cut out). Dust motes are soft
  and round. `outcropsOf` scans every vertex instead of a fixed stride, which
  stepped over seams at the new resolution — the data is still there for the
  assay.

### Tests

New `bake` suite (24): the lattice is the generator's own vertex ids and
winding, the atlas carries the fine surface texel for vertex, every drawn vertex
is a grown one, every tier divides, the transfer and the metadata cross a
worker, and the grower's main-thread path grows, dedupes, cancels and caches.
`smoke-rocks` and `smoke-rogue` rewritten to the new contract (prototypes and
baked bodies grown in the worker, no shards or crystals, no dressing on a
still rock); `smoke-rocks`' triangle ceiling kept at 90k.

### Not changed

- The survey card's no-renderer assay (`assayRock`, DETAIL.assay) and the
  fractured body an impact run draws (`IMPACTS.detail` 8) and the tidal body at
  a hole still grow on the main thread at low detail: fracturing an H24 body
  costs three times the H8 one, and those run for seconds.
- `js/rockgen.js` stays for the ore look table; its hand-built hulls and
  crater canvases are no longer drawn.

---

## 0.3.01 — 2026-09-17

The bus tells the truth, and the autopilot believes it.

Reported from play on 0.3: everything said the bus was overloaded and to shed
shields — and after cutting the mining laser *and* the shields there was still
"not enough power" to fly an approach.

### The reported bug

`autopilot.overload` was a flag, and the only thing that refreshed it was
`powerThrottle()` — which only runs while a leg is flying. Once it went true the
autopilot stood down, and on every later engage `tickAutopilot` read the stale
`true` before anything could re-evaluate it. Shedding load changed nothing
because nothing looked again. Reproduced exactly: shed shields, cutter and
turrets, sustainable throttle 0.00 → 0.88, re-engage — stood down on the same
sentence.

`busOverload(ship)` now answers fresh every time it is asked, from the bus **as
the pilot has it switched** (`busIdle`), not as a brownout happens to have shed
it that frame. The stand-down names what is on and what it costs, as the
switchboard labels it — `bus 151 kW on a 104 kW core, battery flat — switch off
MINER 58 · SHLD 44 · TURR 15 · GRAV 12 · FLOOD/SENTRY/SALVG 5 (kW)` — instead of
keyboard keys a phone does not have. An autopilot under the 20% floor that is
coasting to refill now says so, with the refill time.

### Why it felt overloaded everywhere

- **The starter could not carry its own default loadout.** `hullTuneFor`
  floored the core at 0.85×, so a trainer hull ran 110.5 kW against a default
  idle bus of 101 (shields, turrets, gravity, sentry, cutter) — sustainable
  throttle 0.29, and 0.00 the moment shields started regenerating. The floor is
  the stock 1.0× (130 kW); bigger hulls scale exactly as before. **This is a
  balance call, not a fix** — one number in `js/shipdb.js`.
- **The cutter was billed with the laser stowed.** With the ice works bench on,
  the mining bus charged the cutter's 24 kW regardless of `miningMode`, so
  "shutting off the mining laser" freed nothing. And the bench's own 16 kW (and
  the atmosphere works' 22) came straight off `ship.charge` — never in the load,
  never shed, and the HUD read a positive net while the battery fell. Both are
  on the bus now (`benchDraw` on the mining bus, `atmoDraw` on the ops board).
- **Power from nothing.** After shedding, the load recompute billed the mains
  at `engines × thrustScale` — and `thrustScale` still held the *hull's* thrust
  multiplier. A 1.2× hull at full throttle on a flat battery read 131 kW on a
  110 kW core, charge clamped at 0, forever. The derate also overwrote the hull
  multiplier instead of multiplying it. Kept apart now.
- **Life support went before the mains.** The shed loop cut life support and
  only then derated thrust, so full throttle on a flat battery breathed the
  cabin from 100 to 0. Mains derate first. A/B over 30 s flat at full throttle:
  1,800 ticks billed over the core / O2 low 49 → 0 / 100.
- **Life support was three different numbers** (with and without `mods.life`,
  with and without the setpoint factor). `lifeDraw(ship)` is the one.
- **A brownout strobed.** The flat test re-ran every tick against the full
  load: 1,023 cutter on/off flips in 30 s with the battery pinned at 0. It
  latches now (`BROWNOUT_RECOVER`, 5% of the bank), sheds to 92% of the core so
  the bank actually refills, then lets go.
- **Turret fire cost ~1 kW, twice as much at 30 fps.** The 19 kW firing draw
  was returned only on the tick a round left. Billed for the engagement now.
- **Readouts disagreed with the bus.** CONSOLE › SHIP › POWER hardcoded a
  1,600 battery (a bank refit ran the bar past 100%), the core-trim label
  showed `130 × trim` on a 110 kW core, and the ledger re-derived every row with
  its own sums and missed the ops board, warp spool and bench. Every row reads
  `ship.draws` — what `stepPower` actually billed — and adds up to the load.
  The engine's HUD state and the captain's observation use `batteryCap` too.
- **A second launch in the same page lost its hull tune** (`syncHullTune`
  cached by id; a fresh `makeShip()` on the same id never got one): 130 kW and
  +58% hold on a trainer.

### The autopilot and the conn

- **Standing the autopilot down did not stand its spool down.** Touch the
  stick mid-spool: "released", and four seconds later the ship jumped anyway.
  `releaseControls` stops a spool the autopilot started.
- **The cutter came back on at stand-down.** `cutterWas` was re-taken every
  tick of a non-MINE step, so a cutter `apMine` had switched on was "restored"
  — including on the overload stand-down that had just told you to cut it. It
  is the pilot's setting, taken once at engage; the overload path hands nothing
  back. The autopilot stowing its own cutter no longer talks over its engage
  notice (`setMiningMode(id, { quiet })`).
- **A CHARGE step read a frozen battery.** It used `autopilot.power.frac`,
  refreshed only by a flying leg: with no `until` it finished on tick 1 at 50%,
  and undocked on a net-negative bus it ran 900 s reading "charging · 100%". It
  reads the battery, and fails after 60 s when the bus cannot refill it.
- **Retaking the conn kept the holder's burn** — ARIA handed back a hull at
  full mains, 160 u/s five seconds later. Throttle zeroes on retake.

### 0.3's holes and impacts

- **The live impact cap never capped.** Eviction released `runs[0]` and left it
  in the list, so the next eviction hit the same ended run: five strikes, five
  live runs, 17 ms a tick. Evicts for real now.
- **The event horizon was a soft-lock.** 1e5 damage took the hull to 0, the
  breach handler put it back to 12 with a dead stop, the disk took the 12 again
  next tick, and SPACETIME SHEAR blocked the warp out — permanent at a remnant.
  A hull lost in the burn or at the horizon now loses its hold and comes back on
  the beacon at the nearest friendly port.
- **Lanes ran through holes.** `plotRoute` never looked at them, and a warp
  covers 900–1,800 u a tick. A lane inside a hole's Roche radius is refused as
  an impact; inside its danger radius it is a graze.
- A collapsed star still stopped rogues and debris at its old radius, so a
  remnant could never eat anything; a hole-killed drone paid salvage; pieces an
  impact run still drives held the tractor's six slots for 26 s; a zero-radius
  rogue or zero-size hole produced NaN; instanced meshes (impact rocks, rubble,
  vein crystals) were removed without freeing their instance buffers.

### Tests

New `power` (26) and `hunt` (12) suites pin all of the above by behaviour; the
hunt suite fails 9 of 12 on the 0.3 tree. Two contracts changed and were
rewritten, not relaxed: `autopilot`'s lean bus may now sustain full rated
thrust (the floor), and `experimental`'s "the bench draws power" became "the
bench bills the mining bus, not the battery" plus the cutter-stowed case.
`smoke-ui` polls the dock for 75 s instead of 30 — the tractor pull takes ~38
sim-seconds under swiftshader and the check was expiring before the clamps.

### Left for next time

- Starting a docked mission whose first step resolves to *this* port
  (`best-buyer`, `nearest-port`, `locked`) still undocks and docks back.
- HOLD / WAIT / CHARGE only zero the stick when undocked — no brake, no
  avoidance, so a hull with assist off drifts.
- Shared sky: a mirror's `wstate` adopts holes without setting
  `star.collapsed`, and the "rogue torn apart" effect only plays on the host.
- `smoke-impact` needs more than 240 s under swiftshader.

---

## 0.3 — 2026-09-16

The asteroid generator v1.01 goes in whole: grown rocks, rubble, ice clouds,
shatter, impact break-ups, rock-on-rock collisions, and collapsed stars.

### The generator, vendored

`js/asteroidgen/` is Shane's drop-in (its README says 1.9.0) as shipped, minus
its page layer. Three things are the game's: `ores.js` is rebuilt from
`materials.js` + `rockgen.js` + `bodygen/classes.js` (one mineral list — the
forty species and the v1.01 re-map table are gone); `generator.js` takes a
numeric `detail`, `featureScale` and `featureDensity` (defaults are the
generator exactly as it was); and the shaders are patched at load, not edited
(`js/bodygen/gl.js`). `js/asteroidgen/addons/Pass.js` answers the lens's one
three/addons import; the import map and `test/three-loader.mjs` point at it.

`js/bodygen/body.js` is now the adapter instead of the old pre-1.1 port:
`rockParams` / `rogueParams` are the one place a rock's rolls are decided;
bodies are cube-spheres at 300 / 588 / 1,200 / 1,728 triangles by device tier,
in seven body kinds, with aged craters, basins, grooves, vein networks, frost in
cold traps and outcrops on valuable seams.

### What the first look caught

- **Every rock assayed bare.** The generator draws seams for a 56–158-cell
  survey mesh and weights them so a class table summing to 1 buys 0–1 vein nets;
  at 10 cells a face a 0.04-chord vein falls between vertices. Measured 0–2% ore
  coverage on the game's classes — and the same 0–1% on the generator's own
  v1.01 tables at its own "low" detail. `featureScale 4` and `featureDensity 4`
  put it at ~12% of vertices, rolls unchanged.
- **…and so every ticket would have been worthless.** Surface coverage is not
  grade. The surface now picks *which* ores (class table as prior, the rock's own
  field ore favoured so headline = hold); a new per-class `grade` (M 0.82 …
  P 0.44) sets how much is ore.
- **A smooth potato at game detail.** Geometry craters vanish below ~50 cells.
  `makeCraterDetail()` (a crater height field that tiles on both axes) is laid
  triplanar over grown bodies as albedo and bump.
- **Debris clouds would have sorted through the hull.** This renderer uses a
  logarithmic depth buffer; the generator's hand-written ShaderMaterials wrote
  linear depth. Logdepth chunks are injected into all of them.
- **The lens drew a black screen.** Three separate causes: the far-plane
  unprojection of a 3×10⁷ frustum underflows `w` (every ray NaN — unproject the
  near plane instead); the depth read assumed perspective depth (log-depth
  inverse now); and "no surface" meant anything past 100,000 units.
- **A pre-existing postfx bug.** The first bloom blur read and wrote `rtA` in
  one pass — a WebGL feedback loop, silently dropped — and the scene target had
  no depth buffer, so bloom (warp only, until now) drew the sky unsorted. Both
  fixed; the scene target carries a depth texture.
- **Top-level context objects in sim.js** touched cyclic bindings at load
  (`contacts` before initialisation) — caught by the console suite; filled per
  step instead, as the perf suite's rule asks.

### Rocks

- Rubble on the rock you work, icy crystalline clouds on the nearest frosty
  body, and a shatter field in the rock's own colours when one is cut out
  (`js/rockfx.js`, `brokenRocks` in `js/field.js`). Budget-gated.
- Survey card: a Body row (kind, craters, frost).

### Impacts

- A rogue striking a world within 320 km runs the Impact Lab physics
  (`js/impacts.js`): the rock's body cut into 16 solid chunks, energy-planned
  break-up, a 26 s rigid-body run with gravity matched to the world's surface
  pull, contacts, tumbling, secondary impacts, shed grains, crust in the world's
  colours. The pieces are debris chunks from the first tick (held while the run
  holds them, `driven`), let go with the run's velocities. Drawn by
  `js/impactfx.js`. Far strikes keep the old burst.
- Two rogues that meet both break (host only; mirrors get `rockhit`). The biggest
  piece leaving fast and big enough becomes a new rogue: a faceted fragment with
  its parent's class and seed.
- Measured: a 700 u rock on a rocky world, 25 pieces (16 rock, 9 crust), 46–56
  secondary impacts in the first seconds, ~1 ms a tick.

### Collapsed stars

- `js/holes.js`: transits (rare — one every ~6 h of play, measured over 1,600
  simulated hours) and supernova remnants (a star collapses 74 s into its
  supernova). Kerr radii at a = 0.6; gravity on everything that flies; warp
  shear; eats belt rocks, rogues, debris, hulls and ports; tidal disruption of
  worlds through `damageBody`; accretion feeds the disk rings; dash warnings,
  GNN bulletins, chart marker, canopy label, avoidance hazard, shared-sky wire.
- `js/holefx.js`: the generator's Kerr (DNGR) lens as a composer pass over scene
  depth, half resolution on touch devices merged by mask, gated by frame budget
  with a stand-in below it; rocks falling in; rogues torn apart by TidalBody.

### Tests

- New `test/asteroids.test.mjs` (144 assertions), `test/smoke-impact.mjs`,
  `test/smoke-blackhole.mjs`.
- Caught up with 0.3 contracts: `systems` (near body budget is the cube-sphere's
  1,200), `smoke-rogue` (face count from the device's detail; world size is the
  unit-frame geometry times its scale), `profile` (`lgaa.lens` filed).

---

## 0.2.03 — 2026-09-15

Stations stopped moving out from under the tractor.

### The bug

`stepStations` ran only inside `stepWorld`, at the **end** of the tick — after
`clampDocked` and the tractor had already glued the ship to the station. So
every frame, the ship was snapped to where the station was *last* tick, and
stepWorld then moved the station out from under it: `st.v × dt` of error. At
16 ms nobody sees it. On a hitched frame — the tick clamps `dt` at 0.1 s, and
a phone under load hits that constantly — a port doing 30 u/s puts the hull
3 u off the clamps, and a fast tether pops it 10–30 u sideways *inside a 20 u
aperture*: clipping through the bay wall while docked, and the departure push
appearing to leave by the wrong door.

Found because `smoke-docking` failed its "push by the exit half" check
reproducibly: the sampled crossing read lat −2.3 u (the entry half) when the
path itself runs through the exit door at +5.1. The trajectory was never
wrong — the measurement caught the one-frame lag.

### The fix

One line: stations step to **this** tick's time at the top of the tick,
before anything is glued to them. The second call inside `stepWorld`
recomputes the same rail positions (pure functions of time) and is
harmless. A docked hull now rides the clamps exactly, hitched frames
included — `sky.test.mjs` pins it with 0.1 s ticks and an A/B against the
old order (3.015 u off then, exact now).

### Tests caught up with 0.2.x contracts (no game code in these)

- `smoke-economy` — the boat-label check predated the 0.2.02 kind bracket:
  a shuttle label now reads `[D]▹ IV DORY 28 …`, and the regex insisted on
  the bare `▹`.
- `smoke-chart` — the cold-open "not all of them" ratio dated from before
  the long-range track band (which hands anything under drive a coarse blob
  on purpose) and before 0.2.02 halved the flow, which shrank the
  denominator. Now 35%; the chevron cap — the assertion that actually
  guards the name leak — is unchanged.
- `smoke-shared-sky` — comparing live patrol positions compares two
  different instants: the clocks are allowed 3 s apart, and a hull mid-hop
  moves tens of thousands of units in that. Both clients now report the
  timetable pose at one agreed second (`poseAt`), which must agree to the
  metre — a stronger assertion that no longer flakes on clock skew.

All 33 node suites and all 16 smokes green after the change.

---

## 0.2.02 — 2026-09-15

Port shuttles: fewer of them, and none without a hull or a tag.

### What was wrong

The ports' flow boats are drawn and labelled by their own loop, and 0.2.01 did
not touch it — so while every crewed hull went through the scanner and got a
kind bracket, the shuttles kept the old behaviour: named on sight, no bracket,
no scanner. Worse, `syncFlow` skips a boat's mesh while the hull pool is still
warming and the label loop did not care, so a busy ring showed a crowd of names
with nothing underneath them.

And there were a great many of them. Per port the counts ran
24 / 20 / 16 / 14 / 12 / 6 by sector, which across nine ports is about a
hundred and sixty small craft — more than the entire named roster of captains,
raiders, pickets and drones put together, all anonymous, all milling around the
same few rings.

### The fix

- **Roughly halved**, to 10 / 9 / 7 / 6 / 6 / 3, and capped across the whole
  sky at `FLOW_CAP` so a system with a lot of ports cannot quietly reintroduce
  the same crowd. Measured: 49 boats over 8 ports, down from ~160.
- **No hull, no label.** A boat is only labelled if it has a mesh drawn. The
  array reports what is out there, not what the simulation happens to know.
- **They go through the scanner** like everything else, and they are `[D]`:
  a shuttle belongs to its port, flies a fixed loop, goes home, and nobody is
  filed as its captain.

### A real bug underneath it

Population sizes were being decided from a **stale frame-time measurement**.
`resetPerf()` ran *after* `populateTraffic` and `populateFlow`, so how many
hulls and shuttles a sky carried was read off whatever tier the previous sky
had settled at. Build a system while the last one was struggling and the new
one stayed permanently thin — on a device that was now idle. Seen live as 16
boats across 8 ports where there should have been 49.

The reset now runs before anything is populated. A sky is built at a known
tier; the budget then does what it is for, which is trimming per-frame detail
once the sky is running, not making permanent decisions about how much sky
there is.

### Also

- `test/sky.test.mjs`'s flow assertion was luck-dependent: it tested the duty
  cycle as a proportion of fleet size, and a trough that was twenty boats out
  of a hundred and sixty is nine out of forty-six — which lands a hair under a
  20 % floor without anything about the cycle having changed. It now samples
  long enough to see several periods and asserts the shape directly: the ports
  never go completely still, never launch the whole fleet at once, and the mean
  sits where the timetable says (measured 39 % up).
- Two assertions in `test/nav.test.mjs` pin the shuttle tag and the no-hull-no-
  label rule.

---

## 0.2.01 — 2026-09-15

The canopy is the ship's instruments, not the author's notes.

### What was wrong

The canopy read the roster directly. Every hull inside sensor range got its
name on the glass whether or not you had ever pointed anything at it, and a
first cut of the 0.2 work had pushed that radius to 1.4 million units — hull
names legible from fourteen thousand kilometres. That is not a sensor, it is a
phone book, and it made the scanner, the dish cone and the whole contact
register decorative. `contacts.js` had complained about exactly this in its own
header for a long time; only the chart had ever been fixed.

### The canopy is now the scanner's readout

`contacts.js` runs two beams at once, both always on, and the canopy draws what
they actually have:

- **BROAD** — a wide sweep over everything in range. Fast and shallow: it gives
  you a relation colour, a hull class, and the kind bracket. It is capped at
  `broadCap`, which sits above the track threshold and below the identification
  one, so a broad return can reach level 2 and **can never reach level 3**. No
  amount of sweeping produces a name.
- **FOCUS** — the narrow beam, on exactly one contact at a time, and the only
  thing that can push a return past `ident`. It points where you point: the
  unidentified contact nearest your reticle inside the beam's cone. A target
  you have locked outranks that; when you are looking at nothing in particular
  it works the board itself.

Auto-cycling is not simply nearest-first. A port's flow boats are anonymous by
construction — identifying one tells you "hull" — so an array that spends
itself on the three boats orbiting a station while a raider closes is working
hard and telling you nothing. Crewed hulls outrank boats, and something already
most of the way resolved is finished before a new one is started.

**A name latches.** Once identified, a hull stays identified for as long as it
is in range. Losing the name the moment the beam moved on would be more
realistic and would also make a busy board flicker between "freighter" and
"Kestrel VOSS-42" continuously, which is unreadable. Drift out of range and the
record ages out; meet it again and it is a stranger again.

A contact the array has nothing on gets nothing drawn. An empty canopy means
the array has not found anything, not that the sky is empty.

### The kind bracket

Every canopy contact carries a small colour-coded bracket saying who is flying
it — a different question from what it is to you, which is what the label
colour already answers:

| | | |
|---|---|---|
| `[P]` | green | a person at a console — another pilot, or one of your own company hulls |
| `[N]` | amber | a crewed hull with somebody in the chair |
| `[D]` | cyan | a deployed drone: launched by a ship or a port, belongs to it, goes home to it |
| `[R]` | violet | an autonomous robotic hull with no crew and no parent — the nests' machines |

The bracket survives at level 1, before the scanner knows the hull class and
long before it knows a name, because an unidentified return that is somebody's
drone and an unidentified return that is a crewed ship are different problems.

Relation colours the text — hostile red, allied blue, neutral grey — and an
unidentified contact is drawn dimmer and smaller, because the canopy should
look like it knows less about it. The contact the beam is currently working
carries a mark of its own.

### Everything flying has a physical hull

There was a fallback in the drone renderer: a red tetrahedron, tumbling on two
axes, stood in for any drone whose generated design had not grown yet — and
because the swap only happened once `droneDesign` returned something, a contact
beyond mesh range kept the blob for as long as it existed. A lump of abstract
geometry was a permanent flying object in a game where every other hull is
built by a generator.

It is gone, along with the cone that did the same for station interceptors. A
drone whose design is still growing, or that is too far out for a mesh, draws
**nothing** for those frames — exactly as an NPC ship at the same distance
already did. The design keeps being requested every frame, so the gap is a
frame or two, not a state.

### Also

- Four assertions in `test/nav.test.mjs` pin the ladder: the sweep's cap stays
  under the identification threshold, the beam out-resolves the sweep, the
  bracket classifies without needing the hull class, and no placeholder
  geometry comes back.

---

## 0.2 — 2026-09-15

The sky stopped being a clock.

### The short version

A hull's position used to be a pure function of `(seed, skyTime)`. It burned
500 units out of the hangar mouth over 36 seconds, went `visible:false` for the
length of a warp lane, and reappeared 700 units off the far port. That is why a
supply ship popped up outside a station and was gone before you could turn
toward it: it never went anywhere. There was nothing in between, and nothing
you did to it could change where it would be, because where it would be was
arithmetic.

Hulls now fly. A leg is a real crossing under real thrust, they are on the
board and shootable for the whole of it, and they can be chased, damaged,
driven off course and destroyed. Raiders hunt across the system instead of
waiting for something to drift within four kilometres. Anything that gets shot
at calls for help, a chartered Security Directorate answers with a clock you
can read, ports defend themselves whether or not anyone is watching, and there
are drone nests out in the cold building waves and sending them at ports, at
traffic, and at each other.

**This costs the old multiplayer property and pays for it deliberately.** A
closed-form sky agreed with itself on every client with nobody in charge. A sky
you can change cannot. The host now integrates the hulls and mirrors take its
word (`js/worldsync.js`); the roster — who is flying what, for whom — is still
pure in the seed and never crosses the wire.

### Hulls fly now

`js/npc/flight.js` is new: accel- and turn-limited steering with a proper
arrival brake, and the speed solver that makes it work. A leg is anywhere from
40,000 units between two inner ports to four *million* between two worlds in
Sol; flown at one speed either the short hops take all day or the long ones are
over before you see them, and four million units under thrust alone is ten
minutes of one hull not delivering anything.

So a long leg is flown the way you fly one — three parts:

- **run-out**, sublight, out of the lane and clear of the port. This is where
  traffic is thickest and slowest, and where a supply run is most easily taken.
- **lane**, the drive lit. Fast, but *not gone*: the hull stays on the board
  with its name and its light the whole way, because a contact you can watch
  crossing the system is one you can warp ahead of and be waiting for.
- **run-in**, the drive shed a long way short of the far end, coming in slow
  and heavy and committed.

A leg under 60,000 units never lights the drive at all. Crossing times land in
the same 90–200 s band the old teleport produced, so station stock moves at
about the cadence the economy was tuned against.

`"in lane"` used to mean *gone* — off the board, not a contact, not shootable.
It now means the drive is lit. That distinction is the whole feature.

Hulls also stopped being interchangeable. Every one carries thrust, turn rate,
hull integrity, shields and a gun derived from its registry entry and its mass:
a laden hauler takes more killing than a raider and will never outrun one, a
picket out-guns a trader, and an ore barge handles like an ore barge.

### Somebody answers the radio

`js/npc/security.js` is new, and so is the thing it serves. There was already an
authored distress corpus in `js/speech/` that nothing was wired to and a
`"responding"` job string that was only ever a label.

- **A distress bus.** Anything shot at puts out a call naming the victim, the
  attacker and the place.
- **A Security Directorate** — a sixteenth corporation with a real standing you
  can move, holding no berths of its own, flying every patrol and picket in the
  sky and keeping quick-reaction wings ringed up at the ports that pay for one.
  Your standing with it decides whether the cavalry comes for *you*.
- **A clock.** A dispatched response has an honest ETA and it is on the canopy,
  because a player deciding whether to press an attack is deciding against that
  number. If the wing is destroyed on the way the clock is re-cut off whoever is
  actually still inbound; if nobody can come it says so. It never counts past
  zero and keeps counting.

Response is not guaranteed. A call from the belt fringe with every picket
committed goes unanswered, which is what makes the patrolled lanes worth
something.

### NPCs fight for real

`js/npc/combat.js` is new. NPC-on-NPC combat used to be theatre with the verdict
attached: `npc/battles.js` rolled an engagement out of the seed, decided which
hull would be destroyed *before the first round*, and fired damage-0 tracers
until the clock reached the moment it had already chosen.

Rounds decide now. Near the player they are real objects that can miss; beyond
sensor range the same fight resolves on the same numbers on a slow tick, so a
hull that loses out of sight is just as dead and the survivor carries its damage
into the next one. Fly out to a fight that started while you were elsewhere and
you find it in progress.

Raiders **prowl**: they pick something worth taking from most of the way across
the system, run their own drive to get into the same volume, and close sublight.
What they cannot do is catch a hull already under drive mid-crossing — so they
work the approaches, where traffic is slow and committed. The dangerous places
are the ends of a leg; the safe part of a run is the middle.

### Rogue drones come from somewhere

`js/npc/rogues.js` is new. "Rogue drone" used to be a string: one contact type
spawned on a dice roll four kilometres from the player, flying straight at them,
despawning at sixteen. It existed only where the player stood and only ever
attacked the player.

Now two or three **nests** — derelicts with something still running in them —
sit out in the belt building drones, and send **waves** with a target chosen
before launch: a port, a hull working the lanes, or a rival nest, because two
machine intelligences building out of the same belt are competitors. A wave on a
port eats its magazines and its drone racks first, which is precisely what the
port needs to fight it off. Wave drones are ordinary roster hulls with `rogue`
set, so they fly, fight, show on the chart and draw station fire without
anything having to learn about them specially.

### Ports defend themselves when nobody is watching

Station batteries only ran within 6 km of the player. A port that defends itself
only when observed would be dismantled the first time a wave went somewhere
quiet, so out of sight the same guns resolve the same fight on the numbers.

### You can see them coming

- **Edge markers.** A contact in sensor range but off-screen or behind you is
  clamped to the rim with a bearing to turn toward. Ranked and capped, because
  the rim is 412 pixels wide on the device this is played on and twenty arrows
  around it is a border, not situational awareness.
- `projectPoint` has always computed a `behind` flag and nothing has ever read
  it. That is what it was for.
- The chart's scan register gained a **long-range band**: a hull under drive is
  a bright unmistakable thing, so it registers out to 1.4 million units as a
  coarse blob with a big error circle. Capped below the identification
  threshold, so it reads `unknown` and can never read a name.

### The hangar lights

Visible from four thousand kilometres, because three faults all pushed the same
way: lamp batches were baked at full brightness and only animated inside 45 km,
so past that every lamp sat pinned at 100 % and never blinked — *brighter far
away than close up*. Chase beads carried no build-time colour at all, so until
the animation first ran they rendered as raw white with `toneMapped: false`, the
brightest value the renderer can produce. And nothing anywhere attenuated any of
it with distance.

`bake()` writes the resting state in at build time, and `tick()` takes a light
level the engine drives off range. A port's lighting reads exactly as it did on
the approach and is gone well before sensor range. The hull is still a
silhouette out to 4,000 km; it is just not a light source.

### A frame budget instead of a guess

`js/perf.js` is new. The sky got much busier — 90 to 130 hulls where it carried
47 to 56 — and the device this is played on is a phone under Termux. Nothing
here is a fixed number: it keeps a 90-frame *median* (so one 240 ms hitch while
a station mesh builds does not drop the sky a tier) and hands out a detail tier.
Dropping is immediate; earning a tier back takes six sustained seconds, so a
marginal device does not oscillate.

The tier trims the far field, wave sizes, label caps — and the **mesh** radius,
separately from sensor range. That last one matters: the bottleneck on a phone
is usually the GPU, and trimming simulation detail to fix a rasteriser does
nothing at all. Under load a hull stops being a model while remaining a name, a
light and a target.

Measured in-browser with 88 hulls up: **0.127 ms per tick** for the whole
reactive sky — traffic, combat, security and rogues together.

### Warp finally looks like warp

The core has run a real state machine for a long time — spool the reactor has
to pay for, lane blockers, hazards, dropouts that dump you at the crossing with
damage and a cooling core. What it had no picture of was any of that. Engaging
a jump widened the FOV to 92°, shook the camera, and moved the ship a very long
way: the most dramatic thing the ship can do looked like a fast zoom.

`js/warpfx.js` is new, and it is three layers doing three jobs:

- **Shell** — the 5,200-star backdrop stretches into radial streaks along the
  axis you are travelling. It reuses the shell's own star positions, so the
  smear is the sky that is actually there rather than a second one laid over
  it, and it swings correctly when you turn. Streak length varies per star:
  uniform lengths read as a wireframe cone, because nothing in a real field of
  light sources is that regular.
- **Tunnel** — a close-in layer that exists only during a run, recycling as it
  passes. The shell says the sky is moving; this says how fast, because it is
  near enough to have parallax.
- **Wake** — the same trick on NPC hulls under lane drive. Traffic crossing the
  system now reads at a glance, and the thing you cannot intercept looks like
  the thing you cannot intercept.

All three are `LineSegments` with additive vertex colours: no new material, no
shader, no texture, one buffer update each.

The smear is strongest **on the beam and weakest dead ahead**, which is the
right way round and easy to get backwards — a star you are flying at barely
moves across the eye, and putting the brightest lines in the middle of the
screen fills the one place you are trying to look.

A core catching and a core letting go both earn a flash, and they are weighted
differently, because a dropout is not an arrival.

### Bloom, hand-rolled

`js/postfx.js` is new. Streaks that are bright white lines read as lines;
streaks that bleed into the space around them read as speed, and that is most
of why a warp effect works.

The obvious move is to vendor Three's `UnrealBloomPass`. I did not, for two
reasons: it is a five-mip pyramid needing nine vendored files
(`EffectComposer`, `RenderPass`, `ShaderPass`, `MaskPass`, `CopyShader`,
`OutputPass`, `OutputShader`…) and a lot of fill rate on a device that is
already GPU-bound — and this effect does not need a pyramid. Everything it
blooms is a thin bright line on a near-black field, so a half-res bright pass
with a soft knee and two quarter-res blur pairs gets within a hair of the same
picture. ~200 lines, no new dependency, sized for the phone.

Tone mapping and the sRGB encode must happen exactly once, so the scene renders
into a **linear** half-float target with tone mapping off, the bloom is built
in linear light where a threshold means something, and the composite shader
does the ACES curve and the encode itself. Switching the composer on and off
changes how bright things bleed, not how the sky looks.

**The gate is a dead band, deliberately.** Bloom costs fill rate, fill rate
costs frame time, and frame time is what perf.js measures to pick a tier — so a
single threshold is a feedback loop: bloom on, tier drops, bloom off, tier
recovers, bloom on. perf.js's own hysteresis would turn that from a strobe into
a six-second oscillation, which is worse, because six seconds is long enough to
look deliberate. It takes tier 3 to switch bloom **on** and a drop below tier 2
to switch it **off**, and it latches in between.

Idle, `render()` is byte for byte the plain `renderer.render()` it always was
and no target is even allocated.

Measured under software rasterisation at 412×915 — the worst case, and not
representative of a real GPU — a warp run cost 41.5 ms plain and 87.6 ms with
bloom. That ratio is why the gate exists; I have no way to measure real mobile
hardware from here.

### Also

- **Station supply runs** are a role of their own: slow, fat, lightly armed,
  always bound somewhere that needs what they carry, and named for the port
  waiting on them. The thing worth escorting and the thing worth taking.
- **Commercial runs load against the far port's shortfall**, not against their
  own hold. Nobody freights a barge of stainless to a port whose shelves are
  full of it — and if they did, the sky's own traffic would keep every port
  permanently topped up and the work board would have nothing on it.
- A hull with no timetable and no orders now **holds position** instead of
  falling through to a picket sweep it was never assigned.
- The warp block runs **after** the camera is posed. It has to: the near
  tunnel layer is parented to the camera, and at 55,000 units a second a
  frame-old camera leaves it nearly a kilometre astern — which looks exactly
  like what it is, the tunnel sliding off the back of the ship.
- `test/reactive.test.mjs` is new: 95 assertions over flown crossings, hull
  characteristics, hostility, a staged hunt through the whole
  raider → radio → dispatch → arrival chain, damage and recovery, nests and
  waves, and the budget's own hysteresis.

### Known

- `poseAt`/`routePose` survive as the **placement** function — what seeds a
  fresh sky and what a mirror falls back to between host packets. They are no
  longer where a hull's position comes from.
- A mirror flies hulls between packets but runs none of the directors: who is
  hunting whom is the host's to settle.

---

## 0.1 — 2026-09-15

First numbered release. Everything before this was a development line with its
own patch numbering; that history is not carried forward, and this is the point
the version count starts from.

### The name

The project is **Living Galaxy — Ad Astrum**. It had accumulated four spellings
of an older name across 209 files, a separate development patch series, and a
handful of stale version strings; all of that is gone. The mark reads
`LIVING GALAXY` with `Ad Astrum` under it in the HUD corner and on the creation
screen, and one module — `js/version.js` — is the only place that knows what
this build is, so the tab title, the HUD, the start card and the server's
banner cannot drift apart.

**This release does not migrate saved data.** Every storage key changed prefix,
and no migration was written, so a pilot, company, fleet and local crew ledger
from a pre-0.1 build will not be found. Start a new pilot.

Two consequences worth knowing about, both deliberate:

- **The public sky regenerated.** Sol's planets, moons and beacons are
  hand-authored constants and are exactly as they were — but its stations,
  traffic roster, belt layout and engagements are seeded off the room name,
  which changed. Sol still reads as Sol; the ports and the hulls working them
  are a new draw.
- **`js/astgen/` is now `js/bodygen/`**, and `test/p16.test.mjs` is
  `test/systems.test.mjs`. Source headers that cited a patch document no longer
  do.

### Fixed — the server stopped turning normal network events into crashes

Running under Termux on Python 3.14, a second device on the LAN reaching the
server produced this, repeatedly:

```
AttributeError: 'Handler' object has no attribute 'path'
```

Two distinct bugs, both of the same shape — an ordinary thing a network does,
answered with a page of traceback:

- **A malformed request line killed the handler.** `log_error` read `self.path`,
  but `BaseHTTPRequestHandler` assigns `path` partway *through* `parse_request()`
  — and `parse_request()` calls `send_error()`, which calls `log_error()`, when
  the request line itself cannot be parsed. Reading it then raised out of the
  logger, which killed the handler thread and aborted the `400` it was in the
  middle of sending, so the client got nothing at all. It fires whenever
  anything speaks non-HTTP at the port, and the common case is a browser that
  upgraded a typed address to `https://` and sent a TLS ClientHello.
- **A client hanging up mid-response was treated as a fault.** A phone
  navigating away while a `.js` file is still streaming, or a reload cancelling
  a poll, raised `ConnectionResetError` out of the write, uncaught. Ten of those
  produced ten tracebacks.

Both now log one line and carry on. Measured against the same probes — a TLS
handshake, binary junk, a 9 KB URL, a bad HTTP version, and ten mid-response
disconnects — the old build produced 14 tracebacks and the new one produces
none, while the malformed requests now get a proper `400` instead of silence.
Binary request lines are escaped before they reach the log, so a scanner can no
longer corrupt the file for anything that reads it as text.

`test/server.test.mjs` is new and covers this end to end: it starts the real
`server.py`, does the rude things to it over a raw socket, and asserts on what
it prints and whether it is still serving. It was checked against the unpatched
build first — a regression test that passes on broken code is worthless.

### Fixed — a stale contact index could return a hull that was no longer there

An id index added over the exported `contacts` array revalidated itself against
the array's **length**, on the theory that anything adding or removing a contact
changes it. That is not true, and the failure was silent: swap one contact for
another and the length is identical, the index is never rebuilt, and lookups
return a contact that has left the board while missing the one that arrived.

`contacts` is exported and anything can mutate it, so a long-lived index over it
cannot be validated cheaply without every mutator cooperating — and a cache that
is usually right is worse than no cache. The index is now private to
`syncContacts` and rebuilt at the top of each call: one `O(n)` pass per tick,
and within a call it cannot go stale because nothing else runs. `contactById()`
is an honest linear scan, which is what it was before the index existed.

### Changed — tests that pinned one sky's output now test their contracts

Renaming the public room reshuffled generated content and took a dozen
assertions down with it. Each turned out to be pinning an *outcome* of one
particular sky rather than the behaviour it meant to check, and each is now
written to its contract instead:

- **`economy`** computed a hull's departure as `leg.start - phase`, which goes
  negative whenever a hull's phase has already passed that leg — stepping the
  sim backwards, so the departure never fired. Even wrapped, it landed on
  whichever leg the hull's own clock said was next, not the one that was picked:
  it asserted "it lifts 50 water" while the hull departed with steel. It now
  watches for the lift rather than predicting it, and asserts that whatever a
  trader lifts comes out of the port it leaves and lands at the port it reaches.
  Two assertions became five.
- **`people`** searched a single hiring hall for a hand the captain could court.
  One port's roster is eight or nine people; the sky has twelve such hands
  across eight ports. It searches the sky.
- **`portcontrol`** counted out ten seconds and assumed port control had the
  helm by then. It now flies until the handover actually happens.
- **`sky`** budgeted a flat window for a kill and for a drone's trip home, both
  of which scale with the port the generator produced. Both now run to the
  outcome.
- **`skycrew`** asserted an absolute trust floor where the contract is that work
  *earns* standing — it measures the change now. Its romance-ladder section also
  assumed the sky would deal a crew containing a mutually attracted pair, which
  it does not always do (see below).
- **`droneops`** looked in one port's locker for ore a hauler could have set
  down in its own home port.

Four suites that assert on emergent behaviour of a generated sky now pin an
explicit **fixture seed**, named and commented for why, instead of inheriting
whatever the public room happens to be. A suite about the romance ladder should
not go red because the sky's seed changed.

### Observed, not changed

A watch is four or five hands, and gender and orientation are rolled per person
— so a crew containing **no mutually attracted pair at all** is an ordinary
outcome rather than a rare one. One sky sampled during this work dealt exactly
that: a man drawn to nobody aboard, a nonbinary hand with no other nonbinary
aboard, a man drawn to women and a woman drawn to women. The romance and family
systems simply never engage for that crew. That is working as built and is left
alone here, but it is worth knowing that a player can go a long way without ever
seeing any of it.

### Housekeeping

- `Docs/` is gone; `README.md` at the repo root is the single reference, and
  this file is the history.
- Runtime artefacts (`logs/`, a stale `cradle.json`) are no longer shipped in
  the project.
- 24 dead imports removed from main-path modules and 12 from generator headers.

### Verification

- **33 node suites, 16,717 assertions, 0 failures.**
- **16 headless browser smokes** against a real GL context, all green, including
  the two-pilot shared-sky run against a live `server.py`.
- Known flakes, reproduced at the same rate on untouched trees rather than
  silenced: `smoke-genome` ("a vessel's log would not open", roughly one run in
  four) and `smoke-docking` ("push by the exit half", roughly one in three).
