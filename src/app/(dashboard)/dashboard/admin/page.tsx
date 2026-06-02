// ============================================================================
// Admin Dashboard Page — Full-access dashboard for administrators
// ============================================================================

"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Shield, Users, Building2, Wrench, TrendingUp, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "@/components/ui/kpi-card";
import { DashboardWidget } from "@/components/shared/dashboard-widget";
import { DashboardChartCard } from "@/components/shared/dashboard-chart-card";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { QuickActionsPanel } from "@/components/shared/quick-actions-panel";
import { dashboardStats } from "@/data/mock";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState, useEffect } from "react";

export default function AdminDashboardPage() {
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
        title="Admin Dashboard"
        description={`Welcome, ${session?.user?.name || "Administrator"} — Full system access`}
        actions={
          <div className="flex gap-2">
            <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">Admin</Badge>
            <Button variant="outline" size="sm" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Sign Out</Button>
          </div>
        }
        isLoading={loading} delay={0}
      >
        {!loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border border-primary/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><Shield className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm font-semibold">System Health: Operational</p>
              <p className="text-xs text-muted-foreground">6 properties · 495 units · 100% uptime · API latency 42ms</p>
            </div>
            <span className="ml-auto text-xs font-semibold text-emerald-500 flex items-center gap-1"><TrendingUp className="h-3 w-3" />All systems go</span>
          </motion.div>
        )}
      </DashboardWidget>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard title="Total Revenue" value={dashboardStats.totalRevenue} prefix="$" decimals={0} icon={TrendingUp} change={12.5} changeLabel="vs last year" variant="revenue" sparklineData={[980, 1020, 1100, 1180, 1275]} isLoading={loading} />
        <KPICard title="Properties" value={dashboardStats.totalProperties} icon={Building2} variant="default" isLoading={loading} />
        <KPICard title="Occupancy" value={dashboardStats.occupancyRate} suffix="%" icon={TrendingUp} change={2.1} changeLabel="vs last month" variant="occupancy" sparklineData={[85, 86, 87, 88, 88]} isLoading={loading} />
        <KPICard title="Active Maintenance" value={dashboardStats.activeMaintenanceRequests} icon={Wrench} change={-15.3} changeLabel="vs last month" variant="maintenance" isLoading={loading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardChartCard title="Revenue Overview" subtitle="Monthly revenue trend" badge={<Badge variant="success" className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />+12.5%</Badge>} isLoading={loading} delay={0.1} skeletonHeight={300}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dashboardStats.monthlyRevenue}>
              <defs>
                <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.75rem" }} />
              <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="url(#adminRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </DashboardChartCard>

        <DashboardChartCard title="Maintenance Categories" subtitle="Distribution by type" badge={<Badge variant="warning">4 active</Badge>} isLoading={loading} delay={0.15} skeletonHeight={300}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={dashboardStats.maintenanceByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="count">
                {dashboardStats.maintenanceByCategory.map((_, i) => <Cell key={i} fill={["#6366f1","#8b5cf6","#a855f7","#d946ef","#ec4899","#f43f5e"][i % 6]} stroke="var(--card)" strokeWidth={2} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.75rem" }} />
            </PieChart>
          </ResponsiveContainer>
        </DashboardChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardChartCard title="Revenue by Property" subtitle="Breakdown across portfolio" isLoading={loading} delay={0.2} skeletonHeight={300}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardStats.revenueByProperty} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="property" stroke="var(--muted-foreground)" fontSize={12} width={120} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.75rem" }} />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]} fill="var(--primary)" />
            </BarChart>
          </ResponsiveContainer>
        </DashboardChartCard>

        <DashboardWidget title="Recent Activity" description="System-wide events" isLoading={loading} delay={0.25}>
          <ActivityTimeline
            items={[
              { id: "a1", title: "Payment of $2,800 received", description: "Skyline Towers Unit 12A", timestamp: "2 hours ago", variant: "success" },
              { id: "a2", title: "Elevator #3 repair started", description: "Metro Lofts — emergency maintenance", timestamp: "3 hours ago", variant: "destructive" },
              { id: "a3", title: "5 leases expiring within 30 days", description: "Greenwood Gardens — requires attention", timestamp: "1 day ago", variant: "warning" },
              { id: "a4", title: "New property listed on marketplace", description: "Palm Springs Villas", timestamp: "3 days ago", variant: "info" },
            ]}
            limit={4}
          />
        </DashboardWidget>
      </div>

      <QuickActionsPanel
        actions={[
          { id: "manage-users", title: "Manage Users", description: "View and manage system users", icon: Users, href: "/settings" },
          { id: "all-properties", title: "All Properties", description: "View full property portfolio", icon: Building2, href: "/properties" },
          { id: "maintenance-overview", title: "Maintenance", description: "Review all maintenance requests", icon: Wrench, href: "/maintenance" },
        ]}
        isLoading={loading} delay={0.3}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}
