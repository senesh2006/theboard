import { FloatingAnimation } from "@/components/layout/floating-animation";

export function LiquidGlassBackground() {
  return (
    <div
      aria-hidden
      className="liquid-glass-scene pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <FloatingAnimation
        className="h-full w-full"
        height="100%"
        colorStops={["#FF2638", "#7cff67", "#5227FF"]}
        amplitude={1}
        blend={0.5}
        speed={1}
      />
    </div>
  );
}
