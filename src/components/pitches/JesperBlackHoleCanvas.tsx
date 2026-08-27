'use client';

import React, { useEffect, useRef } from 'react';

interface JesperBlackHoleCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  client?: string;
  subtitle?: string;
  description?: string;
  images: string[];
  tags?: string[];
  onImageClick: (idx: number) => void;
  brandName?: string;
}

const VERT_SHADER = `
attribute vec2 position;
varying vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// Exact GLSL Gravitational Lensing Shader reverse-engineered from jesperlandberg.com
const FRAG_SHADER = `
precision highp float;

uniform sampler2D u_scene;
uniform vec2 u_aspect;
uniform float u_time;
uniform vec2 u_center;
uniform float u_p;
uniform float u_radius;
uniform float u_lens;
uniform float u_reach;
uniform float u_orbit;
uniform float u_wave;
uniform float u_aberr;
uniform float u_breath;

varying vec2 vUv;

vec2 spin(vec2 v, float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c) * v;
}

float widthUnit() {
  return u_aspect.x;
}

vec2 squash() {
  return vec2(1.0, 1.0);
}

float lobes(float a) {
  return sin(a * 3.0 + u_time * 0.7) * 0.6 + sin(a * 5.0 - u_time * 0.45) * 0.4;
}

vec4 grab(vec2 dir, float rad) {
  vec2 uv = (dir * rad * widthUnit()) / (squash() * u_aspect) + u_center;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    return vec4(0.0, 0.0, 0.0, 1.0);
  }
  return texture2D(u_scene, uv);
}

float pull(float t, float e, float fall) {
  return fall * (e * e) / max(t, 0.001);
}

