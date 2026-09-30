# js/console/panels/corp.js

[index](../../../../README.md) · 346 lines · 26 symbols · 20 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — CONSOLE › CORP: COMPANY · BOARD · PILOT · STANDING · GNN

The company (treasury, book, people, the register desk when docked), the
contract desk (in hand always, offers when docked), the pilot's record
(rank, specialisations, transfer, skills, live modifiers), standing with
every corporation, and the GNN desks with their bulletins' actions.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../kit.js` | `button`, `el`, `group`, `note`, `row`, `section`, `setBar` | [js/console/kit.js](../kit.js.md) |
| 2 | `./corp-marshal.js` | `mountMarshal` | [js/console/panels/corp-marshal.js](corp-marshal.js.md) |
| 3 | `./corp-account.js` | `mountAccount` | [js/console/panels/corp-account.js](corp-account.js.md) |
| 4 | `../../net/account.js` | `account`, `accountLine` | [js/net/account.js](../../net/account.js.md) |
| 5 | `../../npc/bounty.js` | `ticketsHeld` | [js/npc/bounty.js](../../npc/bounty.js.md) |
| 6 | `../../flight/pilot.js` | `certSheet`, `corp`, `pilot`, `rankStatus`, `skillSheet`, `specEffectLines`, `specOptions`, `standingSheet`, `title`, `transferOptions`, `tryPromote`, `trySpecialize`, `tryTransfer` | [js/flight/pilot.js](../../flight/pilot.js.md) |
| 7 | `../../careers/effects.js` | `MOD_LABELS` | [js/careers/effects.js](../../careers/effects.js.md) |
| 8 | `../../careers/index.js` | `SKILLS`, `studySkills` | [js/careers/index.js](../../careers/index.js.md) |
| 9 | `../../crew/races.js` | `raceById`, `traitLines` | [js/crew/races.js](../../crew/races.js.md) |
| 10 | `../../corp/corps.js` | `standingLabel`, `corpOfStation` | [js/corp/corps.js](../../corp/corps.js.md) |
| 11 | `../../ui/glyphs.js` | `sigil` | [js/ui/glyphs.js](../../ui/glyphs.js.md) |
| 12 | `../../sim/sim.js` | `sim` | [js/sim/sim.js](../../sim/sim.js.md) |
| 13 | `../../station/stations.js` | `stationById` | [js/station/stations.js](../../station/stations.js.md) |
| 14 | `../../corp/company.js` | `CHARTERS`, `CHARTER_KEYS`, `COMPANY`, `boardBrief`, `company`, `contacts`, `foundCompany`, `hasCompany`, `staffAt`, `suggestName`, `transfer` | [js/corp/company.js](../../corp/company.js.md) |
| 15 | `../../economy/contracts.js` | `boardFor`, `contracts`, `timeLeft`, `BOARD` | [js/economy/contracts.js](../../economy/contracts.js.md) |
| 16 | `../../ui/boardview.js` | `renderDesk`, `renderHeld` | [js/ui/boardview.js](../../ui/boardview.js.md) |
| 17 | `../../comms/gnn.js` | `DESKS`, `gnn`, `gnnStation`, `runAction` | [js/comms/gnn.js](../../comms/gnn.js.md) |
| 18 | `../../sim/sim.js` | `addAnchoredWaypoint` | [js/sim/sim.js](../../sim/sim.js.md) |
| 19 | `./corp-town.js` | `mountTown` | [js/console/panels/corp-town.js](corp-town.js.md) |
| 20 | `../../station/staffline.js` | `lineSummary`, `unread` | [js/station/staffline.js](../../station/staffline.js.md) |

## Imported by

- [js/console/console.js](../console.js.md) — `default`

## Exports

- `default` · ObjectExpression — used by [js/console/console.js](../console.js.md)

## Effects

- **dom.query** — `small` (mountPilot:170, mountPilot:172)

## Symbols

### <a id="s-DOC"></a>`DOC`

const · L22–22

<!-- note:DOC -->
<!-- /note -->

### <a id="s-docked"></a>`docked()`

function · L23–23

