"use client";

import { cn } from "@/lib/utils";
import { type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

interface FormSectionProps extends HTMLMotionProps<"div"> {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  variant?: "default" | "danger" | "highlight";
  className?: string;
}

const variantStyles = {
  default: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  danger: {
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
  },
  highlight: {
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
};

export function FormSection({
  title,
  description,
  icon,
  children,
  variant = "default",
  className,
  ...motionProps
}: FormSectionProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "rounded-xl border border-border bg-card p-6 space-y-5",
        variant === "danger" && "border-destructive/30 bg-destructive/5",
        variant === "highlight" && "border-amber-500/20 bg-amber-500/[0.03]",
        className
      )}
      {...motionProps}
    >
      {(title || icon) && (
        <div className="flex items-start gap-3">
          {icon && (
            <div
              className={cn(
                "rounded-lg p-2 flex-shrink-0",
                styles.iconBg,
                styles.iconColor
              )}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}