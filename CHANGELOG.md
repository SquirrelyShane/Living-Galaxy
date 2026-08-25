## 1.03.04 — same sky

The first two-device session found the deepest hole yet: **a resumed save kept its own
galaxy seed**, so two pilots on one server flew two different galaxies — same node
numbers, different skies — and "we don't show up for each other" had no visible cause.
Online, the server's galaxy is law now, all three generation inputs of it: a save made
in another galaxy is *relocated* (ship, hold and account kept; placement re-derived at
the server's home node; told in words), layout is forced procedural, and **density** is
a server setting carried in the welcome — it was an input to `generateSystem()`, so two
densities in one room meant two different worlds that agreed they were the same one.

And the galaxy stopped keeping secrets about who is in it: the welcome carries
**everyone** (name + system for every pilot online), joins, jumps and departures are
announced across systems (`who`/`gone` — a few bytes; rooms scope the heavy traffic,
never the knowledge), and the client says it in words: *"Bravo is flying in XK-412 —
find it on the chart."* Two friends in different systems now each know exactly where
the other is and how to close the distance.

Also in this slice: `docs/DOMAIN.md` — putting the galaxy on a real domain
(living-galaxy.com) with a Cloudflare Tunnel: no port forwarding, home IP never
published, real trusted certificate, WebSockets pass through, LAN players keep
galaxy.local. 70/70 green.

## 1.03.03 — hold the door

Two windows, both misbehaving on the Legion's first successful boot — and it WAS a
successful boot: the log showed certs issued, https/wss up, the beacon live. The player
just couldn't tell, because (1) the launcher printed the join address and closed itself
in the same instant — a double-clicked cmd window dies with its script, so the one
banner that matters now ends on a `pause` — and (2) the server window sat blank with a
scary title, because the launcher had redirected every word the server says into the log
file. The server now mirrors its own console to `--logfile` instead, so its window shows
the live words (who joined, where players connect) AND the file still exists for the
launcher's failure diagnostics. The suite asserts the mirror. 70/70 green.

(Also learned on the way: clicking inside a Windows console freezes it into "Select"
mode until Esc — the launcher's banner now says so.)

## 1.03.02 — papers in order

Found on the first real deployment — a Windows Legion with no Git Bash and no openssl —
and diagnosed from its own `galaxy-data`: the openssl cert script died **half-way**
(a `ca.key` with no `ca.crt`, a `server.key` with no `server.crt`, every error hidden by
its own `2>/dev/null`), and then the server crashed at boot because it checked for
`server.key` and read `server.crt`. The launcher window closed before the message could
be read. Three fixes, each aimed at the class rather than the instance:

**The galaxy signs its own papers.** `server/certs.js` — X.509, by hand, in pure Node: a
minimal DER encoder, ECDSA P-256, one self-signed certificate (CA:TRUE, serverAuth, SANs
for the beacon name + localhost + every LAN address). openssl and bash are no longer
needed anywhere, which restores the stdlib-only rule the cert script had quietly broken.
`ensureCerts()` runs at every boot: issues on first run, **reissues automatically** when
the address or name changed or the cert is corrupt or half-missing, sweeps the retired
openssl flow's leavings, and writes key+cert as an atomic pair so the crash state cannot
exist. `tools/make-certs.mjs` remains for names the server can't guess (VPN, other
subnet); the old `.sh` is a shim that calls it.

**Failures speak.** EADDRINUSE now prints "a galaxy is probably still running — stop it
or pass --port" instead of a stack trace; the launchers surface the server's own words
when readiness fails and name the two usual causes (a passphrase that doesn't match the
first run's; the port). Both launchers say plainly that the FIRST run's passphrase is
the vault's passphrase forever, and that deleting `galaxy-data/` is the reset (and what
it costs). `launch.cmd` also stops a stale galaxy before starting a new one (PowerShell
process match — no Git Bash required for that either).

New suite `certs` (22): the DER judged by node:crypto's X509Certificate (OpenSSL's own
parser), a real TLS handshake, and the exact Windows half-states — key without cert,
foreign leavings, rename, corruption — each of which must heal, never crash. 70/70
green. Schema unchanged.

## 1.03.01 — a name on the door

Nobody types an IP. The server grew an **mDNS beacon** (`server/beacon.js`): when any
device on the LAN asks "who is `galaxy.local`?", the beacon answers with the laptop's
addresses — the same multicast-DNS every OS already uses to find printers, so there is
nothing to install on player devices and nothing to change on the router. `--name=nexis`
renames the galaxy; the certificate script carries the name as a SAN; the beacon is a
convenience, never a dependency — refused port 5353 means a logged line and an IP
fallback, not a galaxy that fails to start. The responder is stdlib `dgram`; the DNS
packet maths is pure buffer functions, and the new `beacon` suite (15) beats on real
packet bytes plus a live QU-bit query so the assertion never depends on multicast working
inside a sandbox.

**`start.sh` is the launcher now.** It used to start a bare python http.server; the
galaxy server serves the game itself, so the script's job got smaller and better: certs
generated on first run, passphrase read without echo, server started, **readiness polled
against `/api/status`** (running is not answering — and a wrong vault passphrase is
caught and named), browser opened, and the one line players need printed: the name, not
the IP. SIGTERM on the way down so pilots are parked and the world's age is saved.
`launch.cmd` is the same flow for Windows, double-clickable. 69/69 green.

## 1.03.00 — somewhere to live

The galaxy has a home. `server.py` — the stdlib relay that fanned every packet to every
connection — is retired, and in its place is `server/` — a stdlib-only **Node** galaxy
server that serves the game, terminates the sockets, and owns everything durable inside an
encrypted vault. 68/68 green, three new suites. `docs/SERVER.md` is the operator's guide.

### The system is the shard

The relay was correct while every pilot shared one system and wrong the moment somebody
jumped. Now each occupied system is a **room**: your packets reach the pilots in the same
sky and nobody else, hits are addressed *and* room-checked (a hull two systems away cannot
be hurt by a packet, whatever the packet says), and jumping re-rooms you — the client
notices `S.galaxy.node` changed and tells the server, whoever caused the change. An empty
system costs nothing, which is the only way millions of systems stay affordable: the data
grows with what players *did*, never with what exists.

Host election survives, but **per room**, and with tenure: the longest-connected member
simulates the NPCs for that room, and a sitting host is never unseated by an arrival —
found by the suite, which watched a senior pilot jump in and silently yank authority from
the client mid-simulation. Every handover is a moment nobody is simulating; arrivals are
common and departures are rare, so the seat changes hands on departure only.

### The vault

Everything durable — accounts, wallets, world deltas, the galaxy's own age — is sealed
with AES-256-GCM under a scrypt-stretched passphrase, written atomically (tmp + rename),
and refused loudly on a wrong passphrase *before* anything can be written under a second
key. GCM because the auth tag makes tampering loud: a flipped byte in a wallet file is a
rejected record, not a quietly different balance. The suite greps the raw files for every
secret it stored and fails if anything legible rests on disk. In transit,
`tools/make-certs.sh` builds a local CA once and the same port speaks https/wss after.

### Accounts, and a wallet the client cannot set

A callsign with a passphrase is an account, created on first use — registration is
idempotent and the passphrase decides everything after that. It carries a **wallet**:
credits banked with the galaxy, surviving a wiped browser or a different device, and no
message from any client ever *sets* a balance — they ask the ledger to move it and the
ledger answers. Guests still fly; the galaxy just forgets them. Resume tokens grew up the
same way: the old `id-timestamp` string was guessable in one loop, and a slot can be
attached to money now, so tokens are HMAC-signed expiring tickets — stateless to verify,
unforgeable without the server secret, held fifteen minutes.

### Persistent world deltas

Per system, the vault keeps a small list of ways the world differs from its seed — written
by the room's host, replayed to every arrival, latest value per key, capped. The mechanism
is deliberately generic: the server never learns what a wreck or a claim *is*, so game
systems can start persisting one key at a time without a protocol change. Same trick as
the reasoner emitting directives, not actions.

Also: the server serves the build itself (one origin, no mixed-content fight), `/api/status`
reports occupancy and motion-guard suspects, a kinematic guard counts impossible position
reports (warp declares itself; a GC pause is innocent, a teleport is not), and the world's
age accumulates across restarts. New suites: `vault` (54 — crypto, wire codec, tickets,
rooms, motion), `galaxy-server` (13 — durability across a kill, wrong-passphrase refusal),
and `net` rewritten against the real server (36). Schema unchanged — nothing about a save
moved.

## 1.02.62 — open a channel

Two autopilot bugs with the same root, a warp button that is now a decision, dialogue with
the things you fly at, and standing orders for the idle layer. 66/66 green, one new suite.

### She looped until you touched the stick

Both halves of that were real and they were different bugs.

**Nothing remembered a failure.** The stall watchdog said *"that is not working, trying
something else"* and handed control to a planner with no memory of what had just failed —
which picked the same task, with the same target, and stalled again. There is now a ledger:
two goes at the same task-and-target and it is benched for four minutes, and a plan that
finds nothing three times running **hands the stick back and says why**. An autopilot that
cannot find anything to do should be off, not circling.

**Phases owned things and never let go.** `enter()` set two fields; an approach started for a
rock was still steering while the next phase tried to dock, a held trigger outlived the fight
it belonged to, and a docking that completed left her waiting in `berth` for an event that
had already happened. Each phase now declares what it may own and the transition tears down
the rest, and an orphan sweep every frame catches state and phase disagreeing — standing on a
pad while the phase says `travel` is a ship waiting for something that is never coming.

### She still would not warp

The v1.02.61 fix — an absolute distance instead of the sensor array — was necessary and not
sufficient. The threshold said *warp*; the core then said *no*, **silently**, and the caller
fell through to the sublight approach with nothing logged. From the cockpit that is
indistinguishable from an autopilot that never considered it.

The commonest `no` is the one you hit every single time: **stations orbit planets**, so a ship
anywhere in the inner system is inside a gravity well, and the core will not hold in one. That
is not a refusal — it is a precondition that has to be *flown out of*, and nothing was flying
it. `spoolTo()` returns a reason now instead of a boolean, and a well gets its own phase:
burn to the edge, ask again, spool.

### The warp button is a menu

- **WARP TO** — arrive alongside. `WARP.closeArrive` is a few kilometres off the hull.
- **WARP WITHIN** — a slider, 150 km to 1 Mm, for when arriving on top of an unidentified
  contact is exactly what you do not want.
- **Open a channel** — because "get near that thing" and "talk to that thing" are the same
  intention at two ranges, and two taps apart is how a player never uses the second one.

Arrival distance was `WARP.arriveRadius` — 240 units, unconditionally, for everything. That
floor exists to keep you out of a gravity well and **a station has none**, so every berthing
jump stopped 240 km short and left the last leg to a quarter-throttle crawl. Three inputs now,
largest wins: what you asked for, the destination's own well, and the old floor for things
that have one. You cannot ask to arrive six kilometres from a star.

### Contact dialogue

Hailing printed one line and a docking button. Now it opens a channel with three doors, and
which are open depends on what the other side thinks of you:

- **Conversation** — introductions, and first contact is its own branch because meeting
  somebody for the first time and the fifth are different conversations.
- **Persuasion** — the branch that can *fail*. The odds are printed on the button, they move
  with Commerce and standing, losing costs standing, and the roll is seeded so reloading
  cannot reroll it. A negotiation you always win is a cutscene.
- **Station services** — transponder, cargo scan, record, as three separable checks. "We do
  not deal with your bloc" and "you are carrying salvage stripped off one of ours" are
  different problems with different remedies, and a single yes/no threw that away.
  Contraband is **relative to the berth's bloc** — salvage is evidence at a Coalition port
  and merchandise at an Outer one.

**War** is pushed to the front when they already want you dead: stand down, pay tribute
(priced off what they can see in your hold), threaten, or open fire.

### Standing orders — the idle layer takes direction

