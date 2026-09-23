#!/usr/bin/env python3
"""LIVING GALAXY local server — works on Termux, desktop, and any Python 3.

    python server.py
    python server.py 8080

Then open the printed URL in your phone browser.

Besides serving the files it is a tiny in-memory relay so pilots on the same
server can see each other and talk (js/net.js):

    POST /net/send   {"room","from","kind":"state"|"msg","to"?,"data"}
    GET  /net/poll?room=&self=&since=   (since=-1 on a fresh join)
         -> {"now","seq","states":{id:…},"msgs":[…],"born","pilots","host","wseq"}
    GET  /net/world?room=               -> {"wseq","world",…}   the host's sky snapshot
    POST /net/world  {"room","from","world"}                     (host writes it)

`born` is the room's shared clock zero (every client runs sim time = now - born).
The longest-present live pilot is the room's HOST: they run the sky's rocks and
everyone else mirrors them; `world` is the host's snapshot so a pilot joining
later inherits every crater and every lost port.

State is latest-per-pilot and expires after a few seconds of silence; messages
(comms hails, lines, beacons) are a short ring buffer replayed by sequence.

Experimental: it also keeps the shared CRADLE ledger (js/npc/cradle.js):

    GET  /cradle/all?room=<sky>        -> {"cradle":1,"records":[…]}  (that sky only)
    POST /cradle/put {"room","record"} -> {"ok":true}
    POST /llm/proxy  {..llama body, "_port":8081, "_path":"/completion"}
                                       -> llama.cpp's JSON (loopback pass-through)

That is the one thing written to disk — `cradle.json` beside this file.
Delete it to forget everyone.

THE CONSOLE (0.3.36)
--------------------
Started on a terminal, the server opens a colour console with three screens,
chosen by a single keypress and all live:

    [1] STATS   throughput, status mix, rooms and pilots, ledger, top paths
    [2] CHAT    every hail, line and beacon crossing the relay, as it happens
    [3] LOG     the request log, as it is written

Each is a menu as well as a view — CHAT can be filtered to one room and
written to its own file, LOG can turn raw poll lines on and off without a
restart. `?` lists the keys on any screen.

The console is OPT-OUT BY DETECTION, not by flag: it opens only when stdin and
stdout are both terminals. Redirect either — which is what every scripted start
does, `python server.py 8124 > log 2>&1 &` — and the server prints its banner
and serves in silence exactly as it always did. LG_MENU=0 forces that off, and
NO_COLOR=1 keeps the console but drops the escapes.
"""
from __future__ import annotations

import atexit
import json
import os
import re
import sys
import threading
import time
from collections import deque
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse


ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1] if len(sys.argv) > 1 else os.environ.get("PORT", "8080"))

STATE_TTL = 6.0          # seconds of silence before a pilot drops off the board
ROOM_TTL = 6 * 3600.0    # an empty, silent room is forgotten after this
ROOM_SWEEP = 60.0        # how often poll() looks for such rooms
CRADLE_FLUSH = 5.0       # seconds between ledger writes to disk
try:
    CRADLE_MAX = int(os.environ.get("CRADLE_MAX", "20000"))   # records kept; 0 = no cap
except ValueError:
    CRADLE_MAX = 20000
MSG_KEEP = 400           # ring buffer per room
MAX_BODY = 64 * 1024
VERSION = "0.1"                                  # keep in step with js/version.js
LOG_POLLS = os.environ.get("LOG_POLLS") == "1"   # raw /net/poll lines in the file too
try:
    LOG_KEEP = int(os.environ.get("LOG_KEEP", "40"))  # run logs to keep; 0 = keep every one
except ValueError:
    LOG_KEEP = 40

FEED_KEEP = 500          # lines held for the console's live screens
CHAT_KEEP = 400          # hails held for the CHAT screen


# ---------------------------------------------------------------------------
# COLOUR
#
# Plain ANSI SGR, 16-colour plus a few 256-colour greys — nothing that needs a
# package, and nothing a Termux terminal will not draw. `C.on` is decided once
# at start-up: a redirected stdout gets empty strings for every code, so the
# same f-string writes a clean line to a pipe and a coloured one to a screen.
# NO_COLOR is honoured because it costs one line to honour it.
# ---------------------------------------------------------------------------
class _Palette:
    def __init__(self) -> None:
        self.on = False
        self._apply()

    def enable(self, on: bool) -> None:
        self.on = bool(on)
        self._apply()

    def _apply(self) -> None:
        def c(code: str) -> str:
            return code if self.on else ""
        self.reset = c("\x1b[0m")
        self.bold = c("\x1b[1m")
        self.dim = c("\x1b[2m")
        self.rev = c("\x1b[7m")
        self.red = c("\x1b[38;5;203m")
        self.green = c("\x1b[38;5;114m")
        self.yellow = c("\x1b[38;5;221m")
        self.blue = c("\x1b[38;5;75m")
        self.cyan = c("\x1b[38;5;80m")
        self.magenta = c("\x1b[38;5;176m")
        self.orange = c("\x1b[38;5;215m")
        self.grey = c("\x1b[38;5;245m")
        self.dark = c("\x1b[38;5;240m")
        self.white = c("\x1b[38;5;253m")
        self.accent = c("\x1b[38;5;79m")     # the game's own HUD teal


C = _Palette()

CLEAR = "\x1b[2J\x1b[H"
HOME = "\x1b[H"
CLEAR_LINE = "\x1b[K"
HIDE_CURSOR = "\x1b[?25l"
SHOW_CURSOR = "\x1b[?25h"
_ANSI_RE = re.compile(r"\x1b\[[0-9;?]*[A-Za-z]")


def visible_len(s: str) -> int:
    """Length of `s` as drawn — escape codes take no columns."""
    return len(_ANSI_RE.sub("", s))


def fit(s: str, width: int) -> str:
    """Trim to `width` columns without cutting an escape sequence in half."""
    if visible_len(s) <= width:
        return s
    out, seen = [], 0
    i = 0
    while i < len(s) and seen < width:
        m = _ANSI_RE.match(s, i)
        if m:
            out.append(m.group(0))
            i = m.end()
            continue
        out.append(s[i])
        seen += 1
        i += 1
    return "".join(out) + C.reset


def bar(frac: float, width: int, colour: str = "") -> str:
    """A proportional bar. Eighths, so a small number still shows something."""
    frac = 0.0 if frac != frac else max(0.0, min(1.0, frac))       # NaN-safe
    full = int(frac * width)
    rem = (frac * width) - full
    eighths = " ▏▎▍▌▋▊▉"
    tail = eighths[int(rem * 8)] if full < width else ""
    body = "█" * full + tail
    return f"{colour}{body}{C.dark}{'·' * max(0, width - visible_len(body))}{C.reset}"


def human(n: float) -> str:
    """Bytes, in something a person reads at a glance."""
    for unit, step in (("G", 1 << 30), ("M", 1 << 20), ("K", 1 << 10)):
        if n >= step:
            return f"{n / step:.1f}{unit}"
    return f"{int(n)}B"


def dur(secs: float) -> str:
    secs = int(max(0, secs))
    d, secs = divmod(secs, 86400)
    h, secs = divmod(secs, 3600)
    m, s = divmod(secs, 60)
    if d:
        return f"{d}d {h:02d}h{m:02d}m"
    if h:
        return f"{h}h {m:02d}m{s:02d}s"
    if m:
        return f"{m}m {s:02d}s"
    return f"{s}s"



