/* LIVING GALAXY — the underwriter's desk, at a yard.
 *
 * One panel, rendered into the station deck's yard page under the hull you
 * are looking at. It is its own module for a boring reason — js/stationdeck.js
 * is held under 600 lines by test/console.test.mjs and had sixty to spare —
 * and for a better one: what a policy costs is arithmetic over a hull value,
 * and arithmetic that renders itself is easier to be sure of than arithmetic
 * buried in a five-hundred-line panel.
 *
 * It takes the DOM helpers it needs rather than importing the deck's private
 * ones, so it can be dropped into any panel that has a hull and a purse.
 */

import { quoteAll, policyFor, insure, playerKey, TIER_BY_ID } from "../insurance.js";

/**
 * Render the cover block for one hull.
 *
 * @param host    element to append into
 * @param opts    { hullId, hullName, value, credits, docked, onBuy(tierId, premium), ui: { el, row, btn } }
 */
export function renderCoverage(host, opts) {
  const { hullId, hullName, value, credits = 0, docked = true, onBuy, ui } = opts;
  const { el, row, btn } = ui;
  if (!hullId || !(value > 0)) return;

  const key = playerKey(hullId);
  const held = policyFor(key);

  const sec = el("div", "sd-sec");
  sec.append(el("h4", null, "HULL COVER"));
  sec.append(el("p", "sd-note",
    held
      ? `${TIER_BY_ID[held.tier].name} cover is written against this hull for ${held.payout.toLocaleString()} cr. ` +
        "It settles once, when the hull is lost, and is gone with it."
      : `${hullName} is uninsured. A policy covers one loss and pays a share of what the hull is worth to you — ` +
        `${Math.round(value).toLocaleString()} cr at your rate, not list, so buying cheap and losing it deliberately earns nothing.`));

  for (const q of quoteAll(value)) {
    const mine = held?.tier === q.id;
    const afford = credits >= q.premium;
    const v = row(sec, q.name, `pays ${Math.round(q.payoutPct * 100)}% — ${q.payout.toLocaleString()} cr`);
    const pr = el("span", "sd-cr", `${q.premium.toLocaleString()} cr`);
    pr.style.color = q.hue;
    v.append(pr);
    const label = mine ? "HELD" : !docked ? "DOCK" : afford ? "BUY" : "SHORT";
    const b = btn(label, () => {
      if (mine || !docked || !afford) return;
      onBuy?.(q.id, q.premium);
    }, mine ? "sd-accent" : "");
    b.disabled = mine || !docked || !afford;
    v.append(b);
  }
  host.append(sec);
}

/**
 * Buy cover on the player's hull, taking the premium out of their purse.
 * Returns the policy, or null if they could not pay.
 *
 * Replacing cover on a hull that already has some charges the new premium in
 * full and refunds nothing — you are not trading a policy in, you are buying
 * a different one, and the one you had has been running since you bought it.
 */
export function buyCoverage(ship, hullId, tierId, value) {
  const t = TIER_BY_ID[tierId];
  if (!t || !ship || !hullId || !(value > 0)) return null;
  const premium = Math.round(value * t.rate);
  if (ship.credits < premium) return null;
  ship.credits -= premium;
  return insure(playerKey(hullId), tierId, value, 0);
}
