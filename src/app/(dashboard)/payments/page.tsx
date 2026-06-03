"use client";

import { payments } from "@/data/mock";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DollarSign,
  CreditCard,
  Download,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import Link from "next/link";
import type { Payment } from "@/types";

// ── Status colors ─────────────────────────────────────────────────────────────
const statusColors: Record<string, BadgeProps["variant"]> = {
  completed: "success",
  pending: "warning",
  failed: "destructive",
  refunded: "info",
};

const typeIcons: Record<string, React.ElementType> = {
  rent: DollarSign,
  deposit: CreditCard,
  fee: AlertCircle,
  refund: CheckCircle2,
};

// ── Column definitions ────────────────────────────────────────────────────────
const columns: Column<Payment>[] = [
  {
    key: "description",
    header: "Description",
    sortable: true,
    sortKey: "description",
    accessor: (p) => {
      const Icon = typeIcons[p.type] || DollarSign;
      return (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "rounded-full p-2 flex-shrink-0",
              p.status === "completed"
                ? "bg-emerald-500/10 text-emerald-500"
                : p.status === "pending"
                  ? "bg-amber-500/10 text-amber-500"
                  : p.status === "failed"
                    ? "bg-red-500/10 text-red-500"
                    : "bg-blue-500/10 text-blue-500"
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">
              {p.description || p.type}
            </p>
            <p className="text-xs text-muted-foreground">
              {p.method?.replace("_", " ")} · {p.id}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    key: "amount",
    header: "Amount",
    sortable: true,
    sortKey: "amount",
    className: "text-right",
    headerClassName: "text-right",
    accessor: (p) => (
      <div className="text-right">
        <p
          className={cn(
            "font-bold",
            p.status === "failed" ? "text-destructive" : "text-foreground"
          )}
        >
          {formatCurrency(p.amount)}
        </p>
        <p className="text-xs text-muted-foreground capitalize">{p.type}</p>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    sortKey: "status",
    accessor: (p) => (
      <Badge
        variant={statusColors[p.status] ?? "secondary"}
        className="text-xs capitalize"
      >
        {p.status}
      </Badge>
    ),
  },
  {
    key: "dueDate",
    header: "Dates",
    sortable: true,
    sortKey: "dueDate",
    accessor: (p) => (
      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3 w-3" />
          {formatDate(p.createdAt)}
        </span>
        {p.paidAt && (
          <span className="flex items-center gap-1 text-emerald-500">
            <CheckCircle2 className="h-3 w-3" />
            Paid {formatDate(p.paidAt)}
          </span>
        )}
        {p.dueDate && !p.paidAt && (
          <span
            className={cn(
              "flex items-center gap-1",
              p.status === "pending" ? "text-amber-500" : ""
            )}
          >
            <Clock className="h-3 w-3" />
            Due {formatDate(p.dueDate)}
          </span>
        )}
      </div>
    ),
    hideOnMobile: true,
  },
];

// ── Stats Overview ────────────────────────────────────────────────────────────
function StatsOverview() {
  const totalRevenue = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const stats = useMemo(
    () => [
      {
        label: "Total Collected",
        value: formatCurrency(totalRevenue),
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
      },
      {
        label: "Pending",
        value: formatCurrency(pendingAmount),
        color: "text-amber-500",
        bg: "bg-amber-500/10",
      },
      {
        label: "Completed",
        value: `${payments.filter((p) => p.status === "completed").length} txns`,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
      },
      {
        label: "Failed",
        value: `${payments.filter((p) => p.status === "failed").length} txns`,
        color: "text-red-500",
        bg: "bg-red-500/10",
      },
    ],
    [totalRevenue, pendingAmount]
  );

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className={cn("rounded-lg p-2 inline-flex", stat.bg)}>
            <DollarSign className={cn("h-4 w-4", stat.color)} />
          </div>
          <p className="text-2xl font-bold mt-2">{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  const filterBtns = useMemo(
    () => ["all", "completed", "pending", "failed", "refunded"],
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
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Payments
          </h1>
          <p className="text-muted-foreground mt-1">
            Track rent payments, deposits, and fees
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={payments}
        keyExtractor={(p) => p.id}
        isLoading={loading}
        emptyState={{
          icon: DollarSign,
          title: "No payments found",
          description: "Payments will appear here once recorded.",
        }}
        searchPlaceholder="Search payments by description or ID..."
        showExport
        exportFileName="payments"
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
        rowActions={(p) => (
          <Link href={`/payments/${p.id}`}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`View payment ${p.id}`}
            >
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