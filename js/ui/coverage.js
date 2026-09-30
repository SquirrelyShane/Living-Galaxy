import { quoteAll, policyFor, insure, playerKey, TIER_BY_ID } from "../economy/insurance.js";

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

export function buyCoverage(ship, hullId, tierId, value) {
  const t = TIER_BY_ID[tierId];
  if (!t || !ship || !hullId || !(value > 0)) return null;
  const premium = Math.round(value * t.rate);
  if (ship.credits < premium) return null;
  ship.credits -= premium;
  return insure(playerKey(hullId), tierId, value, 0);
}
