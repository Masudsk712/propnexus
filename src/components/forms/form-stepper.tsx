"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { type ReactNode } from "react";

export interface Step {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  /** If true, this step will show an error state */
  hasError?: boolean;
}

interface FormStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  /** Allow clicking to navigate to a step. Defaults to false for linear flow. */
  allowNavigation?: boolean;
  /** Orientation: horizontal or vertical */
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function FormStepper({
  steps,
  currentStep,
  onStepClick,
  allowNavigation = false,
  orientation = "horizontal",
  className,
}: FormStepperProps) {
  const isVertical = orientation === "vertical";

  const handleClick = (index: number) => {
    if (allowNavigation || index < currentStep) {
      onStepClick?.(index);
    }
  };

  return (
    <nav
      aria-label="Form progress"
      className={cn(
        isVertical
          ? "flex flex-col gap-1"
          : "flex items-center gap-0 overflow-x-auto scrollbar-none",
        className
      )}
    >
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isPending = index > currentStep;
        const isClickable = allowNavigation || isCompleted;

        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center",
              isVertical ? "flex-row gap-3" : "flex-1 flex-row"
            )}
          >
            {/* Step button */}
            <button
              type="button"
              onClick={() => handleClick(index)}
              disabled={!isClickable}
              aria-current={isActive ? "step" : undefined}
              aria-label={`Step ${index + 1}: ${step.label}${
                isCompleted ? " (completed)" : ""
              }${isActive ? " (current)" : ""}`}
              className={cn(
                "group flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg",
                isVertical ? "w-full text-left" : "flex-col gap-1.5 min-w-0",
                isClickable ? "cursor-pointer" : "cursor-default",
                isPending && "opacity-50"
              )}
            >
              {/* Step indicator circle */}
              <div
                className={cn(
                  "relative flex items-center justify-center rounded-full transition-all duration-300 flex-shrink-0",
                  isVertical ? "h-9 w-9" : "h-10 w-10",
                  isCompleted && !step.hasError
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isActive
                    ? "bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20"
                    : step.hasError
                    ? "bg-destructive text-destructive-foreground ring-4 ring-destructive/20"
                    : "bg-muted text-muted-foreground border-2 border-border group-hover:border-primary/40"
                )}
              >
                {isCompleted && !step.hasError ? (
                  <Check className="h-5 w-5" />
                ) : step.icon ? (
                  <span className={isVertical ? "h-4 w-4" : "h-5 w-5"}>
                    {step.icon}
                  </span>
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>

              {/* Step label */}
              {!isVertical && (
                <div className="text-center min-w-0 px-1">
                  <p
                    className={cn(
                      "text-xs font-medium truncate transition-colors",
                      isActive
                        ? "text-foreground"
                        : isCompleted
                        ? "text-foreground/80"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-[10px] text-muted-foreground truncate hidden sm:block">
                      {step.description}
                    </p>
                  )}
                </div>
              )}

              {isVertical && (
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isActive
                        ? "text-foreground"
                        : isCompleted
                        ? "text-foreground/80"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
              )}
            </button>

            {/* Connector line between steps (horizontal only) */}
            {!isVertical && index < steps.length - 1 && (
              <div className="flex-1 h-px mx-2 min-w-[16px]">
                <div
                  className={cn(
                    "h-full rounded-full transition-colors duration-300",
                    index < currentStep ? "bg-primary" : "bg-border"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}