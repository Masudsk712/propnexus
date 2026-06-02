"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import type { LucideIcon } from "lucide-react";

// ── Mini Sparkline (simple SVG) ──────────────────────────────────────────
function MiniSparkline({
  data,
  height = 40,
  color = "var(--primary)",
  positive,
  gradientId,
}: {
  data: number[];
  height?: number;
  color?: string;
  positive?: boolean;
  gradientId?: string;
}) {
  if (!data || data.length < 2) return null;

  const width = 100;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const effectiveColor =
    positive === undefined ? color : positive ? "var(--success)" : "var(--destructive)";

  const gradId = gradientId ?? `spark-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={effectiveColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={effectiveColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#${gradId})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={effectiveColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Animated Counter ─────────────────────────────────────────────────────
function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 1.5,
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let frame: number;
    const end = value;
    const fps = 60;
    const totalFrames = duration * fps;
    const increment = end / totalFrames;
    let current = 0;
    let frameCount = 0;

    const tick = () => {
      frameCount++;
      current += increment;

      if (frameCount >= totalFrames) {
        setCount(end);
      } else {
        setCount(current);
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  const formatted = count.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────
interface KPICardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  sparklineData?: number[];
  variant?: "default" | "revenue" | "occupancy" | "maintenance" | "bookings" | "tenants" | "payments";
  className?: string;
  isLoading?: boolean;
}

const variantConfig: Record<string, { gradient: string; iconBg: string; iconColor: string }> = {
  default: {
    gradient: "from-primary/5 to-primary/0",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  revenue: {
    gradient: "from-emerald-500/5 to-emerald-500/0",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  occupancy: {
    gradient: "from-blue-500/5 to-violet-500/0",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  maintenance: {
    gradient: "from-amber-500/5 to-orange-500/0",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  bookings: {
    gradient: "from-violet-500/5 to-pink-500/0",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
  },
  tenants: {
    gradient: "from-cyan-500/5 to-blue-500/0",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-500",
  },
  payments: {
    gradient: "from-green-500/5 to-emerald-500/0",
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
  },
};

export function KPICard({
  title,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  icon: Icon,
  change,
  changeLabel,
  sparklineData,
  variant = "default",
  className,
  isLoading = false,
}: KPICardProps) {
  const config = variantConfig[variant] ?? variantConfig.default;
  const changeType = change === undefined ? "neutral" : change > 0 ? "up" : change < 0 ? "down" : "flat";

  if (isLoading) {
    return (
      <div className="kpi-card animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-11 w-11 rounded-xl bg-muted" />
          <div className="h-5 w-14 rounded-full bg-muted" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-8 w-32 rounded bg-muted" />
        </div>
        {sparklineData && <div className="mt-3 h-10 rounded bg-muted" />}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "kpi-card group",
        className
      )}
    >
      {/* Gradient accent top bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", config.gradient)} />

      <div className="kpi-card-content">
        <div className="flex items-center justify-between">
          {/* Icon */}
          <div
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300",
              config.iconBg,
              "group-hover:scale-110"
            )}
          >
            <Icon className={cn("h-5 w-5", config.iconColor)} />
          </div>

          {/* Trend Badge */}
          {change !== undefined && (
            <div
              className={cn(
                "kpi-trend-badge",
                changeType === "up" && "kpi-trend-up",
                changeType === "down" && "kpi-trend-down",
                changeType === "flat" && "bg-muted text-muted-foreground"
              )}
            >
              {changeType === "up" ? (
                <TrendingUp className="h-3 w-3" />
              ) : changeType === "down" ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {change > 0 ? "+" : ""}
              {Math.abs(change).toFixed(1)}%
              {changeLabel && (
                <span className="text-muted-foreground font-normal ml-0.5">{changeLabel}</span>
              )}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold tracking-tight mt-1">
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
          </p>
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length >= 2 && (
          <div className="kpi-sparkline">
            <MiniSparkline
              data={sparklineData}
              color="var(--primary)"
              positive={change === undefined ? undefined : change > 0}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}