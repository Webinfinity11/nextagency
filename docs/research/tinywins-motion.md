# TinyWins: live loader and hero motion

Reference: [live homepage](https://www.tinywins.com/), inspected 2026-11-11 at 1440×900, DPR 1, desktop, ordinary motion preference. This documents techniques for an original brand implementation, not reusable artwork or copy.

**Evidence labels:** **M-JS** = measured from delivered JavaScript; **M-DOM** = measured from DOM/computed styles/runtime; **E-frame** = estimated visually from screenshots. Recommendations are explicitly separate from observations. All times below distinguish authored timeline time from navigation time.

## Capture and reproducibility

**M-DOM:** headless Google Chrome through Playwright, with SwiftShader enabled and no requests blocked. The successful run produced 137 screenshot/DOM samples, including 45 wheel steps. Loader completion and its removal were verified before waiting another 3.2 seconds and capturing the settled entrance. No click, keypress, headed browser, or forced loader removal was needed.

Scripts: [capture.cjs](scripts/capture.cjs), [probe.cjs](scripts/probe.cjs), [keyframes.cjs](scripts/keyframes.cjs). Install `playwright` and `sharp` in a scratch directory outside the repository, then run from the repository root:

```sh
CHROME_CHANNEL=chrome NODE_PATH=/tmp/<scratch>/node_modules node docs/research/scripts/capture.cjs
CHROME_CHANNEL=chrome NODE_PATH=/tmp/<scratch>/node_modules node docs/research/scripts/probe.cjs
NODE_PATH=/tmp/<scratch>/node_modules node docs/research/scripts/keyframes.cjs
```

**M-DOM:** `frames/raw/live/samples.json` records screenshot start/end bounds, actual scroll position, computed properties, image states, event times and performance marks. `probe.json` records a separate pass after letting each requested scroll position settle for one second. `frames/raw/` is ignored. Raw HTML/JS are diagnostic evidence only; no original image sequence files were written to disk. The ten retained references are JPEGs at 720×450.

**M-DOM:** one React hydration error (#418) occurred. The run nevertheless completed its loader and scroll pass. Screenshot overhead makes sample intervals variable; the loop targets 125 ms, not guaranteed 8 fps. A first run stopped its loading phase too early and is retained only as diagnostic history outside the `live/` directory. Its `settled.jpg` was incorrectly named and is not a settled-hero reference.

## (a) Loader: mechanism and timeline

### What actually renders

**M-JS / M-DOM:** the loader is an 11-image sequence, not a WebGL model. Its fixed full-viewport wrapper uses z-index 200 and disables pointer events. Inside it are independent black and white backgrounds, the image-sequence layer, and a separate centered pair of white/black SVG marks used for the handoff. The image container is 300×197 CSS pixels, clips overflow, and uses contain fitting.

**M-JS / image metadata:** all eleven authored `/images/intro/` sources are PNG, 1076×764. Header/Sharp inspection was performed in memory; byte sizes in sequence order are 344818, 310671, 255063, 254888, 137893, 335766, 116588, 152539, 351451, 243047, 128301. These are source sizes, not optimized transfer sizes. **M-DOM:** Chrome requests Next image URLs with width 750 and quality 75; the first decoded image reports a natural size of 730×518 because of responsive image density correction. The optimized response format was not recorded.

**M-JS:** every image mounts with eager loading; the first three have Next `priority` enabled. There is no per-frame decode barrier or progress-driven frame selection. Index starts at zero, advances modulo 11 after an initial 60 ms timeout, and then recursively schedules `60 + random×50` ms timeouts. That is a nominal 9.1–16.7 updates/sec, approximately 11.8/sec over time; scheduling overhead can slow it. It loops until unmounted, rather than stopping on the last frame.

**M-DOM:** image changes crossfade through opacity over 75 ms with `cubic-bezier(0.4,0,0.2,1)`. **M-JS:** the active image receives brightness 1.35, contrast 1.9 and saturation 1.2. An independent GSAP ticker adds subpixel jitter: horizontal sine amplitude .45 px at angular frequency 22/s; vertical cosine amplitude .32 px at 18/s; shared random disturbance ±.11 px; rotation amplitude .12 degrees at 7.5/s. This is time-driven jitter, not scroll or loading progress.

### Authored timeline

Every row is **M-JS**. Milliseconds are relative to creation of the GSAP loader timeline, **not navigation start**. `autoAlpha` means opacity plus visibility management.

| Phase | Start ms | End ms | Moving layer / property | Authored ease and visual feel |
|---|---:|---:|---|---|
| Sequence runs | 0 | 2800 | Randomly timed image opacity swaps and tiny transform jitter | Restless flicker; CSS opacity ease above |
| Sequence fades away | 2400 | 2800 | Sequence wrapper autoAlpha → 0; React unmount at 2800 | power2.inOut |
| Clean mark appears | 2520 | 2700 | Centered SVG container autoAlpha → 1 | power2.out |
| White mark appears | 2520 | 3120 | White SVG autoAlpha → 1 | power2.inOut |
| Brief hold | 3120 | 3270 | Timeline pause beat | No motion |
| White wipe descends | 3270 | 3870 | White full-screen layer yPercent −100 → 0 | power2.inOut |
| Mark switches dark | 3270 | 3450 | Black SVG autoAlpha → 1 | power2.out |
| White mark fades | 3450 | 3750 | White SVG autoAlpha → 0 | power2.in |
| Hero background revealed | 3870 | 4470 | Black background hidden immediately; white background autoAlpha → 0 | power2.out |
| Mark moves into navigation | 3870 | 4870 | Center mark x/y and scale → measured navigation anchor | power3.inOut; smooth acceleration and braking |
| Loader ready | 4870 | 4870 | Center mark hidden, nav mark visible; ready callback removes loader | Discrete completion |

**M-JS:** the last movement calculates its destination from navigation bounding boxes, rather than fixed viewport coordinates. The fallback is near the horizontal center at the top with a 44 px-wide mark. Resize invalidates the destination while that tween is in progress.

### Observed wall clock

**M-DOM:** performance marks in the successful run: loader start 6843.6 ms, reveal 11316.8 ms, ready 12345.8 ms, route ready 12347.6 ms. Complete events were observed at 12345.9 and 12393.1 ms; the app dispatches from both its ready callback and a subsequent effect. The capture confirmed completion plus absence of the loader by 12444 ms. The marker precedes asynchronous GSAP registration, so its difference from ready is not the authored 4870 ms timeline duration. Do not use this run's ~12.4-second navigation delay as a design target.

**M-JS / M-DOM:** scrolling is locked by a temporary stylesheet setting the body to fixed positioning, inset zero, full width and hidden overflow. Runtime body overflow was `hidden` during the loader and `hidden auto` afterwards. The HTML acquired `lenis`, but `lenis-stopped` was not the loader's locking mechanism in this run. The loader timeline waits for GSAP plugin registration, not all images, fonts or video readiness. Font readiness is separately used to measure the hero text wrapper; the video preloads metadata. There is no user-interaction entry gate.

## (b) Loader → hero handoff

**M-JS:** image sequence and clean SVG overlap for 280 ms (2520–2800). The white wipe begins 470 ms after image unmount. At 3870, the black layer is hidden, the white layer begins a 600 ms fade, navigation reveal starts, and the clean mark begins its 1000 ms move/scale into the navigation. Thus white-layer fading and logo travel overlap for 600 ms; the logo continues for another 400 ms after that layer fades.

**M-JS:** hero entrance listens for the ready/completion event at timeline 4870. The video frame begins its entrance immediately; left-column words start 300 ms later and right-column words 400 ms later. Consequently the hero's first words do **not** begin during the departing loader's logo movement. Navigation is the overlapping layer. If the hero initializes after completion, its fallback jumps its entrance timeline to the end rather than replaying it.

**E-frame:** frames 03–06 below show a clean white mark, black mark on the descending white field, reduced mark traveling toward navigation, and then partially exposed hero words. This is a visual handoff between image sequence, clean vector mark, navigation and content—not a single shrinking 3D object.

## (c) Hero entrance and idle choreography

**M-JS / M-DOM:** the large headline uses manually authored `[data-word]` inline spans in line containers with overflow hidden. It is word-split, not character-split. Two phrase layouts occupy the same absolute wrapper; they alternate rather than mirror geometrically. The desktop layout has two side-by-side groups, two lines each, with five words on the left and six on the right in its initial phrase.

| Layer | Initial state → target | Offset after completion | Duration / stagger / ease | Evidence |
|---|---|---:|---|---|
| Video frame | yPercent 100 → 0 | 0 ms | 1200 ms, power3.out | M-JS |
| Left words | yPercent 105 → 0 | 300 ms | 700 ms each, 60 ms between words, power3.out | M-JS |
| Right words | yPercent 105 → 0 | 400 ms | 700 ms each, 60 ms between words, power3.out | M-JS |
| Desktop stat line 1/2/3 | word yPercent 105 → 0 | 1050/1170/1290 ms | 550 ms each, 25 ms between words, power3.out | M-JS |
| Mobile first stat phrase | word yPercent 105 → 0 | 450 ms | 700 ms, 60 ms stagger, power3.out | M-JS, not mobile-tested |

**M-DOM:** headline word height is approximately 67.39 CSS px at this viewport. Thus 105% travel is approximately 70.76 px per word. At the settled checkpoint word transforms are identity matrices; during entrance the sampled matrices contain nonzero vertical translations. Masks hide the moving words below each line; computed clip-path is `none`, because overflow performs the masking.

**M-JS:** an additional 1.6-second empty tween delays starting the looping phrase/stat timelines after the entrance's last tween. The headline loop sends the current phrase upward to −105%, over 500 ms with a total 200 ms stagger (`power3.in`); the replacement begins at loop time 700 ms from +105%, over 1000 ms with a total 400 ms stagger (`expo.out`). At 5100 ms it reverses the phrase roles, starting re-entry at 5800 ms. The whole loop repeats with a 3-second repeat delay. This is autonomous playback, not scroll-scrubbed text swapping. It pauses when the hero strip leaves its trigger range or the document is hidden.

**M-JS:** SplitText is used later for the serif supporting sentence (`lines`, with line masks), not the main word headline. The closing heading uses authored line spans inside overflow-hidden wrappers, moving from 110% to zero over 900 ms with 120 ms stagger and `power3.out`, once its heading reaches 80% viewport height.

## (d) Hero scroll, sticky area and footer canvas

**M-JS / M-DOM:** desktop headline/stat strip is 70vh tall (630 px here) and scrolls normally. The following video region has a 250vh parent and a 100vh `position: sticky; top: 0` child. No GSAP pin or pin-spacer was found in any of the nine probe positions. The sticky video occupies the viewport top from document scroll 630 through 1980, then leaves upward normally. Its primary ScrollTrigger runs across 150vh (1350 px), with a 0.3-second scrub smoothing parameter.

**M-JS:** the primary timeline runs 0–1 normalized authored duration. At 0.2, video frame scale begins changing from 1 to .65 and corner radius to 24 px over the remaining .8, with `power2.inOut`. Therefore the scale holds until scroll 900 and finishes at 1980. This is nonlinear; there is no constant scale-per-pixel ratio. The play control scales inversely to its frame so it stays visually consistent.

**M-JS / derived from measured geometry:** the inner video remains scaled 1.2. Its yPercent moves from −20 to 0 over scroll 0–630, linearly, with a .5-second scrub. At a 900 px element height that is −180 → 0 px, approximately +0.286 px local translation per document-scroll pixel. Before sticky engagement, parent motion contributes −1 px/px, giving roughly −0.714 px/px net top movement after smoothing settles. Text/stats have no extra scroll translation in the recovered hero code: their normal document movement is −1 px/px, independent of their time-driven word loop.

**M-DOM:** separate probe, one-second settling between wheel movements:

| Actual scroll px | Sticky viewport top px | Frame scale | Inner local y px | Frame radius |
|---:|---:|---:|---:|---:|
| 0 | 630 | 1 | −180 | 0 |
| 450 | 180 | 1 | −51.75 | 0 |
| 630 | 0 | 1 | −0.02 | 0 |
| 900 | 0 | 1 | 0 | 0 |
| 1350 | 0 | .8988 | 0 | 7 px |
| 1800 | 0 | .6565 | 0 | 24 px |
| 1980 | 0 | .65 | 0 | 24 px |
| 2250 | −270 | .65 | 0 | 24 px |
| 2700 | −720 | .65 | 0 | 24 px |

**M-JS:** the following 100vh section brings in the serif sentence with a scrubbed line reveal, then fades it to .4 opacity. Its trigger spans section top at viewport bottom through section top at viewport top. The play control fades over the first 28vh of that section's approach. The closing heading has its independent one-shot reveal described above.

**M-JS:** Lenis settings are lerp .125, smoothWheel true, syncTouch false, touchMultiplier 1 and wheelMultiplier 1. Lenis advances from the GSAP ticker (seconds converted to milliseconds), updates ScrollTrigger on scroll, and disables GSAP lag smoothing. **M-DOM:** the recorded 45×60 px wheel pass reached 2693 px while still easing; the separate settled probe reached exactly 2700. No keyboard fallback was required.

**M-JS / M-DOM:** there is no loader/hero 3D object responding to scroll. The actual Three.js canvas is inside the footer's absolute, pointer-events-none overlay, above its content, reporting Three.js r164. The footer renderer is an orthographic R3F scene with transparent textured planes for interactive stickers. A 48×48 subdivided plane and custom vertex shader stretch/squeeze the active sticker toward the cursor; release returns displacement and strength to zero over .55 seconds with `elastic.out(1, 0.55)`. It renders on demand while idle and continuously during a gesture. This canvas is unrelated to the image-sequence loader. The footer behavior is source-verified, not visually gesture-tested in this research.

## (e) Typography ratios only

All entries are **M-JS / M-DOM**, at the stated viewport unless noted. Values are ratios, not font assets or copied design tokens.

| Element | Font size / viewport width | Line-height / font size | Tracking / font size |
|---|---:|---:|---:|
| Main word headline | .052 | .9 | −.03 |
| Desktop stat text | .0125 (clamp maximum active) | 1.2 | −.02 |
| Serif support sentence | .018 | 1.3 | −.03 |
| Desktop closing heading | .086 | .87 | −.04 |

**M-JS:** these sizes are clamped, so ratios change outside their fluid range. The headline word gaps are .68 em within authored flex lines. The desktop two-column arrangement, compact leading and masked units are the motion-relevant properties; an original implementation should choose its own typography and layout.

## (f) Principles to reproduce with original content

Recommendations derived from the measured behavior:

1. Separate a deliberately rough, time-driven image flicker from a clean vector mark used for the exit. Use original imagery and geometry.
2. Give the handoff distinct beats: dissolve roughness, reveal a clean mark, wipe the background, transfer the mark to navigation, then begin content.
3. Animate words inside line masks with a short inter-column delay and stronger deceleration than the exit. Avoid treating the whole headline as one sliding block.
4. Keep time-driven editorial phrase swaps separate from scroll-driven media transforms.
5. Use a native sticky container for the media hold; apply eased scale and a small independent linear internal translation. Preserve readable controls through inverse scaling.
6. Release scroll reliably when the entrance completes. Derive navigation destinations from layout and keep network startup delay out of the authored animation duration.

## (g) Limits and undetermined items

- **M-DOM:** hydration error and cold-load startup overhead occurred; the precise cause of their delay was not isolated. Authored tween durations are stronger evidence than navigation-relative screenshots for timing recreation.
- **Undetermined:** actual frame-update distribution under timer throttling, exact optimized response image format/transfer sizes, and device-specific frame pacing. Source PNG count/dimensions and timer algorithm are verified.
- **Undetermined:** mobile appearance, reduced-motion visual result, other browsers and pointer interactions. Mobile code values above are source-only facts.
- **Undetermined:** pixel-perfect timing of every tween boundary between samples. Screenshot start/end windows bound observations; DOM reads follow screenshots.
- **M-DOM:** the ancillary footer `scrollIntoViewIfNeeded` screenshot in the probe remained around the closing hero section under smooth scrolling. It is excluded from key frames and is not proof of footer visuals. Footer canvas location and shader behavior are established from DOM/JS only.
- **M-JS / M-DOM:** a visible mid-loader triangular mark is supplied, but it is a raster frame, not a WebGL object. The original brief's WebGL interpretation is superseded by the live evidence.

## Key reference frames

Times are **M-DOM** screenshot-call start/end bounds in milliseconds from navigation start. Visual descriptions are **E-frame**. Original reference content appears only in these small research screenshots.

| Frame | Time window ms | Actual scroll px | Observation |
|---|---:|---:|---|
| [01 sequence solid](frames/key/01-sequence-solid.jpg) | 7734–7791 | 0 | Grey triangular raster mark visible |
| [02 sequence distorted](frames/key/02-sequence-distorted.jpg) | 9139–9274 | 0 | Distorted image variant |
| [03 clean mark](frames/key/03-clean-mark.jpg) | 10446–10592 | 0 | White vector mark replaces flicker |
| [04 white wipe](frames/key/04-white-wipe.jpg) | 11098–11126 | 0 | Descending white field, dark mark |
| [05 navigation handoff](frames/key/05-nav-handoff.jpg) | 11887–11933 | 0 | Mark shrinking and traveling upward |
| [06 words enter](frames/key/06-words-enter.jpg) | 12900–12936 | 0 | Partially masked word entrance |
| [07 hero settled](frames/key/07-hero-settled.jpg) | 15709–15805 | 0 | Entrance settled; background video still playing |
| [08 scroll](frames/key/08-scroll-876.jpg) | 19755–19805 | 876 | Sticky media near full size |
| [09 scroll](frames/key/09-scroll-1777.jpg) | 23665–23718 | 1777 | Smaller rounded media frame |
| [10 scroll](frames/key/10-scroll-2693.jpg) | 28133–28306 | 2693 | Supporting sentence and closing heading |

## Work section

Reference: the same live homepage, inspected 2026-11-11 in headless Google Chrome (Playwright 1.65, SwiftShader). Viewports were 1440×900 desktop and 390×844 mobile (`isMobile`, `hasTouch`), each with ordinary motion and with `reducedMotion: 'reduce'`. Scope: the **Selected Work** block (featured cards and the All Work link) and the two **category groups** after the Shipyard banner (`Feeling Vital`, light; `Feeling Future-proof`, black). Project and category names appear only to identify structure. The earlier sticky "Emotional spectrum" section also lists projects, but it was not part of this pass.

Evidence labels match the sections above. **M-JS** means read from the delivered, prettified client chunk. **M-DOM** means measured from the DOM, computed style or live GSAP objects at runtime. **E-frame** means estimated visually. Runtime ScrollTrigger values come from `ScrollTrigger.getAll()` and are counted as M-DOM. All `px` values are CSS px at the stated viewport.

### Capture and reproducibility

Scripts: [work-capture.cjs](scripts/work-capture.cjs) (desktop and mobile: structure, scroll steps, reveal timing, hover and drag), [work-reduced.cjs](scripts/work-reduced.cjs) (reduced-motion pass) and [work-keyframes.cjs](scripts/work-keyframes.cjs) (exports the key frames). Install the dependencies in a scratch directory outside the repository, then run from the repository root:

```sh
mkdir -p /tmp/tw-scratch && (cd /tmp/tw-scratch && npm init -y && npm i playwright sharp)
CHROME_CHANNEL=chrome NODE_PATH=/tmp/tw-scratch/node_modules node docs/research/scripts/work-capture.cjs          # desktop + mobile, ~4 min
CHROME_CHANNEL=chrome NODE_PATH=/tmp/tw-scratch/node_modules node docs/research/scripts/work-reduced.cjs
NODE_PATH=/tmp/tw-scratch/node_modules node docs/research/scripts/work-keyframes.cjs
```

Raw screenshots and the `work.json` / `reduced.json` measurement files go to `frames/raw/work/` (git-ignored). Only the 14 `frames/work-*.jpg` files are committed (q70, ≤1440 px wide).

**Method notes (M-DOM):**
- The site bundles GSAP 3.14.2 through Turbopack and exposes neither `gsap` nor `ScrollTrigger` globally. `window.lenis` holds only `{version}`; the Lenis instance is private. The capture script defines a setter on `globalThis.TURBOPACK` before any chunk runs and wraps each module factory. When a module exports `ScrollTrigger`, `gsap` or `getFlip`, the wrapper keeps a reference, so `ScrollTrigger.getAll()` can be read without changing behavior.
- Scrolling uses native `scrollTo({behavior:'instant'})` followed by a 1 s settle, so scrubs (0.5 s) finish.
- **Gotcha:** the loader mounts about 2–3 s after `domcontentloaded`. Waiting only for "no loader element" can pass before the loader appears, and the loader then locks the body with `position: fixed`. The scripts wait for `__tinywinsHomeLoaderCompleteFired` and then for a scroll that actually lands. In the final desktop run, the first three settled steps still read `scrollY` 0 and were discarded; key frames use only later steps.
- React hydration error #418 occurred in every run, as in the hero pass.

### Page position (desktop 1440×900, M-DOM)

| Block | Document top px | Height px | Position |
|---|---:|---:|---|
| Brand statement (preceding) | 9360 | 900 (in 3330 wrapper) | sticky |
| Selected Work | 12690 | 2179.3 | relative |
| Shipyard banner | 14869.3 | 501.8 | relative |
| Feeling Vital | 15371.1 | 900 | relative |
| Feeling Future-proof | 16271.1 | 900 | relative, black |
| About (following) | 17171.1 | 900 (in 2970 wrapper) | sticky |

Mobile (M-DOM): Selected Work 10277.8 / 1735.5, Feeling Vital 12390.1 / 579, Feeling Future-proof 12969 / 648.8. Document height is 23505 px desktop and 20463 px mobile.

### (a) Structure and sizes

**No pin, no sticky (M-DOM):** `.pin-spacer` count is 0 in every configuration. Neither Selected Work nor the category sections are sticky or contain sticky children. The sticky elements on the page are the neighboring brand-statement and About sections and the footer. The Work area scrolls at a normal 1 px per px.

**Selected Work container (M-DOM):** horizontal padding is 80 px desktop and 24 px mobile; bottom padding is 96 / 64 px. The inner column has max-width 1920 px and uses `flex-direction: column` with a 120 px gap desktop / 24 px mobile. **M-JS:** the component is `HomeWorkGridMotionWithData`, fed five featured projects, a client-logo list and an All Work count. The live count is **56**; a stale static fallback in the same chunk says 87.

Desktop rows (M-DOM unless noted):

| Row | Layout | Card media px (w×h) | Aspect ratio (data-driven) |
|---|---|---|---|
| 1 · pair, large left | two columns, `flex-basis:0`, flex-grow **1020 : 724**, 16 px gap; row `min-height` 569.86 px | 739.3×547.9 · 524.7×295.2 | 1599/1185 · 3840/2160 (video) |
| 2 · single wide | 24% empty spacer + 76% column (972.8 px) | 972.8×597.7 | 2075/1275 |
| 3 · pair, large right | flex-grow **724 : 1020**, `items-stretch`; the All Work link sits at the bottom of the narrow left column (`mt-auto`); row min-height 618.92 px | 524.7×309 · 739.3×596.9 | 2031/1196 · 966/780 |

- **M-JS:** row min-height = `((rowWidth − 16) × 1020 / 1744) / min(aspectL, aspectR) + max(metaHeight)`. The row therefore keeps its height when hover swaps which column is large.
- **Card media (M-DOM):** 8 px radius, `#3f3f3f` placeholder background, `overflow: hidden`.
- **Meta line under each card (M-DOM):** 12 px top margin, then title and tagline on one baseline with a 24 px gap. Both are 18 px (0.0125 × vw), line-height 1.2, letter-spacing −0.36 px (−0.02 em), weight 600. The tagline is 40% black.
- **All Work link (M-DOM):** label 32 px (0.0222 × vw), line-height 1, −1.6 px (−0.05 em), weight 600. The count is a 10 px / 12 px superscript-style span. A bent-arrow icon sits in a 21.59 px-wide box (0.9 × line box).

Category groups (M-DOM at 1440×900; **M-JS** formulas in brackets):
- **Section:** `100vh` (900 px), not sticky. Top padding is 108 px [`clamp(72px, 12vh, 136px)`], followed by a full-viewport 1 px hairline at black/10 (white/10 on the dark group).
- **Heading row:** the h2 is 66.24 px [`clamp(32px, 4.6vw, 88px)`, so 0.046 × vw], line-height 0.9, −0.05 em, uppercase, weight 600. A serif description sits to the right: 20 px / 26 px, −0.6 px, fixed width 408 px.
- **Card track:** starts 81 px below [`clamp(40px, 9vh, 110px)`]. It is a single `w-max` flex row with a 22 px gap, 80 px side padding and 143 px bottom padding. Track width is 3270 px (6 cards) or 3562 px (8 cards), against a 1440 px viewport.
- **Card media height:** **M-JS** default is `max(240px, calc(69svh − 119px))` (502 px here). JS then refits it as section height − header − margins − padding − 40, measured at **531 px** in the light group and 422 px in the dark group. Card width is `designWidth × (height / 592)`, so cards vary from about 410 to 799 px wide. Radius is 8 px.
- **Card name:** 18 px / 21.6, −0.36 px, weight 400, 18 px above. Light and dark groups differ only in background and text color.

Mobile (M-DOM): featured cards stack in one column at full width 342 px with a 24 px gap. Order is the same; the wide card becomes full width. Title and tagline stack (16 px each). A 3-slot client-logo strip (114×48 px per slot) sits above the cards, and the All Work label shrinks to 20 px. Category sections size to their content (579 / 648.8 px), with the h2 at the 32 px clamp minimum (0.082 × vw) and the description at 14 / 18.2 px. Category cards are a fixed 208 px wide, aspect 208/270, radius 3.2 px, 22 px gap.

### (b) Scroll-driven motion

Every trigger in the Work area is either a scrubbed parallax or a play-once / play-reverse reveal. There is no pin, no horizontal scroll-jacking and no scrubbed card reveal. All rows in the table below are **M-JS** for the authored values and **M-DOM** for the runtime trigger positions.

| Element | Trigger (start → end) | Mode | From → to | Duration / ease / stagger |
|---|---|---|---|---|
| Featured image inside each card frame | frame `top bottom` → `bottom top` (card 1: scroll 11790 → 13238) | scrub 0.5 | inner layer y −30 px → +30 px | ease `none` (linear) |
| All Work link (masked span) | `top 85%` (scroll 14012) | once | yPercent 110 → 0 (measured 38.5 px → 0) | 0.85 s, `power3.out` |
| Category h2 and description | `top 80%` (Feeling Vital: 14678) | once | SplitText lines with line masks, yPercent 110 → 0 | 0.85 s, `power3.out`, stagger 0.09 s |
| Category cards (all media in the track) | track `top 50%` desktop / `top 86%` mobile (Feeling Vital: 15107; Future-proof: 16116) | `toggleActions: play none none reverse` | autoAlpha 0 + scale 0.96 → 1 + scale 1 | 0.85 s each, `power3.out`, stagger each 0.1 s from start; total 1.35 s (6 cards) / 1.55 s (8 cards) |
| Category card names (h3) | own `top 80%` | once | line yPercent 110 → 0 | 0.85 s, `power3.out` |

**Parallax mechanics (M-JS / M-DOM):**
- Each `[data-parallax-image]` layer is absolutely positioned with inset −34 px vertically and −ceil(34 × w/h) px horizontally (30 px + 4 px safety, scaled by the frame's aspect ratio). It is pre-set to y −30 px; with `reverse: true` the image moves down as the page moves up.
- Speed is 60 px of travel over the trigger distance, e.g. 1448 px for card 1 = 0.0414 px per scroll px.
- Settled samples for card 1: −30.00 at scroll 11790, −11.35 at 12240, +7.29 at 12690, +25.94 at 13140, +30.00 from 13365.
- The same hook runs on mobile (+10.97 → +30 between 10263 and 10700 for card 1). Desktop-only duplicate cards are `display: none` on mobile and the reverse is also true; their triggers compute to 0-height ranges (−900 → 0) and are inert.

**Reveal timing measured per frame (M-DOM, desktop, Feeling Vital, t = 0 at the scroll that crossed the start):**
- Card 1 opacity is 0.26 at 58 ms, 0.74 at 238 ms, 0.94 at 433 ms and 1.00 by about 900 ms. Its scale reads 0.9622 → 0.9843 → 0.9982 → 1.
- Card 6 starts at about 500 ms, is 0.63 at 683 ms and finishes at about 1330 ms.
- The dark group measured the same within sampling error.
- Scrolling back above the start reverses the tween (verified: the script resets above the start and the cards return to 0 / 0.96 before each replay).

### (c) Hover and interaction (desktop, pointer)

There is **no custom cursor or floating label** (no cursor-follower nodes in the DOM). There is **no image scale** on featured cards and **no title underline** on cards. The video card is not hover-driven: it is muted, looping and `preload="none"`, and it plays or pauses through an IntersectionObserver with a 100 px rootMargin (**M-JS**; M-DOM: paused while out of view).

| Interaction | What moves | Values | Evidence |
|---|---|---|---|
| Pointer enters the smaller card of a pair | The two columns swap flex-grow (1020 ↔ 724), so the hovered card becomes the large one. GSAP Flip animates from the pre-change state (`nested`, `prune`, `overwrite`). Leaving the whole row returns to the default. | 0.58 s, `power4.out`. Media heights 547.9 → 388.9 and 295.2 → 415.8 px: 494 at 83 ms, 433 at 170 ms, 401 at 271 ms, settled by about 480 ms | M-JS + M-DOM |
| Pointer on the single wide card | Its 76% column slides left by 16% of row width; plus a CSS inset "press" on the frame | x 0 → −204.8 px (0.16 × 1280), 0.58 s `power4.out`, `overwrite: auto`; leave returns to 0 the same way. clip-path `inset(0 round 8px)` → `inset(6px round 8px)`, 0.5 s `cubic-bezier(0.33,1,0.68,1)` | M-JS + M-DOM (x −179.8 at 172 ms, −204.3 at 378 ms) |
| All Work link | Arrow box widens; a 1 px underline (`::after`, 4 px below the label) scales in | width 0.9 → 1.45 line boxes (21.59 → 34.8 px); `scale` 0 → 1 on the x axis. Origin is right at rest and left on hover, so the line draws in left→right and exits toward the right. Both 0.5 s `cubic-bezier(0.33,1,0.68,1)` (Tailwind `ease-out-cubic`) | M-JS + M-DOM (scaleX 0.42 at 104 ms, 0.82 at 242 ms, 1 at about 500 ms) |
| Category card (pointerenter/focus) | Media grows taller and moves to z-index 20; width unchanged | height 531 → 577 px (+46), CSS 600 ms `cubic-bezier(0.22,1,0.36,1)`; 555 at 132 ms, 574 at 322 ms | M-JS + M-DOM |
| Category track drag | Custom pointer drag (not GSAP Draggable, not scroll). 6 px threshold, axis lock, ×1.6 sensitivity, rAF lerp with damping 0.1 per 60 fps frame (`1 − 0.9^(60·dt)`), clamped to `[0, scrollWidth − clientWidth]`. Cursor `grab`/`grabbing`, `touch-action: pan-y`, click suppressed after a drag | pointer −400 px → track −640 px; −183 at 462 ms, −446 at 843 ms, −609 at 1127 ms, −640 at about 2.0 s | M-JS + M-DOM |
| Images inside dragged cards | Horizontal parallax relative to viewport center; the image layer is widened by 12% each side | translateX = clamp(±8%, −(cardCenter − viewportCenter) / (viewportWidth/2) × 8%); e.g. a card moving from 3.13% to 8% while the track travels 640 px | M-JS + M-DOM |

The category groups are horizontally draggable card rows. **There are no text-list rows with hover previews** in the homepage Work area, so that pattern was not measured.

### (d) Mobile differences (390×844)

- **Same scroll motion, earlier start.** Parallax stays on for featured cards. The category reveal starts at `top 86%` instead of `top 50%` (M-DOM: Feeling Vital track trigger at 11844). Line reveals keep `top 80%` / `top 85%`.
- **Desktop hover systems are removed.** The Flip pair and the 16% slide components are `display: none` (M-JS: `hidden md:flex`). Mobile cards carry only the CSS clip-path inset, which is effectively hover-only.
- **Logo strip.** All three slots crossfade together every 2500 ms (`setInterval`): opacity 500 ms `cubic-bezier(0.4,0,0.2,1)` to 0, swap the logo, then back to 1 (M-DOM: 0.63 at 1234 ms, 0.02 at 1487 ms, 1.00 at 2159 ms, then the next fall at about 3600 ms). The shuffle avoids repeating a logo in the same slot (M-JS).
- **Category cards.** Fixed 208 px with aspect 208/270, so the computed card heights are bypassed. Touch drag uses the same pointer code with `pan-y`; touch drag itself was **not** gesture-tested.

### (e) prefers-reduced-motion (M-DOM unless noted)

- **Loader and layout.** The loader still runs and completed at about 13.7 s desktop / 8.5 s mobile in this run. Document height drops to 16068 px desktop and 15302 px mobile because neighboring sticky scroll sequences collapse.
- **Category groups switch components.** They render a different branch: a native `overflow-x: auto` scroller with fixed 355 px-high cards, width 0.6 × designWidth, no GSAP reveal and no custom drag. Hover becomes an image `scale(1.03)` with a 600 ms `cubic-bezier(0.22,1,0.36,1)` transition (M-JS + M-DOM). E-frame: in this branch the description renders as small serif text.
- **Line reveals.** `[data-fx-y]` reveals are skipped, and the category text is visible immediately.
- **Defect: All Work stays invisible.** The All Work link remained `opacity: 0; visibility: hidden` in both viewports after the loader completed. Its reveal never ran, so a reduced-motion user cannot see that link. Our implementation must not copy this.
- **Parallax is not disabled.** Featured-image parallax still changed with scroll (y 0, +6.35, +30 px at different positions). The hook checks the preference, but the live result still moved; the cause was not isolated.
- **Pair hover and wide-card slide.** These switch to instant `gsap.set` (M-JS). The CSS clip-path and All Work transitions have no reduced-motion override (M-JS).
- **Logo strip.** No fade: opacity stays 1 while logos swap (M-JS reduced flag; M-DOM opacity constant).

### (f) Typography ratios (Work area, M-DOM)

| Element | Font size / viewport width | Line-height / font size | Tracking / font size |
|---|---:|---:|---|
| Category heading (desktop) | .046 (clamped 32–88 px) | .9 | −.05 |
| Category heading (mobile) | .082 (clamp minimum) | .9 | −.05 |
| All Work label (desktop) | .0222 | 1.0 | −.05 |
| Card title / tagline (desktop) | .0125 | 1.2 | −.02 |
| Category description (desktop, serif) | .0139 | 1.3 | −.03 |

### Key reference frames

Times are **M-DOM** screenshot-call bounds in ms from navigation start of that run. Descriptions are **E-frame**. These are internal references only: their images, copy and design are not reused.

| Frame | Time ms | Scroll px | Observation |
|---|---:|---:|---|
| [01 section entry](frames/work-01-section-entry.jpg) | 9430–9596 | 12465 | Logo strip, then the first pair entering |
| [02 featured pair](frames/work-02-featured-pair.jpg) | 10598–10732 | 12690 | Large/small pair at rest, meta lines |
| [03 wide card](frames/work-03-wide-card.jpg) | 13984–14049 | 13365 | Offset 76% card on its 24% spacer |
| [04 hover Flip mid](frames/work-04-hover-flip-mid.jpg) | 47932–48095 | 12570 | Pair mid-swap back to the large left card (~120 ms after pointer move) |
| [05 hover Flip settled](frames/work-05-hover-flip-settled.jpg) | 47733–47795 | 12570 | Right card promoted to large |
| [06 hover wide card](frames/work-06-hover-wide-card.jpg) | 51313–51397 | 13241 | Card slid left 16%, 6 px inset frame |
| [07 hover All Work](frames/work-07-hover-all-work.jpg) | 54389–54466 | 14288 | Longer arrow, underline drawn |
| [08 category before reveal](frames/work-08-category-pre-reveal.jpg) | 33163–33298 | 14567 | Heading visible, cards hidden (autoAlpha 0) |
| [09 category reveal mid](frames/work-09-category-reveal-mid.jpg) | 36900–36941 | 15147 | Staggered fade/scale in progress (scroll crossed start at 36650) |
| [10 category reveal end](frames/work-10-category-reveal-end.jpg) | 38243–38338 | 15147 | All cards at scale 1 |
| [11 dark group reveal mid](frames/work-11-category-dark-reveal-mid.jpg) | 43566–43651 | 16156 | Same reveal on the black group |
| [12 category hover + drag](frames/work-12-category-hover-drag.jpg) | 60053–60215 | 15371 | Track dragged −640 px, hovered card +46 px taller |
| [13 mobile featured stack](frames/work-13-mobile-featured-stack.jpg) | 9741–9782 | 10278 | Single-column cards, stacked meta |
| [14 mobile category carousel](frames/work-14-mobile-category-carousel.jpg) | 20490–20625 | 12388 | 208 px cards, 32 px heading |

### Limits and undetermined items

- **Flip internals.** The hover swap is a GSAP Flip: column bounding widths read their final value from the first sampled frame (about 39 ms), so the visible interpolation was measured on media height only. Whether Flip scales or resizes the columns internally was not isolated.
- **Untested gestures.** Touch drag on mobile, keyboard focus states (focus also triggers the category card hover, per M-JS) and momentum after a fast fling were not tested. The drag has no inertia beyond the lerp catching up.
- **Reduced-motion causes.** The reasons the All Work link stays hidden and parallax keeps running were not isolated; only the outcomes are measured.
- **Timing precision.** Timings come from requestAnimationFrame sampling (about 16–60 ms resolution under SwiftShader). Screenshots are bounded by their call windows, not exact frames.

### Techniques to reuse

These recommendations are derived from the measurements above. Build them with our own content, imagery and layout.

1. **Weighted pair with hover promotion.** Two columns with `flex-basis: 0` and flex-grow in about a 1.4 : 1 ratio (1020 : 724), 16 px gap. On pointerenter, swap the ratio and run `Flip.from(state, {duration: .58, ease: 'power4.out', nested: true})`; restore on leaving the row. Reserve the row's `min-height` from the larger card's aspect ratio so the page below never jumps.
2. **Offset single card with nudge and inset.** Use a 24/76 spacer/card split. On hover, translate the card by −16% of row width (0.58 s `power4.out`) and animate clip-path `inset(0 round R)` → `inset(6px round R)` over 0.5 s `cubic-bezier(.33,1,.68,1)` for a "pressed frame" without scaling the image.
3. **Linear parallax per frame.** Make the image layer 34 px taller on each side (horizontal overscan scaled by aspect) and scrub y −30 → +30 px, `ease: 'none'`, `scrub: .5`, from `top bottom` to `bottom top`. Use one trigger per frame and keep it running on mobile; it is cheap and subtle (about 0.04 px per scroll px).
4. **Masked line reveals for headings and links.** SplitText `lines` with `mask: 'lines'`, yPercent 110 → 0, 0.85 s `power3.out`, stagger 0.09, `once`, start `top 80%` (short links `top 85%`). This matches our hero idiom.
5. **Group entrance for card rows.** `fromTo` autoAlpha 0 / scale .96 → 1, 0.85 s `power3.out`, stagger 0.1 s from the start. Start at `top 50%` on desktop and `top 86%` on mobile, with `toggleActions: 'play none none reverse'` so it replays when re-entered from above.
6. **Drag row instead of scroll-jacking.** Use pointer events with a 6 px threshold and axis lock, ×1.6 sensitivity, frame-rate-independent lerp `1 − (1 − .1)^(60·dt)`, clamping, `touch-action: pan-y`, click suppression after a drag, and grab/grabbing cursors. Add an inner ±8% horizontal image parallax keyed to distance from viewport center, with 12% overscan.
7. **Card hover grow.** Grow height by about 46 px (raise z-index, keep width) over 600 ms `cubic-bezier(.22,1,.36,1)`, top-aligned so neighbors don't move.
8. **Link affordance.** Widen an arrow box from 0.9 to 1.45 line boxes and draw a 1 px underline with `scaleX` 0 → 1, switching transform-origin (right at rest, left on hover) so it enters left and exits right. Both 0.5 s ease-out-cubic.
9. **Mobile.** One column at full width with stacked meta; fixed-width (about 208 px, aspect 208/270) draggable rows; an earlier reveal start; a 3-slot logo crossfade every 2.5 s with 500 ms fades. Drop hover-only systems entirely.
10. **Reduced motion done properly.** Swap the drag row for native `overflow-x: auto` and render reveal targets in their final state. Also disable parallax and slide transforms, which the reference does not fully do. Make sure nothing that JS reveals can stay hidden; the reference's All Work link does.
