# Loader / hero verification

Validated against the production **standalone server**, Chrome headless, 2026-11-11. Reproduce with `scripts/verify.mjs`; its dependencies (`playwright`, `sharp`) belong in a scratch directory, not the app package.

## Results

- `pnpm build`: passed, including TypeScript and standalone asset preparation.
- `pnpm lint`: passed, zero errors/warnings. Read-only research scripts are excluded from application lint rules.
- Production `PORT=3018 HOSTNAME=127.0.0.1 pnpm start`: served successfully.
- Loader authored length: **4870ms**; measured **4871.6ms** in the final capture, within 100ms tolerance.
- Overlay unmounted; body overflow returned to visible; Lenis/wheel scrolling resumed.
- At scroll 900 (630px wrapper top + 20% of 1350px range): scale **1**, radius **0px**.
- At scroll 1980 (end of range): scale **.65**, radius **24px**.
- Second navigation in the same session: loader absent; headline entrance completed.
- Reduced motion: overlay removed after approximately 400ms, words and frame have no transform; no flicker or smooth scroll.
- 1440×900, 1024×768, 390×844: inspected screenshots; no horizontal overflow.
- Measured CLS: **0** through the desktop capture/scroll pass.
- Browser console/page errors: **0**, including no hydration errors.
- Keyboard Tab exposed the skip link with a solid focus outline; CTA click navigated to `#contact`.
- SVG geometry check: all 20 generated full-wordmark paths/polygons match the source exactly; no DOM ids; mark variant contains only the original three N pieces.
- Read-only source SVG, inventory, research and existing `.gitignore` are unchanged.

See `measurements.json` for exact timestamps, transforms and widths. Screenshot filenames preserve the reference names; actual scroll positions are in JSON and may differ slightly because Lenis is still easing at capture time. Full transient captures were created in `/tmp` and removed after selecting the ten deliverable frames.

## Visual review

All ten exported 720px frames were viewed beside their matching read-only reference frames, first individually and then in two comparison sheets. The reference is used to judge phase/technique, not layout or imagery.

1. **01 sequence solid:** original N/X shards occupy a small grey center cluster on black. Individual frames vary because pose order/timing is intentionally random.
2. **02 sequence distorted:** different shard placement/visibility and rough edges; a 16-frame contact sheet confirms discrete pose changes with short opacity overlaps, not smooth geometric interpolation.
3. **03 clean mark:** full original white NEXT AGENCY mark, settled and crisp.
4. **04 white wipe:** downward white field; black wordmark on white. Iteration changed independent crossfades to difference compositing so the mark inverts exactly at the moving edge.
5. **05 nav handoff:** wordmark is smaller and moving toward the measured left navigation anchor; links are fading in. Hero words remain masked.
6. **06 words enter:** staggered left/right word reveals and rising black media panel are visible after completion.
7. **07 hero settled:** original text, spacious independent layout, clearly marked illustrative stats, original cropped logo media.
8. **08 scroll:** full-size sticky media near the 20% scale threshold, slightly separated pieces.
9. **09 scroll:** reduced rounded frame, logo pieces assembled.
10. **10 scroll:** outgoing media above, supporting line-mask reveal and two-line closing heading below.

The 390px and 1024px layouts and reduced-motion screenshot were also viewed. The mobile groups stack, header CTA fits, and copy stays inside the viewport.

## Tool limitation

The ThreadRig embedded browser column was opened and its CTA was clicked successfully. Its animation frames stayed suspended (also observed with the reference), so it showed incomplete motion states. Motion/timing evidence therefore comes from real Chrome through headless Playwright, not the embedded browser screenshots. No claim of Safari/Firefox validation is made.

## Intended differences and remaining content work

- The requested difference-compositing option replaces the reference's two timed color fades. All main phase boundaries remain 2400/2520/2800/3120/3270/3870/4870ms.
- Reduced motion uses a 100vh static media region rather than 250vh of empty scrolling.
- Navigation destinations, contact details, true statistics, final bilingual copy and showreel are placeholders pending owner decisions. No additional site sections, CMS or deployment were added.

