"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Briefcase, Building2, Users, Wrench, TrendingUp, LogOut } from "lucide-react";
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

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e"];

export default function ManagerDashboardPage() {
  const { data: session } = useSession();
  const { logout } = useAuth();
  const { data, isLoading } = useDashboard();
  const stats = data?.stats;
  const recentActivity = data?.recentActivity?.slice(0, 4) ?? [];

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
        isLoading={isLoading} delay={0}
      >
        {!isLoading && stats && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-500/5 via-emerald-500/3 to-transparent border border-emerald-500/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10"><Briefcase className="h-5 w-5 text-emerald-500" /></div>
            <div>
              <p className="text-sm font-semibold">Portfolio Performance</p>
              <p className="text-xs text-muted-foreground">{stats.totalProperties} properties · {stats.totalUnits} units · {stats.occupancyRate}% occupied · ${(stats.totalRevenue / 1000).toFixed(0)}k monthly</p>
            </div>
            <span className="ml-auto text-xs font-semibold text-emerald-500 flex items-center gap-1"><TrendingUp className="h-3 w-3" />Live data</span>
          </motion.div>
        )}
      </DashboardWidget>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard title="Revenue" value={stats?.totalRevenue ?? 0} prefix="$" decimals={0} icon={TrendingUp} variant="revenue" isLoading={isLoading} />
        <KPICard title="Properties" value={stats?.totalProperties ?? 0} icon={Building2} variant="default" isLoading={isLoading} />
        <KPICard title="Occupancy" value={stats?.occupancyRate ?? 0} suffix="%" icon={TrendingUp} variant="occupancy" isLoading={isLoading} />
        <KPICard title="Requests" value={stats?.activeMaintenance ?? 0} icon={Wrench} variant="maintenance" isLoading={isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardChartCard title="Revenue Trend" subtitle="Monthly portfolio revenue" isLoading={isLoading} delay={0.1} skeletonHeight={300}
          badge={stats ? <Badge variant="success" className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />${(stats.totalRevenue / 1000).toFixed(0)}k total</Badge> : undefined}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats?.revenueByProperty?.map((r) => ({ month: r.property, revenue: r.revenue })) ?? []}>
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

        <DashboardChartCard title="Maintenance Categories" subtitle="Distribution by type" isLoading={isLoading} delay={0.15} skeletonHeight={300}
          badge={stats ? <Badge variant="warning">{stats.activeMaintenance} active</Badge> : undefined}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stats?.maintenanceByCategory ?? []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="count">
                {(stats?.maintenanceByCategory ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--card)" strokeWidth={2} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.75rem" }} />
            </PieChart>
          </ResponsiveContainer>
        </DashboardChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardWidget title="Pending Maintenance" description="Requests requiring attention" isLoading={isLoading} delay={0.2}>
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

        <DashboardWidget title="Team Activity" description="Recent actions by your team" isLoading={isLoading} delay={0.25}>
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
      </div>

      <QuickActionsPanel
        actions={[
          { id: "view-props", title: "View Properties", description: "Manage your property portfolio", icon: Building2, href: "/properties" },
          { id: "manage-tenants", title: "Manage Tenants", description: "View and manage tenant records", icon: Users, href: "/tenants" },
          { id: "mgr-maintenance", title: "Maintenance", description: "Review and assign work orders", icon: Wrench, href: "/maintenance" },
        ]}
        isLoading={isLoading} delay={0.3}
      />
    </div>
  );
}