# ---------------------------------------------------------------------------
# STATISTICS
#
# Everything the STATS screen draws. Counters are plain ints behind one lock —
# the handler threads only ever increment, the console thread only ever reads,
# and the whole structure is small enough that a single lock costs nothing
# measurable next to the socket write it sits beside.
#
# Rates come from a ring of one-second buckets rather than a running average,
# because what you want while watching a phone join a room is "what is
# happening NOW", and an average over the whole run hides exactly that.
# ---------------------------------------------------------------------------
class Stats:
    WINDOW = 60          # seconds of per-second history kept for the rates

    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.started = time.time()
        self.requests = 0
        self.bytes = 0
        self.errors = 0
        self.by_method: dict[str, int] = {}
        self.by_status: dict[int, int] = {}
        self.by_path: dict[str, int] = {}
        self.slowest: tuple[float, str] = (0.0, "-")
        self.chat_msgs = 0
        self.states = 0
        self.worlds = 0
        self.cradle_puts = 0
        self.llm_calls = 0
        self.llm_fails = 0
        self._req_ring = deque(maxlen=self.WINDOW)     # (second, count)
        self._byte_ring = deque(maxlen=self.WINDOW)
        self._dur_ring = deque(maxlen=400)             # recent request ms

    def _bump_ring(self, ring: deque, amount: float) -> None:
        sec = int(time.time())
        if ring and ring[-1][0] == sec:
            ring[-1][1] += amount
        else:
            ring.append([sec, amount])

    def reset(self) -> None:
        """Zero the counters without replacing the lock other threads hold."""
        with self.lock:
            self.started = time.time()
            self.requests = self.bytes = self.errors = 0
            self.by_method.clear()
            self.by_status.clear()
            self.by_path.clear()
            self.slowest = (0.0, "-")
            self.chat_msgs = self.states = self.worlds = 0
            self.cradle_puts = self.llm_calls = self.llm_fails = 0
            self._req_ring.clear()
            self._byte_ring.clear()
            self._dur_ring.clear()

    def hit(self, method: str, status, path: str, nbytes: int, ms: float) -> None:
        with self.lock:
            self.requests += 1
            self.by_method[method] = self.by_method.get(method, 0) + 1
            if isinstance(status, int):
                self.by_status[status] = self.by_status.get(status, 0) + 1
                if status >= 400:
                    self.errors += 1
            self.by_path[path] = self.by_path.get(path, 0) + 1
            self.bytes += max(0, nbytes)
            self._bump_ring(self._req_ring, 1)
            self._bump_ring(self._byte_ring, max(0, nbytes))
            self._dur_ring.append(ms)
            if ms > self.slowest[0]:
                self.slowest = (ms, path)

    def note(self, field: str, n: int = 1) -> None:
        with self.lock:
            setattr(self, field, getattr(self, field, 0) + n)

    def _rate(self, ring: deque, span: int) -> float:
        now = int(time.time())
        cut = now - span
        total = sum(v for sec, v in ring if sec > cut)
        return total / float(span)

    def snapshot(self) -> dict:
        with self.lock:
            durs = sorted(self._dur_ring)
            n = len(durs)
            return {
                "up": time.time() - self.started,
                "requests": self.requests,
                "bytes": self.bytes,
                "errors": self.errors,
                "rps": self._rate(self._req_ring, 5),
                "rps60": self._rate(self._req_ring, self.WINDOW),
                "bps": self._rate(self._byte_ring, 5),
                "method": dict(self.by_method),
                "status": dict(self.by_status),
                "top": sorted(self.by_path.items(), key=lambda kv: -kv[1])[:8],
                "paths": len(self.by_path),
                "p50": durs[n // 2] if n else 0.0,
                "p95": durs[int(n * 0.95)] if n else 0.0,
                "slowest": self.slowest,
                "chat_msgs": self.chat_msgs,
                "states": self.states,
                "worlds": self.worlds,
                "cradle_puts": self.cradle_puts,
                "llm_calls": self.llm_calls,
                "llm_fails": self.llm_fails,
                "spark": [v for _, v in list(self._req_ring)][-40:],
            }


STATS = Stats()


# ---------------------------------------------------------------------------
# THE CHAT BOOK
#
# Every `msg` crossing the relay — a hail, a line on the open channel, a
# beacon — kept in a ring for the CHAT screen and, when you ask for it,
# written to its own file. Separate from the request log on purpose: the
# request log answers "did that file load", and mixing the two makes both
# harder to read. The relay is the only place a message can enter the game,
# so one hook in Relay.send catches all of it.
# ---------------------------------------------------------------------------
class ChatBook:
    def __init__(self, root: str) -> None:
        self.lock = threading.Lock()
        self.ring: deque = deque(maxlen=CHAT_KEEP)
        self.dir = os.path.join(root, "logs")
        self.to_file = os.environ.get("LOG_CHAT") == "1"
        self.path = os.path.join(self.dir, "chat.log")
        self.rooms: dict[str, int] = {}
        self.kinds: dict[str, int] = {}
        self.written = 0

    def add(self, room: str, sender: str, to: str | None, data) -> None:
        kind, text = self._read(data)
        entry = {"at": time.time(), "room": room, "from": sender, "to": to, "kind": kind, "text": text}
        with self.lock:
            self.ring.append(entry)
            self.rooms[room] = self.rooms.get(room, 0) + 1
            self.kinds[kind] = self.kinds.get(kind, 0) + 1
            write = self.to_file
        STATS.note("chat_msgs")
        if write:
            self._write(entry)

    @staticmethod
    def _read(data) -> tuple[str, str]:
        """Pull a kind and a line of text out of whatever js/chat.js sent."""
        if isinstance(data, dict):
            kind = str(data.get("kind") or data.get("channel") or data.get("t") or "msg")[:16]
            for key in ("text", "line", "body", "message", "say"):
                v = data.get(key)
                if isinstance(v, str) and v.strip():
                    return kind, v.strip()[:400]
            try:
                return kind, json.dumps(data, separators=(",", ":"))[:400]
            except (TypeError, ValueError):
                return kind, repr(data)[:400]
        if isinstance(data, str):
            return "msg", data[:400]
        return "msg", repr(data)[:400]

    def _write(self, e: dict) -> None:
        stamp = time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(e["at"]))
        who = e["from"] + (f" -> {e['to']}" if e["to"] else "")
        line = f"{stamp}  [{e['room']}]  {who}  ({e['kind']})  {e['text']}"
        with self.lock:
            try:
                os.makedirs(self.dir, exist_ok=True)
                with open(self.path, "a", encoding="utf-8") as f:
                    f.write(line + "\n")
                self.written += 1
            except OSError:
                pass

    def set_file(self, on: bool) -> bool:
        with self.lock:
            self.to_file = bool(on)
            return self.to_file

    def recent(self, room: str | None = None, n: int = 200) -> list:
        with self.lock:
            items = [e for e in self.ring if not room or e["room"] == room]
            return items[-n:]

    def summary(self) -> dict:
        with self.lock:
            return {
                "held": len(self.ring), "rooms": dict(self.rooms), "kinds": dict(self.kinds),
                "to_file": self.to_file, "written": self.written, "path": self.path,
            }

    def clear(self) -> None:
        with self.lock:
            self.ring.clear()


CHAT = ChatBook(ROOT)



