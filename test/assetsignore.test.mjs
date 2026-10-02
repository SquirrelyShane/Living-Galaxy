import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
const dir = mkdtempSync(join(tmpdir(), 'lg-assets-'));
try {
  execFileSync('git', ['init', '-q', dir]);
  writeFileSync(join(dir,'.gitignore'), readFileSync(new URL('../.assetsignore', import.meta.url)));
  const excluded = ['logs/run.log','cradle.json','cradle.json.tmp','gdb.json','sol-state.sqlite3','sol-state.sqlite3-wal','sol-host-status.json','host/sol-host.mjs','deploy/install-sol.sh','server.py','node_modules/pkg/index.js','tools/aria-play.mjs','test/careers.test.mjs','docs/index.json','PATCH-0.3.83.md','README.md','archive.zip','.env','addon/adult/adult-trees-v3-isekai.txt'];
  const publicFiles = ['index.html','js/version.js','js/sim/sim.js','js/sim/career.js','js/npc/cradle.js','js/careers/status.js','css/style.css','icons/icon-192.png','manifest.webmanifest','vendor/three.module.min.js','vendor/three.core.min.js','addon/adult/index.js','js/vendor/stellar-names/classified-names.js'];
  for (const path of excluded) assert.equal(spawnSync('git',['check-ignore','--no-index','-q',path],{cwd:dir}).status,0,`exclude ${path}`);
  for (const m of readFileSync(new URL("../index.html", import.meta.url), "utf8").matchAll(/<link rel="modulepreload" href="\.\/([^"]+)"/g)) publicFiles.push(m[1]);
  for (const path of publicFiles) assert.equal(spawnSync('git',['check-ignore','--no-index','-q',path],{cwd:dir}).status,1,`retain ${path}`);
  console.log(`assetsignore: ${excluded.length} exclusions and ${publicFiles.length} browser assets passed`);
} finally { rmSync(dir,{recursive:true,force:true}); }
