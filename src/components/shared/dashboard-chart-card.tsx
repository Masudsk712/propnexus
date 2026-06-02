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
  skeletonHeight = 300,
}: DashboardChartCardProps) {
  if (isLoading) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card p-6", className)}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-6 w-48" />
            {subtitle && <Skeleton className="h-4 w-64 mt-1.5" />}
          </div>
          {badge !== undefined && <Skeleton className="h-6 w-20 rounded-full" />}
        </div>
        <Skeleton className="w-full rounded-xl" style={{ height: skeletonHeight }} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className={cn("rounded-2xl border border-border bg-card p-5 sm:p-6", "transition-shadow duration-300 hover:shadow-lg", className)}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-base sm:text-lg text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {badge && <div className="flex-shrink-0">{badge}</div>}
      </div>
      <Suspense fallback={<Skeleton className="w-full rounded-xl" style={{ height: skeletonHeight }} />}>
        {children}
      </Suspense>
    </motion.div>
  );
}

export type { DashboardChartCardProps };