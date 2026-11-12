"use client";
import { useEffect, useRef } from "react";
// Greyscale flowing clouds (domain-warped fbm) in a plain WebGL fragment shader.
const FRAG = `precision mediump float;
uniform vec2 res; uniform float t;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 4; i++) { v += a * n(p); p = p * 2.03 + 17.; a *= .5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / res, p = uv * vec2(res.x / res.y, 1.) * .9;
  vec2 q = vec2(fbm(p + t * .04), fbm(p + vec2(5.2, 1.3) - t * .03));
  vec2 r = vec2(fbm(p + 1.8 * q + vec2(1.7, 9.2) + t * .07), fbm(p + 1.8 * q + vec2(8.3, 2.8) - t * .06));
  float v = fbm(p + 1.6 * r);
  float g = smoothstep(.2, .8, v) * .85 + .06;
  g *= mix(.35, 1., smoothstep(-.1, .9, uv.y + uv.x * .25));   // darker toward the bottom
  gl_FragColor = vec4(vec3(g), 1.);
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
