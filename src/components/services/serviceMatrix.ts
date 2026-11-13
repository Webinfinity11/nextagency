// LED dot-matrix for the home Services panel. One set of dots reflows between six drawings (one per service);
// each drawing has a base layer (warm white) and an accent layer in that service's signal colour, which also
// carries a small idle motion (cursor drifts, heart beats, playhead blinks…). The pointer pushes dots aside,
// like the footer wordmark. Drawings are authored in a 100×120 unit box and sampled onto the dot grid.
export type MatrixVisual = "web" | "social" | "seo" | "video" | "crm" | "ai";
type Ctx = CanvasRenderingContext2D;
type Draw = (c: Ctx, layer: 0 | 1) => void;
/** Idle motion for accent dots: home position in units → [dx, dy] in units and an alpha multiplier. */
type Motion = (t: number, ux: number, uy: number) => [number, number, number];

const rr = (c: Ctx, x: number, y: number, w: number, h: number, r: number) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
const circle = (c: Ctx, x: number, y: number, r: number) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
const line = (c: Ctx, pts: number[]) => { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.stroke(); };
const poly = (c: Ctx, pts: number[]) => { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fill(); };
const heart = (c: Ctx, x: number, y: number, s: number) => {
  c.beginPath(); c.moveTo(x, y + s * .9);
  c.bezierCurveTo(x - s * 1.3, y, x - s * .9, y - s * .9, x, y - s * .3);
  c.bezierCurveTo(x + s * .9, y - s * .9, x + s * 1.3, y, x, y + s * .9); c.fill();
};
const near = (ux: number, uy: number, x: number, y: number, r: number) => (ux - x) ** 2 + (uy - y) ** 2 < r * r;

