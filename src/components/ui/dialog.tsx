"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useCallback, type ReactNode } from "react";

// ── Focus Trap Hook ──────────────────────────────────────────────────────

function useFocusTrap(containerRef: React.RefObject<HTMLDivElement | null>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Auto-focus first focusable element
    const firstFocusable = container.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive, containerRef]);
}

// ── Base Modal ──────────────────────────────────────────────────────────

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
  /** Whether to close on backdrop click */
  closeOnBackdrop?: boolean;
  /** Whether to close on Escape key */
  closeOnEscape?: boolean;
  /** Whether dialog is full-screen on mobile */
  mobileFullScreen?: boolean;
}

const sizeClasses: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-[calc(100vw-2rem)]",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  className,
  closeOnBackdrop = true,
  closeOnEscape = true,
  mobileFullScreen = false,
}: BaseModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useFocusTrap(containerRef, isOpen);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeOnBackdrop ? onClose : undefined}
            className="modal-overlay fixed inset-0"
            aria-hidden="true"
          />

          {/* Modal Content */}
          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            aria-describedby={description ? "modal-description" : undefined}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "modal-content relative z-50 w-full max-h-[85vh] overflow-y-auto",
              sizeClasses[size],
              mobileFullScreen && "max-sm:max-w-none max-sm:rounded-none max-sm:max-h-none max-sm:h-full max-sm:fixed max-sm:inset-0",
              className
            )}
          >
            {/* Header */}
            {(title || description) && (
              <div className="flex items-start justify-between p-5 md:p-6 pb-3 md:pb-4 border-b border-border">
                <div className="min-w-0 flex-1 mr-2">
                  {title && (
                    <h2 id="modal-title" className="text-base md:text-lg font-semibold text-foreground tracking-tight">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id="modal-description" className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onClose}
                  className="flex-shrink-0 rounded-lg hover:bg-muted"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Content */}
            <div className="p-5 md:p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Confirm Dialog ─────────────────────────────────────────────────────

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  icon?: LucideIcon;
  isConfirming?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  icon,
  isConfirming = false,
}: ConfirmDialogProps) {
  const Icon = icon ?? (variant === "danger" ? AlertTriangle : Info);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" closeOnBackdrop={!isConfirming}>
      <div className="flex flex-col items-center text-center gap-4">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl",
            variant === "danger"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
          )}
        >
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 w-full mt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isConfirming}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "destructive" : "default"}
            className="flex-1"
            onClick={onConfirm}
            loading={isConfirming}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Delete Dialog ──────────────────────────────────────────────────────

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  isDeleting?: boolean;
}

export function DeleteDialog({
  isOpen,
  onClose,
  onDelete,
  title,
  description,
  itemName,
  isDeleting = false,
}: DeleteDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onDelete}
      title={title ?? "Delete Item"}
      description={
        description ??
        (itemName
          ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
          : "Are you sure you want to delete this item? This action cannot be undone.")
      }
      confirmLabel="Delete"
      cancelLabel="Cancel"
      variant="danger"
      icon={Trash2}
      isConfirming={isDeleting}
    />
  );
}

// ── Success Dialog ─────────────────────────────────────────────────────

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export function SuccessDialog({
  isOpen,
  onClose,
  title,
  description,
  icon: Icon = CheckCircle2,
  actionLabel,
  onAction,
}: SuccessDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10"
        >
          <Icon className="h-8 w-8 text-success" />
        </motion.div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 w-full mt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          {onAction && actionLabel && (
            <Button variant="default" className="flex-1" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Form Modal (wraps a form in a modal) ───────────────────────────────

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: BaseModalProps["size"];
  /** Show a close button in the header */
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

export function FormModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "lg",
  showCloseButton = true,
  closeOnBackdrop = false,
  closeOnEscape = false,
}: FormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      closeOnBackdrop={closeOnBackdrop}
      closeOnEscape={closeOnEscape}
      mobileFullScreen
    >
      {children}
    </Modal>
  );
}