"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode } from "react";

interface DashboardWidgetProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  delay?: number;
}

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
      <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <Skeleton className="h-5 w-36" />
            {description !== undefined && <Skeleton className="h-3.5 w-48 mt-1" />}
          </div>
          {actions !== undefined && <Skeleton className="h-7 w-16 rounded-full" />}
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "rounded-xl border border-border bg-card p-4 sm:p-5",
        "transition-all duration-200 hover:shadow-lg dark:hover:shadow-primary/5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm sm:text-base text-foreground">{title}</h3>
          {description && (
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-1.5 flex-shrink-0">{actions}</div>
        )}
      </div>

      {/* Content */}
      {children}
    </motion.div>
  );
}

export type { DashboardWidgetProps };