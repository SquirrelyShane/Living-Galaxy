# PATCH v1.02.00 — "Line of Sight"

Seven defects from an hour of actual play on the phone, which found more than the last three
audits put together. Schema stays **17**.

Landfall moves to v1.02.10. A playtest defect outranks a planned slice, and five of these are
things a player hits in the first ten minutes.

---

## The radio was speaking broken English, and it was one line of data

Real transmissions from the comms log:

```
PIRATE RAIDER 08   Pirate Raider 13, copy. are you holding?
PIRATE RAIDER 13   Copy. acknowledged.
NEXIS DRONE 08     Coalition Patrol 03, copy. that is a lot of hull for one gun.
                   Keep your eyes open.
COALITION PATROL 03  Still talking. Keep your eyes open.
```

`LEX.marker.terse` had `'Right.'` and `'Copy.'` in it. A **marker** leads a clause and the
clause continues in lower case — "Look, the face reads well" — so `realise()` lowercases the
first word after one. Those two are whole sentences. Every terse line in the game has been
coming out as a full stop followed by a lowercased word since the grammar layer shipped.

Four fixes:

- A marker that ends in `.`/`!`/`?` keeps the following capital. Terse register's marker is
  now `'Right,'` and the acknowledgements live in `LEX.ack`, where they already were — the
  two lists had been conflated.
- **An acknowledgement in front of an acknowledgement says nothing twice.** "Copy.
  acknowledged." and "Right. received." were both real. A clause whose act is `ack` gets no
  furniture in front of it.
- **A clause-leading marker takes a declarative.** "Note that are you holding?" is not English
  at all, and formal register was emitting it. Questions get no furniture.
- **The opener and the reply drew from different anti-repetition buckets.** They are spoken by
  different characters, and the bucket is keyed on the speaker, so a reply could land on the
  phrase it was answering — which is the "Keep your eyes open." echo above. Phrase pools are
  now shared across the exchange; frame and register choice stay per-speaker, because two
  people using the same sentence *shape* is how conversation sounds and two people using the
  same *words* is how a tape loop sounds.

Now: `Pirate Raider 13, received.` · `Logged. All quiet on my scope, Pirate Raider 13.` ·
`Are you holding?`

## The chart was showing you things your sensor cannot see

Every NPC in Solaris was drawn on the system chart. Only *tappability* was range-gated, which
is worse than either honest option, because an unreachable blip still looks like information —
you can count the traffic in a lane you have no business knowing about.

Plotting is now gated on `detectionRange(sensor, npcSignature(u))` — against signature, not
raw range, which is the asymmetry the ambush code already uses. A laden hauler is a bigger
return than a raider running quiet, so the chart shows you the freighter first and the thing
hunting it last. That is the right way round for a screen you check before committing to a
lane.

Your own contracted hulls are exempt and always plotted. The company knows where its ships
are; that is what a contract is.

## The nav map fell off the bottom of the phone — and so did everything else

The real cause was not the nav map. `html,body{height:100%}` resolves against the **large**
viewport — the one you get with the browser toolbars hidden. With Brave's address bar and
bottom bar both showing, the page is taller than the visible area, the overflow is hidden, and
there is nothing to scroll. Every full-height overlay in the game has been losing its bottom
edge on a phone. `100dvh` tracks the viewport as the toolbars come and go, with the `100%`
left in front of it as the fallback.

The nav map is also restructured, because one column of tools + canvas + info + sensor return
+ five buttons was never going to fit:

- **Chart** keeps the map, the filter chips, the zoom controls and the action row.
- **Detail** takes the info line and the sensor return, and shows a dot when there is
  something new to read. Selecting a body does *not* switch panes — you are usually mid-pan
  and about to tap Warp — but **Scan** does, because a button whose output prints on a screen
  you are not looking at reads as a button that did nothing.
- A **Key** chip overlays the legend on the map rather than taking a row of it: on a 360 px
  screen a permanent legend costs more chart than it explains. It ends with the line that
  makes the change above legible — *traffic your sensor cannot resolve is not plotted* —
  because a chart that hides things has to say so or it reads as a quiet system.

The canvas is re-measured on the way back to the Chart pane. A canvas has no size while its
pane is hidden, and a chart drawn against a zero-width canvas comes back blank.

## Settings had a tab you could not reach in portrait

Seven tabs, `flex:1` each — which does not shrink them, because `.tab` carries `min-width:56px`
from the shared rule. Seven of those plus gaps overflow the card, and Diagnostics sat past the
right edge with no scroll affordance. Landscape was the only way to open it.

Wrapped to two rows. A horizontal scroller was the other option and is worse: an off-screen tab
with nothing indicating it can be scrolled to is an invisible tab.