class LogBook:
    """Detailed request log — ONE FILE PER RUN, under logs/.

    One file per DAY would mean every start, stop and crash in a day's work
    landing in the same growing file, with no way to tell where one run ended
    and the next began — debugging a session would mean scrolling for the last
    SERVER START and hoping you found the right one. So each start opens its
    own:

        logs/run-20260914-134502-a3f1.log     this run
        logs/latest.log                          → a copy of the newest path

    The name sorts chronologically, so `ls logs/` is a session history and
    `tail -f logs/$(cat logs/latest.log)` follows whatever is running. The
    four hex characters are the pid folded down, so two servers started in the
    same second on the same box do not fight over one file.

    Every hit gets one line: UTC time (ms), client, method, status, bytes,
    duration, the target file, and the file that triggered the request (the
    Referer — for ES module imports that is the importing module, so the log
    reads as `target=/js/npc/brain.js from=/js/npc/captain.js`).

    /net/poll and /net/ping fire several times a second, so instead of raw
    lines they are rolled into a one-line summary every 60 s
    (`NET poll x212 ping x4 clients=2`). Set LOG_POLLS=1 to log them raw, or
    press `p` on the console's LOG screen to turn them on without a restart.

    Old runs are pruned to the newest LOG_KEEP (default 40) on start, so a
    file-per-run does not quietly become ten thousand files. LOG_KEEP=0 keeps
    everything. Delete the logs/ folder any time.

    0.3.36 adds a RING alongside the file. The console's LOG screen draws from
    that rather than tailing the file, so watching the log costs no disk reads
    and the screen keeps working if the file cannot be opened at all.
    """

    def __init__(self, root: str) -> None:
        self.dir = os.path.join(root, "logs")
        self.lock = threading.Lock()
        self.poll_counts: dict[str, int] = {}
        self.poll_clients: set[str] = set()
        self.poll_flushed = time.time()
        self.run_id = f"{time.strftime('%Y%m%d-%H%M%S', time.gmtime())}-{os.getpid() & 0xFFFF:04x}"
        self.name = f"run-{self.run_id}.log"
        self.file = os.path.join(self.dir, self.name)
        self.ring: deque = deque(maxlen=FEED_KEEP)
        self.written = 0
        self.log_polls = LOG_POLLS
        self.echo = True            # mirror non-chatty lines to the terminal
        self.quiet_rolls = 0

    def _path(self) -> str:
        return self.file

    def begin(self, header: str) -> None:
        """Open this run's file, point logs/latest.log at it, and prune old runs."""
        try:
            os.makedirs(self.dir, exist_ok=True)
        except OSError:
            return
        self.line(header)
        try:
            with open(os.path.join(self.dir, "latest.log"), "w", encoding="utf-8") as f:
                f.write(self.name + "\n")
        except OSError:
            pass
        self.prune()

    def prune(self) -> None:
        """Keep the newest LOG_KEEP run files; a file per run must not become a leak."""
        if LOG_KEEP <= 0:
            return
        try:
            runs = sorted(n for n in os.listdir(self.dir) if n.startswith("run-") and n.endswith(".log"))
        except OSError:
            return
        for name in runs[:-LOG_KEEP]:
            if name == self.name:
                continue
            try:
                os.remove(os.path.join(self.dir, name))
            except OSError:
                pass

    def line(self, text: str, echo: bool = False, level: str = "info") -> None:
        stamp = time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()) + f".{int(time.time() * 1000) % 1000:03d}Z"
        entry = f"{stamp}  {text}"
        with self.lock:
            self.ring.append((time.time(), level, text))
            try:
                os.makedirs(self.dir, exist_ok=True)
                with open(self._path(), "a", encoding="utf-8") as f:
                    f.write(entry + "\n")
                self.written += 1
            except OSError:
                pass
            mirror = echo and self.echo
        # Only when there is no console owning the screen: otherwise a stray
        # line would tear a hole in whatever the console is drawing.
        if mirror and not CONSOLE.owns_screen():
            sys.stderr.write(entry + "\n")

    def quiet_hit(self, path: str, client: str) -> None:
        """Count a poll/ping; flush a summary line once a minute."""
        flush = None
        with self.lock:
            self.poll_counts[path] = self.poll_counts.get(path, 0) + 1
            self.poll_clients.add(client)
            if time.time() - self.poll_flushed >= 60:
                flush = (dict(self.poll_counts), len(self.poll_clients))
                self.poll_counts.clear()
                self.poll_clients.clear()
                self.poll_flushed = time.time()
                self.quiet_rolls += 1
        if flush:
            counts, nclients = flush
            parts = " ".join(f"{p.rsplit('/', 1)[-1]} x{n}" for p, n in sorted(counts.items()))
            self.line(f"NET {parts} clients={nclients}", level="net")

    def recent(self, n: int = 200, level: str | None = None) -> list:
        with self.lock:
            items = [e for e in self.ring if not level or e[1] == level]
            return items[-n:]

    def summary(self) -> dict:
        with self.lock:
            return {
                "file": self.file, "name": self.name, "written": self.written,
                "held": len(self.ring), "log_polls": self.log_polls, "echo": self.echo,
                "pending": sum(self.poll_counts.values()), "rolls": self.quiet_rolls,
                "keep": LOG_KEEP,
            }

    def set_polls(self, on: bool) -> bool:
        with self.lock:
            self.log_polls = bool(on)
            return self.log_polls

    def set_echo(self, on: bool) -> bool:
        with self.lock:
            self.echo = bool(on)
            return self.echo


LOG = LogBook(ROOT)



