import { cn } from "@/lib/utils";
import { LiquidGlassView } from "@/components/ui/liquid-glass";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  glass?: "regular" | "clear" | "none";
  interactive?: boolean;
};

export function Card({
  className,
  glass = "regular",
  interactive = false,
  ...props
}: CardProps) {
  return (
    <LiquidGlassView
      effect={glass}
      interactive={interactive}
      className={cn("rounded-xl p-5", className)}
      {...props}
    />
  );
}
