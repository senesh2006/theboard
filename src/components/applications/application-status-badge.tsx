import { ApplicationStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { APPLICATION_STATUS_LABELS } from "@/lib/validations/application";

const STATUS_VARIANT: Record<
  ApplicationStatus,
  "default" | "success" | "muted"
> = {
  APPLIED: "default",
  VIEWED: "muted",
  INTERVIEW: "default",
  OFFER: "success",
  REJECTED: "muted",
};

type ApplicationStatusBadgeProps = {
  status: ApplicationStatus;
  className?: string;
};

export function ApplicationStatusBadge({
  status,
  className,
}: ApplicationStatusBadgeProps) {
  const variant = STATUS_VARIANT[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-indigo-100 text-indigo-800",
        variant === "success" && "bg-emerald-100 text-emerald-800",
        variant === "muted" &&
          (status === "REJECTED"
            ? "bg-red-100 text-red-800"
            : "bg-slate-100 text-slate-700"),
        className,
      )}
    >
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  );
}
