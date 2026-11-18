// VERIFY_DEPS=/tmp/kaistudio-verify VERIFY_URL=http://127.0.0.1:3047 node docs/verify/loader-v4-capture.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(`${process.env.VERIFY_DEPS || '/tmp/kaistudio-verify'}/package.json`);
const { chromium } = require('playwright');
const sharp = require('sharp');
const origin = process.env.VERIFY_URL || 'http://127.0.0.1:3047';
const out = 'docs/verify';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.on('pageerror', e => errors.push(e.message));
// Per-frame geometry of the boiling N and the clean N.
await page.addInitScript(() => {
  window.nSamples = [];
  const rect = el => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; };
  const tick = () => {
    const start = performance.getEntriesByName('loader:start')[0];
    const boil = document.querySelector('.loader-flicker'), clean = document.querySelector('.loader-white-logo');
    if (start && boil && clean) window.nSamples.push({
      t: performance.now() - start.startTime,
      boilVisible: getComputedStyle(boil).visibility === 'visible', cleanVisible: getComputedStyle(clean).visibility === 'visible',
      boil: rect(boil.querySelector('[data-mark-style="white"] use')), clean: rect(clean.querySelector('[data-letter="l-n1"]')),
      src: rect(document.querySelector('.loader-dark-logo [data-wordmark="w-next"]')), dst: rect(document.querySelector('.nav-logo [data-wordmark="w-next"]')),
      logoVisible: getComputedStyle(document.querySelector('.nav-logo')).visibility === 'visible',
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
const cdp = await page.context().newCDPSession(page);
const stream = [];
cdp.on('Page.screencastFrame', frame => { stream.push({ time: frame.metadata.timestamp * 1000, data: frame.data }); void cdp.send('Page.screencastFrameAck', { sessionId: frame.sessionId }); });
await cdp.send('Page.startScreencast', { format: 'png', maxWidth: 1440, maxHeight: 900, everyNthFrame: 1 });
await page.goto(`${origin}/ka`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => performance.getEntriesByName('loader:start').length);
const epoch = await page.evaluate(() => performance.timeOrigin + performance.getEntriesByName('loader:start')[0].startTime);
await page.waitForFunction(() => performance.getEntriesByName('loader:settled').length, null, { timeout: 15000 });
await cdp.send('Page.stopScreencast');
const timing = await page.evaluate(() => Object.fromEntries(['start', 'resolved', 'handoff', 'done', 'settled'].map(k => [k, performance.getEntriesByName(`loader:${k}`)[0]?.startTime])));
const rel = Object.fromEntries(Object.entries(timing).map(([k, v]) => [k, v - timing.start]));
const samples = await page.evaluate(() => window.nSamples);

// 1) Seam geometry: last boiling-N frame vs first clean-N frame.
const lastBoil = samples.findLast(s => s.boilVisible && !s.cleanVisible);
const firstClean = samples.find(s => s.cleanVisible && !s.boilVisible);
const rectDelta = Math.max(...['x', 'y', 'width', 'height'].map(k => Math.abs(lastBoil.boil[k] - firstClean.clean[k])));
assert(rectDelta <= 1, `N geometry differs ${rectDelta}px across the swap`);

// 2) Seam pixels: compositor frames either side of the swap, cropped to the N.
const at = t => stream.findLast(f => f.time <= epoch + t) || stream[0];
const before = at(rel.resolved - 1), after = stream.find(f => f.time > epoch + rel.resolved + 1) || at(rel.resolved + 40);
const n = firstClean.clean;
const crop = { left: Math.floor(n.x) - 12, top: Math.floor(n.y) - 12, width: Math.ceil(n.width) + 24, height: Math.ceil(n.height) + 24 };
const grey = async f => sharp(Buffer.from(f.data, 'base64')).extract(crop).greyscale().raw().toBuffer();
const [a, b] = [await grey(before), await grey(after)];
const ink = d => { let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let y = 0; y < crop.height; y++) for (let x = 0; x < crop.width; x++) if (d[y * crop.width + x] > 127) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return { x0, y0, x1, y1 }; };
const inkA = ink(a), inkB = ink(b);
const inkDelta = Math.max(...['x0', 'y0', 'x1', 'y1'].map(k => Math.abs(inkA[k] - inkB[k])));
let changed = 0; for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 64) changed++;
assert(inkDelta <= 1, `N ink bounds move ${inkDelta}px across the swap`);
const diff = Buffer.from(a.map((v, i) => Math.abs(v - b[i])));
const zoom = buf => sharp(buf, { raw: { width: crop.width, height: crop.height, channels: 1 } }).resize(crop.width * 4, crop.height * 4, { kernel: 'nearest' }).png().toBuffer();
const zw = crop.width * 4, zh = crop.height * 4;
await sharp({ create: { width: zw * 3 + 20, height: zh, channels: 3, background: '#f00' } })
  .composite([{ input: await zoom(a), left: 0, top: 0 }, { input: await zoom(b), left: zw + 10, top: 0 }, { input: await zoom(diff), left: zw * 2 + 20, top: 0 }])
  .jpeg({ quality: 92 }).toFile(`${out}/loader-v4-seam.jpg`);

// 3) 12fps sample-and-hold frames for the first 4.5s + contact sheet.
const frames = [];
for (let i = 0; i < 54; i++) {
  const t = i * 1000 / 12, f = at(t), file = `${out}/loader-v4-${String(i + 1).padStart(3, '0')}.jpg`;
  await sharp(Buffer.from(f.data, 'base64')).jpeg({ quality: 85 }).toFile(file);
  frames.push({ file, t, capturedAt: f.time - epoch });
}
const label = t => Buffer.from(`<svg width="240" height="150"><rect width="58" height="18" fill="#ddd"/><text x="4" y="13" font-size="11" font-family="sans-serif">${(t / 1000).toFixed(2)}s</text></svg>`);
const tiles = await Promise.all(frames.map(async (f, i) => ({ input: await sharp(await sharp(f.file).resize(240, 150).toBuffer()).composite([{ input: label(f.t) }]).toBuffer(), left: i % 6 * 240, top: Math.floor(i / 6) * 150 })));
await sharp({ create: { width: 1440, height: Math.ceil(frames.length / 6) * 150, channels: 3, background: '#ddd' } }).composite(tiles).jpeg({ quality: 90 }).toFile(`${out}/loader-v4-contact-sheet.jpg`);

// 4) Later sequence keeps v3's relative timing, shifted by 0.48s.
assert(Math.abs(rel.resolved - 2920) < 120 && Math.abs(rel.handoff - 5050) < 120 && Math.abs(rel.done - 5380) < 120 && rel.settled > 6330 && rel.settled < 6500, JSON.stringify(rel));
assert.equal(await page.evaluate(() => document.documentElement.dataset.loader), 'done');
assert.equal(await page.locator('.loader').count(), 0);
// Travel ends exactly on the header NEXT (ink to ink), so the logo swap is invisible.
const handoff = samples.find(s => s.logoVisible);
const handoffDelta = Math.max(...['x', 'y', 'width', 'height'].map(k => Math.abs(handoff.src[k] - handoff.dst[k])));
assert(handoffDelta < .5, `handoff differs ${handoffDelta}px`);
const travel = samples.filter(s => s.t > rel.handoff - 700 && s.t < rel.handoff);
const centreX = s => s.src.x + s.src.width / 2;
const maxStep = Math.max(...travel.slice(1).map((s, i) => Math.abs(centreX(s) - centreX(travel[i]))));

// Mobile 390: the larger NEXT is capped and keeps a margin.
const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
phone.on('pageerror', e => errors.push(e.message));
await phone.goto(`${origin}/ka`);
await phone.waitForFunction(() => performance.getEntriesByName('loader:resolved').length);
await phone.waitForTimeout(700);
const mobile = await phone.evaluate(() => { const r = document.querySelector('.loader-white-logo [data-wordmark="w-next"]').getBoundingClientRect(); return { left: r.left, right: innerWidth - r.right, width: r.width }; });
assert(mobile.left >= 16 && mobile.right >= 16, JSON.stringify(mobile));
await phone.screenshot({ path: `${out}/loader-v4-mobile-390.jpg`, type: 'jpeg', quality: 85 });
await phone.waitForFunction(() => performance.getEntriesByName('loader:settled').length, null, { timeout: 15000 });
await phone.close();

// 5) Repeat visit and reduced motion: final state immediately.
await page.reload();
await page.waitForFunction(() => document.documentElement.dataset.loader === 'done');
assert.equal(await page.evaluate(() => performance.getEntriesByName('loader:start').length), 0);
const reduced = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await reduced.goto(`${origin}/ka`);
await reduced.waitForFunction(() => document.documentElement.dataset.loader === 'done');
assert.equal(await reduced.evaluate(() => performance.getEntriesByName('loader:start').length), 0);
assert.deepEqual(errors, []);
const seam = { lastBoil, firstClean, rectDeltaPx: rectDelta, frameBefore: before.time - epoch, frameAfter: after.time - epoch, inkBefore: inkA, inkAfter: inkB, inkDeltaPx: inkDelta, pixelsChangedOver64: changed, cleanNWidth: firstClean.clean.width };
await fs.writeFile(`${out}/loader-v4-measurements.json`, JSON.stringify({ timing: rel, seam, handoffDeltaPx: handoffDelta, travelMaxStepPx: maxStep, mobile, frames, errors }, null, 2));
console.log(JSON.stringify({ timing: rel, rectDeltaPx: rectDelta, inkDeltaPx: inkDelta, changed, boilN: lastBoil.boil, cleanN: firstClean.clean, handoffDelta, maxStep, mobile }, null, 2));
await browser.close();
