# Changelog

Newest first. One entry per slice; full detail lives in the matching `PATCH_vX.Y.md`.

## v1.01.50 — "Findings" · 2026-08-08

**Research.** Save schema 14 → 15 (migration included). 30 suites, 2,531 checks.

### Fixed
- **Survey data had exactly one sink — you sold it.** Probes, surface features and anomaly
  telemetry have produced it since v1.00.40, and every scan anyone ever ran resolved to a
  commodity price.
- **Blueprints had no gate at all.** A fresh pilot with the materials could queue a tier-5
  antimatter torpedo in their first hour; what you could build was decided entirely by what
  you could afford.

### Added
- **`src/data/research.js` and `src/systems/research.js`** — nine projects consuming *typed
  findings* rather than a generic currency. A finding's kind depends on what you were looking
  at, so you cannot research cryogenics without having been somewhere cold, and the exotic
  tier needs anomaly telemetry — which finally makes a Lagrange point a destination. The
  suite asserts the converse: unlimited raw data does not unlock a project you lack evidence
  for.
- Findings are **derived from a body's own traits and features**, not from a name lookup, so
  a new planet type files findings on its own — the failure that left `planetInfo()` speaking
  a dead vocabulary until v1.00.40. Filed once per body: probing the same moon eight times has
  not taught you eight times as much about cold.
- **Permanent effects** registered through the same path a module bonus takes, so nothing
  downstream has to know whether a number came from a module or a finished project.
- **A blueprint gate on the seven tier-5 entries only.** Gating the catalogue retroactively
  would take things away from a pilot who already had them, and a slice that makes an existing
  save worse is one that should have been designed differently.
- **A Research tab** in the ops panel, leading with the findings ledger — the part that tells
  a player where they went decides what they can learn.

## v1.01.40 — "Shore" · 2026-08-08

**Rest, recovery and improvement.** Slice A of `docs/CREW_ROADMAP.md`. Save schema 13 → 14
(migration included). 29 suites, 2,460 checks.

### Added
- **Shore leave**, costing *time docked* rather than money. Crew ashore leave the roster
  entirely — no output, no watch, no experience, and they do not wear down or recover on the
  ship's clock. Undocking recalls them early, keeps a fraction of the benefit, and files
  "shore leave cut short" as its own cause, so a player who wonders why the leave did not
  help can find out instead of concluding it is broken.
- **Quarters, galley and infirmary** — three levels each, bought once and billed forever on
  the same clock as wages. Quarters speed off-watch recovery, an infirmary speeds healing,
  and a galley *softens* the short-rations penalty without removing it: it cannot conjure
  provisions, which is the honest thing a cook can do about an empty hold.
- **Training**, distinct from experience: experience is what happens to somebody, a course is
  something you choose. It costs money and a station off the watch bill, and pulling somebody
  out halfway refunds nothing and teaches nothing.

### Notes
- The design constraint throughout: **no recovery is both fast and free.** A button that
  removes fatigue would delete the watch rotation that fatigue exists to force, so each of
  the three costs something different — the clock, standing upkeep, or a body off the bill.

## v1.01.30 — "Watch" · 2026-08-08

**The crew becomes legible.** Structured logging, crew telemetry with attribution, and the
readouts for both. No schema change — none of it is saved, deliberately. 28 suites, 2,381
checks. The rest of the crew plan is in `docs/CREW_ROADMAP.md`.

### Fixed
- **Every crew number was a snapshot.** Morale is 0.62; nothing recorded that it was 0.91 an
  hour ago or that it fell because nobody was fed. The simulation has been detailed since
  v1.00.30 and completely opaque — "my crew keep quitting" was not a diagnosable complaint.
- **The payroll pass applied one net drift.** Each term is now recorded against its own
  cause, so the readout says *short rations* rather than *morale fell*. Attribution is scaled
  to what actually landed: at the morale floor the terms are notional, and a diagnosis that
  sums to more than the observed change is a diagnosis that lies.

### Added
- **`src/core/log.js`** — a bounded structured log: `{ t, channel, level, msg, data }`,
  queryable by channel, level, time and subject. Hard ring-buffer cap, because a tab open for
  hours cannot hold every event ever recorded, and it reports what it dropped rather than
  implying it is complete.
- **`src/systems/crew-log.js`** — a rolling per-person time series on a six-second cadence
  (a trend, not a recording), trends with a dead band so a number moving by 0.0001 reads as
  steady, and `crewDiagnosis()`, which ranks *causes by what they cost* rather than listing
  what happened.
- **A Watch log tab** ordered by who needs attention first, weighting falling above low:
  somebody at 40% and climbing is being handled; somebody at 60% in freefall is the problem.
  Flight-log diagnostics sit behind the same tab, because a separate screen is one nobody
  finds.
- **Three ARIA tools** — `crew_watch`, `crew_why`, `diagnostics`. A player asking "how is my
  crew" wants an answer; a panel can only show numbers.

## v1.01.20 — "Handles" · 2026-08-08

**The rest of the backlog, and an audit of the audit.** No schema change. 27 suites, 2,305
checks. The reachability backlog is now empty.

### Fixed
- **The planetary layer can be operated, not just looked at.** Eight verbs had no caller —
  `collectFrom`, `deliverTo`, `manufactureAt`, `upgradeCentre`, `abandonSite`, plus
  `installFacility`, `toggleFacility` and `removeFacility`, which the hand-written registry
  missed entirely. A site card now expands into the whole operating panel, ordered by how
  often a player does the thing, with the two irreversible actions at the bottom where a
  mis-tap cannot reach them.
- **A queued manufacturing job could not be stopped.** `cancelJob()` shipped with a refund
  curve nobody could collect. The ledger lists jobs with a CANCEL beside each.
- **Winning a fight did not lift the crew.** `CREW.moraleWin` sat in config since v1.00.30
  unread: morale could be ground down by unpaid wages, bad rations and long watches, and had
  no way to be raised by the thing the crew are aboard for. Only the watch on duty feel it.
- **`SEEKER.reacquire` could not be read even if something had tried.** `guide()` returned
  early on a lost seeker before reaching the branch the flag would have controlled. It is a
  real lever now — and stays off by default, because a missile that regains its lock turns
  the hard turn that beat it into a delay rather than a defence.

### Changed
- **Two of the five gaps in the v1.01.10 audit were overstated**, and the correction is
  worth more than either fix. `setDuty` and `rotateWatch` were reported unreachable because
  the registry named an inner function while the crew panel calls a wrapper — a registry bug
  reported as a product bug. `cyclePalette` was a helper nothing needed, since the settings
  panel selects a palette directly; removed, along with `POINTDEF.perRound`, a constant with
  only one correct value that was documentation wearing a config key's clothes.
- `test/reachability.mjs` now separates three things it had conflated: genuinely
  unreachable, reachable under another name, and declared-but-never-triggered. The last is a
  new category holding `influenceAttempt` — a hazard that exists and cannot happen.

## v1.01.10 — "Reach" · 2026-08-08

**Features that existed and could not be reached.** No schema change. 27 suites, 2,286
checks. Full findings in `docs/REACHABILITY_AUDIT.md`.

### Fixed
- **The planetary industry layer had no front door.** `foundSite()` was called by nothing
  but the `LG` developer handle in `main.js` — command centres, facilities, extraction,
  storage, the assay and the site managers were reachable only from a browser console. Which
  means the moon bug fixed in v1.00.40 was a refusal inside a code path no player could
  invoke: I fixed the second gate while the first one did not exist. The Ops panel now
  offers what will sit on the world you are orbiting.
- **Deep-space anomalies could not be worked.** `investigate()` had no caller outside the
  test suite, so six anomaly types, their reward tables, the one-shot rule and a schema
  migration shipped in v1.00.50 unreachable. The target panel's PROBE button becomes WORK
  SITE on a Lagrange point — one button, two verbs, chosen by what is under the reticle.
- **The player could not post a job.** `postPlayerJob()` shipped in v1.01.00 with no screen.
  A freight board at any dock now posts out of your own hold, quoting the fee first.

