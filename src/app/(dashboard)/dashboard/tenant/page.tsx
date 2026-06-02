// ============================================================================
// Tenant Dashboard Page — Tenant-facing dashboard
// ============================================================================

"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Home, CalendarDays, CreditCard, Wrench, LogOut, TrendingUp, Clock, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "@/components/ui/kpi-card";
import { DashboardWidget } from "@/components/shared/dashboard-widget";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { QuickActionsPanel } from "@/components/shared/quick-actions-panel";
import { dashboardStats } from "@/data/mock";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function TenantDashboardPage() {
  const { data: session } = useSession();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      <DashboardWidget
        title="My Dashboard"
        description={`Welcome, ${session?.user?.name || "Tenant"} — Your home dashboard`}
        actions={
          <div className="flex gap-2">
            <Badge variant="default" className="bg-violet-500/20 text-violet-500 border-violet-500/30">Tenant</Badge>
            <Button variant="outline" size="sm" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Sign Out</Button>
          </div>
        }
        isLoading={loading} delay={0}
      >
        {!loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-violet-500/5 via-violet-500/3 to-transparent border border-violet-500/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10"><Home className="h-5 w-5 text-violet-500" /></div>
            <div>
              <p className="text-sm font-semibold">Lease Summary</p>
              <p className="text-xs text-muted-foreground">Skyline Towers Unit 12A · Lease ends Jun 1, 2025 · Renewal eligible</p>
            </div>
            <span className="ml-auto text-xs font-semibold text-violet-500 flex items-center gap-1"><Clock className="h-3 w-3" />15 days to pay</span>
          </motion.div>
        )}
      </DashboardWidget>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard title="Rent Due" value={1500} prefix="$" decimals={0} icon={CreditCard} change={0} changeLabel="On time" variant="payments" isLoading={loading} />
        <KPICard title="Days Left to Pay" value={15} suffix=" days" icon={Clock} variant="default" isLoading={loading} />
        <KPICard title="Open Requests" value={2} icon={Wrench} variant="maintenance" isLoading={loading} />
        <KPICard title="Amenities Used" value={5} suffix=" this month" icon={CalendarDays} variant="bookings" isLoading={loading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardWidget title="Payment History" description="Your recent transactions" isLoading={loading} delay={0.1}>
          <ActivityTimeline
            items={[
              { id: "p1", title: "Rent payment — $1,500", description: "May 2025 — Paid via bank transfer", timestamp: "Apr 28, 2025", variant: "success" },
              { id: "p2", title: "Rent payment — $1,500", description: "April 2025 — Paid via credit card", timestamp: "Mar 30, 2025", variant: "success" },
              { id: "p3", title: "Rent payment — $1,500", description: "March 2025 — Paid via bank transfer", timestamp: "Feb 28, 2025", variant: "success" },
              { id: "p4", title: "Security Deposit — $1,500", description: "Refundable deposit paid", timestamp: "May 20, 2024", variant: "info" },
            ]}
            limit={4}
          />
        </DashboardWidget>

        <DashboardWidget title="Maintenance Requests" description="Your submitted tickets" isLoading={loading} delay={0.15}>
          <ActivityTimeline
            items={[
              { id: "mr1", title: "Leaking faucet kitchen", description: "Status: Open — Reported 3 days ago", timestamp: "May 20, 2025", variant: "warning" },
              { id: "mr2", title: "Dishwasher not draining", description: "Status: Resolved — Fixed by Linda M.", timestamp: "May 17, 2025", variant: "success" },
            ]}
            limit={5}
          />
        </DashboardWidget>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardWidget title="Booking History" description="Your amenity reservations" isLoading={loading} delay={0.2}>
          <ActivityTimeline
            items={[
              { id: "b1", title: "Clubhouse — Birthday party", description: "May 25, 2025 · 2:00 PM – 8:00 PM · 50 guests", timestamp: "Confirmed", variant: "success" },
              { id: "b2", title: "Gym — Daily pass", description: "May 21, 2025 · 10:00 AM", timestamp: "Completed", variant: "info" },
              { id: "b3", title: "Rooftop Terrace", description: "May 22, 2025 · 6:00 PM – 10:00 PM", timestamp: "Cancelled", variant: "destructive" },
            ]}
            limit={5}
          />
        </DashboardWidget>

        <DashboardWidget title="Notifications" description="Important updates for you" isLoading={loading} delay={0.25}>
          <div className="space-y-3">
            {[
              { title: "Rent Due Soon", message: "Your rent of $1,500 is due in 15 days.", type: "warning" as const },
              { title: "Maintenance Update", message: "Plumbing request #1023 has been resolved.", type: "success" as const },
              { title: "Amenity Booking", message: "Gym booked for tomorrow at 10 AM.", type: "info" as const },
              { title: "Lease Renewal", message: "Your lease is eligible for renewal. Contact management.", type: "warning" as const },
            ].map((n) => (
              <div key={n.title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${n.type === "warning" ? "bg-warning" : n.type === "success" ? "bg-success" : "bg-info"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </DashboardWidget>
      </div>

      <QuickActionsPanel
        actions={[
          { id: "pay-rent", title: "Pay Rent", description: "Make your monthly rent payment", icon: CreditCard, href: "/payments" },
          { id: "book-amenity", title: "Book Amenity", description: "Reserve gym, pool, or clubhouse", icon: CalendarDays, href: "/amenities" },
          { id: "report-issue", title: "Report Issue", description: "Submit a maintenance request", icon: Wrench, href: "/maintenance/create" },
        ]}
        isLoading={loading} delay={0.3}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}