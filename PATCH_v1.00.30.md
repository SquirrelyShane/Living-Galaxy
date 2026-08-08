# Patch v1.00.30 — "Standing Orders"

**Technical hot slice 3 of 10 · Locking, silence, crew depth & delegation**
Baseline: v1.00.20 "Foundry" · Save schema: 7 (unchanged) · Released 2026-08-05

Two bugs you reported, both real and both worse than they looked from the outside. Then the
crew work: experience that reflects what actually happened, people who need feeding, people
who can be talked into things or cannot, and a chief to run the watch bill. And the two
buttons the game had been missing — one to send teams out, one to find out where the money
is going.

The slice plan said celestial bodies here. That moves to v1.00.40; these were the things
actively wrong.

---

## 1. Enemies locked on from anywhere

**The symptom.** A hostile that noticed you once stayed locked no matter how far you went.

**The cause.** One line with no distance test in it at all:

```js
// true lock: hostile is actively hunting the player
if (u.faction === 'hostile' && u.target && u.target.isPlayer) lockedOn = true;
```

That is not a lock, it is a pointer. Once `acquire()` had set `target` to the player, the
threat indicator was on until something else cleared it — and the only thing that cleared
it was `hunt()`, which stops running the moment a hull is far enough away to be updated on
the slow path.

There was a second, subtler half. Acquisition used `detectionRange(sensor, signature)`,
which for a loud ship is up to 2.4× sensor range, while the drop rule used a flat
`sensor × 1.5`. **Acquire range could exceed drop range**, so a laden pilot under burn was
re-acquired the instant they were dropped. The hysteresis ran backwards.

**The fix.** Three ranges, and they are three different things:

| | what it answers | typical |
|---|---|---|
| **Sensor** | can I see you exist | 1,500–3,000 |
| **Lock** | can I hold a firing solution | 55% of sensor |
| **Hit** | how far a round actually reaches | per weapon class |

A lock is now **built, held and broken** rather than read off a pointer. It takes 1.8 s
inside the envelope to establish, so a fast pass hands nobody a solution. It survives to
1.35× that envelope before breaking, so it does not flicker while you sit on the line. Past
that the solution collapses *and the contact is dropped*.

### Max hit range, and who exceeds it

You were right that the exceptions should be seekers, drones and fleets — the things whose
rounds guide themselves the rest of the way in. Weapon class is now on the NPC table:

| class | reach | who |
|---|---|---|
| standard | 1.0× | raiders, mercenaries |
| drone | 1.9× | Nexis drone shoals |
| fleet | 2.1× | Coalition patrols |
| seeker | 2.4× | Nexis Command, pirate bastions |

A gunship **cannot shoot past what it can lock**. A seeker platform can, because the round
finishes the job on its own. There is a hard ceiling at 9,000 units regardless of what the
arithmetic produces.

Drone shoals also got their own engagement profile — in close at 28% of range and never
stopping — since they were previously flying the brawler profile borrowed from mercenaries.

## 2. Sound off did not turn the sound off

**You were nearly right about the engine hum.** It was the *music bed* — the drone added in
0.9, two detuned sawtooths on a root note.

`S.settings.audio` gated `tone()` and `noise()`. Those are the functions that **start**
sounds. The bed is two oscillators that start once at power-up and run for the rest of the
session, routed through the music bus to the master. Muting stopped anything new and left
the bed playing underneath, exactly as you described.

**The fix.** `setAudioEnabled()` mutes at the **master** — which everything routes through
— and then suspends the audio context, so the oscillators stop being computed rather than
merely multiplied by zero. That second part matters on a phone: a silent oscillator still
costs battery.

It ramps rather than cuts, because a hard zero on a running oscillator is an audible click,
which is a strange last thing to hear when you ask for silence. The bed also refuses to
start while muted, and a saved mute is honoured at boot.

## 3. Crew levelled for doing nothing

**The problem.** `xpIdle: 0.9` per second, per crewman, forever. A crew sitting docked in
an empty station reached the level cap in a few hours of wall time. Sitting in a chair
should not make you a better gunner.

**The fix.** Idle experience cut by twenty — to 0.045/s, a trickle you barely notice — and
the weight moved onto **events**:

| event | xp | goes mostly to |
|---|---|---|
| contract delivered | 240 | everyone |
| casualty aboard | 160 | damage control |
| hostile destroyed | 130 | gunnery |
| scan resolved | 90 | survey |
| trade closed | 55 | the hold |
| repair paid for | 45 | damage control |
| hold filled | 40 | extraction |
| crossing completed | 35 | helm |
| hull breached | 22 | damage control |
| damage landed | 6 | gunnery |

