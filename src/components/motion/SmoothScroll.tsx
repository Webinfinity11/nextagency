"use client";
import { useRef } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, useGSAP, afterLoader } from "@/lib/gsap";
export function SmoothScroll() {
  const scope = useRef<HTMLSpanElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const lenis = new Lenis({ lerp: 0.125, smoothWheel: true });
        if (document.documentElement.dataset.loader !== "done") lenis.stop();
        const remove = afterLoader(() => {
          lenis.start();
          ScrollTrigger.refresh();
        });
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        return () => {
          remove();
          gsap.ticker.remove(tick);
          lenis.destroy();
        };
      });
      return () => mm.revert();
    },
    { scope },
  );
  return <span ref={scope} hidden />;
}
