"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Home, CalendarDays, CreditCard, Wrench, LogOut, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/ui/kpi-card";
import { DashboardWidget } from "@/components/shared/dashboard-widget";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { QuickActionsPanel } from "@/components/shared/quick-actions-panel";
import Link from "next/link";

export default function TenantDashboardPage() {
  const { data: session } = useSession();
  const { logout } = useAuth();
  const { data, isLoading } = useDashboard();
  const stats = data?.stats;
  const recentActivity = data?.recentActivity ?? [];

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
        isLoading={isLoading} delay={0}
      >
        {!isLoading && stats && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-violet-500/5 via-violet-500/3 to-transparent border border-violet-500/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10"><Home className="h-5 w-5 text-violet-500" /></div>
            <div>
              <p className="text-sm font-semibold">Portfolio Overview</p>
              <p className="text-xs text-muted-foreground">{stats.totalProperties} properties · {stats.occupancyRate}% occupied · {stats.totalTenants} tenants</p>
            </div>
          </motion.div>
        )}
      </DashboardWidget>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard title="Properties" value={stats?.totalProperties ?? 0} icon={Home} variant="default" isLoading={isLoading} />
        <KPICard title="Occupancy" value={stats?.occupancyRate ?? 0} suffix="%" icon={Clock} variant="occupancy" isLoading={isLoading} />
        <KPICard title="Active Maintenance" value={stats?.activeMaintenance ?? 0} icon={Wrench} variant="maintenance" isLoading={isLoading} />
        <KPICard title="Total Bookings" value={stats?.totalBookings ?? 0} icon={CalendarDays} variant="bookings" isLoading={isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardWidget title="Payment History" description="Your recent transactions" isLoading={isLoading} delay={0.1}>
          <ActivityTimeline
            items={recentActivity
              .filter((a) => a.type === "payment")
              .map((act) => ({
                id: act.id,
                title: `${act.userName} ${act.action} ${act.target}`,
                description: act.type,
                timestamp: act.createdAt ? new Date(act.createdAt).toLocaleDateString() : "",
                variant: "success" as const,
              }))}
            limit={4}
          />
        </DashboardWidget>

        <DashboardWidget title="Maintenance Requests" description="Your submitted tickets" isLoading={isLoading} delay={0.15}>
          <ActivityTimeline
            items={recentActivity
              .filter((a) => a.type === "maintenance")
              .map((act) => ({
                id: act.id,
                title: `${act.userName} ${act.action} ${act.target}`,
                description: act.type,
                timestamp: act.createdAt ? new Date(act.createdAt).toLocaleDateString() : "",
                variant: "warning" as const,
              }))}
            limit={5}
          />
        </DashboardWidget>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardWidget title="Booking History" description="Your amenity reservations" isLoading={isLoading} delay={0.2}>
          <ActivityTimeline
            items={recentActivity
              .filter((a) => a.type === "booking")
              .map((act) => ({
                id: act.id,
                title: `${act.userName} ${act.action} ${act.target}`,
                description: act.type,
                timestamp: act.createdAt ? new Date(act.createdAt).toLocaleDateString() : "",
                variant: "info" as const,
              }))}
            limit={5}
          />
        </DashboardWidget>

        <DashboardWidget title="Notifications" description="Important updates for you" isLoading={isLoading} delay={0.25}>
          <div className="space-y-3">
            {stats && (
              <>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="mt-0.5 h-2 w-2 rounded-full flex-shrink-0 bg-warning" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Active Maintenance</p>
                    <p className="text-xs text-muted-foreground">{stats.activeMaintenance} requests open</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="mt-0.5 h-2 w-2 rounded-full flex-shrink-0 bg-success" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Properties Available</p>
                    <p className="text-xs text-muted-foreground">{stats.totalProperties} properties listed</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="mt-0.5 h-2 w-2 rounded-full flex-shrink-0 bg-info" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Bookings</p>
                    <p className="text-xs text-muted-foreground">{stats.totalBookings} total bookings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="mt-0.5 h-2 w-2 rounded-full flex-shrink-0 bg-warning" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Occupancy Rate</p>
                    <p className="text-xs text-muted-foreground">{stats.occupancyRate}% occupied</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </DashboardWidget>
      </div>

      <QuickActionsPanel
        actions={[
          { id: "pay-rent", title: "Pay Rent", description: "Make your monthly rent payment", icon: CreditCard, href: "/payments" },
          { id: "book-amenity", title: "Book Amenity", description: "Reserve gym, pool, or clubhouse", icon: CalendarDays, href: "/amenities" },
          { id: "report-issue", title: "Report Issue", description: "Submit a maintenance request", icon: Wrench, href: "/maintenance/create" },
        ]}
        isLoading={isLoading} delay={0.3}
      />
    </div>
  );
}