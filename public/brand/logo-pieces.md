# NEXT AGENCY wordmark pieces

Hand-cleaned vector reconstruction of `logo-source.jpeg`. All coordinates below are in SVG user units. No fonts, raster images, transforms, or per-piece fills are used. The root inherits `currentColor`.

## Geometry

- ViewBox: `0 0 1387.3 134.7` (tight vector bounds).
- Source placement: SVG origin at JPEG `(141.7, 548.8)`; one SVG unit equals one source pixel.
- Flat cap line: `y=2.7`; flat baseline: `y=132.5`; nominal cap height: `129.8`.
- G/C curved overshoot: `y=0` to `y=134.7`.
- Stroke thickness varies by letter: E top/bottom bars `28.3`/`28.2`, E middle bars `27.4`, T stem `36.7`, Y stem `36.3`, N diagonal approximately `34` perpendicular to the stroke.
- Gap width is not uniform: E vertical bar gaps are `22.1` and `23.8`; N shard separations are approximately `40–44` perpendicular to the diagonal. These are intentional open areas, not thin uniform stencil slots. Internal seams below have zero visible gap.
- Piece numbering follows top-to-bottom, then left-to-right position within each letter. A continuous shape spanning multiple rows is numbered at its topmost point.

## Internal seams

The source fuses E/X and X/T. The vector assigns the shared silhouette to separate letter groups without opening a visible gap.

1. **E/X:** nominal vertical boundary `x=250.5`, from `y=53.1` to `y=80.5`. `l-x-p1` begins at that boundary; `l-e1-p2` extends to `x=251` (a `0.5` hidden overlap into X). This seam aligns with the right edge of E's top/bottom bars.
2. **X/T:** nominal T left edge `x=391`, beginning at `y=2.7`. `l-t-p1` retains the full rectangular top bar, through `y=31.7`, and its stem. `l-x-p2` extends to `x=391.5` between `y=2.7` and `y=4.2` (a `0.5` hidden overlap inside T). The source shard meets T near the cap line and slopes away beneath it; the remainder of T's left edge is exposed, not a shared seam.

Animate these pieces with awareness that separation exposes the two internal seams. IoU is measured on the union, including overlaps.

## Piece inventory

Bounding boxes use `(minX, minY, maxX, maxY)`, including hidden overlaps. Curved-letter boxes are geometric extrema, not control-point bounds.

| Piece ID | Shape | Bounding box | Triangle / shard candidate |
| --- | --- | --- | --- |
| `l-n1-p1` | Main diagonal ribbon | `(0.0, 2.7, 123.0, 132.5)` | No |
| `l-n1-p2` | Upper-right triangular shard | `(87.6, 2.7, 123.0, 40.2)` | Yes — triangle |
| `l-n1-p3` | Lower-left triangular shard | `(0.0, 94.9, 35.6, 132.5)` | Yes — triangle |
| `l-e1-p1` | Top horizontal bar | `(149.3, 2.7, 250.5, 31.0)` | No |
| `l-e1-p2` | Middle bar; overlaps X at the internal seam | `(162.3, 53.1, 251.0, 80.5)` | No |
| `l-e1-p3` | Bottom horizontal bar | `(149.3, 104.3, 250.5, 132.5)` | No |
| `l-x-p1` | Main right-pointing chevron and arrow | `(250.5, 2.7, 348.1, 132.5)` | No |
| `l-x-p2` | Upper-right shard; touches T at the internal seam | `(343.7, 2.7, 391.5, 39.3)` | Yes — clipped shard |
| `l-x-p3` | Lower-right clipped triangular shard | `(349.9, 100.0, 395.8, 132.5)` | Yes — clipped shard |
| `l-t-p1` | Full top bar and vertical stem | `(391.0, 2.7, 506.5, 132.5)` | No |
| `l-a-p1` | Crossbar-free arch with pointed inner notch | `(558.6, 2.7, 708.6, 132.5)` | No |
| `l-g-p1` | Curved G with rectangular inward spur | `(710.8, 0.0, 839.0, 134.7)` | No |
| `l-e2-p1` | Top horizontal bar | `(859.8, 2.7, 961.0, 31.0)` | No |
| `l-e2-p2` | Inset middle horizontal bar | `(872.1, 53.1, 973.3, 80.5)` | No |
| `l-e2-p3` | Bottom horizontal bar | `(859.8, 104.3, 961.0, 132.5)` | No |
| `l-n2-p1` | Main diagonal ribbon | `(983.6, 2.7, 1106.6, 132.5)` | No |
| `l-n2-p2` | Upper-right triangular shard | `(1071.2, 2.7, 1106.6, 40.2)` | Yes — triangle |
| `l-n2-p3` | Lower-left triangular shard | `(983.6, 94.9, 1019.2, 132.5)` | Yes — triangle |
| `l-c-p1` | Open curved C | `(1126.5, 0.0, 1253.2, 134.7)` | No |
| `l-y-p1` | Forked Y with vertical stem | `(1252.1, 2.7, 1387.3, 132.5)` | No |

## Verification

- Rasterizer: CairoSVG 2.8.2, rendered on a white `1600 × 1233` canvas at the source placement and scale above.
- Source: JPEG converted to grayscale with Pillow; black means intensity `<128`. The rendered SVG uses the same threshold.
- Intersection: `79021` pixels; union: `80495` pixels.
- **Black-pixel IoU: `0.98168830`**, above the required `0.97`.
- Inspected an enlarged overlay piece by piece, including both N letters, the E/X arrow, both X shards, and the T junction. Source-only pixels are red, vector-only pixels cyan, and matching black pixels black. Residual differences are edge-scale deviations.
- Structural checks: two word groups, ten letter groups, twenty unique addressable pieces; straight shapes are polygons and G/C are cubic paths; no embedded raster, text elements, transforms, or per-shape fill.
