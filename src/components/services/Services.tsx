"use client";
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, reducedMotion } from "@/lib/gsap";
import { servicesCopy } from "@/content/services";
import type { Locale } from "@/content/locales";
import { display } from "@/lib/mtavruli";
// Pinned list after tinywins.com "Our services": each scroll step lifts the list one row,
// the new photo grows in from the bottom-right corner over the old one, and the detail lines swap.
export function Services({ locale }: { locale: Locale }) {
  const { label, services } = servicesCopy(locale);
  const scope = useRef<HTMLElement>(null);
  useGSAP(() => {
    const root = scope.current!;
    const list = root.querySelector<HTMLElement>(".services-list")!;
    const rows = gsap.utils.toArray<HTMLElement>(".services-row", root);
    const media = gsap.utils.toArray<HTMLElement>(".services-media", root);
    const details = gsap.utils.toArray<HTMLElement>(".services-details", root);
    const still = reducedMotion();
    let active = 0, layer = 1;
    const paint = (i: number, duration: number) => {
      gsap.to(list, { y: -rows[i].offsetTop, duration, ease: "power3.out", overwrite: true });
      rows.forEach((row, k) => {
        row.toggleAttribute("data-active", k === i);
        gsap.to(row, { opacity: k < i ? Math.max(0, 1 - (i - k) * .3) : 1, duration, overwrite: true });
      });
    };
    const go = (i: number) => {
      if (i === active) return;
      const prev = active; active = i;
      const d = still ? 0 : 1;
      paint(i, .7 * d);
      const img = media[i];
      gsap.set(img, { zIndex: ++layer, visibility: "visible" });
      gsap.fromTo(img, { clipPath: "inset(100% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: .9 * d, ease: "power3.inOut", overwrite: true });
      gsap.fromTo(img.firstElementChild, { scale: 1.25 }, { scale: 1, duration: 1.1 * d, ease: "power3.out", overwrite: true });
      gsap.to(details[prev].children, { autoAlpha: 0, duration: .2 * d, overwrite: true });
      gsap.fromTo(details[i].children, { autoAlpha: 0, yPercent: 60 }, { autoAlpha: 1, yPercent: 0, duration: .55 * d, delay: .15 * d, stagger: .05 * d, ease: "power3.out", overwrite: true });
      details.forEach((el, k) => el.setAttribute("aria-hidden", String(k !== i)));
    };
    details.forEach((el, k) => k && gsap.set(el.children, { autoAlpha: 0 }));
    const n = services.length;
    ScrollTrigger.create({
      trigger: root, start: "top top", end: () => `+=${(n - 1) * innerHeight * .55}`, pin: true, invalidateOnRefresh: true,
      onUpdate: self => go(Math.round(self.progress * (n - 1))),
      onRefresh: () => paint(active, 0),
    });
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
      <div className="services-photo" aria-hidden="true">
        {services.map((s, i) => (
          <div className="services-media" key={s.title} style={{ zIndex: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden" }}>
            <div className="services-fill" data-dark={i % 2 ? "" : undefined} style={{ background: `linear-gradient(145deg, ${s.tone[0]}, ${s.tone[1]})` }}>
              <span>{String(i + 1).padStart(2, "0")}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="services-detail-stack">
        {services.map((s, i) => (
          <ul className="services-details" key={s.title} aria-hidden={i !== 0}>
            {s.items.map(item => <li key={item}>{item}</li>)}
          </ul>
        ))}
      </div>
    </section>
  );
}
