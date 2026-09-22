/* LIVING GALAXY — the boot guard: a game that fails to start says why.
 *
 * 0.3.27. A patch series is applied by unzipping changed files over a tree,
 * and the one thing that can go wrong is applying some of them. ES modules
 * resolve named imports at LINK time, so one module that is a version behind
 * its neighbours does not throw where you can see it — the entire graph never
 * evaluates. Nothing registers, nothing mounts, and the page sits there with
 * the static shell from index.html and a black canvas behind it.
 *
 * That is exactly what happened: `js/sim.js` from 0.3.25 imports `lotMult`
 * from `js/economy.js`, which gained it in 0.3.24, and a tree where 0.3.24 had
 * not been applied booted to a black screen with nothing in the console the
 * player would ever look at. The server log was clean — every file 200, no
 * 404 — because every file was THERE. They just did not agree with each other.
 *
 * So the entry point catches it and puts it on the screen, in the page, in
 * words: what failed, which module, which named export, and which patch that
 * export arrived in. A build that cannot run should be able to tell you that
 * in one look, on the device it failed on, without a debugger.
 *
 * `EXPECTS` is the map from a named export to the version that introduced it.
 * Adding to it is optional — the panel still names the module and the missing
 * export without it — but naming the patch turns "something is broken" into
 * "re-apply 0.3.24", which is the difference between a bug report and a fix.
 */

import { VERSION } from "./version.js";

/** export name → the patch it arrived in. Only exports that moved BETWEEN files need listing. */
export const EXPECTS = {
  lotMult: "0.3.24",
  stockMultAt: "0.3.24",
  bookHandling: "0.3.25",
  handlingLeft: "0.3.25",
  stepDockwork: "0.3.25",
  visitRadius: "0.3.22",
  chainOffersAt: "0.3.21",
  siteRocksInCell: "0.3.20",
  dressLine: "0.3.23",
  registerVoice: "0.3.23",
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/**
 * Read a link failure. Browsers word it differently — Chromium says "does not
 * provide an export named 'x'", Firefox "doesn't provide an export named: x",
 * Safari "Importing binding name 'x' is not found" — so all three are matched
 * rather than one of them.
 */
export function readFailure(err) {
  const msg = String(err?.message ?? err ?? "");
  const named = msg.match(/export named:?\s*['"]?([A-Za-z0-9_$]+)/) || msg.match(/binding name '([A-Za-z0-9_$]+)'/);
  const mod = msg.match(/module\s+['"]([^'"]+)['"]/) || msg.match(/from\s+['"]([^'"]+)['"]/);
  const name = named?.[1] ?? null;
  return {
    kind: name ? "mismatch" : /Failed to fetch|Importing a module script failed|404|NetworkError/i.test(msg) ? "missing" : "error",
    name,
    module: mod?.[1] ?? null,
    patch: name ? EXPECTS[name] ?? null : null,
    message: msg,
  };
}

/** The words for a failure, as a person reading them on a phone needs them. */
export function explain(f) {
  if (f.kind === "mismatch") {
    const where = f.module ? `${f.module} does not provide <b>${esc(f.name)}</b>` : `a module is missing the export <b>${esc(f.name)}</b>`;
    return {
      title: "This build is half-patched",
      body: `${where}, but another module was updated to expect it. Some files in this folder are a version behind the rest.`,
      fix: f.patch
        ? `Re-apply <b>${f.patch}</b> over this folder — that is the patch ${esc(f.name)} arrived in — then any later patches again, in order.`
        : "Re-apply the patch series over this folder in order, from the oldest you have not applied.",
    };
  }
  if (f.kind === "missing") {
    return {
      title: "A file did not load",
      body: f.module ? `${esc(f.module)} could not be fetched.` : "A module could not be fetched.",
      fix: "Check the file is in the folder and the server is serving it — the server log names what it answered.",
    };
  }
  return { title: "Living Galaxy could not start", body: esc(f.message).slice(0, 400), fix: "The browser console has the stack." };
}

/**
 * Put it on the screen. The shell in index.html is still there, so this covers
 * it rather than fighting it — a black canvas with a working menu over it is
 * the most misleading thing the game can show.
 */
export function showFailure(err) {
  const f = readFailure(err);
  const w = explain(f);
  try {
    const el = document.createElement("div");
    el.id = "boot-fail";
    el.setAttribute("role", "alert");
    el.innerHTML = `
      <div class="bf-card">
        <div class="bf-tag">LIVING GALAXY — AD ASTRUM ${esc(VERSION)}</div>
        <h1>${esc(w.title)}</h1>
        <p>${w.body}</p>
        <p class="bf-fix">${w.fix}</p>
        <pre>${esc(f.message).slice(0, 600)}</pre>
      </div>`;
    document.body.appendChild(el);
    document.documentElement.classList.add("boot-failed");
  } catch { /* if even this cannot run, the console line below is all there is */ }
  console.error("[boot]", w.title, "—", w.fix, "\n", f.message);
  return f;
}

/**
 * Run the game, and turn a failure into words. `start` is the rest of the
 * boot: everything after the imports, so an error thrown while mounting is
 * caught the same way a link error is.
 */
export function guard(start) {
  try {
    const r = start();
    if (r && typeof r.catch === "function") r.catch(showFailure);
    return r;
  } catch (err) {
    showFailure(err);
    return null;
  }
}

/* A link error in the entry module itself never reaches `guard`, because the
 * module never runs. index.html's inline fallback is what catches that one;
 * this listener catches the later ones (a dynamic import, a worker). */
if (globalThis.addEventListener) {
  globalThis.addEventListener("error", (e) => {
    if (document.getElementById("boot-fail")) return;
    if (!/export named|binding name|Importing a module script/i.test(String(e?.message ?? ""))) return;
    showFailure(e.error ?? e.message);
  });
}
