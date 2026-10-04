# js/net/account.js

[index](../../../README.md) · 484 lines · 61 symbols · 3 imports · 4 importers

## About

<!-- note:@file -->
LIVING GALAXY — the account: a pilot that follows you between devices.

0.3.40. The website (living-galaxy.com, its own product line: lgsite.py)
keeps one versioned blob per account, and this module is the game's half of
that: it takes everything js/core/profile.js says belongs to a PILOT — the run
keys, the callsign-suffixed families, the learned nets, the profile record
— and syncs that whole namespace as one object. Device settings (mixer,
rock quality, fullscreen) and the CRADLE (the sky's population, which the
relay already shares) stay on the device, on purpose.

WHERE IT WORKS. The game is played from three places: the website's
`/play/` (same origin as the API — cookies just work), a phone's own
server.py on the LAN, and a bare static host. Only the first has an account
behind it. So the module PROBES once at boot: `GET /api/me` answering JSON
means the site is there; a 404 (server.py, a static host) or a network error
means it is not, and every account feature reads "sign in at
living-galaxy.com to carry this pilot across devices" and does nothing else.
No CORS, no third origin, no token in the URL — the site's own security model
(HttpOnly cookie + the X-Requested-With header as the CSRF proof) is reused
as-is.

VERSIONS AND CONFLICTS. Every upload carries `base_version`, the server
version this device last synced to. The server refuses a stale base with 409
— a second device wrote in between — and NOTHING is overwritten until the
pilot says which copy wins (the ACCOUNT panel puts both side by side). The
same question is asked on first sign-in when both the device and the account
already have a pilot. Restoring the account's copy rewrites localStorage and
RELOADS: two dozen modules read their keys at import or at launch, and
hot-swapping a pilot under a running sim is the kind of cleverness that eats
saves.

