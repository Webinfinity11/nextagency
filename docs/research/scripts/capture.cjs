// Run from repository root: NODE_PATH=/tmp/<scratch>/node_modules node docs/research/scripts/capture.cjs
// Install playwright and sharp in that scratch folder, never in the repository.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const root = 'docs/research/frames/raw/live';
fs.mkdirSync(root, {recursive:true});
(async () => {
 const browser = await chromium.launch({headless:true,channel:process.env.CHROME_CHANNEL || undefined,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const context = await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const page = await context.newPage();
 await page.addInitScript(() => {
 window.__motionEvents=[];
 for(const name of ['tinywins:home-loader-complete','tinywins:home-loader-reveal']) window.addEventListener(name,()=>window.__motionEvents.push({name,t:performance.now()}));
});
const errors=[], responses=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(/\.js(?:\?|$)/.test(r.url())) responses.push(r);});
 const t0=Date.now(), samples=[];
 const navigation=page.goto('https://www.tinywins.com/',{waitUntil:'commit',timeout:60000}).catch(e=>errors.push(String(e)));
 await navigation;
 async function sample(name) {
   const before=Date.now()-t0;
   try { await page.screenshot({path:path.join(root,name+'.jpg'),type:'jpeg',quality:70,timeout:15000}); }
   catch(e){errors.push({name,error:String(e)});return;}
   const dom=await page.evaluate(()=>({t:performance.now(),scrollY,htmlClass:document.documentElement.className,bodyClass:document.body?.className,htmlOverflow:getComputedStyle(document.documentElement).overflow,bodyOverflow:document.body?getComputedStyle(document.body).overflow:null,complete:window.__tinywinsHomeLoaderCompleteFired,events:window.__motionEvents,marks:performance.getEntriesByType('mark').map(m=>({name:m.name,t:m.startTime})),
   images:[...document.querySelectorAll('img[src*="intro"]')].map(e=>({src:e.currentSrc,complete:e.complete,w:e.naturalWidth,h:e.naturalHeight,opacity:getComputedStyle(e).opacity,transition:getComputedStyle(e).transition})),
    elements:[...document.querySelectorAll('canvas,[class*="z-200"],[class*="z-200"] *,[data-word],[data-side],[data-desktop-stat-word],.sticky,video,.pin-spacer')].slice(0,220).map(el=>{
      const s=getComputedStyle(el),r=el.getBoundingClientRect(); return {tag:el.tagName,cls:el.className,id:el.id,rect:[r.x,r.y,r.width,r.height],opacity:s.opacity,transform:s.transform,clip:s.clipPath,position:s.position,overflow:s.overflow,fontSize:s.fontSize,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,visibility:s.visibility,children:el.children.length};})})).catch(()=>null);
   samples.push({name,before,after:Date.now()-t0,dom});
 }
 let completeAt=null;
 for(let i=0;Date.now()-t0<45000;i++) {
  const start=Date.now(); await sample('load-'+String(i).padStart(3,'0'));
  const done=await page.evaluate(()=>window.__tinywinsHomeLoaderCompleteFired===true && !document.querySelector('[class*="z-200"]'));
  if(done&&completeAt===null) completeAt=Date.now()-t0;
  if(completeAt!==null&&Date.now()-t0>completeAt+3200) break;
  await page.waitForTimeout(Math.max(0,125-(Date.now()-start)));
 }
 if(completeAt===null) throw new Error('Loader did not complete and unmount within 45s');
 await sample('settled');
 console.log(JSON.stringify({completeAt}));
 fs.writeFileSync(path.join(root,'dom.html'),await page.content());
 fs.writeFileSync(path.join(root,'structure.json'),JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].slice(0,450).map(e=>({tag:e.tagName,cls:e.className,id:e.id}))),null,2));
 for(let i=0;i<45;i++){await page.mouse.wheel(0,60);await page.waitForTimeout(100);await sample('scroll-'+String(i).padStart(3,'0'));}
 fs.writeFileSync(path.join(root,'samples.json'),JSON.stringify({url:page.url(),viewport:{width:1440,height:900},completeAt,errors,samples},null,2));
 for(let i=0;i<responses.length;i++){try{fs.writeFileSync(path.join(root,`chunk-${i}.js`),await responses[i].text());}catch{}}
 fs.writeFileSync(path.join(root,'chunks.json'),JSON.stringify(responses.map(r=>r.url()),null,2));
 console.log(JSON.stringify({samples:samples.length,errors,url:page.url()}));
 await browser.close();
})();
