"use client";
import { useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { BoilingMark, markStyles } from "@/components/brand/BoilingMark";
import { gsap, useGSAP, reducedMotion } from "@/lib/gsap";

let shown = false;
export function Loader() {
  const scope = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  useGSAP(() => {
    const root = scope.current!;
    const html = document.documentElement;
    const nav = document.querySelectorAll(".nav-logo,.nav-links,.nav-locale,.nav-cta");
    const finish = () => {
      shown = true;
      html.dataset.loader = "done";
      try { sessionStorage.setItem("next-agency:loaded", "1"); } catch { /* Storage may be unavailable. */ }
      gsap.set(nav, { autoAlpha: 1 });
      window.dispatchEvent(new CustomEvent("loader:done"));
      performance.mark("loader:done");
      setDone(true);
    };
    if (shown || html.dataset.loader === "skip" || html.dataset.loader === "done" || reducedMotion()) {
      finish();
      return;
    }
    performance.mark("loader:start");
    const flicker = root.querySelector(".loader-flicker");
    const styles = root.querySelectorAll(".mark-style");
    const solid = root.querySelector(".loader-solid");
    const clean = root.querySelector<HTMLElement>(".loader-clean")!;
    const anchor = document.querySelector(".nav-logo")!;
    let destination = { x: 0, y: 0, scale: 1 };
    const measure = () => {
      const box = anchor.getBoundingClientRect();
      destination = { x: box.left + box.width / 2 - innerWidth / 2, y: box.top + box.height / 2 - innerHeight / 2, scale: box.width / clean.offsetWidth };
    };
    measure();
    window.addEventListener("resize", measure);
    const timeline = gsap.timeline({ onComplete: finish });
    // Discrete exposure changes: the entire silhouette tilts, its cuts never scatter.
    for (let frame = 0; frame < 23; frame++) {
      const index = frame % markStyles.length;
      timeline.set(styles, { opacity: 0 }, frame * .11)
        .set(styles[index], { opacity: 1 }, frame * .11)
        .set(flicker, { rotationX: 9 + Math.sin(frame * 2.4) * 8, rotationY: -17 + Math.cos(frame * 1.7) * 10, rotation: Math.sin(frame * 2.1) * 5, scale: .98 + Math.sin(frame * 3.1) * .035, transformPerspective: 600 }, frame * .11);
    }
    timeline.to(flicker, { autoAlpha: 0, duration: .18 }, 2.48)
      .to(solid, { autoAlpha: 1, duration: .2 }, 2.48)
      .to(solid, { autoAlpha: 0, duration: .2 }, 2.85)
      .set(clean, { mixBlendMode: "difference" }, 2.85)
      .to(clean, { autoAlpha: 1, duration: .25 }, 2.85)
      .to(".loader-wipe", { yPercent: 100, duration: .6, ease: "power2.inOut" }, 3.28)
      // Switch compositing only once the white wipe has covered the viewport.
      .set(clean, { mixBlendMode: "normal" }, 3.88)
      .set(".loader-dark-logo", { opacity: 1 }, 3.88)
      .set(".loader-white-logo", { opacity: 0 }, 3.88)
      .set(".loader-backdrop", { autoAlpha: 0 }, 3.88)
      .to(".loader-wipe", { opacity: 0, duration: .55 }, 3.88)
      .to(document.querySelectorAll(".nav-links,.nav-locale,.nav-cta"), { autoAlpha: 1, duration: .55 }, 3.88);
    const travel = { progress: 0 };
    timeline.to(travel, { progress: 1, duration: .95, ease: "power3.inOut", onUpdate: () => {
      if (!clean.isConnected) return;
      gsap.set(clean, { x: destination.x * travel.progress, y: destination.y * travel.progress, scale: 1 + (destination.scale - 1) * travel.progress });
    } }, 3.88);
    return () => window.removeEventListener("resize", measure);
  }, { scope });
  if (done) return null;
  return (
    <div ref={scope} className="loader" aria-hidden="true">
      <div className="loader-backdrop" />
      <div className="loader-flicker"><BoilingMark /></div>
      <div className="loader-solid"><Logo variant="mark" /></div>
      <div className="loader-wipe" />
      <div className="loader-clean">
        <Logo className="loader-white-logo" variant="stacked" />
        <Logo className="loader-dark-logo" variant="stacked" />
      </div>
    </div>
  );
}
