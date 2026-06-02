"use client";

import dynamic from "next/dynamic";
import { useUIStore } from "@/store";
import { useAllRealtime } from "@/hooks/useRealtime";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// ── Lazy-load heavy layout components ─────────────────────────────────────
const Sidebar = dynamic(() => import("@/components/shared/sidebar").then((m) => ({ default: m.Sidebar })), {
  ssr: false,
  loading: () => (
    <div className="fixed left-0 top-0 z-50 h-full w-[72px] border-r border-border bg-card animate-pulse" />
  ),
});

const Navbar = dynamic(() => import("@/components/shared/navbar").then((m) => ({ default: m.Navbar })), {
  ssr: false,
  loading: () => (
    <div className="sticky top-0 z-40 h-16 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between h-full px-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  ),
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed, mobileSidebarOpen } = useUIStore();
  const [isDesktop, setIsDesktop] = useState(false);

  // Activate all real-time streams (only on authenticated dashboard pages)
  useAllRealtime();

  // Detect desktop for sidebar margin logic (avoids hydration mismatch)
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  const sidebarWidth = isDesktop ? (sidebarCollapsed ? 72 : 280) : 0;

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <Sidebar />
      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarWidth }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1 w-full min-w-0"
      >
        <Navbar />
        <div className="content-area w-full max-w-full overflow-x-hidden">
          <div className="dashboard-container">
            {children}
          </div>
        </div>
      </motion.main>
    </div>
  );
}