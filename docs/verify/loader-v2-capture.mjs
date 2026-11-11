// VERIFY_DEPS=/tmp/nextagency-verify VERIFY_URL=http://127.0.0.1:3026 node docs/verify/loader-v2-capture.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(`${process.env.VERIFY_DEPS || '/tmp/nextagency-verify'}/package.json`);
const { chromium } = require('playwright');
const sharp = require('sharp');
const origin = process.env.VERIFY_URL || 'http://127.0.0.1:3026';
const out = 'docs/verify';
const browser = await chromium.launch({channel:'chrome', headless:true});
const errors = [], samples = [], headers = [];
const page = await browser.newPage({viewport:{width:1440,height:780},deviceScaleFactor:1});
page.on('pageerror', error => errors.push(error.message));
await page.goto(`${origin}/ka`,{waitUntil:'domcontentloaded'});
await page.waitForFunction(() => performance.getEntriesByName('loader:start').length);
const start = Date.now();
const tiles = [], marks = [];
for(let i=0;i<48;i++) {
  await new Promise(r=>setTimeout(r,Math.max(0,start+i*125-Date.now())));
  const state = await page.evaluate(() => ({time: performance.now()-performance.getEntriesByName('loader:start')[0].startTime, state:document.documentElement.dataset.loader, style:[...document.querySelectorAll('.mark-style')].find(el=>getComputedStyle(el).opacity==='1')?.getAttribute('data-mark-style')}));
  samples.push(state);
  const file = `${out}/loader-v2-${String(i+1).padStart(3,'0')}.jpg`;
  await page.screenshot({path:file,type:'jpeg',quality:82});
  tiles.push({input:await sharp(file).resize(240,130).toBuffer(),left:(i%6)*240,top:Math.floor(i/6)*130});
  if(i<24) marks.push({input:await sharp(file).extract({left:600,top:270,width:240,height:240}).toBuffer(),left:(i%6)*240,top:Math.floor(i/6)*240});
}
await sharp({create:{width:1440,height:1040,channels:3,background:'#ddd'}}).composite(tiles).jpeg({quality:88}).toFile(`${out}/loader-v2-contact-sheet.jpg`);
await sharp({create:{width:1440,height:960,channels:3,background:'#000'}}).composite(marks).jpeg({quality:90}).toFile(`${out}/loader-v2-mark-sheet.jpg`);
const duration=await page.evaluate(()=>performance.getEntriesByName('loader:done')[0].startTime-performance.getEntriesByName('loader:start')[0].startTime);
assert(duration>=4800 && duration<5300,`duration ${duration}`);
assert.equal(await page.locator('.loader').count(),0);
await page.reload();
await page.waitForFunction(()=>document.documentElement.dataset.loader==='done');
assert.equal(await page.evaluate(()=>performance.getEntriesByName('loader:start').length),0,'session reload must skip');
for(const width of [1440,390]) for(const locale of ['ka','en']) {
  await page.setViewportSize({width,height:780});
  await page.goto(`${origin}/${locale}`);
  await page.waitForFunction(()=>document.documentElement.dataset.loader==='done');
  await page.screenshot({path:`${out}/loader-v2-header-${locale}-${width}.jpg`,clip:{x:0,y:0,width,height:110},type:'jpeg',quality:95});
  headers.push(await page.evaluate(()=>({locale:document.documentElement.lang,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,boxes:[...document.querySelectorAll('.nav-start,.nav-end,.nav-logo')].map(e=>({class:e.className,x:e.getBoundingClientRect().x,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))})));
  assert.equal(headers.at(-1).overflow,false,'horizontal overflow');
  if(width===390) {
    await page.locator('.nav-menu summary').click();
    assert(await page.locator('.nav-menu nav a').first().isVisible());
    await page.screenshot({path:`${out}/loader-v2-menu-${locale}-390.jpg`,clip:{x:0,y:0,width,height:330},type:'jpeg',quality:90});
    await page.locator('.nav-menu summary').press('Escape');
    assert.equal(await page.locator('.nav-menu').getAttribute('open'),null);
    await page.locator('.nav-menu summary').click();
    await page.locator('.nav-menu nav a').first().click();
    await page.waitForURL(`**/${locale}/work`);
    assert.equal(await page.locator('.nav-menu').getAttribute('open'),null);
    assert.equal(await page.locator('.loader').count(),0);
  }
}
const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
await reduced.goto(`${origin}/en`);
await reduced.waitForFunction(()=>document.documentElement.dataset.loader==='done');
assert.equal(await reduced.evaluate(()=>performance.getEntriesByName('loader:start').length),0);
assert.equal(await reduced.locator('.loader').count(),0);
assert.deepEqual(errors,[]);
await fs.writeFile(`${out}/loader-v2-measurements.json`,JSON.stringify({duration,samples,headers,errors,checks:['session reload skip','mobile menu opens and navigates to Work in ka/en','reduced-motion skips immediately','no horizontal overflow']},null,2));
console.log(JSON.stringify({duration,headers,errors}));
await browser.close();
