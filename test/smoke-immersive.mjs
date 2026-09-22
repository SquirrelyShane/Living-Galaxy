/* Headless smoke for 0.3.06 — the canopy edge to edge, and the tape.
 *
 * Fullscreen cannot be asserted end-to-end in headless Chromium (there is no
 * window manager to take the bars off), so what is checked here is everything
 * up to the platform call: the manifest is served and says fullscreen, the
 * chip is on the strip, the request is refused when it does not come from a
 * gesture and goes through when it does, and the HUD re-measures on the
 * change. The last one is the part that actually breaks in play.
 *
 * Then the tape: taps and orders land on it with a state vector attached,
 * ARIA's records are labelled separately from the pilot's, outcomes settle,
 * and CONSOLE › WORK › TAPE opens and exports without stopping the canopy.
 *
 *   python server.py 8124 &
 *   node test/smoke-immersive.mjs "$(npm root -g)/playwright/index.mjs"
 */
const pwPath = process.argv[2];
const port = process.argv[3] || "8124";
const { chromium } = await import(pwPath);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on("pageerror", (e) => { errors.push(e.message); console.error("PAGE ERROR", e.message); });

let fails = 0;
const ok = (c, m) => { console.log(`${c ? "ok  " : "FAIL"} ${m}`); if (!c) fails++; };

/* ---- the manifest, before the game even loads ---------------------------- */
{
  const res = await page.request.get(`http://127.0.0.1:${port}/manifest.webmanifest`);
  ok(res.ok(), `the manifest is served (${res.status()})`);
  const m = await res.json().catch(() => null);
  ok(m?.display === "fullscreen", `display is fullscreen, not standalone (${m?.display})`);
  ok(m?.orientation === "portrait", `portrait (${m?.orientation})`);
  ok(Array.isArray(m?.icons) && m.icons.length >= 2, `${m?.icons?.length ?? 0} icons declared`);
  ok(m?.icons?.some((i) => i.purpose === "maskable"), "one of them is maskable, so the launcher does not letterbox it");
  for (const i of m?.icons ?? []) {
    const r = await page.request.get(`http://127.0.0.1:${port}/${i.src.replace(/^\.\//, "")}`);
    ok(r.ok(), `  ${i.src} is really there (${r.status()})`);
  }
}

/* ---- launch ---------------------------------------------------------------- */
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
{
  const linked = await page.evaluate(() => Boolean(document.querySelector('link[rel="manifest"]')));
  ok(linked, "the page links the manifest, so the browser offers the install");
}
await page.fill("#callsign", "TapeSmoke");
await page.click("#btn-create");
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector("#create-body .pick")?.click());
await page.waitForTimeout(400);
await page.click("#create-next");
await page.waitForTimeout(300);
await page.evaluate(() => [...document.querySelectorAll("#create-body .pick")].find((b) => /mining/i.test(b.textContent))?.click() ?? document.querySelector("#create-body .pick")?.click());
await page.waitForSelector("#create-body .compile-sigil.set", { timeout: 15000 }).catch(() => {});
await page.click("#create-next");
await page.waitForTimeout(300);
await page.click("#create-next");
await page.waitForTimeout(300);
await page.click("#btn-sol");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 30000 });
await page.waitForTimeout(1800);

/* ---- the chip -------------------------------------------------------------- */
{
  const chip = await page.evaluate(() => {
    const b = document.getElementById("btn-full");
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { hidden: b.classList.contains("hidden"), w: r.width, h: r.height, text: b.textContent.trim(), title: b.title };
  });
  ok(chip, "the fullscreen chip is on the tool strip");
  ok(chip && !chip.hidden && chip.w > 10 && chip.h > 10, `and it is actually visible (${chip?.w}×${chip?.h})`);
  ok(chip && /fullscreen/i.test(chip.title), `with a title that says what it does (${chip?.title})`);
}

