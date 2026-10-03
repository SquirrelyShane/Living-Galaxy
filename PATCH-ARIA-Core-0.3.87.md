# ARIA Core patch for Living Galaxy 0.3.87

Base: main commit 8e400f1. This additive patch keeps the game version at 0.3.87.

## What changes

- A single `ariaMind` owns captain preferences, contextual observations, career outcome statistics, standing orders, authority, risk estimates and bounded episodic memory. Player ARIA and aria-play use shared scoring and outcome learning. Their existing mission construction/execution paths remain intact.
- Tape settles state/action/outcome observations after 30 seconds. Player observations inform imitation/risk; ARIA observations remain separate. Partial/reset records are ignored. Overlapping deltas are observational and must not be summed as independent rewards.
- Context learning is bounded to 256 entries; episodic memory to 96 entries; withheld-action notices to 16. Raw Tape retains its existing limits.
- Four ordered goal levels and heuristic confidence appear in NAV → ARIA CORE with current plan, alternatives, confidence, risk and standing orders.
- Default reserve: 15,000 cr. Maximum autonomous purchase: 25,000 cr. Repair threshold: 55% hull. Avoid nearby hostiles enabled. Navigation, trade, repairs, refits and fabrication are enabled; combat, drone construction and crew/company governance require explicit grants in Core.
- Mission actions recheck authority each tick. Purchase/repair/refit/build/fabrication prices are checked at execution. Crew and treasury mutations also use authority and spending limits.
- Nearby threats interrupt economic work and request a safe yard. This is a deterministic docking retreat; the navigation/autopilot still performs collision handling. Interrupted contracts remain active for subsequent replanning, rather than resuming an exact saved mission step.
- Captain/sky storage is isolated. Existing ARIA preference data migrates; the existing career-brain export format remains compatible. Outcome statistics are shared; no second people database is created.
- Crew episodes retain person IDs; names and detailed records resolve through GDB/CRADLE. Missing records leave the ID available.

## Use

Open CON → NAV → ARIA CORE. Set reserve, purchase ceiling, repair threshold, decision mode and authority checkboxes. TAKE THE CONN remains on NAV → ARIA and the HUD; touching the stick still returns command.

Modes share the same deterministic policy scorer: imitation emphasizes comparable captain actions; optimization emphasizes completed-job returns; balanced blends those; directive relies on baseline mission priorities and standing orders. Career selection and ship capabilities still constrain available jobs. Confidence is a bounded heuristic, not a calibrated success probability. Learned risk describes captain exposure and current decision risk; standing orders override it.

## Optional conversation layer / mini PC

The Core screen can show `explanationPacket()`; the development API also exposes it at `window.__lg.aria.explanationPacket()`. It is a detached JSON summary containing goals, decision, orders, risk and a few memories. It contains no execution callbacks. No LLM endpoint is contacted by this patch, and no LLM output is accepted as a simulation command. A later conversation adapter can send this packet to Ollama on the laptop or to a remote service and display the returned text.

The 5.6 GiB mini PC does not need an LLM for these features. The persistent Sol host remains deterministic; learned captain data lives in browser storage. The patch does not modify Sol checkpoint formats or reset live Sol. Clearing browser storage removes ARIA learning.

## Install locally / test before deployment

Apply the ZIP at the root of a clean 0.3.87 checkout. It includes replacement source files, new modules and regression tests. Inspect the diff before committing. It does not push or deploy automatically.

```bash
cd ~/Desktop/Living-Galaxy-recovery
git status --short
git switch -c update/aria-core-0.3.87
python3 -m zipfile -e ~/Desktop/Living-Galaxy-0.3.87-ARIA-Core-patch.zip .
node test/ariamind.test.mjs
node --import ./test/three-register.mjs test/ariamind-integration.test.mjs
node --import ./test/three-register.mjs test/aria-repair.test.mjs
node --import ./test/three-register.mjs test/aria-invest.test.mjs
node --import ./test/three-register.mjs test/ariaplay.test.mjs
```

The existing profitability/business test fixtures explicitly grant their legacy unrestricted authority. New tests separately verify the default restrictions, captain isolation, shared objects, current purchase limits and revoked repair authority.

Browser visual verification was unavailable in the build environment because Chromium could not be downloaded. The Core panel should be previewed on phone and desktop before live deployment.
