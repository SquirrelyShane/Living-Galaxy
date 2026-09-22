/* LIVING GALAXY — a headless hull in a shared room.
 *
 * 0.3.22. The relay the browser uses (js/net.js → server.py /net/*) is plain
 * HTTP and JSON, so a node process can stand in a room exactly as a tab does:
 * push a `t:"ship"` state a few times a second, poll for everybody else's. No
 * DOM, no three.js, no renderer — just a hull that is really there, so ARIA's
 * playthroughs happen in the SAME sky a player is flying, not beside it.
 *
 * Used by tools/aria-play.mjs; safe to import with no server, in which case it
 * quietly does nothing and says so once.
 */

export function makeRelay({ server = "http://127.0.0.1:8080", room = "sol", id = null, name = "ARIA" } = {}) {
  const self = id ?? `aria${Math.random().toString(36).slice(2, 8)}`;
  const base = server.replace(/\/+$/, "");
  const state = { online: false, peers: 0, seq: 0, warned: false, sends: 0, errors: 0, self, room, name };

  const say = (m) => { if (!state.warned) { state.warned = true; console.warn(`[relay] ${m}`); } };

  async function send(kind, data) {
    try {
      const res = await fetch(`${base}/net/send`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room, from: self, kind, data }),
      });
      if (!res.ok) throw new Error(`send ${res.status}`);
      state.online = true;
      state.sends++;
      state.warned = false;
    } catch (e) {
      state.online = false;
      state.errors++;
      say(`${base} is not answering (${e.message}) — flying solo, nothing shared`);
    }
  }

  async function poll() {
    try {
      const q = new URLSearchParams({ room, self, since: String(state.seq) });
      const res = await fetch(`${base}/net/poll?${q}`);
      if (!res.ok) throw new Error(`poll ${res.status}`);
      const j = await res.json();
      state.seq = Math.max(state.seq, j.seq ?? 0);
      state.peers = Object.keys(j.states ?? {}).filter((k) => k !== self).length;
      state.online = true;
      return j;
    } catch {
      state.online = false;
      state.peers = 0;
      return null;
    }
  }

  /** The same packet sim.js broadcasts, so a browser draws the bot like any pilot. */
  const pushShip = (ship, extra = {}) => send("state", {
    t: "ship", name, color: extra.color ?? "#7fd4ff", ship: extra.hull ?? null,
    x: ship.pos.x, y: ship.pos.y, z: ship.pos.z,
    yaw: ship.yaw, pitch: ship.pitch, speed: extra.speed ?? 0,
  });

  const chat = (text) => send("chat", { t: "line", name, text });

  /** The host's snapshot of the sky, or null. */
  async function world() {
    try {
      const res = await fetch(`${base}/net/world?${new URLSearchParams({ room })}`);
      if (!res.ok) throw new Error(`world ${res.status}`);
      return await res.json();
    } catch { return null; }
  }

  /**
   * 0.3.25 — join the sky somebody is already flying, rather than booting a
   * private copy of it beside theirs.
   *
   * Two things have to happen before the first decision. The CLOCK: a room is
   * born when its first pilot joins, every client chases `now - born`, and the
   * timetables, the belt drift and the port lanes are all functions of it — a
   * bot on its own clock is in the same sky at a different hour. And the
   * SNAPSHOT: whoever holds the sky owns the rocks, the strikes and the
   * events, so a joiner takes their picture of it rather than growing its own.
   *
   * Returns what it managed: { joined, clock, snapshot, peers, host }.
   */
  async function join({ shiftClock, applyWorldSnapshot, simTime }) {
    const j = await poll();
    if (!j) return { joined: false, clock: false, snapshot: false, peers: 0, host: null };
    let clock = false;
    if (typeof j.born === "number" && typeof j.now === "number") {
      const shared = Math.max(0, j.now - j.born);
      shiftClock?.(shared - (simTime?.() ?? 0));
      clock = true;
    }
    let snapshot = false;
    if (j.host && j.host !== self) {
      const w = await world();
      if (w?.world && applyWorldSnapshot?.(w.world)) snapshot = true;
    }
    state.host = j.host ?? null;
    return { joined: true, clock, snapshot, peers: state.peers, host: j.host ?? null };
  }

  return { state, send, poll, pushShip, chat, world, join };
}
