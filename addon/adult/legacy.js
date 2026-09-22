/** Family history and non-graphic family dialogue. No dependencies on scene/voice banks. */
export const LEGACY_VERSION = 1;
const clone = value => JSON.parse(JSON.stringify(value));
const hash = value => { let h = 2166136261; for (const c of String(value)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const list = value => Array.isArray(value) ? value : [];
const label = value => String(value ?? '').trim();
const knownStatuses = new Set(['verified', 'testimony', 'rumor']);
const exposure = { public: 0, personal: 1, private: 2 };

/** Explicit registry: people, families, corporations, ties, memories, events. */
export function createRegistry(input = {}) {
  const db = clone({ version: LEGACY_VERSION, people: [], families: [], corporations: [], ties: [], memories: {}, events: [], ...input });
  for (const key of ['people', 'families', 'corporations', 'ties', 'events']) if (!Array.isArray(db[key])) throw new Error(`${key} must be an array`);
  if (!db.memories || typeof db.memories !== 'object' || Array.isArray(db.memories)) throw new Error('memories must be an object');
  const indexes = {};
  for (const key of ['people', 'families', 'corporations', 'ties']) {
    indexes[key] = new Map();
    for (const row of db[key]) {
      if (!label(row.id) || indexes[key].has(row.id)) throw new Error(`Missing or duplicate ${key} id: ${row.id}`);
      indexes[key].set(row.id, row);
    }
  }
  const exists = (key, id) => indexes[key].has(id);
  for (const p of db.people) {
    if (p.familyId && !exists('families', p.familyId)) throw new Error(`Unknown family: ${p.familyId}`);
    for (const edge of list(p.parents)) {
      if (!exists('people', edge.id)) throw new Error(`Unknown parent: ${edge.id}`);
      if (!['biological', 'adoptive', 'guardian'].includes(edge.kind)) throw new Error('Parent kind must be biological, adoptive, or guardian');
    }
  }
  for (const f of db.families) if (f.founderId && !exists('people', f.founderId)) throw new Error(`Unknown founder: ${f.founderId}`);
  for (const tie of db.ties) {
    if (!exists('people', tie.personId) || !exists('corporations', tie.corporationId)) throw new Error(`Unresolved corporate tie: ${tie.id}`);
    if (!['employment', 'ownership', 'founder'].includes(tie.kind)) throw new Error(`Unknown tie kind: ${tie.kind}`);
    if (tie.share != null && (!Number.isFinite(tie.share) || tie.share < 0 || tie.share > 100)) throw new Error('Ownership share must be 0–100');
    if (tie.startYear != null && tie.endYear != null && tie.startYear > tie.endYear) throw new Error(`Reversed dates: ${tie.id}`);
  }
  // Reject ancestry loops once at load, including adoptive/guardian links.
  const active = new Set(), done = new Set();
  function check(id) {
    if (active.has(id)) throw new Error(`Ancestry cycle: ${id}`);
    if (done.has(id)) return;
    active.add(id);
    for (const edge of list(indexes.people.get(id)?.parents)) check(edge.id);
    active.delete(id); done.add(id);
  }
  for (const p of db.people) check(p.id);
  return db;
}
const person = (db, id) => db.people.find(p => p.id === id);
const family = (db, p) => db.families.find(f => f.id === p?.familyId);
const corp = (db, id) => db.corporations.find(c => c.id === id);

/** Knowledge is speaker-specific. Unknown facts are never silently invented. */
export function knows(record, speakerId, level = 0) {
  if (!record) return false;
  if (record.knownTo && !record.knownTo.includes(speakerId)) return false;
  return (exposure[record.visibility ?? 'public'] ?? 2) <= level;
}
export function provenance(record) {
  const status = knownStatuses.has(record?.status) ? record.status : 'testimony';
  const prefix = { verified: 'The surviving record says', testimony: 'The story I was told is', rumor: 'There is a rumor, not proof, that' }[status];
  return `${prefix}${record?.source ? ` (${record.source})` : ''}`;
}
export function ancestors(db, id, { depth = 12, kind } = {}) {
  const result = [], seen = new Set([id]), queue = [{ id, generation: 0 }];
  while (queue.length) {
    const current = queue.shift();
    if (current.generation >= depth) continue;
    for (const edge of list(person(db, current.id)?.parents)) {
      if (kind && edge.kind !== kind) continue;
      if (seen.has(edge.id)) continue;
      seen.add(edge.id);
      const p = person(db, edge.id);
      if (!p) continue;
      const row = { person: p, generation: current.generation + 1, kind: edge.kind };
      result.push(row); queue.push({ id: p.id, generation: row.generation });
    }
  }
  return result;
}
export function corporateConnections(db, aId, bId, { speakerId = aId, level = 0 } = {}) {
  const branch = id => new Set([id, ...ancestors(db, id).map(x => x.person.id)]);
  const a = branch(aId), b = branch(bId), result = [];
  for (const c of db.corporations) {
    const ties = db.ties.filter(t => t.corporationId === c.id && knows(t, speakerId, level));
    const left = ties.filter(t => a.has(t.personId)), right = ties.filter(t => b.has(t.personId));
    if (left.length && right.length) result.push({ corporation: c, left, right });
  }
  return result;
}
const era = tie => tie.startYear == null ? 'dates unrecorded' : `${tie.startYear}–${tie.endYear ?? 'present'}`;
export function describeTie(db, tie) {
  const who = person(db, tie.personId)?.name ?? 'An unrecorded relative';
  const company = corp(db, tie.corporationId)?.name ?? 'an unrecorded corporation';
  const role = tie.kind === 'employment' ? `worked for ${company}${tie.role ? ` as ${tie.role}` : ''}`
    : tie.kind === 'founder' ? `helped found ${company}`
    : `held ${tie.share == null ? 'an unspecified stake' : `${tie.share}%`} in ${company}`;
  return `${provenance(tie)} ${who} ${role} (${era(tie)}).${tie.note ? ` ${tie.note}` : ''}`;
}

/** Stable suggestions use authored cultural name pools; no inferred gender or ancestry. */
export function nameSuggestions(db, { familyIds = [], seed = 'child', count = 6, usedNames = [], speakerId, level = 0 } = {}) {
  const families = familyIds.map(id => db.families.find(f => f.id === id)).filter(Boolean);
  const pool = [], used = new Set(usedNames.map(n => n.toLocaleLowerCase()));
  for (const f of families) {
    for (const entry of list(f.names)) {
      const n = typeof entry === 'string' ? { name: entry, reason: `A name kept in the ${f.name} family register.` } : entry;
      if (knows(n, speakerId, level) && label(n.name)) pool.push({ name: n.name, reason: n.reason || `From the ${f.name} register.`, familyId: f.id });
    }
    const founder = person(db, f.founderId);
    if (knows(f.founding, speakerId, level) && founder && knows(founder, speakerId, level)) {
      pool.push({ name: founder.givenName || founder.name.split(' ')[0], reason: `Honors ${founder.name}, the recorded founder of ${f.name}.`, familyId: f.id });
    }
  }
  const seen = new Set();
  return pool.sort((a, b) => hash(`${seed}:${a.familyId}:${a.name}`) - hash(`${seed}:${b.familyId}:${b.name}`))
    .filter(n => { const key = n.name.toLocaleLowerCase(); if (used.has(key) || seen.has(key)) return false; seen.add(key); return true; })
    .slice(0, Math.max(0, Math.min(30, count)));
}
function memory(db, speakerId, listenerId) {
  const key = JSON.stringify([speakerId, listenerId]);
  return db.memories[key] ??= { visits: {}, heard: [], preferences: {}, last: {} };
}

/** Host-style topics: {id,label,tier,cooldown,say}; nodes: {text,choices}. */
export function legacyTopics(db, speakerId, options = {}) {
  const speaker = person(db, speakerId);
  if (!speaker) return [];
  const listenerId = options.listenerId ?? 'player';
  const listener = person(db, listenerId);
  const mem = memory(db, speakerId, listenerId);
  const level = () => Number(typeof options.disclosure === 'function' ? options.disclosure() : options.disclosure ?? 0);
  const visible = record => knows(record, speakerId, level());
  const save = () => options.onChange?.(db);
  const planningChoices = new Set(['legacy.readiness', 'legacy.paths', 'legacy.parenting', 'legacy.wait', 'legacy.consider', 'legacy.care', 'legacy.identity']);
  const choice = (id, label, next) => ({ id, label, say: () => {
    if (planningChoices.has(id) && !planningAllowed()) return future();
    return next();
  } });
  const end = () => ({ text: `${speaker.name}: “We can leave it there for now.”`, choices: [] });
  const back = () => choice('legacy.back', 'Ask something else about the family', overview);
  function node(key, lines, choices = [], factIds = []) {
    const visit = mem.visits[key] ?? 0;
    const text = lines[(hash(`${speakerId}:${key}`) + visit) % lines.length];
    mem.visits[key] = visit + 1;
    for (const id of factIds) if (!mem.heard.includes(id)) mem.heard.push(id);
    mem.last.node = key;
    save();
    return { text: `${speaker.name}: “${text}”`, choices: [...choices, choice('legacy.leave', 'Leave it for another time', end)] };
  }
  const f = () => family(db, speaker);
  function overview() {
    return node('overview', [
      'Do you want the family story we tell at gatherings, or the parts we argue about afterward?',
      'We have talked about where I come from. What stayed with you?',
      'A surname is a short word for a very long conversation. Where should we begin?'
    ], [choice('legacy.founder', 'Who founded your family?', founder), choice('legacy.generations', 'Who came between the founder and you?', generations),
      choice('legacy.names', 'Which names keep returning?', names), choice('legacy.corporations', 'Who did your family work for—or own?', corporations),
      choice('legacy.shared', 'Are our families connected?', shared), choice('legacy.burden', 'What do you want to carry forward?', burden),
      ...(planningAllowed() ? [choice('legacy.future', 'Could we build a family?', future)] : [])]);
  }
  function founder() {
    const fam = f(), founding = fam?.founding, p = person(db, fam?.founderId);
    if (!p || !visible(founding) || !visible(p)) return node('founder.unknown', [
      'I cannot give you a founder I can stand behind. A repeated name is not a record.',
      'That part of the family register is missing—or it is not mine to share yet.'
    ], [choice('legacy.archive', 'How could we find out?', archive), back()]);
    return node('founder', [`${provenance(founding)} ${p.name} established ${fam.name}${founding.year != null ? ` in ${founding.year}` : ''}. ${founding.story || 'The surviving entry has no account of why.'}`], [
      choice('legacy.cost', 'What did that beginning cost?', cost), choice('legacy.archive', 'What supports that account?', archive),
      choice('legacy.generations', 'Who carried it forward?', generations), back()
    ], [`founder:${fam.id}`]);
  }
  function cost() {
    const founding = f()?.founding;
    return node('founder.cost', [visible(founding) && founding.cost ? founding.cost : 'I do not know what it cost them. I would rather leave a gap than turn someone else’s pain into a legend.'], [choice('legacy.burden', 'Do you feel you owe them something?', burden), back()]);
  }
  function archive() {
    const evidence = list(f()?.archives).filter(visible);
    return node('archive', [evidence.length ? evidence.map(a => `${a.label}: ${a.location}. ${a.note || ''}`).join('\n') : 'No surviving archive location is recorded. We would need a lead before promising a search.'], [
      choice('legacy.compare', 'How do we separate a story from a fact?', () => node('evidence', ['Keep the source beside the claim. A corporate register can confirm a job; it cannot tell us whether someone was proud of it. And two relatives repeating a rumor is still a rumor.'], [back()])), back()
    ]);
  }
  function generations() {
    const rows = ancestors(db, speakerId).filter(x => visible(x.person));
    const choices = rows.map(row => choice(`legacy.ancestor.${row.person.id}`, `${row.person.name} · ${row.generation} generation${row.generation === 1 ? '' : 's'} back · ${row.kind}`, () => ancestor(row)));
    return node('generations', [rows.length ? 'These are the people whose places in the family are recorded. Care and kinship are not always the same as blood.' : 'My parent links have not been recorded. Sharing a surname does not fill that gap.'], [...choices, back()]);
  }
  function ancestor(row) {
    const p = row.person;
    if (!visible(p)) return node('ancestor.closed', ['I am not ready to share that history.'], [back()]);
    const stories = list(p.stories).filter(visible);
    const ties = db.ties.filter(t => t.personId === p.id && visible(t));
    return node(`ancestor.${p.id}`, [`${p.name} is ${row.generation} generation${row.generation === 1 ? '' : 's'} back along a recorded ${row.kind} link. ${stories.length ? stories.map(s => `${provenance(s)} ${s.text}`).join('\n') : 'I have a place in the tree, but no personal story I can share.'}`], [
      ...ties.map(t => choice(`legacy.tie.${t.id}`, `Ask about ${corp(db, t.corporationId).name}`, () => tieNode(t.id))),
      choice('legacy.generations', 'Return to the generations', generations), back()
    ], [`person:${p.id}`]);
  }
  function tieNode(id) {
    const t = db.ties.find(t => t.id === id);
    if (!visible(t)) return node('tie.closed', ['That record is not something I can share now.'], [back()]);
    return node(`tie.${id}`, [describeTie(db, t)], [
      choice('legacy.inheritance', 'Does that give you any claim today?', () => node('inheritance', [
        'An ancestor’s job is not an ownership claim. Even an old shareholding needs a current register and a valid transfer. I do not inherit a company just because I inherit a name.'
      ], [back()])), choice('legacy.loyalty', 'Do you owe that corporation loyalty?', () => node('loyalty', [
        'I can be grateful for wages that kept a family fed and still question what the company did. Those feelings are allowed to exist together.',
        'The company remembers a contract. We remember the person who came home from the shift. That is not always the same history.'
      ], [back()])), back()
    ], [`tie:${id}`]);
  }
  function corporations() {
    const relatives = new Set([speakerId, ...ancestors(db, speakerId).map(x => x.person.id)]);
    const ties = db.ties.filter(t => relatives.has(t.personId) && visible(t));
    return node('corporations', [ties.length ? 'Some ties were paychecks. Some were shares. Some began a business. Let us keep those distinctions.' : 'I have no corporate connection I can substantiate or share.'], [
      ...ties.map(t => choice(`legacy.tie.${t.id}`, `${person(db, t.personId).name} · ${corp(db, t.corporationId).name} · ${t.kind} · ${era(t)}`, () => tieNode(t.id))), back()
    ]);
  }
  function shared() {
    const connections = corporateConnections(db, speakerId, listenerId, { speakerId, level: level() });
    return node('shared', [connections.length ? connections.map(c => `${c.corporation.name} appears in both branches.\n${[...new Map([...c.left, ...c.right].map(t => [t.id, t])).values()].map(t => describeTie(db, t)).join('\n')}`).join('\n\n') + '\nA shared company does not prove they met or that we are related.' : 'No shared corporate record is known to me. That does not prove our families never crossed paths.'], [choice('legacy.archive', 'Look for a stronger connection', archive), back()]);
  }
  function names() {
    const suggestions = nameSuggestions(db, { familyIds: [speaker.familyId, listener?.familyId].filter(Boolean), seed: `${speakerId}:${listenerId}`, speakerId, level: level() });
    return node('names', [suggestions.length ? 'A name can be a gift without becoming an assignment. These are the names our recorded traditions offer.' : 'No naming tradition has been entered. I will not pretend a random name belonged to an ancestor.'], [
      ...suggestions.map(n => choice(`legacy.name.${n.familyId}.${n.name}`, `${n.name} — why that name?`, () => node(`name.${n.name}`, [`${n.reason} We could honor that history without asking a child to repeat the life.`], [
        choice(`legacy.shortlist.${n.name}`, 'Remember it as a possibility', () => { mem.preferences.shortlist ??= []; if (!mem.preferences.shortlist.includes(n.name)) mem.preferences.shortlist.push(n.name); return node('shortlist', [`I will remember ${n.name} as a possibility, not a decision. Our shortlist is ${mem.preferences.shortlist.join(', ')}.`], [back()]); }), back()
      ]))),
      choice('legacy.newname', 'Could a child begin a new naming tradition?', () => node('newname', ['Yes. Remembering the founder does not mean naming every generation after them. A chosen name belongs in the register too.'], [back()])), back()
    ]);
  }
  function burden() {
    return node('burden', ['I want the next generation to inherit stories they can question, people they can turn to, and fewer debts disguised as duties.', 'There are things I am proud of. There are things I want to end with me. Loving a family cannot mean repeating every choice it made.'], [
      choice('legacy.keep', 'Which tradition should survive?', () => node('tradition', [list(f()?.traditions).filter(visible).map(t => t.text).join('\n') || 'We have not named one yet. I would start with making room for everyone who actually does the caring.'], [back()])),
      choice('legacy.repair', 'What if the family harmed someone?', () => node('repair', ['Then we listen to the people who lived with the consequences. A better family story is not the same as making amends. We would need to know what happened before claiming we repaired it.'], [back()])), back()
    ]);
  }
  function planningAllowed() {
    // Explicit host gate; missing ages, consent, or family settings fail closed.
    return typeof options.canPlanFamily === 'function' && options.canPlanFamily(speaker, listener) === true;
  }
  function future() {
    if (!planningAllowed()) return node('future.closed', ['We can talk about family history. Planning a family together is not available right now.'], [back()]);
    return node('future', ['I can imagine a family with you. I need us to talk about the ordinary days as carefully as the hopeful ones.', 'Before names and announcements: who gets rest, who takes the watch, and who helps when neither of us has anything left?'], [
      choice('legacy.readiness', 'What would make us ready?', readiness), choice('legacy.paths', 'Birth, adoption, or another form of family?', paths),
      choice('legacy.parenting', 'How would we share the care?', parenting), choice('legacy.names', 'Talk about names and heritage', names),
      choice('legacy.wait', 'I want to wait', () => { mem.preferences.familyTiming = 'wait'; return node('future.wait', ['Then we wait. You do not owe me a deadline, and I will not treat this as a promise you already made.'], [back()]); }),
      choice('legacy.consider', 'Remember that I am open to it', () => { mem.preferences.familyTiming = 'open'; return node('future.open', ['I will remember that you are open to talking. That is not permission to change precautions or start trying.'], [back()]); }), back()
    ]);
  }
  function readiness() { return node('readiness', ['A safe place to live, time away from duty, dependable care, and a plan if the ship or income changes. Wanting a child matters. So does making room for the person they become.'], [choice('legacy.parenting', 'Make a care plan', parenting), choice('legacy.future', 'Return to our plans', future), back()]); }
  function paths() { return node('paths', ['Birth is one possibility. Adoption, guardianship, and chosen family deserve their own conversations. None makes a child less ours, and none erases the history they bring.'], [choice('legacy.identity', 'How do we preserve their original history?', () => node('identity', ['Keep each parent and guardian link with its own meaning. Keep names and origins where they are known. Do not rewrite a child’s past to make our family tree look simpler.'], [back()])), choice('legacy.future', 'Return to our plans', future), back()]); }
  function parenting() { return node('parenting', ['Let us name duties instead of assuming one of us will absorb them: meals, nights, appointments, teaching, and the shifts we give up. A founder’s legacy cannot feed a tired child at three in the morning.'], [choice('legacy.care', 'Remember: care should be shared', () => { mem.preferences.sharedCare = true; return node('care', ['I will remember that as the principle. We still need an actual roster and people who agree to it.'], [back()]); }), choice('legacy.future', 'Return to our plans', future), back()]); }
  return [{ id: 'familyLegacy', label: 'Family, names, and the people before us', tier: 0, cooldown: 0, say: overview }];
}

/** Call only after the host has resolved a real family event. No conception mechanics here. */
export function recordFamilyEvent(db, event) {
  if (!event?.id || !['pregnancy', 'birth', 'adoption', 'loss', 'postponed'].includes(event.type)) throw new Error('A unique event id and supported family event type are required');
  const existing = db.events.find(e => e.id === event.id);
  if (existing) return existing.text;
  const names = list(event.parentIds).map(id => person(db, id)?.name).filter(Boolean);
  const who = names.length ? names.join(' and ') : 'The family';
  const child = label(event.childName) || 'the child';
  const text = {
    pregnancy: `${who} receive news of a pregnancy. The conversation turns to support, privacy, and what comes next.`,
    birth: `${who} welcome ${child}. A new generation begins with a person, not an obligation to repeat the past.`,
    adoption: `${who} welcome ${child} into the family. Earlier names and connections remain part of the child’s story.`,
    loss: `${who} make room for grief. No one is asked to turn the loss into a lesson or hurry toward another plan.`,
    postponed: `${who} decide to wait. The family’s future remains an open conversation.`
  }[event.type];
  db.events.push({ ...clone(event), text });
  return text;
}
