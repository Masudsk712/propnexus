"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import {
  Building2,
  DollarSign,
  AlertCircle,
  Home,
  Percent,
} from "lucide-react";

interface PropertyStatsBarProps {
  properties: {
    id: string;
    type: string;
    status: string;
    rent: number;
    bedrooms?: number | null;
    bathrooms?: number | null;
    area?: number | null;
    units?: number;
    occupiedUnits?: number;
    monthlyRevenue?: number;
  }[];
  className?: string;
}

export function PropertyStatsBar({ properties, className }: PropertyStatsBarProps) {
  if (properties.length === 0) return null;

  const totalProperties = properties.length;
  const totalUnits = properties.reduce((sum, p) => sum + (p.units ?? 0), 0);
  const totalOccupiedUnits = properties.reduce(
    (sum, p) => sum + (p.occupiedUnits ?? 0),
    0,
  );
  const occupancyRate =
    totalUnits > 0 ? Math.round((totalOccupiedUnits / totalUnits) * 100) : 0;
  const totalMonthlyRevenue = properties.reduce(
    (sum, p) => sum + (p.monthlyRevenue ?? 0),
    0,
  );
  const vacantCount = properties.filter((p) => p.status === "vacant").length;
  const maintenanceCount = properties.filter(
    (p) => p.status === "maintenance",
  ).length;

  const stats = [
    {
      label: "Total Properties",
      value: totalProperties,
      icon: Building2,
      color: "from-blue-500/20 to-blue-600/5 text-blue-600 dark:text-blue-400",
      gradient: "gradient-occupancy",
    },
    {
      label: "Occupancy Rate",
      value: `${occupancyRate}%`,
      icon: Percent,
      color:
        occupancyRate > 80
          ? "from-emerald-500/20 to-emerald-600/5 text-emerald-600 dark:text-emerald-400"
          : occupancyRate > 40
            ? "from-amber-500/20 to-amber-600/5 text-amber-600 dark:text-amber-400"
            : "from-red-500/20 to-red-600/5 text-red-600 dark:text-red-400",
      gradient: "gradient-occupancy",
    },
    {
      label: "Monthly Revenue",
      value: formatCurrency(totalMonthlyRevenue),
      icon: DollarSign,
      color: "from-emerald-500/20 to-emerald-600/5 text-emerald-600 dark:text-emerald-400",
      gradient: "gradient-revenue",
    },
    {
      label: "Vacant",
      value: vacantCount,
      icon: Home,
      color: "from-red-500/20 to-red-600/5 text-red-600 dark:text-red-400",
      gradient: "gradient-maintenance",
    },
    {
      label: "Maintenance",
      value: maintenanceCount,
      icon: AlertCircle,
      color: "from-amber-500/20 to-amber-600/5 text-amber-600 dark:text-amber-400",
      gradient: "gradient-maintenance",
    },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3",
        className,
      )}
    >
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35, ease: "easeOut" }}
          className={cn(
            "relative overflow-hidden rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/20 transition-all duration-300",
          )}
        >
          {/* Background gradient accent */}
          <div
            className={cn(
              "absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10 bg-gradient-to-br",
              stat.gradient,
            )}
          />

          <div className="relative z-10 space-y-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
              stat.color.split(" ")[0],
              stat.color.split(" ")[1],
            )}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold tracking-tight mt-0.5">
                {stat.value}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
