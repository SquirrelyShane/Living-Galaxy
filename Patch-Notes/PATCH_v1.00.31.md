# PATCH v1.00.31 — "Preflight"

Save schema **7 → 8** (migration included). 1,545 checks across nineteen suites, all green.

---

## 1. The gun that was not there

**A ship with empty hardpoints could fire.** This is the headline fix and it had three
layers, which is why it survived eighteen test suites.

| Layer | What it did |
|---|---|
| `createCharacter()` | Set `S.weapon` and `S.ownedWeapons`, but never wrote the key into `S.fit.weapon[0]`. Every new pilot launched with an empty rack. |
| `resolveWeapon()` in `core/state.js` | Fell back to the legacy key, then to the hull class's nominal weapon. `weaponDef` was therefore never null. |
| `updateWeapons()` | Fell back to `[st.weaponDef]` whenever `mounts` was empty. |

So the trigger resolved a weapon that was not installed, and fired it.

Fixed at all three:

- The yard now actually installs the gun. New `seatWeapon(key)` in `core/state.js` bolts a
  weapon into the first free hardpoint; character creation calls it, and `systems/economy.js`
  now delegates to the same function instead of keeping a second private copy. Two
  implementations of "install a gun" is how a ship ends up able to fire one it does not have.
- `weaponDef` is strictly *hardpoint one*, and is **null** on an empty rack.
- `st.mounts` is the armament at the trigger. No fallback.

## 2. Interlocks — `src/systems/preflight.js`

The fix above is a one-liner. The *reason* it was possible is that every critical action
made its own ad-hoc guard, so there was no place a missing precondition could be named.

One module now answers "can the ship do this, and if not, why not":

```js
canFire() · canFireMount(w) · canMine() · canWarp() · canScan(obj) · canProbe() · canDock()
→ { ok, code, reason }
```

- **Pure.** Verdicts change nothing, so the HUD can call them every frame.
- **Coded, not phrased.** `code` is stable and machine-readable (`nofit`, `nogun`, `nolock`,
  `energy`, `hull`, `disabled`, `docked`, `warp`, `nocutter`, `noprobes`…). `reason` is the
  sentence a pilot reads. Tests, ARIA, the HUD and the tutorial all key off the code.
- **Ordered by severity.** "No weapon fitted" beats "insufficient energy", because fixing
  the energy would not help.
- `announce(v)` is rate-limited per code (`INTERLOCK.repeat`), so a held trigger says one
  thing once instead of screaming sixty times a second.
- `interlockReport()` / `interlockLine()` for diagnostics — `LG.interlocks()`.

Wired through `weapons.js`, `mining.js` and `warp.js`. Two genuinely new interlocks fell
out of doing it properly: a hull class with no cutter rating cannot mine at all, and a hull
below `INTERLOCK.cutterHullFloor` (18%) locks the cutter arm out — a beaten-up ship now
stops working *before* it dies.

## 3. Nobody hunts a nobody

`playerEligible()` was `kills >= 1 || credits > 2500`. Starting credits are already above
that for most lineage/corp pairs, so a pilot who had done nothing but undock could have a
mercenary on them inside the first minute — before they had a gun fitted.

Being wealthy at creation is a character sheet, not notoriety. Eligibility is now earned on
two independent tracks, plus a floor:

- **Time** — `TUTORIAL.graceContract` (7 min) of actual flying, or
- **Deeds** — `TUTORIAL.graceKills` (2) kills short-circuits the clock entirely, and
- **Floor** — a notoriety count (kills + claim trespasses) of at least `minNotoriety`.
  A clean record is never hunted no matter how long you have been out.

Training is a hard shield: no contract while it is running.

New: **trespass tracking.** Six continuous seconds inside a pirate claim counts as an
incursion — a thing you did, weighted like a kill. Persisted.

## 4. Flight training — `systems/tutorial.js` + `ui/tutorial.js`

Seven stages. Not a script: each names a **condition** and the world is checked every
`TUTORIAL.checkInterval`. A pilot who happens to already be mining closes the mining stage
on the same tick it opens.

`arm → fly → lock → mine → sell → crew → threat`

- Never blocks. No modal, no forced click, no disabled control.
- Can be put away (`–` keeps it tracking, `✕` ends it for good).
- A hint line appears only after `TUTORIAL.hintDelay` on a stage — a player who gets it
  immediately never sees it.
- **It ends by asking.** Completion offers *carry on flying* or *start a new game*, and
  both are real. `finish()` returns an outcome rather than acting, so `main.js` owns what
  "new game" means (flush → wipe → reload, landing on the creation screen).
- Only ever offered to a genuinely new pilot. Restorable from Settings → Lab.

## 5. Comms — `systems/comms.js` + `ui/comms.js`

The log was a place the game printed at you. It is now a place people talk.

- **Traffic comes from the world.** Every ambient line is spoken by a ship that actually
  exists within `COMMS.range`, doing the thing the line is about. A miner talks about ore
  because it is mining.
- **NPCs answer each other.** When someone transmits, anyone else in range with an opinion
  may chime in, and the opinion depends on faction — a pirate taunt draws a patrol reply,
  a distress call draws a volunteer or a vulture.
