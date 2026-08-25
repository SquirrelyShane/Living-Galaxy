// Living Galaxy server — rooms. The system is the shard.
//
// The single biggest change from the relay: the relay had one connection table and fanned
// every packet to everyone, which is correct while every pilot is in the same system and
// wrong the moment one of them jumps. Almost all real-time traffic in a space game is
// intra-system — the pilots who can see each other — so the system node index is the
// natural partition, and it is the partition here. A pilot's packets reach the pilots in
// the same room and nobody else; a quiet system costs nothing because its room does not
// exist; the live cost of the galaxy is proportional to where people actually are, not to
// the four thousand nodes on the chart.
//
// Each room elects its own host — oldest member, exactly the rule the relay used globally,
// for the same reason (it is stable; best-latency reshuffles authority every time the
// network wobbles). The host simulates the NPCs for that room. This keeps the hybrid
// authority split: the server owns membership, identity, deltas and the wallet; a client
// owns the flying. The upgrade path when the server should own NPCs too is a headless
// simulation loop joining each populous room as a member with host priority — the room
// code would not change.
//
// Pure state over Maps. No sockets in this file; the suite drives it directly.

export function makeRooms() {
  return { bySys: new Map(), sysOf: new Map(), joinedAt: new Map(), seq: 0 };
}

const room = (R, sys) => {
  let r = R.bySys.get(sys);
  if (!r) { r = { members: new Set(), host: 0 }; R.bySys.set(sys, r); }
  return r;
};

function electLocked(R, r) {
  // A sitting host keeps the seat: every handover is a moment where nobody is simulating,
  // so an arrival — however senior — must not cause one. Election happens only when the
  // seat is empty, and then the longest-connected member takes it, for the relay's old
  // reason: seniority is stable, best-latency reshuffles every time the network wobbles.
  // 0 means "nobody", which downstream reads as "no authority — trust nothing".
  if (r.host && r.members.has(r.host)) return r.host;
  let best = 0, bestAt = Infinity;
  for (const id of r.members) {
    const at = R.joinedAt.get(id) ?? Infinity;
    if (at < bestAt) { bestAt = at; best = id; }
  }
  r.host = best;
  return best;
}

/**
 * Move pilot `id` into system `sys` (first join included). Returns everything the router
 * needs to say about it: who to tell in the old room, who to tell in the new, and both
 * rooms' hosts after the dust settles.
 */
export function enterSystem(R, id, sys) {
  const prev = R.sysOf.get(id);
  if (prev === sys) return null;                      // a repeat is a no-op, not a rejoin
  let left = null;
  if (prev !== undefined) {
    const pr = R.bySys.get(prev);
    if (pr) {
      pr.members.delete(id);
      const host = electLocked(R, pr);
      left = { sys: prev, members: [...pr.members], host };
      if (!pr.members.size) R.bySys.delete(prev);     // empty systems cost nothing
    }
  }
  if (!R.joinedAt.has(id)) R.joinedAt.set(id, ++R.seq);
  const nr = room(R, sys);
  nr.members.add(id);
  const host = electLocked(R, nr);
  R.sysOf.set(id, sys);
  return { left, joined: { sys, members: [...nr.members], host } };
}

/** Remove a pilot entirely (disconnect). Same return shape as leaving a room. */
export function leaveAll(R, id) {
  const sys = R.sysOf.get(id);
  R.sysOf.delete(id);
  R.joinedAt.delete(id);
  if (sys === undefined) return null;
  const r = R.bySys.get(sys);
  if (!r) return null;
  r.members.delete(id);
  const host = electLocked(R, r);
  const out = { sys, members: [...r.members], host };
  if (!r.members.size) R.bySys.delete(sys);
  return out;
}

/** Everyone in `id`'s room except `id` — the fan-out set for its state packets. */
export function peersOf(R, id) {
  const sys = R.sysOf.get(id);
  if (sys === undefined) return [];
  const r = R.bySys.get(sys);
  if (!r) return [];
  const out = [];
  for (const m of r.members) if (m !== id) out.push(m);
  return out;
}

export const systemOf = (R, id) => R.sysOf.get(id);
export const hostOf = (R, sys) => (R.bySys.get(sys) || { host: 0 }).host;

/** Occupancy map — {sys: count} — for diagnostics and the future galaxy-map overlay. */
export function occupancy(R) {
  const out = {};
  for (const [sys, r] of R.bySys) out[sys] = r.members.size;
  return out;
}

// ── movement sanity ──────────────────────────────────────────────────
// The server cannot re-run the flight model, but it can know that a hull which was at A
// half a second ago cannot be 80,000 km away now unless it warped. The check is loose on
// purpose: browsers garbage-collect, phones background, tabs sleep — a big *time* gap is
// innocent, a big *speed* is not. Suspects are counted, not kicked; the count is surfaced
// in diagnostics so a hacked client is a thing you can see before deciding what to do.

export function makeMotionGuard(maxSpeed = 6000 /* u/s — well above any sublight hull */) {
  return { last: new Map(), maxSpeed, suspects: new Map() };
}

/** Feed one reported position. Returns false when it is kinematically impossible. */
export function checkMotion(G, id, p, now, warped = false) {
  if (!Array.isArray(p) || p.length < 3) return true;   // not a position update
  const prev = G.last.get(id);
  G.last.set(id, { p, t: now });
  if (!prev || warped) return true;
  const dt = Math.max(0.05, now - prev.t);
  const dx = p[0] - prev.p[0], dy = p[1] - prev.p[1], dz = p[2] - prev.p[2];
  const v = Math.sqrt(dx * dx + dy * dy + dz * dz) / dt;
  if (v <= G.maxSpeed) return true;
  G.suspects.set(id, (G.suspects.get(id) || 0) + 1);
  return false;
}

export const clearMotion = (G, id) => { G.last.delete(id); };
