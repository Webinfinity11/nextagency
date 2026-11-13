// The contact animation on one canvas: a dot-matrix globe (site LED language) with a paper postcard in front of it.
// Send rises the card, folds it into a paper plane in real 3D (corners to the centre, edges to the centre again,
// mountain fold, wings), turns it into the flight direction, loops it round a tilted orbit with thin trail lines
// (hidden while behind the globe) and lands it on Tbilisi with a pin. The paper is a mesh cut along each crease;
// faces carry the postcard texture by affine-mapped triangles; back faces are plain paper, shaded by the light.
import { LAND } from "./landMask";

type V2 = { x: number; y: number };
type V3 = [number, number, number];
type Vert = { x: number; y: number; u: number; v: number };
type Poly = { pts: Vert[]; layer: number };
type Crease = { p: V2; q: V2; flap: V2 };

const TILT = 25 * Math.PI / 180, ORBIT_TILT = -12 * Math.PI / 180;
const PW = 1, PH = 1.32;                       // paper size in paper units
const D = .17;                                 // wing line distance from the centre
const rad = (d: number) => d * Math.PI / 180;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const seg = (now: number, a: number, b: number) => clamp01((now - a) / (b - a));

let mask: Uint8Array | null = null;
const land = (lat: number, lon: number) => {
  mask ??= Uint8Array.from(atob(LAND), c => c.charCodeAt(0));
  const row = Math.min(179, Math.max(0, Math.floor(90 - lat))), col = ((Math.floor(lon + 180) % 360) + 360) % 360, k = row * 360 + col;
  return (mask[k >> 3] >> (k & 7)) & 1;
};

// ---- paper folding (flat state + one animated crease batch at a time) ----
const side = (c: Crease, x: number, y: number) => Math.sign((c.q.x - c.p.x) * (y - c.p.y) - (c.q.y - c.p.y) * (x - c.p.x));
function split(poly: Poly, c: Crease): Poly[] {
  const inA: Vert[] = [], inB: Vert[] = [], n = poly.pts.length;
  const s = poly.pts.map(p => (c.q.x - c.p.x) * (p.y - c.p.y) - (c.q.y - c.p.y) * (p.x - c.p.x));
  for (let i = 0; i < n; i++) {
    const a = poly.pts[i], b = poly.pts[(i + 1) % n], sa = s[i], sb = s[(i + 1) % n];
    if (sa >= 0) inA.push(a); if (sa <= 0) inB.push(a);
    if ((sa > 0 && sb < 0) || (sa < 0 && sb > 0)) {
      const t = sa / (sa - sb), m = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, u: a.u + (b.u - a.u) * t, v: a.v + (b.v - a.v) * t };
      inA.push(m); inB.push({ ...m });
    }
  }
  return [inA, inB].filter(p => p.length >= 3).map(pts => ({ pts, layer: poly.layer }));
}
const reflect = (c: Crease, x: number, y: number): V2 => {
  const dx = c.q.x - c.p.x, dy = c.q.y - c.p.y, l = dx * dx + dy * dy, t = ((x - c.p.x) * dx + (y - c.p.y) * dy) / l;
  const fx = c.p.x + dx * t, fy = c.p.y + dy * t;
  return { x: 2 * fx - x, y: 2 * fy - y };
};
const rotAbout = (pt: V3, c: Crease, ang: number): V3 => {
  // Rodrigues about the crease line (in the z = 0 plane).
  let kx = c.q.x - c.p.x, ky = c.q.y - c.p.y; const l = Math.hypot(kx, ky); kx /= l; ky /= l;
  const vx = pt[0] - c.p.x, vy = pt[1] - c.p.y, vz = pt[2], co = Math.cos(ang), si = Math.sin(ang), dot = kx * vx + ky * vy;
  return [c.p.x + vx * co + (ky * vz) * si + kx * dot * (1 - co), c.p.y + vy * co + (-kx * vz) * si + ky * dot * (1 - co), vz * co + (kx * vy - ky * vx) * si];
};
const B: V2 = { x: .5, y: 0 };
const bis = .5 / Math.tan(rad(22.5));        // where the second crease meets the side edge
const STEPS: Crease[][] = [
  [{ p: B, q: { x: 0, y: .5 }, flap: { x: .02, y: .02 } }, { p: { x: 1, y: .5 }, q: B, flap: { x: .98, y: .02 } }],
  [{ p: B, q: { x: 0, y: bis }, flap: { x: .01, y: .6 } }, { p: { x: 1, y: bis }, q: B, flap: { x: .99, y: .6 } }],
];
function freshPaper(): Poly[] { return [{ pts: [{ x: 0, y: 0, u: 0, v: 0 }, { x: PW, y: 0, u: PW, v: 0 }, { x: PW, y: PH, u: PW, v: PH }, { x: 0, y: PH, u: 0, v: PH }], layer: 0 }]; }
/** Cuts every polygon along a step's creases; returns polygons tagged with the crease index they move with (-1 = still). */
function cut(polys: Poly[], step: Crease[]) {
  let out = polys.map(p => ({ ...p, crease: -1 }));
  step.forEach((c, ci) => {
    const fs = side(c, c.flap.x, c.flap.y), next: typeof out = [];
    for (const p of out) for (const q of split(p, c)) {
      const cx = q.pts.reduce((s, v) => s + v.x, 0) / q.pts.length, cy = q.pts.reduce((s, v) => s + v.y, 0) / q.pts.length;
      next.push({ ...q, crease: p.crease === -1 && side(c, cx, cy) === fs ? ci : p.crease });
    }
    out = next;
  });
  return out;
}
function flatten(polys: ReturnType<typeof cut>, step: Crease[]): Poly[] {
  const top = Math.max(...polys.map(p => p.layer));
  return polys.map(p => p.crease < 0 ? { pts: p.pts, layer: p.layer } : { pts: p.pts.map(v => ({ ...v, ...reflect(step[p.crease], v.x, v.y) })), layer: top + 1 + (top - p.layer) });
}

