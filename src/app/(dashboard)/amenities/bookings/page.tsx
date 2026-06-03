"use client";

import { useBookings } from "@/hooks/useApi";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { motion } from "framer-motion";
import { useState, useMemo, useCallback } from "react";
import {
  CalendarDays,
  Clock,
  Users,
  MapPin,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Booking } from "@/types";

// ── Status colors ─────────────────────────────────────────────────────────────
const statusColors: Record<string, BadgeProps["variant"]> = {
  confirmed: "success",
  pending: "warning",
  cancelled: "destructive",
  completed: "info",
};

// ── Column definitions ────────────────────────────────────────────────────────
const columns: Column<Booking>[] = [
  {
    key: "amenity",
    header: "Booking",
    sortable: true,
    sortKey: "amenity",
    accessor: (b) => (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 flex-shrink-0">
          <CalendarDays className="h-5 w-5 text-violet-500" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{b.amenityName}</p>
          <p className="text-xs text-muted-foreground">
            <MapPin className="inline h-3 w-3 mr-0.5" />
            {b.propertyName}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "user",
    header: "User",
    sortable: true,
    sortKey: "user",
    accessor: (b) => (
      <div className="flex items-center gap-1.5 text-sm">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{b.userName}</span>
      </div>
    ),
    hideOnMobile: true,
  },
  {
    key: "dateTime",
    header: "Date & Time",
    sortable: true,
    sortKey: "date",
    accessor: (b) => (
      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3 w-3" />
          {formatDate(b.date)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {b.startTime} – {b.endTime}
        </span>
      </div>
    ),
    hideOnMobile: true,
  },
  {
    key: "guests",
    header: "Guests",
    sortable: true,
    sortKey: "guests",
    className: "text-right",
    headerClassName: "text-right",
    accessor: (b) => (
      <span className="text-sm font-medium">
        {b.guestCount ? `${b.guestCount}` : "—"}
      </span>
    ),
    hideOnMobile: true,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    sortKey: "status",
    accessor: (b) => (
      <Badge
        variant={statusColors[b.status] ?? "secondary"}
        className="text-xs capitalize"
      >
        {b.status}
      </Badge>
    ),
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const { data: bookings, isLoading } = useBookings();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const bookingList = Array.isArray(bookings) ? bookings : [];

  const filterBtns = useMemo(
    () => ["all", "confirmed", "pending", "completed", "cancelled"],
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
            Amenity Bookings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all amenity reservations
          </p>
        </div>
        <Link href="/amenities">
          <Button variant="outline">
            <Sparkles className="mr-2 h-4 w-4" /> All Amenities
          </Button>
        </Link>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={bookingList}
        keyExtractor={(b) => b.id}
        isLoading={isLoading}
        emptyState={{
          icon: CalendarDays,
          title: "No bookings found",
          description: "Amenity bookings will appear here once created.",
        }}
        searchPlaceholder="Search bookings by amenity, property, or user..."
        showExport
        exportFileName="bookings"
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
        rowActions={(b) => (
          <Link href={`/amenities/bookings/${b.id}`}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`View booking ${b.id}`}
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