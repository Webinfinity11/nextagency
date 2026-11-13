"use client";
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, reducedMotion } from "@/lib/gsap";
import { servicesCopy } from "@/content/services";
import type { Locale } from "@/content/locales";
import { display } from "@/lib/mtavruli";
import { createServiceMatrix } from "./serviceMatrix";
// Pinned list after tinywins.com "Our services": each scroll step lifts the list one row,
// and the dot-matrix panel on the right reflows into that service's drawing.
export function Services({ locale }: { locale: Locale }) {
  const { label, home: services } = servicesCopy(locale);
  const scope = useRef<HTMLElement>(null);
  useGSAP(() => {
    const root = scope.current!;
    const list = root.querySelector<HTMLElement>(".services-list")!;
    const rows = gsap.utils.toArray<HTMLElement>(".services-row", root);
    const matrix = createServiceMatrix(root.querySelector<HTMLCanvasElement>(".services-matrix")!, services);
    const still = reducedMotion();
    let active = 0;
    const paint = (i: number, duration: number) => {
      gsap.to(list, { y: -rows[i].offsetTop, duration, ease: "power3.out", overwrite: true });
      rows.forEach((row, k) => {
        row.toggleAttribute("data-active", k === i);
        gsap.to(row, { opacity: k < i ? Math.max(0, 1 - (i - k) * .3) : 1, duration, overwrite: true });
      });
    };
    const go = (i: number) => {
      if (i === active) return;
      active = i;
      const d = still ? 0 : 1;
      paint(i, .7 * d);
      matrix.show(i);
    };
    const n = services.length;
    ScrollTrigger.create({
      trigger: root, start: "top top", end: () => `+=${(n - 1) * innerHeight * .55}`, pin: true, invalidateOnRefresh: true,
      onUpdate: self => go(Math.round(self.progress * (n - 1))),
      onRefresh: () => paint(active, 0),
    });
    return () => matrix.destroy();
  }, { scope });
  return (
    <section className="services" id="services" ref={scope} aria-labelledby="services-title">
      <h2 className="sr-only" id="services-title">{label}</h2>
      <div className="services-stage">
        <ol className="services-list">
          {services.map((s, i) => (
            <li className="services-row" key={s.title} data-active={i === 0 ? "" : undefined}>
              <span className="services-num">{i + 1}</span>
              <span className="services-title">{display(s.title, locale)}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="services-photo" aria-hidden="true"><canvas className="services-matrix" /></div>
    </section>
  );
}
