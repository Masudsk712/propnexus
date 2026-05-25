"use client";

import { notifications } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Bell, CheckCircle2, AlertCircle, Info, XCircle, Search } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { useNotificationStore } from "@/store";

const typeIcons: Record<string, React.ElementType> = {
  error: XCircle, success: CheckCircle2, warning: AlertCircle, info: Info,
};

const typeColors: Record<string, string> = {
  error: "text-destructive bg-destructive/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
  info: "text-info bg-info/10",
};

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const { markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    useNotificationStore.getState().setNotifications(notifications);
    setTimeout(() => setLoading(false), 600);
  }, []);

  const notifs = useNotificationStore((s) => s.notifications);

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-48" /><div className="space-y-3">{[1,2,3,4,5,6].map((i) => (<Skeleton key={i} className="h-20 rounded-xl" />))}</div></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated with the latest alerts and updates</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
          <CheckCircle2 className="mr-2 h-4 w-4" /> Mark All Read
        </Button>
      </div>

      <div className="space-y-3">
        {notifs.map((notif) => {
          const Icon = typeIcons[notif.type] || Info;
          return (
            <motion.div
              key={notif.id}
              whileHover={{ x: 4 }}
              onClick={() => markAsRead(notif.id)}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                notif.read ? "border-border bg-card" : "border-primary/30 bg-primary/5"
              }`}
            >
              <div className={`rounded-full p-2 ${typeColors[notif.type]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{notif.title}</p>
                  {!notif.read && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(notif.createdAt)}</p>
              </div>
              <Badge variant="secondary" className="text-xs capitalize">{notif.type}</Badge>
            </motion.div>
          );
        })}
        {notifs.length === 0 && (
          <div className="text-center py-20">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No notifications</h3>
            <p className="text-muted-foreground mt-1">You're all caught up!</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}