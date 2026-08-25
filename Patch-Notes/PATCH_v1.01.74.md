# PATCH v1.01.74 — "Office"

Executive founders start at a real headquarters. Save schema stays **16**.

---

## What changed

An executive career used to incorporate a company and then drop the pilot in open space
like every other career. That undercut the fantasy: a founder with a charter, a treasury
and a board should wake up *at the office*, not mid-void.

**`placeAtHQ()`** (in `systems/company.js`) runs once after `foundCompany()` during
character creation:

1. Picks a living station by charter preference  
   (economic → trade hub, industrial → foundry/refinery, logistic → depot, military → fortress, civilian → habitat).
2. Records `company.hqStation` / `hqType` on the company record (persisted with the rest of the company).
3. Moves the ship onto the pad and calls `dock()`.
4. Status + toast name the office.

Creation completion then **opens the station overlay** when already docked, so the first
frame is the headquarters surface rather than empty space.

**While docked at the registered office:**

- Dock title reads `{Company} · Office — {Station}`.
- Trade tab carries a headquarters note pointing at Ops / ARIA for command.
- Ops → Staff labels the panel as Headquarters and shows `hqBrief()`.
- ARIA context mentions the office address and whether the pilot is present.

**Helpers:** `pickHQStation`, `atHQ()`, `hqBrief()`, and `companyReport()` fields
`hqStation` / `hqType` / `atHQ`.

---

## Still open (executive)

- Bind fleet orders to real owned / contracted hulls
- Live nav-map command layer under HQ scan radius
- Per-asset active/passive toggle strip
- Self-training loop over `npc-kb`

---

## Files

- `src/systems/company.js` — HQ placement and queries
- `src/systems/character.js` — `placeAtHQ()` after incorporate
- `src/ui/dock.js` — office title and note
- `src/ui/ops.js` — Headquarters chrome on Staff
- `src/systems/assistant.js` — office in context line
- `src/main.js` — open dock after executive creation
- `src/core/version.js` — `1.01.74 · Office`
- `docs/OPEN_ITEMS.md`, `CHANGELOG.md`
