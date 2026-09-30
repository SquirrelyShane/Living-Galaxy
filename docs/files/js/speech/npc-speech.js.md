# js/speech/npc-speech.js

[index](../../../README.md) · 6718 lines · 605 symbols · 0 imports · 3 importers

## About

<!-- note:@file -->
Living Galaxy — npc-speech.js

One file: everything an NPC needs to say something and mean it.

This is `data/npc-grammar.js` and `data/npc-topics.js` merged, with the two pieces that
were always missing bolted on — a director that actually runs conversations over time,
and a way for the player to say something back. Nothing was cut in the merge; the two
halves are still visibly two halves, because the boundary between them is real and worth
keeping: the grammar knows English and nothing about the world, the topics know the world
and nothing about English.

  1  seeded rng          inlined, so this file has no imports at all
  2  morphology          inflection: plurals, tense, aspect, mood, degree, number-words
  3  lexicon             synonym sets, with the features the syntax needs
  4  register            who speaks how, and the numeric dials behind it
  5  choosing            anti-repetition memory, bucketed and serialisable
  6  syntax frames       71 clause shapes, scored against the record being said
  7  proofing            21 rules that read the finished string and repair or reject it
  8  realisation         record -> sentence
  9  content helpers     fact -> phrase, the boundary the topics speak across
 10  topics              44 reasons two ships open a channel, and what they file after
 11  exchange engine     turn-taking, scoring, chaining, memory records
 12  the player          parsing what a human types and answering it in character
 13  director            a running world: pairs, cooldowns, memory, reputation drift
 14  self-test           everything above, headless

No build step, no dependencies, no imports. Load it as a module:

  &lt;script type="module">
    import { createWorld } from './data/npc-speech.js';
    const w = createWorld({ seed: 1337 });
    setInterval(() => w.tick(1), 1000);
  &lt;/script>

or open `demo.html` next to it — that is what it is for. Note that ES modules need a real
origin: `python3 -m http.server` in the project root, not file://.

- L891 · `const recent = new Map();` — bucket -> array of recently used keys, newest last
- L892 · `const recentLines = [];` — finished utterances, newest last
- L2800 · `Object.assign(TOPICS, {` — The table is assembled in sections rather than written as one enormous literal. Each
  section is a family of topics that share a channel and a set of preconditions, and
  keeping them apart means a change to how combat chatter works cannot accidentally edit
  how trade chatter works — which is exactly what happened when they lived in one object.
- L2800 · `Object.assign(TOPICS, {` — ── trouble: distress and rescue ─────────────────────────────────────
- L2811 · `agr: { person: 3, number: 'sg', aspect: 'prog' },` — Progressive: a distress call is about something happening right now, and the
  simple present ("takes fire") reads as a habit rather than an emergency.
- L2813 · `object: chooseFrom(['fire', 'hits', 'a working over', 'rounds through the hull'],` — No first person in the object: this clause is in the third person so the band
  hears which hull is in trouble, and "Deepcut 02 has taken more than I can hold"
  is two speakers in one sentence.
- L2815 · `frames: ['inform-progressive', 'inform-svo', 'inform-fronted'],` — Pinned to the shapes that keep it in the present: the perfect turns a mayday into
  a report of something already over.
- L2842 · `refuseHelp: {` — The call nobody answers. A distress channel where help always arrives is a channel with
  no stakes; this fires when the only ships in range cannot or will not come, and it is
  the single most effective thing in the table at making a system feel inhabited by
  people with their own problems rather than by a support crew.
- L2873 · `filesTo:   { type: 'refused-help', weight: -1.2 },` — Being turned down is filed, and it is filed *negatively*. A character remembers who
  did not come, and slice 10 reads it when deciding whose contract to take.
- L3031 · `frames: ['inform-svo'],` — Pinned: the perfect ("I have owed you a favour") is grammatical and is not a
  thing a person says while thanking somebody.
- L3041 · `frames: ['inform-verbless', 'inform-contrast']` — These are whole clauses, so only the frames that pass an object through as a
  sentence can take them. The existential frame turned the first into "There are
  buy me something at the next berth."
- L3044 · `filesFrom: { type: 'owes-favour', weight: 1.5 },` — A favour owed, on both sides of the pair. Slice 10 reads exactly this to decide
  whether a character will take a contract from somebody.
- L3049 · `owesFavour: {` — Calling in a debt. The other side of `thanks`, and the point at which the social layer
  stops being flavour: a character with a marker on somebody spends it, and the ledger
  entry is consumed whether or not the answer is yes.
- L3096 · `filesFrom: { type: 'apologised', weight: 0.8 },` — An apology moves regard, which is the only thing in the table that repairs it.
- L3102 · `Object.assign(TOPICS, {` — ── the other side: combat, threats, grudges ─────────────────────────
- L3131 · `standoff: {` — Two armed hulls that have not decided yet. The interesting case, because it can end
  either way and the ending is filed: a standoff that breaks peacefully is a relationship,
  and one that does not is a grudge with a date on it.
- L3245 · `object: chooseFrom(['your board', 'that side of the lane', 'the corridor'],` — A bare "Watch." is an order with no object, which reads as a stage direction.
- L3313 · `offers: 'pact',` — A standing obligation rather than a one-off. `offers: 'pact'` is read by
  systems/npc-comms.js and raises the priority of any future distress call between
  these two, which is how a friendship becomes something the sim can act on.
- L3320 · `Object.assign(TOPICS, {` — ── the player ───────────────────────────────────────────────────────
  
  The topics that make reputation travel at the speed of conversation instead of
  teleporting into a global number. A character who has watched you kill its own passes
  that on, and the listener files it as though they had seen it — which is how a belt gets
  cold two stations away from anything you did.
  
  All of them are gated on `ctx.warinessOf`, so they only fire once the player has actually
  done something. A galaxy where NPCs discuss a pilot who has done nothing yet is a galaxy
  that has told the player they are the protagonist, which is precisely the thing this
  whole system exists to avoid.
- L3347 · `filesTo:   { type: 'saw-kill-ours', subject: 'player', weight: 0.7 },` — Second-hand, and weighted lighter than witnessing it: hearing about something is not
  seeing it, and a rumour that carried the same weight as an eyewitness account would
  make the whole faction hostile from one kill.
- L3386 · `playerPraise: {` — The mirror. A player who has helped somebody gets talked about in exactly the same
  machinery, and the good word travels at the same speed as the bad one — which is the
  only thing that makes the bad one feel like a consequence rather than a punishment.
- L3437 · `Object.assign(TOPICS, {` — ── station, navigation and the world itself ─────────────────────────
  
  Traffic that exists because the *place* exists rather than because the two speakers do.
  A ring with docking chatter on its band is a working installation; the same ring with a
  silent band is scenery with a collision box.
- L3470 · `({ a, bucket }) => ({` — A request rather than a question: the record carries the *thing wanted* as an NP, and
  the question frames wrap an NP in the wrong wh-word — "Where are you seeing word on
  the far leg?" was the trade band asking for the location of a phrase.
- L3632 · `shareRumour: {` — ── the social layer proper ────────────────────────────────────────
- L3632 · `shareRumour: {` — Gossip about a *third party*. The topic that makes the relationship graph do work
  beyond the pair holding the channel: what A thinks of C reaches B without C ever being
  present, and B files it as hearsay. It is also the cheapest way for the player to learn
  that the world has opinions it did not have to be told directly.
- L3660 · `filesFrom: { type: 'passed-rumour', weight: 0.5 },` — Filed against the third party, not the speaker — the one place in the table where the
  subject of the memory is somebody who was not on the channel.
- L3749 · `Object.assign(TOPICS, {` — ── deeper water: arguments, debts, and the long social arcs ─────────
  
  Everything above this point is a transaction: somebody wants something, somebody answers,
  it is filed. These are the exchanges that need the accusation and denial moves to exist
  at all, and they are the reason those moves were built — a claim dispute where neither
  side can say "you did this" and "no I did not" is two ships issuing warnings at each
  other until one of them stops.
  
  They run three to five turns, they can end badly, and several of them can only happen
  because of something that happened earlier: an accusation needs a grievance on file, an
  arbitration needs a dispute, a second chance needs a grudge to repair. That dependency is
  what makes them read as a history rather than as a random draw from a bigger table.
- L3959 · `act: 'inform',` — An observation rather than a question: every polar frame turned "have you been out
  here long" into "Are you running this belt long?", which nobody says.
- L4302 · `Object.assign(TOPICS, {` — ── conversations with a past ────────────────────────────────────────
  
  The topics above are all about the present: what is on the board, what is in the hold,
  what somebody just did. That is most of radio traffic and it is also the ceiling on how
  deep any of it can go, because a conversation that can only refer to now has no way to
  become a relationship.
  
  These five read the memory store. `rememberWhen` cites an exchange that actually happened
  between these two; `shortWeight` runs a full accusation through denial, evidence and
  settlement across five turns; `bandDiscipline` is somebody being told off for how they
  used the channel, which is the only topic in the table *about talking*; `routeHandover`
  passes a responsibility from one ship to another, and `shoreLeave` is two people who have
  talked two dozen times finally saying something that is not business.
- L4304 · `rememberWhen: {` — The topic that could not exist before the memory store did. It names a specific filed
  exchange — its kind, and how long ago — so two ships who have a history talk like they
  have one instead of meeting fresh every time.
- L4346 · `shortWeight: {` — Five turns, and every one of them a different move: accusation, denial, evidence,
  concession, settlement. The arc is the point — an accusation that resolves in two lines
  is not an argument, it is an exchange of labels.
- L4361 · `memo.guilty = memo.guilty != null ? memo.guilty` — Decided once and remembered for the rest of the exchange: whether this hauler is
  actually guilty. Recomputing it per turn is how a topic ends up denying something
  in one line and admitting it in the next.
- L4405 · `bandDiscipline: {` — The only topic in the table about talking itself, which makes it the only one that can
  teach a character something about how it comes across.
- L4436 · `filesTo:   { type: 'was-disputed', weight: -0.6 },` — Being corrected on the air is filed against the ship that did the correcting: it is
  not a favour, and the memory is what makes a later grudge legible.
- L6706 · `if (typeof window !== 'undefined') {` — One namespace for the debug console and for any non-module consumer.
- L6708 · `realise, realiseAll, speak, proof, isWellFormed, LEX, FRAMES, REGISTERS,` — grammar
- L6710 · `quantity, described, place, timeRef, bearing, phonetic, shortName, listOf, combine,` — content helpers
- L6711 · `TOPICS, TOPIC_KEYS, CHANNELS, utter, exchange, availableTopics, chooseTopic, scoreTopic,` — topics and engine
- L6713 · `talkToNpc, parsePlayerLine, INTENTS, PLAYER_PROMPTS, createWorld, makeCrew,` — player and world
- L6714 · `parseTranscript, profileOf, compareProfiles, calibrate, fitTarget, currentTarget,` — corpus
- L6716 · `runSpeechSelfTest, runGrammarSelfTest, runTopicSelfTest` — tests
<!-- /note -->

## Imports

_none_

## Imported by

- [js/npc/speech.js](../npc/speech.js.md) — `CALIBRATION`, `PLAYER_PROMPTS`, `TOPICS`, `chooseTopic`, `createWorld`, `exchange`, `memoriesFrom`, `obligationFrom`, `registerOf`
- test/ground.test.mjs _(outside js/)_ — `TOPICS`
- test/speech.test.mjs _(outside js/)_ — `CALIBRATION`, `runGrammarSelfTest`

## Exports

