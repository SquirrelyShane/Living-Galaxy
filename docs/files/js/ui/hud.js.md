# js/ui/hud.js

[index](../../../README.md) · 1201 lines · 110 symbols · 44 imports · 1 importers

## About

<!-- note:@file -->
- L46 · `const THR_SPAN = THROTTLE_MAX - THROTTLE_MIN;` — 1.8
- L47 · `const NOTICE_LIFE = 7.5;` — seconds a message card stays up
- L48 · `const THR_ZERO = (THROTTLE_MAX - 0) / THR_SPAN;` — 0.778 from the top
- L67 · `const ANSWER_GAP = 72;` — .cx-answer offset from the rail
- L68 · `const ANSWER_W = 2 * 58 + 8;` — two round buttons and the gap between them
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../world/bodies.js` | `PUBLIC_ROOM`, `bodyById` | [js/world/bodies.js](../world/bodies.js.md) |
| 2 | `../station/stationclock.js` | `clockAt` | [js/station/stationclock.js](../station/stationclock.js.md) |
| 3 | `../version.js` | `BUILD_LINE` | [js/version.js](../version.js.md) |
| 4 | `../world/generate.js` | `describeSystem`, `generateSystem` | [js/world/generate.js](../world/generate.js.md) |
| 5 | `../core/input.js` | `touch` | [js/core/input.js](../core/input.js.md) |
| 6 | `../sim/sim.js` | `autoLevel`, `cycleMiningMode`, `cycleTimeScale`, `cycleTurretMode`, `launchSim`, `loadSky`, `requestJump`, `requestScan`, `resumePlay`, `claimPort`, `sensorPulse`, `toggleDock`, `togglePointerLock`, `returnToMenu`, `dismissNotice`, `setThrottle`, `setMiningMode`, `sim`, `toggleSystem` | [js/sim/sim.js](../sim/sim.js.md) |
| 7 | `../console/console.js` | `mountConsole`, `toggleConsole` | [js/console/console.js](../console/console.js.md) |
| 8 | `../station/stationdeck.js` | `mountStationDeck` | [js/station/stationdeck.js](../station/stationdeck.js.md) |
| 9 | `./secbadge.js` | `mountSecBadge` | [js/ui/secbadge.js](secbadge.js.md) |
| 10 | `./dockboot.js` | `mountDockBoot` | [js/ui/dockboot.js](dockboot.js.md) |
| 11 | `./fullscreen.js` | `mountFullscreen` | [js/ui/fullscreen.js](fullscreen.js.md) |
| 12 | `../flight/recorder.js` | `wireRecorder`, `settle` as `settleTape`, `record` as `tapeRecord`, `recorder` **unused** | [js/flight/recorder.js](../flight/recorder.js.md) |
| 13 | `../mission/run.js` | `mission`, `missionHooks` | [js/mission/run.js](../mission/run.js.md) |
| 14 | `../flight/turrets.js` | `contacts` as `turretContacts` | [js/flight/turrets.js](../flight/turrets.js.md) |
| 15 | `../station/stations.js` | `stations` | [js/station/stations.js](../station/stations.js.md) |
| 16 | `../flight/repair.js` | `hullMaxOf` | [js/flight/repair.js](../flight/repair.js.md) |
| 17 | `../aria/aria.js` | `ariaHasConn`, `ariaTakeConn`, `ariaRelease` | [js/aria/aria.js](../aria/aria.js.md) |
| 18 | `../aria/pilot.js` | `ariaPilot` | [js/aria/pilot.js](../aria/pilot.js.md) |
| 19 | `./map.js` | `mountMap` | [js/ui/map.js](map.js.md) |
| 20 | `./creation.js` | `mountCreation` | [js/ui/creation.js](creation.js.md) |
| 21 | `../net/account.js` | `account`, `flyPilot`, `newPilotSlot`, `deletePilot`, `eraseGuest`, `MAX_PILOTS` | [js/net/account.js](../net/account.js.md) |
| 22 | `./hangar.js` | `mountHangar` | [js/ui/hangar.js](hangar.js.md) |
| 23 | `../flight/ship.js` | `MINING_MODES`, `THROTTLE_MAX`, `THROTTLE_MIN`, `TURRET_MODES`, `cargoTotal` | [js/flight/ship.js](../flight/ship.js.md) |
| 24 | `../audio/index.js` | `setAudioMuted`, `unlockAudio`, `UI`, `busLevels`, `setBusLevel`, `resetMix`, `BUSES` | [js/audio/index.js](../audio/index.js.md) |
| 25 | `../core/store.js` | `loadSave`, `randomCallsign`, `skyProgress`, `useGameStore` | [js/core/store.js](../core/store.js.md) |
| 26 | `../flight/pilot.js` | `loadPilot`, `restorePilot` | [js/flight/pilot.js](../flight/pilot.js.md) |
| 27 | `../comms/comms.js` | `mountComms`, `wireCommsTest` | [js/comms/comms.js](../comms/comms.js.md) |
| 28 | `../net/net.js` | `connectNet`, `disconnectNet`, `primeSol` | [js/net/net.js](../net/net.js.md) |
| 29 | `../interior/interior.js` | `mountInterior` | [js/interior/interior.js](../interior/interior.js.md) |
| 30 | `../npc/captain.js` | `captain`, `wireCaptainTest` | [js/npc/captain.js](../npc/captain.js.md) |
| 31 | `../npc/cradle.js` | `connectCradle`, `disconnectCradle` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 32 | `../corp/gdb.js` | `connectGdb`, `disconnectGdb` | [js/corp/gdb.js](../corp/gdb.js.md) |
| 33 | `../economy/icework.js` | `wireIcework` | [js/economy/icework.js](../economy/icework.js.md) |
| 34 | `../world/events/atmoworks.js` | `wireAtmoWorks` | [js/world/events/atmoworks.js](../world/events/atmoworks.js.md) |
| 35 | `../flight/autopilot.js` | `wireAutopilot`, `nearestSeam`, `busOverload`, `autopilot` as `ap` | [js/flight/autopilot.js](../flight/autopilot.js.md) |
| 36 | `../corp/company.js` | `wireCompany` | [js/corp/company.js](../corp/company.js.md) |
| 37 | `../crew/family.js` | `wireFamily` | [js/crew/family.js](../crew/family.js.md) |
| 38 | `../economy/contracts.js` | `wireContracts` | [js/economy/contracts.js](../economy/contracts.js.md) |
| 39 | `../npc/chat.js` | `wireNpcChat` | [js/npc/chat.js](../npc/chat.js.md) |
| 40 | `./holdview.js` | `renderHold` | [js/ui/holdview.js](holdview.js.md) |
| 41 | `../corp/fleet.js` | `wireFleet` | [js/corp/fleet.js](../corp/fleet.js.md) |
| 42 | `./tutorial.js` | `startTutorial` | [js/ui/tutorial.js](tutorial.js.md) |
| 43 | `../net/worldsync.js` | `applySolPrime`, `mountWorldSync`, `resetWorldSync` | [js/net/worldsync.js](../net/worldsync.js.md) |
| 44 | `./chatbox.js` | `mountChatbox` | [js/ui/chatbox.js](chatbox.js.md) |

## Imported by

- [js/main.js](../main.js.md) — `mountHud`

## Exports

- [`bindOrient`](#s-bindOrient) · function — **no importer in scanned roots**
- [`mountHud`](#s-mountHud) · function — used by [js/main.js](../main.js.md)

## Effects

- **bus.on** — `‹paint› on store` (mountHud:1186)
- **dom.create** — `div` (mountHud>paintRow:813, mountHud>rowEl:906) · `label` (mountHud>paintRow:815) · `input` (mountHud>paintRow:817) · `b` (mountHud>paintRow:821)
- **dom.id** — `‹id›` (stackLeftColumn:176, $:238) · `gauges` (stackRightColumn:190) · `sys-strip` (stackRightColumn:190) · `dash` (stackRightColumn:190) · `hold-body` (paintHold:467) · `callsign` (mountHud:495, mountHud:558, mountHud:592, mountHud:610, mountHud>setMode.onFly:639) · `sys-line` (mountHud>refreshPreview:512) · `stat-survey` (mountHud>refreshPreview:513) · `stat-probes` (mountHud>refreshPreview:514) · `build-line` (mountHud:555) · `btn-continue` (mountHud:573) · `btn-create` (mountHud:574) · `hangar` (mountHud:609) · `stick` (mountHud:675) · `stick-knob` (mountHud:676) · `btn-brake` (mountHud:708) · `thr-track` (mountHud:717, mountHud>paintAll:1095) · `thr-fill` (mountHud:717) · `thr-thumb` (mountHud:717) · `dash-page-${…}` (mountHud>setPage:724) · `dash-tabs` (mountHud>setPage:725, mountHud:730) · `dash-page-name` (mountHud>setPage:728) · `sw-cut` (mountHud:736, mountHud>paintAll:1110) · `mode-turret` (mountHud:744, mountHud>paintAll:1123, mountHud>paintAll:1124) · `mode-mining` (mountHud:745, mountHud>paintAll:1163, mountHud>paintAll:1164) · `op-pulse` (mountHud:747, mountHud>paintAll:1135) · `op-level` (mountHud:748) · `op-time` (mountHud:749, mountHud>paintAll:1150) · `op-dock` (mountHud:750, mountHud>paintAll:1147) · `op-claim` (mountHud:751, mountHud>paintAll:1149) · `op-threat` (mountHud:755, mountHud>paintAll:1159) · `btn-survey` (mountHud:757) · `btn-plock` (mountHud:758) · `btn-warp` (mountHud:759, mountHud:901) · `btn-con` (mountHud:760, mountHud>paintAll:1042) · `btn-cam` (mountHud:761, mountHud>paintAll:958) · `btn-pause` (mountHud:764) · `btn-resume` (mountHud:768) · `btn-tutor` (mountHud:769) · `btn-watch` (mountHud:773, mountHud>paintAll:948) · `btn-menu` (mountHud:779) · `btn-map` (mountHud:786) · `btn-hold` (mountHud:788, mountHud>paintAll:951, mountHud>paintAll:952) · `g-cgo-btn` (mountHud:789) · `hold-close` (mountHud:790) · `hold` (mountHud:791, mountHud>paintAll:950) · `btn-aria` (mountHud:792, mountHud>paintAll:959) · `btn-full` (mountHud:798) · `btn-map-close` (mountHud:801) · `btn-mute` (mountHud:802, mountHud>paintAll:1041) · `mix-rows` (mountHud:810) · `btn-mix-reset` (mountHud:829) · `notice-card` (mountHud:896, mountHud:900) · `canopy` (mountHud:898) · `markers` (mountHud:899) · `impact-flash` (mountHud:902) · `sky-glare` (mountHud:903) · `warp-fill` (mountHud:911) · `warp-state` (mountHud:912) · `hud-clock` (mountHud>paintClock:922) · `hud` (mountHud>paintClock:927, mountHud>paintAll:945) · `start` (mountHud>paintAll:944) · `pause` (mountHud>paintAll:947) · `map` (mountHud>paintAll:949) · `hud-sky` (mountHud>paintAll:963) · `i-vel` (mountHud>paintAll:966) · `i-cls` (mountHud>paintAll:967) · `i-alt` (mountHud>paintAll:968) · `hazline` (mountHud>paintAll:971) · `haz-text` (mountHud>paintAll:977) · `respline` (mountHud>paintAll:982) · `resp-text` (mountHud>paintAll:990) · `i-g` (mountHud>paintAll:998) · `instruments` (mountHud>paintAll:999) · `g-pwr` (mountHud>paintAll:1001) · `g-pwr-n` (mountHud>paintAll:1001) · `g-hull` (mountHud>paintAll:1004) · `g-hull-n` (mountHud>paintAll:1004) · `g-shld` (mountHud>paintAll:1005) · `g-shld-n` (mountHud>paintAll:1005) · `g-o2` (mountHud>paintAll:1006) · `g-o2-n` (mountHud>paintAll:1006) · `g-cgo` (mountHud>paintAll:1007) · `g-cgo-n` (mountHud>paintAll:1007) · `alarms` (mountHud>paintAll:1015) · `lock-name` (mountHud>paintAll:1022) · `notice` (mountHud>paintAll:1023) · `status` (mountHud>paintAll:1039) · `route-card` (mountHud>paintAll:1066) · `route-target` (mountHud>paintAll:1076) · `route-eta` (mountHud>paintAll:1077) · `route-hazards` (mountHud>paintAll:1078) · `thr-num` (mountHud>paintAll:1096) · `thr-draw` (mountHud>paintAll:1097, mountHud>paintAll:1098) · `mode-turret-st` (mountHud>paintAll:1122) · `lockbar` (mountHud>paintAll:1125) · `lock-fill` (mountHud>paintAll:1127) · `lock-text` (mountHud>paintAll:1128) · `op-pulse-st` (mountHud>paintAll:1134) · `op-time-st` (mountHud>paintAll:1136) · `op-dock-st` (mountHud>paintAll:1138) · `op-claim-st` (mountHud>paintAll:1148) · `op-threat-st` (mountHud>paintAll:1152) · `mode-mining-st` (mountHud>paintAll:1162) · `labels` (mountHud>paintAll:1166) · `heat-wash` (mountHud>paintAll:1174) · `toast` (mountHud>paintAll:1177, mountHud>paintAll:1178, mountHud>paintAll:1180)
- **dom.query** — `.hud-tools` (measureDock:58) · `‹PUCK_AVOID›` (boxesToAvoid:74) · `.cx` (boxesToAvoid:75) · `.sys-strip` (measureRail:100) · `link[href*="cockpit.css"]` (stackRightColumn:189) · `‹sel›` (bindOrient:226) · `#thr-presets [data-thr]` (bindThrottle:371) · `label` (mountHud:610) · `[data-rcs]` (mountHud:695) · `button` (mountHud>setPage:725) · `button[data-page]` (mountHud:730) · `.sw[data-sys]` (mountHud:741, mountHud:886) · `button, .btn, .tbtn, .pick, .chip` (mountHud:841) · `.st` (mountHud:887, mountHud>paintAll:1115)
- **event.listen** — `resize on window → go` (bindOrient:221) · `orientationchange on window → go` (bindOrient:222) · `resize on window.visualViewport → go` (bindOrient:223) · `pointerdown on el → (inline)` (bindPad:309) · `pointermove on el → move` (bindPad:319) · `pointerup on el → end` (bindPad:320) · `pointercancel on el → end` (bindPad:321) · `pointerdown on el → d` (bindHold:338) · `pointerup on el → u` (bindHold:339) · `pointercancel on el → u` (bindHold:340) · `pointerleave on el → u` (bindHold:341) · `pointerdown on track → (inline)` (bindThrottle:355) · `pointermove on track → (inline)` (bindThrottle:360) · `click on b → (inline)` (bindThrottle:372, mountHud:732) · `pointerup on track → end` (bindThrottle:373) · `pointercancel on track → end` (bindThrottle:374) · `input on $() → (inline)` (mountHud:558) · `click on contBtn → (inline)` (mountHud:588) · `click on createBtn → (inline)` (mountHud:598) · `lg-account on globalThis.document → onAccount` (mountHud:669) · `click on $() → (inline)` (mountHud:736, mountHud:744, mountHud:745, mountHud:747, mountHud:748, mountHud:749 +21) · `click on el → (inline)` (mountHud:742) · `click on $() → toggleHold` (mountHud:788, mountHud:789) · `input on r → (inline)` (mountHud>paintRow:823) · `pointerdown on document → (inline)` (mountHud:840)
- **global.write** — `window.__lgFlyQueued` (mountHud>setMode:664)
- **timer** — `setTimeout` (bindOrient:229, mountHud>queueSky:528, mountHud:671)