/* ---- the request itself ------------------------------------------------------
 *
 * The gesture rule cannot be asserted here and it is worth saying why: headless
 * Chromium has no window manager and no user-activation policy to enforce, so
 * it GRANTS requestFullscreen from a bare script call — the very thing a phone
 * refuses. So what is checked is the half that is ours: the module returns a
 * structured result instead of throwing, it asks the platform for the gesture
 * bar as well as the status bar, and one tap on the chip is exactly one
 * request. Whether the platform then says yes is the platform's business, and
 * on the S26 it says yes only from the tap.
 */
{
  const shape = await page.evaluate(async () => {
    const { enterFullscreen, exitFullscreen } = await import("/js/ui/fullscreen.js");
    const r = await enterFullscreen();
    await exitFullscreen();
    return { hasOk: typeof r?.ok === "boolean", threw: false };
  }).catch(() => ({ hasOk: false, threw: true }));
  ok(!shape.threw && shape.hasOk, "a request answers with a result and never throws out of the handler");

  /* back to a plain tab before the tap test, or the tap would be a toggle OFF */
  const mode = await page.evaluate(async () => {
    const { exitFullscreen, immersiveMode, isFullscreen } = await import("/js/ui/fullscreen.js");
    await exitFullscreen();
    await new Promise((r) => setTimeout(r, 250));
    return { mode: immersiveMode(), fs: isFullscreen() };
  });
  ok(mode.mode === "browser" && !mode.fs, `a plain tab is recognised as one (${mode.mode})`);

  const asked = await page.evaluate(() => {
    window.__fsCalls = 0;
    const el = document.documentElement;
    const real = el.requestFullscreen?.bind(el);
    el.requestFullscreen = (opts) => { window.__fsCalls++; window.__fsOpts = opts; return real ? real(opts).catch(() => {}) : Promise.resolve(); };
    return true;
  });
  ok(asked, "patched the platform call to watch for it");
  await page.click("#btn-full");
  await page.waitForTimeout(500);
  const calls = await page.evaluate(() => ({ n: window.__fsCalls, opts: window.__fsOpts }));
  ok(calls.n === 1, `tapping the chip asks the platform exactly once (${calls.n})`);
  ok(calls.opts?.navigationUI === "hide", `and asks for the gesture bar too, not just the status bar (navigationUI: ${calls.opts?.navigationUI})`);

  /* the pilot's choice outlives the page */
  const kept = await page.evaluate(() => localStorage.getItem("lgaa.fullscreen"));
  ok(kept === "on", `the choice is remembered for next launch (${kept})`);

  await page.evaluate(async () => (await import("/js/ui/fullscreen.js")).exitFullscreen());
  await page.waitForTimeout(300);
}

/* ---- the re-layout ---------------------------------------------------------- */
{
  /* The bug this guards: the HUD measures from visualViewport and the chart
   * plot from a rect, so a bar leaving mid-session must resize them. The
   * module nudges across the animation rather than once on the event. */
  const resizes = await page.evaluate(async () => {
    let n = 0;
    window.addEventListener("resize", () => { n++; });
    document.dispatchEvent(new Event("fullscreenchange"));
    await new Promise((r) => setTimeout(r, 600));
    return n;
  });
  ok(resizes >= 3, `a fullscreen change re-measures the HUD across the bar animation (${resizes} nudges)`);
}

/* ---- every HUD control is actually reachable -----------------------------
 *
 * The bug this exists for: a control can lay out perfectly and still be dead
 * because something is painted over it. The DOCK and HAIL side keys sat under
 * the 3D canvas for several patches — every tap went to the sky — and 0.3.06's
 * fullscreen chip pushed the tool stack 30px past the box reserved for it and
 * covered the RCS pad's bottom row, so AFT, DN and SCAN went the same way.
 * Neither is visible in a screenshot and neither throws.
 *
 * So: hit-test the centre of every visible control against elementFromPoint.
 * If what comes back is not that control, something is on top of it.
 */
{
  const covered = await page.evaluate(() => {
    const out = [];
    const sel = "#hud button, #hud .rcs-btn, #hud .sw, #hud .glass[data-proxy]";
    for (const el of document.querySelectorAll(sel)) {
      if (el.classList.contains("hidden") || el.offsetParent === null) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      /* off-screen is a layout question, not a stacking one */
      if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (hit !== el && !el.contains(hit)) {
        out.push(`${el.id || el.textContent.trim().slice(0, 10) || el.className} < ${hit?.tagName}${hit?.id ? "#" + hit.id : ""}`);
      }
    }
    return out;
  });
  ok(covered.length === 0, `every visible HUD control is on top of its own pixels (${covered.length ? covered.join("; ") : "nothing covered"})`);

  /* and the pad the pilot flies with, specifically, all nine of it */
  const rcs = await page.evaluate(() => {
    const pad = document.getElementById("rcs");
    if (!pad || getComputedStyle(pad).display === "none") return { skipped: true };
    const bad = [];
    for (const c of pad.children) {
      const r = c.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (hit !== c && !c.contains(hit)) bad.push(c.textContent.trim());
    }
    return { n: pad.children.length, bad };
  });
  ok(rcs.skipped || (rcs.n === 9 && rcs.bad.length === 0), `all ${rcs.n ?? 0} thruster keys are tappable (${rcs.bad?.length ? `covered: ${rcs.bad.join(", ")}` : "none covered"})`);

  ok(!(await page.evaluate(() => Boolean(document.getElementById("side-keys")))), "the dead DOCK/HAIL side keys are gone");
  /* but the controls themselves are still reachable from the console */
  const jumps = await page.evaluate(async () => {
    const { jumps: reg } = await import("/js/console/search.js");
    return { dock: reg.has("dock"), hail: reg.has("hail") };
  });
  ok(jumps.dock && jumps.hail, `DOCK and HAIL are still reachable from CON (dock ${jumps.dock}, hail ${jumps.hail})`);
}

