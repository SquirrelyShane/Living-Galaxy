import assert from 'node:assert/strict';
import path from 'node:path';
const {chromium}=await import(process.argv[2]);
const executablePath=process.argv[3]||undefined;
const port=process.argv[4]||'8124';
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],env:{...process.env,LD_LIBRARY_PATH:(executablePath?path.dirname(executablePath)+':':'')+(process.env.LD_LIBRARY_PATH??'')}});
try {
  for(const viewport of [{width:412,height:915},{width:915,height:412}]) {
    const context=await browser.newContext({viewport,deviceScaleFactor:2});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__lgGL?.renderer&&window.__lg?.sim,{timeout:30000});
    const checks=await page.evaluate(async()=>{
      const {paintLabels,paintMarkerNodes}=await import('/js/ui/hudnodes.js');
      const box=document.createElement('div');document.body.append(box);
      const rows=[{id:'a',name:'A',kind:'body',x:1,y:2},{id:'b',name:'B',kind:'body',x:3,y:4}];
      paintLabels(box,rows);const a=box.children[0],b=box.children[1];
      const changes=[];const observer=new MutationObserver(r=>changes.push(...r));
      observer.observe(box,{childList:true,subtree:true});
      for(let i=0;i<100;i++){rows[0].x=i;rows[0].name='Moved '+i;paintLabels(box,rows);}
      await Promise.resolve();const churn=changes.length;observer.disconnect();
      const retained=box.children[0]===a&&box.children[1]===b;
      paintLabels(box,[rows[1],{...rows[0],name:'<img src=x onerror=alert(1)>',tag:'D',a:90}]);
      const reordered=box.children[0]===b&&box.children[1]===a;
      const literal=a.textContent==='[D]<img src=x onerror=alert(1)>'&&!a.querySelector('img');
      paintLabels(box,[rows[0]]);const cleaned=box.children.length===1&&a.style.getPropertyValue('--a')===''&&!a.querySelector('i');
      // Use an independent container, as the game does, for each painter.
      const marker=document.createElement('div');
      paintMarkerNodes(marker,[{kind:'lock',x:1,y:2,pct:.2}],{lock:{glyph:'⊕',label:'LOCK'}});
      const lock=marker.firstChild;
      paintMarkerNodes(marker,[{kind:'lock',x:3,y:4,pct:.8}],{lock:{glyph:'⊕',label:'LOCK'}});
      const markerRetained=marker.firstChild===lock&&lock.textContent==='⊕80%';
      box.remove();
      return {retained,reordered,literal,cleaned,markerRetained,churn};
    });
    assert.deepEqual(checks,{retained:true,reordered:true,literal:true,cleaned:true,markerRetained:true,churn:0});
    await page.evaluate(async()=>{
      const {makePilot}=await import('/js/flight/pilot.js');
      const {launchSim}=await import('/js/sim/sim.js');
      makePilot('UpgradeSmoke','terran','navigation',null);launchSim('UpgradeSmoke','sol');
      const {lockPerfTier}=await import('/js/core/perf.js');lockPerfTier(0);
    });
    await page.waitForFunction(()=>window.__lgGL.renderer.getPixelRatio()===1,{timeout:30000});
    const live=await page.evaluate(()=>({phase:window.__lg.sim.phase,ratio:window.__lgGL.renderer.getPixelRatio(),width:window.__lgGL.renderer.domElement.width,labels:document.querySelectorAll('#labels>span').length,finite:Number.isFinite(window.__lg.sim.ship.pos.x)}));
    assert.equal(live.phase,'play');assert.ok(live.finite);
    assert.equal(live.width,viewport.width);
    assert.deepEqual(errors,[]);
    console.log('PASS browser:',JSON.stringify({viewport,checks,live}));
    await context.close();
  }
} finally {await browser.close();}
