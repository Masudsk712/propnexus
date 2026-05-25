"use client";

import { maintenanceRequests } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Wrench, Plus, Search, Filter, AlertCircle, CheckCircle2,
  Clock, DollarSign, ChevronRight, Building2, ArrowUpDown,
} from "lucide-react";
import { formatCurrency, formatTimeAgo } from "@/lib/utils";
import Link from "next/link";

const priorityColors: Record<string, string> = {
  emergency: "bg-red-500/10 text-red-500 border-red-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const statusColors: Record<string, "success" | "warning" | "destructive" | "info" | "secondary"> = {
  open: "info", "in-progress": "warning", resolved: "success", closed: "secondary",
};

const categoryIcons: Record<string, React.ElementType> = {
  plumbing: Wrench, electrical: Wrench, hvac: Wrench,
  structural: Building2, appliance: Wrench, pest: AlertCircle, other: Wrench,
};

export default function MaintenancePage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => { setTimeout(() => setLoading(false), 600); }, []);

  const filtered = maintenanceRequests.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.propertyName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-48" /><div className="space-y-3">{[1,2,3,4,5].map((i) => (<Skeleton key={i} className="h-20 rounded-xl" />))}</div></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Maintenance Requests</h1>
          <p className="text-muted-foreground mt-1">Track and manage maintenance across all properties</p>
        </div>
        <Link href="/maintenance/create"><Button><Plus className="mr-2 h-4 w-4" /> New Request</Button></Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Search requests..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-muted/50 pl-10 pr-4 text-sm" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {["all", "open", "in-progress", "resolved", "closed"].map((s) => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="capitalize whitespace-nowrap">
              {s === "in-progress" ? "In Progress" : s}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((req) => {
          const Icon = categoryIcons[req.category] || Wrench;
          return (
            <motion.div
              key={req.id}
              whileHover={{ x: 4 }}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
            >
              <div className={`rounded-full p-2.5 ${priorityColors[req.priority]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{req.title}</p>
                  <Badge variant={statusColors[req.status]} className="text-xs capitalize">{req.status}</Badge>
                  <Badge variant="secondary" className="text-xs">{req.priority}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {req.propertyName} • Unit {req.unit} • {req.category}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <Clock className="h-3 w-3" /> {formatTimeAgo(req.createdAt)}
                  {req.assignedTo && <><span>•</span> Assigned to <span className="font-medium">{req.assignedTo}</span></>}
                </p>
              </div>
              <div className="text-right hidden sm:block">
                {req.cost && <p className="font-semibold">{formatCurrency(req.cost)}</p>}
                <p className="text-xs text-muted-foreground">Req. by {req.requestedBy}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <CheckCircle2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No requests found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}