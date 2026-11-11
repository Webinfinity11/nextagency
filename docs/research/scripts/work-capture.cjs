// Work / Selected Work + category showcase research pass for https://www.tinywins.com/
// Run from the repository root with playwright installed in a scratch dir outside the repo:
//   CHROME_CHANNEL=chrome NODE_PATH=/tmp/<scratch>/node_modules node docs/research/scripts/work-capture.cjs [desktop|mobile]   (reduced motion: see work-reduced.cjs)
// Writes screenshots + JSON to docs/research/frames/raw/work/<config>/ (git-ignored). No site assets are saved.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const CONFIGS = {
  desktop: { viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, reducedMotion: 'no-preference' },
};
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CONFIGS);

// Turbopack keeps modules private. Wrap every module factory so that when a module
// exports `ScrollTrigger` or `gsap` we keep a reference on window.__tw (read-only use).
function hookTurbopack() {
  let v;
  const wrapF = (f) => function (e) {
    try {
      const os = e && e.s;
      if (typeof os === 'function') {
        e.s = function (a, ...rest) {
          try {
            if (Array.isArray(a)) for (let i = 0; i < a.length; i++) {
              if (a[i] === 'ScrollTrigger' || a[i] === 'gsap' || a[i] === 'getFlip') {
                window.__tw = window.__tw || {};
                window.__tw[a[i]] = a[i + 1] === 0 ? { value: a[i + 2] } : { getter: a[i + 1] };
              }
            }
          } catch {}
          return os.call(this, a, ...rest);
        };
      }
    } catch {}
    return f.apply(this, arguments);
  };
  const wrapItem = (it) => { if (Array.isArray(it)) for (let i = 0; i < it.length; i++) if (typeof it[i] === 'function') it[i] = wrapF(it[i]); return it; };
  const wrapPush = (o) => {
    if (!o || o.__twWrapped) return o;
    const op = o.push;
    o.push = function (...items) { return op.apply(this, items.map(wrapItem)); };
    Object.defineProperty(o, '__twWrapped', { value: true });
    if (Array.isArray(o)) o.forEach(wrapItem);
    return o;
  };
  Object.defineProperty(globalThis, 'TURBOPACK', { configurable: true, get() { return v; }, set(n) { v = wrapPush(n); } });
  window.__twGet = (name) => { const r = window.__tw && window.__tw[name]; if (!r) return null; return 'value' in r ? r.value : r.getter(); };
}

