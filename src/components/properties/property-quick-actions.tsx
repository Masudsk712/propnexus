"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Eye,
  Edit3,
  Trash2,
  MoreHorizontal,
  Share2,
  Heart,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface QuickAction {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "danger";
}

interface PropertyQuickActionsProps {
  propertyId: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  className?: string;
  /** Whether to show actions inline (true) or in a dropdown (false) */
  inline?: boolean;
}

export function PropertyQuickActions({
  propertyId,
  isFavorite = false,
  onToggleFavorite,
  onDelete,
  onDuplicate,
  className,
  inline = false,
}: PropertyQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const actions: QuickAction[] = [
    {
      label: "View Details",
      icon: Eye,
      href: `/properties/${propertyId}`,
    },
    {
      label: "Edit",
      icon: Edit3,
      href: `/properties/${propertyId}/edit`,
    },
    ...(onDuplicate
      ? [
          {
            label: "Duplicate",
            icon: Copy,
            onClick: () => onDuplicate(propertyId),
          },
        ]
      : []),
    ...(onDelete
      ? [
          {
            label: "Delete",
            icon: Trash2,
            onClick: () => onDelete(propertyId),
            variant: "danger" as const,
          },
        ]
      : []),
  ];

  if (inline) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={cn(
              "rounded-lg p-2 transition-all duration-200",
              isFavorite
                ? "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20"
                : "text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10",
            )}
          >
            <Heart
              className={cn("h-4 w-4", isFavorite && "fill-current")}
            />
          </button>
        )}
        {actions.map((action) =>
          action.href ? (
            <Link
              key={action.label}
              href={action.href}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "rounded-lg p-2 transition-all duration-200",
                action.variant === "danger"
                  ? "text-destructive hover:bg-destructive/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <action.icon className="h-4 w-4" />
            </Link>
          ) : (
            <button
              key={action.label}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                action.onClick?.();
              }}
              className={cn(
                "rounded-lg p-2 transition-all duration-200",
                action.variant === "danger"
                  ? "text-destructive hover:bg-destructive/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <action.icon className="h-4 w-4" />
            </button>
          ),
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "rounded-lg p-2 transition-all duration-200",
          isOpen
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted",
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 top-full mt-2 z-50 w-48 rounded-xl border border-border bg-card shadow-xl overflow-hidden"
            >
              {onToggleFavorite && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite();
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors hover:bg-muted",
                    isFavorite
                      ? "text-rose-500"
                      : "text-muted-foreground",
                  )}
                >
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      isFavorite && "fill-current",
                    )}
                  />
                  {isFavorite ? "Saved" : "Save"}
                </button>
              )}

              {actions.map((action) =>
                action.href ? (
                  <Link
                    key={action.label}
                    href={action.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors hover:bg-muted",
                      action.variant === "danger"
                        ? "text-destructive"
                        : "text-foreground",
                    )}
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </Link>
                ) : (
                  <button
                    key={action.label}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick?.();
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors hover:bg-muted",
                      action.variant === "danger"
                        ? "text-destructive"
                        : "text-foreground",
                    )}
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </button>
                ),
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}