"use client";
import { useRef, type ReactNode } from "react";
import { gsap, SplitText, ScrollTrigger, useGSAP, afterLoader } from "@/lib/gsap";
import { enableDrag } from "./drag";
export function WorkMotion({ children, className = "" }: { children: ReactNode; className?: string }) {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const root = scope.current!;
    const mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 768px) and (hover: hover)", mobile: "(max-width: 767px), (hover: none)", reduced: "(prefers-reduced-motion: reduce)" }, context => {
      if (context.conditions?.reduced) return;
      const cleanups: (() => void)[] = [];
      const listen = (el: HTMLElement, event: string, callback: () => void) => {
        const wrapped = context.add("", callback) as () => void;
        el.addEventListener(event, wrapped); cleanups.push(() => el.removeEventListener(event, wrapped));
      };
      root.querySelectorAll<HTMLElement>("[data-work-reveal]").forEach(el => {
        const split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "work-line", autoSplit: true,
          onSplit: self => gsap.fromTo(self.lines, { yPercent: 110 }, { yPercent: 0, duration: .85, ease: "power3.out", stagger: .09, scrollTrigger: { trigger: el, start: "top 80%", once: true } }) });
        cleanups.push(() => split.revert());
      });
      root.querySelectorAll<HTMLElement>(".work-parallax").forEach(el => {
        gsap.fromTo(el, { y: -30 }, { y: 30, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: .5 } });
      });
      const entrances: gsap.core.Tween[] = [];
      root.querySelectorAll<HTMLElement>(".work-track, .work-index-grid").forEach(track => {
        const cards = track.querySelectorAll(".work-card");
        const tween = gsap.fromTo(cards, { autoAlpha: 0, scale: .96 }, { autoAlpha: 1, scale: 1, duration: .85, stagger: .1, ease: "power3.out", scrollTrigger: { trigger: track, start: context.conditions?.desktop ? "top 50%" : "top 86%", toggleActions: "play none none reverse" } });
        entrances.push(tween);
        // A keyboard user can reach a card before its scroll entrance.
        listen(track, "focusin", () => { tween.progress(1); });
      });
      const keyboard = (event: KeyboardEvent) => {
        if (event.key === "Tab") entrances.forEach(tween => { tween.scrollTrigger?.kill(false); tween.progress(1); });
      };
      document.addEventListener("keydown", keyboard);
      cleanups.push(() => document.removeEventListener("keydown", keyboard));
      root.querySelectorAll<HTMLElement>(".work-drag").forEach(el => cleanups.push(enableDrag(el)));
      const removeLoader = afterLoader(() => ScrollTrigger.refresh());
      return () => { removeLoader(); cleanups.forEach(fn => fn()); };
    }, scope);
    return () => mm.revert();
  }, { scope });
  return <div ref={scope} className={`work-motion ${className}`}>{children}</div>;
}