// ---- postcard texture ----
const KA_MONTHS = ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"];
function drawCard(tex: HTMLCanvasElement, opts: { text: string; placeholder: string; locale: string; accent: string; airmail: string; caret: boolean }) {
  const g = tex.getContext("2d")!, S = tex.width / PW; // pixels per paper unit
  const family = getComputedStyle(document.body).fontFamily || "sans-serif"; // the site stack (Manrope + Noto Sans Georgian)
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, tex.width, tex.height);
  g.fillStyle = "#fbfaf6"; g.fillRect(0, 0, tex.width, tex.height);
  g.setTransform(S / 100, 0, 0, S / 100, 0, 0); // draw in a 100 × 132 box
  g.strokeStyle = "#d6d2c7"; g.lineWidth = .5; g.setLineDash([2, 1.6]); g.strokeRect(4, 4, 92, 124); g.setLineDash([]);
  const d = new Date();
  g.fillStyle = "#8a877f"; g.font = `500 3.6px ${family}`;
  g.fillText(opts.locale === "ka" ? `${d.getDate()} ${KA_MONTHS[d.getMonth()]}, ${d.getFullYear()}` : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }).toUpperCase(), 10, 14);
  // Stamp with a serrated edge, a plane glyph and AIR MAIL.
  g.fillStyle = "#fff"; g.fillRect(72, 8, 20, 24);
  g.fillStyle = "#111"; g.fillRect(74, 10, 16, 20); // black stamp, white brand N
  g.strokeStyle = "#fff"; g.lineWidth = .9; g.setLineDash([1, 1]); g.strokeRect(72.5, 8.5, 19, 23); g.setLineDash([]);
  // The brand N (the three pieces of the logo mark, viewBox 0 2.7 123 129.8).
  g.save(); g.translate(76.2, 11.2); g.scale(.0945, .0945); g.translate(0, -2.7); g.fillStyle = "#fff";
  for (const pts of [[0, 2.7, 29.9, 2.7, 123, 114.1, 123, 132.5, 93.1, 132.5, 0, 21.1], [87.6, 2.7, 123, 2.7, 123, 40.2], [0, 94.9, 35.6, 132.5, 0, 132.5]]) {
    g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill();
  }
  g.restore();
  g.fillStyle = "#fff"; g.font = `700 2.2px ${family}`; g.textAlign = "center"; g.fillText(opts.airmail, 82, 28.2); g.textAlign = "left";
  // Postmark: ring plus wavy cancellation lines running into the stamp.
  g.strokeStyle = "rgba(60,58,52,.35)"; g.lineWidth = .5;
  g.beginPath(); g.arc(70, 22, 7, 0, Math.PI * 2); g.stroke();
  for (let k = 0; k < 4; k++) { g.beginPath(); for (let x = 48; x <= 76; x += 1) { const y = 16 + k * 3.2 + Math.sin(x * .7) * .7; if (x === 48) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke(); }
  // Message, wrapped.
  const empty = !opts.text.trim();
  g.fillStyle = empty ? "#a29e94" : "#1b1b1b"; g.font = `500 6px ${family}`;
  const words = (empty ? opts.placeholder : opts.text).replace(/\r/g, "").split(/(\s+)/), lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (w.includes("\n")) { for (let i = 0; i < (w.match(/\n/g) || []).length; i++) { lines.push(line); line = ""; } continue; }
    const tryLine = line + w;
    if (g.measureText(tryLine).width > 80 && line.trim()) { lines.push(line.trimEnd()); line = w.trimStart(); } else line = tryLine;
  }
  lines.push(line);
  const shown = lines.slice(0, 11);
  shown.forEach((l, i) => g.fillText(l, 10, 44 + i * 8.2));
  if (opts.caret) { const last = shown[shown.length - 1] ?? "", x = 10 + (empty ? 0 : g.measureText(last).width) + .6, y = 44 + (shown.length - 1) * 8.2; g.fillStyle = opts.accent; g.fillRect(x, y - 5.4, .6, 6.6); }
}

