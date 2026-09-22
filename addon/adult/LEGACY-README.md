# Family Legacy expansion v1.0

An additive, non-graphic family-history module for the fictional space RPG’s `adult_speech` add-on. It supplies conversations about founders, successive generations, inherited names, corporate connections, and building a family. The existing source files remain in the archive; `index.js` now imports the new family hook.

## Try the standalone demo

From the `adult` folder:

```bash
bash start-demo.sh
```

Open **http://127.0.0.1:8080/demo.html**. Use `bash start-demo.sh 8081` if 8080 is occupied. In Termux, install Python with `pkg install python` first. The demo needs no npm packages or internet connection. ES modules require the local server; opening the HTML as a `file://` URL will not work consistently.

The demo contains an explicitly fictional example, not inferred history from your game. It remembers progress in this browser and can export a JSON save. Disclosure and family-planning controls are scenario controls for testing the dialogue.

## What is implemented

- Founder knowledge with sources, missing-record responses, founding circumstances, costs, and archive leads.
- Multi-generation ancestry through biological, adoptive, and guardian links, with cycle detection.
- Family name pools with meanings or commemorative reasons, founder-name suggestions, stable seeded order, deduplication, and a saved naming shortlist.
- Separate corporate employment, founding, and ownership records, including dates, roles, share percentages, and record provenance.
- Connections between two families through corporations appearing in each recorded ancestry. Shared employment is not presented as proof of kinship or a personal meeting.
- Public, personal, and private disclosures; speaker-specific knowledge; verified records, testimony, and rumors.
- Conversation memory for records heard, visits, shortlist, timing preferences, and a shared-care principle.
- Non-graphic family conversations about readiness, birth/adoption/guardianship, preserving a child’s history, parenting duties, and waiting without penalty.
- Non-graphic flavor for host-confirmed pregnancy, birth, adoption, loss, and postponed plans, with idempotent event IDs.

## Integrate with the game

Keep the original location of the add-on folder. Existing host imports expect `../../js/...`. The supplied ZIP did not include the host game, so this expansion was tested independently and with a minimal host-contract check, not in your complete game.

The new `legacy-addon.js` registers a `talkTopics` hook automatically through `index.js`. **Populate a world registry before family topics appear.** No sample genealogy is silently inserted into your actual world.

At new-world creation or save load:

```js
import { installFamilyLegacy, exportFamilyLegacy, familyEvent }
  from './addon/adult/legacy-addon.js'; // Adjust to the actual location.

installFamilyLegacy(savedFamilyRegistry, {
  onChange(registry) {
    // Include this in your existing save mechanism.
    // The adapter also assigns sim.familyLegacy = registry.
  },
  canPlanFamily(npcRecord, playerRecord, liveNpc) {
    // Return true only when your own relationship system says both
    // adult partners are willing to discuss family planning now.
    return liveNpc.familyPlanningAgreed === true;
  }
});

const registryForSave = exportFamilyLegacy();
```

For a prototype, explicitly import `EXAMPLE_LEGACY` from `legacy-example.js` and install it. Replace it with your world’s records for production. A crew member’s `legacyPersonId`, or otherwise their `id`, must match the registry. The player is resolved the same way from `playerAsPerson()`; when it provides neither ID, the adapter uses `player`.

Set `liveNpc.legacyDisclosure` to `0` (public), `1` (personal), or `2` (private) according to your own relationship progression. Disclosure is rechecked when a corporate record is opened. `knownTo` restrictions still apply at every disclosure level.

The planning topic requires `social.family === true`, an existing player partnership, explicit numeric ages of at least 18 for both registry people, no captivity, and a true result from your `canPlanFamily` callback. These gates affect planning conversations, not ordinary genealogy. They do not call conception functions, change contraception, apply trust/morale, or spend money. The family-history hook is independent of the existing adult-scene toggle.

Call this only **after** the simulation confirms an event:

```js
const flavor = familyEvent({
  id: 'birth:world-4:child-207',
  type: 'birth',
  parentIds: ['npc-12', 'player'],
  childName: 'Aven',
  year: 2314
});
// Pass flavor to the game's log or dialogue renderer as plain text.
```

Events are narration records, not birth or adoption mechanics. The host must add the new child and parent links to its world registry, then reinstall/update that registry. Repeated event IDs return the original text without adding a duplicate. Event narration remains available separately from intimate scenes.

## World data structure

`legacy-example.js` is a complete working example with two families, seven people, three ancestral levels, two corporations, and five corporate ties.

| Collection | Main fields |
| --- | --- |
| `people` | `id`, `name`, optional `givenName`, `age`, `familyId`, `parents: [{id, kind}]`, `stories` |
| `families` | `id`, `name`, `founderId`, `founding`, `names`, `traditions`, `archives` |
| `corporations` | `id`, `name` |
| `ties` | `id`, `personId`, `corporationId`, `kind`, `startYear`, `endYear`, optional `role`, `share`, `note` |
| `memories` | Per speaker/listener dialogue state, managed by the module |
| `events` | Host-confirmed family-event records |

A `parents` edge is `biological`, `adoptive`, or `guardian`. An ancestry result’s `kind` describes the edge arriving at that ancestor; it does not imply every edge along the path has that kind. Use `ancestors(db, id, {kind: 'biological'})` for an exclusively biological traversal.

`founding`, `stories`, and `ties` may include `status: 'verified' | 'testimony' | 'rumor'`, a `source`, `visibility: 'public' | 'personal' | 'private'`, and `knownTo: ['person-id', ...]`. Unknown status defaults to testimony. Record-level disclosure is dialogue logic, not a security boundary against someone inspecting a local save file.

A name entry is `{name, reason}` with optional visibility/knowledge fields. `family.names` is the authored cultural/generational name base; no real-world meaning is invented from a surname. Stable suggestions can be requested directly:

```js
import { nameSuggestions } from './legacy.js';
const candidates = nameSuggestions(registry, {
  familyIds: ['vale', 'merrow'],
  seed: 'world-4:child-207',
  usedNames: ['Iona'],
  speakerId: 'mara',
  level: 1,
  count: 6
});
// [{name, reason, familyId}, ...]
```

This returns given-name candidates. The host owns surname customs, final naming decisions, calendar/age progression, succession law, current share transfers, and corporation mergers. Historical shareholding never awards ownership automatically.

## Verification

```bash
node --test legacy.test.js
```

Tests cover ancestry, adoptive links, corporate connections, disclosure, naming, planning gates, memory roundtrips, idempotent outcomes, invalid registries, and traversal of the example’s conversation branches. No dependencies are required beyond Node.