- [`plural`](#s-plural) · function — **no importer in scanned roots**
- [`isMass`](#s-isMass) · function — **no importer in scanned roots**
- [`gerund`](#s-gerund) · function — **no importer in scanned roots**
- [`regularPast`](#s-regularPast) · function — **no importer in scanned roots**
- [`third`](#s-third) · function — **no importer in scanned roots**
- [`participle`](#s-participle) · function — **no importer in scanned roots**
- [`pastOf`](#s-pastOf) · function — **no importer in scanned roots**
- [`copula`](#s-copula) · function — **no importer in scanned roots**
- [`conjugate`](#s-conjugate) · function — **no importer in scanned roots**
- [`infinitive`](#s-infinitive) · function — **no importer in scanned roots**
- [`imperative`](#s-imperative) · function — **no importer in scanned roots**
- [`comparative`](#s-comparative) · function — **no importer in scanned roots**
- [`superlative`](#s-superlative) · function — **no importer in scanned roots**
- [`adverbise`](#s-adverbise) · function — **no importer in scanned roots**
- [`numberWord`](#s-numberWord) · function — **no importer in scanned roots**
- [`ordinal`](#s-ordinal) · function — **no importer in scanned roots**
- [`vagueCount`](#s-vagueCount) · function — **no importer in scanned roots**
- [`article`](#s-article) · function — **no importer in scanned roots**
- [`pronoun`](#s-pronoun) · function — **no importer in scanned roots**
- [`agreeWith`](#s-agreeWith) · function — **no importer in scanned roots**
- [`np`](#s-np) · function — **no importer in scanned roots**
- [`possessive`](#s-possessive) · function — **no importer in scanned roots**
- [`listOf`](#s-listOf) · function — **no importer in scanned roots**
- [`LEX`](#s-LEX) · const — **no importer in scanned roots**
- [`contract`](#s-contract) · function — **no importer in scanned roots**
- [`REGISTERS`](#s-REGISTERS) · const — **no importer in scanned roots**
- [`REGISTER_PROFILE`](#s-REGISTER_PROFILE) · const — **no importer in scanned roots**
- [`registerOf`](#s-registerOf) · function — used by [js/npc/speech.js](../npc/speech.js.md)
- [`profileFor`](#s-profileFor) · function — **no importer in scanned roots**
- [`chooseFrom`](#s-chooseFrom) · function — **no importer in scanned roots**
- [`chooseWeighted`](#s-chooseWeighted) · function — **no importer in scanned roots**
- [`saidRecently`](#s-saidRecently) · function — **no importer in scanned roots**
- [`resetGrammarMemory`](#s-resetGrammarMemory) · function — **no importer in scanned roots**
- [`serialiseGrammarMemory`](#s-serialiseGrammarMemory) · function — **no importer in scanned roots**
- [`restoreGrammarMemory`](#s-restoreGrammarMemory) · function — **no importer in scanned roots**
- [`grammarStats`](#s-grammarStats) · function — **no importer in scanned roots**
- [`MOVES`](#s-MOVES) · const — **no importer in scanned roots**
- [`ACT_MOVE`](#s-ACT_MOVE) · const — **no importer in scanned roots**
- [`checkMove`](#s-checkMove) · function — **no importer in scanned roots**
- [`FRAMES`](#s-FRAMES) · const — **no importer in scanned roots**
- [`moveOf`](#s-moveOf) · function — **no importer in scanned roots**
- [`framesFor`](#s-framesFor) · function — **no importer in scanned roots**
- [`PROOF_RULES`](#s-PROOF_RULES) · const — **no importer in scanned roots**
- [`proof`](#s-proof) · function — **no importer in scanned roots**
- [`isWellFormed`](#s-isWellFormed) · function — **no importer in scanned roots**
- [`looksClausal`](#s-looksClausal) · function — **no importer in scanned roots**
- [`realise`](#s-realise) · function — **no importer in scanned roots**
- [`quantity`](#s-quantity) · function — **no importer in scanned roots**
- [`attributive`](#s-attributive) · function — **no importer in scanned roots**
- [`described`](#s-described) · function — **no importer in scanned roots**
- [`place`](#s-place) · function — **no importer in scanned roots**
- [`timeRef`](#s-timeRef) · function — **no importer in scanned roots**
- [`bearing`](#s-bearing) · function — **no importer in scanned roots**
- [`phonetic`](#s-phonetic) · function — **no importer in scanned roots**
- [`shortName`](#s-shortName) · function — **no importer in scanned roots**
- [`combine`](#s-combine) · function — **no importer in scanned roots**
- [`realiseAll`](#s-realiseAll) · function — **no importer in scanned roots**
- [`speak`](#s-speak) · function — **no importer in scanned roots**
- [`varietyOf`](#s-varietyOf) · function — **no importer in scanned roots**
- [`runGrammarSelfTest`](#s-runGrammarSelfTest) · function — used by test/speech.test.mjs
- [`TOPICS`](#s-TOPICS) · const — used by [js/npc/speech.js](../npc/speech.js.md), test/ground.test.mjs
- [`TOPIC_KEYS`](#s-TOPIC_KEYS) · const — **no importer in scanned roots**
- [`RESPONSE_OK`](#s-RESPONSE_OK) · const — **no importer in scanned roots**
- [`coerceResponse`](#s-coerceResponse) · function — **no importer in scanned roots**
- [`createSpeechMemory`](#s-createSpeechMemory) · function — **no importer in scanned roots**
- [`utter`](#s-utter) · function — **no importer in scanned roots**
- [`utterRecord`](#s-utterRecord) · function — **no importer in scanned roots**
- [`utterFromRecord`](#s-utterFromRecord) · function — **no importer in scanned roots**
- [`turnsFor`](#s-turnsFor) · function — **no importer in scanned roots**
- [`exchange`](#s-exchange) · function — used by [js/npc/speech.js](../npc/speech.js.md)
- [`availableTopics`](#s-availableTopics) · function — **no importer in scanned roots**
- [`scoreTopic`](#s-scoreTopic) · function — **no importer in scanned roots**
- [`chooseTopic`](#s-chooseTopic) · function — used by [js/npc/speech.js](../npc/speech.js.md)
- [`memoriesFrom`](#s-memoriesFrom) · function — used by [js/npc/speech.js](../npc/speech.js.md)
- [`obligationFrom`](#s-obligationFrom) · function — used by [js/npc/speech.js](../npc/speech.js.md)
- [`chainsOf`](#s-chainsOf) · function — **no importer in scanned roots**
- [`CHANNELS`](#s-CHANNELS) · const — **no importer in scanned roots**
- [`topicStats`](#s-topicStats) · function — **no importer in scanned roots**
- [`lastSentence`](#s-lastSentence) · function — **no importer in scanned roots**
- [`runTopicSelfTest`](#s-runTopicSelfTest) · function — **no importer in scanned roots**
- [`sampleTraffic`](#s-sampleTraffic) · function — **no importer in scanned roots**
- [`INTENTS`](#s-INTENTS) · const — **no importer in scanned roots**
- [`parsePlayerLine`](#s-parsePlayerLine) · function — **no importer in scanned roots**
- [`talkToNpc`](#s-talkToNpc) · function — **no importer in scanned roots**
- [`PLAYER_PROMPTS`](#s-PLAYER_PROMPTS) · const — used by [js/npc/speech.js](../npc/speech.js.md)
- [`TARGET`](#s-TARGET) · const — **no importer in scanned roots**
- [`currentTarget`](#s-currentTarget) · function — **no importer in scanned roots**
- [`fitTarget`](#s-fitTarget) · function — **no importer in scanned roots**
- [`parseTranscript`](#s-parseTranscript) · function — **no importer in scanned roots**
- [`profileOf`](#s-profileOf) · function — **no importer in scanned roots**
- [`compareProfiles`](#s-compareProfiles) · function — **no importer in scanned roots**
- [`CALIBRATION`](#s-CALIBRATION) · const — used by [js/npc/speech.js](../npc/speech.js.md), test/speech.test.mjs
- [`calibrate`](#s-calibrate) · function — **no importer in scanned roots**
- [`resetCalibration`](#s-resetCalibration) · function — **no importer in scanned roots**
- [`makeCrew`](#s-makeCrew) · function — **no importer in scanned roots**
- [`createMemoryStore`](#s-createMemoryStore) · function — **no importer in scanned roots**
- [`createWorld`](#s-createWorld) · function — used by [js/npc/speech.js](../npc/speech.js.md)
- [`runSpeechSelfTest`](#s-runSpeechSelfTest) · function — **no importer in scanned roots**

## Effects

- **global.write** — `window.npcSpeech` (@file:6707)

## Symbols

### <a id="s-mulberry32"></a>`mulberry32(seed)`

function · L1–9

- called by: [`makeRng`](#s-makeRng) · [`seedWorld`](#s-seedWorld) · [`world`](#s-world)

<!-- note:mulberry32 -->
═════════════════════════════════════════════════════════════════════
 1. SEEDED RNG
═════════════════════════════════════════════════════════════════════

Inlined from core/rng.js so this file stands alone. Identical implementation and
identical stream derivation, so a build that imports the shared core and a build that
uses this copy produce the same radio chatter from the same seed. If core/rng.js ever
changes, this is the copy that has to change with it — the alternative was an import,
and an import is the one thing a single-file drop-in cannot have.
<!-- /note -->

### <a id="s-hashString"></a>`hashString(str)`

function · L11–18

- called by: [`stream`](#s-stream)

<!-- note:hashString -->
FNV-1a. Stable across runs and platforms — do not swap for anything hash-random.
<!-- /note -->

### <a id="s-seedValue"></a>`seedValue`

const · L20–20

<!-- note:seedValue -->
<!-- /note -->

### <a id="s-world"></a>`world`

const · L21–21

- calls: [`mulberry32`](#s-mulberry32)
- called by: [`wnext`](#s-wnext) · [`wrand`](#s-wrand)

<!-- note:world -->
<!-- /note -->

### <a id="s-streams"></a>`streams`

const · L22–22

<!-- note:streams -->
<!-- /note -->

### <a id="s-seedWorld"></a>`seedWorld(seed)`

function · L24–28

- calls: [`mulberry32`](#s-mulberry32)
- called by: [`createWorld`](#s-createWorld)

<!-- note:seedWorld -->
- L27 · `streams.clear();` — streams are re-derived lazily from the new seed
<!-- /note -->

### <a id="s-wnext"></a>`wnext()`

function · L30–30 · **never referenced**

- calls: [`world`](#s-world)

<!-- note:wnext -->
<!-- /note -->

### <a id="s-wrand"></a>`wrand(a, b)`

function · L31–31 · **never referenced**

- calls: [`world`](#s-world)

<!-- note:wrand -->
<!-- /note -->

### <a id="s-worldSeed"></a>`worldSeed()`

function · L33–33 · **never referenced**

<!-- note:worldSeed -->
The seed the world was generated from.
<!-- /note -->

### <a id="s-makeRng"></a>`makeRng(seed)`

function · L35–44

- calls: [`mulberry32`](#s-mulberry32)
- called by: [`stream`](#s-stream)

<!-- note:makeRng -->
Independent generator for anything else that needs reproducibility.
<!-- /note -->

#### <a id="s-makeRng-range"></a>`makeRng.range(a, b)`

prop · L39–39

<!-- note:makeRng.range -->
<!-- /note -->

#### <a id="s-makeRng-int"></a>`makeRng.int(a, b)`

prop · L40–40

<!-- note:makeRng.int -->
<!-- /note -->

#### <a id="s-makeRng-pick"></a>`makeRng.pick(arr)`

prop · L41–41

- called by: [`codaFor`](#s-codaFor)

<!-- note:makeRng.pick -->
<!-- /note -->

#### <a id="s-makeRng-chance"></a>`makeRng.chance(p)`

prop · L42–42

<!-- note:makeRng.chance -->
<!-- /note -->

### <a id="s-stream"></a>`stream(name)`

function · L46–53

- calls: [`hashString`](#s-hashString) · [`makeRng`](#s-makeRng)
- called by: [`chooseFrom`](#s-chooseFrom) · [`chooseWeighted`](#s-chooseWeighted) · [`contract`](#s-contract) · [`createWorld`](#s-createWorld) · [`fuzz`](#s-fuzz) · [`makeCrew`](#s-makeCrew) · [`realise>roll`](#s-realise-roll) · [`resetStream`](#s-resetStream)

<!-- note:stream -->
Named deterministic stream off the world seed. Same seed + same name = same sequence,
whatever else the build generates. Cached, so repeated calls continue one sequence
rather than restarting it.
<!-- /note -->

### <a id="s-resetStream"></a>`resetStream(name)`

function · L55–58 · **never referenced**

- calls: [`stream`](#s-stream)

<!-- note:resetStream -->
Rewind one stream to its start — for reproducing a specific generation pass.
<!-- /note -->

### <a id="s-streamNames"></a>`streamNames()`

function · L60–60 · **never referenced**

<!-- note:streamNames -->
<!-- /note -->

### <a id="s-IRREGULAR_PLURAL"></a>`IRREGULAR_PLURAL`

const · L62–78

<!-- note:IRREGULAR_PLURAL -->
Living Galaxy — how an NPC says a thing, as opposed to what it says.

Until v1.01.91 every line in `data/npc-topics.js` was a template literal with the names
substituted in. Nine topics, one or two phrasings each, so a pilot listening to the
trade band for ten minutes heard the same eighteen sentences on a loop. Adding a
twentieth hand-written line would have bought about forty more seconds before the loop
closed again — the problem is not the number of lines, it is that a fixed line has no
axis to vary along.

So this file does not hold sentences. It holds the pieces a sentence is made of, the
rules for putting them together so the result is grammatical, and a chooser that
remembers what it has already said. A topic declares *meaning* — an act, and the facts
it is about — and the realiser builds an utterance from that. Two ships trading the same
tip twice produce two different sentences carrying the same information, because the
wording is generated and the content is not.

── the five layers ──────────────────────────────────────────────────

  morphology   inflection: plurals, tense, aspect, mood, degree, number-words
  lexicon      synonym sets, with the features the syntax needs to use them correctly
  syntax       frames — functions of a semantic record that realise into clauses
  discourse    register, vocatives, hedges, markers, sign-offs, anti-repetition memory
  proofing     a validator that reads the finished string and repairs what it can

The proofing layer is new in v1.02.10 and is the reason this file grew. Generation that
is *almost* grammatical is worse than a template, because a template is at least wrong
in the same way every time and can be fixed by hand. A generator needs to be able to
look at its own output and reject "a hour", "there is 3 contacts", "Copy. are you
holding?" and "Watch yourself — watch yourself." before they reach the comms log. Every
rule in PROOF_RULES below is there because the log produced the bad string at least once.

Everything is seeded through `core/rng.js`, so the same world produces the same radio
chatter and a replay does not diverge on dialogue.

═════════════════════════════════════════════════════════════════════
 1. MORPHOLOGY
═════════════════════════════════════════════════════════════════════

Rule-based rather than a table of every form, with the irregulars that actually occur in
working radio traffic listed out. English regular inflection covers most of what a ship
says; the exceptions are few enough to enumerate and cheap enough to look up.
<!-- /note -->

### <a id="s-INVARIANT_PLURAL"></a>`INVARIANT_PLURAL`

const · L80–84

<!-- note:INVARIANT_PLURAL -->
Nouns that do not inflect for number at all. Radio is full of them — "two craft",
"three series", "aircraft inbound" — and pluralising them is the sort of error that
makes generated speech read as machine output rather than as a tired pilot.
<!-- /note -->

### <a id="s-MASS_NOUNS"></a>`MASS_NOUNS`

const · L86–92

<!-- note:MASS_NOUNS -->
Mass nouns. These take no plural and no numeral, and the realiser routes them through a
partitive ("a load of ore") rather than a count when a quantity is wanted.
<!-- /note -->

### <a id="s-plural"></a>`plural(noun, n=)`

function · **exported** · L94–113

- calls: [`matchCase`](#s-matchCase) · [`plural`](#s-plural)
- called by: [`CASES`](#s-CASES) ×7 · [`np`](#s-np) · [`plural`](#s-plural) · [`quantity`](#s-quantity) ×3

<!-- note:plural -->
Regular English pluralisation, with the sibilant, -y, -f/-fe, -o and invariant rules
applied properly. `n` is the count the noun is agreeing with: 1 leaves it alone.

- L101 · `if (/-/.test(noun)) {` — Compounds pluralise their head, which for hyphenated forms is usually the first word.
<!-- /note -->

### <a id="s-matchCase"></a>`matchCase(src, out)`

function · L115–119

- called by: [`PROOF_RULES.fix~7`](#s-PROOF_RULES-fix-7) · [`plural`](#s-plural)

<!-- note:matchCase -->
Keep the casing of the source word when swapping in an irregular form.
<!-- /note -->

### <a id="s-isMass"></a>`isMass(noun)`

function · **exported** · L121–123

- called by: [`described`](#s-described) · [`np`](#s-np) · [`quantity`](#s-quantity)

<!-- note:isMass -->
Is this noun countable in the sense the realiser cares about?
<!-- /note -->

### <a id="s-IRREGULAR_VERB"></a>`IRREGULAR_VERB`

const · L125–246

<!-- note:IRREGULAR_VERB -->
<!-- /note -->

### <a id="s-PHRASAL"></a>`PHRASAL`

const · L248–248

<!-- note:PHRASAL -->
Multi-word verbs. The particle has to survive inflection — "puts across", "picked up",
"standing down" — which a single-token conjugator gets wrong by inflecting the particle.
<!-- /note -->

### <a id="s-gerund"></a>`gerund(v)`

function · **exported** · L250–258

- calls: [`gerund`](#s-gerund)
- called by: [`CASES`](#s-CASES) ×3 · [`FRAMES.build~15`](#s-FRAMES-build-15) · [`conjugate`](#s-conjugate) · [`gerund`](#s-gerund)

<!-- note:gerund -->
-ing with the consonant-doubling and silent-e rules that make it read as English.
<!-- /note -->

### <a id="s-regularPast"></a>`regularPast(v)`

function · **exported** · L260–265

- called by: [`participle`](#s-participle) · [`pastOf`](#s-pastOf)

<!-- note:regularPast -->
<!-- /note -->

### <a id="s-third"></a>`third(v)`

function · **exported** · L267–274

- calls: [`third`](#s-third)
- called by: [`conjugate`](#s-conjugate) · [`third`](#s-third)

<!-- note:third -->
<!-- /note -->

### <a id="s-participle"></a>`participle(v)`

function · **exported** · L276–280

- calls: [`participle`](#s-participle) · [`regularPast`](#s-regularPast)
- called by: [`conjugate`](#s-conjugate) ×3 · [`participle`](#s-participle)

<!-- note:participle -->
<!-- /note -->

### <a id="s-pastOf"></a>`pastOf(v)`

function · **exported** · L282–286

- calls: [`pastOf`](#s-pastOf) · [`regularPast`](#s-regularPast)
- called by: [`conjugate`](#s-conjugate) · [`pastOf`](#s-pastOf)

<!-- note:pastOf -->
<!-- /note -->

### <a id="s-PRE_INFLECTED"></a>`PRE_INFLECTED`

const · L288–288

<!-- note:PRE_INFLECTED -->
Some "verbs" in the lexicon are really predicates that already carry their own copula or
modal — "could use", "am short". Conjugating them again produces "could uses". The
realiser detects them and passes them through, rewriting only the copula if it must.
<!-- /note -->

### <a id="s-MODALS"></a>`MODALS`

const · L290–290

<!-- note:MODALS -->
<!-- /note -->

### <a id="s-copula"></a>`copula(agr=, tense=)`

function · **exported** · L292–298

- called by: [`FRAMES.build~83`](#s-FRAMES-build-83) · [`conjugate`](#s-conjugate) ×5 · [`prefixedForm`](#s-prefixedForm)

<!-- note:copula -->
The copula, agreeing properly. Split out because five different code paths need it and
every one of them used to reimplement it slightly differently.
<!-- /note -->

### <a id="s-conjugate"></a>`conjugate(v, agr=)`

function · **exported** · L300–379

- calls: [`conjugate>finite`](#s-conjugate-finite) ×3 · [`copula`](#s-copula) ×5 · [`gerund`](#s-gerund) · [`participle`](#s-participle) ×3 · [`pastOf`](#s-pastOf) · [`prefixedForm`](#s-prefixedForm) · [`third`](#s-third)
- called by: [`CASES`](#s-CASES) ×12 · [`FRAMES.build`](#s-FRAMES-build) · [`FRAMES.build~10`](#s-FRAMES-build-10) · [`FRAMES.build~13`](#s-FRAMES-build-13) · [`FRAMES.build~2`](#s-FRAMES-build-2) · [`FRAMES.build~5`](#s-FRAMES-build-5) · [`FRAMES.build~6`](#s-FRAMES-build-6) · [`FRAMES.build~7`](#s-FRAMES-build-7) · [`FRAMES.build~71`](#s-FRAMES-build-71) · [`FRAMES.build~8`](#s-FRAMES-build-8) · [`FRAMES.build~9`](#s-FRAMES-build-9)

<!-- note:conjugate -->
Conjugate a verb for a semantic record.

@param {string} v      base form, possibly phrasal ("stand down")
@param {object} agr
  person   1 | 2 | 3
  number   'sg' | 'pl'
  tense    'pres' | 'past' | 'fut'
  aspect   null | 'prog' | 'perf' | 'perfprog'
  modal    'can' | 'could' | 'will' | 'should' | 'must' | ...
  negated  true to insert not / -n't at the right depth
  voice    'active' | 'passive'

- L309 · `const chain = [];` — Build the auxiliary chain outside-in: modal > perfect > progressive > passive > verb.
- L368 · `if (negated) {` — Simple tenses. Negation needs do-support, which is the one place English makes the
  generator work for a living: "does not read", not "reads not".
<!-- /note -->

#### <a id="s-conjugate-finite"></a>`conjugate>finite(word, pastWord)`

function · L312–315

- called by: [`conjugate`](#s-conjugate) ×3

<!-- note:conjugate>finite -->
<!-- /note -->

### <a id="s-prefixedForm"></a>`prefixedForm(v, agr=)`

function · L381–392

- calls: [`copula`](#s-copula)
- called by: [`conjugate`](#s-conjugate)

<!-- note:prefixedForm -->
Verbs that already carry a modal or copula. "could use" stays "could use" in every
person; "am short" has to re-agree, because a topic writes it for a first-person speaker
and the realiser may put it in a third-person frame.
<!-- /note -->

### <a id="s-infinitive"></a>`infinitive(v)`

function · **exported** · L394–398

<!-- note:infinitive -->
The infinitive with "to", handling the pre-inflected forms sensibly.
<!-- /note -->

### <a id="s-imperative"></a>`imperative(v, negated=)`

function · **exported** · L400–404

- called by: [`FRAMES.build~20`](#s-FRAMES-build-20) · [`FRAMES.build~30`](#s-FRAMES-build-30) · [`FRAMES.build~33`](#s-FRAMES-build-33) · [`FRAMES.build~34`](#s-FRAMES-build-34) · [`FRAMES.build~36`](#s-FRAMES-build-36) · [`FRAMES.build~37`](#s-FRAMES-build-37) · [`FRAMES.build~38`](#s-FRAMES-build-38) · [`FRAMES.build~42`](#s-FRAMES-build-42) · [`FRAMES.build~46`](#s-FRAMES-build-46) · [`FRAMES.build~74`](#s-FRAMES-build-74)

<!-- note:imperative -->
Imperative — the base form, which is also where negation is simplest.
<!-- /note -->

### <a id="s-IRREGULAR_DEGREE"></a>`IRREGULAR_DEGREE`

const · L406–410

<!-- note:IRREGULAR_DEGREE -->
── degree ───────────────────────────────────────────────────────────
<!-- /note -->

### <a id="s-SYLLABLES"></a>`SYLLABLES(w)`

function · L412–412

- called by: [`comparative`](#s-comparative) · [`superlative`](#s-superlative)

<!-- note:SYLLABLES -->
<!-- /note -->

### <a id="s-comparative"></a>`comparative(adj)`

function · **exported** · L414–423

- calls: [`SYLLABLES`](#s-SYLLABLES)
- called by: [`CASES`](#s-CASES) ×3 · [`FRAMES.build~12`](#s-FRAMES-build-12) · [`FRAMES.build~58`](#s-FRAMES-build-58)

<!-- note:comparative -->
Comparative, choosing between -er and "more" the way a speaker does: by length.
<!-- /note -->

### <a id="s-superlative"></a>`superlative(adj)`

function · **exported** · L425–433

- calls: [`SYLLABLES`](#s-SYLLABLES)
- called by: [`CASES`](#s-CASES)

<!-- note:superlative -->
<!-- /note -->

### <a id="s-adverbise"></a>`adverbise(adj)`

function · **exported** · L435–443

- called by: [`CASES`](#s-CASES)

<!-- note:adverbise -->
Adverb from adjective, for the frames that want a manner slot.
<!-- /note -->

### <a id="s-ONES"></a>`ONES`

const · L445–447

<!-- note:ONES -->
── number words ─────────────────────────────────────────────────────

Radio says "a couple of contacts" far more often than "2 contacts", and the digits are
what make generated speech read as a HUD readout rather than a voice. The realiser keeps
the exact figure when precision matters (a price, a bearing, a hold count in a deal) and
spells or vagues it when it does not.
<!-- /note -->

### <a id="s-TENS"></a>`TENS`

const · L448–448

<!-- note:TENS -->
<!-- /note -->

### <a id="s-numberWord"></a>`numberWord(n)`

function · **exported** · L450–461

- calls: [`numberWord`](#s-numberWord)
- called by: [`@file`](#) · [`CASES`](#s-CASES) · [`np`](#s-np) · [`numberWord`](#s-numberWord) · [`vagueCount`](#s-vagueCount) ×2

<!-- note:numberWord -->
Spell a whole number out to ninety-nine; above that, digits read better anyway.
<!-- /note -->

### <a id="s-ORDINALS"></a>`ORDINALS`

const · L463–464

<!-- note:ORDINALS -->
<!-- /note -->

### <a id="s-ordinal"></a>`ordinal(n)`

function · **exported** · L466–477

- called by: [`CASES`](#s-CASES) ×2

<!-- note:ordinal -->
<!-- /note -->

### <a id="s-vagueCount"></a>`vagueCount(n, opts=)`

function · **exported** · L479–496

- calls: [`chooseFrom`](#s-chooseFrom) ×8 · [`numberWord`](#s-numberWord) ×2
- called by: [`priceFact`](#s-priceFact) · [`quantity`](#s-quantity) ×3 · [`realise.num`](#s-realise-num) · [`threatFact`](#s-threatFact)

<!-- note:vagueCount -->
A vague quantity. Speech is imprecise on purpose: a pilot who says "eleven thousand two
hundred and forty units" is reading a screen aloud, and a pilot who says "the better part
of twelve thousand" is talking.
<!-- /note -->

### <a id="s-article"></a>`article(word)`

function · **exported** · L498–512

- called by: [`CASES`](#s-CASES) ×5 · [`PROOF_RULES.fix~7`](#s-PROOF_RULES-fix-7) · [`np`](#s-np) ×2

<!-- note:article -->
a / an, decided on the *sound* rather than the letter.

"an hour" and "a union" are the cases a letter test gets wrong, and a radio line that
says "a hour" is the kind of thing that reads as broken rather than as terse. Acronyms
spoken letter-by-letter take the article their letter *name* wants: "an S-class", "an
MHD tap", "a UN charter".

- L503 · `if (/^(8|11|18)/.test(w)) return 'an';` — Numerals take the article of the word they are read as: "an 8", "a 1", "an 11".
- L506 · `if (raw.length <= 5 && raw === raw.toUpperCase() && /^[A-Z]+$/.test(raw)) {` — An all-caps token is read out as letters unless it is a pronounceable acronym.
<!-- /note -->

### <a id="s-PRONOUN"></a>`PRONOUN`

const · L514–523

<!-- note:PRONOUN -->
── pronouns ─────────────────────────────────────────────────────────

A frame that wants to refer back to something it already mentioned needs the right case,
and the difference between "gave it to I" and "gave it to me" is the difference between
generated speech and speech.
<!-- /note -->

### <a id="s-pronoun"></a>`pronoun(agr=, kase=)`

function · **exported** · L525–531

- called by: [`CASES`](#s-CASES)

<!-- note:pronoun -->
Pronoun lookup by agreement record and case.
<!-- /note -->

### <a id="s-agreeWith"></a>`agreeWith(subject, fallback=)`

function · **exported** · L533–550

- called by: [`CASES`](#s-CASES) ×2 · [`FRAMES.build~15`](#s-FRAMES-build-15) ×2 · [`FRAMES.build~19`](#s-FRAMES-build-19) · [`FRAMES.build~3`](#s-FRAMES-build-3) · [`FRAMES.build~83`](#s-FRAMES-build-83) · [`checkMove`](#s-checkMove)

<!-- note:agreeWith -->
Agreement record for an already-realised subject string. Used by the frames.

- L541 · `if (/^(\d+|two|three|four|five|six|seven|eight|nine|ten|both|several|a few|a couple|a pair` — "two contacts", "a pair of returns", "three of them" — leading numeral wins.
- L545 · `const head = s.split(/\s+/).pop();` — A bare plural head noun. Crude, but wrong far less often than assuming singular.
<!-- /note -->

### <a id="s-np"></a>`np(noun, opts=)`

function · **exported** · L552–588

- calls: [`article`](#s-article) ×2 · [`attributive`](#s-attributive) · [`isMass`](#s-isMass) · [`numberWord`](#s-numberWord) · [`plural`](#s-plural)
- called by: [`CASES`](#s-CASES) ×4 · [`described`](#s-described) · [`quantity`](#s-quantity)

<!-- note:np -->
Determiner + noun, agreeing in number, with the count/mass distinction respected.

det: 'indef' | 'def' | 'none' | 'poss' | 'dem' | 'some' | 'any' | 'no' | 'partitive'

- L559 · `` const withAdj = adj && attributive(adj) ? `${adj} ${head}` : head; `` — A predicative-only adjective is dropped rather than jammed in front of the head; the
  noun on its own is always grammatical, which the alternative is not.
<!-- /note -->

### <a id="s-possessive"></a>`possessive(name)`

function · **exported** · L590–594

- called by: [`CASES`](#s-CASES) ×2

<!-- note:possessive -->
Possessive of a proper name — "Bulk Hauler 02's board", "Atlas's berth".
<!-- /note -->

### <a id="s-listOf"></a>`listOf(items, opts=)`

function · **exported** · L596–607

- called by: [`CASES`](#s-CASES)

<!-- note:listOf -->
Join a list the way a person reads one out. Two items take "and"; more take commas and
a final "and"; a long list gets truncated, because nobody reads nine things over comms.
<!-- /note -->

### <a id="s-LEX"></a>`LEX`

const · **exported** · L609–790

<!-- note:LEX -->
═════════════════════════════════════════════════════════════════════
 2. THE LEXICON
═════════════════════════════════════════════════════════════════════

Synonym sets, not single words. Every entry is a set the realiser draws from, which is
where most of the variety comes from: the same frame with a different verb choice reads
as a different sentence, and no sentence has to be written twice.

The sets are keyed by *sense*, not by word, so a topic asks for `verb.move` and never has
to know which of four words it will get. That indirection is what lets the vocabulary
grow without touching a single topic.

- L736 · `marker: {` — Discourse markers, split by register. A terse ship does not say "as it happens".
  A *marker* leads a clause and the clause continues in lower case: "Look, the face reads
  well." `LEX.ack` below is the other thing — whole sentences, used as the body of an
  acknowledgement, not as furniture in front of one. Terse register had `Right.` and
  `Copy.` filed here as markers, which is what produced "Copy. are you holding?" on the
  radio: a full stop followed by a lowercased word, on every terse line, for four slices.
- L763 · `hail: {` — Openers used when a channel is being opened cold, before anything has been said.
- L772 · `signoff: {` — Sign-offs, used to close an exchange rather than to answer anything in it.
- L781 · `interject: {` — Interjections. Used sparingly — one per exchange at most, enforced downstream.
<!-- /note -->

### <a id="s-NEXT"></a>`NEXT`

const · L792–792

<!-- note:NEXT -->
Contractions, applied late so the frames can stay written in full forms and stay legible.
Register decides how often they fire — a coalition officer speaks in full forms on an
open band, and a belt miner does not.
The auxiliary contractions carry a lookahead: a clause-final auxiliary cannot contract,
because the contracted form is not a word anybody can end a sentence on. "Right you are."
contracted to "Right you're." — a real transmission, and the reason the lookahead exists.
Matched case-insensitively and re-cased on the way out: the same clause can appear
sentence-initial ("You are burning hot") or mid-clause ("Look, you are burning hot"), and
a case-sensitive table silently contracts only half of them.
<!-- /note -->

### <a id="s-recase"></a>`recase(src, out)`

function · L793–793

- called by: [`CONTRACTIONS`](#s-CONTRACTIONS) · [`aux`](#s-aux) · [`perf`](#s-perf)

<!-- note:recase -->
<!-- /note -->

### <a id="s-PERF_NEXT"></a>`PERF_NEXT`

const · L794–794

<!-- note:PERF_NEXT -->
The perfect auxiliary: only ahead of a participle, "got", or "been".
Participles only. The first version accepted any word ending in a two-letter cluster that
a participle might end in, which made "most" look like one: "I've most of a hold."
<!-- /note -->

### <a id="s-perf"></a>`perf(phrase, short)`

function · L795–798

- calls: [`recase`](#s-recase)
- called by: [`CONTRACTIONS`](#s-CONTRACTIONS) ×3

<!-- note:perf -->
<!-- /note -->

### <a id="s-aux"></a>`aux(phrase, short)`

function · L799–802

- calls: [`recase`](#s-recase)
- called by: [`CONTRACTIONS`](#s-CONTRACTIONS) ×15

<!-- note:aux -->
<!-- /note -->

### <a id="s-CONTRACTIONS"></a>`CONTRACTIONS`

const · L804–819

- calls: [`aux`](#s-aux) ×15 · [`perf`](#s-perf) ×3 · [`recase`](#s-recase)

<!-- note:CONTRACTIONS -->
- L808 · `perf('I have', "I've"), perf('you have', "you've"), perf('we have', "we've"),` — "have" only contracts as an auxiliary. "I've a full hold" is not what a working ship
  says — "I have a full hold" is — so the perfect-aspect lookahead is required here.
- L817 · `` [new RegExp(String.raw`\bI would\b(?!\s+(?:if|so|too|rather|not\b))` + NEXT, 'gi'), mm =>  `` — "I would" only contracts ahead of a verb. In "I would if I could" the auxiliary stands
  in for an elided one, and "I'd if I could" is not English.
<!-- /note -->

### <a id="s-contract"></a>`contract(text, rate=, rng=)`

function · **exported** · L821–831

- calls: [`stream`](#s-stream)
- called by: [`decorate`](#s-decorate)

<!-- note:contract -->
Apply contractions at a probability set by register.
<!-- /note -->

### <a id="s-REGISTERS"></a>`REGISTERS`

const · **exported** · L833–833

<!-- note:REGISTERS -->
═════════════════════════════════════════════════════════════════════
 3. REGISTER
═════════════════════════════════════════════════════════════════════

Which register a ship speaks in is a property of the ship, not of the line, so the same
character sounds like itself across every topic it ever raises. Derived from role and
faction rather than stored, so it needs no migration and cannot drift out of step with
the unit it describes.

v1.02.10 adds three registers and, more usefully, a *profile* per register: the numeric
dials the realiser reads. Two ships in the same register still differ, because the
profile is perturbed by a per-ship hash — a stable idiolect that costs no save space.
<!-- /note -->

### <a id="s-REGISTER_PROFILE"></a>`REGISTER_PROFILE`

const · **exported** · L835–843

<!-- note:REGISTER_PROFILE -->
<!-- /note -->

### <a id="s-registerOf"></a>`registerOf(u, mood=)`

function · **exported** · L845–862

- called by: [`chatter`](../npc/speech.js.md#s-chatter) _js/npc/speech.js_ · [`commit`](../npc/speech.js.md#s-commit) _js/npc/speech.js_ · [`talkTo`](../npc/speech.js.md#s-talkTo) _js/npc/speech.js_ ×2 · [`@file`](#) ×96 · [`TOPICS`](#s-TOPICS) ×30 · [`createWorld>commit`](#s-createWorld-commit) · [`createWorld>talk`](#s-createWorld-talk) · [`speak`](#s-speak) · [`talkToNpc`](#s-talkToNpc) · [`utterFromRecord`](#s-utterFromRecord)

<!-- note:registerOf -->
Register for a unit, read off what the unit already is.

Order matters: the most specific condition wins, and stress is checked before role
because a holed miner does not sound like a working one. The `mood` override lets
systems/npc-comms.js push a character into a register for one exchange — a taunt from a
normally formal patrol, for instance — without mutating the unit.
<!-- /note -->

### <a id="s-profileFor"></a>`profileFor(u, reg, ctx=)`

function · **exported** · L864–887

- calls: [`clamp01`](#s-clamp01) ×8 · [`profileFor>jitter`](#s-profileFor-jitter) ×5
- called by: [`speak`](#s-speak) · [`talkToNpc`](#s-talkToNpc) · [`utterFromRecord`](#s-utterFromRecord)

<!-- note:profileFor -->
The dials for a speaker: the register profile, nudged by a stable per-ship hash so two
warm miners are not identical, and by the situation the line is spoken in.

@param {object} u      the speaker unit
@param {string} reg    resolved register
@param {object} ctx    { urgent, hp, familiarity, hostile }

- L868 · `let h = 0x811c9dc5;` — FNV-ish, inline so this file does not need to import the hash from core.
- L878 · `if (ctx.urgent) {` — Urgency strips furniture. Nobody says "for what it is worth" while being shot at.
- L883 · `if (ctx.familiarity > 3) { p.vocative *= 0.6; p.maxWords = Math.round(p.maxWords * 0.9); }` — Familiarity shortens. People who talk daily stop introducing themselves.
- L885 · `if (ctx.hostile) { p.hedge *= 0.3; p.vocative = clamp01(p.vocative + 0.15); }` — Hostility hardens: fewer hedges, more vocatives (you name someone to needle them).
<!-- /note -->

#### <a id="s-profileFor-jitter"></a>`profileFor>jitter(k)`

function · L870–870

- called by: [`profileFor`](#s-profileFor) ×5

<!-- note:profileFor>jitter -->
<!-- /note -->

### <a id="s-clamp01"></a>`clamp01(x)`

function · L889–889

- called by: [`profileFor`](#s-profileFor) ×8

<!-- note:clamp01 -->
<!-- /note -->

### <a id="s-recent"></a>`recent`

const · L891–891

<!-- note:recent -->
═════════════════════════════════════════════════════════════════════
 4. CHOOSING WITHOUT REPEATING
═════════════════════════════════════════════════════════════════════

The anti-repetition memory. Keyed by a caller-supplied bucket — usually speaker + topic —
it refuses to hand back anything used recently in that bucket until the pool would be
exhausted, at which point it forgets the oldest and carries on. That is what stops the
radio being a tape loop without needing an enormous corpus: n frames give n distinct
utterances in a row rather than a coin flip that lands on the same one twice.

v1.02.10 adds a global recent-string window on top. Bucket memory stops a *speaker*
repeating itself; it does nothing about six different ships reaching for the same good
phrase inside a minute, which is what the comms log actually looked like. The window is
small, cheap, and checked at the end of `realise` rather than inside the chooser, because
the thing that repeats audibly is the finished sentence and not the word it was built on.
<!-- /note -->

### <a id="s-recentLines"></a>`recentLines`

const · L892–892

<!-- note:recentLines -->
<!-- /note -->

### <a id="s-RECENT_LINE_CAP"></a>`RECENT_LINE_CAP`

const · L893–893

<!-- note:RECENT_LINE_CAP -->
<!-- /note -->

### <a id="s-chooseFrom"></a>`chooseFrom(list, bucket=, rng=)`

function · **exported** · L895–907

- calls: [`keyOf`](#s-keyOf) ×2 · [`stream`](#s-stream)
- called by: [`@file`](#) ×171 · [`CODA`](#s-CODA) ×10 · [`INTENTS.build~12`](#s-INTENTS-build-12) · [`INTENTS.build~13`](#s-INTENTS-build-13) ×2 · [`INTENTS.build~14`](#s-INTENTS-build-14) ×2 · [`INTENTS.build~15`](#s-INTENTS-build-15) · [`INTENTS.build~16`](#s-INTENTS-build-16) · [`INTENTS.build~17`](#s-INTENTS-build-17) ×3 · [`INTENTS.build~18`](#s-INTENTS-build-18) ×2 · [`INTENTS.build~19`](#s-INTENTS-build-19) · [`INTENTS.build~20`](#s-INTENTS-build-20) · [`INTENTS.build~3`](#s-INTENTS-build-3) · [`INTENTS.build~4`](#s-INTENTS-build-4) · [`INTENTS.build~5`](#s-INTENTS-build-5) ×2 · [`INTENTS.build~6`](#s-INTENTS-build-6) · [`INTENTS.build~7`](#s-INTENTS-build-7) · [`INTENTS.build~9`](#s-INTENTS-build-9) · [`TOPICS`](#s-TOPICS) ×31 · [`bearing`](#s-bearing) · [`combine`](#s-combine) · [`confused`](#s-confused) ×2 · [`damageFact`](#s-damageFact) ×4 · [`described`](#s-described) ×2 · [`holdFact`](#s-holdFact) ×4 · [`needFact`](#s-needFact) ×6 · [`place`](#s-place) · [`priceFact`](#s-priceFact) ×2 · [`quantity`](#s-quantity) · [`realise`](#s-realise) · [`realise.lex`](#s-realise-lex) · [`realise.pick`](#s-realise-pick) · [`reasonFact`](#s-reasonFact) · [`threatFact`](#s-threatFact) ×2 · [`timeRef`](#s-timeRef) ×2 · [`vagueCount`](#s-vagueCount) ×8

<!-- note:chooseFrom -->
- L904 · `while (next.length > Math.max(1, list.length - 1)) next.shift();` — Remember at most one short of the pool, so there is always something fresh to pick.
<!-- /note -->

### <a id="s-chooseWeighted"></a>`chooseWeighted(items, weightOf, bucket=, rng=)`

function · **exported** · L909–926

- calls: [`keyOf`](#s-keyOf) ×2 · [`stream`](#s-stream)
- called by: [`realise`](#s-realise)

<!-- note:chooseWeighted -->
Weighted variant. Some frames are better than others for a given record — a frame that
uses every fact present beats one that throws half of them away — and the realiser wants
to prefer without ever becoming deterministic.

- L914 · `if (seen.includes(keyOf(it))) w *= 0.12;` — strongly discouraged, not forbidden
<!-- /note -->

### <a id="s-keyOf"></a>`keyOf(x)`

function · L928–928

- called by: [`chooseFrom`](#s-chooseFrom) ×2 · [`chooseWeighted`](#s-chooseWeighted) ×2

<!-- note:keyOf -->
<!-- /note -->

### <a id="s-saidRecently"></a>`saidRecently(line)`

function · **exported** · L930–933

- calls: [`normaliseForCompare`](#s-normaliseForCompare)
- called by: [`realise`](#s-realise)

<!-- note:saidRecently -->
Has this exact sentence gone out over comms in the last two dozen transmissions?
<!-- /note -->

### <a id="s-rememberLine"></a>`rememberLine(line)`

function · L935–938

- calls: [`normaliseForCompare`](#s-normaliseForCompare)
- called by: [`realise`](#s-realise)

<!-- note:rememberLine -->
<!-- /note -->

### <a id="s-normaliseForCompare"></a>`normaliseForCompare(s)`

function · L940–940

- called by: [`rememberLine`](#s-rememberLine) · [`saidRecently`](#s-saidRecently)

<!-- note:normaliseForCompare -->
<!-- /note -->

### <a id="s-resetGrammarMemory"></a>`resetGrammarMemory()`

function · **exported** · L942–945

- called by: [`restoreGrammarMemory`](#s-restoreGrammarMemory) · [`runGrammarSelfTest`](#s-runGrammarSelfTest) ×2

<!-- note:resetGrammarMemory -->
Wipe the repetition memory. Called on a new game; also useful in tests.
<!-- /note -->

### <a id="s-serialiseGrammarMemory"></a>`serialiseGrammarMemory(maxBuckets=)`

function · **exported** · L947–955

<!-- note:serialiseGrammarMemory -->
Serialise the repetition memory so a save reloads into the same conversational state.
Bounded on purpose: the point is to avoid an immediate repeat after a load, not to
reconstruct the whole history of the galaxy's small talk.
<!-- /note -->

### <a id="s-restoreGrammarMemory"></a>`restoreGrammarMemory(blob)`

function · **exported** · L957–964

- calls: [`resetGrammarMemory`](#s-resetGrammarMemory)

<!-- note:restoreGrammarMemory -->
<!-- /note -->

### <a id="s-grammarStats"></a>`grammarStats()`

function · **exported** · L966–974

- called by: [`createWorld.stats`](#s-createWorld-stats) · [`runGrammarSelfTest`](#s-runGrammarSelfTest)

<!-- note:grammarStats -->
Diagnostics for the debug overlay: how much variety is the radio actually producing?
<!-- /note -->

### <a id="s-DEICTIC"></a>`DEICTIC`

const · L976–976

<!-- note:DEICTIC -->
═════════════════════════════════════════════════════════════════════
 5. SYNTAX FRAMES
═════════════════════════════════════════════════════════════════════

A frame is a function of the semantic record, not a string with holes in it. That is the
difference that matters: a frame can decide *not* to mention a fact it was not given,
reorder to put the important thing first, or drop the subject entirely the way real radio
does — none of which a template can do.

Fields:
  id        stable, used by the repetition memory and by tests
  acts      the speech acts this frame can express
  needs     slots that must be present, or the frame is not a candidate at all
  wants     slots that are not required but that this frame uses well; each one present
            raises the frame's score, so a record carrying a place adverbial prefers a
            frame that says where over one that throws it away
  avoid     slots this frame cannot express; each one present lowers the score, because
            choosing it silently discards information the topic wanted said
  regs      registers this frame suits; a match is a bonus, not a filter
  weight    baseline preference
  build     (m, g) -> string

`g` is the realiser's helper bag: cap, pick, lex, num, rng.

Words that carry no content of their own. A frame that would repeat one back has nothing
to say and should stand aside for one that does.
<!-- /note -->

### <a id="s-INTRANSITIVE_OK"></a>`INTRANSITIVE_OK`

const · L978–978

<!-- note:INTRANSITIVE_OK -->
Verbs that make a complete sentence with no object. "I will hold" is a transmission;
"I will mark" is half of one, and the log was full of the second kind.
<!-- /note -->

### <a id="s-MOVES"></a>`MOVES`

const · **exported** · L980–981

<!-- note:MOVES -->
═════════════════════════════════════════════════════════════════════
 5b. MOVES
═════════════════════════════════════════════════════════════════════

A frame knows what shape a clause has. It does not know what the clause *does*, and that
is where the nonsense was coming from: "Where are you seeing word on the far leg?" is a
grammatical question wrapped around something that was never a place, and "Nothing moving
out here?" is a report that arrived wearing a question mark. Both pass every rule in the
proofing layer, because both are well-formed English.

So there is a layer above the frames now. Every utterance is one of eight moves, every
frame declares which move it makes, and MOVE_RULES check the finished string against the
move it claims to be. A question that does not ask, a denial that denies nothing, an
accusation that names nobody — each is a fatal fault, and the realiser rebuilds from a
different frame rather than transmitting it.

  statement    asserts a fact about the world           "The face reads clean ore."
  question     asks for one                             "Are you holding at the ring?"
  comment      evaluates rather than reports            "That is the job."
  accusation   asserts a fault, and names who           "You cut inside my marker."
  denial       rejects an assertion or a request        "I did not touch your claim."
  directive    tells somebody to do something           "Stand down."
  commitment   binds the speaker to something           "I will be alongside within the hour."
  expressive   thanks, apology, greeting, farewell      "That one is on me."

The distinction that earns its keep is comment vs statement. A statement carries a fact
the listener could act on and is worth filing; a comment carries the speaker's view of
one. Conflating them is why the log used to answer a hazard warning with a fact nobody
had established.
<!-- /note -->

### <a id="s-ACT_MOVE"></a>`ACT_MOVE`

const · **exported** · L983–994

<!-- note:ACT_MOVE -->
The move an act makes, unless the record or the frame says otherwise.
<!-- /note -->

### <a id="s-NEGATION"></a>`NEGATION`

const · L996–996

<!-- note:NEGATION -->
<!-- /note -->

### <a id="s-SECOND_PERSON"></a>`SECOND_PERSON`

const · L997–997

<!-- note:SECOND_PERSON -->
<!-- /note -->

### <a id="s-WH"></a>`WH`

const · L998–998

<!-- note:WH -->
<!-- /note -->

### <a id="s-AUX_FRONT"></a>`AUX_FRONT`

const · L999–999

<!-- note:AUX_FRONT -->
<!-- /note -->

### <a id="s-IMPERATIVE_LEAD"></a>`IMPERATIVE_LEAD`

const · L1000–1000

<!-- note:IMPERATIVE_LEAD -->
<!-- /note -->

### <a id="s-COMMIT_LEAD"></a>`COMMIT_LEAD`

const · L1001–1001

<!-- note:COMMIT_LEAD -->
<!-- /note -->

### <a id="s-EXPRESSIVE_LEAD"></a>`EXPRESSIVE_LEAD`

const · L1002–1002 · **never referenced**

<!-- note:EXPRESSIVE_LEAD -->
<!-- /note -->

### <a id="s-checkMove"></a>`checkMove(text, move, msg=)`

function · **exported** · L1004–1076

- calls: [`agreeWith`](#s-agreeWith) · [`checkMove`](#s-checkMove)
- called by: [`checkExchanges`](#s-checkExchanges) · [`checkMove`](#s-checkMove) · [`checkWorld`](#s-checkWorld) · [`realise`](#s-realise) ×2

<!-- note:checkMove -->
Check a realised string against the move it claims to make.

Each rule is the minimum test that separates a move from the moves nearest it, and every
one of them fired on a real transmission before it was written down. Returns null when
the line is a legitimate instance of its move, or a short reason when it is not.

- L1007 · `const parts = whole.split(/(?<=[.!?])\s+/).filter(Boolean);` — A transmission may carry several sentences — a report and the order that follows from
  it, an acceptance and a sign-off. It performs the move if *any* of its sentences does;
  requiring the whole string to satisfy the move failed every line that ended "Safe burns."
- L1024 · `if (!WH.test(first) && !AUX_FRONT.test(first) && !/[—-]\s*[a-z ]+\?$/.test(s) &&` — A question mark is not a question. It needs a wh-word, a fronted auxiliary, or a
  tag — otherwise it is a statement with the wrong punctuation on the end.
- L1028 · `if (/^where\b/i.test(first) && msg.q && msg.q !== 'wh-where') return 'wh-word does not mat` — A wh-question needs a complement its wh-word can actually take: "Where are you
  seeing word on the far leg?" asked for the location of a phrase.
- L1045 · `if (!SECOND_PERSON.test(s) && !(msg.target && s.includes(msg.target))) return 'accuses nob` — An accusation has to land on somebody. One that names nobody is just a complaint.
- L1049 · `if (!NEGATION.test(s) && !/\b(pass|wrong|hardly|I would if I could)\b/i.test(s)) {` — Denial is the move most often realised as something else, because half the refusal
  frames read as statements. It must actually reject something.
<!-- /note -->

### <a id="s-FRAMES"></a>`FRAMES`

const · **exported** · L1078–1554

<!-- note:FRAMES -->
- L1079 · `{` — ── informing ──────────────────────────────────────────────────────
- L1079 · `{` — ── asking ─────────────────────────────────────────────────────────
- L1197 · `needs: ['verb', 'object'], weight: 0.55,` — The object is required: "When do you hold?" is not a question anybody asks, while
  "When do you lift that load?" is.
- L1201 · `id: 'ask-embedded', q: 'embedded', acts: ['ask'], move: 'question',` — Clause-shaped objects. "Who else is working that face" is a question already, and the
  tag frame turned it into "Who else is working that face — anything on it?" Embedding
  is what English does with a question inside a question.
- L1208 · `{` — ── offering and requesting ────────────────────────────────────────
- L1208 · `{` — ── ordering ───────────────────────────────────────────────────────
- L1208 · `{` — ── warning ────────────────────────────────────────────────────────
- L1208 · `{` — ── acknowledging ──────────────────────────────────────────────────
- L1350 · `needs: ['object', 'doubtable'], weight: 0.6, regs: ['wry', 'gruff', 'terse'],` — `doubtable` is required, and it is the topic that says so. Scepticism about a claim
  somebody else made is in character; the same tail on your own commitment produced
  "I will send the next one your way, though I will believe it when I see it."
- L1355 · `{` — ── accepting and refusing ─────────────────────────────────────────
- L1355 · `{` — ── negotiating ────────────────────────────────────────────────────
- L1355 · `{` — ── boasting and complaining ───────────────────────────────────────
- L1355 · `{` — ── greeting and parting ───────────────────────────────────────────
- L1355 · `{` — ── speculating ────────────────────────────────────────────────────
- L1355 · `{` — ── apologising and thanking ───────────────────────────────────────
- L1355 · `{` — ── accusing, denying, admitting ───────────────────────────────────
  
  The four moves that make an argument an argument. They were missing entirely, which is
  why a claim dispute used to be two warnings in a row: the table had no way to say "you
  did this" or "no I did not", so it reached for the nearest shape that existed and the
  exchange read as two ships talking past each other.
- L1491 · `needs: [], wants: ['verb'], avoid: ['object'], weight: 0.55,` — Weighted down: when the topic supplied the denial's own words, throwing them away for
  "I did not do it." loses the whole case the speaker was making.
- L1496 · `{` — ── reporting a state ──────────────────────────────────────────────
<!-- /note -->

#### <a id="s-FRAMES-build"></a>`FRAMES.build(m, g)`

prop · L1082–1082

- calls: [`conjugate`](#s-conjugate)

<!-- note:FRAMES.build -->
<!-- /note -->

#### <a id="s-FRAMES-build-2"></a>`FRAMES.build~2(m, g)`

prop · L1087–1087

- calls: [`conjugate`](#s-conjugate)

<!-- note:FRAMES.build~2 -->
<!-- /note -->

#### <a id="s-FRAMES-build-3"></a>`FRAMES.build~3(m, g)`

prop · L1092–1092

- calls: [`agreeWith`](#s-agreeWith)

<!-- note:FRAMES.build~3 -->
<!-- /note -->

#### <a id="s-FRAMES-build-4"></a>`FRAMES.build~4(m, g)`

prop · L1098–1098

<!-- note:FRAMES.build~4 -->
Radio drops the copula constantly. "Two contacts, bearing on the lane."
<!-- /note -->

#### <a id="s-FRAMES-build-5"></a>`FRAMES.build~5(m, g)`

prop · L1103–1103

- calls: [`conjugate`](#s-conjugate)

<!-- note:FRAMES.build~5 -->
<!-- /note -->

#### <a id="s-FRAMES-build-6"></a>`FRAMES.build~6(m, g)`

prop · L1108–1108

- calls: [`conjugate`](#s-conjugate)

<!-- note:FRAMES.build~6 -->
<!-- /note -->

#### <a id="s-FRAMES-build-7"></a>`FRAMES.build~7(m, g)`

prop · L1113–1115

- calls: [`conjugate`](#s-conjugate)

<!-- note:FRAMES.build~7 -->
"What I have is a full hold." Puts the new information at the end, where speech
naturally puts it.
Personal subjects only. "What I have is a full hold" is speech; "What the lit up run
reads is eight contacts" is a sentence diagram.
Personal subject *and* a verb of having or perceiving. The cleft foregrounds a thing
possessed or noticed; on an action verb it produces "What I mark is Scrapper Vig on my
board", which is a sentence nobody has ever said out loud.
<!-- /note -->

#### <a id="s-FRAMES-build-8"></a>`FRAMES.build~8(m, g)`

prop · L1120–1120

- calls: [`conjugate`](#s-conjugate)

<!-- note:FRAMES.build~8 -->
<!-- /note -->

#### <a id="s-FRAMES-build-9"></a>`FRAMES.build~9(m, g)`

prop · L1125–1125

- calls: [`conjugate`](#s-conjugate)

<!-- note:FRAMES.build~9 -->
<!-- /note -->

#### <a id="s-FRAMES-build-10"></a>`FRAMES.build~10(m, g)`

prop · L1130–1130

- calls: [`conjugate`](#s-conjugate)

<!-- note:FRAMES.build~10 -->
<!-- /note -->

#### <a id="s-FRAMES-build-11"></a>`FRAMES.build~11(m, g)`

prop · L1135–1135

<!-- note:FRAMES.build~11 -->
<!-- /note -->

#### <a id="s-FRAMES-build-12"></a>`FRAMES.build~12(m, g)`

prop · L1140–1140

- calls: [`comparative`](#s-comparative)

<!-- note:FRAMES.build~12 -->
<!-- /note -->

#### <a id="s-FRAMES-build-13"></a>`FRAMES.build~13(m, g)`

prop · L1145–1145

- calls: [`conjugate`](#s-conjugate)

<!-- note:FRAMES.build~13 -->
<!-- /note -->

#### <a id="s-FRAMES-build-14"></a>`FRAMES.build~14(m, g)`

prop · L1150–1150

<!-- note:FRAMES.build~14 -->
<!-- /note -->

#### <a id="s-FRAMES-build-15"></a>`FRAMES.build~15(m, g)`

prop · L1156–1168

- calls: [`agreeWith`](#s-agreeWith) ×2 · [`gerund`](#s-gerund)

<!-- note:FRAMES.build~15 -->
- L1160 · `if (m.verb === 'have') {` — "have" and "be" have no progressive worth speaking: "Are you having proof of that?"
  is what the gerund path produced. Both take do-support or the copula instead.
<!-- /note -->

#### <a id="s-FRAMES-build-16"></a>`FRAMES.build~16(m, g)`

prop · L1173–1177

<!-- note:FRAMES.build~16 -->
<!-- /note -->

#### <a id="s-FRAMES-build-17"></a>`FRAMES.build~17(m, g)`

prop · L1182–1182

<!-- note:FRAMES.build~17 -->
<!-- /note -->

#### <a id="s-FRAMES-build-18"></a>`FRAMES.build~18(m, g)`

prop · L1187–1187

<!-- note:FRAMES.build~18 -->
<!-- /note -->

#### <a id="s-FRAMES-build-19"></a>`FRAMES.build~19(m, g)`

prop · L1192–1193

- calls: [`agreeWith`](#s-agreeWith)

<!-- note:FRAMES.build~19 -->
Only counts what is countable and plural. "How many the width of it are we talking
about?" went out on the trade band because this frame took any object at all.
<!-- /note -->

#### <a id="s-FRAMES-build-20"></a>`FRAMES.build~20(m, g)`

prop · L1198–1198

- calls: [`imperative`](#s-imperative)

<!-- note:FRAMES.build~20 -->
<!-- /note -->

#### <a id="s-FRAMES-build-21"></a>`FRAMES.build~21(m, g)`

prop · L1203–1206

- calls: [`looksClausal`](#s-looksClausal)

<!-- note:FRAMES.build~21 -->
<!-- /note -->

#### <a id="s-FRAMES-build-22"></a>`FRAMES.build~22(m, g)`

prop · L1211–1211

<!-- note:FRAMES.build~22 -->
<!-- /note -->

#### <a id="s-FRAMES-build-23"></a>`FRAMES.build~23(m, g)`

prop · L1216–1216

<!-- note:FRAMES.build~23 -->
<!-- /note -->

#### <a id="s-FRAMES-build-24"></a>`FRAMES.build~24(m, g)`

prop · L1221–1221

<!-- note:FRAMES.build~24 -->
<!-- /note -->

#### <a id="s-FRAMES-build-25"></a>`FRAMES.build~25(m, g)`

prop · L1226–1226

<!-- note:FRAMES.build~25 -->
<!-- /note -->

#### <a id="s-FRAMES-build-26"></a>`FRAMES.build~26(m, g)`

prop · L1232–1232

<!-- note:FRAMES.build~26 -->
<!-- /note -->

#### <a id="s-FRAMES-build-27"></a>`FRAMES.build~27(m, g)`

prop · L1237–1237

<!-- note:FRAMES.build~27 -->
<!-- /note -->

#### <a id="s-FRAMES-build-28"></a>`FRAMES.build~28(m, g)`

prop · L1242–1242

<!-- note:FRAMES.build~28 -->
<!-- /note -->

#### <a id="s-FRAMES-build-29"></a>`FRAMES.build~29(m, g)`

prop · L1247–1247

<!-- note:FRAMES.build~29 -->
<!-- /note -->

#### <a id="s-FRAMES-build-30"></a>`FRAMES.build~30(m, g)`

prop · L1252–1252

- calls: [`imperative`](#s-imperative)

<!-- note:FRAMES.build~30 -->
<!-- /note -->

#### <a id="s-FRAMES-build-31"></a>`FRAMES.build~31(m, g)`

prop · L1257–1257

<!-- note:FRAMES.build~31 -->
<!-- /note -->

#### <a id="s-FRAMES-build-32"></a>`FRAMES.build~32(m, g)`

prop · L1262–1262

<!-- note:FRAMES.build~32 -->
<!-- /note -->

#### <a id="s-FRAMES-build-33"></a>`FRAMES.build~33(m, g)`

prop · L1267–1267

- calls: [`imperative`](#s-imperative)

<!-- note:FRAMES.build~33 -->
<!-- /note -->

#### <a id="s-FRAMES-build-34"></a>`FRAMES.build~34(m, g)`

prop · L1272–1272

- calls: [`imperative`](#s-imperative)

<!-- note:FRAMES.build~34 -->
<!-- /note -->

#### <a id="s-FRAMES-build-35"></a>`FRAMES.build~35(m, g)`

prop · L1277–1278

<!-- note:FRAMES.build~35 -->
"Somebody with guns. Now, if you can." — the tail is doing all the work and the request
itself is a fragment. It needs a clause long enough to carry the urgency.
<!-- /note -->

#### <a id="s-FRAMES-build-36"></a>`FRAMES.build~36(m, g)`

prop · L1284–1284

- calls: [`imperative`](#s-imperative)

<!-- note:FRAMES.build~36 -->
<!-- /note -->

#### <a id="s-FRAMES-build-37"></a>`FRAMES.build~37(m, g)`

prop · L1289–1289

- calls: [`imperative`](#s-imperative)

<!-- note:FRAMES.build~37 -->
<!-- /note -->

#### <a id="s-FRAMES-build-38"></a>`FRAMES.build~38(m, g)`

prop · L1294–1294

- calls: [`imperative`](#s-imperative)

<!-- note:FRAMES.build~38 -->
<!-- /note -->

#### <a id="s-FRAMES-build-39"></a>`FRAMES.build~39(m, g)`

prop · L1300–1300

<!-- note:FRAMES.build~39 -->
<!-- /note -->

#### <a id="s-FRAMES-build-40"></a>`FRAMES.build~40(m, g)`

prop · L1305–1305

<!-- note:FRAMES.build~40 -->
<!-- /note -->

#### <a id="s-FRAMES-build-41"></a>`FRAMES.build~41(m, g)`

prop · L1310–1310

<!-- note:FRAMES.build~41 -->
<!-- /note -->

#### <a id="s-FRAMES-build-42"></a>`FRAMES.build~42(m, g)`

prop · L1315–1315

- calls: [`imperative`](#s-imperative)

<!-- note:FRAMES.build~42 -->
<!-- /note -->

#### <a id="s-FRAMES-build-43"></a>`FRAMES.build~43(m, g)`

prop · L1320–1320

<!-- note:FRAMES.build~43 -->
<!-- /note -->

#### <a id="s-FRAMES-build-44"></a>`FRAMES.build~44(m, g)`

prop · L1326–1326

<!-- note:FRAMES.build~44 -->
<!-- /note -->

#### <a id="s-FRAMES-build-45"></a>`FRAMES.build~45(m, g)`

prop · L1331–1332

<!-- note:FRAMES.build~45 -->
An echo repeats what was heard, so there has to be something worth repeating. Echoing
a bare deictic produces "Copy that. That." — the frame declines and the realiser picks
another rather than shipping it.
<!-- /note -->

#### <a id="s-FRAMES-build-46"></a>`FRAMES.build~46(m, g)`

prop · L1337–1341

- calls: [`imperative`](#s-imperative)

<!-- note:FRAMES.build~46 -->
The object slot is gone. Whatever a topic puts in it is written to complement the
topic's own verb, not "I will take a look", and the join produced things like
"I will take a look noted against the survey."
...and a transitive verb with nothing to act on leaves the sentence hanging: "Noted.
I'll mark." Only verbs that stand alone are allowed to fill the slot; everything else
falls back to the phrase that is always complete.
<!-- /note -->

#### <a id="s-FRAMES-build-47"></a>`FRAMES.build~47(m, g)`

prop · L1346–1346

<!-- note:FRAMES.build~47 -->
<!-- /note -->

#### <a id="s-FRAMES-build-48"></a>`FRAMES.build~48(m, g)`

prop · L1351–1352

<!-- note:FRAMES.build~48 -->
<!-- /note -->

#### <a id="s-FRAMES-build-49"></a>`FRAMES.build~49(m, g)`

prop · L1358–1358

<!-- note:FRAMES.build~49 -->
<!-- /note -->

#### <a id="s-FRAMES-build-50"></a>`FRAMES.build~50(m, g)`

prop · L1363–1363

<!-- note:FRAMES.build~50 -->
<!-- /note -->

#### <a id="s-FRAMES-build-51"></a>`FRAMES.build~51(m, g)`

prop · L1368–1368

<!-- note:FRAMES.build~51 -->
<!-- /note -->

#### <a id="s-FRAMES-build-52"></a>`FRAMES.build~52(m, g)`

prop · L1373–1373

<!-- note:FRAMES.build~52 -->
<!-- /note -->

#### <a id="s-FRAMES-build-53"></a>`FRAMES.build~53(m, g)`

prop · L1378–1378

<!-- note:FRAMES.build~53 -->
<!-- /note -->

#### <a id="s-FRAMES-build-54"></a>`FRAMES.build~54(m, g)`

prop · L1384–1384

<!-- note:FRAMES.build~54 -->
<!-- /note -->

#### <a id="s-FRAMES-build-55"></a>`FRAMES.build~55(m, g)`

prop · L1389–1389

<!-- note:FRAMES.build~55 -->
<!-- /note -->

#### <a id="s-FRAMES-build-56"></a>`FRAMES.build~56(m, g)`

prop · L1394–1394

<!-- note:FRAMES.build~56 -->
A walk-away has to name a number to walk away from. "What it is worth or I take it to
the next ring" is a threat with nothing behind it.
<!-- /note -->

#### <a id="s-FRAMES-build-57"></a>`FRAMES.build~57(m, g)`

prop · L1400–1400

<!-- note:FRAMES.build~57 -->
<!-- /note -->

#### <a id="s-FRAMES-build-58"></a>`FRAMES.build~58(m, g)`

prop · L1405–1405

- calls: [`comparative`](#s-comparative)

<!-- note:FRAMES.build~58 -->
<!-- /note -->

#### <a id="s-FRAMES-build-59"></a>`FRAMES.build~59(m, g)`

prop · L1410–1410

<!-- note:FRAMES.build~59 -->
<!-- /note -->

#### <a id="s-FRAMES-build-60"></a>`FRAMES.build~60(m, g)`

prop · L1415–1415

<!-- note:FRAMES.build~60 -->
<!-- /note -->

#### <a id="s-FRAMES-build-61"></a>`FRAMES.build~61(m, g)`

prop · L1420–1420

<!-- note:FRAMES.build~61 -->
<!-- /note -->

#### <a id="s-FRAMES-build-62"></a>`FRAMES.build~62(m, g)`

prop · L1426–1427

<!-- note:FRAMES.build~62 -->
<!-- /note -->

#### <a id="s-FRAMES-build-63"></a>`FRAMES.build~63(m, g)`

prop · L1432–1432

<!-- note:FRAMES.build~63 -->
<!-- /note -->

#### <a id="s-FRAMES-build-64"></a>`FRAMES.build~64(m, g)`

prop · L1437–1438

<!-- note:FRAMES.build~64 -->
<!-- /note -->

#### <a id="s-FRAMES-build-65"></a>`FRAMES.build~65(m, g)`

prop · L1444–1444

<!-- note:FRAMES.build~65 -->
<!-- /note -->

#### <a id="s-FRAMES-build-66"></a>`FRAMES.build~66(m, g)`

prop · L1449–1449

<!-- note:FRAMES.build~66 -->
<!-- /note -->

#### <a id="s-FRAMES-build-67"></a>`FRAMES.build~67(m, g)`

prop · L1454–1454

<!-- note:FRAMES.build~67 -->
<!-- /note -->

#### <a id="s-FRAMES-build-68"></a>`FRAMES.build~68(m, g)`

prop · L1460–1460

<!-- note:FRAMES.build~68 -->
<!-- /note -->

#### <a id="s-FRAMES-build-69"></a>`FRAMES.build~69(m, g)`

prop · L1465–1465

<!-- note:FRAMES.build~69 -->
<!-- /note -->

#### <a id="s-FRAMES-build-70"></a>`FRAMES.build~70(m, g)`

prop · L1471–1471

<!-- note:FRAMES.build~70 -->
<!-- /note -->

#### <a id="s-FRAMES-build-71"></a>`FRAMES.build~71(m, g)`

prop · L1476–1476

- calls: [`conjugate`](#s-conjugate)

<!-- note:FRAMES.build~71 -->
<!-- /note -->

#### <a id="s-FRAMES-build-72"></a>`FRAMES.build~72(m, g)`

prop · L1481–1481

<!-- note:FRAMES.build~72 -->
<!-- /note -->

#### <a id="s-FRAMES-build-73"></a>`FRAMES.build~73(m, g)`

prop · L1486–1487

<!-- note:FRAMES.build~73 -->
Only over an agentive clause about the listener: "Either the manifest and the mass do
not agree, or somebody flying your registry did" accuses a discrepancy of being a ship.
<!-- /note -->

#### <a id="s-FRAMES-build-74"></a>`FRAMES.build~74(m, g)`

prop · L1492–1494

- calls: [`imperative`](#s-imperative)

<!-- note:FRAMES.build~74 -->
<!-- /note -->

#### <a id="s-FRAMES-build-75"></a>`FRAMES.build~75(m, g)`

prop · L1499–1499

<!-- note:FRAMES.build~75 -->
<!-- /note -->

#### <a id="s-FRAMES-build-76"></a>`FRAMES.build~76(m, g)`

prop · L1504–1504

<!-- note:FRAMES.build~76 -->
<!-- /note -->

#### <a id="s-FRAMES-build-77"></a>`FRAMES.build~77(m, g)`

prop · L1509–1510

<!-- note:FRAMES.build~77 -->
<!-- /note -->

#### <a id="s-FRAMES-build-78"></a>`FRAMES.build~78(m, g)`

prop · L1515–1515

<!-- note:FRAMES.build~78 -->
<!-- /note -->

#### <a id="s-FRAMES-build-79"></a>`FRAMES.build~79(m, g)`

prop · L1520–1520

<!-- note:FRAMES.build~79 -->
<!-- /note -->

#### <a id="s-FRAMES-build-80"></a>`FRAMES.build~80(m, g)`

prop · L1525–1526

<!-- note:FRAMES.build~80 -->
A record carrying `negated` is a no, whatever else is in it. Without this guard the
yes-frame answered "It is. Nothing on my sweep."
<!-- /note -->

#### <a id="s-FRAMES-build-81"></a>`FRAMES.build~81(m, g)`

prop · L1531–1531

<!-- note:FRAMES.build~81 -->
<!-- /note -->

#### <a id="s-FRAMES-build-82"></a>`FRAMES.build~82(m, g)`

prop · L1536–1536

<!-- note:FRAMES.build~82 -->
<!-- /note -->

#### <a id="s-FRAMES-build-83"></a>`FRAMES.build~83(m, g)`

prop · L1542–1542

- calls: [`agreeWith`](#s-agreeWith) · [`copula`](#s-copula)

<!-- note:FRAMES.build~83 -->
<!-- /note -->

#### <a id="s-FRAMES-build-84"></a>`FRAMES.build~84(m, g)`

prop · L1547–1547

<!-- note:FRAMES.build~84 -->
<!-- /note -->

#### <a id="s-FRAMES-build-85"></a>`FRAMES.build~85(m, g)`

prop · L1552–1552

<!-- note:FRAMES.build~85 -->
<!-- /note -->

### <a id="s-FRAME_MOVE"></a>`FRAME_MOVE`

const · L1556–1564

<!-- note:FRAME_MOVE -->
The move a frame makes. Usually the act decides, but a handful of frames do something
other than what their act suggests — a warning built as an imperative is a directive
whatever the topic called it, and a refusal that offers a counter-price is a commitment
with a denial attached rather than a denial.
<!-- /note -->

### <a id="s-moveOf"></a>`moveOf(msg, frame=)`

function · **exported** · L1566–1570

- called by: [`realise`](#s-realise) ×3 · [`realise>usable`](#s-realise-usable) · [`utterFromRecord`](#s-utterFromRecord)

<!-- note:moveOf -->
The move a record makes: the record's own claim, else the frame's, else the act's.
<!-- /note -->

### <a id="s-FRAMES_BY_ACT"></a>`FRAMES_BY_ACT`

const · L1572–1579

<!-- note:FRAMES_BY_ACT -->
Frames indexed by act, built once. Selection is hot and runs on every line spoken.
<!-- /note -->

### <a id="s-framesFor"></a>`framesFor(act)`

function · **exported** · L1581–1581

- called by: [`realise`](#s-realise) ×4

<!-- note:framesFor -->
<!-- /note -->

### <a id="s-PROOF_RULES"></a>`PROOF_RULES`

const · **exported** · L1583–1688

<!-- note:PROOF_RULES -->
═════════════════════════════════════════════════════════════════════
 6. PROOFING
═════════════════════════════════════════════════════════════════════

The layer that reads the finished string and fixes it. Every rule here exists because the
comms log produced the bad output at least once; the comment on each says what.

A rule is { id, test, fix, fatal }. `fix` repairs in place where a repair is unambiguous.
`fatal` marks a fault no rewrite can save — the realiser throws that candidate away and
builds the line again from a different frame, which is cheaper and much better than
shipping a broken sentence.
<!-- /note -->

#### <a id="s-PROOF_RULES-test"></a>`PROOF_RULES.test(s)`

prop · L1586–1586

<!-- note:PROOF_RULES.test -->
<!-- /note -->

#### <a id="s-PROOF_RULES-fix"></a>`PROOF_RULES.fix(s)`

prop · L1587–1587

<!-- note:PROOF_RULES.fix -->
<!-- /note -->

#### <a id="s-PROOF_RULES-test-2"></a>`PROOF_RULES.test~2(s)`

prop · L1591–1591

<!-- note:PROOF_RULES.test~2 -->
"the lane ." — produced whenever an empty optional slot left its leading space behind.
<!-- /note -->

#### <a id="s-PROOF_RULES-fix-2"></a>`PROOF_RULES.fix~2(s)`

prop · L1592–1592

<!-- note:PROOF_RULES.fix~2 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-test-3"></a>`PROOF_RULES.test~3(s)`

prop · L1596–1596

<!-- note:PROOF_RULES.test~3 -->
"Copy that.." and "anything on it?." — a frame that ends in punctuation, plus the
full stop the realiser used to append unconditionally.
<!-- /note -->

#### <a id="s-PROOF_RULES-fix-3"></a>`PROOF_RULES.fix~3(s)`

prop · L1597–1597

<!-- note:PROOF_RULES.fix~3 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-test-4"></a>`PROOF_RULES.test~4(s)`

prop · L1601–1601

<!-- note:PROOF_RULES.test~4 -->
"Is the face reading well?." — question frame plus appended stop.
<!-- /note -->

#### <a id="s-PROOF_RULES-fix-4"></a>`PROOF_RULES.fix~4(s)`

prop · L1602–1602

<!-- note:PROOF_RULES.fix~4 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-test-5"></a>`PROOF_RULES.test~5(s)`

prop · L1606–1606

<!-- note:PROOF_RULES.test~5 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-fix-5"></a>`PROOF_RULES.fix~5(s)`

prop · L1607–1607

<!-- note:PROOF_RULES.fix~5 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-test-6"></a>`PROOF_RULES.test~6(s)`

prop · L1611–1611

<!-- note:PROOF_RULES.test~6 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-fix-6"></a>`PROOF_RULES.fix~6(s)`

prop · L1612–1612

<!-- note:PROOF_RULES.fix~6 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-test-7"></a>`PROOF_RULES.test~7(s)`

prop · L1616–1616

<!-- note:PROOF_RULES.test~7 -->
"a hour", "an ship" — an article chosen before a synonym swap changed the noun.
<!-- /note -->

#### <a id="s-PROOF_RULES-fix-7"></a>`PROOF_RULES.fix~7(s)`

prop · L1617–1617

- calls: [`article`](#s-article) · [`matchCase`](#s-matchCase)

<!-- note:PROOF_RULES.fix~7 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-test-8"></a>`PROOF_RULES.test~8(s)`

prop · L1621–1621

<!-- note:PROOF_RULES.test~8 -->
"There is 3 contacts" — existential frame with a plural object.
<!-- /note -->

#### <a id="s-PROOF_RULES-fix-8"></a>`PROOF_RULES.fix~8(s)`

prop · L1622–1622

<!-- note:PROOF_RULES.fix~8 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-test-9"></a>`PROOF_RULES.test~9(s)`

prop · L1626–1626

<!-- note:PROOF_RULES.test~9 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-fix-9"></a>`PROOF_RULES.fix~9(s)`

prop · L1627–1627

<!-- note:PROOF_RULES.fix~9 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-test-10"></a>`PROOF_RULES.test~10(s)`

prop · L1631–1631

<!-- note:PROOF_RULES.test~10 -->
"the the lane", "on on my board" — two slots that both supplied a preposition.
<!-- /note -->

#### <a id="s-PROOF_RULES-fix-10"></a>`PROOF_RULES.fix~10(s)`

prop · L1632–1632

<!-- note:PROOF_RULES.fix~10 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-test-11"></a>`PROOF_RULES.test~11(s)`

prop · L1636–1639

<!-- note:PROOF_RULES.test~11 -->
"Keep your eyes open. Keep your eyes open." — an opener and a reply reaching for the
same closing phrase in the same exchange. Fatal: repairing it would change meaning.
<!-- /note -->

#### <a id="s-PROOF_RULES-test-12"></a>`PROOF_RULES.test~12(s)`

prop · L1644–1644

<!-- note:PROOF_RULES.test~12 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-test-13"></a>`PROOF_RULES.test~13(s)`

prop · L1649–1650

<!-- note:PROOF_RULES.test~13 -->
"so" and "if" end perfectly good sentences when they are the tail of a fixed phrase —
"If you say so." was being thrown away as a dangling conjunction.
<!-- /note -->

#### <a id="s-PROOF_RULES-test-14"></a>`PROOF_RULES.test~14(s)`

prop · L1655–1655

<!-- note:PROOF_RULES.test~14 -->
"I have the ." — a frame that built an NP from a slot that turned out empty.
A determiner is only orphaned if it was left dangling after something: "I have the ."
A sentence that *is* the word — "No." — is a complete denial, and the first version of
this rule rejected it, which killed every fallback denial the realiser produced.
<!-- /note -->

#### <a id="s-PROOF_RULES-test-15"></a>`PROOF_RULES.test~15(s)`

prop · L1660–1660

<!-- note:PROOF_RULES.test~15 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-fix-11"></a>`PROOF_RULES.fix~11(s)`

prop · L1661–1661

<!-- note:PROOF_RULES.fix~11 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-test-16"></a>`PROOF_RULES.test~16(s)`

prop · L1665–1665

<!-- note:PROOF_RULES.test~16 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-fix-12"></a>`PROOF_RULES.fix~12(s)`

prop · L1666–1666

<!-- note:PROOF_RULES.fix~12 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-test-17"></a>`PROOF_RULES.test~17(s)`

prop · L1670–1670

<!-- note:PROOF_RULES.test~17 -->
"{b}, this is {a}." with no substitution done. Always a bug upstream; fatal so the
test suite catches it rather than the player.
<!-- /note -->

#### <a id="s-PROOF_RULES-test-18"></a>`PROOF_RULES.test~18(s)`

prop · L1675–1675

<!-- note:PROOF_RULES.test~18 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-test-19"></a>`PROOF_RULES.test~19(s)`

prop · L1680–1680

<!-- note:PROOF_RULES.test~19 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-fix-13"></a>`PROOF_RULES.fix~13(s)`

prop · L1681–1681

<!-- note:PROOF_RULES.fix~13 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-test-20"></a>`PROOF_RULES.test~20(s)`

prop · L1685–1685

<!-- note:PROOF_RULES.test~20 -->
<!-- /note -->

#### <a id="s-PROOF_RULES-fix-14"></a>`PROOF_RULES.fix~14(s)`

prop · L1686–1686

<!-- note:PROOF_RULES.fix~14 -->
<!-- /note -->

### <a id="s-proof"></a>`proof(text)`

function · **exported** · L1690–1706

- called by: [`CASES`](#s-CASES) ×13 · [`checkExchanges`](#s-checkExchanges) · [`checkPlayerTalk`](#s-checkPlayerTalk) · [`checkWorld`](#s-checkWorld) · [`fuzz`](#s-fuzz) · [`isWellFormed`](#s-isWellFormed) · [`realise`](#s-realise) · [`realiseAll`](#s-realiseAll)

<!-- note:proof -->
Run the proofing pass.

@returns {{ text: string, ok: boolean, applied: string[], fatal: string|null }}

- L1693 · `for (let pass = 0; pass < 2; pass++) {` — Two passes: a fix can expose a fault the first pass could not see — removing a doubled
  word can leave a doubled space, and repairing an article can leave a lowercase initial.
- L1702 · `} catch (e) {` — a rule that throws is a bug, not a reason to drop the line
<!-- /note -->

### <a id="s-isWellFormed"></a>`isWellFormed(text)`

function · **exported** · L1708–1708

- calls: [`proof`](#s-proof)
- called by: [`realise`](#s-realise)

<!-- note:isWellFormed -->
Convenience for tests and for the debug overlay.
<!-- /note -->

### <a id="s-cap"></a>`cap(s)`

function · L1710–1710

- called by: [`decorate`](#s-decorate) ×4

<!-- note:cap -->
═════════════════════════════════════════════════════════════════════
 7. REALISATION
═════════════════════════════════════════════════════════════════════
<!-- /note -->

### <a id="s-fixI"></a>`fixI(s)`

function · L1712–1712

- called by: [`decorate`](#s-decorate)

<!-- note:fixI -->
"I" is the one English pronoun that is always capitalised wherever it lands.
<!-- /note -->

### <a id="s-IMPERATIVE_START"></a>`IMPERATIVE_START`

const · L1714–1714

<!-- note:IMPERATIVE_START -->
Does this string behave like a clause rather than a noun phrase?

A topic may legitimately hand the realiser either: "a full hold" is a thing, and "settle
it at the ring and we are square" is a whole sentence somebody said. Frames that build an
NP slot around the object cannot take the second — the trade band carried "There are
settle it at the ring and we're square" and "I need buy me something at the next berth"
before this check existed. Finite verbs, imperative openers and internal conjunctions are
the three tells that survive contact with real content.
<!-- /note -->

### <a id="s-FINITE_VERB"></a>`FINITE_VERB`

const · L1715–1715

<!-- note:FINITE_VERB -->
Past-tense finite forms count too. Without them "the coffee ran out somewhere around the
second leg" looked like a noun phrase, and the existential frame wrapped it: "There's the
coffee ran out somewhere around the second leg."
<!-- /note -->

### <a id="s-looksClausal"></a>`looksClausal(x)`

function · **exported** · L1717–1726

- called by: [`FRAMES.build~21`](#s-FRAMES-build-21) · [`realise`](#s-realise)

<!-- note:looksClausal -->
- L1721 · `if (/^(i|we|you|they|he|she|it|nobody|somebody|everybody|there|that was|this was)\b/i.test` — A slot that opens with a subject pronoun is a clause whatever verb follows it. Without
  this, "I stopped filing on that a long time back" read as a noun phrase and came back
  as "I will take a look I stopped filing on that a long time back."
<!-- /note -->

### <a id="s-SLOTS"></a>`SLOTS`

const · L1728–1730

<!-- note:SLOTS -->
Slots a frame could conceivably use. Anything outside this list is metadata.
<!-- /note -->

### <a id="s-scoreFrame"></a>`scoreFrame(f, m, lengthPref=)`

function · L1732–1752

- called by: [`realise`](#s-realise) ×2

<!-- note:scoreFrame -->
Score a frame against a record. Higher is better.

The scoring is what turns a pile of frames into a chooser with taste: a frame that uses
the facts present is preferred, a frame that would throw a fact away is penalised, and a
frame that suits the speaker's register gets a nudge. Randomness still decides between
near-equals, so the same record twice does not always take the same shape.

- L1738 · `const uses = new Set([...(f.needs || []), ...wants]);` — A slot the record carries that the frame can express neither via needs nor wants is
  information about to be dropped on the floor.
- L1743 · `if (lengthPref) {` — Length preference, learned per listener. Shortening was always possible — the trim does
  it — but nothing could make a speaker say *more* to a hull that wants more, because the
  frames that use every slot were no likelier to be picked. Preferring a frame that fills
  more slots is the only lever for length that does not damage the sentence.
<!-- /note -->

### <a id="s-realise"></a>`realise(msg, opts=)`

function · **exported** · L1754–1828

- calls: [`checkMove`](#s-checkMove) ×2 · [`chooseFrom`](#s-chooseFrom) · [`chooseWeighted`](#s-chooseWeighted) · [`decorate`](#s-decorate) · [`framesFor`](#s-framesFor) ×4 · [`isWellFormed`](#s-isWellFormed) · [`looksClausal`](#s-looksClausal) · [`moveOf`](#s-moveOf) ×3 · [`proof`](#s-proof) · [`rememberLine`](#s-rememberLine) · [`saidRecently`](#s-saidRecently) · [`scoreFrame`](#s-scoreFrame) ×2
- called by: [`fuzz`](#s-fuzz) · [`realiseAll`](#s-realiseAll) · [`speak`](#s-speak) · [`talkToNpc`](#s-talkToNpc) · [`utterFromRecord`](#s-utterFromRecord) · [`varietyOf`](#s-varietyOf)

<!-- note:realise -->
Turn a semantic record into a sentence.

@param {object} msg
  act        'inform' | 'tip' | 'report' | 'ask' | 'offer' | 'request' | 'order' |
             'warn' | 'ack' | 'accept' | 'refuse' | 'negotiate' | 'boast' | 'complain' |
             'greet' | 'farewell' | 'speculate' | 'apologise' | 'thank' | 'confirm'
  subject    already-realised NP, or omitted for a subjectless radio fragment
  verb       base form
  object     already-realised NP
  where      a PP or adverbial
  when       a temporal adverbial
  agr        agreement for the verb
  register   one of REGISTERS
  count      for existential agreement
  urgent     strips discourse furniture and shortens
  ...        the optional slots listed in SLOTS above

@param {object} opts
  bucket     anti-repetition bucket, usually speaker + topic
  rng        seeded generator; falls back to the shared npc-grammar stream
  vocative   who is being addressed
  marker     false to suppress discourse markers
  hedge      true to allow a hedge
  profile    dials from profileFor(); defaults to the register profile
  attempts   how many times to rebuild on a fatal proofing fault (default 4)

- L1774 · `const pinned = Array.isArray(m.frames) && m.frames.length ? new Set(m.frames) : null;` — Candidate frames: those whose act matches and whose required slots are all present.
  A topic may pin the shape it wants with `frames: ['inform-svo']`. Used sparingly — the
  whole point of the table is that it declares meaning and not wording — but a few records
  only read correctly in one shape, and pinning beats writing the sentence out by hand.
- L1782 · `if (!fits.length) fits = framesFor(FALLBACK_ACT[m.act] || 'ack').filter(usable);` — Nothing fits — fall back through act families rather than emitting nothing. An
  unanswerable record should still produce a plausible noise on the channel.
- L1789 · `const bias = opts.learn && typeof opts.learn.bias === 'function'` — `opts.learn.bias(frameId)` is how a character's own experience gets a vote: a shape
  that has worked on this listener before is more likely to be reached for again. It
  scales the score rather than replacing it, so a learned preference can never override
  whether a frame actually fits the facts.
- L1793 · `if (frame && opts.learn && typeof opts.learn.choice === 'function') {` — Hand the learner both the shape taken and the shapes that were on offer. Without the
  alternatives there is no way to tell a good choice from a lucky topic: the only honest
  measure of a policy is what it picked against what it could have picked.
- L1794 · `try { opts.learn.choice(frame.id, fits.map(f => f.id)); } catch (e) {` — optional
- L1803 · `const feat = { marker: false, hedge: false, vocative: false, words: 0 };` — A frame whose sentence is a two-part construction ("Either X, or Y") cannot survive
  the length trim, which cuts at the comma and leaves half a thought.
- L1809 · `const move = moveOf(m, frame);` — The move check runs on the finished, decorated string — after the furniture, because
  furniture is what turns a question into something else often enough to matter.
- L1812 · `if (saidRecently(checked.text) && attempt < attempts - 1) continue;` — A line that just went out over the same channel is not worth sending again, even if
  it is perfectly grammatical.
- L1816 · `try { opts.onFrame(frame.id, move, checked.text, feat); } catch (e) {   }` — The delivery matters as much as the shape. A bank that records only which frame was
  used can never learn that a particular hull has no patience for hedging, because
  hedging is not a property of the frame — it is a property of how the line was
  dressed on the way out, and that is the part a speaker can actually change.
- L1816 · `try { opts.onFrame(frame.id, move, checked.text, feat); } catch (e) {` — optional
- L1821 · `const wanted = moveOf(m);` — Everything we built was faulty. Emit the safest thing in the language rather than a
  broken sentence: a bare acknowledgement is always well-formed and always in character.
  The last resort has to make the same move the record was trying to make. Falling back to
  an acknowledgement turned failed denials into agreement — "Got it." in answer to being
  accused of shorting a load, which reads as a confession.
- L1825 · `try { opts.onFrame('fallback-ack', 'expressive', safe); } catch (e) {` — optional
<!-- /note -->

#### <a id="s-realise-roll"></a>`realise>roll()`

function · L1764–1764

- calls: [`stream`](#s-stream)
- called by: [`decorate`](#s-decorate) ×6

<!-- note:realise>roll -->
<!-- /note -->

#### <a id="s-realise-pick"></a>`realise.pick(list, sub)`

prop · L1769–1769

- calls: [`chooseFrom`](#s-chooseFrom)

<!-- note:realise.pick -->
<!-- /note -->

#### <a id="s-realise-lex"></a>`realise.lex(kind, sense)`

prop · L1770–1770

- calls: [`chooseFrom`](#s-chooseFrom)

<!-- note:realise.lex -->
<!-- /note -->

#### <a id="s-realise-num"></a>`realise.num(n)`

prop · L1771–1771

- calls: [`vagueCount`](#s-vagueCount)

<!-- note:realise.num -->
<!-- /note -->

#### <a id="s-realise-usable"></a>`realise>usable(f)`

function · L1776–1779

- calls: [`moveOf`](#s-moveOf)

<!-- note:realise>usable -->
A topic that asks a specific kind of question gets that kind: `q: 'wh-count'` will not
be realised as "Where are you seeing…?" because both happen to be questions.
<!-- /note -->

### <a id="s-MOVE_FALLBACK"></a>`MOVE_FALLBACK`

const · L1830–1839

<!-- note:MOVE_FALLBACK -->
What to say when every frame failed. One per move, because the move is the part that must
survive: a question that cannot be built still has to end in a question mark, and a denial
that cannot be built still has to deny.
<!-- /note -->

### <a id="s-FALLBACK_ACT"></a>`FALLBACK_ACT`

const · L1841–1847

<!-- note:FALLBACK_ACT -->
Which act to try when a record's own act has no usable frame. Chosen so the fallback
still carries roughly the speaker's intent rather than collapsing everything to an ack.
<!-- /note -->

### <a id="s-decorate"></a>`decorate(body, m, opts, prof, g, roll, feat=)`

function · L1849–1930

- calls: [`cap`](#s-cap) ×4 · [`contract`](#s-contract) · [`decorate>softLower`](#s-decorate-softLower) ×2 · [`fixI`](#s-fixI) · [`realise>roll`](#s-realise-roll) ×6
- called by: [`realise`](#s-realise)

<!-- note:decorate -->
Discourse furniture, applied after the clause so it never breaks agreement inside it.

Rules learned from reading the comms log rather than the code:

  1. An acknowledgement in front of an acknowledgement says nothing twice. "Copy.
     acknowledged." and "Right. received." were both real transmissions. A clause that
     is *itself* an ack gets no furniture in front of it.
  2. A prefix ending in a full stop ends a sentence, so the next word keeps its capital.
     Only a clause-leading marker lowercases what follows it.
  3. A clause-leading marker takes a declarative. "Look, the face reads well" is speech;
     "Note that are you holding?" is not English at all, and formal-register questions
     were producing it. Questions get no furniture.
  4. Furniture is probabilistic, not constant. A marker on every single line is its own
     kind of tape loop — the log had four consecutive "For the record," from the same
     patrol. The register profile decides how often, and the anti-repetition memory
     decides which.

- L1851 · `const forceful = m.act === 'accuse' || m.act === 'deny' || m.act === 'order' || m.act ===` — Furniture is for statements. An accusation with a qualifier on the end is not an
  accusation — "you knew that lane was closed, near enough" concedes the case in the act of
  making it — and a denial that opens with "for what it is worth" is not denying anything.
  The moves that carry force get said flat.
- L1855 · `const propers = [m.subject, m.object, m.target, m.speaker, opts.vocative, m.where]` — Proper nouns must survive being moved out of sentence-initial position. A discourse
  marker in front of a clause lowercases the first word — correct for "The face reads
  well", wrong for "Bulk Hauler 02", and very wrong for "I".
- L1868 · `if (!bare && prof.dropSubject > 0 && roll() < prof.dropSubject) {` — Subject dropping. Radio does this constantly — "Holding at the ring", "Reading a fat
  seam" — and it is the single cheapest way to make a line sound spoken rather than
  written. Only ever drop a first-person subject: dropping "Bulk Hauler 02" loses the
  information the sentence was for.
- L1876 · `const slack = prof.maxWords < 12 ? 2 : 6;` — Length control, applied to the clause *before* any furniture goes on it. Trimming last
  meant a long marker could survive a trim that removed everything it was attached to:
  "I do not want to make a thing of it." went out on the trade band as a complete
  transmission, with the offer it was hedging cut off behind it.
  Never trim a question. Cutting at the last comma that fits drops the clause carrying the
  question mark, and "Could you do something about the truth of it." is a question that has
  stopped being one — grammatical, and the wrong move entirely.
  The slack above `maxWords` used to be a flat six words, which meant a listener who wants
  short lines could never actually be given them: the trim almost never fired. It now
  closes up as the speaker learns this listener prefers less.
- L1890 · `const stub = out.replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean).length < 5;` — A marker introduces a clause, so there has to be a clause worth introducing. Four words
  or fewer is a stub, and the log carried "Note that thanks.", "Advising, agreed." and
  "Be advised, word on the far leg." — furniture with nothing behind it.
- L1892 · `const lengthPref = opts.lengthPref || 0;` — A learned or calibrated appetite for fuller lines has to be able to act on something.
  Frames set the clause; furniture is the only thing left that lengthens a transmission
  without inventing content, so a positive length preference raises its odds.
- L1908 · `const addressed = m.target != null && m.target !== '';` — Do not address someone twice in one sentence. A topic that already names the listener
  in the clause ("marking Bulk Hauler 02 on my board") does not also need a vocative.
  A greeting or an order carries its addressee in the clause itself, so a vocative on top
  of it names the same ship twice in one breath — worse still when the topic passed a
  different name for each, which reads as two conversations spliced together.
- L1909 · `const namesSomebody = /\b[A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|\d{2}))+\b/.test(out);` — Any hull name already in the clause counts, not only this listener's: "Ketch 02 has
  worked the outer belt, Ketch 03." reads as two ships being confused for each other.
- L1912 · `out = roll() < 0.5` — Vocative position varies in real speech; front for a call, tail for an aside.
- L1920 · `if (opts.signoff && roll() < prof.signoff) {` — A sign-off closes a channel; only ever on a line that already ends a thought.
- L1922 · `if (so) {` — It follows a full stop, so it starts a new sentence and takes a capital. Substituting
  the speaker into a template that begins "{a} out." and appending it raw produced
  "Received. this hull out." on the local band for a slice.
<!-- /note -->

#### <a id="s-decorate-softLower"></a>`decorate>softLower(t)`

function · L1858–1864

- called by: [`decorate`](#s-decorate) ×2

<!-- note:decorate>softLower -->
<!-- /note -->

### <a id="s-quantity"></a>`quantity(kind, n, opts=)`

function · **exported** · L1932–1945

- calls: [`chooseFrom`](#s-chooseFrom) · [`isMass`](#s-isMass) · [`np`](#s-np) · [`plural`](#s-plural) ×3 · [`vagueCount`](#s-vagueCount) ×3
- called by: [`holdFact`](#s-holdFact)

<!-- note:quantity -->
═════════════════════════════════════════════════════════════════════
 8. CONTENT HELPERS
═════════════════════════════════════════════════════════════════════

The functions a topic calls to turn a *fact* into an already-realised phrase. They are
the boundary between the two files: `npc-topics.js` knows what is true, this file knows
how to say it, and neither has to know the other's business.

Build the object NP for a quantity of something, choosing a synonym and inflecting it.
This is where "information constructing" happens: the number is real, and the words
around it are chosen fresh each time.
<!-- /note -->

### <a id="s-PREDICATIVE_ONLY"></a>`PREDICATIVE_ONLY`

const · L1947–1947

<!-- note:PREDICATIVE_ONLY -->
Adjectives that only work after a copula. English will not let most of them sit in front
of a noun: "the seam is worth the burn" is fine and "the worth the burn seam" is not, and
the trade band carried "the clean claim reads worth the burn material" for a slice
because `described()` drew from the whole set without asking.
<!-- /note -->

### <a id="s-attributive"></a>`attributive(adj)`

function · **exported** · L1949–1951

- called by: [`np`](#s-np)

<!-- note:attributive -->
Is this adjective usable in front of the noun it modifies?
<!-- /note -->

### <a id="s-described"></a>`described(kind, quality, opts=)`

function · **exported** · L1953–1963

- calls: [`chooseFrom`](#s-chooseFrom) ×2 · [`isMass`](#s-isMass) · [`np`](#s-np)
- called by: [`INTENTS.build~9`](#s-INTENTS-build-9) · [`TOPICS`](#s-TOPICS) ×2 · [`gradeFact`](#s-gradeFact)

<!-- note:described -->
A descriptive NP — "a fat seam", "picked-over rock".
<!-- /note -->

### <a id="s-place"></a>`place(name, opts=)`

function · **exported** · L1965–1970

- calls: [`chooseFrom`](#s-chooseFrom)
- called by: [`headingFact`](#s-headingFact) · [`whereFact`](#s-whereFact)

<!-- note:place -->
A place adverbial, varied.
<!-- /note -->

### <a id="s-timeRef"></a>`timeRef(seconds, opts=)`

function · **exported** · L1972–1989

- calls: [`chooseFrom`](#s-chooseFrom) ×2
- called by: [`whenFact`](#s-whenFact)

<!-- note:timeRef -->
A temporal adverbial from seconds. Speech does not say "in 214 seconds"; it says "in
about four minutes", and past a certain distance it stops counting at all.
<!-- /note -->

### <a id="s-bearing"></a>`bearing(deg, opts=)`

function · **exported** · L1991–2001

- calls: [`chooseFrom`](#s-chooseFrom)
- called by: [`headingFact`](#s-headingFact)

<!-- note:bearing -->
A bearing, spoken. "Two seven zero" reads as radio; "270°" reads as a HUD.
<!-- /note -->

### <a id="s-PHONETIC"></a>`PHONETIC`

const · L2003–2008

<!-- note:PHONETIC -->
<!-- /note -->

### <a id="s-phonetic"></a>`phonetic(code)`

function · **exported** · L2010–2016

<!-- note:phonetic -->
Spell a hull code phonetically. Used when a channel is noisy or a name has to be read
back exactly — a repair, a docking clearance, a contract number.
<!-- /note -->

### <a id="s-shortName"></a>`shortName(name, familiarity=)`

function · **exported** · L2018–2034

- called by: [`nameFor`](#s-nameFor)

<!-- note:shortName -->
Shorten a hull name the way a familiar voice does. "Bulk Hauler 02" becomes "Hauler 02"
to somebody who talks to it every shift, and "02" to somebody who flies with it.

- L2024 · `const TYPE_PREFIX = /^(nexis|bulk|coalition|tessera|charter|free|long|old|halcyon|meridian` — A hull name shortens to the part that still identifies it, which is not simply its last
  word. "Standing Order" became "Order", "Gallows Humour" became "Humour" and "Bad
  Arithmetic" became "Arithmetic" — three ships addressed by a word that means something
  else entirely. Only a *type* prefix can be dropped: the words a whole class of hull
  shares. Anything else is a name, and names are kept whole.
- L2028 · `return parts.slice(1).join(' ');` — "Coalition Patrol 03" -> "Patrol 03". The prefix is the fleet, not the ship.
- L2031 · `return parts.slice(-2).join(' ');` — Very familiar, and the hull carries a number: the number is the shortest thing that
  still picks it out of its class. "Nexis Drone 08" -> "Drone 08".
<!-- /note -->

### <a id="s-combine"></a>`combine(a, b, opts=)`

function · **exported** · L2036–2053

- calls: [`chooseFrom`](#s-chooseFrom)

<!-- note:combine -->
Join two realised clauses into one sentence. Speech coordinates constantly, and a
conversation made only of single-clause utterances sounds like a menu.
<!-- /note -->

### <a id="s-realiseAll"></a>`realiseAll(records, opts=)`

function · **exported** · L2055–2073

- calls: [`proof`](#s-proof) · [`realise`](#s-realise)
- called by: [`utterFromRecord`](#s-utterFromRecord)

<!-- note:realiseAll -->
Realise several records as one turn of speech. A character who has three things to say
says them in one transmission, not three; the sentences are proofed together so a
repeated phrase across them is caught.

- L2059 · `const first = out.length === 0;` — One transmission, so the furniture belongs to the transmission and not to each
  sentence in it. Addressing the listener once per record produced "Keep your eyes open,
  Drone 01. Hold your board, Drone 01." on a contact call, and a hedge in the middle of
  a warning undercuts the sentence in front of it.
- L2072 · `return checked.ok ? checked.text : (out[0] || '');` — A fatal fault across the join is almost always the stutter rule: two records reached
  for the same phrase. Drop the later one rather than the whole turn.
<!-- /note -->

### <a id="s-speak"></a>`speak(unit, msg, opts=)`

function · **exported** · L2075–2084

- calls: [`profileFor`](#s-profileFor) · [`realise`](#s-realise) · [`registerOf`](#s-registerOf)

<!-- note:speak -->
The one-call convenience the topics table uses most: build a record, realise it, and
carry the speaker's profile through in one step.
<!-- /note -->

### <a id="s-CASES"></a>`CASES`

const · L2086–2146

- calls: [`adverbise`](#s-adverbise) · [`agreeWith`](#s-agreeWith) ×2 · [`article`](#s-article) ×5 · [`comparative`](#s-comparative) ×3 · [`conjugate`](#s-conjugate) ×12 · [`gerund`](#s-gerund) ×3 · [`listOf`](#s-listOf) · [`np`](#s-np) ×4 · [`numberWord`](#s-numberWord) · [`ordinal`](#s-ordinal) ×2 · [`plural`](#s-plural) ×7 · [`possessive`](#s-possessive) ×2 · [`pronoun`](#s-pronoun) · [`proof`](#s-proof) ×13 · [`superlative`](#s-superlative)

<!-- note:CASES -->
═════════════════════════════════════════════════════════════════════
 9. SELF-TEST
═════════════════════════════════════════════════════════════════════

Runnable headless (`node --input-type=module`) or from the in-game debug console. A
generator that cannot check its own output is a generator nobody can safely extend: the
point of these cases is that adding a frame or a lexicon entry next month either keeps
them passing or tells you exactly what it broke.

- L2087 · `() => [plural('cargo', 2), 'cargoes'],` — morphology
- L2133 · `() => [proof('the lane .').text, 'The lane.'],` — proofing
<!-- /note -->

### <a id="s-fuzz"></a>`fuzz(iterations=)`

function · L2148–2194

- calls: [`fuzz>pickOf`](#s-fuzz-pickOf) ×8 · [`proof`](#s-proof) · [`realise`](#s-realise) · [`stream`](#s-stream)
- called by: [`runGrammarSelfTest`](#s-runGrammarSelfTest)

<!-- note:fuzz -->
Property test: hammer the realiser with every act and register and assert that nothing
it emits fails proofing. This is the check that actually protects the comms log, because
it exercises combinations no hand-written case would think to try.
<!-- /note -->

#### <a id="s-fuzz-pickOf"></a>`fuzz>pickOf(arr)`

function · L2156–2156

- called by: [`fuzz`](#s-fuzz) ×8

<!-- note:fuzz>pickOf -->
<!-- /note -->

### <a id="s-varietyOf"></a>`varietyOf(msg, n=, opts=)`

function · **exported** · L2196–2202

- calls: [`realise`](#s-realise)
- called by: [`runGrammarSelfTest`](#s-runGrammarSelfTest)

<!-- note:varietyOf -->
Variety check: how many distinct sentences does one record produce over N draws?
<!-- /note -->

### <a id="s-runGrammarSelfTest"></a>`runGrammarSelfTest(opts=)`

function · **exported** · L2204–2237

- calls: [`c`](#s-c) · [`fuzz`](#s-fuzz) · [`grammarStats`](#s-grammarStats) · [`resetGrammarMemory`](#s-resetGrammarMemory) ×2 · [`varietyOf`](#s-varietyOf)
- called by: [`runSpeechSelfTest`](#s-runSpeechSelfTest)

<!-- note:runGrammarSelfTest -->
Run everything. Returns { pass, fail, failures } and logs a readable report.
`resetGrammarMemory()` first so a test run is reproducible whatever the game did before.

- L2206 · `resetGrammarMemory();` — Variety floor. One record must not collapse to one sentence — that is the whole reason
  this file exists, so it is a test and not a hope.
<!-- /note -->

### <a id="s-bucketFor"></a>`bucketFor(a, topicKey)`

function · L2239–2239

- called by: [`utterFromRecord`](#s-utterFromRecord) · [`utterRecord`](#s-utterRecord)

<!-- note:bucketFor -->
Living Galaxy — what NPCs talk to each other about.

A topic is not a line of dialogue. It is a *reason two characters would open a channel*,
the conditions under which that reason exists, and — the part that matters — what each of
them still knows afterwards.

That last clause is the whole design constraint. It would be easy to build NPC chat as a
presentation feature: pick two ships in range, print a plausible line, done. That is a
screensaver. A topic earns its place here only if the exchange leaves state behind that
outlives it, so every entry declares `filesFrom` and `filesTo`: the memory each side
carries away, with the *other character* as the subject.

Declared as data for the same reason the ammunition feeds are: a table with a `when`
clause beats a switch statement that has to be edited to add a kind of conversation.

── fields ───────────────────────────────────────────────────────────
  channel    which comms band it goes out on — the player can overhear it there
  weight     relative likelihood when several topics are available
  cooldown   seconds before the same pair may raise the same topic again
  when       (a, b, ctx) => bool — both sides' userData; true if this makes sense now
  say        [turnFn, ...] — each gets { a, b, rel, bucket, ctx } and returns a semantic
             record, or an array of records for a two-sentence transmission
  filesFrom  memory the *speaker* keeps, subject = the other character
  filesTo    memory the *listener* keeps, subject = the speaker
  offers     an obligation this topic can put on the ledger if the listener accepts
  chains     topic keys this exchange makes newly plausible, raised next time the pair
             talk — how a conversation becomes a thread rather than a series of unrelated
             transmissions
  urgent     strips discourse furniture and shortens; read by the grammar's profile
  mood       forces a register for this exchange without mutating the unit
  hearsay    the listener files second-hand knowledge, weighted below an eyewitness
  priority   scheduling hint for systems/npc-comms.js: a distress call outranks small talk

`rel` is the relationship record from systems/npc-comms.js: how many times these two have
spoken and what they think of each other. It is passed to the turn functions so a
hundredth exchange between two familiar ships does not read like a first contact — which
is the difference between a radio and a tape loop.

── v1.02.10: turns, not pairs ───────────────────────────────────────

`say` was a two-element array — an opener and a reply — because that is the shortest
exchange that is still a conversation. It is also the shortest exchange that never
becomes one: nobody negotiates in two lines, nobody talks a frightened hauler through a
burn in two lines, and a deal that closes in two lines is not a deal, it is a vending
machine. `say` is now any length, and the engine walks it with the speakers alternating,
stopping early if either side loses line of sight or the channel is pre-empted by
something with a higher `priority`.

A turn may also return an *array* of records. The grammar realises them as one
transmission — "Face is thin this side. I am moving up the belt." — which is how people
actually talk when they have two things to say and one channel to say them on.

═════════════════════════════════════════════════════════════════════
 1. BUCKETS
═════════════════════════════════════════════════════════════════════

A stable bucket for the anti-repetition memory: this speaker, on this topic.

Speaker-scoped so a character does not repeat *itself*, which is the common case. It is
not enough on its own: the opener and the reply of one exchange are spoken by different
characters, so they draw from different buckets and can land on the same phrase back to
back. That produced this, verbatim, on the local channel:

  NEXIS DRONE 08      ... that is a lot of hull for one gun. Keep your eyes open.
  COALITION PATROL 03  Still talking. Keep your eyes open.

`pairBucket` is the fix — see `utter`, which shares one bucket across every turn of an
exchange for the phrase pools where an echo is audible, and keeps frame and furniture
choice speaker-scoped, because two people using the same sentence *shape* is how
conversation sounds and two people using the same *words* is how a tape loop sounds.
<!-- /note -->

### <a id="s-pairBucket"></a>`pairBucket(a, b, topicKey)`

function · L2240–2241

- called by: [`utterFromRecord`](#s-utterFromRecord) · [`utterRecord`](#s-utterRecord)

<!-- note:pairBucket -->
<!-- /note -->

### <a id="s-same"></a>`same(a, b)`

function · L2243–2243

- called by: [`TOPICS.when`](#s-TOPICS-when) · [`TOPICS.when~10`](#s-TOPICS-when-10) · [`TOPICS.when~2`](#s-TOPICS-when-2) · [`TOPICS.when~3`](#s-TOPICS-when-3) · [`TOPICS.when~4`](#s-TOPICS-when-4) · [`TOPICS.when~7`](#s-TOPICS-when-7) · [`utterFromRecord`](#s-utterFromRecord) · [`when`](#s-when) · [`when~11`](#s-when-11) · [`when~12`](#s-when-12) · [`when~13`](#s-when-13) · [`when~15`](#s-when-15) · [`when~16`](#s-when-16) · [`when~17`](#s-when-17) · [`when~18`](#s-when-18) · [`when~19`](#s-when-19) · [`when~20`](#s-when-20) · [`when~27`](#s-when-27) · [`when~28`](#s-when-28) · [`when~30`](#s-when-30) · [`when~39`](#s-when-39) · [`when~40`](#s-when-40) · [`when~41`](#s-when-41) · [`when~42`](#s-when-42) · [`when~43`](#s-when-43) · [`when~45`](#s-when-45) · [`when~50`](#s-when-50) · [`when~8`](#s-when-8)

<!-- note:same -->
═════════════════════════════════════════════════════════════════════
 2. PREDICATES
═════════════════════════════════════════════════════════════════════

The vocabulary the `when` clauses are written in. Each one is a question about the world
that a character could plausibly answer by looking out of the window, which is the test
for whether it belongs here: a condition an NPC could not perceive is a condition the
player will eventually notice it reacting to impossibly.
<!-- /note -->

### <a id="s-role"></a>`role(u, r)`

function · L2244–2244

- called by: [`INTENTS.build~14`](#s-INTENTS-build-14) · [`INTENTS.build~19`](#s-INTENTS-build-19) · [`TOPICS.when~5`](#s-TOPICS-when-5) · [`TOPICS.when~7`](#s-TOPICS-when-7) ×2 · [`TOPICS.when~8`](#s-TOPICS-when-8) · [`TOPICS.when~9`](#s-TOPICS-when-9) ×2 · [`needFact`](#s-needFact) ×2 · [`when~22`](#s-when-22) · [`when~37`](#s-when-37) ×2 · [`when~44`](#s-when-44) · [`when~49`](#s-when-49) ×2

<!-- note:role -->
<!-- /note -->

### <a id="s-anyRole"></a>`anyRole(u, ...rs)`

function · L2245–2245

- called by: [`INTENTS.build~9`](#s-INTENTS-build-9) · [`TOPICS.when~10`](#s-TOPICS-when-10) ×2 · [`TOPICS.when~12`](#s-TOPICS-when-12) · [`TOPICS.when~5`](#s-TOPICS-when-5) · [`TOPICS.when~8`](#s-TOPICS-when-8) · [`when~25`](#s-when-25) · [`when~26`](#s-when-26) · [`when~27`](#s-when-27) · [`when~32`](#s-when-32) · [`when~4`](#s-when-4) · [`when~40`](#s-when-40) ×2 · [`when~43`](#s-when-43) · [`when~44`](#s-when-44) · [`when~48`](#s-when-48) ×2 · [`when~5`](#s-when-5)

<!-- note:anyRole -->
<!-- /note -->

### <a id="s-hurt"></a>`hurt(u)`

function · L2246–2246

- called by: [`@file`](#) ×2 · [`INTENTS.build~16`](#s-INTENTS-build-16) · [`INTENTS.build~7`](#s-INTENTS-build-7) · [`TOPICS.when~2`](#s-TOPICS-when-2) · [`TOPICS.when~3`](#s-TOPICS-when-3) · [`backOff`](#s-backOff) · [`needFact`](#s-needFact) · [`reasonFact`](#s-reasonFact) · [`scoreTopic`](#s-scoreTopic) · [`when`](#s-when) · [`when~2`](#s-when-2) ×2 · [`when~31`](#s-when-31) · [`when~42`](#s-when-42) · [`when~45`](#s-when-45) · [`when~5`](#s-when-5) · [`when~50`](#s-when-50) · [`when~6`](#s-when-6) · [`when~7`](#s-when-7)

<!-- note:hurt -->
<!-- /note -->

### <a id="s-badlyHurt"></a>`badlyHurt(u)`

function · L2247–2247

- called by: [`INTENTS.build~15`](#s-INTENTS-build-15) · [`INTENTS.build~5`](#s-INTENTS-build-5) ×2 · [`when~4`](#s-when-4)

<!-- note:badlyHurt -->
<!-- /note -->

### <a id="s-healthy"></a>`healthy(u)`

function · L2248–2248

- called by: [`when~17`](#s-when-17) · [`when~40`](#s-when-40)

<!-- note:healthy -->
<!-- /note -->

### <a id="s-armed"></a>`armed(u)`

function · L2249–2249

- called by: [`civilian`](#s-civilian) · [`when`](#s-when) · [`when~11`](#s-when-11) ×2 · [`when~12`](#s-when-12) ×2 · [`when~17`](#s-when-17) ×2 · [`when~3`](#s-when-3) · [`when~49`](#s-when-49) · [`when~6`](#s-when-6)

<!-- note:armed -->
<!-- /note -->

### <a id="s-civilian"></a>`civilian(u)`

function · L2250–2250

- calls: [`armed`](#s-armed)
- called by: [`backOff`](#s-backOff) · [`needFact`](#s-needFact) · [`when~2`](#s-when-2) · [`when~21`](#s-when-21) · [`when~6`](#s-when-6)

<!-- note:civilian -->
<!-- /note -->

### <a id="s-laden"></a>`laden(u)`

function · L2252–2252

- called by: [`@file`](#) ×2 · [`INTENTS.build~19`](#s-INTENTS-build-19) · [`TOPICS.when~9`](#s-TOPICS-when-9) · [`needFact`](#s-needFact) · [`partLaden`](#s-partLaden) · [`reasonFact`](#s-reasonFact) · [`when~31`](#s-when-31) · [`when~6`](#s-when-6)

<!-- note:laden -->
Cargo state. `cargo` and `cargoMax` are optional — absent means "unknown", not "empty".
<!-- /note -->

### <a id="s-empty"></a>`empty(u)`

function · L2253–2253

- called by: [`needFact`](#s-needFact) · [`partLaden`](#s-partLaden) · [`reasonFact`](#s-reasonFact)

<!-- note:empty -->
<!-- /note -->

### <a id="s-partLaden"></a>`partLaden(u)`

function · L2254–2254 · **never referenced**

- calls: [`empty`](#s-empty) · [`laden`](#s-laden)

<!-- note:partLaden -->
<!-- /note -->

### <a id="s-lowFuel"></a>`lowFuel(u)`

function · L2256–2256

- called by: [`@file`](#) · [`INTENTS.build~16`](#s-INTENTS-build-16) · [`TOPICS.when~13`](#s-TOPICS-when-13) · [`TOPICS.when~3`](#s-TOPICS-when-3) · [`needFact`](#s-needFact) · [`reasonFact`](#s-reasonFact) · [`when~2`](#s-when-2) · [`when~50`](#s-when-50)

<!-- note:lowFuel -->
Fuel and endurance. A ship low on reaction mass talks about it, and asks for help.
<!-- /note -->

### <a id="s-fatFuel"></a>`fatFuel(u)`

function · L2257–2257

- called by: [`TOPICS.when~13`](#s-TOPICS-when-13)

<!-- note:fatFuel -->
<!-- /note -->

### <a id="s-working"></a>`working(u)`

function · L2259–2259

- called by: [`TOPICS.when~3`](#s-TOPICS-when-3) · [`TOPICS.when~4`](#s-TOPICS-when-4) · [`reasonFact`](#s-reasonFact)

<!-- note:working -->
Where a unit is in its own job. Set by the AI systems; absent means "no idea".
<!-- /note -->

### <a id="s-idle"></a>`idle(u)`

function · L2260–2260

- called by: [`when~30`](#s-when-30) · [`when~45`](#s-when-45) · [`when~50`](#s-when-50) · [`when~51`](#s-when-51)

<!-- note:idle -->
<!-- /note -->

### <a id="s-docked"></a>`docked(u)`

function · L2261–2261

- called by: [`reasonFact`](#s-reasonFact) · [`when~23`](#s-when-23) ×2 · [`when~30`](#s-when-30) · [`when~43`](#s-when-43) · [`when~50`](#s-when-50) · [`when~51`](#s-when-51)

<!-- note:docked -->
<!-- /note -->

### <a id="s-transiting"></a>`transiting(u)`

function · L2262–2262

- called by: [`INTENTS.build~8`](#s-INTENTS-build-8) · [`TOPICS`](#s-TOPICS) · [`TOPICS.when~4`](#s-TOPICS-when-4) · [`reasonFact`](#s-reasonFact) · [`when~25`](#s-when-25) · [`when~6`](#s-when-6)

<!-- note:transiting -->
<!-- /note -->

### <a id="s-fleeing"></a>`fleeing(u)`

function · L2263–2263 · **never referenced**

<!-- note:fleeing -->
<!-- /note -->

### <a id="s-engaged"></a>`engaged(u)`

function · L2264–2264

- called by: [`TOPICS.when`](#s-TOPICS-when) ×2 · [`TOPICS.when~12`](#s-TOPICS-when-12) · [`TOPICS.when~2`](#s-TOPICS-when-2) ×2 · [`TOPICS.when~4`](#s-TOPICS-when-4) · [`reasonFact`](#s-reasonFact) · [`scoreTopic`](#s-scoreTopic) · [`when~12`](#s-when-12) · [`when~13`](#s-when-13) ×2 · [`when~17`](#s-when-17) · [`when~23`](#s-when-23) · [`when~25`](#s-when-25) · [`when~4`](#s-when-4) · [`when~51`](#s-when-51)

<!-- note:engaged -->
<!-- /note -->

### <a id="s-dist"></a>`dist(a, b)`

function · L2266–2272

- called by: [`createWorld>tick`](#s-createWorld-tick) ×2 · [`createWorld>worldCtxStock.berthsFree`](#s-createWorld-worldCtxStock-berthsFree) ×2 · [`createWorld>worldCtxStock.threatCount`](#s-createWorld-worldCtxStock-threatCount) · [`createWorld>worldCtxStock.threatNear`](#s-createWorld-worldCtxStock-threatNear) · [`createWorld>worldCtxStock.trafficNear`](#s-createWorld-worldCtxStock-trafficNear) · [`far`](#s-far) · [`near`](#s-near)

<!-- note:dist -->
Distance, in whatever unit the sim uses. Absent positions mean "close enough to talk".
<!-- /note -->

### <a id="s-near"></a>`near(a, b, d=)`

function · L2273–2273

- calls: [`dist`](#s-dist)
- called by: [`TOPICS.when~13`](#s-TOPICS-when-13) · [`TOPICS.when~7`](#s-TOPICS-when-7) · [`when~12`](#s-when-12) · [`when~27`](#s-when-27) · [`when~5`](#s-when-5)

<!-- note:near -->
<!-- /note -->

### <a id="s-far"></a>`far(a, b, d=)`

function · L2274–2274

- calls: [`dist`](#s-dist)
- called by: [`when~2`](#s-when-2)

<!-- note:far -->
<!-- /note -->

### <a id="s-known"></a>`known(rel)`

function · L2276–2276

- called by: [`@file`](#) ×2 · [`TOPICS`](#s-TOPICS) ×10 · [`TOPICS.when~2`](#s-TOPICS-when-2) · [`TOPICS.when~3`](#s-TOPICS-when-3) · [`when~28`](#s-when-28) · [`when~29`](#s-when-29) · [`when~30`](#s-when-30) · [`when~31`](#s-when-31) · [`when~40`](#s-when-40) · [`when~41`](#s-when-41) · [`when~44`](#s-when-44) · [`when~45`](#s-when-45) · [`when~49`](#s-when-49) · [`when~50`](#s-when-50)

<!-- note:known -->
Short-hand for "these two have talked before" — the gate most familiarity reads on.
<!-- /note -->

### <a id="s-familiar"></a>`familiar(rel)`

function · L2277–2277

- called by: [`@file`](#) ×4 · [`TOPICS`](#s-TOPICS) ×2 · [`codaFor`](#s-codaFor) · [`turnsFor`](#s-turnsFor) · [`when~47`](#s-when-47)

<!-- note:familiar -->
<!-- /note -->

### <a id="s-oldFriends"></a>`oldFriends(rel)`

function · L2278–2278

- called by: [`codaFor`](#s-codaFor) · [`scoreTopic`](#s-scoreTopic) · [`turnsFor`](#s-turnsFor) · [`when~40`](#s-when-40) · [`when~42`](#s-when-42) · [`when~51`](#s-when-51)

<!-- note:oldFriends -->
<!-- /note -->

### <a id="s-strangers"></a>`strangers(rel)`

function · L2279–2279

- called by: [`scoreTopic`](#s-scoreTopic)

<!-- note:strangers -->
<!-- /note -->

### <a id="s-warm"></a>`warm(rel)`

function · L2280–2280

- called by: [`@file`](#) ×25 · [`TOPICS`](#s-TOPICS) ×5

<!-- note:warm -->
<!-- /note -->

### <a id="s-cold"></a>`cold(rel)`

function · L2281–2281

- called by: [`@file`](#) ×26 · [`TOPICS`](#s-TOPICS) ×6 · [`backOff`](#s-backOff) · [`codaFor`](#s-codaFor) · [`guilty`](#s-guilty) · [`scoreTopic`](#s-scoreTopic) · [`turnsFor`](#s-turnsFor) · [`utterFromRecord`](#s-utterFromRecord) · [`when~14`](#s-when-14) · [`when~38`](#s-when-38) · [`when~44`](#s-when-44)

<!-- note:cold -->
<!-- /note -->

### <a id="s-owes"></a>`owes(rel)`

function · L2282–2282 · **never referenced**

<!-- note:owes -->
<!-- /note -->

### <a id="s-owed"></a>`owed(rel)`

function · L2283–2283

<!-- note:owed -->
<!-- /note -->

### <a id="s-familiarity"></a>`familiarity(rel)`

function · L2285–2285

- called by: [`nameFor`](#s-nameFor) · [`utterFromRecord`](#s-utterFromRecord)

<!-- note:familiarity -->
How familiar, as a number the grammar's profile reads directly.
<!-- /note -->

### <a id="s-nameFor"></a>`nameFor(u, rel)`

function · L2287–2287

- calls: [`familiarity`](#s-familiarity) · [`shortName`](#s-shortName)
- called by: [`@file`](#) ×50 · [`CODA`](#s-CODA) · [`TOPICS`](#s-TOPICS) ×14

<!-- note:nameFor -->
Name as this speaker would say it. Two ships that have talked forty times do not use each
other's full registry names, and hearing the full name every single time is one of the
clearest tells that a conversation is generated.
<!-- /note -->

### <a id="s-has"></a>`has(ctx, fn)`

function · L2289–2289

- called by: [`@file`](#) ×4 · [`TOPICS`](#s-TOPICS) ×6 · [`TOPICS.when~11`](#s-TOPICS-when-11) · [`TOPICS.when~6`](#s-TOPICS-when-6) · [`backOff`](#s-backOff) · [`free`](#s-free) · [`good`](#s-good) · [`guilty`](#s-guilty) · [`memoriesFrom`](#s-memoriesFrom) · [`memoriesFrom>build`](#s-memoriesFrom-build) · [`n`](#s-n) · [`obligationFrom`](#s-obligationFrom) · [`scoreTopic`](#s-scoreTopic) ×3 · [`wary`](#s-wary) · [`when~10`](#s-when-10) · [`when~13`](#s-when-13) · [`when~14`](#s-when-14) · [`when~15`](#s-when-15) · [`when~16`](#s-when-16) ×2 · [`when~18`](#s-when-18) · [`when~19`](#s-when-19) ×2 · [`when~20`](#s-when-20) · [`when~21`](#s-when-21) ×2 · [`when~24`](#s-when-24) · [`when~26`](#s-when-26) · [`when~28`](#s-when-28) · [`when~29`](#s-when-29) ×2 · [`when~3`](#s-when-3) · [`when~32`](#s-when-32) · [`when~33`](#s-when-33) ×2 · [`when~34`](#s-when-34) · [`when~35`](#s-when-35) · [`when~36`](#s-when-36) · [`when~37`](#s-when-37) · [`when~38`](#s-when-38) · [`when~39`](#s-when-39) ×2 · [`when~41`](#s-when-41) · [`when~46`](#s-when-46) · [`when~47`](#s-when-47) · [`when~48`](#s-when-48) · [`when~7`](#s-when-7) · [`when~8`](#s-when-8) · [`when~9`](#s-when-9)

<!-- note:has -->
Does the context expose the callback a `when` clause wants? Guards optional hooks.
<!-- /note -->

### <a id="s-gradeFact"></a>`gradeFact(u, bucket)`

function · L2291–2295

- calls: [`described`](#s-described)
- called by: [`INTENTS.build~9`](#s-INTENTS-build-9) · [`TOPICS`](#s-TOPICS) ×2

<!-- note:gradeFact -->
═════════════════════════════════════════════════════════════════════
 3. FACT BUILDERS
═════════════════════════════════════════════════════════════════════

A topic's job is to decide *what is true and worth saying*. These turn that into the
already-realised phrases the grammar's semantic records take as slots — which is the
boundary between the two files: this one knows the world, `npc-grammar.js` knows English,
and neither has to learn the other's job.

The ore grade at a unit's current claim, said the way a miner says it.
<!-- /note -->

### <a id="s-holdFact"></a>`holdFact(u, bucket)`

function · L2297–2304

- calls: [`chooseFrom`](#s-chooseFrom) ×4 · [`quantity`](#s-quantity)
- called by: [`@file`](#) · [`INTENTS.build~10`](#s-INTENTS-build-10) · [`INTENTS.build~11`](#s-INTENTS-build-11) · [`INTENTS.build~19`](#s-INTENTS-build-19) · [`TOPICS`](#s-TOPICS) ×3

<!-- note:holdFact -->
How full a hold is, in words rather than in a percentage.
<!-- /note -->

### <a id="s-priceFact"></a>`priceFact(n, bucket)`

function · L2306–2314

- calls: [`chooseFrom`](#s-chooseFrom) ×2 · [`vagueCount`](#s-vagueCount)
- called by: [`@file`](#) ×4 · [`INTENTS.build~10`](#s-INTENTS-build-10) · [`TOPICS`](#s-TOPICS) ×2

<!-- note:priceFact -->
A price, said as a number a trader would actually quote.
<!-- /note -->

### <a id="s-whereFact"></a>`whereFact(u, bucket)`

function · L2316–2319

- calls: [`place`](#s-place)
- called by: [`@file`](#) ×12 · [`INTENTS.build~12`](#s-INTENTS-build-12) · [`INTENTS.build~19`](#s-INTENTS-build-19) · [`INTENTS.build~7`](#s-INTENTS-build-7) · [`INTENTS.build~8`](#s-INTENTS-build-8) · [`INTENTS.build~9`](#s-INTENTS-build-9) · [`TOPICS`](#s-TOPICS) ×9

<!-- note:whereFact -->
Where the speaker is, as a place adverbial the listener could act on.
<!-- /note -->

### <a id="s-threatFact"></a>`threatFact(n, bucket)`

function · L2321–2327

- calls: [`chooseFrom`](#s-chooseFrom) ×2 · [`vagueCount`](#s-vagueCount)
- called by: [`@file`](#) · [`INTENTS.build~12`](#s-INTENTS-build-12) · [`TOPICS`](#s-TOPICS)

<!-- note:threatFact -->
A threat, described rather than enumerated.

- L2324 · `const q = vagueCount(n, { bucket });` — vagueCount hands back partitives as well as numerals, and "a handful contacts" is not a
  phrase. The partitive forms take "of"; the numeral and quantifier forms do not.
- L2325 · `const partitive = /^(a pair|a couple|a handful)$/.test(q);` — Only the bare partitives need it: "a dozen or two contacts" and "half a dozen or so
  contacts" already read correctly, and adding "of" to them produced "half a dozen or so
  of contacts" on the trade band.
<!-- /note -->

### <a id="s-damageFact"></a>`damageFact(u, bucket)`

function · L2329–2335

- calls: [`chooseFrom`](#s-chooseFrom) ×4
- called by: [`@file`](#) · [`INTENTS.build~7`](#s-INTENTS-build-7)

<!-- note:damageFact -->
Damage, in the terms a pilot uses about their own ship.
<!-- /note -->

### <a id="s-whenFact"></a>`whenFact(seconds, bucket)`

function · L2337–2339

- calls: [`timeRef`](#s-timeRef)
- called by: [`@file`](#) ×2

<!-- note:whenFact -->
Time until something, or since it, in speech rather than in seconds.
<!-- /note -->

### <a id="s-headingFact"></a>`headingFact(deg, bucket)`

function · L2341–2343

- calls: [`bearing`](#s-bearing) · [`place`](#s-place)
- called by: [`@file`](#) ×2

<!-- note:headingFact -->
A heading, spoken. Used when one ship is telling another where to look.
<!-- /note -->

### <a id="s-reasonFact"></a>`reasonFact(u, bucket)`

function · L2345–2357

- calls: [`chooseFrom`](#s-chooseFrom) · [`docked`](#s-docked) · [`empty`](#s-empty) · [`engaged`](#s-engaged) · [`hurt`](#s-hurt) · [`laden`](#s-laden) · [`lowFuel`](#s-lowFuel) · [`transiting`](#s-transiting) · [`working`](#s-working)
- called by: [`@file`](#) ×3 · [`INTENTS.build~15`](#s-INTENTS-build-15) · [`INTENTS.build~16`](#s-INTENTS-build-16) · [`TOPICS`](#s-TOPICS) ×2

<!-- note:reasonFact -->
A reason. Every refusal, every warning and every request reads better with one, and a
reason drawn from the speaker's actual state is the cheapest way to make an NPC look like
it has an inner life: it is not inventing an excuse, it is telling you what it is doing.
<!-- /note -->

### <a id="s-needFact"></a>`needFact(u, bucket)`

function · L2359–2366

- calls: [`chooseFrom`](#s-chooseFrom) ×6 · [`civilian`](#s-civilian) · [`empty`](#s-empty) · [`hurt`](#s-hurt) · [`laden`](#s-laden) · [`lowFuel`](#s-lowFuel) · [`role`](#s-role) ×2
- called by: [`@file`](#) · [`INTENTS.build~16`](#s-INTENTS-build-16) · [`TOPICS`](#s-TOPICS)

<!-- note:needFact -->
What this speaker wants, from its own state. Drives offers and requests.
<!-- /note -->

### <a id="s-TOPICS"></a>`TOPICS`

const · **exported** · L2368–2798

- calls: [`chooseFrom`](#s-chooseFrom) ×31 · [`cold`](#s-cold) ×6 · [`described`](#s-described) ×2 · [`familiar`](#s-familiar) ×2 · [`gradeFact`](#s-gradeFact) ×2 · [`has`](#s-has) ×6 · [`holdFact`](#s-holdFact) ×3 · [`known`](#s-known) ×10 · [`nameFor`](#s-nameFor) ×14 · [`needFact`](#s-needFact) · [`priceFact`](#s-priceFact) ×2 · [`reasonFact`](#s-reasonFact) ×2 · [`registerOf`](#s-registerOf) ×30 · [`threatFact`](#s-threatFact) · [`transiting`](#s-transiting) · [`warm`](#s-warm) ×5 · [`whereFact`](#s-whereFact) ×9

<!-- note:TOPICS -->
═════════════════════════════════════════════════════════════════════
 4. THE TOPIC TABLE
═════════════════════════════════════════════════════════════════════

Ordered loosely by how often they fire, which is also roughly how boring they are. The
dull ones matter most: a channel that only ever carries distress calls and threats is
not a populated system, it is a set piece. The routine traffic is what makes the rare
traffic land.

- L2370 · `checkIn: {` — ── routine ────────────────────────────────────────────────────────
- L2374 · `({ a, b, rel, bucket }) => ({` — After the swap in exchange(), `a` is the responder and `b` is the original speaker.
  Acknowledge the other party, not ourselves.
- L2399 · `smallTalk: {` — The topic with the least content and the most work to do. Two ships that only ever
  exchange business are two vending machines on the same frequency; the small talk is
  what makes the business read as being between people.
- L2403 · `({ a, b, rel, bucket }) => ({` — A third turn, taken only sometimes — see `exchange()`. Conversations that always
  run to the same length are as obviously mechanical as ones that always use the
  same words.
- L2480 · `subject: 'I',` — First person. A ship on an open channel with one other ship says "I am running
  Ostrava side", not "Nexis Drone 01 is running Ostrava side" — the third person
  is for a mayday, where the point is to broadcast which hull is in trouble.
- L2504 · `oreTip: {` — ── work: mining ───────────────────────────────────────────────────
- L2528 · `filesFrom: { type: 'gave-tip', weight: 0.8 },` — A tip is the smallest unit of the thing slice 11 turns into a tradeable good:
  knowledge with a source attached. Filing who told you is what later lets a
  character work out whose tips are worth anything.
- L2533 · `tipFollowUp: {` — The other half of a tip, and the reason filing one is worth the save space. A character
  that acted on a tip comes back and says whether it was any good, and *that* is what
  turns `gave-tip` into a reputation rather than a counter.
- L2563 · `filesFrom: { type: 'rated-source', weight: 1.4 },` — The payload: a judgement about the *source*, not about the rock. Slice 11 reads this
  to decide whether a character believes the next thing this speaker says.
- L2637 · `haulOffer: {` — ── work: hauling and trade ────────────────────────────────────────
- L2637 · `haulOffer: {` — The first topic that produces an *obligation* rather than only a memory. `offers` is
  read by systems/npc-comms.js: if the topic fires and the listener accepts, a deal goes
  on the ledger and the hauler flies it. That is the whole difference between a social
  layer that is state and one that acts.
- L2732 · `filesFrom: { type: 'completed-work', weight: 1.6 },` — A completed obligation, filed on both sides. This is what a reputation is made of:
  not that you were asked, but that you did it.
<!-- /note -->

#### <a id="s-TOPICS-when"></a>`TOPICS.when(a, b)`

prop · L2372–2372

- calls: [`engaged`](#s-engaged) ×2 · [`same`](#s-same)

<!-- note:TOPICS.when -->
<!-- /note -->

#### <a id="s-TOPICS-when-2"></a>`TOPICS.when~2(a, b, ctx)`

prop · L2401–2401

- calls: [`engaged`](#s-engaged) ×2 · [`hurt`](#s-hurt) · [`known`](#s-known) · [`same`](#s-same)

<!-- note:TOPICS.when~2 -->
<!-- /note -->

#### <a id="s-TOPICS-when-3"></a>`TOPICS.when~3(a, b, ctx)`

prop · L2444–2444

- calls: [`hurt`](#s-hurt) · [`known`](#s-known) · [`lowFuel`](#s-lowFuel) · [`same`](#s-same) · [`working`](#s-working)

<!-- note:TOPICS.when~3 -->
<!-- /note -->

#### <a id="s-TOPICS-when-4"></a>`TOPICS.when~4(a, b)`

prop · L2474–2474

- calls: [`engaged`](#s-engaged) · [`same`](#s-same) · [`transiting`](#s-transiting) · [`working`](#s-working)

<!-- note:TOPICS.when~4 -->
<!-- /note -->

#### <a id="s-TOPICS-when-5"></a>`TOPICS.when~5(a, b)`

prop · L2506–2506

- calls: [`anyRole`](#s-anyRole) · [`role`](#s-role)

<!-- note:TOPICS.when~5 -->
<!-- /note -->

#### <a id="s-TOPICS-when-6"></a>`TOPICS.when~6(a, b, ctx)`

prop · L2535–2535

- calls: [`has`](#s-has)

<!-- note:TOPICS.when~6 -->
<!-- /note -->

#### <a id="s-TOPICS-when-7"></a>`TOPICS.when~7(a, b, ctx)`

prop · L2570–2570

- calls: [`near`](#s-near) · [`role`](#s-role) ×2 · [`same`](#s-same)

<!-- note:TOPICS.when~7 -->
<!-- /note -->

#### <a id="s-TOPICS-when-8"></a>`TOPICS.when~8(a, b)`

prop · L2612–2612

- calls: [`anyRole`](#s-anyRole) · [`role`](#s-role)

<!-- note:TOPICS.when~8 -->
<!-- /note -->

#### <a id="s-TOPICS-when-9"></a>`TOPICS.when~9(a, b)`

prop · L2639–2639

- calls: [`laden`](#s-laden) · [`role`](#s-role) ×2

<!-- note:TOPICS.when~9 -->
<!-- /note -->

#### <a id="s-TOPICS-when-10"></a>`TOPICS.when~10(a, b)`

prop · L2677–2677

- calls: [`anyRole`](#s-anyRole) ×2 · [`same`](#s-same)

<!-- note:TOPICS.when~10 -->
<!-- /note -->

#### <a id="s-TOPICS-when-11"></a>`TOPICS.when~11(a, b, ctx)`

prop · L2713–2714

- calls: [`has`](#s-has)

<!-- note:TOPICS.when~11 -->
<!-- /note -->

#### <a id="s-TOPICS-when-12"></a>`TOPICS.when~12(a, b)`

prop · L2739–2739

- calls: [`anyRole`](#s-anyRole) · [`engaged`](#s-engaged)

<!-- note:TOPICS.when~12 -->
<!-- /note -->

#### <a id="s-TOPICS-when-13"></a>`TOPICS.when~13(a, b)`

prop · L2770–2770

- calls: [`fatFuel`](#s-fatFuel) · [`lowFuel`](#s-lowFuel) · [`near`](#s-near)

<!-- note:TOPICS.when~13 -->
<!-- /note -->

### <a id="s-when"></a>`when(a, b)`

prop · L2804–2804

- calls: [`armed`](#s-armed) · [`hurt`](#s-hurt) · [`same`](#s-same)

<!-- note:when -->
<!-- /note -->

### <a id="s-when-2"></a>`when~2(a, b)`

prop · L2844–2844

- calls: [`civilian`](#s-civilian) · [`far`](#s-far) · [`hurt`](#s-hurt) ×2 · [`lowFuel`](#s-lowFuel)

<!-- note:when~2 -->
<!-- /note -->

### <a id="s-when-3"></a>`when~3(a, b, ctx)`

prop · L2879–2879

- calls: [`armed`](#s-armed) · [`has`](#s-has)

<!-- note:when~3 -->
<!-- /note -->

### <a id="s-when-4"></a>`when~4(a, b)`

prop · L2904–2904

- calls: [`anyRole`](#s-anyRole) · [`badlyHurt`](#s-badlyHurt) · [`engaged`](#s-engaged)

<!-- note:when~4 -->
<!-- /note -->

### <a id="s-when-5"></a>`when~5(a, b)`

prop · L2939–2939

- calls: [`anyRole`](#s-anyRole) · [`hurt`](#s-hurt) · [`near`](#s-near)

<!-- note:when~5 -->
<!-- /note -->

### <a id="s-when-6"></a>`when~6(a, b)`

prop · L2966–2966

- calls: [`armed`](#s-armed) · [`civilian`](#s-civilian) · [`hurt`](#s-hurt) · [`laden`](#s-laden) · [`transiting`](#s-transiting)

<!-- note:when~6 -->
<!-- /note -->

### <a id="s-when-7"></a>`when~7(a, b, ctx)`

prop · L2997–2997

- calls: [`has`](#s-has) · [`hurt`](#s-hurt)

<!-- note:when~7 -->
<!-- /note -->

### <a id="s-when-8"></a>`when~8(a, b, ctx)`

prop · L3020–3021

- calls: [`has`](#s-has) · [`same`](#s-same)

<!-- note:when~8 -->
<!-- /note -->

### <a id="s-when-9"></a>`when~9(a, b, ctx)`

prop · L3051–3051

- calls: [`has`](#s-has)

<!-- note:when~9 -->
<!-- /note -->

### <a id="s-when-10"></a>`when~10(a, b, ctx)`

prop · L3077–3078

- calls: [`has`](#s-has)

<!-- note:when~10 -->
<!-- /note -->

### <a id="s-when-11"></a>`when~11(a, b)`

prop · L3106–3106

- calls: [`armed`](#s-armed) ×2 · [`same`](#s-same)

<!-- note:when~11 -->
<!-- /note -->

### <a id="s-when-12"></a>`when~12(a, b)`

prop · L3133–3133

- calls: [`armed`](#s-armed) ×2 · [`engaged`](#s-engaged) · [`near`](#s-near) · [`same`](#s-same)

<!-- note:when~12 -->
<!-- /note -->

### <a id="s-backOff"></a>`backOff`

const · L3154–3154

- calls: [`civilian`](#s-civilian) · [`cold`](#s-cold) · [`has`](#s-has) · [`hurt`](#s-hurt)

<!-- note:backOff -->
<!-- /note -->

### <a id="s-when-13"></a>`when~13(a, b, ctx)`

prop · L3173–3174

- calls: [`engaged`](#s-engaged) ×2 · [`has`](#s-has) · [`same`](#s-same)

<!-- note:when~13 -->
<!-- /note -->

### <a id="s-when-14"></a>`when~14(a, b, ctx)`

prop · L3199–3201

- calls: [`cold`](#s-cold) · [`has`](#s-has)

<!-- note:when~14 -->
<!-- /note -->

### <a id="s-when-15"></a>`when~15(a, b, ctx)`

prop · L3227–3227

- calls: [`has`](#s-has) · [`same`](#s-same)

<!-- note:when~15 -->
<!-- /note -->

### <a id="s-n"></a>`n`

const · L3231–3231

- calls: [`has`](#s-has)

<!-- note:n -->
<!-- /note -->

### <a id="s-when-16"></a>`when~16(a, b, ctx)`

prop · L3272–3273

- calls: [`has`](#s-has) ×2 · [`same`](#s-same)

<!-- note:when~16 -->
<!-- /note -->

### <a id="s-when-17"></a>`when~17(a, b)`

prop · L3296–3296

- calls: [`armed`](#s-armed) ×2 · [`engaged`](#s-engaged) · [`healthy`](#s-healthy) · [`same`](#s-same)

<!-- note:when~17 -->
<!-- /note -->

### <a id="s-when-18"></a>`when~18(a, b, ctx)`

prop · L3324–3324

- calls: [`has`](#s-has) · [`same`](#s-same)

<!-- note:when~18 -->
<!-- /note -->

### <a id="s-when-19"></a>`when~19(a, b, ctx)`

prop · L3354–3355

- calls: [`has`](#s-has) ×2 · [`same`](#s-same)

<!-- note:when~19 -->
<!-- /note -->

### <a id="s-wary"></a>`wary`

const · L3369–3369

- calls: [`has`](#s-has)

<!-- note:wary -->
<!-- /note -->

### <a id="s-when-20"></a>`when~20(a, b, ctx)`

prop · L3388–3388

- calls: [`has`](#s-has) · [`same`](#s-same)

<!-- note:when~20 -->
<!-- /note -->

### <a id="s-when-21"></a>`when~21(a, b, ctx)`

prop · L3415–3416

- calls: [`civilian`](#s-civilian) · [`has`](#s-has) ×2

<!-- note:when~21 -->
<!-- /note -->

### <a id="s-when-22"></a>`when~22(a, b)`

prop · L3441–3441

- calls: [`role`](#s-role)

<!-- note:when~22 -->
<!-- /note -->

### <a id="s-free"></a>`free`

const · L3452–3452

- calls: [`has`](#s-has)

<!-- note:free -->
<!-- /note -->

### <a id="s-when-23"></a>`when~23(a, b)`

prop · L3484–3484

- calls: [`docked`](#s-docked) ×2 · [`engaged`](#s-engaged)

<!-- note:when~23 -->
<!-- /note -->

### <a id="s-when-24"></a>`when~24(a, b, ctx)`

prop · L3511–3511

- calls: [`has`](#s-has)

<!-- note:when~24 -->
<!-- /note -->

### <a id="s-when-25"></a>`when~25(a, b)`

prop · L3548–3548

- calls: [`anyRole`](#s-anyRole) · [`engaged`](#s-engaged) · [`transiting`](#s-transiting)

<!-- note:when~25 -->
<!-- /note -->

### <a id="s-when-26"></a>`when~26(a, b, ctx)`

prop · L3582–3582

- calls: [`anyRole`](#s-anyRole) · [`has`](#s-has)

<!-- note:when~26 -->
<!-- /note -->

### <a id="s-when-27"></a>`when~27(a, b)`

prop · L3606–3606

- calls: [`anyRole`](#s-anyRole) · [`near`](#s-near) · [`same`](#s-same)

<!-- note:when~27 -->
<!-- /note -->

### <a id="s-when-28"></a>`when~28(a, b, ctx)`

prop · L3634–3634

- calls: [`has`](#s-has) · [`known`](#s-known) · [`same`](#s-same)

<!-- note:when~28 -->
<!-- /note -->

### <a id="s-c"></a>`c`

const · L3637–3637

- called by: [`runGrammarSelfTest`](#s-runGrammarSelfTest)

<!-- note:c -->
<!-- /note -->

### <a id="s-good"></a>`good`

const · L3638–3638

- calls: [`has`](#s-has)

<!-- note:good -->
<!-- /note -->

### <a id="s-when-29"></a>`when~29(a, b, ctx)`

prop · L3668–3669

- calls: [`has`](#s-has) ×2 · [`known`](#s-known)

<!-- note:when~29 -->
<!-- /note -->

### <a id="s-c-2"></a>`c~2`

const · L3672–3672

<!-- note:c~2 -->
<!-- /note -->

### <a id="s-when-30"></a>`when~30(a, b, ctx)`

prop · L3698–3698

- calls: [`docked`](#s-docked) · [`idle`](#s-idle) · [`known`](#s-known) · [`same`](#s-same)

<!-- note:when~30 -->
<!-- /note -->

### <a id="s-when-31"></a>`when~31(a, b, ctx)`

prop · L3723–3723

- calls: [`hurt`](#s-hurt) · [`known`](#s-known) · [`laden`](#s-laden)

<!-- note:when~31 -->
<!-- /note -->

### <a id="s-when-32"></a>`when~32(a, b, ctx)`

prop · L3753–3754

- calls: [`anyRole`](#s-anyRole) · [`has`](#s-has)

<!-- note:when~32 -->
<!-- /note -->

### <a id="s-guilty"></a>`guilty`

const · L3767–3767

- calls: [`cold`](#s-cold) · [`has`](#s-has)

<!-- note:guilty -->
<!-- /note -->

### <a id="s-when-33"></a>`when~33(a, b, ctx)`

prop · L3803–3804

- calls: [`has`](#s-has) ×2

<!-- note:when~33 -->
<!-- /note -->

### <a id="s-when-34"></a>`when~34(a, b, ctx)`

prop · L3838–3839

- calls: [`has`](#s-has)

<!-- note:when~34 -->
<!-- /note -->

### <a id="s-when-35"></a>`when~35(a, b, ctx)`

prop · L3877–3877

- calls: [`has`](#s-has)

<!-- note:when~35 -->
<!-- /note -->

### <a id="s-when-36"></a>`when~36(a, b, ctx)`

prop · L3913–3913

- calls: [`has`](#s-has)

<!-- note:when~36 -->
<!-- /note -->

### <a id="s-when-37"></a>`when~37(a, b, ctx)`

prop · L3947–3948

- calls: [`has`](#s-has) · [`role`](#s-role) ×2

<!-- note:when~37 -->
<!-- /note -->

### <a id="s-when-38"></a>`when~38(a, b, ctx)`

prop · L3985–3986

- calls: [`cold`](#s-cold) · [`has`](#s-has)

<!-- note:when~38 -->
<!-- /note -->

### <a id="s-when-39"></a>`when~39(a, b, ctx)`

prop · L4018–4019

- calls: [`has`](#s-has) ×2 · [`same`](#s-same)

<!-- note:when~39 -->
<!-- /note -->

### <a id="s-c-3"></a>`c~3`

const · L4022–4022

<!-- note:c~3 -->
<!-- /note -->

### <a id="s-when-40"></a>`when~40(a, b, ctx)`

prop · L4061–4062

- calls: [`anyRole`](#s-anyRole) ×2 · [`healthy`](#s-healthy) · [`known`](#s-known) · [`oldFriends`](#s-oldFriends) · [`same`](#s-same)

<!-- note:when~40 -->
<!-- /note -->

### <a id="s-when-41"></a>`when~41(a, b, ctx)`

prop · L4100–4100

- calls: [`has`](#s-has) · [`known`](#s-known) · [`same`](#s-same)

<!-- note:when~41 -->
<!-- /note -->

### <a id="s-when-42"></a>`when~42(a, b, ctx)`

prop · L4134–4134

- calls: [`hurt`](#s-hurt) · [`oldFriends`](#s-oldFriends) · [`same`](#s-same)

<!-- note:when~42 -->
<!-- /note -->

### <a id="s-when-43"></a>`when~43(a, b, ctx)`

prop · L4172–4172

- calls: [`anyRole`](#s-anyRole) · [`docked`](#s-docked) · [`same`](#s-same)

<!-- note:when~43 -->
<!-- /note -->

### <a id="s-when-44"></a>`when~44(a, b, ctx)`

prop · L4201–4201

- calls: [`anyRole`](#s-anyRole) · [`cold`](#s-cold) · [`known`](#s-known) · [`role`](#s-role)

<!-- note:when~44 -->
<!-- /note -->

### <a id="s-when-45"></a>`when~45(a, b, ctx)`

prop · L4232–4232

- calls: [`hurt`](#s-hurt) · [`idle`](#s-idle) · [`known`](#s-known) · [`same`](#s-same)

<!-- note:when~45 -->
<!-- /note -->

### <a id="s-when-46"></a>`when~46(a, b, ctx)`

prop · L4267–4268

- calls: [`has`](#s-has)

<!-- note:when~46 -->
<!-- /note -->

### <a id="s-when-47"></a>`when~47(a, b, ctx)`

prop · L4306–4306

- calls: [`familiar`](#s-familiar) · [`has`](#s-has)

<!-- note:when~47 -->
<!-- /note -->

### <a id="s-m"></a>`m`

const · L4309–4309

<!-- note:m -->
<!-- /note -->

### <a id="s-when-48"></a>`when~48(a, b, ctx)`

prop · L4348–4349

- calls: [`anyRole`](#s-anyRole) ×2 · [`has`](#s-has)

<!-- note:when~48 -->
<!-- /note -->

### <a id="s-when-49"></a>`when~49(a, b, ctx)`

prop · L4407–4408

- calls: [`armed`](#s-armed) · [`known`](#s-known) · [`role`](#s-role) ×2

<!-- note:when~49 -->
<!-- /note -->

### <a id="s-when-50"></a>`when~50(a, b, ctx)`

prop · L4442–4443

- calls: [`docked`](#s-docked) · [`hurt`](#s-hurt) · [`idle`](#s-idle) · [`known`](#s-known) · [`lowFuel`](#s-lowFuel) · [`same`](#s-same)

<!-- note:when~50 -->
<!-- /note -->

### <a id="s-when-51"></a>`when~51(a, b, ctx)`

prop · L4484–4484

- calls: [`docked`](#s-docked) · [`engaged`](#s-engaged) · [`idle`](#s-idle) · [`oldFriends`](#s-oldFriends)

<!-- note:when~51 -->
<!-- /note -->

### <a id="s-MEMORY_PHRASE"></a>`MEMORY_PHRASE`

const · L4524–4541

<!-- note:MEMORY_PHRASE -->
How a filed memory sounds when somebody brings it up out loud.
<!-- /note -->

### <a id="s-TOPIC_KEYS"></a>`TOPIC_KEYS`

const · **exported** · L4543–4543

<!-- note:TOPIC_KEYS -->
<!-- /note -->

### <a id="s-RESPONSE_OK"></a>`RESPONSE_OK`

const · **exported** · L4545–4554

<!-- note:RESPONSE_OK -->
═════════════════════════════════════════════════════════════════════
 5. THE EXCHANGE ENGINE
═════════════════════════════════════════════════════════════════════

Everything above is data. This is the part that walks it: which topic two ships raise,
who speaks when, how long the exchange runs, and what each side files afterwards.

It lives here rather than in systems/npc-comms.js because it is all *about* the table —
it reads fields the table declares and nothing else. npc-comms.js remains the thing that
knows about the world: who is in range, whose channel is busy, and when to call in.

═════════════════════════════════════════════════════════════════════
 4b. ADJACENCY, AND LEARNING TO TALK
═════════════════════════════════════════════════════════════════════

Two things that only exist once conversations run longer than two turns.

**Adjacency.** Some moves only make sense after some other moves. A question wants an
answer; an accusation wants a denial or an admission; an offer wants an acceptance or a
refusal. A reply that ignores what it is replying to is the most common kind of nonsense
left in the log, and it is nonsense that no amount of grammar checking can catch, because
each line on its own is fine. RESPONSE_OK is the table of what may follow what, and the
engine coerces a reply that breaks it rather than transmitting it.

**Learning.** A character keeps a bank of how it said things and how that landed: which
shape it used, on whom, about what, and what came back. Acceptance and thanks score
positively; being asked to repeat, being refused, or being accused in return scores
negatively. Next time it reaches for a shape, what worked before gets a heavier vote.

This is deliberately narrow. It does not invent phrasings and it cannot learn to say
anything the table could not already say — it learns *which of the things it can say
works on this listener*, which is the part of talking better that a generator can honestly
claim. A blunt hull that keeps getting refused drifts toward asking; one whose terse
reports keep getting queried drifts toward saying more.

Which moves may legitimately follow which. Anything not listed is a non sequitur.

- L4546 · `question:   ['statement', 'denial', 'commitment', 'question'],` — A question is answered with information, a refusal of it, or a promise to get it. It is
  not answered with "Lovely." — an expressive after a question is a listener who did not
  hear it, which is exactly how the log read.
<!-- /note -->

### <a id="s-COERCE_TO"></a>`COERCE_TO`

const · L4556–4565

<!-- note:COERCE_TO -->
The act a mismatched reply is rewritten to, given what it is replying to.
<!-- /note -->

### <a id="s-coerceResponse"></a>`coerceResponse(prevMove, msg)`

function · **exported** · L4567–4577

- called by: [`utterFromRecord`](#s-utterFromRecord) ×2

<!-- note:coerceResponse -->
Force a reply to be a legal response to what came before it.

Coercion changes the act, not the content: the facts the topic put in the record survive,
they are simply said as the kind of thing the previous turn was owed. A topic that answers
its own question with another statement gets that statement realised as an answer.

- L4573 · `delete out.frames;` — The pinned frames belonged to the old act and will not exist under the new one.
<!-- /note -->

### <a id="s-REACTION_VALUE"></a>`REACTION_VALUE`

const · L4579–4588

<!-- note:REACTION_VALUE -->
What a reaction is worth to the speaker who provoked it.

- L4580 · `commitment: 1.0,` — they agreed, or offered something back
- L4581 · `expressive: 0.6,` — thanks, or a clean acknowledgement
- L4582 · `statement: 0.3,` — they answered with something real
- L4584 · `question: -0.3,` — they had to ask, so the first line did not land
<!-- /note -->

### <a id="s-CONFUSION"></a>`CONFUSION`

const · L4590–4590

<!-- note:CONFUSION -->
<!-- /note -->

### <a id="s-pushCurve"></a>`pushCurve(arr, v, cap)`

function · L4592–4598

- called by: [`createSpeechMemory>choice`](#s-createSpeechMemory-choice) · [`createSpeechMemory>note`](#s-createSpeechMemory-note) · [`createSpeechMemory>react`](#s-createSpeechMemory-react)

<!-- note:pushCurve -->
The bank. One per world; the director owns it and passes it into every exchange.

Rows are keyed speaker → listener → topic → frame, because all four matter: a shape that
works on a familiar hauler in a trade negotiation is not the shape that works on a patrol
during a contact call.

Append to a curve buffer that has to cover the *whole* run rather than the recent part of
it. Dropping the oldest sample on overflow is the obvious thing and it is wrong here: a
training run of eighty thousand lines against a twenty thousand sample buffer means every
bucket of the curve is late-stage, so the curve is flat by construction and says nothing
about whether anything improved. Halving instead keeps the span and loses resolution,
which is the right trade for a scoreboard.
<!-- /note -->

### <a id="s-createSpeechMemory"></a>`createSpeechMemory(opts=)`

function · **exported** · L4600–4852

- called by: [`createWorld`](#s-createWorld)

<!-- note:createSpeechMemory -->
- L4602 · `const priors = new Map();` — Priors, keyed by speaker and shape without the listener. A row for one listener is thin
  evidence — a hauler might have used one phrasing on one patrol twice — and with a crew
  of thirty the specific rows stay thin for a very long time. The prior is what a ship has
  learned about a shape *in general*, and a thin specific row leans on it until it has
  enough of its own evidence to stand up. This is why a bigger population makes the
  learning better rather than merely slower: every exchange feeds a prior that every other
  listener benefits from.
- L4603 · `const pairs = new Map();` — Per-pair totals, kept in step with the rows so `styleFor` never has to scan.
- L4604 · `const dials = new Map();` — Delivery dials, per pair. Three switchable things a speaker can do to a line — hedge it,
  dress it with a marker, make it longer or shorter — each scored on and off, so the bank
  can say not just "this shape works on that hull" but "that hull does not want to be
  hedged at". This is the part that makes training change how a ship talks rather than
  only which sentence it picks.
- L4626 · `const priorWeight = opts.priorWeight || 4;` — how many observations the prior is worth
- L4635 · `const history = [];` — Every reaction, in order, so the demo and the tests can show whether the bank is
  actually getting better rather than merely getting bigger.
- L4636 · `const felt = [];` — How lines *landed*, separately from what came back. The reply's move is dictated by the
  topic script and swamps everything else in the raw reaction curve; the reception figure
  is the part the speaker's own delivery controls, so it is the honest scoreboard for
  whether training is teaching anybody to talk better.
<!-- /note -->

#### <a id="s-createSpeechMemory-dialsOf"></a>`createSpeechMemory>dialsOf(k)`

function · L4605–4615

- called by: [`createSpeechMemory>note`](#s-createSpeechMemory-note) · [`createSpeechMemory>react`](#s-createSpeechMemory-react)

<!-- note:createSpeechMemory>dialsOf -->
- L4611 · `short: { n: 0, s: 0 }, mid: { n: 0, s: 0 }, long: { n: 0, s: 0 }, pending: null };` — Three length buckets rather than two. Long-versus-short can only ever say
  "more" or "less", so a speaker talking to a hull that wants *middling* lines
  oscillates between the extremes and never lands. Three buckets let the bank
  name a target instead of a direction.
<!-- /note -->

#### <a id="s-createSpeechMemory-dialMean"></a>`createSpeechMemory>dialMean(a, b)`

function · L4616–4619

- called by: [`createSpeechMemory.dialsFor`](#s-createSpeechMemory-dialsFor) ×3 · [`createSpeechMemory>styleFor>dial`](#s-createSpeechMemory-styleFor-dial)

<!-- note:createSpeechMemory>dialMean -->
<!-- /note -->

#### <a id="s-createSpeechMemory-pairOf"></a>`createSpeechMemory>pairOf(k)`

function · L4620–4624

- called by: [`createSpeechMemory>note`](#s-createSpeechMemory-note) · [`createSpeechMemory>react`](#s-createSpeechMemory-react)

<!-- note:createSpeechMemory>pairOf -->
<!-- /note -->

#### <a id="s-createSpeechMemory-key"></a>`createSpeechMemory>key(sp, li, topic, frame)`

function · L4627–4627

- called by: [`createSpeechMemory>bias`](#s-createSpeechMemory-bias) · [`createSpeechMemory>choice>meanOf`](#s-createSpeechMemory-choice-meanOf) · [`createSpeechMemory>note`](#s-createSpeechMemory-note)

<!-- note:createSpeechMemory>key -->
<!-- /note -->

#### <a id="s-createSpeechMemory-priorKey"></a>`createSpeechMemory>priorKey(sp, frame)`

function · L4628–4628

- called by: [`createSpeechMemory>bias`](#s-createSpeechMemory-bias) · [`createSpeechMemory>choice>meanOf`](#s-createSpeechMemory-choice-meanOf) · [`createSpeechMemory>note`](#s-createSpeechMemory-note) ×2 · [`createSpeechMemory>priorOf`](#s-createSpeechMemory-priorOf)

<!-- note:createSpeechMemory>priorKey -->
<!-- /note -->

#### <a id="s-createSpeechMemory-prior"></a>`createSpeechMemory>prior(k)`

function · L4630–4633

- called by: [`createSpeechMemory>note`](#s-createSpeechMemory-note) · [`createSpeechMemory>react`](#s-createSpeechMemory-react)

<!-- note:createSpeechMemory>prior -->
<!-- /note -->

#### <a id="s-createSpeechMemory-row"></a>`createSpeechMemory>row(k)`

function · L4641–4651

- called by: [`createSpeechMemory>note`](#s-createSpeechMemory-note)

<!-- note:createSpeechMemory>row -->
- L4643 · `if (rows.size >= cap) {` — Evict before inserting, and never consider the row being created — the first version
  evicted the least-tried row *after* adding the new one, which is always the new one,
  so every write past the cap threw the row away and handed back undefined.
<!-- /note -->

#### <a id="s-createSpeechMemory-bias"></a>`createSpeechMemory>bias(sp, li, topic, frame)`

function · L4653–4664

- calls: [`createSpeechMemory>key`](#s-createSpeechMemory-key) · [`createSpeechMemory>priorKey`](#s-createSpeechMemory-priorKey)

<!-- note:createSpeechMemory>bias -->
How much a speaker favours a shape, as a multiplier on its score.

Untried shapes sit slightly above neutral, so a character keeps experimenting instead of
settling on the first thing that worked — the failure mode of every bandit that starts
greedy is a character with one sentence.

- L4658 · `if ((!r || !r.tries) && pMean == null) return 1.08;` — Nothing anywhere: sit slightly above neutral so the ship keeps experimenting. The
  failure mode of a greedy bandit is a character with one sentence.
- L4660 · `const n = r ? r.tries : 0;` — Shrinkage. The specific row is believed in proportion to how much of it there is;
  what it lacks is made up from what this speaker knows about the shape generally.
<!-- /note -->

#### <a id="s-createSpeechMemory-priorOf"></a>`createSpeechMemory>priorOf(sp, frame)`

function · L4666–4669

- calls: [`createSpeechMemory>priorKey`](#s-createSpeechMemory-priorKey)

<!-- note:createSpeechMemory>priorOf -->
What this speaker has learned about a shape irrespective of who it was talking to.
<!-- /note -->

#### <a id="s-createSpeechMemory-note"></a>`createSpeechMemory>note(sp, li, topic, frame, move, at, feat=)`

function · L4671–4685

- calls: [`createSpeechMemory>dialsOf`](#s-createSpeechMemory-dialsOf) · [`createSpeechMemory>key`](#s-createSpeechMemory-key) · [`createSpeechMemory>pairOf`](#s-createSpeechMemory-pairOf) · [`createSpeechMemory>prior`](#s-createSpeechMemory-prior) · [`createSpeechMemory>priorKey`](#s-createSpeechMemory-priorKey) ×2 · [`createSpeechMemory>row`](#s-createSpeechMemory-row) · [`pushCurve`](#s-pushCurve)

<!-- note:createSpeechMemory>note -->
Record that a shape was used. Returns a handle to credit when the reaction arrives.

- L4678 · `if (p.tries >= 3) pushCurve(choices, p.score / p.tries, historyCap);` — Record how good this shape looked *before* it was used. Averaged over time this is the
  honest measure of whether the bank is steering anything: the raw reaction curve moves
  with whatever topics happened to come up, but the quality of the shapes a speaker
  reaches for is a property of the policy alone.
<!-- /note -->

#### <a id="s-createSpeechMemory-react"></a>`createSpeechMemory>react(handle, reactionMove, reactionText, extra=)`

function · L4687–4716

- calls: [`createSpeechMemory>dialsOf`](#s-createSpeechMemory-dialsOf) · [`createSpeechMemory>pairOf`](#s-createSpeechMemory-pairOf) · [`createSpeechMemory>prior`](#s-createSpeechMemory-prior) · [`pushCurve`](#s-pushCurve)

<!-- note:createSpeechMemory>react -->
Credit a handle with what came back.

- L4689 · `let v = REACTION_VALUE[reactionMove] != null ? REACTION_VALUE[reactionMove] : 0;` — Two sources of credit. The move that came back says whether the line got what it
  wanted; `extra` is the world's account of how it landed on *this* listener — a long
  hedged sentence to a ship with no patience for them, an order to somebody who does not
  take orders. Without the second, the bank could only learn which topics go well, which
  is a fact about the table and not about how the speaker talks.
- L4700 · `` const d = dialsOf(`${handle.sp}|${handle.li}`); `` — Dials are credited with the reception figure alone, never with the combined score.
  The move that came back is dictated by the topic — a haggle answers a price with a
  refusal whatever you do — so folding it in buries a ±0.3 signal about delivery
  under ±1.1 of noise about what the conversation was, and the dials never converge.
- L4711 · `if (handle.pk) prior(handle.pk).score += v;` — The prior is credited even when the specific row has been evicted: what a ship has
  learned about its own habits should outlive its memory of one particular listener.
<!-- /note -->

#### <a id="s-createSpeechMemory-bucketMeans"></a>`createSpeechMemory>bucketMeans(arr, buckets)`

function · L4718–4727

- called by: [`createSpeechMemory>advantageCurve`](#s-createSpeechMemory-advantageCurve) · [`createSpeechMemory>choiceCurve`](#s-createSpeechMemory-choiceCurve) · [`createSpeechMemory>curve`](#s-createSpeechMemory-curve) · [`createSpeechMemory>feltCurve`](#s-createSpeechMemory-feltCurve)

<!-- note:createSpeechMemory>bucketMeans -->
The learning curve: mean reaction value over successive windows of reactions. Rising
means the bank is steering the choice of shape toward the ones that land. Flat means it
is only getting bigger, which is the thing worth being able to tell apart.
<!-- /note -->

#### <a id="s-createSpeechMemory-choice"></a>`createSpeechMemory>choice(sp, chosen, candidates, li=, topic=)`

function · L4729–4748

- calls: [`createSpeechMemory>choice>meanOf`](#s-createSpeechMemory-choice-meanOf) · [`pushCurve`](#s-pushCurve)

<!-- note:createSpeechMemory>choice -->
Score a choice against the alternatives it was made among.

The advantage is the chosen shape's standing minus the average standing of everything
that was available. Positive means the speaker reached past the worse options; zero
means it might as well have picked at random. This is the number that says whether the
bank is doing anything, and it is immune to the topic mix, which the raw outcome curve
is not.
<!-- /note -->

##### <a id="s-createSpeechMemory-choice-meanOf"></a>`createSpeechMemory>choice>meanOf(f)`

function · L4731–4738

- calls: [`createSpeechMemory>key`](#s-createSpeechMemory-key) · [`createSpeechMemory>priorKey`](#s-createSpeechMemory-priorKey)
- called by: [`createSpeechMemory>choice`](#s-createSpeechMemory-choice)

<!-- note:createSpeechMemory>choice>meanOf -->
Measured against what the *policy* actually optimises: the pair-specific row where
there is one, and the speaker-level prior where there is not. Scoring on priors alone
averaged every listener together, which is precisely where the learnable signal lives
— a shape that suits one hull and annoys another has a prior of nothing, so the curve
came out flat no matter how well the bank was doing its job.
<!-- /note -->

#### <a id="s-createSpeechMemory-curve"></a>`createSpeechMemory>curve(buckets=)`

function · L4750–4750

- calls: [`createSpeechMemory>bucketMeans`](#s-createSpeechMemory-bucketMeans)

<!-- note:createSpeechMemory>curve -->
Raw outcomes over time. Moves with the topic mix as much as with the policy.
<!-- /note -->

#### <a id="s-createSpeechMemory-choiceCurve"></a>`createSpeechMemory>choiceCurve(buckets=)`

function · L4752–4752

- calls: [`createSpeechMemory>bucketMeans`](#s-createSpeechMemory-bucketMeans)

<!-- note:createSpeechMemory>choiceCurve -->
Choice quality over time: how well-regarded, on this speaker's own evidence, were the
shapes it reached for. Rising means the bank is being used and not merely filled.
<!-- /note -->

#### <a id="s-createSpeechMemory-feltCurve"></a>`createSpeechMemory>feltCurve(buckets=)`

function · L4754–4754

- calls: [`createSpeechMemory>bucketMeans`](#s-createSpeechMemory-bucketMeans)

<!-- note:createSpeechMemory>feltCurve -->
How well delivered lines landed, over time. The training scoreboard.
<!-- /note -->

#### <a id="s-createSpeechMemory-feltMean"></a>`createSpeechMemory>feltMean()`

function · L4755–4755

<!-- note:createSpeechMemory>feltMean -->
<!-- /note -->

#### <a id="s-createSpeechMemory-advantageCurve"></a>`createSpeechMemory>advantageCurve(buckets=)`

function · L4757–4757

- calls: [`createSpeechMemory>bucketMeans`](#s-createSpeechMemory-bucketMeans)

<!-- note:createSpeechMemory>advantageCurve -->
Advantage over the alternatives, bucketed over time. The policy's own scoreboard.
<!-- /note -->

#### <a id="s-createSpeechMemory-advantageMean"></a>`createSpeechMemory>advantageMean()`

function · L4758–4759

<!-- note:createSpeechMemory>advantageMean -->
<!-- /note -->

#### <a id="s-createSpeechMemory-styleFor"></a>`createSpeechMemory>styleFor(sp, li)`

function · L4761–4803

- calls: [`createSpeechMemory>styleFor>bandMean`](#s-createSpeechMemory-styleFor-bandMean) · [`createSpeechMemory>styleFor>dial`](#s-createSpeechMemory-styleFor-dial) ×5 · [`createSpeechMemory>styleFor>scale`](#s-createSpeechMemory-styleFor-scale) ×3

<!-- note:createSpeechMemory>styleFor -->
Style drift: what this speaker has learned about talking to this listener in general,
as multipliers the realiser's profile can take directly. Being asked to repeat pushes a
character toward saying more and hedging less; being refused pushes it toward asking
rather than telling.

- L4762 · `` const agg = pairs.get(`${sp}|${li}`); `` — Read from a running aggregate rather than by scanning the bank. This function is
  called once per turn and the first version walked every row in it with a string
  prefix test — at forty ships and thirty thousand rows it was, on its own, two thirds
  of the entire cost of running the world, and the reason a long training run was not
  practical. The aggregate is maintained in note() and react(), which already know the
  pair they are writing about.
- L4783 · `if (spread > 0.06) best = { words: top.words, pref: top.pref };` — Only act on a preference that is worth acting on. Below the noise floor the ship
  keeps its own habits, which is also what a person does.
- L4793 · `wordsMul: 1,` — Longer lines scoring better means this listener wants more words, so the ceiling on
  sentence length goes up rather than down.
- L4793 · `wordsMul: 1,` — superseded by targetWords below; kept for callers
<!-- /note -->

##### <a id="s-createSpeechMemory-styleFor-dial"></a>`createSpeechMemory>styleFor>dial(on, off)`

function · L4770–4770

- calls: [`createSpeechMemory>dialMean`](#s-createSpeechMemory-dialMean)
- called by: [`createSpeechMemory>styleFor`](#s-createSpeechMemory-styleFor) ×5

<!-- note:createSpeechMemory>styleFor>dial -->
Each dial is the difference between how lines landed with the feature and without it,
on this listener. A clear negative difference turns the feature down; a clear positive
one turns it up. Differences below the noise floor leave the dial alone, so a speaker
does not rebuild its manner on three data points.
<!-- /note -->

##### <a id="s-createSpeechMemory-styleFor-bandMean"></a>`createSpeechMemory>styleFor>bandMean(k)`

function · L4772–4772

- called by: [`createSpeechMemory>styleFor`](#s-createSpeechMemory-styleFor)

<!-- note:createSpeechMemory>styleFor>bandMean -->
Which length band this listener actually rewards. Reported as a word target and as a
direction, because the realiser uses both: the target sets the trim, and the direction
biases frame choice toward shapes that fill more or fewer slots.
<!-- /note -->

##### <a id="s-createSpeechMemory-styleFor-scale"></a>`createSpeechMemory>styleFor>scale(diff, floor, ceil)`

function · L4786–4787

- called by: [`createSpeechMemory>styleFor`](#s-createSpeechMemory-styleFor) ×3

<!-- note:createSpeechMemory>styleFor>scale -->
Gain. The first version used a gain of 1.4, which moved a strongly disliked habit from
"usual" to "slightly less usual" — enough to see in the dials and not enough to see in
the transmissions. At 3.0 a habit this listener has consistently punished effectively
stops, which is what learning is supposed to look like from the outside.
<!-- /note -->

#### <a id="s-createSpeechMemory-report"></a>`createSpeechMemory>report(sp, limit=)`

function · L4805–4815

<!-- note:createSpeechMemory>report -->
What has this character learned? For the debug overlay, and for reading by eye.
<!-- /note -->

#### <a id="s-createSpeechMemory-serialise"></a>`createSpeechMemory>serialise()`

function · L4817–4821

<!-- note:createSpeechMemory>serialise -->
The priors are saved too, and they are the half worth saving: they are small, they
generalise, and a reload that keeps them keeps the character's habits even if it has
forgotten which particular hull taught them.
<!-- /note -->

#### <a id="s-createSpeechMemory-restore"></a>`createSpeechMemory>restore(blob)`

function · L4822–4827

<!-- note:createSpeechMemory>restore -->
<!-- /note -->

#### <a id="s-createSpeechMemory-dialsFor"></a>`createSpeechMemory.dialsFor(sp, li)`

prop · L4830–4846

- calls: [`createSpeechMemory.dialsFor>band`](#s-createSpeechMemory-dialsFor-band) ×3 · [`createSpeechMemory>dialMean`](#s-createSpeechMemory-dialMean) ×3

<!-- note:createSpeechMemory.dialsFor -->
<!-- /note -->

##### <a id="s-createSpeechMemory-dialsFor-band"></a>`createSpeechMemory.dialsFor>band(k)`

function · L4833–4833

- called by: [`createSpeechMemory.dialsFor`](#s-createSpeechMemory-dialsFor) ×3

<!-- note:createSpeechMemory.dialsFor>band -->
<!-- /note -->

#### <a id="s-createSpeechMemory-size"></a>`createSpeechMemory.size()`

prop · L4848–4848

<!-- note:createSpeechMemory.size -->
<!-- /note -->

#### <a id="s-createSpeechMemory-priorCount"></a>`createSpeechMemory.priorCount()`

prop · L4849–4849

<!-- note:createSpeechMemory.priorCount -->
<!-- /note -->

#### <a id="s-createSpeechMemory-reactions"></a>`createSpeechMemory.reactions()`

prop · L4850–4850

<!-- note:createSpeechMemory.reactions -->
<!-- /note -->

### <a id="s-CODA"></a>`CODA`

const · L4854–4931

- calls: [`chooseFrom`](#s-chooseFrom) ×10 · [`nameFor`](#s-nameFor)

<!-- note:CODA -->
Codas — the turns a conversation takes after its business is done.

Half of every exchange stopped at two turns, not because two was right but because most
topics were written with two entries in `say`. Two turns is a transaction: one ship states,
the other acknowledges, channel closed. Real radio does that too, but it also does the
thing that comes after — the follow-up question, the promise, the last word — and a band
made entirely of transactions is the flatness you can hear.

A coda is generated from the *move* the exchange has reached rather than from the topic, so
it works for all sixty-odd topics without any of them being rewritten. Each one is a real
conversational move with its own intent: press for detail, commit, close, or hand back.
<!-- /note -->

### <a id="s-codaFor"></a>`codaFor(prevMove, ctx, turn)`

function · L4933–4954

- calls: [`cold`](#s-cold) · [`familiar`](#s-familiar) · [`makeRng.pick`](#s-makeRng-pick) · [`oldFriends`](#s-oldFriends)
- called by: [`exchange`](#s-exchange)

<!-- note:codaFor -->
Should this exchange keep going past its script, and if so, what with?

Codas are for conversations that were going somewhere — familiar pairs, and exchanges that
ended on a move that wants an answer. A cold pair that has said its piece stops.

- L4944 · `if (prevMove === 'question' || prevMove === 'accusation') chance = 0.9;` — these are owed a reply
- L4945 · `chance -= turn * 0.12;` — and everything ends
- L4948 · `const asking = pool.filter(fn => /act: 'ask'/.test(String(fn)));` — When the calibration says the band is short of questions, prefer the coda that asks one.
<!-- /note -->

### <a id="s-utter"></a>`utter(key, turn, ctx)`

function · **exported** · L4956–4959

- calls: [`utterRecord`](#s-utterRecord)

<!-- note:utter -->
Produce one turn of an exchange.

Prefers the generated path (`say`) and falls back to a topic's legacy `lines` if it has
not been converted, so a half-converted table still speaks.

A turn function may return a single semantic record or an array of them; an array is
realised as one transmission with the sentences proofed together, which is how a
character says two things on one press of the key.

@param {string} key   topic key, used as part of the anti-repetition bucket
@param {number} turn  0 = opener, 1 = reply, 2+ = continuation
@param {object} ctx   { a, b, rel, rng, ...world callbacks }
<!-- /note -->

### <a id="s-utterRecord"></a>`utterRecord(key, turn, ctx, prev=)`

function · **exported** · L4961–4980

- calls: [`bucketFor`](#s-bucketFor) · [`pairBucket`](#s-pairBucket) · [`utterFromRecord`](#s-utterFromRecord)
- called by: [`exchange`](#s-exchange) · [`utter`](#s-utter)

<!-- note:utterRecord -->
The same turn, with everything the engine needs to keep the conversation coherent and to
learn from it: the move it made, the frame it used, and the handle to credit when the
reply arrives.

@param {object} prev  the previous turn's result, for adjacency and crediting

- L4965 · `const pair = pairBucket(ctx.a, ctx.b, key);` — The phrase pools a topic draws from are shared across the exchange, so a reply cannot
  echo the line it is answering. Frame and furniture choice stay speaker-scoped: two
  people using the same sentence shape is how conversation sounds, and two people using
  the same words is how a tape loop sounds.
- L4970 · `catch (e) { return null; }` — a bad turn function is a dropped line, not a crash
<!-- /note -->

### <a id="s-utterFromRecord"></a>`utterFromRecord(key, record, ctx, prev=, turn=)`

function · **exported** · L4982–5039

- calls: [`bucketFor`](#s-bucketFor) · [`coerceResponse`](#s-coerceResponse) ×2 · [`cold`](#s-cold) · [`familiarity`](#s-familiarity) · [`moveOf`](#s-moveOf) · [`pairBucket`](#s-pairBucket) · [`profileFor`](#s-profileFor) · [`realise`](#s-realise) · [`realiseAll`](#s-realiseAll) · [`registerOf`](#s-registerOf) · [`same`](#s-same)
- called by: [`exchange`](#s-exchange) · [`utterRecord`](#s-utterRecord)

<!-- note:utterFromRecord -->
Realise an already-built record as a turn: adjacency, register, the learned style, the
phrasing bank, and the credit for whatever the previous line drew out.

Split out of `utterRecord` so a generated coda goes through exactly the same machinery a
scripted turn does. A coda that skipped the learning loop would be a turn nobody could
learn from, which is the opposite of the point.

- L4989 · `if (prev && prev.move) {` — Adjacency: a reply that does not answer what it is replying to gets rewritten into
  something that does, before a word of it is realised.
- L4996 · `const style = (ctx.speech && ctx.learning !== false)` — `ctx.learning === false` runs the same world with the bank recording but not steering:
  the control arm for measuring whether any of this works.
- L5003 · `const lengthPref = Math.max(-1, Math.min(1,` — What this speaker has learned about this listener, applied as adjustments rather than
  as a different register: a hauler who keeps having to repeat itself to one patrol does
  not become a different character, it becomes clearer with that patrol.
  The learned length preference, expressed as a frame-choice bias as well as a trim
  threshold: -1 says this listener wants less, +1 says it wants more.
  The learned per-listener preference, plus whatever the corpus calibration says about
  the band as a whole. One is about this hull; the other is about the log being measurably
  terser than conversation is.
- L5008 · `if (style.targetWords) profile.maxWords = style.targetWords;` — A learned target replaces the register's default ceiling outright. Multiplying the
  register's own number could only nudge; a ship that has worked out this listener
  wants eight words should be aiming at eight, not at nineteen scaled down a bit.
- L5032 · `if (prev && prev.handle && ctx.speech) {` — Credit the line this one answered, now that we know what it drew out.
- L5033 · `const felt = ctx.reception ? ctx.reception(ctx.a, prev.text, prev.move, prev.frame) : 0;` — ctx.a is the one who just heard the previous line, so it is ctx.a's taste that
  decides how that line landed.
<!-- /note -->

#### <a id="s-utterFromRecord-onFrame"></a>`utterFromRecord.onFrame(id, move, text, feat)`

prop · L5017–5017

<!-- note:utterFromRecord.onFrame -->
<!-- /note -->

#### <a id="s-utterFromRecord-bias"></a>`utterFromRecord.bias(id)`

prop · L5019–5019

<!-- note:utterFromRecord.bias -->
<!-- /note -->

#### <a id="s-utterFromRecord-choice"></a>`utterFromRecord.choice(chosen, offered)`

prop · L5020–5020

<!-- note:utterFromRecord.choice -->
<!-- /note -->

### <a id="s-turnsFor"></a>`turnsFor(key, ctx)`

function · **exported** · L5041–5056

- calls: [`cold`](#s-cold) · [`familiar`](#s-familiar) · [`oldFriends`](#s-oldFriends)
- called by: [`exchange`](#s-exchange)

<!-- note:turnsFor -->
How many turns this exchange should actually run.

Not simply `say.length`. A conversation that always runs to its maximum is as obviously
mechanical as one that always uses the same words: two ships that know each other well
talk longer, an urgent exchange is cut short by the situation it is about, and a cold
pair stop as soon as the business is done. The floor is two, because one line is a
broadcast rather than an exchange.

- L5048 · `let chance = 0.62 + (CALIBRATION.codaLift || 0) * 0.25;` — Two turns is a transaction, not a conversation, and two thirds of all exchanges were
  stopping there — which is what a channel of nothing but call-and-response reads like.
  The baseline is now better than even, and the modifiers move it from there.
- L5052 · `if (t.urgent) chance -= 0.15;` — urgency truncates; the situation interrupts
- L5053 · `if (t.offers) chance += 0.25;` — a deal needs closing, so it runs to the end
- L5054 · `if ((t.say || []).some(fn => /accuse|deny|admit/.test(String(fn)))) chance += 0.3;` — An argument that stops after two lines is two people stating positions. The moves that
  open a dispute nearly always run their full arc.
<!-- /note -->

### <a id="s-exchange"></a>`exchange(key, ctx, opts=)`

function · **exported** · L5058–5090

- calls: [`codaFor`](#s-codaFor) · [`turnsFor`](#s-turnsFor) · [`utterFromRecord`](#s-utterFromRecord) · [`utterRecord`](#s-utterRecord)
- called by: [`chatter`](../npc/speech.js.md#s-chatter) _js/npc/speech.js_ · [`checkExchanges`](#s-checkExchanges) · [`checkVariety`](#s-checkVariety) · [`createWorld>tick`](#s-createWorld-tick) · [`sampleTraffic`](#s-sampleTraffic)

<!-- note:exchange -->
Run a whole exchange and return it as a transcript.

The speakers alternate, so `a` and `b` swap on every turn — which is why the reply
functions in the table are written from the responder's point of view. `stopIf` lets
npc-comms.js cut an exchange short when the world changes underneath it: a ship that
jumps out mid-conversation should leave the sentence unfinished, not finish it politely
from somewhere else.

@returns {Array<{ speaker, listener, text, turn }>}

- L5065 · `const memo = {};` — One scratchpad for the whole exchange. Turn functions that have to decide something —
  whether this hauler really did short the load, whether the deal closes — write it here
  and every later turn reads the same answer. Deciding per turn is what produced an
  exchange that denied something in one line and admitted it in the next.
- L5072 · `let res;` — Past the end of the topic's own script, the exchange continues on generated codas for
  as long as the last move is one that wants answering.
- L5085 · `if (prev && prev.handle && ctx.speech) {` — The last line of an exchange never gets a reply, so nothing would ever credit it. Close
  the loop with the listener's silence, which is worth slightly less than nothing: a line
  that ends a conversation is not necessarily a bad line, but it is not a good one either.
  `react` takes the handle, not the record. Passing the record meant the closing credit
  silently did nothing, so the last line of every exchange was never scored.
<!-- /note -->

### <a id="s-availableTopics"></a>`availableTopics(a, b, ctx)`

function · **exported** · L5092–5099

- called by: [`checkSelection`](#s-checkSelection) · [`chooseTopic`](#s-chooseTopic)

<!-- note:availableTopics -->
Topics these two could raise right now, with weights.
`ctx` carries the callbacks a `when` clause may need — see systems/npc-comms.js.

- L5096 · `try { if (t.when(a, b, ctx)) out.push(k); } catch (e) {` — a bad clause is not a crash
<!-- /note -->

### <a id="s-scoreTopic"></a>`scoreTopic(key, a, b, ctx)`

function · **exported** · L5101–5135

- calls: [`cold`](#s-cold) · [`engaged`](#s-engaged) · [`has`](#s-has) ×3 · [`hurt`](#s-hurt) · [`oldFriends`](#s-oldFriends) · [`strangers`](#s-strangers)
- called by: [`checkSelection`](#s-checkSelection) ×4 · [`chooseTopic`](#s-chooseTopic)

<!-- note:scoreTopic -->
Score a topic for this pair, right now.

The scoring is where the table stops being a lottery. Four things move a weight:

  priority     a distress call beats small talk, always and by a lot
  recency      a topic raised recently by this pair is heavily discounted, which is what
               stops a channel becoming one subject repeated
  chaining     a topic named in the `chains` of the pair's last exchange is boosted, so a
               conversation develops instead of resetting
  relationship familiarity opens some topics up and closes others; strangers do not
               gossip about third parties, and old friends rarely re-introduce themselves

- L5132 · `if (t.urgent && (hurt(a) || engaged(a) || (has(ctx, 'threatNear') && ctx.threatNear(a))))` — Urgency dominates when the world is urgent. A hazard warning outranks a price haggle
  even between two traders who have been arguing about the price all shift.
<!-- /note -->

### <a id="s-chooseTopic"></a>`chooseTopic(a, b, ctx)`

function · **exported** · L5137–5146

- calls: [`availableTopics`](#s-availableTopics) · [`scoreTopic`](#s-scoreTopic)
- called by: [`chatter`](../npc/speech.js.md#s-chatter) _js/npc/speech.js_ · [`createWorld>tick`](#s-createWorld-tick) · [`sampleTraffic`](#s-sampleTraffic)

<!-- note:chooseTopic -->
Pick a topic for this pair. Returns null if nothing fits, which is a normal and important
outcome: two ships with nothing to say to each other should be silent, not reaching for
the least implausible thing in the table.
<!-- /note -->

### <a id="s-memoriesFrom"></a>`memoriesFrom(key, ctx)`

function · **exported** · L5148–5171

- calls: [`has`](#s-has) · [`memoriesFrom>build`](#s-memoriesFrom-build) ×2
- called by: [`commit`](../npc/speech.js.md#s-commit) _js/npc/speech.js_ · [`checkExchanges`](#s-checkExchanges) · [`createWorld>commit`](#s-createWorld-commit)

<!-- note:memoriesFrom -->
The memory records an exchange leaves behind, resolved against the pair.

Returned rather than written, so the caller owns persistence and this file stays a pure
function of the table. `aboutThirdParty` entries carry the third party as their subject,
which is what makes gossip land on the right character.
<!-- /note -->

#### <a id="s-memoriesFrom-build"></a>`memoriesFrom>build(spec, holder, subject)`

function · L5154–5166

- calls: [`has`](#s-has)
- called by: [`memoriesFrom`](#s-memoriesFrom) ×2

<!-- note:memoriesFrom>build -->
<!-- /note -->

### <a id="s-obligationFrom"></a>`obligationFrom(key, ctx, accepted=)`

function · **exported** · L5173–5183

- calls: [`has`](#s-has)
- called by: [`commit`](../npc/speech.js.md#s-commit) _js/npc/speech.js_ · [`createWorld>commit`](#s-createWorld-commit)

<!-- note:obligationFrom -->
The obligation an exchange puts on the ledger, if the listener accepted.
<!-- /note -->

### <a id="s-chainsOf"></a>`chainsOf(key)`

function · **exported** · L5185–5185

<!-- note:chainsOf -->
Topics this exchange makes plausible next. Read by scoreTopic via ctx.lastTopic.
<!-- /note -->

### <a id="s-CHANNELS"></a>`CHANNELS`

const · **exported** · L5187–5187

<!-- note:CHANNELS -->
Every channel the table can put traffic on — for the comms UI's band filter.
<!-- /note -->

### <a id="s-topicStats"></a>`topicStats()`

function · **exported** · L5189–5200

- called by: [`createWorld.stats`](#s-createWorld-stats) · [`runTopicSelfTest`](#s-runTopicSelfTest)

<!-- note:topicStats -->
Diagnostics for the debug overlay.
<!-- /note -->

### <a id="s-fixtureUnits"></a>`fixtureUnits()`

function · L5202–5236

- called by: [`checkSelection`](#s-checkSelection) · [`checkVariety`](#s-checkVariety) ×2 · [`checkWhenRobustness`](#s-checkWhenRobustness) · [`fixtureCtx`](#s-fixtureCtx) · [`fixturePairs`](#s-fixturePairs) · [`sampleTraffic`](#s-sampleTraffic)

<!-- note:fixtureUnits -->
═════════════════════════════════════════════════════════════════════
 6. SELF-TEST
═════════════════════════════════════════════════════════════════════

Runnable headless or from the in-game debug console. The table is data, and data is
exactly the kind of thing that rots quietly: a `when` clause that reads a field the sim
stopped setting, a `say` function that assumes a callback the context no longer carries,
a memory type nothing consumes. None of those throw at authoring time and all of them
show up as a channel that has gone strangely quiet, three slices later, with no obvious
cause. These checks are what turn all of that into a failing line of output.

A synthetic world: enough units, with enough variety, to exercise every clause.

- L5226 · `{ name: 'Free Cutter Sil', faction: 'independent', role: 'mine', hp: 92, maxHp: 100,` — Added because five topics never fired against the original fixture: a claim dispute
  needs two miners who are not on the same payroll, a covenant needs two armed hulls who
  are, and dock gossip needs two ships tied up at once. A fixture that cannot reach a
  topic is not a smaller test, it is a topic with no test at all.
<!-- /note -->

### <a id="s-fixtureCtx"></a>`fixtureCtx(a, b, over=)`

function · L5238–5271

- calls: [`fixtureUnits`](#s-fixtureUnits)
- called by: [`checkExchanges`](#s-checkExchanges) · [`checkSelection`](#s-checkSelection) ×4 · [`checkVariety`](#s-checkVariety) · [`sampleTraffic`](#s-sampleTraffic)

<!-- note:fixtureCtx -->
A context with every optional callback present. Topics must also survive a context with
*none* of them — see `runTopicSelfTest` — because npc-comms.js grows callbacks over time
and a topic that assumes one exists is a topic that stops firing on the branch where it
does not.
<!-- /note -->

#### <a id="s-fixtureCtx-warinessOf"></a>`fixtureCtx.warinessOf()`

prop · L5245–5245

<!-- note:fixtureCtx.warinessOf -->
<!-- /note -->

#### <a id="s-fixtureCtx-regardForPlayer"></a>`fixtureCtx.regardForPlayer()`

prop · L5246–5246

<!-- note:fixtureCtx.regardForPlayer -->
<!-- /note -->

#### <a id="s-fixtureCtx-playerNear"></a>`fixtureCtx.playerNear()`

prop · L5247–5247

<!-- note:fixtureCtx.playerNear -->
<!-- /note -->

#### <a id="s-fixtureCtx-playerBearing"></a>`fixtureCtx.playerBearing()`

prop · L5248–5248

<!-- note:fixtureCtx.playerBearing -->
<!-- /note -->

#### <a id="s-fixtureCtx-recallBetween"></a>`fixtureCtx.recallBetween()`

prop · L5249–5249

<!-- note:fixtureCtx.recallBetween -->
<!-- /note -->

#### <a id="s-fixtureCtx-recallDetail"></a>`fixtureCtx.recallDetail()`

prop · L5250–5250

<!-- note:fixtureCtx.recallDetail -->
<!-- /note -->

#### <a id="s-fixtureCtx-tipWasGood"></a>`fixtureCtx.tipWasGood()`

prop · L5251–5251

<!-- note:fixtureCtx.tipWasGood -->
<!-- /note -->

#### <a id="s-fixtureCtx-wasHonest"></a>`fixtureCtx.wasHonest()`

prop · L5252–5252

<!-- note:fixtureCtx.wasHonest -->
<!-- /note -->

#### <a id="s-fixtureCtx-lostHull"></a>`fixtureCtx.lostHull()`

prop · L5253–5253

<!-- note:fixtureCtx.lostHull -->
<!-- /note -->

#### <a id="s-fixtureCtx-trafficNear"></a>`fixtureCtx.trafficNear()`

prop · L5254–5254

<!-- note:fixtureCtx.trafficNear -->
<!-- /note -->

#### <a id="s-fixtureCtx-threatNear"></a>`fixtureCtx.threatNear()`

prop · L5255–5255

<!-- note:fixtureCtx.threatNear -->
<!-- /note -->

#### <a id="s-fixtureCtx-threatCount"></a>`fixtureCtx.threatCount()`

prop · L5256–5256

<!-- note:fixtureCtx.threatCount -->
<!-- /note -->

#### <a id="s-fixtureCtx-threatBearing"></a>`fixtureCtx.threatBearing()`

prop · L5257–5257

<!-- note:fixtureCtx.threatBearing -->
<!-- /note -->

#### <a id="s-fixtureCtx-hazardNear"></a>`fixtureCtx.hazardNear()`

prop · L5258–5258

<!-- note:fixtureCtx.hazardNear -->
<!-- /note -->

#### <a id="s-fixtureCtx-beaconFault"></a>`fixtureCtx.beaconFault()`

prop · L5259–5259

<!-- note:fixtureCtx.beaconFault -->
<!-- /note -->

#### <a id="s-fixtureCtx-berthsFree"></a>`fixtureCtx.berthsFree()`

prop · L5260–5260

<!-- note:fixtureCtx.berthsFree -->
<!-- /note -->

#### <a id="s-fixtureCtx-askingPrice"></a>`fixtureCtx.askingPrice(u)`

prop · L5261–5261

<!-- note:fixtureCtx.askingPrice -->
<!-- /note -->

#### <a id="s-fixtureCtx-counterPrice"></a>`fixtureCtx.counterPrice(u)`

prop · L5262–5262

<!-- note:fixtureCtx.counterPrice -->
<!-- /note -->

#### <a id="s-fixtureCtx-dealCloses"></a>`fixtureCtx.dealCloses()`

prop · L5263–5263

<!-- note:fixtureCtx.dealCloses -->
<!-- /note -->

#### <a id="s-fixtureCtx-wantsFight"></a>`fixtureCtx.wantsFight()`

prop · L5264–5264

<!-- note:fixtureCtx.wantsFight -->
<!-- /note -->

#### <a id="s-fixtureCtx-thirdParty"></a>`fixtureCtx.thirdParty(x, y)`

prop · L5265–5265

<!-- note:fixtureCtx.thirdParty -->
<!-- /note -->

#### <a id="s-fixtureCtx-regardBetween"></a>`fixtureCtx.regardBetween()`

prop · L5266–5266

<!-- note:fixtureCtx.regardBetween -->
<!-- /note -->

#### <a id="s-fixtureCtx-lastRaised"></a>`fixtureCtx.lastRaised()`

prop · L5267–5267

<!-- note:fixtureCtx.lastRaised -->
<!-- /note -->

#### <a id="s-fixtureCtx-lastTopic"></a>`fixtureCtx.lastTopic()`

prop · L5268–5268

<!-- note:fixtureCtx.lastTopic -->
<!-- /note -->

#### <a id="s-fixtureCtx-now"></a>`fixtureCtx.now()`

prop · L5269–5269

<!-- note:fixtureCtx.now -->
<!-- /note -->

### <a id="s-fixturePairs"></a>`fixturePairs()`

function · L5273–5278

- calls: [`fixtureUnits`](#s-fixtureUnits)
- called by: [`checkExchanges`](#s-checkExchanges)

<!-- note:fixturePairs -->
Every ordered pair worth testing, from the fixture.
<!-- /note -->

### <a id="s-RELS"></a>`RELS`

const · L5280–5289

<!-- note:RELS -->
<!-- /note -->

### <a id="s-lastSentence"></a>`lastSentence(text)`

function · **exported** · L5291–5294

<!-- note:lastSentence -->
Structural check: every topic declares the fields the engine reads, and nothing it
declares is a field the engine has never heard of. The second half catches typos —
`filesFor` instead of `filesFrom` fails silently forever otherwise.

The last sentence of a transmission. A turn may say two things on one press of the key,
and the move it made — the thing the reply has to answer — is the last of them.
<!-- /note -->

### <a id="s-KNOWN_FIELDS"></a>`KNOWN_FIELDS`

const · L5296–5297

<!-- note:KNOWN_FIELDS -->
<!-- /note -->

### <a id="s-checkShape"></a>`checkShape()`

function · L5299–5314

- called by: [`runTopicSelfTest`](#s-runTopicSelfTest)

<!-- note:checkShape -->
<!-- /note -->

### <a id="s-checkWhenRobustness"></a>`checkWhenRobustness()`

function · L5316–5328

- calls: [`fixtureUnits`](#s-fixtureUnits)
- called by: [`runTopicSelfTest`](#s-runTopicSelfTest)

<!-- note:checkWhenRobustness -->
Every `when` clause must survive a context with no callbacks and half-built units.
<!-- /note -->

### <a id="s-checkExchanges"></a>`checkExchanges(limitPerTopic=)`

function · L5330–5390

- calls: [`checkMove`](#s-checkMove) · [`exchange`](#s-exchange) · [`fixtureCtx`](#s-fixtureCtx) · [`fixturePairs`](#s-fixturePairs) · [`memoriesFrom`](#s-memoriesFrom) · [`proof`](#s-proof)
- called by: [`runTopicSelfTest`](#s-runTopicSelfTest)

<!-- note:checkExchanges -->
The big one: run every topic that can fire, for every pair and every relationship state,
and proof every line it produces. This is the check that protects the comms log, because
it exercises combinations no hand-written case would think to try.

- L5338 · `let att = 0;` — `att` counts attempts, not firings. Alternating on the firing count meant a topic
  that only fires in a quiet world never got a quiet world to fire in.
- L5342 · `const variant = att++ % 4;` — Half the runs happen in a quiet world. Several topics are gated on the *absence*
  of a threat or a hazard, and a fixture where the sky is always falling can never
  reach them — which is how allClear sat untested for a slice.
  Four worlds, not two. Several topics are gated on the *absence* of something —
  a clear board, a tip that turned out bad, an unfinished contract — and a fixture
  that always says yes to every callback can no more reach those than one that
  always says no.
- L5359 · `for (let i = 1; i < script.length; i++) {` — Adjacency: every reply must be a legal response to the line before it. This is the
  check that catches the nonsense proofing cannot see — each line fine on its own,
  the pair of them a non sequitur.
- L5376 · `const mem = memoriesFrom(k, ctx);` — A memory record must resolve for every exchange that runs, or the exchange was
  decorative after all.
<!-- /note -->

#### <a id="s-checkExchanges-threatNear"></a>`checkExchanges.threatNear()`

prop · L5344–5344

<!-- note:checkExchanges.threatNear -->
<!-- /note -->

#### <a id="s-checkExchanges-hazardNear"></a>`checkExchanges.hazardNear()`

prop · L5344–5344

<!-- note:checkExchanges.hazardNear -->
<!-- /note -->

#### <a id="s-checkExchanges-playerNear"></a>`checkExchanges.playerNear()`

prop · L5344–5344

<!-- note:checkExchanges.playerNear -->
<!-- /note -->

#### <a id="s-checkExchanges-tipWasGood"></a>`checkExchanges.tipWasGood()`

prop · L5345–5345

<!-- note:checkExchanges.tipWasGood -->
<!-- /note -->

#### <a id="s-checkExchanges-wasHonest"></a>`checkExchanges.wasHonest()`

prop · L5345–5345

<!-- note:checkExchanges.wasHonest -->
<!-- /note -->

#### <a id="s-checkExchanges-threatNear-2"></a>`checkExchanges.threatNear~2()`

prop · L5347–5347

<!-- note:checkExchanges.threatNear~2 -->
<!-- /note -->

#### <a id="s-checkExchanges-regardBetween"></a>`checkExchanges.regardBetween()`

prop · L5348–5348

<!-- note:checkExchanges.regardBetween -->
<!-- /note -->

#### <a id="s-checkExchanges-recallBetween"></a>`checkExchanges.recallBetween(x, y, type)`

prop · L5349–5349

<!-- note:checkExchanges.recallBetween -->
<!-- /note -->

### <a id="s-checkVariety"></a>`checkVariety(key=, n=)`

function · L5392–5400

- calls: [`exchange`](#s-exchange) · [`fixtureCtx`](#s-fixtureCtx) · [`fixtureUnits`](#s-fixtureUnits) ×2
- called by: [`runTopicSelfTest`](#s-runTopicSelfTest)

<!-- note:checkVariety -->
Variety: the same topic between the same pair must not produce the same transcript.
<!-- /note -->

### <a id="s-checkSelection"></a>`checkSelection()`

function · L5402–5420

- calls: [`availableTopics`](#s-availableTopics) · [`fixtureCtx`](#s-fixtureCtx) ×4 · [`fixtureUnits`](#s-fixtureUnits) · [`scoreTopic`](#s-scoreTopic) ×4
- called by: [`runTopicSelfTest`](#s-runTopicSelfTest)

<!-- note:checkSelection -->
Selection: chooseTopic must respect priority when the world turns urgent.

- L5406 · `const patrol = u.find(x => x.faction === hurtMiner.faction && (x.role === 'combat' || x.ro` — Same faction, and armed: askHelp is gated on both, so testing it against a coalition
  patrol was testing nothing at all.
- L5414 · `const cd = fixtureCtx(u[0], u[1], { lastRaised: () => 1 });` — Cooldown must actually suppress.
- L5416 · `const base = scoreTopic('tipFollowUp', u[0], u[1], fixtureCtx(u[0], u[1], { lastTopic: ()` — Chaining must actually boost.
<!-- /note -->

#### <a id="s-checkSelection-lastRaised"></a>`checkSelection.lastRaised()`

prop · L5414–5414

<!-- note:checkSelection.lastRaised -->
<!-- /note -->

#### <a id="s-checkSelection-lastTopic"></a>`checkSelection.lastTopic()`

prop · L5416–5416

<!-- note:checkSelection.lastTopic -->
<!-- /note -->

#### <a id="s-checkSelection-lastTopic-2"></a>`checkSelection.lastTopic~2()`

prop · L5417–5417

<!-- note:checkSelection.lastTopic~2 -->
<!-- /note -->

### <a id="s-runTopicSelfTest"></a>`runTopicSelfTest(opts=)`

function · **exported** · L5422–5455

- calls: [`checkExchanges`](#s-checkExchanges) · [`checkSelection`](#s-checkSelection) · [`checkShape`](#s-checkShape) · [`checkVariety`](#s-checkVariety) · [`checkWhenRobustness`](#s-checkWhenRobustness) · [`topicStats`](#s-topicStats)
- called by: [`runSpeechSelfTest`](#s-runSpeechSelfTest)

<!-- note:runTopicSelfTest -->
Run everything. Returns { pass, fail, failures } and logs a readable report.
<!-- /note -->

### <a id="s-sampleTraffic"></a>`sampleTraffic(n=, opts=)`

function · **exported** · L5457–5477

- calls: [`chooseTopic`](#s-chooseTopic) · [`exchange`](#s-exchange) · [`fixtureCtx`](#s-fixtureCtx) · [`fixtureUnits`](#s-fixtureUnits)

<!-- note:sampleTraffic -->
Print a sample of the radio, for judging by ear. The only test that catches "grammatical
but nobody would say that", which is the failure mode no assertion can express.
<!-- /note -->

### <a id="s-INTENTS"></a>`INTENTS`

const · **exported** · L5479–5716

<!-- note:INTENTS -->
═════════════════════════════════════════════════════════════════════
 12. THE PLAYER
═════════════════════════════════════════════════════════════════════

Everything above this line is NPCs talking to each other, which is the hard half: neither
side of that conversation can be surprised. A human on the channel can type anything at
all, and the honest answer to most of it is that the ship did not understand.

So this layer is deliberately not a chatbot. It is a intent matcher over the same table
the NPCs already use: it reads a typed line, decides which of the things this world can
talk about the player was most likely reaching for, and answers *from the same frames the
NPC would have used to raise that topic itself*. A ship that cannot parse a line says so
in character and offers what it does know, which is far better than a fluent answer to a
question nobody asked.

The consequence worth having: talking to a ship is not a separate system with separate
content. Ask a miner about ore and you get the same generated tip it would have passed to
a hauler, in its own register, with its own idiolect, and it files the exchange in the
same memory store — so being rude to one ship is something the next one can hear about.

The intent table. Ordered: the first match wins, so put the specific patterns above the
general ones. `act` and `build` say what the ship does about it.

- L5489 · `match: /\b(bye|goodbye|see you|signing off|farewell|catch you later)\b|\bout\.?\s*$/i,` — "out" only closes a channel at the end of a line. As a bare word it matched "anything
  on the ore out there?" and the miner said goodbye instead of answering.
<!-- /note -->

#### <a id="s-INTENTS-build"></a>`INTENTS.build(npc, ctx)`

prop · L5483–5485

<!-- note:INTENTS.build -->
<!-- /note -->

#### <a id="s-INTENTS-build-2"></a>`INTENTS.build~2(npc, ctx)`

prop · L5490–5490

<!-- note:INTENTS.build~2 -->
<!-- /note -->

#### <a id="s-INTENTS-build-3"></a>`INTENTS.build~3(npc, ctx)`

prop · L5496–5500

- calls: [`chooseFrom`](#s-chooseFrom)

<!-- note:INTENTS.build~3 -->
<!-- /note -->

#### <a id="s-INTENTS-build-4"></a>`INTENTS.build~4(npc, ctx)`

prop · L5506–5509

- calls: [`chooseFrom`](#s-chooseFrom)

<!-- note:INTENTS.build~4 -->
<!-- /note -->

#### <a id="s-INTENTS-build-5"></a>`INTENTS.build~5(npc, ctx)`

prop · L5516–5525

- calls: [`badlyHurt`](#s-badlyHurt) ×2 · [`chooseFrom`](#s-chooseFrom) ×2

<!-- note:INTENTS.build~5 -->
<!-- /note -->

#### <a id="s-INTENTS-build-6"></a>`INTENTS.build~6(npc, ctx)`

prop · L5531–5536

- calls: [`chooseFrom`](#s-chooseFrom)

<!-- note:INTENTS.build~6 -->
<!-- /note -->

#### <a id="s-INTENTS-build-7"></a>`INTENTS.build~7(npc, ctx)`

prop · L5541–5548

- calls: [`chooseFrom`](#s-chooseFrom) · [`damageFact`](#s-damageFact) · [`hurt`](#s-hurt) · [`whereFact`](#s-whereFact)

<!-- note:INTENTS.build~7 -->
<!-- /note -->

#### <a id="s-INTENTS-build-8"></a>`INTENTS.build~8(npc, ctx)`

prop · L5553–5559

- calls: [`transiting`](#s-transiting) · [`whereFact`](#s-whereFact)

<!-- note:INTENTS.build~8 -->
<!-- /note -->

#### <a id="s-INTENTS-build-9"></a>`INTENTS.build~9(npc, ctx)`

prop · L5565–5574

- calls: [`anyRole`](#s-anyRole) · [`chooseFrom`](#s-chooseFrom) · [`described`](#s-described) · [`gradeFact`](#s-gradeFact) · [`whereFact`](#s-whereFact)

<!-- note:INTENTS.build~9 -->
<!-- /note -->

#### <a id="s-INTENTS-build-10"></a>`INTENTS.build~10(npc, ctx)`

prop · L5580–5584

- calls: [`holdFact`](#s-holdFact) · [`priceFact`](#s-priceFact)

<!-- note:INTENTS.build~10 -->
<!-- /note -->

#### <a id="s-INTENTS-build-11"></a>`INTENTS.build~11(npc, ctx)`

prop · L5589–5596

- calls: [`holdFact`](#s-holdFact)

<!-- note:INTENTS.build~11 -->
- L5595 · `frames: ['inform-svo']` — Pinned to the simple present: the progressive turns "I have a part load" into
  "I am having a part load", which is a different verb entirely.
<!-- /note -->

#### <a id="s-INTENTS-build-12"></a>`INTENTS.build~12(npc, ctx)`

prop · L5602–5610

- calls: [`chooseFrom`](#s-chooseFrom) · [`threatFact`](#s-threatFact) · [`whereFact`](#s-whereFact)

<!-- note:INTENTS.build~12 -->
<!-- /note -->

#### <a id="s-INTENTS-build-13"></a>`INTENTS.build~13(npc, ctx)`

prop · L5616–5623

- calls: [`chooseFrom`](#s-chooseFrom) ×2

<!-- note:INTENTS.build~13 -->
<!-- /note -->

#### <a id="s-INTENTS-build-14"></a>`INTENTS.build~14(npc, ctx)`

prop · L5629–5635

- calls: [`chooseFrom`](#s-chooseFrom) ×2 · [`role`](#s-role)

<!-- note:INTENTS.build~14 -->
<!-- /note -->

#### <a id="s-INTENTS-build-15"></a>`INTENTS.build~15(npc, ctx)`

prop · L5642–5650

- calls: [`badlyHurt`](#s-badlyHurt) · [`chooseFrom`](#s-chooseFrom) · [`reasonFact`](#s-reasonFact)

<!-- note:INTENTS.build~15 -->
<!-- /note -->

#### <a id="s-INTENTS-build-16"></a>`INTENTS.build~16(npc, ctx)`

prop · L5656–5659

- calls: [`chooseFrom`](#s-chooseFrom) · [`hurt`](#s-hurt) · [`lowFuel`](#s-lowFuel) · [`needFact`](#s-needFact) · [`reasonFact`](#s-reasonFact)

<!-- note:INTENTS.build~16 -->
<!-- /note -->

#### <a id="s-INTENTS-build-17"></a>`INTENTS.build~17(npc, ctx)`

prop · L5664–5678

- calls: [`chooseFrom`](#s-chooseFrom) ×3

<!-- note:INTENTS.build~17 -->
- L5668 · `frames: ['inform-verbless', 'inform-contrast', 'speculate-guess', 'warn-declarative'],` — Pinned: the doubting frame turns a neutral answer into a contradiction of itself —
  "you are a hull and a squawk to me so far? I doubt it."
<!-- /note -->

#### <a id="s-INTENTS-build-18"></a>`INTENTS.build~18(npc, ctx)`

prop · L5684–5694

- calls: [`chooseFrom`](#s-chooseFrom) ×2

<!-- note:INTENTS.build~18 -->
<!-- /note -->

#### <a id="s-INTENTS-build-19"></a>`INTENTS.build~19(npc, ctx)`

prop · L5700–5703

- calls: [`chooseFrom`](#s-chooseFrom) · [`holdFact`](#s-holdFact) · [`laden`](#s-laden) · [`role`](#s-role) · [`whereFact`](#s-whereFact)

<!-- note:INTENTS.build~19 -->
<!-- /note -->

#### <a id="s-INTENTS-build-20"></a>`INTENTS.build~20(npc, ctx)`

prop · L5709–5714

- calls: [`chooseFrom`](#s-chooseFrom)

<!-- note:INTENTS.build~20 -->
<!-- /note -->

### <a id="s-confused"></a>`confused(npc, ctx)`

function · L5718–5726

- calls: [`chooseFrom`](#s-chooseFrom) ×2
- called by: [`talkToNpc`](#s-talkToNpc) ×2

<!-- note:confused -->
The line a ship gives when it did not understand. Not an error message: a character who
missed what you said, which is a thing that happens on a noisy band and costs the player
nothing to work around.
<!-- /note -->

### <a id="s-parsePlayerLine"></a>`parsePlayerLine(text)`

function · **exported** · L5728–5734

- called by: [`talkToNpc`](#s-talkToNpc)

<!-- note:parsePlayerLine -->
Match a typed line to an intent. Exported so the demo can show what it matched.

- L5732 · `if (/\?\s*$/.test(s)) return INTENTS.find(i => i.id === 'status') || null;` — A bare question mark still reads as a question, even when nothing else matched.
<!-- /note -->

### <a id="s-talkToNpc"></a>`talkToNpc(npc, text, ctx=)`

function · **exported** · L5736–5765

- calls: [`confused`](#s-confused) ×2 · [`parsePlayerLine`](#s-parsePlayerLine) · [`profileFor`](#s-profileFor) · [`realise`](#s-realise) · [`registerOf`](#s-registerOf)
- called by: [`createWorld>talk`](#s-createWorld-talk)

<!-- note:talkToNpc -->
Say something to a ship and get an answer.

@param {object} npc  the unit being addressed
@param {string} text what the player typed
@param {object} ctx  world callbacks — createWorld() below supplies a full set
@returns {{ text, intent, understood, regardDelta }}
<!-- /note -->

### <a id="s-PLAYER_PROMPTS"></a>`PLAYER_PROMPTS`

const · **exported** · L5767–5778

<!-- note:PLAYER_PROMPTS -->
Suggestions for the demo's quick-reply chips — one per broad thing a ship can discuss.
<!-- /note -->

### <a id="s-TARGET"></a>`TARGET`

const · **exported** · L5780–5788

<!-- note:TARGET -->
═════════════════════════════════════════════════════════════════════
 15. CORPUS: MEASURING SPEECH AGAINST REAL SPEECH
═════════════════════════════════════════════════════════════════════

What can twenty thousand lines of the generator's own output actually teach it?

Not new sentences. A generator trained on its own output learns only what it already
believes, harder — the failure is well known and it shows up as everything converging on
whatever the model already over-produced. So this layer does not learn *language* from the
log. It measures the log's *shape* against the shape of real conversation, and corrects
the differences that are correctable.

The measurements are the ones descriptive linguistics actually uses on conversation, and
each is here because it fails in a way you can hear:

  utterance length      Conversational English averages around 14 words per turn. Radio
                        is terser, but a generator sitting at 7 sounds like a menu system.
  turns per exchange    Published dialogue corpora run about 8 turns per conversation.
                        Two is a transaction; the difference is audible immediately.
  question rate         Roughly a fifth of conversational turns are questions. A band with
                        no questions on it is a band of announcements — nobody is asking
                        anybody anything, so nothing is ever at stake.
  opening variety       Measured as the entropy of first words. Human speakers repeat
                        openings; generators repeat them far more, and it is the single
                        most recognisable tell of machine-written dialogue.
  adjacency             Sacks and Schegloff's pairs: a question takes an answer, an
                        accusation takes a denial or an admission. The share of pairs
                        completed properly is a direct measure of whether the log is a
                        conversation or two monologues interleaved.
  lexical variety       Type-token ratio and the share of trigrams that occur once. Both
                        collapse when a generator leans on a few phrasings.

`TARGET` holds published aggregate figures for these — numbers, not text, so nothing is
reproduced from anybody's corpus. Feed a real transcript through `parseTranscript` and
`profileOf` and the target is replaced by measurements of that corpus instead, which is
the point at which this stops being calibration against my recollection of the literature
and becomes calibration against data you chose.

Published aggregate statistics for written-style conversational English, used as the
default target. The turn and length figures follow the DailyDialog corpus (Li et al.,
2017: 13,118 dialogues, ~7.9 turns per dialogue, ~14.6 tokens per utterance); the rest are
conventional descriptive figures for conversational speech. Replace them by profiling a
corpus of your own — `fitTarget(profileOf(parseTranscript(text)))`.

- L5784 · `openingEntropy: 4.2,` — bits over first words
- L5785 · `typeTokenRatio: 0.42,` — over a 20k-token sample
<!-- /note -->

### <a id="s-target"></a>`target`

const · L5790–5790

<!-- note:target -->
<!-- /note -->

### <a id="s-currentTarget"></a>`currentTarget()`

function · **exported** · L5791–5791

- called by: [`fitTarget`](#s-fitTarget) ×2

<!-- note:currentTarget -->
<!-- /note -->

### <a id="s-fitTarget"></a>`fitTarget(profile)`

function · **exported** · L5792–5803

- calls: [`currentTarget`](#s-currentTarget) ×2

<!-- note:fitTarget -->
<!-- /note -->

### <a id="s-parseTranscript"></a>`parseTranscript(text)`

function · **exported** · L5805–5830

- called by: [`checkCorpus`](#s-checkCorpus) ×5

<!-- note:parseTranscript -->
Parse a transcript into dialogues of turns.

Three formats, because these are the three every dialogue corpus and every chat log
arrives in:
  "NAME: utterance"          one turn per line, blank line ends a dialogue
  "utterance __eou__ ..."    DailyDialog's end-of-utterance marker, one dialogue per line
  plain lines                one turn per line, alternating speakers assumed
<!-- /note -->

### <a id="s-WORDS"></a>`WORDS(s)`

function · L5832–5832

- called by: [`profileOf`](#s-profileOf)

<!-- note:WORDS -->
<!-- /note -->

### <a id="s-QUESTION"></a>`QUESTION`

const · L5833–5833

<!-- note:QUESTION -->
<!-- /note -->

### <a id="s-entropy"></a>`entropy(counts)`

function · L5835–5844

- called by: [`profileOf`](#s-profileOf)

<!-- note:entropy -->
Shannon entropy of a distribution given as counts.
<!-- /note -->

### <a id="s-profileOf"></a>`profileOf(dialogues, opts=)`

function · **exported** · L5846–5905

- calls: [`entropy`](#s-entropy) · [`WORDS`](#s-WORDS)
- called by: [`checkCorpus`](#s-checkCorpus) ×4 · [`createWorld>profile`](#s-createWorld-profile)

<!-- note:profileOf -->
Measure a set of dialogues.

@param {Array&lt;Array<{speaker,text,move?}>>} dialogues

- L5857 · `const window = opts.sample || 2000;` — Type-token ratio and entropy both fall and rise with sample size respectively, so they
  are only comparable between corpora when measured over the same amount of text. Measured
  across everything, a twenty-thousand-utterance log scored a lexical variety of 0.00
  against a target of 0.42 — which said nothing about the writing and everything about the
  sample. Both are now taken over a fixed window.
  The window is counted in *tokens*, not utterances: type-token ratio is only comparable
  between texts measured over the same number of words, and two thousand is the
  conventional window for it.
- L5876 · `let owed = 0, met = 0;` — Adjacency, where the caller supplied moves: what share of moves that oblige a particular
  kind of reply actually got one.
<!-- /note -->

### <a id="s-compareProfiles"></a>`compareProfiles(mine, against=)`

function · **exported** · L5907–5928

- called by: [`createWorld>selfTrain`](#s-createWorld-selfTrain) ×2

<!-- note:compareProfiles -->
Side-by-side, with a verdict per metric. Ordered worst gap first.

- L5909 · `const rows = [` — Two of these are one-sided. More varied openings than a human corpus is not a fault, and
  completing more adjacency pairs than people bother to is not a fault either — people are
  interrupted and distracted and this crew is not. Flagging them as "too much" was the
  measurement telling the generator to get worse.
<!-- /note -->

### <a id="s-CALIBRATION"></a>`CALIBRATION`

const · **exported** · L5930–5935

<!-- note:CALIBRATION -->
── calibration ──────────────────────────────────────────────────────

Three global dials the generator reads. They are deliberately few: these are the only
distributional faults a generator of this kind can correct without being rewritten, and a
dial that cannot be justified by a measurement is a knob, not a calibration.

- L5931 · `lengthLift: 0,` — -1..1, pushes frame choice toward fuller or sparser shapes
- L5932 · `codaLift: 0,` — -1..1, how much longer exchanges run
- L5933 · `questionLift: 0,` — -1..1, how hard question codas are preferred
<!-- /note -->

### <a id="s-calibrate"></a>`calibrate(profile, against=)`

function · **exported** · L5937–5952

- calls: [`calibrate>clamp`](#s-calibrate-clamp) ×3 · [`calibrate>rel`](#s-calibrate-rel) ×3
- called by: [`createWorld>selfTrain`](#s-createWorld-selfTrain)

<!-- note:calibrate -->
Fit the dials from a comparison. Deliberately gentle — a third of the measured gap, capped
— because these measurements are noisy at any sample size a browser will produce, and a
controller that chases noise oscillates. Run it twice and it converges; run it once and it
moves in the right direction.
<!-- /note -->

#### <a id="s-calibrate-rel"></a>`calibrate>rel(got, want)`

function · L5939–5939

- called by: [`calibrate`](#s-calibrate) ×3

<!-- note:calibrate>rel -->
<!-- /note -->

#### <a id="s-calibrate-clamp"></a>`calibrate>clamp(x)`

function · L5940–5940

- called by: [`calibrate`](#s-calibrate) ×3

<!-- note:calibrate>clamp -->
<!-- /note -->

### <a id="s-resetCalibration"></a>`resetCalibration()`

function · **exported** · L5954–5960

- called by: [`checkCorpus`](#s-checkCorpus) ×2

<!-- note:resetCalibration -->
<!-- /note -->

### <a id="s-CREW_ROLES"></a>`CREW_ROLES`

const · L5962–5972

<!-- note:CREW_ROLES -->
═════════════════════════════════════════════════════════════════════
 13. DIRECTOR
═════════════════════════════════════════════════════════════════════

A running world. Everything above is a library; this is the thing that uses it, and it is
the piece both the demo page and systems/npc-comms.js were missing.

It owns four stores, all of them small on purpose:

  units      the ships, with the state the `when` clauses read
  rels       pairwise: how often two have spoken, and what they think of each other
  memories   what each character has filed, with a holder, a subject and a weight
  log        what actually went out, per channel — the thing the player overhears

The reputation model is the whole point. Regard is not a number the sim writes directly;
it is the sum of what got filed, which means it can always be explained — `whyRegard()`
returns the exact memories behind any figure. A galaxy whose opinions can be audited is
one whose opinions can be debugged, and the alternative is a hidden float that drifts and
nobody can say why.

Roles, weighted the way a working system is actually populated: mostly people working.
<!-- /note -->

### <a id="s-HULL_NAMES"></a>`HULL_NAMES`

const · L5974–5985

<!-- note:HULL_NAMES -->
Name stock, widened because the population is now measured in dozens rather than in
handfuls. With five nexis prefixes a crew of forty was mostly "Deepcut 07" talking to
"Deepcut 11", which is bad in two separate ways: it reads as a clone army, and the
learning bank keys on names, so near-identical hulls made the *evidence* look repetitive
even when the conversations were not.
<!-- /note -->

### <a id="s-PLACES"></a>`PLACES`

const · L5987–5989

<!-- note:PLACES -->
<!-- /note -->

### <a id="s-ANCHORS"></a>`ANCHORS`

const · L5991–5997

<!-- note:ANCHORS -->
Where ships cluster. Traffic in a real system is not uniform — it pools around the places
worth being — and a uniform scatter means every pair is equally likely, which flattens the
relationship graph into noise. Anchors give the same two hulls repeated chances to talk,
which is the precondition for either of them learning anything about the other.
<!-- /note -->

### <a id="s-polarise"></a>`polarise(x)`

function · L5999–5999

- called by: [`makeCrew`](#s-makeCrew) ×4

<!-- note:polarise -->
Push a 0..1 draw toward its ends, leaving some in the middle.
<!-- /note -->

### <a id="s-makeCrew"></a>`makeCrew(n=, rng=)`

function · **exported** · L6001–6058

- calls: [`polarise`](#s-polarise) ×4 · [`stream`](#s-stream)
- called by: [`createWorld`](#s-createWorld)

<!-- note:makeCrew -->
Build a population. Deterministic from the seed, so a bug in a conversation twenty
minutes into a session can be reproduced by writing down one number.

- L6015 · `const anchor = ANCHORS[Math.floor(r.next() * ANCHORS.length)];` — Sit the ship near somewhere worth being, with scatter around it, rather than anywhere
  at all. `home` is kept on the unit so drift pulls it back instead of letting the whole
  population diffuse into an even smear over a few thousand ticks.
- L6019 · `taste: {` — What this hull is like to talk to. Not a personality in any deep sense — four dials
  that decide how a given phrasing lands on it, which is what gives the phrasing bank
  something real to learn. Two ships in the same register can still want to be
  addressed completely differently.
- L6020 · `words: [7, 12, 17][Math.floor(r.next() * 3)],` — Pushed toward the ends of each range rather than scattered through the middle. A
  crew whose preferences all sit near neutral is a crew with nothing to learn about:
  every delivery is about as good as every other, and the bank spends its life
  measuring noise. Real crews contain a few ships that genuinely cannot stand being
  hedged at, and those are the ones worth learning.
  Seven, twelve or seventeen — the range the generator can actually hit. A listener
  who wants a twenty-word transmission is a listener nobody can satisfy, because
  almost nothing in the frame table runs that long; all such a taste does is put a
  permanent penalty on every hull that talks to it, which the bank then spends its
  life failing to learn away. A world may only reward what it is possible to say.
- L6021 · `hedges: polarise(r.next()),` — tolerance for qualifiers
- L6022 · `ceremony: polarise(r.next()),` — appetite for markers and sign-offs
- L6023 · `naming: polarise(r.next()),` — being addressed by name
- L6024 · `deference: polarise(r.next())` — willingness to be given orders
- L6045 · `const rings = [` — Stations. Three rather than one: a single ring means every docking conversation in the
  system happens with the same voice, and with two dozen ships that one voice ends up
  holding a third of the traffic on its own.
<!-- /note -->

### <a id="s-relKey"></a>`relKey(a, b)`

function · L6060–6060

- called by: [`createWorld>commit`](#s-createWorld-commit) · [`createWorld>rel`](#s-createWorld-rel) · [`createWorld>worldCtxStock.lastRaised`](#s-createWorld-worldCtxStock-lastRaised) · [`createWorld>worldCtxStock.lastTopic`](#s-createWorld-worldCtxStock-lastTopic)

<!-- note:relKey -->
<!-- /note -->

### <a id="s-createMemoryStore"></a>`createMemoryStore(opts=)`

function · **exported** · L6062–6152

- called by: [`checkScale`](#s-checkScale) · [`createWorld`](#s-createWorld)

<!-- note:createMemoryStore -->
The memory store, indexed.

It began as an array with a filter over it, which is the right first version: it is four
lines, it is obviously correct, and at a crew of nine nobody notices. At a crew of forty it
is the whole cost of the simulation. `recallBetween` is called from `when` clauses, and
every topic's `when` runs against every candidate on every tick, so a linear scan of a
store that grows without bound turns one tick into tens of thousands of comparisons —
three thousand ticks took nearly three minutes, which is the difference between a trainer
and a screensaver.

So: rows bucketed per (holder, subject); a set of types per bucket, so the existence check
that `when` clauses actually use is a hash lookup; and a cached regard figure per bucket,
invalidated when the bucket changes or when enough simulated time has passed for the decay
to matter.

The per-pair cap is the other half. A generous bank is not an unbounded one — an unbounded
one is a leak with a nice name — so when a pair's row count passes the cap, the oldest half
is folded into a single consolidated row carrying their summed weight. Nothing is lost that
regard depends on; what is lost is the ability to cite each of forty routine check-ins
individually, which is exactly what a character would lose too.

- L6065 · `const buckets = new Map();` — "holder|subject" -> bucket
<!-- /note -->

#### <a id="s-createMemoryStore-bucketOf"></a>`createMemoryStore>bucketOf(holder, subject, make=)`

function · L6068–6076

- called by: [`createMemoryStore>has`](#s-createMemoryStore-has) · [`createMemoryStore>list`](#s-createMemoryStore-list) · [`createMemoryStore>push`](#s-createMemoryStore-push) · [`createMemoryStore>regard`](#s-createMemoryStore-regard)

<!-- note:createMemoryStore>bucketOf -->
<!-- /note -->

#### <a id="s-createMemoryStore-consolidate"></a>`createMemoryStore>consolidate(bk)`

function · L6078–6098

- called by: [`createMemoryStore>push`](#s-createMemoryStore-push)

<!-- note:createMemoryStore>consolidate -->
Fold the oldest half of a bucket into one row that keeps its weight and loses its detail.
<!-- /note -->

#### <a id="s-createMemoryStore-push"></a>`createMemoryStore>push(m)`

function · L6100–6108

- calls: [`createMemoryStore>bucketOf`](#s-createMemoryStore-bucketOf) · [`createMemoryStore>consolidate`](#s-createMemoryStore-consolidate)

<!-- note:createMemoryStore>push -->
<!-- /note -->

#### <a id="s-createMemoryStore-list"></a>`createMemoryStore>list(holder, subject, type=)`

function · L6110–6114

- calls: [`createMemoryStore>bucketOf`](#s-createMemoryStore-bucketOf)

<!-- note:createMemoryStore>list -->
<!-- /note -->

#### <a id="s-createMemoryStore-has"></a>`createMemoryStore>has(holder, subject, type)`

function · L6116–6120

- calls: [`createMemoryStore>bucketOf`](#s-createMemoryStore-bucketOf)

<!-- note:createMemoryStore>has -->
The check `when` clauses make constantly: does this character hold anything of this kind?
<!-- /note -->

#### <a id="s-createMemoryStore-regard"></a>`createMemoryStore>regard(holder, subject, now)`

function · L6122–6134

- calls: [`createMemoryStore>bucketOf`](#s-createMemoryStore-bucketOf)

<!-- note:createMemoryStore>regard -->
Decayed, hearsay-discounted regard, cached. The cache is dropped when the bucket changes
and expires on its own after a slice of simulated time — the decay curve does not move
fast enough for a fresher figure than that to mean anything.
<!-- /note -->

#### <a id="s-createMemoryStore-flat"></a>`createMemoryStore>flat()`

function · L6136–6140

- called by: [`createMemoryStore.filter`](#s-createMemoryStore-filter) · [`createMemoryStore.map`](#s-createMemoryStore-map) · [`createMemoryStore.slice`](#s-createMemoryStore-slice)

<!-- note:createMemoryStore>flat -->
Everything, flattened. For saving, and for the tests that count.
<!-- /note -->

#### <a id="s-createMemoryStore-length"></a>`createMemoryStore.length()`

prop · L6144–6144

<!-- note:createMemoryStore.length -->
<!-- /note -->

#### <a id="s-createMemoryStore-pairs"></a>`createMemoryStore.pairs()`

prop · L6145–6145

<!-- note:createMemoryStore.pairs -->
<!-- /note -->

#### <a id="s-createMemoryStore-filter"></a>`createMemoryStore.filter(fn)`

prop · L6146–6146

- calls: [`createMemoryStore>flat`](#s-createMemoryStore-flat)

<!-- note:createMemoryStore.filter -->
<!-- /note -->

#### <a id="s-createMemoryStore-forEach"></a>`createMemoryStore.forEach(fn)`

prop · L6147–6147

<!-- note:createMemoryStore.forEach -->
<!-- /note -->

#### <a id="s-createMemoryStore-map"></a>`createMemoryStore.map(fn)`

prop · L6148–6148

- calls: [`createMemoryStore>flat`](#s-createMemoryStore-flat)

<!-- note:createMemoryStore.map -->
<!-- /note -->

#### <a id="s-createMemoryStore-slice"></a>`createMemoryStore.slice(a, b)`

prop · L6149–6149

- calls: [`createMemoryStore>flat`](#s-createMemoryStore-flat)

<!-- note:createMemoryStore.slice -->
<!-- /note -->

#### <a id="s-createMemoryStore-clear"></a>`createMemoryStore.clear()`

prop · L6150–6150

<!-- note:createMemoryStore.clear -->
<!-- /note -->

### <a id="s-createWorld"></a>`createWorld(opts=)`

function · **exported** · L6154–6492

- calls: [`createMemoryStore`](#s-createMemoryStore) · [`createSpeechMemory`](#s-createSpeechMemory) · [`makeCrew`](#s-makeCrew) · [`seedWorld`](#s-seedWorld) · [`stream`](#s-stream)
- called by: [`resetSpeech`](../npc/speech.js.md#s-resetSpeech) _js/npc/speech.js_ · [`checkCorpus`](#s-checkCorpus) · [`checkLearning>arm`](#s-checkLearning-arm) · [`checkPlayerTalk`](#s-checkPlayerTalk) · [`checkScale`](#s-checkScale) · [`checkWorld`](#s-checkWorld)

<!-- note:createWorld -->
A live world.

@param {object} opts
  seed      world seed; same seed, same conversations
  units     supply your own population instead of a generated one
  crewSize  how many ships to generate when `units` is not given
  logCap    how many transmissions to keep

- L6164 · `const speech = createSpeechMemory({` — How each character has learned to talk to each other character. Lives with the world
  rather than with the units, because it is a property of the pair.
  Generous by default. A crew of thirty produces tens of thousands of phrasing rows over a
  long session, and a cap of four thousand meant the bank spent most of its life evicting
  rows it was still learning from — the reason the first learning curve came out flat.
- L6170 · `const lastRaisedAt = new Map();` — "a~b:topic" -> t
- L6171 · `const lastTopicOf = new Map();` — "a~b" -> topic key
- L6182 · `let lastLost = null;` — The most recent hull to drop off the board, for the topics that remember one.
<!-- /note -->

#### <a id="s-createWorld-rel"></a>`createWorld>rel(a, b)`

function · L6176–6180

- calls: [`relKey`](#s-relKey)
- called by: [`createWorld>commit`](#s-createWorld-commit) · [`createWorld>worldCtxStock`](#s-createWorld-worldCtxStock)

<!-- note:createWorld>rel -->
<!-- /note -->

#### <a id="s-createWorld-playerRel"></a>`createWorld>playerRel(u)`

function · L6185–6188

- called by: [`createWorld>talk`](#s-createWorld-talk) ×2 · [`createWorld>worldCtxStock`](#s-createWorld-worldCtxStock)

<!-- note:createWorld>playerRel -->
<!-- /note -->

#### <a id="s-createWorld-nameOf"></a>`createWorld>nameOf(x)`

function · L6190–6190

- called by: [`createWorld>recall`](#s-createWorld-recall) ×2 · [`createWorld>regardFrom`](#s-createWorld-regardFrom) ×2 · [`createWorld>worldCtxStock.recallBetween`](#s-createWorld-worldCtxStock-recallBetween) ×2

<!-- note:createWorld>nameOf -->
<!-- /note -->

#### <a id="s-createWorld-recall"></a>`createWorld>recall(holder, subject, type=)`

function · L6192–6193

- calls: [`createWorld>nameOf`](#s-createWorld-nameOf) ×2
- called by: [`createWorld>whyRegard`](#s-createWorld-whyRegard) · [`createWorld>worldCtxStock.recallDetail`](#s-createWorld-worldCtxStock-recallDetail)

<!-- note:createWorld>recall -->
Memories a character holds about a subject, newest last.
<!-- /note -->

#### <a id="s-createWorld-regardFrom"></a>`createWorld>regardFrom(holder, subject)`

function · L6195–6195

- calls: [`createWorld>nameOf`](#s-createWorld-nameOf) ×2
- called by: [`createWorld>commit`](#s-createWorld-commit) ×2 · [`createWorld>talk`](#s-createWorld-talk) · [`createWorld>worldCtxStock.regardBetween`](#s-createWorld-worldCtxStock-regardBetween) · [`createWorld>worldCtxStock.regardForPlayer`](#s-createWorld-worldCtxStock-regardForPlayer) · [`createWorld>worldCtxStock.warinessOf`](#s-createWorld-worldCtxStock-warinessOf)

<!-- note:createWorld>regardFrom -->
Regard as a derived figure rather than a stored one. Hearsay counts for less than
something witnessed, and everything decays: a grudge nobody refreshes fades, which is
what stops one bad exchange in the first minute defining a character forever.

Cached per pair, because this is the hottest read in the world. A `when` clause may call
it once per candidate per tick, and at a crew of forty that was thirty thousand full
scans of the memory store per second of simulated time — the reason a training run of
any useful length was impossible before.
<!-- /note -->

#### <a id="s-createWorld-worldCtx"></a>`createWorld>worldCtx(a, b)`

function · L6197–6197

- calls: [`createWorld>worldCtxStock`](#s-createWorld-worldCtxStock)
- called by: [`createWorld>talk`](#s-createWorld-talk) · [`createWorld>tick`](#s-createWorld-tick)

<!-- note:createWorld>worldCtx -->
── the world callbacks every `when` clause and topic may read ──────
LIVING GALAXY 0.3.16: the host may ground any of these callbacks on its own world
(opts.ground(a, b) → an object whose keys override the stock ones). The only local
change to this file.
<!-- /note -->

#### <a id="s-createWorld-worldCtxStock"></a>`createWorld>worldCtxStock(a, b)`

function · L6198–6278

- calls: [`createWorld>playerRel`](#s-createWorld-playerRel) · [`createWorld>rel`](#s-createWorld-rel)
- called by: [`createWorld>worldCtx`](#s-createWorld-worldCtx)

<!-- note:createWorld>worldCtxStock -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-now"></a>`createWorld>worldCtxStock.now()`

prop · L6204–6204

<!-- note:createWorld>worldCtxStock.now -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-lastRaised"></a>`createWorld>worldCtxStock.lastRaised(x, y, key)`

prop · L6208–6211

- calls: [`relKey`](#s-relKey)

<!-- note:createWorld>worldCtxStock.lastRaised -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-lastTopic"></a>`createWorld>worldCtxStock.lastTopic(x, y)`

prop · L6212–6212

- calls: [`relKey`](#s-relKey)

<!-- note:createWorld>worldCtxStock.lastTopic -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-recallBetween"></a>`createWorld>worldCtxStock.recallBetween(x, y, type)`

prop · L6213–6213

- calls: [`createWorld>nameOf`](#s-createWorld-nameOf) ×2

<!-- note:createWorld>worldCtxStock.recallBetween -->
A hash lookup rather than a scan: this is the single most-called callback in the file.
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-recallDetail"></a>`createWorld>worldCtxStock.recallDetail(x, y)`

prop · L6214–6219

- calls: [`createWorld>recall`](#s-createWorld-recall)

<!-- note:createWorld>worldCtxStock.recallDetail -->
A specific filed exchange, for the topics that talk about the past rather than about
the board. Weighted memories first: the thing worth bringing up is the thing that
mattered, not the most recent routine check-in.
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-warinessOf"></a>`createWorld>worldCtxStock.warinessOf(u)`

prop · L6221–6221

- calls: [`createWorld>regardFrom`](#s-createWorld-regardFrom)

<!-- note:createWorld>worldCtxStock.warinessOf -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-regardForPlayer"></a>`createWorld>worldCtxStock.regardForPlayer(u)`

prop · L6222–6222

- calls: [`createWorld>regardFrom`](#s-createWorld-regardFrom)

<!-- note:createWorld>worldCtxStock.regardForPlayer -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-regardBetween"></a>`createWorld>worldCtxStock.regardBetween(x, y)`

prop · L6223–6223

- calls: [`createWorld>regardFrom`](#s-createWorld-regardFrom)

<!-- note:createWorld>worldCtxStock.regardBetween -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-playerNear"></a>`createWorld>worldCtxStock.playerNear()`

prop · L6224–6224

<!-- note:createWorld>worldCtxStock.playerNear -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-playerBearing"></a>`createWorld>worldCtxStock.playerBearing()`

prop · L6225–6225

<!-- note:createWorld>worldCtxStock.playerBearing -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-threatNear"></a>`createWorld>worldCtxStock.threatNear(u)`

prop · L6227–6227

- calls: [`dist`](#s-dist)

<!-- note:createWorld>worldCtxStock.threatNear -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-threatCount"></a>`createWorld>worldCtxStock.threatCount(u)`

prop · L6228–6228

- calls: [`dist`](#s-dist)

<!-- note:createWorld>worldCtxStock.threatCount -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-threatBearing"></a>`createWorld>worldCtxStock.threatBearing()`

prop · L6229–6229

<!-- note:createWorld>worldCtxStock.threatBearing -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-hazardNear"></a>`createWorld>worldCtxStock.hazardNear(u)`

prop · L6230–6230

<!-- note:createWorld>worldCtxStock.hazardNear -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-beaconFault"></a>`createWorld>worldCtxStock.beaconFault(u)`

prop · L6231–6231

<!-- note:createWorld>worldCtxStock.beaconFault -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-trafficNear"></a>`createWorld>worldCtxStock.trafficNear(u)`

prop · L6232–6232

- calls: [`dist`](#s-dist)

<!-- note:createWorld>worldCtxStock.trafficNear -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-berthsFree"></a>`createWorld>worldCtxStock.berthsFree(u)`

prop · L6233–6238

- calls: [`dist`](#s-dist) ×2

<!-- note:createWorld>worldCtxStock.berthsFree -->
- L6234 · `const rings = units.filter(x => x.isStation);` — The nearest ring, not simply the first one in the array. With three stations in the
  system, answering every docking request with Ostrava's berth count meant two of them
  were never really in the conversation.
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-askingPrice"></a>`createWorld>worldCtxStock.askingPrice(u)`

prop · L6240–6240

<!-- note:createWorld>worldCtxStock.askingPrice -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-counterPrice"></a>`createWorld>worldCtxStock.counterPrice(u)`

prop · L6241–6241

<!-- note:createWorld>worldCtxStock.counterPrice -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-dealCloses"></a>`createWorld>worldCtxStock.dealCloses(u)`

prop · L6242–6242

<!-- note:createWorld>worldCtxStock.dealCloses -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-wantsFight"></a>`createWorld>worldCtxStock.wantsFight(u)`

prop · L6243–6243

<!-- note:createWorld>worldCtxStock.wantsFight -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-tipWasGood"></a>`createWorld>worldCtxStock.tipWasGood(x, y)`

prop · L6244–6244

<!-- note:createWorld>worldCtxStock.tipWasGood -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-wasHonest"></a>`createWorld>worldCtxStock.wasHonest(u)`

prop · L6245–6245

<!-- note:createWorld>worldCtxStock.wasHonest -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-lostHull"></a>`createWorld>worldCtxStock.lostHull()`

prop · L6246–6246

<!-- note:createWorld>worldCtxStock.lostHull -->
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-reception"></a>`createWorld>worldCtxStock.reception(listener, text, move, frame)`

prop · L6248–6272

<!-- note:createWorld>worldCtxStock.reception -->
How a line landed on the ship that heard it, as a number between about -1 and +1.

This is the world's half of the learning loop. The speaker chooses a shape; the
listener's taste decides whether that shape was the right one for it; the bank
remembers. Nothing here looks at whether the sentence was *good* — only at whether it
suited this particular listener, which is the only thing a speaker could learn.

- L6255 · `const miss = Math.max(0, Math.abs(words - taste.words) - 3);` — Length. Kept as a band rather than a point: a listener who wants short lines is not
  insulted by one word either side of its ideal, and scoring the exact word count made
  most of the figure noise the speaker could not act on. The band is what the length
  buckets in the phrasing bank can actually learn — three coarse choices, matched
  against three coarse preferences.
- L6258 · `const hedged = /\b(I think|near enough|give or take|I reckon|allegedly|so they tell me|may` — Qualifiers. A ship with no patience for them hears them as waffle.
- L6261 · `const ceremonial = /^(Be advised|Advising|For the record|Note that|Here is the thing|Tell` — Ceremony: the markers and sign-offs that dress a transmission. Some hulls want to be
  addressed properly and some want you to get on with it.
- L6265 · `const named = /,\s+[A-Z][a-z]+( \d\d)?[.?!]$/.test(text) || /^[A-Z][a-z]+( \d\d)?,/.test(t` — Being named. Separate from ceremony, because they are separate things to want: some
  ships take being addressed by name as courtesy and some as being talked at.
- L6268 · `if (move === 'directive') d += (taste.deference - 0.5) * 0.8;` — Being told what to do.
- L6269 · `if (move === 'accusation') d -= 0.3 + (1 - taste.deference) * 0.4;` — Being accused is never welcome, but a patient hull takes it better than a proud one.
<!-- /note -->

##### <a id="s-createWorld-worldCtxStock-thirdParty"></a>`createWorld>worldCtxStock.thirdParty(x, y)`

prop · L6274–6277

<!-- note:createWorld>worldCtxStock.thirdParty -->
<!-- /note -->

#### <a id="s-createWorld-commit"></a>`createWorld>commit(key, ctx, script)`

function · L6280–6309

- calls: [`createWorld>regardFrom`](#s-createWorld-regardFrom) ×2 · [`createWorld>rel`](#s-createWorld-rel) · [`memoriesFrom`](#s-memoriesFrom) · [`obligationFrom`](#s-obligationFrom) · [`registerOf`](#s-registerOf) · [`relKey`](#s-relKey)
- called by: [`createWorld>tick`](#s-createWorld-tick)

<!-- note:createWorld>commit -->
Apply what an exchange filed: memories, obligations, and the relationship counters.

- L6295 · `r.regard = (regardFrom(ctx.a, ctx.b) + regardFrom(ctx.b, ctx.a)) / 2;` — Regard between the pair is re-derived rather than incremented, so it always matches
  what is actually on file.
<!-- /note -->

#### <a id="s-createWorld-drift"></a>`createWorld>drift()`

function · L6311–6336

- called by: [`createWorld>tick`](#s-createWorld-tick)

<!-- note:createWorld>drift -->
Nudge the world so the same pair does not have the same conditions forever.

- L6315 · `u.position.x = Math.max(0, Math.min(1400, u.position.x + (rng.next() - 0.5) * 70));` — Wander, then lean back toward the place this ship works out of. Pure random walk
  spreads a large crew evenly across the system within a few thousand ticks, and an
  even spread means every pair is equally likely — which is the same as no
  relationships at all, because nobody meets anybody twice.
- L6332 · `if (u.hp <= 9 && rng.next() < 0.03) { lastLost = u.name; u.hp = Math.round(u.maxHp * 0.4);` — A hull that drops below nothing is gone, and the belt talks about it afterwards.
<!-- /note -->

#### <a id="s-createWorld-tick"></a>`createWorld>tick(dt=, force=)`

function · L6338–6367

- calls: [`chooseTopic`](#s-chooseTopic) · [`createWorld>commit`](#s-createWorld-commit) · [`createWorld>drift`](#s-createWorld-drift) · [`createWorld>worldCtx`](#s-createWorld-worldCtx) · [`dist`](#s-dist) ×2 · [`exchange`](#s-exchange)
- called by: [`createWorld>fastForward`](#s-createWorld-fastForward) · [`createWorld>train`](#s-createWorld-train)

<!-- note:createWorld>tick -->
Advance the world. Returns the transmissions produced this tick — usually none, which
is correct: a channel that carries traffic every second is not a working band, it is a
broadcast, and silence is what makes the traffic worth overhearing.

- L6342 · `const attempts = Math.max(1, opts.pairsPerTick || Math.ceil(units.length / 8));` — With two dozen ships in the system, one candidate exchange per tick means any given
  pair meets about as often as it did when there were nine — which is to say the
  population grew and the *evidence per relationship* shrank. Attempts scale with the
  crew so a bigger world is a busier one rather than a thinner one.
- L6351 · `const weighted = candidates.map(u => ({ u, w: 1 / (1 + dist(u, a) / 300) }));` — Nearer hulls are likelier to be the one raised — proximity is what makes a
  neighbour, and a neighbour is what makes a relationship worth learning from.
<!-- /note -->

#### <a id="s-createWorld-fastForward"></a>`createWorld>fastForward(ticks=, dt=)`

function · L6369–6374

- calls: [`createWorld>tick`](#s-createWorld-tick)

<!-- note:createWorld>fastForward -->
Run the world hard and quietly. Training the phrasing bank needs thousands of exchanges,
and rendering every one of them is what makes that slow — this keeps the memory and the
learning, and throws away all but the tail of the transcript.
<!-- /note -->

#### <a id="s-createWorld-train"></a>`createWorld>train(targetLines=, trainOpts=)`

function · L6376–6400

- calls: [`createWorld>tick`](#s-createWorld-tick)
- called by: [`createWorld>selfTrain`](#s-createWorld-selfTrain) ×2

<!-- note:createWorld>train -->
Fast-forward the world to warm the phrasing bank.

A demo that starts cold shows a crew with nothing learned, which is the least
interesting state the system has. Training runs the same tick loop with the log
suppressed — the transmissions are what cost memory, not the learning — and returns
before/after figures so the caller can show that it did something.

`budgetMs` makes it chunkable: the browser calls it repeatedly in small slices so the
page keeps painting, and the same call runs uninterrupted headless.

- L6384 · `logCap = trainOpts.keepLog || 40;` — The log is the only unbounded cost in a training run, and nobody reads a hundred
  thousand transmissions. Keep the last handful so the band is not empty afterwards —
  unless the caller is about to measure the output, in which case it needs a sample big
  enough to measure. Profiling forty lines and calling it a corpus reading was giving a
  question rate of exactly zero, which is a statement about the sample and not about
  the generator.
<!-- /note -->

#### <a id="s-createWorld-dialogues"></a>`createWorld>dialogues()`

function · L6402–6410

- called by: [`createWorld>profile`](#s-createWorld-profile) · [`createWorld>transcript`](#s-createWorld-transcript)

<!-- note:createWorld>dialogues -->
The log as dialogues rather than as lines, which is what any corpus measurement needs:
a conversation is the unit, not a transmission.
<!-- /note -->

#### <a id="s-createWorld-transcript"></a>`createWorld>transcript()`

function · L6412–6413

- calls: [`createWorld>dialogues`](#s-createWorld-dialogues)

<!-- note:createWorld>transcript -->
The log as text, in the format `parseTranscript` reads back.
<!-- /note -->

#### <a id="s-createWorld-profile"></a>`createWorld>profile()`

function · L6415–6415

- calls: [`createWorld>dialogues`](#s-createWorld-dialogues) · [`profileOf`](#s-profileOf)
- called by: [`createWorld>selfTrain`](#s-createWorld-selfTrain) ×2

<!-- note:createWorld>profile -->
What this world's own output looks like, measured the way a corpus would be.
<!-- /note -->

#### <a id="s-createWorld-selfTrain"></a>`createWorld>selfTrain(linesPerRound=, rounds=)`

function · L6417–6438

- calls: [`calibrate`](#s-calibrate) · [`compareProfiles`](#s-compareProfiles) ×2 · [`createWorld>profile`](#s-createWorld-profile) ×2 · [`createWorld>train`](#s-createWorld-train) ×2

<!-- note:createWorld>selfTrain -->
Run, measure, correct, run again.

This is the honest form of "train on its own output". Nothing here learns language from
the log — that would only reinforce what the generator already over-produces. What it
does is measure the log against the shape of real conversation and move three global
dials to close the gap: how full the sentences are, how long the exchanges run, and how
often anybody asks anything. Two rounds converge; the second round exists because moving
the dials changes the thing being measured.

- L6420 · `logCap = 20000;` — enough of a sample to measure honestly
<!-- /note -->

#### <a id="s-createWorld-talk"></a>`createWorld>talk(nameOrUnit, text)`

function · L6440–6467

- calls: [`createWorld>playerRel`](#s-createWorld-playerRel) ×2 · [`createWorld>regardFrom`](#s-createWorld-regardFrom) · [`createWorld>worldCtx`](#s-createWorld-worldCtx) · [`registerOf`](#s-registerOf) · [`talkToNpc`](#s-talkToNpc)

<!-- note:createWorld>talk -->
Say something to a ship. Files the exchange the same way an NPC one would be filed.
<!-- /note -->

#### <a id="s-createWorld-whyRegard"></a>`createWorld>whyRegard(holder, subject)`

function · L6469–6475

- calls: [`createWorld>recall`](#s-createWorld-recall)

<!-- note:createWorld>whyRegard -->
Why does this character feel that way? The audit trail behind a regard figure.
<!-- /note -->

#### <a id="s-createWorld-time"></a>`createWorld.time()`

prop · L6478–6478

<!-- note:createWorld.time -->
<!-- /note -->

#### <a id="s-createWorld-speechReport"></a>`createWorld.speechReport(name, limit)`

prop · L6483–6483

<!-- note:createWorld.speechReport -->
What has this character learned about being understood?
<!-- /note -->

#### <a id="s-createWorld-channels"></a>`createWorld.channels()`

prop · L6485–6485

<!-- note:createWorld.channels -->
<!-- /note -->

#### <a id="s-createWorld-stats"></a>`createWorld.stats()`

prop · L6486–6490

- calls: [`grammarStats`](#s-grammarStats) · [`topicStats`](#s-topicStats)

<!-- note:createWorld.stats -->
<!-- /note -->

### <a id="s-PLAYER_BATTERY"></a>`PLAYER_BATTERY`

const · L6494–6505

<!-- note:PLAYER_BATTERY -->
═════════════════════════════════════════════════════════════════════
 14. UNIFIED SELF-TEST
═════════════════════════════════════════════════════════════════════

`runSpeechSelfTest()` runs the grammar cases, the topic table checks, and then the two
things neither of those could check on its own: a world left running for a few thousand
ticks, and a battery of things a human might type. Both are the cases that only exist
once the pieces are in one file, which is the argument for the file being one file.

Things a player might plausibly say, including things the parser should decline.
<!-- /note -->

### <a id="s-checkPlayerTalk"></a>`checkPlayerTalk()`

function · L6507–6529

- calls: [`createWorld`](#s-createWorld) · [`proof`](#s-proof)
- called by: [`runSpeechSelfTest`](#s-runSpeechSelfTest)

<!-- note:checkPlayerTalk -->
- L6522 · `const victim = w.units[0];` — Being threatened has to cost something, or none of the reputation machinery is wired up.
<!-- /note -->

### <a id="s-checkWorld"></a>`checkWorld(ticks=)`

function · L6531–6573

- calls: [`checkMove`](#s-checkMove) · [`createWorld`](#s-createWorld) · [`proof`](#s-proof)
- called by: [`runSpeechSelfTest`](#s-runSpeechSelfTest)

<!-- note:checkWorld -->
- L6547 · `let prev = null;` — Moves and adjacency, over a world rather than a fixture. Both are checked here as well
  as in the topic tests, because the director coerces replies and a coercion that produced
  an illegal move would be invisible to a test that never ran one.
- L6560 · `const learned = w.speechReport(null, 400);` — The bank has to be doing something. Rows with a non-zero mean are the evidence that
  reactions are being credited back to the line that provoked them; without them the
  learning layer is an expensive no-op.
- L6568 · `const spread = w.units.map(u => Math.abs(w.regardFor(u, w.units[(w.units.indexOf(u) + 1) %` — Reputation must actually move, or the memory store is a write-only log.
- L6570 · `const recent = w.log.slice(-40).map(l => l.topic);` — And the log must not be one topic on repeat.
<!-- /note -->

### <a id="s-checkLearning"></a>`checkLearning(seeds=, lines=)`

function · L6575–6593

- calls: [`checkLearning>arm`](#s-checkLearning-arm) ×2
- called by: [`runSpeechSelfTest`](#s-runSpeechSelfTest)

<!-- note:checkLearning -->
Does the learning loop actually earn its place?

The only honest way to ask is an A/B: the same seed, the same crew, the same topics, run
twice — once with the bank steering delivery and once with it merely recording. If the
steered arm's lines do not land better on the ships that heard them, the whole apparatus
is decoration and should be deleted rather than admired.

The effect is small in absolute terms (a few percent of the reception scale) and that is
expected: most of how a line lands is decided by what the conversation is about, which is
not something a speaker's manner can fix. What matters is that it is positive, and that it
is positive across seeds rather than in the one that happened to be tried first.

- L6589 · `const floor = lines >= 30000 ? 0.018 : 0.008;` — The floor is a real number now, not merely "not negative". Before the reception function
  was rebalanced the gain sat around +0.005, which was positive and almost meaningless; if
  a future change drags it back down there, that is a regression worth failing over.
  The floor scales with how much training the caller asked for: the gain is an average over
  the whole run, and a short run spends most of it cold. Eighteen thousand lines is enough
  to see the effect but not enough to see all of it, and a fixed floor calibrated on longer
  runs was failing the test for being run briefly rather than for anything being wrong.
<!-- /note -->

#### <a id="s-checkLearning-arm"></a>`checkLearning>arm(learning)`

function · L6579–6583

- calls: [`createWorld`](#s-createWorld)
- called by: [`checkLearning`](#s-checkLearning) ×2

<!-- note:checkLearning>arm -->
<!-- /note -->

### <a id="s-checkScale"></a>`checkScale(crew=, lines=)`

function · L6595–6625

- calls: [`createMemoryStore`](#s-createMemoryStore) · [`createWorld`](#s-createWorld)
- called by: [`runSpeechSelfTest`](#s-runSpeechSelfTest)

<!-- note:checkScale -->
A crew of thirty, run hard, to catch what only breaks at scale.

- L6604 · `let worst = 0;` — The store must stay bounded per pair, or a long session is a leak with a nice name.
- L6610 · `const store = createMemoryStore({ perPair: 40, halfLife: 1e9 });` — Consolidation, tested directly rather than inferred from the world: a run long enough to
  push a single pair past the cap naturally is longer than a test should be, and "the store
  is large so it must have consolidated" is not the same claim at all.
- L6619 · `if (store.regard('A', 'B', 400) < 0.99) bad.push('consolidation lost the weight it was hol` — Regard is what the rows are *for*, so it has to survive the fold. With decay switched off
  the sum should be intact, and it saturates at the clamp — which is the point: a character
  with two hundred good dealings is not twice as fond as one with a hundred.
<!-- /note -->

### <a id="s-checkCorpus"></a>`checkCorpus()`

function · L6627–6659

- calls: [`createWorld`](#s-createWorld) · [`parseTranscript`](#s-parseTranscript) ×5 · [`profileOf`](#s-profileOf) ×4 · [`resetCalibration`](#s-resetCalibration) ×2
- called by: [`runSpeechSelfTest`](#s-runSpeechSelfTest)

<!-- note:checkCorpus -->
The corpus layer: parsing, measuring, and the calibration loop actually closing a gap.

- L6630 · `const named = parseTranscript('A: hello there\nB: hello yourself\n\nA: again\nB: again');` — Three transcript formats in, dialogues out.
- L6636 · `const short = profileOf(parseTranscript('A: one two three four\nB: five six seven eight'))` — Measurement has to be sample-size stable, or comparing two corpora is meaningless.
- L6642 · `const big = [], small = [];` — A profile of a big sample and of a small one must give comparable variety figures.
- L6650 · `resetCalibration();` — And the loop has to close a gap it can close. Turn count is the one the dials control
  most directly, so it is the one worth asserting on.
<!-- /note -->

### <a id="s-runSpeechSelfTest"></a>`runSpeechSelfTest(opts=)`

function · **exported** · L6661–6704

- calls: [`checkCorpus`](#s-checkCorpus) · [`checkLearning`](#s-checkLearning) · [`checkPlayerTalk`](#s-checkPlayerTalk) · [`checkScale`](#s-checkScale) · [`checkWorld`](#s-checkWorld) · [`runGrammarSelfTest`](#s-runGrammarSelfTest) · [`runTopicSelfTest`](#s-runTopicSelfTest)

<!-- note:runSpeechSelfTest -->
Everything, headless. Returns { pass, fail, failures }.
<!-- /note -->

## Module-level calls

- calls: [`registerOf`](#s-registerOf) · [`chooseFrom`](#s-chooseFrom) · [`whereFact`](#s-whereFact) · [`nameFor`](#s-nameFor) · [`reasonFact`](#s-reasonFact) · [`damageFact`](#s-damageFact) · [`warm`](#s-warm) · [`cold`](#s-cold) · [`has`](#s-has) · [`laden`](#s-laden) · [`familiar`](#s-familiar) · [`priceFact`](#s-priceFact) · [`needFact`](#s-needFact) · [`known`](#s-known) · [`threatFact`](#s-threatFact) · [`headingFact`](#s-headingFact) · [`hurt`](#s-hurt) · [`numberWord`](#s-numberWord) · [`whenFact`](#s-whenFact) · [`holdFact`](#s-holdFact) · [`lowFuel`](#s-lowFuel)
