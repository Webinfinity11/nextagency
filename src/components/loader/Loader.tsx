"use client";
import { useRef, useState, useId } from "react";
import { Logo } from "@/components/brand/Logo";
import { gsap, useGSAP, reducedMotion, cutOffset } from "@/lib/gsap";
// Six entries per pose: N ribbon/triangles, X chevron/shards.
// Geometry never interpolates between poses: only opacity crossfades.
type Pose = [number, number, number, number, number][];
const POSES: Pose[] = [
  [
    [30, 0, 0, 1, 1],
    [30, 0, 0, 1, 1],
    [30, 0, 0, 1, 1],
    [-90, 0, 0, 1, 1],
    [-90, 0, 0, 1, 1],
    [-90, 0, 0, 1, 1],
  ],
  [
    [80, -20, 25, 0.9, 1],
    [0, -60, -45, 1.3, 1],
    [65, 35, 20, 0.8, 1],
    [-140, 25, -30, 1, 1],
    [-50, -30, 60, 1.2, 0],
    [-95, 60, 15, 1.4, 1],
  ],
  [
    [80, 0, 90, 0.8, 1],
    [0, -20, 90, 1.6, 1],
    [30, 45, -30, 1, 0],
    [-120, 0, 90, 0.8, 1],
    [-65, 45, 90, 1.2, 1],
    [-140, 20, -45, 1.2, 1],
  ],
  [
    [10, 10, -15, 1.1, 1],
    [80, -20, 30, 0.8, 1],
    [0, -35, 70, 1.4, 1],
    [-60, -10, 15, 0.9, 1],
    [-120, 20, -70, 1.3, 1],
    [-30, 20, 45, 0.7, 0],
  ],
  [
    [75, 5, 0, 1, 1],
    [45, 25, 180, 1.7, 1],
    [110, -20, -90, 1.3, 1],
    [-150, -10, 180, 0.8, 0],
    [-120, 10, -90, 1.6, 1],
    [-160, 0, 90, 1.6, 1],
  ],
  [
    [-15, 10, -35, 0.8, 1],
    [50, 40, 20, 0.8, 0],
    [120, -25, 50, 1.8, 1],
    [-100, 10, 35, 1.1, 1],
    [-70, -15, 20, 1.2, 1],
    [-120, 40, 70, 1, 1],
  ],
  [
    [60, 10, 0, 1, 1],
    [60, 10, 0, 1, 1],
    [60, 10, 0, 1, 1],
    [-100, 10, 0, 1, 0],
    [-110, -30, 120, 1.7, 1],
    [-120, 35, 40, 1, 1],
  ],
  [
    [20, 0, 180, 1, 1],
    [95, -15, 30, 1.5, 1],
    [70, -10, -45, 1, 1],
    [-100, 0, 180, 1, 1],
    [-70, 30, 15, 1, 0],
    [-60, -20, -90, 1.5, 1],
  ],
  [
    [70, 5, 45, 0.8, 1],
    [20, -45, 0, 1.2, 1],
    [-10, 20, 45, 1.2, 1],
    [-90, -5, -45, 0.8, 1],
    [-100, -20, 90, 1.3, 1],
    [-55, 15, 0, 0.9, 1],
  ],
  [
    [35, 0, 0, 1, 1],
    [35, 0, 0, 1, 1],
    [35, 0, 0, 1, 1],
    [-105, 0, 0, 1, 1],
    [-105, 0, 0, 1, 1],
    [-105, 0, 0, 1, 1],
  ],
];
export function Loader() {
  const scope = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const filterId = useId().replace(/:/g, "");
  useGSAP(
    (_context, contextSafe) => {
      const root = scope.current!;
      const html = document.documentElement;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let ticking = false;
      const finish = () => {
        html.dataset.loader = "done";
        try {
          sessionStorage.setItem("next-agency:loaded", "1");
        } catch {
          /* Storage may be unavailable. */
        }
        gsap.set(document.querySelectorAll(".nav-logo,.nav-links,.nav-cta"), {
          autoAlpha: 1,
        });
        window.dispatchEvent(new CustomEvent("loader:done"));
        performance.mark("loader:done");
        setDone(true);
      };
      if (html.dataset.loader === "skip") {
        finish();
        return;
      }
      const clean = root.querySelector(".loader-clean")!;
      performance.mark("loader:start");
      if (reducedMotion()) {
        gsap.set(clean, { autoAlpha: 1 });
        gsap.to(root, { opacity: 0, duration: 0.4, onComplete: finish });
        return;
      }
      const layers = root.querySelectorAll<HTMLElement>(".flicker-layer");
      layers.forEach((layer) =>
        layer.querySelector("svg")!.setAttribute("viewBox", "-30 -65 390 260"),
      );
      const selections = Array.from(layers, (layer) =>
        Array.from(
          layer.querySelectorAll<SVGElement>(
            '[data-letter="l-n1"] [data-piece], [data-letter="l-x"] [data-piece]',
          ),
        ),
      );
      selections
        .flat()
        .forEach((piece) => gsap.set(piece, { transformOrigin: "50% 50%" }));
      let active = 0;
      let previous = -1;
      const pose = contextSafe!(() => {
        let index = Math.floor(Math.random() * POSES.length);
        if (index === previous) index = (index + 1) % POSES.length;
        previous = index;
        const next = 1 - active;
        selections[next].forEach((piece, i) => {
          const [x, y, rotation, scale, opacity] = POSES[index][i];
          gsap.set(piece, { x, y, rotation, scale, opacity });
        });
        gsap.to(layers[next], {
          opacity: 1,
          duration: 0.075,
          overwrite: true,
          ease: "none",
        });
        gsap.to(layers[active], {
          opacity: 0,
          duration: 0.075,
          overwrite: true,
          ease: "none",
        });
        active = next;
        timer = setTimeout(pose, 60 + Math.random() * 50);
      });
      pose();
      const flicker = root.querySelector(".loader-flicker");
      const jitter = (time: number) => {
        gsap.set(flicker, {
          x: Math.sin(time * 19) * 0.65,
          y: Math.cos(time * 23) * 0.55,
          rotation: Math.sin(time * 17) * 0.12,
        });
      };
      gsap.ticker.add(jitter);
      ticking = true;
      const pieces = root.querySelectorAll(".loader-clean [data-piece]");
      pieces.forEach((piece) =>
        gsap.set(piece, { ...cutOffset(piece), opacity: 0 }),
      );
      const anchor = document.querySelector(".nav-logo")!;
      const travel = { progress: 0 };
      let destination = { x: 0, y: 0, scale: 1 };
      const measure = () => {
        const box = anchor.getBoundingClientRect();
        const width = (clean as HTMLElement).offsetWidth;
        destination = {
          x: box.left + box.width / 2 - innerWidth / 2,
          y: box.top + box.height / 2 - innerHeight / 2,
          scale: box.width / width,
        };
      };
      measure();
      window.addEventListener("resize", measure);
      const timeline = gsap.timeline({ onComplete: finish });
      timeline
        .to(flicker, { autoAlpha: 0, duration: 0.4, ease: "power2.inOut" }, 2.4)
        .set(clean, { autoAlpha: 1, mixBlendMode: "difference" }, 2.52)
        .to(
          pieces,
          {
            x: 0,
            y: 0,
            opacity: 1,
            duration: 0.32,
            stagger: { amount: 0.28 },
            ease: "power2.out",
          },
          2.52,
        )
        .call(
          () => {
            clearTimeout(timer);
            gsap.ticker.remove(jitter);
            ticking = false;
          },
          [],
          2.8,
        )
        .to(
          ".loader-wipe",
          { yPercent: 100, duration: 0.6, ease: "power2.inOut" },
          3.27,
        )
        // Difference tracks the wipe edge exactly; normal compositing resumes
        // before the white background fades, so the travel remains solid black.
        .set(clean, { mixBlendMode: "normal" }, 3.87)
        .set(".loader-dark-logo", { opacity: 1 }, 3.87)
        .set(".loader-white-logo", { opacity: 0 }, 3.87)
        .set(".loader-backdrop", { autoAlpha: 0 }, 3.87)
        .to(
          ".loader-wipe",
          { opacity: 0, duration: 0.6, ease: "power2.out" },
          3.87,
        )
        .to(
          document.querySelectorAll(".nav-links,.nav-cta"),
          { autoAlpha: 1, duration: 0.6, ease: "power2.out" },
          3.87,
        )
        .to(
          travel,
          {
            progress: 1,
            duration: 1,
            ease: "power3.inOut",
            onUpdate: () => {
              gsap.set(clean, {
                x: destination.x * travel.progress,
                y: destination.y * travel.progress,
                scale: 1 + (destination.scale - 1) * travel.progress,
              });
            },
          },
          3.87,
        );
      return () => {
        clearTimeout(timer);
        if (ticking) gsap.ticker.remove(jitter);
        window.removeEventListener("resize", measure);
      };
    },
    { scope },
  );
  if (done) return null;
  return (
    <div ref={scope} className="loader" aria-hidden="true">
      <div className="loader-backdrop" />
      <svg width="0" height="0" className="filter-def">
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency=".13"
              numOctaves="3"
              seed="8"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="3"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <div className="loader-flicker" style={{ filter: `url(#${filterId})` }}>
        {[0, 1].map((index) => (
          <div className="flicker-layer" key={index}>
            <Logo />
          </div>
        ))}
      </div>
      <div className="loader-wipe" />
      <div className="loader-clean">
        <Logo className="loader-white-logo" />
        <Logo className="loader-dark-logo" />
      </div>
    </div>
  );
}
