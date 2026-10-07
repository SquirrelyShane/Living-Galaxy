# Events

[index](../README.md)

DOM listeners, `on*` handler assignments, dispatched events and bus emit/on pairs. A value in ‹angle quotes› is a variable, not a literal.

50 distinct values across 45 files.

### `‹c›`

- bus.emit on `fire` — [js/flight/turrets.js › syncContacts](../files/js/flight/turrets.js.md#s-syncContacts) L146
- bus.emit on `fire` — [js/flight/turrets.js › stepPirates](../files/js/flight/turrets.js.md#s-stepPirates) L174
- bus.emit on `fire` — [js/flight/turrets.js › stepDrones](../files/js/flight/turrets.js.md#s-stepDrones) L256

### `‹ctx›`

- bus.on on `node` — [js/genome/behavior-graph.js › decide](../files/js/genome/behavior-graph.js.md#s-decide) L222

### `‹ev›`

- bus.on on `this` — [js/comms/call-session.js › Emitter.on](../files/js/comms/call-session.js.md#s-Emitter-on) L27
- bus.on on `session` — [js/comms/call-ui.js › CallUI.attach>on](../files/js/comms/call-ui.js.md#s-CallUI-attach-on) L106

### `‹from›`

- bus.emit on `fire` — [js/flight/turrets.js › npcTracer](../files/js/flight/turrets.js.md#s-npcTracer) L181
- bus.emit on `fire` — [js/flight/turrets.js › fireRound](../files/js/flight/turrets.js.md#s-fireRound) L327

### `‹paint›`

- bus.on on `store` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L1191

### `‹rig›`

- bus.emit on `fire` — [js/robotgen/drills.js › createDrillRunner>update](../files/js/robotgen/drills.js.md#s-createDrillRunner-update) L201

### `‹ship.pos›`

- bus.emit on `fire` — [js/flight/turrets.js › stepTurrets](../files/js/flight/turrets.js.md#s-stepTurrets) L408

### `‹tryNews›`

- bus.on on `useGameStore` — [js/net/account.js › mountAccount](../files/js/net/account.js.md#s-mountAccount) L467

### `‹u›`

- bus.emit on `npcDroneHooks` — [js/drones/npcdrones.js › stepCombat](../files/js/drones/npcdrones.js.md#s-stepCombat) L219

### `blur`

- event.listen on `input` → `release` — [js/console/kit.js › slider](../files/js/console/kit.js.md#s-slider) L101
- event.listen on `window` → `clear` — [js/core/input.js › bindInput](../files/js/core/input.js.md#s-bindInput) L113
- event.unlisten on `window` → `clear` — [js/core/input.js › bindInput](../files/js/core/input.js.md#s-bindInput) L120

### `change`

- event.listen on `input` → `(inline)` — [js/console/panels/aria-core.js › mountCore](../files/js/console/panels/aria-core.js.md#s-mountCore) L54
- event.listen on `mode` → `(inline)` — [js/console/panels/aria-core.js › mountCore](../files/js/console/panels/aria-core.js.md#s-mountCore) L58
- event.listen on `input` → `(inline)` — [js/console/panels/aria-core.js › mountCore](../files/js/console/panels/aria-core.js.md#s-mountCore) L60
- event.listen on `avoid` → `(inline)` — [js/console/panels/aria-core.js › mountCore](../files/js/console/panels/aria-core.js.md#s-mountCore) L61
- event.listen on `c` → `(inline)` — [js/console/panels/aria-core.js › mountCore](../files/js/console/panels/aria-core.js.md#s-mountCore) L67
- event.listen on `sel` → `(inline)` — [js/console/panels/corp-town.js › careBlock>pick](../files/js/console/panels/corp-town.js.md#s-careBlock-pick) L37
- event.listen on `name` → `(inline)` — [js/console/panels/crew.js › mountHouse](../files/js/console/panels/crew.js.md#s-mountHouse) L281
- event.listen on `inp` → `(inline)` — [js/console/panels/work.js › condBuilder](../files/js/console/panels/work.js.md#s-condBuilder) L115
- event.listen on `id` → `(inline)` — [js/console/panels/work.js › condBuilder](../files/js/console/panels/work.js.md#s-condBuilder) L121
- event.listen on `good` → `(inline)` — [js/console/panels/work.js › stepSheet](../files/js/console/panels/work.js.md#s-stepSheet) L151
- event.listen on `qty` → `(inline)` — [js/console/panels/work.js › stepSheet](../files/js/console/panels/work.js.md#s-stepSheet) L153
- event.listen on `name` → `(inline)` — [js/console/panels/work.js › editor>render](../files/js/console/panels/work.js.md#s-editor-render) L239
- event.listen on `sel` → `(inline)` — [js/station/deckhall.js › careBlock>pick](../files/js/station/deckhall.js.md#s-careBlock-pick) L109
- event.listen on `sel` → `(inline)` — [js/station/deckhall.js › lineCard](../files/js/station/deckhall.js.md#s-lineCard) L151
- event.listen on `picker` → `(inline)` — [js/station/stationdeck.js › PANELS.shipyard>render](../files/js/station/stationdeck.js.md#s-PANELS-shipyard-render) L141

### `choice`

- bus.emit on `this` — [js/comms/call-session.js › CallSession.choose](../files/js/comms/call-session.js.md#s-CallSession-choose) L182
- bus.on on `session` — [js/comms/comms.js › attach](../files/js/comms/comms.js.md#s-attach) L90

### `click`

- event.listen on `puck` → `(inline)` — [js/comms/call-ui.js › CallUI.constructor](../files/js/comms/call-ui.js.md#s-CallUI-constructor) L32
- event.listen on `answer.querySelector()` → `(inline)` — [js/comms/call-ui.js › CallUI.constructor](../files/js/comms/call-ui.js.md#s-CallUI-constructor) L38
- event.listen on `answer.querySelector()` → `(inline)` — [js/comms/call-ui.js › CallUI.constructor](../files/js/comms/call-ui.js.md#s-CallUI-constructor) L39
- event.listen on `minBtn` → `(inline)` — [js/comms/call-ui.js › CallUI.constructor](../files/js/comms/call-ui.js.md#s-CallUI-constructor) L51
- event.listen on `endBtn` → `(inline)` — [js/comms/call-ui.js › CallUI.constructor](../files/js/comms/call-ui.js.md#s-CallUI-constructor) L52
- event.listen on `log` → `(inline)` — [js/comms/call-ui.js › CallUI.constructor](../files/js/comms/call-ui.js.md#s-CallUI-constructor) L56
- event.listen on `chip` → `(inline)` — [js/comms/call-ui.js › CallUI._paintOptions](../files/js/comms/call-ui.js.md#s-CallUI-_paintOptions) L222
- event.listen on `$()` → `(inline)` — [js/comms/comms.js › mountComms](../files/js/comms/comms.js.md#s-mountComms) L641
- event.listen on `$()` → `(inline)` — [js/comms/comms.js › mountComms](../files/js/comms/comms.js.md#s-mountComms) L642
- event.listen on `$()` → `(inline)` — [js/comms/comms.js › mountComms](../files/js/comms/comms.js.md#s-mountComms) L647
- event.listen on `b` → `(inline)` — [js/console/console.js › paintTabs](../files/js/console/console.js.md#s-paintTabs) L133
- event.listen on `chip` → `(inline)` — [js/console/console.js › paintRecents](../files/js/console/console.js.md#s-paintRecents) L179
- event.listen on `b` → `(inline)` — [js/console/console.js › paintHits](../files/js/console/console.js.md#s-paintHits) L220
- event.listen on `b` → `(inline)` — [js/console/console.js › mountConsole](../files/js/console/console.js.md#s-mountConsole) L281
- event.listen on `$()` → `(inline)` — [js/console/console.js › mountConsole](../files/js/console/console.js.md#s-mountConsole) L283
- event.listen on `holdBtn` → `(inline)` — [js/console/console.js › mountConsole](../files/js/console/console.js.md#s-mountConsole) L284
- event.listen on `b` → `onClick` — [js/console/kit.js › button](../files/js/console/kit.js.md#s-button) L63
- event.listen on `b` → `(inline)` — [js/console/kit.js › chips](../files/js/console/kit.js.md#s-chips) L144
- event.listen on `b` → `fn` — [js/console/panels/market.js › SD.btn](../files/js/console/panels/market.js.md#s-SD-btn) L29
- event.listen on `b` → `(inline)` — [js/console/panels/ship.js › mountSystems](../files/js/console/panels/ship.js.md#s-mountSystems) L264
- event.listen on `b` → `(inline)` — [js/console/panels/ship.js › mountSystems](../files/js/console/panels/ship.js.md#s-mountSystems) L300
- event.listen on `b` → `(inline)` — [js/console/panels/ship.js › mountSystems](../files/js/console/panels/ship.js.md#s-mountSystems) L315
- event.listen on `b` → `(inline)` — [js/console/panels/ship.js › mountSystems](../files/js/console/panels/ship.js.md#s-mountSystems) L331
- event.listen on `b` → `fn` — [js/crew/talkview.js › mountTalk>btn](../files/js/crew/talkview.js.md#s-mountTalk-btn) L59
- event.listen on `btn` → `(inline)` — [js/economy/icework.js › wireIcework](../files/js/economy/icework.js.md#s-wireIcework) L131
- event.listen on `btn` → `(inline)` — [js/flight/autopilot.js › wireAutopilot](../files/js/flight/autopilot.js.md#s-wireAutopilot) L796
- event.listen on `b` → `(inline)` — [js/interior/interior.js › paintRail](../files/js/interior/interior.js.md#s-paintRail) L369
- event.listen on `root.querySelector()` → `closeInterior` — [js/interior/interior.js › mountInterior](../files/js/interior/interior.js.md#s-mountInterior) L426
- event.listen on `$()` → `toggleInterior` — [js/interior/interior.js › mountInterior](../files/js/interior/interior.js.md#s-mountInterior) L440
- event.listen on `b` → `fn` — [js/station/deckhall.js › btn](../files/js/station/deckhall.js.md#s-btn) L27
- event.listen on `btn` → `(inline)` — [js/station/refityard.js › wireDeckRepair](../files/js/station/refityard.js.md#s-wireDeckRepair) L107
- event.listen on `b` → `fn` — [js/station/stationdeck.js › btn](../files/js/station/stationdeck.js.md#s-btn) L97
- event.listen on `r` → `(inline)` — [js/station/stationdeck.js › PANELS.shipyard>render](../files/js/station/stationdeck.js.md#s-PANELS-shipyard-render) L161
- event.listen on `v.parentElement` → `(inline)` — [js/station/stationdeck.js › PANELS.shipyard>render](../files/js/station/stationdeck.js.md#s-PANELS-shipyard-render) L175
- event.listen on `b` → `(inline)` — [js/station/stationdeck.js › mountStationDeck](../files/js/station/stationdeck.js.md#s-mountStationDeck) L367
- event.listen on `$()` → `(inline)` — [js/station/stationdeck.js › mountStationDeck](../files/js/station/stationdeck.js.md#s-mountStationDeck) L373
- event.listen on `$()` → `(inline)` — [js/station/stationdeck.js › mountStationDeck](../files/js/station/stationdeck.js.md#s-mountStationDeck) L374
- event.listen on `$()` → `(inline)` — [js/station/stationdeck.js › mountStationDeck](../files/js/station/stationdeck.js.md#s-mountStationDeck) L375
- event.listen on `b` → `(inline)` — [js/ui/chatbox.js › row](../files/js/ui/chatbox.js.md#s-row) L27
- event.listen on `b` → `(inline)` — [js/ui/chatbox.js › paintTabs](../files/js/ui/chatbox.js.md#s-paintTabs) L65
- event.listen on `$()` → `(inline)` — [js/ui/chatbox.js › mountChatbox](../files/js/ui/chatbox.js.md#s-mountChatbox) L117
- event.listen on `$()` → `(inline)` — [js/ui/chatbox.js › mountChatbox](../files/js/ui/chatbox.js.md#s-mountChatbox) L118
- event.listen on `$()` → `(inline)` — [js/ui/chatbox.js › mountChatbox](../files/js/ui/chatbox.js.md#s-mountChatbox) L119
- event.listen on `$()` → `send` — [js/ui/chatbox.js › mountChatbox](../files/js/ui/chatbox.js.md#s-mountChatbox) L121
- event.listen on `b` → `(inline)` — [js/ui/chatbox.js › mountChatbox](../files/js/ui/chatbox.js.md#s-mountChatbox) L125
- event.listen on `b` → `(inline)` — [js/ui/creation.js › mountCreation](../files/js/ui/creation.js.md#s-mountCreation) L53
- event.listen on `backBtn` → `(inline)` — [js/ui/creation.js › mountCreation](../files/js/ui/creation.js.md#s-mountCreation) L55
- event.listen on `nextBtn` → `(inline)` — [js/ui/creation.js › mountCreation](../files/js/ui/creation.js.md#s-mountCreation) L67
- event.listen on `b` → `(inline)` — [js/ui/creation.js › mountCreation>renderRace](../files/js/ui/creation.js.md#s-mountCreation-renderRace) L84
- event.listen on `b` → `(inline)` — [js/ui/creation.js › mountCreation>renderCareer](../files/js/ui/creation.js.md#s-mountCreation-renderCareer) L116
- event.listen on `b` → `(inline)` — [js/ui/creation.js › mountCreation>renderCorp](../files/js/ui/creation.js.md#s-mountCreation-renderCorp) L188
- event.listen on `indie` → `(inline)` — [js/ui/creation.js › mountCreation>renderCorp](../files/js/ui/creation.js.md#s-mountCreation-renderCorp) L202
- event.listen on `go` → `(inline)` — [js/ui/creation.js › mountCreation>renderSky](../files/js/ui/creation.js.md#s-mountCreation-renderSky) L228
- event.listen on `sol` → `(inline)` — [js/ui/creation.js › mountCreation>renderSky](../files/js/ui/creation.js.md#s-mountCreation-renderSky) L249
- event.listen on `rnd` → `(inline)` — [js/ui/creation.js › mountCreation>renderSky](../files/js/ui/creation.js.md#s-mountCreation-renderSky) L253
- event.listen on `launch` → `(inline)` — [js/ui/creation.js › mountCreation>renderSky](../files/js/ui/creation.js.md#s-mountCreation-renderSky) L272
- event.listen on `join` → `(inline)` — [js/ui/creation.js › mountCreation>renderSky](../files/js/ui/creation.js.md#s-mountCreation-renderSky) L287
- event.listen on `button` → `(inline)` — [js/ui/fullscreen.js › mountFullscreen](../files/js/ui/fullscreen.js.md#s-mountFullscreen) L120
- event.listen on `b` → `fn` — [js/ui/hangar.js › mountHangar>btn](../files/js/ui/hangar.js.md#s-mountHangar-btn) L27
- event.listen on `sell` → `(inline)` — [js/ui/holdview.js › renderHold](../files/js/ui/holdview.js.md#s-renderHold) L113
- event.listen on `drop` → `(inline)` — [js/ui/holdview.js › renderHold](../files/js/ui/holdview.js.md#s-renderHold) L118
- event.listen on `b` → `(inline)` — [js/ui/hud.js › bindThrottle](../files/js/ui/hud.js.md#s-bindThrottle) L382
- event.listen on `contBtn` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L587
- event.listen on `createBtn` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L597
- event.listen on `b` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L731
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L736
- event.listen on `el` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L746
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L748
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L749
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L751
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L752
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L753
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L754
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L755
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L759
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L761
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L762
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L763
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L764
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L765
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L768
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L772
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L773
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L777
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L783
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L790
- event.listen on `$()` → `toggleHold` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L792
- event.listen on `$()` → `toggleHold` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L793
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L794
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L795
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L796
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L805
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L806
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L833
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L900
- event.listen on `menu.querySelector()` → `closeMenu` — [js/ui/map.js › mountMap](../files/js/ui/map.js.md#s-mountMap) L262
- event.listen on `b` → `(inline)` — [js/ui/map.js › mountMap>openMenu](../files/js/ui/map.js.md#s-mountMap-openMenu) L333
- event.listen on `b` → `(inline)` — [js/ui/map.js › mountMap](../files/js/ui/map.js.md#s-mountMap) L374
- event.listen on `document.getElementById()` → `(inline)` — [js/ui/map.js › mountMap](../files/js/ui/map.js.md#s-mountMap) L377
- event.listen on `row` → `(inline)` — [js/ui/map.js › mountMap>drawDirectory](../files/js/ui/map.js.md#s-mountMap-drawDirectory) L461
- event.listen on `document.getElementById()` → `(inline)` — [js/ui/map.js › mountMap](../files/js/ui/map.js.md#s-mountMap) L482
- event.listen on `document.getElementById()` → `(inline)` — [js/ui/map.js › mountMap](../files/js/ui/map.js.md#s-mountMap) L483
- event.listen on `document.getElementById()` → `(inline)` — [js/ui/map.js › mountMap](../files/js/ui/map.js.md#s-mountMap) L484
- event.listen on `planRow.querySelector()` → `(inline)` — [js/ui/map.js › mountMap](../files/js/ui/map.js.md#s-mountMap) L499
- event.listen on `planRow.querySelector()` → `(inline)` — [js/ui/map.js › mountMap](../files/js/ui/map.js.md#s-mountMap) L500
- event.listen on `document.getElementById()` → `(inline)` — [js/ui/map.js › mountMap](../files/js/ui/map.js.md#s-mountMap) L509
- event.listen on `document.getElementById()` → `(inline)` — [js/ui/map.js › mountMap](../files/js/ui/map.js.md#s-mountMap) L512
- event.listen on `document.getElementById()` → `(inline)` — [js/ui/map.js › mountMap](../files/js/ui/map.js.md#s-mountMap) L519
- event.listen on `document.getElementById()` → `(inline)` — [js/ui/map.js › mountMap](../files/js/ui/map.js.md#s-mountMap) L537
- event.listen on `b` → `(inline)` — [js/ui/secbadge.js › mountSecBadge>makeBadge](../files/js/ui/secbadge.js.md#s-mountSecBadge-makeBadge) L23
- event.listen on `x` → `(inline)` — [js/ui/secbadge.js › mountSecBadge>build](../files/js/ui/secbadge.js.md#s-mountSecBadge-build) L48
- event.listen on `sos` → `(inline)` — [js/ui/secbadge.js › mountSecBadge>build](../files/js/ui/secbadge.js.md#s-mountSecBadge-build) L66
- event.listen on `fine` → `(inline)` — [js/ui/secbadge.js › mountSecBadge>build](../files/js/ui/secbadge.js.md#s-mountSecBadge-build) L77
- event.listen on `root.querySelector()` → `(inline)` — [js/ui/tutorial.js › ensureRoot](../files/js/ui/tutorial.js.md#s-ensureRoot) L298
- event.listen on `root.querySelector()` → `skipTutorial` — [js/ui/tutorial.js › ensureRoot](../files/js/ui/tutorial.js.md#s-ensureRoot) L299
- event.listen on `root.querySelector()` → `(inline)` — [js/ui/tutorial.js › ensureRoot](../files/js/ui/tutorial.js.md#s-ensureRoot) L300
- event.listen on `root.querySelector()` → `(inline)` — [js/ui/tutorial.js › ensureRoot](../files/js/ui/tutorial.js.md#s-ensureRoot) L301
- event.listen on `root.querySelector()` → `(inline)` — [js/ui/tutorial.js › ensureRoot](../files/js/ui/tutorial.js.md#s-ensureRoot) L304
- event.listen on `btn` → `(inline)` — [js/world/events/atmoworks.js › wireAtmoWorks](../files/js/world/events/atmoworks.js.md#s-wireAtmoWorks) L139

### `closed`

- bus.emit on `this` — [js/comms/call-session.js › CallSession.unreachable](../files/js/comms/call-session.js.md#s-CallSession-unreachable) L154
- bus.emit on `this` — [js/comms/call-session.js › CallSession.reject](../files/js/comms/call-session.js.md#s-CallSession-reject) L161
- bus.emit on `this` — [js/comms/call-session.js › CallSession.end](../files/js/comms/call-session.js.md#s-CallSession-end) L171
- bus.emit on `this` — [js/comms/call-session.js › CallSession.tick](../files/js/comms/call-session.js.md#s-CallSession-tick) L288
- bus.on on `session` — [js/comms/comms.js › attach](../files/js/comms/comms.js.md#s-attach) L93

### `dblclick`

- event.listen on `canvas` → `(inline)` — [js/render/engine.js › mountGame](../files/js/render/engine.js.md#s-mountGame) L1440

### `error`

- event.listen on `globalThis` → `(inline)` — [js/core/boot.js](../files/js/core/boot.js.md) L87

### `focus`

- event.listen on `$()` → `(inline)` — [js/ui/chatbox.js › mountChatbox](../files/js/ui/chatbox.js.md#s-mountChatbox) L120

### `fullscreenchange`

- event.listen on `DOC` → `changed` — [js/ui/fullscreen.js › mountFullscreen](../files/js/ui/fullscreen.js.md#s-mountFullscreen) L134

### `input`

- event.listen on `qEl` → `(inline)` — [js/console/console.js › mountConsole](../files/js/console/console.js.md#s-mountConsole) L285
- event.listen on `input` → `(inline)` — [js/console/kit.js › slider](../files/js/console/kit.js.md#s-slider) L88
- event.listen on `input` → `(inline)` — [js/console/panels/crew-gdb.js › mountGdb](../files/js/console/panels/crew-gdb.js.md#s-mountGdb) L72
- event.listen on `f` → `(inline)` — [js/ui/creation.js › mountCreation.show](../files/js/ui/creation.js.md#s-mountCreation-show) L389
- event.dispatch on `c` — [js/ui/creation.js › mountCreation.show](../files/js/ui/creation.js.md#s-mountCreation-show) L392
- event.listen on `$()` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L557
- event.listen on `r` → `(inline)` — [js/ui/hud.js › mountHud>paintRow](../files/js/ui/hud.js.md#s-mountHud-paintRow) L827

### `keydown`

- event.listen on `window` → `(inline)` — [js/comms/comms.js › mountComms](../files/js/comms/comms.js.md#s-mountComms) L653
- event.listen on `qEl` → `(inline)` — [js/console/console.js › mountConsole](../files/js/console/console.js.md#s-mountConsole) L286
- event.listen on `pass` → `(inline)` — [js/console/panels/corp-account.js › mountSignIn](../files/js/console/panels/corp-account.js.md#s-mountSignIn) L79
- event.listen on `window` → `onDown` — [js/core/input.js › bindInput](../files/js/core/input.js.md#s-bindInput) L111
- event.unlisten on `window` → `onDown` — [js/core/input.js › bindInput](../files/js/core/input.js.md#s-bindInput) L118
- event.listen on `input` → `(inline)` — [js/crew/talkview.js › mountTalk](../files/js/crew/talkview.js.md#s-mountTalk) L161
- event.listen on `window` → `(inline)` — [js/interior/interior.js › mountInterior](../files/js/interior/interior.js.md#s-mountInterior) L434
- event.listen on `$()` → `(inline)` — [js/ui/chatbox.js › mountChatbox](../files/js/ui/chatbox.js.md#s-mountChatbox) L122

### `keyup`

- event.listen on `window` → `onUp` — [js/core/input.js › bindInput](../files/js/core/input.js.md#s-bindInput) L112
- event.unlisten on `window` → `onUp` — [js/core/input.js › bindInput](../files/js/core/input.js.md#s-bindInput) L119
- event.listen on `$()` → `(inline)` — [js/ui/chatbox.js › mountChatbox](../files/js/ui/chatbox.js.md#s-mountChatbox) L123

### `lg-account`

- event.dispatch on `globalThis.document` — [js/net/account.js › emitReady](../files/js/net/account.js.md#s-emitReady) L438
- event.listen on `globalThis.document` → `onAccount` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L668

### `line`

- bus.emit on `this` — [js/comms/call-session.js › CallSession._push](../files/js/comms/call-session.js.md#s-CallSession-_push) L256
- bus.on on `session` — [js/comms/comms.js › attach](../files/js/comms/comms.js.md#s-attach) L104

### `lostpointercapture`

- event.listen on `input` → `release` — [js/console/kit.js › slider](../files/js/console/kit.js.md#s-slider) L102
- event.listen on `canvas` → `(inline)` — [js/station/stationdeck.js › PANELS.blueprint](../files/js/station/stationdeck.js.md#s-PANELS-blueprint) L269

### `net.online`

- event.handler — [js/net/net.js › noRelay](../files/js/net/net.js.md#s-noRelay) L66
- event.handler — [js/net/net.js › poll](../files/js/net/net.js.md#s-poll) L141
- event.handler — [js/net/net.js › poll](../files/js/net/net.js.md#s-poll) L197
- event.handler — [js/net/net.js › disconnectNet](../files/js/net/net.js.md#s-disconnectNet) L243

### `node`

- bus.emit on `this` — [js/comms/call-session.js › CallSession._enter](../files/js/comms/call-session.js.md#s-CallSession-_enter) L224
- bus.on on `session` — [js/comms/comms.js › attach](../files/js/comms/comms.js.md#s-attach) L87

### `options`

- bus.emit on `this` — [js/comms/call-session.js › CallSession.choose](../files/js/comms/call-session.js.md#s-CallSession-choose) L180
- bus.emit on `this` — [js/comms/call-session.js › CallSession._flushOptions](../files/js/comms/call-session.js.md#s-CallSession-_flushOptions) L267

### `orientationchange`

- event.listen on `window` → `go` — [js/ui/hud.js › bindOrient](../files/js/ui/hud.js.md#s-bindOrient) L232

### `pagehide`

- event.listen on `window` → `(inline)` — [js/corp/company.js](../files/js/corp/company.js.md) L262
- event.listen on `window` → `(inline)` — [js/main.js](../files/js/main.js.md) L33
- event.listen on `window` → `(inline)` — [js/net/account.js › mountAccount](../files/js/net/account.js.md#s-mountAccount) L480

### `pointercancel`

- event.listen on `input` → `release` — [js/console/kit.js › slider](../files/js/console/kit.js.md#s-slider) L100
- event.listen on `canvas` → `onPointerUp` — [js/render/engine.js › mountGame](../files/js/render/engine.js.md#s-mountGame) L1529
- event.unlisten on `canvas` → `onPointerUp` — [js/render/engine.js › mountGame](../files/js/render/engine.js.md#s-mountGame) L2933
- event.listen on `canvas` → `(inline)` — [js/station/stationdeck.js › PANELS.blueprint](../files/js/station/stationdeck.js.md#s-PANELS-blueprint) L268
- event.listen on `el` → `end` — [js/ui/hud.js › bindPad](../files/js/ui/hud.js.md#s-bindPad) L331
- event.listen on `el` → `u` — [js/ui/hud.js › bindHold](../files/js/ui/hud.js.md#s-bindHold) L350
- event.listen on `track` → `end` — [js/ui/hud.js › bindThrottle](../files/js/ui/hud.js.md#s-bindThrottle) L384
- event.listen on `svg` → `release` — [js/ui/map.js › mountMap](../files/js/ui/map.js.md#s-mountMap) L197

### `pointerdown`

- event.listen on `root` → `(inline)` — [js/console/console.js › mountConsole](../files/js/console/console.js.md#s-mountConsole) L290
- event.listen on `input` → `(inline)` — [js/console/kit.js › slider](../files/js/console/kit.js.md#s-slider) L93
- event.listen on `DOC` → `onPointerDown` — [js/flight/recorder.js › wireRecorder](../files/js/flight/recorder.js.md#s-wireRecorder) L225
- event.listen on `interior.canvas` → `(inline)` — [js/interior/interior.js › mountInterior](../files/js/interior/interior.js.md#s-mountInterior) L428
- event.listen on `canvas` → `onPointerDown` — [js/render/engine.js › mountGame](../files/js/render/engine.js.md#s-mountGame) L1526
- event.unlisten on `canvas` → `onPointerDown` — [js/render/engine.js › mountGame](../files/js/render/engine.js.md#s-mountGame) L2930
- event.listen on `canvas` → `(inline)` — [js/station/stationdeck.js › PANELS.blueprint](../files/js/station/stationdeck.js.md#s-PANELS-blueprint) L264
- event.listen on `root` → `(inline)` — [js/station/stationdeck.js › mountStationDeck](../files/js/station/stationdeck.js.md#s-mountStationDeck) L386
- event.listen on `root` → `(inline)` — [js/ui/chatbox.js › mountChatbox](../files/js/ui/chatbox.js.md#s-mountChatbox) L116
- event.unlisten on `DOC` → `once` — [js/ui/fullscreen.js › mountFullscreen>once](../files/js/ui/fullscreen.js.md#s-mountFullscreen-once) L143
- event.listen on `DOC` → `once` — [js/ui/fullscreen.js › mountFullscreen](../files/js/ui/fullscreen.js.md#s-mountFullscreen) L146
- event.listen on `el` → `(inline)` — [js/ui/hud.js › bindPad](../files/js/ui/hud.js.md#s-bindPad) L319
- event.listen on `el` → `d` — [js/ui/hud.js › bindHold](../files/js/ui/hud.js.md#s-bindHold) L348
- event.listen on `track` → `(inline)` — [js/ui/hud.js › bindThrottle](../files/js/ui/hud.js.md#s-bindThrottle) L365
- event.listen on `document` → `(inline)` — [js/ui/hud.js › mountHud](../files/js/ui/hud.js.md#s-mountHud) L844
- event.listen on `svg` → `(inline)` — [js/ui/map.js › mountMap](../files/js/ui/map.js.md#s-mountMap) L156
- event.listen on `menu` → `(inline)` — [js/ui/map.js › mountMap](../files/js/ui/map.js.md#s-mountMap) L263
- event.listen on `b` → `(inline)` — [js/ui/secbadge.js › mountSecBadge>makeBadge](../files/js/ui/secbadge.js.md#s-mountSecBadge-makeBadge) L24
- event.listen on `card` → `(inline)` — [js/ui/secbadge.js › mountSecBadge](../files/js/ui/secbadge.js.md#s-mountSecBadge) L39

### `pointerleave`

- event.listen on `el` → `u` — [js/ui/hud.js › bindHold](../files/js/ui/hud.js.md#s-bindHold) L351

### `pointermove`

- event.listen on `canvas` → `onPointerMove` — [js/render/engine.js › mountGame](../files/js/render/engine.js.md#s-mountGame) L1527
- event.unlisten on `canvas` → `onPointerMove` — [js/render/engine.js › mountGame](../files/js/render/engine.js.md#s-mountGame) L2931
- event.listen on `canvas` → `(inline)` — [js/station/stationdeck.js › PANELS.blueprint](../files/js/station/stationdeck.js.md#s-PANELS-blueprint) L270
- event.listen on `el` → `move` — [js/ui/hud.js › bindPad](../files/js/ui/hud.js.md#s-bindPad) L329
- event.listen on `track` → `(inline)` — [js/ui/hud.js › bindThrottle](../files/js/ui/hud.js.md#s-bindThrottle) L370
- event.listen on `svg` → `(inline)` — [js/ui/map.js › mountMap](../files/js/ui/map.js.md#s-mountMap) L168

### `pointerup`

- event.listen on `input` → `release` — [js/console/kit.js › slider](../files/js/console/kit.js.md#s-slider) L99
- event.listen on `canvas` → `onPointerUp` — [js/render/engine.js › mountGame](../files/js/render/engine.js.md#s-mountGame) L1528
- event.unlisten on `canvas` → `onPointerUp` — [js/render/engine.js › mountGame](../files/js/render/engine.js.md#s-mountGame) L2932
- event.listen on `canvas` → `(inline)` — [js/station/stationdeck.js › PANELS.blueprint](../files/js/station/stationdeck.js.md#s-PANELS-blueprint) L277
- event.listen on `el` → `end` — [js/ui/hud.js › bindPad](../files/js/ui/hud.js.md#s-bindPad) L330
- event.listen on `el` → `u` — [js/ui/hud.js › bindHold](../files/js/ui/hud.js.md#s-bindHold) L349
- event.listen on `track` → `end` — [js/ui/hud.js › bindThrottle](../files/js/ui/hud.js.md#s-bindThrottle) L383
- event.listen on `svg` → `release` — [js/ui/map.js › mountMap](../files/js/ui/map.js.md#s-mountMap) L196

### `release`

- event.listen on `fullscreen.wake` → `(inline)` — [js/ui/fullscreen.js › takeWakeLock](../files/js/ui/fullscreen.js.md#s-takeWakeLock) L35

### `reply_timeout`

- bus.emit on `this` — [js/comms/call-session.js › CallSession.tick](../files/js/comms/call-session.js.md#s-CallSession-tick) L306

### `resize`

- event.dispatch on `WIN` — [js/ui/fullscreen.js › relayout>fire](../files/js/ui/fullscreen.js.md#s-relayout-fire) L96
- event.listen on `window` → `go` — [js/ui/hud.js › bindOrient](../files/js/ui/hud.js.md#s-bindOrient) L231
- event.listen on `window.visualViewport` → `go` — [js/ui/hud.js › bindOrient](../files/js/ui/hud.js.md#s-bindOrient) L233

### `ring`

- bus.emit on `this` — [js/comms/call-session.js › CallSession.hail](../files/js/comms/call-session.js.md#s-CallSession-hail) L116

### `say`

- bus.emit on `this` — [js/comms/call-session.js › CallSession.say](../files/js/comms/call-session.js.md#s-CallSession-say) L193
- bus.on on `s` — [js/comms/comms.js › peerSession](../files/js/comms/comms.js.md#s-peerSession) L480

### `self.onmessage`

- event.handler — [js/bodygen/worker.js](../files/js/bodygen/worker.js.md) L35

### `state`

- bus.emit on `this` — [js/comms/call-session.js › CallSession._set](../files/js/comms/call-session.js.md#s-CallSession-_set) L109
- bus.on on `session` — [js/comms/comms.js › attach](../files/js/comms/comms.js.md#s-attach) L103
- bus.on on `sess` — [js/comms/comms.js › onPeerMessage](../files/js/comms/comms.js.md#s-onPeerMessage) L509

### `submit`

- event.listen on `say` → `(inline)` — [js/comms/call-ui.js › CallUI.constructor](../files/js/comms/call-ui.js.md#s-CallUI-constructor) L66

### `toggle`

- event.listen on `d` → `(inline)` — [js/ui/boardview.js › details](../files/js/ui/boardview.js.md#s-details) L23

### `typing`

- bus.emit on `this` — [js/comms/call-session.js › CallSession._enter](../files/js/comms/call-session.js.md#s-CallSession-_enter) L205
- bus.emit on `this` — [js/comms/call-session.js › CallSession._enter](../files/js/comms/call-session.js.md#s-CallSession-_enter) L222

### `update`

- bus.emit on `this` — [js/comms/call-session.js › CallSession.skipReveal](../files/js/comms/call-session.js.md#s-CallSession-skipReveal) L260
- bus.emit on `this` — [js/comms/call-session.js › CallSession.tick](../files/js/comms/call-session.js.md#s-CallSession-tick) L299

### `visibilitychange`

- event.listen on `document` → `(inline)` — [js/core/input.js › bindInput](../files/js/core/input.js.md#s-bindInput) L114
- event.listen on `DOC` → `(inline)` — [js/flight/recorder.js › wireRecorder](../files/js/flight/recorder.js.md#s-wireRecorder) L226
- event.listen on `document` → `(inline)` — [js/main.js](../files/js/main.js.md) L32
- event.listen on `doc` → `(inline)` — [js/net/account.js › mountAccount](../files/js/net/account.js.md#s-mountAccount) L474
- event.listen on `globalThis.document` → `(inline)` — [js/net/net.js](../files/js/net/net.js.md) L248
- event.listen on `DOC` → `(inline)` — [js/ui/fullscreen.js › mountFullscreen](../files/js/ui/fullscreen.js.md#s-mountFullscreen) L137

### `webkitfullscreenchange`

- event.listen on `DOC` → `changed` — [js/ui/fullscreen.js › mountFullscreen](../files/js/ui/fullscreen.js.md#s-mountFullscreen) L135

### `wheel`

- event.listen on `canvas` → `(inline)` — [js/render/engine.js › mountGame](../files/js/render/engine.js.md#s-mountGame) L1435
- event.listen on `canvas` → `(inline)` — [js/station/stationdeck.js › PANELS.blueprint](../files/js/station/stationdeck.js.md#s-PANELS-blueprint) L290
- event.listen on `svg` → `(inline)` — [js/ui/map.js › mountMap](../files/js/ui/map.js.md#s-mountMap) L198

### `worker.onerror`

- event.handler — [js/bodygen/grower.js › boot](../files/js/bodygen/grower.js.md#s-boot) L37

### `worker.onmessage`

- event.handler — [js/bodygen/grower.js › boot](../files/js/bodygen/grower.js.md#s-boot) L22
