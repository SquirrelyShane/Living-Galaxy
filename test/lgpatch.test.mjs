/* LIVING GALAXY 0.3.69 — tools/lg-patch.sh, run for real against a throwaway repo.
 *
 *   node --import ./test/three-register.mjs test/lgpatch.test.mjs
 *
 * A bare "origin", a clone of it with just enough game in it (js/version.js),
 * patch zips made here, and ssh / scp / curl / sudo / systemctl stubbed on
 * PATH so "the host" is a folder: lg-deploy copies origin's main into its
 * served tree, and the remote scripts run there with that folder as $HOME.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, copyFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (process.env.V) console.log("  ok", m); } else { fail++; console.error("  FAIL", m); } };

const base = mkdtempSync(join(tmpdir(), "lgpatch-"));
const origin = join(base, "origin.git"), work = join(base, "work"), host = join(base, "host"), dl = join(base, "dl"), bin = join(base, "bin"), ftmp = join(base, "ftmp");
for (const d of [host, dl, bin, ftmp]) mkdirSync(d, { recursive: true });
const git = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8", env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" } }).trim();
const V = (v) => `export const VERSION = "${v}";\n`;
const put = (dir, rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };

/* the repo: version.js at 0.9.0, the script, an empty three-register */
git(base, "init", "-q", "--bare", "-b", "main", origin);
mkdirSync(work);
git(work, "init", "-q", "-b", "main");
git(work, "remote", "add", "origin", origin);
put(work, "js/version.js", `/* v */\n${V("0.9.0")}`);
put(work, "test/three-register.mjs", "// stub\n");
mkdirSync(join(work, "tools"));
copyFileSync(join(ROOT, "tools/lg-patch.sh"), join(work, "tools/lg-patch.sh"));
chmodSync(join(work, "tools/lg-patch.sh"), 0o755);
git(work, "add", "-A"); git(work, "commit", "-q", "-m", "base"); git(work, "push", "-q", "-u", "origin", "main");

/* the host: a served tree, a plain-folder desktop copy, a site folder */
put(host, "srv/play/js/version.js", V("0.9.0"));
put(host, "Desktop/Living-Galaxy/js/version.js", V("0.9.0"));
put(host, "Desktop/lgsite-deploy/deploy/install.sh", `#!/bin/bash\nv=$(sed -n 's/^VERSION = "\\(.*\\)"$/\\1/p' "$HOME/Desktop/lgsite-deploy/lgsite.py"); echo "{\\"ok\\":true,\\"version\\":\\"$v\\"}" > "$HOME/health.json"\n`);
put(host, "Desktop/lgsite-deploy/lgsite.py", 'VERSION = "0.2.5"\n');
put(host, "health.json", '{"ok":true,"version":"0.2.5"}');

/* stubs */
const stub = (name, body) => { writeFileSync(join(bin, name), `#!/bin/bash\n${body}\n`); chmodSync(join(bin, name), 0o755); };
stub("ssh", `
args=(); for a in "$@"; do case "$a" in -*) ;; *) args+=("$a");; esac; done
cmd="\${args[*]:1}"
case "$cmd" in
  lg-deploy) git --git-dir="${origin}" show main:js/version.js > "${host}/srv/play/js/version.js"; echo "game moved";;
  *127.0.0.1:8200*) cat "${host}/srv/play/js/version.js";;
  "bash /tmp/lg-remote.sh"*) sed 's#/tmp/#${ftmp}/#g' "${ftmp}/lg-remote.sh" > "${ftmp}/run.sh"; shift_args=("\${args[@]:3}"); HOME="${host}" PATH="${bin}:$PATH" bash "${ftmp}/run.sh" "\${shift_args[@]}";;
  *) echo "ssh stub: unknown $cmd" >&2; exit 9;;
esac`);
stub("scp", `src=""; dst=""; for a in "$@"; do case "$a" in -*) ;; *) if [ -z "$src" ]; then src="$a"; else dst="$a"; fi;; esac; done; cp "$src" "${ftmp}/$(basename "\${dst#*:}")"`);
stub("curl", `for a in "$@"; do case "$a" in *health*) cat "${host}/health.json"; exit 0;; esac; done; cat "${host}/srv/play/js/version.js"`);
stub("sudo", `"$@"`);
stub("systemctl", `exit 0`);

/* zips (python's zipfile: no zip binary needed) */
const mkzip = (name, files) => {
  const src = join(base, "zsrc-" + name); mkdirSync(src, { recursive: true });
  for (const [rel, text] of Object.entries(files)) put(src, rel, text);
  execFileSync("python3", ["-c", "import sys,os,zipfile\nz=zipfile.ZipFile(sys.argv[1],'w')\nfor r,_,fs in os.walk(sys.argv[2]):\n  for f in fs:\n    p=os.path.join(r,f); z.write(p, os.path.relpath(p, sys.argv[2]))\nz.close()", join(dl, name), src]);
  return join(dl, name);
};
const passing = "process.exit(0);\n", failing = "console.error('nope'); process.exit(1);\n";