70% goes to the department that did the work, 30% is split across everyone on watch — a
fight teaches the whole ship something even if only the gunners pulled a trigger.
**Off-watch crew learn nothing from an event**, because they were not in the room.

The suite checks the property directly: an hour of an idle docked ship does not level
anybody, and one kill is worth more than an idle minute.

## 4. People need feeding

Crew now consume **provisions** — nutrient concentrate and water ice, drawn from the same
material stock the crafting layer uses. That is deliberate: a crew that eats is one more
thing the industrial layer feeds, rather than an abstract "supplies" bar with its own
economy stapled on beside it.

Hunger and thirst are **rates, not switches**. A ship that runs out does not stop; its crew
gets progressively worse at everything over hours, loses morale every payroll, and says so
on the roster. A hard failure would just be a death timer.

Both show on the crew card as **Fed** and **Watered**, drawn as *remaining* like every
other meter, so a full bar is always the good state. A hunger bar filling up would be the
only meter on the screen reading the other way round.

Life support also draws power per head, and the Ledger shows the runway in hours.

**Breaks** are separate from watch rotation, and the distinction matters: a break is short,
taken on watch, and gives back a little of everything; a rotation is a shift change.
Conflating them would mean the only way to let someone catch their breath was to lose their
station for ten minutes.

## 5. Resolve — who can be talked into things

Exactly the mechanic you described. Every crewman rolls a **willpower** value, scaled by
temperament, and it is used in **both directions from the same roll**:

- You persuading them to do something against their nature.
- An enemy influence net — Nexis illusion, a boarding party's negotiator — trying to turn
  them.

A crew of pliable people does what you ask **and** does what the boarding party asks. That
symmetry is the whole point; a resistance stat that only ever helped the player would be a
strictly-better number rather than a characteristic.

Six new traits, spread across both sides of neutral so neither end is simply better:

| trait | resolve | notes |
|---|---|---|
| **Zealot** | ×1.60 | believes something; cannot be talked out of it, by anyone |
| **Iron nerve** | ×1.45 | unmoved by shouting, gunfire or a failing hull |
| **Ascetic** | ×1.20 | needs almost nothing, gives almost nothing away |
| **Natural** | ×1.00 | rare, expensive, worth it |
| **Glutton** | ×0.95 | works like two people, eats like three |
| **Hollow** | ×0.45 | Nexis got to them once; whatever came back is suggestible |

Every trait now carries a line of flavour on the card, and a `needs` multiplier, so
temperament shows up in the stores as well as in the roster.

Persuading someone costs morale whether or not it works — getting your way and being liked
for it are different things.

## 6. Promotion

One **overseer** per ship, level 5 or above. They stop manning a station entirely — that is
the cost, and it is a real one, since you give up your best crewman's department bonus — and
in exchange everyone else works better, learns faster, and eats less, because somebody
competent is finally running the watch bill and the stores.

Scaled by their level, so a level-5 chief is not a level-10 chief. One at a time: two people
in charge is the same as none.

## 7. The two buttons

### ◈ Operations — standing orders

The thing the game most obviously lacked: everything you own was idle unless you were
personally flying it.

| order | crew | takes | risk | brings back |
|---|---|---|---|---|
| **Scout team** | 1 | 4–10h | 16% | materials, standing, a lead — or nothing |
| **Survey crew** | 2 | 8–20h | 10% | a permanent assay bonus on a world |
| **Reclamation unit** | 2 | 6–16h | 22% | bulk salvage, cheap |

Dispatched crew are **off the roster** for the duration — not manning a post, not available
for the fight you did not know was coming. That is the cost, and it is why sending your two
best people is a decision rather than an obvious move.

An order can go wrong. Someone can come back hurt; occasionally someone does not come back
at all. **An errand that always pays is a button, not a system** — and skill lowers the risk,
so a veteran survey officer brings people home.

The survey order is the one that **compounds**: a world a crew has worked pays out better
forever, and every extractor you ever build there is paid on it.

### ⚖ Ledger — finance and trade

Income, upkeep, payroll, provisions and stores were scattered across five panels and one of
them — **site upkeep** — was invisible entirely. That is a bad property for a recurring
cost: a player who cannot find out why their credits are going down will conclude the game
is broken, and they will be right to.

One panel: position, recurring costs, provisions runway, life support draw, the overseer,
contracts held and their value, and standing with all three blocs. Plus a Holdings tab
listing every planetary site with slots, power satisfaction, population and assay.

---

## Verification

**1,531 checks across eighteen suites.** `crew.mjs` grew to 153, `combat.mjs` to 78,
`industry.mjs` to 185, `render.mjs` to 82.

