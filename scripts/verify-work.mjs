// VERIFY_DEPS=/tmp/nextagency-verify VERIFY_URL=http://127.0.0.1:3021 node scripts/verify-work.mjs
// Dependencies stay outside the app: npm install --prefix /tmp/nextagency-verify playwright sharp
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(path.join(process.env.VERIFY_DEPS || '/tmp/nextagency-verify', 'package.json'));
const { chromium } = require('playwright');
const sharp = require('sharp');
const origin = process.env.VERIFY_URL || 'http://127.0.0.1:3021';
const out = 'docs/verify';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const results = {};
async function newPage(width = 1440, reducedMotion = 'no-preference') {
  const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => sessionStorage.setItem('next-agency:loaded', '1'));
  return page;
}
async function goto(page, route) {
  const response = await page.goto(origin + route);
  assert.equal(response.status(), 200, route);
  await page.waitForFunction(() => document.documentElement.dataset.loader === 'done');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
}
async function scroll(page, selector, offset = 30, settle = 1100) {
  await page.locator(selector).first().evaluate((el, y) => window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - y, behavior: 'instant' }), offset);
  await page.waitForTimeout(settle);
}
async function shot(page, name) { await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 82 }); }
const page = await newPage();
try {
  await goto(page, '/ka');
  await scroll(page, '.work-pair');
  await shot(page, 'work-01-featured-pair-1440');
  const widths = () => page.locator('.work-pair').first().locator('.work-column').evaluateAll(els => els.map(el => el.getBoundingClientRect().width));
  const initial = await widths();
  const initialHeight = await page.locator(".work-pair").first().evaluate(el => el.getBoundingClientRect().height);
  const y = () => page.locator('.work-parallax').first().evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42);
  const y1 = await y();
  await page.evaluate(() => window.scrollBy({ top: 250, behavior: 'instant' }));
  await page.waitForTimeout(800);
  const y2 = await y();
  assert(Math.abs(y2 - y1) > 1, `parallax ${y1} → ${y2}`);
  results.parallax = [y1, y2];
  await scroll(page, '.work-pair');
  await page.locator('.work-pair').first().locator('.work-column').nth(1).locator('.work-frame').hover();
  await page.waitForTimeout(700);
  const promoted = await widths();
  assert(initial[0] > initial[1] && promoted[0] < promoted[1], `Flip ${initial} → ${promoted}`);
  const promotedHeight = await page.locator(".work-pair").first().evaluate(el => el.getBoundingClientRect().height);
  assert(Math.abs(initialHeight - promotedHeight) < 1, "pair reserves height during promotion");
  results.flip = { initial, promoted, initialHeight, promotedHeight };
  await shot(page, 'work-03-hover-flip-1440');
  await page.mouse.move(1, 1); await page.waitForTimeout(650);
  await scroll(page, '.work-wide'); await shot(page, 'work-02-wide-card-1440');
  await scroll(page, '.work-track', 650);
  await scroll(page, '.work-track', 440, 180);
  await shot(page, 'work-04-category-reveal-mid-1440');
  await page.waitForTimeout(1100); await scroll(page, '.work-track', 300); await shot(page, 'work-05-category-settled-1440');
  await scroll(page, '.work-theme-dark', 50); await shot(page, 'work-06-category-dark-1440');
  await scroll(page, '.work-category', 50);
  const drag = page.locator('.work-drag').first();
  const box = await drag.boundingBox();
  const sectionHeight = await page.locator('.work-category').first().evaluate(el => el.offsetHeight);
  await drag.locator('.work-card').first().hover(); await page.waitForTimeout(650);
  assert.equal(await page.locator('.work-category').first().evaluate(el => el.offsetHeight), sectionHeight, 'hover grow reserves section height');
  const beforeURL = page.url();
  await page.mouse.move(box.x + 700, box.y + 160); await page.mouse.down();
  await page.mouse.move(box.x + 300, box.y + 160, { steps: 16 }); await page.mouse.up();
  await page.waitForTimeout(1100);
  assert.equal(page.url(), beforeURL, 'drag release must not navigate');
  const dragged = await drag.evaluate(el => el.scrollLeft); assert(dragged > 400, `drag ${dragged}`);
  // Assert the capture click guard directly on an actual link, then a new gesture resets it.
  await drag.locator('.work-card').nth(1).dispatchEvent('click', { detail: 1 });
  assert.equal(page.url(), beforeURL, 'post-drag click must be suppressed');
  results.drag = dragged;
  await shot(page, 'work-07-drag-1440');
  await drag.locator('.work-card').last().focus();
  const focused = await drag.locator('.work-card').last().boundingBox();
  assert(focused.x >= -1 && focused.x + focused.width <= 1441, 'focused card brought into view');
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const locale of ['ka', 'en']) {
      for (const route of [`/${locale}`, `/${locale}/work`, `/${locale}/work/forma`]) {
        await goto(page, route);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        assert.equal(overflow, 0, `overflow ${width} ${route}`);
        if (route.endsWith('/work')) {
          await scroll(page, '.work-index-grid');
          assert.equal(await page.locator('.work-card').count(), 6);
        }
      }
    }
  }
  results.overflow = '0 at 1440/1024/390, ka/en home/index/detail';
  results.georgianMasks = [];
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await goto(page, '/ka');
    for (const selector of ['#work-title', '#category-identity', '#category-digital']) {
      await scroll(page, selector, 150);
      const heading = page.locator(selector);
      const closed = await sharp(await heading.screenshot()).raw().toBuffer();
      await heading.locator('.work-line-mask').evaluateAll(els => els.forEach(el => el.style.overflow = 'visible'));
      const opened = await sharp(await heading.screenshot()).raw().toBuffer();
      assert.equal(closed.length, opened.length);
      let difference = 0;
      for (let i = 0; i < closed.length; i++) if (closed[i] !== opened[i]) difference++;
      assert.equal(difference, 0, `Georgian mask clipping ${selector} at ${width}`);
      results.georgianMasks.push({ width, selector, difference });
    }
  }
  // Mtavruli display headings on /work and the detail page: masks never clip, no mid-word break.
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const route of ['/ka/work', '/ka/work/forma']) {
      await goto(page, route); await page.waitForTimeout(900);
      const heading = page.locator('.work-page-heading h1');
      const closed = await sharp(await heading.screenshot()).raw().toBuffer();
      await heading.locator('.work-line-mask').evaluateAll(els => els.forEach(el => el.style.overflow = 'visible'));
      const opened = await sharp(await heading.screenshot()).raw().toBuffer();
      let difference = 0;
      for (let i = 0; i < closed.length; i++) if (closed[i] !== opened[i]) difference++;
      assert.equal(difference, 0, `Mtavruli mask clipping ${route} at ${width}`);
    }
    await goto(page, '/ka');
    const broken = await page.locator('.work-heading').evaluateAll(els => els.filter(el => {
      const words = el.textContent.split(/\s+/).filter(Boolean);
      const probe = document.createElement('span'); probe.style.cssText = 'position:absolute;white-space:nowrap;visibility:hidden';
      el.append(probe);
      const fits = words.every(w => { probe.textContent = w; return probe.getBoundingClientRect().width <= el.clientWidth + 0.5; });
      probe.remove(); return !fits;
    }).map(el => el.textContent));
    assert.deepEqual(broken, [], `Mtavruli word wider than its heading at ${width}`);
  }
  results.mtavruli = 'ka /work + detail h1 masks 0 px; no heading word wider than its box at 1440/1024/390';
  await page.setViewportSize({ width: 1440, height: 900 }); await goto(page, '/ka');
  await scroll(page, '#work-title', 120); await shot(page, 'mtavruli-ka-work-1440');
  await goto(page, '/ka/work'); await page.waitForTimeout(900); await shot(page, 'mtavruli-ka-work-index-1440');
  await page.setViewportSize({ width: 390, height: 844 }); await goto(page, '/ka');
  await scroll(page, '.work-pair'); await shot(page, 'work-08-mobile-featured-390');
  await scroll(page, '.work-category'); await shot(page, 'work-09-mobile-category-390');
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(page, '/ka/work'); await page.keyboard.press('Tab'); await page.waitForTimeout(1100); await shot(page, 'work-11-index-ka-1440');
  await page.locator('.work-card').first().click(); await page.waitForURL('**/ka/work/forma');
  await page.locator('.work-back').click(); await page.waitForURL('**/ka/work');
  await goto(page, '/en/work/forma'); await shot(page, 'work-12-detail-en-1440');
  for (const locale of ['ka', 'en']) {
    const response = await page.request.get(`${origin}/${locale}/work/not-a-project`); assert.equal(response.status(), 404);
    for (const slug of ['forma', 'axis', 'field', 'interval', 'layer', 'route']) assert.equal((await page.request.get(`${origin}/${locale}/work/${slug}`)).status(), 200);
    await goto(page, `/${locale}/work/forma`);
    assert((await page.locator('link[rel="canonical"]').getAttribute('href')).endsWith(`/${locale}/work/forma`));
    assert.equal(await page.locator('link[rel="alternate"][hreflang]').count(), 3);
  }
  const reduced = await newPage(1440, 'reduce');
  await goto(reduced, '/ka');
  const visible = await reduced.locator('.work-card, .work-all').evaluateAll(els => els.every(el => { const s = getComputedStyle(el); return s.opacity === '1' && s.visibility === 'visible'; }));
  assert(visible, 'reduced motion: every card and All work visible');
  await scroll(reduced, '.work-pair'); await shot(reduced, 'work-10-reduced-motion-1440');
  const ry = await reduced.locator('.work-parallax').first().evaluate(el => getComputedStyle(el).transform);
  assert.equal(ry, 'none');
  assert.equal(await reduced.locator('.work-drag[data-enhanced]').count(), 0);
  results.reducedMotion = 'all 11 cards and All work visible; no parallax/custom drag';
  await reduced.close();
  const composites = [
    ['pair', '02-featured-pair', '01-featured-pair-1440'],
    ['wide', '03-wide-card', '02-wide-card-1440'],
    ['category', '10-category-reveal-end', '05-category-settled-1440'],
    ['mobile', '14-mobile-category-carousel', '09-mobile-category-390'],
  ];
  for (const [name, reference, own] of composites) {
    const width = name === 'mobile' ? 390 : 720;
    const a = await sharp(`docs/research/frames/work-${reference}.jpg`).resize({ width }).toBuffer();
    const b = await sharp(`${out}/work-${own}.jpg`).resize({ width }).toBuffer();
    const am = await sharp(a).metadata(), bm = await sharp(b).metadata();
    await sharp({ create: { width: width * 2, height: Math.max(am.height, bm.height), channels: 3, background: '#ddd' } }).composite([{ input: a, left: 0, top: 0 }, { input: b, left: width, top: 0 }]).jpeg({ quality: 82 }).toFile(`${out}/work-compare-${name}.jpg`);
  }
  assert.deepEqual(errors, [], 'browser errors');
  console.log(JSON.stringify({ ...results, errors, screenshots: 16 }, null, 2));
} finally { await browser.close(); }
