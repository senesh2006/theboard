import { cn } from "@/lib/utils";

export type LiquidGlassEffect = "clear" | "regular" | "none";
export type LiquidGlassColorScheme = "light" | "dark" | "system";

/** True when the browser supports backdrop blur (CSS fallback otherwise). */
export const isLiquidGlassSupported = true;

type LiquidGlassViewProps = React.HTMLAttributes<HTMLDivElement> & {
  effect?: LiquidGlassEffect;
  interactive?: boolean;
  tintColor?: string;
  colorScheme?: LiquidGlassColorScheme;
};

export function LiquidGlassView({
  effect = "regular",
  interactive = false,
  tintColor,
  colorScheme = "system",
  className,
  style,
  ...props
}: LiquidGlassViewProps) {
  return (
    <div
      className={cn(
        "liquid-glass",
        effect === "clear" && "liquid-glass-clear",
        effect === "regular" && "liquid-glass-regular",
        effect === "none" && "liquid-glass-none",
        interactive && "liquid-glass-interactive",
        colorScheme === "dark" && "liquid-glass-dark",
        colorScheme === "light" && "liquid-glass-light",
        className,
      )}
      style={{
        ...style,
        ...(tintColor
          ? {
              "--liquid-glass-tint": tintColor,
              background: tintColor,
            }
          : undefined),
      }}
      {...props}
    />
  );
}

type LiquidGlassContainerViewProps = React.HTMLAttributes<HTMLDivElement> & {
  spacing?: number;
};

export function LiquidGlassContainerView({
  spacing = 0,
  className,
  style,
  ...props
}: LiquidGlassContainerViewProps) {
  return (
    <div
      className={cn("liquid-glass-container", className)}
      style={{ ...style, gap: spacing }}
      {...props}
    />
  );
}
