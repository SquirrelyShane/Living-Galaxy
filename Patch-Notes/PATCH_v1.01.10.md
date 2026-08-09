# PATCH v1.01.10 — "Reach"

Not a feature slice. An audit of **what already exists, is already tested, is already
green — and which a player has no way to do.** Three of those closed; the rest written down
and made enforceable. No schema change. 27 suites, **2,286 checks**, all green.

Full findings: `docs/REACHABILITY_AUDIT.md`.

---

## Why this was worth a slice

The pattern was named in the v1.00.70 patch note — *a mechanic without a screen is not
shipped* — and then it happened three more times, because nothing was checking for it.

A green suite measures whether the code does the thing. It does not measure whether anything
*asks* it to. And a test importing a function is exactly the false positive that hides it:
`investigate()` had a hundred lines of coverage and no button.

---

## How the gaps were found

Two scripted passes, then verification by hand.

1. Every exported function cross-referenced against every import and call site in `src/` and
   `test/`. The interesting bucket is **exported, imported by a test, called by nothing in
   `src/`** — a feature with a proof and no path.
2. Every key of every exported config object cross-referenced against reads outside
   `config.js`. A tuning knob nobody reads is a decision that is not being made.

---

## The one I did not find

The scripted check found `foundSite`. I did not, in a hand audit of the same tree, an hour
earlier.

**`foundSite()` was called by nothing but the `LG` developer handle in `main.js`.** Not a
panel, not a button — a browser console. So the entire planetary industry layer shipped in
v1.00.20 — command centres, facilities, extraction, storage, the assay, site managers,
autonomy rungs — was reachable only by a player who opened devtools and knew the handle
existed.

And it retroactively explains something I wrote a patch note about. The moon bug fixed in
v1.00.40 — *"no moon in the game could ever be built on"* — was a refusal inside a code path
**no player could invoke.** I fixed the second gate while the first one did not exist,
described it as a live bug, and never noticed the door was missing.

That is the strongest argument in this patch for the check being automated rather than
remembered.

---

## What was closed

**Deep-space anomalies are workable.** The target panel's `PROBE` button becomes `WORK SITE`
on a Lagrange point. One button, two verbs, chosen by what is under the reticle — a second
button hidden 95% of the time would be worse. It appears only when the site is resolved,
unworked and in range: the same three gates `investigate()` enforces, *shown* rather than
discovered by being refused.

Six anomaly types, reward tables, the one-shot rule and a schema migration shipped in
v1.00.50, all previously reachable only from `test/celestial.mjs`.

**A job can be posted.** A freight board at any dock, posting out of your own hold — freight
you are carrying, moved by somebody else, to somewhere you are not going. That is the case a
pilot actually has, and the one the ledger was built for. The fee is quoted before you
commit, and the ore leaves the hold when a hauler takes it.

**A command centre can be planted.** The Ops panel offers what will sit on the world you are
in orbit around, with the reason on the button when it will not.

---

## `foundBlocker()` — and why it is not a refactor

The founding rules exist twice now: once inside `foundSite()`, which refuses, and once in
`foundBlocker()`, which explains. That is deliberate and it is not a duplication to be tidied
away later.

`foundSite()` still performs every check itself. `foundBlocker()` is a *second reader* of the
same rules, never a replacement — because a UI that gates on a stale copy of a rule is worse
than a UI that does not gate at all: it hides the action rather than explaining it, and the
player has no way to find out why.

---

## `test/reachability.mjs`

Reads the source rather than running it. For every registered player-facing verb — something
a pilot *decides* to do, not a query or a tick — it asserts that some file under `src/` both
imports and calls it.

**Both halves matter.** A bare text match reported `reassign` as wired because two unrelated
files used the word in prose.

**The backlog is part of the test.** Some gaps are a slice of work rather than a button, so
they are listed with the audit entry that tracks them. The assertion is not "everything is
wired" — it is *"every verb is either wired or on a list somebody wrote down"*, which is the
strongest thing that can be true today and still fails loudly the moment a new verb appears
with neither. The backlog is also checked for accuracy in the other direction: an entry that
has since been wired must be removed, so the list cannot rot into a permanent excuse.

It also prints the inert config keys, which do not fail the suite but cannot grow unnoticed.

---

## Still open, and now written down

| gap | shape |
|---|---|
| planetary operating layer — `upgradeCentre`, `abandonSite`, `collectFrom`, `deliverTo`, `manufactureAt` | a panel with five actions. The largest gap left; you can found a site and look at it, not run it |
| crew verbs — `setDuty`, `rotateWatch`, `influenceAttempt` | the fatigue and morale simulation runs and cannot be managed |
| `cancelJob` | a queued manufacturing job cannot be stopped |
| `cyclePalette` | colour-blind palettes exist; nothing switches them |

**Inert config:** `POINTDEF.perRound` (point defence fires free), `SEEKER.reacquire` (a
seeker that loses lock never tries again), `CREW.moraleWin` (winning a fight does not lift
the crew), `ORDNANCE.stackScale`, `ADVANCED.outOfCombat`, `POP.interval`, `SUPPLY.interval`.
The first three each name a consequence the player would feel, in a system that already
holds the state for it.

---

## Files

**New** — `docs/REACHABILITY_AUDIT.md`, `test/reachability.mjs`, `PATCH_v1.01.10.md`

**Changed** — `src/ui/hud.js`, `src/ui/dock.js`, `src/ui/ops.js`,
`src/systems/planetary.js`, `src/core/version.js`, `index.html`, `package.json`,
`test/all.mjs`, `README.md`, `CHANGELOG.md`

---

## Verified vs not

**Verified:** all three closed verbs have a caller in `src/ui/`, asserted by name so a
regression says which one; the verb registry matches what the modules actually export, so a
rename cannot silently stop checking something; the backlog matches reality in both
directions; and every existing suite still passes with the founding and freight sections
rendering.

**Not verified:**

- **None of the three new surfaces has been used on a phone.** The freight board adds up to
  four rows plus in-transit lines to a dock panel that was already long; the founding section
  adds a card per eligible command centre to the Ops sites tab. Both are appended to panels
  whose length nothing measures.
- **The freight board posts ore only.** Salvage and data are in the hold and in the
  commodity table and are not offered, for no better reason than that ore was the case I
  tested.
- **The verb registry is hand-maintained.** It catches a verb that is *listed* and unwired.
  It cannot catch one that is written and never listed — which is exactly how `foundSite`
  hid for four slices. Making the registry itself derived is the obvious next improvement and
  I do not have a clean rule for what counts as a verb.
