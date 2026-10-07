import { el, section, row, note, button } from '../kit.js';
import { ariaMind, setOrders, personMemory, explanationPacket, calibReport } from '../../aria/mind.js';
import { footprint, footprintReport, footprintLine } from '../../aria/footprint.js';
import { saveAria } from '../../aria/aria.js';

export function mountCore(root) {
  const live = section('ARIA CORE');
  const sight = section('WHAT SHE SEES');
  const wake = section('HER WAKE');
  let shown = null;
  const pct = (v) => `${Math.round(v * 100)}%`;
  const draw = (force = false) => {
    const d0 = ariaMind.decision;
    const sc = ariaMind.scene, raw = footprint;
    const sig = `${d0?.at ?? ''}|${d0?.action ?? ''}|${ariaMind.goals.length}|${ariaMind.learned}|${ariaMind.experience.runs}|${ariaMind.pending.map(p => p.id).join(',')}|${sc?.line ?? ''}|${sc?.threat?.band ?? ''}|${sc?.alerts?.length ?? 0}|${ariaMind.shift?.at ?? ''}|${raw.totals.trades}|${raw.lines.confirmed}|${raw.lines.stalledConfirmed}|${raw.pending.length}|${raw.events.length}|${ariaMind.calib.n}`;
    if (!force && sig === shown) return;
    shown = sig;
    const fp = footprintReport();
    live.replaceChildren(el('h3', null, 'ARIA CORE'));
    const d = ariaMind.decision;
    for (const g of ariaMind.goals) row(live, g.level, { value: g.goal });
    row(live, 'Decision', { value: d?.action ?? 'Observing', hint: d?.why ?? 'Awaiting a planning cycle' });
    row(live, 'Confidence / risk', { value: d ? `${Math.round(d.confidence * 100)}% / ${Math.round(d.risk * 100)}%` : '—', hint: 'Confidence from observations, pulled toward her own record once she has finished jobs (Forecasts kept, below)' });
    row(live, 'Plan', { value: d?.steps.join(' → ') || 'No active plan' });
    for (const a of d?.alternatives ?? []) row(live, a.action, { value: a.score != null ? `${Math.round(a.score)} score` : `${Math.round((a.lean ?? 0) * 100)}% contextual share`, hint: `${a.samples ?? 0} comparable captain observations` });
    row(live, 'Learning', { value: `${ariaMind.learned} settled observations · ${ariaMind.experience.runs} career outcomes` });
    for (const p of ariaMind.pending) row(live, 'Withheld', { value: p.action, hint: p.why });
    const cal = calibReport();
    row(live, 'Forecasts kept', { value: cal.n ? `${pct(cal.hit)} of ${cal.n} jobs` : 'No finished jobs yet', hint: cal.n ? `Jobs ran ${cal.slower >= 1 ? pct(cal.slower - 1) + ' longer' : pct(1 - cal.slower) + ' shorter'} than she expected. Confidence above is pulled toward this record.` : 'Each job carries a forecast that is scored when it ends' });
    for (const b of cal.bins) if (b.n >= 3) row(live, `Said ${b.said}`, { value: `came off ${pct(b.came)}`, hint: `${b.n} jobs` });

    sight.replaceChildren(el('h3', null, 'WHAT SHE SEES'));
    if (!sc) row(sight, 'Scene', { value: 'Not looking', hint: 'She looks when she has the conn' });
    else {
      row(sight, 'Scene', { value: sc.line });
      const t = sc.threat;
      row(sight, 'Threat', { value: t.n ? `${t.band} · ${pct(t.level)}` : 'clear', hint: t.n ? `${t.n} hostile, nearest ${t.nearest?.toLocaleString() ?? '—'} u${t.closing > 20 ? `, closing ${t.closing} u/s` : ''}${t.eta != null && t.eta < 180 ? `, ${t.eta} s out` : ''}${t.worst ? ` · worst: ${t.worst}` : ''}` : 'Graded by range, closing speed and their hull against her guns, hull and battery' });
      for (const a of sc.alerts) row(sight, 'Changed', { value: a.line, hint: `at ${a.at} s — she re-plans and trusts older results less` });
      if (ariaMind.shift) row(sight, 'Last shift', { value: ariaMind.shift.why || 'the sky moved', hint: ariaMind.shift.moves ? `${ariaMind.shift.moves} kinds of work marked down until re-flown` : 'noted' });
    }

    wake.replaceChildren(el('h3', null, 'HER WAKE'));
    row(wake, 'Summary', { value: footprintLine() });
    if (fp.totals.trades) row(wake, 'Own price moves', { value: `${fp.totals.slipLost.toLocaleString()} cr given up`, hint: `${fp.totals.sold.toLocaleString()} units sold for ${fp.totals.earned.toLocaleString()} cr · ${fp.totals.bought.toLocaleString()} bought for ${fp.totals.spent.toLocaleString()} cr` });
    if (fp.lines.forecast || fp.lines.stalledForecast) row(wake, 'Station lines', { value: `${fp.lines.confirmed} started · ${fp.lines.stalledConfirmed} stopped`, hint: `${fp.lines.forecast} forecast to start, ${fp.lines.missed} did not, ${fp.lines.waiting} still to check` });
    for (const p of fp.ports.slice(0, 4)) row(wake, p.name, { value: p.top ? `${p.top.dir} ${Math.round(p.top.qty).toLocaleString()} ${p.top.name}` : `${p.trades} trades`, hint: `${p.top ? `price ${p.top.m1 < p.top.m0 ? 'down' : 'up'} ${Math.abs(Math.round((p.top.m1 / p.top.m0 - 1) * 100))}% · ` : ''}${p.relieved ? `${p.relieved} wanted lots · ` : ''}${p.glutted ? `${p.glutted} flooded · ` : ''}${p.starved ? `${p.starved} left short` : ''}`.replace(/ · $/, '') });
    for (const c of fp.corps.slice(0, 3)) row(wake, c.name, { value: `standing ${c.delta >= 0 ? '+' : ''}${c.delta}`, hint: `now ${c.now}` });
    for (const e of fp.events.slice(0, 4)) row(wake, `${e.at} s`, { value: e.text });
  };
  draw(); root.append(live, sight, wake);
  const orders = section('CAPTAIN STANDING ORDERS');
  for (const [key, label, min, max, step] of [['reserve', 'Credit reserve', 0, 1e9, 1000], ['maxPurchase', 'Maximum autonomous purchase', 0, 1e9, 1000], ['repairBelow', 'Repair below hull fraction', 0.1, 0.95, 0.05]]) {
    const r = row(orders, label); const input = el('input'); input.type = 'number'; input.min = min; input.max = max; input.step = step; input.value = ariaMind.orders[key]; input.setAttribute('aria-label', label);
    input.addEventListener('change', () => { setOrders({ [key]: Number(input.value) }); input.value = ariaMind.orders[key]; saveAria(); }); r.value.append(input);
  }
  const mode = el('select'); mode.setAttribute('aria-label', 'Decision mode');
  for (const id of ['imitate', 'optimize', 'balanced', 'directive']) { const o = el('option', null, id); o.value = id; mode.append(o); }
  mode.value = ariaMind.orders.mode; mode.addEventListener('change', () => { setOrders({ mode: mode.value }); saveAria(); }); row(orders, 'Decision mode').value.append(mode);
  { const r = row(orders, 'Steward weight'); const input = el('input'); input.type = 'number'; input.min = 0; input.max = 1; input.step = 0.05; input.value = ariaMind.orders.steward; input.setAttribute('aria-label', 'Steward weight');
    input.addEventListener('change', () => { setOrders({ steward: Number(input.value) }); input.value = ariaMind.orders.steward; saveAria(); }); r.value.append(input); }
  const avoid = el('input'); avoid.type = 'checkbox'; avoid.checked = ariaMind.orders.avoidHostiles; avoid.setAttribute('aria-label', 'Avoid hostiles'); avoid.addEventListener('change', () => { setOrders({ avoidHostiles: avoid.checked }); saveAria(); }); row(orders, 'Avoid hostiles').value.append(avoid);
  note(orders, 'The reserve guards investments: refits, a charter, settling crew. Repairs are never held back; cargo and hiring keep 800 cr aboard. Avoid hostiles breaks work off for the yard once the hull is under the repair line with contacts close — it does not leave a belt just because drones are about.');
  note(orders, 'Steward weight (0 to 1) is how much she weighs the port against the purse: above 0 she leans toward the buyer that is short of the cargo, away from one it would flood, and toward runs that restart a stalled line. At 0 she sells for the best price and nothing else.');
  note(orders, 'Every authority starts granted. Untick one to withhold it; spending is checked again at execution.');
  for (const key of Object.keys(ariaMind.authority)) {
    const c = el('input'); c.type = 'checkbox'; c.checked = ariaMind.authority[key]; c.setAttribute('aria-label', `${key} authority`);
    c.addEventListener('change', () => { ariaMind.authority[key] = c.checked; ariaMind.pending = ariaMind.pending.filter(p => (p.domain ?? p.action) !== key); saveAria(); }); row(orders, key).value.append(c);
  }
  row(orders, 'Requests').value.append(button('CLEAR NOTICES', () => { ariaMind.pending = []; draw(true); })); root.append(orders);
  const memories = section('EPISODIC MEMORY');
  for (const e of ariaMind.episodes.slice(-12).reverse()) row(memories, `${Math.round(e.at)} · ${e.kind}`, { value: e.summary, hint: e.actors.map(id => personMemory(id).person?.name ?? id).join(' · ') });
  note(memories, 'People are referenced by ID in CRADLE/GDB. Tape deltas describe what happened after an action; overlapping observations do not establish causation.'); root.append(memories);
  const llm = section('CONVERSATION');
  note(llm, 'Optional local or remote dialogue can explain this bounded packet. No model runs on the Sol host, and no commands are accepted from model output.');
  const output = el('pre'); output.style.whiteSpace = 'pre-wrap'; row(llm, 'Summary').value.append(button('SHOW EXPLANATION PACKET', () => { output.textContent = JSON.stringify(explanationPacket(), null, 2); })); llm.append(output); root.append(llm);
  return { draw, live };
}
