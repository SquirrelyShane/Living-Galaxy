# PATCH v1.01.71 — dock view / NPC self-ack

Two fixes, no new surface. Save schema stays **16** — nothing here changes the persisted
payload shape.

> **Backfilled.** This note was written after the fact, from the CHANGELOG entry and the
> shipped diff, to close the gap between `PATCH_v1.01.70.md` and `PATCH_v1.01.73.md`. The
> convention is one note per version bump; .71 and .72 shipped folded into .73 and never
> got their own. The content below is accurate to what changed, but it was not written
> alongside the work.

---

## Fixed

**Docked pilots could close the station overlay and become stranded.** Closing the dock UI
— or choosing Service → View Outside — dropped the player into a state with no station
interface and no Undock button, while movement stayed locked because the ship was still
docked. The only way out was a reload.

Closing the dock UI now enters a deliberate *exterior view* that is still a docked state
rather than an absence of one. A HUD **Return to Station** button and the Dock key both
restore the full station interface, Undock included. Movement remains locked until a true
undock, which is the correct behaviour — the bug was never that movement was locked, it
was that there was no way back to the surface that would unlock it.

**NPC check-in replies acknowledged the speaker instead of the other party.** The reply
template runs after `exchange()` swaps `a` and `b`, so inside the reply `a` is the
responder and `b` is the ship that just marked them on the board. The template used
`${a.name}` and produced characters thanking themselves.

Changed to `${b.name}`. The swap is documented at the top of `data/npc-topics.js`; the
comment was right and the template was wrong.

---

## Files touched

| File | Change |
|---|---|
| `src/ui/dock.js` | exterior-view state, return path |
| `src/ui/hud.js` | Return to Station control |
| `src/systems/input.js` | Dock key restores the station interface from exterior view |
| `src/data/npc-topics.js` | check-in reply names the other party |

---

## Verified

`node test/all.mjs` green at the time of shipping. Neither fix landed with a suite of its
own — the dock exterior-view path is exercised by `test/ui.mjs` only insofar as the panel
opens and closes, and the reply-template fix has no direct assertion. Both are candidates
for coverage if either regresses.