- calls: [`stationById`](../../station/stations.js.md#s-stationById) _js/station/stations.js_
- called by: [`mountBoard`](#s-mountBoard) · [`mountCompany`](#s-mountCompany)

<!-- note:docked -->
<!-- /note -->

### <a id="s-fmtAgo"></a>`fmtAgo(at)`

function · L24–24

- called by: [`mountGnn`](#s-mountGnn) · [`search`](#s-search)

<!-- note:fmtAgo -->
<!-- /note -->

### <a id="s-mountCompany"></a>`mountCompany(root, push, ctx=)`

function · L26–81

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×5 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×9 · [`group`](../kit.js.md#s-group) _js/console/kit.js_ ×2 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ ×3 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×5 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×4 · [`docked`](#s-docked) · [`mountCompany>rebuild`](#s-mountCompany-rebuild) ×3 · [`mountCompany>toLine`](#s-mountCompany-toLine) ×2 · [`boardBrief`](../../corp/company.js.md#s-boardBrief) _js/corp/company.js_ · [`contacts`](../../corp/company.js.md#s-contacts) _js/corp/company.js_ · [`foundCompany`](../../corp/company.js.md#s-foundCompany) _js/corp/company.js_ · [`hasCompany`](../../corp/company.js.md#s-hasCompany) _js/corp/company.js_ ×3 · [`staffAt`](../../corp/company.js.md#s-staffAt) _js/corp/company.js_ · [`suggestName`](../../corp/company.js.md#s-suggestName) _js/corp/company.js_ · [`transfer`](../../corp/company.js.md#s-transfer) _js/corp/company.js_ ×2 · [`stationById`](../../station/stations.js.md#s-stationById) _js/station/stations.js_ · [`sigil`](../../ui/glyphs.js.md#s-sigil) _js/ui/glyphs.js_
- via [js/corp/company.js](../../corp/company.js.md): `company.book.slice`, `company.name.toUpperCase`, `contacts.filter`
- called by: [`SUBS.company`](#s-SUBS-company)

<!-- note:mountCompany -->
---- COMPANY ---------------------------------------------------------------

- L36 · `` : `none:${st?.id ?? ""}:${sim.ship.credits >= COMPANY.registration}`; `` — 0.3.49: not the live purse — a rebuild mid-typing wiped the name field
- L47 · `const nm = el("input", "tinput");` — 0.3.49: a name you type — it was always the suggested one
<!-- /note -->

#### <a id="s-mountCompany-rebuild"></a>`mountCompany>rebuild()`

function · L30–30

- called by: [`mountCompany`](#s-mountCompany) ×3

<!-- note:mountCompany>rebuild -->
<!-- /note -->

#### <a id="s-mountCompany-toLine"></a>`mountCompany>toLine(id)`

function · L67–67

- called by: [`mountCompany`](#s-mountCompany) ×2

<!-- note:mountCompany>toLine -->
<!-- /note -->

### <a id="s-mountBoard"></a>`mountBoard(root, push)`

function · L83–108

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×2 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×2 · [`docked`](#s-docked) · [`corpOfStation`](../../corp/corps.js.md#s-corpOfStation) _js/corp/corps.js_ · [`standingLabel`](../../corp/corps.js.md#s-standingLabel) _js/corp/corps.js_ · [`boardFor`](../../economy/contracts.js.md#s-boardFor) _js/economy/contracts.js_ · [`timeLeft`](../../economy/contracts.js.md#s-timeLeft) _js/economy/contracts.js_ · [`renderDesk`](../../ui/boardview.js.md#s-renderDesk) _js/ui/boardview.js_ · [`renderHeld`](../../ui/boardview.js.md#s-renderHeld) _js/ui/boardview.js_
- via [js/economy/contracts.js](../../economy/contracts.js.md): `contracts.active.map`, `contracts.active.map.join`

<!-- note:mountBoard -->
---- BOARD -----------------------------------------------------------------
<!-- /note -->

#### <a id="s-mountBoard-rebuild"></a>`mountBoard>rebuild()`

function · L87–87

<!-- note:mountBoard>rebuild -->
<!-- /note -->

#### <a id="s-mountBoard-cbtn"></a>`mountBoard>cbtn(label, fn, on=, danger=)`

function · L88–88

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_

<!-- note:mountBoard>cbtn -->
0.3.18: the desk is drawn by js/ui/boardview.js — departments → issuers → offers, as drop-downs
<!-- /note -->

### <a id="s-humanId"></a>`humanId(id)`

function · L110–110

- called by: [`skillName`](#s-skillName)

<!-- note:humanId -->
---- PILOT -----------------------------------------------------------------

"tug_lease" → "Tug Lease"
<!-- /note -->

### <a id="s-skillName"></a>`skillName(id)`

function · L111–111

- calls: [`humanId`](#s-humanId)

<!-- note:skillName -->
<!-- /note -->

### <a id="s-mountPilot"></a>`mountPilot(root, push)`

function · L113–257

- calls: [`studySkills`](../../careers/careerEngine.js.md#s-studySkills) _js/careers/careerEngine.js_ · [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×3 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×13 · [`group`](../kit.js.md#s-group) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×19 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×6 · [`setBar`](../kit.js.md#s-setBar) _js/console/kit.js_ · [`standingLabel`](../../corp/corps.js.md#s-standingLabel) _js/corp/corps.js_ · [`raceById`](../../crew/races.js.md#s-raceById) _js/crew/races.js_ ×2 · [`traitLines`](../../crew/races.js.md#s-traitLines) _js/crew/races.js_ · [`certSheet`](../../flight/pilot.js.md#s-certSheet) _js/flight/pilot.js_ · [`corp`](../../flight/pilot.js.md#s-corp) _js/flight/pilot.js_ · [`rankStatus`](../../flight/pilot.js.md#s-rankStatus) _js/flight/pilot.js_ · [`skillSheet`](../../flight/pilot.js.md#s-skillSheet) _js/flight/pilot.js_ · [`specEffectLines`](../../flight/pilot.js.md#s-specEffectLines) _js/flight/pilot.js_ · [`specOptions`](../../flight/pilot.js.md#s-specOptions) _js/flight/pilot.js_ · [`title`](../../flight/pilot.js.md#s-title) _js/flight/pilot.js_ ×3 · [`transferOptions`](../../flight/pilot.js.md#s-transferOptions) _js/flight/pilot.js_ · [`tryPromote`](../../flight/pilot.js.md#s-tryPromote) _js/flight/pilot.js_ · [`trySpecialize`](../../flight/pilot.js.md#s-trySpecialize) _js/flight/pilot.js_ · [`tryTransfer`](../../flight/pilot.js.md#s-tryTransfer) _js/flight/pilot.js_ · [`sigil`](../../ui/glyphs.js.md#s-sigil) _js/ui/glyphs.js_
- effects: dom.query `small`

<!-- note:mountPilot -->
- L153 · `const modSec = section("Live modifiers");` — Everything the race and the specialisation are doing to the hull right now — the composed truth, not the brochure.
- L244 · `for (const line of traitLines(pilot.raceId)) row(modBody, line.label, { hint: raceById(pil` — the race's own lines fold in here rather than as a brochure of their own
<!-- /note -->

### <a id="s-mountStanding"></a>`mountStanding(root, push)`

function · L259–277

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ · [`section`](../kit.js.md#s-section) _js/console/kit.js_ · [`standingLabel`](../../corp/corps.js.md#s-standingLabel) _js/corp/corps.js_ · [`standingSheet`](../../flight/pilot.js.md#s-standingSheet) _js/flight/pilot.js_

<!-- note:mountStanding -->
---- STANDING --------------------------------------------------------------
<!-- /note -->

### <a id="s-mountGnn"></a>`mountGnn(root, push)`

function · L279–310

- calls: [`gnnStation`](../../comms/gnn.js.md#s-gnnStation) _js/comms/gnn.js_ · [`runAction`](../../comms/gnn.js.md#s-runAction) _js/comms/gnn.js_ · [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×2 · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×2 · [`group`](../kit.js.md#s-group) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×2 · [`section`](../kit.js.md#s-section) _js/console/kit.js_ ×2 · [`fmtAgo`](#s-fmtAgo) · [`mountGnn>rebuild`](#s-mountGnn-rebuild) · [`addAnchoredWaypoint`](../../sim/sim.js.md#s-addAnchoredWaypoint) _js/sim/sim.js_
- via [js/comms/gnn.js](../../comms/gnn.js.md): `gnn.posts.filter`, `gnn.posts.filter.slice`, `gnn.posts.map`, `gnn.posts.map.join`, `….filter.slice.reverse`

<!-- note:mountGnn -->
---- GNN -------------------------------------------------------------------
<!-- /note -->

#### <a id="s-mountGnn-rebuild"></a>`mountGnn>rebuild()`

function · L283–283

- called by: [`mountGnn`](#s-mountGnn)

<!-- note:mountGnn>rebuild -->
<!-- /note -->

### <a id="s-SUBS"></a>`SUBS`

const · L312–316

<!-- note:SUBS -->
---- the panel -------------------------------------------------------------

the panels here take (root, push, ctx); crew-side panels take (root, ctx)

---- TOWN ------------------------------------------------------------------

What the people you settled are doing now. They used to be a row that made
a number; they work, climb, marry, have children who grow up onto the rolls,
fall out, walk off and occasionally do not come home — and all of it moves
the treasury, the standing or the board. The point of the desk is that you
can see the ones who are about to leave before they do.
<!-- /note -->

#### <a id="s-SUBS-company"></a>`SUBS.company(root, push, ctx)`

prop · L313–313

- calls: [`mountCompany`](#s-mountCompany)

<!-- note:SUBS.company -->
<!-- /note -->

#### <a id="s-SUBS-town"></a>`SUBS.town(root, push, ctx)`

prop · L313–313

- calls: [`mountTown`](corp-town.js.md#s-mountTown) _js/console/panels/corp-town.js_

<!-- note:SUBS.town -->
<!-- /note -->

#### <a id="s-SUBS-marshal"></a>`SUBS.marshal(root, push, ctx)`

prop · L314–314

- calls: [`mountMarshal`](corp-marshal.js.md#s-mountMarshal) _js/console/panels/corp-marshal.js_

<!-- note:SUBS.marshal -->
<!-- /note -->

#### <a id="s-SUBS-account"></a>`SUBS.account(root, push, ctx)`

prop · L315–315

- calls: [`mountAccount`](corp-account.js.md#s-mountAccount) _js/console/panels/corp-account.js_

<!-- note:SUBS.account -->
<!-- /note -->

### <a id="s-mount"></a>`mount(root, ctx)`

prop · L323–323

<!-- note:mount -->
<!-- /note -->

### <a id="s-paint"></a>`paint()`

prop · L324–324

<!-- note:paint -->
<!-- /note -->

### <a id="s-unmount"></a>`unmount()`

prop · L325–325

<!-- note:unmount -->
<!-- /note -->

### <a id="s-search"></a>`search()`

prop · L326–345

- calls: [`fmtAgo`](#s-fmtAgo) · [`hasCompany`](../../corp/company.js.md#s-hasCompany) _js/corp/company.js_ ×2 · [`standingLabel`](../../corp/corps.js.md#s-standingLabel) _js/corp/corps.js_ · [`standingSheet`](../../flight/pilot.js.md#s-standingSheet) _js/flight/pilot.js_ · [`accountLine`](../../net/account.js.md#s-accountLine) _js/net/account.js_ · [`ticketsHeld`](../../npc/bounty.js.md#s-ticketsHeld) _js/npc/bounty.js_ ×2 · [`lineSummary`](../../station/staffline.js.md#s-lineSummary) _js/station/staffline.js_
- via [js/comms/gnn.js](../../comms/gnn.js.md): `gnn.posts.slice`

<!-- note:search -->
<!-- /note -->

#### <a id="s-search-status"></a>`search.status()`

prop · L334–334

<!-- note:search.status -->
<!-- /note -->

#### <a id="s-search-status-2"></a>`search.status~2()`

prop · L337–337

- calls: [`unread`](../../station/staffline.js.md#s-unread) _js/station/staffline.js_ ×2

<!-- note:search.status~2 -->
<!-- /note -->
