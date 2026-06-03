"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "@/components/ui/kpi-card";
import { StatusChip } from "@/components/ui/status-chip";
import { DashboardWidget } from "@/components/shared/dashboard-widget";
import { DashboardChartCard } from "@/components/shared/dashboard-chart-card";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { QuickActionsPanel } from "@/components/shared/quick-actions-panel";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  DollarSign,
  Wrench,
  TrendingUp,
  CalendarDays,
  Plus,
  Sparkles,
  PieChart,
  BadgePercent,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useDashboard } from "@/hooks/useApi";

const RevenueChart = dynamic(() => import("./_charts/revenue-chart"), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-xl" /> });
const OccupancyChart = dynamic(() => import("./_charts/occupancy-chart"), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-xl" /> });
const RevenueByPropertyChart = dynamic(() => import("./_charts/revenue-by-property-chart"), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-xl" /> });
const MaintenancePieChart = dynamic(() => import("./_charts/maintenance-pie-chart"), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-xl" /> });

const quickActions = [
  { id: "add-property", title: "Add Property", description: "List a new property in your portfolio", icon: Building2, href: "/properties/add" },
  { id: "create-maintenance", title: "Create Request", description: "Report or schedule maintenance", icon: Wrench, href: "/maintenance/create" },
  { id: "view-bookings", title: "View Bookings", description: "Check amenity bookings calendar", icon: CalendarDays, href: "/amenities/bookings" },
];

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const stats = data?.stats;

  const kpiData = stats
    ? [
        { title: "Total Revenue", value: stats.totalRevenue, prefix: "$", decimals: 0, icon: DollarSign, variant: "revenue" as const },
        { title: "Properties", value: stats.totalProperties, icon: Building2, variant: "default" as const },
        { title: "Occupancy Rate", value: stats.occupancyRate, suffix: "%", icon: PieChart, variant: "occupancy" as const },
        { title: "Active Maintenance", value: stats.activeMaintenance, icon: Wrench, variant: "maintenance" as const },
        { title: "Total Tenants", value: stats.totalTenants, icon: Users, variant: "tenants" as const },
        { title: "Total Bookings", value: stats.totalBookings, icon: CalendarDays, variant: "bookings" as const },
        { title: "Total Units", value: stats.totalUnits, icon: BadgePercent, variant: "payments" as const },
        { title: "Occupied Units", value: stats.occupiedUnits, icon: AlertTriangle, variant: "maintenance" as const },
      ]
    : [];

  const revenueData = stats?.revenueByProperty?.map((r) => ({ property: r.property, revenue: r.revenue })) ?? [];
  const maintenanceData = stats?.maintenanceByCategory ?? [];

  const recentActivity = data?.recentActivity?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Section */}
      <DashboardWidget title="Dashboard" description="Welcome back. Here's what's happening across your portfolio." actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl"><CalendarDays className="mr-2 h-4 w-4" />Live Data</Button>
          <Link href="/properties/add"><Button size="sm" className="rounded-xl"><Plus className="mr-2 h-4 w-4" />Add Property</Button></Link>
        </div>
      } isLoading={isLoading} delay={0}>
        {!isLoading && stats && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border border-primary/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><Sparkles className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm font-semibold">Portfolio at a Glance</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalProperties} properties · {stats.totalUnits} units · {stats.occupancyRate}% occupied · ${(stats.totalRevenue / 1000000).toFixed(2)}M annual revenue
                </p>
              </div>
              <span className="ml-auto text-xs font-semibold text-emerald-500 flex items-center gap-1"><ArrowUpRight className="h-3 w-3" />Live</span>
            </div>
          </motion.div>
        )}
      </DashboardWidget>

      {/* 8 KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiData.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} isLoading={isLoading} />
        ))}
      </div>

      {/* Revenue & Occupancy Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardChartCard title="Revenue by Property" subtitle="Breakdown across portfolio" isLoading={isLoading} delay={0.1} skeletonHeight={300}>
          <RevenueByPropertyChart data={revenueData} />
        </DashboardChartCard>
        <DashboardChartCard title="Maintenance Categories" subtitle="Distribution by type" isLoading={isLoading} delay={0.15} skeletonHeight={300}>
          <MaintenancePieChart data={maintenanceData} />
        </DashboardChartCard>
      </div>

      {/* Revenue Trend & Occupancy */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardChartCard title="Revenue Trend" subtitle="Monthly revenue across all properties" badge={stats ? <Badge variant="success" className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />${(stats.totalRevenue / 1000).toFixed(0)}k monthly</Badge> : undefined} isLoading={isLoading} delay={0.2} skeletonHeight={300}>
          <RevenueChart
            data={
              stats?.revenueByProperty
                ? stats.revenueByProperty.map((r, i) => ({
                    month: r.property,
                    revenue: r.revenue,
                  }))
                : []
            }
          />
        </DashboardChartCard>
        <DashboardChartCard title="Occupancy Rate" subtitle="Portfolio-wide occupancy tracking" badge={stats ? <StatusChip variant="success" label={`${stats.occupancyRate}%`} pulse /> : undefined} isLoading={isLoading} delay={0.25} skeletonHeight={300}>
          <OccupancyChart
            data={
              stats
                ? [
                    { month: "Current", rate: stats.occupancyRate },
                  ]
                : []
            }
            rate={stats?.occupancyRate ?? 0}
          />
        </DashboardChartCard>
      </div>

      {/* Activity Timeline + Notification Widget */}
      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardWidget title="Activity Timeline" description="Recent events" className="lg:col-span-2" isLoading={isLoading} delay={0.3}>
          <ActivityTimeline
            items={
              recentActivity.length > 0
                ? recentActivity.map((act) => ({
                    id: act.id,
                    title: `${act.userName} ${act.action} ${act.target}`,
                    description: act.type,
                    timestamp: act.createdAt ? new Date(act.createdAt).toLocaleDateString() : "",
                    variant: act.type === "payment" ? "success" : act.type === "maintenance" ? "warning" : act.type === "property" ? "info" : "destructive",
                  } as any))
                : []
            }
            limit={5}
          />
        </DashboardWidget>
        <DashboardWidget title="Upcoming" description="Deadlines & reminders" actions={<Link href="/amenities/bookings" className="text-xs text-primary hover:underline">View All</Link>} isLoading={isLoading} delay={0.35}>
          <div className="space-y-3">
            {stats && (
              <>
                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <StatusChip variant="warning" label="" size="sm" />
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">Active Maintenance</p><p className="text-xs text-muted-foreground truncate">{stats.activeMaintenance} requests open</p></div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <StatusChip variant="info" label="" size="sm" />
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">Total Bookings</p><p className="text-xs text-muted-foreground truncate">{stats.totalBookings} bookings</p></div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <StatusChip variant="success" label="" size="sm" />
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">Properties</p><p className="text-xs text-muted-foreground truncate">{stats.totalProperties} total</p></div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <StatusChip variant="destructive" label="" size="sm" />
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">Tenants</p><p className="text-xs text-muted-foreground truncate">{stats.totalTenants} total</p></div>
                </div>
              </>
            )}
          </div>
        </DashboardWidget>
      </div>

      {/* Quick Actions */}
      <QuickActionsPanel actions={quickActions} isLoading={isLoading} delay={0.4} />
    </div>
  );
}