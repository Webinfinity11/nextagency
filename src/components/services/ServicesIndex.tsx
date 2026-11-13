"use client";
import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import type { Service, ServiceCategory } from "@/content/services";
// Category filter + service rows. Rows rise in as they enter; changing the filter re-runs a short stagger.
export function ServicesIndex({ services, categories, all }: { services: Service[]; categories: Record<ServiceCategory, string>; all: string }) {
  const [filter, setFilter] = useState<ServiceCategory | "all">("all");
  const scope = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const counts = services.reduce((m, s) => ({ ...m, [s.category]: (m[s.category] ?? 0) + 1 }), {} as Record<ServiceCategory, number>);
  const tabs: [ServiceCategory | "all", string, number][] = [["all", all, services.length], ...(Object.keys(categories) as ServiceCategory[]).map(c => [c, categories[c], counts[c] ?? 0] as [ServiceCategory, string, number])];
  useGSAP(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rows = gsap.utils.toArray<HTMLElement>(".svc-row:not([hidden])", scope.current);
    if (first.current) {
      first.current = false;
      gsap.set(rows, { autoAlpha: 0, y: 40 });
      ScrollTrigger.batch(rows, { start: "top 92%", once: true, onEnter: batch => gsap.to(batch, { autoAlpha: 1, y: 0, duration: .8, ease: "power3.out", stagger: .07 }) });
    } else {
      gsap.fromTo(rows, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .55, ease: "power3.out", stagger: .05, overwrite: true });
      ScrollTrigger.refresh();
    }
  }, { scope, dependencies: [filter] });
  return <div ref={scope} className="svc-index">
    <div className="svc-tabs" role="group" aria-label={all}>
      {tabs.map(([id, label, n]) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}<span>{n}</span></button>)}
    </div>
    <ol className="svc-list">
      {services.map((s, i) => <li key={s.title} className="svc-row" hidden={filter !== "all" && s.category !== filter}>
        <span className="svc-num">{String(i + 1).padStart(2, "0")}</span>
        <div className="svc-name"><span>{categories[s.category]}</span><h3>{s.title}</h3></div>
        <div className="svc-desc"><p>{s.description}</p><ul>{s.tags.map(t => <li key={t}>{t}</li>)}</ul></div>
      </li>)}
    </ol>
  </div>;
}
