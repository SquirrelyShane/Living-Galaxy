# ARIA mining-loop fix for 0.3.87

This ZIP replaces the earlier ARIA Core ZIP. It contains the complete ARIA Core changes plus the mining-loop fixes, so it can be applied to clean 0.3.87 or over the earlier Core patch. Base: GitHub main 8e400f1. Game version stays 0.3.87.

## Fixed

1. MINE treated a low battery outside the belt as successful completion. A warp could drain the battery, then the mission immediately advanced to DOCK without mining. MINE now holds its step and recharges to the autopilot's recovery band before continuing toward the same seam. It displays `recharge · mining leg paused`. If charge makes no meaningful progress for 120 simulation seconds it reports a power-load failure instead of silently completing the step. Low charge during a running warp does not interrupt that warp.
2. ARIA Core's threat retreat could repeatedly make docking missions or immediately restart work after a contact briefly disappeared. A ship already docked now holds there. Departure requires 30 clear simulation seconds. The Avoid hostiles directive remains enabled.

These are reproducible control-flow defects matching the reported symptoms; without the live ship's mission trace, the patch cannot establish which one triggered that specific session.

## Apply on mpcbb

From Termux, after downloading the ZIP:

```bash
scp ~/storage/shared/download/Living-Galaxy-0.3.87-ARIA-Mining-Loop-Fix.zip skrow@mpcbb:~/Desktop/
ssh -t skrow@mpcbb
```

On mpcbb:

```bash
cd ~/Desktop/Living-Galaxy-recovery
git status --short
python3 -m zipfile -e ~/Desktop/Living-Galaxy-0.3.87-ARIA-Mining-Loop-Fix.zip .
node --import ./test/three-register.mjs test/aria-mining-loop.test.mjs
node --import ./test/three-register.mjs test/mission.test.mjs
node --import ./test/three-register.mjs test/aria-repair.test.mjs
```

This changes the source checkout; it does not deploy the website automatically. Use your established lg-deploy workflow with `--keep-sol` to deploy without resetting the shared Sol system. Inspect any existing uncommitted changes before extracting replacement files.

After deploying, reload the game, release ARIA's conn once, then take it again to rebuild the old active plan. The ARIA Core page shows why it is holding; the autopilot task should show recharge when necessary and mining after arrival. If the ship still returns prematurely, capture the ARIA Core reason and mission failure text so the exact remaining branch can be identified.

No LLM is involved in this fix. It does not modify persistent Sol save formats or reset Sol.
