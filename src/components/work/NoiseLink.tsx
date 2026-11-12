"use client";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Pill link on a drifting noise-gradient frame (after Aceternity's Noise Background): three radial gradients
 * follow one wandering point through a soft spring. Paused off-screen; static with reduced motion.
 */
export function NoiseLink({ href, children, speed = 0.1 }: { href: string; children: ReactNode; speed?: number }) {
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = frame.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, visible = false, last = 0, turned = 0;
    const p = { x: el.offsetWidth / 2, y: el.offsetHeight / 2 };
    const s = { ...p, vx: 0, vy: 0 };
    let v = { x: 0, y: 0 };
    const randomVelocity = () => {
      const a = Math.random() * Math.PI * 2, m = speed * (0.5 + Math.random() * 0.5);
      return { x: Math.cos(a) * m, y: Math.sin(a) * m };
    };
    v = randomVelocity();
    const tick = (time: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(time - (last || time), 50); last = time;
      const w = el.offsetWidth, h = el.offsetHeight, pad = 20;
      if (time - turned > 1500 + Math.random() * 1500) { v = randomVelocity(); turned = time; }
      p.x += v.x * 16; p.y += v.y * 16;
      if (p.x < pad || p.x > w - pad || p.y < pad || p.y > h - pad) {
        v = randomVelocity(); turned = time;
        p.x = Math.max(pad, Math.min(w - pad, p.x)); p.y = Math.max(pad, Math.min(h - pad, p.y));
      }
      // Spring (stiffness 100, damping 30, mass 1), integrated in small steps.
      for (let t = dt / 1000, step = 1 / 240; t > 0; t -= step) {
        const d = Math.min(step, t);
        s.vx += (100 * (p.x - s.x) - 30 * s.vx) * d; s.x += s.vx * d;
        s.vy += (100 * (p.y - s.y) - 30 * s.vy) * d; s.y += s.vy * d;
      }
      el.style.setProperty("--nx", s.x.toFixed(1));
      el.style.setProperty("--ny", s.y.toFixed(1));
    };
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting === visible) return;
      visible = entry.isIntersecting;
      if (visible) { last = 0; raf = requestAnimationFrame(tick); } else cancelAnimationFrame(raf);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [speed]);

  return <div ref={frame} className="noise-frame">
    <span className="noise-layer" style={{ "--m": 1, "--c": "rgb(255 100 150)", opacity: .4 } as CSSProperties} />
    <span className="noise-layer" style={{ "--m": .7, "--c": "rgb(100 150 255)", opacity: .3 } as CSSProperties} />
    <span className="noise-layer" style={{ "--m": 1.2, "--c": "rgb(255 200 100)", opacity: .25 } as CSSProperties} />
    <span className="noise-strip" aria-hidden="true" />
    <span className="noise-grain" aria-hidden="true" />
    <Link className="noise-link" href={href}>{children}</Link>
  </div>;
}
