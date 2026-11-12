"use client";
import { useRef } from "react";
import { Logo } from "@/components/brand/Logo";
import { WavyBackground } from "@/components/ui/wavy-background";
import {
  gsap,
  useGSAP,
  afterLoader,
  reducedMotion,
} from "@/lib/gsap";
import type { HeroContent } from "@/content";
// Scattered start: the whole wordmark is broken apart. Stencil fragments fly out along their own
// cut direction; letter bodies scatter outward from the wordmark centre. Everything is tilted and
// dimmed, then assembles on scroll. Directions are unit vectors in SVG units.
const FRAGMENT_DIRECTIONS: Record<string, [number, number]> = {
  "l-n1-p2": [0.64, -0.77],
  "l-n2-p2": [0.64, -0.77],
  "l-n1-p3": [-0.64, 0.77],
  "l-n2-p3": [-0.64, 0.77],
  "l-e1-p2": [-1, 0],
  "l-e2-p2": [-1, 0],
  "l-x-p2": [0.25, -0.97],
  "l-x-p3": [0.64, 0.77],
};
const FRAGMENT_DISTANCE = 140;
// Letter bodies: horizontal push away from the centre (fraction of their offset) and a vertical
// throw that alternates up/down so neighbours separate.
const BODY_SPREAD_X = 0.35;
const BODY_THROW_Y: [number, number] = [70, 190];
const MAX_TILT = 38;
// Deterministic pseudo-random in [0, 1) so the scatter is identical on every load.
const jitter = (i: number, salt: number) => {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
function scatter(piece: SVGGraphicsElement, i: number, centre: { x: number; y: number }) {
  const id = piece.getAttribute("data-piece")!;
  const rotation = (jitter(i, 1) * 2 - 1) * MAX_TILT;
  if (id in FRAGMENT_DIRECTIONS) {
    const [x, y] = FRAGMENT_DIRECTIONS[id];
    return { x: x * FRAGMENT_DISTANCE, y: y * FRAGMENT_DISTANCE, rotation };
  }
  const b = piece.getBBox();
  const dx = b.x + b.width / 2 - centre.x;
  const throwY = BODY_THROW_Y[0] + jitter(i, 2) * (BODY_THROW_Y[1] - BODY_THROW_Y[0]);
  return { x: dx * BODY_SPREAD_X, y: (i % 2 ? -1 : 1) * throwY, rotation };
}
// Wordmark rests at this fraction of its full gutter width and grows to 1 on scroll.
// Rest size relative to the final (CSS) size: same on-screen start as before (0.38 of the gutter).
const WORDMARK_REST_SCALE = 0.38 / 0.75;
// Where the wordmark's centre starts, as a fraction of the frame height from its top.
// Negative = above the frame (clipped by overflow), so it is hidden until it drops in.
const WORDMARK_REST_TOP = -0.12;
const WAVE_COLORS = ["#ffffff", "#d4d4d4", "#a3a3a3", "#737373", "#404040"];
export function HeroMedia({ copy }: { copy: HeroContent }) {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(
    (_context, contextSafe) => {
      if (reducedMotion()) return;
      const root = scope.current!;
      const frame = root.querySelector(".media-frame");
      const inner = root.querySelector(".media-inner");
      const wordmark = root.querySelector(".media-wordmark");
      const fragments = [...root.querySelectorAll<SVGGraphicsElement>("[data-piece]")];
      const box = (wordmark as SVGSVGElement).viewBox.baseVal;
      const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      gsap.set(frame, { yPercent: 100 });
      // Fragments sit just outside the viewBox at rest; let them render instead of clipping.
      gsap.set(wordmark, { overflow: "visible", scale: WORDMARK_REST_SCALE });
      fragments.forEach((piece, i) =>
        gsap.set(piece, { ...scatter(piece, i, centre), transformOrigin: "50% 50%", opacity: 0.4 }),
      );
      const start = contextSafe!(() => {
        gsap.to(frame, { yPercent: 0, duration: 1.2, ease: "power3.out" });
        // One journey from the moment the panel enters until the pin releases:
        // the small wordmark starts near the top of the black frame, then drifts
        // down to the centre while growing to full width; the scattered pieces assemble on the way.
        const topOffset = () =>
          -((frame as HTMLElement).clientHeight * (0.5 - WORDMARK_REST_TOP));
        gsap
          .timeline({
            scrollTrigger: {
              trigger: root,
              start: "top bottom",
              end: "bottom 80%",
              scrub: 0.4,
              invalidateOnRefresh: true,
            },
          })
          // The frame stays full-bleed: shrinking it would cancel out the wordmark's growth.
          .fromTo(
            inner,
            { y: topOffset, autoAlpha: 0 },
            { y: 0, duration: 1, ease: "power1.inOut" },
            0,
          )
          .to(inner, { autoAlpha: 1, duration: 0.3, ease: "none" }, 0.08)
          .to(wordmark, { scale: 1, duration: 1, ease: "power1.inOut" }, 0)
          .to(
            fragments,
            {
              x: 0,
              y: 0,
              rotation: 0,
              opacity: 1,
              duration: 0.6,
              ease: "power2.inOut",
              stagger: { each: 0.015, from: "random" },
            },
            0.3,
          );
      });
      return afterLoader(start);
    },
    { scope },
  );
  return (
    <div className="media-region" ref={scope} aria-label={copy.mediaLabel}>
      <div className="media-sticky">
        {/* Keep entrance (frame), growth (wordmark) and parallax (inner) as independent layers. */}
        <div className="media-frame">
          <WavyBackground
            className="media-waves"
            colors={WAVE_COLORS}
            backgroundFill="#000"
            waveOpacity={0.35}
            blur={10}
            speed="slow"
            waveWidth={50}
          />
          <div className="media-inner">
            <Logo className="media-wordmark" />
          </div>
        </div>
      </div>
    </div>
  );
}
