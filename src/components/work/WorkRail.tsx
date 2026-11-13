"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, type CSSProperties } from "react";
import { gsap, useGSAP, afterLoader, ScrollTrigger } from "@/lib/gsap";
import { NoiseLink } from "./NoiseLink";

export type RailItem = {
  slug: string; href: string; title: string; caption: string;
  aspect: number; kind: "gradient" | "image" | "video"; src?: string; poster?: string;
};

const STEP = 0.8; // each slot away from the focus (either side) is 80% of the previous one
const GAP = 24;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Pinned project rail: vertical scroll drives the row right→left while the focus slot itself travels
 * from the left edge to the right edge; a card's scale follows its distance from the focus on both sides. Without JS or with reduced motion it stays a plain overflow-x list.
 */
export function WorkRail({ items, prefix, all }: {
  items: RailItem[]; prefix: string; all: { href: string; label: string };
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
      const track = root.querySelector<HTMLElement>(".work-rail-track")!;
      const touched = [...cards, ...frames, ...captions, ...labels];
      root.dataset.rail = "on";

      let size: { w: number; h: number }[] = [];
      let labelW: number[] = [];
      let vw = 0, margin = 0;
      const measure = () => {
        vw = root.clientWidth;
        const vh = window.innerHeight;
        margin = vw * 0.04;
        const h = Math.min(vh * 0.58, 560);
        size = items.map(({ aspect }) => {
          const w = mobile ? Math.min(vw * 0.7, vh * 0.55 * aspect) : Math.min(h * aspect, vw * 0.42);
          return { w, h: w / aspect };
        });
        frames.forEach((f, i) => { f.style.width = `${size[i].w}px`; f.style.height = `${size[i].h}px`; f.style.top = `${-size[i].h / 2}px`; });
        labelW = labels.map(l => l.offsetWidth);
        // Items are absolutely positioned, so the track would otherwise collapse to 0 whenever the stage's height
        // doesn't resolve, and the cards would spill over the sentence and the button. Reserve the tallest card + captions.
        track.style.minHeight = `${Math.max(...size.map(s => s.h)) + 64}px`;
      };

      let active = -1;
      let swap: gsap.core.Tween | undefined;
      const setActive = (i: number) => {
        if (i === active) return;
        const first = active < 0;
        active = i;
        cards.forEach((c, j) => c.toggleAttribute("data-active", j === i));
        // The name is swapped synchronously; the rise is decoration only (no immediateRender), so a stalled ticker
        // can never leave the word hidden or showing a stale name.
        word.textContent = items[i].title;
        if (first) return;
        swap?.kill();
        swap = gsap.fromTo(word, { yPercent: 110 }, { yPercent: 0, duration: .36, ease: "power3.out", immediateRender: false });
      };

      const render = (p: number) => {
        const k = Math.min(Math.floor(p), n - 2);
        const t = p - k;
        const x: number[] = new Array(n);
        const width: number[] = new Array(n);
        for (let i = 0; i < n; i++) {
          const d = Math.abs(i - p);
          const s = STEP ** d;
          const far = clamp01((d - 6.2) / .8); // beyond ~7 slots (off screen) only the name remains
          width[i] = size[i].w * s * (1 - far) + labelW[i] * far;
          frames[i].style.transform = `scale(${s})`;
          frames[i].style.opacity = String(1 - far);
          captions[i].style.opacity = String(clamp01(1 - d)); // like the reference, only the active card is captioned
          labels[i].style.opacity = String(far);
          captions[i].style.transform = `translateY(${size[i].h * s / 2 + 12}px)`;
        }
        // The focus slot travels left margin → right margin, keeping the active card fully in view.
        const activeW = size[k].w + (size[k + 1].w - size[k].w) * t;
        const focusX = margin + (vw - 2 * margin - activeW) * (p / (n - 1));
        x[k] = focusX - t * (width[k] + GAP);
        for (let i = k + 1; i < n; i++) x[i] = x[i - 1] + width[i - 1] + GAP;
        for (let i = k - 1; i >= 0; i--) x[i] = x[i + 1] - GAP - width[i];
        cards.forEach((c, i) => { c.style.transform = `translate3d(${x[i]}px,0,0)`; });
        setActive(Math.round(p));
      };

      measure();
      const state = { p: 0 };
      const travel = () => (n - 1) * window.innerHeight * (mobile ? .3 : .45);
      const tween = gsap.to(state, {
        p: n - 1, ease: "none", onUpdate: () => render(state.p),
        scrollTrigger: {
          trigger: root, start: "top top", end: () => `+=${travel()}`, pin: true, scrub: .8, invalidateOnRefresh: true,
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
        track.style.removeProperty("min-height");
        cards.forEach(c => c.removeAttribute("data-active"));
        touched.forEach(el => { ["transform", "opacity", "width", "height", "top"].forEach(prop => el.style.removeProperty(prop)); });
        word.textContent = items[0].title;
        gsap.set(word, { clearProps: "transform" });
      };
    });
    return () => mm.revert();
  }, { scope });

  return <div ref={scope} className="work-rail">
    <h2 id="work-title" className="work-rail-sentence"><span>{prefix}</span> <span className="work-rail-mask"><span className="work-rail-word">{items[0]?.title}</span></span></h2>
    <div className="work-rail-track">
      {items.map((item, i) => <Link className="work-rail-item" href={item.href} key={item.slug} draggable={false} aria-label={item.title}>
        <span className="work-rail-frame" style={{ "--aspect": item.aspect } as CSSProperties} data-tone={i % 3}>
          {item.kind === "image" && item.src ? <Image src={item.src} alt="" fill sizes="(max-width: 767px) 70vw, 40vw" />
            : item.kind === "video" && item.src ? <video src={item.src} poster={item.poster} muted loop playsInline autoPlay preload="none" aria-hidden="true" />
            : <span className="work-rail-index" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>}
        </span>
        <span className="work-rail-caption" aria-hidden="true"><b>{item.caption}</b></span>
        <span className="work-rail-label" aria-hidden="true">{item.title}</span>
      </Link>)}
    </div>
    <div className="work-rail-footer"><NoiseLink href={all.href}>{all.label}</NoiseLink></div>
  </div>;
}
