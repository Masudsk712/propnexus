"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { type ReactNode } from "react";

interface FormActionsProps {
  /** Called when going to previous step */
  onPrevious?: () => void;
  /** Called when going to next step or submitting */
  onNext?: () => void;
  /** Called when cancelling */
  onCancel?: () => void;
  /** Label for the next/submit button */
  nextLabel?: string;
  /** Label for the previous button */
  previousLabel?: string;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** Whether to show the next button */
  showNext?: boolean;
  /** Whether to show the previous button */
  showPrevious?: boolean;
  /** Whether the next step is valid */
  isNextDisabled?: boolean;
  /** Whether this is the final step (changes button styling) */
  isLastStep?: boolean;
  /** Custom actions to render between prev/next */
  children?: ReactNode;
  /** Additional class for the container */
  className?: string;
  /** Whether to use sticky positioning on mobile */
  sticky?: boolean;
}

export function FormActions({
  onPrevious,
  onNext,
  onCancel,
  nextLabel = "Continue",
  previousLabel = "Back",
  isSubmitting = false,
  showNext = true,
  showPrevious = true,
  isNextDisabled = false,
  isLastStep = false,
  children,
  className,
  sticky = true,
}: FormActionsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 pt-6 border-t border-border",
        sticky && "sticky bottom-0 bg-background/95 backdrop-blur-sm pb-4 z-10",
        "flex-wrap sm:flex-nowrap",
        className
      )}
    >
      {/* Left side: Previous / Cancel */}
      <div className="flex items-center gap-3 order-1">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        )}
        {showPrevious && onPrevious && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {previousLabel}
          </Button>
        )}
      </div>

      {/* Middle: Custom actions */}
      {children && (
        <div className="flex items-center gap-2 order-2 flex-1 justify-center">
          {children}
        </div>
      )}

      {/* Right side: Next / Submit */}
      <div className="flex items-center gap-3 order-3 ml-auto">
        {showNext && onNext && (
          <Button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled || isSubmitting}
            size={isLastStep ? "lg" : "default"}
            className={cn(isLastStep && "shadow-lg shadow-primary/25")}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isLastStep ? "Submitting..." : "Loading..."}
              </>
            ) : isLastStep ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                {nextLabel}
              </>
            ) : (
              <>
                {nextLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}