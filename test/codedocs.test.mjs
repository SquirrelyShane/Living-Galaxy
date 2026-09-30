import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const r = spawnSync(process.execPath, [path.join(root, "tools/codedocs/build.mjs"), "--check"], { encoding: "utf8" });
process.stdout.write(r.stdout + r.stderr);
if (r.status !== 0) { console.error("codedocs: FAIL — comments left in js/ or docs/ stale. Run: node tools/codedocs/build.mjs --migrate"); process.exit(1); }
console.log("codedocs: ok");