### Added
- **`test/reachability.mjs`** — reads the source rather than running it and asserts every
  registered player-facing verb is either wired or on a written-down backlog. It requires an
  import *and* a call, because a bare text match reported `reassign` as wired on the strength
  of two comments. It found `foundSite`; the hand audit did not.
- **`foundBlocker()`** — the founding rules as a predicate, so a panel can show why a button
  is disabled instead of the player discovering it by pressing one. A second reader of the
  rules, never a replacement: `foundSite()` still checks everything itself.

## v1.01.00 — "Ledger" · 2026-08-08

**Obligations between characters.** Second slice of `docs/NPC_ROADMAP.md`. Save schema
12 → 13 (migration included). 26 suites, 2,243 checks.

### Fixed
- **Two of the seven topics shipped last slice could never fire.** `haulOffer` and half of
  `oreTip` require a `haul` role and no ship class in the game had one. The suite passed
  because every check was about the shape of the table, not about whether anyone could
  satisfy a `when` clause. A declared requirement is only as good as the population that can
  meet it — there is a reachability check now.
- **The social layer was state that did not act.** Relationships and gossip were filed and
  read; no exchange produced a commitment, a course change or a trade.
- **`applyTrade` is from the station's point of view.** Read as "the player is selling", a
  completed haul *drained* the destination instead of stocking it.
- **A pinned roster count is a red suite for a correct change.** Two suites asserted
  `npcs.length === 63`; adding haulers made it 67. Both derive from the type table now.

### Added
- **Haulers** — slow, fat, unarmed, and the only class whose purpose is moving somebody
  else's cargo. An idle one runs a circuit rather than parking: a ship that exists only when
  it has a job is one the player never sees idle.
- **`src/systems/deals.js`** — the ledger. Two named parties, terms, a clock, and a
  settlement that files memory on both sides. Every obligation can fail, and a default is a
  *fact about somebody* rather than a silent cleanup — so a raider shooting down a laden
  hauler is now a default the miner who hired it remembers. The first time shooting somebody
  has a consequence for a third character.
- **Reliability derived from memory**, the way `wariness()` is: same table, same decay,
  different question. A default costs several deliveries, because a reputation for keeping
  your word should be slow to build and quick to lose.
- **Deliveries move prices.** `settle()` applies the cargo to the destination's market book —
  an NPC trade that does not move a price is a story about a trade.
- **The player can post a job.** `postPlayerJob()` uses the same records, the same
  `willAccept` and the same settlement path as two NPCs dealing with each other, asking the
  hauler who trusts you most first.

## v1.00.90 — "Chatter" · 2026-08-08

**The exchange layer: NPCs talking to each other.** First slice of the NPC roadmap in
`docs/NPC_ROADMAP.md`. Save schema 11 → 12 (migration included). 25 suites, 2,182 checks.

### Fixed
- **NPCs had no channel to each other.** `comms.js` is a player-facing log: `transmit()`
  appends to the panel the player reads, `inRange()` measures distance from the player, and
  every line an NPC had ever spoken was spoken *at* the player. Two ships a hundred
  kilometres apart with the player elsewhere could not exchange a word.
- **Every memory in the game had `subject: 'player'`.** `npc-avatar/core/memory.js` has
  said since v1.00.30 that a subject may be "a player id, a faction, another NPC's id".
  That clause was true and unused: the data model could hold "Kestrel 04 owes me a favour"
  and nothing had ever written one.

### Added
- **`src/systems/npc-comms.js`** — messages with a sender, a recipient and a topic,
  propagating by range between the two speakers rather than by proximity to the player. An
  exchange files a memory on *both* sides with the other character as the subject, so the
  second conversation between two ships is not the first one again.
- **`src/data/npc-topics.js`** — seven topics as data, each declaring its condition, its
  channel, its lines and — the part that matters — what each side keeps afterwards. The
  suite asserts that every topic files state on both sides, which is what stops a
  screensaver being added by accident.
- **Relationships derived, not stored.** `relation(a, b)` reads `a`'s own memory rather
  than a parallel table: one source of truth, no migration, and a character that forgets
  somebody forgets them completely — the honest behaviour for a bounded memory.
- **Gossip.** A character wary enough of the player passes the warning on, and the listener
  files it against the *player*, weighted lighter than eyewitness. Reputation now travels at
  the speed of conversation instead of teleporting into a global number.
- **The player overhears.** Traffic within comms range lands on the existing channels. The
  exchange happens either way — the transmission is a consequence of it, not the substance
  of it.

## v1.00.80 — "Nerve" · 2026-08-08

**NPCs get the budgets the player has, and a brain that decides with them.** No schema
change. 24 suites, 2,118 checks.

### Fixed
- **The brain was a mouth.** `npc-brain.js` has filed memories since v1.00.30 — that a ship
  watched you kill one of its own, that it traded with you, drifting its traits accordingly —
  and `entities/npcs.js` never read a word of it. A pirate that had watched you destroy three
  of its faction charged you exactly like one that had never seen you, then made a pointed
  remark about it while dying. A memory system nothing consults is decorative by
  construction.
- **NPCs had no magazine and no thermal cutout**, three slices after the player got both. An
  NPC gun platform could hold a trigger down forever, so a long fight was decided purely by
  who had more hull; there was no such thing as running somebody out of rounds. Flagged at
  the end of v1.00.60 and again at v1.00.70 — carrying it a third time would have been a
  decision rather than a backlog.

### Added
- **`src/systems/npc-tactics.js`** — four stances (press, hold, regroup, flee) re-appraised
  on a cadence rather than per frame, because a ship that changes its mind sixty times a
  second never does anything. `press` scales the engagement band by 1, so a ship that has
  decided nothing flies exactly the profile it flew before.
- **Wariness, read off the persona memory.** Remembered kills add, favours subtract. A
  character who remembers you killing its own will not close alone — it holds at reach and
  waits for company, and with company the grudge is why it comes at all. Two identical hulls
  at identical damage make opposite calls, and the only difference is what they saw you do.
- **Nerve from traits.** An aggressive character fights down to a hull fraction a cautious
  one ran from twenty seconds earlier, and a lone ship breaks earlier than the same ship in a
  group — the first time being outnumbered is something the NPCs feel rather than only the
  player.
- **Calls for help.** Filed from `damageNpc()`, the only place that knows who did it. Nearby
  friends converge; emplacements do not come running. The difference between picking off a
  patrol and having a patrol arrive.
- **NPC magazines and heat.** Coarser than the player's on purpose — one pool each, because
  an NPC has no fitting screen and simulating what you cannot show is detail nobody can see.
  Magazine depth scales off rate of fire, so a new NPC type gets a sane one without anybody
  remembering to add it. A ship that flees keeps its damage and its empty rack: a raider that
  got away is one you meet again in worse shape.

## v1.00.70 — "Trigger" · 2026-08-07

**Weapon groups and the loadout panel** — finishing what v1.00.60 started rather than
starting something new. Save schema 10 → 11 (migration included). 23 suites, 2,044 checks.

### Fixed
- **v1.00.60 made the type of round a decision and gave it no screen.** Auto-chamber was
  doing all the work, so the tactical choice that whole slice was built around was not
  reachable by a player. There is a Magazine tab now: what is aboard, what is chambered,
  what each round does, and — when docked — what the station will sell you.

### Added
- **`src/systems/groups.js`** — two weapon groups and a three-state trigger selector
  (I → II → ALL). Assignment is keyed on the *hardpoint*, not the mount: `mountedWeapons()`
  drops empty slots, so keying on mount index would silently reassign a pilot's groups every
  time they unfitted something.
- **Falloff is measured inside the volley that fires.** Firing two of four guns should not
  pay the fourth barrel's penalty on a gun that is now the second one shooting. That is what
  makes splitting a rack a trade instead of a loss: fire everything for maximum alpha at the
  worst average yield, or alternate two groups for smaller volleys where every barrel is near
  the front of its own queue.
