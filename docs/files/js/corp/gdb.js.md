# js/corp/gdb.js

[index](../../../README.md) · 350 lines · 46 symbols · 4 imports · 12 importers

## About

<!-- note:@file -->
LIVING GALAXY — the GALACTIC DATABASE (GDB), 0.3.54.

Reported: everybody had similar names, or the same names. Measured, it was
three things, and none of them was the forge running out of names:

  1. A hiring hall filled half its list from the WHOLE sky's pool — and every
     candidate any hall had ever offered went into that pool. So the people
     you were offered at the first port were offered again at every port
     after it. Same faces, same names, everywhere.
  2. Nothing checked a new person against the people already in the room.
     Inside one people the forge is meant to sound alike — that is how a
     Korrash reads as a Korrash — so eight of them on one list shared a
     beginning or an ending more often than not (55–89% of same-people
     crews of eight, by the numbers).
  3. Most of the sky's people were never filed at all. NPC crews, the flow
     boats' pilots, boarders: forged on the spot and forgotten, so nothing
     stopped one of them wearing a name somebody else already had.

The GDB is the catalogue of every person the galaxy produces. CRADLE stays
the full record (genome, history, brain — js/npc/cradle.js); the GDB is the
index over it plus a light entry for the people who never needed a full
one. Filing somebody here is what makes them a person:

  ONE NAME, ONE PERSON   a full name is never issued twice. A clash is
                         re-forged from the person's own seed, so it is the
                         same answer on every device.
  NOT A NAME TWICE IN A ROOM  filed with a `group` (the hall, the hull's
                         crew, your own crew), a given name that shares its
                         first or last three letters with someone already in
                         the room is re-forged too.
  IDENTITY STANDS        once filed, a person keeps their name — a captain
                         regenerated from the same seed next session is the
                         same captain, with the same name, not a new one.
  A NUMBER               GDB-XXXXXX off the id: stable, and the same on
                         every device.
  A RECORD               who, what people, what trade, where they were first
                         and last seen, alive or dead — and the chronicle,
                         every line the ledger's histories hold, newest first.

Storage: `lgaa.gdb.v1` on the device, and the relay's /gdb endpoints when
one is up (server.py keeps gdb.json), the same local-first way CRADLE does.
It is the galaxy's, not the pilot's, so it is not in the account snapshot.

CON › CREW › GDB reads it (js/console/panels/crew-gdb.js).

