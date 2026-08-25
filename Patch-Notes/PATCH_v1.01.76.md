# PATCH v1.01.76 — "Over the Shoulder"

The chase camera gets an aim. It had a position and no orientation of its own, which is
why it read as the forward view with a thruster in it. Two new suites: `camera` for the
framing geometry, and `screens` for drawing the static menus as coloured panels in
Termux. Save schema stays **16**.

---

## The bug

`entities/player.js` placed the chase camera like this:

```js
_tmp.copy(p.position).addScaledVector(_fwd, -42);
_tmp.y += 13;
camera.position.copy(_tmp);
...
camera.rotation.y = p.yaw;      // ← the cockpit's orientation, unchanged
camera.rotation.x = p.pitch;
```

The position was right. The camera really was 42 units behind the hull. But the
orientation was the cockpit's, so the camera looked *straight past* the ship rather than
at it, and the 13-unit rise was in world Y while the setback was along the nose. Two
consequences:

| attitude | ship's angle off the view axis | camera standoff |
|---|---|---|
| level | **17.2°** below centre | 44.0 |
| pitch 17° | 18.0° | 40.1 |
| nose up, at the 86.4° limit | 1.6° | **29.0** |
| nose down, at the limit | 0.9° | **55.0** |

At level flight — where you spend nearly all your time — the hull sat 17° low with the
whole upper two-thirds of the screen showing the space ahead. Technically inside the
frustum; visually the cockpit view with a plume in the bottom of the frame. That is
exactly the report: *front facing view but with thrusters shown, not what's actually
behind them.*

The second column is the other half. Because the rise was in world Y and the setback along
the nose, the two fought as you pitched: the camera swung between 29 and 55 units against
a nominal 42, closing right up as you pulled the nose vertical.

## The fix

Three changes, all in the chase branch:

1. **Offset along the ship's own up**, derived as `(fwd × worldUp) × fwd`, with a fallback
   when the nose is within a whisker of vertical and the cross product degenerates. The
   standoff is now constant at 44.0 across the whole attitude envelope.
2. **Aim the camera.** `aimAngles()` — already in `core/utils.js` as the documented
   inverse of `forward()` — converts the camera-to-target direction into the yaw/pitch
   pair the YXZ camera wants.
3. **Aim ahead of the nose, not at the hull.** Dead-centre framing hides where you are
   going. Aiming at a point 18 units ahead puts the ship about 5° below centre: clearly
   the subject of the shot, with the space you are flying into still on screen.

The three numbers are `FLIGHT.chaseBack`, `chaseUp` and `chaseLead` in `core/config.js`,
so the framing is tunable without touching the geometry.

The cockpit branch is unchanged and pinned by the suite: camera at the ship, the pilot's
own yaw and pitch, no hull drawn.

---

## Added — `test/camera.mjs` (33 checks)

The chase branch had no coverage at all, and could not have had any: the test stub's
`Euler` had no `.set()`, so `shipMesh.rotation.set(...)` threw the moment a suite turned
chase on. Adding `Euler.set` and `Vector3.cross`/`dot` to `test/stub.mjs` is what made
this suite possible — worth knowing, because it means anything else touching mesh
orientation was equally unreachable until now.

Samples five yaws against seven pitches including both pitch limits, and checks the camera
is never in front of the ship, the standoff holds within 2 units across the envelope, the
ship stays within 10° of the view axis, and the plume's 8–26 unit trail ends short of the
camera rather than washing across the frame.

## Added — `test/screens.mjs` (29 checks)

Draws the static screens as coloured, box-drawn panels sized for a phone terminal, so a
slice can be eyeballed in Termux without serving the game and switching to Brave. Title,
character creation, the Ops staff desk in both its states, the full command dialogue tree,
and a live fleet board.

```
node test/screens.mjs             colour, width from the terminal
node test/screens.mjs --plain     no escape codes
node test/screens.mjs --width=38  force a width
```

It is a test as well as a picture — drawing a screen means walking its data. What that
walk asserts: every career has a name, icon, description and a hull class that exists;
every command branch has a submenu and every submenu a leaf; every leaf label fits the
34-character portrait budget (widest today is 32, `"Passive extract — until recalled"`);
every drawn line fits the panel; no line opens a colour it does not close.

Two details worth keeping: width comes from `process.stdout.columns`, clamped to 30–64 and
defaulting narrow, and character width is counted in *terminal cells* rather than code
points — the career icons include emoji, which are two columns wide, and counting them as
one puts every row with an icon in it one character out.

Under `all.mjs` it runs `--plain --quiet`, so the aggregate log stays readable. The panels
are still built under `--quiet`; only the printing is suppressed, because the last block of
assertions checks the drawing itself.

---

## Files touched

| File | Change |
|---|---|
| `src/entities/player.js` | ship-relative up, aimed chase camera, scratch vectors |
| `src/core/config.js` | `FLIGHT.chaseBack` / `chaseUp` / `chaseLead` |
| `src/core/version.js` | 1.01.76 "Over the Shoulder" |
| `test/camera.mjs` | **new** — 33 checks |
| `test/screens.mjs` | **new** — 29 checks |
| `test/stub.mjs` | `Euler.set`, `Vector3.cross`, `Vector3.dot` |
| `test/all.mjs` | both suites registered; per-suite args |
| `package.json` | version; `test:camera`, `test:screens` |
| `README.md`, `CHANGELOG.md`, `Patch-Notes/PATCH_v1.01.76.md` | this slice |
| `docs/OPEN_ITEMS.md` | the incorporation gap, below |

---

## Verified

- `node test/all.mjs` — **35/35 suites, 2,798 checks, 0 failed.**
- `node test/camera.mjs` — 33/33; camera distance 44.0 across all 35 attitude samples,
  worst off-axis 5.0° against 17.2° unaimed.
- `node test/screens.mjs` — 29/29 in colour and in `--plain`, at widths 38, 40 and 44.
- `node src/npc-avatar/test/run.mjs` — 8/8.

## Not verified

**Nothing here was seen in a browser.** The camera fix is geometry, and geometry is what
the suite checks: that the ship is near the view axis at a stable distance. Whether the
resulting shot *looks* right — how much hull fills the frame, whether 18 units of lead is
the right amount — is a judgement only the device can make. If it sits too low or too far,
`chaseUp` and `chaseLead` are the two numbers to move, and neither needs a code change.

---

## On the executive gameplay

Not a bug, and not something v1.01.75 broke. `foundCompany()` is called from exactly one
place — `createCharacter()`, when the chosen career carries a charter — and the only
career that does is **`executive`**. Everything the last four slices added is gated behind
`hasCompany()`: the Staff desk, the fleet board, the command tree, the ARIA fleet tools,
the HQ spawn.

So a character created on any other career sees none of it, and a save made before
v1.01.72 has no company record to find. The Ops → Staff tab falls straight through to the
managers section, which is itself off by default, which is why the tab reads as empty
rather than as locked.

To see it: **new character → career → Executive.** You will spawn docked at a
charter-matched station with a treasury, a board, and the command tree under Ops → Staff.
`test/screens.mjs` draws both states side by side if you want to confirm before you start.

The real gap, now filed: **there is no way to incorporate after character creation.** One
choice at creation permanently decides whether a save can ever reach the executive layer,
and no in-game surface can undo it. That wants a slice — a station-side charter
registration, most likely — and it is a design decision rather than a fix, so it is in
`docs/OPEN_ITEMS.md` rather than in this patch.
