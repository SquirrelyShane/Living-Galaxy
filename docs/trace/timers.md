# Timers & frame loops

[index](../README.md)

setInterval / setTimeout / requestAnimationFrame / requestIdleCallback call sites.

3 distinct values across 22 files.

### `requestAnimationFrame`

- timer — [js/comms/comms.js › mountComms>loop](../files/js/comms/comms.js.md#s-mountComms-loop) L661
- timer — [js/comms/comms.js › mountComms](../files/js/comms/comms.js.md#s-mountComms) L664
- timer — [js/interior/interior.js › mountInterior>loop](../files/js/interior/interior.js.md#s-mountInterior-loop) L444
- timer — [js/interior/interior.js › mountInterior](../files/js/interior/interior.js.md#s-mountInterior) L466
- timer — [js/ui/glyphs.js › glyphBar>step](../files/js/ui/glyphs.js.md#s-glyphBar-step) L101
- timer — [js/ui/glyphs.js › glyphBar>set](../files/js/ui/glyphs.js.md#s-glyphBar-set) L111
- timer — [js/ui/glyphs.js › compileBlock>spin](../files/js/ui/glyphs.js.md#s-compileBlock-spin) L155

### `setInterval`

- timer — [js/economy/icework.js › wireIcework](../files/js/economy/icework.js.md#s-wireIcework) L133
- timer — [js/flight/autopilot.js › wireAutopilot](../files/js/flight/autopilot.js.md#s-wireAutopilot) L798
- timer — [js/net/account.js › mountAccount](../files/js/net/account.js.md#s-mountAccount) L470
- timer — [js/world/events/atmoworks.js › wireAtmoWorks](../files/js/world/events/atmoworks.js.md#s-wireAtmoWorks) L141

### `setTimeout`

- timer — [js/audio/graph.js › toBus](../files/js/audio/graph.js.md#s-toBus) L192
- timer — [js/audio/graph.js › tidy](../files/js/audio/graph.js.md#s-tidy) L203
- timer — [js/audio/voices.js › heldDrone.stop](../files/js/audio/voices.js.md#s-heldDrone-stop) L235
- timer — [js/audio/voices.js › heldAir.stop](../files/js/audio/voices.js.md#s-heldAir-stop) L266
- timer — [js/bodygen/grower.js › boot](../files/js/bodygen/grower.js.md#s-boot) L21
- timer — [js/corp/company.js › save](../files/js/corp/company.js.md#s-save) L257
- timer — [js/corp/gdb.js › save](../files/js/corp/gdb.js.md#s-save) L47
- timer — [js/corp/gdb.js › queuePush](../files/js/corp/gdb.js.md#s-queuePush) L282
- timer — [js/corp/gdb.js › flushGdb](../files/js/corp/gdb.js.md#s-flushGdb) L296
- timer — [js/flight/recorder.js › downloadTape](../files/js/flight/recorder.js.md#s-downloadTape) L188
- timer — [js/interior/interior.js › closeInterior](../files/js/interior/interior.js.md#s-closeInterior) L180
- timer — [js/net/account.js › mountAccount](../files/js/net/account.js.md#s-mountAccount) L475
- timer — [js/net/net.js › primeSol](../files/js/net/net.js.md#s-primeSol) L98
- timer — [js/net/net.js › poll](../files/js/net/net.js.md#s-poll) L206
- timer — [js/npc/captain.js › decide](../files/js/npc/captain.js.md#s-decide) L261
- timer — [js/npc/cradle.js › schedulePull](../files/js/npc/cradle.js.md#s-schedulePull) L357
- timer — [js/npc/cradle.js › pushRemote](../files/js/npc/cradle.js.md#s-pushRemote) L412
- timer — [js/shipgen/ops/ops.js › fireShot](../files/js/shipgen/ops/ops.js.md#s-fireShot) L157
- timer — [js/shipgen/ops/ops.js › fireLauncher](../files/js/shipgen/ops/ops.js.md#s-fireLauncher) L188
- timer — [js/shipgen/ops/ops.js › fireLauncher](../files/js/shipgen/ops/ops.js.md#s-fireLauncher) L190
- timer — [js/shipgen/ops/ops.js › fireLauncher](../files/js/shipgen/ops/ops.js.md#s-fireLauncher) L196
- timer — [js/shipgen/ops/ops.js › fireLauncher](../files/js/shipgen/ops/ops.js.md#s-fireLauncher) L202
- timer — [js/shipgen/ops/ops.js › doScan](../files/js/shipgen/ops/ops.js.md#s-doScan) L336
- timer — [js/station/deckhall.js › hallSection](../files/js/station/deckhall.js.md#s-hallSection) L88
- timer — [js/ui/chatbox.js › send](../files/js/ui/chatbox.js.md#s-send) L105
- timer — [js/ui/chatbox.js › mountChatbox](../files/js/ui/chatbox.js.md#s-mountChatbox) L129
- timer — [js/ui/chatbox.js › mountChatbox](../files/js/ui/chatbox.js.md#s-mountChatbox) L139
- timer — [js/ui/creation.js › mountCreation>needName](../files/js/ui/creation.js.md#s-mountCreation-needName) L65
- timer — [js/ui/creation.js › mountCreation.show](../files/js/ui/creation.js.md#s-mountCreation-show) L395
- timer — [js/ui/dockboot.js › mountDockBoot>bootDeck](../files/js/ui/dockboot.js.md#s-mountDockBoot-bootDeck) L54
- timer — [js/ui/glyphs.js › compileBlock](../files/js/ui/glyphs.js.md#s-compileBlock) L137
- timer — [js/ui/glyphs.js › compileBlock>spin](../files/js/ui/glyphs.js.md#s-compileBlock-spin) L155
- timer — [js/ui/hud.js › bindOrient](../files/js/ui/hud.js.md#s-bindOrient) L239
- timer — [js/ui/hud.js › mountHud>queueSky](../files/js/ui/hud.js.md#s-mountHud-queueSky) L527
- timer — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L670
