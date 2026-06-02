"use client";

import { maintenanceRequests } from "@/data/mock";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Wrench,
  Plus,
  AlertCircle,
  Clock,
  DollarSign,
  ChevronRight,
  Building2,
} from "lucide-react";
import { formatCurrency, formatTimeAgo, cn } from "@/lib/utils";
import Link from "next/link";
import type { MaintenanceRequest } from "@/types";

// ── Priority style maps ───────────────────────────────────────────────────────
const priorityColors: Record<string, string> = {
  emergency: "bg-red-500/10 text-red-500 border-red-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const statusColors: Record<string, BadgeProps["variant"]> = {
  open: "info",
  "in-progress": "warning",
  resolved: "success",
  closed: "secondary",
};

const categoryIcons: Record<string, React.ElementType> = {
  plumbing: Wrench,
  electrical: Wrench,
  hvac: Wrench,
  structural: Building2,
  appliance: Wrench,
  pest: AlertCircle,
  other: Wrench,
};

// ── Column definitions ────────────────────────────────────────────────────────
const columns: Column<MaintenanceRequest>[] = [
  {
    key: "title",
    header: "Request",
    sortable: true,
    sortKey: "title",
    accessor: (r) => {
      const Icon = categoryIcons[r.category] || Wrench;
      return (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "rounded-full p-2 flex-shrink-0",
              priorityColors[r.priority]
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{r.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {r.propertyName} · Unit {r.unit} · {r.category}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    key: "priority",
    header: "Priority",
    sortable: true,
    sortKey: "priority",
    accessor: (r) => (
      <Badge variant="secondary" className="text-xs capitalize">
        {r.priority}
      </Badge>
    ),
    hideOnMobile: true,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    sortKey: "status",
    accessor: (r) => (
      <Badge variant={statusColors[r.status] ?? "secondary"} className="text-xs capitalize">
        {r.status === "in-progress" ? "In Progress" : r.status}
      </Badge>
    ),
  },
  {
    key: "assigned",
    header: "Assigned To",
    sortable: true,
    sortKey: "assigned",
    accessor: (r) => (
      <span className="text-sm text-muted-foreground">
        {r.assignedTo ?? "—"}
      </span>
    ),
    hideOnMobile: true,
  },
  {
    key: "cost",
    header: "Cost",
    sortable: true,
    sortKey: "cost",
    className: "text-right",
    headerClassName: "text-right",
    accessor: (r) => (
      <span className="font-medium text-sm">
        {r.cost ? formatCurrency(r.cost) : "—"}
      </span>
    ),
    hideOnMobile: true,
  },
  {
    key: "date",
    header: "Created",
    sortable: true,
    sortKey: "date",
    accessor: (r) => (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span>{formatTimeAgo(r.createdAt)}</span>
      </div>
    ),
    hideOnMobile: true,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MaintenancePage() {
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  const filterBtns = useMemo(
    () => ["all", "open", "in-progress", "resolved", "closed"],
    []
  );

  const activeFilters = useMemo(() => {
    if (statusFilter === "all") return [];
    return [
      {
        key: "status",
        label: `Status: ${statusFilter === "in-progress" ? "In Progress" : statusFilter}`,
        onRemove: () => setStatusFilter("all"),
      },
    ];
  }, [statusFilter]);

  const clearFilters = useCallback(() => {
    setStatusFilter("all");
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Maintenance Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage maintenance across all properties
          </p>
        </div>
        <Link href="/maintenance/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Request
          </Button>
        </Link>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={maintenanceRequests}
        keyExtractor={(r) => r.id}
        isLoading={loading}
        emptyState={{
          icon: Wrench,
          title: "No maintenance requests",
          description: "All properties are running smoothly.",
        }}
        searchPlaceholder="Search requests by title, property..."
        showExport
        exportFileName="maintenance"
        enableRowSelection
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        activeFilters={activeFilters}
        onClearAllFilters={clearFilters}
        toolbarChildren={
          <div className="flex gap-2">
            {filterBtns.map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
                className="capitalize whitespace-nowrap"
              >
                {s === "in-progress" ? "In Progress" : s}
              </Button>
            ))}
          </div>
        }
        rowActions={(r) => (
          <Link href={`/maintenance/${r.id}`}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`View ${r.title}`}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
        pageSize={10}
        pageSizeOptions={[10, 25, 50]}
      />
    </motion.div>
  );
}