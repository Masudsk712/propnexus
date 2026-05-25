"use client";

import { cn } from "@/lib/utils";
import { useUIStore, useNotificationStore } from "@/store";
import { currentUser, notifications } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  ChevronDown,
  Settings,
  LogOut,
  User,
  X,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";

export function Navbar() {
  const { setMobileSidebarOpen, mobileSidebarOpen } = useUIStore();
  const { unreadCount, markAllAsRead, markAsRead } = useNotificationStore();
  const { theme, setTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    useNotificationStore
      .getState()
      .setNotifications(notifications);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      error: "bg-destructive/10 text-destructive",
      success: "bg-success/10 text-success",
      warning: "bg-warning/10 text-warning",
      info: "bg-info/10 text-info",
    };
    return colors[type] || colors.info;
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search bar */}
      <div className="relative hidden sm:flex flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search properties, requests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-muted/50 pl-10 pr-4 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-full"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
                {unreadCount}
              </span>
            )}
          </Button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-popover shadow-xl"
              >
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="font-semibold">Notifications</h3>
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.slice(0, 6).map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={cn(
                        "flex w-full gap-3 p-4 text-left transition-colors hover:bg-muted/50 border-b border-border/50",
                        !notif.read && "bg-primary/5"
                      )}
                    >
                      <div
                        className={cn(
                          "mt-1 h-2 w-2 flex-shrink-0 rounded-full",
                          notif.read ? "bg-muted" : "bg-primary"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimeAgo(notif.createdAt)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                <Link
                  href="/notifications"
                  className="block p-3 text-center text-sm text-primary hover:bg-muted/50 rounded-b-xl"
                  onClick={() => setShowNotifications(false)}
                >
                  View all notifications
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-muted"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-border"
            />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium leading-none">
                {currentUser.name}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {currentUser.role}
              </p>
            </div>
            <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-popover shadow-xl"
              >
                <div className="p-3 border-b border-border">
                  <p className="font-medium text-sm">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentUser.email}
                  </p>
                </div>
                <div className="p-2">
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                    onClick={() => setShowProfile(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                    onClick={() => setShowProfile(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10">
                    <LogOut className="h-4 w-4" />
                    Log out
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