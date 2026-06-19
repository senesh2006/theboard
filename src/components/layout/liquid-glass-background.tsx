export function LiquidGlassBackground() {
  return (
    <div aria-hidden className="liquid-glass-scene pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="liquid-glass-blob liquid-glass-blob-a" />
      <div className="liquid-glass-blob liquid-glass-blob-b" />
      <div className="liquid-glass-blob liquid-glass-blob-c" />
    </div>
  );
}
