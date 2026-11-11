// Same scratch dependencies and invocation as capture.cjs. No site assets saved.
const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:process.env.CHROME_CHANNEL||undefined,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 await page.goto('https://www.tinywins.com/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__tinywinsHomeLoaderCompleteFired&&!document.querySelector('[class*="z-200"]'),{},{timeout:45000});
 await page.waitForTimeout(3200);
 const snapshots=[];
 for(const target of [0,450,630,900,1350,1800,1980,2250,2700]){
  await page.mouse.wheel(0,target-await page.evaluate(()=>scrollY));
  await page.waitForTimeout(1000);
  snapshots.push(await page.evaluate(()=>{
   const els=new Set(document.querySelectorAll('[data-word],.sticky,canvas,video,h2'));
   for(const v of document.querySelectorAll('video')){let p=v.parentElement;for(let i=0;p&&i<4;i++,p=p.parentElement)els.add(p);}
   return {scrollY,pins:document.querySelectorAll('.pin-spacer').length,elements:[...els].map(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {tag:el.tagName,cls:el.className,rect:[r.x,r.y,r.width,r.height],transform:s.transform,fontSize:s.fontSize,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,position:s.position,borderRadius:s.borderRadius,overflow:s.overflow,opacity:s.opacity};})};
  }));
 }
 await page.locator('footer').scrollIntoViewIfNeeded();
 await page.waitForTimeout(1000);
 await page.mouse.move(720,650);
 await page.waitForTimeout(600);
 await page.screenshot({path:'docs/research/frames/raw/live/footer.jpg'});
 fs.writeFileSync('docs/research/frames/raw/live/probe.json',JSON.stringify(snapshots,null,2));
 console.log(JSON.stringify({offsets:snapshots.map(s=>s.scrollY),pinCounts:snapshots.map(s=>s.pins)}));
 await browser.close();
})();
