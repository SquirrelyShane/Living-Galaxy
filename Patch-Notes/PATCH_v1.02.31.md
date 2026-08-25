# PATCH v1.02.31 — "Office Deck"

First slice of the Executive arc (v1.02.31 → v1.02.40). The career had a company, a board,
a treasury, a command tree and a fleet — and a cockpit HUD wrapped around all of it,
reading zero throttle and nominal hull for a ship the player does not own. This patch
takes the cockpit away and gives the career a screen of its own. Schema stays **17**.

---

## An executive does not fly. Now nothing in the game thinks otherwise.

The lock was a comment in `data/origins.js` and a missing hull. Everything downstream —
the steering handler, the throttle slider, the key bindings, the gamepad poll, the HUD,
the renderer — was written on the assumption that there is always a ship and the player is
always in it, and a founder inherited all of it.

`src/systems/career.js` is now the one place that answers *may this character fly*:

```js
canPilot()        // false for exactly one career
commandSurface()  // 'flight' | 'command'
```

It is a capability, not a career test at each call site, so the next non-flying path — a
station administrator, a factor — does not have to touch seven files again. And it is read
live off the character sheet, so a save carried across this patch boundary is locked the
moment it loads.

What now asks it:

- **The canopy drag** is refused before it starts a pointer capture.
- **`keyPoll`** returns immediately. This one mattered: keys reach the game whether or not
  a canopy is drawn, so a hidden HUD is not a lock — an executive holding `W` on a desktop
  keyboard was opening the throttle on a hull they do not own.
- **The key/gamepad press table** runs off an allow-list — chart, fit bench, crew roster
  and settings are readable from a desk; the drive, the stick and the docking clamps are
  not. An allow-list rather than scattered guards, so the next action added has to make a
  decision instead of inheriting one.
- **The chart's flight buttons** now distinguish *grounded* from *not licensed*. A docked
  pilot reads `Docked` and can undo it by undocking. An executive reads `Command` /
  `No hull`, because that is not a state they can undo.

## The command deck

`src/ui/execdeck.js` + `css/exec.css`. A whole surface, not a panel: `body.command-surface`
takes the twenty-odd flight-HUD elements off the screen via the stylesheet, and the deck
draws in their place at z-index 40 — under the overlay layer, so Ops, the chart and
Settings still open on top of it exactly as before.

On it: the company and charter, six live cells (treasury, revenue, spend, board
confidence, hulls, hulls on objective), a fleet board that reads each hull's objective and
range, an eight-button action row, and a one-line system summary along the bottom. It ticks
at 1.2 s. It owns no simulation — every number is read from the system that already owns
it, so there is nothing here to keep in step.

## Nothing renders

The deck is DOM and the chart is its own 2D canvas. Neither has a camera view behind it,
so `main.js` now skips the entire presentation block — quality, LOD, the light rig,
interpolation, `render()` — while the command surface is up:

```js
if (!execHudActive()) { …quality/lod/lights/interpolate/render… }
```

The simulation is untouched. The world above that line has already stepped: markets move,
hulls work their objectives, NPCs talk to each other, deals expire. Only *presentation* is
skipped, which is the whole of what "detached from the main game" has to mean for it to be
safe — the galaxy keeps living, nobody is rendering it. `updateHud` is skipped with it,
since it was otherwise spending its full write budget every frame diffing seventy fields
against elements that are `display:none`.

On a phone that is most of the frame budget handed back to a screen that is text.

## The chart comes back now

The reported dead end, exactly: `OPS → Staff → OPEN SYSTEM CHART` closed Ops and opened
the chart with no memory of where it had been. Closing the chart dropped you into the
cockpit, and the only route back to the fleet list was `OPS → Staff → scroll` — every
time. For a career with no cockpit it is worse than a dead end; it is a dead screen.

`openNavmap()` takes an opener contract now:

```js
openNavmap({ pane, returnTo, hideFlight })
```

`returnTo` is captured and cleared before it is called, so a return path that itself
reopens the chart cannot leave a stale one behind — the failure mode where a back button
starts teleporting people. `null` still means the cockpit, which is correct for the `NAV`
key on the flight bar and is the unchanged default.