const DRAW: Record<MatrixVisual, Draw> = {
  // Browser window: chrome bar, hero copy, image, three cards; accent = call-to-action + cursor.
  web: (c, l) => {
    if (!l) {
      rr(c, 8, 16, 84, 88, 4); c.stroke(); line(c, [8, 28, 92, 28]);
      circle(c, 14.5, 22, 2.2); circle(c, 21, 22, 2.2); circle(c, 27.5, 22, 2.2);
      c.fillRect(16, 36, 40, 5); c.fillRect(16, 45, 28, 3);
      rr(c, 64, 35, 20, 24, 2); c.stroke(); line(c, [64, 59, 72, 49, 78, 55, 84, 47]);
      for (const x of [16, 40, 64]) { rr(c, x, 70, 20, 26, 2); c.stroke(); c.fillRect(x + 4, 88, 12, 2.4); }
    } else {
      rr(c, 16, 53, 17, 6, 3); c.fill();
      poly(c, [42, 57, 42, 70, 45.5, 66.5, 48.5, 73, 51, 72, 48, 65.5, 53, 65.5]);
    }
  },
  // Phone feed: two posts; accent = like heart, floating hearts and the notification badge.
  social: (c, l) => {
    if (!l) {
      rr(c, 22, 8, 56, 104, 9); c.stroke(); line(c, [43, 15, 57, 15]);
      circle(c, 32, 26, 3.4); c.fillRect(38, 23, 22, 2.6); c.fillRect(38, 28, 13, 2);
      rr(c, 29, 34, 42, 30, 2); c.stroke(); poly(c, [32, 61, 42, 48, 49, 56, 55, 50, 68, 61]);
      rr(c, 44, 67, 7, 5, 1.5); c.stroke(); line(c, [56, 69.5, 64, 69.5]);
      circle(c, 32, 84, 3.4); c.fillRect(38, 81, 22, 2.6);
      rr(c, 29, 92, 42, 14, 2); c.stroke();
    } else {
      heart(c, 35, 69.5, 4.4);
      heart(c, 87, 52, 6); heart(c, 91, 36, 4.4);
      circle(c, 76, 11, 5.5);
    }
  },
  // Rising bars on axes with a magnifier; accent = the trend line and its arrowhead.
  seo: (c, l) => {
    if (!l) {
      line(c, [10, 104, 92, 104]); line(c, [10, 104, 10, 18]);
      [14, 22, 30, 42, 54, 70].forEach((h, i) => c.fillRect(17 + i * 12.5, 104 - h, 7, h));
      c.save(); c.lineWidth = 2.6; c.beginPath(); c.arc(33, 36, 11, 0, Math.PI * 2); c.stroke(); line(c, [41, 44, 50, 53]); c.restore();
    } else {
      c.save(); c.lineWidth = 2.6; line(c, [18, 84, 33, 76, 46, 66, 58, 56, 71, 44, 86, 26]); c.restore();
      poly(c, [80, 25, 91, 19, 89, 31]);
    }
  },
  // Film frame with perforations and a timeline; accent = play triangle, progress, playhead, REC dot.
  video: (c, l) => {
    if (!l) {
      rr(c, 8, 28, 84, 58, 4); c.stroke();
      for (let x = 11; x < 92; x += 9) { c.fillRect(x, 19, 4, 4); c.fillRect(x, 91, 4, 4); }
      line(c, [8, 106, 92, 106]);
      c.fillRect(70, 34, 14, 2.4);
    } else {
      poly(c, [43, 44, 43, 70, 63, 57]);
      c.save(); c.lineWidth = 3.2; line(c, [8, 106, 47, 106]); c.restore(); circle(c, 47, 106, 3);
      circle(c, 16, 36, 3);
    }
  },
  // Pipeline board (three stages) over a funnel; accent = the card moving between stages + funnel tip.
  crm: (c, l) => {
    if (!l) {
      for (const x of [8, 38, 68]) c.fillRect(x, 12, 24, 4);
      for (const [x, y] of [[8, 22], [8, 40], [8, 58], [38, 22], [38, 40], [68, 22]]) { rr(c, x, y, 24, 14, 2); c.stroke(); c.fillRect(x + 4, y + 5, 14, 2.2); c.fillRect(x + 4, y + 9, 9, 1.8); }
      c.fillRect(20, 82, 60, 5); c.fillRect(28, 91, 44, 5); c.fillRect(36, 100, 28, 5);
    } else {
      rr(c, 38, 58, 24, 14, 2); c.fill();
      c.fillRect(43, 109, 14, 5);
    }
  },
  // Conversation: user, assistant (with spark), user; accent = typing indicator and the spark.
  ai: (c, l) => {
    if (!l) {
      rr(c, 8, 14, 50, 18, 6); c.stroke(); c.fillRect(14, 21.5, 34, 2.6); poly(c, [14, 32, 14, 38, 21, 32]);
      rr(c, 34, 42, 58, 28, 6); c.stroke(); c.fillRect(41, 50, 42, 2.6); c.fillRect(41, 56, 32, 2.6); c.fillRect(41, 62, 22, 2.6);
      rr(c, 8, 78, 40, 14, 6); c.stroke(); c.fillRect(14, 84, 24, 2.6);
    } else {
      rr(c, 50, 95, 36, 17, 8.5); c.stroke();
      circle(c, 59.5, 103.5, 2.9); circle(c, 68, 103.5, 2.9); circle(c, 76.5, 103.5, 2.9);
      poly(c, [27, 46, 29, 53, 36, 55, 29, 57, 27, 64, 25, 57, 18, 55, 25, 53]);
    }
  },
};

