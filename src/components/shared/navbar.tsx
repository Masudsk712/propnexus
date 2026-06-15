"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/store";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/shared/notification-center";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { useTheme } from "next-themes";
import {
  Search,
  Sun,
  Moon,
  Menu,
  ChevronDown,
  Settings,
  LogOut,
  User,
  X,
  Command,
  Bell,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function Navbar() {
  const { data: session } = useSession();
  const currentUser = session?.user;
  const { setMobileSidebarOpen, mobileSidebarOpen } = useUIStore();
  const { theme, setTheme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut for search: Cmd/Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 glass-navbar px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden flex-shrink-0"
        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        aria-label={mobileSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumbs (desktop only) */}
      <div className="hidden lg:block">
        <Breadcrumbs />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search bar */}
      <div className="relative hidden sm:flex max-w-sm flex-1 lg:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search... (⌘K)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 w-full rounded-xl border border-input bg-muted/50 pl-10 pr-16 text-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex h-5 items-center gap-0.5 rounded-md border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <Command className="h-3 w-3" />K
        </kbd>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-10 lg:right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Real-time Notification Center */}
        <NotificationCenter />

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 rounded-full p-1.5 transition-colors hover:bg-muted"
            aria-label="User menu"
            aria-expanded={showProfile}
          >
            <img
              src={currentUser?.image ?? undefined}
              alt={currentUser?.name ?? "User"}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-border"
            />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium leading-none">{currentUser?.name ?? "User"}</p>
              <p className="text-xs text-muted-foreground capitalize">{currentUser?.role ?? "tenant"}</p>
            </div>
            <ChevronDown
              className={cn(
                "hidden md:block h-4 w-4 text-muted-foreground transition-transform duration-200",
                showProfile && "rotate-180"
              )}
            />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-popover shadow-xl z-50 overflow-hidden"
              >
                {/* User info header */}
                <div className="p-4 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser?.image ?? undefined}
                      alt={currentUser?.name ?? "User"}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{currentUser?.name ?? "User"}</p>
                      <p className="text-xs text-muted-foreground truncate">{currentUser?.email ?? ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary capitalize">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {currentUser?.role ?? "tenant"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                    {(currentUser as any)?.phone ?? ""}
                    </span>
                  </div>
                </div>
                {/* Menu items */}
                <div className="p-2">
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                    onClick={() => setShowProfile(false)}
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                    onClick={() => setShowProfile(false)}
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span>Account Settings</span>
                  </Link>
                  <Link
                    href="/notifications"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                    onClick={() => setShowProfile(false)}
                  >
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span>Notifications</span>
                  </Link>
                  <div className="my-1 border-t border-border" />
                  <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10">
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}