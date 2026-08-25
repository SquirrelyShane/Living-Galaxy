#!/usr/bin/env python3
"""Living Galaxy — multiplayer relay. Python stdlib only, so it runs in Termux
with nothing installed:

    python3 server.py                # ws://0.0.0.0:8765, seed 1337
    python3 server.py --port=9000 --seed=42

Run it next to the HTTP server. Other players on your network connect by putting
ws://<your-ip>:8765 in the game's boot screen. The server owns the world seed —
every client that joins generates the identical Solaris from it — and relays
position/fire messages between pilots. It holds no game state beyond each
pilot's last reported position (given to late joiners), so restarting it is
harmless.

0.10 adds three things, all of them small on this side because the relay deliberately
still contains no game logic:

  * **Host election.** The oldest connected pilot is the host and simulates the NPCs for
    everyone. The server does not know what an NPC is — it knows only which client is
    allowed to send `npc` messages, and reassigns that when the host leaves. Putting the
    simulation on a client keeps this file stdlib-only, which is the whole reason it runs
    in Termux with nothing installed.

  * **Clock echo.** `ping` is answered with the server's own world age. Two phones have
    wall clocks seconds apart; a timestamp is meaningless until both ends agree on a
    reference, and this is the reference.

  * **Resume tokens.** A dropped pilot's slot is held for RESUME_WINDOW seconds. A phone
    that loses signal in a tunnel comes back as itself rather than as a stranger.
"""
import socket
import threading
import json
import base64
import hashlib
import struct
import time
import sys

GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
HOST = "0.0.0.0"

RESUME_WINDOW = 90.0   # seconds a disconnected pilot's slot is held

clients = {}          # id -> {"sock", "name", "state", "joined"}
parked = {}           # token -> {"id", "name", "state", "until"}
lock = threading.Lock()
counter = [0]
host_id = [0]


def _pick_host_locked():
    """Oldest connected client. Called with the lock held.

    Oldest rather than best-connected on purpose: it is stable. A rule that picks the
    lowest latency reshuffles authority every time the network wobbles, and every
    handover is a moment where nobody is simulating.
    """
    if not clients:
        return 0
    return min(clients, key=lambda cid: clients[cid]["joined"])


def _reap_parked_locked():
    now = time.time()
    for tok in [t for t, p in parked.items() if p["until"] < now]:
        parked.pop(tok, None)


def handshake(sock):
    data = b""
    while b"\r\n\r\n" not in data:
        chunk = sock.recv(1024)
        if not chunk:
            return False
        data += chunk
        if len(data) > 8192:
            return False
    headers = {}
    for line in data.split(b"\r\n")[1:]:
        if b":" in line:
            k, v = line.split(b":", 1)
            headers[k.strip().lower()] = v.strip()
    key = headers.get(b"sec-websocket-key")
    if not key:
        return False
    accept = base64.b64encode(hashlib.sha1(key + GUID.encode()).digest()).decode()
    sock.send((
        "HTTP/1.1 101 Switching Protocols\r\n"
        "Upgrade: websocket\r\nConnection: Upgrade\r\n"
        f"Sec-WebSocket-Accept: {accept}\r\n\r\n"
    ).encode())
    return True


def recv_exact(sock, n):
    buf = b""
    while len(buf) < n:
        chunk = sock.recv(n - len(buf))
        if not chunk:
            raise ConnectionError("closed")
        buf += chunk
    return buf


def read_frame(sock):
    b1, b2 = recv_exact(sock, 2)
    opcode = b1 & 0x0F
    masked = b2 & 0x80
    length = b2 & 0x7F
    if length == 126:
        length = struct.unpack(">H", recv_exact(sock, 2))[0]
    elif length == 127:
        length = struct.unpack(">Q", recv_exact(sock, 8))[0]
    if length > 65536:                      # nothing in this protocol is that big
        raise ConnectionError("oversized frame")
    mask = recv_exact(sock, 4) if masked else b"\x00" * 4
    payload = bytearray(recv_exact(sock, length))
    if masked:
        for i in range(length):
            payload[i] ^= mask[i % 4]
    return opcode, bytes(payload)


def send_frame(sock, payload, opcode=1):
    if isinstance(payload, str):
        payload = payload.encode()
    n = len(payload)
    if n < 126:
        head = struct.pack(">BB", 0x80 | opcode, n)
    elif n < 65536:
        head = struct.pack(">BBH", 0x80 | opcode, 126, n)
    else:
        head = struct.pack(">BBQ", 0x80 | opcode, 127, n)
    sock.sendall(head + payload)


def broadcast(msg, exclude=None):
    data = json.dumps(msg, separators=(",", ":"))
    with lock:
        targets = [(cid, c["sock"]) for cid, c in clients.items() if cid != exclude]
    dead = []
    for cid, s in targets:
        try:
            send_frame(s, data)
        except OSError:
            dead.append(cid)
    if dead:
        with lock:
            for cid in dead:
                clients.pop(cid, None)