const MOTION: Record<MatrixVisual, Motion> = {
  web: (t, ux) => ux > 38 ? [Math.sin(t * 1.3) * 3, Math.cos(t * 1.05) * 2.2, 1] : [0, 0, .75 + .25 * Math.sin(t * 2.4)],
  social: (t, ux, uy) => {
    if (near(ux, uy, 76, 11, 7)) return [0, 0, Math.sin(t * 3) > -.2 ? 1 : .2];
    // Floating hearts drift up together and fade, then start over.
    if (ux > 80) { const k = (t * .35 + (uy < 44 ? .5 : 0)) % 1; return [Math.sin(t * 1.6) * 1.5, -k * 12, Math.min(1, (1 - k) * 2.2)]; }
    const beat = Math.max(0, Math.sin(t * 3.2)) ** 6 * .22;
    return [(ux - 35) * beat, (uy - 69.5) * beat, 1];
  },
  seo: (t, ux) => [0, 0, .45 + .55 * Math.max(0, Math.sin(ux * .12 - t * 3.2))],
  video: (t, ux, uy) => {
    if (near(ux, uy, 16, 36, 4)) return [0, 0, Math.sin(t * 4) > 0 ? 1 : .15];
    if (uy > 100) return [0, 0, .7 + .3 * Math.sin(t * 2)];
    const p = 1 + .07 * Math.sin(t * 2.2);
    return [(ux - 50) * (p - 1), (uy - 57) * (p - 1), 1];
  },
  // The lead card slides from stage two into the empty slot of stage three and back.
  crm: (t, ux, uy) => uy > 90 ? [0, 0, .7 + .3 * Math.sin(t * 2.5)] : [30 * (.5 + .5 * Math.sin(t * .8 - Math.PI / 2)), 0, 1],
  ai: (t, ux, uy) => Math.abs(uy - 103.5) < 3.6 && ux > 55 && ux < 81 ? [0, -2.4 * Math.max(0, Math.sin(t * 5 - Math.round((ux - 59.5) / 8.5) * 1.1)), 1] : uy < 70 ? [0, 0, .55 + .45 * Math.sin(t * 2.6)] : [0, 0, 1],
};

