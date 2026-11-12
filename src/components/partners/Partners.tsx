"use client";
import { useEffect, useRef } from "react";
import type { Locale } from "@/content/locales";
import { partners, partnersCopy } from "@/content/partners";
import { ScrollTrigger } from "@/lib/gsap";
// One endless strip whose logos break into squares at the edges and reassemble
// (after Aceternity "Disintegrating Gallery", canvas 2D, no WebGL). Only the logos come from infinity.ge.
type Sprite = { img: HTMLCanvasElement; w: number; h: number; cells: Float32Array };
const rand = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export function Partners({ locale }: { locale: Locale }) {
  const copy = partnersCopy(locale);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = root.current!;
    const canvas = section.querySelector<HTMLCanvasElement>(".partners-row")!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let offset = 0, drag = 0;
    let W = 0, H = 0, logoH = 0, cell = 7, dpr = 1, pad = 0, slot = 0, edge = 0, scatter = 0;
    let sprites: (Sprite | null)[] = partners.map(() => null);
    const images = partners.map(p => { const img = new Image(); img.src = p.src; return img; });
    const bake = (i: number) => {
      const img = images[i];
      if (!slot || !img.complete || !img.naturalWidth) return null;
      const ratio = img.naturalWidth / img.naturalHeight;
      const h = logoH * (partners[i].scale ?? 1), w = Math.min(h * ratio, slot * .78);
      const hh = w / ratio;
      const c = document.createElement("canvas");
      c.width = Math.ceil(w * dpr); c.height = Math.ceil(hh * dpr);
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      // Remember which cells hold ink so empty space never becomes a flying square.
      const data = ctx.getImageData(0, 0, c.width, c.height).data, cs = cell * dpr, list: number[] = [];
      for (let y = 0; y < c.height; y += cs) for (let x = 0; x < c.width; x += cs) {
        let ink = 0;
        for (let yy = y; yy < Math.min(y + cs, c.height); yy += 2) for (let xx = x; xx < Math.min(x + cs, c.width); xx += 2) ink = Math.max(ink, data[(yy * c.width + xx) * 4 + 3]);
        if (ink > 20) list.push(x / dpr, y / dpr);
      }
      return { img: c, w, h: hh, cells: new Float32Array(list) };
    };
    const layout = () => {
      W = section.clientWidth; dpr = Math.min(devicePixelRatio || 1, 2);
      const mobile = W < 768;
      logoH = mobile ? 44 : 70; cell = mobile ? 5 : 7; pad = mobile ? 26 : 36;
      slot = W / (mobile ? 2.4 : 5); edge = W * (mobile ? .3 : .22); scatter = W * (mobile ? .22 : .16);
      const prevH = H;
      H = logoH + pad * 2;
      canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.height = `${H}px`;
      // The strip sits above every pinned section: when its height changes, pins must re-measure
      // or the services pin overruns the footer.
      if (H !== prevH) ScrollTrigger.refresh();
      sprites = partners.map((_, i) => bake(i));
    };
    const draw = () => {
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const L = partners.length * slot;
      sprites.forEach((s, idx) => {
        if (!s) return;
        const center = ((((idx * slot + offset) % L) + L) % L) + (W - L) / 2;
        const left = center - s.w / 2, top = (H - s.h) / 2;
        if (left > W || left + s.w < 0) return;
        if (left > edge && left + s.w < W - edge) { ctx.drawImage(s.img, left, top, s.w, s.h); return; }
        const c = s.cells, sc = cell * dpr;
        for (let k = 0; k < c.length; k += 2) {
          const x = left + c[k], y = top + c[k + 1], mid = x + cell / 2;
          const p = Math.min(1, Math.max(0, (edge - Math.min(mid, W - mid)) / edge));
          const seed = idx * 9973 + k;
          const t = Math.min(1, Math.max(0, (p - rand(seed) * .55) / .45));
          const e = t * t * (3 - 2 * t);
          if (e >= .99) continue;
          const dir = mid < W / 2 ? -1 : 1;
          const dx = dir * e * scatter * (.35 + .65 * rand(seed + 1)), dy = (rand(seed + 2) - .5) * e * pad * 1.9;
          const size = cell * (1 - e * .6 * rand(seed + 3));
          ctx.globalAlpha = Math.min(1, (1 - e) * 1.6);
          ctx.drawImage(s.img, c[k] * dpr, c[k + 1] * dpr, sc, sc, x + dx, y + dy, size, size);
        }
        ctx.globalAlpha = 1;
      });
    };
    let last = performance.now(), raf = 0, visible = false;
    const frame = (now: number) => {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!still) { offset += drag - 80 * dt; drag *= .9; }
      draw();
      raf = visible && !still ? requestAnimationFrame(frame) : 0;
    };
    const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); });
    io.observe(section);
    const ro = new ResizeObserver(() => { layout(); kick(); });
    ro.observe(section);
    images.forEach((img, i) => img.addEventListener("load", () => { sprites[i] = bake(i); kick(); }));
    // Drag to scrub the strip; the push decays back into the steady drift.
    let x0 = 0, down = false;
    const start = (e: PointerEvent) => { down = true; x0 = e.clientX; canvas.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => { if (!down) return; offset += e.clientX - x0; drag = (e.clientX - x0) * .3; x0 = e.clientX; kick(); };
    const end = () => { down = false; };
    canvas.addEventListener("pointerdown", start); canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      canvas.removeEventListener("pointerdown", start); canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", end); canvas.removeEventListener("pointercancel", end);
    };
  }, []);
  return (
    <section className="partners" ref={root} aria-labelledby="partners-title">
      <h2 className="sr-only" id="partners-title">{copy.title}</h2>
      <ul className="sr-only">{partners.map(p => <li key={p.name}>{p.name}</li>)}</ul>
      <canvas className="partners-row" aria-hidden="true" />
    </section>
  );
}
