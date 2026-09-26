# Patch 0.3.64 — overlay on 0.3.63

This ZIP contains changed/new files only, relative to the game root. It is not a complete installation. Extract it over your existing 0.3.63 source checkout, retaining all other files. It contains no nested old patch ZIP, player data or unchanged game tree.

## Fixes
- Relay publishes a deterministic structural `worldRevision` separately from `wseq`. Routine checkpoints, GNN changes, live rogue/traffic motion, thermal cooling, crater relaxation and ring settling do not change this revision. Planet damage/geometry, structural terraforming and port changes do.
- Clients fetch at initial join and when that revision changes, not every five-second checkpoint. Later repairs apply only changed body records and never replace live impactors, holes or downed-traffic state. The first sync also preserves a live update received before or during its request.
- The sync toast/log appears only once per join. Failed/empty snapshots remain retryable; responses from a previous join are discarded.
- Removed `--experimental-default-type=module` from the installed service. The host loader marks game `.js` files as ESM explicitly, including when the website deployment copier omits root `package.json`. The host itself remains `.mjs`.

## Install on your existing persistent Sol setup
1. Overlay this patch on your 0.3.63 Git checkout. Review/commit the changed files and push to the game branch your server tracks.
2. Deploy using `ssh mpcbb lg-deploy`.
3. Regenerate the already-installed service command (changing the installer file does not edit an existing systemd unit):

```sh
ssh -t mpcbb 'sudo bash /srv/living-galaxy/game/deploy/install-sol.sh'
```

No seed import or database reset is needed. The installer retains the existing token and persistent database. It restarts the relay/service. Website 0.2.3 remains compatible and needs no update. Reload game tabs so they receive the revised client modules.

Verify:

```sh
ssh mpcbb 'systemctl cat lg-sol | sed -n "/ExecStart=/p"'
ssh -t mpcbb 'sudo journalctl -u lg-sol -n 20 --no-pager'
```

ExecStart must have no default-type flag. GNN/system clock should keep advancing with no players. `wseq` continues increasing on saves; `worldRevision` stays unchanged until structural world state changes.

## Tests
- `node test/worldsync-revision.test.mjs` exercises the production client module with controlled transport and simulation dependencies: stable checkpoint revisions, changed-body repair, silent subsequent sync, preservation of live state, initial-sync races, retries, and reset during an in-flight fetch.
- `node --import ./test/three-register.mjs test/worldsync-live.test.mjs` checks the real simulation snapshot applier.
- `python3 test/world-revision.test.py` checks the actual relay hash projection, including ignored cooling/settling and detected impacts/port changes.
- `node test/sol-loader.test.mjs` checks explicit ESM handling without a package scope.
- `python3 test/sol-persistent.test.py` checks the real host/relay restart path, including revision restoration and Node startup without the flag.
- `node --import ./test/three-register.mjs test/server.test.mjs` checks the existing server protocol.

Tested locally with Node 24.19.0. No claim is made that every Node version has removed the old flag. Deployment on mpcbb and phone frame-time verification remain live checks.

## Scope
This patch addresses review items 1 and 2 and corrects the packaging/changelog. It does not change the five-second checkpoint storage policy, system-watch bulletin interval, host-address poll privacy, or migration cutover design. Those remain separate follow-ups.
