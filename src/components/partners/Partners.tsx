"use client";
import { useEffect, useRef } from "react";
import { Logo } from "@/components/brand/Logo";
import type { Locale } from "@/content/locales";
import { partners, partnersCopy } from "@/content/partners";
// Hub layout after infinity.ge's partner block; each row is an endless strip whose logos break into
// squares at the edges and reassemble (after Aceternity "Disintegrating Gallery", canvas 2D, no WebGL).
type Sprite = { img: HTMLCanvasElement; w: number; h: number; cells: Float32Array };
const rand = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export function Partners({ locale }: { locale: Locale }) {
  const copy = partnersCopy(locale);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = root.current!;
    const canvases = [...section.querySelectorAll<HTMLCanvasElement>(".partners-row")];
    const svg = section.querySelector<SVGSVGElement>(".partners-beams")!;
    const hub = section.querySelector<HTMLElement>(".partners-hub")!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rows = [partners.slice(0, 6), partners.slice(6)];
    const offsets = [0, 0], drag = [0, 0];
    let W = 0, H = 0, logoH = 0, cell = 7, dpr = 1, pad = 0, slot = 0, edge = 0, scatter = 0;
    let sprites: (Sprite | null)[] = partners.map(() => null);
    let paths: { el: SVGPathElement; len: number; dot: SVGCircleElement; speed: number; phase: number; dir: number }[] = [];
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
      logoH = mobile ? 40 : 62; cell = mobile ? 5 : 7; pad = mobile ? 44 : 80;
      slot = W / (mobile ? 2.4 : 5); edge = W * (mobile ? .3 : .22); scatter = W * (mobile ? .22 : .16);
      H = logoH + pad * 2;
      canvases.forEach(c => { c.width = W * dpr; c.height = H * dpr; c.style.height = `${H}px`; });
      sprites = partners.map((_, i) => bake(i));
      beams(mobile ? 3 : 6);
    };
    const beams = (count: number) => {
      const bw = svg.clientWidth, bh = svg.clientHeight;
      const hr = hub.getBoundingClientRect(), sr = svg.getBoundingClientRect();
      const cx = hr.left - sr.left + hr.width / 2, top = hr.top - sr.top, bottom = top + hr.height;
      svg.setAttribute("viewBox", `0 0 ${bw} ${bh}`);
      svg.replaceChildren();
      paths = [];
      const ns = "http://www.w3.org/2000/svg";
      for (const side of [0, 1]) for (let i = 0; i < count; i++) {
        const sx = bw * (i + .5) / count, k = (sx - cx) / (bw / 2);
        const hx = cx + k * hr.width * .36, hy = side ? bottom : top, y0 = side ? bh : 0;
        const p = document.createElementNS(ns, "path");
        p.setAttribute("d", `M${sx} ${y0} C${sx} ${y0 + (hy - y0) * .75} ${hx + (sx - hx) * .4} ${hy} ${hx} ${hy}`);
        p.setAttribute("class", "partners-beam");
        const dot = document.createElementNS(ns, "circle");
        dot.setAttribute("r", W < 768 ? "2.5" : "3.5");
        dot.setAttribute("class", (i + side) % 3 ? "partners-dot is-soft" : "partners-dot");
        svg.append(p, dot);
        paths.push({ el: p, len: p.getTotalLength(), dot, speed: .18 + rand(i * 7 + side) * .22, phase: rand(i * 13 + side * 5), dir: rand(i * 3 + side * 11) > .5 ? 1 : -1 });
      }
    };
    const drawRow = (r: number) => {
      const ctx = canvases[r].getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const list = rows[r], L = list.length * slot;
      list.forEach((_, j) => {
        const idx = r * 6 + j, s = sprites[idx];
        if (!s) return;
        const center = ((((j * slot + offsets[r]) % L) + L) % L) + (W - L) / 2;
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
    let last = performance.now(), raf = 0, visible = false, time = 0;
    const frame = (now: number) => {
      const dt = Math.min(.05, (now - last) / 1000); last = now; time += dt;
      if (!still) {
        offsets[0] -= 48 * dt; offsets[1] += 48 * dt;
        offsets[0] += drag[0]; offsets[1] += drag[1]; drag[0] *= .9; drag[1] *= .9;
      }
      drawRow(0); drawRow(1);
      if (!still) for (const b of paths) {
        let t = (b.phase + time * b.speed) % 1; if (b.dir < 0) t = 1 - t;
        const pt = b.el.getPointAtLength(t * b.len);
        b.dot.setAttribute("cx", String(pt.x)); b.dot.setAttribute("cy", String(pt.y));
      }
      raf = visible && !still ? requestAnimationFrame(frame) : 0;
    };
    const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); });
    io.observe(section);
    const ro = new ResizeObserver(() => { layout(); kick(); });
    ro.observe(section);
    images.forEach((img, i) => img.addEventListener("load", () => { sprites[i] = bake(i); kick(); }));
    // Drag a row to scrub it; the push decays back into the steady drift.
    const cleanups = canvases.map((c, r) => {
      let x0 = 0, down = false;
      const start = (e: PointerEvent) => { down = true; x0 = e.clientX; c.setPointerCapture(e.pointerId); };
      const move = (e: PointerEvent) => { if (!down) return; offsets[r] += e.clientX - x0; drag[r] = (e.clientX - x0) * .3; x0 = e.clientX; kick(); };
      const end = () => { down = false; };
      c.addEventListener("pointerdown", start); c.addEventListener("pointermove", move);
      c.addEventListener("pointerup", end); c.addEventListener("pointercancel", end);
      return () => { c.removeEventListener("pointerdown", start); c.removeEventListener("pointermove", move); c.removeEventListener("pointerup", end); c.removeEventListener("pointercancel", end); };
    });
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); cleanups.forEach(f => f()); };
  }, []);
  return (
    <section className="partners" ref={root} aria-labelledby="partners-title">
      <h2 className="sr-only" id="partners-title">{copy.title}</h2>
      <ul className="sr-only">{partners.map(p => <li key={p.name}>{p.name}</li>)}</ul>
      <canvas className="partners-row" aria-hidden="true" />
      <div className="partners-middle">
        <svg className="partners-beams" aria-hidden="true" />
        <div className="partners-hub"><Logo variant="stacked" /></div>
      </div>
      <canvas className="partners-row" aria-hidden="true" />
    </section>
  );
}
