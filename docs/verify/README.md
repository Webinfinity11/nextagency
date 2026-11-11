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
