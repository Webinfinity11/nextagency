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
    const box = document.querySelector<HTMLElement>(".nav-start")!;
    const end = document.querySelector(".nav-end")!;
    const logo = document.querySelector(".nav-logo")!;
    const next = logo.querySelector<SVGGElement>('[data-wordmark="w-next"]')!;
    const agency = logo.querySelector('[data-wordmark="w-agency"]')!;
    const links = document.querySelectorAll(".nav-links a,.nav-menu");
    const nav = document.querySelectorAll(".nav-logo,.nav-links,.nav-locale,.nav-cta");
    let released = false;
    // Release the page at the box slide; the header tail continues independently.
    const release = () => {
      if (released) return;
      released = true;
      shown = true;
      html.dataset.loader = "done";
      try { sessionStorage.setItem("next-agency:loaded", "1"); } catch { /* Storage may be unavailable. */ }
      window.dispatchEvent(new CustomEvent("loader:done"));
      performance.mark("loader:done");
    };
    const finish = () => {
      release();
      gsap.set([box, end, ...nav, ...links, agency], { clearProps: "opacity,visibility,transform" });
      performance.mark("loader:settled");
      setDone(true);
    };
    if (shown || html.dataset.loader === "skip" || html.dataset.loader === "done" || reducedMotion()) {
      finish();
      return;
    }
    performance.mark("loader:start");
    const flicker = root.querySelector(".loader-flicker");
    const styles = root.querySelectorAll(".mark-style");
    const clean = root.querySelectorAll<HTMLElement>(".loader-clean");
    const white = clean[0];
    const wipe = root.querySelector(".loader-wipe");
    const ink = root.querySelector(".loader-ink");
    let offset = 0;
    let destination = { x: 0, y: 0, scale: 1 };
    const travel = { progress: 0 };
    const slide = { progress: 0 };
    const position = () => {
      gsap.set(box, { x: offset * (1 - slide.progress) });
      gsap.set(clean, {
        x: destination.x * travel.progress,
        y: destination.y * travel.progress,
        scale: 1 + (destination.scale - 1) * travel.progress,
        rotationX: 9 * (1 - travel.progress),
        rotationY: -10 * (1 - travel.progress),
        transformPerspective: 600,
      });
    };
    const measure = () => {
      // Measure the final DOM, never the transformed intermediate box.
      gsap.set(box, { x: 0 });
      const bounds = box.getBoundingClientRect();
      offset = innerWidth >= 768 ? (innerWidth - bounds.width) / 2 - bounds.left : 0;
      const target = next.getBoundingClientRect();
      const source = white.querySelector<SVGGElement>('[data-wordmark="w-next"]')!.getBBox();
      const ratio = white.offsetWidth / 506.5;
      destination = {
        x: target.left + target.width / 2 + offset - innerWidth / 2,
        // NEXT's ink bounds differ slightly from its SVG viewport; align ink to ink.
        y: target.top + target.height / 2 - innerHeight / 2 - (source.y + source.height / 2 - 134.7 / 2) * ratio * target.width / (source.width * ratio),
        scale: target.width / (source.width * ratio),
      };
      position();
    };
    gsap.set([box, end, ...links], { autoAlpha: 0 });
    gsap.set(document.querySelector(".nav-links"), { visibility: "visible" });
    gsap.set(agency, { yPercent: 105 });
    gsap.set(links, { y: 4 });
    measure();
    window.addEventListener("resize", measure);
    // Fonts can finish loading during the boil and change the centred box width.
    let active = true;
    void document.fonts.ready.then(() => { if (active) measure(); });
    const timeline = gsap.timeline({ onComplete: finish });
    // Original 23 exposures / 12 textures / 110ms cadence, unchanged.
    for (let frame = 0; frame < 23; frame++) {
      const index = frame % markStyles.length;
      timeline.set(styles, { opacity: 0 }, frame * .11)
        .set(styles[index], { opacity: 1 }, frame * .11)
        .set(flicker, { rotationX: 9 + Math.sin(frame * 2.4) * 8, rotationY: -17 + Math.cos(frame * 1.7) * 10, rotation: Math.sin(frame * 2.1) * 5, scale: .98 + Math.sin(frame * 3.1) * .035, transformPerspective: 600 }, frame * .11);
    }
    timeline.to(flicker, { autoAlpha: 0, duration: .28 }, 2.48)
      .to(clean, { autoAlpha: 1, duration: .4, ease: "none" }, 2.48)
      .to(white, { opacity: .72, duration: .14 }, 3.28)
      // Two identical screen-space clips give a hard edge and exact colour flip.
      .to([wipe, ink], { clipPath: "inset(0 0 0% 0)", duration: .25, ease: "power2.inOut" }, 3.42)
      .set([wipe, root.querySelector(".loader-backdrop"), white], { autoAlpha: 0 }, 3.97)
      .to(box, { autoAlpha: 1, duration: .25 }, 3.97)
      .to(travel, { progress: 1, duration: .6, ease: "power3.inOut", onUpdate: position }, 3.97)
      .to(links, { autoAlpha: 1, y: 0, duration: .24, stagger: .06 }, 4.5)
      // Same NEXT paths, same ink bounds; switch only after the travel has ended.
      .set(logo, { autoAlpha: 1 }, 4.57)
      .set(ink, { autoAlpha: 0 }, 4.57)
      .call(() => performance.mark("loader:handoff"), [], 4.57)
      .call(release, [], 4.9)
      .to(slide, { progress: 1, duration: .6, ease: "power3.out", onUpdate: position }, 4.9)
      .set(document.querySelectorAll(".nav-locale,.nav-cta"), { autoAlpha: 1 }, 4.9)
      .to(end, { autoAlpha: 1, duration: .4 }, 4.9)
      .to(agency, { yPercent: 0, duration: .4, ease: "power3.out" }, 5.5);
    return () => {
      active = false;
      window.removeEventListener("resize", measure);
    };
  }, { scope });
  if (done) return null;
  return (
    <div ref={scope} className="loader" aria-hidden="true">
      <div className="loader-backdrop" />
      <div className="loader-flicker"><BoilingMark /></div>
      <div className="loader-wipe" />
      <div className="loader-clean loader-white-logo"><Logo variant="next" /></div>
      <div className="loader-ink">
        <div className="loader-clean loader-dark-logo"><Logo variant="next" /></div>
      </div>
    </div>
  );
}
