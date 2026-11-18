// VERIFY_DEPS=/tmp/kaistudio-verify VERIFY_URL=http://127.0.0.1:3019 node docs/verify/header-smooth-capture.mjs
// Captures the header strip from the wipe to settled (video resampled at 30fps) and the box's transform x on every
// rendered frame, writing header-smooth-{strip.jpg,boxx.json,plot.jpg,mobile.jpg}.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const deps = process.env.VERIFY_DEPS || "/tmp/kaistudio-verify";
const require = createRequire(path.join(deps, "package.json"));
const { chromium } = require("playwright");
const sharp = require("sharp");
const origin = process.env.VERIFY_URL || "http://127.0.0.1:3019";
const out = "docs/verify";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const result = {};
const errors = [];

async function sampleFrame(page) {
  return page.evaluate(() => {
    const box = document.querySelector(".nav-start");
    const end = document.querySelector(".nav-end");
    const m = new DOMMatrix(getComputedStyle(box).transform === "none" ? undefined : getComputedStyle(box).transform);
    const start = performance.getEntriesByName("loader:start").at(-1)?.startTime;
    return {
      t: start === undefined ? null : +((performance.now() - start) / 1000).toFixed(4),
      x: m.m41, scale: m.a,
      boxOpacity: +getComputedStyle(box).opacity,
      endOpacity: +getComputedStyle(end).opacity,
      endX: new DOMMatrix(getComputedStyle(end).transform === "none" ? undefined : getComputedStyle(end).transform).m41,
      layoutLeft: box.offsetLeft, layoutWidth: box.offsetWidth,
      endLeft: end.offsetLeft, clientWidth: document.documentElement.clientWidth,
      scrollY, state: document.documentElement.dataset.loader,
    };
  });
}

// Real-time run: an in-page rAF logger samples every rendered frame; screenshots are taken as fast as
// the browser allows and then resampled to a 30fps grid by timestamp.
const logger = () => {
  window.__frames = [];
  const tick = () => {
    const box = document.querySelector(".nav-start");
    const start = performance.getEntriesByName("loader:start").at(-1)?.startTime;
    if (box && start !== undefined) {
      const tf = getComputedStyle(box).transform;
      window.__frames.push({ t: (performance.now() - start) / 1000, x: tf === "none" ? 0 : new DOMMatrix(tf).m41 });
    }
    if (!performance.getEntriesByName("loader:settled").length) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
const since = (page) => page.evaluate(() => {
  const s = performance.getEntriesByName("loader:start").at(-1)?.startTime;
  return s === undefined ? -1 : (performance.now() - s) / 1000;
});
for (const locale of ["ka", "en"]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(logger);
  await page.goto(`${origin}/${locale}`, { waitUntil: "domcontentloaded" });
  const frames = [];
  while ((await since(page)) < 3.8) await page.waitForTimeout(20);
  // Light layout probe (~10/s) so the rAF series is not disturbed.
  for (;;) {
    const s = await sampleFrame(page);
    frames.push(s);
    if (s.t > 7.2) break;
    await page.waitForTimeout(80);
  }
  await page.waitForFunction(() => performance.getEntriesByName("loader:settled").length);
  const settled = await sampleFrame(page);
  const raf = await page.evaluate(() => window.__frames.filter((f) => f.t >= 3.8));
  result[locale] = { raf, frames, settled };
  await page.close();
}

// Strip: Playwright's screencast video, cut from loader time 3.8s to 7.2s and resampled at 30fps.
{
  const videoDir = path.join(deps, "header-video");
  fs.rmSync(videoDir, { recursive: true, force: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } } });
  const opened = Date.now();
  const page = await context.newPage();
  await page.goto(`${origin}/ka`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => performance.getEntriesByName("loader:settled").length, null, { timeout: 15000 });
  const startEpoch = await page.evaluate(() => performance.timeOrigin + performance.getEntriesByName("loader:start").at(-1).startTime);
  await page.waitForTimeout(500);
  await context.close();
  const video = await page.video().path();
  const from = (startEpoch - opened) / 1000 + 3.8;
  const framesDir = path.join(videoDir, "frames");
  fs.mkdirSync(framesDir, { recursive: true });
  execFileSync("ffmpeg", ["-loglevel", "error", "-ss", from.toFixed(3), "-i", video, "-t", "3.4", "-vf", "fps=30,crop=1440:76:0:0,scale=720:38", path.join(framesDir, "f%03d.png")]);
  const files = fs.readdirSync(framesDir).filter((f) => f.endsWith(".png")).sort();
  const rows = Math.ceil(files.length / 2);
  await sharp({ create: { width: 1440, height: rows * 38, channels: 3, background: "#fff" } })
    .composite(files.map((f, i) => ({ input: path.join(framesDir, f), left: i < rows ? 0 : 720, top: (i % rows) * 38 })))
    .jpeg({ quality: 82 }).toFile(path.join(out, "header-smooth-strip.jpg"));
  result.stripFrames = files.length;
}

