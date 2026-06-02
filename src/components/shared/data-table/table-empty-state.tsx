"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Search, X, type LucideIcon, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TableEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  hasSearch?: boolean;
  hasFilters?: boolean;
  onClearSearch?: () => void;
  onClearFilters?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function TableEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  hasSearch = false,
  hasFilters = false,
  onClearSearch,
  onClearFilters,
  action,
  className,
}: TableEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center py-20 px-4 text-center",
        className
      )}
    >
      <div className="rounded-full bg-muted p-5 mb-4">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          {description}
        </p>
      )}
      {(hasSearch || hasFilters) && (
        <div className="flex items-center gap-2 mt-4">
          {hasSearch && onClearSearch && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSearch}
            >
              <X className="mr-1.5 h-4 w-4" />
              Clear search
            </Button>
          )}
          {hasFilters && onClearFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
            >
              <X className="mr-1.5 h-4 w-4" />
              Clear filters
            </Button>
          )}
        </div>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-6" size="sm">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}