# ---------------------------------------------------------------------------
# THE CONSOLE
#
# Three live screens on one thread, driven by single keypresses.
#
# It runs ONLY when stdin and stdout are both terminals. That is the whole
# safety story: every scripted start in this project redirects stdout
# (`python server.py 8124 > log 2>&1 &`), so the check fails and the server
# behaves exactly as it did before — prints its banner, serves, never reads a
# key, never repaints. A console that blocked on input in a background process
# would deadlock every browser smoke in test/, so the detection is the feature.
#
# Keys are read raw through termios where it exists (Linux, macOS, Termux) so
# a screen changes on the keypress rather than on Enter. Where it does not
# (Windows), it falls back to line input and everything still works, just with
# an Enter after each key. select() with a timeout is what lets one thread both
# redraw on a clock and answer a key immediately.
# ---------------------------------------------------------------------------
class Console:
    TICK = 0.5           # redraw period for the live screens

    HELP = [
        ("1", "statistics — throughput, rooms, ledger, live"),
        ("2", "chat log — every hail crossing the relay"),
        ("3", "request log — what the browser is fetching"),
        ("r", "reset the counters (statistics screen)"),
        ("f", "toggle writing the chat to logs/chat.log"),
        ("c", "clear the held lines on this screen"),
        ("p", "toggle raw /net/poll lines in the request log"),
        ("e", "toggle mirroring log lines to this terminal"),
        ("n", "cycle the room filter (chat screen)"),
        ("?", "this list"),
        ("q", "back to the menu, or quit from the menu"),
    ]

    def __init__(self) -> None:
        self.screen = "menu"
        self.running = False
        self.thread: threading.Thread | None = None
        self.room_filter: str | None = None
        self.stop_flag = threading.Event()
        self._raw = None
        self._active = False

    # -- the safety check --------------------------------------------------
    @staticmethod
    def wanted() -> bool:
        if os.environ.get("LG_MENU") == "0":
            return False
        try:
            return bool(sys.stdin.isatty() and sys.stdout.isatty())
        except (ValueError, AttributeError):
            return False

    def owns_screen(self) -> bool:
        """True while a live screen is painting, so nothing else writes over it."""
        return self._active and self.screen != "menu"

    # -- terminal ----------------------------------------------------------
    def _size(self) -> tuple[int, int]:
        """Columns and rows, with a floor.

        A pty that was never given a winsize reports 0x0, and Termux in
        portrait is genuinely narrow, so the floor is doing real work rather
        than guarding a theoretical case. COLUMNS/LINES are honoured as a
        fallback because that is what a terminal multiplexer sets."""
        cols = rows = 0
        try:
            sz = os.get_terminal_size()
            cols, rows = sz.columns, sz.lines
        except OSError:
            pass
        if cols <= 0:
            try:
                cols = int(os.environ.get("COLUMNS", "0"))
            except ValueError:
                cols = 0
        if rows <= 0:
            try:
                rows = int(os.environ.get("LINES", "0"))
            except ValueError:
                rows = 0
        return max(44, cols or 80), max(14, rows or 24)

    def _enter_raw(self):
        try:
            import termios, tty
            fd = sys.stdin.fileno()
            self._raw = (fd, termios.tcgetattr(fd))
            tty.setcbreak(fd)
            return True
        except Exception:
            self._raw = None
            return False

    def _exit_raw(self):
        if not self._raw:
            return
        try:
            import termios
            fd, saved = self._raw
            termios.tcsetattr(fd, termios.TCSADRAIN, saved)
        except Exception:
            pass
        self._raw = None

    def _key(self, timeout: float) -> str | None:
        """One keypress, or None if `timeout` passed with nothing typed."""
        try:
            import select
            ready, _, _ = select.select([sys.stdin], [], [], timeout)
            if not ready:
                return None
            if self._raw:
                return sys.stdin.read(1)
            line = sys.stdin.readline()
            return (line.strip()[:1] or "\n") if line else "q"
        except Exception:
            time.sleep(timeout)
            return None

    def _write(self, s: str) -> None:
        try:
            sys.stdout.write(s)
            sys.stdout.flush()
        except (BrokenPipeError, ValueError):
            self.stop_flag.set()

    # -- chrome ------------------------------------------------------------
    def _frame(self, title: str, w: int, sub: str = "") -> list:
        head = f"{C.bold}{C.accent}LIVING GALAXY{C.reset}{C.dim} · Ad Astrum {VERSION}{C.reset}"
        right = f"{C.dim}{time.strftime('%H:%M:%S')}{C.reset}"
        pad = max(1, w - visible_len(head) - visible_len(right))
        rows = [head + " " * pad + right, f"{C.dark}{'─' * w}{C.reset}"]
        line = f"{C.bold}{C.white}{title}{C.reset}"
        if sub:
            line += f"   {C.dim}{sub}{C.reset}"
        rows.append(line)
        rows.append("")
        return rows

    @staticmethod
    def _keys(pairs: list) -> str:
        return "  ".join(f"{C.bold}{C.yellow}{k}{C.reset}{C.dim}·{lbl}{C.reset}" for k, lbl in pairs)

    def _paint(self, rows: list, w: int, h: int) -> None:
        out = [HOME]
        for i in range(h - 1):
            out.append(fit(rows[i], w) if i < len(rows) else "")
            out.append(CLEAR_LINE + "\n")
        self._write("".join(out))

    # -- screens -----------------------------------------------------------
    def _menu_rows(self, w: int) -> list:
        s = STATS.snapshot()
        rows = self._frame("CONSOLE", w)
        rows.append(f"  {C.dim}Serving{C.reset} {C.white}{ROOT}{C.reset}")
        rows.append(f"  {C.dim}Listening{C.reset} {C.cyan}http://127.0.0.1:{PORT}/{C.reset}")
        for ip in LAN_IPS:
            rows.append(f"  {C.dim}Wi-Fi{C.reset}     {C.cyan}http://{ip}:{PORT}/{C.reset}")
        rows.append("")
        rows.append(f"  {C.green}up {dur(s['up'])}{C.reset}   {C.white}{s['requests']:,}{C.reset}{C.dim} requests{C.reset}   "
                    f"{C.white}{human(s['bytes'])}{C.reset}{C.dim} served{C.reset}   "
                    f"{(C.red if s['errors'] else C.dim)}{s['errors']} errors{C.reset}")
        rows.append("")
        rows.append(f"  {C.bold}{C.yellow}1{C.reset}  {C.white}STATISTICS{C.reset}  {C.dim}live throughput, rooms, pilots, ledger{C.reset}")
        rows.append(f"  {C.bold}{C.yellow}2{C.reset}  {C.white}CHAT LOG{C.reset}    {C.dim}hails and lines crossing the relay{C.reset}")
        rows.append(f"  {C.bold}{C.yellow}3{C.reset}  {C.white}REQUEST LOG{C.reset} {C.dim}what the browser is fetching{C.reset}")
        rows.append("")
        rows.append(f"  {C.bold}{C.yellow}?{C.reset}  {C.dim}keys{C.reset}        {C.bold}{C.yellow}q{C.reset}  {C.dim}stop the server{C.reset}")
        return rows

    def _stats_rows(self, w: int) -> list:
        s = STATS.snapshot()
        rooms = RELAY.describe()
        cr = CRADLE.describe()
        rows = self._frame("STATISTICS", w, "live · updates twice a second")

        def kv(label, value, colour=""):
            return f"  {C.dim}{label:<11}{C.reset}{colour}{value}{C.reset}"

        # throughput
        rows.append(f"  {C.bold}{C.accent}THROUGHPUT{C.reset}")
        rows.append(kv("uptime", dur(s["up"]), C.white))
        rows.append(kv("requests", f"{s['requests']:,}  {C.dim}({s['paths']} distinct paths){C.reset}", C.white))
        rows.append(kv("now", f"{s['rps']:.1f}/s  {C.dim}· 60s avg {s['rps60']:.1f}/s{C.reset}", C.green))
        rows.append(kv("traffic", f"{human(s['bytes'])}  {C.dim}· {human(s['bps'])}/s now{C.reset}", C.white))
        rows.append(kv("latency", f"p50 {s['p50']:.1f}ms   p95 {s['p95']:.1f}ms   "
                                  f"{C.dim}worst {s['slowest'][0]:.0f}ms {s['slowest'][1]}{C.reset}", C.white))
        peak = max(s["spark"]) if s["spark"] else 0
        if peak:
            spark = "".join(" ▁▂▃▄▅▆▇█"[min(8, int(v / peak * 8))] for v in s["spark"])
            rows.append(kv("last 40s", f"{C.green}{spark}{C.reset}{C.dim} peak {int(peak)}/s{C.reset}"))
        rows.append("")

        # status mix
        rows.append(f"  {C.bold}{C.accent}RESPONSES{C.reset}")
        total = max(1, sum(s["status"].values()))
        for code in sorted(s["status"]):
            n = s["status"][code]
            colour = C.green if code < 300 else C.cyan if code < 400 else C.yellow if code < 500 else C.red
            rows.append(f"  {colour}{code}{C.reset} {bar(n / total, max(8, w - 34), colour)} "
                        f"{C.white}{n:>7,}{C.reset}{C.dim} {n / total * 100:4.1f}%{C.reset}")
        if s["method"]:
            rows.append(kv("methods", "  ".join(f"{C.white}{m}{C.reset}{C.dim}×{n:,}{C.reset}" for m, n in sorted(s["method"].items()))))
        rows.append("")

        # the relay
        rows.append(f"  {C.bold}{C.accent}RELAY{C.reset}   {C.dim}{len(rooms)} room(s){C.reset}")
        if not rooms:
            rows.append(f"  {C.dim}nobody has joined a sky yet{C.reset}")
        for r in rooms[:6]:
            live = r["pilots"]
            colour = C.green if live else C.dark
            rows.append(f"  {colour}●{C.reset} {C.white}{r['name']:<12}{C.reset}"
                        f"{C.dim}pilots{C.reset} {C.white}{live}{C.reset}  "
                        f"{C.dim}seq{C.reset} {r['seq']:<6} "
                        f"{C.dim}host{C.reset} {C.cyan}{(r['host'] or '—')[:14]}{C.reset}  "
                        f"{C.dim}world{C.reset} {r['wseq']}")
        rows.append(kv("messages", f"{s['chat_msgs']:,} relayed   {C.dim}· {s['worlds']:,} world snapshots{C.reset}", C.white))
        rows.append("")

        # the ledger and the model
        rows.append(f"  {C.bold}{C.accent}LEDGER{C.reset}")
        rows.append(kv("records", f"{cr['records']:,}  {C.dim}cap {cr['cap'] or '∞'}{C.reset}", C.white))
        rows.append(kv("writes", f"{s['cradle_puts']:,} accepted   {C.dim}· {cr['flushes']} flushes to disk{C.reset}", C.white))
        if s["llm_calls"]:
            rows.append(kv("llm proxy", f"{s['llm_calls']:,} calls   "
                                        f"{(C.red if s['llm_fails'] else C.dim)}{s['llm_fails']} failed{C.reset}", C.white))
        rows.append("")
        rows.append(f"  {C.bold}{C.accent}BUSIEST PATHS{C.reset}")
        top = s["top"]
        cap = max(1, top[0][1]) if top else 1
        for path, n in top[:6]:
            rows.append(f"  {C.dim}{path[:34]:<34}{C.reset} {bar(n / cap, max(6, w - 52), C.blue)} {C.white}{n:>7,}{C.reset}")
        rows.append("")
        rows.append(self._keys([("r", "reset counters"), ("2", "chat"), ("3", "log"), ("q", "back")]))
        return rows

    def _chat_rows(self, w: int) -> list:
        info = CHAT.summary()
        sub = f"{info['held']} held" + (f" · room {self.room_filter}" if self.room_filter else " · all rooms")
        rows = self._frame("CHAT LOG", w, sub)
        state = f"{C.green}ON{C.reset}" if info["to_file"] else f"{C.dark}off{C.reset}"
        rows.append(f"  {C.dim}to file{C.reset} {state} {C.dim}{os.path.relpath(info['path'], ROOT)}{C.reset}"
                    f"   {C.dim}written{C.reset} {C.white}{info['written']:,}{C.reset}")
        if info["kinds"]:
            rows.append(f"  {C.dim}kinds{C.reset}   " + "  ".join(
                f"{C.magenta}{k}{C.reset}{C.dim}×{n}{C.reset}" for k, n in sorted(info["kinds"].items(), key=lambda kv: -kv[1])[:6]))
        rows.append("")
        body = max(4, (self._size()[1] - len(rows) - 3))
        items = CHAT.recent(self.room_filter, body)
        if not items:
            rows.append(f"  {C.dim}No hails yet. Anything a pilot says on the open channel,{C.reset}")
            rows.append(f"  {C.dim}every beacon and every comms line lands here as it is sent.{C.reset}")
        for e in items:
            when = time.strftime("%H:%M:%S", time.localtime(e["at"]))
            who = e["from"][:14]
            dest = f"{C.dim}→{e['to'][:10]}{C.reset}" if e["to"] else ""
            rows.append(f"  {C.dark}{when}{C.reset} {C.dim}[{e['room'][:8]}]{C.reset} "
                        f"{C.cyan}{who}{C.reset}{dest} {C.magenta}{e['kind'][:8]}{C.reset}  {C.white}{e['text']}{C.reset}")
        while len(rows) < self._size()[1] - 2:
            rows.append("")
        rows.append(self._keys([("f", "file " + ("off" if info["to_file"] else "on")), ("n", "room"), ("c", "clear"), ("q", "back")]))
        return rows

    def _log_rows(self, w: int) -> list:
        info = LOG.summary()
        rows = self._frame("REQUEST LOG", w, f"{info['written']:,} lines written this run")
        polls = f"{C.green}RAW{C.reset}" if info["log_polls"] else f"{C.dark}rolled up{C.reset}"
        echo = f"{C.green}on{C.reset}" if info["echo"] else f"{C.dark}off{C.reset}"
        rows.append(f"  {C.dim}file{C.reset}  {C.white}{os.path.relpath(info['file'], ROOT)}{C.reset}"
                    f"   {C.dim}keep{C.reset} {info['keep'] or 'all'}")
        rows.append(f"  {C.dim}polls{C.reset} {polls}   {C.dim}pending{C.reset} {info['pending']}"
                    f"   {C.dim}summaries{C.reset} {info['rolls']}   {C.dim}echo{C.reset} {echo}")
        rows.append("")
        body = max(4, (self._size()[1] - len(rows) - 3))
        for at, level, text in LOG.recent(body):
            when = time.strftime("%H:%M:%S", time.localtime(at))
            colour = C.red if level == "error" else C.blue if level == "net" else C.white
            if " 404 " in text or "ERROR" in text:
                colour = C.red
            elif " 304 " in text:
                colour = C.dim
            rows.append(f"  {C.dark}{when}{C.reset} {colour}{text}{C.reset}")
        while len(rows) < self._size()[1] - 2:
            rows.append("")
        rows.append(self._keys([("p", "raw polls"), ("e", "echo"), ("c", "clear"), ("q", "back")]))
        return rows

    def _help_rows(self, w: int) -> list:
        rows = self._frame("KEYS", w)
        for k, lbl in self.HELP:
            rows.append(f"   {C.bold}{C.yellow}{k}{C.reset}   {C.white}{lbl}{C.reset}")
        rows.append("")
        rows.append(f"  {C.dim}The console opens only on a terminal. Redirect stdout — as every{C.reset}")
        rows.append(f"  {C.dim}script here does — and the server serves silently instead.{C.reset}")
        rows.append(f"  {C.dim}LG_MENU=0 forces that; NO_COLOR=1 keeps the console, drops colour.{C.reset}")
        rows.append("")
        rows.append(self._keys([("q", "back")]))
        return rows

    # -- the loop ----------------------------------------------------------
    def _rows_for(self, w: int) -> list:
        if self.screen == "stats":
            return self._stats_rows(w)
        if self.screen == "chat":
            return self._chat_rows(w)
        if self.screen == "log":
            return self._log_rows(w)
        if self.screen == "help":
            return self._help_rows(w)
        return self._menu_rows(w)

    def _handle(self, k: str) -> bool:
        """→ False to stop the server."""
        if k in ("\x03", "\x04"):          # ^C, ^D
            return False
        if k == "q":
            if self.screen == "menu":
                return False
            self.screen = "menu"
            return True
        if k == "1":
            self.screen = "stats"
        elif k == "2":
            self.screen = "chat"
        elif k == "3":
            self.screen = "log"
        elif k == "?":
            self.screen = "help"
        elif k == "r" and self.screen == "stats":
            STATS.reset()
        elif k == "f" and self.screen == "chat":
            CHAT.set_file(not CHAT.summary()["to_file"])
        elif k == "n" and self.screen == "chat":
            names = [r["name"] for r in RELAY.describe()]
            if names:
                nxt = None if self.room_filter == names[-1] else (
                    names[0] if self.room_filter is None else names[min(names.index(self.room_filter) + 1, len(names) - 1)]
                    if self.room_filter in names else names[0])
                self.room_filter = nxt
            else:
                self.room_filter = None
        elif k == "c":
            if self.screen == "chat":
                CHAT.clear()
            elif self.screen == "log":
                with LOG.lock:
                    LOG.ring.clear()
        elif k == "p" and self.screen == "log":
            LOG.set_polls(not LOG.summary()["log_polls"])
        elif k == "e" and self.screen == "log":
            LOG.set_echo(not LOG.summary()["echo"])
        return True

    def run(self) -> None:
        self._active = True
        self._enter_raw()
        self._write(HIDE_CURSOR + CLEAR)
        try:
            while not self.stop_flag.is_set():
                w, h = self._size()
                self._paint(self._rows_for(w), w, h)
                k = self._key(self.TICK)
                if k is None:
                    continue
                if not self._handle(k):
                    break
        except Exception as e:                       # never take the server down with us
            self._write(SHOW_CURSOR + "\n")
            sys.stderr.write(f"console stopped: {e}\n")
        finally:
            self._active = False
            self._write(SHOW_CURSOR + "\n")
            self._exit_raw()
            SHUTDOWN.set()

    def start(self) -> None:
        self.thread = threading.Thread(target=self.run, name="console", daemon=True)
        self.thread.start()


