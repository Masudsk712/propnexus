"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, useCallback, useMemo, type ReactNode, KeyboardEvent } from "react";
import {
  ChevronUp,
  ChevronDown,
  Inbox,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TableToolbar,
  type ActiveFilter,
} from "@/components/shared/data-table/table-toolbar";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import { TableColumnToggle } from "@/components/shared/data-table/table-column-toggle";
import { BulkActionBar } from "@/components/shared/data-table/bulk-action-bar";
import { TableEmptyState } from "@/components/shared/data-table/table-empty-state";

// ── Types ──────────────────────────────────────────────────────────────────
export interface Column<T = unknown> {
  key: string;
  header: string;
  accessor: (row: T) => ReactNode;
  sortable?: boolean;
  sortKey?: string;
  className?: string;
  headerClassName?: string;
  hideOnMobile?: boolean;
}

export interface DataTableProps<T = unknown> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyState?: {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  pageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showColumnToggle?: boolean;
  showExport?: boolean;
  exportFileName?: string;
  enableRowSelection?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedKeys: string[]) => void;
  bulkActions?: (selectedKeys: string[], clearSelection: () => void) => ReactNode;
  className?: string;
  activeFilters?: ActiveFilter[];
  onClearAllFilters?: () => void;
  toolbarChildren?: ReactNode;
}

type SortDirection = "asc" | "desc" | null;

