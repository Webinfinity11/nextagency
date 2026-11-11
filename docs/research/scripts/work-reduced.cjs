// prefers-reduced-motion pass for the Work area. Element-relative (scrollIntoView), because the
// reduced layout changes height after hydration and absolute scroll targets become stale.
//   CHROME_CHANNEL=chrome NODE_PATH=/tmp/<scratch>/node_modules node docs/research/scripts/work-reduced.cjs
// Output: docs/research/frames/raw/work/reduced/ (git-ignored).
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const root = 'docs/research/frames/raw/work/reduced';
fs.mkdirSync(root, { recursive: true });
const configs = {
  desktop: { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' },
};
(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.CHROME_CHANNEL || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const out = {};
  for (const [name, cfg] of Object.entries(configs)) {
    const page = await (await browser.newContext(cfg)).newPage();
    await page.goto('https://www.tinywins.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const tGoto = Date.now();
    const heights = [];
    for (let i = 0; i < 8; i++) { heights.push(await page.evaluate(() => ({ t: Math.round(performance.now()), h: document.documentElement.scrollHeight, loader: !!document.querySelector('[class*="z-200"]'), bodyPos: getComputedStyle(document.body).position }))); await page.waitForTimeout(750); }
    await page.waitForFunction(() => window.__tinywinsHomeLoaderCompleteFired === true && !document.querySelector('[class*="z-200"]'), {}, { timeout: 60000 });
    await page.waitForTimeout(1500);
    const r = { heights, loaderDoneAfterMs: Date.now() - tGoto };
    r.docHeightAfterLoader = await page.evaluate(() => document.documentElement.scrollHeight);
    r.css = await page.evaluate(() => {
      const hits = [];
      for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch { continue; } const walk = (list) => { for (const ru of list) { if (ru.cssRules) walk(ru.cssRules); if (ru.selectorText && /data-fx|split-line/.test(ru.selectorText)) hits.push((ru.parentRule?.conditionText ? '@' + ru.parentRule.conditionText + ' ' : '') + ru.cssText.slice(0, 220)); } }; walk(rules); }
      return hits;
    });
    r.globals = await page.evaluate(() => ({ lenisClass: document.documentElement.classList.contains('lenis'), matches: matchMedia('(prefers-reduced-motion: reduce)').matches }));
    const at = async (selector, label) => {
      await page.evaluate((s) => { const el = [...document.querySelectorAll(s)].find((e) => e.getClientRects().length); el?.scrollIntoView({ block: 'center', behavior: 'instant' }); }, selector);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(root, `${name}-${label}.jpg`), type: 'jpeg', quality: 70 });
      return page.evaluate((s) => {
        const el = [...document.querySelectorAll(s)].find((e) => e.getClientRects().length);
        const sec = el?.closest('section');
        return {
          scrollY, selector: s, found: !!el, rect: el ? [...Object.values(el.getBoundingClientRect().toJSON())].map((n) => Math.round(n)) : null,
          fx: sec ? [...sec.querySelectorAll('[data-fx-y]')].slice(0, 6).map((e) => ({ text: e.textContent.trim().slice(0, 24), opacity: getComputedStyle(e).opacity, visibility: getComputedStyle(e).visibility, ready: e.hasAttribute('data-fx-ready') })) : [],
          categoryVariant: sec?.querySelector('.overflow-x-auto') ? 'overflow-x-auto (reduced branch)' : sec?.querySelector('.will-change-transform') ? 'drag track' : null,
          cards: sec ? [...sec.querySelectorAll('.overflow-hidden')].filter((e) => e.getClientRects().length).slice(0, 3).map((m) => ({ h: Math.round(m.getBoundingClientRect().height), w: Math.round(m.getBoundingClientRect().width), opacity: getComputedStyle(m).opacity, transform: getComputedStyle(m).transform, imgTransition: m.querySelector('img') ? getComputedStyle(m.querySelector('img')).transition : null })) : [],
          parallax: sec ? [...sec.querySelectorAll('[data-parallax-image]')].filter((e) => e.getClientRects().length).slice(0, 3).map((e) => getComputedStyle(e).transform) : [],
          videoPaused: sec?.querySelector('video') ? sec.querySelector('video').paused : null,
          pinSpacers: document.querySelectorAll('.pin-spacer').length,
        };
      }, selector);
    };
    r.work = await at('section[aria-label="Selected Work"] [style*="aspect-ratio"]', 'featured');
    r.allWork = await at('section[aria-label="Selected Work"] a[href="/work"]', 'all-work');
    r.vital = await at('section[aria-label="Feeling Vital"] h2', 'vital');
    r.future = await at('section[aria-label="Feeling Future-proof"] h2', 'future');
    out[name] = r;
    console.log(name, JSON.stringify({ allWork: r.allWork.fx, vital: r.vital.categoryVariant }));
  }
  fs.writeFileSync(path.join(root, 'reduced.json'), JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
