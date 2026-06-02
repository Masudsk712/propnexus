"use client";

import { tenants } from "@/data/mock";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  Plus,
  Home,
  CalendarDays,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import Link from "next/link";
import type { Tenant } from "@/types";

// ── Status colors for badges ──────────────────────────────────────────────────
const statusColors: Record<string, BadgeProps["variant"]> = {
  active: "success",
  pending: "warning",
  expired: "secondary",
  evicted: "destructive",
};

// ── Column definitions ────────────────────────────────────────────────────────
const columns: Column<Tenant>[] = [
  {
    key: "name",
    header: "Tenant",
    sortable: true,
    sortKey: "name",
    accessor: (t) => (
      <div className="flex items-center gap-3">
        <img
          src={
            t.user?.image ??
            "https://ui-avatars.com/api/?name=" + (t.user?.name || "U") + "&background=6366f1&color=fff"
          }
          alt={t.user?.name ?? "Tenant"}
          className="h-9 w-9 rounded-full object-cover ring-2 ring-border flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{t.user?.name ?? "Unknown"}</p>
          <p className="text-xs text-muted-foreground truncate">{t.user?.email ?? ""}</p>
        </div>
      </div>
    ),
  },
  {
    key: "property",
    header: "Property / Unit",
    sortable: true,
    sortKey: "property",
    accessor: (t) => (
      <div className="flex items-center gap-1.5 text-sm">
        <Home className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <span className="truncate">
          {t.property?.name ?? "—"} · {t.unit}
        </span>
      </div>
    ),
    hideOnMobile: true,
  },
  {
    key: "rent",
    header: "Rent",
    sortable: true,
    sortKey: "rent",
    className: "text-right",
    headerClassName: "text-right",
    accessor: (t) => (
      <span className="font-medium text-sm">{formatCurrency(t.rentAmount)}/mo</span>
    ),
    hideOnMobile: true,
  },
  {
    key: "lease",
    header: "Lease",
    sortable: true,
    sortKey: "lease",
    accessor: (t) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="whitespace-nowrap">
          {formatDate(t.leaseStart)} – {formatDate(t.leaseEnd)}
        </span>
      </div>
    ),
    hideOnMobile: true,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    sortKey: "status",
    accessor: (t) => (
      <Badge variant={statusColors[t.status] ?? "secondary"} className="capitalize">
        {t.status}
      </Badge>
    ),
  },
];

// ── Stats Overview ────────────────────────────────────────────────────────────
function StatsOverview() {
  const stats = useMemo(
    () => [
      { label: "Total", value: tenants.length, color: "text-blue-500", bg: "bg-blue-500/10" },
      {
        label: "Active",
        value: tenants.filter((t) => t.status === "active").length,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
      },
      {
        label: "Pending",
        value: tenants.filter((t) => t.status === "pending").length,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
      },
      {
        label: "Expired",
        value: tenants.filter((t) => t.status === "expired" || t.status === "evicted").length,
        color: "text-red-500",
        bg: "bg-red-500/10",
      },
    ],
    []
  );

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
          <div className={cn("rounded-lg p-2 inline-flex", stat.bg)}>
            <Users className={cn("h-4 w-4", stat.color)} />
          </div>
          <p className="text-2xl font-bold mt-2">{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TenantsPage() {
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  const filterBtns = useMemo(
    () => ["all", "active", "pending", "expired"],
    []
  );

  const activeFilters = useMemo(() => {
    if (statusFilter === "all") return [];
    return [
      {
        key: "status",
        label: `Status: ${statusFilter}`,
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
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground mt-1">
            Manage tenant information and lease agreements
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      {/* Stats Overview */}
      <StatsOverview />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={tenants}
        keyExtractor={(t) => t.id}
        isLoading={loading}
        emptyState={{
          icon: Users,
          title: "No tenants found",
          description: "Start by adding your first tenant to the system.",
        }}
        searchPlaceholder="Search tenants by name, email, unit..."
        showExport
        exportFileName="tenants"
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
                {s}
              </Button>
            ))}
          </div>
        }
        rowActions={(t) => (
          <Link href={`/tenants/${t.id}`}>
            <Button variant="ghost" size="icon-sm" aria-label={`View ${t.user?.name ?? "tenant"}`}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
        pageSize={10}
        pageSizeOptions={[5, 10, 25, 50]}
      />
    </motion.div>
  );
}