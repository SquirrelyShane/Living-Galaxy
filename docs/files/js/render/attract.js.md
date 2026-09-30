# js/render/attract.js

[index](../../../README.md) · 402 lines · 36 symbols · 5 imports · 1 importers

## About

<!-- note:@file -->
LIVING GALAXY — the attract scene.

The title screen was already rendering the whole generated system. It just
looked empty, because the menu camera parked twenty-six star-radii out and
aimed at the barycentre: every world in the sky was there and every world
was sub-pixel. Nothing was missing — the shot was wrong.

So this is a camera director, not a second scene. It picks the best body in
whatever sky the menu loaded, frames it near its terminator so the light
rakes across the limb instead of flattening it, hangs one real generated
hull in the foreground, and lays a nebula behind the existing starfield.
Everything in frame is the same asset the game flies through — the same
shipgen hull, the same painted surface, the same ring texture.

It owns three things and disposes all three: the nebula shell, the hero
hull, and one rim light. It never touches the scene it borrows.

  const attract = mountAttract({ scene, camera, reduced, quality });
  attract.place(dt, origin);   // menu branch of the floating origin
  attract.aim(camera);         // menu branch of the camera block
  attract.stop(); attract.dispose();

- L31 · `const TERMINATOR = 1.62;` — radians off the sun vector
<!-- /note -->

## Imports