WHEN IT SYNCS. A hash of the snapshot is kept, and an upload goes out only
when it changed: every SYNC_EVERY_MS while playing, when the tab is hidden
(after the other modules' own hidden-flushes, hence the setTimeout), on
pagehide with keepalive, and on SYNC NOW in the panel. The server allows 60
saves per ten minutes per account; this never gets near it.

NEWS. `GET /api/news` is the site's announcement feed; each item is posted
to the GNN news desk once per device (the seen-set is a DEVICE key, so a new
pilot does not re-read the patch notes).

No DOM at import. `fetch`, `reload` and `meta` are fields so the tests can
hand in fakes; nothing here imports the sim.

- L6 · `export const SLOT = "default";` — the one slot before 0.3.74; still a pilot's slot if it holds one
- L7 · `export const PILOT_SLOTS = ["p1", "p2", "p3"];` — 0.3.74: up to three pilots an account (with "default", if used, counting as one)
- L9 · `export const SYNC_EVERY_MS = 120000;` — the periodic check while playing
- L10 · `export const MIN_GAP_MS = 15000;` — never two uploads closer than this (server: 60 / 10 min)
- L11 · `export const NEWS_MAX_AT_ONCE = 5;` — bulletins posted per boot at most, newest of the unseen
- L12 · `export const STATE_KEY = "lgaa.account.v1";` — device: { version, hash, user } of the last sync
- L13 · `export const NEWS_SEEN_KEY = "lgaa.news.seen.v1";` — device: site news ids already put on the desk
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../core/profile.js` | `RUN_KEYS`, `RUN_PREFIXES`, `LEARNED_KEYS`, `LEARNED_PREFIXES`, `PROFILE_KEY` | [js/core/profile.js](../core/profile.js.md) |
| 2 | `../core/store.js` | `useGameStore` | [js/core/store.js](../core/store.js.md) |
| 3 | `../comms/gnn.js` | `gnnPost` | [js/comms/gnn.js](../comms/gnn.js.md) |

## Imported by

- [js/console/panels/corp-account.js](../console/panels/corp-account.js.md) — `account`, `accountLine`, `signIn`, `signOut`, `sync`, `resolve`, `takeNewer`, `checkRemote`, `loadBoard`, `SITE_LINK`
- [js/console/panels/corp.js](../console/panels/corp.js.md) — `account`, `accountLine`
- [js/main.js](../main.js.md) — `mountAccount`
- [js/ui/hud.js](../ui/hud.js.md) — `account`, `flyPilot`, `newPilotSlot`, `deletePilot`, `eraseGuest`, `MAX_PILOTS`

## Exports

- [`SNAP_VERSION`](#s-SNAP_VERSION) · const — **no importer in scanned roots**
- [`SLOT`](#s-SLOT) · const — **no importer in scanned roots**
- [`PILOT_SLOTS`](#s-PILOT_SLOTS) · const — **no importer in scanned roots**
- [`MAX_PILOTS`](#s-MAX_PILOTS) · const — used by [js/ui/hud.js](../ui/hud.js.md)
- [`SYNC_EVERY_MS`](#s-SYNC_EVERY_MS) · const — **no importer in scanned roots**
- [`MIN_GAP_MS`](#s-MIN_GAP_MS) · const — **no importer in scanned roots**
- [`NEWS_MAX_AT_ONCE`](#s-NEWS_MAX_AT_ONCE) · const — **no importer in scanned roots**
- [`STATE_KEY`](#s-STATE_KEY) · const — **no importer in scanned roots**
- [`NEWS_SEEN_KEY`](#s-NEWS_SEEN_KEY) · const — **no importer in scanned roots**
- [`SITE_LINK`](#s-SITE_LINK) · const — used by [js/console/panels/corp-account.js](../console/panels/corp-account.js.md)
- [`SCOPE`](#s-SCOPE) · const — **no importer in scanned roots**
- [`account`](#s-account) · const — used by [js/console/panels/corp-account.js](../console/panels/corp-account.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md), [js/ui/hud.js](../ui/hud.js.md)
- [`snapshot`](#s-snapshot) · function — **no importer in scanned roots**
- [`hashOf`](#s-hashOf) · function — **no importer in scanned roots**
- [`hasLocalPilot`](#s-hasLocalPilot) · function — **no importer in scanned roots**
- [`restore`](#s-restore) · function — **no importer in scanned roots**
- [`probe`](#s-probe) · function — **no importer in scanned roots**
- [`signIn`](#s-signIn) · function — used by [js/console/panels/corp-account.js](../console/panels/corp-account.js.md)
- [`signOut`](#s-signOut) · function — used by [js/console/panels/corp-account.js](../console/panels/corp-account.js.md)
- [`pull`](#s-pull) · function — **no importer in scanned roots**
- [`describe`](#s-describe) · function — **no importer in scanned roots**
- [`push`](#s-push) · function — **no importer in scanned roots**
- [`resolve`](#s-resolve) · function — used by [js/console/panels/corp-account.js](../console/panels/corp-account.js.md)
- [`checkRemote`](#s-checkRemote) · function — used by [js/console/panels/corp-account.js](../console/panels/corp-account.js.md)
- [`takeNewer`](#s-takeNewer) · function — used by [js/console/panels/corp-account.js](../console/panels/corp-account.js.md)
- [`sync`](#s-sync) · function — used by [js/console/panels/corp-account.js](../console/panels/corp-account.js.md)
- [`plainText`](#s-plainText) · function — **no importer in scanned roots**
- [`postNews`](#s-postNews) · function — **no importer in scanned roots**
- [`newsActions`](#s-newsActions) · function — **no importer in scanned roots**
- [`BOARD_EVERY_MS`](#s-BOARD_EVERY_MS) · const — **no importer in scanned roots**
- [`loadBoard`](#s-loadBoard) · function — used by [js/console/panels/corp-account.js](../console/panels/corp-account.js.md)
- [`accountLine`](#s-accountLine) · function — used by [js/console/panels/corp-account.js](../console/panels/corp-account.js.md), [js/console/panels/corp.js](../console/panels/corp.js.md)
- [`listPilots`](#s-listPilots) · function — **no importer in scanned roots**
- [`flyPilot`](#s-flyPilot) · function — used by [js/ui/hud.js](../ui/hud.js.md)
- [`newPilotSlot`](#s-newPilotSlot) · function — used by [js/ui/hud.js](../ui/hud.js.md)
- [`deletePilot`](#s-deletePilot) · function — used by [js/ui/hud.js](../ui/hud.js.md)
- [`eraseGuest`](#s-eraseGuest) · function — used by [js/ui/hud.js](../ui/hud.js.md)
- [`mountAccount`](#s-mountAccount) · function — used by [js/main.js](../main.js.md)

## Effects

- **bus.on** — `‹tryNews› on useGameStore` (mountAccount:467)
- **dom.create** — `a` (paintStartLine:451)
- **dom.id** — `account-line` (paintStartLine:442)
- **event.dispatch** — `lg-account on globalThis.document` (emitReady:438)
- **event.listen** — `visibilitychange on doc → (inline)` (mountAccount:474) · `pagehide on window → (inline)` (mountAccount:480)
- **net.fetch** — `‹(spreadelement)›` (account.fetch:39) · `‹path›` (call:110)
- **timer** — `setInterval` (mountAccount:470) · `setTimeout` (mountAccount:475)

## Symbols

### <a id="s-SNAP_VERSION"></a>`SNAP_VERSION`

const · **exported** · L5–5

<!-- note:SNAP_VERSION -->
<!-- /note -->

### <a id="s-SLOT"></a>`SLOT`

const · **exported** · L6–6

<!-- note:SLOT -->
<!-- /note -->

### <a id="s-PILOT_SLOTS"></a>`PILOT_SLOTS`

const · **exported** · L7–7

<!-- note:PILOT_SLOTS -->
<!-- /note -->

### <a id="s-MAX_PILOTS"></a>`MAX_PILOTS`

const · **exported** · L8–8

<!-- note:MAX_PILOTS -->
<!-- /note -->

### <a id="s-SYNC_EVERY_MS"></a>`SYNC_EVERY_MS`

const · **exported** · L9–9

<!-- note:SYNC_EVERY_MS -->
<!-- /note -->

### <a id="s-MIN_GAP_MS"></a>`MIN_GAP_MS`

const · **exported** · L10–10

<!-- note:MIN_GAP_MS -->
<!-- /note -->

### <a id="s-NEWS_MAX_AT_ONCE"></a>`NEWS_MAX_AT_ONCE`

const · **exported** · L11–11

<!-- note:NEWS_MAX_AT_ONCE -->
<!-- /note -->

### <a id="s-STATE_KEY"></a>`STATE_KEY`

const · **exported** · L12–12

<!-- note:STATE_KEY -->
<!-- /note -->

### <a id="s-NEWS_SEEN_KEY"></a>`NEWS_SEEN_KEY`

const · **exported** · L13–13

<!-- note:NEWS_SEEN_KEY -->
<!-- /note -->

### <a id="s-SITE_LINK"></a>`SITE_LINK`

const · **exported** · L14–14

<!-- note:SITE_LINK -->
<!-- /note -->

### <a id="s-SCOPE"></a>`SCOPE`

const · **exported** · L16–19

<!-- note:SCOPE -->
What belongs to a pilot and travels with the account.
<!-- /note -->

### <a id="s-account"></a>`account`

const · **exported** · L21–44

<!-- note:account -->
- L22 · `site: null,` — null = not probed yet · false = no site behind this origin · true = living-galaxy.com
- L23 · `user: null,` — { id, username, verified, role } or null when signed out
- L24 · `status: "idle",` — idle · probing · offline · signed-out · unverified · syncing · synced · conflict · error
- L26 · `slot: SLOT,` — 0.3.74: which of the account's pilots this device is flying
- L27 · `pilots: null,` — 0.3.74: the account's pilots, metadata only (GET /api/save) — null until listed
- L28 · `guest: false,` — 0.3.74: a site with nobody signed in (or unverified): pilots are not kept
- L29 · `version: 0,` — the server version of the slot this device last synced to
- L30 · `hash: "",` — hash of the snapshot that version holds
- L31 · `lastSync: 0,` — Date.now() of the last successful upload
- L33 · `conflict: null,` — { server: {...}, local: {...} } while the pilot has a choice to make
- L34 · `newer: null,` — { version, updatedAt, callsign } — a newer account copy seen while flying; the panel offers it
- L37 · `board: null,` — { pilots: [...], total, at } from /api/leaderboard — null until fetched, or on a site without one (0.3.43)
- L38 · `open: (url) => globalThis.open?.(url, "_blank", "noopener"),` — how a bulletin's READ / DISCUSS gets out
- L42 · `meta: null,` — () => { callsign, career, sky, credits } — wired by mountAccount
- L43 · `flushers: [],` — () => void — modules that debounce their own saves flush here first
<!-- /note -->

#### <a id="s-account-open"></a>`account.open(url)`

prop · L38–38

<!-- note:account.open -->
<!-- /note -->

#### <a id="s-account-fetch"></a>`account.fetch(...a)`

prop · L39–39

- effects: net.fetch `‹(spreadelement)›`

<!-- note:account.fetch -->
injection points — the tests hand in fakes, the browser uses the real ones
<!-- /note -->

#### <a id="s-account-reload"></a>`account.reload()`

prop · L40–40

<!-- note:account.reload -->
<!-- /note -->

#### <a id="s-account-now"></a>`account.now()`

prop · L41–41

<!-- note:account.now -->
<!-- /note -->

### <a id="s-store"></a>`store()`

function · L46–46

- called by: [`markSeen`](#s-markSeen) · [`readState`](#s-readState) · [`restore`](#s-restore) · [`seenNews`](#s-seenNews) · [`signOut`](#s-signOut) · [`snapshot`](#s-snapshot) · [`writeState`](#s-writeState)

<!-- note:store -->
<!-- /note -->

### <a id="s-HEADERS"></a>`HEADERS`

const · L47–47

<!-- note:HEADERS -->
<!-- /note -->

### <a id="s-snapshot"></a>`snapshot()`

function · **exported** · L49–64

- calls: [`store`](#s-store)
- called by: [`checkRemote`](#s-checkRemote) · [`hasLocalPilot`](#s-hasLocalPilot) · [`push`](#s-push) · [`reconcile`](#s-reconcile)

<!-- note:snapshot -->
---- the snapshot -------------------------------------------------------

Every key in SCOPE that is holding something, as { key: rawString }.

- L53 · `for (const fn of account.flushers) { try { fn(); } catch {` — one bad flusher is not the snapshot's problem
- L55 · `try { const v = ls.getItem(k); if (v != null) keys[k] = v; } catch {` — skip
- L62 · `} catch {` — a Storage without length/key: the fixed keys are still in
<!-- /note -->

### <a id="s-hashOf"></a>`hashOf(snap)`

function · **exported** · L66–72

- calls: [`hashOf>eat`](#s-hashOf-eat) ×4
- called by: [`checkRemote`](#s-checkRemote) ×2 · [`flyPilot`](#s-flyPilot) · [`push`](#s-push) · [`reconcile`](#s-reconcile) ×2 · [`resolve`](#s-resolve) · [`takeNewer`](#s-takeNewer)

<!-- note:hashOf -->
FNV-1a over the keys in a fixed order — change detection, not security.
<!-- /note -->

#### <a id="s-hashOf-eat"></a>`hashOf>eat(s)`

function · L69–69

- called by: [`hashOf`](#s-hashOf) ×4

<!-- note:hashOf>eat -->
<!-- /note -->

### <a id="s-hasLocalPilot"></a>`hasLocalPilot(snap=)`

function · **exported** · L74–76

- calls: [`snapshot`](#s-snapshot)
- called by: [`checkRemote`](#s-checkRemote) · [`push`](#s-push) · [`reconcile`](#s-reconcile) ×2

<!-- note:hasLocalPilot -->
True when the device has a pilot at all (a save, a profile, or a corp).
<!-- /note -->

### <a id="s-restore"></a>`restore(snap)`

function · **exported** · L78–97

- calls: [`store`](#s-store)
- called by: [`checkRemote`](#s-checkRemote) · [`eraseGuest`](#s-eraseGuest) · [`flyPilot`](#s-flyPilot) · [`newPilotSlot`](#s-newPilotSlot) · [`reconcile`](#s-reconcile) · [`resolve`](#s-resolve) · [`takeNewer`](#s-takeNewer)

<!-- note:restore -->
Put an account snapshot on this device: clear the scope first (a key the
account does not have must not survive from the previous pilot), then write.
Returns how many keys landed. The caller reloads.

- L88 · `} catch {` — fixed keys only
- L89 · `for (const k of doomed) { try { ls.removeItem(k); } catch {` — ignore
- L93 · `if (!SCOPE.keys.includes(k) && !SCOPE.prefixes.some((p) => k.startsWith(p))) continue;` — never let a blob write outside its scope
- L94 · `try { ls.setItem(k, v); n++; } catch {` — quota
<!-- /note -->

### <a id="s-readState"></a>`readState()`

function · L99–102

- calls: [`store`](#s-store)
- called by: [`adopt`](#s-adopt)

<!-- note:readState -->
---- device-side sync record --------------------------------------------

- L100 · `try { const raw = store()?.getItem(STATE_KEY); if (raw) return JSON.parse(raw); } catch {` — corrupt
<!-- /note -->

### <a id="s-writeState"></a>`writeState()`

function · L103–105

- calls: [`store`](#s-store)
- called by: [`checkRemote`](#s-checkRemote) · [`deletePilot`](#s-deletePilot) · [`flyPilot`](#s-flyPilot) · [`newPilotSlot`](#s-newPilotSlot) · [`push`](#s-push) · [`reconcile`](#s-reconcile) · [`resolve`](#s-resolve) · [`takeNewer`](#s-takeNewer)

<!-- note:writeState -->
- L104 · `try { store()?.setItem(STATE_KEY, JSON.stringify({ version: account.version, hash: account` — quota
<!-- /note -->

### <a id="s-call"></a>`call(path, {…}=)`

function · async · L107–115

- called by: [`checkRemote`](#s-checkRemote) · [`deletePilot`](#s-deletePilot) · [`listPilots`](#s-listPilots) · [`loadBoard`](#s-loadBoard) · [`postNews`](#s-postNews) · [`probe`](#s-probe) · [`pull`](#s-pull) · [`push`](#s-push) · [`signIn`](#s-signIn) · [`signOut`](#s-signOut)
- effects: net.fetch `‹path›`

<!-- note:call -->
---- HTTP ---------------------------------------------------------------
<!-- /note -->

### <a id="s-fail"></a>`fail(msg)`

function · L117–117

- called by: [`checkRemote`](#s-checkRemote) · [`flyPilot`](#s-flyPilot) ×2 · [`push`](#s-push) ×2 · [`reconcile`](#s-reconcile) · [`resolve`](#s-resolve) · [`signIn`](#s-signIn) ×3 · [`takeNewer`](#s-takeNewer)

<!-- note:fail -->
<!-- /note -->

### <a id="s-probe"></a>`probe()`

function · async · **exported** · L119–131

- calls: [`adopt`](#s-adopt) · [`call`](#s-call)
- called by: [`mountAccount`](#s-mountAccount)

<!-- note:probe -->
One look for the site behind this origin; sets `account.site` and the signed-in user.
<!-- /note -->

### <a id="s-adopt"></a>`adopt(user)`

function · L133–141

- calls: [`readState`](#s-readState)
- called by: [`probe`](#s-probe) · [`signIn`](#s-signIn)

<!-- note:adopt -->
<!-- /note -->

### <a id="s-signIn"></a>`signIn(username, password)`

function · async · **exported** · L143–156

- calls: [`adopt`](#s-adopt) · [`call`](#s-call) · [`fail`](#s-fail) ×3 · [`reconcile`](#s-reconcile)
- called by: [`mountSignIn`](../console/panels/corp-account.js.md#s-mountSignIn) _js/console/panels/corp-account.js_

<!-- note:signIn -->
Sign in with the site's JSON login; then reconcile the device with the account.

- L151 · `if (!r.json.user?.verified) return true;` — signed in, but the account cannot save until the email is verified
<!-- /note -->

### <a id="s-signOut"></a>`signOut()`

function · async · **exported** · L158–165

- calls: [`call`](#s-call) · [`store`](#s-store)
- called by: [`mountSignedIn`](../console/panels/corp-account.js.md#s-mountSignedIn) _js/console/panels/corp-account.js_

<!-- note:signOut -->
- L160 · `try { await call("/api/logout", { method: "POST", body: {} }); } catch {` — the cookie is dead either way
- L163 · `try { store()?.removeItem(STATE_KEY); } catch {` — ignore
<!-- /note -->

### <a id="s-pull"></a>`pull()`

function · async · **exported** · L167–172

- calls: [`call`](#s-call)
- called by: [`checkRemote`](#s-checkRemote) ×2 · [`flyPilot`](#s-flyPilot) · [`push`](#s-push) · [`reconcile`](#s-reconcile) · [`resolve`](#s-resolve) · [`takeNewer`](#s-takeNewer)

<!-- note:pull -->
The account's copy of SLOT, or null when there is none yet.
<!-- /note -->

### <a id="s-describe"></a>`describe(snap)`

function · **exported** · L174–184

- called by: [`checkRemote`](#s-checkRemote) ×2 · [`push`](#s-push) ×2 · [`reconcile`](#s-reconcile) ×2 · [`safeMeta`](#s-safeMeta)

<!-- note:describe -->
Describe a snapshot for the conflict card without loading the sim.

- L179 · `if (Number.isFinite(s?.credits)) d.purse = Math.round(s.credits);` — 0.3.41: the wallet rides in the save
- L180 · `} catch {` — skip
- L181 · `try { const p = JSON.parse(snap?.keys?.[PROFILE_KEY] ?? "null"); if (!d.callsign && p?.cal` — skip
- L182 · `try { const c = JSON.parse(snap?.keys?.["lgaa-company"] ?? "null"); if (c?.name) d.corp =` — skip
<!-- /note -->

### <a id="s-reconcile"></a>`reconcile()`

function · async · L186–205

- calls: [`describe`](#s-describe) ×2 · [`fail`](#s-fail) · [`hashOf`](#s-hashOf) ×2 · [`hasLocalPilot`](#s-hasLocalPilot) ×2 · [`pull`](#s-pull) · [`push`](#s-push) · [`restore`](#s-restore) · [`snapshot`](#s-snapshot) · [`writeState`](#s-writeState)
- called by: [`signIn`](#s-signIn)

<!-- note:reconcile -->
First sign-in on a device: three cases.
  account empty            → upload what is here (if anything)
  device empty             → take the account's copy and reload
  both hold a pilot        → the same bytes: adopt the version · different: ask
<!-- /note -->

### <a id="s-push"></a>`push({…}=)`

function · async · **exported** · L207–235

- calls: [`call`](#s-call) · [`describe`](#s-describe) ×2 · [`fail`](#s-fail) ×2 · [`hashOf`](#s-hashOf) · [`hasLocalPilot`](#s-hasLocalPilot) · [`pull`](#s-pull) · [`safeMeta`](#s-safeMeta) · [`snapshot`](#s-snapshot) · [`writeState`](#s-writeState)
- called by: [`reconcile`](#s-reconcile) · [`resolve`](#s-resolve) · [`sync`](#s-sync)

<!-- note:push -->
Upload the device's pilot. `force` sends the server's current version as the
base (the pilot chose this copy); otherwise the last synced version goes and
a 409 becomes a conflict for the panel.

- L212 · `if (!hasLocalPilot(snap)) return true;` — nothing to carry yet
- L224 · `try { remote = await pull(); } catch {` — the card shows less
<!-- /note -->

### <a id="s-safeMeta"></a>`safeMeta(snap)`

function · L237–247

- calls: [`describe`](#s-describe)
- called by: [`push`](#s-push)

<!-- note:safeMeta -->
<!-- /note -->

### <a id="s-resolve"></a>`resolve(choice)`

function · async · **exported** · L249–265

- calls: [`fail`](#s-fail) · [`hashOf`](#s-hashOf) · [`pull`](#s-pull) · [`push`](#s-push) · [`restore`](#s-restore) · [`writeState`](#s-writeState)
- called by: [`mountConflict`](../console/panels/corp-account.js.md#s-mountConflict) _js/console/panels/corp-account.js_ ×2

<!-- note:resolve -->
The pilot's answer to a conflict: "account" takes the server copy (reloads); "device" overwrites it.

- L254 · `if (!data) { try { data = (await pull())?.data; } catch {` — fall through
<!-- /note -->

### <a id="s-checkRemote"></a>`checkRemote({…}=)`

function · async · **exported** · L267–293

- calls: [`call`](#s-call) · [`describe`](#s-describe) ×2 · [`fail`](#s-fail) · [`hashOf`](#s-hashOf) ×2 · [`hasLocalPilot`](#s-hasLocalPilot) · [`pull`](#s-pull) ×2 · [`restore`](#s-restore) · [`snapshot`](#s-snapshot) · [`writeState`](#s-writeState)
- called by: [`mountSignedIn`](../console/panels/corp-account.js.md#s-mountSignedIn) _js/console/panels/corp-account.js_ · [`mountAccount`](#s-mountAccount)

<!-- note:checkRemote -->
A device that is already signed in looks up once at boot: did another device
write a newer version? If this one has not changed since its own last sync
the newer copy is simply taken (the phone-then-desk case, no question to
ask); if both moved it is a conflict for the panel. `auto` false only
reports (`account.newer`), for a check made while the pilot is flying —
a reload mid-burn is not a favour.

- L278 · `try { remote = await pull(); } catch {` — the card shows less
<!-- /note -->

### <a id="s-takeNewer"></a>`takeNewer()`

function · async · **exported** · L295–307

- calls: [`fail`](#s-fail) · [`hashOf`](#s-hashOf) · [`pull`](#s-pull) · [`restore`](#s-restore) · [`writeState`](#s-writeState)
- called by: [`mountSignedIn`](../console/panels/corp-account.js.md#s-mountSignedIn) _js/console/panels/corp-account.js_

<!-- note:takeNewer -->
The panel's "take the newer copy" button, when checkRemote({auto:false}) found one.
<!-- /note -->

### <a id="s-sync"></a>`sync({…}=)`

function · async · **exported** · L309–314

- calls: [`push`](#s-push)
- called by: [`mountSignedIn`](../console/panels/corp-account.js.md#s-mountSignedIn) _js/console/panels/corp-account.js_ · [`mountAccount`](#s-mountAccount) ×3

<!-- note:sync -->
The periodic / lifecycle entry: upload if signed in, verified, unblocked, changed, and not too soon.
<!-- /note -->

### <a id="s-seenNews"></a>`seenNews()`

function · L316–318

- calls: [`store`](#s-store)
- called by: [`markSeen`](#s-markSeen) · [`postNews`](#s-postNews)

<!-- note:seenNews -->
---- news → the GNN desk ------------------------------------------------
<!-- /note -->

### <a id="s-markSeen"></a>`markSeen(ids)`

function · L319–323

- calls: [`seenNews`](#s-seenNews) · [`store`](#s-store)
- called by: [`postNews`](#s-postNews)

<!-- note:markSeen -->
- L322 · `try { store()?.setItem(NEWS_SEEN_KEY, JSON.stringify([...s].slice(-200))); } catch {` — quota
<!-- /note -->

### <a id="s-plainText"></a>`plainText(s)`

function · **exported** · L325–327

- called by: [`postNews`](#s-postNews) ×2

<!-- note:plainText -->
Site markup is bold/italic/code/quotes; the desk reads plain text.
<!-- /note -->

### <a id="s-KIND_TAG"></a>`KIND_TAG`

const · L329–329

<!-- note:KIND_TAG -->
<!-- /note -->

### <a id="s-postNews"></a>`postNews()`

function · async · **exported** · L331–348

- calls: [`gnnPost`](../comms/gnn.js.md#s-gnnPost) _js/comms/gnn.js_ · [`call`](#s-call) · [`markSeen`](#s-markSeen) · [`newsActions`](#s-newsActions) · [`plainText`](#s-plainText) ×2 · [`seenNews`](#s-seenNews)
- called by: [`mountAccount>tryNews`](#s-mountAccount-tryNews)

<!-- note:postNews -->
Fetch the site's feed and put every unseen item on the GNN news desk, oldest first.
<!-- /note -->

### <a id="s-newsActions"></a>`newsActions(n)`

function · **exported** · L350–356

- calls: [`newsActions>safe`](#s-newsActions-safe) ×2
- called by: [`postNews`](#s-postNews)

<!-- note:newsActions -->
0.3.43 — a bulletin from the site links back to it: the item's page, and
its discussion thread with the reply count. Both repeat (a link is not a
thing you do once), both stay inside the site's origin, and a feed from a
site without them (0.1.0) simply has no buttons.

- L352 · `const safe = (u) => typeof u === "string" && /^\/[^/\\]/.test(u);` — same-origin paths only — never a scheme, never //host
<!-- /note -->

#### <a id="s-newsActions-safe"></a>`newsActions>safe(u)`

function · L352–352

- called by: [`newsActions`](#s-newsActions) ×2

<!-- note:newsActions>safe -->
<!-- /note -->

#### <a id="s-newsActions-run"></a>`newsActions.run()`

prop · L353–353

<!-- note:newsActions.run -->
<!-- /note -->

#### <a id="s-newsActions-run-2"></a>`newsActions.run~2()`

prop · L354–354

<!-- note:newsActions.run~2 -->
<!-- /note -->

### <a id="s-BOARD_EVERY_MS"></a>`BOARD_EVERY_MS`

const · **exported** · L358–358

<!-- note:BOARD_EVERY_MS -->
---- the pilots board --------------------------------------------------
<!-- /note -->

### <a id="s-loadBoard"></a>`loadBoard({…}=)`

function · async · **exported** · L360–369

- calls: [`call`](#s-call)
- called by: [`mountBoard`](../console/panels/corp-account.js.md#s-mountBoard) _js/console/panels/corp-account.js_

<!-- note:loadBoard -->
Top pilots by purse from the site. null on a site without the board (0.1.0) or offline.
<!-- /note -->

### <a id="s-accountLine"></a>`accountLine()`

function · **exported** · L371–385

- called by: [`mountAccount`](../console/panels/corp-account.js.md#s-mountAccount) _js/console/panels/corp-account.js_ · [`mountAccount>paint`](../console/panels/corp-account.js.md#s-mountAccount-paint) _js/console/panels/corp-account.js_ · [`search`](../console/panels/corp.js.md#s-search) _js/console/panels/corp.js_

<!-- note:accountLine -->
---- boot ---------------------------------------------------------------

Everything the panel shows in one line.
<!-- /note -->

### <a id="s-listPilots"></a>`listPilots()`

function · async · **exported** · L387–393

- calls: [`call`](#s-call)
- called by: [`mountAccount`](#s-mountAccount)

<!-- note:listPilots -->
---- 0.3.74: the hangar — pick a pilot rather than have one restored ------------

Signing in used to RECONCILE: pull the account's whole pilot on boot and, if
it differed from the device, write it over the device and reload the page —
and again on the next check, which is how one sign-in reloaded three times
and why "recalling a pilot" took so long (every key of it, before the menu).
Now boot lists the account's pilots (a few hundred bytes of metadata), the
start card shows them, and only the pilot you pick is fetched and put on the
device — no reload.

The account's pilots, newest first: [{ slot, callsign, career, sky, credits, version, updated_at }].
<!-- /note -->

### <a id="s-flyPilot"></a>`flyPilot(slot)`

function · async · **exported** · L395–408

- calls: [`fail`](#s-fail) ×2 · [`hashOf`](#s-hashOf) · [`pull`](#s-pull) · [`restore`](#s-restore) · [`writeState`](#s-writeState)
- called by: [`mountHud>setMode.onFly`](../ui/hud.js.md#s-mountHud-setMode-onFly) _js/ui/hud.js_

<!-- note:flyPilot -->
Put one of the account's pilots on this device and make it the one that syncs. No reload.
<!-- /note -->

### <a id="s-newPilotSlot"></a>`newPilotSlot()`

function · **exported** · L410–420

- calls: [`restore`](#s-restore) · [`writeState`](#s-writeState)
- called by: [`mountHud>setMode.onNew`](../ui/hud.js.md#s-mountHud-setMode-onNew) _js/ui/hud.js_

<!-- note:newPilotSlot -->
A free slot for a new pilot, or null when the account has MAX_PILOTS. Clears the device for it.

- L415 · `restore({ keys: {} });` — the device holds the pilot being made, nobody else's
<!-- /note -->

### <a id="s-deletePilot"></a>`deletePilot(slot)`

function · async · **exported** · L422–430

- calls: [`call`](#s-call) · [`writeState`](#s-writeState)
- called by: [`mountHud>setMode.onDelete`](../ui/hud.js.md#s-mountHud-setMode-onDelete) _js/ui/hud.js_

<!-- note:deletePilot -->
Remove one of the account's pilots (the hangar's delete).
<!-- /note -->

### <a id="s-eraseGuest"></a>`eraseGuest()`

function · **exported** · L432–435

- calls: [`restore`](#s-restore)
- called by: [`mountAccount`](#s-mountAccount) · [`mountHud`](../ui/hud.js.md#s-mountHud) _js/ui/hud.js_

<!-- note:eraseGuest -->
A guest's pilot is not kept: whatever the last guest session left is cleared before the next one flies.
<!-- /note -->

### <a id="s-emitReady"></a>`emitReady()`

function · L437–439

- called by: [`mountAccount`](#s-mountAccount) ×4
- effects: event.dispatch `lg-account`

<!-- note:emitReady -->
- L438 · `try { globalThis.document?.dispatchEvent?.(new CustomEvent("lg-account", { detail: account` — no DOM
<!-- /note -->

### <a id="s-paintStartLine"></a>`paintStartLine()`

function · L441–454

- called by: [`mountAccount`](#s-mountAccount) ×2
- effects: dom.id `account-line` · dom.create `a`

<!-- note:paintStartLine -->
The line under the callsign on the start card, when there is a site to speak of.
<!-- /note -->

### <a id="s-mountAccount"></a>`mountAccount({…}=)`

function · **exported** · L456–484

- calls: [`checkRemote`](#s-checkRemote) · [`emitReady`](#s-emitReady) ×4 · [`eraseGuest`](#s-eraseGuest) · [`listPilots`](#s-listPilots) · [`mountAccount>tryNews`](#s-mountAccount-tryNews) · [`paintStartLine`](#s-paintStartLine) ×2 · [`probe`](#s-probe) · [`sync`](#s-sync) ×3
- via [js/core/store.js](../core/store.js.md): `useGameStore.getState`, `useGameStore.subscribe`
- called by: [`@file`](../main.js.md#) _js/main.js_
- effects: bus.on `‹tryNews›` · timer `setInterval` · event.listen `visibilitychange` · timer `setTimeout` · event.listen `pagehide`

<!-- note:mountAccount -->
Wire the lifecycle. `meta()` supplies the summary the account page shows;
`flushers` are the modules that debounce their own saves. Returns the timer
so a test can stop it. Safe without a window.

- L464 · `let posted = false;` — the feed lands once the pilot is flying, not on the menu screen
- L468 · `if (account.user?.verified) { account.pilots = null; emitReady(); listPilots().then(() =>` — 0.3.74: no reconcile, no restore-and-reload on boot — the hangar lists, the pilot picks
- L468 · `if (account.user?.verified) { account.pilots = null; emitReady(); listPilots().then(() =>` — 0.3.75: the hangar opens on the probe (the list shows "loading"), and fills when the list lands
<!-- /note -->

#### <a id="s-mountAccount-tryNews"></a>`mountAccount>tryNews(s)`

function · L465–465

- calls: [`postNews`](#s-postNews)
- called by: [`mountAccount`](#s-mountAccount)

<!-- note:mountAccount>tryNews -->
<!-- /note -->