- **Cooldowns are per hardpoint.** Switching groups mid-fight does not re-arm a barrel that
  just fired — the gun is still hot whether or not it is under the trigger.
- **Preflight judges the live group.** A pilot with group I selected and group I dry is told
  their magazines are empty rather than reassured because group II still has rounds; an empty
  group is its own refusal (`nogroup`) rather than "no weapon fitted".
- **A group chip above the action grid**, hidden until a fit actually has guns in two groups
  — a control that changes a label and nothing else invites a tap and teaches nothing. The
  FIRE button shows which trigger is live.

## v1.00.60 — "Magazine" · 2026-08-07

**Ammunition and thermal load** — the two deferred items from v1.00.20. No schema change:
the chambered round rides with the ammunition payload it selects from. 23 suites, 2,001
checks.

### Fixed
- **Forty ammunition blueprints had no consumer.** The catalogue, `S.ammo`, the
  manufacturing queue and the save payload have all existed since v1.00.20; `weapons.js`
  spent energy and produced a projectile out of nothing. A complete supply chain that looked
  finished from every angle except the one that mattered.
- **Armour penetration went the wrong way.** `DAMAGE.resist` entries are damage *multipliers*
  — kinetic against armour is already 1.30 — so the natural reading of "penetration", lifting
  the resistance toward 1, made AP rounds *worse* against armour. It widens the multiplier
  now, and `apYield` pays for it.
- **Heat capacity derived from hull mass made the freighter the best gun platform in the
  game.** How much fire a ship can sustain is radiators, not tonnage; each hull carries the
  number.
- **The thermal cutout could never fire.** The latch sat in the venting function, where heat
  is clamped at capacity before the check and vented before the comparison, so the value was
  always a fraction under the line. A threshold checked after the thing that moves it away
  from the threshold is a threshold that never trips.

### Added
- **`src/systems/ordnance.js`** — feeds, and what a round does. Compatibility is derived from
  the catalogue's own prose rather than a second table saying the same thing: a weapon
  declares the words its feed answers to, so a new `AMMO-` entry joins the right guns the
  moment it is added. Damage type, armour piercing and yield are read off `damage_type` and
  tier the same way. Non-combat stores are filtered out so the panel never offers a choice
  that does nothing.
- **`src/systems/magazine.js`** — what is aboard and what is chambered. One round per feed
  rather than per mount; fractional draw against integer stock so a burst weapon is not a
  different economy from a heavy one; and auto-chamber, so a pilot who never opens the panel
  is never told their guns are empty while there are slugs in the hold.
- **Thermal load.** Firing generates heat, heat vents, and past the cutout the guns stop until
  they cool to a lower resume threshold. Energy weapons run hot and never run dry; projectile
  weapons run cool and eat rounds — the two families are limited by different things rather
  than one being strictly better.
- **Station resupply.** Stacks up to tier 2 over the counter, priced off the catalogue plus a
  markup. Tier 3 and up stays a manufacturing problem, deliberately.
- **A heat bar and a magazine line on the HUD**, and a starting allowance so the gauss driver
  a new pilot is issued can actually fire.

## v1.00.50 — "Shallows" · 2026-08-07

**Rings, Lagrange points, deep-space anomalies — and the gravity-well rewrite they all
turned out to depend on.** Save schema 9 → 10 (migration included). 22 suites, 1,891 checks.

### Fixed
- **Gravity wells were computed from surface gravity as if it were mass.** Surface gravity
  barely falls off as a body shrinks, so the constant term dominated and a 7 km moonlet
  projected a 557 km shadow — thirty-seven times its own radius. That is why gravel behaved
  like a wall, why the planner detoured around pebbles, and why a warp dropped you
  embarrassingly far from anywhere. The well now scales on `√gravity × radius`, a mass
  proxy, and sits between four and six body radii: Solaris Prime 2,478 → 1,594, Titanus
  1,325 → 668, Aether 725 → 154, a moonlet 554 → 42. The formula moved out of
  `systems/warp.js` into `WARP.well`, because "balance the game by editing config only" is
  not true if the most consequential geometry in the game lives elsewhere.
- **The arrival floor was the other half.** `arriveRadius` was 900, set when it never bound
  on anything; with the new wells it bound on everything except the star, so every arrival
  in the game was at exactly 900 km and shrinking the wells would have changed nothing a
  pilot could feel. It is 240 now, so arrivals scale with the body. **When you shrink a
  number, check what was clamping it.**

### Added
- **Rings you can mine.** A ring is a field like any other, but its rocks are held by a
  planet rather than by Solaris — a belt is a radius from the origin and a ring is a radius
  from something that is itself moving. Rings are volatile fields, which is the reason to
  make the trip rather than mine Meridian like everyone else.
- **`src/systems/fields.js`** — the one place that knows the difference. "Warp to the belt"
  was computed in four files, all of them assuming the circle was centred on the star;
  rather than teach four files about parents, they all ask here.
- **`src/systems/lagrange.js`** — L4 and L5 for every planet, derived rather than generated:
  the parent's phase plus sixty degrees, one cosine, nothing stored and nothing synced. A
  point projects no gravity well, deliberately — a well would drop the core short of a place
  with nothing at the middle of it.
- **`src/data/anomalies.js`** — six one-shot deep-space sites: a derelict hull, a concealed
  cache, a repeating buoy, a trojan shoal, a gravitic knot, and cold dust. Every reward
  channel already exists; nothing here is a new currency and nothing gates progression. What
  is at a point is seeded from the world seed; whether you have worked it is the entire
  schema-10 payload. `dust` exists on purpose — a survey that always pays is a vending
  machine with a longer walk.

### Changed
- A Lagrange point's identity is returned by the scanner even at zero resolution: which
  planet and which side is chart data, not sensor data. What is *on station* still needs the
  sweep.
- A sixth contact tab for deep-space places.

## v1.00.40 — "Ephemeris" · 2026-08-06

**Solar system & celestial bodies.** No schema change — everything new is derived from
fields the save already holds. 22 suites, 1,795 checks.

### Fixed
- **No moon in the game could ever be built on.** `foundSite()` has accepted
  `kind === 'moon'` since v1.00.20, but a moon carried no `ptype`, so
  `centre.worlds.includes(undefined)` was false for every command centre in the table.
  The layer said yes and the data said nothing; the message printed was "a Survey Outpost
  cannot be built on a undefined world".
- **The survey spoke a vocabulary the game had abandoned.** `planetInfo()` branched on
  `'rocky'`, `'terrestrial'`, `'ice'` and `'gas'`; three of those stopped being planet
  keys when the twenty-type table landed. Seventeen of twenty world classes fell through
  to the default, gas giants reported rock volatiles, and surface temperature was re-rolled
  from a second band unrelated to the body's actual temperature.
- **A moon walled off its own primary** (latent). A warp course ends at the destination's
  well edge, so anything orbiting inside that edge is behind the arrival point — but
  `collectObstacles()` skipped only the destination itself, and dutifully tried to route
  around a moon standing between the ship and the giant from every direction at once.
  Reproduces on the pre-slice moon values at seed 191393.
- **A dead band at the well edge** (latent). Legs block inside `NAV.test` well-radii and
  bypass nodes sit at the larger `NAV.clear`; a ship between the two was blocked and could
  not reach any node, so A* found no first leg at all. `escapesWell()` is now measured at
  the ring radius and shared by the planner and `routeClear()`.
- **Courses were planned to the destination's centre** and the ship has never flown there.
  `clipGoal()` ends the final leg at the well edge, which is where the core actually drops
  out — this is what made two planets in near conjunction reject a legal approach.

  Across a 200-seed sweep (12,000 plans) the unclear count went 11 → 1.

### Added
- **`src/data/moons.js`** — nine moon classes, each mapping onto an existing `PLANET_TYPES`
  key so resources, traits, centres, facilities, the assay and the scanner read a moon for
  free. Selection is physical: the primary's temperature and the moon's depth in its well,
  so the innermost moon of a giant is volcanic and the outer ones are ice. A gas giant you
  cannot land on now has four things in orbit that you can, and they are not the same four.
