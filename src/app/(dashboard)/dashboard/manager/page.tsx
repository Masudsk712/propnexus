"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Building2,
  Users,
  Wrench,
  TrendingUp,
  ClipboardList,
  CalendarCheck,
  Star,
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function ManagerDashboardPage() {
  const { data: session } = useSession();
  const { logout } = useAuth();
  const { data, isLoading } = useDashboard();
  const stats = data?.stats;
  const recentActivity = data?.recentActivity?.slice(0, 4) ?? [];

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Welcome Banner */}
      <motion.div {...fadeUp} className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-background border border-emerald-500/20 p-4 md:p-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20 flex-shrink-0">
              <Briefcase className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold tracking-tight">
                Welcome, {session?.user?.name || "Manager"}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                Property portfolio · {stats?.totalProperties || 0} properties · {stats?.totalUnits || 0} units
              </p>
              <div className="flex items-center gap-2 md:gap-3 mt-2 flex-wrap">
                <Badge variant="default" className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20 gap-1.5 text-[10px] md:text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Portfolio Active
                </Badge>
                <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  ${((stats?.totalRevenue || 0) / 1000).toFixed(0)}k managed
                </span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="flex-shrink-0 text-xs h-8 md:h-9">
            Sign Out
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard title="Revenue" value={stats?.totalRevenue ?? 0} prefix="$" decimals={0} icon={TrendingUp} variant="revenue" isLoading={isLoading} change={8.3} changeLabel="this month" />
        <KPICard title="Properties" value={stats?.totalProperties ?? 0} icon={Building2} variant="default" isLoading={isLoading} change={1.5} changeLabel="new listings" />
        <KPICard title="Occupancy" value={stats?.occupancyRate ?? 0} suffix="%" icon={Star} variant="occupancy" isLoading={isLoading} change={2.1} changeLabel="vs last month" />
        <KPICard title="Maintenance" value={stats?.activeMaintenance ?? 0} icon={Wrench} variant="maintenance" isLoading={isLoading} change={-3.8} changeLabel="resolved" />
      </motion.div>

      {/* Charts Row */}
      <motion.div {...fadeUp} transition={{ delay: 0.08 }} className="grid gap-4 lg:grid-cols-2">
        <DashboardChartCard title="Revenue Trend" subtitle="Monthly portfolio revenue" isLoading={isLoading} delay={0} skeletonHeight={280}
          badge={<Badge variant="success" className="flex items-center gap-1 text-xs"><TrendingUp className="h-3 w-3" />${((stats?.totalRevenue || 0) / 1000).toFixed(0)}k total</Badge>}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={stats?.revenueByProperty?.map((r) => ({ month: r.property, revenue: r.revenue })) ?? []}>
              <defs>
                <linearGradient id="mgrRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.75rem" }} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#mgrRevenue)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </DashboardChartCard>

        <DashboardChartCard title="Maintenance Categories" subtitle="Distribution by type" isLoading={isLoading} delay={0} skeletonHeight={280}
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
      <motion.div {...fadeUp} transition={{ delay: 0.12 }} className="grid gap-3 md:gap-4 lg:grid-cols-2">
        <DashboardWidget title="Pending Maintenance" description="Requests requiring your attention" isLoading={isLoading} delay={0}>
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
            limit={4}
          />
        </DashboardWidget>

        <DashboardWidget title="Team Activity" description="Recent actions by your team" isLoading={isLoading} delay={0}>
          <ActivityTimeline
            items={recentActivity.map((act) => ({
              id: act.id,
              title: `${act.userName} ${act.action} ${act.target}`,
              description: act.type,
              timestamp: act.createdAt ? new Date(act.createdAt).toLocaleDateString() : "",
              variant: act.type === "payment" ? "success" : act.type === "maintenance" ? "warning" : "info",
            } as any))}
            limit={4}
          />
        </DashboardWidget>
      </motion.div>

      {/* Quick Actions */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="pb-2">
        <QuickActionsPanel
          actions={[
            { id: "view-props", title: "View Properties", description: "Manage your property portfolio", icon: Building2, href: "/properties" },
            { id: "manage-tenants", title: "Manage Tenants", description: "View and manage tenant records", icon: Users, href: "/tenants" },
            { id: "mgr-maintenance", title: "Maintenance", description: "Review and assign work orders", icon: Wrench, href: "/maintenance" },
          ]}
          isLoading={isLoading} delay={0}
        />
      </motion.div>
    </div>
  );
}