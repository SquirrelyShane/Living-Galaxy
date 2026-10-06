const labels = new WeakMap();
const markers = new WeakMap();

function reconcile(box, list, cache, identity, create, update) {
  let entries = cache.get(box);
  if (!entries) { entries = new Map(); cache.set(box, entries); }
  const seen = new Set(), occurrences = new Map();
  let cursor = box.firstChild;
  for (const item of list) {
    const id = identity(item);
    const ordinal = occurrences.get(id) ?? 0;
    occurrences.set(id, ordinal + 1);
    const key = JSON.stringify([id, ordinal]);
    let entry = entries.get(key);
    if (!entry) { entry = create(box.ownerDocument); entries.set(key, entry); }
    update(entry, item);
    seen.add(key);
    if (entry.node === cursor) cursor = cursor.nextSibling;
    else box.insertBefore(entry.node, cursor);
  }
  for (const [key, entry] of entries) {
    if (!seen.has(key)) { entry.node.remove(); entries.delete(key); }
  }
}

function position(node, x, y) {
  const left = `${Number(x)}%`, top = `${Number(y)}%`;
  if (node.style.left !== left) node.style.left = left;
  if (node.style.top !== top) node.style.top = top;
}

export function paintLabels(box, list) {
  reconcile(box, list, labels, l => String(l.id), doc => {
    const node = doc.createElement('span'), text = doc.createTextNode('');
    node.append(text);
    return { node, text, tag: null };
  }, (entry, l) => {
    const { node, text } = entry;
    const kind = String(l.kind ?? '');
    if (node.className !== kind) node.className = kind;
    position(node, l.x, l.y);
    if (Number.isFinite(l.a)) {
      const angle = `${Number(l.a).toFixed(1)}deg`;
      if (node.style.getPropertyValue('--a') !== angle) node.style.setProperty('--a', angle);
    } else if (node.style.getPropertyValue('--a')) node.style.removeProperty('--a');
    const name = String(l.name ?? '');
    if (text.nodeValue !== name) text.nodeValue = name;
    if (l.tag) {
      if (!entry.tag) { entry.tag = node.ownerDocument.createElement('i'); node.insertBefore(entry.tag, text); }
      const tag = String(l.tag), cls = `tag t${tag}`, caption = `[${tag}]`;
      if (entry.tag.className !== cls) entry.tag.className = cls;
      if (entry.tag.textContent !== caption) entry.tag.textContent = caption;
    } else if (entry.tag) { entry.tag.remove(); entry.tag = null; }
  });
}

export function paintMarkerNodes(box, list, definitions) {
  reconcile(box, list, markers, m => String(m.kind), doc => {
    const node = doc.createElement('span'), text = doc.createTextNode('');
    node.append(text);
    return { node, text, caption: null };
  }, (entry, m) => {
    const { node, text } = entry;
    const kind = String(m.kind ?? '');
    if (node.className !== kind) node.className = kind;
    position(node, m.x, m.y);
    const d = definitions[m.kind] ?? { glyph: '', label: '' };
    const cap = m.kind === 'lock' && m.pct != null ? `${Math.round(m.pct * 100)}%` : d.label;
    if (text.nodeValue !== d.glyph) text.nodeValue = d.glyph;
    if (cap) {
      if (!entry.caption) { entry.caption = node.ownerDocument.createElement('b'); node.append(entry.caption); }
      if (entry.caption.textContent !== cap) entry.caption.textContent = cap;
    } else if (entry.caption) { entry.caption.remove(); entry.caption = null; }
  });
}