- **`src/data/features.js`** — nineteen surface features, one to three per world, seeded
  from the world name. Requirements are declared rather than whitelisted; effects land in
  systems that already exist (`assay` feeds the permanent per-world figure extraction pays
  on, `probe` scales telemetry, `scan` offsets atmospheric interference); and discovery is
  *derived* from scan resolution and probe level, which is why there is no schema bump and
  a v1.00.34 save arrives knowing what it earned.
- **`src/systems/ephemeris.js`** — analytic prediction, intercept, exact synodic period and
  conjunction time. Warp now leads a moving destination instead of flying a pursuit arc,
  the scan panel gives range at arrival rather than range now, and a ship docked or in
  orbit is told when the next transfer window opens.
- **Atmospheric interference.** The atmosphere shells have been decorative since they were
  added; effective sensor strength is now divided by the density derived from them. A low
  orbit still fully resolves a greenhouse and a survey ring does not, which is what turns
  the orbit-band menu into a decision. A giant is a body you probe.
- **`test/celestial.mjs`** — 119 checks. Prediction is asserted against 300 seconds of real
  simulation, the analytic conjunction against a brute-force sweep, and determinism across
  two child processes rather than two builds in one (texture caching makes the second build
  legitimately different, and asserting against it would assert the wrong thing).

## v1.00.34 — "Clearance" · 2026-08-06

**HUD geometry.** No schema change. 21 suites, 1,676 checks.

### Fixed
- **The ARIA and comms buttons were hidden behind the throttle dock.** `#tool-column`
  was pinned at the top and left to grow downward with no bottom bound, so once it
  reached eleven buttons the last few ran underneath the bottom dock and were simply
  unreachable on a phone. It is now anchored at both edges like `#left-stack` already
  was, its buttons are `flex:0 0 auto` so they scroll rather than squashing into
  slivers, and three short-screen breakpoints tighten the buttons so all eleven fit
  without scrolling at any realistic phone height.
- The throttle panel is smaller: track 18px → 13px (11px on short screens), with the
  header, padding and preset buttons trimmed to match.

### Changed
- **One dock-height variable, `--dock-h`.** Four panels each carried their own hardcoded
  guess at how much room the bottom dock needed — 150px, 158px, 176px, 188px — which is
  why trimming the throttle would previously have left three of them wrong. They all
  reference the shared reserve now, so they follow the dock automatically at every
  breakpoint.

### Added
- **`test/layout.mjs`** — reads the real numbers out of the stylesheets and checks that
  eleven tool buttons fit the space reserved for them at four viewport heights. Every
  other suite asserts behaviour, and a button works perfectly while sitting underneath
  the throttle; this is the only suite that could have caught it.

## v1.00.33 — "Witness" · 2026-08-06

**The NPC brains reach the rest of the game.** No schema change — v1.00.32 already made
room. 20 suites, 1,658 checks.

### Added
- **Ambient traffic comes from personas.** The per-faction string tables in `comms.js`
  were the floor; belt chatter and NPC-to-NPC replies are now generated from whoever is
  actually speaking. Six miners in the same belt say six different things, and a greedy
  one says something a generous one never will.
- **NPC-to-NPC exchanges are two personalities, not two factions.** Whether a distress
  call gets a rescue, an apology or a vulture asking what the salvage is worth is now a
  property of the specific character who answers.
- **The world files memories about you.** Three hooks: every ship in voice range
  remembers a kill they watched (and files it differently depending on whose side the
  dead ship was on), a station’s purser remembers who deals there and how big, and a
  miner remembers you cutting a rock they were working — which comes back at you in
  their own chatter later.
- **The mind overlay.** Tap a speaker’s name in the comms log to see their six axes,
  the words those axes add up to, and every memory they hold about you. Started as a
  debug view for tuning trait weights; stayed because it turns invisible machinery into
  something you can play against.

### Fixed
- `hail()` accepted a `speaker` key and silently dropped it before `transmit()`, so hail
  rows carried no persona reference and could not be opened. Caught by the new suite.

### Changed
- `comms.js` gained a voice-provider seam (`setVoiceProvider`). A registration hook
  rather than an import, because `npc-brain.js` already imports `comms.js` — dependency
  flows one way and the radio never learns what a persona is. With no provider
  registered the game behaves exactly as before, which the tests assert.

## v1.00.32 — "Avatar" · 2026-08-06

**NPC brains.** Save schema 8 → 9 (migration included). 20 suites, 1,620 checks, plus 143
in the new engine's standalone suite.

### Added
- **`src/npc-avatar/`** — a portable, game-agnostic NPC-intelligence engine. Six-axis
  personality, bounded decaying episodic memory, a Tracery-style grammar gated on traits
  and memory, and a router that rations an optional language-model tier. Vanilla ES
  modules, no build step, copyable into another project unchanged.
- **`src/systems/npc-brain.js`** — the Living Galaxy adapter. Lazy persona creation on
  first individual contact, archetype inference from the roles the world already assigns,
  name-seeded determinism so a character is the same person on every client sharing a
  world seed, and the three world hails rebuilt as grammars.
- **Language-model dialogue (Tier 3, opt-in)** — a small model in a worker that rewrites
  a hail in the speaker’s own voice. Asked at most once per conversation, one
  generation in flight at a time, never downloaded until the player asks in Settings →
  Lab. Every failure mode — unloaded, crashed, slow, timed out — leaves the player with
  the grammar line they already had.
- `comms.js` gained `updateEntryText(id, text)` and now records the entry id a hail
  created, which is what lets an async enrichment replace that exact line later.

### Changed
- The three canned hail functions moved from `comms.js` to `npc-brain.js`. `comms.js` is
  radio plumbing again and knows nothing about personas.
- NPCs no longer share one voice. The same mercenary contract reads differently depending
  on who took it, how aggressive they are, how formally they speak, and whether they have
  hunted you before.

### Notes
- No model inference is covered by the tests — every LLM path is exercised through an
  injected fake bridge or fake worker. Nothing downloads weights in CI or at boot.

## v1.00.31 — "Preflight" · 2026-08-06

**Interlocks, onboarding, a radio with people on it, and the experimental automation
branch.** Save schema 7 → 8 (migration included). 19 suites, 1,545 checks, all green.

### Fixed
- **A ship with empty hardpoints could fire.** Three layers conspired: character creation
  set `S.weapon` without ever writing it into `S.fit.weapon[0]`, `resolveWeapon()` fell
  back to the hull class's nominal gun so `weaponDef` was never null, and `updateWeapons()`
  fell back to that phantom definition whenever `mounts` was empty. The yard now actually
  installs the gun (`seatWeapon()`), `weaponDef` is strictly hardpoint one and is null on
  an empty rack, and `mounts` is the armament at the trigger. `systems/economy.js` was
  keeping a second private copy of "install a weapon"; it now delegates to the same one.
- **A contract could be posted on you in the first minute.** Eligibility was
  `kills >= 1 || credits > 2500`, and starting credits already clear that for most
  lineage/corp pairs — so a pilot who had done nothing but undock could be hunted before
  they had a gun fitted. It is now earned: a grace period, or two kills, plus a notoriety
  floor. Training is a hard shield.

### Added
- **`systems/preflight.js`** — one authority for every critical action. Pure verdicts
  (`{ ok, code, reason }`), stable machine-readable codes, severity ordering, and
  per-code rate-limited announcements. Wired through weapons, mining and warp. Two new
  interlocks fell out of it: a hull with no cutter rating cannot mine, and a hull below
  18% integrity locks the cutter arm out.
- **Flight training** — seven observation-based stages that never block a control, can be
  put away, and end by asking whether to carry on or start fresh. Only offered to a new
  pilot; restartable from Settings → Lab.
- **Comms** — ambient traffic generated from ships that actually exist in voice range,
  NPCs answering each other by faction, and hails with standing-costed replies that
  expire. Channels, filters, unread badge.
- **The executive start** — a sixth career that begins with a registered company rather
  than a job: treasury separate from your wallet, five charters, a three-seat board in
  tension, dividends, and a mission chain judged on the books.