## Symbols

### <a id="s-THR_SPAN"></a>`THR_SPAN`

const · L46–46

<!-- note:THR_SPAN -->
<!-- /note -->

### <a id="s-NOTICE_LIFE"></a>`NOTICE_LIFE`

const · L47–47

<!-- note:NOTICE_LIFE -->
<!-- /note -->

### <a id="s-THR_ZERO"></a>`THR_ZERO`

const · L48–48

<!-- note:THR_ZERO -->
<!-- /note -->

### <a id="s-readOrient"></a>`readOrient()`

function · L50–54

- called by: [`bindOrient>go`](#s-bindOrient-go)

<!-- note:readOrient -->
<!-- /note -->

### <a id="s-measureDock"></a>`measureDock()`

function · L56–63

- called by: [`bindOrient>measure`](#s-bindOrient-measure)
- effects: dom.query `.hud-tools`

<!-- note:measureDock -->
THE DOCK MEASURES ITSELF.

The right-hand chip column (.hud-tools) is bottom-anchored and grows upward.
The RCS pad and the dash sit on top of it, offset by --g-dock. That offset
used to be arithmetic over --g-tools, a count of the chips kept by hand in
css/glass.css — and it went stale twice: once in 0.3.06 when the fullscreen
chip landed, and again in 0.3.29 when HOLD did. Both times the column grew
past its own box and painted ARIA over AFT, DN and SCAN, which laid out
correctly underneath it and could not be tapped.

So measure it. `--g-dock` is set from the column's real height, which is
right whatever is in it — a chip added, the mute chip unhiding, a font
loading late, a breakpoint changing how tall a chip is. Nothing that reads
--g-dock can change .hud-tools' height, so there is no feedback loop.

A zero height means the column is display:none or not laid out yet; keep the
last good value rather than collapsing the pad onto the chips.
<!-- /note -->

### <a id="s-RAIL_GAP"></a>`RAIL_GAP`

const · L65–65

<!-- note:RAIL_GAP -->
THE COMMS PUCK HANGS UNDER THE SWITCHES, NOT THROUGH THEM.

The same failure one rail over. In portrait the systems strip and the comms
call puck are both pinned to the right edge, and the puck's top was a fixed
150 px below the top pad — a number that was under the strip when it was
written and is not any more. Measured: the strip now runs to y=208 and the
puck starts at y=160, so its pulse ring sits over ASST and its left edge
over CUT. Flight assist and the cutter, both untappable, both looking fine.

So the rail is measured too: --g-rail-top is the strip's own bottom edge
plus a gap. comms.css takes it in portrait, where the two share a column,
and keeps its own number in landscape, where the strip is on the other side
of the canopy and there is nothing to clear.
<!-- /note -->

### <a id="s-PUCK_H"></a>`PUCK_H`

const · L66–66

<!-- note:PUCK_H -->
.cx-puck and .cx-answer in css/comms.css. A coarse pointer gets the bigger
set, and since that is the phone this game is played on, the bigger set is
what the slot search reserves — a slot that only fits the desktop sizes is
not a slot.
<!-- /note -->

### <a id="s-PUCK_W"></a>`PUCK_W`

const · L66–66

<!-- note:PUCK_W -->
<!-- /note -->

### <a id="s-ANSWER_GAP"></a>`ANSWER_GAP`

const · L67–67

<!-- note:ANSWER_GAP -->
<!-- /note -->

### <a id="s-ANSWER_W"></a>`ANSWER_W`

const · L68–68

<!-- note:ANSWER_W -->
<!-- /note -->

### <a id="s-PUCK_AVOID"></a>`PUCK_AVOID`

const · L70–70

<!-- note:PUCK_AVOID -->
What the comms puck has to stay off: CONTROLS, not cards.

The first cut of this avoided whole panels — the dash, the gauges card, the
route plot — and in landscape that leaves no free 58px square anywhere on a
915x412 screen, because the dash alone owns the full height of the right
column. But most of a card is readout. Sitting over a number costs nothing;
sitting over the throttle's MAX button costs you the button.

So the things to avoid are the things you press. Read live, because which
exist and where they sit changes with the breakpoint and the orientation.
<!-- /note -->

### <a id="s-boxesToAvoid"></a>`boxesToAvoid(doc)`

function · L72–81

- called by: [`measureRail`](#s-measureRail)
- effects: dom.query `‹PUCK_AVOID›` · dom.query `.cx`

<!-- note:boxesToAvoid -->
- L75 · `if (el.closest(".cx")) continue;` — the comms panel is ours to overlap
<!-- /note -->

### <a id="s-hits"></a>`hits(a, boxes, pad=)`

function · L83–84 · **never referenced**

<!-- note:hits -->
<!-- /note -->

### <a id="s-overlapArea"></a>`overlapArea(a, boxes, pad=)`

function · L86–94

- called by: [`measureRail`](#s-measureRail) ×2

<!-- note:overlapArea -->
How much of `a` lands on top of controls, in square pixels.
<!-- /note -->

### <a id="s-measureRail"></a>`measureRail()`

function · L96–163

- calls: [`boxesToAvoid`](#s-boxesToAvoid) · [`measureRail>slot`](#s-measureRail-slot) ×5 · [`overlapArea`](#s-overlapArea) ×2
- called by: [`bindOrient>measure`](#s-bindOrient-measure) · [`stackRightColumn`](#s-stackRightColumn) ×2
- effects: dom.query `.sys-strip`

<!-- note:measureRail -->
Only where there is somewhere to put it. On a short screen the dash card
rides up until it already overlaps the strip — 360x640 has the dash at y=172
and the strip running to y=208, which is a collision of its own and why CUT
is under the throttle header there whatever the puck does. Dropping the puck
below the strip on a screen like that just moves it onto the throttle.

So: publish the measured rail when the puck clears the dash at it, and leave
the variable unset otherwise, which falls comms.css back to its own number.
That leaves the short-screen case exactly as it was rather than trading one
covered control for six.

PUT THE COMMS PUCK SOMEWHERE FREE.

0.3.31 hung it below the systems strip, measured, which fixed the common
portrait phone and left two screens where there is no room below the strip
at all: at 360x640 the dash rides up to y=172 while the strip runs to 208,
and in landscape the strip crosses to the left while the puck stays on the
right, over the throttle's preset buttons. In both, the puck was sitting on
controls — flight assist, the cutter, the throttle presets.

A fixed offset cannot answer this, because what is beside the puck changes
with the breakpoint AND the orientation. So the puck is placed by search:
a handful of candidate slots, each tested against every control on screen,
first one that collides with nothing wins. The candidates run best-first —
under the strip on the right rail is still the nicest place for it — and
the last is the old fixed position, so a screen where genuinely nothing
fits ends up exactly where it used to be rather than somewhere absurd.

Published as two variables because a free slot may not be on the right rail
at all; css/comms.css takes both.

- L120 · `const cands = [];` — THE PUCK STAYS ON THE RIGHT RAIL.
  
  0.3.37 let the search move it to the left edge when the right was busy,
  which was over-engineering: a pilot learns where the comms button is, and
  a button that teleports across the canopy is worse than one that sits
  slightly close to a switch. Reported as the icon "getting pushed to the
  left side" — and on a phone that is not fullscreen, where the viewport is
  short enough to crowd the right rail, that is exactly what it did.
  
  So the search now only chooses HOW FAR DOWN the right rail it sits. Under
  the systems strip first, then a ladder of positions down the rail. If
  every one of them is occupied the CSS fallback applies, which is where it
  has always been.
- L122 · `cands.push(slot(padR, Math.round(sr.bottom) + RAIL_GAP));` — under the strip
- L123 · `}` — 0.3.49: never above it. "Above the strip" is the gauges card — a
  readout, so it scored as free, and the puck spent every call parked on
  top of PWR/HULL/SHLD in the top-right corner. Reported as the call icon
  having "moved to the top right". Under the strip or further down.
- L124 · `const colLeft = vw - padR - PUCK_W - 8;` — CANDIDATES FROM THE ACTUAL GAPS, not from fractions of the screen.
  
  A ladder at fixed fractions lands wherever it lands — at 360x740 the
  nearest rung sat eight pixels into the dash, so the scorer picked a
  different slot that clipped the CGO gauge button instead. Neither was
  necessary: there was a clear 64px band between the systems strip and the
  top of the dash, and nothing was looking for it.
  
  So: take everything already on this column, sort it, and offer the puck
  each gap between one obstacle and the next. A gap that is big enough gets
  the puck centred in it, which is both the tidiest place and the one least
  likely to clip either neighbour when a font loads late.
- L133 · `for (const f of [0.30, 0.38, 0.46, 0.22, 0.54, 0.62, 0.14]) {` — and a fallback ladder, for a column with nothing on it to measure against
- L136 · `if (vw > vh) {` — LANDSCAPE ONLY: the far side is allowed.
  
  In portrait the right rail is the puck's home and it stays there — moving
  it is what the "pushed to the left side" report was about. In landscape
  the right rail is the throttle card top to bottom, so there is genuinely
  nowhere on it that is not a control, and the opposite edge is open. The
  layouts are different enough that the pilot is not being asked to unlearn
  anything: the whole HUD is somewhere else in landscape already.
- L142 · `let best = null;` — SCORE, DO NOT JUST TAKE THE FIRST CLEAR ONE.
  
  Keeping the puck on the right rail means that on a short screen there may
  be no completely clear slot at all. "First clear one, else give up" then
  falls back to the CSS position, which is the very place that was sitting
  on the CUT switch. So every candidate is scored by how much of it lands on
  controls, and the least-bad wins — zero where a clear slot exists, and the
  smallest possible nuisance where none does. The puck is only on screen
  during a call, so a few square pixels over a readout for the length of a
  hail is a far better trade than moving it somewhere the pilot will not
  look for it.
- L143 · `const floor = vw <= vh && sr && sr.height > 0 ? Math.round(sr.bottom) : 4;` — portrait: nothing above the strip
- L148 · `if (c.answer.left < 0 || c.answer.right > vw) continue;` — never off screen: it must be tappable
- L149 · `const home = sr && sr.height > 0 ? sr.bottom + RAIL_GAP : vh * 0.3;` — Overlap dominates; distance from home breaks the ties. Without the
  tiebreak the first clear gap wins, which on a tall screen is the strip
  of sky above the gauges — technically free, and a strange place to look
  for the comms button. Home is just under the systems strip, where it
  has always been.
- L159 · `root.style.removeProperty("--g-rail-top");` — not one candidate even fit on screen: leave comms.css its own number
<!-- /note -->

#### <a id="s-measureRail-slot"></a>`measureRail>slot(right, top)`

function · L107–119

- called by: [`measureRail`](#s-measureRail) ×5

<!-- note:measureRail>slot -->
A CANDIDATE IS THE WHOLE COMMS CLUSTER, NOT JUST THE PUCK.

0.3.37 placed the puck and forgot that the ANSWER buttons hang off it —
`.cx-answer` sits at `--cx-rail-right + 72px`, i.e. further from the right
edge than the puck. So when the search moved the puck to the left edge,
it pushed the accept/reject pair clean off the side of the screen and a
ringing call could not be answered at all without going fullscreen.
Reported, and entirely my doing.

The cluster is placed as one thing now, and the answer row takes whichever
side of the puck has room: its usual place to the left, or flipped to the
right when the puck is near the left edge. Both rects are collision-tested
and both must be on screen, so there is no arrangement where the puck is
reachable and the buttons are not.

- L110 · `let aRight = right + ANSWER_GAP;` — preferred: the answer row to the LEFT of the puck
- L113 · `aRight = right - ANSWER_GAP - ANSWER_W;` — no room that side — flip it to the right of the puck
<!-- /note -->

### <a id="s-LEFT_STACK"></a>`LEFT_STACK`

const · L165–165

<!-- note:LEFT_STACK -->
THE LEFT COLUMN STACKS ITSELF (0.3.49).

Instruments, status, lock, alarms, the hazard line, the response clock, the
message card and the toast all hang down the left edge, and every one of
them had a fixed `top` in CSS. The hazard line and the response clock were
given the SAME top (+170), and the message card sat at +182 — so the card
covered "◈ RESPONSE 12s · &lt;hull>" every time there was a message, which is
exactly when a fight is on. A fixed number cannot know which of these are
showing, so they are laid out in order, only the visible ones, each under
the last. Measured at most five times a second; reading layout every frame
after the paint has just written text would force a reflow per frame.
<!-- /note -->

### <a id="s-STACK_GAP"></a>`STACK_GAP`

const · L166–166

<!-- note:STACK_GAP -->
<!-- /note -->

### <a id="s-stackAt"></a>`stackAt`

const · L167–167

<!-- note:stackAt -->
<!-- /note -->

### <a id="s-stackLeftColumn"></a>`stackLeftColumn(force=)`

function · L168–185

- calls: [`stackRightColumn`](#s-stackRightColumn)
- called by: [`mountHud>paintAll`](#s-mountHud-paintAll)
- effects: dom.id `‹id›`

<!-- note:stackLeftColumn -->
- L178 · `if (y == null) { y = el.getBoundingClientRect().top; }` — the first one stays where CSS put it
<!-- /note -->

### <a id="s-rightSig"></a>`rightSig`

const · L187–187

<!-- note:rightSig -->
…and so does the right one, in portrait. The systems strip sat at a fixed
+100 under a gauges card 112 px tall, so SHLD/ENG covered the card's CGO row
— "top right panels overlapping". The strip now hangs from the card's real
bottom, and if that pushes it into the throttle card, the throttle card
gives up the difference (its slider row is the flexible one) rather than the
two being drawn on top of each other. The comms puck is re-placed whenever
the column moves, since it is measured against the strip.
<!-- /note -->

### <a id="s-stackRightColumn"></a>`stackRightColumn(doc)`

function · L188–212

- calls: [`measureRail`](#s-measureRail) ×2
- called by: [`stackLeftColumn`](#s-stackLeftColumn)
- effects: dom.query `link[href*="cockpit.css"]` · dom.id `gauges` · dom.id `sys-strip` · dom.id `dash`

<!-- note:stackRightColumn -->
<!-- /note -->

### <a id="s-bindOrient"></a>`bindOrient()`

function · **exported** · L214–231

- calls: [`bindOrient>go`](#s-bindOrient-go) · [`bindOrient>measure`](#s-bindOrient-measure)
- called by: [`mountHud`](#s-mountHud)
- effects: event.listen `resize` · event.listen `orientationchange` · dom.query `‹sel›` · timer `setTimeout`

<!-- note:bindOrient -->
- L224 · `if (typeof ResizeObserver !== "undefined") {` — a chip or a switch that merely unhides fires no resize event, so watch the
  boxes themselves
- L228 · `document.fonts?.ready?.then(measure).catch(() => {});` — web fonts land after first paint and change both boxes under us
- L229 · `for (const ms of [250, 1000, 2500, 6000]) setTimeout(measure, ms);` — And the HUD is not laid out on the first call at all — it is `hidden`
  until a sky is launched, so anything measured before that reads zero and
  a slot gets chosen against a screen that is not there yet. Measured at
  360x740 this put the puck over the CGO gauge button, because the gauges
  had not been painted when the search ran. A few re-measures cover the
  gap without needing to know when the HUD appears.
<!-- /note -->

#### <a id="s-bindOrient-measure"></a>`bindOrient>measure()`

function · L215–215

- calls: [`measureDock`](#s-measureDock) · [`measureRail`](#s-measureRail)
- called by: [`bindOrient`](#s-bindOrient) · [`bindOrient>go`](#s-bindOrient-go)

<!-- note:bindOrient>measure -->
<!-- /note -->

#### <a id="s-bindOrient-go"></a>`bindOrient>go()`

function · L216–219

- calls: [`bindOrient>measure`](#s-bindOrient-measure) · [`readOrient`](#s-readOrient)
- called by: [`bindOrient`](#s-bindOrient)

<!-- note:bindOrient>go -->
<!-- /note -->

### <a id="s-elCache"></a>`elCache`

const · L233–233

<!-- note:elCache -->
`paint()` runs on every store update — the engine publishes at ~14 Hz — and
it used to resolve sixty-two element ids through document.getElementById on
every one of them. That is roughly nine hundred tree lookups a second on a
phone, for a set of elements that were written into index.html once and
never move.

So the lookups are cached. The cache checks `isConnected` before handing an
element back, which is a single property read rather than a tree walk, and
which self-heals the one case that could go wrong: paint() rewrites three
containers with innerHTML, and anything inside those is replaced. A detached
node is re-resolved, so a stale handle is impossible by construction rather
than by remembering to invalidate.
<!-- /note -->

### <a id="s-S"></a>`$(id)`

function · L235–241

- called by: [`mountHud`](#s-mountHud) ×54 · [`mountHud>paintAll`](#s-mountHud-paintAll) ×69 · [`mountHud>paintClock`](#s-mountHud-paintClock) · [`mountHud>refreshPreview`](#s-mountHud-refreshPreview) ×3 · [`mountHud>setMode.onFly`](#s-mountHud-setMode-onFly) · [`mountHud>setPage`](#s-mountHud-setPage) ×3
- effects: dom.id `‹id›`

<!-- note:$ -->
<!-- /note -->

### <a id="s-sanitizeRoom"></a>`sanitizeRoom(raw)`

function · L243–246

- called by: [`mountHud`](#s-mountHud) ×2 · [`mountHud.normalizeSeed`](#s-mountHud-normalizeSeed) · [`mountHud.onLaunch`](#s-mountHud-onLaunch) · [`mountHud>setMode.clean`](#s-mountHud-setMode-clean)

<!-- note:sanitizeRoom -->
<!-- /note -->

### <a id="s-makePrivateCode"></a>`makePrivateCode()`

function · L248–253

- called by: [`mountHud.rollSeed`](#s-mountHud-rollSeed) ×2 · [`mountHud>setMode.rollSeed`](#s-mountHud-setMode-rollSeed) ×2

<!-- note:makePrivateCode -->
<!-- /note -->

### <a id="s-fmtDist"></a>`fmtDist(d)`

function · L255–261

- called by: [`mountHud>paintAll`](#s-mountHud-paintAll) ×5

<!-- note:fmtDist -->
1 unit = 10 m. Read out in units up close, kilometres once it matters.
<!-- /note -->

### <a id="s-fmtNum"></a>`fmtNum(n, dp=)`

function · L263–265

- called by: [`mountHud>paintAll`](#s-mountHud-paintAll) ×2

<!-- note:fmtNum -->
<!-- /note -->

### <a id="s-esc"></a>`esc(s)`

function · L267–269

- called by: [`mountHud>paintAll`](#s-mountHud-paintAll) ×5

<!-- note:esc -->
Names on the glass can come off the wire (peers, ports). Never let them run as markup.
<!-- /note -->

### <a id="s-bindPad"></a>`bindPad(el, knob, onMove, onEnd)`

function · L271–322

- calls: [`bindPad>setKnob`](#s-bindPad-setKnob)
- called by: [`mountHud`](#s-mountHud)
- effects: event.listen `pointerdown` · event.listen `pointermove` · event.listen `pointerup` · event.listen `pointercancel`

<!-- note:bindPad -->
Floating-origin thumbstick. Wherever your thumb lands becomes centre, so
touching down never snaps the nose — you only get deflection once you
actually move. A small radial deadzone keeps a resting thumb from drifting.

- L311 · `try { el.setPointerCapture(e.pointerId); } catch {` — pointer already gone
<!-- /note -->

#### <a id="s-bindPad-setKnob"></a>`bindPad>setKnob(nx, ny)`

function · L278–281

- called by: [`bindPad`](#s-bindPad) · [`bindPad>end`](#s-bindPad-end) · [`bindPad>move`](#s-bindPad-move)

<!-- note:bindPad>setKnob -->
<!-- /note -->

#### <a id="s-bindPad-move"></a>`bindPad>move(e)`

function · L283–300

- calls: [`bindPad>setKnob`](#s-bindPad-setKnob)

<!-- note:bindPad>move -->
<!-- /note -->

#### <a id="s-bindPad-end"></a>`bindPad>end(e)`

function · L302–307

- calls: [`bindPad>setKnob`](#s-bindPad-setKnob)

<!-- note:bindPad>end -->
<!-- /note -->

### <a id="s-bindHold"></a>`bindHold(el, down, up)`

function · L324–342

- called by: [`mountHud`](#s-mountHud) ×2
- effects: event.listen `pointerdown` · event.listen `pointerup` · event.listen `pointercancel` · event.listen `pointerleave`

<!-- note:bindHold -->
<!-- /note -->

#### <a id="s-bindHold-d"></a>`bindHold>d(e)`

function · L325–333

<!-- note:bindHold>d -->
- L330 · `}` — not capturable
<!-- /note -->

#### <a id="s-bindHold-u"></a>`bindHold>u()`

function · L334–337

<!-- note:bindHold>u -->
<!-- /note -->

### <a id="s-bindThrottle"></a>`bindThrottle(track, fill, thumb)`

function · L344–392

- calls: [`setThrottle`](../sim/sim.js.md#s-setThrottle) _js/sim/sim.js_ · [`bindThrottle>set`](#s-bindThrottle-set) ×2
- called by: [`mountHud`](#s-mountHud)
- effects: event.listen `pointerdown` · event.listen `pointermove` · dom.query `#thr-presets [data-thr]` · event.listen `click` · event.listen `pointerup` · event.listen `pointercancel`

<!-- note:bindThrottle -->
---- throttle slider -----------------------------------------------------

- L357 · `try { track.setPointerCapture(e.pointerId); } catch {` — pointer already gone
- L377 · `const frac = (THROTTLE_MAX - t) / THR_SPAN;` — 0 at top
<!-- /note -->

#### <a id="s-bindThrottle-set"></a>`bindThrottle>set(clientY)`

function · L346–354

- calls: [`setThrottle`](../sim/sim.js.md#s-setThrottle) _js/sim/sim.js_
- called by: [`bindThrottle`](#s-bindThrottle) ×2

<!-- note:bindThrottle>set -->
- L350 · `v = Math.round(v * 100) / 100;` — 1% detents, and a magnet on the zero stop
<!-- /note -->

#### <a id="s-bindThrottle-end"></a>`bindThrottle>end(e)`

function · L364–369

- calls: [`setThrottle`](../sim/sim.js.md#s-setThrottle) _js/sim/sim.js_

<!-- note:bindThrottle>end -->
the slider is momentary: let go and it springs back to zero. Held thrust is a preset.
<!-- /note -->

### <a id="s-MARKER"></a>`MARKER`

const · L394–403

<!-- note:MARKER -->
---- markers -------------------------------------------------------------

Every mark on the glass says what it is. Nothing unexplained.
<!-- /note -->

### <a id="s-paintMarkers"></a>`paintMarkers(box)`

function · L405–418

- called by: [`mountHud>paintAll`](#s-mountHud-paintAll)

<!-- note:paintMarkers -->
<!-- /note -->

### <a id="s-TURRET_IX"></a>`TURRET_IX`

const · L420–420

<!-- note:TURRET_IX -->
---- mount ---------------------------------------------------------------

The tape's read of the world (js/flight/recorder.js).

It lives here rather than in sim.js because the numbers it wants are spread
across four modules that all import sim — the seam finder and the bus rule
from the autopilot, the contact list from the turrets, the mission step from
the runner — and a sampler in sim.js would have to import every one of them
back. The HUD already depends on all of it.

Distances go out in KILOMETRES, not units: a feature that runs to six figures
swamps a 0..1 hull fraction in any distance metric that is not hand-weighted,
and km keeps the whole vector inside roughly the same decade.
<!-- /note -->

### <a id="s-CUTTER_IX"></a>`CUTTER_IX`

const · L421–421

<!-- note:CUTTER_IX -->
<!-- /note -->

### <a id="s-PHASE_IX"></a>`PHASE_IX`

const · L422–422

<!-- note:PHASE_IX -->
<!-- /note -->

### <a id="s-sampleWorld"></a>`sampleWorld()`

function · L424–462

- calls: [`busOverload`](../flight/autopilot.js.md#s-busOverload) _js/flight/autopilot.js_ · [`nearestSeam`](../flight/autopilot.js.md#s-nearestSeam) _js/flight/autopilot.js_ · [`hullMaxOf`](../flight/repair.js.md#s-hullMaxOf) _js/flight/repair.js_ · [`cargoTotal`](../flight/ship.js.md#s-cargoTotal) _js/flight/ship.js_

<!-- note:sampleWorld -->
- L437 · `} catch {` — no field loaded yet
- L443 · `try { const b = busOverload(ship); bus = b.demand && b.cap ? b.demand / b.cap : 0; } catch` — pre-launch
<!-- /note -->

### <a id="s-holdOpen"></a>`holdOpen`

const · L464–464

<!-- note:holdOpen -->
0.3.29 — the hold panel: open state and its own repaint, throttled, because
the bag changes while the cutter runs and a per-frame rebuild of a slot grid
on a phone is not free.
<!-- /note -->

### <a id="s-holdPaintedAt"></a>`holdPaintedAt`

const · L465–465

<!-- note:holdPaintedAt -->
<!-- /note -->

### <a id="s-paintHold"></a>`paintHold()`

function · L466–471

- calls: [`renderHold`](holdview.js.md#s-renderHold) _js/ui/holdview.js_
- called by: [`mountHud>paintAll`](#s-mountHud-paintAll) · [`mountHud>toggleHold`](#s-mountHud-toggleHold)
- effects: dom.id `hold-body`

<!-- note:paintHold -->
<!-- /note -->

#### <a id="s-paintHold-onChange"></a>`paintHold.onChange()`

prop · L470–470

<!-- note:paintHold.onChange -->
<!-- /note -->

### <a id="s-mountHud"></a>`mountHud()`

function · **exported** · L473–1201

- calls: [`ariaHasConn`](../aria/aria.js.md#s-ariaHasConn) _js/aria/aria.js_ ×2 · [`ariaRelease`](../aria/aria.js.md#s-ariaRelease) _js/aria/aria.js_ · [`ariaTakeConn`](../aria/aria.js.md#s-ariaTakeConn) _js/aria/aria.js_ · [`busLevels`](../audio/graph.js.md#s-busLevels) _js/audio/graph.js_ ×2 · [`resetMix`](../audio/graph.js.md#s-resetMix) _js/audio/graph.js_ · [`setAudioMuted`](../audio/index.js.md#s-setAudioMuted) _js/audio/index.js_ · [`unlockAudio`](../audio/index.js.md#s-unlockAudio) _js/audio/index.js_ ×2 · [`mountComms`](../comms/comms.js.md#s-mountComms) _js/comms/comms.js_ · [`wireCommsTest`](../comms/comms.js.md#s-wireCommsTest) _js/comms/comms.js_ · [`mountConsole`](../console/console.js.md#s-mountConsole) _js/console/console.js_ · [`toggleConsole`](../console/console.js.md#s-toggleConsole) _js/console/console.js_ · [`loadSave`](../core/store.js.md#s-loadSave) _js/core/store.js_ ×4 · [`randomCallsign`](../core/store.js.md#s-randomCallsign) _js/core/store.js_ · [`wireCompany`](../corp/company.js.md#s-wireCompany) _js/corp/company.js_ · [`wireFleet`](../corp/fleet.js.md#s-wireFleet) _js/corp/fleet.js_ · [`disconnectGdb`](../corp/gdb.js.md#s-disconnectGdb) _js/corp/gdb.js_ · [`wireFamily`](../crew/family.js.md#s-wireFamily) _js/crew/family.js_ · [`wireContracts`](../economy/contracts.js.md#s-wireContracts) _js/economy/contracts.js_ · [`wireIcework`](../economy/icework.js.md#s-wireIcework) _js/economy/icework.js_ · [`wireAutopilot`](../flight/autopilot.js.md#s-wireAutopilot) _js/flight/autopilot.js_ · [`loadPilot`](../flight/pilot.js.md#s-loadPilot) _js/flight/pilot.js_ ×3 · [`restorePilot`](../flight/pilot.js.md#s-restorePilot) _js/flight/pilot.js_ · [`record`](../flight/recorder.js.md#s-record) _js/flight/recorder.js_ ×2 · [`wireRecorder`](../flight/recorder.js.md#s-wireRecorder) _js/flight/recorder.js_ · [`mountInterior`](../interior/interior.js.md#s-mountInterior) _js/interior/interior.js_ · [`eraseGuest`](../net/account.js.md#s-eraseGuest) _js/net/account.js_ · [`disconnectNet`](../net/net.js.md#s-disconnectNet) _js/net/net.js_ · [`wireCaptainTest`](../npc/captain.js.md#s-wireCaptainTest) _js/npc/captain.js_ · [`wireNpcChat`](../npc/chat.js.md#s-wireNpcChat) _js/npc/chat.js_ · [`disconnectCradle`](../npc/cradle.js.md#s-disconnectCradle) _js/npc/cradle.js_ · [`autoLevel`](../sim/sim.js.md#s-autoLevel) _js/sim/sim.js_ · [`claimPort`](../sim/sim.js.md#s-claimPort) _js/sim/sim.js_ · [`cycleMiningMode`](../sim/sim.js.md#s-cycleMiningMode) _js/sim/sim.js_ · [`cycleTimeScale`](../sim/sim.js.md#s-cycleTimeScale) _js/sim/sim.js_ · [`cycleTurretMode`](../sim/sim.js.md#s-cycleTurretMode) _js/sim/sim.js_ · [`dismissNotice`](../sim/sim.js.md#s-dismissNotice) _js/sim/sim.js_ · [`requestJump`](../sim/sim.js.md#s-requestJump) _js/sim/sim.js_ · [`requestScan`](../sim/sim.js.md#s-requestScan) _js/sim/sim.js_ · [`resumePlay`](../sim/sim.js.md#s-resumePlay) _js/sim/sim.js_ ×3 · [`returnToMenu`](../sim/sim.js.md#s-returnToMenu) _js/sim/sim.js_ · [`sensorPulse`](../sim/sim.js.md#s-sensorPulse) _js/sim/sim.js_ · [`setMiningMode`](../sim/sim.js.md#s-setMiningMode) _js/sim/sim.js_ ×2 · [`toggleDock`](../sim/sim.js.md#s-toggleDock) _js/sim/sim.js_ · [`togglePointerLock`](../sim/sim.js.md#s-togglePointerLock) _js/sim/sim.js_ · [`toggleSystem`](../sim/sim.js.md#s-toggleSystem) _js/sim/sim.js_ ×2 · [`mountStationDeck`](../station/stationdeck.js.md#s-mountStationDeck) _js/station/stationdeck.js_ · [`mountChatbox`](chatbox.js.md#s-mountChatbox) _js/ui/chatbox.js_ · [`mountCreation`](creation.js.md#s-mountCreation) _js/ui/creation.js_ · [`mountDockBoot`](dockboot.js.md#s-mountDockBoot) _js/ui/dockboot.js_ · [`mountFullscreen`](fullscreen.js.md#s-mountFullscreen) _js/ui/fullscreen.js_ · [`$`](#s-S) ×54 · [`bindHold`](#s-bindHold) ×2 · [`bindOrient`](#s-bindOrient) · [`bindPad`](#s-bindPad) · [`bindThrottle`](#s-bindThrottle) · [`mountHud>go`](#s-mountHud-go) · [`mountHud>onAccount`](#s-mountHud-onAccount) · [`mountHud>paint`](#s-mountHud-paint) · [`mountHud>paintRow`](#s-mountHud-paintRow) · [`mountHud>paintStart`](#s-mountHud-paintStart) ×2 · [`mountHud>queueSky`](#s-mountHud-queueSky) ×2 · [`mountHud>refreshPreview`](#s-mountHud-refreshPreview) · [`mountHud>setMode`](#s-mountHud-setMode) · [`mountHud>setPage`](#s-mountHud-setPage) ×2 · [`sanitizeRoom`](#s-sanitizeRoom) ×2 · [`mountMap`](map.js.md#s-mountMap) _js/ui/map.js_ · [`mountSecBadge`](secbadge.js.md#s-mountSecBadge) _js/ui/secbadge.js_ · [`startTutorial`](tutorial.js.md#s-startTutorial) _js/ui/tutorial.js_ · [`wireAtmoWorks`](../world/events/atmoworks.js.md#s-wireAtmoWorks) _js/world/events/atmoworks.js_
- via [js/audio/index.js](../audio/index.js.md): `UI.press`, `UI.tap`, `UI.toggleOn`
- called by: [`@file`](../main.js.md#) _js/main.js_
- effects: dom.id `callsign` · dom.id `build-line` · event.listen `input` · dom.id `btn-continue` · dom.id `btn-create` · event.listen `click` · dom.id `hangar` · dom.query `label` · event.listen `lg-account` · timer `setTimeout` · dom.id `stick` · dom.id `stick-knob` · dom.query `[data-rcs]` · dom.id `btn-brake` · dom.id `thr-track` · dom.id `thr-fill` · dom.id `thr-thumb` · dom.query `button[data-page]` · dom.id `dash-tabs` · dom.id `sw-cut` · dom.query `.sw[data-sys]` · dom.id `mode-turret` · dom.id `mode-mining` · dom.id `op-pulse` · dom.id `op-level` · dom.id `op-time` · dom.id `op-dock` · dom.id `op-claim` · dom.id `op-threat` · dom.id `btn-survey` · dom.id `btn-plock` · dom.id `btn-warp` · dom.id `btn-con` · dom.id `btn-cam` · dom.id `btn-pause` · dom.id `btn-resume` · dom.id `btn-tutor` · dom.id `btn-watch` · dom.id `btn-menu` · dom.id `btn-map` · dom.id `btn-hold` · dom.id `g-cgo-btn` · dom.id `hold-close` · dom.id `hold` · dom.id `btn-aria` · dom.id `btn-full` · dom.id `btn-map-close` · dom.id `btn-mute` · dom.id `mix-rows` · dom.id `btn-mix-reset` · event.listen `pointerdown` · dom.query `button, .btn, .tbtn, .pick, .chip` · dom.query `.st` · dom.id `notice-card` · dom.id `canopy` · dom.id `markers` · dom.id `impact-flash` · dom.id `sky-glare` · dom.id `warp-fill` · dom.id `warp-state` · bus.on `‹paint›`

<!-- note:mountHud -->
- L475 · `wireRecorder({` — The tape. `who` is what keeps ARIA from training on itself: the same
  record shape, a different label, and the readers default to the player's
  own hands (js/flight/recorder.js).
- L479 · `missionHooks.onStep = (st, ix) => tapeRecord("mission", st.op, st.target?.name ?? st.targe` — Missions go on the tape through the runner's own hooks rather than a call
  inside it: js/mission/run.js already fires onStep as each step begins and
  onEnd when a run finishes, nothing had claimed either, and a record per
  STEP is better training data than one per mission — "docked, so sell" and
  "hold full, so break off and go home" are separate decisions and the tape
  should hold them separately.
- L489 · `let seedKey = initialRoom && initialRoom !== PUBLIC_ROOM ? sanitizeRoom(initialRoom) : PUB` — The seed IS the sky. Sol is the shared one; anything else grows its own.
- L490 · `if (!initialRoom) {` — 0.3.61 — a returning pilot's backdrop is the sky FLY AS will take them to.
  It used to be Sol regardless, so a pilot last in a private sky had the
  menu grow Sol (ports, surfaces) and then grow their own sky from nothing
  on the tap.
- L518 · `let solPrime = null;` — 0.3.73: Sol's clock and state are asked for while the start card is up, so
  FLY AS into Sol builds the live sky once instead of building one and then
  jumping it (net.js primeSol). Refreshed if it is older than 20 s.
- L555 · `const buildEl = $("build-line");` — one place knows what this build is (js/version.js); the start card just
  prints it, so the tab title, the HUD corner and this line cannot drift
- L560 · `const creation = mountCreation({` — Pilot creation. The backdrop keeps rendering behind it, which is how the
  surfaces get painted before you ever reach the cockpit.
- L573 · `const contBtn = $("btn-continue");` — 0.3.42 — FLY AS &lt;callsign>. A device with a pilot record and a save flies
  on as that pilot: race, rank, skills, hulls, cover, purse, corp, fleet,
  into the sky they were last in. "New pilot" is the creation screen as
  before, which is a NEW RUN and sweeps all of that — so it asks first.
- L599 · `if (startMode === "guest") { eraseGuest(); unlockAudio(); creation.show(); return; }` — 0.3.74: a guest's pilot is never kept
- L608 · `let startMode = "pending";` — ---- 0.3.74: who is at the start card decides what it offers ------------
    "local"  — no site behind this page (server.py): FLY AS / CREATE, as ever
    "guest"  — the site, nobody verified signed in: one CREATE, straight into
               Sol, and nothing kept (account.js erased the last guest's pilot)
    "hangar" — signed in: system first, then that system's pilots, or a new one
  js/net/account.js announces which once its probe is back ("lg-account").
- L671 · `setTimeout(() => { if (startMode === "pending") setMode("local"); }, 6000);` — never hold the card forever: no answer from the account probe in 6 s → the card as it always was
- L674 · `bindPad(` — --- pan stick: this is the nose ---
- L687 · `const RCS_MAP = {` — --- RCS cluster ---
- L717 · `const paintThrottle = bindThrottle($("thr-track"), $("thr-fill"), $("thr-thumb"));` — --- throttle ---
- L720 · `const PAGE_NAME = { 1: "FLIGHT", 2: "OPS", 3: "COMMS" };` — --- dash pages ---
- L735 · `let lastCut = "closest";` — --- switchboard (both pages share the data-sys contract) ---
- L735 · `let lastCut = "closest";` — The cutter: one tap on / off, remembering which mode it was in.
  
  It is NOT on the data-sys contract because it is not a boolean — off,
  closest and overdrive — and the pilot asked for a switch, not a cycle. So
  the switch toggles between off and whatever it was last set to, and
  OVERDRIVE stays where it always was (the CON, and the existing cycle) for
  when you actually want it.
- L747 · `$("op-pulse").addEventListener("click", () => sensorPulse());` — --- ops board ---
- L757 · `$("btn-survey").addEventListener("click", () => requestScan());` — --- actions ---
- L769 · `$("btn-tutor").addEventListener("click", () => {` — farm the neural core: while an NPC holds the conn, let them fly at 40×
- L792 · `$("btn-aria").addEventListener("click", () => {` — ARIA: one tap hands it the ship, one tap (or the stick) takes it back
- L797 · `mountFullscreen({` — Fullscreen: the phone's own bars off the canopy. The request has to come
  from this tap — the module refuses to ask any other way — and if the
  browser turns it down the reason goes on the HUD rather than nowhere.
- L809 · `{` — ---- the mixer ----
  Five named buses and a master, saved to localStorage. The reason it
  exists rather than one volume: an engine bed you cannot turn down
  without also turning down the collision alarm is an engine bed the
  player mutes, and then they lose the alarm too.
- L840 · `document.addEventListener("pointerdown", (e) => {` — One delegated listener instead of a cue on every button in the game.
  Anything that wants a different sound fires its own and marks itself
  data-quiet, so this never doubles up.
- L850 · `const SW_LABEL = {` — --- switch labels ---
- L850 · `const SW_LABEL = {` — Short enough to survive a 60px switch cap on a small phone.
- L916 · `let clockKey = "";` — 0.3.52 — port standard time on the title bar: the day, the hour, and a
  glyph for the part of it. The whole HUD carries the part as data-part so
  the night can dim it. Repaints only when the minute turns.
- L933 · `let paintFailed = 0;` — The HUD paints from the ENGINE's frame tick (sim.publishHud → store → here),
  so anything that throws in a panel, the chart or a readout used to take the
  tick with it — before the renderer ran. One bad line froze the canopy every
  frame until the page was reloaded. The HUD is allowed to be wrong for a
  frame; the game is not allowed to stop drawing.
- L1189 · `mountComms();` — the channel overlay lives on the HUD and ticks itself off sim time
<!-- /note -->

#### <a id="s-mountHud-who"></a>`mountHud.who()`

prop · L477–477

<!-- note:mountHud.who -->
<!-- /note -->

#### <a id="s-mountHud-describeSeed"></a>`mountHud>describeSeed(seed)`

function · L497–507

- calls: [`describeSystem`](../world/generate.js.md#s-describeSystem) _js/world/generate.js_ · [`generateSystem`](../world/generate.js.md#s-generateSystem) _js/world/generate.js_
- called by: [`mountHud.describe`](#s-mountHud-describe) · [`mountHud>refreshPreview`](#s-mountHud-refreshPreview)

<!-- note:mountHud>describeSeed -->
<!-- /note -->

#### <a id="s-mountHud-refreshPreview"></a>`mountHud>refreshPreview()`

function · L509–515

- calls: [`skyProgress`](../core/store.js.md#s-skyProgress) _js/core/store.js_ · [`$`](#s-S) ×3 · [`mountHud>describeSeed`](#s-mountHud-describeSeed) · [`generateSystem`](../world/generate.js.md#s-generateSystem) _js/world/generate.js_
- called by: [`mountHud`](#s-mountHud) · [`mountHud>queueSky`](#s-mountHud-queueSky)
- effects: dom.id `sys-line` · dom.id `stat-survey` · dom.id `stat-probes`

<!-- note:mountHud>refreshPreview -->
<!-- /note -->

#### <a id="s-mountHud-askSol"></a>`mountHud>askSol()`

function · L519–523

- calls: [`primeSol`](../net/net.js.md#s-primeSol) _js/net/net.js_
- called by: [`mountHud>go`](#s-mountHud-go) · [`mountHud>queueSky`](#s-mountHud-queueSky)

<!-- note:mountHud>askSol -->
<!-- /note -->

#### <a id="s-mountHud-queueSky"></a>`mountHud>queueSky()`

function · L524–529

- calls: [`loadSky`](../sim/sim.js.md#s-loadSky) _js/sim/sim.js_ · [`mountHud>askSol`](#s-mountHud-askSol) · [`mountHud>refreshPreview`](#s-mountHud-refreshPreview)
- called by: [`mountHud`](#s-mountHud) ×2 · [`mountHud.onSeed`](#s-mountHud-onSeed) · [`mountHud>setMode`](#s-mountHud-setMode) ×2 · [`mountHud>setMode.setSystem`](#s-mountHud-setMode-setSystem)
- effects: timer `setTimeout`

<!-- note:mountHud>queueSky -->
<!-- /note -->

#### <a id="s-mountHud-go"></a>`mountHud>go(seed)`

function · async · L532–551

- calls: [`unlockAudio`](../audio/index.js.md#s-unlockAudio) _js/audio/index.js_ · [`connectGdb`](../corp/gdb.js.md#s-connectGdb) _js/corp/gdb.js_ · [`connectNet`](../net/net.js.md#s-connectNet) _js/net/net.js_ · [`applySolPrime`](../net/worldsync.js.md#s-applySolPrime) _js/net/worldsync.js_ · [`mountWorldSync`](../net/worldsync.js.md#s-mountWorldSync) _js/net/worldsync.js_ · [`resetWorldSync`](../net/worldsync.js.md#s-resetWorldSync) _js/net/worldsync.js_ · [`connectCradle`](../npc/cradle.js.md#s-connectCradle) _js/npc/cradle.js_ · [`launchSim`](../sim/sim.js.md#s-launchSim) _js/sim/sim.js_ · [`mountHud>askSol`](#s-mountHud-askSol) · [`startTutorial`](tutorial.js.md#s-startTutorial) _js/ui/tutorial.js_
- called by: [`mountHud`](#s-mountHud) · [`mountHud.onLaunch`](#s-mountHud-onLaunch) · [`mountHud>setMode.onFly`](#s-mountHud-setMode-onFly)

<!-- note:mountHud>go -->
- L540 · `solPrime = null;` — one prime, one launch
- L544 · `startTutorial(false);` — first flight on this device gets the walkthrough; it reads the sky it is in
- L545 · `resetWorldSync();` — same sky, same room: whoever else typed this name is on your sensors —
  one host runs the rocks, one clock runs the ports and the traffic
<!-- /note -->

#### <a id="s-mountHud-rollSeed"></a>`mountHud.rollSeed()`

prop · L561–561

- calls: [`makePrivateCode`](#s-makePrivateCode) ×2

<!-- note:mountHud.rollSeed -->
<!-- /note -->

#### <a id="s-mountHud-onSeed"></a>`mountHud.onSeed(seed)`

prop · L562–565

- calls: [`mountHud>queueSky`](#s-mountHud-queueSky)

<!-- note:mountHud.onSeed -->
<!-- /note -->

#### <a id="s-mountHud-describe"></a>`mountHud.describe(seed)`

prop · L566–566

- calls: [`mountHud>describeSeed`](#s-mountHud-describeSeed)

<!-- note:mountHud.describe -->
<!-- /note -->

#### <a id="s-mountHud-systemName"></a>`mountHud.systemName(seed)`

prop · L567–567

- calls: [`generateSystem`](../world/generate.js.md#s-generateSystem) _js/world/generate.js_

<!-- note:mountHud.systemName -->
<!-- /note -->

#### <a id="s-mountHud-loadedSeed"></a>`mountHud.loadedSeed()`

prop · L568–568

<!-- note:mountHud.loadedSeed -->
<!-- /note -->

#### <a id="s-mountHud-normalizeSeed"></a>`mountHud.normalizeSeed(seed)`

prop · L569–569

- calls: [`sanitizeRoom`](#s-sanitizeRoom)

<!-- note:mountHud.normalizeSeed -->
<!-- /note -->

#### <a id="s-mountHud-onLaunch"></a>`mountHud.onLaunch(seed)`

prop · L570–570

- calls: [`mountHud>go`](#s-mountHud-go) · [`sanitizeRoom`](#s-sanitizeRoom)

<!-- note:mountHud.onLaunch -->
<!-- /note -->

#### <a id="s-mountHud-fixedSky"></a>`mountHud.fixedSky()`

prop · L571–571

<!-- note:mountHud.fixedSky -->
0.3.74: a guest flies in Sol; a signed-in pilot is made in the system the hangar chose
<!-- /note -->

#### <a id="s-mountHud-paintStart"></a>`mountHud>paintStart()`

function · L575–586

- calls: [`loadSave`](../core/store.js.md#s-loadSave) _js/core/store.js_ · [`loadPilot`](../flight/pilot.js.md#s-loadPilot) _js/flight/pilot.js_
- called by: [`mountHud`](#s-mountHud) ×2 · [`mountHud>setMode`](#s-mountHud-setMode)

<!-- note:mountHud>paintStart -->
<!-- /note -->

#### <a id="s-mountHud-setMode"></a>`mountHud>setMode(mode)`

function · L612–667

- calls: [`mountHangar`](hangar.js.md#s-mountHangar) _js/ui/hangar.js_ · [`mountHud>paintStart`](#s-mountHud-paintStart) · [`mountHud>queueSky`](#s-mountHud-queueSky) ×2
- via [js/net/account.js](../net/account.js.md): `account.pilots.some`
- called by: [`mountHud`](#s-mountHud) · [`mountHud>onAccount`](#s-mountHud-onAccount)
- effects: global.write `window.__lgFlyQueued`

<!-- note:mountHud>setMode -->
- L615 · `globalThis.document?.documentElement.classList.remove("start-pending");` — 0.3.75: index.html held the card until now
- L616 · `if (mode === "hangar" && again && hangar) { hangar.render(); return; }` — the pilot list arriving after the probe
- L617 · `if (callLabel) callLabel.style.display = mode === "hangar" ? "none" : "";` — the label's CSS display beats [hidden]
- L663 · `if (globalThis.window?.__lgFlyQueued) {` — 0.3.61's early FLY AS tap is honoured only where FLY AS still exists
<!-- /note -->

##### <a id="s-mountHud-setMode-system"></a>`mountHud>setMode.system()`

prop · L628–628

<!-- note:mountHud>setMode.system -->
<!-- /note -->

##### <a id="s-mountHud-setMode-setSystem"></a>`mountHud>setMode.setSystem(seed)`

prop · L629–629

- calls: [`mountHud>queueSky`](#s-mountHud-queueSky)

<!-- note:mountHud>setMode.setSystem -->
<!-- /note -->

##### <a id="s-mountHud-setMode-rollSeed"></a>`mountHud>setMode.rollSeed()`

prop · L630–630

- calls: [`makePrivateCode`](#s-makePrivateCode) ×2

<!-- note:mountHud>setMode.rollSeed -->
<!-- /note -->

##### <a id="s-mountHud-setMode-clean"></a>`mountHud>setMode.clean(t)`

prop · L631–631

- calls: [`sanitizeRoom`](#s-sanitizeRoom)

<!-- note:mountHud>setMode.clean -->
<!-- /note -->

##### <a id="s-mountHud-setMode-name"></a>`mountHud>setMode.name(seed)`

prop · L633–633

- calls: [`generateSystem`](../world/generate.js.md#s-generateSystem) _js/world/generate.js_

<!-- note:mountHud>setMode.name -->
<!-- /note -->

##### <a id="s-mountHud-setMode-onFly"></a>`mountHud>setMode.onFly(p, seed)`

prop · async · L634–642

- calls: [`loadSave`](../core/store.js.md#s-loadSave) _js/core/store.js_ · [`loadPilot`](../flight/pilot.js.md#s-loadPilot) _js/flight/pilot.js_ · [`restorePilot`](../flight/pilot.js.md#s-restorePilot) _js/flight/pilot.js_ · [`flyPilot`](../net/account.js.md#s-flyPilot) _js/net/account.js_ · [`$`](#s-S) · [`mountHud>go`](#s-mountHud-go)
- effects: dom.id `callsign`

<!-- note:mountHud>setMode.onFly -->
<!-- /note -->

##### <a id="s-mountHud-setMode-onNew"></a>`mountHud>setMode.onNew(seed)`

prop · L643–648

- calls: [`unlockAudio`](../audio/index.js.md#s-unlockAudio) _js/audio/index.js_ · [`newPilotSlot`](../net/account.js.md#s-newPilotSlot) _js/net/account.js_

<!-- note:mountHud>setMode.onNew -->
- L647 · `creation.show({ askName: true });` — 0.3.75: named on the record, not on the start card
<!-- /note -->

##### <a id="s-mountHud-setMode-onDelete"></a>`mountHud>setMode.onDelete(p)`

prop · L649–649

- calls: [`deletePilot`](../net/account.js.md#s-deletePilot) _js/net/account.js_

<!-- note:mountHud>setMode.onDelete -->
<!-- /note -->

#### <a id="s-mountHud-onAccount"></a>`mountHud>onAccount()`

function · L668–668

- calls: [`mountHud>setMode`](#s-mountHud-setMode)
- called by: [`mountHud`](#s-mountHud)

<!-- note:mountHud>onAccount -->
<!-- /note -->

#### <a id="s-mountHud-continueRun"></a>`mountHud.continueRun()`

prop · L672–672

<!-- note:mountHud.continueRun -->
<!-- /note -->

#### <a id="s-mountHud-mode"></a>`mountHud.mode()`

prop · L672–672

<!-- note:mountHud.mode -->
<!-- /note -->

#### <a id="s-mountHud-hangar"></a>`mountHud.hangar()`

prop · L672–672

<!-- note:mountHud.hangar -->
<!-- /note -->

#### <a id="s-mountHud-setPage"></a>`mountHud>setPage(n)`

function · L722–729

- calls: [`$`](#s-S) ×3
- called by: [`mountHud`](#s-mountHud) ×2
- effects: dom.id `dash-page-${…}` · dom.query `button` · dom.id `dash-tabs` · dom.id `dash-page-name`

<!-- note:mountHud>setPage -->
<!-- /note -->

#### <a id="s-mountHud-toggleHold"></a>`mountHud>toggleHold()`

function · L787–787

- calls: [`paintHold`](#s-paintHold)

<!-- note:mountHud>toggleHold -->
0.3.29 — the bag opens from the tools row (always there) and from the CGO
gauge (landscape only — the gauge strip is display:none in portrait, which
is how the game is actually held).
<!-- /note -->

#### <a id="s-mountHud-onChange"></a>`mountHud.onChange(on, why)`

prop · L799–799

<!-- note:mountHud.onChange -->
<!-- /note -->

#### <a id="s-mountHud-paintRow"></a>`mountHud>paintRow(name)`

function · L812–827

- calls: [`setBusLevel`](../audio/graph.js.md#s-setBusLevel) _js/audio/graph.js_
- called by: [`mountHud`](#s-mountHud)
- effects: dom.create `div` · dom.create `label` · dom.create `input` · dom.create `b` · event.listen `input`

<!-- note:mountHud>paintRow -->
<!-- /note -->

#### <a id="s-mountHud-shields"></a>`mountHud.shields(on)`

prop · L851–851

<!-- note:mountHud.shields -->
<!-- /note -->

#### <a id="s-mountHud-turretsArmed"></a>`mountHud.turretsArmed(on)`

prop · L852–852

<!-- note:mountHud.turretsArmed -->
<!-- /note -->

#### <a id="s-mountHud-engines"></a>`mountHud.engines(on)`

prop · L853–853

<!-- note:mountHud.engines -->
<!-- /note -->

#### <a id="s-mountHud-pressurized"></a>`mountHud.pressurized(on)`

prop · L854–854

<!-- note:mountHud.pressurized -->
<!-- /note -->

#### <a id="s-mountHud-localGravity"></a>`mountHud.localGravity(on)`

prop · L855–855

<!-- note:mountHud.localGravity -->
<!-- /note -->

#### <a id="s-mountHud-assist"></a>`mountHud.assist(on)`

prop · L856–856

<!-- note:mountHud.assist -->
<!-- /note -->

#### <a id="s-mountHud-lights"></a>`mountHud.lights(on)`

prop · L857–857

<!-- note:mountHud.lights -->
<!-- /note -->

#### <a id="s-mountHud-sentry"></a>`mountHud.sentry(on)`

prop · L858–858

<!-- note:mountHud.sentry -->
<!-- /note -->

#### <a id="s-mountHud-salvage"></a>`mountHud.salvage(on)`

prop · L859–859

<!-- note:mountHud.salvage -->
<!-- /note -->

#### <a id="s-mountHud-matchLock"></a>`mountHud.matchLock(on)`

prop · L860–860

<!-- note:mountHud.matchLock -->
<!-- /note -->

#### <a id="s-mountHud-shields-2"></a>`mountHud.shields~2(s)`

prop · L875–875

<!-- note:mountHud.shields~2 -->
<!-- /note -->

#### <a id="s-mountHud-turretsArmed-2"></a>`mountHud.turretsArmed~2(s)`

prop · L876–876

<!-- note:mountHud.turretsArmed~2 -->
<!-- /note -->

#### <a id="s-mountHud-engines-2"></a>`mountHud.engines~2(s)`

prop · L877–877

<!-- note:mountHud.engines~2 -->
<!-- /note -->

#### <a id="s-mountHud-pressurized-2"></a>`mountHud.pressurized~2(s)`

prop · L878–878

<!-- note:mountHud.pressurized~2 -->
<!-- /note -->

#### <a id="s-mountHud-localGravity-2"></a>`mountHud.localGravity~2(s)`

prop · L879–879

<!-- note:mountHud.localGravity~2 -->
<!-- /note -->

#### <a id="s-mountHud-assist-2"></a>`mountHud.assist~2(s)`

prop · L880–880

<!-- note:mountHud.assist~2 -->
<!-- /note -->

#### <a id="s-mountHud-lights-2"></a>`mountHud.lights~2(s)`

prop · L881–881

<!-- note:mountHud.lights~2 -->
<!-- /note -->

#### <a id="s-mountHud-sentry-2"></a>`mountHud.sentry~2(s)`

prop · L882–882

<!-- note:mountHud.sentry~2 -->
<!-- /note -->

#### <a id="s-mountHud-salvage-2"></a>`mountHud.salvage~2(s)`

prop · L883–883

<!-- note:mountHud.salvage~2 -->
<!-- /note -->

#### <a id="s-mountHud-matchLock-2"></a>`mountHud.matchLock~2(s)`

prop · L884–884

<!-- note:mountHud.matchLock~2 -->
<!-- /note -->

#### <a id="s-mountHud-setGauge"></a>`mountHud>setGauge(bar, num, pct, text, low)`

function · L890–894

- called by: [`mountHud>paintAll`](#s-mountHud-paintAll) ×5

<!-- note:mountHud>setGauge -->
<!-- /note -->

#### <a id="s-mountHud-rowEl"></a>`mountHud>rowEl(kind, text, cls)`

function · L905–910

- called by: [`mountHud>paintAll`](#s-mountHud-paintAll) ×4
- effects: dom.create `div`

<!-- note:mountHud>rowEl -->
<!-- /note -->

#### <a id="s-mountHud-paintClock"></a>`mountHud>paintClock()`

function · L917–929

- calls: [`clockAt`](../station/stationclock.js.md#s-clockAt) _js/station/stationclock.js_ · [`$`](#s-S)
- called by: [`mountHud>paintAll`](#s-mountHud-paintAll)
- effects: dom.id `hud-clock` · dom.id `hud`

<!-- note:mountHud>paintClock -->
<!-- /note -->

#### <a id="s-mountHud-paint"></a>`mountHud>paint(...args)`

function · L934–938

- calls: [`mountHud>paintAll`](#s-mountHud-paintAll)
- called by: [`mountHud`](#s-mountHud)

<!-- note:mountHud>paint -->
<!-- /note -->

#### <a id="s-mountHud-paintAll"></a>`mountHud>paintAll()`

function · L939–1184

- calls: [`ariaHasConn`](../aria/aria.js.md#s-ariaHasConn) _js/aria/aria.js_ · [`settle`](../flight/recorder.js.md#s-settle) _js/flight/recorder.js_ · [`$`](#s-S) ×69 · [`esc`](#s-esc) ×5 · [`fmtDist`](#s-fmtDist) ×5 · [`fmtNum`](#s-fmtNum) ×2 · [`mountHud>paintClock`](#s-mountHud-paintClock) · [`mountHud>rowEl`](#s-mountHud-rowEl) ×4 · [`mountHud>setGauge`](#s-mountHud-setGauge) ×5 · [`paintHold`](#s-paintHold) · [`paintMarkers`](#s-paintMarkers) · [`stackLeftColumn`](#s-stackLeftColumn) · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_ ×2
- via [js/flight/ship.js](../flight/ship.js.md): `MINING_MODES.find`, `TURRET_MODES.find`
- called by: [`mountHud>paint`](#s-mountHud-paint)
- effects: dom.id `start` · dom.id `hud` · dom.id `pause` · dom.id `btn-watch` · dom.id `map` · dom.id `hold` · dom.id `btn-hold` · dom.id `btn-cam` · dom.id `btn-aria` · dom.id `hud-sky` · dom.id `i-vel` · dom.id `i-cls` · dom.id `i-alt` · dom.id `hazline` · dom.id `haz-text` · dom.id `respline` · dom.id `resp-text` · dom.id `i-g` · dom.id `instruments` · dom.id `g-pwr` · dom.id `g-pwr-n` · dom.id `g-hull` · dom.id `g-hull-n` · dom.id `g-shld` · dom.id `g-shld-n` · dom.id `g-o2` · dom.id `g-o2-n` · dom.id `g-cgo` · dom.id `g-cgo-n` · dom.id `alarms` · dom.id `lock-name` · dom.id `notice` · dom.id `status` · dom.id `btn-mute` · dom.id `btn-con` · dom.id `route-card` · dom.id `route-target` · dom.id `route-eta` · dom.id `route-hazards` · dom.id `thr-track` · dom.id `thr-num` · dom.id `thr-draw` · dom.id `sw-cut` · dom.query `.st` · dom.id `mode-turret-st` · dom.id `mode-turret` · dom.id `lockbar` · dom.id `lock-fill` · dom.id `lock-text` · dom.id `op-pulse-st` · dom.id `op-pulse` · dom.id `op-time-st` · dom.id `op-dock-st` · dom.id `op-dock` · dom.id `op-claim-st` · dom.id `op-claim` · dom.id `op-time` · dom.id `op-threat-st` · dom.id `op-threat` · dom.id `mode-mining-st` · dom.id `mode-mining` · dom.id `labels` · dom.id `heat-wash` · dom.id `toast`

<!-- note:mountHud>paintAll -->
- L942 · `if (playing) settleTape();` — Close out any tape record whose outcome window has run (js/flight/recorder.js).
  Cheap: it only touches records whose window has already closed.
- L943 · `if (creation.isOpen()) creation.progress(sim.texLoad?.done ?? 0, sim.texLoad?.total ?? 0);` — surface loader on the creation screen
- L966 · `$("i-vel").textContent = fmtNum(s.speed, s.speed < 100 ? 1 : 0);` — instruments
- L970 · `const hz = s.hazard;` — Collision warning. Level 1 is the ship telling you; 2 and 3 are the
  ship doing something about it, so the line says which — a hull that
  turns on its own without saying why reads as a bug.
- L981 · `const rp = s.response;` — The response clock beneath the hazard line. `RESPONSE 41s` is a number
  you can act on; `NO RESPONSE` is the same information and the reason to
  act differently.
- L1001 · `` setGauge($("g-pwr"), $("g-pwr-n"), s.chargePct, `${Math.round(s.chargePct * 100)}%`, s.cha `` — gauges
- L1002 · `const hMax = Math.max(1, s.hullMax ?? 100);` — 0.3.34: the pools come off the flown hull, so these are fractions of
  THIS ship's maximum, not of a universal hundred. A 920-point G frame
  used to peg the bar at 9x full and read "920" with no scale on it.
- L1010 · `const alarms = [...s.debuffs];` — alarms
- L1018 · `stackLeftColumn();` — 0.3.49: the left column stacks itself (see stackLeftColumn)
- L1020 · `const about = s.noticeAbout && s.noticeAbout.text === s.notice ? s.noticeAbout.name : null` — transient message card
- L1020 · `const about = s.noticeAbout && s.noticeAbout.text === s.notice ? s.noticeAbout.name : null` — the card is titled by what the message is ABOUT when it says so — "Undocked." reads as the port
- L1021 · `const named = [sel?.name, s.reticleName, near?.name].find((n) => n && s.notice?.includes(n` — … else by the lock, else by what the reticle is on, else by the nearest
  world — but only when the message is about it. 0.3.49: tapping TURR or
  ENG printed "EARTH" over "Turrets armed", because a message about the
  ship took its title from whatever planet was closest. A name the text
  does not mention is not what it is about: those are the ship's.
- L1028 · `` const dom = s.dominantName ? `${s.dominantName} ${fmtDist(s.altitude)}` : "deep space"; `` — always-on one-liner
- L1044 · `flashEl.style.opacity = s.flash > 0.01 ? Math.min(1, s.flash) : 0;` — a nearby cataclysm whites the canopy out
- L1045 · `const gl = sim.glare;` — the glare of something enormous happening off the side of the canopy
- L1055 · `const ws = s.warpState;` — warp core
- L1066 · `const rc = $("route-card");` — route card: the plot only resolves once the nose is on the lane
- L1094 · `paintThrottle(s.throttle);` — throttle
- L1095 · `$("thr-track").classList.toggle("capped", s.throttleCap < 1.001);` — Grey the overdrive band out when the limiter rules it out.
- L1100 · `for (const el of swEls) {` — switchboard
- L1109 · `{` — the cutter switch, painted from the MODE rather than a boolean
- L1125 · `const lb = $("lockbar");` — pointer lock
- L1134 · `` $("op-pulse-st").textContent = s.pulse ? `${Math.ceil(s.pulseLeft)}s` : s.charge < 140 ? " `` — ops readouts
- L1166 · `$("labels").innerHTML = s.labels` — world labels + flight markers
- L1166 · `$("labels").innerHTML = s.labels` — Two optional extras on a label, both presentational:
    a    an off-screen marker's bearing, handed to CSS as a custom
         property so the arrow rotates without the painter needing to
         know what an arrow looks like
    tag  the kind bracket — P player, N crewed NPC, D drone, R robot —
         as its own element so it can carry its own size and colour
         without the label text inheriting either
<!-- /note -->