The needs model knows what the ship *needs*. It never knew what the **player** wants, so two
identical hulls in identical systems behaved identically whatever their owners were trying to
do. Eight doctrines — Prospecting, Commercial, Letters of Marque, Bounty Work, Reclamation,
Works, Station Keeping, Balanced — each a set of weights over the scorer, not a script. A war
doctrine still sells a full hold and still repairs; it just never chooses to go and fill one.

Asked once, the first time you ever hand her the ship, then a chip under the switch.

### Frames

Feminine, masculine, androgynous, synthetic — presentation and pronoun, on the first step of
creation next to the callsign. **No frame carries a stat**, and the suite asserts it: tying
capability to gender would be both offensive and mechanically dull, and the one frame that
legitimately differs is already the Forged lineage, which is a choice about what you *are*.

### Also

- `test/parley.mjs` (86) — the corpus, the doors, the odds, the scan, arrival distance,
  doctrines and frames.
- `test/autopilot.mjs` is up to 106, including an empty sky she is expected to *stop* in.
- `orphanSweep` clears a beam and a trigger in one pass, not one per frame.

## 1.02.61 — alongside

Two things that made ARIA look stupid, and one half-reset found on the way. 65/65 green.

### She docked from two hundred and fifty kilometres away

`DOCK.range` was 280 units of distance to the station's **centre**. A berth ring is thirty to
fifty units across, so the pad opened while the station was still a dot on the canopy — and
the approach autopilot parked at `1.6 × radius + 500 m`, which for a thirty-unit hull is
eighteen kilometres *outside* that. The two numbers had never been compared.

Docking is now measured from the hull: `DOCK.reach = 0.5` units — five hundred metres of gap,
and it means the same thing at every berth size, which a single centre-distance number cannot.
The approach standoff came in to match (`stationStandoff: 1.0`, `hailMeters: 300`), so an
approach now *finishes* at a berth instead of stopping near one, and ARIA calls for a slot at
1.2 km rather than opening the conversation from two hundred kilometres out.

`test/autopilot.mjs` asserts the two against each other — an approach must end inside the
docking reach — rather than asserting either number, because the bug was the relationship.

### She flew across the system at a quarter throttle

The warp threshold was `sensor × 1.4` — "past what we can see" — which sounds principled and
decides the wrong thing. When scanning tiers landed in v1.02.57 the array shrank, so a
low-tier hull concluded a fifteen-thousand-unit crossing was near and sublighted the whole
thing. What matters is whether the crossing is worth a spool, and that is a property of the
distance. `AUTOPILOT.warpBeyond = 3000`, asked at plan time **and every frame in transit** —
the core is often on cooldown at the one moment she used to ask.

### She docked to buy things she could not afford, then did it again

The loop, exactly: hull at 40%, eight hundred credits, score a berth, walk a checklist where
every line is a purchase, undock — and because nothing about the hull had changed, score the
same berth again.

Three parts to the fix:

- **`broke` is a fact.** So is `repair.cost` and `repair.affordable`. "The hull needs work" and
  "we can pay to have it worked on" are two different things and the tree only knew the first.
- **The score is gated on affordability.** Repairs and rounds are things you buy; selling and
  delivering are the two lines that pay *us*, so those still count on an empty account.
- **A fruitless pad visit is remembered.** `AUTOPILOT.padCooldown` — nothing bought, nothing
  signed, servicing is off the menu for four minutes unless there is now cargo to sell.

And somewhere to go instead: three `quiet.broke.*` nodes that route to cutting rock, hunting
something with a price on it, or reading a board for paid work — in that order, by what is
actually in range.

### She can pull the trigger

Hunting is a real task now, which means ARIA fires weapons. Deliberately the *only* new
capability: she flies the ordinary approach, which points the nose at the target, and shoots
when the range is right. She will not start a fight below 55% hull, breaks off below 44%, and
`holdFire` from the reasoner outranks all of it — a tree that has concluded the bank cannot
feed this rack stops the shooting without stopping the flying.

Every assertion in that block is about her *stopping*: off the trigger on a dead target, off
it when the stick goes back, off it when a finger lands on the controls.

### Also

- **`resetSweep()` was a reset-shaped delay.** It cleared its own cache and left `contacts()`
  — which keeps its own tenth-of-a-second cache — holding the old world. Every reset in the
  game happens while game time is not advancing, which is precisely when that cache is warm,
  so a sweep taken straight after a jump or a load was built from the system you just left.
  Found by a test that cleared the NPC list and was still shown a hostile.
- `repairQuote()` moved to `systems/trade/pricing.js`. A price reads state and config and
  returns a number; it does not need the shop behind it, and importing `economy.js` from the
  fact table put ARIA's reasoning inside the trade/contract/character knot.

## 1.02.60 — everything she can reach

ARIA gets a nervous system: a tactical picture, a fact table, a decision tree that can be
argued with, and a panel for when she thinks the ship needs something you have not bought.
The hull gets solar arrays and a farm. The crew get voices. 65/65 suites green, two new.

### AP OFF is a sequence too

The handoff overlay ran one way. Flipping the switch back just stopped it, which was the one
moment the whole animation existed to dramatise. `ui/conn.js` is bidirectional now — the same
node graph, run at `CONN.releasePace`, opening with every system bound and letting go of them
one at a time, and it aborts cleanly if the switch flips again mid-retraction.

### systems/npc/sweep.js — one tactical picture

Ten classes over the existing contact walk: hostile, threatened, friendly, ours, neutral,
berth, body, field, wreck, site. It carries the numbers a decision actually turns on — total
weighted threat, how many can *reach* you, how many are closing, seconds to contact, whether
anything has a lock, whether we are outnumbered — and the closing rate is a real derivative
rather than a guess, which is the only stateful thing in the file.

Wrecks are enumerated separately because they are not contacts. They are places, and "is
there anything here worth stopping for" is a question the contact list was never asked.

### systems/npc/facts.js — every number, named once

Sixty-eight readings behind names like `weapon.sustain` and `heat.seconds`, so a rule can be
data. Two of them nothing in the game had ever computed:

- **`weapon.sustain`** — seconds of continuous fire before the *bank* gives out, accounting
  for regen. A fit that out-drains its own reactor sustains four seconds; one that does not
  sustains forever. Those are completely different ships regardless of paper DPS.
- **`heat.seconds`** — seconds before the thermal cutout trips, which is the same question
  asked of the radiators instead of the reactor.

Percentages are 0–100 throughout, because rules are written by hand and read by people.

### systems/npc/reasoner.js — the tree

Thirty-eight nodes. Each carries a list of comparisons against named facts and either a
branch of children or a set of directives; evaluation walks depth-first, takes the first
child whose conditions hold, and accumulates directives on the way down. Comparators are
`>` `>=` `<` `<=` `==` `!=` `between`, and that is the entire language — the moment a rule
needs arbitrary code it stops being inspectable, and inspectable is the whole point.

**The trace is the product.** Every comparison that fires is recorded with the value it saw,
so a decision comes back as *"disengage — because weapon.sustain was 4.1 s (< 6) and hull.pct
was 52 (<= 60)"*. Ask ARIA what she is doing and that is the sentence she reads back. An
assistant that can be argued with is worth ten that cannot.

It emits **directives**, not actions: posture, task, holdFire, vent, throttleCap,
deployPanels, stowPanels, advise. `autopilot.js` decides what to do about them, which is what
lets the whole thing be evaluated a hundred times in a test with no world under it.

`scoreTasks()` was not deleted. The tree decides *what kind of thing to do*; the scorer still
decides *which berth, which rock, which consignment*. They are not rivals.

### systems/npc/advisor.js — when she wants you to buy something

Eight cases — weapons, ammunition, power, heat, sensors, cargo, galley, hull — each reading
live numbers and offering options from both the module and weapon catalogues, priced against
what is spare after `ADVISOR.reserve`. Raised at most once every seven minutes per case, and
never at all while something is inside weapons reach.

It does not spend anything. It makes the case and hands off to the fitting bay.

### Solar arrays, and the bar in the middle

Deployed, the arrays fill the bank from the star for nothing. Deployed, the ship cannot move
at all. The deployment bar — 0.00% to 100.00%, two decimals, because you are watching it to
know when you can leave — is the mechanic: there is a window where you have committed and
cannot yet go, and everything interesting happens in that window.

The lock is enforced, not advertised. `throttleLocked()` is read by the flight model, the
throttle control refuses with a reason rather than springing back, and `canWarp()` returns a
named refusal — one gate, so the key, the autopilot, the course planner and ARIA all get the
same answer.

### Hydroponics that feed the crew you already have

Beds turn water and power into `BIO-008` — the same provisions `crew.js` has always drawn
every game hour. The farm does not invent a second food economy; it produces into the one
that exists, so the surplus is ordinary material: sellable, craftable, tradeable. Below a
certain number of beds you are topping up at stations forever; above it the ship feeds itself
and can stay out indefinitely.

### data/crew-dialogue.js — 312 lines, and a ship that sounds crewed

The crew were a spreadsheet. Seven roles, twelve traits, a morale number, and no way to tell
from anything they ever said that they minded.

Lines are filed by **situation × post × trait × mood**, narrowest first: a Veteran gunner in
a bad week does not say what a Green quartermaster says. Twenty of them are **exchanges** —
an opener and an answer from a different department — which only fire when the ship actually
carries both posts, so a two-hander is something you earn by hiring.

The driver is a rate limiter with a corpus attached, and every line is *caused* by something:
the hold filled, the arrays went out, the galley got thin, somebody got hurt. `quiet` has the
longest gap in the table because a radio that talks when nothing has happened is a radio the
player learns to stop hearing.

Two rules the suite enforces: no line quotes a figure (a number in dialogue goes stale the
moment the balance changes), and the situation order can never place a calmer situation above
a more urgent one — which caught an announced casualty ranking below a thin galley.

### Also

- `test/reasoner.mjs` (114) asserts every fact every rule mentions **exists**. A missing fact
  reads `null`, compares false and never fires, so a typo would otherwise be a rule that
  quietly does nothing forever.
- `test/crew-talk.mjs` (48) checks the corpus structurally — every post key a real post,
  every trait key a real trait — and beats on the rate limiter.
- `heatsink` and `capbank` modules; `solararray` and `hydrobed` to fit.
- `U` toggles the arrays. ARIA answers to "arrays out", "stow the panels", "sweep",
  "how are the stores" and "why are you doing that".
- Three inert config keys removed, one (`warnDays`) given the three readers it was written
  for.

## 1.02.52 — the shape

A structural pass. No gameplay change. 58/58 suites green, one new.

### Two buttons called CHART

The command deck had `exec-chart` and `exec-chart2`, side by side, both labelled CHART. One
opened the system chart and one the galaxy; the markup gave no way to tell which, and the
comment on the second described the contract board — a paste from the line below that nobody
caught, because a comment cannot fail a test. Now GALAXY, with `test/chart.mjs` asserting no
two deck buttons share a label.

### Three ports, and the inversions they end

**35 files under `systems/` imported `ui/toast.js`.** Thirty-five arrows from the simulation up
into the interface. It cost real things: every system needed a DOM to run, a headless consumer
had no way to receive a notice, and the dependency graph said something untrue about what the
logic depends on.

- `core/notify.js` — `toast()` and `status()` as a port. `ui/toast.js` registers the sink.
- `core/screens.js` — `systems/flight/approach.js` imported `openDock` to open the dock after
  a tractor pull. Now `requestScreen('dock')`.
- `core/spawn.js` — four systems imported entity constructors. `entities/` sits *above*
  `systems/` (an NPC imports thirteen systems, because an actor uses the rules), so those were
  upward too. Now `spawn('npc', …)`.

All three are silent no-ops with nothing registered, which is what makes a headless run work.
Registration is an explicit boot step, **not** an import side effect: nothing under `systems/`
imports `entities/` any more, so a factory registered at module scope is silently absent
wherever that module was not loaded — which is exactly what happened to `test/boardroom.mjs`
the moment the port landed.