CONSOLE = Console()
SHUTDOWN = threading.Event()
LAN_IPS: list = []

def _referer_path(ref: str | None) -> str:
    """Strip scheme://host from a same-server Referer so the log stays short."""
    if not ref:
        return "-"
    if "://" in ref:
        rest = ref.split("://", 1)[1]
        return "/" + rest.split("/", 1)[1] if "/" in rest else "/"
    return ref


class Relay:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.rooms: dict[str, dict] = {}
        self.swept = time.time()

    def _room(self, name: str) -> dict:
        r = self.rooms.get(name)
        if r is None:
            # born: when this sky first had a pilot in it — the shared clock's zero.
            # world: the host's last snapshot of everything that has happened to the sky.
            # last: the last send/poll/world write, so an abandoned room can be forgotten.
            r = {"states": {}, "msgs": deque(maxlen=MSG_KEEP), "seq": 0, "born": time.time(), "world": None, "wseq": 0, "world_at": 0.0, "last": time.time()}
            self.rooms[name] = r
        return r

    def _sweep(self, now: float) -> None:
        """Under the lock: drop rooms with no live pilot and nothing heard for ROOM_TTL."""
        if now - self.swept < ROOM_SWEEP:
            return
        self.swept = now
        dead = [
            name for name, r in self.rooms.items()
            if now - r["last"] > ROOM_TTL and not any(now - v["at"] <= STATE_TTL for v in r["states"].values())
        ]
        for name in dead:
            del self.rooms[name]

    def send(self, room: str, sender: str, kind: str, to: str | None, data) -> int:
        now = time.time()
        with self.lock:
            r = self._room(room)
            r["last"] = now
            if kind == "state":
                have = r["states"].get(sender)
                # `since` is when this pilot first showed up; the longest-present live pilot hosts
                r["states"][sender] = {"at": now, "data": data, "since": have["since"] if have else now}
                STATS.note("states")
                return r["seq"]
            r["seq"] += 1
            r["msgs"].append({"seq": r["seq"], "from": sender, "to": to, "data": data, "at": now})
            seq = r["seq"]
        # Outside the lock: the chat book has its own, and may write a file.
        CHAT.add(room, sender, to, data)
        return seq

    def poll(self, room: str, me: str, since: int) -> dict:
        now = time.time()
        with self.lock:
            self._sweep(now)
            r = self._room(room)
            r["last"] = now
            dead = [k for k, v in r["states"].items() if now - v["at"] > STATE_TTL]
            for k in dead:
                del r["states"][k]
            states = {k: v["data"] for k, v in r["states"].items() if k != me}
            # since < 0 is a fresh join: hand back the cursor only, never the ring
            msgs = [] if since < 0 else [m for m in r["msgs"] if m["seq"] > since and m["from"] != me and (m["to"] in (None, "", me))]
            host = min(r["states"].items(), key=lambda kv: kv[1]["since"])[0] if r["states"] else None
            return {
                "now": now,
                "seq": r["seq"],
                "states": states,
                "msgs": msgs,
                "born": r.get("born", now),
                "pilots": len(r["states"]),
                "host": host,
                "wseq": r["wseq"],
            }

    def put_world(self, room: str, sender: str, world) -> int:
        """The host's snapshot of the sky. Last write wins; clients only write when they host."""
        with self.lock:
            r = self._room(room)
            r["world"] = world
            r["wseq"] += 1
            r["world_at"] = time.time()
            r["last"] = r["world_at"]
            r["world_by"] = sender
            return r["wseq"]

    def get_world(self, room: str) -> dict:
        with self.lock:
            r = self._room(room)
            return {"wseq": r["wseq"], "world": r["world"], "at": r["world_at"], "by": r.get("world_by"), "born": r["born"], "now": time.time()}

    def describe(self) -> list:
        """One row per room for the console's STATISTICS screen.

        Computed under the same lock the relay itself uses, and returning
        plain values rather than the live dicts — the console thread must
        never end up iterating a room while a handler thread is writing to
        it."""
        now = time.time()
        with self.lock:
            out = []
            for name, r in self.rooms.items():
                live = {k: v for k, v in r["states"].items() if now - v["at"] <= STATE_TTL}
                host = min(live.items(), key=lambda kv: kv[1]["since"])[0] if live else None
                out.append({
                    "name": name,
                    "pilots": len(live),
                    "seq": r["seq"],
                    "host": host,
                    "wseq": r["wseq"],
                    "age": now - r.get("born", now),
                    "idle": now - r.get("last", now),
                    "msgs": len(r["msgs"]),
                })
            out.sort(key=lambda d: (-d["pilots"], d["name"]))
            return out


