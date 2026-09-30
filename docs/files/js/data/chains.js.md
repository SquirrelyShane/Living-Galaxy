# js/data/chains.js

[index](../../../README.md) · 341 lines · 2 symbols · 0 imports · 2 importers

## About

<!-- note:@file -->
LIVING GALAXY — chain contracts: the multi-stage work a desk runs.

0.3.21. A chain is a job with a story: three to five stages, each one an
ordinary board job built from an existing KIND (js/economy/contracts.js), posted one
at a time. Finish a stage and the next one is waiting — here, or at the port
the desk sends you to — and the last one pays a bonus and standing on top.

DATA ONLY. The engine is js/economy/chains.js; contracts.js builds each stage's job
from the kind named here and overrides the title, the text, the pay and the
quantity. Which means a chain never invents a mechanic: every stage is
something the game already knows how to complete.

  { id, cat, name, blurb, sectors?, stages: [{ kind, title, text, payK?, qtyK?, good?, at? }], bonus, standing }

  kind    one of that department's kinds (CATEGORIES in contracts.js)
  at      "same" — posted at the port the last stage was; "next" — a nearby
          port the engine picks and names. Stage 1 has no `at`.
  payK    multiplier on the kind's own pay; qtyK on its own quantity
  good    forces the ore/cargo where the story needs a particular one

The prose is per-stage and the numbers are not: amounts, ore names, port
names, drift names, beacon and world names are filled in by the engine from
the live sky, so a stage reads the same way the one-off jobs do.
<!-- /note -->

## Imports

_none_

## Imported by

- [js/economy/chains.js](../economy/chains.js.md) — `CHAINS`, `CHAIN_BY_ID`
- test/balance.test.mjs _(outside js/)_ — `CHAINS`

## Exports

- [`CHAINS`](#s-CHAINS) · const — used by [js/economy/chains.js](../economy/chains.js.md), test/balance.test.mjs
- [`CHAIN_BY_ID`](#s-CHAIN_BY_ID) · const — used by [js/economy/chains.js](../economy/chains.js.md)

## Effects

_none detected_

## Symbols

### <a id="s-CHAINS"></a>`CHAINS`

const · **exported** · L1–339

<!-- note:CHAINS -->
- L2 · `{` — ---- MINING & EXTRACTION ----------------------------------------------------
- L2 · `{` — ---- FREIGHT & LOGISTICS ------------------------------------------------------
- L2 · `{` — ---- TRADE & PROCUREMENT ------------------------------------------------------
- L2 · `{` — ---- SECURITY & BOUNTIES -------------------------------------------------------
- L2 · `{` — ---- SALVAGE & RECOVERY ---------------------------------------------------------
- L2 · `{` — ---- INDUSTRY & CONSTRUCTION -----------------------------------------------------
- L2 · `{` — ---- ENERGY & FUEL ----------------------------------------------------------------
- L2 · `{` — ---- SURVEY & SCIENCE ---------------------------------------------------------------
- L2 · `{` — ---- CIVIC SERVICES ------------------------------------------------------------------
<!-- /note -->

### <a id="s-CHAIN_BY_ID"></a>`CHAIN_BY_ID`

const · **exported** · L341–341

<!-- note:CHAIN_BY_ID -->
<!-- /note -->