// Non-loader header (repeat visit) must match the settled loader header geometry.
const repeat = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await repeat.goto(`${origin}/ka`, { waitUntil: "load" });
await repeat.evaluate(() => sessionStorage.setItem("kai-studio:loaded", "1"));
await repeat.goto(`${origin}/ka`, { waitUntil: "load" });
result.repeat = await sampleFrame(repeat);
await repeat.close();

// Reduced motion.
const reduced = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
await reduced.goto(`${origin}/en`, { waitUntil: "load" });
result.reduced = await sampleFrame(reduced);
await reduced.close();

// Mobile: no slide, language box only.
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await mobile.addInitScript(logger);
await mobile.goto(`${origin}/ka`, { waitUntil: "domcontentloaded" });
await mobile.waitForFunction(() => performance.getEntriesByName("loader:settled").length, null, { timeout: 15000 });
const mobileRaf = await mobile.evaluate(() => window.__frames);
result.mobile = { frames: mobileRaf.length, maxAbsX: Math.max(...mobileRaf.map((f) => Math.abs(f.x))), settled: await sampleFrame(mobile) };
await mobile.screenshot({ path: path.join(out, "header-smooth-mobile.jpg"), clip: { x: 0, y: 0, width: 390, height: 120 }, quality: 85 });
await mobile.close();
await browser.close();

// Monotonic check of the slide on every rendered frame: x never increases, no plateau mid-slide.
const raf = result.ka.raf;
const xs = raf.map((f) => f.x);
const moving = xs.map((x, i) => (i ? xs[i - 1] - x : 0));
const first = moving.findIndex((d) => d > 0.01);
const last = moving.findLastIndex((d) => d > 0.01);
const inside = raf.slice(first, last + 1);
// Resample x onto a 30fps grid from the last still sample; share of the distance moved per frame.
const total = xs[0];
const t0s = raf[first - 1].t;
const at = (t) => {
  const j = raf.findIndex((f) => f.t >= t);
  if (j <= 0) return raf[Math.max(j, 0)].x;
  const a = raf[j - 1], b = raf[j];
  return a.x + (b.x - a.x) * (t - a.t) / (b.t - a.t);
};
const grid30 = Array.from({ length: 6 }, (_, i) => at(t0s + i / 30));
const firstFrameShares = grid30.slice(1).map((x, i) => +((grid30[i] - x) / total * 100).toFixed(2));
const firstSampleShares = raf.slice(first, first + 3).map((f, i) => +((raf[first - 1 + i].x - f.x) / total * 100).toFixed(2));
result.check = {
  monotonic: moving.every((d) => d >= -1e-6),
  slideStart: raf[first - 1]?.t, slideEnd: raf[last]?.t,
  slideFrames: inside.length,
  firstFramesPercent30fps: firstFrameShares,
  firstRenderedFramesPercent: firstSampleShares,
  plateausInsideSlide: moving.slice(first, last + 1).filter((d) => d <= 0.01).length,
  maxFrameGapMs: Math.max(...inside.map((f, i) => (i ? (f.t - inside[i - 1].t) * 1000 : 0))),
  fractionalSamples: inside.filter((f) => Math.abs(f.x - Math.round(f.x)) > 0.01).length,
  layoutStable: new Set(result.ka.frames.map((f) => `${f.layoutLeft},${f.layoutWidth},${f.endLeft},${f.clientWidth},${f.scrollY}`)).size === 1,
  settledAt: raf.at(-1)?.t,
  stripFrames: result.stripFrames,
  errors,
};
fs.writeFileSync(path.join(out, "header-smooth-boxx.json"), JSON.stringify(result, null, 1));

// Plot box x per frame.
const W = 1200, H = 500, pad = 50, max = Math.max(...xs, 1);
const t0 = raf[0].t, t1 = raf.at(-1).t;
const pts = raf.map((f) => `${pad + ((f.t - t0) / (t1 - t0)) * (W - 2 * pad)},${H - pad - (f.x / max) * (H - 2 * pad)}`);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#fff"/>
<polyline points="${pts.join(" ")}" fill="none" stroke="#111" stroke-width="2"/>
${pts.map((p) => `<circle cx="${p.split(",")[0]}" cy="${p.split(",")[1]}" r="2.5" fill="#d33"/>`).join("")}
<text x="${pad}" y="30" font-family="sans-serif" font-size="16">.nav-start translateX per rendered frame (/ka, 1440×900), t = ${t0.toFixed(2)}s → ${t1.toFixed(2)}s; max ${max.toFixed(1)}px</text></svg>`;
await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(path.join(out, "header-smooth-plot.jpg"));
console.log(JSON.stringify({ check: result.check, repeat: result.repeat, settled: result.ka.settled, en: result.en.settled, reduced: result.reduced, mobile: { frames: result.mobile.frames, maxAbsX: result.mobile.maxAbsX } }));
