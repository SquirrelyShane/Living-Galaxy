# PATCH v1.02.20 — "Watchfloor"

The system chart becomes an instrument you can use without a ship. Schema stays **17**.

---

## It was one line, and it was the wrong idea

```js
export function openNavmap() {
  if (S.docked) return;
```

The chart was a cockpit instrument. Docked, it silently did nothing — so the button added to
Ops in v1.02.10 opened nothing at all for an executive standing on the office deck, which is
the only place an executive stands. Worse for a founder, who now starts with no hull: the one
screen that would tell them what is out there was gated on being out there.

Viewing, scanning and tracking are instrument work. Warping, approaching and orbiting are
flying. The chart now opens either way and the two halves are separated:

- **Warp**, **Approach** and **Orbit** are disabled on a pad, with the Warp button reading
  `Docked` rather than sitting there enabled and failing when pressed.
- **Scan** and **Lock** work. Selecting a contact works. Panning, zooming, filters and the
  key work.
- The Detail pane opens with `Observation — <station>` and says where you are watching from.

## Docked, you are watching on the station's array

This is the part worth more than the fix. `services.sensorRange` has been on every station
since the service table was written — 1,800 km base, and the `sensor` module upgrades it by
+2,200. **Nothing has ever read it.** A station could be fitted with a better array and see
exactly as far as before.

It reads now. `scanOrigin()` in `systems/scanner.js` returns the eye the whole game looks
through: docked, the station and its array; flying, the ship and its own dish. Three
consumers switched over in one move:

- the chart's scanner ring, rock plotting, traffic plotting and distance readouts,
- `liveTier()`, so a scan launched from a pad is resolved from the array,
- the HUD contact list, so what you can see on the chart and what is in the contacts panel
  are the same claim.

The consequence is the right way round: **the view from the office deck is wider than the
view from the cockpit**, and fitting a sensor module to your own station widens it further.
A founder with no hull is not blind; they are looking through something bigger than a ship.

That is one off the inert-config list in bucket D — and it was the interesting kind. Not a
knob nobody had wired, but a *capability* the station-module system already sold you.

## Files touched

| file | change |
|---|---|
| `src/systems/scanner.js` | `scanOrigin()`; `liveTier()` resolves from it |
| `src/ui/navmap.js` | opens while docked; observation mode; ring, rocks, traffic and distances read the eye |
| `src/ui/hud.js` | the contact list reads the eye |
| `test/ui.mjs` | seven checks on the observation chart |
| `test/reachability.mjs` | notes `services.sensorRange` is wired now |

## Verified

- `node test/all.mjs` — **42/42 suites green, 3,331 checks** (60 s).
- The docked path is covered end to end: chart opens on a pad, the eye is the station, the
  array out-reaches the hull, warp is refused, scanning is not, selection works, and
  undocking puts the eye back on the ship.

## Not verified

- **Nothing opened on a phone.** Tenth slice.
- **The station array numbers are untuned.** 1,800 km base against a hull's 4,200–5,200 is a
  *smaller* radius on paper — the comment above says "wider" and it is only wider on a
  station that has actually fitted the module, which reads to +4,000. Base 1,800 was written
  when nothing consumed it, so it was never a considered number. It should probably start
  above a hull's dish and scale hard with the module; that is a balance decision, not a
  rendering one, and it wants the same measurement pass the orbit scale does.
- **Tracking is still just Lock.** You asked for viewing, scanning and tracking. The first two
  are done properly; tracking is the existing target lock and nothing more — no watch list,
  no "tell me when this moves", no persistent contact history.