RELAY = Relay()


class Cradle:
    """Shared CRADLE ledger — Crew Registry And Digital Ledger of Entities.

    The one thing this server writes to disk: `cradle.json` next to server.py,
    one record per simulated individual, keyed by id. Rooms (skies) share the
    file; a record carries `born` so a sky can be filtered on the client.
    Delete the file to forget everyone."""

    PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cradle.json")

    def __init__(self):
        self.lock = threading.Lock()
        self.records = {}
        self.dirty = False
        self.readonly = False        # set when the on-disk ledger must not be written over
        try:
            with open(self.PATH, "r", encoding="utf-8") as f:
                for r in json.load(f).get("records", []):
                    if isinstance(r, dict) and r.get("id"):
                        self.records[r["id"]] = r
        except FileNotFoundError:
            pass                      # first run: there is nobody yet, which is fine
        except (OSError, ValueError) as e:
            # A ledger that exists but will not parse is the ONE case worth
            # shouting about. `json.JSONDecodeError` is a ValueError, so this
            # used to be swallowed silently — and then the first put marked the
            # ledger dirty and the next flush wrote a one-record file over the
            # top of it. Everyone who ever existed, gone, with no log line.
            # Set it aside under a timestamp and carry on with an empty ledger.
            keep = f"{self.PATH}.corrupt-{time.strftime('%Y%m%d-%H%M%S')}"
            try:
                os.replace(self.PATH, keep)
                print(f"Cradle: {os.path.basename(self.PATH)} would not parse ({e}).")
                print(f"        Kept as {os.path.basename(keep)}; starting a fresh ledger.")
            except OSError:
                # cannot move it: refuse to write rather than destroy it
                self.readonly = True
                print(f"Cradle: {os.path.basename(self.PATH)} is unreadable AND cannot be moved aside.")
                print("        The shared ledger is disabled this run so the file is not overwritten.")
            self.records.clear()
        # An existing cradle.json is full of the employment flags this server
        # used to store. Clean it on the way in rather than asking anyone to
        # delete the file: the people in it are worth keeping, the jobs are not.
        freed = 0
        for rid, r in self.records.items():
            clean = self._unemploy(r)
            if clean is not r:
                self.records[rid] = clean
                freed += 1
        if freed:
            self.dirty = True
            print(f"Cradle: released {freed} stale crew record(s) — employment is a client's, not the sky's")
        # puts only mark the ledger dirty; this thread writes it every CRADLE_FLUSH s, outside the lock
        threading.Thread(target=self._flusher, name="cradle-flush", daemon=True).start()
        atexit.register(self.flush)

    # A record carries `status` and `employer` while somebody is crewing a ship.
    # That is true of ONE client's run and of nothing else, and this file is
    # the thing that survives a restart — so writing it here means a hand who
    # signed on with you last Tuesday is still filed as aboard your ship on
    # every device in the sky, forever, under a callsign that may not exist any
    # more. It emptied the hiring halls (they draw from the pool) and it put
    # retired pilots' names on other people's crew lists.
    #
    # An NPC captaining their own hull is the exception and is kept: they are
    # filed as `captain` with THEMSELVES as the employer, which is a fact about
    # the sky rather than about anyone's run.
    @staticmethod
    def _unemploy(rec):
        status = rec.get("status")
        if status not in ("aboard", "captain"):
            return rec
        employer = rec.get("employer")
        if employer is not None and employer != rec.get("name"):
            rec = dict(rec)
            rec["status"] = "pool"
            rec["employer"] = None
        return rec

    def put(self, rec):
        if not isinstance(rec, dict) or not isinstance(rec.get("id"), str) or not rec["id"]:
            return False
        if rec.get("history") is not None and not isinstance(rec["history"], list):
            return False
        rec = self._unemploy(rec)
        with self.lock:
            have = self.records.get(rec["id"])
            if have and len(have.get("history") or []) > len(rec.get("history") or []):
                return True  # the server knows more than the client; keep it
            if have and have.get("brain") and not rec.get("brain"):
                rec["brain"] = have["brain"]
            self.records[rec["id"]] = rec
            self.dirty = True
        return True

    def describe(self) -> dict:
        """Ledger size and write activity, for the STATISTICS screen."""
        with self.lock:
            return {
                "records": len(self.records),
                "cap": CRADLE_MAX,
                "flushes": getattr(self, "flushes", 0),
                "dirty": bool(getattr(self, "dirty", False)),
            }

    def all(self, room=""):
        with self.lock:
            if not room:
                return list(self.records.values())
            return [r for r in self.records.values()
                    if not r.get("born") or r.get("born") == room]

    def prune(self):
        """Keep the ledger bounded.

        It only ever grew: one record per individual the sky has ever produced,
        no cap and no eviction, and the file is the thing that survives a
        restart. A few hundred hours of play is tens of megabytes that every
        joiner downloads and parses.

        What goes first is what is cheapest to lose: somebody with no brain, no
        journal and a short history is a face in a crowd the generator will
        happily make again. Somebody who has held command (a `brain`), or who
        has a history worth reading, is the whole point of keeping a ledger and
        is kept until there is nothing else to give up."""
        with self.lock:
            if len(self.records) <= CRADLE_MAX:
                return 0
            def weight(r):
                return (
                    1 if r.get("brain") else 0,
                    min(len(r.get("journal") or []), 12),
                    min(len(r.get("history") or []), 60),
                    r.get("bornAt") or 0,
                )
            ordered = sorted(self.records.values(), key=weight)
            drop = len(self.records) - CRADLE_MAX
            for r in ordered[:drop]:
                self.records.pop(r["id"], None)
            self.dirty = True
            return drop

    def _flusher(self):
        while True:
            time.sleep(CRADLE_FLUSH)
            if CRADLE_MAX > 0:
                n = self.prune()
                if n:
                    LOG.line(f"CRADLE pruned {n} record(s) — ledger capped at {CRADLE_MAX}")
            self.flush()

    def flush(self):
        """Write the ledger if anything changed: snapshot under the lock, serialise and replace outside it."""
        if self.readonly:
            return
        with self.lock:
            if not self.dirty:
                return
            self.dirty = False
            records = list(self.records.values())
        tmp = self.PATH + ".tmp"
        try:
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump({"cradle": 1, "records": records}, f)
            os.replace(tmp, self.PATH)
            self.flushes = getattr(self, "flushes", 0) + 1
        except (OSError, ValueError):
            with self.lock:
                self.dirty = True  # try again next round


