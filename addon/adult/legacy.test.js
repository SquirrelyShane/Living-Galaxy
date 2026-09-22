import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegistry, ancestors, corporateConnections, legacyTopics, nameSuggestions, recordFamilyEvent } from './legacy.js';
import { EXAMPLE_LEGACY } from './legacy-example.js';
const db = () => createRegistry(EXAMPLE_LEGACY);
const choose = (node, id) => { const c = node.choices.find(c => c.id === id); assert.ok(c, id); return c.say(); };

test('founder, three generations and adoptive ancestry remain distinct', () => {
 const d = db(); const a = ancestors(d, 'mara');
 assert.deepEqual(a.map(x => [x.person.id, x.generation, x.kind]), [['sera',1,'biological'],['ren',2,'adoptive'],['iona',3,'biological']]);
 assert.equal(ancestors(d,'mara',{kind:'biological'}).length,1);
 const root = legacyTopics(d,'mara')[0].say();
 assert.match(choose(root,'legacy.founder').text,/Iona Vale/);
});
test('shared employment is supported without inventing kinship or ownership', () => {
 const d = db(); const connections = corporateConnections(d,'mara','player');
 assert.equal(connections.length,1); assert.equal(connections[0].corporation.id,'heliodyne');
 assert.equal(connections[0].left[0].kind,'employment');
 const shared = choose(legacyTopics(d,'mara')[0].say(),'legacy.shared');
 assert.match(shared.text,/does not prove they met/); assert.doesNotMatch(shared.text,/0.4%/);
});
test('private rumors need disclosure and speaker knowledge, including stale choices', () => {
 const d=db(); let level=2;
 const topics=legacyTopics(d,'mara',{disclosure:()=>level});
 const menu=choose(topics[0].say(),'legacy.corporations');
 assert.match(choose(menu,'legacy.tie.sera-shares').text,/rumor, not proof/);
 level=0; assert.match(choose(menu,'legacy.tie.sera-shares').text,/not something I can share/);
 assert.equal(corporateConnections(d,'mara','player',{speakerId:'player',level:2})[0].left.some(t=>t.id==='sera-shares'),false);
});
test('names are deterministic, unique, sourced, and exclude used names', () => {
 const d=db(), opts={familyIds:['vale','merrow'],seed:'world:child:7',speakerId:'mara',count:20};
 const a=nameSuggestions(d,opts); assert.deepEqual(a,nameSuggestions(d,opts));
 assert.equal(new Set(a.map(n=>n.name)).size,a.length);
 assert.ok(a.every(n=>n.reason));
 assert.ok(!nameSuggestions(d,{...opts,usedNames:['Iona']}).some(n=>n.name==='Iona'));
 assert.deepEqual(nameSuggestions(d,{familyIds:['missing']}),[]);
});
test('family planning fails closed, revokes stale choices and never changes reproduction settings', () => {
 const d=db(); assert.ok(!legacyTopics(d,'mara')[0].say().choices.some(c=>c.id==='legacy.future'));
 let allow=true; const topics=legacyTopics(d,'mara',{canPlanFamily:()=>allow});
 const future=choose(topics[0].say(),'legacy.future'); allow=false;
 assert.match(choose(future,'legacy.consider').text,/not available/);
 assert.equal(Object.values(d.memories)[0].preferences.familyTiming,undefined);
 allow=true; choose(future,'legacy.wait');
 assert.equal(Object.values(d.memories)[0].preferences.familyTiming,'wait');
 assert.equal(d.events.length,0);
});
test('memory survives save roundtrip and is scoped to listener', () => {
 const d=db(); const root=legacyTopics(d,'mara')[0].say(); choose(root,'legacy.founder');
 const restored=createRegistry(JSON.parse(JSON.stringify(d)));
 assert.ok(Object.values(restored.memories)[0].heard.includes('founder:vale'));
 legacyTopics(restored,'mara',{listenerId:'other'})[0].say();
 assert.equal(Object.keys(restored.memories).length,2);
 assert.equal(Object.values(restored.memories)[1].heard.length,0);
});
test('event replay is idempotent and contains only non-graphic family outcomes', () => {
 const d=db(); const event={id:'birth-1',type:'birth',parentIds:['mara','player'],childName:'Aven'};
 const a=recordFamilyEvent(d,event); assert.match(a,/welcome Aven/);
 assert.equal(a,recordFamilyEvent(d,event)); assert.equal(d.events.length,1);
 assert.throws(()=>recordFamilyEvent(d,{id:'bad',type:'unknown'}));
});
test('malformed ancestry, references, shares and date ranges are rejected', () => {
 let d=db(); d.people[0].parents=[{id:'mara',kind:'biological'}]; assert.throws(()=>createRegistry(d),/cycle/);
 d=db(); d.people[0].parents=[{id:'missing',kind:'biological'}]; assert.throws(()=>createRegistry(d),/Unknown parent/);
 d=db(); d.ties[0].share=120; assert.throws(()=>createRegistry(d),/share/);
 d=db(); d.ties[0].endYear=1; assert.throws(()=>createRegistry(d),/Reversed/);
});
test('all example dialogue branches terminate or return valid choices', () => {
 const d=db(); const topic=legacyTopics(d,'mara',{disclosure:2,canPlanFamily:()=>true})[0];
 const queue=[topic.say()], seen=new Set(); let count=0;
 while(queue.length) {
  const node=queue.shift(); assert.equal(typeof node.text,'string'); assert.ok(Array.isArray(node.choices));
  for(const c of node.choices) {
   assert.ok(c.label); if(seen.has(c.id)) continue; seen.add(c.id); queue.push(c.say()); count++;
  }
 }
 assert.ok(count>=40,`visited ${count} branches`);
});