`systems → ui` is now **zero**.

### systems/ was 64 loose files

A flat directory that size has no obvious home for the next one, which is how a junk drawer
forms. Grouped into eight domains — `flight combat trade company crew industry npc platform` —
with every import rewritten. Loose files at the top level: 0.

`systems/quality.js` moved to `world/quality.js`. It reads `world/scene.js` and is a render
setting, not a rule; being filed under systems made three `world → systems` inversions that
vanished when it moved.

### config.js was 1,727 lines

The most-imported file in the project, which made it the place every tuning value went and no
place in particular. Split into twelve files under `core/config/` mirroring the systems
domains, so a number that tunes `systems/combat/` lives in `config/combat.js`.

`core/config.js` re-exports all twelve — a 1,727-line module is not improved by making four
hundred call sites edit their import line. Verified export-by-export: 91 before, 91 after,
none missing, none duplicated.

### test/architecture.mjs — 22 assertions

Every other suite checks what the code does. This one checks how it is arranged, because
arrangement decays without anybody deciding to decay it. Nobody writes an inversion on purpose;
they need a toast in a system file, the import is one line, and eighteen months later
thirty-five files depend on the interface.

It asserts: dependency direction downhill only; the ports import nothing; both are wired at
boot; no module past 1,600 lines; `systems/` has no loose files; config is split; and the
import-cycle count is **17, with a budget of 17 and no slack** — a budget with headroom
silently absorbs the next three.

Seven upward edges are correct and stay, listed in `EXCEPTIONS` with a reason each — the world
catalogue reading `surfaceState()` so there is one definition of a surface state, `genesis.js`
reading `wellRadius()` so the generator and the warp rules cannot disagree. The list is
asserted **accurate**: an entry whose import is gone fails the suite, so it cannot rot into a
permanent excuse. Same discipline `test/reachability.mjs` applies to its backlog.

### UPGRADING.md

Every extension seam with a worked example: world class, mission template, landmark kind,
battle kind, ship silhouette, NPC topic, grammar frame, tuning block, screen. Plus a table of
what fails the suite and why, and the rule behind most of it — *where two numbers have to
agree, derive one from the other*, which is what every catalogue in this project is doing.

### Fixed on the way

- `test/reachability.mjs` read config from one file and config is a directory now, so every key
  on its inert list looked as though something had started reading it.
- `spawn()` returning null was unguarded in `worldsim.js`. A claim is now recorded whether or
  not there is a renderer to put a hull in — who holds territory is a fact about the world.


## 1.02.51 — the board, the radio, and a black galaxy

Three things the player could see were wrong. 57/57 suites green, two new.

### The galaxy chart drew black

Not a failure to draw. It was drawing all 50,000 stars **at 0.027 of a pixel each**.

`gl_PointSize = aSize.x * (300.0 / depth)`, where 300 is the distance at which a point
renders at its authored size. Correct for combat sparks a few hundred units out; wrong by
three orders of magnitude for a chart whose camera sits 78,000 units off a 52,000-ly disc.
`chartStarSize: 7` became 0.027 px, the core bulge 0.18, the dust haze 0.46.

Tapping still selected systems because picking is CPU-side projection and never asks the
GPU anything — a black screen with a live selection panel.

The reference distance is a uniform now and each scene declares its own. `tools/shader-check.html`
could never have caught it: the GLSL was valid. `test/render.mjs` gained eight assertions
that compute the actual pixel size, because arithmetic is the only thing that catches this.

### The mission board had four jobs

`bounty` said "Raiders in the lanes. Destroy them; the board does not care where." `survey`
said "Resolve detail on bodies nobody has bothered to look at properly." Neither named a
place, because neither could ask what places existed. Four templates, four offers per
station: you saw the whole board in two minutes.

Meanwhile a system knew 45 landmarks — ten planets carrying 24 fields each after the world
catalogue, ten stations, three belts, twenty Lagrange points — and the board read none of it.

**`world/landmarks.js`** returns every place in one uniform shape, tagged with what is true
about it (`volatile`, `uncharted`, `hazardous`, `wreckage`, `crewed`). **`data/missions/templates.js`**
holds 18 templates, each declaring the tags it needs. A template whose requirement no
landmark satisfies is never offered — the world catalogue's rule applied to work. Title and
brief are functions of the resolved place, so the *place* carries the variety.

### Graveyards, and a verb for them

Every system now has one to four **debris fields**, derived from the seed the way
`lagrange.js` derives anomalies. A siege sits off a station because that is what was
besieged; a claim war sits in a belt; a lost expedition is out past everything. Site first,
battle kind second, from only those kinds whose declared envelope the site satisfies.

Belligerents come from `relationOf()`, so a field corroborates the corp war the board
already pays into. Ages are log-distributed — recent fights common, ancient ones rare.

`systems/salvage.js` adds **search**: a field holds a finite amount, yields less each sweep,
and is then genuinely picked over. Neither a belt (inexhaustible) nor an anomaly (one-shot).
Relics are weighted against what is left, so they are at the *bottom* of a field — working
one to exhaustion is a real bet. A save stores one number per worked field; everything else
is derived.

### Board fixes the suite forced

- **The verb decides the type.** Templates named a verb while `type` was still the old
  weighted draw, so a "haul" with no commodity reached `sell()` and threw. The expensive
  version was a delivery that never loads its cargo and completes for free.
- **`isConsignment()`** — one predicate, six call sites. `type === 'haul'` could no longer
  answer it.
- **Pay is computed on read**, not baked at generation — the same argument the file already
  made for `locked`. An offer sitting on a board while you earn standing has to improve.
- **A board is a function of station and epoch**, not of call order. Two clients handed the
  same seed now agree about what is posted.
- **Boards backfill on accept** instead of draining until the next refresh.
- **No desk posts the same job twice**, and a board that runs out of distinct jobs is
  honestly shorter rather than padded with a repeat.
- **Freight is guaranteed system-wide, not per-station** — a refinery does not hire couriers,
  and forcing it to would flatten the per-power charter v1.02.39 built.
- **`salvage` is deliberately absent from `CONTRACT_WORK`.** `test/boardroom.mjs` rejected
  the obvious wiring: `extract` writes tonnage, not sweeps, so a fleet hull would have flown
  to a graveyard, mined it like a rock, and reported against a counter nothing increments.

### The radio spoke nonsense

Nine sentences the game actually said:

```
Is I having a can?                              There is 2 contacts on the lane.
There is you a favour.                          I am owing you a favour.
There is buy me something at the next berth.    Copy that. I will keep.
You a favour.                                   the better than posted seam
Watch on the board — the independent has form.
```

Nine bugs, one cause. A frame declared *which* slots it needed and nothing about what kind
of thing belonged in them, so `object` could hold a noun phrase, a finite clause, a bare
complement or an imperative — and `inform-existential`, which renders "There is ${object}",
accepted all four.

**Slots carry a type now** — `np`, `clause`, `imp`, `comp`, `adv`, `proper` — riding on a
String subclass so every existing interpolation kept working. Frames declare what they take.
The realiser filters on both. A clause in an existential is unrepresentable rather than
unlikely, which is the world catalogue's rule applied to grammar.

Individually fixed along the way: polar questions agree in every person (`Am I` / `Are you` /
`Is X` / `Are 2 contacts`); `have` asks with the perfect (`Have you got a hold?`) because
"Are you having a hold?" asks about an experience; existential number is read off the noun
phrase instead of a `count` field no topic ever set; stative verbs refuse progressive and
perfect; `commitPhrase()` keeps a transitive verb from standing alone; `isAttributive()`
keeps predicate phrases out of attributive position; and `described()` takes an `avoid` list
so a subject and object cannot both draw "rock".

One was wrong at the source rather than in the realiser: `haulOffer`'s reply sent
`subject: 'I', person: 1` and was asking about *itself*. Fixing the frame made it
grammatical and left it asking the wrong ship.

`test/grammar.mjs` — 79 assertions. The first half asserts each of those nine categories is
now unreachable; the second sweeps 336 lines across every topic for doubled articles,
stranded punctuation, unresolved tokens and fragments.


## 1.02.49 — the forges

Two generators migrated in, one module reaped, one visibility bug fixed. 55/55 suites green,
plus two new ones. `GENESIS_VERSION` moves to 3: every world in every seed changes.

### Stations stopped hanging in the sky

You could sit at the edge of a system and watch a habitat ring rotate. The LOD culler was
not broken and nothing was miscomputed — a ring is 96 units across, so at 12,000 units it
still covers 1.2% of the screen, well above the 0.15% cull threshold. Screen size was simply
the wrong question to ask about a built object.

`HIDE.range` is a fourth reason in `world/visibility.js`, and `RENDER_RANGE` in config says
how far each class of thing is drawn at all: 900 units for a station, 2,600 for a ship.
Planets are deliberately absent — a gas giant IS visible across a system, and the culler
already handles the distant ones by size, which for a natural body is the honest measure.

Visual only. Contacts, scanner, target list and nav chart still report a station at any
distance; hiding the mesh does not hide the object. Folding this into the LOD thresholds
instead would have meant raising the cull far enough to take every distant *ship* with it.

### Station Forge reaped

`world/station-forge.js` (1,474 lines) and `test/forge.mjs` are gone, along with eight
entries in `test/reachability.mjs`'s BACKLOG that had described an editor with no panel for
eight patch levels. The backlog is asserted accurate, so it could not simply be abandoned.

### System Forge — classification by condition

`genesis.js` used to pick a planet's kind with a weighted draw from a flat list keyed on an
orbit band. Nothing connected the name to the physics, so an ice world could land in an
inferno orbit and the only thing wrong with it was that a human would notice.

The generator now decides only what it is entitled to decide — **where a world is and how
heavy it is** — and the classifier derives what that makes it. A class is selected only from
classes whose declared envelope contains the body's computed insolation, mass, temperature
and volatile inventory. A frozen world in an inferno orbit is not unlikely; it is
*unrepresentable*.

Ported into `data/worldgen/`, byte-identical to their source so a future re-import is a copy
rather than a merge:
- 49 world classes with real bands for insolation, mass, density, albedo and volatiles
- 33 atmosphere archetypes, mean molar mass **derived** from composition and used for
  Jeans-escape retention
- 112 ores and minerals, each with a formation temperature band and host types, so
  composition follows the condensation sequence
- 19 asteroid, 11 comet and 9 remnant classes

`world/taxonomy.js` is the classifier, `world/stellar.js` the lifecycle, `world/zones.js` the
radial layout. LG's opinions about the catalogue live in exactly one file,
`data/worldgen/render-map.js`, which joins 49 physical classes to the 20 render types
`PLANET_TYPES` defines. Its completeness is asserted, so a new class cannot arrive unmapped.

### core/units.js — two constants, everything else derived

The bridge. One mass unit is one Earth mass, so the catalogue's bands read as authored.
**9,000 world units is one AU** — and that one is forced, not chosen: `genesis.js` has always
placed the habitable zone at `9000 * sqrt(lum)`, and `habitableZone()` puts it at
`0.95..1.37 * sqrt(lum)` AU. Any other value would give the game two disagreeing opinions
about where liquid water sits.

The test that matters: one Earth mass at Earth density reproduces Earth's radius, gravity,
escape velocity and 255 K equilibrium temperature to within a percent, and a 1-Earth-mass
world at 9,000 units from a sun-like star classifies as an **Ocean World at 288 K with a
nitrogen-oxygen atmosphere**.

### Deep time

Stars carry an age, drawn as a fraction of their own main-sequence lifetime rather than in
absolute years — those lifetimes span four orders of magnitude, and drawing absolute years
would make every massive star in the galaxy a corpse. `cls.lum` is now the *zero-age*
luminosity and `initStar` rolls it forward, writing the evolved value back into `star.lum` so
every existing consumer picks it up without learning a new field.

This is what stops two G-type systems from being the same place. A main-sequence star
brightens ~40% across its life, so a young yellow dwarf's habitable zone sits meaningfully
further in than an old one's.

