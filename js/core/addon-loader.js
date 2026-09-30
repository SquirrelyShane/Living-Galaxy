import { addons } from "../crew/hooks.js";

export const PACKS = ["adult"];

export async function loadAddons() {
  for (const id of PACKS) {
    try {
      await import(`../../addon/${id}/index.js`);
      if (!addons[id]) addons.mark(id, true);
    } catch (err) {
      addons.mark(id, false);
      const missing = /Failed to fetch|not found|404|Cannot find module/i.test(String(err?.message ?? err));
      if (missing) console.info(`[addons] "${id}" not installed — core is vanilla. The 404 above is expected.`);
      else console.warn(`[addons] "${id}" failed to load`, err);
    }
  }
  return addons;
}

export const addonsReady = loadAddons();
