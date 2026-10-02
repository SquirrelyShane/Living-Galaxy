# Project cleanup — 0.3.83

## State examined

The base is GitHub main `47fae119e1c0b87dd148d392e7508130af501ba9`, version
0.3.82. The career document is `docs/CAREER_ROADMAP.md` (case matters on Linux).
All sixteen careers are available. Its nine-item readiness table is a historical
0.3.80 audit, not a new measured-play audit or a creation gate.

The source tree included an empty controls-test module, its renderer import and
HTML preload, plus 17 tracked log/ARIA artifact files and `cradle.json` totaling
2,095,199 bytes. Those runtime files are removed from Git's index, not from the
running installation. Existing Git history is retained.

## What this patch changes

- Extracts career defaults and the career tick into `js/sim/career.js`, with
  explicit dependencies and the existing public `sim.js` facade. Payroll,
  training, persistence timing and crew cadence keep their previous behavior.
- Removes `js/core/controls-test.js`, its generated documentation, import and
  preload. Preloads the new career module and regenerates code docs/traces.
- Reconciles the career/reorganization roadmap with the actual 0.3.81/0.3.82
  releases. Remaining hygiene, shared-state cycle reduction, other simulation
  clusters and the render closure split are still pending.
- Adds `tools/clean-project.py`: dry run by default; `--apply` first copies
  ignored tracked artifacts to a private sibling archive, then untracks them
  with `git rm --cached`. Live ledgers, log files and checkpoints stay in place.
  Disposable cache folders and bytecode are moved to the sibling archive.
- Expands `.gitignore` and `.assetsignore` for ledgers, logs, Sol SQLite files,
  dependencies, caches, local archives, backups and credentials. Backend code
  (`server.py`, `host/`, `deploy/`) and root Markdown are excluded only from
  static asset uploads; they remain tracked source and available for Linux
  server installation. Playable JS/CSS, icons, manifest, vendored Three.js and
  addon JS remain uploadable.

`.assetsignore` controls Wrangler static uploads. It does not change the
Python relay's data paths, API behavior or static request handling. CRADLE is
still accessed through `/cradle/all` and `/cradle/put`, not a static JSON fetch.

## Apply and review

Use the bundled `apply-0.3.83.py` against the repository root. It supports an
unchanged 0.3.82 checkout or the earlier 0.3.83 career-extraction patch. It checks
all affected file hashes before writing, retains extra local ignore rules,
archives replaced files outside the project and runs focused validation.
It never commits, pushes, deploys, runs `git clean` or resets Sol.

If you copy the overlay manually, run the cleanup explicitly before committing;
ignore rules alone do not remove files that Git already tracks:

```bash
python3 tools/clean-project.py .           # inspect
python3 tools/clean-project.py . --apply   # archive and untrack; keep live data
```

Review `git diff` and `git diff --cached` (runtime untracking is staged), then:

```bash
git add -A
git commit -m "Living Galaxy 0.3.83: career groundwork and project cleanup"
git push origin main
```

Deploy through the existing game updater with `--keep-sol`; this release does
not need a fresh Sol. Leave `/srv/living-galaxy/relay/` and its data intact.
A different checkout pulling the commit can lose its formerly tracked bundled
files through Git's normal checkout behavior. Back up that checkout's local
ledgers/logs before pulling if it is also being used as a live relay directory;
the dedicated installed relay keeps its independent data.

`PATCH-0.3.83.md` and the `## 0.3.83` changelog entry contain brief website news
bullets. Publish those through the website's normal release/news update flow.

## Validation

All 99 root Node test suites passed, including console import-order, career,
wallet, preload, HUD, continuation and deployment-tool checks. The new cleanup
and upload-exclusion checks passed. Extracted career function bodies match the
original AST. Persistent Sol passed zero-player simulation, checkpoint restore,
archive restart, reserved authority, authenticated writes and private resume
checks. JavaScript/Python/shell syntax and Git whitespace checks passed.
Browser/device smoke remains pending.