`world/epoch.js` steps evolution in years: the star, then adiabatic orbit expansion
(a ∝ 1/M, expressed as a change to the orbit rather than a force, which is what makes a
million-year step safe to take in one jump), then engulfment, then surfaces, then classes.
Nothing calls it on a frame.

**Volatile loss is one-way.** Ablated volatiles go to space and the reservoir cap comes down
with the inventory, so a world cooked during the red-giant phase does not become an ocean
again when the star settles into a white dwarf. That asymmetry is the reason a dying system
is legible rather than looking like it simply cooled. It is asserted directly, because the
easiest way to break it is a well-meaning clamp into a class's declared band that silently
*raises* an inventory.

### Ship Forge — hulls instead of a cone

`entities/shipmesh.js` was 37 lines: a cone, two boxes, and five colours keyed by career.
Every hull in the galaxy was that cone, and tint was the only thing carrying the difference.

`entities/shipforge.js` lofts a ring along a per-category silhouette and hangs the category's
kit on the result at real surface positions — containers on a freighter's dorsal spine,
turrets on a warship's flanks, a habitation ring on a liner, cargo cages and a ram on a
slaver. Eight categories. Stats are measured off the geometry that was actually built.

`shipmesh.js` is now the seam and holds three LG opinions and nothing else: which silhouettes
a career may present as, which of them a *player* may fly (`slavers` is met, never issued),
and which way the nose points (the forge builds +Z for `lookAt`; the chase cam wants the
other, and that flip lives in one place).

**Variety is bounded on purpose.** Sixty-seven hulls each minting their own geometry and
material was a fault fixed long ago — sixty-seven GPU uploads, no batching. A unique
procedural hull per ship walks straight back into it. So `HULL_KIND` in `npcs.js` gives each
type a small fixed number of hulls, minted once and shared, and each ship picks one from its
own name: four raider silhouettes across eighteen raiders reads as a fleet with different
ships in it; eighteen reads the same and costs four times as much.

Hulls are deterministic on identity — a raider rebuilt after a jump comes back the same ship.

### Two new suites, and a harness that can reach them

`test/worldgen.mjs` (52 assertions) and `test/shipforge.mjs` (25). Almost every world-gen
assertion sweeps thousands of generated worlds and asserts a count is exactly **zero**,
because "rare" is the answer the old generator gave and it is the wrong shape of answer:
6,000 inferno orbits with no frozen world, 8,000 worlds all inside their own class band,
4,000 all computing a surface their class allows.

`test/stub.mjs` gained `Float32BufferAttribute`, `CircleGeometry`, `EdgesGeometry`,
`LineBasicMaterial`, `BufferGeometry.setIndex` and `Object3D.clone()`. The clone matters:
real three.js shares geometry and material by reference and copies only the transform tree,
and a stub that deep-copied would test a different sharing model than the browser runs.


## 1.02.48 — structural cut

Housekeeping pass. No gameplay change; 54/54 suites green before and after.

**Removed**
- `src/ai/worker.js` and the `src/ai/` folder — a superseded transformers.js worker
  replaced by `src/npc-avatar/llm/worker.js`. Nothing imported it and no suite covered it.
- `docs/Space_RPG_Crafting_Database-3.json` (448 KB) — the authoring source for the
  crafting catalogue, already fully projected into `src/data/crafting/*.js`. Archive it
  outside the repo; `derived.js` still records its identity in `CATALOGUE_META`.
- `docs/dossier-prototype.html` — superseded by `src/ui/dossier.js` + `css/dossier.css`.
- `living-galaxy-http.log` — a runtime artifact that had been committed.
- `src/data/crafting/README.md` — folded into the `derived.js` and `index.js` headers.
- `.ai-row` rules in `css/overlays.css` — orphaned with the old AI panel.

**One data layer, not three**
`src/data` had flat files, folders-with-barrels, and a folder holding one file. Now every
domain that has more than one file is a folder, and every folder is one level deep:
- `data/planets.js` → `data/planetary/planets.js`
- `data/moons.js` → `data/planetary/moons.js`
- `data/planetary/branches/index.js` → `data/planetary/branches.js`
- `data/npc-grammar.js` → `data/npc-kb/grammar.js`
- `data/npc-topics.js` → `data/npc-kb/topics.js`
- `data/managers.js` → `data/npc-kb/managers.js`

**Crafting helpers merged**
`meta.js`, `taxonomy.js`, `compat.js` and `validate.js` were four sub-120-line modules with
the same import header, and `index.js` was the only consumer of any of them. They are now
`derived.js` in four marked sections, and `index.js` re-exports with `export *` instead of
a hand-kept 25-line name list that had to be edited twice for every new symbol.

**Duplicate definitions collapsed**
- `ammoStock()` existed verbatim in both `systems/crafting.js` and `systems/magazine.js`.
  The magazine owns it; crafting re-exports.
- `core/log.js` exported `LEVELS` and `diagnostics()`, colliding with `systems/quality.js`
  and `core/diagnostics.js` respectively. Now `LOG_LEVELS` and `logDiagnostics()`.
- `initComms()` was defined in both `systems/comms.js` and `ui/comms.js`, forcing `main.js`
  to alias one at the import. The systems-layer one is `initCommsSystem()`.
- `cancelProject()` meant "abandon research" in `systems/research.js` and "abandon a
  construction contract" in `systems/fleet-projects.js`. The latter is `cancelConstruction()`.

**test/static.mjs now follows `export *`**
The import audit only understood explicit re-export lists, so a barrel using `export *` read
as exporting nothing and every consumer looked broken. Star re-exports are now resolved
transitively, depth-capped and cycle-guarded — `crafting/derived.js` imports the barrel that
re-exports it, which is legal and load-bearing here.


# Changelog

Newest first. One entry per slice; full detail lives in the matching `PATCH_vX.Y.md`.

## v1.02.47 — "The Chart" · 2026-08-16

The galactic map, and the jump. Full notes: `Patch-Notes/PATCH_v1.02.47.md`. Schema unchanged (22).

### Added
- **`ui/galaxymap.js` — a 3D galactic chart.** Nine thousand stars drawn from the real fifty
  thousand, in **one draw call**, using the same `world/particle-shader.js` the particle pool and
  the well shells use — so the chart cannot drift from the look of the game, and
  `tools/shader-check.html` already covers its GLSL. Drag to turn the disc, pinch or scroll to
  zoom, tap a star to read its file. Three additive point clouds: a **dust haze** placed by
  sampling real nodes (what makes it read as a galaxy rather than a point cloud), a warm
  **core bulge**, and the **stars** themselves, coloured by class from data. Your position
  pulses; your selection is marked.
- **Every star drawn is a real node.** Tap one and you get its designation, class, worlds,
  berths, fields and jump cost — generated on selection, never on draw. No decorative stars
  mixed in with the navigable ones.
- **`systems/jump.js` — going there.** The last genuinely inert mechanic in the tree:
  `GALAXY.jumpRange` and the fuel constants were exercised by the suite and by nothing else.
  Every refusal names its number — range, charge, docked. The pilot, ship, hold, crew, credits,
  company, standing and career cross with you; the boards, market, population sim and asteroid
  field belong to the berth you left.
- `test/chart.mjs` — 37 checks. **54/54 suites green.**

### Fixed
- The world render is now skipped while the chart is up, so exactly one scene is drawn per
  frame — the same gate the command deck has used since v1.02.31.

## v1.02.46 — "Bearings" · 2026-08-16

One real bug, found by audit. Schema unchanged (22).

### Fixed
- **`loadGame()` never restored the galaxy placement.** Found by listing every key `snapshot()`
  writes that `loadGame()` never reads: 51 keys, 5 unread, and 4 of those correct — `build` and
  `savedAt` are metadata, `layout` and `genesis` decide how the world is *generated*, which has
  already happened by the time a load runs.

  `galaxy` was the odd one out and it corrupted data. `savedGalaxy()` covers boot, but
  `importSave()` and `restoreBackup()` both call `loadGame()` mid-session with no reload, so the
  placement stayed on the **previous** flight — and because `snapshot()` writes `S.galaxy` back
  out, the autosave thirty seconds later stamped the old coordinates onto the imported save and
  moved it on the chart permanently. Silent, and destructive rather than cosmetic.

  `test/galaxy.mjs` grows to 63 checks; disabling the fix turns three of them red, including
  *"the next save writes the new placement, not the old"*.

### Verified
- The uploaded tree is byte-identical to the reference for `src/`, `test/`, `css/` and
  `index.html`; 947 relative imports all resolve; `index.html` references no missing asset;
  53/53 suites green. Save payloads at schema 1, 4, 8, 17, 18, 19, 20 and 21 all migrate to 22
  and gain a placement; null and malformed payloads migrate without throwing; the legacy
  placement matches the actual star class on 250 consecutive seeds.

## v1.02.45 — "Housekeeping" · 2026-08-16

An audit by script, not by memory. Full list: `docs/OPEN_ENDS.md`. Schema unchanged (22).

### Removed
- **82 exports that nothing imported.** Found by comparing every export in `src/` against every
  identifier in `src/`, `test/` and `tools/`. An export used only inside its own file is not an
  interface — it is a promise to callers who do not exist. All 82 lost the `export` keyword and
  nothing else; the suite was green before and after, which is the proof they were never
  load-bearing. Seven of them were mine, from the last five patches.
- **`world/station-mesh.js`** (211 lines) — nothing imported it, and its own header claimed
  `world/system.js` used it. A station proxy/interior LOD split, written, documented as live,
  and never wired. Deleted rather than wired: a file that says it is integrated and is not makes
  the codebase lie to the next person reading it. The idea is recorded as a decision, not lost.
- **Five files merged into one** — `data/planetary/branches/` was a barrel plus five 52–59 line
  files, split on the reasoning that they would "grow at different rates and by different hands".
  None has grown, there is one pair of hands, and the barrel was longer than the difference.

`src/` is 150 files / 47,220 lines, from 156 / 47,426.

### Added
- **`docs/OPEN_ENDS.md`** — every open end, sorted into *closeable* (six items, no design
  decision), *decisions* (five, where calling them debt would be dishonest) and *structural*.
  Includes the two scripts, so the numbers can be reproduced rather than trusted.

## v1.02.44 — "You Are Here" · 2026-08-16

The galaxy becomes load-bearing. Full notes: `Patch-Notes/PATCH_v1.02.44.md`. Schema **21 → 22**.

### Changed
- **The system the game renders is a node on the chart.** v1.02.43 shipped a galaxy and nothing
  read it, which by this project's own rule is a system that does not exist — the same fault as
  `hires` at .38 and `order.params` at .39, and it should not have shipped that way. A new game
  now picks a home node and *derives* the system seed from it, so the first system a player sees
  has a designation, a place on an arm, and neighbours inside jump range. Verified: the default
  seed opens at **RG-5·000 · Thrade Prime · Yellow-white**, 31,350 ly out, with 258 systems in
  range and the cheapest hop at 1 fuel.
- **The system line says where the system is.** `RG-5·000 · Thrade Prime · Yellow-white · 8
  worlds · 9 stations · 2 fields`.

### Added
- **Schema 22 persists the placement** — a galaxy seed and a node index, two integers.
- **`placeExisting()`** — a pre-22 save keeps the exact system it has always had (the v17 rule:
  everything it remembers is keyed by name, so regenerating it dangles all of it) and is *placed*
  at a node whose star class matches the one it is actually orbiting, so the marker and the sky
  agree. Written into the save rather than resolved at boot, because a placement recomputed each
  load is a system that wanders the map between sessions.

## v1.02.43 — "Cartography" · 2026-08-16

A galaxy, and three loops closed. Full notes: `Patch-Notes/PATCH_v1.02.43.md`. Schema unchanged (21).

