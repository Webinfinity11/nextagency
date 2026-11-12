"use client";
import { useRef } from "react";
import { Logo } from "@/components/brand/Logo";
import { BackgroundCubesGrid } from "@/components/ui/background-cubes-grid";
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
// Wordmark rests small and faded, then grows to its full gutter width as the fragments close.
const WORDMARK_REST_SCALE = 0.38;
const WORDMARK_REST_OPACITY = 0.6;
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
      gsap.set(wordmark, {
        overflow: "visible",
        scale: WORDMARK_REST_SCALE,
        opacity: WORDMARK_REST_OPACITY,
      });
      fragments.forEach((piece) =>
        gsap.set(piece, {
          ...fragmentOffset(piece.getAttribute("data-piece")!, FRAGMENT_DISTANCE),
          opacity: 0.55,
        }),
      );
      const start = contextSafe!(() => {
        gsap.to(frame, { yPercent: 0, duration: 1.2, ease: "power3.out" });
        gsap
          .timeline({
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: () => `+=${innerHeight * 1.5}`,
              scrub: 0.3,
              invalidateOnRefresh: true,
            },
          })
          // The frame stays full-bleed: shrinking it would cancel out the wordmark's growth.
          .to(
            wordmark,
            { scale: 1, opacity: 1, duration: 0.8, ease: "power2.inOut" },
            0.2,
          )
          .to(
            fragments,
            {
              x: 0,
              y: 0,
              opacity: 1,
              duration: 0.6,
              ease: "power3.out",
              stagger: { each: 0.03, from: "center" },
            },
            0.2,
          );
        gsap.fromTo(
          inner,
          { yPercent: -20 },
          {
            yPercent: 0,
            ease: "none",
            scrollTrigger: {
              trigger: document.body,
              start: "top top",
              end: () => `+=${innerHeight * 0.7}`,
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          },
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
          {/* Darker re-theme of Aceternity's stone demo: near-black tops, grey seams, muted glow. */}
          <BackgroundCubesGrid
            className="media-cubes"
            topColor="#0a0a0a"
            leftColor="#1c1c1c"
            rightColor="#262626"
            glowColor="#525252"
            glow={0.45}
          />
          <div className="media-inner">
            <Logo className="media-wordmark" />
          </div>
        </div>
      </div>
    </div>
  );
}
