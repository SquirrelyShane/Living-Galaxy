import assert from 'node:assert/strict';
import {paintLabels,paintMarkerNodes} from '../js/ui/hudnodes.js';

// An injected DOM package is optional; the built-in fixture keeps this suite
// runnable on Termux without installing dependencies.
class Style {
  constructor(){this.values=new Map();}
  getPropertyValue(k){return this.values.get(k)??'';}
  setProperty(k,v){this.values.set(k,v);}
  removeProperty(k){this.values.delete(k);}
}
class Node {
  constructor(doc,tag='',value=null){this.ownerDocument=doc;this.tagName=tag;this.nodeValue=value;this.childNodes=[];this.parentNode=null;this.className='';this.style=new Style();}
  get firstChild(){return this.childNodes[0]??null;}
  get nextSibling(){if(!this.parentNode)return null;const a=this.parentNode.childNodes;return a[a.indexOf(this)+1]??null;}
  insertBefore(node,before){if(node===before)return node;node.remove();const i=before?this.childNodes.indexOf(before):this.childNodes.length;assert.ok(i>=0);this.childNodes.splice(i,0,node);node.parentNode=this;return node;}
  append(node){this.insertBefore(node,null);}
  remove(){if(this.parentNode){const a=this.parentNode.childNodes;a.splice(a.indexOf(this),1);this.parentNode=null;}}
  get textContent(){return this.nodeValue??this.childNodes.map(n=>n.textContent).join('');}
  set textContent(text){for(const n of [...this.childNodes])n.remove();this.append(this.ownerDocument.createTextNode(text));}
}
let allocations=0;
let doc={createElement:tag=>{allocations++;return new Node(doc,tag.toUpperCase());},createTextNode:text=>{allocations++;return new Node(doc,'',text);}};
if(process.argv[2]) {
  const {parseHTML}=await import(process.argv[2]);
  doc=parseHTML('<html><body></body></html>').document;
}
const box=doc.createElement('div');
const label=(id,name=id,extra={})=>({id,name,kind:'body',x:10,y:20,...extra});
paintLabels(box,[label('a'),label('b')]);
const a=box.firstChild,b=a.nextSibling,startAllocations=allocations;
for(let i=0;i<100;i++)paintLabels(box,[label('a','Moving',{x:i}),label('b')]);
assert.equal(allocations,startAllocations,'repeated updates do not create label nodes');
assert.strictEqual(box.firstChild,a);assert.strictEqual(a.nextSibling,b);
paintLabels(box,[label('b'),label('a','<img src=x onerror=bad()>',{tag:'D',a:90})]);
assert.strictEqual(box.firstChild,b);assert.strictEqual(b.nextSibling,a);
assert.equal(a.textContent,'[D]<img src=x onerror=bad()>','names are literal text');
assert.equal(a.firstChild.tagName,'I');assert.equal(a.style.getPropertyValue('--a'),'90.0deg');
paintLabels(box,[label('a'),label('a','duplicate')]);
assert.strictEqual(box.firstChild,a);assert.equal(a.style.getPropertyValue('--a')??'','');
assert.equal(a.textContent,'a');assert.equal(a.nextSibling.textContent,'duplicate');
assert.equal(b.parentNode,null,'vanished entity removed');
paintLabels(box,[]);assert.equal(box.firstChild,null);
paintLabels(box,[label('a')]);assert.ok(box.firstChild);
const markerBox=doc.createElement('div'),defs={lock:{glyph:'⊕',label:'LOCK'},aim:{glyph:'+',label:''}};
paintMarkerNodes(markerBox,[{kind:'lock',x:1,y:2,pct:.1},{kind:'aim',x:5,y:6}],defs);
const lock=markerBox.firstChild,aim=lock.nextSibling;
paintMarkerNodes(markerBox,[{kind:'aim',x:7,y:8},{kind:'lock',x:3,y:4,pct:.9}],defs);
assert.strictEqual(markerBox.firstChild,aim);assert.strictEqual(aim.nextSibling,lock);
assert.equal(lock.textContent,'⊕90%');assert.equal(aim.textContent,'+');
paintMarkerNodes(markerBox,[],defs);assert.equal(markerBox.firstChild,null);
console.log('PASS: HUD node identity, zero-node-creation position/text updates, reorder, duplicate IDs, literal names, tags/angle removal, entity removal, marker reuse/progress');