### Added
- **`world/galaxy.js` — procedural galaxies.** Fifty thousand systems in four spiral arms, with a
  denser core and a thin disc. It is deliberately **an index over `genesis.js`, not a second
  generator**: a node is a position, a designation and a *seed*, and asking what is in a system is
  one call to the `generateSystem()` that has existed since v1.02.33. So the whole galaxy costs
  **one integer** in the save file, and there is no second source of truth for what a system is.
- **The chart cannot lie.** The star class drawn on the map is asserted against
  `generateSystem()` itself for three hundred nodes — not against a copy of its logic. If genesis
  ever changes its draw order, that fails loudly instead of the chart quietly misleading.
- `test/galaxy.mjs` — 38 checks, including that no spiral arm comes out one star class.

### Fixed
- **`COMPANY.commissionRange` was inert since v1.00.31.** The inert list is down to five.
- **A `GENESIS_VERSION` mismatch is acted on rather than merely recorded.** Schema 18 stored it
  since v1.02.33 to make generator changes detectable, and nothing read it for nine patches.

## v1.02.42 — "The Shape of the Well" · 2026-08-16

Gravity wells you can see, and a points tier under LOD. Full notes:
`Patch-Notes/PATCH_v1.02.42.md`. Schema unchanged (21).

### Added
- **Gravity wells are drawn.** They have been load-bearing simulation since v1.02.34 —
  `navplan.js` routes around them, `warp.js` will not hold a course inside one, and getting the
  star's own well right was worth an 11× improvement in fleet throughput — and **nothing has
  ever drawn them.** A player watching a freighter swing wide around a gas giant saw a ship
  flying a strange route for no reason and reasonably concluded the pathing was broken. The
  shell sits at exactly `wellRadius(u)`, imported from the module that owns the formula, because
  a picture that disagrees with the router is worse than no picture. Colour carries strength.
- **`world/pointfield.js` — a held point layer.** The static counterpart to v1.02.41's transient
  pool: geometry placed once that stays until removed. Separate allocation on purpose — a well
  shell holding slots in the particle pool would mean a firefight beside a gas giant had no
  sparks left in it.
- **A points tier under LOD.** A belt beyond mesh range becomes one additive band instead of
  four hundred instanced rocks, with hysteresis so drifting across the threshold does not
  flicker. It reads as *more* detail, not less: instanced rocks cull one at a time, so belts
  used to thin to nothing at distance where a band holds its shape.
- `test/fields.mjs` — 50 checks.

### Fixed
- **A quality change did not move the field budget.** `setQualityLevel` now invalidates the
  layer; without it the lever silently did nothing until an unrelated edit marked it dirty.

## v1.02.41 — "Motes" · 2026-08-16

One particle pool, particles that carry information, and two tools for looking at them. Full
notes: `Patch-Notes/PATCH_v1.02.41.md`. Schema unchanged (21).

### Changed
- **Three particle systems became one.** 720 sparks in `systems/combat.js`, 120 thruster points
  in `entities/player.js`, and no mining debris at all — three buffers, three draw calls, three
  ideas of how big a particle is, and **not one of them read `effectScale()`**. The quality
  system has been able to scale effects since v1.00.95 and nothing was listening, so a Minimum
  phone ran exactly as many sparks as an Ultra desktop. Now: one pool, one draw call, one
  budget, and a fixed allocation that never grows mid-frame.
- **Particles say things.** Damage type decides a hit's colour, so what hit you is readable
  from the canopy; count follows magnitude, so a big hit looks big and a rich seam visibly
  throws more; shield, armour and hull hits look different from each other; drive plume colour
  carries heat. Six reserved hues, exclusive, asserted distinguishable by the suite.

### Added
- `tools/particle-lab.html` — every preset and every constant, live, importing the game's own
  module. Tuning used to mean edit, reload, power up, fly somewhere and watch two seconds.
- `tools/shader-check.html` — compiles the real GLSL in a real WebGL context. Shader bugs were
  the one class of fault with no test at all: they do not throw, do not fail an assertion, and
  show up as a black screen on somebody's phone.
- `test/particles.mjs` — 38 checks.

### Fixed
- **Drag was frame-rate dependent.** `v *= exp(-k·dt)` then `p += v·dt` is only accurate as
  dt → 0: measured, one 1-second frame moved a spark 4.98 units where sixty 1/60-second frames
  moved it 30.89. Same second of game time, sixfold difference, worst on the slow device.
  Integrated exactly now.
- **`em` and `data` were 0.08 apart in RGB.** Two reserved hues nothing could tell apart is
  the same as having five.
- **The drive plume was not exhaust.** 120 points teleported to fresh random offsets every
  frame — a cloud that changed shape rather than something emitted and left behind, so it did
  not trail when you turned or stretch when you accelerated.

## v1.02.40 — "Boardroom" · 2026-08-16

The career can reach the work. Closes the ten-patch Executive arc. Full notes:
`Patch-Notes/PATCH_v1.02.40.md`. Schema unchanged (21).

### Added
- **The boardroom.** `BOARD` on the command deck opens every desk in the system on one screen,
  grouped by the power that posts the work and ordered by what that power thinks of you. Until
  this patch **an executive could not reach the contract board at all** — it lives in the dock
  overlay, docking means flying, and the career is defined by not flying. Four patches of
  progression loop were reachable by five careers and not by the one the arc is about.
- **Contracting as a company.** Accepting assigns a hull: the contract and a fleet objective are
  created together and share a fate, you choose which ship goes, and a job no hull can fly is
  refused by name before the promise is made. What the hull delivers is what the contract is
  credited for, settling down the ordinary path — fee, standing, corp war, career rung.
- `test/boardroom.mjs` — 54 checks.

### Fixed
- **An office haul was loaded into the founder's personal hold**, which failed the free-space
  check and would have created the cargo twice if it had passed.
- **`order.params` was read by nobody.** Declared on order types since v1.01.91 while every work
  step read the fields straight off the order — so a hunt's kill quota could not be set by any
  caller, and the branch that used it was never once true. `dispatchFleet()` now hoists them.
- **A survey order stopped after one body**, so a hull given a three-body survey contract would
  have resolved the first, declared victory, and let the contract time out.
- **A tendered hull still reported itself free**, so the same freighter could be assigned twice.

## v1.02.39 — "Desks" · 2026-08-16

The ladder becomes climbable. Full notes: `Patch-Notes/PATCH_v1.02.39.md`. Schema 20 → 21.

### Changed
- **A station posts for one of the nine powers**, not one of three blocs. Derived from the
  station's name and the world seed, so it stays out of the save file. This was the last enum
  standing between v1.02.36's per-power record and it mattering: the career ladder gates on
  named powers, and until now nothing in the game could move a per-power number.
- **Settlement moves standing with the desk that posted the job**, so the corp war is felt —
  Directorate work costs you with Kessler, derived from the timeline. A third of it reaches the
  old bloc number, which docking rights and hostility still read.

### Added
- **Three tiers of work.** Standard is free; Bonded and Sealed want skill, standing with the
  issuing desk, and the certificate a career rung grants — offset one rank below the tier's own
  name, so the first rung you earn immediately opens better-paying work.
- **Every board offers at least one job anybody can take.** Roughly one board in fourteen used
  to come out all padlocks, which reads as a broken game.
- `test/desks.mjs` — 58 checks, including the loop end to end.

### Fixed
- **Competence was quantised to ten values** while claiming to be continuous, so the enforcer
  path showed *no movement at all for 32 contracts* and half of every ladder's precision was
  decoration. `rankProgress()` — shipped in 0.6, read only by the skill sheet — is folded in.
  Rung 1 now arrives at 16 contracts, and every job moves the number.
- **A rung's grant now counts as a held qualification.** Climbing granted `bounty-low`, the
  screen printed it, and the contract wanting `bounty-low` stayed locked.
- `freewake.charter` was `'logistic'` against a station category of `'logistics'` — the one
  power whose entire charter is freight could never have been offered a depot.
- `Needs gunnery at 40% — you are at 40%`: shortfalls now floor, requirements ceil.

## v1.02.38 — "The File" · 2026-08-16

The dossier screen. Full notes: `Patch-Notes/PATCH_v1.02.38.md`. Schema unchanged (20).

### Added
- **The dossier screen** (`src/ui/dossier.js`, `css/dossier.css`). v1.02.36 built the
  individual record and shipped it green with nothing in the game reading a word of it —
  which by this project's own rule is a system that does not exist. Identity, a skill hexagon
  whose *shape* is the identity, standing with all nine powers on a **diverging** scale with
  zero on a centre line, the five-rung ladder with the next rung's price broken out as
  have-versus-need, and the live corp wars. The same component renders the player and an NPC,
  because the claim of .36 is that the player is one record among many.
- **One power's file**, opened by tapping a standing row: charter, doctrine, how it regards
  the other eight, its history, and what it thinks of you.
- **Three ways in** — `FILE` in the flight tool column, `FILE` on the command deck, and `FILE`
  on a locked ship. A pilot should not have to dock to see the gate they are climbing toward,
  and a founder who cannot fly still has a standing.

### Changed
- `#exec-actions` is three columns; nine buttons across four left an orphan row.
- `test/layout.mjs` pins twelve tool buttons. The `fits()` arithmetic — which is the check
  that actually matters — stayed green when the twelfth landed.

## v1.02.37 — "One Vocabulary" · 2026-08-15

A data-folder pass. Full notes: `Patch-Notes/PATCH_v1.02.37.md`. Schema unchanged (20).

### Fixed
- **The same key meant two different organisations.** v1.02.36 added nine powers and left
  `CORPORATIONS` as six unrelated employers; four shared a key with a power and described
  something else. `severance` was an *independent* defector network in one file and a listed
  *Coalition* finance house in the other — and `CORP_POWERS` was granting a defector +22
  standing with the house they defected from. Every employer is now a power's hiring arm,
  keyed by that power, so `CORP_POWERS` is an identity.
- **Two employers had a perk that changed no number.** `dockDiscount` and `upgradeDiscount`
  were summed by `characterBonuses()` and never reached `S.stats`; `tradeBonus` reached it
  and was read by nobody — which also meant the commerce skill's entire payoff had been
  inert since v0.6. All three are wired, and the suite now asserts every declared perk uses
  a bonus key something consumes.

### Added
- **Nine employers instead of six**, one per power, three options per lineage instead of two.
- **`CORP_ALIASES` / `resolveCorp()`** — a save carrying a retired employer key still loads.
  An unresolved one made `createCharacter()` return null, which on a load path is a character
  that silently fails to rebuild.
- **`serviceScale()` / `probeCost()`** in `systems/economy.js`.

## v1.02.36 — "Papers" · 2026-08-14

Individuals, not categories. Full notes: `Patch-Notes/PATCH_v1.02.36.md`. **Schema 19 → 20.**

### Added
- **`src/data/factions.js`** — nine powers with charters, tempers and doctrines, and a
  ten-event timeline from CR 0 to CR 158. **Relationships are derived from the timeline**,
  not declared beside it: `activeWars()` is a query, so adding an event changes the politics
  with nothing else edited.
- **`src/systems/dossier.js`** — one record per individual, player or NPC. Continuous
  proficiency, per-power standing, earned qualifications, a five-rung career ladder and
  seeded traits. NPC records derive from the world seed and are not stored until something
  changes them.
- **`test/dossier.mjs`** (139 checks), **`docs/LORE.md`**, and an interactive UI prototype
  at `docs/dossier-prototype.html`.

### Changed
- **Standing is per-power and starts at zero with all nine.** It used to start at +10
  Coalition / −20 Outer for everybody — a stance nobody had taken, applied before the
  character had done anything. Creation bonuses now name organisations
  (`LINEAGE_POWERS` / `CORP_POWERS`) instead of a third of the galaxy.
- **Working for one power moves standing with its rivals**, at a rate the timeline sets.
  That is the corp war stopping being scenery.

### Fixed
- **The career ladder gave away its own progression at creation.** Thresholds started at 20%
  while career and lineage hand out 10–60%, so a Core-born broker began at rung 2 of 5.
  Raised to 35/55/72/88; the suite now asserts across all 24 career × lineage combinations
  that no birth starts above rung 1.

