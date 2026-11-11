"use client";
import { type ReactNode, useRef } from "react";
import { HeroHeadline } from "./HeroHeadline";
import { HeroMedia } from "./HeroMedia";
import type { HeroContent } from "@/content";
import type { Locale } from "@/content/locales";
import { display } from "@/lib/mtavruli";
import { gsap, SplitText, useGSAP, reducedMotion } from "@/lib/gsap";
export function Hero({
  copy,
  locale,
  children,
}: {
  copy: HeroContent;
  locale: Locale;
  children?: ReactNode;
}) {
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
                end: "top 40%",
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
      <HeroHeadline copy={copy} locale={locale} />
      <HeroMedia copy={copy} />
      {children}
      <section className="support" id="next" ref={scope}>
        <p className="support-copy">{copy.support}</p>
        <h2>
          {copy.closing.map((line) => (
            <span className="closing-mask" key={line}>
              <span className="closing-line">{display(line, locale)}</span>
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
