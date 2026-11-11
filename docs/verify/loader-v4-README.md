# Loader v4 — N resolves in place, then E·X·T write in

Only the resolve phase changed (`src/components/loader/Loader.tsx`, `.loader-clean` in `globals.css`):

- The centred NEXT is 480px wide (was 240), capped at 84vw on phones (390px → 327.5px, 31px margins). The boiling N (129px) now shrinks only to 116.6px when it flattens.

- 2.48s: boiling N switches to the solid white texture and tweens (0.36s, power3.inOut) flat — rotation 0 — to the exact position and scale of the N inside the centred clean NEXT. Target is computed from unrounded computed-style layout boxes and both SVGs' shared N geometry, so the running transform never skews it.
- 2.92s: after an 80ms still beat, the boiling mark is swapped for the clean NEXT (E, X, T hidden). Mark `loader:resolved`.
- 2.96s: E, X, T each slide in from +24px with `clip-path: inset(0 100% 0 0) → inset(0)` and opacity 0→1, 0.32s power3.out, 0.09s stagger.
- Everything from the dim onwards is the v3 sequence shifted by +0.48s (dim 3.76, wipe 3.90, nav box 4.45, links 4.98, handoff 5.05, `loader:done` 5.38, AGENCY 5.98, `loader:settled` ≈6.38).
- The clean NEXT no longer has the 9°/−10° 3D tilt: the N has to be flat to match the flattened boiling N, so the travel into the header is now translate + scale only.

Reduced motion and repeat visits are unchanged (final state immediately).

## Verification (`loader-v4-capture.mjs`, 1440×900, ka, production server)

- `loader-v4-001…054.jpg`: 12fps sample-and-hold compositor frames, 0–4.42s; `loader-v4-contact-sheet.jpg`.
- `loader-v4-seam.jpg`: last boiling-N frame | first clean-N frame | difference (4× zoom). Element geometry differs 0.02px; ink bounds move ≤1px; the only changed pixels (213 over 64/255) are the 1px anti-aliased edges (composited scaled layer vs native vector).
- Header handoff: travelled NEXT vs header NEXT differ 0.02px; the travel's source box uses NEXT's constant ink box (getBBox would include E/X/T's pre-reveal offset — that made 2655a48 land ~10% too small).
- `loader-v4-mobile-390.jpg`: NEXT fits the 390px viewport with ≥16px margin (asserted).
- Timing marks within 120ms of target (screencast load causes rAF jitter); repeat visit and reduced motion skip the loader; no page errors. Numbers in `loader-v4-measurements.json`.
