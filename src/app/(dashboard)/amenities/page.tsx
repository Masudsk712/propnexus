"use client";

import { useAmenities } from "@/hooks/useApi";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { motion } from "framer-motion";
import { useState, useMemo, useCallback } from "react";
import {
  Sparkles,
  Clock,
  Users,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Amenity } from "@/types";

// ── Status colors ─────────────────────────────────────────────────────────────
const statusColors: Record<string, BadgeProps["variant"]> = {
  available: "success",
  maintenance: "warning",
  closed: "destructive",
};

// ── Column definitions ────────────────────────────────────────────────────────
const columns: Column<Amenity>[] = [
  {
    key: "name",
    header: "Amenity",
    sortable: true,
    sortKey: "name",
    accessor: (a) => (
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-border">
          <img
            src={a.image ?? undefined}
            alt={a.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{a.name}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {a.description}
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
    accessor: (a) => (
      <Badge variant="secondary" className="capitalize text-xs">
        {a.type}
      </Badge>
    ),
  },
  {
    key: "capacity",
    header: "Capacity",
    sortable: true,
    sortKey: "capacity",
    accessor: (a) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        <span>{a.capacity}</span>
      </div>
    ),
    hideOnMobile: true,
  },
  {
    key: "hours",
    header: "Hours",
    sortable: false,
    accessor: (a) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span className="whitespace-nowrap">
          {a.openTime} – {a.closeTime}
        </span>
      </div>
    ),
    hideOnMobile: true,
  },
  {
    key: "booking",
    header: "Booking",
    sortable: true,
    sortKey: "booking",
    accessor: (a) => (
      <span className="text-sm text-muted-foreground">
        {a.requiresBooking ? "Required" : "Open"}
      </span>
    ),
    hideOnMobile: true,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    sortKey: "status",
    accessor: (a) => (
      <Badge
        variant={statusColors[a.status] ?? "secondary"}
        className="capitalize text-xs"
      >
        {a.status}
      </Badge>
    ),
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AmenitiesPage() {
  const { data: amenities, isLoading } = useAmenities();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const amenityList = Array.isArray(amenities) ? amenities : [];

  const filterBtns = useMemo(
    () => [
      "all",
      "pool",
      "gym",
      "clubhouse",
      "bbq",
      "playground",
      "parking",
      "rooftop",
      "lounge",
    ],
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
            Amenities
          </h1>
          <p className="text-muted-foreground mt-1">
            Explore and book shared amenities
          </p>
        </div>
        <Link href="/amenities/bookings">
          <Button variant="outline">
            <CalendarDays className="mr-2 h-4 w-4" /> View Bookings
          </Button>
        </Link>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={amenityList}
        keyExtractor={(a) => a.id}
        isLoading={isLoading}
        emptyState={{
          icon: Sparkles,
          title: "No amenities found",
          description: "Amenities will be listed here once added to properties.",
        }}
        searchPlaceholder="Search amenities by name or description..."
        showExport
        exportFileName="amenities"
        enableRowSelection
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        activeFilters={activeFilters}
        onClearAllFilters={clearFilters}
        showColumnToggle
        toolbarChildren={
          <div className="flex gap-2 flex-wrap">
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
        rowActions={(a) =>
          a.requiresBooking ? (
            <Button variant="outline" size="sm" aria-label={`Book ${a.name}`}>
              Book <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Link href={`/amenities/${a.id}`}>
              <Button variant="ghost" size="icon-sm" aria-label={`View ${a.name}`}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )
        }
        pageSize={10}
        pageSizeOptions={[10, 25, 50]}
      />
    </motion.div>
  );
}