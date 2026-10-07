# Living Galaxy 0.3.95 — ARIA 1.5: Sight and Wake

ARIA grades the danger around her, keeps score of her own forecasts, and keeps a ledger of what her trading does to the ports.

- ARIA keeps what she learned from watching you. Menu and button taps were crowding your real work out of her memory. They no longer count, and learning saved before this release is tidied the first time it loads.
- Threat is graded instead of on or off: how many hostiles, how close, how fast they are closing and how tough they are, against her own guns, hull and battery. One drone drifting past is still not a reason to leave a belt. A pack closing on a hurt hull sends her to the yard sooner.
- She remembers where trouble was for a few minutes and prefers a yard whose lane does not run past it.
- She picks a buyer on the whole hold: what the lot fetches once her own selling has pushed the price down, and what the port can actually pay.
- New standing order, Steward weight (0 to 1, starts at 0.25). Above 0 she leans toward a port that is short of the cargo and away from one she would flood. At 0 she sells for the best price and nothing else.
- ARIA CORE has two new sections. WHAT SHE SEES: the scene, the threat grade, and anything that changed in the sky — a price step, raiders arriving, hulks appearing. HER WAKE: what she sold and bought where, what it did to prices and to your standing, what her own price moves cost, and station lines her cargo started or her buying stopped.
- ARIA CORE shows "Forecasts kept": how often her jobs came off, against how sure she said she was. The confidence figure is corrected by that record.
- Old results fade with time in the sky rather than counting for ever, and a change in the sky marks the affected kind of work down until she has flown it again.

No Sol reset or save migration is required. Standing orders and learning are kept.

Not in this release: planning more than one job ahead, pilots claiming a seam or hulk so two ARIAs do not pile onto it, and a spoken explanation.

Tested headless and in a headless browser at phone size on a software renderer; not yet flown on a phone. In two bench runs the mining ARIA kept her hull where the 0.3.93 one lost it both times. Trade and salvage earnings were too mixed between runs to call.