## i18n (/ka, /en) — 2026-11-11

Production standalone server (`PORT=3019 HOSTNAME=127.0.0.1 pnpm start`), headless Chrome via `scripts/verify.mjs` (now takes the server origin in `VERIFY_URL`; the loader/hero pass above runs on `/ka`, so frames 01–10, `viewport-*` and `reduced-motion` were regenerated with Georgian copy).

- `curl -I /` → 307 `/ka`; `/work` → `/ka/work`; `/ka`, `/en` → 200 with `<html lang>` matching and `hreflang` ka/en/x-default + canonical; `/brand/logo.svg`, `/icon.svg` → 200 (not redirected); `/ka/unknown` → 404.
- 1440×900, 1024×768, 390×844 × both locales: no horizontal overflow, no headline/stat line overflow, switcher visible inside the viewport (also at 390px where nav links are hidden).
- Mask clipping (screenshot with masks closed vs. forced open): Georgian hero and support/closing **0 px** different at all three widths; English support 0 px. English hero differs by 11–35 anti-aliasing pixels, unchanged from before this work. Hidden state (words at 105%) leaks 0 dark pixels in both locales.
- Support copy: every SplitText line has transform 0 when the section top reaches 40% of the viewport (new scrub end) and when it reaches the top. The old `10-scroll-2693` cut-off was mid-animation (≈79% scrub progress with stagger), not a mask bug.
- Fonts (CDP `getPlatformFontsForNode`): Georgian headline glyphs from **Noto Sans Georgian ExtraBold**; digits/Latin in Georgian stats and the `EN` label from **Manrope**. The next/font georgian subset includes Mtavruli (U+1C90–1CBF), but Chrome renders `text-transform: uppercase` Georgian as unchanged Mkhedruli (same width as plain text; real Mtavruli is ~5% wider), so `html[lang=ka]` headings use `text-transform: none`.
- Fresh session: loader plays on `/ka` (`i18n-ka-loader.jpg`), then clicking the switcher goes to `/en` as a client navigation: overlay frames 0, `<html lang="en">`, hero words settle to 0. Console errors 0, warnings 0.
- Viewed: `i18n-ka-hero-1440`, `i18n-en-hero-1440`, `i18n-ka-hero-390`, `i18n-ka-hero-1024`, `i18n-ka-support-1440`, `i18n-en-support-1440`, `i18n-ka-loader`.

## Work — 2026-11-11

Production: `PORT=3021 HOSTNAME=127.0.0.1 pnpm start`. Reproduce with `VERIFY_DEPS=/tmp/nextagency-verify node scripts/verify-work.mjs` (install Playwright and sharp in that scratch directory, not the application). Chrome headless is the motion authority; the ThreadRig browser panel freezes GSAP, so it was used for detail-page navigation and viewing only.

- `pnpm build && pnpm lint` passes. `/ka`, `/en`, both Work indexes and all 12 localized project URLs return 200; an unknown slug returns 404 in both locales. Detail canonical and all three hreflang alternates are asserted.
- Horizontal overflow is **0 px** at 1440, 1024 and 390 px in both locales on home, index and detail. Console/page errors: **0**.
- Pair promotion exchanges widths **777.27 / 551.70 → 551.70 / 777.27 px**; reserved row height stays **622.75 px**. Category hover grows media by 46 px without changing section height. Parallax changes from approximately **5.37 to 15.53 px** over a 250 px scroll.
- Drag passes the 6 px threshold, locks to the horizontal axis, applies ×1.6 with frame-rate-independent damping and clamps to the available scroll range (**557 px** in the captured desktop row). Release/post-drag clicks do not navigate; focusing the last card brings it into view. A fresh pointer gesture resets suppression, and keyboard activation is unaffected. Tab makes entrances settle before focus traversal so hidden cards cannot be skipped.
- Reduced motion: all 11 home card instances plus All work have opacity 1 and visible visibility; parallax is absent and rows retain native overflow scrolling. Work content starts visible in CSS; JS alone installs reveal states.
- Georgian headings use 1.2 line height, mask padding and a 1 px clip safety margin. The script compares settled headings with masks closed/open at all three widths using sharp: **0 differing pixels in all nine comparisons**. All 16 delivered frames/composites were visually reviewed for overlap, missing covers and glyph clipping.
- Evidence: `work-01` pair, `02` wide, `03` Flip, `04` reveal mid, `05` settled, `06` dark group, `07` drag, `08` mobile featured, `09` mobile category, `10` reduced motion, `11` Georgian index, `12` English detail. `work-compare-{pair,wide,category,mobile}.jpg` places reference on the left and implementation on the right.