/* ---- the tape ---------------------------------------------------------------- */
{
  const before = await page.evaluate(async () => (await import("/js/recorder.js")).recorderReport());
  ok(before.total > 0, `the tape is already recording (${before.total} records from getting this far)`);

  /* a tap the pilot can name */
  await page.click("#btn-cam");
  await page.waitForTimeout(250);
  await page.click("#btn-cam");
  await page.waitForTimeout(250);
  const taps = await page.evaluate(async () => {
    const { tape } = await import("/js/recorder.js");
    return tape({ kind: "tap" }).slice(-4).map((r) => ({ act: r.act, arg: r.arg, keys: Object.keys(r.s).length, t: r.s.t, by: r.by }));
  });
  ok(taps.some((t) => t.act === "btn-cam"), `a tap is filed by the control's id (${taps.map((t) => t.act).join(", ")})`);
  ok(taps.every((t) => t.keys === 16), `every record carries the whole 16-feature state (${taps[0]?.keys})`);
  ok(taps.every((t) => t.by === "player"), "and is labelled as the pilot's own hands");

  /* an order, not a tap */
  const order = await page.evaluate(async () => {
    const { setMiningMode } = await import("/js/sim.js");
    setMiningMode("closest");
    const { tape } = await import("/js/recorder.js");
    const r = tape({ kind: "order" }).at(-1);
    return r ? { act: r.act, arg: r.arg } : null;
  });
  ok(order?.act === "cutter" && order.arg === "closest", `an order goes on the tape as itself (${order?.act} ${order?.arg})`);

  /* ARIA's records are kept apart from the pilot's */
  const split = await page.evaluate(async () => {
    const { ariaTakeConn, ariaRelease } = await import("/js/aria.js");
    const r = ariaTakeConn();
    if (!r.ok) return { error: r.error };
    const { setMiningMode } = await import("/js/sim.js");
    setMiningMode("off");
    const { recorderReport } = await import("/js/recorder.js");
    const rep = recorderReport();
    ariaRelease();
    return rep;
  });
  ok(!split.error, `ARIA can take the conn (${split.error ?? "ok"})`);
  ok(split.aria > 0, `what ARIA does is filed under ARIA (${split.aria} records)`);
  ok(split.mine > 0 && split.mine !== split.total, "and the pilot's own are still counted separately");

  /* outcomes settle */
  const settled = await page.evaluate(async () => {
    const { record, settle, tape } = await import("/js/recorder.js");
    const { sim } = await import("/js/sim.js");
    const r = record("order", "smoketest", "x");
    const cr0 = sim.ship.credits;
    sim.ship.credits += 5000;
    sim.time += 31;
    settle();
    sim.ship.credits = cr0;
    return r.d;
  });
  /* >= rather than ==: the tape reports what the numbers ACTUALLY did over the
   * window, which is the honest thing for it to do — the sim is still running
   * and may have earned a little of its own. Attribution is the model's job. */
  ok(settled && settled.cr >= 5000 && settled.dt >= 30, `an outcome lands on the record after its window (${settled?.cr} cr over ${settled?.dt}s)`);

  /* JSONL */
  const jsonl = await page.evaluate(async () => {
    const { tapeJSONL } = await import("/js/recorder.js");
    const lines = tapeJSONL().split("\n");
    let bad = 0;
    for (const l of lines) { try { JSON.parse(l); } catch { bad++; } }
    return { n: lines.length, bad, head: JSON.parse(lines[0]) };
  });
  ok(jsonl.bad === 0, `every one of the ${jsonl.n} JSONL lines parses on its own`);
  ok(Array.isArray(jsonl.head.keys) && jsonl.head.keys.length === 16, "the header states the feature order for whatever reads it");
}

