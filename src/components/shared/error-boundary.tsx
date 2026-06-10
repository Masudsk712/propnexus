"use client";

// ============================================================================
// Error Boundary — React Error Boundary with Sentry + fallback UI
// ============================================================================

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional name for this boundary (appears in error message) */
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to Sentry in production
    if (process.env.NODE_ENV === "production") {
      try {
        // Dynamic import to avoid bundling Sentry in dev
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Sentry = require("@sentry/nextjs");
        Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
        });
      } catch {
        // Sentry not available
      }
    }

    // Also log to console in dev
    if (process.env.NODE_ENV === "development") {
      console.error(`[ErrorBoundary${this.props.name ? `:${this.props.name}` : ""}]`, error);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            {this.state.error?.message ?? "An unexpected error occurred."}
            {this.props.name && (
              <span className="block mt-1 text-xs text-muted-foreground/60">
                Error in: {this.props.name}
              </span>
            )}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={this.handleReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Button onClick={this.handleReload}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload page
            </Button>
          </div>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="mt-6 p-4 rounded-lg bg-muted text-left text-xs max-w-xl overflow-auto">
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap a page/layout with an error boundary.
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: { name?: string; fallback?: ReactNode }
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => (
    <ErrorBoundary name={options?.name} fallback={options?.fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  Wrapped.displayName = `withErrorBoundary(${Component.displayName || Component.name || "Component"})`;
  return Wrapped;
}