## You name your own company

`foundCompany()` has accepted `opts.name` since v1.01.72 and nothing ever passed one, so every
company in the game was called `<your forename> Holdings`. There is an input on the launch step
now, prefilled with the suggestion, and Launch is gated on it not being blank.

Two notes on the field itself: `*{user-select:none}` and `touch-action:none` are set globally
for the flight controls, and both have to be undone on the input or it looks editable on a
phone and is not.

## Company hulls are lettered like company property

`u.name = S.company.name.split(/\s+/)[0]` — the first word only. "Skae Merch Co." became
**Skae Extractor**, and since the default company name was the pilot's forename plus
"Holdings", the pilot's own name was going on the side of company hulls. It uses the
registered name now, trimmed at a word boundary and only past 22 characters, so "Meridian
Extraction Consortium" becomes "Meridian Extraction" rather than "Meridian Extracti".

## A founder starts on the office deck with nothing to fly

Two halves of the same rule.

**The executive career grants no hull.** It grants the licence, the treasury and the board.
`ownedHulls` is left empty and that is the entire mechanism — `undock()` and `switchHull()`
already refuse a hull you do not own, so nothing new gates anything. Undocking gives a reason
and points at the yard. The civilian shuttle costs nothing there, so this is a first decision
rather than a wall: you can be flying in one tap, and the tap is the point. A founder who is
handed a ship is a pilot with extra paperwork.

**A hull the company paid for stays the company's.** `transferHull(id, 'player')` is refused.
It made the treasury a personal wallet with an extra step — commission a ship on company
money, move it across, and the board has funded a private fleet it can no longer recall or
order. The verb stays and the other direction still works: a pilot may sign their own ship
over to the company, and selling or leasing one back is a slice that will want it.

**The first version of this soft-locked the game**, and walking the path by hand is what
caught it. The executive is licensed for `economic` — a 12,600 cr freighter against about
2,000 cr in personal credits. The civilian shuttle is free at any yard, but `switchHull()`
refuses an unlicensed hull, so the founder would have owned a shuttle they were not allowed to
fly, with no affordable alternative and no way to undock. A shipless career is now licensed
for the shuttle as well as its charter hull.

`test/hangar.mjs` asserts the refusal, the reason, that nothing moved, that a founder starts
owning no hull while keeping their licence — and then walks the whole escape path: cannot
undock, shuttle is free, licensed for it, claim it, own it, flying it. It also picked up a
trap worth writing down: `fleetRoster()` returns summaries, not contracts, so writing to one
changes nothing.

## Files touched

| file | change |
|---|---|
| `src/data/npc-grammar.js` | markers and acknowledgements separated; no furniture on acks or questions |
| `src/data/npc-topics.js` | phrase pools shared across an exchange (`pairBucket`) |
| `src/ui/navmap.js` | Chart/Detail panes, legend, pane-aware redraw, detection-gated plotting |
| `src/ui/creation.js` | company name input on the launch step |
| `src/systems/character.js` | `shipless` careers grant no hull, and a shuttle licence so the start is not a lock |
| `src/systems/economy.js` | `ownsCurrentHull()`; undock refuses without one |
| `src/systems/fleet.js` | `companyTag()` for hull names; company hulls do not transfer to the pilot |
| `src/systems/company.js` | `suggestName` exported |
| `src/data/origins.js` | executive is `shipless`, description rewritten |
| `index.html` | nav map two-pane markup, legend, Key chip |
| `css/base.css` | `100dvh` |
| `css/overlays.css` | settings tabs wrap |
| `css/panels.css` | nav map panes and legend; `.cfield` input |
| `test/hangar.mjs` | ownership rule rewritten; founder-owns-nothing block |

## Verified

- `node test/all.mjs` — **42/42 suites green, 3,309 checks** (94 s).
- Grammar output sampled by hand across three registers and three acts before and after.

## Not verified

- **None of this has been opened on a phone by me.** Every item here came from your
  screenshots, and the two-pane nav map, the wrapped settings tabs, the `dvh` change and the
  text input are all things only hardware can confirm. This is the eighth slice on that list
  and the first where the list is the *subject* of the patch.
- **The shipless start has been tested but not played.** The escape path is asserted end to
  end in `hangar.mjs` and the Ships tab is unconditional in the dock markup, so the yard is
  reachable at every station. What is untested is whether it *reads* as a decision or as a
  bug — a player who launches, finds no ship and is told to visit the yard may reasonably
  think something failed. The dock screen does not currently say anything about it on arrival.
- **The chart's new blind spots are untuned.** No measurement of how much traffic actually
  disappears at a typical sensor rating; it may turn out that the chart is now too quiet in
  the outer system, which is a config change rather than a code one.
