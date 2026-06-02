"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckSquare } from "lucide-react";
import { type ReactNode } from "react";

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  className?: string;
  children?: ReactNode;
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  className,
  children,
}: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "sticky top-0 z-30 flex items-center justify-between gap-4 px-4 py-3 border-b border-primary/30 bg-primary/10 backdrop-blur-sm",
            className
          )}
          role="toolbar"
          aria-label="Bulk actions"
        >
          <div className="flex items-center gap-3">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">
              {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            {children}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              aria-label="Clear selection"
            >
              <X className="mr-1.5 h-4 w-4" />
              Clear
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}