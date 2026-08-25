# PATCH v1.01.98 — "Fair Weight"

The cheap sweep v1.01.97 proposed: three one-file items that had been tracked as though they
were slices. All three landed. Two of them turned up a defect underneath, which is the part
worth reading. Schema stays **17**; a v1.01.97 save loads untouched.

---

## The freight board was never an ore feature

`ui/dock.js` hardcoded `'ore'` into the fee quote and the post. Everything underneath was
already general — `dealValue()` prices any commodity at the destination market, `settle()`
lands it there, `postPlayerJob({ commodity, kg, pay, dest })` has taken a commodity since
v1.01.00. A pilot with a hold full of survey data could not post a kilo of it, and the reason
was four characters in a UI file.

The board now offers anything with 100 kg aboard, behind a chip picker — one tap per
commodity rather than a dropdown, because there are three at most and a phone should not open
a menu to change one word. It reuses the existing `.chip` / `.chip.on` styles, which already
carry `pointer:coarse` sizing; the only new CSS is a three-line `.chiprow` flex rule.

This is a better decision than it looks. `TRADE_MULT` spreads survey data **0.80–1.50** across
station categories against ore's 0.85–1.40, so which station you post to matters nearly twice
as much for data as for the commodity the board used to be locked to.

`test/deals.mjs` asserts the whole path per commodity now — priced, quoted, carried, landed on
the destination market — so the next caller can rely on it rather than rediscovering it.

## SEND had no quantity, and the fix found a cap that was not being kept

`deliverTo(siteId, matId, qty)` has taken a quantity since v1.01.20. The only caller sent
`min(held, 100)` from a fixed button, so splitting a load was impossible: you sent 100 or you
sent 100. There is now a shared step chip — 25 / 100 / 500 / ALL — above the rows, because the
decision a player is making is *how much at a time*, not *how much of iron*.

Asking what the largest legal quantity was is what exposed the real bug. **`deliverTo()` never
respected `storageCap()`.** Production ticks read the cap and clamp to it; a hand delivery went
straight into `site.store` and could push a ground store past a ceiling the site's own
facilities keep to. It now fills to the cap, says so, and **returns the quantity actually
landed rather than a boolean** — because two different things can shorten a delivery and a
caller offering a quantity control needs to know which number to show afterwards.
`test/industry.mjs` covers the clamp, the at-cap state and the full-store case.

## The game quoted a fee that haulers were free to refuse

This one was not on the list. It surfaced while chasing a test failure eighty lines away from
the edit that caused it.

The freight board's suggested fee was `baseBar × suggestMargin` — a constant, **0.425** of what
the cargo is worth at the destination. A hauler's actual bar is

```
0.34 + greed × 0.30 − sociability × 0.12 − trust × 0.18
```

so **any hauler with greed above roughly 0.48 refuses the game's own suggested number.** The
pilot gets quoted a fee, posts it, and is told *Nobody took the job at that rate.* The config
comment read *headroom in the fee the UI suggests, so a post usually lands*, and "usually" had
never been counted — the exact shape of the v1.01.60 lesson.

Two changes. `acceptanceBar(a, b)` is split out of `willAccept()`, so the quote and the
judgement read one formula instead of two that could drift. And `suggestedFee()` quotes against
**the band rather than a constant**: `postPlayerJob()` already walks every hauler, so the fee
that matters is the one the most amenable of them will take, and that is a real number
available at quote time. The static margin survives as the fallback for an empty band, where
there is nobody to quote against. `DEALS.quoteMargin: 1.04` is the headroom over the live bar,
for rounding and for price drift between the quote and the post.

Measured rather than asserted, with a new tool — `node test/fee-probe.mjs`, also
`npm run probe:fee`. It reports a rate and asserts nothing, for the same reason
`test/profile.mjs` is not in `all.mjs`:

```
static quote would be baseBar × suggestMargin = 0.425 of cargo worth

ore      1 hauler(s): taken 120/120 (100%) · mean fee    954 cr · mean best bar 0.459
ore      2 hauler(s): taken 120/120 (100%) · mean fee    927 cr · mean best bar 0.446
ore      4 hauler(s): taken 120/120 (100%) · mean fee    910 cr · mean best bar 0.438
salvage  1/2/4:       360/360 · mean best bar 0.461 / 0.446 / 0.436
data     1/2/4:       360/360 · mean best bar 0.461 / 0.447 / 0.437
```

360 posts, 360 taken. The mean best bar sitting at 0.44–0.46 against the old 0.425 constant is
the size of the gap that was there, and it falls as haulers are added — a busier band is a
cheaper band, which is the right shape for it to have.

