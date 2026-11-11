// VERIFY_DEPS=/tmp/nextagency-verify VERIFY_URL=http://127.0.0.1:3027 node docs/verify/loader-v3-capture.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(`${process.env.VERIFY_DEPS || '/tmp/nextagency-verify'}/package.json`);
const { chromium } = require('playwright');
const sharp = require('sharp');
const origin = process.env.VERIFY_URL || 'http://127.0.0.1:3027';
const out = 'docs/verify';
const browser = await chromium.launch({channel:'chrome', headless:true});
const errors = [], runs = [];
async function instrument(page) {
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(() => {
    window.loaderSamples=[];
    const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
    const tick=()=>{
      const start=performance.getEntriesByName('loader:start')[0];
      const box=document.querySelector('.nav-start');
      if(start && box && !performance.getEntriesByName('loader:settled').length) {
        const source=document.querySelector('.loader-dark-logo [data-wordmark="w-next"]');
        const target=document.querySelector('.nav-logo [data-wordmark="w-next"]');
        const agency=document.querySelector('.nav-logo [data-wordmark="w-agency"]');
        window.loaderSamples.push({t:performance.now()-start.startTime,box:rect(box),source:rect(source),target:rect(target),agencyTransform:getComputedStyle(agency).transform,logoVisibility:getComputedStyle(document.querySelector('.nav-logo')).visibility,linkOpacity:getComputedStyle(document.querySelector('.nav-links a')).opacity});
      }
      requestAnimationFrame(tick);
    };requestAnimationFrame(tick);
  });
}
async function geometry(page) {
  return page.evaluate(() => [...document.querySelectorAll('.nav-start,.nav-end,.nav-logo,.nav-logo [data-wordmark]')].map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
}
function equalGeometry(a,b,label) {
  a.forEach((r,i)=>Object.keys(r).forEach(k=>assert(Math.abs(r[k]-b[i][k])<.05,`${label} ${i}.${k}: ${r[k]} != ${b[i][k]}`)));
}
for(const width of [1440,390]) for(const locale of ['ka','en']) {
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
  await instrument(page);
  const recording = width===1440 && locale==='ka';
  const stream=[];
  const cdp=recording ? await page.context().newCDPSession(page) : null;
  if(cdp) {
    cdp.on('Page.screencastFrame', frame => {
      stream.push({time:frame.metadata.timestamp*1000,data:frame.data});
      void cdp.send('Page.screencastFrameAck',{sessionId:frame.sessionId});
    });
    await cdp.send('Page.startScreencast',{format:'jpeg',quality:85,maxWidth:1440,maxHeight:900,everyNthFrame:1});
  }
  await page.goto(`${origin}/${locale}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>performance.getEntriesByName('loader:start').length);
  const frames=[];
  if(recording) {
    // Capture compositor frames without blocking animation on screenshot calls.
    // Sample-and-hold them on an exact 12fps clock (unchanged frames are repeated).
    const epoch=await page.evaluate(()=>performance.timeOrigin+performance.getEntriesByName('loader:start')[0].startTime);
    await page.waitForFunction(()=>performance.now()-performance.getEntriesByName('loader:start')[0].startTime>6100);
    await cdp.send('Page.stopScreencast');
    for(let i=0;i<73;i++) {
      const t=i*1000/12;
      const frame=stream.findLast(f=>f.time<=epoch+t) || stream[0];
      const file=`${out}/loader-v3-${String(i+1).padStart(3,'0')}.jpg`;
      await fs.writeFile(file,Buffer.from(frame.data,'base64'));
      frames.push({file,t,capturedAt:frame.time-epoch});
    }
    const label=(t,w,h)=>Buffer.from(`<svg width="${w}" height="${h}"><rect width="58" height="18" fill="#ddd"/><text x="4" y="13" font-size="11" font-family="sans-serif">${(t/1000).toFixed(2)}s</text></svg>`);
    const tiles=await Promise.all(frames.map(async(f,i)=>({input:await sharp(await sharp(f.file).resize(240,150).toBuffer()).composite([{input:label(f.t,240,150)}]).toBuffer(),left:i%6*240,top:Math.floor(i/6)*150})));
    await sharp({create:{width:1440,height:Math.ceil(frames.length/6)*150,channels:3,background:'#ddd'}}).composite(tiles).jpeg({quality:90}).toFile(`${out}/loader-v3-contact-sheet.jpg`);
    const tail=frames.filter(f=>f.t>=3850);
    const strips=await Promise.all(tail.map(async(f,i)=>({input:await sharp(await sharp(f.file).extract({left:0,top:0,width:1440,height:90}).resize(960,60).toBuffer()).composite([{input:label(f.t,960,60)}]).toBuffer(),left:0,top:i*60})));
    await sharp({create:{width:960,height:tail.length*60,channels:3,background:'#fff'}}).composite(strips).jpeg({quality:94}).toFile(`${out}/loader-v3-header-strip.jpg`);
  }
  await page.waitForFunction(()=>performance.getEntriesByName('loader:settled').length);
  const samples=await page.evaluate(()=>window.loaderSamples);
  const timing=await page.evaluate(()=>Object.fromEntries(['start','handoff','done','settled'].map(k=>[k,performance.getEntriesByName(`loader:${k}`)[0]?.startTime])));
  assert(timing.settled-timing.start>=5850 && timing.settled-timing.start<6300);
  const handoff=samples.find(s=>s.t>=4570 && s.source && s.logoVisibility==='visible');
  assert(handoff,'handoff sampled');
  equalGeometry([handoff.source],[handoff.target],'handoff');
  const centered=samples.find(s=>s.t>4600 && s.t<4800);
  assert(centered,'centered hold sampled');
  assert(Math.abs(centered.box.x-(width===1440?(width-centered.box.width)/2:16))<.05,'box centered / mobile stationary');
  const beforeAgency=samples.find(s=>s.t>5400 && s.t<5480);
  assert(beforeAgency && beforeAgency.agencyTransform!=='matrix(1, 0, 0, 1, 0, 0)','AGENCY stays masked until box settles');
  const final=await geometry(page);
  assert(Math.abs(final[0].x-16)<.05);
  const logoBox=final[1],nextBox=final[2],agencyBox=final[3];
  assert(agencyBox.y>=nextBox.y+nextBox.height && agencyBox.y+agencyBox.height<=logoBox.y+logoBox.height+.05,'AGENCY fits below NEXT inside the fixed logo viewport');
  assert(Math.abs(agencyBox.width/nextBox.width-356.341/506.5)<.001,'AGENCY retains original stacked proportions');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`${out}/loader-v3-header-${locale}-${width}.jpg`,clip:{x:0,y:0,width,height:110},type:'jpeg',quality:95});
  await page.reload();
  await page.waitForFunction(()=>document.documentElement.dataset.loader==='done');
  equalGeometry(final,await geometry(page),'returning visit');
  assert.equal(await page.evaluate(()=>performance.getEntriesByName('loader:start').length),0);
  if(width===390) {
    await page.locator('.nav-menu summary').click();
    assert(await page.locator('.nav-menu nav a').first().isVisible());
    await page.screenshot({path:`${out}/loader-v3-menu-${locale}.jpg`,clip:{x:0,y:0,width,height:340},type:'jpeg',quality:90});
    await page.locator('.nav-menu summary').press('Escape');
    assert.equal(await page.locator('.nav-menu').getAttribute('open'),null);
    await page.locator('.nav-menu summary').click();
    await page.locator('.nav-menu nav a').first().click();
    await page.waitForURL(`**/${locale}/work`);
    assert.equal(await page.locator('.nav-menu').getAttribute('open'),null);
  }
  const reduced=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  await reduced.goto(`${origin}/${locale}`);
  await reduced.waitForFunction(()=>document.documentElement.dataset.loader==='done');
  await reduced.evaluate(()=>document.fonts.ready);
  equalGeometry(final,await geometry(reduced),'reduced motion');
  assert.equal(await reduced.locator('.loader').count(),0);
  assert.equal(await reduced.evaluate(()=>performance.getEntriesByName('loader:start').length),0);
  runs.push({locale,width,timing,final,handoff,frames,samples});
  await page.close();await reduced.close();
}
assert.deepEqual(errors,[]);
await fs.writeFile(`${out}/loader-v3-measurements.json`,JSON.stringify({runs,errors},null,2));
console.log(JSON.stringify({runs:runs.map(({locale,width,timing,handoff})=>({locale,width,timing,handoff})),errors},null,2));
await browser.close();