def handle(sock, addr, seed, started):
    sock.settimeout(120)
    cid = None
    name = None
    try:
        if not handshake(sock):
            return
        while True:
            opcode, payload = read_frame(sock)
            if opcode == 8:        # close
                break
            if opcode == 9:        # ping
                send_frame(sock, payload, 10)
                continue
            if opcode != 1:
                continue
            try:
                msg = json.loads(payload)
            except ValueError:
                continue
            t = msg.get("t")

            if t == "hello" and cid is None:
                resumed = False
                with lock:
                    _reap_parked_locked()
                    slot = parked.pop(str(msg.get("resume") or ""), None)
                    if slot:
                        # Same id, same name, same last known position: to everyone else
                        # this pilot never left, which is exactly what a tunnel should
                        # look like from the outside.
                        cid = slot["id"]
                        name = slot["name"]
                        state = slot["state"]
                        resumed = True
                    else:
                        counter[0] += 1
                        cid = counter[0]
                        name = str(msg.get("name") or f"Pilot-{cid}")[:16]
                        state = None
                    token = f"{cid}-{int(time.time() * 1000) % 1000000}"
                    others = {i: {"name": c["name"], "state": c["state"]}
                              for i, c in clients.items()}
                    clients[cid] = {"sock": sock, "name": name, "state": state,
                                    "joined": time.time() if not resumed else 0.0,
                                    "token": token}
                    host_id[0] = _pick_host_locked()
                    who = host_id[0]
                send_frame(sock, json.dumps({
                    "t": "welcome", "id": cid, "seed": seed, "token": token,
                    "age": round(time.time() - started, 2), "players": others,
                    "host": who, "resumed": resumed
                }, separators=(",", ":")))
                if not resumed:
                    broadcast({"t": "join", "id": cid, "name": name}, exclude=cid)
                broadcast({"t": "host", "id": who})
                print(f"+ {name} ({addr[0]}) — {len(clients)} online"
                      f"{' [resumed]' if resumed else ''}, host {who}", flush=True)

            elif t == "ping" and cid is not None:
                # Echo the client's own stamp back untouched alongside our world age, so
                # the round trip is measured without either side trusting the other's clock.
                send_frame(sock, json.dumps({
                    "t": "pong", "c": msg.get("c"),
                    "s": round(time.time() - started, 4)
                }, separators=(",", ":")))

            elif t == "npc" and cid is not None:
                # Only the host may describe the world. Without this check any client
                # could rewrite everyone else's system, and the failure would look like
                # a physics bug rather than what it is.
                if cid == host_id[0]:
                    msg["id"] = cid
                    msg["t2"] = round(time.time() - started, 4)
                    broadcast(msg, exclude=cid)

            elif t == "bye" and cid is not None:
                break

            elif t == "state" and cid is not None:
                with lock:
                    if cid in clients:
                        # Deltas are merged into the stored state rather than replacing
                        # it, so a late joiner is handed a complete picture rather than
                        # whichever three fields happened to change last.
                        prev = clients[cid]["state"] or {}
                        merged = dict(prev)
                        merged.update({k: v for k, v in msg.items() if k != "t"})
                        clients[cid]["state"] = merged
                msg["id"] = cid
                msg["t2"] = round(time.time() - started, 4)
                broadcast(msg, exclude=cid)

            elif t == "fire" and cid is not None:
                msg["id"] = cid
                broadcast(msg, exclude=cid)

    except (ConnectionError, OSError, socket.timeout):
        pass
    finally:
        if cid is not None:
            with lock:
                gone = clients.pop(cid, None)
                # Park the slot rather than destroying it. A pilot who comes back inside
                # the window resumes; one who does not is reaped and the "leave" they
                # already triggered stands.
                if gone and gone.get("token"):
                    parked[gone["token"]] = {"id": cid, "name": gone["name"],
                                             "state": gone.get("state"),
                                             "until": time.time() + RESUME_WINDOW}
                was_host = (cid == host_id[0])
                host_id[0] = _pick_host_locked()
                who = host_id[0]
                remaining = len(clients)
            broadcast({"t": "leave", "id": cid})
            if was_host:
                broadcast({"t": "host", "id": who})
                print(f"  host reassigned to {who}", flush=True)
            print(f"- {name} — {remaining} online", flush=True)
        try:
            sock.close()
        except OSError:
            pass


def main():
    port, seed = 8765, 1337
    for a in sys.argv[1:]:
        if a.startswith("--port="):
            port = int(a.split("=", 1)[1])
        elif a.startswith("--seed="):
            seed = int(a.split("=", 1)[1])
    started = time.time()
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind((HOST, port))
    srv.listen(16)
    print(f"Living Galaxy relay on ws://0.0.0.0:{port} · seed {seed}", flush=True)
    while True:
        sock, addr = srv.accept()
        threading.Thread(target=handle, args=(sock, addr, seed, started), daemon=True).start()


if __name__ == "__main__":
    main()