CRADLE = Cradle()

class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".json": "application/json",
        ".wasm": "application/wasm",
        ".css": "text/css",
        ".svg": "image/svg+xml",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    # ---- logging ---------------------------------------------------------
    def send_response(self, code, message=None):
        self._status = code
        super().send_response(code, message)

    def send_header(self, keyword, value):
        if keyword.lower() == "content-length":
            self._bytes = value
        super().send_header(keyword, value)

    def _log_hit(self, method: str) -> None:
        u = urlparse(self.path)
        client = self.address_string()
        ms = (time.time() - getattr(self, "_t0", time.time())) * 1000
        status = getattr(self, "_status", "-")
        size = getattr(self, "_bytes", "-")
        try:
            nbytes = int(size)
        except (TypeError, ValueError):
            nbytes = 0
        # Every hit counts toward the statistics, including the polls that are
        # rolled up in the file — the whole point of the STATS screen is to
        # show the traffic the log deliberately summarises away.
        STATS.hit(method, status, u.path, nbytes, ms)
        # `log_polls` is read off LOG rather than the module constant so the
        # console's `p` key can turn raw poll lines on mid-run.
        if u.path in ("/net/poll", "/net/ping") and not LOG.log_polls:
            return LOG.quiet_hit(u.path, client)
        ref = _referer_path(self.headers.get("Referer"))
        chatty = u.path.startswith("/net/") or u.path.startswith("/cradle/")
        level = "error" if isinstance(status, int) and status >= 400 else ("net" if chatty else "info")
        LOG.line(
            f"{client}  {method} {status}  {size}B  {ms:.1f}ms  target={u.path}  from={ref}",
            echo=not chatty,
            level=level,
        )

    # ---- relay -----------------------------------------------------------
    def _json(self, code: int, obj) -> None:
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self._t0 = time.time()
        try:
            return self._get()
        finally:
            self._log_hit("GET")

    def _get(self):
        u = urlparse(self.path)
        if u.path == "/net/poll":
            q = parse_qs(u.query)
            room = (q.get("room") or ["sol"])[0][:32]
            me = (q.get("self") or [""])[0][:48]
            try:
                since = int((q.get("since") or ["0"])[0])
            except ValueError:
                since = 0
            return self._json(200, RELAY.poll(room, me, since))
        if u.path == "/net/ping":
            return self._json(200, {"ok": True, "now": time.time()})
        if u.path == "/net/world":
            q = parse_qs(u.query)
            room = (q.get("room") or ["sol"])[0][:32]
            return self._json(200, RELAY.get_world(room))
        if u.path == "/cradle/all":
            q = parse_qs(u.query)
            room = (q.get("room") or [""])[0][:32]
            # The client has always sent ?room=<sky seed> and this endpoint has
            # always ignored it, handing every joiner the ENTIRE ledger — every
            # sky, every session, growing without limit. On a phone that is the
            # whole join stall. A record's `born` is its sky; records without
            # one predate the field and belong to everybody.
            return self._json(200, {"cradle": 1, "records": CRADLE.all(room)})
        return super().do_GET()

    def do_POST(self):
        self._t0 = time.time()
        try:
            return self._post()
        finally:
            self._log_hit("POST")

    def _post(self):
        u = urlparse(self.path)
        if u.path == "/llm/proxy":
            # Pass-through to a llama.cpp on this machine, so the browser needs
            # no CORS flag on llama-server. Loopback only, on purpose.
            try:
                n = int(self.headers.get("Content-Length", "0"))
                if n <= 0 or n > MAX_BODY * 4:
                    return self._json(413, {"error": "body size"})
                body = json.loads(self.rfile.read(n).decode("utf-8"))
                if not isinstance(body, dict):
                    return self._json(400, {"error": "object body required"})
                port = int(body.pop("_port", 8081))
                path = str(body.pop("_path", "/completion"))
                if not path.startswith("/"):
                    return self._json(400, {"error": "bad path"})
                import urllib.request
                req = urllib.request.Request(
                    f"http://127.0.0.1:{port}{path}",
                    data=json.dumps(body).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                STATS.note("llm_calls")
                with urllib.request.urlopen(req, timeout=20) as r:
                    return self._json(200, json.loads(r.read().decode("utf-8")))
            except Exception as e:  # noqa: BLE001 — surface whatever the model server said
                STATS.note("llm_fails")
                return self._json(502, {"error": str(e)})
        if u.path == "/cradle/put":
            try:
                n = int(self.headers.get("Content-Length", "0"))
                if n <= 0 or n > MAX_BODY * 4:
                    return self._json(413, {"error": "body size"})
                body = json.loads(self.rfile.read(n).decode("utf-8"))
                if not isinstance(body, dict):
                    return self._json(400, {"error": "object body required"})
                ok = CRADLE.put(body.get("record"))
                if ok:
                    STATS.note("cradle_puts")
                return self._json(200 if ok else 400, {"ok": ok})
            except (ValueError, UnicodeDecodeError) as e:
                return self._json(400, {"error": str(e)})
        if u.path == "/net/world":
            try:
                n = int(self.headers.get("Content-Length", "0"))
                if n <= 0 or n > MAX_BODY * 8:
                    return self._json(413, {"error": "body size"})
                body = json.loads(self.rfile.read(n).decode("utf-8"))
                if not isinstance(body, dict):
                    return self._json(400, {"error": "object body required"})
                room = str(body.get("room", "sol"))[:32]
                sender = str(body.get("from", ""))[:48]
                if not sender or not isinstance(body.get("world"), dict):
                    return self._json(400, {"error": "from and world required"})
                STATS.note("worlds")
                return self._json(200, {"ok": True, "wseq": RELAY.put_world(room, sender, body["world"])})
            except (ValueError, UnicodeDecodeError) as e:
                return self._json(400, {"error": str(e)})
        if u.path != "/net/send":
            return self._json(404, {"error": "no such endpoint"})
        try:
            n = int(self.headers.get("Content-Length", "0"))
            if n <= 0 or n > MAX_BODY:
                return self._json(413, {"error": "body size"})
            msg = json.loads(self.rfile.read(n).decode("utf-8"))
            if not isinstance(msg, dict):
                return self._json(400, {"error": "object body required"})
            room = str(msg.get("room", "sol"))[:32]
            sender = str(msg.get("from", ""))[:48]
            kind = "state" if msg.get("kind") == "state" else "msg"
            to = msg.get("to")
            to = str(to)[:48] if to else None
            if not sender:
                return self._json(400, {"error": "from required"})
            seq = RELAY.send(room, sender, kind, to, msg.get("data"))
            return self._json(200, {"ok": True, "seq": seq})
        except (ValueError, UnicodeDecodeError) as e:
            return self._json(400, {"error": str(e)})

    def log_message(self, fmt, *args):
        return  # _log_hit writes the real log; the base class line would double it

    def log_error(self, fmt, *args):
        LOG.line(f"{self.address_string()}  ERROR {fmt % args}  target={self.path}", echo=True, level="error")


def _lan_ips():
    """Best-effort list of non-loopback IPv4 addresses, for the phone on the same Wi-Fi."""
    import socket
    ips = set()
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ip = info[4][0]
            if not ip.startswith("127."):
                ips.add(ip)
    except OSError:
        pass
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ips.add(s.getsockname()[0])
        s.close()
    except OSError:
        pass
    return sorted(ips)


def main():
    global LAN_IPS
    os.chdir(ROOT)
    LAN_IPS = _lan_ips()
    # LG_HOST=127.0.0.1 keeps a relay behind a tunnel or proxy off the LAN
    # entirely (the site's deploy/lg-relay.service sets it); the default stays
    # open so a phone on Wi-Fi can be joined from the next device over.
    httpd = ThreadingHTTPServer((os.environ.get("LG_HOST", "0.0.0.0"), PORT), Handler)
    LOG.begin(f"SERVER START v{VERSION} run={LOG.run_id} port={PORT} pid={os.getpid()} root={ROOT}")

    console = Console.wanted()
    C.enable(console and os.environ.get("NO_COLOR") is None)

    if not console:
        # Headless, exactly as before: a scripted start redirects stdout, so
        # this is the path every browser smoke in test/ takes.
        print(f"LIVING GALAXY — Ad Astrum {VERSION}")
        print(f"        http://127.0.0.1:{PORT}/   (this device)")
        for ip in LAN_IPS:
            print(f"        http://{ip}:{PORT}/   (same Wi-Fi)")
        print(f"Logs:   {os.path.join('logs', LOG.name)}   (this run; LOG_POLLS=1 for raw poll lines, LOG_KEEP to change retention)")
        print("Open a URL in your browser. Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
            LOG.line("SERVER STOP")
            httpd.server_close()
        return

    server_thread = threading.Thread(target=httpd.serve_forever, name="http", daemon=True)
    server_thread.start()
    CONSOLE.start()
    try:
        while not SHUTDOWN.is_set():
            SHUTDOWN.wait(0.25)
    except KeyboardInterrupt:
        pass
    finally:
        CONSOLE.stop_flag.set()
        LOG.line("SERVER STOP")
        try:
            sys.stdout.write(SHOW_CURSOR)
            sys.stdout.flush()
        except (BrokenPipeError, ValueError):
            pass
        httpd.shutdown()
        httpd.server_close()
        print(f"Stopped. Log: {os.path.relpath(LOG.file, ROOT)}")


if __name__ == "__main__":
    main()
