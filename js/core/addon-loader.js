import { addons } from "../crew/hooks.js";

export const PACKS = ["adult"];

async function installed(id) {
  if (typeof location === "undefined" || typeof fetch !== "function") return null;
  try {
    const r = await fetch(new URL(`../../addon/${id}/index.js`, import.meta.url), { method: "HEAD" });
    return r.ok;
  } catch {
    return null;
  }
}

export async function loadAddons() {
  for (const id of PACKS) {
    try {
      await import(`../../addon/${id}/index.js`);
      if (!addons[id]) addons.mark(id, true);
    } catch (err) {
      addons.mark(id, false);
      const there = await installed(id);
      const missing = there === null ? /Failed to fetch|not found|404|Cannot find module/i.test(String(err?.message ?? err)) : !there;
      if (missing) console.info(`[addons] "${id}" not installed — core is vanilla. The 404 above is expected.`);
      else console.warn(`[addons] "${id}" is installed but failed to load — check its imports against js/ (tools/codedocs/move.mjs --after fixes moved paths)`, err);
    }
  }
  return addons;
}

export const addonsReady = loadAddons();
