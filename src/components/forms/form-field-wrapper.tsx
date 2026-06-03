"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, Info } from "lucide-react";
import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FormFieldWrapperProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  /** Renders a subtle hint below the field */
  hint?: string;
}

export function FormFieldWrapper({
  label,
  description,
  error,
  required,
  children,
  className,
  hint,
}: FormFieldWrapperProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium leading-none text-foreground">
            {label}
            {required && (
              <span className="ml-1 text-destructive" aria-hidden="true">
                *
              </span>
            )}
          </label>
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      )}

      {children}

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 overflow-hidden"
          >
            <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          </motion.div>
        )}

        {!error && hint && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5"
          >
            <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">{hint}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}