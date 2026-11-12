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
// Clean stencil split: letter bodies stay put; only the cut fragments sit out along their cut
// direction (unit vectors, SVG units). X's top fragment leans mostly up so it clears the T.
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
// 30 keeps every fragment clear of neighbouring letters (closest: AGENCY's E bar vs G) and inside the gutter.
const FRAGMENT_DISTANCE = 30;
// Wordmark rests at this fraction of its full gutter width and grows to 1 on scroll.
// Rest size relative to the final (CSS) size: same on-screen start as before (0.38 of the gutter).
const WORDMARK_REST_SCALE = 0.38 / 0.75;
// Where the wordmark's centre starts, as a fraction of the frame height from its top.
// Negative = above the frame (clipped by overflow), so it is hidden until it drops in.
const WORDMARK_REST_TOP = -0.12;
const WAVE_COLORS = ["#ffffff", "#d4d4d4", "#a3a3a3", "#737373", "#404040"];
function fragmentOffset(id: string, distance: number) {
  const [x, y] = FRAGMENT_DIRECTIONS[id];
  return { x: x * distance, y: y * distance };
}
export function HeroMedia({ copy }: { copy: HeroContent }) {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(
    (_context, contextSafe) => {
      if (reducedMotion()) return;
      const root = scope.current!;
      const frame = root.querySelector(".media-frame");
      const inner = root.querySelector(".media-inner");
      const wordmark = root.querySelector(".media-wordmark");
      const fragments = [...root.querySelectorAll("[data-piece]")].filter(
        (piece) => piece.getAttribute("data-piece")! in FRAGMENT_DIRECTIONS,
      );
      gsap.set(frame, { yPercent: 100 });
      // Fragments sit just outside the viewBox at rest; let them render instead of clipping.
      gsap.set(wordmark, { overflow: "visible", scale: WORDMARK_REST_SCALE });
      fragments.forEach((piece) =>
        gsap.set(piece, {
          ...fragmentOffset(piece.getAttribute("data-piece")!, FRAGMENT_DISTANCE),
          opacity: 0.55,
        }),
      );
      const start = contextSafe!(() => {
        gsap.to(frame, { yPercent: 0, duration: 1.2, ease: "power3.out" });
        // One journey from the moment the panel enters until the pin releases:
        // the small wordmark starts near the top of the black frame, then drifts
        // down to the centre while growing to full width; fragments snap in late.
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
              opacity: 1,
              duration: 0.45,
              ease: "power3.out",
              stagger: { each: 0.02, from: "center" },
            },
            0.5,
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
