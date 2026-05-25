"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/store";
import { ICON_MAP, NAV_ITEMS, APP_NAME } from "@/constants";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Building2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } =
    useUIStore();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      if (item.children?.some((child) => pathname === child.href)) {
        setExpandedItems((prev) =>
          prev.includes(item.title) ? prev : [...prev, item.title]
        );
      }
    });
  }, [pathname]);

  const toggleExpand = (title: string) => {
    if (sidebarCollapsed) return;
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col gap-2 p-3">
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 px-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <AnimatePresence mode="wait">
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap text-lg font-bold tracking-tight"
            >
              {APP_NAME}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const hasChildren = !!item.children?.length;
          const isExpanded = expandedItems.includes(item.title);

          return (
            <div key={item.title} className="space-y-1">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(item.title)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent",
                    isActive(item.href) && !sidebarCollapsed
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <AnimatePresence mode="wait">
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 text-left"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.div>
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent",
                    isActive(item.href)
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <AnimatePresence mode="wait">
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              )}

              {/* Children */}
              <AnimatePresence>
                {hasChildren && isExpanded && !sidebarCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 border-l border-sidebar-border pl-3">
                      {item.children!.map((child) => {
                        const ChildIcon = ICON_MAP[child.icon];
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200 hover:bg-sidebar-accent",
                              pathname === child.href
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                            )}
                          >
                            <ChildIcon className="h-4 w-4 flex-shrink-0" />
                            <span>{child.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Collapse button */}
      <div className="mt-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="w-full justify-center"
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );

  // Mobile overlay
  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarCollapsed ? 72 : 280,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen border-r border-sidebar-border bg-sidebar lg:flex",
          "flex-col"
        )}
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="fixed left-0 top-0 z-50 h-screen w-[280px] border-r border-sidebar-border bg-sidebar lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}