- **Replies cost something.** Hails carry 2–4 options with standing attached, they expire
  after `COMMS.replyWindow`, and *say nothing* is always available.
- Channels: local / trade / distress / company, with filters and an unread badge.
- Three canned hails wired into the world: the mercenary who took the contract on you, a
  bastion warning you out of claimed space, and anyone losing a fight in earshot.

## 6. The executive start

A sixth career. Every other one hands you a hull and a person with work; this one hands you
a **charter**.

- `systems/company.js` — treasury separate from your wallet, five charters, three board
  seats deliberately in tension (Expansion / Solvency / Charter), confidence, and dividends
  paid out of retained profit rather than out of the treasury floor.
- In-charter operations book at `COMPANY.charterBonus`.
- New agent: Registrar Ada Okarie, with per-lineage greetings.
- New three-step mission chain judged on the company's books, not the pilot's hull.
- Capitalise / draw from Operations → Staff.

## 7. Automated subsystems — experimental branch

`data/managers.js` + `systems/managers.js`, behind `MANAGERS.enabled`, **off by default**.
Toggle in Settings → Lab or `LG.experimental(true)`.

One archetype per branch, and the design constraint was that they must not be the same
person in a different hat:

| Branch | Archetype | Objective | Behaviour |
|---|---|---|---|
| industrial | Foreman | throughput | Runs hot. Accepts a brownout to keep a smelter fed. |
| military | Garrison Officer | readiness | Holds power in reserve. Produces less rather than be caught cold. |
| logistic | Quartermaster | flow | Hates a full store more than an idle line. Throttles extraction to stop a jam. |
| economic | Factor | margin | Idles anything whose upkeep outruns its output. Leaves slots empty if the numbers say so. |
| civilian | Administrator | stability | Habitation first. Lowest output, most durable site. |

Each declares an **objective**, scoring **weights**, per-archetype **tolerances**, an
**ordered policy list**, and an **optimisation pass**.

Why ordered policies rather than a solver: a solver would find the optimal site and there
would be nothing left to decide. Walking a list and applying the first policy that fires
buys three things worth more than optimality —

1. **Explainable.** Every action carries the policy that caused it, so the panel says
   *"idled the smelter — preventJam"* rather than *"changed"*.
2. **Genuinely different.** A Foreman and a Factor hit different policies first on the same
   brownout and take opposite actions.
3. **Cheap.** One pass per game hour, twenty sites, nothing on a phone.

Every `MANAGERS.optimiseEvery` passes, a full re-optimisation re-scores the whole site
against that archetype's weights and re-seats what is on and off. That is the per-manager
tuning the branch is for.

**Autonomy is a separate axis** (0 advisory · 1 balance · 2 build · 3 full) so you can take
a manager whose judgement you like and keep the chequebook. At autonomy 0 the log fills
with *"would: …"* lines and nothing is touched.

The hiring screen shows every archetype's **audition** on the site: their score for it, and
the first thing they would actually do.

Turning the flag off is always safe — managers go inert, sites keep every facility.

---

## Persistence

Schema 8 adds `tutorial`, `comms`, `company`, `managers`. The v7 → v8 migration marks an
existing save's training **done and skipped**: a pilot mid-flight has demonstrably worked
the game out, and dropping a seven-step checklist on them would be an insult. A pending
hail is deliberately *not* saved — resuming three days later into a live reply window from
a ship that no longer exists is worse than losing the exchange. Managers whose site is gone
are reconciled away on load.

---

## Files

**New** — `systems/preflight.js`, `systems/tutorial.js`, `systems/comms.js`,
`systems/company.js`, `systems/managers.js`, `data/managers.js`, `ui/tutorial.js`,
`ui/comms.js`, `test/preflight.mjs`

**Changed** — `core/state.js`, `core/config.js`, `core/version.js`, `systems/weapons.js`,
`systems/mining.js`, `systems/warp.js`, `systems/worldsim.js`, `systems/character.js`,
`systems/missions.js`, `systems/economy.js`, `systems/save.js`, `data/origins.js`,
`data/planetary/branches/index.js`, `ui/hud.js`, `ui/ops.js`, `ui/settings.js`, `main.js`,
`index.html`, `css/overlays.css`, `package.json`, `test/all.mjs`, `test/run.mjs`,
`test/industry.mjs`

## Three existing assertions changed, and why

These were not adjusted to make a build pass — each asserted the old, wrong behaviour:

1. `test/run.mjs` — *"locked hostile took damage"* fired without anything mounted. It now
   arms the ship first, and a new assertion proves an empty rack fires **nothing**.
2. `test/run.mjs` — *"mounted weapon drives ship stats"* read `weaponDef`, which the old
   build resolved from the hull class on an empty rack, so it passed on a bare ship. It now
   asks `mounts` directly.
3. `test/industry.mjs` — the two schema assertions were pinned to `7`.

## Console

```
LG.interlocks()      every gate at once, with codes
LG.interlockLine()   one line naming what is offline
LG.tutorial()        training state + current blockers
LG.comms()           log summary, who is in voice range
LG.company()         the books and the board
LG.managers()        every manager, its score and its action log
LG.auditions(siteId) what each archetype would do with a site
LG.experimental(true|false)
```
