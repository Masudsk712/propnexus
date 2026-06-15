"use client";

import { cn } from "@/lib/utils";
import { useUIStore, useNotificationStore } from "@/store";
import { ICON_MAP, NAV_ITEMS, APP_NAME } from "@/constants";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Building2,
  Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

export function Sidebar() {
  const { data: session } = useSession();
  const currentUser = session?.user;
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } =
    useUIStore();
  const { unreadCount } = useNotificationStore();
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
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const isParentActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (isActive(item.href)) return true;
    return item.children?.some((child) => pathname === child.href) ?? false;
  };

  const sidebarContent = (
    <div className="flex h-full flex-col gap-0.5 p-2.5">
      {/* Logo Section */}
      <div className="flex h-12 items-center gap-2.5 px-2.5 mb-1.5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-amethyst shadow-lg shadow-primary/20">
          <Building2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <AnimatePresence mode="wait">
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap text-base font-bold tracking-tight gradient-text"
            >
              {APP_NAME}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden scrollbar-none px-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const hasChildren = !!item.children?.length;
          const isExpanded = expandedItems.includes(item.title);
          const active = isParentActive(item);
          const hasNotificationBadge = item.title === "Notifications" && unreadCount > 0;

          return (
            <div key={item.title} className="relative">
              {hasChildren ? (
                <div className="relative">
                    <button
                      onClick={() => toggleExpand(item.title)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200 group",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      )}
                  >
                    <Icon className={cn("h-4.5 w-4.5 flex-shrink-0 transition-all duration-200 group-hover:scale-110", active && "text-sidebar-accent-foreground")} />
                    <AnimatePresence mode="wait">
                      {!sidebarCollapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex-1 text-left truncate"
                        >
                          {item.title}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0"
                      >
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </motion.div>
                    )}
                  </button>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200 group",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Icon className={cn("h-4.5 w-4.5 transition-all duration-200 group-hover:scale-110", active && "text-sidebar-accent-foreground")} />
                    {hasNotificationBadge && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground ring-2 ring-sidebar">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <AnimatePresence mode="wait">
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 truncate"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!sidebarCollapsed && hasNotificationBadge && (
                    <span className="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground flex-shrink-0">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Children sub-menu */}
              <AnimatePresence>
                {hasChildren && isExpanded && !sidebarCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="ml-3 border-l border-sidebar-border/50 pl-2 py-0.5 space-y-0.5">
                      {item.children!.map((child) => {
                        const ChildIcon = ICON_MAP[child.icon];
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-all duration-200",
                              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              childActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                            )}
                          >
                            <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{child.title}</span>
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

      {/* Bottom Section — User Profile + Collapse */}
      <div className="mt-auto space-y-0.5 pt-1.5 border-t border-sidebar-border/50">
        {/* User Profile */}
        <div className="relative">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
              "hover:bg-sidebar-accent",
              sidebarCollapsed && "justify-center"
            )}
          >
            <div className="relative flex-shrink-0">
              <img
                src={currentUser?.image ?? undefined}
                alt={currentUser?.name ?? "User"}
                className="h-7 w-7 rounded-full object-cover ring-2 ring-sidebar-border"
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
            </div>
            <AnimatePresence mode="wait">
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium truncate leading-tight">{currentUser?.name ?? "User"}</p>
                  <p className="text-[11px] text-muted-foreground capitalize truncate">{currentUser?.role ?? "tenant"}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {!sidebarCollapsed && (
              <Settings className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" aria-label="Settings" />
            )}
          </Link>
        </div>

        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={cn(
            "w-full justify-center rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground",
            sidebarCollapsed ? "h-9 px-0" : "h-9"
          )}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <div className="flex items-center gap-2">
              <PanelLeftClose className="h-4 w-4" />
              <span className="text-xs font-medium">Collapse</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
          initial={false}
          animate={{
            width: sidebarCollapsed ? 68 : 260,
          }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar lg:flex",
            "shadow-sm"
          )}
        >
        {sidebarContent}
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-overlay fixed inset-0 z-40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="fixed left-0 top-0 z-50 h-screen w-[260px] border-r border-sidebar-border bg-sidebar shadow-2xl lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}