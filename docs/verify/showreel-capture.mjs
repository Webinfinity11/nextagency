// VERIFY_DEPS=/tmp/nextagency-verify VERIFY_URL=http://127.0.0.1:3019 node docs/verify/showreel-capture.mjs
// Showreel panel at 1440 and 390: at rest and mid-scroll, with a dummy blurred video (ffmpeg in /tmp, served by
// route interception — public/media is never touched) and with the video 404ing (panel must stay plain black).
// Writes docs/verify/showreel-{1440,390}-{video,missing}-{rest,mid}.jpg and prints wordmark/frame geometry.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const deps = process.env.VERIFY_DEPS || "/tmp/nextagency-verify";
const require = createRequire(path.join(deps, "package.json"));
const { chromium } = require("playwright");
const origin = process.env.VERIFY_URL || "http://127.0.0.1:3019";
const out = "docs/verify";
const dummy = "/tmp/showreel-dummy.mp4";
if (!fs.existsSync(dummy)) {
  execFileSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=30:duration=6",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", dummy], { stdio: "ignore" });
}
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
const report = [];
for (const [width, height] of [[1440, 900], [390, 844]]) {
  for (const mode of ["video", "missing"]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/media/showreel-bg*", (route) =>
      mode === "video" && route.request().url().endsWith(".mp4")
        ? route.fulfill({ path: dummy, contentType: "video/mp4" })
        : route.fulfill({ status: 404, body: "" }));
    await page.goto(`${origin}/ka`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.documentElement.dataset.loader === "done", null, { timeout: 15000 });
    const regionTop = await page.evaluate(() => document.querySelector(".media-region").getBoundingClientRect().top + scrollY);
    for (const [label, offset] of [["rest", 0], ["mid", 0.5]]) {
      await page.evaluate((y) => window.scrollTo(0, y), regionTop + offset * height * 1.5);
      await page.waitForTimeout(1600);
      const geo = await page.evaluate(() => {
        const r = (el) => el.getBoundingClientRect();
        const frame = r(document.querySelector(".media-frame"));
        const pieces = [...document.querySelectorAll(".media-wordmark [data-piece]")].map(r);
        const v = document.querySelector(".media-video");
        return {
          frameL: Math.round(frame.left), frameR: Math.round(frame.right),
          inkL: Math.round(Math.min(...pieces.map((p) => p.left))),
          inkR: Math.round(Math.max(...pieces.map((p) => p.right))),
          videoFailed: v.hasAttribute("data-failed"), videoPaused: v.paused, videoDisplay: getComputedStyle(v).display,
        };
      });
      const inside = geo.inkL >= geo.frameL && geo.inkR <= geo.frameR;
      report.push({ width, mode, label, inside, ...geo });
      await page.screenshot({ path: `${out}/showreel-${width}-${mode}-${label}.jpg`, type: "jpeg", quality: 80 });
    }
    // Off-screen check: scroll far past the panel, the video must pause.
    if (mode === "video") {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(600);
      report.push({ width, mode, label: "offscreen", paused: await page.evaluate(() => document.querySelector(".media-video").paused) });
    }
    await page.close();
  }
}
await browser.close();
console.table(report);
if (errors.length) console.log("page errors:", errors);
