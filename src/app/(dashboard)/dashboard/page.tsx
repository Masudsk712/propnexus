"use client";

import { useState, useEffect, Suspense, memo } from "react";
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
  TrendingDown,
  CalendarDays,
  Plus,
  Sparkles,
  PieChart,
  BarChart3,
  BadgePercent,
  Home,
  Bell,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";

const RevenueChart = dynamic(() => import("./_charts/revenue-chart"), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-xl" /> });
const OccupancyChart = dynamic(() => import("./_charts/occupancy-chart"), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-xl" /> });
const RevenueByPropertyChart = dynamic(() => import("./_charts/revenue-by-property-chart"), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-xl" /> });
const MaintenancePieChart = dynamic(() => import("./_charts/maintenance-pie-chart"), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-xl" /> });

const mockRevenue = [
  { month: "Jan", revenue: 42000 }, { month: "Feb", revenue: 45000 },
  { month: "Mar", revenue: 48000 }, { month: "Apr", revenue: 51000 },
  { month: "May", revenue: 54000 }, { month: "Jun", revenue: 52000 },
  { month: "Jul", revenue: 58000 }, { month: "Aug", revenue: 61000 },
  { month: "Sep", revenue: 59000 }, { month: "Oct", revenue: 63000 },
  { month: "Nov", revenue: 67000 }, { month: "Dec", revenue: 72000 },
];
const mockOccupancy = [
  { month: "Jan", rate: 85 }, { month: "Feb", rate: 86 },
  { month: "Mar", rate: 87 }, { month: "Apr", rate: 88 },
  { month: "May", rate: 89 }, { month: "Jun", rate: 90 },
  { month: "Jul", rate: 91 }, { month: "Aug", rate: 90 },
  { month: "Sep", rate: 89 }, { month: "Oct", rate: 88 },
  { month: "Nov", rate: 87 }, { month: "Dec", rate: 88 },
];
const mockRevenueByProperty = [
  { property: "Skyline Towers", revenue: 72000 },
  { property: "Harbor View", revenue: 58000 },
  { property: "Oakwood", revenue: 45000 },
  { property: "Sunset Villas", revenue: 38000 },
  { property: "Park Avenue", revenue: 52000 },
];
const mockMaintenance = [
  { category: "Plumbing", count: 12 }, { category: "Electrical", count: 8 },
  { category: "HVAC", count: 15 }, { category: "Structural", count: 5 },
  { category: "Appliance", count: 10 }, { category: "Other", count: 6 },
];

const revenueSpark = [38, 41, 43, 45, 47, 46, 50, 52, 48, 54, 58, 72];
const occupancySpark = [85, 86, 87, 88, 89, 90, 91, 90, 89, 88, 87, 88];
const bookingsSpark = [4, 6, 5, 8, 7, 9, 6, 10, 8, 11, 9, 12];
const tenantsSpark = [120, 125, 130, 132, 135, 138, 140, 142, 145, 148, 150, 152];

const quickActions = [
  { id: "add-property", title: "Add Property", description: "List a new property in your portfolio", icon: Building2, href: "/properties/add" },
  { id: "create-maintenance", title: "Create Request", description: "Report or schedule maintenance", icon: Wrench, href: "/maintenance/create" },
  { id: "view-bookings", title: "View Bookings", description: "Check amenity bookings calendar", icon: CalendarDays, href: "/amenities/bookings" },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 1000); return () => clearTimeout(t); }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Section */}
      <DashboardWidget title="Dashboard" description="Welcome back. Here's what's happening across your portfolio." actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl"><CalendarDays className="mr-2 h-4 w-4" />Last 30 days</Button>
          <Link href="/properties/add"><Button size="sm" className="rounded-xl"><Plus className="mr-2 h-4 w-4" />Add Property</Button></Link>
        </div>
      } isLoading={loading} delay={0}>
        {!loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border border-primary/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><Sparkles className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm font-semibold">Portfolio at a Glance</p>
                <p className="text-xs text-muted-foreground">6 properties · 495 units · 88% occupied · $1.27M annual revenue</p>
              </div>
              <span className="ml-auto text-xs font-semibold text-emerald-500 flex items-center gap-1"><ArrowUpRight className="h-3 w-3" />+12.5% YoY</span>
            </div>
          </motion.div>
        )}
      </DashboardWidget>

      {/* 8 KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Total Revenue", value: 1275000, prefix: "$", decimals: 0, icon: DollarSign, change: 12.5, changeLabel: "vs last year", variant: "revenue" as const, sparklineData: revenueSpark },
          { title: "Properties", value: 6, icon: Building2, variant: "default" as const },
          { title: "Occupancy Rate", value: 88, suffix: "%", icon: PieChart, change: 2.1, changeLabel: "vs last month", variant: "occupancy" as const, sparklineData: occupancySpark },
          { title: "Active Maintenance", value: 4, icon: Wrench, change: -15.3, changeLabel: "vs last month", variant: "maintenance" as const },
          { title: "Total Tenants", value: 150, icon: Users, change: 5.2, changeLabel: "vs last month", variant: "tenants" as const, sparklineData: tenantsSpark },
          { title: "Total Bookings", value: 6, icon: CalendarDays, change: 8.7, changeLabel: "vs last month", variant: "bookings" as const, sparklineData: bookingsSpark },
          { title: "Net Operating Income", value: 892500, prefix: "$", decimals: 0, icon: BadgePercent, change: 14.3, changeLabel: "vs last year", variant: "payments" as const },
          { title: "Delinquency Rate", value: 3.2, suffix: "%", icon: AlertTriangle, change: -0.8, changeLabel: "vs last month", variant: "maintenance" as const },
        ].map((kpi, i) => (
          <KPICard key={kpi.title} {...kpi} isLoading={loading} />
        ))}
      </div>

      {/* Revenue & Occupancy Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardChartCard title="Revenue Trend" subtitle="Monthly revenue across all properties" badge={<Badge variant="success" className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />+12.5%</Badge>} isLoading={loading} delay={0.1} skeletonHeight={300}>
          <RevenueChart data={mockRevenue} />
        </DashboardChartCard>
        <DashboardChartCard title="Occupancy Rate" subtitle="Portfolio-wide occupancy tracking" badge={<StatusChip variant="success" label="88%" pulse />} isLoading={loading} delay={0.15} skeletonHeight={300}>
          <OccupancyChart data={mockOccupancy} rate={88} />
        </DashboardChartCard>
      </div>

      {/* Revenue by Property & Maintenance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardChartCard title="Revenue by Property" subtitle="Breakdown across portfolio" isLoading={loading} delay={0.2} skeletonHeight={300}>
          <RevenueByPropertyChart data={mockRevenueByProperty} />
        </DashboardChartCard>
        <DashboardChartCard title="Maintenance Categories" subtitle="Distribution by type" isLoading={loading} delay={0.25} skeletonHeight={300}>
          <MaintenancePieChart data={mockMaintenance} />
        </DashboardChartCard>
      </div>

      {/* Activity Timeline + Notification Widget */}
      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardWidget title="Activity Timeline" description="Recent events" className="lg:col-span-2" isLoading={loading} delay={0.3}>
          <ActivityTimeline
            items={[
              { id: "act-1", title: "Payment of $2,800 received", description: "Skyline Towers — Unit 12A rent payment processed", timestamp: "2 hours ago", variant: "success" },
              { id: "act-2", title: "Maintenance request created", description: "Leaking faucet — Skyline Towers Unit 12A", timestamp: "3 hours ago", variant: "warning" },
              { id: "act-3", title: "Property listed on marketplace", description: "Palm Springs Villas is now public", timestamp: "1 day ago", variant: "info" },
              { id: "act-4", title: "Lease expired — Unit 30A", description: "Greenwood Gardens — review renewal", timestamp: "2 days ago", variant: "destructive" },
              { id: "act-5", title: "Booking confirmed", description: "Clubhouse — Emily Davis — May 25", timestamp: "3 days ago", variant: "success" },
            ]}
            limit={5}
          />
        </DashboardWidget>
        <DashboardWidget title="Upcoming" description="Deadlines & reminders" actions={<Link href="/amenities/bookings" className="text-xs text-primary hover:underline">View All</Link>} isLoading={loading} delay={0.35}>
          <div className="space-y-3">
            {[
              { event: "Lease Expiration", unit: "4B - Skyline Towers", date: "Jun 15", variant: "warning" as const },
              { event: "Maintenance Due", unit: "2A - Harbor View", date: "Jun 18", variant: "info" as const },
              { event: "Booking", unit: "Gym - Skyline", date: "Jun 20", variant: "success" as const },
              { event: "Rent Due", unit: "12 tenants", date: "Jun 30", variant: "destructive" as const },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <StatusChip variant={item.variant} label="" size="sm" />
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{item.event}</p><p className="text-xs text-muted-foreground truncate">{item.unit}</p></div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{item.date}</span>
              </div>
            ))}
          </div>
        </DashboardWidget>
      </div>

      {/* Quick Actions */}
      <QuickActionsPanel actions={quickActions} isLoading={loading} delay={0.4} />
    </div>
  );
}