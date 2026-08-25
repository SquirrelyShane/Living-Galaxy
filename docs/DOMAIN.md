# living-galaxy.com — putting the galaxy on your domain

Goal: anyone on the internet opens **https://living-galaxy.com** and is playing in your
galaxy — no port forwarding, your home IP never published, and a real trusted
certificate so nobody sees a browser warning.

The tool is a **Cloudflare Tunnel**: a small service (`cloudflared`) runs on the Legion
and keeps an *outbound* connection open to Cloudflare. Visitors hit Cloudflare;
Cloudflare hands the traffic down the tunnel to your server on `localhost:8765`. Nothing
inbound ever touches your router, which is why there is no port to forward and no IP to
leak. WebSockets (the game's live link) pass through by default. Free plan covers all of
it.

## One-time setup (~10 minutes)

1. **Domain on Cloudflare.** You bought it at Cloudflare, so it's already active there —
   nothing to do. (A domain from elsewhere would first need its nameservers pointed at
   Cloudflare.)

2. **Create the tunnel.** Go to `one.dash.cloudflare.com` (Zero Trust) → **Networks →
   Tunnels → Create a tunnel** → type **Cloudflared** → name it `living-galaxy`.

3. **Install the connector on the Legion.** On the next screen pick **Windows (64-bit)**.
   It shows a single command containing your tunnel token. Download the installer it
   offers (or `winget install --id Cloudflare.cloudflared`), then run the shown command
   in an **Administrator** PowerShell — it installs `cloudflared` as a Windows service,
   so the tunnel starts with the laptop from now on. The dashboard shows the connector
   as **Connected**.

4. **Route the hostname.** Still in the tunnel wizard, **Public Hostnames → Add**:
   - Subdomain: *(leave empty)* · Domain: `living-galaxy.com` · Path: *(empty)*
   - Service: Type **HTTPS**, URL `localhost:8765`
   - Expand **Additional application settings → TLS** and turn ON **No TLS Verify**.
     (Your server's certificate is self-signed for the LAN; Cloudflare shouldn't demand
     a public one from it. Traffic is still encrypted on every hop.)
   - Save. Optionally add `www` the same way.

5. **Play.** Start the galaxy as usual (`launch.cmd`). Players anywhere open
   **https://living-galaxy.com** — the server serves the game — and put
   **wss://living-galaxy.com** in the boot screen's server field. Real certificate,
   no warnings, no port numbers.

## How the pieces coexist

- **LAN players keep using `https://galaxy.local:8765`** — it's a straight shot across
  your Wi-Fi. Internet traffic goes out to Cloudflare and back, so on the same couch the
  local address is the lower-latency one.
- The tunnel is a doorway, not a second server: if `launch.cmd` isn't running, visitors
  get a Cloudflare error page until it is.
- The game's clock-sync pings (every 2 s) keep the WebSocket alive through Cloudflare's
  idle limits; nothing to configure.

## Now the whole internet can knock

Until now only your Wi-Fi could reach the galaxy. Things worth doing the day the domain
goes live:

- **Vault passphrase**: long. It protects every account and wallet at rest.
- Accounts are scrypt-hashed and resume tickets are signed — the protocol side is
  covered — but there is **no rate limiting** yet beyond Cloudflare's defaults. For an
  invite-only phase, add a **Cloudflare Access** policy (Zero Trust → Access) in front
  of the hostname: one email allow-list, and only your people ever reach the server.
- `/api/status` is public and shows pilot counts and system occupancy. Harmless today;
  fold it behind Access too if that ever feels like information.
- Watch `suspects` in `/api/status` — the motion guard exists precisely for strangers.

## If the tunnel misbehaves

- Dashboard shows the tunnel **Down** → the `cloudflared` service stopped: `services.msc`
  → *Cloudflared agent* → Start (or reboot; it's set to auto-start).
- Site loads but boot screen can't connect → the server field must say
  `wss://living-galaxy.com` (wss, no port). The https page loading proves the tunnel
  and server are both up.
- Cloudflare error 502/523 → tunnel is up but the galaxy isn't running, or the Public
  Hostname service isn't `https://localhost:8765` with No TLS Verify on.
