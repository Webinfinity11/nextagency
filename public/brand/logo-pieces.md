# KAI STUDIO lockup pieces

Vector reconstruction of `logo-source.jpeg` (1280×720). One SVG unit equals one source pixel; the origin is K's top-left corner, at JPEG `(239, 204)`. Source of truth in code: `src/components/brand/Logo.tsx`.

## Geometry

- `stacked` viewBox `0 0 803 312`; `wordmark` (KAI改 only) viewBox `0 0 803 218`.
- KAI: cap line `y=0`, baseline `y=209.25`. Straight polygons, hand-placed from a potrace corner trace.
- The square: `x=575 y=0 228×218`, brand red `#f03c1f`. It sits on the cap line and drops ~8.5 units below the KAI baseline, as in the source.
- 改: potrace curves, white on the red square in every colour scheme.
- STUDIO: potrace curves, `y≈255–311`, inside a masked nested SVG (`data-studio-mask`) so it can rise in.

## Pieces

| Group | Notes |
| --- | --- |
| `w-kai` › `l-k` | K. Its lower leg meets A's left stroke; the seam follows A's edge with no gap. |
| `w-kai` › `l-a` | A with its triangular counter (even-odd). |
| `w-kai` › `l-i` | I, a rectangle. |
| `w-kai` › `l-mark` | Red square + white 改. |
| `w-studio` › `l-s,l-t,l-u,l-d,l-i,l-o` | STUDIO letters. |

## Verification

Rendered in Chrome at source placement, thresholded and compared with the JPEG: whole-logo IoU `0.988`, red square `0.994`, 改 glyph `0.983`.
