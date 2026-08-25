# PATCH v1.03.03 — "Hold The Door"

Polish hotfix from the Legion's first successful boot: the launcher window closed before
the join address could be read, and the server window was blank (its output had been
redirected wholesale to the log). Gate: **70/70 suites green**.

## Files touched

| File | What |
| --- | --- |
| `server/main.js` | `--logfile=path` mirrors console.log/error to a file; the console itself stays live |
| `launch.cmd` | server starts un-redirected with `--logfile` (its window shows live status); stale log deleted first; success banner ends on `pause` so a double-clicked window survives; Select-mode caution noted |
| `test/galaxy-server.mjs` | boots with `--logfile`, asserts the mirror (14 checks now) |
| `src/core/version.js`, `package.json` | 1.03.03; schema unchanged at 23 |
| `CHANGELOG.md`, this file | the release |

## Verified

- 70/70 green; the logfile-mirror check runs inside the durability suite's real boot.
- Field state confirmed healthy before this patch: the deployment log showed cert
  self-issue, https/wss up, beacon live on both LAN addresses.

## Not verified

- The two window behaviours on real Windows (pause banner, live server window) — next
  double-click confirms; both are stock cmd semantics.