void main() {
  vec2 q = (vUv - u_center) * u_aspect * squash();
  float t = length(q) / widthUnit();
  vec2 dir = length(q) > 0.00001 ? normalize(q) : vec2(1.0, 0.0);

  float n = lobes(atan(q.y, q.x)) * u_wave * sin(3.14159265 * clamp(u_p, 0.0, 1.0));
  float r = u_p * u_radius * (1.0 + u_breath * sin(u_time * 1.6)) + n;
  float e = r * u_lens;

  float fall = 1.0 - smoothstep(r, r + u_reach, t);
  float draw = pull(t, e, fall);

  vec2 sdir = spin(dir, draw * u_orbit * min(u_time, 15.0));
  float split = e * u_aberr;

  vec4 cr = grab(sdir, t - pull(t, e + split, fall));
  vec4 cg = grab(sdir, t - draw);
  vec4 cb = grab(sdir, t - pull(t, e - split, fall));

  vec4 col = vec4(cr.r, cg.g, cb.b, 1.0);

  // Event horizon boundary
  float d = t - r;
  float aa = max(fwidth(d), 0.0001);
  float inside = 1.0 - smoothstep(-aa, aa, d);

  vec4 finalCol = mix(col, vec4(0.0, 0.0, 0.0, 1.0), inside);

  // Soft darkening at viewport edges
  float vignette = 1.0 - smoothstep(0.4, 0.95, length(vUv - 0.5));
  finalCol.rgb *= mix(0.4, 1.0, vignette);

  gl_FragColor = finalCol;
}
`;

export default function JesperBlackHoleCanvas({
  isOpen,
  onClose,
  title,
  client,
  subtitle,
  description,
  images,
  tags,
  onImageClick,
  brandName = 'LAUNCHPAD',
}: JesperBlackHoleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const startTimeRef = useRef(performance.now());
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const sceneTextureRef = useRef<WebGLTexture | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      powerPreference: 'high-performance',
    });
    if (!gl) return;
    glRef.current = gl;

    // Enable OES_standard_derivatives for fwidth in WebGL 1
    gl.getExtension('OES_standard_derivatives');

    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, (type === gl.FRAGMENT_SHADER ? '#extension GL_OES_standard_derivatives : enable\n' : '') + src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vert = createShader(gl.VERTEX_SHADER, VERT_SHADER);
    const frag = createShader(gl.FRAGMENT_SHADER, FRAG_SHADER);
    if (!vert || !frag) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Quad geometry
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uNames = [
      'u_scene',
      'u_aspect',
      'u_time',
      'u_center',
      'u_p',
      'u_radius',
      'u_lens',
      'u_reach',
      'u_orbit',
      'u_wave',
      'u_aberr',
      'u_breath',
    ];
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    for (const name of uNames) {
      uniforms[name] = gl.getUniformLocation(program, name);
    }
    uniformsRef.current = uniforms;

    // Create scene texture (procedural spacetime background + card reflections)
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Generate procedural scene texture (spacetime grid + stars + warm glow)
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 1024;
    offCanvas.height = 1024;
    const ctx = offCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, 1024, 1024);

      // Spacetime perspective grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i <= 1024; i += 48) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 1024);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(1024, i);
        ctx.stroke();
      }

      // Warm accretion glow
      const grad = ctx.createRadialGradient(512, 512, 50, 512, 512, 500);
      grad.addColorStop(0, 'rgba(255, 200, 150, 0.25)');
      grad.addColorStop(0.4, 'rgba(150, 180, 255, 0.1)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Star particles
      ctx.fillStyle = '#ffffff';
      for (let s = 0; s < 120; s++) {
        const sx = Math.sin(s * 93.7) * 450 + 512;
        const sy = Math.cos(s * 47.3) * 450 + 512;
        const sr = (s % 3) * 0.8 + 0.8;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offCanvas);
    }
    sceneTextureRef.current = texture;

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Animation Loop
    startTimeRef.current = performance.now();
    const render = () => {
      resize();
      const now = performance.now();
      const elapsed = (now - startTimeRef.current) / 1000;

      // Ease progress in
      progressRef.current += (1.0 - progressRef.current) * 0.08;

      gl.uniform1i(uniforms.u_scene, 0);
      gl.uniform2f(uniforms.u_aspect, canvas.width / canvas.height, 1.0);
      gl.uniform1f(uniforms.u_time, elapsed);
      gl.uniform2f(uniforms.u_center, 0.5, 0.5);
      gl.uniform1f(uniforms.u_p, progressRef.current);
      gl.uniform1f(uniforms.u_radius, 0.22); // ~44% viewport width
      gl.uniform1f(uniforms.u_lens, 1.45);
      gl.uniform1f(uniforms.u_reach, 0.18);
      gl.uniform1f(uniforms.u_orbit, 0.4);
      gl.uniform1f(uniforms.u_wave, 0.022);
      gl.uniform1f(uniforms.u_aberr, 0.005);
      gl.uniform1f(uniforms.u_breath, 0.025);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
      if (texture) gl.deleteTexture(texture);
      if (program) gl.deleteProgram(program);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in overflow-hidden">
      {/* Real-time WebGL Gravitational Lensing Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Top Header Bar */}
      <div className="absolute top-5 left-6 right-6 flex items-center justify-between z-30 pointer-events-none">
        <span
          className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/60 font-bold"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          {brandName}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto px-3.5 py-1.5 bg-black/70 hover:bg-white hover:text-black border border-white/20 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] text-white/90 transition-all duration-300 shadow-2xl cursor-pointer"
        >
          Close ✕
        </button>
      </div>

      {/* Content Floating Inside the Void */}
      <div
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 sm:px-10 max-w-[500px] space-y-4 pointer-events-auto select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Client & Category Badge */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          {client && (
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-white/[0.08] border border-white/20 text-zinc-100 shadow-sm backdrop-blur-md">
              {client}
            </span>
          )}
          {subtitle && (
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-400">
              {subtitle}
            </span>
          )}
        </div>

        {/* Editorial Title */}
        <h2 className="text-2xl sm:text-3xl md:text-[2rem] font-bold tracking-tight text-white leading-[1.15] drop-shadow-lg">
          {title}
        </h2>

        {/* Description Prose */}
        {description && (
          <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed max-w-[420px] font-normal tracking-normal px-2">
            {description}
          </p>
        )}

        {/* Interactive Image Gallery Carousel */}
        {images.length > 0 && (
          <div className="w-full pt-1 flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-2.5 py-2 overflow-x-auto max-w-full px-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onImageClick(idx)}
                  className="group relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden border border-white/25 bg-black/40 transition-all duration-300 shrink-0 hover:scale-108 hover:border-white hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] cursor-pointer"
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
                  <div className="absolute bottom-1 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="material-icons text-[12px] text-white drop-shadow">zoom_in</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {tags.map((tag, tIdx) => (
              <span
                key={tIdx}
                className="text-[9px] uppercase font-mono tracking-wider text-zinc-400 bg-white/[0.04] border border-white/10 px-2.5 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
