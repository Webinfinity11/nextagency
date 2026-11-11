// npm install --prefix /tmp/nextagency-verify playwright sharp
// VERIFY_DEPS=/tmp/nextagency-verify node scripts/verify.mjs
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const require = createRequire(
  path.join(
    process.env.VERIFY_DEPS || "/tmp/nextagency-verify-9fde",
    "package.json",
  ),
);
const { chromium } = require("playwright");
const sharp = require("sharp");
const url = process.env.VERIFY_URL || "http://localhost:3018";
const out = "docs/verify";
const raw = path.join(
  process.env.VERIFY_DEPS || "/tmp/nextagency-verify-9fde",
  "frames",
);
fs.mkdirSync(raw, { recursive: true });
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
function watch(page) {
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
}
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
watch(page);
await page.addInitScript(() => {
  window.__cls = 0;
  new PerformanceObserver((list) => {
    for (const e of list.getEntries())
      if (!e.hadRecentInput) window.__cls += e.value;
  }).observe({ type: "layout-shift", buffered: true });
});
await page.goto(url, { waitUntil: "domcontentloaded" });
const samples = [];
async function sample(name) {
  const started = Date.now();
  const data = await page.evaluate(() => {
    const marks = performance.getEntriesByName("loader:start");
    const origin = marks.at(-1)?.startTime;
    const el = (s) => document.querySelector(s);
    const style = (s) => (el(s) ? getComputedStyle(el(s)) : null);
    return {
      time: performance.now(),
      authored: origin === undefined ? null : performance.now() - origin,
      scrollY,
      state: document.documentElement.dataset.loader,
      flicker: style(".loader-flicker")?.opacity,
      clean: style(".loader-clean")?.visibility,
      wipe: style(".loader-wipe")?.transform,
      word: style(".phrase-0 .word")?.transform,
      frame: style(".media-frame")?.transform,
      radius: style(".media-frame")?.borderRadius,
      loader: !!el(".loader"),
      cls: window.__cls,
    };
  });
  await page.screenshot({
    path: path.join(raw, name + ".jpg"),
    type: "jpeg",
    quality: 80,
  });
  samples.push({ name, ...data });
  return Date.now() - started;
}
for (let i = 0; i < 66; i++) {
  const elapsed = await sample("load-" + String(i).padStart(3, "0"));
  await page.waitForTimeout(Math.max(0, 125 - elapsed));
}
await page.waitForFunction(
  () => document.documentElement.dataset.loader === "done",
);
await sample("settled");
const completion = await page.evaluate(() => ({
  duration:
    performance.getEntriesByName("loader:done").at(-1).startTime -
    performance.getEntriesByName("loader:start").at(-1).startTime,
  removed: !document.querySelector(".loader"),
  overflow: getComputedStyle(document.body).overflow,
  cls: window.__cls,
}));
assert.ok(
  Math.abs(completion.duration - 4870) < 100,
  JSON.stringify(completion),
);
assert.ok(completion.removed);
assert.notEqual(completion.overflow, "hidden");
for (let i = 0; i < 45; i++) {
  await page.mouse.wheel(0, 60);
  await page.waitForTimeout(i === 44 ? 350 : 100);
  await sample("scroll-" + String(i).padStart(3, "0"));
}
const range = await page.evaluate(() => ({
  top:
    document.querySelector(".media-region").getBoundingClientRect().top +
    scrollY,
  length: innerHeight * 1.5,
}));
const scaleChecks = [];
for (const [scroll, expected] of [
  [range.top + 0.2 * range.length, 1],
  [range.top + range.length, 0.65],
]) {
  await page.waitForTimeout(500);
  await page.mouse.wheel(0, scroll - (await page.evaluate(() => scrollY)));
  await page.waitForTimeout(1400);
  const result = await page.evaluate(() => ({
    scroll: scrollY,
    scale: new DOMMatrix(
      getComputedStyle(document.querySelector(".media-frame")).transform,
    ).a,
    radius: getComputedStyle(document.querySelector(".media-frame"))
      .borderRadius,
  }));
  assert.ok(Math.abs(result.scale - expected) < 0.005, JSON.stringify(result));
  scaleChecks.push(result);
}
const keyNames = [
  "01-sequence-solid",
  "02-sequence-distorted",
  "03-clean-mark",
  "04-white-wipe",
  "05-nav-handoff",
  "06-words-enter",
  "07-hero-settled",
  "08-scroll-876",
  "09-scroll-1777",
  "10-scroll-2693",
];
const timeTargets = [150, 1400, 3150, 3670, 4380, 5400];
const selected = timeTargets.map((t) =>
  samples
    .filter((s) => s.authored !== null && s.name.startsWith("load"))
    .reduce((a, b) =>
      Math.abs(a.authored - t) < Math.abs(b.authored - t) ? a : b,
    ),
);
selected.push(samples.find((s) => s.name === "settled"));
for (const y of [876, 1777, 2693])
  selected.push(
    samples
      .filter((s) => s.name.startsWith("scroll"))
      .reduce((a, b) =>
        Math.abs(a.scrollY - y) < Math.abs(b.scrollY - y) ? a : b,
      ),
  );
