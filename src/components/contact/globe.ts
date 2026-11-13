// Dot-matrix globe for the contact card, in the site's LED language: land in warm white, ocean barely there,
// shaded by depth. It turns slowly; on send it brings Tbilisi to the front, a paper plane flies from the
// postcard around the limb leaving a dotted trail, and a pin pops where it lands.
import { LAND } from "./landMask";

type Point = { x: number; y: number };
const TILT = 25 * Math.PI / 180;
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
    const lat = Math.asin(y) * 180 / Math.PI, lon = Math.atan2(x, z) * 180 / Math.PI;
    const isLand = land(lat, lon);
    if (isLand || i % 3 === 0) pts.push(x, y, z, isLand);
  }
  const P = Float32Array.from(pts);
  const T = (() => { const la = rad(opts.target.lat), lo = rad(opts.target.lon); return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)]; })();

  let W = 0, H = 0, dpr = 1, R = 0, cx = 0, cy = 0, raf = 0, visible = false;
  let spin = -rad(opts.target.lon) + 1.1, last = performance.now();
  let turn: { from: number; to: number; t0: number; ms: number } | null = null;
  let flight: { a: Point; b: Point; c: Point; d: Point; t0: number; ms: number; done: (p: Point) => void } | null = null;
  const trail: { x: number; y: number; t: number }[] = [];
  let plane: { x: number; y: number; ang: number; s: number } | null = null;
  let pinAt = 0;

  const project = (x: number, y: number, z: number) => {
    const c = Math.cos(spin), s = Math.sin(spin);
    const x1 = x * c + z * s, z1 = -x * s + z * c;
    const y2 = y * Math.cos(TILT) - z1 * Math.sin(TILT), z2 = y * Math.sin(TILT) + z1 * Math.cos(TILT);
    return { x: cx + x1 * R, y: cy - y2 * R, z: z2 };
  };
  const targetPoint = () => { const p = project(T[0], T[1], T[2]); return { x: p.x, y: p.y, z: p.z }; };
  const bez = (f: NonNullable<typeof flight>, t: number) => {
    const u = 1 - t;
    return {
      x: u * u * u * f.a.x + 3 * u * u * t * f.b.x + 3 * u * t * t * f.c.x + t * t * t * f.d.x,
      y: u * u * u * f.a.y + 3 * u * u * t * f.b.y + 3 * u * t * t * f.c.y + t * t * t * f.d.y,
    };
  };

  const size = () => {
    W = canvas.clientWidth; H = canvas.clientHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    R = Math.min(W * .4, H * .3); cx = W / 2; cy = H * .34;
    kick();
  };

  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (turn) { const k = Math.min(1, (now - turn.t0) / turn.ms); spin = turn.from + (turn.to - turn.from) * easeInOut(k); if (k >= 1) turn = null; }
    else if (!still && !pinAt) spin += dt * .12;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    // Globe.
    const dot = Math.max(1.6, R / 70);
    for (let i = 0; i < P.length; i += 4) {
      const p = project(P[i], P[i + 1], P[i + 2]);
      if (p.z <= 0) continue;
      const isLand = P[i + 3] === 1;
      ctx.globalAlpha = isLand ? .28 + .72 * p.z : .07 + .1 * p.z;
      ctx.fillStyle = isLand ? "#ecebe6" : "#8b8b90";
      const s = dot * (.65 + .35 * p.z);
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    // Tbilisi: a small accent mark while it faces us; a pin with a pulsing ring after landing.
    const tp = targetPoint();
    if (tp.z > 0) {
      ctx.fillStyle = opts.accent;
      if (pinAt) {
        const k = Math.min(1, (now - pinAt) / 420), pulse = ((now - pinAt) % 1600) / 1600;
        ctx.globalAlpha = (1 - pulse) * .7; ctx.strokeStyle = opts.accent; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(tp.x, tp.y, 5 + pulse * 22, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1; const s = 9 * (k < 1 ? ease(k) * 1.15 : 1);
        ctx.fillRect(tp.x - s / 2, tp.y - s / 2, s, s);
      } else { ctx.globalAlpha = .55 + .45 * tp.z; ctx.fillRect(tp.x - 2.5, tp.y - 2.5, 5, 5); }
    }
    // Flight.
    if (flight) {
      const k = Math.min(1, Math.max(0, (now - flight.t0) / flight.ms)), e = easeInOut(k);
      flight.d = { x: tp.x, y: tp.y };
      const p = bez(flight, e), q = bez(flight, Math.min(1, e + .01));
      plane = { x: p.x, y: p.y, ang: Math.atan2(q.y - p.y, q.x - p.x), s: 1 - .45 * e };
      trail.push({ x: p.x, y: p.y, t: now });
      if (k >= 1) { const f = flight; flight = null; plane = null; pinAt = now; f.done({ x: tp.x, y: tp.y }); }
    }
    // Dotted trail: squares laid along the path, fading with age.
    ctx.fillStyle = opts.accent;
    for (let i = trail.length - 1; i >= 0; i--) {
      const age = (now - trail[i].t) / 1700;
      if (age >= 1) { trail.splice(0, i + 1); break; }
      if (i % 2) continue;
      ctx.globalAlpha = (1 - age) * .95; const ts = 2 + 2.2 * (1 - age); ctx.fillRect(trail[i].x - ts / 2, trail[i].y - ts / 2, ts, ts);
    }
    if (plane) {
      ctx.save(); ctx.translate(plane.x, plane.y); ctx.rotate(plane.ang); ctx.scale(plane.s, plane.s);
      ctx.globalAlpha = 1; ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-9, -8); ctx.lineTo(-4, 0); ctx.lineTo(-9, 8); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#9a9aa0"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-4, 0); ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (visible && (!still || turn || flight)) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const ro = new ResizeObserver(size); ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }); io.observe(canvas);

  return {
    /** Turns Tbilisi to the front, then flies the plane there from `from` (canvas coordinates). */
    send(from: Point): Promise<Point> {
      const goal = -rad(opts.target.lon), now = performance.now();
      const to = spin + (((goal - spin) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
      if (still) { spin = to; pinAt = now; kick(); return Promise.resolve(targetPoint()); }
      turn = { from: spin, to, t0: now, ms: 1500 };
      return new Promise(done => {
        // Out to the right of the globe, over its shoulder, down onto the city.
        flight = { a: from, b: { x: cx + R * 1.5, y: from.y - R * .1 }, c: { x: cx + R * 1.15, y: cy - R * 1.45 }, d: from, t0: now + 150, ms: 2300, done };
        kick();
      });
    },
    /** Where the pin is now, for the label. */
    pin: () => targetPoint(),
    reset() { pinAt = 0; trail.length = 0; kick(); },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); },
  };
}