/* nothing from a calling lg-patch.sh (LG_REPO above all) may leak into the runs below */
const clean = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith("LG_")));
const env = { ...clean, PATH: `${bin}:${process.env.PATH}`, LG_DOWNLOADS: dl, LG_HOST: "fakehost", GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" };
const runIn = (input, ...a) => { const r = spawnSync("bash", [join(work, "tools/lg-patch.sh"), ...a], { cwd: work, env, encoding: "utf8", input }); return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") }; };
const run = (...a) => runIn("", ...a);
const ver = () => /"(.*)"/.exec(readFileSync(join(work, "js/version.js"), "utf8"))[1];
const branch = () => git(work, "branch", "--show-current");
const originVer = () => /"(.*)"/.exec(git(work, "--git-dir", origin, "show", "main:js/version.js"))[1];

try {
  ok(run().code === 0 && /apply\s+FROM TO/.test(run().out), "no arguments prints the usage");
  ok(run("frobnicate").code === 2, "an unknown command is an error");

  /* refusals */
  mkzip("LivingGalaxy-0.9.1-patch.zip", { "js/version.js": V("0.9.1"), "test/a.test.mjs": passing });
  writeFileSync(join(work, "scratch.txt"), "x");
  let r = run("apply", "0.9.0", "0.9.1");
  ok(r.code !== 0 && /uncommitted/.test(r.out) && branch() === "main", "a dirty repo is refused");
  execFileSync("rm", [join(work, "scratch.txt")]);
  r = run("apply", "0.8.9", "0.9.1");
  ok(r.code !== 0 && /not 0\.8\.9/.test(r.out) && branch() === "main", "the wrong starting version is refused");
  r = run("apply", "0.9.0", "0.9.7");
  ok(r.code !== 0 && /no patch at/.test(r.out), "a missing zip is refused");
  r = run("apply", "0.9", "x");
  ok(r.code !== 0 && /not a version/.test(r.out), "a non-version is refused");

  /* a zip that says the wrong version, then abort */
  mkzip("LivingGalaxy-0.9.3-patch.zip", { "js/version.js": V("0.9.2") });
  r = run("apply", "0.9.0", "0.9.3");
  ok(r.code !== 0 && /says 0\.9\.2, not 0\.9\.3/.test(r.out) && branch() === "update/0.9.3", "a zip carrying the wrong version stops on its branch");
  r = run("abort", "0.9.3");
  ok(r.code === 0 && branch() === "main" && ver() === "0.9.0" && git(work, "status", "--porcelain") === "", "abort puts main back exactly");

  /* a failing test, then abort */
  mkzip("LivingGalaxy-0.9.4-patch.zip", { "js/version.js": V("0.9.4"), "test/b.test.mjs": failing, "js/new.js": "export {};\n" });
  r = run("apply", "0.9.0", "0.9.4");
  ok(r.code !== 0 && /b\.test\.mjs failed/.test(r.out) && branch() === "update/0.9.4", "a failing test stops and leaves the branch to look at");
  run("abort", "0.9.4");
  ok(!existsSync(join(work, "js/new.js")) && branch() === "main", "abort removes the patch's new files too");

  /* the happy path, with the script replacing itself mid-run */
  const newer = readFileSync(join(work, "tools/lg-patch.sh"), "utf8").replace("# Every step stops", "#\n# (a newer copy — padded so a mid-run overwrite would shift every offset)\n#" + " x".repeat(400) + "\n# Every step stops");
  mkzip("LivingGalaxy-0.9.1-patch.zip", { "js/version.js": V("0.9.1"), "test/a.test.mjs": passing, "tools/lg-patch.sh": newer });
  r = run("apply", "0.9.0", "0.9.1");
  ok(r.code === 0 && /update\/0\.9\.1 applied and tested/.test(r.out), `apply: default zip, the zip's own test found and run${r.code ? "\n" + r.out : ""}`);
  ok(/node test\/a\.test\.mjs/.test(r.out), "…it named the test it ran");
  ok(branch() === "update/0.9.1" && ver() === "0.9.1", "on update/0.9.1 at 0.9.1");
  ok(readFileSync(join(work, "tools/lg-patch.sh"), "utf8") === newer, "a zip carrying a new lg-patch.sh replaced it without breaking the run");
  r = run("apply", "0.9.0", "0.9.1");
  ok(r.code !== 0, "applying the same version twice is refused");

  r = run("ship", "0.9.1");
  ok(r.code === 0 && branch() === "main" && originVer() === "0.9.1" && !git(work, "branch", "--list", "update/0.9.1"), "ship: committed, main fast-forwarded, pushed, branch dropped");

  r = run("deploy", "0.9.1");
  ok(r.code === 0 && /origin: 0\.9\.1/.test(r.out) && /public: 0\.9\.1/.test(r.out), `deploy: lg-deploy ran and origin + public both serve 0.9.1${r.code ? "\n" + r.out : ""}`);
  ok(readFileSync(join(host, "Desktop/Living-Galaxy/js/version.js"), "utf8") === V("0.9.1"), "the plain-folder desktop copy was patched from the zip");

  /* deploy notices a host that did not move */
  writeFileSync(join(host, "srv/play/js/version.js"), V("0.9.0"));
  r = run("deploy", "0.9.2");
  ok(r.code !== 0 && /origin serves 0\.9\.1 — expected 0\.9\.2/.test(r.out), "deploy stops when the host is not serving the version asked for");

  /* all: answered no → left on its branch */
  mkzip("LivingGalaxy-0.9.5-patch.zip", { "js/version.js": V("0.9.5"), "test/c.test.mjs": passing });
  r = run("all", "0.9.1", "0.9.5");
  ok(r.code === 0 && branch() === "update/0.9.5" && originVer() === "0.9.1", "all: applied, and with no 'y' nothing is shipped");
  run("ship", "0.9.5");
  ok(originVer() === "0.9.5", "then shipped by hand");

  /* all: answered y → applied, shipped, deployed */
  mkzip("LivingGalaxy-0.9.6-patch.zip", { "js/version.js": V("0.9.6"), "test/d.test.mjs": passing });
  r = runIn("y\n", "all", "0.9.5", "0.9.6");
  ok(r.code === 0 && originVer() === "0.9.6" && /origin: 0\.9\.6/.test(r.out) && readFileSync(join(host, "Desktop/Living-Galaxy/js/version.js"), "utf8") === V("0.9.6"), `all + y: applied, shipped, deployed, desktop copy patched${r.code ? "\n" + r.out : ""}`);

  /* rollback */
  r = run("rollback", "0.9.6");
  ok(r.code === 0 && originVer() === "0.9.5" && /reverted 0\.9\.6 → 0\.9\.5/.test(r.out), `rollback: main reverted and pushed${r.code ? "\n" + r.out : ""}`);
  ok(/origin: 0\.9\.5/.test(r.out), "…and redeployed");
  r = run("rollback", "0.9.9");
  ok(r.code !== 0 && originVer() === "0.9.5", "rollback refuses when main is not at the version named");

  /* 0.3.70 — already applied is done, not an error; leftover branches */
  git(work, "branch", "update/0.9.4");                     // a leftover that main already contains
  r = run("all", "0.9.3", "0.9.4");
  ok(r.code === 0 && /already at 0\.9\.5 — 0\.9\.4 is applied/.test(r.out) && !/\[y\/N\]/.test(r.out), "all FROM TO when main is already past TO: nothing to do, no prompt");
  ok(!git(work, "branch", "--list", "update/0.9.4") && /dropped update\/0\.9\.4/.test(r.out), "…and the merged leftover branch is dropped");
  git(work, "switch", "-q", "-c", "update/0.9.2"); put(work, "extra.txt", "x"); git(work, "add", "-A"); git(work, "commit", "-q", "-m", "work"); git(work, "switch", "-q", "main");
  r = run("apply", "0.9.1", "0.9.2");
  ok(r.code !== 0 && /has commits main does not/.test(r.out) && git(work, "branch", "--list", "update/0.9.2"), "a leftover with work main does not have is kept, and the run stops");
  git(work, "branch", "-q", "-D", "update/0.9.2");

  /* the y/N answer however a phone keyboard sends it */
  mkzip("LivingGalaxy-0.9.7-patch.zip", { "js/version.js": V("0.9.7"), "test/e.test.mjs": passing });
  r = runIn("Y \r\n", "all", "0.9.5", "0.9.7");
  ok(r.code === 0 && originVer() === "0.9.7" && /0\.9\.7 deployed/.test(r.out), `"Y " with a carriage return is a yes${r.code ? "\n" + r.out : ""}`);
  mkzip("LivingGalaxy-0.9.8-patch.zip", { "js/version.js": V("0.9.8"), "test/f.test.mjs": passing });
  r = runIn("nope\n", "all", "0.9.7", "0.9.8");
  ok(r.code === 0 && originVer() === "0.9.7" && /answer read as nope/.test(r.out) && branch() === "update/0.9.8", "anything else is a no, and says what it read");
  run("abort", "0.9.8");

  /* site */
  mkzip("LivingGalaxy-Site-0.2.6.zip", { "lgsite.py": 'VERSION = "0.2.6"\n', "test/s.test.mjs": passing });
  r = run("site", "0.2.6");
  ok(r.code === 0 && /site: 0\.2\.6/.test(r.out), `site: unpacked, its test run, installed, /health checked${r.code ? "\n" + r.out : ""}`);
  mkzip("LivingGalaxy-Site-0.2.7.zip", { "lgsite.py": 'VERSION = "0.2.6"\n' });
  r = run("site", "0.2.7");
  ok(r.code !== 0 && /not 0\.2\.7/.test(r.out), "site stops when /health reports another version");
} finally {
  execFileSync("rm", ["-rf", base]);
}

console.log(`lgpatch: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
