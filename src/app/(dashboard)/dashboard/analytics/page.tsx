"use client";

import { dashboardStats } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign,
  Building2, Users, CalendarDays,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { formatCurrency, formatPercentage } from "@/lib/utils";

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e"];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setLoading(false), 700); }, []);

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-48" /><div className="grid gap-6 lg:grid-cols-2">{[1,2,3,4].map((i) => (<Skeleton key={i} className="h-96 rounded-xl" />))}</div></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Detailed insights into your portfolio performance</p>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Revenue Growth", value: formatPercentage(dashboardStats.revenueChange), icon: DollarSign, up: dashboardStats.revenueChange > 0, color: "bg-emerald-500/10 text-emerald-500" },
          { label: "Occupancy Change", value: formatPercentage(dashboardStats.occupancyChange), icon: Users, up: dashboardStats.occupancyChange > 0, color: "bg-blue-500/10 text-blue-500" },
          { label: "Maint. Change", value: formatPercentage(dashboardStats.maintenanceChange), icon: Wrench, up: dashboardStats.maintenanceChange < 0, color: "bg-orange-500/10 text-orange-500" },
          { label: "Booking Change", value: formatPercentage(dashboardStats.bookingChange), icon: CalendarDays, up: dashboardStats.bookingChange > 0, color: "bg-violet-500/10 text-violet-500" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className={`rounded-lg p-2.5 ${kpi.color}`}><kpi.icon className="h-5 w-5" /></div>
              <Badge variant={kpi.up ? "success" : "destructive"}>
                {kpi.up ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                {kpi.value}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-3">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-lg mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dashboardStats.monthlyRevenue}>
              <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} /><stop offset="95%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.75rem" }} />
              <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-lg mb-4">Occupancy Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardStats.occupancyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} domain={[80, 92]} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.75rem" }} />
              <Line type="monotone" dataKey="rate" stroke="var(--info)" strokeWidth={2} dot={{ fill: "var(--info)", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-lg mb-4">Revenue by Property</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardStats.revenueByProperty} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="property" stroke="var(--muted-foreground)" fontSize={12} width={110} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.75rem" }} />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]} fill="var(--primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-lg mb-4">Maintenance Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={dashboardStats.maintenanceByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="count">
                {dashboardStats.maintenanceByCategory.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--card)" strokeWidth={2} />))}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.75rem" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {dashboardStats.maintenanceByCategory.map((item, i) => (
              <div key={item.category} className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground">{item.category}</span>
                <span className="font-medium ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import { Wrench } from "lucide-react";