```
 ok   static       85ms  no problems
 ok   core        106ms  56 passed, 0 failed
 ok   flight      202ms  44 passed, 0 failed
 ok   combat      294ms  78 passed, 0 failed
 ok   world       140ms  81 passed, 0 failed
 ok   character   156ms  101 passed, 0 failed
 ok   crew        405ms  153 passed, 0 failed
 ok   economy     132ms  86 passed, 0 failed
 ok   industry    146ms  185 passed, 0 failed
 ok   interface   239ms  62 passed, 0 failed
 ok   render      133ms  82 passed, 0 failed
 ok   netsync      40ms  49 passed, 0 failed
 ok   tools       158ms  55 passed, 0 failed
 ok   run        2525ms  205 passed, 0 failed
 ok   warp-nav   1148ms  7 passed, 0 failed
 ok   ui          207ms  124 passed, 0 failed
 ok   net        2102ms  25 passed, 0 failed
 ok   soak      33135ms  38 passed, 0 failed

18/18 suites green in 41.4s
```

### What the new checks prove

- Lock range is shorter than sensor range; a held lock survives past where it was made; a
  gunship cannot shoot past what it can hold; **a seeker platform reaches further**; nothing
  passes the ceiling. A hostile alongside you builds a lock, **and the lock breaks and the
  contact is dropped once you are ninety thousand units away** — the reported bug, asserted
  directly.
- Muting reports the state it set, the bed refuses to start while muted, and muting is
  harmless with no audio context.
- **An idle hour levels nobody**, one kill beats an idle minute, the department involved
  learns most, everyone aboard learns something, off-watch crew learn nothing.
- An unprovisioned crew gets hungry and thirsty, both capped; hunger lowers output but
  never to zero; provisions feed them and are consumed; the runway is reported; a crewman
  on a break contributes nothing at their post.
- Every trait declares resolve, needs and flavour; **the spread runs both sides of
  neutral**; a zealot is hard to move and a hollow is not; the pliable are talked round more
  often than the stubborn; a resolute crew mostly holds against an influence attempt.
- A junior cannot be promoted, a senior can, an overseer stops manning a post, a better
  overseer is worth more, promoting a second replaces the first, and there is only ever one.
- Every order can go wrong; dispatched crew leave the roster and contribute nothing; the
  board is capped; recalls work; **a crewman flagged as dispatched with no order behind them
  is released** rather than stranded forever.
- Every new crew field survives a save, and a pre-v1.00.30 record arrives **not starving,
  with a workable resolve, and still contributing**.

```sh
node test/all.mjs
npm run test:crew && npm run test:combat
```

## Files

**Added**

| File | Why |
|---|---|
| `src/systems/orders.js` | standing orders — dispatch, risk, resolution, assay |
| `src/ui/ops.js` | the ◈ Operations and ⚖ Ledger overlay |

**Changed**

| File | Change |
|---|---|
| `src/entities/npcs.js` | **lock state machine**; `lockRange()`, `hitRange()`; firing gated on a held solution; drone engagement profile |
| `src/systems/audio.js` | `setAudioEnabled()` mutes the master and suspends the context; the bed refuses to start muted |
| `src/ui/controls.js` | the mute button calls it |
| `src/data/crew.js` | six new traits with resolve, needs and flavour; `willpowerOf`, `needsOf`; hunger, breaks and overseer folded into `crewOutput` |
| `src/systems/crew.js` | `crewEvent()`, provisions, breaks, `promote`/`demote`, `persuade`, `influenceAttempt`, `provisionHours` |
| `src/systems/combat.js`, `mining.js`, `economy.js`, `scanner.js`, `warp.js`, `contracts.js` | fire crew events from the things that generate them |
| `src/systems/planetary.js` | extraction pays on a world's survey assay |
| `src/core/config.js` | `LOCK`, `ORDERS`; `CREW` gains event xp, needs, breaks, willpower, promotion; NPC weapon classes |
| `src/systems/save.js` | crew needs, resolve, breaks and rank; standing orders and assay |
| `src/ui/crew.js` | Fed / Watered / Resolve bars, promote, talk round, provisions warning, trait flavour |
| `src/main.js`, `index.html`, `css/*` | the two buttons and the overlay |

## Compatibility

- **Saves** — schema unchanged at 7. Every save from v0.2 forward loads. Existing crew
  arrive fed, watered, with a workable resolve, nobody promoted and nobody dispatched.
- **Balance** — crew progression is **much** slower unless things are happening, which is
  the point. Provisions are a new running cost; stock nutrient concentrate and water ice
  before a long run. Enemies now disengage properly, which makes running away work.
- **Multiplayer** — wire format unchanged.

## Next — v1.00.40: Solar system & celestial bodies

Carried from the slice plan, now with a reason to care about a world beyond its resources:
atmospheric interference on scans, rings worth mining, lagrange points, deep-space
anomalies, orbital mechanics that matter to navigation, and moons as first-class sites.
