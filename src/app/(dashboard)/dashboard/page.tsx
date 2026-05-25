"use client";

import { dashboardStats, activities, properties } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber, formatPercentage, formatTimeAgo } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  DollarSign,
  Wrench,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  ArrowRight,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import Link from "next/link";

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e"];

function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 1.5,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  );
}

const statCards = [
  {
    title: "Total Revenue",
    value: dashboardStats.totalRevenue,
    change: dashboardStats.revenueChange,
    icon: DollarSign,
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500/10",
    format: (v: number) => formatCurrency(v),
  },
  {
    title: "Properties",
    value: dashboardStats.totalProperties,
    change: 0,
    icon: Building2,
    color: "from-blue-500 to-indigo-500",
    bgColor: "bg-blue-500/10",
    format: (v: number) => formatNumber(v),
  },
  {
    title: "Occupancy Rate",
    value: dashboardStats.occupancyRate,
    change: dashboardStats.occupancyChange,
    icon: Users,
    color: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-500/10",
    format: (v: number) => `${v}%`,
  },
  {
    title: "Maintenance",
    value: dashboardStats.activeMaintenanceRequests,
    change: dashboardStats.maintenanceChange,
    icon: Wrench,
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-500/10",
    format: (v: number) => formatNumber(v),
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  },
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, Alexandra. Here's what's happening across your portfolio.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <CalendarDays className="mr-2 h-4 w-4" />
            Last 30 days
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {statCards.map((card) => (
          <motion.div
            key={card.title}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="card-lift group relative overflow-hidden rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-xl ${card.bgColor} p-3`}>
                <card.icon className={`h-6 w-6 text-${card.color.split("-")[1]}-500`} />
              </div>
              {card.change !== 0 && (
                <Badge
                  variant={card.change > 0 ? "success" : "destructive"}
                  className="flex items-center gap-1"
                >
                  {card.change > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {formatPercentage(card.change)}
                </Badge>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className="text-2xl font-bold tracking-tight mt-1">
                {card.title === "Total Revenue" ? (
                  <AnimatedCounter value={card.value} prefix="$" />
                ) : card.title === "Occupancy Rate" ? (
                  <AnimatedCounter value={card.value} suffix="%" />
                ) : (
                  <AnimatedCounter value={card.value} />
                )}
              </p>
            </div>
            {/* Gradient background on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">Revenue Trend</h3>
              <p className="text-sm text-muted-foreground">Monthly revenue overview</p>
            </div>
            <Badge variant="success" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12.5%
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dashboardStats.monthlyRevenue}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Occupancy Chart */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">Occupancy Rate</h3>
              <p className="text-sm text-muted-foreground">Portfolio occupancy trend</p>
            </div>
            <Badge variant="info" className="flex items-center gap-1">
              {dashboardStats.occupancyRate}%
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardStats.occupancyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={12}
                domain={[80, 92]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                }}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="var(--info)"
                strokeWidth={2}
                dot={{ fill: "var(--info)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue by Property */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-border bg-card p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">Revenue by Property</h3>
              <p className="text-sm text-muted-foreground">Monthly revenue distribution</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardStats.revenueByProperty} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                type="number"
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="property"
                stroke="var(--muted-foreground)"
                fontSize={12}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                }}
              />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]} fill="var(--primary)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Maintenance by Category */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">Maintenance</h3>
              <p className="text-sm text-muted-foreground">By category</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardStats.maintenanceByCategory}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
              >
                {dashboardStats.maintenanceByCategory.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {dashboardStats.maintenanceByCategory.map((item, index) => (
              <div key={item.category} className="flex items-center gap-2 text-xs">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-muted-foreground">{item.category}</span>
                <span className="font-medium ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-lg">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">Latest actions across your portfolio</p>
          </div>
          <Link href="/dashboard/activity">
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="space-y-4">
          {activities.slice(0, 5).map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50"
            >
              <img
                src={activity.userAvatar}
                alt={activity.userName}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{activity.userName}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>{" "}
                  <span className="font-medium">{activity.target}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeAgo(activity.createdAt)}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {activity.type}
              </Badge>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 sm:grid-cols-3"
      >
        {[
          {
            title: "Add Property",
            icon: Building2,
            href: "/properties/add",
            color: "bg-blue-500/10 text-blue-500",
          },
          {
            title: "Create Maintenance Request",
            icon: Wrench,
            href: "/maintenance/create",
            color: "bg-orange-500/10 text-orange-500",
          },
          {
            title: "View Bookings",
            icon: CalendarDays,
            href: "/amenities/bookings",
            color: "bg-violet-500/10 text-violet-500",
          },
        ].map((action) => (
          <Link key={action.title} href={action.href}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:border-primary/50"
            >
              <div className={`rounded-xl p-3 ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{action.title}</p>
                <p className="text-xs text-muted-foreground">Click to get started</p>
              </div>
              <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6">
            <div className="flex justify-between">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-24 mt-4" />
            <Skeleton className="h-8 w-32 mt-2" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}