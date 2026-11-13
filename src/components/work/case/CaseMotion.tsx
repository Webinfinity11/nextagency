"use client";
import { useRef, type ReactNode } from "react";
import { gsap, SplitText, ScrollTrigger, useGSAP, afterLoader } from "@/lib/gsap";
// Case study motion: the title rises in line by line after the loader; scrolling grows the cover from an inset
// card to full width while the title drifts up and fades; panel blocks rise in as they enter.
// Reduced motion: everything is simply visible.
export function CaseMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const root = scope.current!;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const title = root.querySelector<HTMLElement>("[data-case-title]")!;
      const cover = root.querySelector<HTMLElement>("[data-case-cover]")!;
      const split = SplitText.create(title, { type: "lines", mask: "lines", linesClass: "case-title-line", autoSplit: true });
      gsap.set(split.lines, { yPercent: 110 });
      const removeLoader = afterLoader(() => {
        gsap.to(split.lines, { yPercent: 0, duration: 1, ease: "power3.out", stagger: .1 });
        ScrollTrigger.refresh();
      });
      // Cover: inset and rounded at rest (CSS --case-inset / --case-radius), full-bleed by the time it reaches
      // the top. Driven from scroll 0, because the cover is already on screen when the page opens.
      const css = getComputedStyle(cover), side = css.getPropertyValue("--case-inset").trim(), radius = css.getPropertyValue("--case-radius").trim();
      const settle = { trigger: cover, start: 0, end: "top 12%", scrub: .4, invalidateOnRefresh: true };
      gsap.fromTo(cover, { clipPath: `inset(0% ${side} 0% ${side} round ${radius})` }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: settle });
      gsap.fromTo(root.querySelector("[data-case-parallax]"), { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: cover, start: "top bottom", end: "bottom top", scrub: .4 } });
      gsap.to(root.querySelector(".case-hero"), { yPercent: -35, autoAlpha: .15, ease: "none", scrollTrigger: settle });
      root.querySelectorAll<HTMLElement>("[data-case-block]").forEach(el => {
        gsap.from(el, { y: 70, autoAlpha: 0, duration: .9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
      });
      return () => { removeLoader(); split.revert(); };
    }, scope);
    return () => mm.revert();
  }, { scope });
  return <div ref={scope}>{children}</div>;
}
