# js/station/deckhall.js

[index](../../../README.md) · 219 lines · 20 symbols · 12 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — the station deck's HALL (0.3.49).

0.3.45 thinned the deck's Crew tab to the hiring hall and sent everything
else to the console. Reported back: from the hall, reaching your own crew
threw you out of the station into the console's glass skin — the deck is
where you are, so the people you are standing next to belong on it, in its
style. And the company registrar had gone to the console with no way to
type a name.

So the HALL is the port's people, all of them, drawn in the deck's own look:

  YOUR CREW        everyone aboard, with TALK inline (the same talk view the
                   interior deck uses), and the two things only a port lets
                   you do with them — SETTLE here, or PAY OFF (both ask twice)
  HIRING HALL      the port's roster, as before
  ON THIS FLOOR    the company's own staff at this port: the company LINE
                   inline (js/station/staffline.js topics), and RECALL
  REGISTRAR        no company yet: a charter, a treasury, and a NAME you type

Split out of stationdeck.js, which is on the project's 600-line gate.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../sim/sim.js` | `sim`, `crewCapacity` | [js/sim/sim.js](../sim/sim.js.md) |
| 2 | `../ui/charts.js` | `radar`, `traitAxes` | [js/ui/charts.js](../ui/charts.js.md) |
| 3 | `../ui/glyphs.js` | `glyphBar`, `sigil` | [js/ui/glyphs.js](../ui/glyphs.js.md) |
| 4 | `../crew/ledger.js` | `crew`, `crewWageTotal`, `hireCrew`, `hireTerms`, `stationRoster`, `wageFor` | [js/crew/ledger.js](../crew/ledger.js.md) |
| 5 | `../npc/cradle.js` | `cradle` | [js/npc/cradle.js](../npc/cradle.js.md) |
| 6 | `../corp/company.js` | `CHARTERS`, `CHARTER_KEYS`, `COMPANY`, `company`, `foundCompany`, `hasCompany`, `recallStaff`, `staffAt`, `suggestName` | [js/corp/company.js](../corp/company.js.md) |
| 7 | `../crew/family.js` | `settleFamily`, `trustOf` | [js/crew/family.js](../crew/family.js.md) |
| 8 | `../crew/talkview.js` | `mountTalk` | [js/crew/talkview.js](../crew/talkview.js.md) |
| 9 | `./staffline.js` | `TOPICS`, `callTopic`, `lineLog`, `openAsk`, `regardOf`, `cutOf`, `topicById` | [js/station/staffline.js](staffline.js.md) |
| 10 | `./stationlife.js` | `incomeOf`, `roleAt` | [js/station/stationlife.js](stationlife.js.md) |
| 11 | `./stafflife.js` | `lifeLine`, `needsLine`, `dayLogOf` | [js/station/stafflife.js](stafflife.js.md) |
| 12 | `./staffcare.js` | `CARE`, `careAct`, `setHousing`, `setHours`, `setJob`, `setShift`, `termsLine`, `workOptions` | [js/station/staffcare.js](staffcare.js.md) |

## Imported by

- [js/station/stationdeck.js](stationdeck.js.md) — `hallPanel`, `resetHall`

## Exports

