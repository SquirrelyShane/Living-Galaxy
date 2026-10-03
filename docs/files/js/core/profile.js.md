# js/core/profile.js

[index](../../../README.md) · 132 lines · 17 symbols · 0 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY — the run profile: what belongs to a pilot, and what outlives them.

Everything the game keeps between sessions lived in one flat pile of
localStorage keys, and nothing ever swept it. So a corporation founded by a
pilot you retired was still on the books when you made a new one, the old
callsign was still on the save, the old hands were still filed as "aboard",
and a page refresh — or a server restart, for the shared half — brought all
of it straight back. You cannot start over in a game that will not let you.

The fix is to say out loud which of those three things each key is:

  DEVICE_KEYS   belong to the machine. Audio mix, rock quality, whether the
                attract loop has been seen. A new pilot does not re-tune the
                speakers, and wiping these would be rude.

  RUN_KEYS      belong to ONE pilot's run. Their corporation, their fleet,
                their callsign and sky progress, their refits, robots,
                missions, drones, console history, tutorial state. These are
                the ones that leaked. A new pilot clears every one of them.

  LEARNED_KEYS  belong to the human at the controls rather than the character
                on the hull — the preference net ARIA flies by, and the house
                brain an NPC captain carries. Deliberately kept: you are the
                same pilot whatever you call yourself this time, and throwing
                away a session of learned flying to rename a character would
                be a worse bug than the one this file fixes.

The CRADLE (lgaa.cradle.v1) is in none of them on purpose. It is the sky's
population, not the pilot's — the hand you dismissed at Foundry Hold should
still be at Kessler Reach two pilots later. What a new run clears there is
only the EMPLOYMENT: anybody filed as aboard or captained by the pilot who
just walked goes back in the pool, so the hiring halls fill again. That is
`releaseEmployed()` in js/npc/cradle.js, and the server does the same on its
side, because an "aboard" flag is a fact about one client's run and has no
business being written to a shared ledger at all.

This module is a LEAF. It touches storage and nothing else, so it can be
imported from anywhere without dragging the sim in behind it.

0.3.40: the same three lists say what an ACCOUNT carries. js/net/account.js
syncs RUN_KEYS + RUN_PREFIXES + LEARNED_KEYS + the profile record to the
website and leaves DEVICE_KEYS and the cradle where they are.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/net/account.js](../net/account.js.md) — `RUN_KEYS`, `RUN_PREFIXES`, `LEARNED_KEYS`, `PROFILE_KEY`
- [js/ui/creation.js](../ui/creation.js.md) — `startRun`

## Exports

