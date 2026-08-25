# PATCH v1.01.91 — "NPC Comms and Station"

Two halves of one complaint: things the game declared and never realised. The five fleet
order types that were not `extract` now do work in the world, and NPC dialogue is generated
from a grammar instead of read off a list of eighteen sentences. Schema stays **17**.

---

## The other five order types

v1.01.90 gave `extract` a body — fly to a rock, cut it, run the load in, pay the company.
`patrol`, `escort`, `logistics`, `survey_pass` and `station_keep` were left as they had
always been: dispatch, bind a hull, run a countdown, complete. Nothing moved and nothing
was produced.

`systems/fleet-work.js` is the missing half. Each type gets a step function that moves the
hull, reads the world, and leaves something behind that outlives the objective.

**The rule the file follows: an objective must not invent value out of time.** A patrol
that pays a stipend for existing is an idle-clicker. Every accrual below is gated on
something being true in the world, never on the clock alone.

| order | what it does | what it produces |
|---|---|---|
| `patrol` | flies a circuit around its assigned centre | stipend **only while a hostile is inside the radius**; raiders pushed off the lane pay a bounty and a coalition standing tick. A quiet lane pays nothing — which is the signal the ship is in the wrong place |
| `escort` | closes on and holds station with the protected ship (the player by default) | stipend while inside the escort radius, and hostiles targeting the protected ship are **pulled onto the escort**. That is the service being bought |
| `logistics` | loads at a source berth, flies the leg, sells at the destination | banked revenue and a delivered-kg count. Passive repeats the route; active does one leg and stands down |
| `survey_pass` | holds station over a body | deepens `S.assay`, which the **ground-order system already reads** — a survey pass is worth flying because it makes a later extraction pay better, not because it fills a bar |
| `station_keep` | holds a berth | stipend scaled by contacts, and each new contact is filed to the NPC knowledge base as an incident. Parking a picket where nothing happens costs upkeep and returns nothing |

`fleetOrderReport()` now carries the counters — contacts, deterred, reported, pulled, time
on station, assay gained, earned, current leg — and a one-line `work` summary that the Ops
objective card renders. Before this there was nothing to show but a countdown, because
there was nothing behind it.

An objective can also finish because its **work** finished, not only because its timer ran
out: a single-leg logistics run that has delivered, or a survey that has taken a body to
full assay, sets `workDone` and completes on that pass.

---

## The radio

Nine topics, one or two phrasings each. Eighteen sentences, so a pilot on the trade band
heard the loop close inside ten minutes.

Writing more lines was never the fix. **A hand-written line has no axis to vary along** — a
nineteenth buys about forty seconds and the problem is unchanged. So `data/npc-grammar.js`
does not hold sentences. It holds the pieces a sentence is made of, the rules for combining
them, and a memory of what has already been said.

### Three layers

**Lexicon with real morphology.** Regular English inflection, rule-based rather than
tabulated, with the irregulars that matter listed:

- Pluralisation with the sibilant rule (`box → boxes`), the consonant-`y` rule
  (`body → bodies` but `lay → lays`), and irregulars (`cargo → cargoes`, `person → people`).
- Conjugation with person/number agreement, past, perfect and progressive — including
  consonant doubling (`cut → cutting`) and silent-`e` dropping (`move → moving`).
- `a`/`an` decided on **sound, not spelling**: `an hour`, `a union`, `a user`. A line that
  says "a hour" reads as broken rather than as terse.
- Synonym sets rather than single words, so the same frame with a different verb reads as a
  different sentence and nothing has to be written twice.

**Syntax as frames, not templates.** A frame is a function of the semantic record, which is
what lets it do things a template cannot: decline to mention a fact it was not given,
front the important thing, or drop the subject the way real radio does. Eighteen frames
across six speech acts — inform, ask, offer, request, warn, acknowledge — including
existential (`There are two contacts on the lane`), verbless (`Two contacts, on the lane`),
perfect, progressive, polar question and tag question.

**Discourse.** Register is a property of the *ship*, derived from role and faction, so a
character sounds like itself across every topic it ever raises: raiders and gunships terse,
coalition formal, miners and haulers warm. Markers, hedges and acknowledgements are drawn
from register-specific sets. Vocatives move — front for a call, tail for an aside — and are
suppressed entirely when the clause already names the listener.

### The part that stops it looping

`chooseFrom()` keeps a per-bucket memory of what it has handed back and refuses to repeat
until the pool would be exhausted. Buckets are keyed by speaker *and* topic, so n frames
give n distinct utterances in a row rather than a coin flip that lands on the same face
twice. It is seeded through `core/rng.js`, so the same world produces the same chatter and
a replay does not diverge on dialogue.

### Topics declare meaning now

A topic used to carry `lines: [openerFn, replyFn]` returning fixed strings. It now carries
`say: [openerFn, replyFn]` returning **semantic records** — an act and the facts it
concerns — which the realiser turns into a sentence. The information is fixed and the
wording is generated, so the same tip passed twice is the same tip in two different
sentences.

`lines` is still honoured as a fallback for anything not yet converted, so this is additive
rather than a rewrite of the whole table at once.

---

## Files touched

| File | Change |
|---|---|
| `src/data/npc-grammar.js` | **new** — morphology, frames, register, anti-repetition |
| `src/systems/fleet-work.js` | **new** — work for the five remaining order types |
| `test/comms-work.mjs` | **new** — 90 checks |
| `src/data/npc-topics.js` | seven topics converted to semantic records; `utter()` |
| `src/systems/npc-comms.js` | exchanges go through `utter()`, seeded |
| `src/systems/orders.js` | work step in the tick; `workDone`; work counters in the report |
| `src/ui/ops.js` | objective cards show what the objective produced |
| `src/main.js` | grammar memory reset on new game |
| `test/npc-comms.mjs` | topic-shape assertion accepts `say` or `lines` |
| `test/all.mjs`, `package.json`, `README.md`, `CHANGELOG.md`, `src/core/version.js` | 1.01.91 |

## Verified

- `node test/all.mjs` — **39/39 suites, 3,139 checks, 0 failed.**
- `node test/comms-work.mjs` — 90/90. Morphology is asserted against known-correct forms
  rather than "is different"; twelve realisations of one record yield at least four distinct
  sentences with no two adjacent repeats; a four-item pool is exhausted before anything
  recurs; ship names are never lowercased by a fronted marker and `I` is never lowercased at
  all; every topic produces a punctuated opener and reply across eight exchanges.
- Every menu leaf still dispatches against a full roster.

## Not verified

Nothing rendered in a browser, and no suite reads the comms panel.

The tuning in `WORK` at the top of `fleet-work.js` is first numbers — patrol radius and
stipend, escort radius, survey rate, picket rates. They are deliberately not in `config.js`
because each one only means anything alongside the accrual rule it belongs to, but that
makes them easy to miss when balancing.

Two topics (`haulOffer`, `warnAboutPlayer`) keep some fixed phrasing inside their semantic
records where the content genuinely is a fixed proposition. They vary less than the others.
