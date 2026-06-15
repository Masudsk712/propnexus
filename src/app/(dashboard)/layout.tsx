"use client";

import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Sidebar } from "@/components/shared/sidebar";
import { Navbar } from "@/components/shared/navbar";
import { useUIStore } from "@/store";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar (fixed position) */}
      <Sidebar />

      {/* Main content area - shifts with sidebar */}
      <div
        className={cn(
          "flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[280px]"
        )}
      >
        <Navbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <ErrorBoundary name="DashboardPage">
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}