- [`SKY_KEYS`](#s-SKY_KEYS) · const — **no importer in scanned roots**
- [`DEVICE_KEYS`](#s-DEVICE_KEYS) · const — **no importer in scanned roots**
- [`LEARNED_KEYS`](#s-LEARNED_KEYS) · const — used by [js/net/account.js](../net/account.js.md)
- [`RUN_KEYS`](#s-RUN_KEYS) · const — used by [js/net/account.js](../net/account.js.md)
- [`RUN_PREFIXES`](#s-RUN_PREFIXES) · const — used by [js/net/account.js](../net/account.js.md)
- [`PROFILE_KEY`](#s-PROFILE_KEY) · const — used by [js/net/account.js](../net/account.js.md)
- [`profile`](#s-profile) · function — **no importer in scanned roots**
- [`runId`](#s-runId) · function — **no importer in scanned roots**
- [`runCallsign`](#s-runCallsign) · function — **no importer in scanned roots**
- [`clearRun`](#s-clearRun) · function — **no importer in scanned roots**
- [`startRun`](#s-startRun) · function — used by [js/ui/creation.js](../ui/creation.js.md)
- [`renameRun`](#s-renameRun) · function — **no importer in scanned roots**
- [`forgetRun`](#s-forgetRun) · function — **no importer in scanned roots**

## Effects

_none detected_

## Symbols

### <a id="s-SKY_KEYS"></a>`SKY_KEYS`

const · **exported** · L1–4

<!-- note:SKY_KEYS -->
0.3.54: the galaxy's population — the CRADLE's full records and the Galactic
Database's catalogue. Not the pilot's (no account sync, no clearing on a new
run) and not the device's settings: they are who lives in the sky.

- L2 · `"lgaa.cradle.v1",` — js/npc/cradle.js — full records of people
- L3 · `"lgaa.gdb.v1",` — js/corp/gdb.js — the catalogue of everyone, one name to one person
<!-- /note -->

### <a id="s-DEVICE_KEYS"></a>`DEVICE_KEYS`

const · **exported** · L6–17

<!-- note:DEVICE_KEYS -->
- L7 · `"lgaa.audio.mix",` — js/audio/graph.js — the mixer
- L8 · `"lgaa.rocks",` — js/render/engine.js — asteroid quality tier
- L9 · `"lgaa.dockcine",` — js/ui/dockboot.js — the berth boot sequence on/off
- L10 · `"lgaa.fullscreen",` — js/ui/fullscreen.js — the canopy edge-to-edge, restored on the next tap
- L11 · `"lgaa.lens",` — js/render/holefx.js — the black-hole lens: on / off / by frame budget
- L12 · `"lgaa.attract",` — js/render/engine.js — attract loop seen
- L13 · `"lgaa-adult-pack",` — addon/adult/ — the opt-in gate for the mature pack
- L14 · `"lgaa.npcchat.v1",` — js/npc/chat.js — the rating the NPC band is allowed to speak at
- L15 · `"lgaa.account.v1",` — js/net/account.js — which account version THIS DEVICE last synced to
- L16 · `"lgaa.news.seen.v1",` — js/net/account.js — site bulletins already put on the GNN desk here
<!-- /note -->

### <a id="s-LEARNED_KEYS"></a>`LEARNED_KEYS`

const · **exported** · L19–24

<!-- note:LEARNED_KEYS -->
- L20 · `"lgaa.aria.v1",` — js/aria/aria.js — the preference net, learned from how you fly
- L22 · `"lgaa.housebrain.v1",` — js/npc/captain.js — the NPC captain's neural core
- L23 · `"lgaa.tape.v1",` — js/flight/recorder.js — the (state, action, outcome) tape the pilot leaves behind
<!-- /note -->

### <a id="s-RUN_KEYS"></a>`RUN_KEYS`

const · **exported** · L26–36

<!-- note:RUN_KEYS -->
- L27 · `"lgaa-company",` — js/corp/company.js — the corporation, its name, book and board
- L28 · `"lgaa-fleet",` — js/corp/fleet.js — owned hulls
- L29 · `"lgaa-social",` — js/crew/family.js — the household: partners, children, standing
- L30 · `"lgaa-save-v1",` — js/core/store.js — callsign, per-sky scanned/beacons/terraform
- L31 · `"lgaa-save-v0",` — js/core/store.js — the legacy save it upgrades from
- L32 · `"lgaa.con.recents.v1",` — js/console/console.js — command history
- L33 · `"lgaa.tutorial.v1",` — js/ui/tutorial.js — which lessons are done
- L34 · `"lgaa.tutorial.core.v1",` — js/ui/tutorial.js — the MISSION CORE walkthrough, shown once
- L35 · `"lgaa.pilot.v1",` — js/flight/pilot.js — the pilot record: race, career, rank, skills, hulls, cover (0.3.42)
<!-- /note -->

### <a id="s-RUN_PREFIXES"></a>`RUN_PREFIXES`

const · **exported** · L38–45

<!-- note:RUN_PREFIXES -->
The other half, and the half that made this bug so hard to see.

Five subsystems do not write a fixed key — they write one keyed by the sky
and the CALLSIGN:

    lgaa.upgrades.v1:&lt;skySeed>:&lt;callsign>

which means removeItem("lgaa.upgrades.v1") removes nothing at all, and a
sweep written against the bare names would have looked like it worked while
clearing none of them. It also means the keys never stop accumulating — one
set per name you have ever flown under — and that flying under an OLD name
hands you that pilot's refits, robots, missions and part-flown contracts
back — which is how a retired pilot's kit follows you into a new run.

So these are cleared by PREFIX, over the whole of localStorage. The trailing
colon is deliberate: it matches `lgaa.missions.v1:Vex` and never some
future `lgaa.missions.v1b`.

- L39 · `"lgaa.upgrades.v1:",` — js/economy/upgrades.js — refits fitted
- L40 · `"lgaa.robots.v1:",` — js/crew/robots.js — the robot roster
- L41 · `"lgaa.missions.v1:",` — js/mission/script.js — mission board state
- L42 · `"lgaa.mission.run.v1:",` — js/mission/run.js — a mission part-flown
- L43 · `"lgaa.drones.v1:",` — js/drones/ops.js — drone standing orders
- L44 · `"lgaa.fab.v1:",` — js/economy/fabricate.js — jobs on the ports' fabrication lines
<!-- /note -->

### <a id="s-PROFILE_KEY"></a>`PROFILE_KEY`

const · **exported** · L47–47

<!-- note:PROFILE_KEY -->
<!-- /note -->

### <a id="s-store"></a>`store()`

function · L49–51

- called by: [`clearRun`](#s-clearRun) · [`forgetRun`](#s-forgetRun) · [`read`](#s-read) · [`write`](#s-write)

<!-- note:store -->
<!-- /note -->

### <a id="s-read"></a>`read()`

function · L53–59

- calls: [`store`](#s-store)
- called by: [`profile`](#s-profile) · [`renameRun`](#s-renameRun) · [`runCallsign`](#s-runCallsign) · [`runId`](#s-runId) · [`startRun`](#s-startRun)

<!-- note:read -->
- L57 · `} catch {` — corrupt or absent
<!-- /note -->

### <a id="s-write"></a>`write(p)`

function · L61–63

- calls: [`store`](#s-store)
- called by: [`renameRun`](#s-renameRun) · [`startRun`](#s-startRun)

<!-- note:write -->
- L62 · `try { store()?.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {` — quota, or no window
<!-- /note -->

### <a id="s-mintId"></a>`mintId()`

function · L65–69

- called by: [`startRun`](#s-startRun)

<!-- note:mintId -->
A short, sortable, collision-proof id. Not a seed — nothing is rolled off it.
<!-- /note -->

### <a id="s-profile"></a>`profile()`

function · **exported** · L71–73

- calls: [`read`](#s-read)

<!-- note:profile -->
The run in progress, or null before a pilot has ever been made on this device.
<!-- /note -->

### <a id="s-runId"></a>`runId()`

function · **exported** · L75–77

- calls: [`read`](#s-read)

<!-- note:runId -->
The current run's id, or "" if there is not one yet.
<!-- /note -->

### <a id="s-runCallsign"></a>`runCallsign()`

function · **exported** · L79–81

- calls: [`read`](#s-read)

<!-- note:runCallsign -->
The callsign the current run was created under.
<!-- /note -->

### <a id="s-clearRun"></a>`clearRun()`

function · **exported** · L83–104

- calls: [`store`](#s-store)
- called by: [`forgetRun`](#s-forgetRun) · [`startRun`](#s-startRun)

<!-- note:clearRun -->
Wipe every key that belongs to one pilot's run. Device settings and the
learned nets are left alone; so is the CRADLE, which is the sky's, not
the pilot's. Returns the keys that were actually holding something, which
is what makes this testable rather than hopeful.

- L91 · `} catch {` — ignore one bad key rather than abandon the sweep
- L93 · `const doomed = [];` — the callsign-suffixed families: enumerate rather than guess the suffix.
  Collect first, delete after — removing while iterating an index-based
  Storage renumbers it underneath you and skips every other key.
- L99 · `} catch {` — a Storage without length/key: the fixed keys above are still swept
- L101 · `try { ls.removeItem(k); had.push(k); } catch {` — ignore
<!-- /note -->

### <a id="s-startRun"></a>`startRun(callsign)`

function · **exported** · L106–118

- calls: [`clearRun`](#s-clearRun) · [`mintId`](#s-mintId) · [`read`](#s-read) · [`write`](#s-write)
- called by: [`renameRun`](#s-renameRun) · [`mountCreation>finish`](../ui/creation.js.md#s-mountCreation-finish) _js/ui/creation.js_

<!-- note:startRun -->
Begin a new pilot's run: clear the last one off the device and file who this
one is. Call it BEFORE the new pilot is built, so nothing written during
creation is swept away behind it.

@returns { id, callsign, createdAt, cleared } — `cleared` is the keys that
         actually had a previous run in them.
<!-- /note -->

### <a id="s-renameRun"></a>`renameRun(callsign)`

function · **exported** · L120–126

- calls: [`read`](#s-read) · [`startRun`](#s-startRun) · [`write`](#s-write)

<!-- note:renameRun -->
Rename the run in place — the pilot is the same person, the name changed.
<!-- /note -->

### <a id="s-forgetRun"></a>`forgetRun()`

function · **exported** · L128–132

- calls: [`clearRun`](#s-clearRun) · [`store`](#s-store)

<!-- note:forgetRun -->
Console/testing: forget the run entirely, profile record and all.

- L130 · `try { store()?.removeItem(PROFILE_KEY); } catch {` — ignore
<!-- /note -->
