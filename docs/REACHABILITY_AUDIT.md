# Reachability audit — what exists but cannot be reached

> **Superseded as a status document.** Everything below is the *reasoning* and stays as
> written. For what is actually open, closed or in progress, read **`docs/OPEN_ITEMS.md`**,
> re-verified against the live tree at v1.01.98. Where this file and that one disagree, that
> one is right — it is grepped, this one is remembered.
> Known stale here: the inert-config table below lists four keys. The scan that produced that
> number was under-reporting; fixed at v1.01.97, which found **fifteen**. Nine were deleted at
> v1.01.98 and **six** remain — see bucket D of `OPEN_ITEMS.md`.
> `POINTDEF.perRound`, `SEEKER.reacquire` and `CREW.moraleWin` are no longer inert;
> `cancelJob`, `cyclePalette`, `checkMaterials`, `setDuty` and `rotateWatch` are all resolved
> or reclassified, and the `BACKLOG` is empty.

---

Run at v1.01.00. This is not a wishlist of things to build; it is a list of things that are
**already built, already tested, and already green**, which a player has no way to do.

The pattern was named in the v1.00.70 patch note — *a mechanic without a screen is not
shipped* — and then it happened three more times, because nothing was checking for it. A
green suite measures whether the code does the thing. It does not measure whether anyone can
ask it to.

## How this was found

Two scripted passes over the tree, then verification by hand:

1. Every exported function, cross-referenced against every import and call site in `src/`
   and in `test/`. The interesting bucket is **exported, imported by a test, called by
   nothing in `src/`** — a feature with a proof and no path.
2. Every key of every exported config object, cross-referenced against reads outside
   `config.js`. A tuning number nobody reads is a decision that is not being made.

Both scripts over-report (a method-style call looks like a use), so everything below was
confirmed by direct grep before it was written down.

---

## Unreachable: no player action leads here

### Deep-space anomalies — the whole feature (v1.00.50)

`investigate()` in `systems/lagrange.js` has **no caller anywhere in `src/`.**

Lagrange points chart, appear in the contact list under their own tab, scan, and report what
is on station. Working the site — the thing all of that exists for — can only be done by the
test suite. Six anomaly types, their reward tables, the one-shot rule, the schema-10
migration that persists which are spent: all reachable only from `test/celestial.mjs`.

*Fixed in v1.01.10: the target panel's PROBE button becomes WORK SITE on a Lagrange point.*

### Player-posted contracts (v1.01.00)

`postPlayerJob()` and `suggestedFee()` in `systems/deals.js` have no caller in `src/`.

The ledger works, haulers accept jobs on their own terms, settlement pays out. There is no
screen that lets a pilot put a job on the band, so the half of this feature that makes the
player a *party* rather than an audience is code only.

*Fixed in v1.01.10: a freight board in the dock panel posts out of your own hold.*

### The planetary layer had no front door at all (v1.00.20)

This is the one the scripted check found and I did not: **`foundSite()` was called by
nothing but the `LG` developer handle in `main.js`.** Not a panel, not a button — a browser
console.

So the entire planetary industry layer — command centres, facilities, extraction, storage,
the assay, the site managers, the autonomy rungs — was reachable only by a player who opened
devtools and knew the handle existed.

And it retroactively explains something. The moon bug fixed in v1.00.40 — *"no moon in the
game could ever be built on"* — was a refusal inside a code path **no player could invoke.**
I fixed the second gate while the first one did not exist, wrote a patch note about it, and
never noticed. That is the single strongest argument for the check being automated rather
than remembered.

*Fixed in v1.01.10: the Ops panel now offers command centres for the world you are orbiting.*

### The planetary operating layer (v1.00.20)

Five further exports in `systems/planetary.js` with no caller: `upgradeCentre`,
`abandonSite`, `collectFrom`, `deliverTo`, `manufactureAt`.

`ui/ops.js` renders `siteReport()` and `empireReport()` — you can *look* at a planetary
complex in detail. You cannot upgrade its command centre, take the output, feed it, run a
manufacturing job on it, or shut it down. The industry layer is a read-only dashboard over a
simulation the player kicked off once and can no longer touch.

This is the largest gap in the game by some distance, and unlike the two above it is not a
button — it is a panel with five actions, their preconditions, and their failure messages.