// ---- scene ----
export function createContactScene(canvas: HTMLCanvasElement, opts: { accent: string; target: { lat: number; lon: number }; locale: string; placeholder: string; airmail: string }) {
  const ctx = canvas.getContext("2d")!;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Globe points (Fibonacci sphere; land kept, ocean thinned).
  const pts: number[] = [], N = 9000, golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i, x = Math.cos(th) * r, z = Math.sin(th) * r;
    const isLand = land(Math.asin(y) * 180 / Math.PI, Math.atan2(x, z) * 180 / Math.PI);
    if (isLand || i % 3 === 0) pts.push(x, y, z, isLand);
  }
  const P = Float32Array.from(pts);
  const T: V3 = (() => { const la = rad(opts.target.lat), lo = rad(opts.target.lon); return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)]; })();

  let W = 0, H = 0, dpr = 1, R = 0, gx = 0, gy = 0, cardX = 0, cardY = 0, cardS = 0, raf = 0, visible = false;
  let spin = -rad(opts.target.lon) + 1.1, last = performance.now(), pinAt = 0, text = "", dirty = true, focused = false;
  let turn: { from: number; to: number; t0: number; ms: number } | null = null;
  type Body = { pts: Vert[]; layer: number; left: boolean; wing: boolean };
  let send: { t0: number; done: (p: V2) => void; paper: [Poly[], ReturnType<typeof cut>, Poly[], ReturnType<typeof cut>, Body[]]; entry: V2 } | null = null;
  let appearAt = 0;
  const trail: { x: number; y: number; front: boolean; t: number }[] = [];
  const tex = document.createElement("canvas");

  const project = (x: number, y: number, z: number) => {
    const c = Math.cos(spin), s = Math.sin(spin), x1 = x * c + z * s, z1 = -x * s + z * c;
    return { x: gx + x1 * R, y: gy - (y * Math.cos(TILT) - z1 * Math.sin(TILT)) * R, z: y * Math.sin(TILT) + z1 * Math.cos(TILT) };
  };
  const orbit = (a: number) => {
    const ex = Math.cos(a) * R * 1.48, ey = Math.sin(a) * R * .3;
    return { x: gx + ex * Math.cos(ORBIT_TILT) - ey * Math.sin(ORBIT_TILT), y: gy + ex * Math.sin(ORBIT_TILT) + ey * Math.cos(ORBIT_TILT), z: Math.sin(a) };
  };

  const size = () => {
    W = canvas.clientWidth; H = canvas.clientHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    R = Math.min(W, H) * .29; gx = W / 2; gy = H * .38;
    cardS = Math.min(W, H) * .4; cardX = W / 2; cardY = H * .64;
    tex.width = Math.round(cardS * dpr * 1.6); tex.height = Math.round(tex.width * PH / PW); dirty = true;
    kick();
  };

  // Paper vertex → world (X right, Y down, Z toward the viewer), blending the card pose into the flight pose.
  type Pose = { pos: V3; f: V3; u: V3; s: number };
  const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const toWorld = (p: V3, pose: Pose): V3 => {
    const r = cross(pose.f, pose.u), lx = p[0] - .5, ly = -(p[1] - .62), lz = -p[2];
    return [pose.pos[0] + pose.s * (lx * r[0] + ly * pose.f[0] + lz * pose.u[0]), pose.pos[1] + pose.s * (lx * r[1] + ly * pose.f[1] + lz * pose.u[1]), pose.pos[2] + pose.s * (lx * r[2] + ly * pose.f[2] + lz * pose.u[2])];
  };
  const F = 1400;
  const screen = (w: V3) => { const k = F / (F - w[2]); return { x: W / 2 + (w[0] - W / 2) * k, y: H / 2 + (w[1] - H / 2) * k, z: w[2] }; };

  const triangle = (s: { x: number; y: number }[], t: Vert[], img: HTMLCanvasElement | null, shade: number) => {
    const [a, b, c] = s, S = tex.width / PW;
    // Grow the clip a hair around the centroid so neighbouring triangles don't show seams.
    const mx = (a.x + b.x + c.x) / 3, my = (a.y + b.y + c.y) / 3, g = (p: { x: number; y: number }) => { const dx = p.x - mx, dy = p.y - my, l = Math.hypot(dx, dy) || 1; return { x: p.x + dx / l * .7, y: p.y + dy / l * .7 }; };
    const A = g(a), Bv = g(b), C = g(c);
    ctx.save(); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(Bv.x, Bv.y); ctx.lineTo(C.x, C.y); ctx.closePath(); ctx.clip();
    if (img) {
      const [u0, v0, u1, v1, u2, v2] = [t[0].u * S, t[0].v * S, t[1].u * S, t[1].v * S, t[2].u * S, t[2].v * S];
      const d = u0 * (v1 - v2) + u1 * (v2 - v0) + u2 * (v0 - v1);
      if (Math.abs(d) > 1e-6) {
        ctx.transform(
          (a.x * (v1 - v2) + b.x * (v2 - v0) + c.x * (v0 - v1)) / d, (a.y * (v1 - v2) + b.y * (v2 - v0) + c.y * (v0 - v1)) / d,
          (a.x * (u2 - u1) + b.x * (u0 - u2) + c.x * (u1 - u0)) / d, (a.y * (u2 - u1) + b.y * (u0 - u2) + c.y * (u1 - u0)) / d,
          (a.x * (u1 * v2 - u2 * v1) + b.x * (u2 * v0 - u0 * v2) + c.x * (u0 * v1 - u1 * v0)) / d, (a.y * (u1 * v2 - u2 * v1) + b.y * (u2 * v0 - u0 * v2) + c.y * (u0 * v1 - u1 * v0)) / d);
        ctx.drawImage(img, 0, 0);
      }
    } else { ctx.fillStyle = "#efede6"; ctx.fill(); }
    if (shade > .002) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = `rgba(20,20,24,${shade})`; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  };

  /** Draws the paper mesh: each polygon's 3D position from `place`, painter-sorted, textured front / plain back. */
  const drawPaper = (polys: { pts: Vert[]; layer: number }[], place: (v: Vert, layer: number, i: number) => V3, pose: Pose, alpha: number) => {
    const L = norm([-.22, -.38, .9]);
    const items = polys.map((p, i) => {
      const w = p.pts.map(v => toWorld(place(v, p.layer, i), pose)), s = w.map(screen);
      let area = 0; for (let k = 0; k < s.length; k++) { const a = s[k], b = s[(k + 1) % s.length]; area += a.x * b.y - b.x * a.y; }
      const n = norm(cross([w[1][0] - w[0][0], w[1][1] - w[0][1], w[1][2] - w[0][2]], [w[2][0] - w[0][0], w[2][1] - w[0][1], w[2][2] - w[0][2]]));
      const lit = Math.abs(n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
      return { p, s, z: w.reduce((t, q) => t + q[2], 0) / w.length + p.layer * .01, front: area > 0, shade: Math.max(0, .9 - lit) * .45 };
    }).sort((a, b) => a.z - b.z);
    ctx.globalAlpha = alpha;
    for (const it of items) {
      for (let k = 1; k < it.s.length - 1; k++) triangle([it.s[0], it.s[k], it.s[k + 1]], [it.p.pts[0], it.p.pts[k], it.p.pts[k + 1]], it.front ? tex : null, it.shade);
      // A hairline round each piece (outer edges and creases) so white paper still reads on the white page.
      ctx.strokeStyle = "rgba(20,20,24,.26)"; ctx.lineWidth = .7; ctx.lineJoin = "round";
      ctx.beginPath(); it.s.forEach((q, k) => k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  // Timeline (ms from send).
  // One lap ending on the near side, then a visible run in to the city.
  // The lap starts at the front, passes behind, and the plane peels off as soon as it comes back round on the
  // right; from there one curve, tangent to the orbit, takes it straight to the city.
  const TL = { rise: [0, 380], s1: [380, 900], s2: [900, 1420], s3: [1420, 1860], s4: [1680, 2120], orient: [2120, 2900], orbit: [2900, 5700], land: [5700, 7000] } as const;
  const A0 = Math.PI * .5, SWEEP = Math.PI * 1.5 + .3, A1 = A0 + SWEEP;
  const sweep = (k: number) => 1 - Math.cos(k * Math.PI / 2); // eases in, leaves the orbit at full speed

  const planePlace = (st: NonNullable<typeof send>, now: number) => {
    const t = now - st.t0;
    if (t < TL.s1[1]) return { polys: st.paper[1], place: (v: Vert, layer: number, i: number) => { const c = st.paper[1][i].crease; const base: V3 = [v.x, v.y, layer * .002]; return c < 0 ? base : rotAbout(base, STEPS[0][c], Math.PI * easeInOut(seg(now, st.t0 + TL.s1[0], st.t0 + TL.s1[1])) * side(STEPS[0][c], STEPS[0][c].flap.x, STEPS[0][c].flap.y)); } };
    if (t < TL.s2[1]) return { polys: st.paper[3], place: (v: Vert, layer: number, i: number) => { const c = st.paper[3][i].crease; const base: V3 = [v.x, v.y, layer * .002]; return c < 0 ? base : rotAbout(base, STEPS[1][c], Math.PI * easeInOut(seg(now, st.t0 + TL.s2[0], st.t0 + TL.s2[1])) * side(STEPS[1][c], STEPS[1][c].flap.x, STEPS[1][c].flap.y)); } };
    // Mountain fold along the centre, then wings out to level.
    const f3 = rad(82) * easeInOut(seg(now, st.t0 + TL.s3[0], st.t0 + TL.s3[1])), f4 = rad(82) * easeInOut(seg(now, st.t0 + TL.s4[0], st.t0 + TL.s4[1]));
    return { polys: st.paper[4], place: (v: Vert, layer: number, i: number): V3 => {
      const body = st.paper[4][i], sg = body.left ? -1 : 1;
      let x = v.x - .5, z = layer * .002;
      if (body.wing) { const wx = x - sg * D, b = -sg * f4; const nx = wx * Math.cos(b) + z * Math.sin(b), nz = -wx * Math.sin(b) + z * Math.cos(b); x = sg * D + nx; z = nz; }
      const a = sg * f3; const rx = x * Math.cos(a) + z * Math.sin(a), rz = -x * Math.sin(a) + z * Math.cos(a);
      return [.5 + rx, v.y, rz];
    } };
  };

  const posePlane = (st: NonNullable<typeof send>, now: number, tp: { x: number; y: number }): { pose: Pose; front: boolean; alpha: number } => {
    const t = now - st.t0, rise = ease(seg(now, st.t0 + TL.rise[0], st.t0 + TL.rise[1])) * cardS * .12;
    // While the last folds happen the plane tips its nose away and turns a little, so its 3D shape reads.
    const tip = easeInOut(seg(now, st.t0 + TL.s3[0], st.t0 + TL.s4[1])), pitch = rad(52) * tip, yaw = rad(-34) * tip;
    const tf: V3 = norm([Math.sin(yaw) * Math.cos(pitch), -Math.cos(yaw) * Math.cos(pitch), -Math.sin(pitch)]);
    const tu = (() => { const w: V3 = [0, 0, -1], d = w[0] * tf[0] + w[1] * tf[1] + w[2] * tf[2]; return norm([w[0] - tf[0] * d, w[1] - tf[1] * d, w[2] - tf[2] * d]); })();
    const card: Pose = { pos: [cardX, cardY - rise - tip * cardS * .1, 0], f: tf, u: tu, s: cardS };
    if (t < TL.orient[0]) return { pose: card, front: true, alpha: 1 };
    const heading = (a: V2, b: V2): V3 => norm([b.x - a.x, b.y - a.y, -.15]);
    const flightUp = (f: V3): V3 => { const want = norm([0, -.45, .9]); const d = want[0] * f[0] + want[1] * f[1] + want[2] * f[2]; return norm([want[0] - f[0] * d, want[1] - f[1] * d, want[2] - f[2] * d]); };
    if (t < TL.orient[1]) {
      const k = easeInOut(seg(now, st.t0 + TL.orient[0], st.t0 + TL.orient[1]));
      const from: V2 = { x: cardX, y: cardY - cardS * .12 }, to = st.entry;
      const pos: V2 = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k - Math.sin(k * Math.PI) * cardS * .25 };
      const f = heading(from, { x: to.x, y: to.y - cardS * .2 }), u = flightUp(f);
      const bf = norm([card.f[0] + (f[0] - card.f[0]) * k, card.f[1] + (f[1] - card.f[1]) * k, card.f[2] + (f[2] - card.f[2]) * k]);
      const bu0: V3 = [card.u[0] + (u[0] - card.u[0]) * k, card.u[1] + (u[1] - card.u[1]) * k, card.u[2] + (u[2] - card.u[2]) * k];
      const dd = bu0[0] * bf[0] + bu0[1] * bf[1] + bu0[2] * bf[2], bu = norm([bu0[0] - bf[0] * dd, bu0[1] - bf[1] * dd, bu0[2] - bf[2] * dd]);
      return { pose: { pos: [pos.x, pos.y, 0], f: bf, u: bu, s: cardS * (1 - .7 * k) }, front: true, alpha: 1 };
    }
    const sScale = cardS * .3;
    if (t < TL.orbit[1]) {
      const k = seg(now, st.t0 + TL.orbit[0], st.t0 + TL.orbit[1]), a = A0 + sweep(k) * SWEEP;
      const o = orbit(a), q = orbit(a + .02);
      const f = norm([q.x - o.x, q.y - o.y, (q.z - o.z) * R * .3]);
      return { pose: { pos: [o.x, o.y, o.z * R * .3], f, u: flightUp(f), s: sScale * (1 - .25 * k) }, front: o.z > 0, alpha: 1 };
    }
    const k = ease(seg(now, st.t0 + TL.land[0], st.t0 + TL.land[1]));
    const o = orbit(A1), on = orbit(A1 + .01), tx = on.x - o.x, ty = on.y - o.y, tl = Math.hypot(tx, ty) || 1;
    // Nearly straight at the city: the midpoint, bowed a little along the orbit's direction for a soft turn.
    const reach = Math.hypot(tp.x - o.x, tp.y - o.y) * .18, c = { x: (o.x + tp.x) / 2 + tx / tl * reach, y: (o.y + tp.y) / 2 + ty / tl * reach };
    const at = (q: number) => ({ x: (1 - q) ** 2 * o.x + 2 * (1 - q) * q * c.x + q * q * tp.x, y: (1 - q) ** 2 * o.y + 2 * (1 - q) * q * c.y + q * q * tp.y });
    const pos = at(k), ahead = at(Math.min(1, k + .02));
    const f = heading(pos, k > .98 ? tp : ahead);
    return { pose: { pos: [pos.x, pos.y, 0], f, u: flightUp(f), s: sScale * (.75 - .35 * k) }, front: true, alpha: 1 - Math.max(0, (k - .85) / .15) };
  };

  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (turn) { const k = clamp01((now - turn.t0) / turn.ms); spin = turn.from + (turn.to - turn.from) * easeInOut(k); if (k >= 1) turn = null; }
    else if (!still && !pinAt && !send) spin += dt * .12;
    if (dirty || (focused && !send)) { drawCard(tex, { text, placeholder: opts.placeholder, locale: opts.locale, accent: opts.accent, airmail: opts.airmail, caret: focused && !send && Math.floor(now / 530) % 2 === 0 }); dirty = false; }
    const tp = project(T[0], T[1], T[2]);

    let plane: ReturnType<typeof posePlane> | null = null, mesh: ReturnType<typeof planePlace> | null = null;
    if (send) {
      plane = posePlane(send, now, tp); mesh = planePlace(send, now);
      const t = now - send.t0;
      if (t >= TL.orbit[0] - 200 && t < TL.land[1]) trail.push({ x: plane.pose.pos[0], y: plane.pose.pos[1], front: plane.front, t: now });
      if (t >= TL.land[1]) { const st = send; send = null; plane = null; pinAt = now; appearAt = 0; st.done({ x: tp.x, y: tp.y }); }
    }
    while (trail.length && now - trail[0].t > 3200) trail.shift();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const drawTrail = (front: boolean) => {
      ctx.strokeStyle = opts.accent; ctx.lineWidth = 1.2; ctx.lineCap = "round";
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1], b = trail[i]; if (b.front !== front) continue;
        const age = (now - b.t) / 3200; ctx.globalAlpha = (1 - age) * (front ? .85 : .25);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    // Behind the globe: the globe's disc hides it completely (the dot globe would let it show through);
    // only what is past the limb stays visible.
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(gx, gy, R + 1, 0, Math.PI * 2); ctx.clip("evenodd");
    drawTrail(false);
    if (send && plane && mesh && !plane.front) drawPaper(mesh.polys, mesh.place, plane.pose, 1);
    ctx.restore(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Globe.
    const dot = Math.max(1.6, R / 72);
    for (let i = 0; i < P.length; i += 4) {
      const p = project(P[i], P[i + 1], P[i + 2]); if (p.z <= 0) continue;
      const isLand = P[i + 3] === 1;
      ctx.globalAlpha = isLand ? .25 + .75 * p.z : .16 + .22 * p.z; ctx.fillStyle = isLand ? "#141414" : "#a9a9a4";
      const s = dot * (.65 + .35 * p.z); ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    if (tp.z > 0) {
      ctx.fillStyle = opts.accent;
      if (pinAt) {
        const k = Math.min(1, (now - pinAt) / 420), pulse = ((now - pinAt) % 1600) / 1600;
        ctx.globalAlpha = (1 - pulse) * .8; ctx.strokeStyle = opts.accent; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(tp.x, tp.y, 5 + pulse * 22, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1; const s = 9 * (k < 1 ? ease(k) * 1.15 : 1); ctx.fillRect(tp.x - s / 2, tp.y - s / 2, s, s);
      } else { ctx.globalAlpha = .5 + .5 * tp.z; ctx.fillRect(tp.x - 2.5, tp.y - 2.5, 5, 5); }
      ctx.globalAlpha = 1;
    }
    drawTrail(true);
    if (send && plane && mesh && plane.front) drawPaper(mesh.polys, mesh.place, plane.pose, plane.alpha);
    // Idle card (or a fresh one rising back in).
    if (!send && !pinAt) {
      const k = appearAt ? ease(seg(now, appearAt, appearAt + 600)) : 1;
      const pose: Pose = { pos: [cardX, cardY + (1 - k) * cardS * .15, 0], f: [0, -1, 0], u: [0, 0, -1], s: cardS };
      drawPaper(freshPaper(), (v, layer) => [v.x, v.y, layer * .002], pose, k);
    }
    if (visible && (!still || turn || send || dirty || focused)) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const ro = new ResizeObserver(size); ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }); io.observe(canvas);
  // Webfonts may arrive after the first paint; redraw the card when they do.
  document.fonts?.ready.then(() => { dirty = true; kick(); });

  return {
    setText(v: string) { text = v; dirty = true; kick(); },
    setFocus(v: boolean) { focused = v; dirty = true; kick(); },
    send(): Promise<V2> {
      const goal = -rad(opts.target.lon), now = performance.now();
      const to = spin + (((goal - spin) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
      drawCard(tex, { text, placeholder: opts.placeholder, locale: opts.locale, accent: opts.accent, airmail: opts.airmail, caret: false });
      if (still) { spin = to; pinAt = now; kick(); const p = project(T[0], T[1], T[2]); return Promise.resolve({ x: p.x, y: p.y }); }
      turn = { from: spin, to, t0: now + 2200, ms: 3300 };
      trail.length = 0;
      const p0 = freshPaper(), c1 = cut(p0, STEPS[0]), p1 = flatten(c1, STEPS[0]), c2 = cut(p1, STEPS[1]), p2 = flatten(c2, STEPS[1]);
      // Cut along the centre and both wing lines so every piece folds rigidly; tag each by its centroid.
      let pieces: Poly[] = p2;
      for (const x of [.5, .5 - D, .5 + D]) { const line: Crease = { p: { x, y: -1 }, q: { x, y: 2 }, flap: { x: 0, y: 0 } }; pieces = pieces.flatMap(pc => split(pc, line)); }
      const p3: Body[] = pieces.map(pc => { const cx = pc.pts.reduce((t, v) => t + v.x, 0) / pc.pts.length; return { ...pc, left: cx < .5, wing: Math.abs(cx - .5) > D }; });
      const entry = orbit(A0);
      return new Promise(done => { send = { t0: now, done, paper: [p0, c1, p1, c2, p3], entry: { x: entry.x, y: entry.y } }; kick(); });
    },
    reset() { pinAt = 0; trail.length = 0; appearAt = performance.now(); dirty = true; kick(); },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); },
  };
}
