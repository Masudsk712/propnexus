"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardWidgetProps {
  /** Widget title */
  title: string;
  /** Optional subtitle/description */
  description?: string;
  /** Optional actions slot in header (e.g. badge, button, link) */
  actions?: ReactNode;
  /** Widget content */
  children: ReactNode;
  /** Extra class names */
  className?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Stagger delay for entrance animation */
  delay?: number;
}

// ── Component ────────────────────────────────────────────────────────────────

export function DashboardWidget({
  title,
  description,
  actions,
  children,
  className,
  isLoading = false,
  delay = 0,
}: DashboardWidgetProps) {
  if (isLoading) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card p-6", className)}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <Skeleton className="h-6 w-40" />
            {description !== undefined && <Skeleton className="h-4 w-56 mt-1.5" />}
          </div>
          {actions !== undefined && <Skeleton className="h-8 w-20 rounded-full" />}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "rounded-2xl border border-border bg-card p-5 sm:p-6",
        "transition-shadow duration-300 hover:shadow-lg dark:hover:shadow-primary/5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-base sm:text-lg text-foreground">{title}</h3>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>

      {/* Content */}
      {children}
    </motion.div>
  );
}

export type { DashboardWidgetProps };