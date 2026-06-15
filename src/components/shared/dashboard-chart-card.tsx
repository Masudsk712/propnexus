"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode, Suspense } from "react";

interface DashboardChartCardProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  delay?: number;
  skeletonHeight?: number;
}

export function DashboardChartCard({
  title,
  subtitle,
  badge,
  children,
  className,
  isLoading = false,
  delay = 0,
  skeletonHeight = 280,
}: DashboardChartCardProps) {
  if (isLoading) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <Skeleton className="h-5 w-40" />
            {subtitle && <Skeleton className="h-3.5 w-52 mt-1" />}
          </div>
          {badge !== undefined && <Skeleton className="h-5 w-16 rounded-full" />}
        </div>
        <Skeleton className="w-full rounded-lg" style={{ height: skeletonHeight }} />
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm sm:text-base text-foreground">{title}</h3>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {badge && <div className="flex-shrink-0">{badge}</div>}
      </div>
      <Suspense fallback={<Skeleton className="w-full rounded-lg" style={{ height: skeletonHeight }} />}>
        {children}
      </Suspense>
    </motion.div>
  );
}

export type { DashboardChartCardProps };