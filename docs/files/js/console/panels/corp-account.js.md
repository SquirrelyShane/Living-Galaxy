# js/console/panels/corp-account.js

[index](../../../../README.md) · 133 lines · 10 symbols · 2 imports · 1 importers

## About

<!-- note:@file -->
Living Galaxy — CONSOLE › CORP › ACCOUNT: the pilot that follows you.

Sign in to living-galaxy.com from inside the game, see what the account
holds, sync now, and — the only screen that ever asks — choose between two
copies of a pilot when both this device and the account moved. Everything
else is js/net/account.js; this file is the buttons.
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../kit.js` | `el`, `section`, `note`, `row`, `button`, `group`, `card` | [js/console/kit.js](../kit.js.md) |
| 2 | `../../net/account.js` | `account`, `accountLine`, `signIn`, `signOut`, `sync`, `resolve`, `takeNewer`, `checkRemote`, `loadBoard`, `SITE_LINK` | [js/net/account.js](../../net/account.js.md) |

## Imported by

- [js/console/panels/corp.js](corp.js.md) — `mountAccount`

## Exports

- [`mountAccount`](#s-mountAccount) · function — used by [js/console/panels/corp.js](corp.js.md)

## Effects

- **event.listen** — `keydown on pass → (inline)` (mountSignIn:79)
- **input.key** — `Enter` (mountSignIn:79)

## Symbols

### <a id="s-fmtWhen"></a>`fmtWhen(t)`

function · L4–8

- called by: [`mountConflict>side`](#s-mountConflict-side) · [`mountSignedIn`](#s-mountSignedIn)

<!-- note:fmtWhen -->
<!-- /note -->

### <a id="s-mountAccount"></a>`mountAccount(root, ctx)`

function · **exported** · L10–36

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ · [`row`](../kit.js.md#s-row) _js/console/kit.js_ · [`section`](../kit.js.md#s-section) _js/console/kit.js_ · [`mountAccount>paint`](#s-mountAccount-paint) · [`accountLine`](../../net/account.js.md#s-accountLine) _js/net/account.js_
- called by: [`SUBS.account`](corp.js.md#s-SUBS-account) _js/console/panels/corp.js_

<!-- note:mountAccount -->
<!-- /note -->

#### <a id="s-mountAccount-paint"></a>`mountAccount>paint()`

function · L19–33

- calls: [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`mountBoard`](#s-mountBoard) · [`mountConflict`](#s-mountConflict) · [`mountOffline`](#s-mountOffline) · [`mountSignedIn`](#s-mountSignedIn) · [`mountSignIn`](#s-mountSignIn) · [`accountLine`](../../net/account.js.md#s-accountLine) _js/net/account.js_
- called by: [`mountAccount`](#s-mountAccount) · [`mountConflict`](#s-mountConflict) ×2 · [`mountSignIn`](#s-mountSignIn) · [`mountSignedIn`](#s-mountSignedIn) ×3

<!-- note:mountAccount>paint -->
- L20 · `const kind = account.site === false ? "offline" : account.site === null ? "probing" : !acc` — the key is WHICH card, not the status text: a refused sign-in must not
  rebuild the card and throw away what the pilot typed — the status row
  carries the words
<!-- /note -->

### <a id="s-mountBoard"></a>`mountBoard(body)`

function · L38–55

- calls: [`card`](../kit.js.md#s-card) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×2 · [`group`](../kit.js.md#s-group) _js/console/kit.js_ · [`mountBoard>paintBoard`](#s-mountBoard-paintBoard) · [`loadBoard`](../../net/account.js.md#s-loadBoard) _js/net/account.js_
- via [js/net/account.js](../../net/account.js.md): `loadBoard.then`
- called by: [`mountAccount>paint`](#s-mountAccount-paint)

<!-- note:mountBoard -->
0.3.43 — TOP PILOTS: the site's board, by purse, callsigns only. Fetched
when the card builds; a site without one shows nothing.
<!-- /note -->

#### <a id="s-mountBoard-paintBoard"></a>`mountBoard>paintBoard(b)`

function · L42–48

- calls: [`note`](../kit.js.md#s-note) _js/console/kit.js_ ×3 · [`row`](../kit.js.md#s-row) _js/console/kit.js_
- called by: [`mountBoard`](#s-mountBoard)

<!-- note:mountBoard>paintBoard -->
<!-- /note -->

### <a id="s-mountOffline"></a>`mountOffline(body)`

function · L57–64

- calls: [`card`](../kit.js.md#s-card) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ · [`group`](../kit.js.md#s-group) _js/console/kit.js_ · [`note`](../kit.js.md#s-note) _js/console/kit.js_
- via [js/net/account.js](../../net/account.js.md): `SITE_LINK.replace`
- called by: [`mountAccount>paint`](#s-mountAccount-paint)

<!-- note:mountOffline -->
<!-- /note -->

### <a id="s-mountSignIn"></a>`mountSignIn(body, paint)`

function · L66–88

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ · [`card`](../kit.js.md#s-card) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×5 · [`group`](../kit.js.md#s-group) _js/console/kit.js_ ×4 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`mountAccount>paint`](#s-mountAccount-paint) · [`signIn`](../../net/account.js.md#s-signIn) _js/net/account.js_
- called by: [`mountAccount>paint`](#s-mountAccount-paint)
- effects: event.listen `keydown` · input.key `Enter`

<!-- note:mountSignIn -->
<!-- /note -->

### <a id="s-mountSignedIn"></a>`mountSignedIn(body, paint)`

function · L90–108

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×3 · [`card`](../kit.js.md#s-card) _js/console/kit.js_ · [`el`](../kit.js.md#s-el) _js/console/kit.js_ · [`group`](../kit.js.md#s-group) _js/console/kit.js_ ×2 · [`note`](../kit.js.md#s-note) _js/console/kit.js_ ×2 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×2 · [`fmtWhen`](#s-fmtWhen) · [`mountAccount>paint`](#s-mountAccount-paint) ×3 · [`checkRemote`](../../net/account.js.md#s-checkRemote) _js/net/account.js_ · [`signOut`](../../net/account.js.md#s-signOut) _js/net/account.js_ · [`sync`](../../net/account.js.md#s-sync) _js/net/account.js_ · [`takeNewer`](../../net/account.js.md#s-takeNewer) _js/net/account.js_
- called by: [`mountAccount>paint`](#s-mountAccount-paint)

<!-- note:mountSignedIn -->
<!-- /note -->

### <a id="s-mountConflict"></a>`mountConflict(body, paint)`

function · L110–133

- calls: [`button`](../kit.js.md#s-button) _js/console/kit.js_ ×2 · [`card`](../kit.js.md#s-card) _js/console/kit.js_ · [`group`](../kit.js.md#s-group) _js/console/kit.js_ · [`note`](../kit.js.md#s-note) _js/console/kit.js_ · [`mountAccount>paint`](#s-mountAccount-paint) ×2 · [`mountConflict>side`](#s-mountConflict-side) ×2 · [`resolve`](../../net/account.js.md#s-resolve) _js/net/account.js_ ×2
- called by: [`mountAccount>paint`](#s-mountAccount-paint)

<!-- note:mountConflict -->
<!-- /note -->

#### <a id="s-mountConflict-side"></a>`mountConflict>side(title, d, when)`

function · L113–125

- calls: [`el`](../kit.js.md#s-el) _js/console/kit.js_ ×4 · [`row`](../kit.js.md#s-row) _js/console/kit.js_ ×5 · [`fmtWhen`](#s-fmtWhen)
- called by: [`mountConflict`](#s-mountConflict) ×2

<!-- note:mountConflict>side -->
<!-- /note -->
