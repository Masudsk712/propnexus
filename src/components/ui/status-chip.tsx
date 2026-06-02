"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ReactNode } from "react";

const statusChipVariants = cva("status-chip", {
  variants: {
    variant: {
      success: "status-occupied",
      warning: "status-maintenance",
      destructive: "status-vacant",
      info: "status-listed",
      neutral: "bg-muted text-muted-foreground",
      pending: "bg-amber-500/10 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400",
      active: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400",
      expired: "bg-slate-500/10 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400",
      evicted: "bg-red-500/10 text-red-500 dark:bg-red-500/15 dark:text-red-400",
      open: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/15 dark:text-blue-400",
      "in-progress": "bg-amber-500/10 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400",
      resolved: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400",
      closed: "bg-muted text-muted-foreground dark:bg-muted/50",
      confirmed: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400",
      cancelled: "bg-red-500/10 text-red-500 dark:bg-red-500/15 dark:text-red-400",
      completed: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400",
      failed: "bg-red-500/10 text-red-500 dark:bg-red-500/15 dark:text-red-400",
      refunded: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/15 dark:text-blue-400",
      emergency: "bg-red-500/10 text-red-500 border border-red-500/20 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30",
      high: "bg-orange-500/10 text-orange-500 border border-orange-500/20 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30",
      medium: "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-500/30",
      low: "bg-blue-500/10 text-blue-500 border border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
    },
    size: {
      sm: "text-[10px] px-1.5 py-0.5 gap-1",
      md: "text-xs px-2.5 py-0.5 gap-1.5",
      lg: "text-sm px-3 py-1 gap-2",
    },
    pulse: {
      true: "[&_.status-dot]:status-dot-pulse",
      false: "",
    },
    bordered: {
      true: "border border-current/20",
      false: "",
    },
  },
  defaultVariants: {
    variant: "neutral",
    size: "md",
    pulse: false,
    bordered: false,
  },
});

interface StatusChipProps extends VariantProps<typeof statusChipVariants> {
  label: string;
  className?: string;
  dotColor?: string;
  /** Optional icon to show before the dot */
  icon?: ReactNode;
}

const dotColorMap: Record<string, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  destructive: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-muted-foreground",
  pending: "bg-amber-500",
  active: "bg-emerald-500",
  expired: "bg-slate-500",
  evicted: "bg-red-500",
  open: "bg-blue-500",
  "in-progress": "bg-amber-500",
  resolved: "bg-emerald-500",
  closed: "bg-muted-foreground",
  confirmed: "bg-emerald-500",
  cancelled: "bg-red-500",
  completed: "bg-emerald-500",
  failed: "bg-red-500",
  refunded: "bg-blue-500",
  emergency: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

export function StatusChip({
  label,
  variant = "neutral",
  size = "md",
  pulse = false,
  bordered = false,
  icon,
  className,
  dotColor,
}: StatusChipProps) {
  const variantKey = variant ?? "neutral";

  return (
    <span className={cn(statusChipVariants({ variant, size, pulse, bordered }), className)}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span
        className={cn(
          "status-dot",
          dotColor ?? dotColorMap[variantKey] ?? "bg-muted-foreground"
        )}
      />
      {label}
    </span>
  );
}

export { statusChipVariants };
export type { StatusChipProps };