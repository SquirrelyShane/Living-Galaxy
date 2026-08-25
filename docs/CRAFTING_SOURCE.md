# Source: `Space_RPG_Crafting_Database-3.json`

The crafting catalogue is generated from this file, kept here unmodified as the authoring
source. Nothing at runtime reads it — the game imports `src/data/crafting/*.js`, which are
derived from it.

Keeping both is deliberate. The JSON is the right shape for *writing* a catalogue: one flat
recipe table, 1,204 rows, easy to edit and diff. It is the wrong shape for *playing* one,
where the questions are "what does this need" and "what can I make right now", and both
want an index rather than a scan. So the JSON is the master and the modules are the build.

## What was derived

| Source | Becomes | Count |
|---|---|---|
| `materials.*` (4 groups) | `crafting/materials.js` | 76 |
| `ship_modules` | `crafting/modules.js` | 70 |
| `ship_weapons` | `crafting/weapons.js` | 50 |
| `ammunition` | `crafting/ammo.js` | 40 |
| `personal_items` | `crafting/personal.js` | 75 |
| `recipes` (1,204 rows) | folded into each blueprint's `materials` | — |

The flat `recipes` table is *not* imported separately: every row it contains is already
present as `materials` on the item it belongs to, and carrying both would mean two records
of the same fact that can disagree. The suite checks the derived form instead — every
material referenced by every blueprint must exist.

## Regenerating

If the JSON is updated, the modules are rebuilt from it by the same split: group by
category, key by id, keep `materials` inline. Two properties the suite will hold you to:

- **Ids stay globally unique** across categories, because `categoryOf()` resolves from the
  prefix (`MOD-`, `WPN-`, `AMMO-`, `ITM-`) and a collision would silently mis-route an item.
- **Every material referenced exists**, either in the material table or as another
  blueprint. A typo'd id currently fails loudly at test time; without the check it would
  fail at 3am as an unbuildable recipe nobody could explain.

## Trade-only entries

A few items ship with an empty `materials` object on purpose — `ITM-036 Luxury Trade Goods`
is the current example. These are cargo you acquire rather than fabricate.

That empty object is load-bearing and easy to get wrong. An empty bill of materials reads
naturally as "needs nothing", which would let a fabricator print the most valuable item in
the catalogue out of an empty hold, forever. `craftable()` treats an empty bill as
*uncraftable*, and the suite checks it.
