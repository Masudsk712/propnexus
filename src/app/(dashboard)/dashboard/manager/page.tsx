// ============================================================================
// Manager Dashboard Page — Property management dashboard
// ============================================================================

"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Briefcase, Building2, Users, Wrench, TrendingUp, LogOut } from "lucide-react";
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

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e"];

export default function ManagerDashboardPage() {
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
        title="Manager Dashboard"
        description={`Welcome, ${session?.user?.name || "Manager"} — Property management`}
        actions={
          <div className="flex gap-2">
            <Badge variant="default" className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Manager</Badge>
            <Button variant="outline" size="sm" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Sign Out</Button>
          </div>
        }
        isLoading={loading} delay={0}
      >
        {!loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-500/5 via-emerald-500/3 to-transparent border border-emerald-500/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10"><Briefcase className="h-5 w-5 text-emerald-500" /></div>
            <div>
              <p className="text-sm font-semibold">Portfolio Performance</p>
              <p className="text-xs text-muted-foreground">6 properties · 495 units · $1.27M revenue · 88% occupancy</p>
            </div>
            <span className="ml-auto text-xs font-semibold text-emerald-500 flex items-center gap-1"><TrendingUp className="h-3 w-3" />+12.5% YoY</span>
          </motion.div>
        )}
      </DashboardWidget>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard title="Revenue" value={dashboardStats.totalRevenue} prefix="$" decimals={0} icon={TrendingUp} change={12.5} changeLabel="vs last year" variant="revenue" sparklineData={[980, 1020, 1100, 1180, 1275]} isLoading={loading} />
        <KPICard title="Properties" value={dashboardStats.totalProperties} icon={Building2} variant="default" isLoading={loading} />
        <KPICard title="Occupancy" value={dashboardStats.occupancyRate} suffix="%" icon={TrendingUp} change={2.1} changeLabel="vs last month" variant="occupancy" isLoading={loading} />
        <KPICard title="Requests" value={dashboardStats.activeMaintenanceRequests} icon={Wrench} change={-15.3} changeLabel="vs last month" variant="maintenance" isLoading={loading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardChartCard title="Revenue Trend" subtitle="Monthly portfolio revenue" badge={<Badge variant="success" className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />+12.5%</Badge>} isLoading={loading} delay={0.1} skeletonHeight={300}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dashboardStats.monthlyRevenue}>
              <defs>
                <linearGradient id="mgrRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.75rem" }} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#mgrRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </DashboardChartCard>

        <DashboardChartCard title="Maintenance Categories" subtitle="Distribution by type" badge={<Badge variant="warning">4 active</Badge>} isLoading={loading} delay={0.15} skeletonHeight={300}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={dashboardStats.maintenanceByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="count">
                {dashboardStats.maintenanceByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--card)" strokeWidth={2} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.75rem" }} />
            </PieChart>
          </ResponsiveContainer>
        </DashboardChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardWidget title="Pending Maintenance" description="Requests requiring attention" isLoading={loading} delay={0.2}>
          <ActivityTimeline
            items={[
              { id: "m1", title: "Elevator #3 out of service", description: "Metro Lofts — East wing — Emergency", timestamp: "1 hour ago", variant: "destructive" },
              { id: "m2", title: "Cracked lobby window", description: "Skyline Towers — Assessment needed", timestamp: "1 day ago", variant: "warning" },
              { id: "m3", title: "Pest infestation break room", description: "The Commerce Center — Suite 300", timestamp: "2 days ago", variant: "warning" },
              { id: "m4", title: "Leaking faucet kitchen", description: "Skyline Towers — Unit 12A", timestamp: "3 days ago", variant: "info" },
            ]}
            limit={4}
          />
        </DashboardWidget>

        <DashboardWidget title="Team Activity" description="Recent actions by your team" isLoading={loading} delay={0.25}>
          <ActivityTimeline
            items={[
              { id: "t1", title: "Carlos started AC repair", description: "Harbor View Complex — Unit 5C", timestamp: "3 hours ago", variant: "info" },
              { id: "t2", title: "Linda completed dishwasher fix", description: "Greenwood Gardens — Unit 22B", timestamp: "1 day ago", variant: "success" },
              { id: "t3", title: "David dispatched emergency crew", description: "Metro Lofts — Elevator #3", timestamp: "2 days ago", variant: "destructive" },
              { id: "t4", title: "Pest Control scheduled visit", description: "The Commerce Center — Break room", timestamp: "3 days ago", variant: "info" },
            ]}
            limit={4}
          />
        </DashboardWidget>
      </div>

      <QuickActionsPanel
        actions={[
          { id: "view-props", title: "View Properties", description: "Manage your property portfolio", icon: Building2, href: "/properties" },
          { id: "manage-tenants", title: "Manage Tenants", description: "View and manage tenant records", icon: Users, href: "/tenants" },
          { id: "mgr-maintenance", title: "Maintenance", description: "Review and assign work orders", icon: Wrench, href: "/maintenance" },
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
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}