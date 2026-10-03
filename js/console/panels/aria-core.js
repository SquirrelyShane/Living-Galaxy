import { el, section, row, note, button } from '../kit.js';
import { ariaMind, setOrders, personMemory, explanationPacket } from '../../aria/mind.js';
import { saveAria } from '../../aria/aria.js';

export function mountCore(root) {
  const live = section('ARIA CORE');
  let shown = null;
  const draw = (force = false) => {
    const d0 = ariaMind.decision;
    const sig = `${d0?.at ?? ''}|${d0?.action ?? ''}|${ariaMind.goals.length}|${ariaMind.learned}|${ariaMind.experience.runs}|${ariaMind.pending.map(p => p.id).join(',')}`;
    if (!force && sig === shown) return;
    shown = sig;
    live.replaceChildren(el('h3', null, 'ARIA CORE'));
    const d = ariaMind.decision;
    for (const g of ariaMind.goals) row(live, g.level, { value: g.goal });
    row(live, 'Decision', { value: d?.action ?? 'Observing', hint: d?.why ?? 'Awaiting a planning cycle' });
    row(live, 'Confidence / risk', { value: d ? `${Math.round(d.confidence * 100)}% / ${Math.round(d.risk * 100)}%` : '—', hint: 'Heuristic confidence from observations; not a calibrated success probability' });
    row(live, 'Plan', { value: d?.steps.join(' → ') || 'No active plan' });
    for (const a of d?.alternatives ?? []) row(live, a.action, { value: a.score != null ? `${Math.round(a.score)} score` : `${Math.round((a.lean ?? 0) * 100)}% contextual share`, hint: `${a.samples ?? 0} comparable captain observations` });
    row(live, 'Learning', { value: `${ariaMind.learned} settled observations · ${ariaMind.experience.runs} career outcomes` });
    for (const p of ariaMind.pending) row(live, 'Withheld', { value: p.action, hint: p.why });
  };
  draw(); root.append(live);
  const orders = section('CAPTAIN STANDING ORDERS');
  for (const [key, label, min, max, step] of [['reserve', 'Credit reserve', 0, 1e9, 1000], ['maxPurchase', 'Maximum autonomous purchase', 0, 1e9, 1000], ['repairBelow', 'Repair below hull fraction', 0.1, 0.95, 0.05]]) {
    const r = row(orders, label); const input = el('input'); input.type = 'number'; input.min = min; input.max = max; input.step = step; input.value = ariaMind.orders[key]; input.setAttribute('aria-label', label);
    input.addEventListener('change', () => { setOrders({ [key]: Number(input.value) }); input.value = ariaMind.orders[key]; saveAria(); }); r.value.append(input);
  }
  const mode = el('select'); mode.setAttribute('aria-label', 'Decision mode');
  for (const id of ['imitate', 'optimize', 'balanced', 'directive']) { const o = el('option', null, id); o.value = id; mode.append(o); }
  mode.value = ariaMind.orders.mode; mode.addEventListener('change', () => { setOrders({ mode: mode.value }); saveAria(); }); row(orders, 'Decision mode').value.append(mode);
  const avoid = el('input'); avoid.type = 'checkbox'; avoid.checked = ariaMind.orders.avoidHostiles; avoid.setAttribute('aria-label', 'Avoid hostiles'); avoid.addEventListener('change', () => { setOrders({ avoidHostiles: avoid.checked }); saveAria(); }); row(orders, 'Avoid hostiles').value.append(avoid);
  note(orders, 'The reserve guards investments: refits, a charter, settling crew. Repairs are never held back; cargo and hiring keep 800 cr aboard. Avoid hostiles breaks work off for the yard once the hull is under the repair line with contacts close — it does not leave a belt just because drones are about.');
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
