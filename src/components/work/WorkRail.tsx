"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { gsap, useGSAP, afterLoader, ScrollTrigger } from "@/lib/gsap";

export type RailItem = {
  slug: string; href: string; title: string; caption: string; feeling: string; captionFeeling: string;
  aspect: number; kind: "gradient" | "image" | "video"; src?: string; poster?: string;
};

const STEP = 0.65; // each slot to the right of the focus is 65% of the previous one
const GAP = 24;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Pinned project rail: vertical scroll drives the row right→left; a card's scale follows its
 * distance from the focus slot. Without JS or with reduced motion it stays a plain overflow-x list.
 */
export function WorkRail({ items, heading, prefix, all }: {
  items: RailItem[]; heading: ReactNode; prefix: string; all: { href: string; label: string };
}) {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const root = scope.current!;
    const mm = gsap.matchMedia();
    mm.add({ motion: "(prefers-reduced-motion: no-preference)", mobile: "(max-width: 767px)" }, context => {
      if (!context.conditions?.motion || items.length < 2) return;
      const mobile = !!context.conditions.mobile;
      const n = items.length;
      const cards = Array.from(root.querySelectorAll<HTMLElement>(".work-rail-item"));
      const frames = cards.map(c => c.querySelector<HTMLElement>(".work-rail-frame")!);
      const captions = cards.map(c => c.querySelector<HTMLElement>(".work-rail-caption")!);
      const labels = cards.map(c => c.querySelector<HTMLElement>(".work-rail-label")!);
      const word = root.querySelector<HTMLElement>(".work-rail-word")!;
      const touched = [...cards, ...frames, ...captions, ...labels];
      root.dataset.rail = "on";

      let size: { w: number; h: number }[] = [];
      let labelW: number[] = [];
      let focusX = 0;
      const measure = () => {
        const vw = root.clientWidth, vh = window.innerHeight;
        focusX = vw * (mobile ? 0.06 : 0.083);
        const side = Math.min(vh * 0.46, vw * 0.29);
        size = items.map(({ aspect }) => {
          const w = mobile ? Math.min(vw * 0.7, vh * 0.42 * aspect) : Math.min(side * Math.sqrt(aspect), vw * 0.42);
          return { w, h: w / aspect };
        });
        frames.forEach((f, i) => { f.style.width = `${size[i].w}px`; f.style.height = `${size[i].h}px`; f.style.top = `${-size[i].h / 2}px`; });
        labelW = labels.map(l => l.offsetWidth);
      };

      let active = -1;
      let swap: gsap.core.Timeline | undefined;
      const setActive = (i: number) => {
        if (i === active) return;
        const first = active < 0;
        active = i;
        cards.forEach((c, j) => c.toggleAttribute("data-active", j === i));
        if (first) { word.textContent = items[i].feeling; return; }
        swap?.kill();
        swap = gsap.timeline()
          .to(word, { yPercent: -110, duration: .16, ease: "power2.in" })
          .call(() => { word.textContent = items[i].feeling; })
          .fromTo(word, { yPercent: 110 }, { yPercent: 0, duration: .32, ease: "power3.out" });
      };

      const render = (p: number) => {
        const k = Math.min(Math.floor(p), n - 1);
        const x: number[] = new Array(n);
        const width: number[] = new Array(n);
        x[k] = focusX - (p - k) * (size[k].w + GAP);
        for (let i = 0; i < n; i++) {
          const d = i - p;
          const s = d <= 0 ? 1 : STEP ** d;
          const far = clamp01((d - 4.2) / .8); // beyond ~5 slots only the name remains
          width[i] = size[i].w * s * (1 - far) + labelW[i] * far;
          frames[i].style.transform = `scale(${s})`;
          frames[i].style.opacity = captions[i].style.opacity = String(1 - far);
          labels[i].style.opacity = String(far);
          captions[i].style.transform = `translateY(${size[i].h * s / 2 + 12}px)`;
        }
        for (let i = k + 1; i < n; i++) x[i] = x[i - 1] + width[i - 1] + GAP;
        for (let i = k - 1; i >= 0; i--) x[i] = x[i + 1] - GAP - width[i];
        cards.forEach((c, i) => { c.style.transform = `translate3d(${x[i]}px,0,0)`; });
        setActive(Math.round(p));
      };

      measure();
      const state = { p: 0 };
      const travel = () => (n - 1) * window.innerHeight * (mobile ? .45 : .7);
      const tween = gsap.to(state, {
        p: n - 1, ease: "none", onUpdate: () => render(state.p),
        scrollTrigger: {
          trigger: root, start: "top top", end: () => `+=${travel()}`, pin: true, scrub: .5, invalidateOnRefresh: true,
          onRefresh: () => { measure(); render(state.p); },
        },
      });
      render(state.p);

      // Keyboard focus moves the scroll to the focused card instead of scrolling the clipped stage.
      const focus = (event: FocusEvent) => {
        const st = tween.scrollTrigger!;
        const target = event.target as HTMLElement;
        const i = cards.findIndex(c => c.contains(target));
        if (i < 0) return;
        const y = st.start + (i / (n - 1)) * (st.end - st.start);
        if (Math.abs(window.scrollY - y) > 2) window.scrollTo(0, y);
      };
      root.addEventListener("focusin", focus);
      const removeLoader = afterLoader(() => ScrollTrigger.refresh());
      return () => {
        removeLoader();
        root.removeEventListener("focusin", focus);
        swap?.kill();
        delete root.dataset.rail;
        cards.forEach(c => c.removeAttribute("data-active"));
        touched.forEach(el => { ["transform", "opacity", "width", "height", "top"].forEach(prop => el.style.removeProperty(prop)); });
        word.textContent = items[0].feeling;
        gsap.set(word, { clearProps: "transform" });
      };
    });
    return () => mm.revert();
  }, { scope });

  return <div ref={scope} className="work-rail">
    <h2 id="work-title" className="work-heading work-rail-heading" data-work-reveal>{heading}</h2>
    <p className="work-rail-sentence"><span>{prefix}</span> <span className="work-rail-mask"><span className="work-rail-word">{items[0]?.feeling}</span></span></p>
    <div className="work-rail-track">
      {items.map((item, i) => <Link className="work-rail-item" href={item.href} key={item.slug} draggable={false} aria-label={item.title}>
        <span className="work-rail-frame" style={{ "--aspect": item.aspect } as CSSProperties} data-tone={i % 3}>
          {item.kind === "image" && item.src ? <Image src={item.src} alt="" fill sizes="(max-width: 767px) 70vw, 40vw" />
            : item.kind === "video" && item.src ? <video src={item.src} poster={item.poster} muted loop playsInline autoPlay preload="none" aria-hidden="true" />
            : <span className="work-rail-index" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>}
        </span>
        <span className="work-rail-caption" aria-hidden="true"><b>{item.caption}</b> <span>{item.captionFeeling}</span></span>
        <span className="work-rail-label" aria-hidden="true">{item.title}</span>
      </Link>)}
    </div>
    <div className="work-rail-footer"><Link className="work-rail-all" href={all.href}>{all.label}<i aria-hidden="true">↗</i></Link></div>
  </div>;
}
