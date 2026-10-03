import assert from 'node:assert/strict';
import fs from 'node:fs';
import { COMPLEX_IDS } from '../js/careers/index.js';
import { CAREER_STATUS, OPEN_GATE, careerStatus, isCareerOpen, openCareers } from '../js/careers/status.js';
import { careerCatalog, makePilot, pilot, transferOptions, tryTransfer } from '../js/flight/pilot.js';
assert.deepEqual(openCareers(), ['mining']);
assert.equal(careerCatalog().length, COMPLEX_IDS.length);
for (const id of COMPLEX_IDS) {
 const s=CAREER_STATUS[id];
 assert.equal(isCareerOpen(id),s.state==='open' && OPEN_GATE.every(g=>s.has.includes(g)));
 assert.equal(careerCatalog().find(c=>c.id===id).open,isCareerOpen(id));
}
assert.equal(careerStatus('unknown').open,false);
const saved=CAREER_STATUS.mining.has;
CAREER_STATUS.mining.has=[];
assert.equal(isCareerOpen('mining'),false);
CAREER_STATUS.mining.has=saved;
makePilot('New','terran','mining',null);
assert.ok(transferOptions().every(x=>x.shut && !x.ok));
assert.match(tryTransfer('salvage').error,/in development/);
assert.equal(pilot.complexId,'mining');
for(const id of COMPLEX_IDS){
 makePilot('Legacy','terran',id,null);
 assert.equal(pilot.complexId,id);
 if(id!=='mining') {
  assert.equal(transferOptions().find(x=>x.id==='mining').shut,undefined);
  pilot.complexId='mining'; pilot.character.activeComplex='mining';
  assert.equal(transferOptions().find(x=>x.id===id).resume,true);
  assert.equal(tryTransfer(id).ok,true);
 }
}
const source=fs.readFileSync(new URL('../js/ui/creation.js',import.meta.url),'utf8');
assert.ok(source.includes('choice.complexId = firstOpen()'));
assert.ok(source.includes('IN DEVELOPMENT'));
assert.ok(!source.includes('arrives in'));
console.log('careerstatus: readiness gates, catalog, blocked transfers and legacy resumes passed');