## v1.02.35 — "Work Orders" · 2026-08-14

Every sellable hull has work. Full notes: `Patch-Notes/PATCH_v1.02.35.md`. **Schema 18 → 19.**

### Added
- **Six new fleet order types**, each with a real body in `fleet-work.js`: `construct`,
  `salvage`, `hunt`, `prospect`, `arbitrage`, `tender`. Every one is gated on something being
  true in the world rather than on elapsed time.
- **`src/systems/fleet-projects.js`** — the company construction order book. An executive
  orders a station module, a builder converts treasury into installed value over time, and at
  100% the module is really attached with its real service bonus. Ordering does not charge up
  front, so cancelling costs exactly what was built.
- **Construction and Support desks** in the command dialogue, so the new jobs have doors.
- **`test/jobs.mjs`** — 112 checks. The coverage matrix is a rule now: a sellable role with
  fewer than three jobs is a red suite on the day it is added.

### Fixed
- **The `build` role had no work at all.** No order type in the game listed it in `requires`,
  so a commissioned construction hull had literally nothing that could be assigned to it.
- **`merc` was the only role that could not hold a berth** — missing from `station_keep`'s
  requires list and present in every other.
- **A v1 save had silently become unloadable.** `migrate()` capped the walk at a hardcoded 17
  hops; schema 18 shipped without touching it, so the oldest saves quietly stopped loading.
  Caught only when schema 19 pushed a v1 payload one step further. The cap derives from the
  chain now.

## v1.02.34 — "Right of Way" · 2026-08-14

Company hulls fly around things. Full notes: `Patch-Notes/PATCH_v1.02.34.md`. Schema
unchanged (18); `GENESIS_VERSION` 1 → 2.

### Added
- **Contracted hulls plan courses.** `travel()` routes through `navplan.planRoute()` — the
  visibility-graph planner the player's warp drive has used since v0.2, whose own header
  comment has always claimed "the same function plans a warp course, a nav-map preview, and
  an NPC route". That third caller did not exist until now. Routes are cached per leg and
  invalidated on destination drift, on `routeClear` failing, and on a 6 s heartbeat.
- **`test/pilotage.mjs`** — 31 checks. The suite decides the geometry itself and then
  asserts the planner agrees with it.

### Fixed
- **A gravity well now collapses the bubble for company hulls**, as it always has for the
  player. Without it the routing was decoration.
- **The star was eating its own system.** `WARP.well`'s size cap was tuned against a
  320-unit yellow dwarf; an 820-unit supergiant projects a well several thousand units
  across, and the generator placed worlds and berths inside it. On seed 20260814 a hauler
  spent **80% of its life crawling at 15 u/s inside its own star**. Worlds and berths are
  now placed outside `innerLimit(star)`.
- **Arriving at a berth counted as being blocked.** A station sits in a planet's pocket by
  design; braking there meant crawling the last leg of half the routes in a generated system.
- **A 200-unit crawl band on every leg.** The decel ramp stopped at 1,400 and the bubble
  started at 1,600, and the gap ran a flat 15 u/s — 46% of a hauler's life once berths were
  packed procedurally. One branch now.

### Measured
- Six passive haulers, 900 s, seed 20260814: **4 → 44 deliveries each** (11×). The remaining
  dominant cost is the deliberate 6 s spool timer.
- Route planning costs **31 µs/frame** for six objectives — 0.19% of a 60 Hz frame.

## v1.02.33 — "Cartographer" · 2026-08-14

The system is a seed. Full notes: `Patch-Notes/PATCH_v1.02.33.md`. **Schema 17 → 18.**

### Added
- **`src/world/genesis.js`** — procedural system generation. The seed decides the star's
  spectral class (and therefore its luminosity, and therefore the habitable zone everything
  else is measured against), how many worlds there are (8–18) and what class each one is,
  how many berths and where, where the fields sit, and every name.
- **Composition as a gradient.** The four authored belt mixes became `mixFor(heat)`, so a
  generated system keeps the same economics — cheap iron somewhere, volatiles somewhere,
  rares peaking in the awkward middle band — without the same four fields.
- **Playability guarantees.** Every system gets a trade hub, foundry, refinery, fortress and
  depot, and at least one field that sells volatiles. Both exist because the generator
  produced the fault first: a system with no yard is an unwinnable executive career, and a
  hot star pushed the frost line past the outermost gap so volatiles had no origin at all.
- **`test/genesis.mjs`** — 91 checks across a thirteen-seed spread.

### Changed
- **`createSystem()` takes a plan** instead of walking two hardcoded tables, and falls back
  to the authored Solaris when none is set — which is why nothing else needed rewriting.
- **Corona shells are multiples of the star's radius.** A 200-unit red dwarf used to sit
  inside its own corona; an 820-unit supergiant wore one three sizes too small.
- **Station bearing reads the plan's own list**, not the length of the deleted table.
- **The chart labels the real star** and the top bar names the real system. Both were string
  literals that happened to be true while only one system could exist.

### Migration
- **Schema 18 persists `layout` and the generator version alongside the seed.** A pre-18
  save is declared to be in `solaris` — the authored twelve worlds, carried verbatim —
  because everything it records about the world is keyed by *name* and regenerating its seed
  would rename all of it at once. Nothing is lost and nothing moves.

## v1.02.32 — "Shipping Lanes" · 2026-08-14

Four device-reported faults in the contracted fleet. Full notes:
`Patch-Notes/PATCH_v1.02.32.md`. Schema unchanged (17).

### Added
- **`test/lanes.mjs`** — asserts how a hull *behaves*, not just what its objective produced.
  Every fault below was live under a green suite for exactly that reason.

### Fixed
- **Hulls warped about half the trip and then crawled.** The bubble collapses at 1,400 units
  and a station hop is often 3,000, so the rest was flown at ~15 u/s — ninety seconds beside
  nothing. Replaced the cliff with a decel ramp (`WORK.decel`); drop-out to arrival is now
  about 2.3 s.
- **A travelling hull reported "docked" and was invisible on the nav map.** `undockHull()`
  was called from one place — the miner's phase ladder. `travel()` now clears the pad, so
  every order type that crosses open space inherits it.
- **A hauler served two berths forever.** `bestMarket` was an argmax over a slow-drifting
  price field. Added a bounded recency penalty on both ends of the route. 1,000 s on one
  seed: 1 delivery / 2 berths → **49 deliveries / 6 berths**.
- **Passive objectives expired after ninety seconds.** Only extraction declared no default
  clock; every other type carried one, so "until recalled" was a countdown. An explicitly
  requested duration still wins.
- **An executive was issued ship's crew.** An engineer and a helm officer for a ship that
  does not exist, drawing payroll and rations. Refused in `initCrew()` *and* stood down in
  `createCharacter()`, because the crew is issued before the career is picked on a new game.

## v1.02.31 — "Office Deck" · 2026-08-14

First slice of the Executive arc (.31 → .40). Full notes: `Patch-Notes/PATCH_v1.02.31.md`.
Schema unchanged (17).

### Added
- **`src/systems/career.js`** — `canPilot()` / `commandSurface()`, the one place that
  answers whether a character may fly. A capability rather than a career test at each call
  site, and read live off the sheet so a save is locked the moment it loads.
- **`src/ui/execdeck.js` + `css/exec.css`** — the executive command deck. A whole surface,
  not a panel: `body.command-surface` takes the flight HUD off the screen and the deck
  draws in its place, carrying the company, treasury, board confidence and fleet board.
- **`src/systems/telemetry.js` + a Telemetry pane on the chart** — live readouts for
  celestial bodies, stations, traffic and rock, gated by sensor resolution. Ephemeris is
  never gated; manifests, armament and service lists are.

### Changed
- **Nothing renders on the command surface.** `main.js` skips quality, LOD, the light rig,
  interpolation and `render()` while the deck is up — the simulation is untouched, only
  presentation is skipped. `updateHud` is skipped with it.
- **The nav map takes an opener contract.** `openNavmap({ pane, returnTo, hideFlight })`.
  Closing the chart hands the screen back to whoever opened it; `null` still means the
  cockpit. Ops now offers SYSTEM CHART and LIVE TELEMETRY, both with a path back.
- **The chart's flight buttons distinguish grounded from unlicensed** — `Docked` is a state
  you can undo, `Command` / `No hull` is not.

### Fixed
- **The executive flight lock was cosmetic.** Hiding the HUD is not a lock: the canopy
  drag, `keyPoll`, the key/gamepad press table and the held-action set all now ask
  `canPilot()`. An executive holding `W` was opening the throttle on a hull they do not own.
- **`OPS → Staff → chart` was a dead end** — it closed Ops and dropped you into the cockpit,
  so the only route back to the fleet list was to walk the whole path again.

## v1.01.96 — "Out of Sight" · 2026-08-11

Full notes: `Patch-Notes/PATCH_v1.01.96.md`. Schema unchanged (17). No gameplay changes.

### Added
- **`src/world/visibility.js`** — several systems can now hide the same object for their
  own independent reasons, and it is shown only when nobody is hiding it. `Object3D.visible`
  is one boolean and two systems wanted it: the fleet layer hides a docked hull inside a
  station ring, LOD hides anything too small to draw. Second writer won, so a docked miner
  was dragged back into view the moment the player flew close enough for LOD to care —
  a ship inside a station, drawn, every frame.

### Changed
- **Distant hulls are no longer drawn.** NPCs register with LOD for culling. They spawn
  across orbital rings out to 30,000 km, so a large share of the population is a fraction
  of a pixel wide at any moment: 29 of 70 hulls culled from the player's own viewpoint on
  seed 1337, visible drawables 332 → 286. This was flagged as blocked in v1.01.95 and the
  arbiter above is what unblocked it.
- **The LOD registry prunes itself.** Hulls despawn from half a dozen call sites and none
  of them called `unregister` — until now nothing but permanent celestial bodies was ever
  registered. An object whose parent is null is dropped on the next pass. `register()` is
  idempotent too, so a body registered twice ticks once.

### Fixed
- **The profiler's visible-drawable count was wrong** in exactly the case this patch
  creates. LOD hides a group, three.js stops descending, and the child meshes stay flagged
  visible while never being drawn — so a census reading each node's own flag reported no
  saving from the change that saves the most. It now inherits visibility down the tree and
  takes its viewpoint from the player rather than from inside the star.

## v1.01.95 — "Light Discipline" · 2026-08-11

Full notes: `Patch-Notes/PATCH_v1.01.95.md`. Schema unchanged (17). No gameplay changes.

### Added
- **`test/profile.mjs`** — a per-phase frame timer and scene census, run with `npm run
  profile`. A tool rather than a suite: it asserts nothing, so it is not in `all.mjs`. It
  reports where the frame goes and, more usefully, the shape of the scene — drawables,
  distinct materials, distinct geometries, and the point-light count.

### Changed
- **Eighty point lights became seven.** Every ship, station and hull owned a `PointLight`.
  `MeshStandardMaterial` compiles a loop over *every* point light in the scene and runs it
  per fragment, so seventy-nine of those were being paid for on every lit pixel while
  contributing nothing visible from ten thousand kilometres away. Worse, the count is a
  shader program key — so a pirate dying recompiled every lit material in the scene, which
  is a stutter no frame profiler can attribute. `src/world/lightrig.js` now holds a fixed
  pool of six lights that follow the nearest emitters; the count never moves, so the
  shaders never rebuild.
- **Hull and station assets are shared per type.** Every pirate is the same cone in the
  same colour, but the builder minted fresh geometry and a fresh material per hull —
  sixty-seven identical GPU uploads. Materials 340 → 186, geometries 376 → 290, heap after
  an hour of game time 25.7 MB → 22.9 MB.

### Fixed
- **Test harness fidelity.** `test/stub.mjs` now tracks `Object3D.parent` through
  `add`/`remove`, has `traverse`, and gives lights real `color`/`intensity`/`distance`.
  Each was a place the stub was easier to satisfy than the real renderer.

