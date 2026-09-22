/* LIVING GALAXY — console DOM kit.
 *
 * The old terminal's builders (el, section, note, row, button, group, slider,
 * pct, setBar, fmtDist, fmtTime, clockOf) plus two in the same style:
 * chips(list, { value, onPick }) and card(title, hint). Every panel under
 * js/console builds its DOM from these and nothing else.
 *
 * No DOM access at import time: `document` is only touched inside builders.
 */

const DOC = globalThis.document ?? null;

/* ---- formatting --------------------------------------------------------- */

export function fmtDist(d) {
  if (!isFinite(d)) return "—";
  const a = Math.abs(d);
  if (a < 1000) return `${Math.round(d)} u`;
  if (a < 100000) return `${(d / 100).toFixed(1)} km`;
  return `${Math.round(d / 100).toLocaleString()} km`;
}

export function fmtTime(sec) {
  if (!isFinite(sec) || sec <= 0) return "—";
  if (sec > 5940) return "> 1 h";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m ? `${m}m ${s}s` : `${s}s`;
}

export function clockOf(t) {
  const m = Math.floor(t / 60) % 100;
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ---- tiny DOM builders -------------------------------------------------- */

export function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

export function section(title) {
  const s = el("section", "term-sec");
  if (title) s.append(el("h3", null, title));
  return s;
}

export function note(parent, text) {
  parent.append(el("p", null, text));
}

/** label + right-aligned value, optional sub-hint and a bar under the label */
export function row(parent, label, opts = {}) {
  const r = el("div", "trow");
  const k = el("div", "k");
  k.append(document.createTextNode(label));
  if (opts.hint) k.append(el("small", null, opts.hint));
  let bar = null;
  if (opts.bar) {
    const b = el("div", "tbar");
    bar = el("b");
    b.append(bar);
    k.append(b);
  }
  const v = el("div", "v", opts.value ?? "");
  r.append(k, v);
  parent.append(r);
  return { row: r, value: v, bar, key: k };
}

export function button(label, onClick, cls = "") {
  const b = el("button", `tbtn ${cls}`.trim(), label);
  b.type = "button";
  b.addEventListener("click", onClick);
  return b;
}

export function group(...kids) {
  const g = el("div", "tgroup");
  g.append(...kids);
  return g;
}

/** label + range input, wired straight to a getter/setter pair */
export function slider(parent, spec, get, set, fmt) {
  const wrap = el("div", "tslider");
  const lab = el("div", "lab");
  const name = el("span", null, spec.label);
  const val = el("b");
  lab.append(name, val);
  const input = document.createElement("input");
  input.type = "range";
  input.min = String(spec.min);
  input.max = String(spec.max);
  input.step = String(spec.step);
  input.value = String(get());
  const show = () => {
    val.textContent = fmt ? fmt(Number(input.value)) : `${Number(input.value).toFixed(2)}${spec.unit ?? ""}`;
  };
  input.addEventListener("input", () => {
    set(Number(input.value));
    show();
  });
  /* Track the actual drag rather than focus: a slider you tapped and let go of
   * still has focus, and must follow a reset or an external change. */
  let dragging = false;
  input.addEventListener("pointerdown", () => {
    dragging = true;
  });
  const release = () => {
    dragging = false;
  };
  input.addEventListener("pointerup", release);
  input.addEventListener("pointercancel", release);
  input.addEventListener("blur", release);
  input.addEventListener("lostpointercapture", release);
  show();
  wrap.append(lab, input);
  if (spec.hint) wrap.append(el("small", null, spec.hint));
  parent.append(wrap);
  return () => {
    if (dragging) return;
    const v = get();
    if (Math.abs(Number(input.value) - v) > 1e-6) {
      input.value = String(v);
      show();
    }
  };
}

export function pct(x) {
  return `${Math.round(Math.max(0, Math.min(1, x)) * 100)}%`;
}

export function setBar(bar, frac, tone) {
  if (!bar) return;
  bar.style.width = pct(frac);
  const holder = bar.parentElement;
  holder.classList.toggle("hot", tone === "hot");
  holder.classList.toggle("ok", tone === "ok");
  holder.classList.toggle("warn", tone === "warn");
}

/* ---- console additions -------------------------------------------------- */

/** A row of pick-one chips. `list` is [{ id, label, cls?, hint? }] or plain
 * strings; `value` marks the current one; `onPick(id)` fires on tap. Returns
 * { row, set(id) } so a refresher can move the highlight without rebuilding. */
export function chips(list, { value = null, onPick = null } = {}) {
  const r = el("div", "tchips");
  const items = list.map((it) => (typeof it === "string" ? { id: it, label: it } : it));
  const btns = new Map();
  let current = value;
  const set = (id) => {
    current = id;
    for (const [k, b] of btns) b.classList.toggle("on", k === id);
  };
  for (const it of items) {
    const b = el("button", `tchip ${it.cls ?? ""}`.trim(), it.label ?? it.id);
    b.type = "button";
    b.dataset.id = String(it.id);
    if (it.hint) b.title = it.hint;
    b.addEventListener("click", () => {
      set(it.id);
      onPick?.(it.id);
    });
    btns.set(it.id, b);
    r.append(b);
  }
  set(current);
  return { row: r, set, get: () => current };
}

/** A titled card with an optional hint line; append rows/groups to `.body`. */
export function card(title, hint) {
  const c = el("div", "tcard");
  const head = el("div", "head");
  if (title != null) head.append(el("b", null, title));
  if (hint) head.append(el("small", null, hint));
  const body = el("div", "body");
  c.append(head, body);
  return { card: c, head, body };
}

export const kit = { DOC, el, section, note, row, button, group, slider, pct, setBar, fmtDist, fmtTime, clockOf, chips, card };
