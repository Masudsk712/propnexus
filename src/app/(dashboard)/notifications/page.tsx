"use client";

import { useNotifications } from "@/hooks/useApi";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  XCircle,
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { useNotificationStore } from "@/store";
import type { Notification } from "@/types";

// ── Type colors for icon background ───────────────────────────────────────────
const typeColors: Record<string, string> = {
  error: "text-destructive bg-destructive/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
  info: "text-info bg-info/10",
};

const typeIcons: Record<string, React.ElementType> = {
  error: XCircle,
  success: CheckCircle2,
  warning: AlertCircle,
  info: Info,
};

const typeBadgeVariant: Record<string, BadgeProps["variant"]> = {
  error: "destructive",
  success: "success",
  warning: "warning",
  info: "info",
};

// ── Column definitions ────────────────────────────────────────────────────────
const columns: Column<Notification>[] = [
  {
    key: "title",
    header: "Notification",
    sortable: true,
    sortKey: "title",
    accessor: (n) => (
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-1.5">
          <div
            className={`rounded-full p-2 flex-shrink-0 ${typeColors[n.type]}`}
          >
            {(() => {
              const Icon = typeIcons[n.type] || Info;
              return <Icon className="h-4 w-4" />;
            })()}
          </div>
          {!n.read && (
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
          )}
        </div>
        <div className="min-w-0">
          <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>
            {n.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {n.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatTimeAgo(n.createdAt)}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "type",
    header: "Type",
    sortable: true,
    sortKey: "type",
    accessor: (n) => (
      <Badge variant={typeBadgeVariant[n.type] ?? "secondary"} className="text-xs capitalize">
        {n.type}
      </Badge>
    ),
    hideOnMobile: true,
  },
  {
    key: "read",
    header: "Read",
    sortable: true,
    sortKey: "read",
    accessor: (n) => (
      <Badge variant={n.read ? "secondary" : "default"} className="text-xs">
        {n.read ? "Read" : "Unread"}
      </Badge>
    ),
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { data: apiNotifications, isLoading } = useNotifications();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const { markAsRead, markAllAsRead, setNotifications } = useNotificationStore();

  // Sync API data into store
  useEffect(() => {
    if (apiNotifications && Array.isArray(apiNotifications)) {
      setNotifications(apiNotifications);
    }
  }, [apiNotifications, setNotifications]);

  const notifs = useNotificationStore((s) => s.notifications);

  const filterBtns = useMemo(
    () => ["all", "info", "warning", "success", "error"],
    []
  );

  const activeFilters = useMemo(() => {
    if (typeFilter === "all") return [];
    return [
      {
        key: "type",
        label: `Type: ${typeFilter}`,
        onRemove: () => setTypeFilter("all"),
      },
    ];
  }, [typeFilter]);

  const clearFilters = useCallback(() => {
    setTypeFilter("all");
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
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with the latest alerts and updates
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
          <CheckCircle2 className="mr-2 h-4 w-4" /> Mark All Read
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={notifs}
        keyExtractor={(n) => n.id}
        isLoading={isLoading}
        emptyState={{
          icon: Bell,
          title: "No notifications",
          description: "You're all caught up!",
        }}
        searchPlaceholder="Search notifications by title or message..."
        showExport
        exportFileName="notifications"
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
                variant={typeFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(s)}
                className="capitalize whitespace-nowrap"
              >
                {s}
              </Button>
            ))}
          </div>
        }
        onRowClick={(n) => markAsRead(n.id)}
        pageSize={10}
        pageSizeOptions={[10, 25, 50]}
      />
    </motion.div>
  );
}