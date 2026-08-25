# PATCH v1.02.21 — "Watchfloor" (point fix)

The build stamp that flashed an old version on boot. Schema stays **17**.

---

## It was not a cache, and it was not a revert

```html
<div id="boot-version">v1.01.70 · Consignment</div>
```

Line 334 of `index.html`. `main.js` overwrites it from `core/version.js` the moment the module
graph loads, so the stale string was only ever on screen for a beat — but it was on screen on
**every boot**, and it had been since v1.01.70. Ten slices of it being wrong, visible every
single time, and invisible because it was too quick to read.

Wiping a save calls `location.reload()`, and a reload on a phone is slow enough to hold that
frame. So the flash to "Consignment" and back is the whole bug: nothing reverted, nothing was
cached, no module was stale. The markup was just lying for a fraction of a second, every time,
for ten versions.

The div is empty now. A version in markup is a version with no way to stay true — nothing that
bumps the real one will think to look there.

## The save stamp said the wrong thing too

```
v1.02.20 · Watchfloor · save 1.01.70 · 42 min flown
```

`save 1.01.70` reads as though the *build* were 1.01.70. It is the build that **wrote** the
save, which is genuinely worth knowing — a save carried forward through ten migrations is the
first thing to mention when reporting a bug — but it has to say so, and it only earns the
space when it disagrees with what is running:

```
v1.02.21 · Watchfloor · save from v1.01.70 · 42 min flown
```

Matching builds show no second version at all.

## A guard, because this class of thing is silent by construction

`test/static.mjs` now fails on any version, codename or schema number written into markup or a
stylesheet. A comment is history and passes; displayed text does not. The CDN pin on three.js
is a dependency, not identity, and is exempt.

The check was verified the only way a guard is worth anything: the string was put back, the
suite was run, it failed with the offending line quoted, and the string was removed again.

It also failed once on its own explanatory comment, which is how the multi-line case got
handled — an HTML comment spans lines, so "is this line a comment" is the wrong question and
"is this offset inside one" is the right one.

## Files touched

| file | change |
|---|---|
| `index.html` | the boot stamp starts empty |
| `src/main.js` | `save from v…`, and only when it differs from what is running |
| `test/static.mjs` | no build identity in markup or stylesheets |
| `src/core/version.js`, `package.json` | v1.02.21 |

## Verified

- `node test/all.mjs` — **42/42 suites green, 3,331 checks** (95 s).
- Guard proved by reintroducing the string: caught, quoted, and clean again once removed.

## Not verified

- **Whether the boot screen looks right with an empty stamp** for the instant before the
  module graph resolves. It should read as a blank line rather than a missing element, but
  that is a phone question and this is the tenth slice on that list.
