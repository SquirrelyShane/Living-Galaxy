# PATCH v1.04.00 — "The Front Door"

The web suite: portal, accounts over HTTP with email verification, community forum,
admin deck — plus the real fix for slow loading (gzip + ETag + edge-cache headers) and
first-class support for the GitHub → Cloudflare Pages deployment split. Gate: **71/71
suites green**.

## Files touched

### New
| File | What |
| --- | --- |
| `web/portal.html` | main screen — starfield, live status, pilot registry (login/register/verify), join info, links |
| `web/forum.html` | community forum — boards/threads/posts, hash-routed, textContent rendering (no HTML crosses) |
| `web/admin.html` | admin deck — pilots online, occupancy, suspects, SMTP state, pending codes, forum moderation |
| `web/config.js` | one switch: same-origin galaxy (default) or CDN static + tunnel host |
| `server/api.js` | HTTP API — cookie-ticket sessions, register/login/me/verify/resend, forum, admin; per-IP rate limits; exact-origin credentialed CORS |
| `server/forum.js` | vault-backed boards/threads/posts, hard caps, pin/lock/delete |
| `server/mail.js` | stdlib SMTP-over-TLS client; unconfigured → codes surface on console + admin deck |
| `src/data/loading-tips.js` | 22 rotating lore/tip lines for the loading screen |
| `_redirects` | Cloudflare Pages routing mirroring the server's ROUTES |
| `.gitignore` | keeps `galaxy-data/` (the vault) off GitHub, permanently |
| `test/portal.mjs` | 36 checks — routes, gzip/etag/cache, accounts, verification via operator code, forum, admin gating |

### Changed
| File | What |
| --- | --- |
| `server/main.js` | `/` portal · `/play` game · `/forum` · `/admin`; gzip + ETag + Cache-Control static serving; API dispatch; `--admin` bootstrap (one-time printed passphrase); `--web-origin` for the CDN split |
| `server/registry.js` | email/code/verified/admin on accounts; issueCode/verifyCode/setAdmin/account |
| `src/main.js` | boot screen prefills the server address from the page's own origin (or web/config.js) |
| `src/ui/loading.js` | rotating tips in the sub slot; a real subtitle always outranks a tip |
| `index.html` | loads web/config.js best-effort |
| `docs/DOMAIN.md` | Option B: GitHub + Pages static, galaxy on api.living-galaxy.com |
| `test/all.mjs`, `package.json`, `src/core/version.js`, `CHANGELOG.md` | registration, version 1.04.00, schema unchanged at 23 |

## Verified

- 71/71 green. The portal suite exercises: gzip on modules, max-age=600, ETag → 304,
  vault 403 over HTTP, register→cookie→me, wrong-pass refusal, admin gate (403 → login
  with the boot-printed passphrase → deck), operator-delivered code verifying an email,
  forum post/reply/lock/delete with permission boundaries, logout.
- Full-suite soak unchanged.

## Not verified (honest list)

- Real SMTP delivery (needs live credentials — the console/admin fallback is the tested
  path and works without any).
- The Pages deployment itself (dashboard steps on Shane's account); `_redirects`,
  `web/config.js` and `--web-origin` are the tested-in-repo halves of it.
- Portal/forum/admin rendering in real browsers (DOM-built, no framework; suite covers
  the API contract, not pixels).
- Behind Cloudflare, per-IP rate limits see Cloudflare's IPs unless the server is
  taught `CF-Connecting-IP` — noted as a next-slice item.

## Notes for the next slice

- Trust `CF-Connecting-IP` (only when the peer is the tunnel) so rate limits bind to
  real visitors.
- The wallet still wants its cockpit door (dock-services Bank pane) — the portal now
  shows the balance, which makes the missing door more visible, not less.
- Forum could take a "system link" post type once the chart deep-links.
