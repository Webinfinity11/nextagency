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
    const nav = document.querySelectorAll(".nav-logo,.nav-links,.nav-locale");
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
    const flickerBox = flicker as HTMLElement;
    const letters = ["l-e1", "l-x", "l-t"].map((id) => root.querySelectorAll(`.loader-clean [data-letter="${id}"]`));
    let offset = 0;
    let destination = { x: 0, y: 0, scale: 1 };
    // Where the boiling N must land: exactly on the N of the centred clean NEXT.
    let resolve = { x: 0, y: 0, scale: 1 };
    const travel = { progress: 0 };
    const slide = { progress: 0 };
    const position = () => {
      gsap.set(box, { x: offset * (1 - slide.progress), force3D: true });
      gsap.set(clean, {
        x: destination.x * travel.progress,
        y: destination.y * travel.progress,
        scale: 1 + (destination.scale - 1) * travel.progress,
      });
    };
    // Unrounded layout box (offset* rounds to whole px); ignores running transforms.
    const layout = (el: HTMLElement) => {
      const c = getComputedStyle(el);
      return { left: parseFloat(c.left), top: parseFloat(c.top), width: parseFloat(c.width), height: parseFloat(c.height) };
    };
    const measure = () => {
      // Measure the final DOM, never the transformed intermediate box (x and the entry scale).
      const boxScale = gsap.getProperty(box, "scale") as number;
      gsap.set(box, { x: 0, scale: 1 });
      const bounds = box.getBoundingClientRect();
      offset = innerWidth >= 768 ? (innerWidth - bounds.width) / 2 - bounds.left : 0;
      const target = next.getBoundingClientRect();
      // NEXT's ink box in SVG units. Not getBBox(): it would include E/X/T's pre-reveal offset.
      const source = { x: 0, y: 2.7, width: 506.5, height: 129.8 };
      const cleanBox = layout(white), flickerLayout = layout(flickerBox);
      const ratio = cleanBox.width / 506.5;
      destination = {
        x: target.left + target.width / 2 + offset - innerWidth / 2,
        // NEXT's ink bounds differ slightly from its SVG viewport; align ink to ink.
        y: target.top + target.height / 2 - innerHeight / 2 - (source.y + source.height / 2 - 134.7 / 2) * ratio * target.width / (source.width * ratio),
        scale: target.width / (source.width * ratio),
      };
      // Both SVGs draw the same N (units 0–123 × 2.7–132.5); BoilingMark's viewBox is -10 -10 143 155.
      const w = flickerLayout.width, h = flickerLayout.height;
      const k = Math.min(w / 143, h / 155);
      const from = { x: flickerLayout.left + (w - 143 * k) / 2 + (61.5 + 10) * k, y: flickerLayout.top + (h - 155 * k) / 2 + (67.6 + 10) * k };
      const to = { x: cleanBox.left + 61.5 * ratio, y: cleanBox.top + 67.6 * ratio };
      const centre = { x: flickerLayout.left + w / 2, y: flickerLayout.top + h / 2 };
      const scale = ratio / k;
      resolve = { scale, x: to.x - centre.x - (from.x - centre.x) * scale, y: to.y - centre.y - (from.y - centre.y) * scale };
      gsap.set(box, { scale: boxScale });
      position();
    };
    gsap.set([box, end, ...links], { autoAlpha: 0 });
    gsap.set(document.querySelector(".nav-links"), { visibility: "visible" });
    gsap.set(agency, { yPercent: 105 });
    gsap.set(links, { y: 8 });
    // x is in SVG user units: 24 CSS px at the clean logo's rendered width.
    letters.forEach((letter) => gsap.set(letter, { x: 24 * 506.5 / layout(white).width, autoAlpha: 0, clipPath: "inset(0% 100% 0% 0%)" }));
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
    // Resolve: the boiling N settles flat and solid onto the N of the centred NEXT,
    // then E, X, T write in from its right. Everything after is the v3 sequence + `shift`.
    const settled = 2.92;
    const shift = .48;
    timeline.set(styles, { opacity: 0 }, 2.48)
      .set(styles[markStyles.indexOf("white")], { opacity: 1 }, 2.48)
      .to(flicker, { x: () => resolve.x, y: () => resolve.y, scale: () => resolve.scale, rotationX: 0, rotationY: 0, rotation: 0, duration: settled - 2.48 - .08, ease: "power3.inOut" }, 2.48)
      // Swapped after a short still beat; identical geometry, so the swap is invisible.
      .set(flicker, { autoAlpha: 0 }, settled)
      .set(clean, { autoAlpha: 1 }, settled)
      .call(() => performance.mark("loader:resolved"), [], settled);
    letters.forEach((letter, i) => timeline.to(letter, {
      x: 0, autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)", duration: .32, ease: "power3.out",
    }, settled + .04 + i * .09));
    timeline.to(white, { opacity: .72, duration: .14 }, 3.28 + shift)
      // Two identical screen-space clips give a hard edge and exact colour flip.
      .to([wipe, ink], { clipPath: "inset(0 0 0% 0)", duration: .25, ease: "power2.inOut" }, 3.42 + shift)
      .set([wipe, root.querySelector(".loader-backdrop"), white], { autoAlpha: 0 }, 3.97 + shift);
    // Header tail: each step overlaps the previous one, so there is no idle beat.
    const start = 3.97 + shift;
    const travelTime = .9;
    const linksAt = start + travelTime * .7;
    const linksEnd = linksAt + .05 * (links.length - 1) + .5;
    const slideAt = Math.max(start + travelTime, linksEnd - .18);
    const slideTime = .95;
    timeline.fromTo(box, { autoAlpha: 0, scale: .98 }, { autoAlpha: 1, scale: 1, transformOrigin: "50% 50%", force3D: true, duration: .45, ease: "power2.out" }, start)
      .to(travel, { progress: 1, duration: travelTime, ease: "expo.inOut", onUpdate: position }, start)
      .to(links, { autoAlpha: 1, y: 0, duration: .5, stagger: .05, ease: "power3.out" }, linksAt)
      // Same NEXT paths, same ink bounds; switch only after the travel has ended.
      .set(logo, { autoAlpha: 1 }, start + travelTime)
      .set(ink, { autoAlpha: 0 }, start + travelTime)
      .call(() => performance.mark("loader:handoff"), [], start + travelTime)
      .call(release, [], slideAt)
      .to(slide, { progress: 1, duration: slideTime, ease: "expo.out", onUpdate: position }, slideAt)
      .set(document.querySelector(".nav-locale"), { autoAlpha: 1 }, slideAt)
      .fromTo(end, { autoAlpha: 0, x: 12 }, { autoAlpha: 1, x: 0, force3D: true, duration: .6, ease: "power3.out" }, slideAt)
      .to(agency, { yPercent: 0, duration: .6, ease: "power3.out" }, slideAt + slideTime * .6);
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