- **Automated site managers (experimental, off by default)** — one archetype per branch,
  each with its own objective, tolerances, ordered policy list and periodic
  re-optimisation, plus a four-rung autonomy axis. Every action carries the policy that
  caused it. Turning the flag off leaves them inert rather than removing anything.
- **Trespass tracking** — six continuous seconds inside a pirate claim counts toward being
  worth hunting, weighted like a kill.

### Changed
- Three existing assertions were updated because they asserted the old, wrong behaviour —
  two firing tests that passed on a bare ship, and two schema pins. Detail in
  `PATCH_v1.00.31.md`.

## v1.00.30 — "Standing Orders" · 2026-08-05

**Technical hot slice 3 of 10 — Locking, silence, crew depth & delegation.**
Save schema unchanged at 7. Celestial bodies move to v1.00.40; these were the things
actively wrong.

### Fixed
- **Hostiles locked on from anywhere.** The lock test was `target && target.isPlayer` with
  no distance check in it at all — a pointer, not a lock. Worse, acquisition used the
  signature-scaled detection range while the drop rule used a flat multiple of sensor
  range, so acquire range could *exceed* drop range and a loud ship was re-acquired the
  instant it was dropped. There are now three distinct ranges — sensor, lock and hit — and
  a lock is built over 1.8s, held with hysteresis, and broken along with the contact when
  you leave.
- **Max hit range**, separate from lock. A gunship cannot shoot past what it can hold;
  seekers, drone shoals and fleet elements reach 1.9–2.4× further, because their rounds
  guide themselves the rest of the way in. Hard ceiling at 9,000 units.
- **Sound off did not turn the sound off.** The flag gated the functions that *start*
  sounds; the music bed is two oscillators that start once and run forever. Muting now
  happens at the master and then suspends the context, so the oscillators stop being
  computed rather than multiplied by zero — a silent oscillator still costs phone battery.
  It ramps rather than cuts, and the bed refuses to start while muted.
- **Crew levelled to the cap for doing nothing.** Idle experience cut by twenty and the
  weight moved onto ten kinds of event, credited 70% to the department that did the work
  and 30% across everyone on watch. Off-watch crew learn nothing from an event.

### Added
- **Crew needs.** Provisions — nutrient concentrate and water ice, drawn from the same
  material stock as everything else — plus life-support power per head. Hunger and thirst
  are rates: a ship that runs out gets progressively worse rather than stopping. Shown as
  Fed and Watered, drawn as remaining so a full bar is always the good state.
- **Breaks**, distinct from watch rotation: short, taken on watch, and they give back a
  little of everything.
- **Resolve.** Every crewman rolls a willpower value scaled by temperament, used in *both*
  directions from the same roll — you persuading them, and an enemy influence net trying to
  turn them. A pliable crew does what you ask and what the boarding party asks. Six new
  traits spread across both sides of neutral, each with flavour and a consumption
  multiplier.
- **Promotion.** One overseer per ship, level 5+, who stops manning a station entirely and
  in exchange lifts everyone else's output, learning and efficiency. Scaled by their level.
- **◈ Operations** — standing orders. Scout teams, survey crews and reclamation units run
  for hours of game time while you are elsewhere. Dispatched crew leave the roster, orders
  can go wrong, and a survey permanently raises a world's assay so every extractor you ever
  build there is paid on it.
- **⚖ Ledger** — one panel for income, upkeep, payroll, provisions runway, life support,
  contracts and standing, plus a holdings tab. Site upkeep had been invisible entirely,
  which is a bad property for a recurring cost.

### Compatibility
- Every save from v0.2 forward loads. Existing crew arrive fed, watered, with a workable
  resolve, nobody promoted and nobody dispatched.
- Crew progression is much slower unless things are happening, which is the point.
  Provisions are a new running cost. Enemies now disengage properly, which makes running
  away work.

## v1.00.20 — "Foundry" · 2026-08-04

**Technical hot slice 2 of 10 — Equipment, blueprints & planetary industry.**
Save schema **6 → 7**.

### Fixed
- **Selecting a target on the nav map, then a different one from the contacts list, then
  warping, flew you to the first.** The nav map's SET COURSE wrote `S.warp.dest` while the
  contacts list only wrote `S.target` — and warp reads the course. Nothing on screen said
  so, because the HUD shows the target. Selecting a destination now lays the course from
  either interface, so the two cannot disagree; dropping the lock drops the course.
  Locking a *ship* deliberately leaves the course alone — you do not warp to a ship, and a
  pilot locking a pursuer is not cancelling their escape.

### Added
- **The crafting catalogue.** 76 materials and 235 blueprints — 70 ship modules, 50
  weapons, 40 ammunition types, 75 personal items — each carrying its own bill of
  materials. `billOfMaterials` for immediate inputs, `rawCost` for the tree expanded down
  to what you have to mine, `usedBy` as a reverse index built once at import.
- **Manufacturing.** A material stock separate from the cargo hold, and a job queue that
  runs on game hours. Materials are consumed when a job is *queued*, not when it delivers,
  so three jobs cannot each spend the same titanium. Engineering rank cuts build time,
  bounded, with a floor.
- **Planetary industry**, in the structure the game already implies: planet type →
  command centre → branch → facilities. Twenty worlds with resource tables where richness
  multiplies extraction, five command centres typed to the ground they sit on, and five
  branches — military, industrial, logistic, economic, civilian — matching the five career
  paths.
- **The Planetary Industrial Complex.** Ten slots, reached *through* a tier-2 site rather
  than straight from an outpost, keeping the facilities already installed. A PIC with an
  assembly line builds ship modules and weapons from the catalogue, which is what makes a
  pilot independent of every shipyard in the system.
- `docs/Space_RPG_Crafting_Database-3.json` kept unmodified as the authoring source, with
  `docs/CRAFTING_SOURCE.md` recording what was derived and the two properties that must
  hold when it is regenerated.
- `test/industry.mjs` (159 checks).

### Notes
- A handful of catalogue entries ship with an empty bill of materials on purpose — luxury
  trade goods are acquired, not fabricated. An empty bill reads naturally as "needs
  nothing", which would have let a fabricator print the most valuable item in the game out
  of an empty hold; `craftable()` treats it as uncraftable instead.
- Facilities declare what they need from the ground rather than listing planet types, so a
  new world type does not silently become unbuildable.
- Power shortfall browns a site out rather than stopping it, floored at 25% — the same
  reasoning as the 0.7 fitting budget.

### Compatibility
- Every save from v0.2 forward migrates. A pre-v1.00.20 flight has no stock, no queue and
  no sites, which is what a pilot who has never crafted anything actually has.
- Additive: nothing existing changed price or rate. Buying modules at a shipyard works
  exactly as before.

## v1.00.10 — "Watch" · 2026-07-31

**Technical hot slice 1 of 10 — Crew.** Save schema unchanged at 6. The crew stops being
an idle layer and becomes something you operate.

### Added
- **Speciality and post are separate.** What a crewman trained as and where they are
  standing were one field; moving somebody halved their experience, so nobody ever did.
  Posting is now free and reversible — covering costs 55% of output and 65% of learning,
  and those costs are enough. Retraining, which changes what they *are*, is the expensive
  one.
- **Watches.** Crew can be stood down: they contribute nothing and recover fatigue at 2.6×
  the underway rate. Auto-rotation relieves the exhausted, uses separate thresholds for
  going out and coming back so nobody thrashes, and never empties a manned post.
- **Morale has five drivers** instead of one: pay, crew fatigue, off-speciality posting,
  shore leave while docked, and deaths.
- **Casualties.** A hit taking more than 18% of hull can injure someone on watch — never
  someone off it. Injury scales output down and heals over time, fastest docked and 2.2×
  faster with damage control manned. Death requires an already badly injured crewman.
  Station infirmaries treat the whole crew for a fee.
- Crew screen rebuilt: speciality and post as separate lines, morale/rest/health as three
  bars, a one-line condition, watch control, and a departments tab that is now a post
  report showing who is covering and which stations are unmanned.