*Cost to fix: a slice.*

### Crew management verbs (v1.00.30)

`setDuty`, `rotateWatch`, `influenceAttempt`, `reassign`, `clearPost` — no callers.

`ui/crew.js` hires, dismisses and retrains. It cannot put somebody on or off duty, rotate a
watch, move a crew member to a different post, or spend the influence mechanic on anything.
The fatigue and morale simulation those verbs exist to let you manage runs regardless.

### Smaller ones

| what | where | note |
|---|---|---|
| `cancelJob` | `systems/crafting.js` | a manufacturing job, once queued, cannot be stopped |
| `cyclePalette` | `systems/display.js` | colour-blind palettes exist; nothing switches them |
| `checkMaterials` / `shortfallText` | `systems/crafting.js` | "what am I missing" is computed and never shown |
| `influenceAttempt` | `systems/crew.js` | see above |

---

## Config declared and never read

Each of these is a tuning knob that does nothing. Either the behaviour it was meant to
control was never written, or it was written against a hardcoded number instead.

| block | key | what it implies is missing |
|---|---|---|
| `POINTDEF` | `perRound` | point defence has no per-round cost — it fires free |
| `SEEKER` | `reacquire` | a seeker that loses lock never tries to regain it |
| `ORDNANCE` | `stackScale` | the magazine lever from v1.00.60 was never wired |
| `CREW` | `moraleWin` | winning a fight does not lift the crew |
| `ADVANCED` | `outOfCombat` | an out-of-combat state is declared and never tested |
| `POP`, `SUPPLY` | `interval` | both loops run on their own cadence, not the configured one |

`POINTDEF.perRound` and `CREW.moraleWin` are the two worth acting on: both name a
consequence that the player would feel and that the surrounding system already has the state
for.

---

## What this says about the process

Three of the four large gaps were introduced by slices whose patch notes I wrote myself, and
two of them I flagged honestly in the *"not verified"* section at the time — and then went on
to the next slice anyway. Flagging a gap is not the same as not shipping it.

The concrete change worth making: **a slice that adds a player-facing verb does not close
until something calls it.** The suite cannot enforce that on its own — a test calling a
function is exactly the false positive that hid these — but a reachability pass like the one
in this document is cheap and could run per slice rather than per year.

The narrower version is enforceable, so it now exists: `test/reachability.mjs` reads the
source rather than running it, and asserts that every registered player-facing verb is
either wired or on a written-down backlog. It requires both an import *and* a call — a bare
text match reported `reassign` as wired because two unrelated files used the word in prose.

It earned its place immediately: it found `foundSite`, which this document did not.

---

## Priority

1. **`investigate` on the target panel** — one branch, and it makes an entire shipped slice
   playable. Doing this first is not cherry-picking the easy one: it is the highest ratio of
   restored feature to code in the tree.
2. **Post a job at a dock** — completes the half of the ledger that makes the player a party.
3. **The planetary operations panel** — the largest, and its own slice.
4. **Crew duty verbs** — smaller than 3, same shape.
5. **The two live config knobs** (`POINTDEF.perRound`, `CREW.moraleWin`).


---

## Postscript — v1.01.20, after the backlog was cleared

Two of the five entries above were wrong, and the correction matters more than the fixes.

`setDuty` and `rotateWatch` were never unreachable: the crew panel calls `toggleDuty()`,
which wraps `setDuty()` in the same module, and `rotateWatch()` runs on the crew tick under
the auto-rotate setting. The registry named the inner function. **A fabricated gap is the
more expensive failure** — it costs a slice chasing something that already works, and an
audit that cries wolf gets ignored the way a flaky test does.

`cyclePalette` was a helper nothing needed, not a feature nobody could reach. Same for
`POINTDEF.perRound`, which was a constant with one correct value rather than a lever.

`test/reachability.mjs` now distinguishes genuinely unreachable, reachable under another
name, and declared-but-never-triggered. Only the first belongs in a backlog.

The check also found eight planetary verbs that this document missed — `installFacility`,
`toggleFacility` and `removeFacility` were never in the registry at all. That remains the
honest limit: **the registry catches a verb that is listed and unwired, not one that is
written and never listed.**