// In-page helpers, injected once per page.
function installHelpers() {
  const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
  const docTop = (el) => round(el.getBoundingClientRect().top + scrollY, 1);
  const rect = (el) => { const r = el.getBoundingClientRect(); return [round(r.x, 1), round(r.y, 1), round(r.width, 1), round(r.height, 1)]; };
  const desc = (el) => el ? ({ tag: el.tagName, cls: String(el.className).slice(0, 140), label: el.closest('section[aria-label]')?.getAttribute('aria-label') ?? null, docTop: docTop(el) }) : null;
  const work = () => document.querySelector('section[aria-label="Selected Work"]');
  const cats = () => [...document.querySelectorAll('section[aria-label]')].filter((s) => /^feeling/i.test(s.getAttribute('aria-label')) && s.getClientRects().length);
  const typo = (el) => { if (!el) return null; const s = getComputedStyle(el); return { text: el.textContent.trim().slice(0, 40), fontSize: s.fontSize, vwRatio: round(parseFloat(s.fontSize) / innerWidth, 4), lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, fontWeight: s.fontWeight, fontFamily: s.fontFamily.split(',')[0], textTransform: s.textTransform, color: s.color }; };
  const st = (el, props) => { const s = getComputedStyle(el); const o = {}; for (const p of props) o[p] = s[p]; return o; };
  const fxState = (root) => [...root.querySelectorAll('[data-fx-y]')].map((el) => {
    const line = el.querySelector(':scope > div > div, :scope > div');
    return { text: el.textContent.trim().slice(0, 30), opacity: getComputedStyle(el).opacity, visibility: getComputedStyle(el).visibility, ready: el.hasAttribute('data-fx-ready'), lineTransform: line ? getComputedStyle(line).transform : null, ownTransform: getComputedStyle(el).transform };
  });
  window.__twWork = {
    round, rect, desc, work, cats, typo,
    sections() {
      const out = {};
      for (const s of document.querySelectorAll('section[aria-label]')) if (s.getClientRects().length) out[s.getAttribute('aria-label')] = { docTop: docTop(s), height: round(s.getBoundingClientRect().height, 1), cls: String(s.className).slice(0, 160), position: getComputedStyle(s).position };
      return out;
    },
    structure() {
      const w = work();
      const media = [...w.querySelectorAll('[style*="aspect-ratio"]')].filter((e) => e.getClientRects().length && e.getBoundingClientRect().width > 0);
      const row = [...w.querySelectorAll(':scope > div > div')].filter((e) => e.getClientRects().length).map((e) => ({ cls: String(e.className).slice(0, 120), rect: rect(e), docTop: docTop(e), style: e.getAttribute('style') }));
      const allWork = [...w.querySelectorAll('a[href="/work"]')].find((a) => a.getClientRects().length);
      const cards = media.map((m) => ({ rect: rect(m), docTop: docTop(m), aspectRatio: m.style.aspectRatio, measuredRatio: round(m.getBoundingClientRect().width / m.getBoundingClientRect().height, 4), radius: getComputedStyle(m).borderRadius, clip: getComputedStyle(m).clipPath, transition: getComputedStyle(m).transition, video: !!m.querySelector("video"), videoPaused: m.querySelector("video") ? m.querySelector("video").paused : null, title: typo(m.closest('a,article')?.querySelector('h3')), tagline: typo(m.closest('a,article')?.querySelector('h3 + span')), columnFlexGrow: m.closest('[style*="flex-grow"]')?.style.flexGrow ?? null }));
      const category = cats().map((s) => {
        const h2 = s.querySelector('h2'), p = s.querySelector('h2 ~ p, p');
        const track = s.querySelector('.will-change-transform, .overflow-x-auto');
        const items = [...s.querySelectorAll('a[aria-label^="View"], div.shrink-0.relative')].filter((e) => e.getClientRects().length);
        return {
          label: s.getAttribute('aria-label'), rect: rect(s), docTop: docTop(s), cls: String(s.className).slice(0, 160), bg: getComputedStyle(s).backgroundColor,
          h2: typo(h2), body: typo(p), trackCls: track ? String(track.className).slice(0, 160) : null, trackRect: track ? rect(track) : null,
          trackScrollWidth: track ? track.scrollWidth : null, trackCursor: track?.parentElement ? getComputedStyle(track.parentElement).cursor : null,
          trackTouchAction: track?.parentElement ? getComputedStyle(track.parentElement).touchAction : null,
          count: items.length,
          cards: items.slice(0, 12).map((a) => { const m = a.querySelector('div.relative > div.overflow-hidden, div.overflow-hidden'); return { rect: rect(a), media: m ? { rect: rect(m), radius: getComputedStyle(m).borderRadius, transition: getComputedStyle(m).transition, opacity: getComputedStyle(m).opacity, transform: getComputedStyle(m).transform } : null, name: typo(a.querySelector('h3')) }; }),
          gapPx: items.length > 1 ? round(items[1].getBoundingClientRect().left - items[0].getBoundingClientRect().right, 1) : null,
        };
      });
      return {
        viewport: [innerWidth, innerHeight], docHeight: document.documentElement.scrollHeight,
        workSection: { rect: rect(w), docTop: docTop(w), padding: st(w, ['paddingLeft', 'paddingRight', 'paddingBottom']), inner: st(w.firstElementChild, ['maxWidth', 'rowGap', 'display']) },
        rows: row, cards,
        allWork: allWork ? { rect: rect(allWork), label: typo(allWork.querySelector('span.font-semibold')), count: typo(allWork.querySelector('span.font-semibold + span')), arrowSpan: { cls: String(allWork.firstElementChild.className), width: allWork.firstElementChild.getBoundingClientRect().width, transition: getComputedStyle(allWork.firstElementChild).transition }, underline: (() => { const u = allWork.querySelector("span.font-semibold"); const a = getComputedStyle(u, "::after"); return { transform: a.transform, scale: a.scale, transformOrigin: a.transformOrigin, transition: a.transition, height: a.height, bottom: a.bottom }; })() } : null,
        logoSlots: [...w.querySelectorAll('.grid-cols-3 > div')].filter((e) => e.getClientRects().length).map((e) => ({ rect: rect(e), transition: e.style.transition, opacity: getComputedStyle(e).opacity })),
        category,
        stickyAncestors: [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).position === 'sticky').map((e) => ({ cls: String(e.className).slice(0, 100), label: e.getAttribute('aria-label'), docTop: docTop(e), height: round(e.getBoundingClientRect().height, 1) })),
        pinSpacers: document.querySelectorAll('.pin-spacer').length,
        customCursorNodes: [...document.querySelectorAll('[class*="cursor"]')].filter((e) => !/cursor-(pointer|grab|default)/.test(e.className)).map((e) => String(e.className).slice(0, 120)),
      };
    },
    triggers() {
      const ST = window.__twGet && window.__twGet('ScrollTrigger');
      if (!ST || !ST.getAll) return { available: false };
      const scope = [work(), ...cats()].filter(Boolean);
      const clean = (v) => { const o = {}; for (const [k, x] of Object.entries(v || {})) { if (k === 'scrollTrigger' || typeof x === 'function') continue; if (k === 'startAt') { o.startAt = clean(x); continue; } if (x && typeof x === 'object' && !Array.isArray(x) && !(x instanceof Element)) o[k] = clean(x); else if (typeof x !== 'object' || Array.isArray(x)) o[k] = x; } return o; };
      const all = ST.getAll();
      return {
        available: true, total: all.length,
        work: all.filter((t) => t.trigger && scope.some((s) => s.contains(t.trigger))).map((t) => ({
          trigger: desc(t.trigger), start: round(t.start, 1), end: round(t.end, 1), vars: { start: String(t.vars.start), end: String(t.vars.end), scrub: t.vars.scrub ?? null, once: t.vars.once ?? null, toggleActions: t.vars.toggleActions ?? null, pin: !!t.vars.pin },
          progress: round(t.progress, 3), isActive: t.isActive,
          animation: t.animation ? { type: t.animation.constructor?.name, duration: t.animation.duration(), totalDuration: t.animation.totalDuration(), vars: clean(t.animation.vars), targets: t.animation.targets ? t.animation.targets().length : null } : null,
        })),
      };
    },
    sample() {
      const w = work();
      const par = (root) => [...root.querySelectorAll('[data-parallax-image]')].filter((e) => e.getClientRects().length).slice(0, 8).map((e) => ({ transform: getComputedStyle(e).transform, inset: e.style.inset || `${e.style.left}/${e.style.right}`, parentDocTop: docTop(e.parentElement) }));
      return {
        t: round(performance.now(), 1), scrollY: round(scrollY, 1),
        work: { rect: rect(w), parallax: par(w), fx: fxState(w), cols: [...w.querySelectorAll('[style*="flex-grow"]')].filter((e) => e.getClientRects().length).map((e) => ({ grow: e.style.flexGrow, width: round(e.getBoundingClientRect().width, 1) })) },
        cats: cats().map((s) => ({ label: s.getAttribute('aria-label'), rect: rect(s), fx: fxState(s), parallax: par(s), track: (() => { const t = s.querySelector('.will-change-transform'); return t ? getComputedStyle(t).transform : null; })(), cards: [...s.querySelectorAll('.will-change-transform .overflow-hidden, .overflow-x-auto .overflow-hidden')].filter((e) => e.getClientRects().length).slice(0, 8).map((m) => ({ opacity: getComputedStyle(m).opacity, visibility: getComputedStyle(m).visibility, transform: getComputedStyle(m).transform, height: round(m.getBoundingClientRect().height, 1), x: round(m.getBoundingClientRect().x, 1) })) })),
      };
    },
    // rAF sampler: records fn() every frame for ms milliseconds
    frames(fnSrc, ms) { const fn = new Function('return (' + fnSrc + ')')(); return new Promise((res) => { const out = [], t0 = performance.now(); const tick = () => { const t = performance.now() - t0; out.push({ t: round(t, 1), v: fn() }); if (t < ms) requestAnimationFrame(tick); else res(out); }; requestAnimationFrame(tick); }); },
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.CHROME_CHANNEL || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const name of wanted) {
    const cfg = CONFIGS[name];
    const root = path.join('docs/research/frames/raw/work', name);
    fs.mkdirSync(root, { recursive: true });
    const context = await browser.newContext(cfg);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.addInitScript(hookTurbopack);
    const t0 = Date.now();
    await page.goto('https://www.tinywins.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => !document.querySelector('[class*="z-200"]') && document.querySelector('section[aria-label="Selected Work"]'), {}, { timeout: 60000 });
    // the loader keeps body position:fixed for a while after its complete flag; wait until scrolling really works
    await page.waitForFunction(() => { window.scrollTo({ top: 60, behavior: "instant" }); return Math.round(scrollY) === 60; }, {}, { timeout: 60000, polling: 250 });
    await page.waitForTimeout(2500);
    await page.evaluate(installHelpers);
    const W = (expr, arg) => page.evaluate(expr, arg);
    const scrollTo = async (y, settle = 1000) => {
      await W((y) => { window.scrollTo({ top: y, behavior: "instant" }); }, y);
      await page.waitForTimeout(settle);
    };
    const shots = [];
    const shot = async (label) => {
      const before = Date.now() - t0;
      const file = label + '.jpg';
      await page.screenshot({ path: path.join(root, file), type: 'jpeg', quality: 70 });
      const s = await W(() => window.__twWork.sample());
      shots.push({ label, file, before, after: Date.now() - t0, sample: s });
      return s;
    };
    const result = { config: name, cfg, url: page.url(), lenisInfo: await W(() => ({ htmlClass: document.documentElement.className, lenis: typeof window.lenis === "object" ? Object.keys(window.lenis) : String(window.lenis) })), stHook: await W(() => !!(window.__twGet && window.__twGet('ScrollTrigger'))) };

    // 1. Structure (at top) and trigger list before scroll
    result.sections = await W(() => window.__twWork.sections());
    const sec = result.sections;
    const workTop = sec['Selected Work'].docTop;
    const catLabels = Object.keys(sec).filter((k) => /^feeling/i.test(k));
    const vh = cfg.viewport.height;
    await scrollTo(workTop - vh * 0.5);
    result.structure = await W(() => window.__twWork.structure());
    result.triggersBefore = await W(() => window.__twWork.triggers());

    // 2. Settled scroll steps through Selected Work and category sections
    const lastCat = sec[catLabels[catLabels.length - 1]];
    const from = workTop - vh, to = lastCat.docTop + lastCat.height;
    const step = Math.round(vh / 4);
    result.steps = [];
    for (let y = from, i = 0; y <= to; y += step, i++) {
      await scrollTo(y, 1000);
      result.steps.push(await shot('step-' + String(i).padStart(2, '0') + '-' + Math.round(y)));
    }
    result.triggersAfter = await W(() => window.__twWork.triggers());

    // 3. Category reveal timing (one-shot GSAP fromTo, toggleActions reverse): sample every frame
    result.reveal = [];
    for (const label of catLabels) {
      const info = await W((label) => { const s = [...document.querySelectorAll('section[aria-label]')].find((e) => e.getAttribute('aria-label') === label); const tr = s.querySelector('.will-change-transform')?.parentElement ?? s; return { trackTop: tr.getBoundingClientRect().top + scrollY }; }, label);
      const startFrac = cfg.viewport.width >= 768 ? 0.5 : 0.86;
      const triggerScroll = info.trackTop - vh * startFrac;
      await scrollTo(triggerScroll - vh * 0.6, 1500); // reset (reverse) above start
      const pre = await shot('reveal-' + label.replace(/\W+/g, '_') + '-pre');
      const framesP = W(({ label }) => window.__twWork.frames(`() => { const s=[...document.querySelectorAll('section[aria-label]')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(label)}); return [...s.querySelectorAll('.will-change-transform .overflow-hidden, .overflow-x-auto .overflow-hidden')].filter(e=>e.getClientRects().length).slice(0,6).map(m=>{const c=getComputedStyle(m);return [c.opacity, c.transform]}) }`, 1800), { label });
      await W((y) => { window.scrollTo({ top: y, behavior: "instant" }); }, triggerScroll + 40);
      const frames = await framesP;
      // same transition again for screenshots (screenshots are slow, so timing is only bounded)
      await scrollTo(triggerScroll - vh * 0.6, 1500);
      await W((y) => { window.scrollTo({ top: y, behavior: "instant" }); }, triggerScroll + 40);
      const tStart = Date.now() - t0;
      await page.waitForTimeout(250);
      const mid = await shot('reveal-' + label.replace(/\W+/g, '_') + '-mid');
      await page.waitForTimeout(1300);
      const end = await shot('reveal-' + label.replace(/\W+/g, '_') + '-end');
      result.reveal.push({ label, trackTop: info.trackTop, triggerScroll, frames, tStart, pre: pre.cats, mid: { before: shots.at(-2).before, after: shots.at(-2).after, cats: mid.cats }, end: end.cats });
    }

    // 4. Interaction (desktop pointer only)
    if (!cfg.isMobile) {
      result.hover = {};
      // 4a. Featured pair hover: Flip column resize
      const pair = await W(() => { const w = window.__twWork.work(); const cols = [...w.querySelectorAll('[style*="flex-grow"]')].filter((e) => e.getClientRects().length); return cols.slice(0, 2).map((c) => { const r = c.getBoundingClientRect(); return { docTop: r.top + scrollY, x: r.x, w: r.width, h: r.height, grow: c.style.flexGrow }; }); });
      await scrollTo(pair[0].docTop - 120, 1200);
      await page.mouse.move(5, 5);
      await page.waitForTimeout(400);
      const pairFramesP = W(() => window.__twWork.frames(`() => { const w=window.__twWork.work(); return [...w.querySelectorAll('[style*="flex-grow"]')].filter(e=>e.getClientRects().length).slice(0,2).map(c=>{const m=c.querySelector('[style*="aspect-ratio"]');return [Math.round(c.getBoundingClientRect().width*10)/10, c.style.flexGrow, m?Math.round(m.getBoundingClientRect().height*10)/10:null]}) }`, 1000));
      const rightCol = await W(() => { const w = window.__twWork.work(); const c = [...w.querySelectorAll('[style*="flex-grow"]')].filter((e) => e.getClientRects().length)[1]; const r = c.querySelector('[style*="aspect-ratio"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
      await page.mouse.move(rightCol.x, rightCol.y);
      result.hover.pairRight = { before: pair, frames: await pairFramesP };
      await page.waitForTimeout(100);
      await shot('hover-pair-right-settled');
      // mid-state screenshot on a second hover back to the left card
      const leftCol = await W(() => { const w = window.__twWork.work(); const c = [...w.querySelectorAll('[style*="flex-grow"]')].filter((e) => e.getClientRects().length)[0]; const r = c.querySelector('[style*="aspect-ratio"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
      await page.mouse.move(leftCol.x, leftCol.y);
      await page.waitForTimeout(120);
      await shot('hover-pair-left-mid');
      await page.waitForTimeout(900);
      await shot('hover-pair-left-settled');
      // 4b. Single wide card (76% column): x shift + CSS clip-path inset on hover
      const single = await W(() => { const w = window.__twWork.work(); const c = [...w.querySelectorAll('.w-\\[76\\%\\]')].find((e) => e.getClientRects().length); if (!c) return null; const m = c.querySelector('[style*="aspect-ratio"]'); const r = m.getBoundingClientRect(); return { docTop: r.top + scrollY, x: r.x + r.width / 2, h: r.height, wrapW: c.parentElement.clientWidth, clip: getComputedStyle(m).clipPath, transition: getComputedStyle(m).transition }; });
      if (single) {
        await page.mouse.move(5, 5);
        await scrollTo(single.docTop - 150, 1200);
        const sP = W(() => window.__twWork.frames(`() => { const c=[...window.__twWork.work().querySelectorAll('.w-\\\\[76\\\\%\\\\]')].find(e=>e.getClientRects().length); const m=c.querySelector('[style*="aspect-ratio"]'); return [getComputedStyle(c).transform, getComputedStyle(m).clipPath] }`, 1000));
        await page.mouse.move(single.x, 150 + Math.min(single.h / 2, 300));
        result.hover.single = { before: single, frames: await sP };
        await shot('hover-single-settled');
        const sOut = W(() => window.__twWork.frames(`() => { const c=[...window.__twWork.work().querySelectorAll('.w-\\\\[76\\\\%\\\\]')].find(e=>e.getClientRects().length); return getComputedStyle(c).transform }`, 900));
        await page.mouse.move(5, 5);
        result.hover.singleLeave = await sOut;
      }
      // 4c. All Work link hover
      const aw = await W(() => { const a = [...window.__twWork.work().querySelectorAll('a[href="/work"]')].find((e) => e.getClientRects().length); const r = a.getBoundingClientRect(); return { docTop: r.top + scrollY, x: r.x + r.width / 2, h: r.height }; });
      await scrollTo(aw.docTop - vh / 2, 1200);
      const awP = W(() => window.__twWork.frames(`() => { const a=[...window.__twWork.work().querySelectorAll('a[href="/work"]')].find(e=>e.getClientRects().length); const u=a.querySelector('span.font-semibold'); const s=getComputedStyle(u,'::after'); return [Math.round(a.firstElementChild.getBoundingClientRect().width*100)/100, s.scale, s.transformOrigin] }`, 800));
      const awPos = await W(() => { const a = [...window.__twWork.work().querySelectorAll('a[href="/work"]')].find((e) => e.getClientRects().length); const r = a.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
      await page.mouse.move(awPos.x, awPos.y);
      result.hover.allWork = await awP;
      await shot('hover-allwork');
      const awOut = W(() => window.__twWork.frames(`() => { const a=[...window.__twWork.work().querySelectorAll('a[href="/work"]')].find(e=>e.getClientRects().length); const u=a.querySelector('span.font-semibold'); const s=getComputedStyle(u,'::after'); return [Math.round(a.firstElementChild.getBoundingClientRect().width*100)/100, s.scale, s.transformOrigin] }`, 800));
      await page.mouse.move(5, 5);
      result.hover.allWorkLeave = await awOut;
      // 4d. Category card hover + drag
      for (const label of catLabels.slice(0, 1)) {
        const c = await W((label) => { const s = [...document.querySelectorAll('section[aria-label]')].find((e) => e.getAttribute('aria-label') === label); const cards = [...s.querySelectorAll('a[aria-label^="View"], .shrink-0.relative')].filter((e) => e.getClientRects().length); const m = cards[1].querySelector('.overflow-hidden'); const r = m.getBoundingClientRect(); return { secTop: s.getBoundingClientRect().top + scrollY, cardY: r.top + scrollY, h: r.height, x: r.x + r.width / 2 }; }, label);
        await scrollTo(c.secTop, 1500);
        const sel = `[...document.querySelectorAll('section[aria-label]')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(label)})`;
        const hP = W((sel) => window.__twWork.frames(`() => { const s=${sel}; return [...s.querySelectorAll('.will-change-transform .overflow-hidden, .overflow-x-auto .overflow-hidden')].filter(e=>e.getClientRects().length).slice(0,3).map(m=>[Math.round(m.getBoundingClientRect().height*10)/10, Math.round(m.getBoundingClientRect().width*10)/10, getComputedStyle(m.querySelector('img')).transform])}`, 900), sel);
        const pos = await W((label) => { const s = [...document.querySelectorAll('section[aria-label]')].find((e) => e.getAttribute('aria-label') === label); const m = [...s.querySelectorAll('.will-change-transform .overflow-hidden, .overflow-x-auto .overflow-hidden')].filter((e) => e.getClientRects().length)[1]; const r = m.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, label);
        await page.mouse.move(pos.x, pos.y);
        result.hover.categoryCard = { label, frames: await hP };
        await shot('hover-category-card');
        // drag: 400 px to the left in 20 moves
        const dP = W((sel) => window.__twWork.frames(`() => { const s=${sel}; const t=s.querySelector('.will-change-transform'); return [t?getComputedStyle(t).transform:null, ...[...s.querySelectorAll('[data-parallax-image]')].slice(0,3).map(p=>p.style.transform)] }`, 2200), sel);
        await page.mouse.down();
        for (let i = 1; i <= 20; i++) { await page.mouse.move(pos.x - i * 20, pos.y); await page.waitForTimeout(16); }
        await page.mouse.up();
        result.drag = { label, pointerDx: -400, frames: await dP, cursor: await W((sel) => { const s = new Function('return ' + sel)(); const t = s.querySelector('.will-change-transform'); return t ? getComputedStyle(t.parentElement).cursor : null; }, sel) };
        await shot('drag-category-settled');
      }
    }
    if (cfg.isMobile) {
      // logo slot swap timing (interval-driven opacity fade)
      await scrollTo(workTop - 40, 800);
      result.logoSlots = await W(() => window.__twWork.frames(`() => [...window.__twWork.work().querySelectorAll('.grid-cols-3 > div')].map(e=>getComputedStyle(e).opacity)`, 5500));
      await shot('mobile-logo-slots');
    }
    result.shots = shots;
    result.errors = errors;
    fs.writeFileSync(path.join(root, 'work.json'), JSON.stringify(result, null, 1));
    console.log(name, 'shots', shots.length, 'errors', errors.length, 'stHook', result.stHook, 'triggers', result.triggersAfter?.work?.length);
    await context.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
