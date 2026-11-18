# Loader v3 verification

`pnpm build && pnpm lint` passed. `node docs/verify/loader-v3-capture.mjs` passed against the production server on port 3027. The script uses Playwright and sharp from `/tmp/kaistudio-verify`; neither was added to app dependencies.

Evidence:
- `loader-v3-001.jpg` … `loader-v3-073.jpg`: 1440×900, 0–6s at 12fps, Chrome compositor frames sampled on an exact clock. Static frames repeat; `capturedAt` records the source frame time.
- `loader-v3-contact-sheet.jpg`: all frames with timestamps.
- `loader-v3-header-strip.jpg`: header entrance and agency reveal, 3.92–6s.
- `loader-v3-reference-comparison.jpg`: phase comparisons; reference on the left, KAI STUDIO on the right. Reference browser chrome is cropped. Reference is evidence only, never a site asset.
- `loader-v3-measurements.json`: animation-frame measurements, compositor times and final geometry for ka/en at 1440/390.
- `loader-v3-header-{ka,en}-{1440,390}.jpg`, `loader-v3-menu-{ka,en}.jpg`: final headers and working mobile menus.

The second reference recording starts mid-boil. Per the opening thread's clarification, preserve the existing 23×110ms exposure sequence and compare relative tail timing, not navigation timestamps. Original artwork, final header dimensions and mobile layout are preserved.

| Phase | Timeline seconds |
| --- | --- |
| Original boiling exposures | 0–2.48 |
| Last texture cross-fades into NEXT; grey to white | 2.48–2.88 |
| Clean tilted NEXT hold | 2.88–3.28 |
| Slight dim | 3.28–3.42 |
| Hard white wipe and matching black-copy clip | 3.42–3.67 |
| Black NEXT hold | 3.67–3.97 |
| Empty centred box fades in | 3.97–4.22 |
| NEXT travels to the box's logo slot | 3.97–4.57 |
| Links stagger, 60ms spacing / 4px rise | 4.50–4.98 |
| Pixel-aligned handoff to the actual header NEXT | 4.57 |
| Whole box slides left; CTA fades; hero released | 4.90–5.50 |
| AGENCY rises inside its fixed SVG viewport | 5.50–5.90 |

Visual comparison confirms continuous travel without an overshoot or visible handoff jump, the centred box hold before its slide, and NEXT remaining fixed while AGENCY reveals. The largest measured handoff difference is 0.026px (SVG/GSAP subpixel rounding). The final stacked mark occupies exactly the same geometry on animated, repeat and reduced-motion visits (test tolerance 0.05px). AGENCY's original 0.43 scale and full containment are explicitly checked; its viewport needs SVG width/height attributes as well as CSS dimensions.

On mobile the existing two header boxes retain their final layout: the left box stays at x=16 throughout, with no centre-to-left slide. Desktop box widths adapt to ka/en text, and their initial horizontal centres are measured from the actual DOM. Fonts and viewport changes trigger remeasurement.

`loader:done` now releases hero/scroll at 4.9s; `loader:settled` marks completion of the agency reveal at ~5.9s. The overlay remains mounted until then but is hidden at release. Session reload and reduced motion skip the sequence. Four fresh-load runs, four repeat visits, four reduced-motion visits, mobile menu open/Escape/Work navigation, overflow and page-error checks passed.

The ThreadRig browser was also opened and the ka→en header link clicked. Its GSAP clock is frozen in this environment, so motion evidence comes from independent headless Chrome, not the browser panel's stationary hero.

Reproduce comparison with `REFERENCE_FRAMES=/tmp/rec2 node docs/verify/loader-v3-compare.mjs` while the supplied reference frames exist.