- [`hallPanel`](#s-hallPanel) · function — used by [js/station/stationdeck.js](stationdeck.js.md)
- [`resetHall`](#s-resetHall) · function — used by [js/station/stationdeck.js](stationdeck.js.md)

## Effects

- **dom.create** — `‹tag›` (el:15)
- **event.listen** — `click on b → fn` (btn:27) · `change on sel → (inline)` (careBlock>pick:109, lineCard:151)
- **input.key** — `Shift` (careBlock:113)
- **timer** — `setTimeout` (hallSection:88)

## Symbols

### <a id="s-DOC"></a>`DOC`

const · L14–14

<!-- note:DOC -->
<!-- /note -->

### <a id="s-el"></a>`el(tag, cls, text)`

function · L15–15

- called by: [`btn`](#s-btn) · [`careBlock`](#s-careBlock) ×4 · [`careBlock>pick`](#s-careBlock-pick) ×2 · [`crewSection`](#s-crewSection) ×4 · [`floorSection`](#s-floorSection) ×3 · [`hallSection`](#s-hallSection) ×7 · [`lineCard`](#s-lineCard) ×12 · [`registrarSection`](#s-registrarSection) ×8 · [`row`](#s-row) ×5
- effects: dom.create `‹tag›`

<!-- note:el -->
<!-- /note -->

### <a id="s-hallView"></a>`hallView`

const · L17–17

<!-- note:hallView -->
what is open on the hall, kept across repaints
<!-- /note -->

### <a id="s-row"></a>`row(parent, label, hint)`

function · L19–26

- calls: [`el`](#s-el) ×5
- called by: [`crewSection`](#s-crewSection) · [`floorSection`](#s-floorSection) · [`hallSection`](#s-hallSection)

<!-- note:row -->
<!-- /note -->

### <a id="s-btn"></a>`btn(text, fn, cls=)`

function · L27–27

- calls: [`el`](#s-el)
- called by: [`armed`](#s-armed) · [`careBlock`](#s-careBlock) · [`crewSection`](#s-crewSection) · [`floorSection`](#s-floorSection) ×2 · [`hallSection`](#s-hallSection) · [`lineCard`](#s-lineCard) · [`registrarSection`](#s-registrarSection)
- effects: event.listen `click`

<!-- note:btn -->
<!-- /note -->

### <a id="s-candidateFor"></a>`candidateFor(sRec)`

function · L29–31

- calls: [`wageFor`](../crew/ledger.js.md#s-wageFor) _js/crew/ledger.js_
- called by: [`floorSection`](#s-floorSection)

<!-- note:candidateFor -->
A settled hand back as a hall candidate, at list wage, no bonus.
<!-- /note -->

### <a id="s-armed"></a>`armed(key, label, fn, cls=)`

function · L33–36

- calls: [`btn`](#s-btn)
- called by: [`crewSection`](#s-crewSection) ×2 · [`lineCard`](#s-lineCard)

<!-- note:armed -->
two taps for anything you cannot take back
<!-- /note -->

### <a id="s-crewSection"></a>`crewSection(st, repaint)`

function · L38–67

- calls: [`hasCompany`](../corp/company.js.md#s-hasCompany) _js/corp/company.js_ · [`trustOf`](../crew/family.js.md#s-trustOf) _js/crew/family.js_ · [`crewWageTotal`](../crew/ledger.js.md#s-crewWageTotal) _js/crew/ledger.js_ · [`mountTalk`](../crew/talkview.js.md#s-mountTalk) _js/crew/talkview.js_ · [`crewCapacity`](../sim/sim.js.md#s-crewCapacity) _js/sim/sim.js_ · [`armed`](#s-armed) ×2 · [`btn`](#s-btn) · [`el`](#s-el) ×4 · [`row`](#s-row) · [`sigil`](../ui/glyphs.js.md#s-sigil) _js/ui/glyphs.js_
- called by: [`hallPanel`](#s-hallPanel)

<!-- note:crewSection -->
- L63 · `mountTalk(host, m.id, { btnClass: "sd-btn", onChange: () => { if (!crew.aboard.some((x) =>` — a topic can settle or pay them off from inside the talk — redraw the hall when they are gone
<!-- /note -->

#### <a id="s-crewSection-settle"></a>`crewSection>settle()`

function · L52–52

- calls: [`settleFamily`](../crew/family.js.md#s-settleFamily) _js/crew/family.js_

<!-- note:crewSection>settle -->
<!-- /note -->

#### <a id="s-crewSection-pay"></a>`crewSection>pay()`

function · L54–54

- calls: [`settleFamily`](../crew/family.js.md#s-settleFamily) _js/crew/family.js_

<!-- note:crewSection>pay -->
<!-- /note -->

#### <a id="s-crewSection-onChange"></a>`crewSection.onChange()`

prop · L63–63

- via [js/crew/ledger.js](../crew/ledger.js.md): `crew.aboard.some`

<!-- note:crewSection.onChange -->
<!-- /note -->

### <a id="s-hallSection"></a>`hallSection(st, repaint)`

function · L69–98

- calls: [`hireCrew`](../crew/ledger.js.md#s-hireCrew) _js/crew/ledger.js_ · [`hireTerms`](../crew/ledger.js.md#s-hireTerms) _js/crew/ledger.js_ · [`stationRoster`](../crew/ledger.js.md#s-stationRoster) _js/crew/ledger.js_ · [`crewCapacity`](../sim/sim.js.md#s-crewCapacity) _js/sim/sim.js_ · [`btn`](#s-btn) · [`el`](#s-el) ×7 · [`row`](#s-row) · [`radar`](../ui/charts.js.md#s-radar) _js/ui/charts.js_ · [`traitAxes`](../ui/charts.js.md#s-traitAxes) _js/ui/charts.js_ ×2 · [`glyphBar`](../ui/glyphs.js.md#s-glyphBar) _js/ui/glyphs.js_ ×2 · [`sigil`](../ui/glyphs.js.md#s-sigil) _js/ui/glyphs.js_
- via [js/crew/ledger.js](../crew/ledger.js.md): `crew.aboard.some`
- via [js/npc/cradle.js](../npc/cradle.js.md): `cradle.get`
- via [js/ui/charts.js](../ui/charts.js.md): `traitAxes.map`
- called by: [`hallPanel`](#s-hallPanel)
- effects: timer `setTimeout`

<!-- note:hallSection -->
- L78 · `if (rs === "staff" || rs === "captain" || rs === "dependant" || rs === "child") continue;` — on somebody's books, or too young
<!-- /note -->

### <a id="s-careBlock"></a>`careBlock(p, repaint)`

function · L100–126

- calls: [`btn`](#s-btn) · [`careBlock>pick`](#s-careBlock-pick) ×4 · [`el`](#s-el) ×4 · [`careAct`](staffcare.js.md#s-careAct) _js/station/staffcare.js_ · [`termsLine`](staffcare.js.md#s-termsLine) _js/station/staffcare.js_ · [`workOptions`](staffcare.js.md#s-workOptions) _js/station/staffcare.js_
- called by: [`lineCard`](#s-lineCard)
- effects: input.key `Shift`

<!-- note:careBlock -->
0.3.53 — WORK · HOME · CARE for one settled hand (js/station/staffcare.js), in the deck's style
<!-- /note -->

#### <a id="s-careBlock-pick"></a>`careBlock>pick(list, cur, fn, aria)`

function · L104–111

- calls: [`el`](#s-el) ×2
- called by: [`careBlock`](#s-careBlock) ×4
- effects: event.listen `change`

<!-- note:careBlock>pick -->
<!-- /note -->

### <a id="s-lineCard"></a>`lineCard(p, repaint)`

function · L128–164

- calls: [`armed`](#s-armed) · [`btn`](#s-btn) · [`careBlock`](#s-careBlock) · [`el`](#s-el) ×12 · [`dayLogOf`](stafflife.js.md#s-dayLogOf) _js/station/stafflife.js_ · [`lifeLine`](stafflife.js.md#s-lifeLine) _js/station/stafflife.js_ · [`needsLine`](stafflife.js.md#s-needsLine) _js/station/stafflife.js_ · [`callTopic`](staffline.js.md#s-callTopic) _js/station/staffline.js_ · [`cutOf`](staffline.js.md#s-cutOf) _js/station/staffline.js_ · [`lineLog`](staffline.js.md#s-lineLog) _js/station/staffline.js_ · [`openAsk`](staffline.js.md#s-openAsk) _js/station/staffline.js_ · [`regardOf`](staffline.js.md#s-regardOf) _js/station/staffline.js_ · [`topicById`](staffline.js.md#s-topicById) _js/station/staffline.js_ · [`incomeOf`](stationlife.js.md#s-incomeOf) _js/station/stationlife.js_ · [`roleAt`](stationlife.js.md#s-roleAt) _js/station/stationlife.js_
- via [js/station/staffline.js](staffline.js.md): `lineLog.slice`, `lineLog.slice.reverse`, `topicById.label.toLowerCase`
- called by: [`floorSection`](#s-floorSection)
- effects: event.listen `change`

<!-- note:lineCard -->
the company line, drawn in the deck's style

- L131 · `` box.append(el("p", "sd-note sd-now", `NOW — ${lifeLine(p)} · ${needsLine(p)}`)); `` — 0.3.52: where they are in their day, and how it has gone
- L142 · `if (t.id === "sendfor") continue;` — they are already here
<!-- /note -->

#### <a id="s-lineCard-run"></a>`lineCard>run()`

function · L155–155

- calls: [`callTopic`](staffline.js.md#s-callTopic) _js/station/staffline.js_

<!-- note:lineCard>run -->
<!-- /note -->

### <a id="s-floorSection"></a>`floorSection(st, repaint)`

function · L166–188

- calls: [`recallStaff`](../corp/company.js.md#s-recallStaff) _js/corp/company.js_ · [`staffAt`](../corp/company.js.md#s-staffAt) _js/corp/company.js_ · [`hireCrew`](../crew/ledger.js.md#s-hireCrew) _js/crew/ledger.js_ · [`crewCapacity`](../sim/sim.js.md#s-crewCapacity) _js/sim/sim.js_ · [`btn`](#s-btn) ×2 · [`candidateFor`](#s-candidateFor) · [`el`](#s-el) ×3 · [`lineCard`](#s-lineCard) · [`row`](#s-row) · [`lifeLine`](stafflife.js.md#s-lifeLine) _js/station/stafflife.js_ · [`cutOf`](staffline.js.md#s-cutOf) _js/station/staffline.js_ · [`openAsk`](staffline.js.md#s-openAsk) _js/station/staffline.js_ ×2 · [`incomeOf`](stationlife.js.md#s-incomeOf) _js/station/stationlife.js_ · [`sigil`](../ui/glyphs.js.md#s-sigil) _js/ui/glyphs.js_
- via [js/corp/company.js](../corp/company.js.md): `company.name.toUpperCase`
- called by: [`hallPanel`](#s-hallPanel)

<!-- note:floorSection -->
<!-- /note -->

### <a id="s-registrarSection"></a>`registrarSection(st, repaint)`

function · L190–212

- calls: [`foundCompany`](../corp/company.js.md#s-foundCompany) _js/corp/company.js_ · [`suggestName`](../corp/company.js.md#s-suggestName) _js/corp/company.js_ · [`btn`](#s-btn) · [`el`](#s-el) ×8
- via [js/corp/company.js](../corp/company.js.md): `COMPANY.registration.toLocaleString`
- called by: [`hallPanel`](#s-hallPanel)

<!-- note:registrarSection -->
<!-- /note -->

### <a id="s-hallPanel"></a>`hallPanel(body, st, repaint)`

function · **exported** · L214–217

- calls: [`hasCompany`](../corp/company.js.md#s-hasCompany) _js/corp/company.js_ · [`crewSection`](#s-crewSection) · [`floorSection`](#s-floorSection) · [`hallSection`](#s-hallSection) · [`registrarSection`](#s-registrarSection)
- called by: [`PANELS.hall`](stationdeck.js.md#s-PANELS-hall) _js/station/stationdeck.js_

<!-- note:hallPanel -->
The HALL tab. `repaint` redraws the deck body.
<!-- /note -->

### <a id="s-resetHall"></a>`resetHall()`

function · **exported** · L219–219

- called by: [`mountStationDeck`](stationdeck.js.md#s-mountStationDeck) _js/station/stationdeck.js_

<!-- note:resetHall -->
Forget the cached hall roster (a new dock).
<!-- /note -->
