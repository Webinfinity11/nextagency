"use client";
import { useEffect, useRef } from "react";
import { Logo } from "@/components/brand/Logo";
// The wordmark as a dot matrix (after mrkflow.ge's "HELLO"): the pointer drags nearby dots along,
// and springs pull them home. Dots rise into place, left to right, when the footer scrolls in.
export function DotMark() {
  const box = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = box.current!;
    const canvas = root.querySelector("canvas")!;
    const ctx = canvas.getContext("2d")!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1, gap = 5, r = 1.3, raf = 0, visible = false, entered = still, t0 = 0, token = 0;
    let hx = new Float32Array(0), hy = hx, x = hx, y = hx, vx = hx, vy = hx, tone = new Uint8Array(0);
    const p = { x: -1e4, y: -1e4, dx: 0, dy: 0, on: false };

    const sample = async () => {
      const my = ++token;
      const svg = [...root.querySelectorAll<SVGSVGElement>(":scope > svg")].find(s => getComputedStyle(s).display !== "none")!;
      const [, , vw, vh] = svg.getAttribute("viewBox")!.split(" ").map(Number);
      W = root.clientWidth; H = Math.round(W * vh / vw); dpr = Math.min(devicePixelRatio || 1, 2);
      gap = W < 768 ? 4 : Math.max(5, Math.round(W / 280)); r = gap * .3;
      canvas.width = W * dpr; canvas.height = (H + gap) * dpr; canvas.style.height = `${H + gap}px`;
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg"); clone.setAttribute("fill", "#000");
      clone.setAttribute("width", String(W)); clone.setAttribute("height", String(H));
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
      await img.decode();
      if (my !== token) return;
      const off = document.createElement("canvas"); off.width = W; off.height = H;
      const o = off.getContext("2d", { willReadFrequently: true })!;
      o.drawImage(img, 0, 0, W, H);
      const data = o.getImageData(0, 0, W, H).data, pts: number[] = [];
      for (let yy = gap / 2; yy < H; yy += gap) for (let xx = gap / 2; xx < W; xx += gap)
        if (data[(Math.floor(yy) * W + Math.floor(xx)) * 4 + 3] > 128) pts.push(xx, yy);
      const n = pts.length / 2;
      hx = new Float32Array(n); hy = new Float32Array(n); vx = new Float32Array(n); vy = new Float32Array(n); tone = new Uint8Array(n);
      for (let i = 0; i < n; i++) { hx[i] = pts[i * 2]; hy[i] = pts[i * 2 + 1]; const s = Math.sin(i * 91.7 + 13.1) * 43758.5; tone[i] = s - Math.floor(s) < .07 ? 1 : 0; }
      x = hx.slice(); y = hy.slice();
      if (!entered) for (let i = 0; i < n; i++) y[i] = H + gap * 2;
      frame();
    };

    const frame = () => {
      raf = 0;
      const now = performance.now();
      const reach = Math.max(50, W * .06), reach2 = reach * reach;
      let moving = false;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H + gap);
      for (const t of [0, 1]) {
        ctx.fillStyle = t ? "#a3a3a3" : "#000";
        ctx.beginPath();
        for (let i = 0; i < hx.length; i++) {
          if (tone[i] !== t) continue;
          if (!still) {
            // Held below the baseline until this dot's column is released.
            const held = !entered || now - t0 < (hx[i] / W) * 700;
            if (!held) {
              if (p.on) {
                const ddx = x[i] - p.x, ddy = y[i] - p.y, d2 = ddx * ddx + ddy * ddy;
                if (d2 < reach2) { const f = (1 - d2 / reach2) ** 2 * .45; vx[i] += p.dx * f; vy[i] += p.dy * f; }
              }
              vx[i] = (vx[i] + (hx[i] - x[i]) * .045) * .86;
              vy[i] = (vy[i] + (hy[i] - y[i]) * .045) * .86;
              x[i] += vx[i]; y[i] += vy[i];
              if (Math.abs(vx[i]) + Math.abs(vy[i]) > .02 || Math.abs(hy[i] - y[i]) + Math.abs(hx[i] - x[i]) > .1) moving = true;
            } else moving = entered;
          }
          ctx.moveTo(x[i] + r, y[i]);
          ctx.arc(x[i], y[i], r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      p.dx = p.dy = 0;
      if (moving && visible) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && visible && !still) raf = requestAnimationFrame(frame); };

    const move = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect(), nx = e.clientX - b.left, ny = e.clientY - b.top;
      if (p.on) { p.dx += nx - p.x; p.dy += ny - p.y; }
      p.x = nx; p.y = ny; p.on = true; wake();
    };
    const leave = () => { p.on = false; };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !entered && e.intersectionRatio > .25) { entered = true; t0 = performance.now(); }
      wake();
    }, { threshold: [0, .25] });
    const ro = new ResizeObserver(() => { if (root.clientWidth !== W) sample(); });
    io.observe(canvas); ro.observe(root);
    canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerleave", leave);
    return () => { token++; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerleave", leave); };
  }, []);
  return (
    <span ref={box} className="dot-mark">
      <canvas aria-hidden />
      <Logo className="footer-wide" /><Logo className="footer-stacked" variant="stacked" />
    </span>
  );
}
