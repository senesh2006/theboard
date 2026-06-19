"use client";

import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ),
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                            \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                    \
     bool isInBetween = currentColor.position <= factor;    \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                         \
  ColorStop currentColor = colors[index];                   \
  ColorStop nextColor = colors[index + 1];                  \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float animationAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 finalColor = rampColor;

  fragColor = vec4(finalColor * animationAlpha, animationAlpha);
}
`;

type Rgb = [number, number, number];

type ColorInput =
  | string
  | { r: number; g: number; b: number }
  | null
  | undefined;

function parseColor(color: ColorInput, defaultColor: Rgb): Rgb {
  if (color === undefined || color === null || color === "") {
    return defaultColor;
  }

  if (typeof color === "object") {
    if ("r" in color && "g" in color && "b" in color) {
      if (color.r <= 1 && color.g <= 1 && color.b <= 1) {
        return [color.r || 0, color.g || 0, color.b || 0];
      }
      return [(color.r || 0) / 255, (color.g || 0) / 255, (color.b || 0) / 255];
    }
    return defaultColor;
  }

  if (typeof color === "string") {
    const cleanColor = color.trim();
    if (cleanColor.startsWith("#")) {
      const hex =
        cleanColor.length === 4
          ? `#${cleanColor[1]}${cleanColor[1]}${cleanColor[2]}${cleanColor[2]}${cleanColor[3]}${cleanColor[3]}`
          : cleanColor;
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (result) {
        return [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255,
        ];
      }
    }

    const rgbMatch = cleanColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgbMatch) {
      return [
        parseInt(rgbMatch[1], 10) / 255,
        parseInt(rgbMatch[2], 10) / 255,
        parseInt(rgbMatch[3], 10) / 255,
      ];
    }
  }

  return defaultColor;
}

export type FloatingAnimationProps = {
  colorStops?: [string, string, string];
  amplitude?: number;
  blend?: number;
  speed?: number;
  height?: string;
  className?: string;
};

/**
 * Framer Floating Animation (https://framer.com/m/Floating-Animation-taEDnY.js@zLE1kDPQbzTeVcbx4RIx)
 * ported for Next.js — WebGL gradient waves via ogl.
 */
export function FloatingAnimation({
  colorStops = ["#6366f1", "#38bdf8", "#a78bfa"],
  amplitude = 1,
  blend = 0.5,
  speed = 1,
  height = "100%",
  className,
}: FloatingAnimationProps) {
  const propsRef = useRef({
    colorStops,
    amplitude,
    blend,
    speed,
  });
  propsRef.current = { colorStops, amplitude, blend, speed };

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";
    gl.canvas.style.backgroundColor = "transparent";

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const defaultColors: Rgb[] = [
      [0.39, 0.4, 0.95],
      [0.22, 0.74, 0.97],
      [0.65, 0.55, 0.98],
    ];

    const colorStopsArray = colorStops.map((color, index) =>
      parseColor(color, defaultColors[index] ?? [1, 0, 0]),
    );

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: colorStopsArray },
        uResolution: { value: [container.offsetWidth, container.offsetHeight] },
        uBlend: { value: blend },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    container.appendChild(gl.canvas);

    function resize() {
      if (!container) return;

      const width = container.offsetWidth;
      const heightPx = container.offsetHeight;
      renderer.setSize(width, heightPx);

      if (program) {
        program.uniforms.uResolution.value = [width, heightPx];
        const baseHeight = 800;
        const scaleFactor = baseHeight / (heightPx || 1);
        const baseAmp = propsRef.current.amplitude ?? amplitude;
        program.uniforms.uAmplitude.value = baseAmp * scaleFactor;
      }

      renderer.render({ scene: mesh });
    }

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(container);
    resize();

    let animateId = 0;
    const update = (time: number) => {
      animateId = requestAnimationFrame(update);
      const currentProps = propsRef.current;
      const animatedTime = time * 0.001 * (currentProps.speed ?? speed);

      if (program && container) {
        program.uniforms.uTime.value = animatedTime;

        const baseHeight = 800;
        const scaleFactor = baseHeight / (container.offsetHeight || 1);
        const baseAmp = currentProps.amplitude ?? amplitude;
        program.uniforms.uAmplitude.value = baseAmp * scaleFactor;
        program.uniforms.uBlend.value = currentProps.blend ?? blend;

        const stops = currentProps.colorStops ?? colorStops;
        const newColorStops = stops.map((color, index) =>
          parseColor(color, defaultColors[index] ?? [1, 0, 0]),
        );
        program.uniforms.uColorStops.value = newColorStops;

        renderer.render({ scene: mesh });
      }
    };

    animateId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animateId);
      resizeObserver.disconnect();
      if (container && gl.canvas.parentNode === container) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [amplitude, blend, colorStops, speed]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height,
        position: "relative",
        overflow: "hidden",
        background: "transparent",
      }}
    />
  );
}
