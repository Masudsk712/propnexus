"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface FormSuccessStateProps {
  title: string;
  description?: string;
  /** Custom icon component */
  icon?: LucideIcon;
  /** Primary action button */
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Custom content below the message */
  children?: ReactNode;
  className?: string;
}

const checkmarkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      delay: 0.2,
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  },
};

const scaleInVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 20,
      delay: 0.1,
    },
  },
};

export function FormSuccessState({
  title,
  description,
  icon: Icon = CheckCircle2,
  primaryAction,
  secondaryAction,
  children,
  className,
}: FormSuccessStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
    >
      {/* Success icon with animation */}
      <motion.div
        variants={scaleInVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-2xl mb-6",
          "bg-success/10 dark:bg-success/15"
        )}
      >
        <motion.div
          variants={checkmarkVariants}
          initial="hidden"
          animate="visible"
        >
          <Icon className="h-10 w-10 text-success" />
        </motion.div>
      </motion.div>

      {/* Text content */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-muted-foreground max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </motion.div>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="flex items-center gap-3 mt-8 flex-wrap justify-center"
        >
          {secondaryAction && (
            <Button
              variant="outline"
              size="lg"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button size="lg" onClick={primaryAction.onClick}>
              {primaryAction.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </motion.div>
      )}

      {/* Custom content */}
      {children && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="mt-8 w-full"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}