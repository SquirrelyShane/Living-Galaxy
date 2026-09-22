/* Try optional addon packs. Missing folders are not errors.
 * Delete addon/adult/ and this import fails quietly — core stays vanilla.
 *
 * A pack that is not installed still costs one 404 in the network log, because
 * that is how a browser discovers a module is not there. The log line below is
 * what tells you it was expected rather than broken.
 */
import { addons } from "./crew/hooks.js";

export const PACKS = ["adult"];

export async function loadAddons() {
  for (const id of PACKS) {
    try {
      await import(`../addon/${id}/index.js`);
      if (!addons[id]) addons.mark(id, true);
    } catch (err) {
      addons.mark(id, false);
      /* a missing folder is the normal case; anything else is the pack itself
       * throwing, and that is worth seeing */
      const missing = /Failed to fetch|not found|404|Cannot find module/i.test(String(err?.message ?? err));
      if (missing) console.info(`[addons] "${id}" not installed — core is vanilla. The 404 above is expected.`);
      else console.warn(`[addons] "${id}" failed to load`, err);
    }
  }
  return addons;
}

/** Resolves once every pack has had its chance. Await it before reading `addons`. */
export const addonsReady = loadAddons();
