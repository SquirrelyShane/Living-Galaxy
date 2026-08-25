# The Galaxy Server

One Node process that gives the galaxy somewhere to live. It serves the game, terminates
the WebSockets, rooms pilots by system, and owns everything durable — accounts, banked
credits, per-system world deltas, the galaxy's accumulated age — inside an encrypted
vault. Stdlib-only: no npm install, ever.

## Quick start (the hosting machine)

```sh
./start.sh          # Linux / macOS / Termux — certs if missing, server up, browser open
launch.cmd          # Windows — same flow, double-clickable
```

Both wait until the server actually *answers* before opening the cockpit, and print the
one line players need. By hand instead:

```sh
node server/main.js
```

First run creates `galaxy-data/` and asks for a **vault passphrase**. Everything durable
is sealed under it (scrypt → AES-256-GCM); a wrong passphrase on a later start refuses to
boot before a single byte can be written. Choose it once, keep it.

Flags and environment:

```sh
node server/main.js --port=8765 --seed=1337 --data=/somewhere/else
GALAXY_PASS=... node server/main.js      # unattended start (systemd, tmux, Termux:Boot)
node server/main.js --insecure           # force plain http/ws even when certs exist
```

The seed is only used the first time — after that the vault remembers it, along with the
world's age, which accumulates across restarts.

## Encryption

Two layers, independent:

1. **At rest.** Every record in `galaxy-data/` is a sealed AES-256-GCM blob. The suite
   asserts nothing legible ever touches disk. Losing the laptop does not leak the ledger;
   flipping a byte in a wallet file is *rejected*, not misread.
2. **In transit — automatic.** The server issues its own TLS certificate at boot, in
   pure Node (`server/certs.js`) — no openssl, no scripts, nothing to install. SANs
   cover the beacon name, localhost, and every LAN address, and when the laptop's
   address or name changes the certificate is **reissued automatically** at the next
   start. Players visit the https:// page once per device and accept the warning (or
   import `galaxy-data/certs/server.crt` as trusted — it carries CA:TRUE for exactly
   that). Extra names the server can't guess (a VPN address, a hostname from another
   subnet): `node tools/make-certs.mjs vpn.example 10.8.0.3`.

## The name on the door

Nobody types your IP. The server carries an **mDNS beacon** (`server/beacon.js`): when a
device on the LAN asks "who is `galaxy.local`?", the beacon answers with the laptop's
addresses — the same multicast-DNS mechanism every OS already uses to find printers, so
there is nothing to install on any player device and nothing to change on the router.
iOS, macOS, Windows 10+, Android 12+ and desktop Linux (with avahi, which desktops ship)
all resolve `.local` out of the box.

* Rename the galaxy: `--name=nexis` or `GALAXY_NAME=nexis` → `nexis.local`. The
  certificate follows automatically — a rename is one of the changes that triggers a
  reissue at the next start.
* The beacon is a convenience, never a dependency: if UDP 5353 can't be shared (rare —
  the socket opens with address reuse precisely so it can sit beside a system resolver),
  the server says so at startup and prints the IP fallback. Both fallback lines also
  appear in `/api/status` (`name`, `ips`).
* Old-Android or an mDNS-blocking AP isolation setting → use the printed IP. (AP/client
  isolation on guest Wi-Fi networks blocks *all* of this, IP included — host on the real
  network, not the guest one.)

## Players

They open `https://galaxy.local:8765/` — the server serves the game itself, so everyone
runs the same build from the same origin — and enter `wss://galaxy.local:8765` on the boot
screen.

* **Callsign only** → guest. Flies fully, persists nothing.
* **Callsign + passphrase** → account, created on first use (registration is idempotent;
  the passphrase decides everything afterwards). Accounts carry a wallet — credits banked
  with the galaxy, movable only by asking the ledger — and the galaxy remembers which
  system it last saw each pilot in.

`https://<laptop-ip>:8765/api/status` shows what the galaxy is doing: pilots online,
occupied systems, motion-guard suspects, age, TLS state.

## Shape (why it scales on one laptop)

```
Browser clients ── wss ──┐
                         ▼
              ┌─────────────────────┐
              │   gateway (wire.js) │  handshake, frames, one port
              ├─────────────────────┤
              │   rooms (rooms.js)  │  system = shard; host elected per room;
              │                     │  packets never leave the room
              ├─────────────────────┤
              │ registry(registry.js)│ accounts · wallet · world deltas
              ├─────────────────────┤
              │   vault (vault.js)  │  scrypt + AES-256-GCM, atomic writes
              └─────────────────────┘
```

* **Seed is law.** The static galaxy is never stored anywhere. The vault grows with what
  players *do* — an account, a claim, a wreck — never with the number of systems.
* **Interest management, coarse.** The room is the interest bubble: pilots stream state
  only to pilots in the same system. An unoccupied system has no process, no memory, no
  cost.
* **Hybrid authority.** Clients own the flying and the visuals. The room's host client
  simulates NPCs (longest-connected; a sitting host is never unseated by an arrival,
  because every handover is a moment nobody is simulating). The server owns identity,
  membership, money, persistent deltas — anything that can affect another player's wallet
  or hull integrity across sessions — plus a motion guard that counts kinematically
  impossible position reports per pilot.
* **Tickets.** Resume tokens are HMAC-signed claims, stateless to verify, expiring —
  the small end of a gateway/ticket design, and the part that would survive this process
  ever being split.

## Upgrade paths (in the order they would matter)

1. **Server-side NPC authority** — a headless client process that joins busy rooms as a
   member with host priority. The room code would not change; the host-election rule is
   the only seam.
2. **Finer interest bubbles** — inside a very crowded room, filter state fan-out by
   distance before serialising. The `roomSend` call is the one place to do it.
3. **Binary hot path** — the state/npc messages are the bandwidth; MessagePack or
   bit-packing behind `encodeDelta` in `netsync.js` touches neither the router nor the
   game.
4. **The market** — order books per station are registry records like any other; the
   `bank` message is the transactional pattern to copy. This is queued item #1 in the
   build log and the server is now the right place for it.
5. **Many processes** — consistent-hash the system id space across shard processes behind
   the same gateway, tickets unchanged. Not worth it below hundreds of concurrent pilots;
   the Legion (i7, 32 GB) will bore long before this server does.

## Tests

```sh
node test/vault.mjs          # crypto, wire codec, tickets, rooms, motion guard — pure
node test/net.mjs            # live protocol against a real subprocess
node test/galaxy-server.mjs  # durability across restart; wrong-passphrase refusal
```

All three are part of `node test/all.mjs`, the ship gate.
