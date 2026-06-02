"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Columns, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export interface ColumnToggleOption {
  key: string;
  label: string;
  visible: boolean;
}

interface TableColumnToggleProps {
  options: ColumnToggleOption[];
  onToggle: (key: string) => void;
  className?: string;
}

export function TableColumnToggle({
  options,
  onToggle,
  className,
}: TableColumnToggleProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const visibleCount = options.filter((o) => o.visible).length;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        aria-label="Toggle column visibility"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Columns className="mr-2 h-4 w-4" />
        Columns
        <span className="ml-1.5 text-xs text-muted-foreground">
          {visibleCount}/{options.length}
        </span>
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-border bg-card shadow-xl"
            role="listbox"
            aria-label="Select visible columns"
          >
            <div className="p-1.5">
              {options.map((option) => (
                <button
                  key={option.key}
                  role="option"
                  aria-selected={option.visible}
                  onClick={() => onToggle(option.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    option.visible
                      ? "text-foreground bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                      option.visible
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input"
                    )}
                  >
                    {option.visible && <Check className="h-3 w-3" />}
                  </span>
                  <span className="flex-1 text-left">{option.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}