for (let i = 0; i < selected.length; i++)
  await sharp(path.join(raw, selected[i].name + ".jpg"))
    .resize({ width: 720 })
    .toFile(path.join(out, keyNames[i] + ".jpg"));
await page.reload({ waitUntil: "domcontentloaded" });
const returning = await page.evaluate(() => ({
  state: document.documentElement.dataset.loader,
  display: document.querySelector(".loader")
    ? getComputedStyle(document.querySelector(".loader")).display
    : "removed",
}));
assert.ok(["skip", "done"].includes(returning.state));
assert.ok(["none", "removed"].includes(returning.display));
await page.waitForTimeout(2400);
assert.ok(
  await page
    .locator(".phrase-0 .word")
    .first()
    .evaluate(
      (e) => Math.abs(new DOMMatrix(getComputedStyle(e).transform).m42) < 1,
    ),
);
// Actual keyboard navigation and CTA flow.
await page.keyboard.press("Tab");
const focus = await page.evaluate(() => ({
  text: document.activeElement.textContent,
  outline: getComputedStyle(document.activeElement).outlineStyle,
}));
assert.equal(focus.outline, "solid");
await page.locator(".nav-cta").click();
await page.waitForTimeout(1400);
assert.equal(new URL(page.url()).hash, "#contact");
const responsive = [];
for (const viewport of [
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
]) {
  const p = await browser.newPage({ viewport });
  watch(p);
  await p.addInitScript(() =>
    sessionStorage.setItem("next-agency:loaded", "1"),
  );
  await p.goto(url);
  await p.waitForTimeout(2500);
  const result = await p.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    nav: getComputedStyle(document.querySelector(".nav-logo")).visibility,
  }));
  assert.equal(result.width, result.scrollWidth);
  responsive.push(result);
  await p.screenshot({
    path: path.join(out, `viewport-${viewport.width}.jpg`),
  });
  await p.close();
}
const reduced = await browser.newPage({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});
watch(reduced);
await reduced.goto(url);
await reduced.waitForTimeout(700);
const reduction = await reduced.evaluate(() => ({
  loader: !!document.querySelector(".loader"),
  word: getComputedStyle(document.querySelector(".word")).transform,
  frame: getComputedStyle(document.querySelector(".media-frame")).transform,
  marks: performance
    .getEntriesByType("mark")
    .filter((e) => e.name.startsWith("loader"))
    .map((e) => ({ name: e.name, time: e.startTime })),
  overflow: getComputedStyle(document.body).overflow,
}));
assert.equal(reduction.loader, false);
assert.equal(reduction.word, "none");
assert.equal(reduction.frame, "none");
assert.notEqual(reduction.overflow, "hidden");
await reduced.screenshot({ path: path.join(out, "reduced-motion.jpg") });
await reduced.close();
assert.deepEqual(errors, []);
const report = {
  completion,
  scaleChecks,
  returning,
  focus,
  responsive,
  reduction,
  errors,
  keyframes: selected.map((s, i) => ({ file: keyNames[i] + ".jpg", ...s })),
};
fs.writeFileSync(
  path.join(out, "measurements.json"),
  JSON.stringify(report, null, 2),
);
fs.writeFileSync(
  path.join(raw, "samples.json"),
  JSON.stringify(samples, null, 2),
);
console.log(JSON.stringify(report, null, 2));
await browser.close();