- `test/crew.mjs` (99 checks).

### Fixed
- **The recruiting board was generated once and cached on the station mesh.** The same
  four people stood in the same bar for the life of a save — and since `userData` is not
  persisted, reloading silently produced four *different* permanent people. The pool now
  lives in state, is saved, turns over every seven minutes, and is deterministic for a
  given seed and moment so two pilots on one relay see the same faces.
- Hiring costs were tripled to match the 1.0 economy; they had been missed in that sweep.

### Compatibility
- Every save from v0.2 onward loads. Existing crew arrive on watch, at their speciality,
  uninjured — `post: null` and an absent `onDuty` mean exactly what a pre-v1.00.10 crewman
  was.

## v1.0.0 — "Solaris" · 2026-07-31

**Hardening.** Save schema unchanged at 6. No new systems — a balance pass, a two-hour
soak, and the documentation rewritten as one piece. **The largest balance change the game
has had.**

### Fixed
- **The economy did not survive being measured.** A full 18-tonne industrial hold sold for
  roughly 378,000 credits; the most expensive hull plus its licence cost 28,000. One trip
  to the belt bought everything in the game twice over, which made every price, upgrade
  tier and licence requirement downstream of it decoration. Commodity prices cut to a
  sixth and the cost side tripled — an eighteen-fold correction applied from both ends. A
  full industrial haul is now worth roughly one significant purchase.
- **Licence fees were inverted.** Every licence cost about the same, so the cheap hulls
  were the expensive ones to get into: the economic hull cost 4,200 and its licence 13,000.
  Fees are now ~75% of the hull they certify.
- **Progression reached its ceiling in half an hour.** Gunnery rank 3 — a licence
  requirement — arrived after two minutes of sustained fire. Now roughly eight minutes to
  rank 3 and two hours to rank 10 of continuous activity.
- **Fights ended before you finished turning.** A starting Enforcer does 55 damage a second
  and a pirate raider had 60 hull points. Roster hull points up ~2.5× with bounties to
  match; a raider now takes three to four seconds.
- Agent-chain credit thresholds rescaled — "bank 6,000 credits" was a step you completed by
  accident before reading it.
- Four test fixtures were secretly asserting prices by hardcoding credit amounts. They now
  derive from the live quote and the live rank cost.

### Added
- `test/soak.mjs` — two hours of game time in 36 seconds, asking of every list in the game
  whether it is the same size as it was after two minutes. It is: the interpolation
  registry holds exactly 63 entries for 63 ships after two hours, nothing throws, no phase
  parks, prices stay finite, and the save stays small. No leaks found, which is what makes
  it the test that will catch the first one.

### Changed
- README rewritten as one document in nine parts rather than nine patches' worth of
  appended sections. The duplicate ARIA section — 0.10 added one without noticing the 0.1
  one — is merged.

### Compatibility
- Every save from v0.2 onward still migrates forward. A pilot carrying a pre-1.0 fortune
  will find it worth much less relative to prices, which is the correction working.
- Multiplayer wire format unchanged from 0.10.

## v0.10.0 — "Consensus" · 2026-07-31

**Slice 8 of 8 — Network & Assistant.** Save schema unchanged at 6. **Protocol is not
backward compatible** — update `server.py` alongside the client.

### Added
- **Shared NPCs.** The oldest connected pilot is the host: it simulates the world and
  broadcasts it, everyone else receives it, and the relay reassigns when the host leaves.
  The server's entire contribution is knowing who may send `npc` messages — it still
  contains no game logic, which is what keeps it stdlib-only and runnable in Termux.
  This closes the gap the README has carried since v0.1, where every pilot fought their
  own private Nexis.
- Clock synchronisation. The server echoes the client's own stamp untouched alongside its
  world age, and the estimate keeps the **fastest** round trip rather than the average —
  a slow packet was delayed asymmetrically, and averaging biased noise does not cancel the
  bias.
- A snapshot buffer rendering remotes 280 ms behind the server clock, so the two frames
  being blended have both already arrived. Late arrivals are inserted in order,
  extrapolation is brief and then holds position rather than flying a disconnected pilot
  off in a straight line forever.
- Delta encoding on state packets, with nothing sent at all when nothing changed.
- Reconnect with resume: a dropped slot is held for 90 seconds so a phone that loses signal
  in a tunnel comes back as itself. Retries back off exponentially to a 20 s ceiling.
- **ARIA instruments** — eleven tools that act on live game state rather than describing
  it. Plot a course, name the best market, target the belt, report threats, contracts,
  standing, the link. None of them spends money, sells cargo or fires a weapon, and the
  suite checks that running all of them moves no resource.
- Link section in the diagnostics panel: host, round trip, clock offset, buffer depth,
  traffic.
- `test/netsync.mjs` (49 checks), `test/tools.mjs` (55); `test/net.mjs` grew from 9 to 25.

### Changed
- Tools run *before* the model. A request that maps onto an instrument should use the
  instrument, not receive a well-phrased sentence that leaves the pilot to do the job.

### Fixed
- The belt instrument passed `setTarget` a ready-made descriptor, which wraps it a second
  time; the HUD then failed several frames later reading a position one level deeper than
  anything looks for it.
- The same instrument looked for belts in the body list. A belt is an orbital band, not an
  object, so it found nothing and confidently reported an empty system. It now builds the
  same synthetic mid-orbit contact the HUD builds.
- The host-handover test could pass without a handover, because the client had already
  received a `host` message from its own join.

### Compatibility
- Schema unchanged; v0.9 saves load with no migration.
- A v0.10 client against a v0.9 relay will relay positions but has no host, so NPCs stay
  private and nothing resumes. Update both ends.
- Combat between pilots still resolves on the shooter's client; shared *hostile* NPCs are
  what this patch delivers, not authoritative PvP.

## v0.9.0 — "Parallax" · 2026-07-31

**Slice 7 of 8 — Render & Presentation.** Save schema unchanged at 6. Slice 1's frame-time
buffer and `clock.alpha` finally do something.

### Added
- Adaptive quality: five levels driven by **p95 frame time, not average**, because the mean
  on a phone is nearly always fine and the 95th percentile is what a player feels. Drops
  fast (two levels at once past 38 ms), climbs slowly, waits after every change, and has a
  hysteresis band so a device on a boundary settles rather than flapping. The starting level
  is guessed from the device so a phone does not spend two seconds at Ultra working it out.
- Render interpolation using `clock.alpha`. On a 120 Hz screen the simulation only advances
  every other frame, so half the frames drawn were one step stale — a judder no frame-rate
  counter shows. The authoritative transform is restored immediately after rendering, so
  nothing downstream ever integrates against a smoothed position.
- Level of detail keyed on **screen size, not distance** — a gas giant far away is bigger on
  screen than a station close up, and the one that is bigger on screen is the one whose
  detail you can see. Four shells per planet sharing one material, three per moon, culling
  only for stations.
- An audio mix: four buses through a limiter, alerts that duck the rest rather than
  out-shouting them, positional sound with capped doppler and an earshot cutoff, and a
  generated music bed that glides between calm, work, tense and combat.
- Render and Audio tabs in settings.
- `test/render.mjs` (76 checks).

### Fixed
- `moodFor()` used `(S.player.lastHit || -99)`, so a hit at exactly time zero read as
  "never been hit" — reachable only in the first second of a flight, which is exactly the
  kind of bug that survives to release. The same falsy-zero pattern was found and fixed in
  `detection.js`, where an NPC firing at time zero would not have raised its signature.
- NPCs are now untracked from the interpolation list on death in both the combat path and
  the population-decay path; without it a long session accumulates dead references.

### Compatibility
- Schema unchanged; v0.8 saves load with no migration. Quality and mix levels ride along in
  `S.settings`; older saves get device-profiled defaults.
- The quality controller may lower resolution on a struggling device. The Render tab says
  which level is active and why; locking a level manually turns the controller off.

## v0.8.0 — "Legible" · 2026-07-31

