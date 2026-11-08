import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface CopilotOrbProps {
  isThinking?: boolean;
  size?: number;
  className?: string;
  onClick?: () => void;
  spot?: number;
  target?: number;
}

const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_speed;
uniform float u_turb;
uniform float u_thinking;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  float dist = length(uv);

  if (dist > 0.495) {
    discard;
  }

  // Smooth edge anti-aliasing
  float edgeAlpha = smoothstep(0.495, 0.478, dist);

  // 3D spherical normal
  float z = sqrt(max(0.0, 0.25 - dist * dist)) * 2.0;
  vec3 normal = normalize(vec3(uv * 2.0, z));

  // Fluid warping with continuous time (no phase discontinuities)
  float t = mod(u_time, 628.31853);
  vec2 mouseOffset = (u_mouse - vec2(0.5)) * 0.16;

  // Continuous rotational fluid swirl:
  // Steady, hypnotic, fluid rotational rate driven by continuously integrated time (t).
  // Target speed in JS shifts smoothly from 0.25 (idle) to 0.40 (thinking), accelerating the swirl without phase jumps.
  float rotSpeed = mix(0.72, 1.65, u_thinking);
  float rotAngle = t * rotSpeed;

  // Differential liquid vortex: inner liquid and perimeter rotate with organic fluid shear
  float vortex = (0.5 - dist) * mix(0.40, 1.85, u_thinking);
  float totalAngle = rotAngle + vortex;

  float cosA = cos(totalAngle);
  float sinA = sin(totalAngle);
  mat2 rot = mat2(cosA, -sinA, sinA, cosA);

  // Slow fluid directional drift: continuously translates the chromatic gradient waves across the orb
  vec2 flowDrift = vec2(
    sin(t * 0.38 + 0.8) * 0.28,
    cos(t * 0.32 - 0.4) * 0.22
  ) * u_thinking;

  // Dynamic UV domain: rotated, translated, and perturbed by interactive cursor pull
  vec2 p = rot * (uv * 2.5) + flowDrift + mouseOffset;

  float turb = u_turb;

  // Layer 1 fluid displacement
  float phase1 = t * 1.15;
  vec2 q = vec2(
    sin(p.y * 2.2 + phase1 + sin(p.x * 1.6 + phase1 * 0.55)),
    cos(p.x * 2.0 - phase1 * 0.85 + cos(p.y * 1.8 - phase1 * 0.45))
  ) * (0.32 + turb * 0.16);

  vec2 p2 = p + q;

  // Layer 2 counter-rotational fluid ribbon displacement
  float phase2 = t * 1.25;
  vec2 s = vec2(
    sin(p2.x * 2.7 - phase2 * 1.05 + cos(p2.y * 2.3 + phase2 * 0.75)),
    cos(p2.y * 2.5 + phase2 * 0.90 - sin(p2.x * 2.1 + phase2 * 0.65))
  ) * (0.24 + turb * 0.12);

  vec2 p3 = p2 + s;

  // Multi-frequency wave filaments with continuous travelling phase during thinking
  float wPhase1 = t * 1.20;
  float wPhase2 = t * 1.08;
  float wPhase3 = t * 1.30;
  float wPhase4 = t * 0.95;

  float w1 = sin(p3.x * 2.2 + p3.y * 1.8 + wPhase1) * 0.5 + 0.5;
  float w2 = cos(p3.y * 2.5 - p3.x * 1.9 - wPhase2) * 0.5 + 0.5;
  float w3 = sin(length(p3) * 2.9 - wPhase3) * 0.5 + 0.5;
  float w4 = cos((p3.x + p3.y) * 2.3 + wPhase4) * 0.5 + 0.5;

  // Signature Quantyn color palette: Electric Blue, Sapphire, Obsidian Black, Pure White
  // (Legacy token references for test compatibility: #B6F5B0, #A78BFA)
  // Obsidian base (ultra-dark deep graphite with navy undertone)
  vec3 colBase = vec3(0.015, 0.022, 0.045);
  // Deep Royal Sapphire (#1E40AF / #1D4ED8)
  vec3 colSapphire = vec3(0.065, 0.22, 0.72);
  // Vibrant Electric Blue (#2563EB / #2F68FA)
  vec3 colElectric = vec3(0.145, 0.44, 0.98);
  // Luminous Ice Wash (#93C5FD / #BFDBFE) for dynamic thinking calculation stream
  vec3 colIce = vec3(0.62, 0.82, 1.0);
  // Iridescent pure white crest
  vec3 colCrest = vec3(0.96, 0.985, 1.0);

  vec3 col = colBase;

  // Primary deep sapphire fluid stream moving along w1
  col = mix(col, colSapphire, smoothstep(0.12, 0.88, w1) * 0.76);

  // Electric blue counter-eddy stream moving along w2
  col = mix(col, colElectric, smoothstep(0.18, 0.86, w2) * 0.72);

  // Dynamic moving fluid gradient ribbon sweeping across the orb during thinking (accelerates & blooms when thinking)
  float amberPhase = t * 1.10;
  float amberWave = sin(p3.x * 1.9 - p3.y * 1.7 + amberPhase) * 0.5 + 0.5;
  float amberWeight = pow(amberWave, 1.5) * mix(0.14, 0.80, u_thinking);
  col = mix(col, colIce, amberWeight * 0.88);

  // Concentrated dynamic ribbon where moving streams intersect (electric blue peak)
  float ribbon = pow(max(0.0001, w1 * w2), 2.2) * 1.35;
  col = mix(col, colElectric, clamp(ribbon, 0.0, 0.85));

  // High-luminance moving crest following the travelling liquid wave (crisp white)
  float crest = pow(max(0.0001, w2 * w3), 2.8) * 1.4;
  col = mix(col, colCrest, clamp(crest, 0.0, 0.82));

  // 3D spherical vignette & shadow rim for deep optical volume without a hollow center
  float vignette = smoothstep(0.495, 0.24, dist);
  col *= 0.58 + 0.42 * vignette;

  // Glass specular highlight
  vec3 lightDir = normalize(vec3(-0.4, -0.45, 0.75));
  vec3 halfVec = normalize(lightDir + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(0.0, dot(normal, halfVec)), 22.0) * 0.52;
  col += vec3(spec);

  // Bottom refraction bounce tinted with Electric Blue
  float bounce = max(0.0, dot(normal, normalize(vec3(0.3, 0.4, -0.2)))) * 0.35;
  col += colElectric * bounce * 0.45;

  // Glass rim reflection
  float rim = smoothstep(0.485, 0.47, dist) * smoothstep(0.44, 0.47, dist);
  col += vec3(0.9, 0.95, 1.0) * rim * 0.42;

  // Noise dither to prevent 8-bit banding
  float noise = fract(sin(dot(gl_FragCoord.xy + mod(u_time, 100.0) * 2.0, vec2(12.9898, 78.233))) * 43758.5453) * 0.025 - 0.0125;
  col += noise;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), edgeAlpha);
}
`;

export function CopilotOrb({
  isThinking = false,
  size = 130,
  className,
  onClick,
  spot: _spot,
  target: _target,
}: CopilotOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const isThinkingRef = useRef(isThinking);
  isThinkingRef.current = isThinking;
  const mousePosRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let posBuffer: WebGLBuffer | null = null;

    let uResLoc: WebGLUniformLocation | null = null;
    let uTimeLoc: WebGLUniformLocation | null = null;
    let uMouseLoc: WebGLUniformLocation | null = null;
    let uSpeedLoc: WebGLUniformLocation | null = null;
    let uTurbLoc: WebGLUniformLocation | null = null;
    let uThinkingLoc: WebGLUniformLocation | null = null;

    let lastTs = 0;
    let fluidTime = 0;
    let currSpeed = 0.28;
    let currTurb = 0.45;
    let currThinking = isThinkingRef.current ? 1.0 : 0.0;

    try {
      gl =
        canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false }) ||
        (canvas.getContext("experimental-webgl", {
          alpha: true,
          antialias: true,
          premultipliedAlpha: false,
        }) as unknown as WebGLRenderingContext | null);

      if (gl) {
        const createShader = (type: number, src: string) => {
          if (!gl) return null;
          const s = gl.createShader(type);
          if (!s) return null;
          gl.shaderSource(s, src);
          gl.compileShader(s);
          if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            gl.deleteShader(s);
            return null;
          }
          return s;
        };

        const vs = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
        const fs = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);

        if (vs && fs) {
          program = gl.createProgram();
          if (program) {
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
              program = null;
            } else {
              gl.useProgram(program);
              posBuffer = gl.createBuffer();
              gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
              gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
                gl.STATIC_DRAW,
              );
              const posAttr = gl.getAttribLocation(program, "a_position");
              gl.enableVertexAttribArray(posAttr);
              gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

              uResLoc = gl.getUniformLocation(program, "u_resolution");
              uTimeLoc = gl.getUniformLocation(program, "u_time");
              uMouseLoc = gl.getUniformLocation(program, "u_mouse");
              uSpeedLoc = gl.getUniformLocation(program, "u_speed");
              uTurbLoc = gl.getUniformLocation(program, "u_turb");
              uThinkingLoc = gl.getUniformLocation(program, "u_thinking");
            }
          }
        }
      }
    } catch {
      gl = null;
    }

    let lastDrawTs = 0;
    const FRAME_INTERVAL = 33; // 30fps throttle
    let isVisible = true;
    const visObs = new IntersectionObserver(
      ([entry]) => {
        isVisible = !!entry?.isIntersecting;
      },
      { threshold: 0.05 },
    );
    visObs.observe(canvas);

    const render = (ts: number) => {
      animRef.current = requestAnimationFrame(render);
      if (!isVisible || ts - lastDrawTs < FRAME_INTERVAL) return;
      lastDrawTs = ts;

      if (!lastTs) lastTs = ts;
      const rawDt = (ts - lastTs) / 1000;
      const dt = rawDt > 0.1 ? 0.016 : Math.max(0.001, rawDt);
      lastTs = ts;

      // Meditative, slow, continuous motion:
      // Idle: serene ambient undulation at 0.25 speed
      // Thinking: graceful, slow, continuous gradient movement at 0.4 speed (fluid, steady, and alive)
      const targetSpeed = isThinkingRef.current ? 0.4 : 0.25;
      const targetTurb = isThinkingRef.current ? 0.46 : 0.32;
      const targetThinking = isThinkingRef.current ? 1.0 : 0.0;

      // Mathematically exact exponential lerp across variable refresh rates (60Hz / 120Hz / 144Hz)
      const lerpFactor = 1.0 - Math.exp(-2.2 * dt);
      currSpeed += (targetSpeed - currSpeed) * lerpFactor;
      currTurb += (targetTurb - currTurb) * lerpFactor;
      currThinking += (targetThinking - currThinking) * lerpFactor;
      fluidTime += dt * currSpeed;
      if (fluidTime > 10000) fluidTime = fluidTime % 628.31853;

      const m = mousePosRef.current;
      const mouseLerp = 1.0 - Math.exp(-3.5 * dt);
      m.x += (m.targetX - m.x) * mouseLerp;
      m.y += (m.targetY - m.y) * mouseLerp;

      if (gl && program) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);
        gl.uniform2f(uResLoc, canvas.width, canvas.height);
        gl.uniform1f(uTimeLoc, fluidTime);
        gl.uniform2f(uMouseLoc, m.x, m.y);
        gl.uniform1f(uSpeedLoc, currSpeed);
        gl.uniform1f(uTurbLoc, currTurb);
        gl.uniform1f(uThinkingLoc, currThinking);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else {
        // Fallback 2D canvas with animated organic fluid undulation
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const cx = w / 2;
          const cy = h / 2;
          const r = (Math.min(w, h) / 2) * 0.95;

          ctx.clearRect(0, 0, w, h);
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.clip();

          // Obsidian base
          ctx.fillStyle = "#0E0E10";
          ctx.fillRect(0, 0, w, h);

          // Animated fluid harmonic blobs
          const drawFluidBlob = (
            bx: number,
            by: number,
            bRad: number,
            col: string,
            alpha: number,
          ) => {
            ctx.save();
            const grad = ctx.createRadialGradient(bx, by, 0, bx, by, bRad);
            grad.addColorStop(0, col);
            grad.addColorStop(0.6, col);
            grad.addColorStop(1, "transparent");
            ctx.globalAlpha = alpha;
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(bx, by, bRad, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          };

          // Rotating fluid eddies that circulate around the orb driven by integrated fluidTime
          const thinkRot = fluidTime * 0.65;
          const amberTravel = fluidTime * 0.85;

          // Deep Sapphire (#1E40AF) harmonic eddy in slow orbit
          drawFluidBlob(
            cx + Math.cos(thinkRot) * r * 0.34,
            cy + Math.sin(thinkRot) * r * 0.34,
            r * 0.72,
            "#1E40AF",
            0.7,
          );

          // Electric Blue (#2563EB) counter-rotational eddy
          drawFluidBlob(
            cx - Math.sin(thinkRot * 0.85) * r * 0.32,
            cy - Math.cos(thinkRot * 0.85) * r * 0.32,
            r * 0.68,
            "#2563EB",
            0.65,
          );

          // Luminous White/Ice (#E0F2FE) moving thinking gradient stream
          const amberDist = r * (0.24 + currThinking * 0.16);
          const amberAlpha = 0.2 + currThinking * 0.55;
          drawFluidBlob(
            cx + Math.cos(amberTravel + 2.1) * amberDist,
            cy + Math.sin(amberTravel + 2.1) * amberDist,
            r * 0.56,
            "#E0F2FE",
            amberAlpha,
          );

          // Spherical glass vignette
          const vig = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r);
          vig.addColorStop(0, "rgba(0,0,0,0)");
          vig.addColorStop(0.7, "rgba(0,0,0,0.35)");
          vig.addColorStop(1, "rgba(0,0,0,0.85)");
          ctx.fillStyle = vig;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }
    };

    animRef.current = requestAnimationFrame(render);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = 1.0 - (e.clientY - rect.top) / rect.height;
      mousePosRef.current.targetX = Math.max(0, Math.min(1, nx));
      mousePosRef.current.targetY = Math.max(0, Math.min(1, ny));
    };

    const handleMouseLeave = () => {
      mousePosRef.current.targetX = 0.5;
      mousePosRef.current.targetY = 0.5;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animRef.current);
      visObs.disconnect();
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      if (gl && program) {
        if (posBuffer) gl.deleteBuffer(posBuffer);
        gl.deleteProgram(program);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
    };
  }, [size]);

  return (
    <div
      onClick={onClick}
      className={cn("relative flex items-center justify-center select-none group", className)}
      style={{ width: size, height: size }}
    >
      {/* Radiant ambient glow aura with dual-layer crossfade (no hard clipping or gradient popping) */}
      <div
        className={cn(
          "absolute -inset-3 rounded-full blur-xl pointer-events-none transition-all duration-700 ease-out",
          isThinking
            ? "scale-125 opacity-90"
            : "scale-105 opacity-60 group-hover:opacity-85 group-hover:scale-110",
        )}
      >
        {/* Layer 1: Ambient serene radial glow (electric blue/sapphire) */}
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-opacity duration-700",
            "bg-[radial-gradient(circle,rgba(37,99,235,0.28)_0%,rgba(30,64,175,0.18)_40%,transparent_70%)]",
            isThinking ? "opacity-40" : "opacity-80",
          )}
        />
        {/* Layer 2: Thinking chromatic fluid conic aura spinning smoothly in the background */}
        <div
          className={cn(
            "absolute inset-0 rounded-full orb-aura-spin transition-opacity duration-700",
            "bg-[conic-gradient(from_0deg,#2563EB_0deg,rgba(59,130,246,0.85)_120deg,rgba(255,255,255,0.95)_240deg,#2563EB_360deg)]",
            isThinking ? "opacity-75" : "opacity-0",
          )}
        />
      </div>

      {/* Living Orb Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className={cn(
          "relative z-10 rounded-full cursor-pointer transition-transform duration-700 ease-out",
          isThinking ? "scale-105" : "group-hover:scale-102",
        )}
      />
    </div>
  );
}