export function createServiceMatrix(canvas: HTMLCanvasElement, slides: { visual: MatrixVisual; accent: string }[]) {
  const ctx = canvas.getContext("2d")!;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0, H = 0, dpr = 1, gap = 7, size = 4.6, unit = 1, ox = 0, oy = 0, cols = 0, rows = 0;
  let targets: { x: Float32Array; y: Float32Array; accent: Uint8Array }[] = [];
  let N = 0, x = new Float32Array(0), y = x, vx = x, vy = x, tx = x, ty = x, ta = x, release = x, alpha = x, acc = new Uint8Array(0), ux = x, uy = x;
  let active = 0, from = 0, swapAt = 0, raf = 0, visible = false, grid: HTMLCanvasElement | null = null;
  const color = [0, 0, 0];
  const p = { x: -1e4, y: -1e4 };

  const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const sample = () => {
    W = canvas.clientWidth; H = canvas.clientHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    if (!W || !H) return;
    canvas.width = W * dpr; canvas.height = H * dpr;
    gap = Math.max(5, Math.round(W / 74)); size = gap * .62;
    cols = Math.floor(W / gap); rows = Math.floor(H / gap);
    unit = Math.min(W / 100, H / 120) * .92; ox = (W - unit * 100) / 2; oy = (H - unit * 120) / 2;
    const off = document.createElement("canvas"); off.width = W; off.height = H;
    const o = off.getContext("2d", { willReadFrequently: true })!;
    targets = slides.map(({ visual }) => {
      const read = (layer: 0 | 1) => {
        o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H);
        o.setTransform(unit, 0, 0, unit, ox, oy); o.fillStyle = o.strokeStyle = "#000"; o.lineWidth = 2; o.lineJoin = o.lineCap = "round";
        DRAW[visual](o, layer);
        return o.getImageData(0, 0, W, H).data;
      };
      const base = read(0), top = read(1), px: number[] = [], py: number[] = [], pa: number[] = [];
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
        const cx = (q + .5) * gap + (W - cols * gap) / 2, cy = (r + .5) * gap + (H - rows * gap) / 2, k = (Math.floor(cy) * W + Math.floor(cx)) * 4 + 3;
        if (top[k] > 110) { px.push(cx); py.push(cy); pa.push(1); } else if (base[k] > 110) { px.push(cx); py.push(cy); pa.push(0); }
      }
      return { x: Float32Array.from(px), y: Float32Array.from(py), accent: Uint8Array.from(pa) };
    });
    N = Math.max(...targets.map(t => t.x.length));
    x = new Float32Array(N); y = new Float32Array(N); vx = new Float32Array(N); vy = new Float32Array(N);
    tx = new Float32Array(N); ty = new Float32Array(N); ta = new Float32Array(N); release = new Float32Array(N); acc = new Uint8Array(N);
    ux = new Float32Array(N); uy = new Float32Array(N); alpha = new Float32Array(N);
    // Static LED field behind the drawing.
    grid = document.createElement("canvas"); grid.width = W * dpr; grid.height = H * dpr;
    const g = grid.getContext("2d")!; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = "#1b1b1d";
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) g.fillRect((q + .5) * gap + (W - cols * gap) / 2 - size / 2, (r + .5) * gap + (H - rows * gap) / 2 - size / 2, size, size);
    assign(active, true);
  };

  /** Points every dot at slide i; spare dots dissolve where they are. */
  const assign = (i: number, jump: boolean) => {
    const t = targets[i]; if (!t) return;
    const n = t.x.length, now = performance.now();
    for (let k = 0; k < N; k++) {
      if (k < n) { tx[k] = t.x[k]; ty[k] = t.y[k]; ta[k] = 1; acc[k] = t.accent[k]; }
      else { tx[k] = x[k]; ty[k] = y[k] + gap * 3; ta[k] = 0; }
      ux[k] = (tx[k] - ox) / unit; uy[k] = (ty[k] - oy) / unit;
      release[k] = now + (jump || still ? 0 : (tx[k] / W) * 380);
      if (jump || still) { x[k] = tx[k]; y[k] = ty[k]; vx[k] = vy[k] = 0; }
    }
  };

  const frame = () => {
    raf = 0;
    if (!W || !grid) return;
    const now = performance.now(), t = now / 1000;
    const s = slides[active], v = MOTION[s.visual];
    const mix = Math.min(1, (now - swapAt) / 500), a = rgb(slides[from].accent), b = rgb(s.accent);
    for (let i = 0; i < 3; i++) color[i] = Math.round(a[i] + (b[i] - a[i]) * mix);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(grid, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const reach = Math.max(40, W * .1), reach2 = reach * reach;
    for (const layer of [0, 1]) {
      ctx.fillStyle = layer ? `rgb(${color[0]},${color[1]},${color[2]})` : "#ecebe6";
      for (let k = 0; k < N; k++) {
        if (acc[k] !== layer) continue;
        let gx = tx[k], gy = ty[k], al = ta[k];
        if (layer && !still) { const [dx, dy, m] = v(t, ux[k], uy[k]); gx += dx * unit; gy += dy * unit; al *= m; }
        if (!still && now >= release[k]) {
          let fx = (gx - x[k]) * .075, fy = (gy - y[k]) * .075;
          const dx = x[k] - p.x, dy = y[k] - p.y, d2 = dx * dx + dy * dy;
          if (d2 < reach2) { const f = (1 - d2 / reach2) * 2.4 / Math.sqrt(d2 + 1); fx += dx * f; fy += dy * f; }
          vx[k] = (vx[k] + fx) * .8; vy[k] = (vy[k] + fy) * .8; x[k] += vx[k]; y[k] += vy[k];
        } else if (still) { x[k] = gx; y[k] = gy; }
        alpha[k] += (al - alpha[k]) * (still ? 1 : .12); // dots fade in on first paint and out when spare
        const o = alpha[k];
        if (o < .03) continue;
        ctx.globalAlpha = o;
        ctx.fillRect(x[k] - size / 2, y[k] - size / 2, size, size);
      }
    }
    ctx.globalAlpha = 1;
    if (visible && !still) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  const move = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); p.x = e.clientX - r.left; p.y = e.clientY - r.top; };
  const leave = () => { p.x = p.y = -1e4; };
  canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerleave", leave);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); });
  io.observe(canvas);
  const ro = new ResizeObserver(() => { sample(); kick(); });
  ro.observe(canvas);

  return {
    show(i: number) {
      if (i === active || !targets[i]) return;
      from = active; active = i; swapAt = performance.now();
      assign(i, false); kick();
    },
    destroy() {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerleave", leave);
    },
  };
}