## v1.01.94 — "Seen Once" · 2026-08-10

Full notes: `Patch-Notes/PATCH_v1.01.94.md`. Schema unchanged (17).

### Fixed
- **A commissioned hull was registered in the world twice.** `spawnNpc()` already adds to the
  scene, tracks interpolation and pushes to `S.world.npcs`; `commissionHull()` pushed the
  same object again. It drew once and mapped once — both draw the one object at the one
  position — but every list that walked the array showed it twice, which is the doubled
  Contacts entry. It also meant the world **stepped the hull twice per frame**, so a
  commissioned ship accelerated, mined and reconciled at double rate. Expect a miner to run
  at about half its v1.01.93 speed; that is the correct speed.
- **`/favicon.ico` 404 on every page load.** Browsers request it unasked and the dev server
  answered 404 each time, which made a clean console look broken. Inline SVG data URI now.

## v1.01.93 — "Contract Miner Balancing" · 2026-08-10

Full notes: `Patch-Notes/PATCH_v1.01.93.md`. Schema unchanged (17).

### Fixed
- **A contracted miner stalled with a full hold and never delivered.** `extractStep` flew the
  hull to the seam and handed the rest to `minerStep()`, which only runs while the world is
  stepping that NPC — i.e. near the player. A miner 11 Mm from its owner stopped being
  stepped and sat at 2,344 / 2,600 kg, "running in", at 0 runs and 0 cr, permanently. The
  whole cycle now lives in `fleet-work.js` and owns its own movement: undock, clear the pad,
  spool, warp, approach, cut, break off, warp home, match, dock, transfer, repeat.
- **The pay cycle was spent in transit.** It decremented from dispatch, so a hull arrived at
  the seam with the clock expired, cut for one frame and turned round — seven round trips
  delivering sixty kilograms between them while the treasury fell. It measures time at the
  face now: three trips, 7,028 kg, treasury up.
- **New hulls floated beside the station instead of being docked,** which is why one appeared
  to teleport to the belt: it never undocked because it was never docked. Commissioned hulls
  are parked on a pad and skipped by the world's manoeuvre and acquisition passes.
- **Commissioned hull names collided** — numbered by roster length, so releasing one and
  buying another produced a second "Skud Extraction 01". `hullShip()` matches on the name, so
  it resolved to whichever came first in the world array. Names now carry the contract id.

### Added
- **Ship ownership.** Hulls bought through Ops belong to the company; hulls bought at a
  station's yard belong to the pilot. `transferHull()` moves one either way, with a button on
  each roster card. A hull the pilot owns stays visible and refittable but takes no company
  objectives, and one mid-objective cannot be transferred out until recalled.
- **`test/hangar.mjs`** (45 checks). Walks all eight phases by name and requires a round trip
  to carry more than 500 kg — the check that would have caught the sixty-kilogram version.

## v1.01.92 — "Corpo Balance & Executive Career" · 2026-08-10

Full notes: `Patch-Notes/PATCH_v1.01.92.md`. Schema unchanged (17).

### Fixed
- **A mining objective never chose a belt.** `order.target` was the placeholder string
  `'belt'` and nothing replaced it, so there was no waypoint, nothing to broadcast and
  nothing to show. It now picks the nearest field with unmined rock, records a waypoint,
  names the seam on the Ops card and broadcasts the assignment on the company channel.
- **The hull never travelled to its seam.** `minerStep()` only searches 5,000 units around
  itself. Worse, the transit gate also required `!u.rock`, and a freshly spawned miner
  already carries a rock reference from wherever it was set down — so a hull commissioned
  at a station reported itself *cutting* 3,933 units from the belt it had been assigned and
  never moved. Entering transit drops the stale claim.
- **The Executive screen never showed cargo.** A hull with 2,344 kg aboard read as idle
  while a scan of the same ship showed a full manifest. The roster now carries hold,
  capacity, manifest, running-in berth and under-fire state.
- **Nothing brought a hull home on a schedule.** A full hold now returns immediately rather
  than waiting on a clock; a part load returns when the pay cycle expires; a hull with room
  and time left keeps cutting.
- **A contracted hull could be destroyed without the owner being told.** Losing structure
  now raises a distress transmission, a toast, and an amber `#fleet-alert` banner that
  escalates below 35% structure — deliberately distinct from the red lock warning, which
  answers a different question.
- **Enemies locked on from across the system.** `lockRange()` is a fraction of detection,
  and detection is sensor × signature with no bound above; a loud hull against a heavy
  sensor produced a lock at ~17,500 units. `LOCK.rangeCeiling` caps it at `hitCeiling` —
  nothing holds a solution further out than anything can shoot.

### Added
- **`test/corpo.mjs`** (42 checks). Asserts the runaway arithmetic before asserting the cap,
  so the test fails if someone later removes the cap as dead code; pins the transit
  regression by requiring the distance to a seam to fall.

## v1.01.91 — "NPC Comms and Station" · 2026-08-10

Full notes: `Patch-Notes/PATCH_v1.01.91.md`. Schema unchanged (17).

### Fixed
- **Five of the six fleet order types did no work.** `patrol`, `escort`, `logistics`,
  `survey_pass` and `station_keep` dispatched, bound a hull, ran a countdown and produced
  nothing. `systems/fleet-work.js` gives each one a body: patrol flies a circuit and earns
  only while a hostile is on the lane, escort closes on the protected ship and pulls
  hostiles onto itself, logistics loads and sells a leg, survey deepens the assay the
  ground-order system already reads, and a picket reports what crosses its scope. No
  accrual is gated on the clock alone — an objective must not invent value out of time.
- **NPCs repeated themselves** because nine topics carried eighteen fixed sentences between
  them. `data/npc-grammar.js` replaces the templates with a generative grammar: rule-based
  plurals and conjugation (agreement, past, perfect, progressive, consonant doubling),
  `a`/`an` decided on sound rather than spelling, eighteen syntactic frames across six
  speech acts, register derived per ship so a character sounds like itself, and a seeded
  anti-repetition memory that exhausts a pool before anything recurs. Topics now declare
  meaning (`say`) and the realiser builds the sentence, so the same tip passed twice is two
  different sentences carrying the same information.
- Objective reports carry what the work produced — contacts, deterred, pulled, reported,
  assay gained, earned, current leg — and the Ops card shows it.

### Added
- **`test/comms-work.mjs`** (90 checks). Morphology asserted against known-correct forms,
  not merely against variety; proper nouns and `I` survive being moved out of
  sentence-initial position; every topic produces punctuated openers and replies; every
  order type is exercised against the world.

## v1.01.90 — "Work Orders" · 2026-08-10

Full notes: `Patch-Notes/PATCH_v1.01.90.md`. Schema unchanged (17).

### Fixed
- **An extraction objective did no extracting.** `updateFleetOrders()` decremented a timer
  and completed — nothing flew, no rock was cut, no credit changed hands. `minerStep()` had
  run the whole loop for versions (cut, fill, run in, sell, repeat) and nothing connected it
  to an objective; the proceeds went nowhere at all.
- **A conscripted hull could never change trade,** so a patrol ship could not be told to
  mine however much was in the treasury. `refitHull()` converts it at a yard, paid by the
  company; behaviour follows because npcs.js keys its routines off `role`.
- **Buying a ship did not give the company one.** The Ledger shipyard replaces *your* hull,
  which is not on the roster. `commissionHull()` buys one into the fleet.
- **Objectives are measured in kilograms, not seconds.** Passive extraction carries no quota
  and no timer and repeats until recalled; active carries a quota and finishes when the ore
  is in. The menu leaf's quota was never plumbed to dispatch, and its countdown would always
  have completed first.
- **Company hulls travel at `COMPANY.fleetSpeed`.** The belt is 10,700–12,900 units out and a
  miner cruises at 0.85 units/s, making the run-in leg about three game-hours.
- **A commissioned ship could be deleted by population decay** while out on an objective,
  closing its own contract thirty seconds later. Contracted hulls are exempt; merc boarding
  closes the contract properly.
- **`escort` required the role `patrol`, which no ship can have** — `spawnNpc` maps that NPC
  type to `combat`. Dead weight rather than a break, but the same bug the hauler was added
  to fix in v1.01.00.

### Added
- `FLEET_ROLES` — the trades a yard fits, keyed by the role an order asks for.
- Ops → Staff: per-hull yard menu, a commission list, and delivered/earned per contract.
- ARIA reports `fleet_refit` and `fleet_yard`. Spending stays in Ops.
- **`test/works.mjs`** (66 checks), including a 6,000-second run that banks real revenue and
  a sweep dispatching *every* menu leaf against a full roster.

## v1.01.81 — "Consignment Note" · 2026-08-09

Full notes: `Patch-Notes/PATCH_v1.01.81.md`. Schema unchanged (17).

### Fixed
- **A haul contract never loaded any cargo.** It was credited by *selling* the commodity at
  the destination, and nothing in the game buys commodities — so a haul was only completable
  with goods you had mined or shot for, while the contract text said a load was being handed
  to you. The station now consigns the load at acceptance.
- **And the consigned load could be sold back to the station that lent it.** Measured on
  seed 42: accept a 2,213 kg haul paying 8,264, `sellAll()` at the issuing station, abandon
  — **+12,038 cr for no flying**, which made abandoning strictly better than delivering.
  A consignment now occupies the hold and counts against capacity but is not the pilot's:
  `sellableOf()` excludes it, `deliverConsignment()` hands it over at the destination, and
  abandoning or expiring reclaims it. The pilot's own stock of the same commodity stays
  sellable.
- **Haul is no longer credited by `creditDelivery()`,** which double-counted — a pilot
  carrying their own ore and a consignment of ore could satisfy the contract from their own
  stock and keep the lent load, collecting the fee and the goods. Supply is unchanged and
  still credited by the sell hook.
- **`sell()` could leave a negative hold.** Subtracting a rounded weight from a fractional
  stack; the free portion is now removed in full and priced on the rounded figure.
- **The Ops button was a glyph.** `◈` with its label in a `title` attribute, which is a
  hover affordance on a device with no hover — so in practice the button did not exist.
  Now `OPS`, with `ARIA`, `TGT`, `CAM` and `LDG` alongside it; conventional symbols keep
  their glyphs. The station tab also offers a way through in every state, including
  **REGISTER A COMPANY CHARTER** when you hold none — the only place the game says the
  executive layer exists.

### Added
- **`test/haul.mjs`** (53 checks). Runs the accept-sell-abandon loop and asserts it ends
  poorer than it started. Covers loading, capacity refusal, delivery only at the
  destination, reclaim on abandon and expiry, the raided-hold clamp, supply being left
  alone, and every tool button carrying a readable face.

## v1.01.80 — "Articles" · 2026-08-09

Full notes: `Patch-Notes/PATCH_v1.01.80.md`. **Save schema 16 → 17**, additive. Closes the
executive command console section of `docs/OPEN_ITEMS.md` entirely.

### Added
- **Late incorporation.** `registerCharter()` at any non-bastion station. Costs the pilot's
  own credits, capitalises less treasury and fewer founder shares than the career start,
  and records the signing station as the office. `foundCompany()` was previously reachable
  only from character creation on one career, so one choice permanently decided whether a
  save could reach the executive layer — and every save written before v1.01.72 was locked
  out with no surface telling them why.
- **Contracted hulls** (`systems/fleet.js`). Objectives bound to synthetic `wing-<leaf>`
  assets; they now bind to a live NPC. One hull one objective, role gating with a refusal
  that names the class, upkeep per cycle that sheds a hull rather than going negative, and
  reconciliation in both directions — a ship that dies, and a company restored before the
  world exists.
- **Nav-map fleet layer.** Contracted hulls plot regardless of sensor range, ringed while
  on objective.
- **Per-hull standing mode.** Mode is a property of the contract, not only of a menu leaf.
- **The self-training loop** (`data/npc-kb/training.js`). Harvests salient diagnostics into
  few-shot examples behind the hand-written seeds, renders them as prompt text, dedupes
  identical events, and caps harvested quality below the seed floor so the loop cannot
  outrank its own written standard.