Scope choices: no optional horizontal image parallax. Custom pointer drag drives the native scroll offset rather than a translated track, preserving browser focus scrolling and the reduced-motion/no-JS fallback. All six covers are CSS-only monochrome placeholders; image/video branches are present but have no production assets and were not asset-tested. Real case studies remain intentionally deferred.

Build note: a cached Turbopack rebuild served earlier CSS during iteration. Final verification used a clean `.next` rebuild; no build configuration was changed.

## Mtavruli display headings (ka) — 2026-11-11

Production `PORT=3031 HOSTNAME=127.0.0.1 pnpm start`; `VERIFY_URL=http://127.0.0.1:3031` for both `scripts/verify.mjs` and `scripts/verify-work.mjs` (both pass).

- `src/lib/mtavruli.ts` maps Mkhedruli U+10D0–10FA → Mtavruli U+1C90–1CBA at render time (`display(text, locale)`); content files stay Mkhedruli. Used on the hero h1 words (aria-label stays Mkhedruli), the closing h2 lines, the Work section title, category titles, `/work` h1 and `/work/[slug]` h1 only.
- Font: next/font's Noto Sans Georgian `georgian` subset already has `unicode-range … U+1C90-1CBA, U+1CBD-1CBF`; CDP `getPlatformFontsForNode` reports **Noto Sans Georgian ExtraBold** for the hero words and closing line (full stop/space from Manrope, no system fallback), and the hero text measures 2488 px in Noto vs 2398 px in `sans-serif`. No font change.
- **Chrome's `text-transform: uppercase` (and `lowercase`) turns Mtavruli back into Mkhedruli** (ink bottom 138 → 162 px at 100 px, descenders return). Georgian display headings therefore keep `text-transform: none`.
- Mtavruli ink is cap-only (0.76 em above, 0.01 em below baseline, vs Manrope caps 0.735/0.015), so the Georgian line-height 1.2 / extra mask padding overrides were removed: hero, closing and Work headings now use the English 0.9 / 0.95 / 1.05 rhythm. Mtavruli is ~25% wider than the English copy per line, so the hero h1 is `clamp(30px, 4vw, 80px)` (mobile `8.4vw`) instead of 5.2vw / 9vw; widest line now fills 96% (desktop) / 93% (390) of its column.
- Results: Georgian hero, closing and Work/category/index/detail heading masks clip **0 px** at 1440/1024/390; no hero word outside its column, no line overlap, no wrapped closing line, horizontal overflow 0. English unchanged (hero clip 35/22/11 px as before; `i18n-en-hero-1440`, `work-12-detail-en-1440` byte-identical; `i18n-en-support-1440` differs only by a sub-pixel scrub position).
- Noto's Mtavruli has flat-cut round terminals on the baseline — that is the glyph design (same with masks removed), not clipping.
- Frames: `mtavruli-ka-hero-1440.jpg`, `mtavruli-ka-hero-390.jpg`, `mtavruli-ka-closing-1440.jpg`, `mtavruli-ka-work-1440.jpg`, `mtavruli-ka-work-index-1440.jpg`.
