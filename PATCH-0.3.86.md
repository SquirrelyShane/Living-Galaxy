# Living Galaxy 0.3.86 — Dead Hulls: Hulks

- A destroyed NPC hull now leaves a hulk where it died: the same hull, dark and tumbling, in two to eight sections by size.
- Each section holds plate and parts; the bridge holds the flight recorder; the hold keeps a share of the cargo the hull was carrying.
- Hulks come from the pilot's kills, port guns and guard drones, company combat drones, hull-against-hull fights and staged ambushes.
- P-LOCK takes a hulk, MATCH holds on it, a waypoint can be anchored to it, and SCAN reads its manifest.
- A recorder beacon strobes amber on a hulk inside sensor range.
- Hulks near a world stay with that world; in open space they drift to rest. A hulk lasts 90 minutes; the sky keeps at most 48.

No Sol reset or save migration is required. Hulks are session state and are not saved.

Nothing cuts a hulk yet: the salvage rig, jobs bound to hulks, salvage rights,
shared hulks between players and crew-abandoned derelicts are later slices
(see docs/SALVAGE_PLAN.md). Existing wreck and pod contracts are unchanged.
Salvage readiness is unchanged: `verb`, `aria`, `bench` and `smoke` are still open.