- **Executive ARIA surface**: `charter_options`, `fleet_candidates`, `fleet_roster`,
  `fleet_mode`, `aria_corpus`. Spending stays in Ops — registering, signing and releasing
  all move money, and `test/tools.mjs` enforces that no tool can.
- **`test/executive.mjs`** (124 checks).

### Fixed
- **The charter bonus was applied backwards to spending.** `book()` scaled by
  `(1 + charterBonus)` regardless of sign, so operating inside your own charter made
  revenue better *and everything you bought dearer*.
- **The `npc-kb` diagnostic log lived on `globalThis`** — absent from the save, and
  inherited by the next game in the same page load. Now on `S`, persisted at schema 17,
  reset on new game.
- **Fleet objectives were never persisted.** Dispatch, save, and the patrol was gone while
  the hull came back idle.
- **Fleet order ids** were `Date.now()` + `Math.random()`. Monotonic counter plus a seeded
  stream, carried past whatever a restored save holds.
- **Eleven suites pinned `SCHEMA === 16`**, so every future bump broke all eleven at once.
  Now `SCHEMA >= 16`.
- All deep `npc-kb/*` imports route through the barrel, as its own header always said.

## v1.01.76 — "Over the Shoulder" · 2026-08-09

Full notes: `Patch-Notes/PATCH_v1.01.76.md`. Schema unchanged (16).

### Fixed
- **The chase camera had a position but no aim.** It was the cockpit camera translated
  back along the nose and 13 units up in *world* Y, with the cockpit's own orientation
  left in place — so it looked straight past the ship rather than at it. At level flight
  the hull sat 17.2° below the view axis, which is why the chase view read as the forward
  view with a thruster in the bottom of the frame. The world-Y rise also fought the
  along-nose setback as you pitched: standoff swung between 29 and 55 units against a
  nominal 42. Now offset along the ship's own up, aimed with `aimAngles()` at a point
  ahead of the nose. Standoff holds at 44.0 across the whole envelope; worst off-axis 5.0°.
  Framing is tunable via `FLIGHT.chaseBack` / `chaseUp` / `chaseLead`.

### Added
- **`test/camera.mjs`** (33 checks). The chase branch had no coverage and could not have
  had any — the stub's `Euler` had no `.set()`, so `shipMesh.rotation.set()` threw the
  moment a suite enabled chase. `Euler.set`, `Vector3.cross` and `Vector3.dot` added to
  `test/stub.mjs`.
- **`test/screens.mjs`** (29 checks). Draws the static screens — title, character
  creation, the Ops staff desk in both its states, the command dialogue tree, a live fleet
  board — as coloured box-drawn panels sized for a phone terminal, so a slice can be
  eyeballed in Termux without serving the game. Asserts what the walk turns up: careers
  with a hull class that exists, branches with submenus, leaf labels inside the 34-char
  portrait budget, every drawn line inside the panel. `--plain` and `--width=` supported;
  runs `--plain --quiet` under `all.mjs`.

### Filed as open
- **No way to incorporate after character creation.** `foundCompany()` is reachable only
  from `createCharacter()` with the `executive` career, so one choice at creation
  permanently decides whether a save can reach the executive layer at all — and every
  pre-v1.01.72 save is outside it. Wants a station-side charter registration.

## v1.01.75 — "Audit" · 2026-08-09

Full notes: `Patch-Notes/PATCH_v1.01.75.md`. Schema unchanged (16). Build
`1.01.75 · Audit`. Merges the `living-galaxy-74` line onto `main`.

### Fixed
- **`npc-comms.js` drew from `Math.random()` outside the sweep.** `rng` was initialised
  only inside `updateNpcComms()`, so any other path into `exchange()` ran unseeded — the
  cause of `test/deals.mjs` failing about one run in seven, on `main` as well as the
  branch. The cached stream object was a second bug underneath: `seedWorld()` clears the
  stream table, so a reseed would have left this system on the previous world's numbers.
  Now fetched per draw, as `orders.js` and `contracts.js` already do.
- **`deals.js` carried dead RNG plumbing** — imported, declared, assigned, never drawn
  from. Removed; it implied `willAccept()` was stochastic when it is not.

### Added
- **`test/command.mjs`** (99 checks). The v1.01.72–74 command tree, shared resolver and
  NPC knowledge base shipped with no suite touching them. Guards the menu against leaves
  whose hull role the order type would refuse, utterance patterns pointing at node ids the
  menu no longer holds, and — the point of v1.01.73 — that a click and a sentence produce
  the same order.
- `test/static.mjs` now derives audited stylesheets from the `<link>` tags in `index.html`
  (`panels.css` was outside the audit) and checks re-export barrels, which are not import
  statements and were never verified.

### Reconciled
- `package.json` version said `1.01.70` against `version.js` at `1.01.74`; synced.
- `test:cargo`, `test:wear`, `test:command` npm scripts added.
- `PATCH_v1.01.71.md` and `PATCH_v1.01.72.md` backfilled — both versions were in this
  changelog with no matching note.
- README build line; `docs/OPEN_ITEMS.md` header.

### Filed as open
- The `npc-kb` diagnostic log lives on `globalThis`, not in `S` — not saved, not reset.
- Fleet order ids use `Date.now()` + `Math.random()`; not reproducible, not peer-stable.

## v1.01.74 — "Office" · 2026-08-09

Full notes: `Patch-Notes/PATCH_v1.01.74.md`. Schema unchanged (16). Build
`1.01.74 · Office`.

### Added
- **Executive HQ spawn.** New founders dock at a charter-matched station (trade hub,
  foundry, depot, fortress, or habitat). Company records `hqStation`; dock/Ops/ARIA
  treat that pad as the office. First frame after creation opens the station surface.

## v1.01.73 — "Dispatch" · 2026-08-09

Full notes: `Patch-Notes/PATCH_v1.01.73.md`. Schema unchanged (16). Build identity
bumped to `1.01.73 · Dispatch`.

### Added
- **Command dialogue menu** (`src/data/command-menu.js`). Hierarchical desks — Military,
  Industrial, Logistical, Economic, Civilian — with submenus for patrol / escort /
  extract / logistics / survey / station-keep. Every leaf is a structured fleet order
  (type, duration, active|passive, target, params).
- **Shared resolver** (`src/systems/command.js`). `commandByPath`, `commandById`, and
  `commandFromText` all call the same `dispatchFleet` path, so Ops clicks and ARIA
  utterances cannot diverge. Dispatches write diagnostic events into `npc-kb`.
- **Ops Staff** walks the menu with breadcrumb back/top navigation and Dispatch on leaves.
- **ARIA tools**: `fleet_dispatch`, `fleet_recall`, `fleet_status`, `command_menu`, with
  rule-matcher patterns so "patrol the sector 30 seconds" and "recall last" work without
  the local model.
- Carries v1.01.71 dock exterior-view fix, NPC check-in self-ack fix, v1.01.72 NPC
  knowledge base, and fleet objective timers into one shipped build.

## v1.01.72 — executive command + NPC knowledge base · 2026-08-09

### Added
- **NPC knowledge base** (`src/data/npc-kb/`). Schema, rich role profiles, diagnostic event
  log, and a seed training corpus designed for future onboard ARIA self-training / few-shot
  / RAG. Profiles carry speech patterns, heuristics, loyalties, red lines, and KPI defaults.
  Diagnostics record decisions, dialogue, manager policy fires, and board state with salience.
- **Fleet objectives** for executive idle command: patrol (default 30 s), extract, logistics,
  escort, survey pass, station-keep — with active/passive modes, visible timers, and auto-return.
  Wired into the sim tick and the Ops → Staff panel when a company exists.
- **ARIA executive awareness.** Context line and rule answers now cover company books, board
  confidence, live fleet objectives, and per-NPC diagnostic briefs ("who is X?", "diagnose…").

### Fixed (carried)
- Dock exterior view + return path; NPC check-in self-acknowledgement.

## v1.01.71 — dock view / NPC self-ack · 2026-08-09

### Fixed
- **Docked pilots could close the station overlay and become stranded.** Closing the dock UI
  (or selecting Service → View Outside) now enters a deliberate exterior view while still
  docked. A HUD "Return to Station" button and the Dock key both restore the full station
  interface (including Undock). Movement remains locked until true undock.
- **NPC check-in replies acknowledged the speaker instead of the other party.** The reply
  template after the a/b swap used `${a.name}` (self) rather than `${b.name}` (the ship that
  just marked them on the board).

## v1.01.70 — "Consignment" · 2026-08-09

**Cargo that is actually aboard something, and modules that wear out.** Two items off the
carried list, both named in patch notes written slices ago. Schema 15 → 16. 32 suites,
2,637 checks.

### Added
- **NPC holds.** A hauler's cargo used to be notional — a deal named a mass, and it appeared
  at the destination on settlement. Cargo is now aboard a ship, loaded at pickup, and a wreck
  spills roughly half of it. A laden hauler is worth about eleven times an empty one to
  whoever shoots it, where before the two were identical targets.
- **Module condition.** Per hardpoint, accrued only by things the pilot chose to do — a shot
  fired, a hit taken, a second of cruise, a second of beam. A worn module gives less *and*
  draws more, which feeds the overload curve v0.7 already built rather than inventing a
  second penalty. Nothing is ever destroyed.
- **Servicing** on the dock's service tab beside armour and hull, and per hardpoint in the
  fitting screen. An engineer on watch slows wear, which is the first thing that post does
  outside a fight.
- **Scanner reports load at tier 2, manifest at tier 3** — the split is the decision a raider
  makes at range, and answering it at one tier would collapse two decisions into one.

### Fixed
- **Miners were extracting ore into nowhere.** `u.mined` was a counter nothing read: the belt
  really was being depleted, and the ore ceased to exist. It now fills a hold, runs to a
  station, and sells into that station's book.
- **A raided hauler used to deliver in full.** Settlement delivers what the carrier actually
  has. The deal still discharges and still pays — they flew the run; what is missing is the
  cargo the raider took.
- **A test that had been passing for the wrong reason.** `test/run.mjs` asserted a cumulative
  counter inside a scoped window, and NPC mining does not run while the player is parked far
  away to stay out of the way — so the window it claimed to measure extracted zero.

### Tuned
- **Every wear rate, by roughly an order of magnitude.** The first cut warned after 24 seconds
  of continuous fire, 2.7 minutes of cruise and 2.2 minutes of mining. Written by feel,
  measured afterwards, and wrong in the direction that makes the whole system a chore on a
  two-minute timer. Now 213 s, 16.4 min and 27.3 min respectively.

## v1.01.60 — "Assay" · 2026-08-08

**Measuring the slice I had just shipped.** No schema change. 30 suites, 2,539 checks.

### Fixed
- **The research tree could not be completed.** Projects demand six thermal findings in
  total; Solaris contains three to five hot bodies depending on seed. A pilot could research
  two of the three thermal projects and then be permanently stuck with no hot world left to
  probe. Found by measuring supply against demand across four seeds — not by reading the
  table, where it is invisible.
- **Findings were being consumed, which made them a currency while every comment in the file
  called them evidence.** They are a qualification now: data is the consumable, and having
  been somewhere hot stays true after the project finishes. What gates progress is the
  largest single requirement rather than the sum, which is both satisfiable and the thing a
  player can reason about.
- **The costs were roughly one probe per project.** My own patch note estimated a probe at
  30–90 kg of telemetry; measured, it averages 134. Data costs are ~2.7× higher, putting the
  whole tree at about 60 probes and 153,000 credits of forgone sales.

### Added
- **The scan report says what a world would teach** before you spend a probe on it, and says
  "already on file" for one you have surveyed — because probing it twice teaches nothing.
- A suite check that every finding kind is supplied in the quantity some project needs at
  once, so a dead end cannot be re-introduced by a later tuning pass.

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
