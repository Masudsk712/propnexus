"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface PageHeaderProps {
  /** Page title (required) */
  title: string;
  /** Optional description displayed below title */
  description?: string;
  /** Optional action buttons / elements in the top-right */
  actions?: ReactNode;
  /** Optional breadcrumbs slot (rendered above the title) */
  breadcrumbs?: ReactNode;
  /** Extra class names for the wrapper */
  className?: string;
  /** Hide fade-in-up animation (default: false) */
  disableAnimation?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
  disableAnimation = false,
}: PageHeaderProps) {
  const content = (
    <div className={cn("page-header", className)}>
      {/* Left: breadcrumbs → title → description */}
      <div className="min-w-0 flex-1">
        {breadcrumbs && (
          <div className="mb-1">{breadcrumbs}</div>
        )}
        <h1 className="page-header-title">{title}</h1>
        {description && (
          <p className="page-header-description">{description}</p>
        )}
      </div>

      {/* Right: action buttons */}
      {actions && (
        <div className="page-header-actions">{actions}</div>
      )}
    </div>
  );

  if (disableAnimation) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {content}
    </motion.div>
  );
}

export type { PageHeaderProps };