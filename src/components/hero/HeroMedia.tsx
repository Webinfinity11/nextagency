"use client";
import { useEffect, useRef } from "react";
import { Logo } from "@/components/brand/Logo";
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
      const fragments = [...root.querySelectorAll("[data-piece]")].filter(
        (piece) => piece.getAttribute("data-piece")! in FRAGMENT_DIRECTIONS,
      );
      gsap.set(frame, { yPercent: 100 });
      // Fragments sit just outside the viewBox at rest; let them render instead of clipping.
      gsap.set(root.querySelector(".media-wordmark"), { overflow: "visible" });
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
          .to(
            frame,
            {
              scale: 0.65,
              borderRadius: 24,
              duration: 0.8,
              ease: "power2.inOut",
            },
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
  // Blurred background reel: plays only while the panel is on screen; reduced motion keeps the poster.
  // A missing file hides the element so the panel stays plain black.
  useEffect(() => {
    const video = scope.current?.querySelector<HTMLVideoElement>(".media-video");
    if (!video) return;
    const fail = () => video.setAttribute("data-failed", "");
    // error may have fired before hydration; NETWORK_NO_SOURCE also covers a 404 src.
    if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) fail();
    video.addEventListener("error", fail);
    if (reducedMotion()) return () => video.removeEventListener("error", fail);
    video.muted = true;
    const observer = new IntersectionObserver(([entry]) => {
      if (video.hasAttribute("data-failed")) return;
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    observer.observe(video);
    return () => {
      observer.disconnect();
      video.removeEventListener("error", fail);
    };
  }, []);
  return (
    <div className="media-region" ref={scope} aria-label={copy.mediaLabel}>
      <div className="media-sticky">
        {/* Future showreel/video slot. Keep entrance, frame and parallax as independent layers. */}
        <div className="media-frame">
          <video
            className="media-video"
            src="/media/showreel-bg.mp4"
            poster="/media/showreel-bg-poster.jpg"
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
          />
          <span className="media-index">{copy.mediaIndex}</span>
          <div className="media-inner">
            <Logo className="media-wordmark" />
          </div>
          <span className="media-caption">
            {copy.mediaLabel}
            <span aria-hidden="true">↘</span>
          </span>
        </div>
      </div>
    </div>
  );
}
