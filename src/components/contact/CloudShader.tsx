"use client";
import { useEffect, useRef } from "react";
// Warm flowing colour clouds (large, soft domain-warped fbm) in a plain WebGL fragment shader:
// orange / red / yellow / magenta blobs that drift and slowly trade places, dark toward one corner.
const FRAG = `precision mediump float;
uniform vec2 res; uniform float t;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 3; i++) { v += a * n(p); p = p * 2.01 + 17.; a *= .5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / res, p = uv * vec2(res.x / res.y, 1.) * .55;
  float s = t * .05;
  vec2 q = vec2(fbm(p + s), fbm(p + vec2(5.2, 1.3) - s * .8));
  vec2 r = vec2(fbm(p + 2.2 * q + vec2(1.7, 9.2) + s * 1.3), fbm(p + 2.2 * q + vec2(8.3, 2.8) - s));
  float a = smoothstep(.25, .75, fbm(p + 1.8 * r));          // red <-> orange
  float b = smoothstep(.35, .7, fbm(p * 1.3 + 2. * q + s));   // yellow bloom
  float m = smoothstep(.45, .8, r.x);                          // magenta pockets
  float phase = .5 + .5 * sin(t * .09);                        // whole card drifts orange -> yellow and back
  vec3 col = mix(vec3(.88, .22, .2), vec3(.96, .45, .18), a);
  col = mix(col, vec3(.97, .8, .2), b * (.35 + .6 * phase));
  col = mix(col, vec3(.85, .2, .5), m * .7);
  float dark = smoothstep(.15, .95, fbm(p * .8 - s * .6 + 3.) * .9 + (1. - uv.y) * .45 + (1. - uv.x) * .2);
  col = mix(col, vec3(.07, .03, .03), smoothstep(.55, .95, dark) * .9);
  gl_FragColor = vec4(col, 1.);
}`;
export function CloudShader({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) return;
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}"));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "res"), uT = gl.getUniformLocation(prog, "t");
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, visible = false;
    const t0 = performance.now();
    const draw = () => {
      gl.uniform1f(uT, still ? 8 : (performance.now() - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = visible && !still ? requestAnimationFrame(draw) : 0;
    };
    // Half resolution: the clouds are soft, so the GPU cost can stay low.
    const size = () => {
      const s = Math.min(devicePixelRatio || 1, 2) * .5;
      canvas.width = Math.max(1, canvas.clientWidth * s); canvas.height = Math.max(1, canvas.clientHeight * s);
      gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(uRes, canvas.width, canvas.height);
      if (!raf) draw();
    };
    const ro = new ResizeObserver(size); ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) draw(); });
    io.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, []);
  return <canvas ref={ref} className={className} aria-hidden />;
}
