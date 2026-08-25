# PATCH v1.00.34 — "Clearance"

The ARIA button was hidden behind the throttle dock. No schema change. 21 suites,
**1,676 checks**, all green.

---

## What was actually wrong

Not the throttle. `#tool-column` was pinned at the top with `top:212px` and **no bottom
bound**, so it grew downward for as long as it had buttons. At eleven buttons — FA,
level, cycle, cam, audio, ops, ledger, settings, **ARIA**, **comms**, save — that is
380px of column against a viewport that, on a Samsung in portrait in Brave with browser
chrome top and bottom, has nothing like that much room below 212px.

`#left-stack` on the other side of the screen was already bounded at both edges, with a
comment explaining that it used to run off under the dock and that anchoring both edges
fixed it. The tool column never got the same treatment.

## The fix

**1. Bound the column.** `bottom:calc(var(--dock-h) + var(--safe-b))`, matching the left
stack. It can no longer extend past the dock, full stop.

**2. Buttons cannot squash.** In a bounded column flex container, `height:30px` items
shrink by default — the column would have "fitted" by turning eleven buttons into eleven
slivers. `.tool-btn{flex:0 0 auto}` prevents that; `overflow-y:auto` on the column is the
guarantee nothing is ever clipped even in a case the breakpoints below do not anticipate.

**3. Three short-screen breakpoints** so it rarely needs to scroll at all — scrolling
hides buttons behind a gesture nobody knows is available:

| Viewport | `--dock-h` | button | gap | column top |
|---|---|---|---|---|
| default | 136px | 30px | 5px | 212px |
| ≤ 860px | 128px | 27px | 4px | 212px |
| ≤ 740px | 120px | 24px | 3px | 196px |
| ≤ 640px | 112px | 22px | 2px | 176px |

22px is the floor — below that the column scrolls rather than shrinking further, because
a smaller tap target is worse than a scroll.

**4. The throttle is smaller, as asked.** Track 18px → 13px (11px on short screens),
border-radius 9 → 7, header margin 4 → 3, panel padding 6/7 → 5/6, preset buttons 5 → 4.

## One number instead of four

Four panels each carried their own hardcoded guess at the dock height — `150px` in
`#left-stack`, `158px` in `#dock-prompt`, `176px` and `188px` in the warp overlays. They
had already drifted apart, and trimming the throttle would have left three of them wrong.

They all reference `--dock-h` now, at the offsets they were actually using relative to it,
so every one of them follows the dock automatically at every breakpoint.

## `test/layout.mjs` — 18 new checks

Every other suite in this project asserts behaviour, and **a button works perfectly while
sitting underneath the throttle dock**. All twenty suites passed on the broken build.

This one reads the declared px values straight out of the stylesheets and does the
arithmetic: given the dock reserve, the column top, the button height and the gap at each
breakpoint, do eleven buttons fit? It also asserts that no panel has gone back to
hardcoding its own dock offset.

Deliberately arithmetic on declared values rather than measuring a rendered DOM — there is
no browser in this test environment, and a jsdom that does not perform layout would report
zero for every dimension and pass silently, which is worse than not testing at all.

**It caught two things I had missed** on its first run: the two warp overlays still
hardcoding 176/188px, and the fact that eleven buttons still did not fit at a 600px
viewport, which is what produced the fourth breakpoint.

## Files

**New** — `test/layout.mjs`, `PATCH_v1.00.34.md`

**Changed** — `css/base.css`, `css/hud.css`, `css/overlays.css`, `src/core/version.js`,
`index.html`, `package.json`, `test/all.mjs`, `README.md`, `CHANGELOG.md`

## Verified vs not

**Verified:** the arithmetic, at four viewport heights, plus that the shared variable is
actually used everywhere and the track is still thumb-draggable at 11px.

**Not verified:** how it looks. Worth confirming on the actual device that the tighter
buttons are still comfortable to hit and that the throttle track has not become fiddly to
drag — those are judgements a number cannot make.
