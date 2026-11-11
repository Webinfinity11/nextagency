"use client";
import { useRef } from "react";
import { Logo } from "@/components/brand/Logo";
import {
  gsap,
  useGSAP,
  afterLoader,
  reducedMotion,
  cutOffset,
} from "@/lib/gsap";
import { copy } from "@/content/hero";
export function HeroMedia() {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(
    (_context, contextSafe) => {
      if (reducedMotion()) return;
      const root = scope.current!;
      const frame = root.querySelector(".media-frame");
      const inner = root.querySelector(".media-inner");
      const pieces = root.querySelectorAll("[data-piece]");
      gsap.set(frame, { yPercent: 100 });
      pieces.forEach((piece) => gsap.set(piece, cutOffset(piece, 65)));
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
          .to(pieces, { x: 0, y: 0, duration: 0.8, ease: "power2.inOut" }, 0.2);
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
        {/* Future showreel/video slot. Keep entrance, frame and parallax as independent layers. */}
        <div className="media-frame">
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
