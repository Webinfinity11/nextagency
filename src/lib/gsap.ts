"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(ScrollTrigger, SplitText, Flip, useGSAP);
export { gsap, ScrollTrigger, SplitText, Flip, useGSAP };
export const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export function afterLoader(callback: () => void) {
  if (document.documentElement.dataset.loader === "done") callback();
  else window.addEventListener("loader:done", callback, { once: true });
  return () => window.removeEventListener("loader:done", callback);
}
// Cut directions shared by assembly animations; SVG units, not screen pixels.
export function cutOffset(piece: Element, magnitude = 24) {
  const id = piece.getAttribute("data-piece") || "";
  const sign = id.endsWith("p2") ? 1 : -1;
  return { x: sign * magnitude, y: /l-(n|x)/.test(id) ? -sign * magnitude : 0 };
}
