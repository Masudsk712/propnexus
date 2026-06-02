"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

interface QuickAction {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  href: string;
}

interface QuickActionsPanelProps {
  actions: QuickAction[];
  isLoading?: boolean;
  className?: string;
  delay?: number;
}

const COLORS = [
  { iconBg: "bg-blue-500/10 text-blue-500", hover: "hover:border-blue-500/30" },
  { iconBg: "bg-emerald-500/10 text-emerald-500", hover: "hover:border-emerald-500/30" },
  { iconBg: "bg-amber-500/10 text-amber-500", hover: "hover:border-amber-500/30" },
  { iconBg: "bg-violet-500/10 text-violet-500", hover: "hover:border-violet-500/30" },
  { iconBg: "bg-rose-500/10 text-rose-500", hover: "hover:border-rose-500/30" },
  { iconBg: "bg-cyan-500/10 text-cyan-500", hover: "hover:border-cyan-500/30" },
];

export function QuickActionsPanel({ actions, isLoading, className, delay = 0 }: QuickActionsPanelProps) {
  if (isLoading) {
    return (
      <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-5 w-32 mt-3" />
            <Skeleton className="h-3 w-48 mt-1.5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {actions.map((action, index) => {
        const c = COLORS[index % COLORS.length];
        return (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + index * 0.05, duration: 0.3 }}
          >
            <Link href={action.href}>
              <div
                className={cn(
                  "group relative overflow-hidden rounded-xl border border-border bg-card p-5",
                  "transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1",
                  c.hover
                )}
              >
                <div className="relative z-10">
                  <div className={cn("inline-flex items-center justify-center w-10 h-10 rounded-xl transition-transform duration-300 group-hover:scale-110", c.iconBg)}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-3">
                    <h4 className="font-medium text-sm text-foreground">{action.title}</h4>
                    {action.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{action.description}</p>}
                  </div>
                  <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

export type { QuickAction, QuickActionsPanelProps };