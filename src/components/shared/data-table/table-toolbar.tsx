"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, X, RotateCcw, Download } from "lucide-react";
import { type ReactNode } from "react";

export interface ActiveFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

interface TableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  activeFilters?: ActiveFilter[];
  onClearAllFilters?: () => void;
  onExportCSV?: () => void;
  exportLabel?: string;
  className?: string;
  children?: ReactNode;
}

export function TableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  activeFilters = [],
  onClearAllFilters,
  onExportCSV,
  exportLabel = "Export CSV",
  className,
  children,
}: TableToolbarProps) {
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div
      className={cn(
        "sticky top-0 z-20 bg-card",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 border-b border-border">
        {/* Search input */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-muted/50 pl-10 pr-8 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Search table"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action bar (filters, column toggle, export) */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {children}

          {hasActiveFilters && onClearAllFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Clear
            </Button>
          )}

          {onExportCSV && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCSV}
              aria-label={exportLabel}
            >
              <Download className="mr-2 h-4 w-4" />
              {exportLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border flex-wrap">
          {activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
            >
              {filter.label}
              <button
                onClick={filter.onRemove}
                className="ml-0.5 rounded-full p-0.5 hover:bg-primary/10 transition-colors"
                aria-label={`Remove filter: ${filter.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {onClearAllFilters && (
            <button
              onClick={onClearAllFilters}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-2"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}