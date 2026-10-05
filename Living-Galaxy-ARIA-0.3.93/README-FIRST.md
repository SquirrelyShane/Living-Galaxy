# Living Galaxy — ARIA 0.3.93

Base: 4584b5df4399b1c9e4e878e6e9c49adfabf167fc — 0.3.92 patch plus aria improvement
Implementation: af50387f3696820d76320d6f39abd75db8e3ea36
Branch: feature/aria-core-0.3.93 (local; not pushed)

This replaces the earlier ARIA 0.3.92 package for use on the newly merged main.
It preserves upstream 0.3.92's salvage approach, frame matching, debris reeling,
hulk visuals and release notes. Do not apply both ARIA packages.

This archive contains a Git patch with all 23 changed/new files,
including runtime modules, optional model installer, tests and documentation.
It is not a full game checkout and contains no model weights or saved data.

## Apply to your workspace

Unzip this archive into a separate folder. In your Living-Galaxy-Workspace repo:

```bash
git switch main
git pull --ff-only origin main
git status --short
git log -1 --oneline
```

Start from clean upstream 4584b5d (0.3.92). Preserve local edits before proceeding.
If main has advanced beyond that commit, review/rebase this patch first.
If the earlier ARIA patch is already applied, do not stack this on top of it.

Create the update branch and use the actual path where you extracted the patch:

```bash
git switch -c update/0.3.93
git apply --check /path/to/extracted/ARIA-0.3.93.patch
git apply /path/to/extracted/ARIA-0.3.93.patch
```

Run the second apply command only if the check succeeds. There is no frontend
build step. Deploy the updated game files using your normal website workflow,
including both new runtime modules, and hard-refresh the browser.

## Optional LFM2 on mpcbb

Read ARIA-DIALOGUE.md before installation. After installing Ollama and deploying
the updated game files, from the game repo on mpcbb:

```bash
sudo install -m 644 server.py /srv/living-galaxy/relay/server.py
sudo bash deploy/install-aria.sh
```

This downloads LFM2-700M Q4_K_M into a dedicated local service. It restarts the
relay and its dependent Sol service. It does not deploy website assets or update
the website proxy. Core planning and memory work without model installation.

## Validation and limits

See PATCH-0.3.93.md for regression coverage and limitations. This patch was
applied to a clean archive of 4584b5d; every resulting changed file matched the
implementation byte-for-byte. Learning and dialogue unit tests also passed
from that reconstructed tree.

No live deployment or push was performed. Browser visual testing was previously
blocked by this execution environment's socket restrictions. Real model
inference, installation and mpcbb performance still need checking there.
