// Living Galaxy — companies.
//
// The executive start. Every other career hands you a hull and a person who will give
// you work; this one hands you a charter, a treasury that is not your wallet, and a
// board of three who will read the numbers whether you send them or not.
//
// The design rule is that a company is a **second balance sheet with an opinion**, not a
// second inventory. It holds capital, it takes a cut of what happens inside its charter,
// it funds things the pilot's own credits could not, and it judges you on a metric you
// can see. Nothing about it is a menu of buildings — the ground already has one of those
// in systems/planetary.js, and a company is the thing that pays for it.
//
// Why it matters mechanically: a company is the employer the experimental site managers
// (systems/managers.js) report to. Without one they are a clever automation toy; with one
// they are staff, with a budget, answerable to a charter.

import { S } from '../core/state.js';
import { COMPANY, MANAGERS } from '../core/config.js';
import { BRANCH_KEYS } from '../data/planetary/branches/index.js';
import { fmtCr } from '../core/utils.js';
import { toast, status } from '../ui/toast.js';

export const company = () => S.company;
export const hasCompany = () => !!(S.company && S.company.founded);

// Board seats. Three of them, deliberately in tension: one wants growth, one wants the
// balance sheet intact, one wants the charter honoured. You cannot satisfy all three,
// which is the only reason having a board is interesting.
const BOARD = [
  { key: 'growth',   name: 'Vahn Iridis',      role: 'Expansion',  wants: 'assets',   line: 'Build. Idle capital is capital somebody else is using.' },
  { key: 'solvency', name: 'Auditor Peleg',    role: 'Solvency',   wants: 'treasury', line: 'I do not care what you built. I care what it cost to keep.' },
  { key: 'charter',  name: 'Registrar Sowande', role: 'Charter',   wants: 'focus',    line: 'The charter is what the licence is for. Operate inside it.' }
];

const CHARTERS = {
  military:   { name: 'Security Charter',   desc: 'Escort, denial and ordnance. Paid by whoever is frightened.' },
  industrial: { name: 'Extraction Charter', desc: 'Rock, refining and fabrication. The front of every supply chain.' },
  logistic:   { name: 'Freight Charter',    desc: 'Routes, tonnage and schedules. Boring, and it never stops paying.' },
  economic:   { name: 'Trading Charter',    desc: 'Spreads, contracts and paper. You move the difference, not the cargo.' },
  civilian:   { name: 'Survey Charter',     desc: 'Charts, habitation and the long slow work of making a place liveable.' }
};

export const charters = () => BRANCH_KEYS.map(k => Object.assign({ key: k }, CHARTERS[k])).filter(c => c.name);

/**
 * Incorporate. Called once, from character creation, when the career carries a company
 * flag. Returns the company record.
 */
export function foundCompany(ch, opts = {}) {
  const charter = CHARTERS[opts.charter] ? opts.charter : 'economic';
  const name = (opts.name || suggestName(ch)).slice(0, 28);

  S.company = {
    founded: true,
    name,
    charter,
    treasury: COMPANY.startingTreasury,
    shares: COMPANY.startingShares,
    held: COMPANY.founderShares,
    retained: 0,
    // Running totals the board reads. Deliberately cumulative rather than per-period:
    // a founder should be judged on the whole record, not on a good fortnight.
    revenue: 0, spend: 0, dividends: 0,
    inCharter: 0, outCharter: 0,
    reportT: 0, reports: 0,
    confidence: 0.5,
    managers: 0
  };
  status(`${name} incorporated — ${CHARTERS[charter].name}`);
  toast(`${name} is registered. Treasury ${fmtCr(COMPANY.startingTreasury)}, ` +
        `you hold ${Math.round(COMPANY.founderShares / COMPANY.startingShares * 100)}% of it.`, 5600);
  return S.company;
}

function suggestName(ch) {
  const stem = (ch && ch.name ? ch.name.split(/\s+/)[0] : 'Vector').replace(/[^\w]/g, '');
  return `${stem || 'Vector'} Holdings`;
}

// ── the books ────────────────────────────────────────────────────────

/**
 * Book a transaction against the company rather than the pilot's wallet.
 * @param {number} amount positive is revenue, negative is spend
 * @param {string} [branch] which branch it happened in — decides the charter bonus
 */