// ── CSV Export Helper ───────────────────────────────────────────────────────
function exportToCSV<T>(
  data: T[],
  columns: Column<T>[],
  fileName: string
) {
  const headers = columns.map((c) => c.header).join(",");
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const val = col.accessor(row);
        if (val == null) return "";
        const str = typeof val === "object" ? String((val as ReactNode) ?? "") : String(val);
        // Strip JSX/HTML from ReactNode values for CSV
        const cleaned = str.replace(/<[^>]*>/g, "").replace(/"/g, '""');
        return `"${cleaned}"`;
      })
      .join(",")
  );
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Component ──────────────────────────────────────────────────────────────
export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyState,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onRowClick,
  rowActions,
  searchPlaceholder = "Search...",
  showSearch = true,
  showColumnToggle = false,
  showExport = false,
  exportFileName = "export",
  enableRowSelection = false,
  selectedRows = [],
  onSelectionChange,
  bulkActions,
  className,
  activeFilters = [],
  onClearAllFilters,
  toolbarChildren,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<Set<string>>(
    new Set(columns.map((c) => c.key))
  );

  // ── Column Visibility ──────────────────────────────────────────────────
  const columnToggleOptions = useMemo(
    () =>
      columns.map((col) => ({
        key: col.key,
        label: col.header,
        visible: visibleColumnKeys.has(col.key),
      })),
    [columns, visibleColumnKeys]
  );

  const handleToggleColumn = useCallback((key: string) => {
    setVisibleColumnKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const visibleColumns = useMemo(
    () => columns.filter((col) => visibleColumnKeys.has(col.key)),
    [columns, visibleColumnKeys]
  );

  // ── Sorting ────────────────────────────────────────────────────────────
  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        if (sortDirection === "asc") {
          setSortDirection("desc");
        } else {
          setSortKey(null);
          setSortDirection(null);
        }
      } else {
        setSortKey(key);
        setSortDirection("asc");
      }
      setCurrentPage(1);
    },
    [sortKey, sortDirection]
  );

  // ── Keyboard sort handler ──────────────────────────────────────────────
  const handleSortKeyDown = useCallback(
    (e: KeyboardEvent, key: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSort(key);
      }
    },
    [handleSort]
  );

  // ── Row selection ──────────────────────────────────────────────────────
  const isAllSelected =
    enableRowSelection && data.length > 0 && selectedRows.length === data.length;
  const isSomeSelected =
    enableRowSelection && selectedRows.length > 0 && selectedRows.length < data.length;

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map(keyExtractor));
    }
  }, [data, keyExtractor, onSelectionChange, isAllSelected]);

  const handleSelectRow = useCallback(
    (key: string) => {
      if (!onSelectionChange) return;
      if (selectedRows.includes(key)) {
        onSelectionChange(selectedRows.filter((k) => k !== key));
      } else {
        onSelectionChange([...selectedRows, key]);
      }
    },
    [onSelectionChange, selectedRows]
  );

  const clearSelection = useCallback(() => {
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  // ── Filter & Sort Data ─────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    if (!search || !showSearch) return data;
    return data.filter((row) =>
      columns.some((col) => {
        const val = col.accessor(row);
        if (typeof val === "string" || typeof val === "number") {
          return String(val).toLowerCase().includes(search.toLowerCase());
        }
        return false;
      })
    );
  }, [data, search, showSearch, columns]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const col = columns.find((c) => (c.sortKey || c.key) === sortKey);
    return [...filteredData].sort((a, b) => {
      const aVal = col?.accessor(a);
      const bVal = col?.accessor(b);

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const aStr = String(aVal);
      const bStr = String(bVal);

      const aNum = parseFloat(aStr);
      const bNum = parseFloat(bStr);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
      }

      return sortDirection === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / currentPageSize));
  const paginatedData = sortedData.slice(
    (currentPage - 1) * currentPageSize,
    currentPage * currentPageSize
  );

  // Reset page when page size changes
  const handlePageSizeChange = useCallback((size: number) => {
    setCurrentPageSize(size);
    setCurrentPage(1);
  }, []);

  // Reset page when search changes
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  // ── CSV Export ─────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    exportToCSV(sortedData, visibleColumns, exportFileName);
  }, [sortedData, visibleColumns, exportFileName]);

  // ── Loading State ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={cn("data-table-container rounded-xl border border-border overflow-hidden bg-card", className)}>
        <div className="px-4 py-3 border-b border-border">
          {showSearch && <Skeleton className="h-9 w-full max-w-xs rounded-lg" />}
        </div>
        <div className="hidden md:block">
          <table className="w-full caption-bottom text-sm">
            <thead className="data-table-header">
              <tr>
                {enableRowSelection && (
                  <th className="h-12 w-12 px-4">
                    <Skeleton className="h-4 w-4 rounded" />
                  </th>
                )}
                {columns.map((col) => (
                  <th key={col.key} className="h-12 px-4 align-middle">
                    <Skeleton className="h-4 w-24 rounded" />
                  </th>
                ))}
                {rowActions && <th className="h-12 w-12 px-2" />}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {enableRowSelection && (
                    <td className="p-4">
                      <Skeleton className="h-4 w-4 rounded" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="p-4">
                      <Skeleton className={cn("h-4 rounded", i % 2 === 0 ? "w-32" : "w-24")} />
                    </td>
                  ))}
                  {rowActions && (
                    <td className="p-2">
                      <Skeleton className="h-8 w-8 rounded" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden divide-y divide-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 space-y-3">
              {columns.slice(0, 3).map((col) => (
                <div key={col.key} className="flex items-center justify-between gap-3">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Empty State (no data at all) ───────────────────────────────────────
  if (data.length === 0) {
    return (
      <div className={cn("data-table-container rounded-xl border border-border overflow-hidden bg-card", className)}>
        <TableEmptyState
          icon={emptyState?.icon ?? Inbox}
          title={emptyState?.title ?? "No data"}
          description={emptyState?.description ?? "There are no items to display yet."}
          action={emptyState?.action}
        />
      </div>
    );
  }

  // ── Filtered empty state ───────────────────────────────────────────────
  if (filteredData.length === 0) {
    return (
      <div className={cn("data-table-container rounded-xl border border-border overflow-hidden bg-card", className)}>
        {showSearch && (
          <TableToolbar
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder={searchPlaceholder}
            activeFilters={activeFilters}
            onClearAllFilters={onClearAllFilters}
            onExportCSV={showExport ? handleExport : undefined}
            exportLabel="Export CSV"
          />
        )}
        <TableEmptyState
          icon={emptyState?.icon ?? Inbox}
          title="No results found"
          description="Try adjusting your search or filter criteria."
          hasSearch={!!search}
          hasFilters={activeFilters.length > 0}
          onClearSearch={() => setSearch("")}
          onClearFilters={onClearAllFilters}
        />
      </div>
    );
  }

  const mobileColumns = visibleColumns.filter((c) => !c.hideOnMobile);
  const selectCheckboxCol = enableRowSelection;

  return (
    <div
      className={cn(
        "data-table-container rounded-xl border border-border overflow-hidden bg-card",
        className
      )}
      role="region"
      aria-label="Data table"
    >
      {/* Bulk Action Bar */}
      {enableRowSelection && bulkActions && (
        <BulkActionBar
          selectedCount={selectedRows.length}
          onClearSelection={clearSelection}
        >
          {bulkActions(selectedRows, clearSelection)}
        </BulkActionBar>
      )}

      {/* Toolbar: Search + Filters + Column Toggle + Export */}
      {showSearch && (
        <TableToolbar
          searchValue={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder={searchPlaceholder}
          activeFilters={activeFilters}
          onClearAllFilters={onClearAllFilters}
          onExportCSV={showExport ? handleExport : undefined}
          exportLabel="Export CSV"
        >
          {toolbarChildren}
          {showColumnToggle && (
            <TableColumnToggle
              options={columnToggleOptions}
              onToggle={handleToggleColumn}
            />
          )}
        </TableToolbar>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto" role="grid" aria-label="Data table">
        <table className="w-full caption-bottom text-sm">
          <thead className="data-table-header">
            <tr role="row">
              {selectCheckboxCol && (
                <th className="h-12 w-12 px-4 text-left align-middle" role="columnheader">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                    aria-label={isAllSelected ? "Deselect all rows" : "Select all rows"}
                  />
                </th>
              )}
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
                    col.sortable && "sortable-column select-none",
                    col.headerClassName
                  )}
                  onClick={() => col.sortable && handleSort(col.sortKey || col.key)}
                  onKeyDown={(e) => col.sortable && handleSortKeyDown(e, col.sortKey || col.key)}
                  role="columnheader"
                  tabIndex={col.sortable ? 0 : undefined}
                  aria-sort={
                    sortKey === (col.sortKey || col.key)
                      ? sortDirection === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  aria-label={`${col.header}${col.sortable ? ", sortable column" : ""}`}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === (col.sortKey || col.key) && (
                      <span className="inline-flex" aria-hidden="true">
                        {sortDirection === "asc" ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {rowActions && <th className="h-12 w-12 px-2" role="columnheader" aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => {
              const rowKey = keyExtractor(row);
              const isSelected = selectedRows.includes(rowKey);
              return (
                <motion.tr
                  key={rowKey}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02, duration: 0.25 }}
                  className={cn(
                    "border-b border-border transition-colors data-table-row",
                    onRowClick && "cursor-pointer",
                    isSelected && "bg-primary/5"
                  )}
                  onClick={() => onRowClick?.(row)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && onRowClick) {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }}
                  role="row"
                  aria-selected={isSelected}
                >
                  {selectCheckboxCol && (
                    <td className="p-4 align-middle" role="gridcell" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(rowKey)}
                        className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                        aria-label={`Select row ${rowKey}`}
                      />
                    </td>
                  )}
                  {visibleColumns.map((col) => (
                    <td key={col.key} className={cn("p-4 align-middle", col.className)} role="gridcell">
                      {col.accessor(row)}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="p-2 text-right" role="gridcell" onClick={(e) => e.stopPropagation()}>
                      {rowActions(row)}
                    </td>
                  )}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-border">
        {paginatedData.map((row, index) => {
          const rowKey = keyExtractor(row);
          const isSelected = selectedRows.includes(rowKey);
          return (
            <motion.div
              key={rowKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02, duration: 0.25 }}
              className={cn(
                "p-4 space-y-3 transition-colors",
                onRowClick && "cursor-pointer active:bg-muted/50",
                isSelected && "bg-primary/5"
              )}
              onClick={() => onRowClick?.(row)}
              role="row"
              aria-selected={isSelected}
            >
              <div className="flex items-center justify-between">
                {selectCheckboxCol && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectRow(rowKey);
                    }}
                    className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                    aria-label={`Select row ${rowKey}`}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                {rowActions && (
                  <div onClick={(e) => e.stopPropagation()}>{rowActions(row)}</div>
                )}
              </div>
              {mobileColumns.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[60px]">
                    {col.header}
                  </span>
                  <span className="text-sm text-right font-medium break-words">
                    {col.accessor(row)}
                  </span>
                </div>
              ))}
            </motion.div>
          );
        })}
      </div>

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedData.length}
        pageSize={currentPageSize}
        pageSizeOptions={pageSizeOptions}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}