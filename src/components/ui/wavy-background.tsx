"use client";
// Adapted from Aceternity UI's Wavy Background (ui.aceternity.com/components/wavy-background)
// as a background-only layer: the canvas fills its positioned parent, sizes to that parent
// (DPR capped at 1.5), animates only while on screen and draws a single frame for reduced motion.
import { useEffect, useRef, useState } from "react";
import { createNoise3D } from "simplex-noise";

const MAX_DPR = 1.5;

export function WavyBackground({
  className,
  colors = ["#38bdf8", "#818cf8", "#c084fc", "#e879f9", "#22d3ee"],
  waveWidth = 50,
  backgroundFill = "black",
  blur = 10,
  speed = "fast",
  waveOpacity = 0.5,
}: {
  className?: string;
  colors?: string[];
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: "slow" | "fast";
  waveOpacity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const noise = createNoise3D();
    const step = speed === "slow" ? 0.001 : 0.002;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let nt = 0;
    let frameId = 0;
    let visible = false;

    const draw = () => {
      ctx.fillStyle = backgroundFill;
      ctx.globalAlpha = waveOpacity;
      ctx.fillRect(0, 0, w, h);
      nt += step;
      ctx.lineWidth = waveWidth;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.strokeStyle = colors[i % colors.length];
        for (let x = 0; x < w; x += 5) {
          ctx.lineTo(x, noise(x / 800, 0.3 * i, nt) * 100 + h * 0.5);
        }
        ctx.stroke();
        ctx.closePath();
      }
    };
    const loop = () => {
      draw();
      frameId = requestAnimationFrame(loop);
    };
    const play = () => {
      if (!reduced && visible && !frameId) frameId = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frameId);
      frameId = 0;
    };
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, MAX_DPR);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.filter = `blur(${blur}px)`;
      // Resizing clears the canvas; repaint at once so a paused or static layer never goes blank.
      if (reduced) {
        // Without the loop, one translucent pass would look washed out; settle it with a few.
        for (let n = 0; n < 12; n++) draw();
      } else draw();
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) play();
      else stop();
    });
    intersection.observe(canvas);
    return () => {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
    };
  }, [backgroundFill, blur, colors, speed, waveOpacity, waveWidth]);

  useEffect(() => {
    // Safari ignores ctx.filter; blur the element instead (Aceternity's workaround).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- UA is only known on the client
    setIsSafari(navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome"));
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={isSafari ? { filter: `blur(${blur}px)` } : undefined}
    />
  );
}
