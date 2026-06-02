"use client";

import { cn } from "@/lib/utils";
import { useUIStore, useNotificationStore } from "@/store";
import { ICON_MAP, NAV_ITEMS, APP_NAME } from "@/constants";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Building2,
  LogOut,
  Settings,
  User,
  Bell,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { currentUser } from "@/data/mock";

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } =
    useUIStore();
  const { unreadCount } = useNotificationStore();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

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
    <div className="flex h-full flex-col gap-1 p-3" ref={sidebarRef}>
      {/* Logo Section */}
      <div className="flex h-14 items-center gap-3 px-3 mb-2">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-oklch(0.55 0.22 290) shadow-lg shadow-primary/20">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <AnimatePresence mode="wait">
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap text-lg font-bold tracking-tight gradient-text"
            >
              {APP_NAME}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const hasChildren = !!item.children?.length;
          const isExpanded = expandedItems.includes(item.title);
          const active = isParentActive(item);
          const hasNotificationBadge = item.title === "Notifications" && unreadCount > 0;

          return (
            <div key={item.title} className="relative space-y-0.5">
              {/* Active Indicator Bar */}
              {active && !sidebarCollapsed && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="nav-active-indicator"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}

              {hasChildren ? (
                <div className="relative">
                  <button
                    onClick={() => toggleExpand(item.title)}
                    onMouseEnter={() => sidebarCollapsed && setHoveredItem(item.title)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      active && !sidebarCollapsed
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 flex-shrink-0 transition-colors", active && "text-sidebar-accent-foreground")} />
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
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    )}
                  </button>

                  {/* Tooltip on collapsed sidebar */}
                  {sidebarCollapsed && hoveredItem === item.title && (
                    <motion.div
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 rounded-lg bg-popover border border-border px-3 py-1.5 text-sm font-medium shadow-xl whitespace-nowrap pointer-events-none"
                    >
                      {item.title}
                    </motion.div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  onMouseEnter={() => sidebarCollapsed && setHoveredItem(item.title)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  )}
                >
                  {active && !sidebarCollapsed && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="nav-active-indicator"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <div className="relative">
                    <Icon className={cn("h-5 w-5 flex-shrink-0 transition-colors", active && "text-sidebar-accent-foreground")} />
                    {/* Notification badge */}
                    {hasNotificationBadge && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-sidebar">
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
                        className="flex-1"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!sidebarCollapsed && hasNotificationBadge && (
                    <span className="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}

                  {/* Tooltip on collapsed sidebar */}
                  {sidebarCollapsed && hoveredItem === item.title && !hasChildren && (
                    <motion.div
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 rounded-lg bg-popover border border-border px-3 py-1.5 text-sm font-medium shadow-xl whitespace-nowrap pointer-events-none"
                    >
                      {item.title}
                      {hasNotificationBadge && ` (${unreadCount})`}
                    </motion.div>
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
                    <div className="ml-4 border-l border-sidebar-border pl-3 py-1 space-y-0.5">
                      {item.children!.map((child) => {
                        const ChildIcon = ICON_MAP[child.icon];
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              childActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
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

      {/* Bottom Section — User Profile + Collapse */}
      <div className="mt-auto space-y-1 pt-2 border-t border-sidebar-border">
        {/* User Profile */}
        <div className="relative">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 transition-colors cursor-pointer",
              !sidebarCollapsed && "hover:bg-sidebar-accent",
              sidebarCollapsed && "justify-center hover:bg-sidebar-accent"
            )}
            onMouseEnter={() => sidebarCollapsed && setHoveredItem("__profile__")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="relative flex-shrink-0">
              <img
                src={currentUser.image ?? undefined}
                alt={currentUser.name}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-sidebar-border"
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
            </div>
            <AnimatePresence mode="wait">
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium truncate">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground capitalize truncate">{currentUser.role}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {!sidebarCollapsed && (
              <Link
                href="/settings"
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 rounded-md p-1 hover:bg-sidebar-accent"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
            )}
          </div>

          {/* Profile tooltip when collapsed */}
          {sidebarCollapsed && hoveredItem === "__profile__" && (
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 rounded-lg bg-popover border border-border px-3 py-2 text-sm shadow-xl whitespace-nowrap pointer-events-none"
            >
              <p className="font-medium">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{currentUser.role}</p>
            </motion.div>
          )}
        </div>

        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="w-full justify-center rounded-xl hover:bg-sidebar-accent"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
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
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar lg:flex",
          "shadow-sm"
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
              className="modal-overlay fixed inset-0 z-40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="fixed left-0 top-0 z-50 h-screen w-[280px] border-r border-sidebar-border bg-sidebar shadow-2xl lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}