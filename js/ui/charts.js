/* LIVING GALAXY — passive charts.
 *
 * Small inline SVG, no library: a sparkline for anything that moves over
 * time, a pentagon radar for the five temperament axes, a ring for a single
 * fraction. They are readouts, not controls — they never take pointer events
 * and they redraw in place when given new values.
 */

const NS = "http://www.w3.org/2000/svg";

function svg(tag, attrs = {}) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

/**
 * Sparkline. `values` newest last.
 * @param host element; @param spec { w, h, min, max, tone, fill, label, format }
 * Returns { update(values) }.
 */
export function sparkline(host, values = [], spec = {}) {
  const w = spec.w ?? 120, h = spec.h ?? 28;
  host.classList.add("spark");
  if (spec.tone) host.dataset.tone = spec.tone;
  host.innerHTML = "";
  const root = svg("svg", { viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: "none", class: "spark-svg" });
  const area = svg("path", { class: "spark-area" });
  const line = svg("polyline", { class: "spark-line", fill: "none" });
  const dot = svg("circle", { class: "spark-dot", r: 1.6 });
  root.append(area, line, dot);
  const cap = document.createElement("div");
  cap.className = "spark-cap";
  const lab = document.createElement("span");
  lab.textContent = spec.label ?? "";
  const cur = document.createElement("b");
  cap.append(lab, cur);
  host.append(root, cap);
  const fmt = spec.format ?? ((v) => (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString() : (+v.toFixed(1)).toString()));

  function update(vals) {
    const v = (vals ?? []).filter(Number.isFinite);
    if (v.length < 2) { line.setAttribute("points", ""); area.setAttribute("d", ""); cur.textContent = v.length ? fmt(v[0]) : "—"; return; }
    const lo = spec.min ?? Math.min(...v), hi = spec.max ?? Math.max(...v);
    const span = hi - lo || 1;
    const pts = v.map((y, i) => [(i / (v.length - 1)) * w, h - 2 - ((y - lo) / span) * (h - 4)]);
    line.setAttribute("points", pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" "));
    area.setAttribute("d", `M0,${h} ` + pts.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + ` L${w},${h} Z`);
    const last = pts[pts.length - 1];
    dot.setAttribute("cx", last[0]); dot.setAttribute("cy", last[1]);
    cur.textContent = fmt(v[v.length - 1]);
    const trend = v[v.length - 1] - v[0];
    host.dataset.trend = trend > 0 ? "up" : trend < 0 ? "down" : "flat";
  }
  update(values);
  return { update, el: host };
}

/**
 * Pentagon radar. `axes`: [{ label, value 0..1 }] (any count ≥ 3).
 */
export function radar(host, axes = [], spec = {}) {
  const size = spec.size ?? 84;
  const c = size / 2, R = c - 10;
  host.classList.add("radar");
  if (spec.tone) host.dataset.tone = spec.tone;
  host.innerHTML = "";
  const root = svg("svg", { viewBox: `0 0 ${size} ${size}`, class: "radar-svg" });
  const n = Math.max(3, axes.length);
  const pt = (i, r) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [c + Math.cos(a) * r, c + Math.sin(a) * r];
  };
  for (const f of [0.33, 0.66, 1]) {
    root.append(svg("polygon", { class: "radar-grid", points: Array.from({ length: n }, (_, i) => pt(i, R * f).join(",")).join(" ") }));
  }
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(i, R);
    root.append(svg("line", { class: "radar-spoke", x1: c, y1: c, x2: x, y2: y }));
  }
  const shape = svg("polygon", { class: "radar-shape" });
  root.append(shape);
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(i, R + 7);
    const t = svg("text", { class: "radar-label", x, y, "text-anchor": "middle", "dominant-baseline": "middle" });
    t.textContent = (axes[i]?.label ?? "").slice(0, 3).toUpperCase();
    root.append(t);
  }
  host.append(root);
  function update(ax) {
    shape.setAttribute("points", Array.from({ length: n }, (_, i) => pt(i, R * Math.max(0.04, Math.min(1, ax[i]?.value ?? 0))).join(",")).join(" "));
  }
  update(axes);
  return { update, el: host };
}

/** Ring gauge: a fraction with a label inside. */
export function ring(host, value = 0, spec = {}) {
  const size = spec.size ?? 44, sw = spec.stroke ?? 3;
  const r = (size - sw) / 2, C = 2 * Math.PI * r;
  host.classList.add("ring");
  if (spec.tone) host.dataset.tone = spec.tone;
  host.innerHTML = "";
  const root = svg("svg", { viewBox: `0 0 ${size} ${size}`, class: "ring-svg" });
  root.append(svg("circle", { class: "ring-track", cx: size / 2, cy: size / 2, r, "stroke-width": sw, fill: "none" }));
  const arc = svg("circle", { class: "ring-arc", cx: size / 2, cy: size / 2, r, "stroke-width": sw, fill: "none", "stroke-dasharray": C, transform: `rotate(-90 ${size / 2} ${size / 2})` });
  root.append(arc);
  const t = svg("text", { class: "ring-text", x: size / 2, y: size / 2, "text-anchor": "middle", "dominant-baseline": "central" });
  root.append(t);
  host.append(root);
  const fmt = spec.format ?? ((v) => `${Math.round(v * 100)}`);
  function update(v) {
    const f = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
    arc.setAttribute("stroke-dashoffset", C * (1 - f));
    t.textContent = fmt(f);
    /* only gauges that are bad when empty (hull, charge) go red at the bottom */
    if (spec.warnLow) host.dataset.level = f < 0.25 ? "low" : f < 0.6 ? "mid" : "high";
  }
  update(value);
  return { update, el: host };
}

/** Five temperament axes from a CRADLE record, in radar form. */
export function traitAxes(rec) {
  const t = rec?.traits ?? {};
  return [
    { label: "grit", value: t.grit ?? 0.5 },
    { label: "caution", value: t.caution ?? 0.5 },
    { label: "greed", value: t.greed ?? 0.5 },
    { label: "loyalty", value: t.loyalty ?? 0.5 },
    { label: "curiosity", value: t.curiosity ?? 0.5 },
  ];
}
