// npm install --prefix /tmp/kaistudio-verify playwright sharp
// VERIFY_DEPS=/tmp/kaistudio-verify VERIFY_URL=http://127.0.0.1:3019 node scripts/verify.mjs
// VERIFY_URL is the server origin; the loader/hero pass runs on the default locale (/ka).
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const require = createRequire(
  path.join(
    process.env.VERIFY_DEPS || "/tmp/kaistudio-verify",
    "package.json",
  ),
);
const { chromium } = require("playwright");
const sharp = require("sharp");
const origin = process.env.VERIFY_URL || "http://127.0.0.1:3019";
const url = origin + "/ka";
const out = "docs/verify";
const raw = path.join(
  process.env.VERIFY_DEPS || "/tmp/kaistudio-verify",
  "frames",
);
fs.mkdirSync(raw, { recursive: true });
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
const warnings = [];
function watch(page) {
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
    if (m.type() === "warning") warnings.push(m.text());
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
    sessionStorage.setItem("kai-studio:loaded", "1"),
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
// ---- i18n: /ka and /en ----
// Pixels that change when every mask is opened = glyph ink the mask cuts off.
async function clipDiff(p) {
  const shot = async (open) => {
    await p.evaluate((open) => {
      let s = document.getElementById("__verify");
      if (!s) {
        s = document.createElement("style");
        s.id = "__verify";
        document.head.append(s);
      }
      s.textContent =
        ".phrase-1{visibility:hidden!important}" +
        (open
          ? ".word-mask,.closing-mask,.support-copy>div{overflow:visible!important;clip-path:none!important}"
          : "");
    }, open);
    await p.waitForTimeout(50);
    return sharp(await p.screenshot())
      .raw()
      .toBuffer({ resolveWithObject: true });
  };
  const a = await shot(false);
  const b = await shot(true);
  await p.evaluate(() => document.getElementById("__verify").remove());
  let diff = 0;
  for (let i = 0; i < a.data.length; i += a.info.channels)
    if (Math.abs(a.data[i] - b.data[i]) > 40) diff++;
  return diff;
}
// Dark pixels inside h1 while every word sits in its hidden (105%) state.
async function hiddenLeak(p) {
  await p.addStyleTag({
    content: ".word,.stat-word{transform:translateY(105%)!important}",
  });
  const box = await p.locator("h1").boundingBox();
  const { data, info } = await sharp(await p.screenshot({ clip: box }))
    .raw()
    .toBuffer({ resolveWithObject: true });
  let dark = 0;
  for (let i = 0; i < data.length; i += info.channels)
    if (data[i] < 200) dark++;
  return dark;
}
const toSupport = (p, at = 0) =>
  p.evaluate(
    (at) =>
      window.scrollTo(
        0,
        document.querySelector(".support").getBoundingClientRect().top +
          scrollY -
          innerHeight * at,
      ),
    at,
  );
const supportLines = (p, selector = ".support-copy>div>div, .closing-line") =>
  p.evaluate((selector) =>
    [...document.querySelectorAll(selector)].map((l) => new DOMMatrix(getComputedStyle(l).transform).m42),
  selector);
const i18n = { layouts: {} };
for (const locale of ["ka", "en"])
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
  ]) {
    const p = await browser.newPage({ viewport });
    watch(p);
    await p.addInitScript(() =>
      sessionStorage.setItem("kai-studio:loaded", "1"),
    );
    const response = await p.goto(`${origin}/${locale}`);
    assert.equal(response.status(), 200);
    await p.waitForTimeout(2600);
    const key = `${locale}-${viewport.width}`;
    const result = await p.evaluate(() => {
      const switcher = document
        .querySelector(".nav-locale")
        .getBoundingClientRect();
      return {
        lang: document.documentElement.lang,
        hreflang: [...document.querySelectorAll("link[hreflang]")].map((l) =>
          l.getAttribute("hreflang"),
        ),
        overflow: document.documentElement.scrollWidth - innerWidth,
        lineOverflow: [...document.querySelectorAll(".headline-line, .stat")]
          .filter((l) => l.scrollWidth > l.clientWidth + 1)
          .map((l) => l.textContent),
        switcher: switcher.width > 0 && switcher.right <= innerWidth,
        // Every hero word inside its column and the h1; lines in a group never overlap.
        wordsOutside: [...document.querySelectorAll(".phrase-0 .word, .phrase-1 .word")]
          .filter((w) => {
            const r = w.getBoundingClientRect();
            const g = w.closest(".headline-group").getBoundingClientRect();
            const h = w.closest("h1").getBoundingClientRect();
            return r.left < g.left - 0.5 || r.right > g.right + 0.5 || r.right > h.right + 0.5;
          })
          .map((w) => w.textContent),
        lineOverlap: [...document.querySelectorAll(".headline-group")].some((g) =>
          [...g.querySelectorAll(".headline-line")].some((l, i, all) =>
            i > 0 && l.getBoundingClientRect().top < all[i - 1].getBoundingClientRect().bottom - 0.5,
          ),
        ),
        // A closing line taller than one line box has wrapped.
        closingWrapped: [...document.querySelectorAll(".closing-line")]
          .filter((l) => l.getBoundingClientRect().height > parseFloat(getComputedStyle(l).lineHeight) * 1.5)
          .map((l) => l.textContent),
      };
    });
    assert.deepEqual(result.wordsOutside, [], key);
    assert.equal(result.lineOverlap, false, key);
    assert.deepEqual(result.closingWrapped, [], key);
    assert.equal(result.lang, locale);
    assert.deepEqual(result.hreflang, ["ka", "en", "x-default"]);
    assert.equal(result.overflow, 0, key);
    assert.deepEqual(result.lineOverflow, [], key);
    assert.ok(result.switcher, key);
    if (viewport.width === 1440 || locale === "ka")
      await p.screenshot({
        path: path.join(out, `i18n-${locale}-hero-${viewport.width}.jpg`),
        quality: 80,
      });
    if (locale === "ka" && viewport.width !== 1024)
      await p.screenshot({
        path: path.join(out, `mtavruli-ka-hero-${viewport.width}.jpg`),
        quality: 80,
      });
    result.heroClip = await clipDiff(p);
    // Scrub now ends when the section top reaches 40% of the viewport.
    await toSupport(p, 0.4);
    await p.waitForTimeout(1600);
    result.supportAt40 = await supportLines(p, ".support-copy>div>div");
    await toSupport(p);
    await p.waitForTimeout(1600);
    result.supportSettled = await supportLines(p);
    if (viewport.width === 1440)
      await p.screenshot({
        path: path.join(out, `i18n-${locale}-support-1440.jpg`),
        quality: 80,
      });
    result.supportClip = await clipDiff(p);
    if (key === "ka-1440") {
      await p.evaluate(() => {
        const h2 = document.querySelector(".support h2").getBoundingClientRect();
        window.scrollTo(0, h2.top + scrollY - (innerHeight - h2.height) / 2);
      });
      await p.waitForTimeout(1200);
      await p.screenshot({ path: path.join(out, "mtavruli-ka-closing-1440.jpg"), quality: 80 });
      result.closingClip = await clipDiff(p);
      assert.equal(result.closingClip, 0, key);
    }
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(600);
    result.hiddenLeak = await hiddenLeak(p);
    for (const t of [...result.supportAt40, ...result.supportSettled])
      assert.ok(Math.abs(t) < 0.5, key + " support line not settled");
    assert.equal(result.supportClip, 0, key);
    assert.equal(result.hiddenLeak, 0, key);
    // English hero has a few pre-existing anti-aliasing pixels at mask edges.
    if (locale === "ka") assert.equal(result.heroClip, 0, key);
    i18n.layouts[key] = result;
    await p.close();
  }
{
  // Glyph source and Mtavruli check.
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  watch(p);
  await p.addInitScript(() =>
    sessionStorage.setItem("kai-studio:loaded", "1"),
  );
  await p.goto(`${origin}/ka`);
  await p.waitForTimeout(1500);
  const cdp = await p.context().newCDPSession(p);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument");
  i18n.fonts = {};
  for (const selector of [".phrase-0 .word", ".closing-line", ".stat-word", ".nav-locale span"]) {
    const { nodeId } = await cdp.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector,
    });
    i18n.fonts[selector] = (
      await cdp.send("CSS.getPlatformFontsForNode", { nodeId })
    ).fonts.map((f) => f.familyName);
  }
  // Mtavruli glyphs (U+1C90 block) must come from Noto Sans Georgian, not a system fallback.
  assert.deepEqual(i18n.fonts[".phrase-0 .word"], ["Noto Sans Georgian"]);
  // Its full stop and space come from Manrope by design; no system fallback font may appear.
  assert.ok(i18n.fonts[".closing-line"].includes("Noto Sans Georgian"));
  assert.ok(i18n.fonts[".closing-line"].every((f) => f === "Noto Sans Georgian" || f.startsWith("Manrope")));
  assert.ok(i18n.fonts[".stat-word"].every((f) => f.startsWith("Manrope")));
  i18n.mtavruli = await p.evaluate(() => {
    const georgian = getComputedStyle(document.body).getPropertyValue("--font-georgian");
    const ranges = [];
    for (const sheet of document.styleSheets)
      for (const rule of sheet.cssRules)
        if (rule instanceof CSSFontFaceRule && /Georgian/.test(rule.style.fontFamily))
          ranges.push(rule.style.getPropertyValue("unicode-range"));
    const width = (text, family) => {
      const s = document.createElement("span");
      s.textContent = text;
      s.style.cssText = `position:absolute;white-space:nowrap;font-weight:800;font-size:100px;font-family:${family}`;
      document.body.append(s);
      const w = s.getBoundingClientRect().width;
      s.remove();
      return w;
    };
    const text = [...document.querySelectorAll(".phrase-0 .word")].map((w) => w.textContent).join(" ");
    return {
      text,
      allMtavruli: /^[\u1C90-\u1CBF\s.,!?—-]+$/.test(text),
      unicodeRange: ranges.find((r) => /U\+1C90/i.test(r)) ?? null,
      noto: width(text, georgian),
      fallback: width(text, "sans-serif"),
      ariaLabel: document.querySelector("h1").getAttribute("aria-label"),
    };
  });
  assert.ok(i18n.mtavruli.allMtavruli, i18n.mtavruli.text);
  assert.ok(i18n.mtavruli.unicodeRange, "Georgian @font-face covers U+1C90");
  assert.ok(Math.abs(i18n.mtavruli.noto - i18n.mtavruli.fallback) > 10, "Noto vs fallback width");
  assert.match(i18n.mtavruli.ariaLabel, /^[\u10D0-\u10FF\s.,]+$/, "aria-label stays Mkhedruli");
  await p.close();
}
{
  // Fresh session: loader frame, then the switcher must not replay it.
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const p = await context.newPage();
  watch(p);
  await p.addInitScript(() => {
    window.__overlayFrames = 0;
    const tick = () => {
      const loader = document.querySelector(".loader");
      if (
        loader &&
        getComputedStyle(loader).display !== "none" &&
        document.documentElement.dataset.loader !== "running"
      )
        window.__overlayFrames++;
      if (
        loader &&
        getComputedStyle(loader).display !== "none" &&
        sessionStorage.getItem("kai-studio:loaded")
      )
        window.__overlayFrames++;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await p.goto(`${origin}/ka`);
  await p.waitForFunction(
    () => performance.getEntriesByName("loader:start").length,
  );
  await p.waitForTimeout(3150);
  await p.screenshot({
    path: path.join(out, "i18n-ka-loader.jpg"),
    quality: 80,
  });
  await p.waitForFunction(
    () => document.documentElement.dataset.loader === "done",
  );
  await p.evaluate(() => (window.__sameDocument = true));
  await p.locator(".nav-locale").click();
  await p.waitForURL(`${origin}/en`);
  await p.waitForTimeout(2600);
  i18n.switch = await p.evaluate(() => ({
    url: location.pathname,
    lang: document.documentElement.lang,
    state: document.documentElement.dataset.loader,
    softNavigation: window.__sameDocument === true,
    overlayFrames: window.__overlayFrames,
    overlayPresent: !!document.querySelector(".loader"),
    heroWord: new DOMMatrix(
      getComputedStyle(document.querySelector(".phrase-0 .word")).transform,
    ).m42,
  }));
  assert.equal(i18n.switch.lang, "en");
  assert.equal(i18n.switch.overlayFrames, 0);
  assert.ok(Math.abs(i18n.switch.heroWord) < 1);
  await context.close();
}
assert.deepEqual(errors, []);
const report = {
  i18n,
  warnings,
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
