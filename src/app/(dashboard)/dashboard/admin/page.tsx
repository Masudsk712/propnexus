"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Building2,
  Wrench,
  TrendingUp,
  Activity,
  DollarSign,
  Home,
  CalendarCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/ui/kpi-card";
import { DashboardWidget } from "@/components/shared/dashboard-widget";
import { DashboardChartCard } from "@/components/shared/dashboard-chart-card";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { QuickActionsPanel } from "@/components/shared/quick-actions-panel";
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

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e"];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const { logout } = useAuth();
  const { data, isLoading } = useDashboard();
  const stats = data?.stats;
  const recentActivity = data?.recentActivity?.slice(0, 4) ?? [];

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <motion.div {...fadeUp} className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-amethyst shadow-lg shadow-primary/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Welcome back, {session?.user?.name || "Admin"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Full system oversight · {stats?.totalProperties || 0} properties · {stats?.totalUnits || 0} units · {stats?.occupancyRate || 0}% occupancy
              </p>
              <div className="flex items-center gap-3 mt-3">
                <Badge variant="default" className="bg-primary/15 text-primary border-primary/20 gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  System Operational
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  ${((stats?.totalRevenue || 0) / 1000).toFixed(0)}k monthly revenue
                </span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="flex-shrink-0">
            Sign Out
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard title="Total Revenue" value={stats?.totalRevenue ?? 0} prefix="$" decimals={0} icon={TrendingUp} variant="revenue" isLoading={isLoading} change={12.5} changeLabel="vs last month" />
        <KPICard title="Properties" value={stats?.totalProperties ?? 0} icon={Building2} variant="default" isLoading={isLoading} change={2.3} changeLabel="new this month" />
        <KPICard title="Occupancy" value={stats?.occupancyRate ?? 0} suffix="%" icon={Home} variant="occupancy" isLoading={isLoading} change={1.8} changeLabel="vs last quarter" />
        <KPICard title="Active Maintenance" value={stats?.activeMaintenance ?? 0} icon={Wrench} variant="maintenance" isLoading={isLoading} change={-5.2} changeLabel="resolved more" />
      </motion.div>

      {/* Charts Row */}
      <motion.div {...fadeUp} transition={{ delay: 0.08 }} className="grid gap-4 lg:grid-cols-2">
        <DashboardChartCard title="Revenue Overview" subtitle="Monthly revenue trend across all properties" isLoading={isLoading} delay={0} skeletonHeight={280}
          badge={<Badge variant="success" className="flex items-center gap-1 text-xs"><TrendingUp className="h-3 w-3" />${((stats?.totalRevenue || 0) / 1000).toFixed(0)}k total</Badge>}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={stats?.revenueByProperty?.map((r) => ({ month: r.property, revenue: r.revenue })) ?? []}>
              <defs>
                <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.75rem", boxShadow: "0 10px 30px -8px rgba(0,0,0,0.15)" }} />
              <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="url(#adminRevenue)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </DashboardChartCard>

        <DashboardChartCard title="Maintenance Categories" subtitle="Distribution by request type" isLoading={isLoading} delay={0} skeletonHeight={280}
          badge={<Badge variant="warning">{stats?.activeMaintenance || 0} active</Badge>}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={stats?.maintenanceByCategory ?? []} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="count">
                {(stats?.maintenanceByCategory ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--card)" strokeWidth={2} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.75rem" }} />
            </PieChart>
          </ResponsiveContainer>
        </DashboardChartCard>
      </motion.div>

      {/* Bottom Row */}
      <motion.div {...fadeUp} transition={{ delay: 0.12 }} className="grid gap-4 lg:grid-cols-2">
        <DashboardChartCard title="Revenue by Property" subtitle="Breakdown across portfolio" isLoading={isLoading} delay={0} skeletonHeight={280}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats?.revenueByProperty ?? []} layout="vertical" barCategoryGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="property" stroke="var(--muted-foreground)" fontSize={11} width={100} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.75rem" }} />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]} fill="var(--primary)" />
            </BarChart>
          </ResponsiveContainer>
        </DashboardChartCard>

        <DashboardWidget title="Recent Activity" description="System-wide events" isLoading={isLoading} delay={0}>
          <ActivityTimeline
            items={recentActivity.map((act) => ({
              id: act.id,
              title: `${act.userName} ${act.action} ${act.target}`,
              description: act.type,
              timestamp: act.createdAt ? new Date(act.createdAt).toLocaleDateString() : "",
              variant: act.type === "payment" ? "success" : act.type === "maintenance" ? "warning" : act.type === "property" ? "info" : "info",
            } as any))}
            limit={4}
          />
        </DashboardWidget>
      </motion.div>

      {/* Quick Actions */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <QuickActionsPanel
          actions={[
            { id: "manage-users", title: "Manage Users", description: "View and manage system users", icon: Users, href: "/settings" },
            { id: "all-properties", title: "All Properties", description: "View full property portfolio", icon: Building2, href: "/properties" },
            { id: "maintenance-overview", title: "Maintenance", description: "Review all maintenance requests", icon: Wrench, href: "/maintenance" },
          ]}
          isLoading={isLoading} delay={0}
        />
      </motion.div>
    </div>
  );
}