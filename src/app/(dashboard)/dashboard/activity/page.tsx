"use client";

import { useDashboard } from "@/hooks/useApi";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useState } from "react";
import { Activity } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const typeColors: Record<string, "success" | "warning" | "destructive" | "info" | "secondary"> = {
  booking: "info", maintenance: "warning", property: "success", payment: "success", user: "secondary", system: "secondary",
};

export default function ActivityPage() {
  const { data, isLoading } = useDashboard();
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const activities = data?.recentActivity ?? [];
  const filtered = typeFilter === "all" ? activities : activities.filter((a) => a.type === typeFilter);

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-48" /><div className="space-y-3">{[1,2,3,4,5,6,7,8].map((i) => (<Skeleton key={i} className="h-16 rounded-xl" />))}</div></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Activity Feed</h1>
        <p className="text-muted-foreground mt-1">Real-time activity across your portfolio</p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {["all", "booking", "maintenance", "property", "payment", "user"].map((t) => (
          <Button key={t} variant={typeFilter === t ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(t)} className="capitalize whitespace-nowrap">{t}</Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No activity found</p>
          </div>
        ) : (
          filtered.map((act, index) => (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
            >
              <img src={act.userAvatar ?? undefined} alt={act.userName} className="h-10 w-10 rounded-full object-cover ring-2 ring-border" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{act.userName}</span>{" "}
                  <span className="text-muted-foreground">{act.action}</span>{" "}
                  <span className="font-medium">{act.target}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(act.createdAt)}</p>
              </div>
              <Badge variant={typeColors[act.type]} className="text-xs capitalize">{act.type}</Badge>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}