export function book(amount, branch = null) {
  const co = S.company;
  if (!co || !co.founded || !(amount === amount)) return 0;
  let value = amount;
  if (branch) {
    if (branch === co.charter) { value *= (1 + COMPANY.charterBonus); co.inCharter++; }
    else co.outCharter++;
  }
  co.treasury += value;
  if (value > 0) { co.revenue += value; co.retained += value; }
  else co.spend += -value;
  return value;
}

/** Can the company fund this, and if so, does it? */
export function fund(amount, branch = null) {
  const co = S.company;
  if (!co || !co.founded || co.treasury < amount) return false;
  book(-amount, branch);
  return true;
}

/** Move money between the pilot's wallet and the company's treasury. */
export function transfer(amount) {
  const co = S.company;
  if (!co || !co.founded || !amount) return false;
  if (amount > 0) {                    // wallet -> treasury
    if (S.credits < amount) { toast('Not enough credits to capitalise that'); return false; }
    S.credits -= amount; co.treasury += amount;
  } else {                             // treasury -> wallet, as a draw
    const take = -amount;
    if (co.treasury < take) { toast('The treasury cannot cover that draw'); return false; }
    co.treasury -= take; S.credits += take;
    co.spend += take;
  }
  return true;
}

// ── the board ────────────────────────────────────────────────────────

/**
 * Confidence, 0..1. Three pulls, one per seat, deliberately not weighted equally by
 * accident: solvency is the one that ends a company, so it counts double.
 */
export function confidence() {
  const co = S.company;
  if (!co) return 0;
  const solvency = clamp01(co.treasury / (COMPANY.startingTreasury * 1.4));
  const total = co.inCharter + co.outCharter;
  const focus = total > 0 ? co.inCharter / total : 0.6;
  const growth = clamp01((co.managers * 0.18) + clamp01(co.revenue / 60000) * 0.7);
  return clamp01((solvency * 2 + focus + growth) / 4);
}

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Advance the company clock. Called from the sim phase with real seconds. */
export function updateCompany(dt) {
  const co = S.company;
  if (!co || !co.founded || !(dt > 0)) return;
  co.managers = MANAGERS.enabled && S.managers ? Object.keys(S.managers).length : 0;
  co.reportT += dt;
  if (co.reportT < COMPANY.reportInterval) return;
  co.reportT = 0;
  co.reports++;
  co.confidence = confidence();

  // A dividend is paid out of retained profit, not out of the treasury floor — a company
  // that had a bad quarter simply does not pay one, which is the honest behaviour.
  let paid = 0;
  if (co.retained > 0) {
    paid = Math.round(co.retained * COMPANY.dividendRate);
    co.retained -= paid;
    co.treasury -= paid;
    const mine = Math.round(paid * (co.held / co.shares));
    S.credits += mine;
    co.dividends += paid;
    if (mine > 0) toast(`${co.name} — dividend declared, your share ${fmtCr(mine)}`, 4200);
  }

  const seat = BOARD[co.reports % BOARD.length];
  status(`${seat.name} (${seat.role}): ${seat.line}`);
}

// ── reporting ────────────────────────────────────────────────────────

export function companyReport() {
  const co = S.company;
  if (!co || !co.founded) return null;
  const total = co.inCharter + co.outCharter;
  return {
    name: co.name,
    charter: CHARTERS[co.charter].name,
    charterKey: co.charter,
    treasury: Math.round(co.treasury),
    ownership: co.held / co.shares,
    revenue: Math.round(co.revenue),
    spend: Math.round(co.spend),
    dividends: Math.round(co.dividends),
    focus: total > 0 ? co.inCharter / total : null,
    confidence: confidence(),
    managers: co.managers,
    board: BOARD.map(b => ({ name: b.name, role: b.role, line: b.line }))
  };
}

// ── persistence ──────────────────────────────────────────────────────

export const serializeCompany = () => (S.company && S.company.founded ? S.company : null);

export function restoreCompany(data) {
  if (!data || !data.founded || !CHARTERS[data.charter]) { S.company = null; return false; }
  S.company = Object.assign({
    treasury: 0, shares: COMPANY.startingShares, held: COMPANY.founderShares,
    retained: 0, revenue: 0, spend: 0, dividends: 0,
    inCharter: 0, outCharter: 0, reportT: 0, reports: 0, confidence: 0.5, managers: 0
  }, data);
  return true;
}
