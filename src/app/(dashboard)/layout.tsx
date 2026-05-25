"use client";

import { Sidebar } from "@/components/shared/sidebar";
import { Navbar } from "@/components/shared/navbar";
import { useUIStore } from "@/store";
import { motion } from "framer-motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <motion.main
        initial={false}
        animate={{
          marginLeft: sidebarCollapsed ? 72 : 280,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1 lg:ml-[280px] ml-0"
      >
        <Navbar />
        <div className="p-4 lg:p-6 xl:p-8">{children}</div>
      </motion.main>
    </div>
  );
}