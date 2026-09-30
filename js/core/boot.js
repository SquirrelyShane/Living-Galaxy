import { VERSION } from "../version.js";

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
  } catch {}
  console.error("[boot]", w.title, "—", w.fix, "\n", f.message);
  return f;
}

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

if (globalThis.addEventListener) {
  globalThis.addEventListener("error", (e) => {
    if (document.getElementById("boot-fail")) return;
    if (!/export named|binding name|Importing a module script/i.test(String(e?.message ?? ""))) return;
    showFailure(e.error ?? e.message);
  });
}
