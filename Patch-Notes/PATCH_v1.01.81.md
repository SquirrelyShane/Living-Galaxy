# PATCH v1.01.81 — "Consignment Note"

Two reported bugs, one root cause: something existed in the model with no honest surface.
A haul contract that never loaded any cargo, and a column of buttons a phone cannot read.
Schema stays **17**.

---

## The haul, and the hole under the first fix

A haul contract read `Haul 2,213 kg salvage to Colony Habitat` and put nothing in the
hold. `creditDelivery()` credited the contract when you *sold* the commodity at the
destination — so the only way to fly one was to already own the goods, and there is no way
to buy commodities anywhere in the game. `sell()` and `sellAll()` exist; nothing buys. So
a haul was only completable with ore you mined, salvage you shot for, or data you probed —
and the contract text says a load is being handed to you.

Loading the cargo at acceptance is the right call and it was already in the tree. What it
opened was worse than what it closed: the load was indistinguishable from the pilot's own
cargo, so it could be sold at the station that had just handed it over. Measured on seed 42:

| step | credits |
|---|---|
| start | 1,000 |
| accept `Haul 2,213 kg salvage` (pay 8,264) | 1,000 |
| `sellAll()` **at the issuing station** | 14,278 |
| abandon the contract (fail fee) | 13,038 |

**+12,038 cr for zero flying, against a contract that paid 8,264** — abandoning was
strictly more profitable than delivering, and repeatable at every station with a haul on
the board.

### A consignment is not your cargo

The load now rides in the hold and counts against capacity, but it belongs to the issuer:

- `c.loaded` records what was lent. `consignedFor(key)` sums it across active hauls, and
  `sellableOf(key)` is the hold less that. Derived from the contracts rather than stored
  beside the cargo — a second number that must be kept in step with the first is a second
  number that can drift out of step with it, and this one already persists.
- `sell()` sells only the free portion. Selling a stack that is entirely consigned tells
  you why rather than failing silently. The pilot's own ore stays sellable when a
  consignment of ore is aboard; only the lent part is frozen.
- **Delivery is a separate act from selling**, because the load was never yours to sell.
  `deliverConsignment()` hands it over at the destination and credits the contract. The fee
  is the payment.
- `creditDelivery()` no longer credits haul at all. It used to, which double-counted:
  a pilot carrying their own ore *and* a consignment of ore could satisfy the contract from
  their own stock and keep the lent load, collecting the fee and the goods.
- Abandoning or expiring **reclaims** the load. Clamped, because a raid or a death can empty
  a hold and a pilot cannot hand back what was shot out of them; the shortfall is reported
  rather than driving the hold negative.
- Accepting is blocked when the hold cannot take the load, with the hold named as the reason.

Supply contracts are untouched and tested separately: "we are short, bring some in" means
you source the goods and sell them here, so a sale genuinely *is* the delivery.

### One thing found while fixing it

Changing `sell()` from `S.cargo[key] = 0` to a subtraction introduced a rounding leak —
`Math.round(30.583)` is 31, and subtracting 31 from 30.583 leaves a negative hold.
`test/run.mjs` caught it. The free portion is now removed in full including its fraction,
and priced on the rounded figure, which is what the old code effectively did.

---

## "Ops doesn't exist"

It existed. `#btn-ops` was wired, the overlay was styled, `initOps()` ran. Its face was `◈`
and its label lived in a `title` attribute — a hover affordance, on a device with no hover.
Eleven buttons in that column, and the ones a player most needs are the ones whose glyph
nobody guesses.

`◈ → OPS`, `◆ → ARIA`, `◎ → TGT`, `▣ → CAM`, `⚖ → LDG`. The conventional ones keep their
glyphs — `♪`, `⚙`, `☏`, `💾`, `⌃` — and `FA` was already text, so the precedent was there.
Tracking is tightened and the two smallest breakpoints drop a point of font size so a
four-letter label still fits the 30 px button.

The station tab now offers a way through in every state: **OPEN OPS — COMPANY COMMAND** at
your HQ, the same at any other station when you hold a charter, and **REGISTER A COMPANY
CHARTER** when you do not. That last one matters most — it is the only place in the game
that says the executive layer exists at all, rather than leaving an empty Staff tab to be
discovered.

I did check whether the column overflows at the four height breakpoints. It does not: 11
buttons need 337 px at the 860 breakpoint against 337+ available down to 677 px viewport,
and each tighter breakpoint gains more than it needs. Overflow was not the problem.

---

## Added — `test/haul.mjs` (53 checks)

The accept-sell-abandon loop is asserted directly: run it and the credits must be *lower*
than when you started. The rest covers the load boarding, capacity refusal, the
consignment being unsellable while the pilot's own share of the same commodity is not,
delivery only at the destination, the fee being paid exactly once, reclaim on both abandon
and expiry, the raided-hold clamp, and supply being left alone.

The button half is checked against `index.html` itself: every tool button carries a title
and a face, `btn-ops` says OPS in letters, and no button outside a small allow-list of
conventional symbols is glyph-only. That allow-list is the interesting line — it is the
judgement, written down, about which symbols a player can be expected to read.

---

## Files touched

| File | Change |
|---|---|
| `src/systems/contracts.js` | `loaded`, `consignedFor`, `sellableOf`, `deliverableAt`, `deliverConsignment`, `reclaim`; haul out of `creditDelivery`; brief rewritten |
| `src/systems/economy.js` | `sell`/`sellAll` respect consignment; rounding leak fixed |
| `src/ui/dock.js` | deliver rows, consigned kg shown, Ops entry in every branch |
| `index.html` | tool button faces |
| `css/hud.css` | label tracking and clipping |
| `test/haul.mjs` | **new** — 53 checks |
| `test/economy.mjs` | haul block rewritten to the consignment model; supply split out |
| `test/all.mjs`, `package.json` | `haul` suite registered |
| `src/core/version.js`, `README.md`, `CHANGELOG.md` | 1.01.81 |

## Verified

- `node test/all.mjs` — **37/37 suites, 2,983 checks, 0 failed.**
- The exploit, re-run on seed 42 after the fix: selling at the issuing station returns 0
  and leaves the load aboard; abandoning reclaims it and costs the fail fee; delivering
  honestly pays exactly the contract fee and nothing else.
- `node src/npc-avatar/test/run.mjs` — 8/8.

## Not verified

The button labels are checked in the markup, not rendered. Whether `ARIA` actually fits a
30 px button in your font at the 640 px breakpoint is a thing only the device can answer —
if it clips, drop `.tool-btn` font-size another point at that breakpoint, or shorten it to
`AI`.

The deliver row in the dock is not rendered by any suite either. `test/screens.mjs` draws
the data behind the panels, not the DOM.

## Worth deciding

Haul now pays the fee only, where before the intent was fee plus whatever the goods
fetched. On seed 42 that is 3,367 cr for a two-station run, which may be light — the
contract was priced when the pilot was expected to supply the cargo. `CONTRACTS.pay` for
the haul spec is the number to move, and it is a balance call rather than a bug.
