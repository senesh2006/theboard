import { FloatingAnimation } from "@/components/layout/floating-animation";

export function LiquidGlassBackground() {
  return (
    <div
      aria-hidden
      className="liquid-glass-scene pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <FloatingAnimation
        className="h-full w-full opacity-90"
        height="100%"
        colorStops={["#1e1b4b", "#4338ca", "#6366f1"]}
        amplitude={0.85}
        blend={0.55}
        speed={0.75}
      />
    </div>
  );
}
