// Dot-matrix globe for the contact section, in the site's LED language, drawn on the white page: land in near
// black, ocean as a faint grey mesh, shaded by depth. On send a paper plane leaves the folded postcard, loops a
// tilted orbit around the globe (hidden while it passes behind), leaves a dotted ring, and lands on Tbilisi.
import { LAND } from "./landMask";

type Point = { x: number; y: number };
const TILT = 25 * Math.PI / 180;
const ORBIT_TILT = -14 * Math.PI / 180;
const rad = (d: number) => d * Math.PI / 180;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

let mask: Uint8Array | null = null;
const land = (lat: number, lon: number) => {
  mask ??= Uint8Array.from(atob(LAND), c => c.charCodeAt(0));
  const row = Math.min(179, Math.max(0, Math.floor(90 - lat))), col = ((Math.floor(lon + 180) % 360) + 360) % 360, k = row * 360 + col;
  return (mask[k >> 3] >> (k & 7)) & 1;
};

export function createGlobe(canvas: HTMLCanvasElement, opts: { accent: string; target: { lat: number; lon: number } }) {
  const ctx = canvas.getContext("2d")!;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Fibonacci sphere: even spacing; land points kept, ocean thinned to a faint mesh.
  const pts: number[] = [];
  const N = 9000, golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
    const x = Math.cos(th) * r, z = Math.sin(th) * r;
    const isLand = land(Math.asin(y) * 180 / Math.PI, Math.atan2(x, z) * 180 / Math.PI);
    if (isLand || i % 3 === 0) pts.push(x, y, z, isLand);
  }
  const P = Float32Array.from(pts);
  const T = (() => { const la = rad(opts.target.lat), lo = rad(opts.target.lon); return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)]; })();

  let W = 0, H = 0, dpr = 1, R = 0, cx = 0, cy = 0, raf = 0, visible = false;
  let spin = -rad(opts.target.lon) + 1.1, last = performance.now(), pinAt = 0;
  let turn: { from: number; to: number; t0: number; ms: number } | null = null;
  let flight: { from: Point; a0: number; t0: number; ms: number; done: (p: Point) => void } | null = null;
  const trail: { x: number; y: number; front: boolean; t: number }[] = [];
  let plane: { x: number; y: number; ang: number; s: number; front: boolean } | null = null;

  const project = (x: number, y: number, z: number) => {
    const c = Math.cos(spin), s = Math.sin(spin);
    const x1 = x * c + z * s, z1 = -x * s + z * c;
    const y2 = y * Math.cos(TILT) - z1 * Math.sin(TILT), z2 = y * Math.sin(TILT) + z1 * Math.cos(TILT);
    return { x: cx + x1 * R, y: cy - y2 * R, z: z2 };
  };
  /** A point on the tilted orbit; `front` when it passes in front of the globe. */
  const orbit = (a: number) => {
    const ex = Math.cos(a) * R * 1.42, ey = Math.sin(a) * R * .34;
    return { x: cx + ex * Math.cos(ORBIT_TILT) - ey * Math.sin(ORBIT_TILT), y: cy + ex * Math.sin(ORBIT_TILT) + ey * Math.cos(ORBIT_TILT), front: Math.sin(a) > 0 };
  };

  const size = () => {
    W = canvas.clientWidth; H = canvas.clientHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    R = Math.min(W * .3, H * .34); cx = W / 2; cy = H * .44;
    kick();
  };

  const drawTrail = (now: number, front: boolean) => {
    ctx.fillStyle = opts.accent;
    for (let i = 0; i < trail.length; i++) {
      const d = trail[i]; if (d.front !== front) continue;
      const age = (now - d.t) / 2600; if (age >= 1) continue;
      ctx.globalAlpha = (1 - age) * (front ? 1 : .35); const s = 2.2 + 2 * (1 - age);
      ctx.fillRect(d.x - s / 2, d.y - s / 2, s, s);
    }
  };
  const drawPlane = () => {
    if (!plane) return;
    ctx.save(); ctx.translate(plane.x, plane.y); ctx.rotate(plane.ang); ctx.scale(plane.s, plane.s);
    ctx.globalAlpha = plane.front ? 1 : .25; ctx.fillStyle = "#111";
    ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-9, -8); ctx.lineTo(-4, 0); ctx.lineTo(-9, 8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-4, 0); ctx.stroke();
    ctx.restore();
  };

  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (turn) { const k = Math.min(1, (now - turn.t0) / turn.ms); spin = turn.from + (turn.to - turn.from) * easeInOut(k); if (k >= 1) turn = null; }
    else if (!still && !pinAt && !flight) spin += dt * .12;
    const tp = project(T[0], T[1], T[2]);
    // Flight: from the postcard onto the orbit, 1¼ loops, then down onto the city.
    if (flight) {
      const k = Math.min(1, Math.max(0, (now - flight.t0) / flight.ms));
      const a = flight.a0 + easeInOut(k) * Math.PI * 2.5, o = orbit(a);
      let x = o.x, y = o.y, front = o.front;
      if (k < .12) { const m = ease(k / .12); x = flight.from.x + (o.x - flight.from.x) * m; y = flight.from.y + (o.y - flight.from.y) * m; front = true; }
      if (k > .8) { const m = easeInOut((k - .8) / .2); x = o.x + (tp.x - o.x) * m; y = o.y + (tp.y - o.y) * m; front = front || m > .3; }
      const prev = plane ?? { x: x - 1, y };
      plane = { x, y, ang: Math.atan2(y - prev.y, x - prev.x), s: 1 - .4 * Math.max(0, (k - .8) / .2), front };
      trail.push({ x, y, front, t: now });
      if (k >= 1) { const f = flight; flight = null; plane = null; pinAt = now; f.done({ x: tp.x, y: tp.y }); }
    }
    while (trail.length && now - trail[0].t > 2600) trail.shift();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    drawTrail(now, false);
    if (plane && !plane.front) drawPlane();
    // Globe.
    const dot = Math.max(1.6, R / 72);
    for (let i = 0; i < P.length; i += 4) {
      const p = project(P[i], P[i + 1], P[i + 2]);
      if (p.z <= 0) continue;
      const isLand = P[i + 3] === 1;
      ctx.globalAlpha = isLand ? .25 + .75 * p.z : .16 + .22 * p.z;
      ctx.fillStyle = isLand ? "#141414" : "#a9a9a4";
      const s = dot * (.65 + .35 * p.z);
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    // Tbilisi: a small accent mark while it faces us; a pin with a pulsing ring after landing.
    if (tp.z > 0) {
      ctx.fillStyle = opts.accent;
      if (pinAt) {
        const k = Math.min(1, (now - pinAt) / 420), pulse = ((now - pinAt) % 1600) / 1600;
        ctx.globalAlpha = (1 - pulse) * .8; ctx.strokeStyle = opts.accent; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(tp.x, tp.y, 5 + pulse * 22, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1; const s = 9 * (k < 1 ? ease(k) * 1.15 : 1);
        ctx.fillRect(tp.x - s / 2, tp.y - s / 2, s, s);
      } else { ctx.globalAlpha = .5 + .5 * tp.z; ctx.fillRect(tp.x - 2.5, tp.y - 2.5, 5, 5); }
    }
    drawTrail(now, true);
    if (plane && plane.front) drawPlane();
    ctx.globalAlpha = 1;
    if (visible && (!still || turn || flight)) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const ro = new ResizeObserver(size); ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }); io.observe(canvas);

  return {
    /** Turns Tbilisi to the front while the plane flies its loop from `from` (canvas coordinates). */
    send(from: Point): Promise<Point> {
      const goal = -rad(opts.target.lon), now = performance.now();
      const to = spin + (((goal - spin) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
      if (still) { spin = to; pinAt = now; kick(); const p = project(T[0], T[1], T[2]); return Promise.resolve({ x: p.x, y: p.y }); }
      turn = { from: spin, to, t0: now, ms: 2600 };
      trail.length = 0; plane = null;
      return new Promise(done => { flight = { from, a0: Math.PI * .5, t0: now, ms: 3600, done }; kick(); });
    },
    reset() { pinAt = 0; trail.length = 0; kick(); },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); },
  };
}
