"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PropertyCard } from "@/components/properties/property-card";
import { PropertyCardSkeleton } from "@/components/properties/property-card-skeleton";
import { PropertyFilters, FilterOptions } from "@/components/properties/property-filters";
import { PropertyStatsBar } from "@/components/properties/property-stats-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  RefreshCw,
  X,
  Trash2,
  CheckSquare,
  XSquare,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    type: "",
    status: "",
    sortBy: "newest",
  });

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/properties");
      const result = await res.json();
      if (!result.success) {
        setError(result.error ?? "Failed to load properties");
        return;
      }
      setProperties(result.data ?? []);
    } catch {
      setError("Failed to fetch properties. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Filtered + sorted properties
  const filtered = useMemo(() => {
    return properties
      .filter((p) => {
        const matchesSearch =
          (p.title ?? "").toLowerCase().includes(filters.search.toLowerCase()) ||
          (p.name ?? "").toLowerCase().includes(filters.search.toLowerCase()) ||
          (p.address ?? "").toLowerCase().includes(filters.search.toLowerCase()) ||
          (p.city ?? "").toLowerCase().includes(filters.search.toLowerCase());
        const matchesType = !filters.type || p.type === filters.type;
        const matchesStatus = !filters.status || p.status === filters.status;
        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case "oldest":
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case "rent-high":
            return (b.rent ?? 0) - (a.rent ?? 0);
          case "rent-low":
            return (a.rent ?? 0) - (b.rent ?? 0);
          case "name":
            return (a.title ?? "").localeCompare(b.title ?? "");
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [properties, filters]);

  const hasActiveFilters = filters.search || filters.type || filters.status;

  // Handlers
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.error ?? "Failed to delete property");
        return;
      }
      toast.success("Property deleted successfully");
      setProperties((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error("Failed to delete property");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filtered.map((p) => p.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected properties? This cannot be undone.`)) return;

    setBulkDeleting(true);
    let successCount = 0;
    const ids = Array.from(selectedIds);

    for (const id of ids) {
      try {
        const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
        const result = await res.json();
        if (result.success) successCount++;
      } catch {
        // continue
      }
    }

    toast.success(`${successCount} of ${ids.length} properties deleted`);
    setBulkDeleting(false);
    setSelectionMode(false);
    setSelectedIds(new Set());
    fetchProperties();
  };

  const clearFilters = () => {
    setFilters({ search: "", type: "", status: "", sortBy: "newest" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Properties
          </h1>
          <p className="text-muted-foreground mt-1">
            {loading
              ? "Loading..."
              : `${filtered.length} of ${properties.length} properties`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectionMode ? (
            <>
              <Button variant="outline" size="sm" onClick={selectAll}>
                <CheckSquare className="mr-1.5 h-4 w-4" />
                Select All ({filtered.length})
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                <XSquare className="mr-1.5 h-4 w-4" />
                Deselect
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0 || bulkDeleting}
              >
                {bulkDeleting ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-1.5 h-4 w-4" />
                )}
                Delete ({selectedIds.size})
              </Button>
              <Button variant="ghost" size="sm" onClick={cancelSelection}>
                <X className="mr-1.5 h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectionMode(true)}
                disabled={loading || filtered.length === 0}
              >
                <CheckSquare className="mr-1.5 h-4 w-4" />
                Select
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchProperties}
                disabled={loading}
              >
                <RefreshCw
                  className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Link href="/properties/add">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Property
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      {!loading && properties.length > 0 && (
        <PropertyStatsBar properties={properties} />
      )}

      {/* Filters */}
      <PropertyFilters
        filters={filters}
        onFiltersChange={setFilters}
        view={view}
        onViewChange={setView}
      />

      {/* Content */}
      {loading ? (
        <div
          className={
            view === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
          }
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <PropertyCardSkeleton key={i} view={view} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-12 text-center">
          <div className="rounded-full bg-destructive/10 p-3 w-fit mx-auto mb-4">
            <Building2 className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Failed to Load Properties
          </h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={fetchProperties}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={
            hasActiveFilters
              ? "No properties match your filters"
              : "No Properties Yet"
          }
          description={
            hasActiveFilters
              ? "Try adjusting your search or filter criteria."
              : "Get started by adding your first property."
          }
          action={
            hasActiveFilters
              ? { label: "Clear Filters", onClick: clearFilters }
              : undefined
          }
        />
      ) : (
        <div
          className={
            view === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
          }
        >
          {filtered.map((property, index) => (
            <PropertyCard
              key={property.id}
              property={property}
              view={view}
              onDelete={selectionMode ? undefined : handleDelete}
              index={index}
              selectionMode={selectionMode}
              selected={selectedIds.has(property.id)}
              onSelect={toggleSelect}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}