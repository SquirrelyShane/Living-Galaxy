> **0.3.64 upgrade:** Apply the changed-files-only overlay and follow `PATCH-0.3.64.md`. Re-run the service installer to remove the old installed startup flag. The persistent database and host token are retained.

# Persistent Sol — game 0.3.63 + website 0.2.3

## What you are installing
`lg-sol.service` runs the existing JavaScript world simulation in Node on mpcbb without a browser or logged-in player. `lg-relay.service` remains the network relay and now commits Sol checkpoints and GNN records to SQLite. The website reads the durable `/net/gnn` archive.

Install **both ZIPs**. The game package is a full update of the supplied 0.3.62 source, not the older three-file GNN patch. Node.js **22 or newer installed system-wide** is required on mpcbb. Python and systemd are already part of your existing deployment. No npm packages or browser download are required.

## 1. Save the current Sol snapshot before restarting the old relay
Run from Termux (or omit the SSH wrapper if already on mpcbb):

```sh
ssh mpcbb 'curl -fsS "http://127.0.0.1:8080/net/world?room=sol" > ~/Desktop/sol-before-persistence.json'
ssh mpcbb 'node --version'
```

Keep this JSON until the upgrade is verified. It captures the old relay's available world state; it cannot recover simulation details the old relay never stored. If it contains `"world": null`, the new service starts a fresh Sol simulation.

## 2. Update the website first
Extract the website ZIP, upload its contents to `~/Desktop/lgsite-deploy` as before, then run:

```sh
ssh -t mpcbb 'cd ~/Desktop/lgsite-deploy && sudo bash deploy/install.sh --only site && sudo systemctl restart lgsite'
```

Website 0.2.3 includes game-cache revalidation and modifies the game updater so an installed Sol service stops before game files change and starts after deployment. The GNN panel may show unavailable until the updated relay is installed.

## 3. Deploy game 0.3.63 through your existing game repository
Merge/copy the game ZIP contents into your existing game Git checkout, preserving `.git` and your remote. Commit and push the source changes to the branch your server tracks. Include `host/`, `deploy/install-sol.sh`, `server.py`, and the changed JavaScript modules. Then:

```sh
ssh mpcbb lg-deploy
```

Do not apply the old 0.3.60 three-file patch over this version. Existing player saves and the separate CRADLE/GDB files are not reset by this upgrade.

## 4. Enable the permanent host once
After game 0.3.63 is deployed:

```sh
ssh -t mpcbb 'sudo bash /srv/living-galaxy/game/deploy/install-sol.sh --seed "$HOME/Desktop/sol-before-persistence.json"'
```

If you intentionally want a fresh world and have no saved snapshot, omit `--seed` and its path. An existing persistent database is never overwritten by the seed option.

The installer creates a private shared host token, a relay environment drop-in and `lg-sol.service`. It restarts the relay and enables Sol at boot. The token stays on mpcbb; never put it in browser JavaScript, the game Git repository or a public ZIP. Only the service can publish Sol world checkpoints. Other rooms retain the original player-hosted behavior.

## 5. Verify with every game browser closed
Wait about 15 seconds, then:

```sh
ssh -t mpcbb 'sudo systemctl status lg-sol --no-pager'
ssh -t mpcbb 'sudo journalctl -u lg-sol -n 30 --no-pager'
ssh mpcbb 'curl -fsS http://127.0.0.1:8080/net/gnn'
ssh mpcbb 'curl -fsS http://127.0.0.1:8200/api/gnn'
```

The host logs `Sol host ready`. The archive includes an observatory-start/resume bulletin. Further simulation events publish as they occur; a system-watch bulletin reports actual station and active NPC counts every five simulation minutes. These are text broadcasts, not video or synthesized voice.

Reload players' game tabs after deployment. The relay returns `__sol_authority__` as Sol's host even with zero players. Players no longer replace it when the room empties. If the host service is stopped, the relay still serves archived news and the website eventually labels its snapshot delayed; players do not silently take over Sol.

## Persistence and limits
- Checkpoint approximately every five seconds; graceful service shutdown commits a final checkpoint. An abrupt machine loss can lose work since the last successful checkpoint.
- SQLite atomically stores the existing shared-world snapshot: world damage/craters, port state/losses, impactors, holes, and downed traffic. Extra host state preserves NPC hull poses, the observatory's local-storage data and station economy ledgers/stocks/credits.
- Latest 2,000 unique GNN records are retained; the public feed returns the latest 80, and the website displays up to 40. This is a bounded archive, not an unlimited history.
- The service advances Sol while running. During a machine outage simulation time pauses; it resumes from saved simulation time rather than inventing hours of catch-up events.
- This is not a conversion of every game mechanic to an authoritative MMO server. Existing player inventories/accounts, locally modeled market transactions, and unsynchronized gameplay remain governed by their current systems. Short-lived projectiles/effects and director-internal timers are regenerated rather than fully serialized. The traffic detail budget still derives from the observatory's simulation position.
- The host's token protects reserved host messages/checkpoints. The existing peer relay and player-reported vessel-down messages retain their previous trust model.
- Node runs as `lgsite` with a 1 GiB service memory limit. Actual long-running CPU/memory behavior must be monitored on mpcbb; a short integration test is not a production load test.

## 0.3.91 — which build, and the hulks

The host's ready line and status file name the game version it loaded and how
many hulks it holds:

```
Sol host ready: version=0.3.91 restored=true time=… stations=… hulks=…
```

so `journalctl -u lg-sol -n 5` answers "is Sol on the new build" without
reading the service's folder. Hulks are part of the checkpoint (`hostState.hulks`)
and are sent to every pilot in Sol every 8 seconds.

## Operations
State: `/srv/living-galaxy/relay/sol-state.sqlite3`.
Health summary: `/srv/living-galaxy/relay/sol-host-status.json`.
Private environment: `/etc/living-galaxy/sol.env`.

```sh
ssh -t mpcbb 'sudo systemctl restart lg-sol'
ssh -t mpcbb 'sudo journalctl -u lg-sol -f'
```

Include the SQLite database in backups. Use SQLite's backup API for a live copy, or stop `lg-sol` before copying it. Keep the existing relay CRADLE/GDB backups too. Do not run two Sol services against the same relay/token; systemd manages the single instance.

For rollback, stop/disable `lg-sol`, back up its database, remove `/etc/systemd/system/lg-relay.service.d/sol.conf`, run `systemctl daemon-reload`, restore the prior game/site sources and restart the relay/site. Removing the relay's Sol configuration returns room election to the original player-hosted model. Keep the persistent database for recovery.

## Validation
Automated tests exercise real Node simulation and a real Python relay with zero player connections; restart recovery; archive survival; host election; and rejection of unauthorized checkpoint/host writes. Existing website, relay and server regressions are also checked. Installation on your actual systemd host, real multi-browser play, and long-running stability remain deployment checks, not claims made by these local tests.