**Slice 6 of 8 — Interface & Input.** Save schema unchanged at 6. Six slices of systems
had gone in without the interface being touched since v0.1.

### Added
- A HUD write budget. Every field diffs against a cache before touching the DOM, and bar
  widths quantise to 0.5% first so a regenerating shield does not force a write every
  frame. Measured: 0.35 writes per frame while flying against roughly 11.5 attempted
  before, a 96.9% skip rate. `LG.hudStats()` reports it live.
- Four threat palettes including deutan-safe, tritan-safe and high contrast, plus optional
  shape markers so colour is never the only cue. Every palette is a redefinition of the
  same CSS custom properties — no JavaScript branches on which is active.
- Text scale (85–160%, applied to the root so the whole interface scales) and reduced
  motion.
- Rebindable controls built on a named action table, and gamepad support that plugs into
  the same table. Sticks are proportional, the deadzone rescales rather than clamps, and
  one-shot buttons fire on the edge rather than the level.
- Settings and diagnostics overlay behind ⚙ — frame times, simulation steps, dropped
  catch-up, the HUD write budget, captured faults, and a restart for parked systems.
  `LG.report()` returns everything a bug report needs as one pasteable string.
- Crew fatigue (carried from 5b): accrues while a department works, sheds while it rests
  and much faster while docked, and scales output down to a floor rather than to zero.
- Warp draw from fitted core modules (carried from slice 2): the warp coil now costs 22%
  more to cruise with, and a new **flux damper** costs 34% less.
- `test/interface.mjs` (62 checks).

### Changed
- `controls.js` no longer knows which key does what; it asks the binding table for the
  action, which is what made the gamepad small to add.
- Reduced motion shortens transitions to 10 ms rather than removing them — an instant
  state change is its own kind of jarring.

### Fixed
- The mechanical rewrite of the HUD's `innerHTML` writes broke the contacts list with a
  regex that stopped at the first semicolon, which was inside an arrow function three
  lines down. Caught immediately by `static.mjs`, which is what that suite is for.

### Compatibility
- Schema unchanged; v0.7 saves load with no migration. Display settings and bindings live
  in `S.settings`, already persisted, so they ride along; older saves get the defaults.
- Balance: long-haul fits are worth revisiting, and a very long run without docking now
  produces measurably less than it used to.

## v0.7.0 — "Ledger" · 2026-07-31

**Slice 5b of 8 — Economy & Contracts.** Save schema **5 → 6**. Two balance changes worth
knowing about: existing fits may now be over budget, and prices swing on station stock.

### Added
- A generated contract board at every station — haul, supply, bounty and survey — with
  offers that expire whether or not you look at them. Gated on standing with the issuing
  bloc, priced by it, and paying into the skills from 0.6.
- Fitting budgets: power and CPU, independent of each other and both exceedable. Going
  over degrades progressively rather than refusing — power costs shields and recharge, CPU
  costs sensors and tracking — capped so an overloaded ship is always still flyable.
  Engineering rank raises both ceilings.
- Station supply chains: modules consume and produce against stockpiles, so a refinery
  that has run dry bids ore up and one choking on stock stops paying for it.
- Board tab in the dock, power/CPU fractions in the Refit screen.
- `test/economy.mjs` (85 checks).

### Changed
- Accepting a contract is a promise: a deadline, a slate capped at three, and a standing
  plus credit penalty on failure that is deliberately larger than a single completion pays.
  Refusing remains free.
- Commodity prices now respond to what a station actually holds, so the price book is
  information rather than noise.
- `recalcStats()` applies overload last, after every other bonus, because it degrades the
  result of a fit rather than any one module.

### Fixed
- The first cut of the fitting budgets could not be exceeded by any legal fit — the
  ceilings were derived from hull energy regen and came out well above the heaviest
  possible loadout. They are explicit per hull now and tuned against that measured worst
  case, because a budget the game cannot exceed is decoration.

### Deferred
- Crew posts and fatigue, and warp energy from fitted core modules, move to 0.8. Posting a
  crew member is only meaningful once there is something for them to be worse at, and that
  is a system with its own state — building half of it here would mean building the
  interface twice.

### Compatibility
- v0.2–v0.6 saves migrate forward and get a fresh board with no accepted work.
- A v0.7 save will not load in v0.6. Export first.
- Seed 1337 still generates the identical Solaris; contracts draw from their own stream.
- Multiplayer wire format unchanged — two pilots on one relay see the same offers.

## v0.6.0 — "Origins" · 2026-07-31

**Slice 5a of 8 — Character & Career.** Save schema **4 → 5**. "Your character" used to be
one string: which hull you had selected. It is now a person.

### Added
- Four-step character creation: lineage, corporation, career, agent. Every card shows the
  starting skills, standing shifts and credits it will produce while you are choosing.
- Four lineages — Core-born, Belt-born, Rim drifter, and the machine-descended Nexis
  defector. They set starting ranks and learning *affinities*, never flat bonuses, and the
  suite asserts none of them dominates another.
- Six corporations, two per lineage, each with standing, starting kit and one concrete perk.
- Five careers, one per hull class, each granting a hull, a weapon and one licence.
- Agents who greet you differently depending on what you are, and hand you a three-job
  chain that teaches the game without a tutorial existing.
- Two progression tracks: skills that rise from what you actually do, scaled by lineage
  affinity, and points earned per level that you spend wherever you like. They stack.
- Licences: your career grants one, and every other hull is unlocked later by a skill rank
  plus a fee that being over-qualified discounts.
- Pilot tab in the dock — sheet, current assignment, skills with rank progress, licence
  purchase.
- `test/character.mjs` (101 checks); `test/ui.mjs` now drives the whole creation flow.

### Changed
- Sensors rank cuts your own signature as well as extending your reach, so lineage,
  corporation and training all pull the same lever.
- Owning a hull and being licensed to fly it are separate things; `switchClass` enforces it.
- Repair cost respects the corporation discount.

### Fixed
- Nothing was broken — this is additive. The one hazard handled up front was the import
  cycle between `state.js` and `character.js`, resolved by registration rather than a
  static import in both directions.

### Compatibility
- v0.2–v0.5 saves migrate forward, keep everything, get licences for every hull they own,
  and are offered creation on next boot. Migration deliberately does not invent a pilot.
- A v0.6 save will not load in v0.5. Export first.
- Seed 1337 still generates the identical Solaris. Multiplayer wire format unchanged.

## v0.5.0 — "Standing" · 2026-07-31

**Slice 4 of 8 — World & Simulation.** Save schema **3 → 4**. The world now reacts to you
and survives you closing the tab.

### Added
- `systems/reputation.js` — three blocs (coalition, pirate, independent), -100..+100, moved
  by what you do. A coupling matrix means helping one costs you with its enemies, so there
  is no route to being everyone's friend. Standing gates docking, scales bounties and trade
  prices, and decides who shoots first: fall far enough and Coalition patrols hunt you using
  the same code they use on pirates.
- `systems/detection.js` — being seen is a contest between their sensor and your signature.
  Mass, throttle, firing and warping all raise it; a coasting empty hull is quietest.
  Sneaking past a picket is now a thing a pilot can choose to do.
- Population driven by economic pressure: raiders grow on undefended traffic and standing
  bastions, patrols are dispatched in response to raiders, and over-quota ships leave rather
  than accumulate. Bounded, and tuned so the resting roster lands where the old fixed counts
  put it (~62 against 63).
- Schema 4 persists reputation, construction sites and their progress, territory claims,
  stations you financed, and belt depletion.
- Signature readout on the flight-data panel.
- `test/world.mjs` (81 checks).

### Changed
- Kills move standing whether or not they carry a bounty, so shooting an unarmed belt miner
  now costs you with the independents. It always should have.
- Bounty payouts and trade prices scale with standing.
- `worldsim` moved onto a named RNG stream, and the suite checks a `population` draw cannot
  disturb it.

### Fixed
- Ambushes triggered on a fixed radius, so nothing a pilot could choose affected whether
  they sprang. They now run on the detection contest.
- The living world was rebuilt from scratch on every boot: bastions you destroyed came back
  and habitats you financed did not. It persists.

