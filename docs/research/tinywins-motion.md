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
