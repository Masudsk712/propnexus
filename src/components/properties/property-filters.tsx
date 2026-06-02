"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  X,
  Grid3X3,
  List,
  ArrowUpDown,
  SlidersHorizontal,
} from "lucide-react";

export interface FilterOptions {
  search: string;
  type: string;
  status: string;
  sortBy: string;
}

interface PropertyFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  className?: string;
}

const typeOptions = [
  { value: "", label: "All Types" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "commercial", label: "Commercial" },
  { value: "townhouse", label: "Townhouse" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "vacant", label: "Vacant" },
  { value: "occupied", label: "Occupied" },
  { value: "maintenance", label: "Maintenance" },
  { value: "listed", label: "Listed" },
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "rent-high", label: "Rent: High to Low" },
  { value: "rent-low", label: "Rent: Low to High" },
  { value: "name", label: "Name: A-Z" },
];

export function PropertyFilters({
  filters,
  onFiltersChange,
  view,
  onViewChange,
  className,
}: PropertyFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const activeFilters =
    [filters.type, filters.status].filter(Boolean).length;

  const updateFilter = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAll = () => {
    onFiltersChange({
      search: "",
      type: "",
      status: "",
      sortBy: "newest",
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search + View Toggle Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search properties..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-muted/50 pl-10 pr-10 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter("search", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle + View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "inline-flex items-center gap-2 h-10 rounded-xl border px-4 text-sm font-medium transition-all duration-200",
              showFilters
                ? "bg-primary text-primary-foreground border-primary"
                : "border-input bg-transparent hover:bg-muted",
            )}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-medium",
                  showFilters
                    ? "bg-primary-foreground/20"
                    : "bg-primary/10 text-primary",
                )}
              >
                {activeFilters}
              </span>
            )}
          </button>

          {/* Grid / List Toggle */}
          <div className="flex rounded-xl border border-input bg-muted/50 p-1">
            <button
              onClick={() => onViewChange("grid")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                view === "grid"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewChange("list")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                view === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <SlidersHorizontal className="h-4 w-4" />
                  Advanced Filters
                </div>
                {activeFilters > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Clear All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Property Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Property Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => updateFilter("type", e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-muted/50 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {typeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => updateFilter("status", e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-muted/50 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <ArrowUpDown className="h-3 w-3" />
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => updateFilter("sortBy", e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-muted/50 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}