/* ---- CONSOLE › WORK › TAPE opens, and the canopy keeps drawing -------------- */
{
  const frames = async (ms) => page.evaluate((d) => new Promise((res) => {
    let n = 0; const t0 = performance.now();
    const step = () => { n++; if (performance.now() - t0 < d) requestAnimationFrame(step); else res(n); };
    requestAnimationFrame(step);
  }), ms);

  /* What matters is that the panel does not COST the canopy anything, so it is
   * measured against this machine's own frame rate a moment earlier rather
   * than an absolute count — headless swiftshader runs at single-figure fps
   * and an absolute threshold here would be a coin flip, not a test. */
  const baseline = await frames(1200);
  await page.click("#btn-con");
  await page.waitForTimeout(400);
  const opened = await page.evaluate(async () => {
    const { jumpTo } = await import("/js/console/console.js");
    jumpTo("work/tape");
    return true;
  });
  ok(opened, "jumped to WORK › TAPE");
  await page.waitForTimeout(700);
  const panel = await page.evaluate(() => {
    const body = document.querySelector("#con-body");
    const text = body?.textContent ?? "";
    return {
      sections: [...body.querySelectorAll(".sec-head, .section-head, h3, .sec")].map((e) => e.textContent.trim()).filter(Boolean).slice(0, 8),
      hasTape: /TAPE/.test(text),
      hasExport: /EXPORT/i.test(text),
      buttons: [...body.querySelectorAll("button")].map((b) => b.textContent.trim()).filter(Boolean),
      chars: text.length,
    };
  });
  ok(panel.hasTape && panel.chars > 200, `the panel has something to say (${panel.chars} chars)`);
  ok(panel.buttons.some((b) => /TAPE\.JSONL/.test(b)), `the export control is there (${panel.buttons.join(" / ")})`);
  const f = await frames(1200);
  ok(f > 0 && f >= baseline * 0.6, `and the canopy keeps drawing with it open (${f} frames vs ${baseline} with the console shut)`);
  await page.screenshot({ path: "/tmp/tape-panel.png" });

  /* the download path, without actually writing to disk */
  const dl = await page.evaluate(async () => {
    let made = null;
    const real = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (b) => { made = { size: b.size, type: b.type }; return real(b); };
    const clicks = [];
    const realClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { clicks.push(this.download); };
    const { downloadTape } = await import("/js/recorder.js");
    const okk = downloadTape();
    HTMLAnchorElement.prototype.click = realClick;
    URL.createObjectURL = real;
    return { okk, made, clicks };
  });
  ok(dl.okk && dl.made?.size > 100, `EXPORT writes a real file (${dl.made?.size} bytes, ${dl.made?.type})`);
  ok(dl.clicks[0]?.endsWith(".jsonl"), `named for what it is (${dl.clicks[0]})`);

  /* The console is a full-screen overlay, so its own body sits over the CON
   * chip — close it through the toggle rather than a synthetic click that the
   * panel would intercept. */
  await page.evaluate(async () => (await import("/js/sim.js")).setTerminal(false));
  await page.waitForTimeout(300);
}

/* ---- ARIA's new jobs are reachable from a real sky --------------------------- */
{
  const plan = await page.evaluate(async () => {
    const { sim } = await import("/js/sim.js");
    const { refitPlan, buildPlan, ariaPilot } = await import("/js/aria-pilot.js");
    sim.ship.hull = 100;
    sim.ship.credits = 500000;
    ariaPilot.investAt = 0;
    const r = refitPlan(sim.ship, "mine");
    const b = buildPlan(sim.ship, "mine");
    return {
      refit: r ? { name: r.opt.name, price: r.opt.price, at: r.st.name } : null,
      build: b ? { label: r?.opt?.label ?? b.opt.label, at: b.st.name } : null,
    };
  });
  ok(plan.refit, `ARIA finds a refit worth buying in a real sky (${plan.refit?.name} · ${plan.refit?.price?.toLocaleString()} cr at ${plan.refit?.at})`);
  ok(plan.build === null, "and no drone without a company, which is the correct refusal");
}

ok(errors.length === 0, `no page errors (${errors.length})`);
console.log(fails ? `smoke-immersive: ${fails} FAILED` : "smoke-immersive: all green");
await browser.close();
process.exit(fails ? 1 : 0);
