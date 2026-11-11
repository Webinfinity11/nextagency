"use client";
import { useRef } from "react";
import { HeroHeadline } from "./HeroHeadline";
import { HeroMedia } from "./HeroMedia";
import { copy } from "@/content/hero";
import { gsap, SplitText, useGSAP, reducedMotion } from "@/lib/gsap";
export function Hero() {
  const scope = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      const root = scope.current!;
      const support = root.querySelector(".support-copy")!;
      const split = SplitText.create(support, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit: (self) =>
          gsap.fromTo(
            self.lines,
            { yPercent: 105 },
            {
              yPercent: 0,
              stagger: 0.1,
              ease: "none",
              scrollTrigger: {
                trigger: root,
                start: "top bottom",
                end: "top top",
                scrub: 0.3,
              },
            },
          ),
      });
      gsap.fromTo(
        root.querySelectorAll(".closing-line"),
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: root.querySelector("h2"),
            start: "top 80%",
            once: true,
          },
        },
      );
      return () => split.revert();
    },
    { scope },
  );
  return (
    <>
      <HeroHeadline />
      <HeroMedia />
      <section className="support" id="next" ref={scope}>
        <p className="support-copy">{copy.support}</p>
        <h2>
          {copy.closing.map((line) => (
            <span className="closing-mask" key={line}>
              <span className="closing-line">{line}</span>
            </span>
          ))}
        </h2>
        <div id="contact" className="contact">
          <span>{copy.contact}</span>
          <span>{copy.contactNote}</span>
        </div>
      </section>
    </>
  );
}
