"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
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
  // Pins and scrubs measure the page once; a section that changes height afterwards (fonts,
  // canvases, late CSS) leaves every later trigger out of place, so re-measure. Per page.
  const pathname = usePathname();
  useEffect(() => {
    let timer = 0;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    document.querySelectorAll("#main > *, footer.footer").forEach(el => ro.observe(el));
    return () => { clearTimeout(timer); ro.disconnect(); };
  }, [pathname]);
  return <span ref={scope} hidden />;
}