## Nine dead config keys deleted

v1.01.97 found fifteen inert keys where the audit had reported four. Nine of them were
deletions rather than decisions:

- **The whole `FLEET` block.** Nothing imported it. Order modes are declared per order type in
  `systems/orders.js`, `branches` duplicated `BRANCH_KEYS`, and `maxActive` was shadowed by
  `ORDERS.maxActive`, which *is* read. A plausible-looking knob that changes nothing is worse
  than no knob.
- **The whole `AI` block.** It named a model — `onnx-community/SmolLM2-360M-Instruct` — that
  was not the one being loaded, and a local inference endpoint that nothing connected to.
- **`NET.interp`**, whose own comment called it a legacy damp rate.

Each left a comment where it used to sit, saying where the live value lives, so it does not get
re-added by someone who notices the gap.

The model id was the interesting one: it was declared **three times**, and the dead declaration
disagreed with the other two about which repository the weights came from.
`systems/assistant.worker.js` now reads `MODELS[DEFAULT_MODEL].id` from
`npc-avatar/llm/models.js` — the registry `AVATAR.model` and `systems/npc-brain.js` already key
into. One source.

`INERT` in `test/reachability.mjs` is down to six, and all six are decisions: each names a
behaviour somebody wanted, and none can be closed by deleting a line without deciding not to
have it.

## Named, not fixed

**`test/deals.mjs` is order-dependent.** Its blocks share one `spawnNpc` id counter and one
world RNG stream, so inserting a block that spawns ships changes which personas every block
*below* it draws. Two assertions are sensitive to it — `somebody takes a fairly-priced job` and
`a haul offer on the radio can become a real obligation` — and both are properties of one draw
rather than of the rule they name. Re-seeding inside `reset()` was tried: it fixes the first and
breaks the second, so it is real work rather than a line. Reverted. The new block went at the
end of the file and a comment at the top of the file says to do the same. Filed in bucket C of
`OPEN_ITEMS.md`, with the note that other suites may share the shape — this was found by
accident, not by looking.

## Files touched

| file | change |
|---|---|
| `src/ui/dock.js` | freight board posts any commodity; chip picker; in-transit rows name the cargo |
| `src/ui/ops.js` | shared SEND step chip; room shown in the section head; disabled at zero |
| `src/systems/planetary.js` | `deliverTo()` clamps to `storageCap()` and returns the quantity landed |
| `src/systems/deals.js` | `acceptanceBar()` split out; `suggestedFee()` quotes against the live band |
| `src/systems/assistant.worker.js` | reads the model id from `npc-avatar/llm/models.js` |
| `src/core/config.js` | `FLEET` and `AI` blocks deleted, `NET.interp` deleted, `DEALS.quoteMargin` added |
| `src/core/version.js` | v1.01.98 "Fair Weight" |
| `css/panels.css` | `.chiprow` |
| `test/deals.mjs` | per-commodity settlement block; order-dependence note |
| `test/industry.mjs` | new delivery contract; storage-cap assertions |
| `test/reachability.mjs` | `INERT` down to six |
| `test/fee-probe.mjs` | **new** — quoted-fee acceptance rate |
| `package.json` | v1.01.98; `npm run probe:fee` |
| `docs/OPEN_ITEMS.md` | three bucket-B items closed, bucket D rewritten, bucket E's first three closed, two new C entries |
| `docs/REACHABILITY_AUDIT.md` | banner updated for the new inert count |

## Verified

- `node test/all.mjs` — **41/41 suites green, 3,277 checks** (63 s).
- `node test/fee-probe.mjs` — 360/360 quoted fees accepted across three commodities and one,
  two and four haulers.
- `node test/reachability.mjs` — 71 checks; inert set is exactly the six declared.
- Every changed module `node --check`ed, and `src/core/config.js` re-imported to confirm
  `FLEET` and `AI` are gone and `NET.interp` is `undefined`.

## Not verified

- **No panel was opened on a phone.** The freight board picker and the SEND step chip are both
  new touch targets on tabs that were already on the never-opened-on-hardware list, which now
  runs to six. This is the most overdue item in `OPEN_ITEMS.md` and this patch made it slightly
  worse.
- **The fee change is measured against a band of haulers standing still 8 Mm from the player.**
  The probe spawns them and quotes immediately; it does not run a world where trust has had time
  to accumulate. `barPerTrust` at 0.18 is the largest single term in the bar and the probe never
  exercises it.
- **`MANAGERS.upkeep` is still not charged**, so an experimental site manager still runs free.
  Left deliberately: wiring it is a balance change.
