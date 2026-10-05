# ARIA dialogue on mpcbb

The game works without a model. ARIA's planner, learning, memory and authority
checks run as normal JavaScript. NAV → ARIA CORE → CONVERSATION makes one model
request only when you press ASK ARIA. If it fails, the structured ship log answers.
Model replies are displayed as text and never executed.

## Selected model and limits

Use **LFM2-700M, Q4_K_M** (the selected Q4KM quantization), not a thinking model.
The official Ollama model reference is:

```
hf.co/LiquidAI/LFM2-700M-GGUF:Q4_K_M
```

Each request has a 2,048-token context, at most 160 generated tokens and two CPU
threads. The relay permits one inference at a time across all pilots, with a
three-second cooldown. It sends one bounded current-state packet, not the full
CRADLE database or entire conversation. Ollama unloads idle weights after 60
seconds. The relay waits at most 35 seconds; the browser times out after 45.
Cancel stops waiting in the browser; an already-running server request may finish
within its timeout before another pilot can use the model.

For mpcbb's 5.6 GiB total / roughly 4 GiB available RAM, the included systemd
service caps the model process and its children at 2 GiB and 150% CPU with lower
priority. These are containment limits, not measured requirements or a speed
promise. This release has not been benchmarked on mpcbb. If the model cannot
start within those limits, the game still uses the ship-log fallback; inspect
the service log before changing limits. Swap is not treated as extra model RAM.

## Install on the mini-PC

First deploy this release's game files through your normal website deployment.
The model and relay should run together on the mini-PC. The public website must
forward `/llm/proxy` to that relay, as it does the other game API routes; do not
expose the Ollama listener itself. The game calls a same-origin URL, not a
player's `localhost`.

Install Ollama using its official Linux instructions if it is not already
installed: <https://ollama.com/download/linux>. Then, from the updated game repo
on mpcbb (for example `~/Desktop/Living-Galaxy-recovery`):

```bash
sudo install -m 644 server.py /srv/living-galaxy/relay/server.py
sudo bash deploy/install-aria.sh
```

The installer requires the existing `lg-relay.service`. It creates an
unprivileged `lgaria` account and a separate `lg-aria-model.service` listening on
**127.0.0.1:11435**, pulls the chosen model, and writes only the relay's ARIA
configuration drop-in. It does not edit an existing Ollama service. Port 11435
must be free. Rerunning updates the dedicated unit and ARIA drop-in.

After a successful model download it restarts `lg-relay`. The existing dependent
`lg-sol` service also restarts and resumes its persistent checkpoint. Schedule
that brief restart between active sessions if needed. The installer does not
copy your game web assets or change your website's proxy configuration.

Check the services:

```bash
systemctl --no-pager status lg-aria-model lg-relay lg-sol
journalctl -u lg-aria-model -n 60 --no-pager
```

Open NAV → ARIA CORE, ask “Why this job?”, and check that the reply source reads
**LFM2**. “Ship log” means the model or route is unavailable, busy or timed out;
ARIA can still fly. If the request never appears in the relay log, check the
website's `/llm/proxy` forwarding rule.

To disable model inference while retaining all Core features:

```bash
sudo systemctl stop lg-aria-model
```

For persistent disablement, set `LG_ARIA_ENABLED=0` in
`/etc/systemd/system/lg-relay.service.d/aria.conf`, run `sudo systemctl daemon-reload`
and restart `lg-relay`. To remove this optional installation, disable the model
service and remove only `lg-aria-model.service` and the `aria.conf` drop-in; keep
`sol.conf` and the Sol state database. Model files are in `/var/lib/lg-aria/models`.

## Existing Ollama installation / development

Alternatively, use an existing loopback Ollama on port 11434:

```bash
ollama pull hf.co/LiquidAI/LFM2-700M-GGUF:Q4_K_M
LG_ARIA_ENABLED=1 LG_BROWSER=0 python3 server.py 8080
```

`LG_ARIA_PORT` and `LG_ARIA_MODEL` are host-side settings. Browsers cannot choose
them, inject Ollama options, supply a URL/path, or follow a model-server redirect.
The old unrestricted `_port` / `_path` proxy body is replaced by the ARIA schema:

```json
{"aria":true,"question":"Why this job?","context":{"goal":"mine"}}
```

The body is limited to 8 KiB. Unknown fields are discarded. Facts sent by a
browser are descriptive, untrusted input: the model may be mistaken and does not
validate simulation state. The authoritative ship controls remain in the game.

References: [official model](https://huggingface.co/LiquidAI/LFM2-700M-GGUF),
[Ollama chat API](https://docs.ollama.com/api/chat).