### Compatibility
- v0.2–v0.4 saves migrate forward, with default standings and a fresh world.
- A v0.5 save will not load in v0.4 — older builds correctly refuse a future schema. Export
  first if you need to move between builds.
- Seed 1337 still generates the identical Solaris. Multiplayer wire format unchanged.

## v0.4.0 — "Hardpoint" · 2026-07-31

**Slice 3 of 8 — Combat & Weapons.** Save schema unchanged at 3. A real balance change:
weapons now have damage types and range bands.

### Added
- Three damage types (kinetic / thermal / EM) against shield, armour and hull
  resistances. EM shreds shields, kinetic punches armour, thermal burns structure — and
  no type is strongest against everything, which the suite asserts directly.
- `systems/damage.js` — one resolver for the shield/armour/hull cascade, replacing three
  longhand copies. Disabling mercenary fire is now the same function with a hull floor.
- Range falloff: weapons carry `optimal` and `falloff`, judged at the muzzle against the
  lock. A scatter beam is no longer a sniper rifle.
- `systems/broadphase.js` — uniform spatial hash for collision candidates. 254 ms → 70 ms
  on 400 frames x 400 rounds x 63 ships. The narrow phase is unchanged and still decides
  every hit.
- Missiles carry their own lock, steer at an intercept point, and can lose the target
  outside the seeker cone — after which they fly on ballistically.
- Decoy buoys are real objects that pull seekers. The module previously did nothing at all.
- NPC engagement envelopes: brawler / skirmish / standoff, assigned per hull, so a drone
  and a bastion no longer want the same distance.
- Target drawer shows a hull's defence layer, what it is soft to, and what it resists.
- `test/combat.mjs` (66 checks), including a grid-vs-full-scan agreement check.

### Changed
- NPC hulls carry a damage type and an armour profile; NPC damage falls off past their
  own hold band, so holding the right range has a payoff beyond not being shot.
- Player weapons pass their damage type and their lock at launch.

### Fixed
- **Point defence never intercepted anything.** It was a dice roll inside `damagePlayer()`
  that discarded damage after the round had already arrived. Rounds are now shot down in
  flight, inside a real envelope, and each round is judged exactly once.
- **Missiles re-targeted mid-flight.** Guidance read the player's *current* lock every
  frame, so switching targets dragged rounds already in the air onto the new ship — and
  NPC missiles steered at the player's lock too.
- Broadphase cell keys were strings, allocating enough short-lived garbage to eat the
  win they provided; they are mixed 32-bit integers now, and the grid builds lazily so a
  frame with nothing in the air pays nothing.

### Compatibility
- Saves compatible in both directions with v0.2 and v0.3.
- Seed 1337 generates the identical Solaris; nothing here draws from the world RNG.
- Multiplayer wire format unchanged.

## v0.3.0 — "Deadwater" · 2026-07-31

**Slice 2 of 8 — Flight & Navigation.** Save schema unchanged at 3. This one changes how
the ship handles, so it is a balance change as well as a correctness one.

### Added
- `systems/navplan.js` — visibility-graph course planner searched with A*, replacing the
  greedy recursive router. Pure geometry: positions in, waypoints out, no game state.
- Flight assist split into two limited systems: RCS quads that null lateral drift and a
  retrograde main-engine burn, each capped against the hull's rated acceleration and
  scaled by available energy.
- Handling telemetry — `player.speed`, `player.drift`, `player.slip` — and a Drift row on
  the flight-data panel that goes amber when the RCS is out of authority.
- Progress watchdogs on both autopilots: a warp course that stops closing is re-plotted,
  then abandoned out loud; a stalled approach hands the stick back.
- Warp: cruise drain scales with loaded mass, incoming fire knocks back spool charge, and
  retargeting mid-cruise amends the course instead of dropping the drive.
- `test/flight.mjs` (44 checks) and a 20-seed planner sweep in `test/warp-nav.mjs`.

### Changed
- Turning now costs speed. Assist removes the sideways component of velocity rather than
  rotating the vector, so a hard course change bleeds momentum — and a damaged, loaded or
  flat-battery ship has measurably less authority to correct with.
- The speed cap distinguishes the engine sitting at terminal velocity (hard-clamped, so
  `maxSpeed` stays an invariant) from arriving over the cap out of warp (bleeds off).
- `test/core.mjs` version assertions are build-agnostic rather than pinned to 0.2.

### Fixed
- **Courses were being plotted through Solaris Prime.** Obstacles were ranked by distance
  to the corridor midpoint, so the candidate cap discarded the star in favour of small
  moons that happened to sit near the middle. Ranking is now by encroachment on the route.
- **A\* dropped the first waypoint of every route** — the parent chain was trimmed at the
  wrong end, removing the corner nearest the ship rather than the goal.
- **Every moon sat at the origin until the first frame.** `createSystem()` never seated
  them, so anything reading the world before the first `updateSystem()` — a course plan, a
  headless test, a save applied at boot — saw the whole moon population stacked on the star.
- Flight assist no longer rotates velocity for free: a cold, unpowered, zero-throttle ship
  used to curve to follow the nose, keeping all its speed.

### Compatibility
- Saves are compatible in both directions with v0.2.
- Seed 1337 still generates the identical Solaris; only the pre-first-frame moon snapshot
  differs, which nothing but the planner ever observed.
- Multiplayer wire format unchanged.

## v0.2.0 — "Foundation" · 2026-07-31

**Slice 1 of 8 — Core & Platform.** Save schema 2 → 3. No visible gameplay change;
this is the layer the remaining seven slices need in place first.

### Added
- `core/version.js` — build identity, save schema number, version comparison.
- `core/clock.js` — fixed-step simulation clock (1/60 s) with capped catch-up and a
  120-sample frame-time ring buffer. `LG.perf()` reports fps / avg / p95 / worst / stalls.
- `core/diagnostics.js` — frame-phase error guards, bounded fault log, automatic parking
  of a phase that fails repeatedly. `LG.diagnostics()`, `LG.unpark()`.
- Named deterministic RNG streams — `stream('npc')` — seeded from (world seed, name) and
  independent of draw order, so a new generator can never reshuffle an existing one.
- Save export / import as text (`LG.save.export()` / `LG.save.import()`), a rolling
  backup slot, and `LG.save.restore()`.
- `test/core.mjs` (55 checks) and `test/all.mjs`, the ordered suite runner.
- `package.json` with test scripts, `.gitignore`, `docs/SLICE_PLAN.md`.
- Build and save header shown on the boot card.

### Changed
- The frame loop simulates on a fixed step and renders once per frame, so flight,
  collision and warp behave identically at 30, 60 and 120 fps. HUD, nav map and autosave
  run per rendered frame rather than per simulation step.
- `systems/save.js` rewritten around an explicit schema with a migration chain. Payloads
  carry the build that wrote them; a newer schema is refused rather than half-applied.
- `core/config.js` gained `CLOCK` and `DIAG` tuning blocks.
- `core/state.js` tracks `playtime` across sessions.
- README: version banner, updated layout map, new debugging and verification sections.

### Fixed
- A corrupt save is quarantined to `<SAVE_KEY>.corrupt` and the backup loaded, instead of
  being silently discarded and replaced with a new game.
- An exception in any system no longer aborts the frame before `render()` — a fault costs
  that subsystem for one frame, not the session.
- The 50 ms frame clamp no longer silently drops simulation time; dropped catch-up is
  counted in `LG.perf().stalls`.
- Clock priming treated a timestamp of `0` as unset, charging the first frame after a
  reset a full step.

### Compatibility
- v0.1 saves migrate forward automatically.
- Seed 1337 generates the identical Solaris to v0.1.
- Multiplayer wire format unchanged; v0.1 and v0.2 clients interoperate.

## v0.1 — baseline

The game as first assembled: flight, combat, mining, trade, warp, station docking,
survey, crew, fitting, world simulation, the relay server, ARIA, and the headless
test harness. Unversioned in-tree; recorded here as the point this changelog starts.
