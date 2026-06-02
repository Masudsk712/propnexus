"use client";

import { cn } from "@/lib/utils";

interface PropertyCardSkeletonProps {
  view?: "grid" | "list";
  className?: string;
}

export function PropertyCardSkeleton({
  view = "grid",
  className,
}: PropertyCardSkeletonProps) {
  if (view === "list") {
    return (
      <div
        className={cn(
          "flex flex-col sm:flex-row gap-4 rounded-2xl border border-border bg-card p-4",
          className,
        )}
      >
        <div className="h-48 sm:h-32 sm:w-48 rounded-xl skeleton flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-48 skeleton rounded-lg" />
          <div className="h-4 w-32 skeleton rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="h-12 skeleton rounded-lg" />
            <div className="h-12 skeleton rounded-lg" />
            <div className="h-12 skeleton rounded-lg" />
            <div className="h-12 skeleton rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card overflow-hidden",
        className,
      )}
    >
      {/* Image skeleton */}
      <div className="h-52 skeleton rounded-none" />
      {/* Content skeleton */}
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <div className="h-5 w-3/4 skeleton rounded-lg" />
          <div className="h-4 w-1/2 skeleton rounded-lg" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-14 skeleton rounded-lg" />
          <div className="h-14 skeleton rounded-lg" />
          <div className="h-14 skeleton rounded-lg" />
        </div>
        <div className="h-2 skeleton rounded-full" />
        <div className="flex gap-2 flex-wrap">
          <div className="h-5 w-16 skeleton rounded-full" />
          <div className="h-5 w-20 skeleton rounded-full" />
          <div className="h-5 w-14 skeleton rounded-full" />
        </div>
        <div className="flex gap-2 pt-1 border-t border-border">
          <div className="h-8 flex-1 skeleton rounded-lg" />
          <div className="h-8 w-8 skeleton rounded-lg" />
          <div className="h-8 w-8 skeleton rounded-lg" />
        </div>
      </div>
    </div>
  );
}