| line | from | names | target |
|---|---|---|---|
| 1 | `../../vendor/three.module.min.js` | `*` as `THREE` | **missing in js/** |
| 2 | `../world/bodies.js` | `BODIES`, `bodyById`, `bodyPosition`, `currentSystem` | [js/world/bodies.js](../world/bodies.js.md) |
| 3 | `../sim/sim.js` | `sim` | [js/sim/sim.js](../sim/sim.js.md) |
| 4 | `../ships/shipforge.js` | `forgeShipScaled`, `tickHull`, `releaseHull` | [js/ships/shipforge.js](../ships/shipforge.js.md) |
| 5 | `../ships/shipdb.js` | `shipById`, `SHIP_DB`, `DEFAULT_SHIP_ID` | [js/ships/shipdb.js](../ships/shipdb.js.md) |

## Imported by

- [js/render/engine.js](engine.js.md) — `mountAttract`

## Exports

- [`mountAttract`](#s-mountAttract) · function — used by [js/render/engine.js](engine.js.md)

## Effects

- **dom.create** — `canvas` (nebulaTexture:53)
- **dom.query** — `.start-card` (mountAttract>band:274)

## Symbols

### <a id="s-seeded"></a>`seeded(seedStr)`

function · L7–18

- called by: [`mountAttract>buildHull`](#s-mountAttract-buildHull) · [`nebulaTexture`](#s-nebulaTexture)

<!-- note:seeded -->
Its own seeded rng rather than an import, so this file drops into a tree
that does not have js/world/names.js yet and still runs. Same mulberry the rest
of LIVING GALAXY uses — a sky seed gives the same nebula on every device.
<!-- /note -->

### <a id="s-_p"></a>`_p`

const · L20–20

<!-- note:_p -->
<!-- /note -->

### <a id="s-_v"></a>`_v`

const · L21–21

<!-- note:_v -->
<!-- /note -->

### <a id="s-_star"></a>`_star`

const · L22–22

<!-- note:_star -->
<!-- /note -->

### <a id="s-_aim"></a>`_aim`

const · L23–23

<!-- note:_aim -->
<!-- /note -->

### <a id="s-look"></a>`look`

const · L24–24

<!-- note:look -->
<!-- /note -->

### <a id="s-side"></a>`side`

const · L25–25 · **never referenced**

<!-- note:side -->
<!-- /note -->

### <a id="s-fwd"></a>`fwd`

const · L26–26

<!-- note:fwd -->
<!-- /note -->

### <a id="s-rightV"></a>`rightV`

const · L27–27

<!-- note:rightV -->
<!-- /note -->

### <a id="s-upV"></a>`upV`

const · L28–28

<!-- note:upV -->
<!-- /note -->

### <a id="s-UP"></a>`UP`

const · L29–29 · **never referenced**

<!-- note:UP -->
<!-- /note -->

### <a id="s-TERMINATOR"></a>`TERMINATOR`

const · L31–31

<!-- note:TERMINATOR -->
How far off the star-to-planet line the camera sits. Straight down the
light is a flat disc; straight across it is a sliver. This is the angle
where a limb reads as a sphere and the night side still has a shape.
<!-- /note -->

### <a id="s-FOV_TALL"></a>`FOV_TALL`

const · L32–32

<!-- note:FOV_TALL -->
<!-- /note -->

### <a id="s-FOV_WIDE"></a>`FOV_WIDE`

const · L33–33

<!-- note:FOV_WIDE -->
<!-- /note -->

### <a id="s-heroBody"></a>`heroBody()`

function · L35–42

- via [js/world/bodies.js](../world/bodies.js.md): `BODIES.filter`
- called by: [`mountAttract>retarget`](#s-mountAttract-retarget)

<!-- note:heroBody -->
---- the shot -----------------------------------------------------------

The most photogenic thing in this sky. Rings first — a ringed giant is the
one silhouette that reads instantly at phone width — then the biggest
giant, then whatever is largest and is not the star.
<!-- /note -->

### <a id="s-heroMoon"></a>`heroMoon(hero)`

function · L44–48

- via [js/world/bodies.js](../world/bodies.js.md): `BODIES.filter`
- called by: [`mountAttract>retarget`](#s-mountAttract-retarget)

<!-- note:heroMoon -->
A moon of the hero, if it has one — something for the eye to find.
<!-- /note -->

### <a id="s-nebulaTexture"></a>`nebulaTexture(seedStr, starHex)`

function · L50–137

- calls: [`nebulaTexture>rgbOf`](#s-nebulaTexture-rgbOf) ×4 · [`seeded`](#s-seeded)
- called by: [`mountAttract>buildSky`](#s-mountAttract-buildSky) · [`mountAttract>retarget`](#s-mountAttract-retarget)
- effects: dom.create `canvas`

<!-- note:nebulaTexture -->
---- the backdrop -------------------------------------------------------
A painted nebula, once, on a canvas. Two clouds in the star's own colour
and its complement, a dust lane between them, and a scatter of faint
stars underneath the real starfield so the depth does not stop dead at
the point sprites.

- L60 · `const accent = new THREE.Color(starHex || "#ffb56b");` — Most of a sky has to stay black or none of it reads as space. The first
  pass washed the whole sphere in the star's own colour and the result was
  a flat olive fog — so the clouds are confined to two or three regions
  now, drawn cool with the star's hue as an accent rather than the theme,
  and everything between them is left alone.
- L70 · `g.globalCompositeOperation = "lighter";` — Clouds: soft radial blooms stacked additively, which is what gives the
  fibrous look a single gradient never does. Painted a little hotter than
  looks right on the raw canvas, because ACES tone mapping is brutal to
  the low end and eats anything subtle.
- L94 · `for (let i = 0; i < 5; i++) {` — A few bright cores, so the cloud has somewhere the eye lands.
- L108 · `g.globalCompositeOperation = "source-over";` — Dust: the dark half of a nebula is what makes the bright half read.
- L121 · `g.globalCompositeOperation = "lighter";` — Field stars, under the real ones, so depth does not stop dead at the
  point sprites.
<!-- /note -->

#### <a id="s-nebulaTexture-rgbOf"></a>`nebulaTexture>rgbOf(c, a)`

function · L68–68

- called by: [`nebulaTexture`](#s-nebulaTexture) ×4

<!-- note:nebulaTexture>rgbOf -->
<!-- /note -->

### <a id="s-mountAttract"></a>`mountAttract({…})`

function · **exported** · L139–402

- called by: [`mountGame`](engine.js.md#s-mountGame) _js/render/engine.js_

<!-- note:mountAttract -->
---- the director -------------------------------------------------------

- L154 · `let up = false;` — Whether anything of ours is currently in the scene, as opposed to
  whether the director is switched on at all. The engine asks every frame
  so it can stop us the moment the sim launches; it must not keep asking
  after we have already come down.
<!-- /note -->

#### <a id="s-mountAttract-buildSky"></a>`mountAttract>buildSky()`

function · L156–172

- calls: [`nebulaTexture`](#s-nebulaTexture)
- via [js/world/bodies.js](../world/bodies.js.md): `BODIES.find`
- called by: [`mountAttract>place`](#s-mountAttract-place)

<!-- note:mountAttract>buildSky -->
On a weak device "low" keeps the reframed camera — which is free, and is
most of what was wrong with the old title screen — and skips the two
things that actually cost: the nebula canvas and the forged hull.

The backdrop sits outside the starfield shell so the real points stay in
front of it, and it never writes depth — everything in the system draws
over it regardless of the numbers.

- L162 · `const mat = new THREE.MeshBasicMaterial({` — Opaque, not transparent: three draws the transparent list after the
  opaque one and depthTest:false would then paint the nebula over the
  whole system. As an opaque mesh with a very low renderOrder and no
  depth write it goes down first and everything else paints on top —
  the classic skybox order. The fade-in rides on material colour
  instead of opacity, for the same reason.
<!-- /note -->

#### <a id="s-mountAttract-buildHull"></a>`mountAttract>buildHull()`

function · L174–207

- calls: [`seeded`](#s-seeded) · [`shipById`](../ships/shipdb.js.md#s-shipById) _js/ships/shipdb.js_ ×2 · [`forgeShipScaled`](../ships/shipforge.js.md#s-forgeShipScaled) _js/ships/shipforge.js_
- called by: [`mountAttract>place`](#s-mountAttract-place)

<!-- note:mountAttract>buildHull -->
One real hull out of the forge — the same call the sky's traffic uses,
at lite detail because nothing here is closer than six units and the
greeble would cost frames nobody sees.

- L195 · `const box = new THREE.Box3().setFromObject(hull);` — Measure it rather than trusting dims: the forge normalises length, but
  a three-quarter pose projects its beam as much as its length, and the
  registry figure is the hull alone without masts or vanes.
- L201 · `rim = new THREE.DirectionalLight(0x9fc8ff, 1.5);` — The scene's one directional light stands in for the star, which leaves
  the hull's near side black at this angle. A dim cool fill from the
  opposite quarter is what makes it read as metal rather than a
  silhouette — and it is the only light this module adds.
<!-- /note -->

#### <a id="s-mountAttract-retarget"></a>`mountAttract>retarget()`

function · L209–225

- calls: [`heroBody`](#s-heroBody) · [`heroMoon`](#s-heroMoon) · [`nebulaTexture`](#s-nebulaTexture) · [`bodyById`](../world/bodies.js.md#s-bodyById) _js/world/bodies.js_
- via [js/world/bodies.js](../world/bodies.js.md): `BODIES.find`
- called by: [`mountAttract>place`](#s-mountAttract-place)

<!-- note:mountAttract>retarget -->
Rebuild the shot when the menu changes sky.

- L216 · `const i = owned.indexOf(sky.material.map);` — a new sky gets a new nebula
<!-- /note -->

#### <a id="s-mountAttract-place"></a>`mountAttract>place(dt, origin)`

function · L227–265

- calls: [`mountAttract>band`](#s-mountAttract-band) · [`mountAttract>buildHull`](#s-mountAttract-buildHull) · [`mountAttract>buildSky`](#s-mountAttract-buildSky) · [`mountAttract>retarget`](#s-mountAttract-retarget) · [`bodyPosition`](../world/bodies.js.md#s-bodyPosition) _js/world/bodies.js_

<!-- note:mountAttract>place -->
Place the floating origin. The menu branch used to walk a circle around
the star; it now walks a slow arc around the hero world, holding the
terminator angle so the light stays raking however far round it gets.

- L239 · `_star.set(-_p.x, -_p.y, -_p.z).normalize();` — planet -> star
- L241 · `_v.set(0, 1, 0);` — A frame perpendicular to the star vector, so the camera can swing
  around the terminator without ever crossing the poles.
- L254 · `const shot = band(camera);` — How far back to stand is a framing decision, not a constant: it is
  whatever puts the hero at the size the band can hold.
- L262 · `look.copy(dir).multiplyScalar(-dist);` — The camera sits at the floating origin, so everything it is told to
  look at has to be expressed relative to that origin — not in absolute
  world coordinates. The hero is exactly `dist` back down `dir`.
- L263 · `up = true;` — "Up" means the director is driving the menu, not that it has built
  props: at low quality it builds nothing and still owns the camera and
  the orbit lines, and the engine needs to know to stop us on launch or
  the lines never come back.
<!-- /note -->

#### <a id="s-mountAttract-band"></a>`mountAttract>band(cam)`

function · L267–300

- calls: [`mountAttract>band>nx`](#s-mountAttract-band-nx) ×2 · [`mountAttract>band>ny`](#s-mountAttract-band-ny) ×2
- called by: [`mountAttract>aim`](#s-mountAttract-aim) · [`mountAttract>place`](#s-mountAttract-place)
- effects: dom.query `.start-card`

<!-- note:mountAttract>band -->
Aim, and hang the hull. The camera is at the origin in menu, so the
hull is positioned in camera space and then pushed into world space —
it is a foreground prop, not part of the floating-origin world.

Where the shot can actually put things.

The start card is not in a fixed place: it is bottom-centred on a phone
and a full-height left rail in landscape, and either could move again the
next time the CSS changes. Guessing produced a wide shot with the hero
world entirely behind the card. So measure it — find the largest band of
canvas the card does not cover, and compose inside that.

Cheap, but not free, so it is cached: the card does not move between
frames.

- L272 · `let b = { cx: 0, cy: 0, w: 2, h: 2 };` — NDC: x and y both run -1 (left, bottom) to +1 (right, top).
- L282 · `{ cx: (R + 1) / 2, cy: 0, w: Math.max(0, 1 - R), h: 2 },` — right of the card
- L283 · `{ cx: (L - 1) / 2, cy: 0, w: Math.max(0, L + 1), h: 2 },` — left of it
- L284 · `{ cx: 0, cy: (T + 1) / 2, w: 2, h: Math.max(0, 1 - T) },` — above it
- L285 · `{ cx: 0, cy: (B - 1) / 2, w: 2, h: Math.max(0, B + 1) },` — below it
- L288 · `if (b.w < 0.5 || b.h < 0.5) b = { cx: 0, cy: 0, w: 2, h: 2 };` — A sliver is not a composition; fall back to the whole frame.
- L291 · `const wide = b.w * cam.aspect > b.h;` — The hero sits off-centre in its band, the hull opposite it, both
  inset so nothing important touches an edge.
- L291 · `const wide = b.w * cam.aspect > b.h;` — "Wide" is about the band's shape on screen, not its shape in NDC —
  NDC is always 2x2 for a full frame however wide the window is.
- L296 · `worldFill: Math.min(b.w * cam.aspect, b.h) * 0.23,` — how much of the band's shorter side each subject fills
<!-- /note -->

##### <a id="s-mountAttract-band-nx"></a>`mountAttract>band>nx(px)`

function · L278–278

- called by: [`mountAttract>band`](#s-mountAttract-band) ×2

<!-- note:mountAttract>band>nx -->
<!-- /note -->

##### <a id="s-mountAttract-band-ny"></a>`mountAttract>band>ny(py)`

function · L279–279

- called by: [`mountAttract>band`](#s-mountAttract-band) ×2

<!-- note:mountAttract>band>ny -->
<!-- /note -->

#### <a id="s-mountAttract-tanHalf"></a>`mountAttract>tanHalf(cam)`

function · L302–302

- called by: [`mountAttract>aim`](#s-mountAttract-aim) ×2 · [`mountAttract>atNDC`](#s-mountAttract-atNDC)

<!-- note:mountAttract>tanHalf -->
<!-- /note -->

#### <a id="s-mountAttract-atNDC"></a>`mountAttract>atNDC(nx, ny, dist, cam, out)`

function · L304–313

- calls: [`mountAttract>tanHalf`](#s-mountAttract-tanHalf)
- called by: [`mountAttract>aim`](#s-mountAttract-aim)

<!-- note:mountAttract>atNDC -->
A point `dist` ahead of the camera that lands on (nx, ny) on screen.
<!-- /note -->

#### <a id="s-mountAttract-aim"></a>`mountAttract>aim(cam)`

function · L315–350

- calls: [`mountAttract>atNDC`](#s-mountAttract-atNDC) · [`mountAttract>band`](#s-mountAttract-band) · [`mountAttract>tanHalf`](#s-mountAttract-tanHalf) ×2

<!-- note:mountAttract>aim -->
- L322 · `cam.lookAt(look.x, look.y, look.z);` — Aim straight at the hero first, so the camera basis is settled, then
  push the aim point the opposite way to slide the world into its
  corner of the frame.
- L337 · `const halfLen = (hullLen || 2.4) * 0.5;` — Distance is solved from how wide the hull should read on screen, not
  fixed in world units — a hero that works on a phone is a speck on a
  tablet otherwise.
- L338 · `const wantY = shot.hullFill;` — half-extent, NDC-y units
<!-- /note -->

#### <a id="s-mountAttract-orbitLines"></a>`mountAttract>orbitLines(on)`

function · L352–355

- called by: [`mountAttract>step`](#s-mountAttract-step) · [`mountAttract>stop`](#s-mountAttract-stop)

<!-- note:mountAttract>orbitLines -->
Orbit lines are a navigation aid. At this camera they are meaningless
straight scratches across the sky, and they read as a rendering fault in
a still. Hidden while the shot is up, put back the moment it comes down —
their own builder owns them, this only toggles a flag.
<!-- /note -->

#### <a id="s-mountAttract-step"></a>`mountAttract>step(dt)`

function · L357–366

- calls: [`mountAttract>orbitLines`](#s-mountAttract-orbitLines) · [`tickHull`](../ships/shipforge.js.md#s-tickHull) _js/ships/shipforge.js_

<!-- note:mountAttract>step -->
Props that animate on their own — plumes, running lights.

- L361 · `sky.material.color.setScalar(Math.min(1, sky.material.color.r + dt * 0.8));` — fade the backdrop up, so the menu does not pop on first paint
- L364 · `try { tickHull(hull, dt, drift, { throttle: 0.32 }); } catch {` — a hull that will not animate still renders
<!-- /note -->

#### <a id="s-mountAttract-stop"></a>`mountAttract>stop()`

function · L368–389

- calls: [`mountAttract>orbitLines`](#s-mountAttract-orbitLines) · [`releaseHull`](../ships/shipforge.js.md#s-releaseHull) _js/ships/shipforge.js_
- called by: [`mountAttract>dispose`](#s-mountAttract-dispose)

<!-- note:mountAttract>stop -->
The game launched. Everything here is menu dressing — take it down.

- L371 · `try { releaseHull(hull); } catch {` — already gone
<!-- /note -->

#### <a id="s-mountAttract-dispose"></a>`mountAttract>dispose()`

function · L391–394

- calls: [`mountAttract>stop`](#s-mountAttract-stop)

<!-- note:mountAttract>dispose -->
<!-- /note -->

#### <a id="s-mountAttract-active"></a>`mountAttract.active()`

prop · L398–398

<!-- note:mountAttract.active -->
<!-- /note -->

#### <a id="s-mountAttract-hero"></a>`mountAttract.hero()`

prop · L399–399

<!-- note:mountAttract.hero -->
<!-- /note -->

#### <a id="s-mountAttract-moon"></a>`mountAttract.moon()`

prop · L400–400

<!-- note:mountAttract.moon -->
<!-- /note -->