- L15 · `const entries = new Map();` — id → light entry
- L17 · `let index = null;` — lower full name → id
- L18 · `let indexedAt = -1;` — cradle.size + entries.size when built
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../npc/cradle.js` | `cradle` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 2 | `../world/names.js` | `givenName`, `nameRng`, `familyOf` | [js/world/names.js](../world/names.js.md) |
| 3 | `../data/lexicons.js` | `LEXICONS`, `DEFAULT_LEX` | [js/data/lexicons.js](../data/lexicons.js.md) |
| 4 | `../crew/races.js` | `RACES` | [js/crew/races.js](../crew/races.js.md) |

## Imported by

- [js/aria/aria.js](../aria/aria.js.md) — `entryOf`
- [js/console/panels/crew-gdb.js](../console/panels/crew-gdb.js.md) — `census`, `search`, `entryOf`, `chronicle`, `raceName`
- [js/crew/family.js](../crew/family.js.md) — `file`
- [js/crew/ledger.js](../crew/ledger.js.md) — `file`
- [js/interior/boarding.js](../interior/boarding.js.md) — `catalogue`
- [js/npc/bounty.js](../npc/bounty.js.md) — `catalogue`
- [js/npc/npccrew.js](../npc/npccrew.js.md) — `catalogue`, `file`
- [js/npc/speech.js](../npc/speech.js.md) — `catalogue`
- [js/npc/traffic.js](../npc/traffic.js.md) — `file`
- [js/station/stationlife.js](../station/stationlife.js.md) — `file`, `markDead`
- [js/ui/hud.js](../ui/hud.js.md) — `connectGdb`, `disconnectGdb`
- test/gdb.test.mjs _(outside js/)_ — `G`

## Exports

- [`GDB`](#s-GDB) · const — **no importer in scanned roots**
- [`catalogueNo`](#s-catalogueNo) · function — **no importer in scanned roots**
- [`looksAlike`](#s-looksAlike) · function — **no importer in scanned roots**
- [`uniqueName`](#s-uniqueName) · function — **no importer in scanned roots**
- [`file`](#s-file) · function — used by [js/crew/family.js](../crew/family.js.md), [js/crew/ledger.js](../crew/ledger.js.md), [js/npc/npccrew.js](../npc/npccrew.js.md), [js/npc/traffic.js](../npc/traffic.js.md), [js/station/stationlife.js](../station/stationlife.js.md)
- [`catalogue`](#s-catalogue) · function — used by [js/interior/boarding.js](../interior/boarding.js.md), [js/npc/bounty.js](../npc/bounty.js.md), [js/npc/npccrew.js](../npc/npccrew.js.md), [js/npc/speech.js](../npc/speech.js.md)
- [`markDead`](#s-markDead) · function — used by [js/station/stationlife.js](../station/stationlife.js.md)
- [`sighted`](#s-sighted) · function — **no importer in scanned roots**
- [`everyone`](#s-everyone) · function — **no importer in scanned roots**
- [`entryOf`](#s-entryOf) · function — used by [js/aria/aria.js](../aria/aria.js.md), [js/console/panels/crew-gdb.js](../console/panels/crew-gdb.js.md)
- [`census`](#s-census) · function — used by [js/console/panels/crew-gdb.js](../console/panels/crew-gdb.js.md)
- [`search`](#s-search) · function — used by [js/console/panels/crew-gdb.js](../console/panels/crew-gdb.js.md)
- [`chronicle`](#s-chronicle) · function — used by [js/console/panels/crew-gdb.js](../console/panels/crew-gdb.js.md)
- [`flushGdb`](#s-flushGdb) · function — **no importer in scanned roots**
- [`mergeEntries`](#s-mergeEntries) · function — **no importer in scanned roots**
- [`connectGdb`](#s-connectGdb) · function — used by [js/ui/hud.js](../ui/hud.js.md)
- [`disconnectGdb`](#s-disconnectGdb) · function — used by [js/ui/hud.js](../ui/hud.js.md)
- [`resetGdb`](#s-resetGdb) · function — **no importer in scanned roots**
- [`raceName`](#s-raceName) — used by [js/console/panels/crew-gdb.js](../console/panels/crew-gdb.js.md)

## Effects

- **net.fetch** — `/gdb/put POST` (flushGdb:297) · `/gdb/all?room=${…}` (connectGdb:323)
- **storage.get** — `‹LS_KEY›` (load:38)
- **storage.remove** — `‹LS_KEY›` (resetGdb:347)
- **storage.set** — `‹LS_KEY›` (save:50)
- **timer** — `setTimeout` (save:47, queuePush:282, flushGdb:296)

## Symbols

### <a id="s-LS_KEY"></a>`LS_KEY`

const · L6–6

<!-- note:LS_KEY -->
<!-- /note -->

### <a id="s-GDB"></a>`GDB`

const · **exported** · L7–12

<!-- note:GDB -->
- L8 · `localMax: 20000,` — light entries kept on a device; transient kinds go first
- L9 · `tries: 10,` — re-forges before a name is accepted as it stands
- L10 · `pushMax: 200,` — entries per POST
<!-- /note -->

### <a id="s-TRANSIENT"></a>`TRANSIENT`

const · L13–13

<!-- note:TRANSIENT -->
who may be dropped from the device's catalogue first when it is full
<!-- /note -->

### <a id="s-entries"></a>`entries`

const · L15–15

<!-- note:entries -->
<!-- /note -->

### <a id="s-loaded"></a>`loaded`

const · L16–16

<!-- note:loaded -->
<!-- /note -->

### <a id="s-index"></a>`index`

const · L17–17

<!-- note:index -->
<!-- /note -->

### <a id="s-indexedAt"></a>`indexedAt`

const · L18–18

<!-- note:indexedAt -->
<!-- /note -->

### <a id="s-hash32"></a>`hash32(s)`

function · L20–25

- called by: [`catalogueNo`](#s-catalogueNo)

<!-- note:hash32 -->
<!-- /note -->

### <a id="s-lower"></a>`lower(s)`

function · L26–26

- called by: [`bare`](#s-bare) · [`census`](#s-census) · [`names`](#s-names) ×3 · [`remember`](#s-remember) · [`search`](#s-search) ×6 · [`uniqueName>takenBy`](#s-uniqueName-takenBy)

<!-- note:lower -->
<!-- /note -->

### <a id="s-givenOf"></a>`givenOf(full)`

function · L27–27

- called by: [`looksAlike`](#s-looksAlike) ×2

<!-- note:givenOf -->
<!-- /note -->

### <a id="s-bare"></a>`bare(s)`

function · L28–28

- calls: [`lower`](#s-lower)
- called by: [`looksAlike`](#s-looksAlike) ×2

<!-- note:bare -->
<!-- /note -->

### <a id="s-catalogueNo"></a>`catalogueNo(id)`

function · **exported** · L30–32

- calls: [`hash32`](#s-hash32)
- called by: [`entryFrom`](#s-entryFrom) · [`file`](#s-file) · [`mergeEntries`](#s-mergeEntries) · [`uniqueName`](#s-uniqueName)

<!-- note:catalogueNo -->
GDB-7Q2K9A — stable off the id, the same on every device.
<!-- /note -->

### <a id="s-load"></a>`load()`

function · L34–42

- called by: [`catalogue`](#s-catalogue) · [`entryOf`](#s-entryOf) · [`everyone`](#s-everyone) · [`file`](#s-file) · [`markDead`](#s-markDead) · [`mergeEntries`](#s-mergeEntries) · [`names`](#s-names) · [`sighted`](#s-sighted)
- effects: storage.get `‹LS_KEY›`

<!-- note:load -->
---- storage --------------------------------------------------------------

- L41 · `} catch {` — private mode: the catalogue lives for the session
<!-- /note -->

### <a id="s-saveTimer"></a>`saveTimer`

const · L44–44

<!-- note:saveTimer -->
<!-- /note -->

### <a id="s-save"></a>`save()`

function · L45–53

- calls: [`prune`](#s-prune)
- called by: [`markDead`](#s-markDead) · [`mergeEntries`](#s-mergeEntries) · [`remember`](#s-remember) · [`sighted`](#s-sighted)
- effects: timer `setTimeout` · storage.set `‹LS_KEY›`

<!-- note:save -->
- L50 · `try { globalThis.localStorage?.setItem(LS_KEY, JSON.stringify({ v: 1, entries: [...entries` — full: kept for the session
<!-- /note -->

### <a id="s-prune"></a>`prune()`

function · L55–64

- called by: [`save`](#s-save)

<!-- note:prune -->
Keep the device's catalogue bounded: transient people nobody met again go first.
<!-- /note -->

### <a id="s-names"></a>`names()`

function · L66–75

- calls: [`load`](#s-load) · [`lower`](#s-lower) ×3
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.all`
- called by: [`remember`](#s-remember) · [`uniqueName`](#s-uniqueName)

<!-- note:names -->
---- the name index -------------------------------------------------------
<!-- /note -->

### <a id="s-looksAlike"></a>`looksAlike(a, b)`

function · **exported** · L77–86

- calls: [`bare`](#s-bare) ×2 · [`givenOf`](#s-givenOf) ×2
- called by: [`uniqueName>alike`](#s-uniqueName-alike)

<!-- note:looksAlike -->
Two given names that would be confused on a crew list.
<!-- /note -->

### <a id="s-reforged"></a>`reforged(p, k)`

function · L88–94

- calls: [`familyOf`](../world/names.js.md#s-familyOf) _js/world/names.js_ · [`givenName`](../world/names.js.md#s-givenName) _js/world/names.js_ · [`nameRng`](../world/names.js.md#s-nameRng) _js/world/names.js_
- called by: [`uniqueName`](#s-uniqueName)

<!-- note:reforged -->
The name somebody would get on re-forge `k` — the given name only; the family is theirs.
<!-- /note -->

### <a id="s-ROMAN"></a>`ROMAN`

const · L96–96

<!-- note:ROMAN -->
<!-- /note -->

### <a id="s-uniqueName"></a>`uniqueName(p, {…}=)`

function · **exported** · L98–114

- calls: [`catalogueNo`](#s-catalogueNo) · [`names`](#s-names) · [`reforged`](#s-reforged) · [`uniqueName>alike`](#s-uniqueName-alike) · [`uniqueName>takenBy`](#s-uniqueName-takenBy) ×2
- called by: [`catalogue`](#s-catalogue) · [`file`](#s-file)

<!-- note:uniqueName -->
A name nobody else in the galaxy has, and that does not look like anybody's
in `group`. Deterministic for the person and the room.

- L108 · `if (!clash && !fallback) fallback = name;` — unique but alike: better than nothing
- L112 · `` for (let n = 2; n < ROMAN.length; n++) if (!takenBy(`${p.name} ${ROMAN[n]}`)) return `${p. `` — ten re-forges and every one taken: the tongue is crowded — number them
<!-- /note -->

#### <a id="s-uniqueName-takenBy"></a>`uniqueName>takenBy(n)`

function · L101–101

- calls: [`lower`](#s-lower)
- called by: [`uniqueName`](#s-uniqueName) ×2

<!-- note:uniqueName>takenBy -->
<!-- /note -->

#### <a id="s-uniqueName-alike"></a>`uniqueName>alike(n)`

function · L102–102

- calls: [`looksAlike`](#s-looksAlike)
- called by: [`uniqueName`](#s-uniqueName)

<!-- note:uniqueName>alike -->
<!-- /note -->

### <a id="s-entryFrom"></a>`entryFrom(p, {…})`

function · L116–134

- calls: [`catalogueNo`](#s-catalogueNo)
- called by: [`catalogue`](#s-catalogue) · [`entryOf`](#s-entryOf) · [`everyone`](#s-everyone) · [`file`](#s-file) ×2 · [`markDead`](#s-markDead)

<!-- note:entryFrom -->
---- filing ---------------------------------------------------------------
<!-- /note -->

### <a id="s-remember"></a>`remember(e)`

function · L136–151

- calls: [`lower`](#s-lower) · [`names`](#s-names) · [`queuePush`](#s-queuePush) · [`save`](#s-save)
- called by: [`catalogue`](#s-catalogue) · [`file`](#s-file) ×2

<!-- note:remember -->
- L139 · `e.name = had.name; e.at = had.at; e.no = had.no;` — first filing wins the name and the date; the rest is the latest word
<!-- /note -->

### <a id="s-file"></a>`file(rec, {…}=)`

function · **exported** · L153–168

- calls: [`catalogueNo`](#s-catalogueNo) · [`entryFrom`](#s-entryFrom) ×2 · [`load`](#s-load) · [`remember`](#s-remember) ×2 · [`uniqueName`](#s-uniqueName)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`, `cradle.put`
- called by: [`conceive`](../crew/family.js.md#s-conceive) _js/crew/family.js_ · [`stationRoster`](../crew/ledger.js.md#s-stationRoster) _js/crew/ledger.js_ · [`promote`](../npc/npccrew.js.md#s-promote) _js/npc/npccrew.js_ · [`buildRoster`](../npc/traffic.js.md#s-buildRoster) _js/npc/traffic.js_ · [`bearChild`](../station/stationlife.js.md#s-bearChild) _js/station/stationlife.js_

<!-- note:file -->
File a full CRADLE record. Someone already on file keeps the name they have;
someone new gets a name nobody has, and one that does not look like anyone's
in `group`. Puts the record in CRADLE. Returns the record that stands.
<!-- /note -->

### <a id="s-catalogue"></a>`catalogue(p, {…}=)`

function · **exported** · L170–182

- calls: [`entryFrom`](#s-entryFrom) · [`load`](#s-load) · [`remember`](#s-remember) · [`uniqueName`](#s-uniqueName)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`startBoarding`](../interior/boarding.js.md#s-startBoarding) _js/interior/boarding.js_ · [`boardAt`](../npc/bounty.js.md#s-boardAt) _js/npc/bounty.js_ · [`crewOf`](../npc/npccrew.js.md#s-crewOf) _js/npc/npccrew.js_ · [`flowPilot`](../npc/speech.js.md#s-flowPilot) _js/npc/speech.js_

<!-- note:catalogue -->
Catalogue somebody who does not carry a full record — an NPC hull's crew, a
flow boat's pilot, a boarder. `p` = { id, seed?, name, raceId, gender, … }.
Mutates and returns `p` with the name that stands.
<!-- /note -->

### <a id="s-markDead"></a>`markDead(id, how=)`

function · **exported** · L184–195

- calls: [`entryFrom`](#s-entryFrom) · [`load`](#s-load) · [`queuePush`](#s-queuePush) · [`save`](#s-save)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`kill`](../station/stationlife.js.md#s-kill) _js/station/stationlife.js_

<!-- note:markDead -->
They died. The catalogue keeps them; that is what it is for.
<!-- /note -->

### <a id="s-sighted"></a>`sighted(id, place=)`

function · **exported** · L197–205

- calls: [`load`](#s-load) · [`save`](#s-save)

<!-- note:sighted -->
Seen again: where, and when.
<!-- /note -->

### <a id="s-everyone"></a>`everyone()`

function · **exported** · L207–218

- calls: [`entryFrom`](#s-entryFrom) · [`load`](#s-load)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.all`
- called by: [`census`](#s-census) · [`search`](#s-search)

<!-- note:everyone -->
---- reading it -------------------------------------------------------------

Everyone on file: the light entries, with full records folded in.
<!-- /note -->

### <a id="s-entryOf"></a>`entryOf(id)`

function · **exported** · L220–226

- calls: [`entryFrom`](#s-entryFrom) · [`load`](#s-load)
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- called by: [`personCard`](../console/panels/crew-gdb.js.md#s-personCard) _js/console/panels/crew-gdb.js_

<!-- note:entryOf -->
<!-- /note -->

### <a id="s-census"></a>`census({…}=)`

function · **exported** · L228–243

- calls: [`census>by`](#s-census-by) ×3 · [`everyone`](#s-everyone) · [`lower`](#s-lower)
- called by: [`mountGdb>paint`](../console/panels/crew-gdb.js.md#s-mountGdb-paint) _js/console/panels/crew-gdb.js_

<!-- note:census -->
Counts, for the head of the GDB page. `sky` narrows it to one sky.
<!-- /note -->

#### <a id="s-census-by"></a>`census>by(k)`

function · L230–230

- called by: [`census`](#s-census) ×3

<!-- note:census>by -->
<!-- /note -->

### <a id="s-raceName"></a>`raceName(id)`

function · **exported** · L245–245

- via [js/crew/races.js](../crew/races.js.md): `RACES.find`
- called by: [`mountGdb>paint`](../console/panels/crew-gdb.js.md#s-mountGdb-paint) _js/console/panels/crew-gdb.js_ ×2 · [`personCard`](../console/panels/crew-gdb.js.md#s-personCard) _js/console/panels/crew-gdb.js_ · [`search`](#s-search)

<!-- note:raceName -->
<!-- /note -->

### <a id="s-search"></a>`search(q=, {…}=)`

function · **exported** · L247–261

- calls: [`everyone`](#s-everyone) · [`lower`](#s-lower) ×6 · [`raceName`](#s-raceName)
- called by: [`mountGdb>paint`](../console/panels/crew-gdb.js.md#s-mountGdb-paint) _js/console/panels/crew-gdb.js_

<!-- note:search -->
Search by name, people, trade, title or catalogue number.
<!-- /note -->

### <a id="s-chronicle"></a>`chronicle(n=, {…}=)`

function · **exported** · L263–272

- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.all`, `cradle.get`
- called by: [`mountGdb>paint`](../console/panels/crew-gdb.js.md#s-mountGdb-paint) _js/console/panels/crew-gdb.js_

<!-- note:chronicle -->
The chronicle: every line the ledger's histories hold, newest first.
<!-- /note -->

### <a id="s-remote"></a>`remote`

const · L274–274

<!-- note:remote -->
---- the relay --------------------------------------------------------------
<!-- /note -->

### <a id="s-pending"></a>`pending`

const · L275–275

<!-- note:pending -->
<!-- /note -->

### <a id="s-pushTimer"></a>`pushTimer`

const · L276–276

<!-- note:pushTimer -->
<!-- /note -->

### <a id="s-queuePush"></a>`queuePush(e)`

function · L278–283

- calls: [`flushGdb`](#s-flushGdb)
- called by: [`markDead`](#s-markDead) · [`remember`](#s-remember)
- effects: timer `setTimeout`

<!-- note:queuePush -->
<!-- /note -->

### <a id="s-gone"></a>`gone(status)`

function · L285–289

- called by: [`connectGdb`](#s-connectGdb) · [`flushGdb`](#s-flushGdb)

<!-- note:gone -->
<!-- /note -->

### <a id="s-flushGdb"></a>`flushGdb()`

function · **exported** · L291–300

- calls: [`gone`](#s-gone)
- called by: [`connectGdb`](#s-connectGdb) · [`queuePush`](#s-queuePush)
- effects: timer `setTimeout` · net.fetch `/gdb/put`

<!-- note:flushGdb -->
<!-- /note -->

### <a id="s-mergeEntries"></a>`mergeEntries(list=)`

function · **exported** · L302–318

- calls: [`catalogueNo`](#s-catalogueNo) · [`load`](#s-load) · [`save`](#s-save)
- called by: [`connectGdb`](#s-connectGdb)

<!-- note:mergeEntries -->
Merge what another device (via the relay) filed. The first filing of a
person wins their name — that is how two devices converge on one identity.
<!-- /note -->

### <a id="s-connectGdb"></a>`connectGdb(room)`

function · **exported** · L320–337

- calls: [`flushGdb`](#s-flushGdb) · [`gone`](#s-gone) · [`mergeEntries`](#s-mergeEntries)
- called by: [`mountHud>go`](../ui/hud.js.md#s-mountHud-go) _js/ui/hud.js_
- effects: net.fetch `/gdb/all?room=${…}`

<!-- note:connectGdb -->
- L331 · `const there = new Set((j.entries ?? []).map((e) => e.id));` — the sky's people were filed before the relay answered (the halls and
  the captains are made at launch): send up whatever it does not have
<!-- /note -->

### <a id="s-disconnectGdb"></a>`disconnectGdb()`

function · **exported** · L339–343

- called by: [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:disconnectGdb -->
<!-- /note -->

### <a id="s-resetGdb"></a>`resetGdb()`

function · **exported** · L345–348

- effects: storage.remove `‹LS_KEY›`

<!-- note:resetGdb -->
Tests only: forget the device catalogue.

- L347 · `try { globalThis.localStorage?.removeItem(LS_KEY); } catch {` — ignore
<!-- /note -->