Ops now offers **SYSTEM CHART** and **LIVE TELEMETRY** side by side, both handing the chart
a path back to the Staff tab.

## Live telemetry

`src/systems/telemetry.js` and a third pane on the chart. The chart could always *draw* the
system; what it could not do was **report** it — selecting a rock told you its ore,
selecting a station told you it had a shipyard, selecting a planet told you to go and orbit
it, three answers of three shapes all assembled inline inside the tap handler.

`feed()` returns four buckets — celestial bodies, stations, traffic in scan range, fields
and rock — each row with a live summary line. `detail()` returns the full record for one
object. Both are DOM-free, so ARIA can read the same feed and the suite can assert it
headlessly.

The gating is the part worth stating:

- **Ephemeris is chart data.** Where a body is, its orbit radius, its period, its class —
  never gated. You can read an ephemeris off a desk.
- **Everything else is a sensor return.** A station's service list resolves at composition
  or better. A contact's hull and rated speed at composition; its manifest, armament and
  bounty at detailed assay. Below that, the panel is *shorter* and says why, rather than
  showing a column of em dashes — a field reading "—" looks like a broken instrument,
  where a short panel plus a note reads as the limit of the dish.
- **Traffic obeys the same detection maths the chart plots with**, so the list and the map
  can never disagree about what is out there. The suite asserts that count against the
  model rather than against a number.

The pane refreshes twice a second; an open detail record refreshes with it, because the
whole claim of the screen is that the numbers are current.

---

## Files touched

**New**

- `src/systems/career.js` — the flight-licence capability
- `src/systems/telemetry.js` — the live feed and the per-object record
- `src/ui/execdeck.js` — the command deck
- `css/exec.css` — the command surface, the telemetry pane, the detached chart
- `test/execdeck.mjs` — 81 checks

**Changed**

- `index.html` — deck markup, telemetry pane and tab, `css/exec.css` link
- `src/main.js` — deck boot, the render gate, the HUD fork, `LG.exec`
- `src/ui/navmap.js` — opener contract, telemetry pane, licence-aware buttons
- `src/ui/ops.js` — two chart entries, both with a return path
- `src/ui/controls.js` — the flight lock on drag, keys, gamepad and held actions
- `src/core/version.js` — 1.02.31 "Office Deck"
- `test/all.mjs` — registers `execdeck`
- `test/ui.mjs` — asserts the lock, then restores a pilot for the flight checks
- `docs/SLICE_PLAN.md`, `docs/OPEN_ITEMS.md`, `CHANGELOG.md`

## Verified

`node test/all.mjs` — **43/43 suites green**, 48 s.

- `execdeck` 81/81 — the lock across three careers and a live sheet change; the deck up,
  down and refused to a pilot; the return path firing once, not twice, and not on a
  reopened chart; Ops → chart → Ops end to end; the four feed buckets; traffic count
  against the detection model; the resolution gate asserted at tier 0, 2 and 3, including
  that an unresolved contact leaks neither role nor hold; the pane through its real
  selection handler.
- `ui` 146/146 — now includes an executive canopy drag that moves nothing and leaves no
  drag flag. This suite was previously steering a founder's non-existent hull, because the
  ops section above it leaves an executive on the sheet and nothing objected.

## Not verified — staged, not measured

- **The render saving is reasoned, not profiled.** The presentation block is provably
  skipped and the suite asserts the flag `main.js` branches on, but nobody has put a phone
  on a meter. Expect it to be large; do not quote a number.
- **The deck has not been looked at on a real screen.** `test/layout.mjs` does arithmetic
  on the flight HUD's declared values and knows nothing about `exec.css`. Extending it to
  the deck is a candidate for .32.
- **Undock is still reachable** for an executive through the station interface. It is
  inert — there is no hull — but it should say so rather than be pressable. Ops relayout
  in .32.

## Next, in this arc

- **.32 — the Ops relayout.** Contract, commission, build, corp and fleet as first-class
  tabs on a surface that is not a flight overlay, plus the detailed statistics panel for a
  selected target reached from the chart.
- **.33 — the deck under `test/layout.mjs`**, and the undock path closed properly.
