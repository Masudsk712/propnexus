"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Home,
  CalendarDays,
  CreditCard,
  Wrench,
  Bell,
  MapPin,
  ChevronRight,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/ui/kpi-card";
import { DashboardWidget } from "@/components/shared/dashboard-widget";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { QuickActionsPanel } from "@/components/shared/quick-actions-panel";
import Link from "next/link";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function TenantDashboardPage() {
  const { data: session } = useSession();
  const { logout } = useAuth();
  const { data, isLoading } = useDashboard();
  const stats = data?.stats;
  const recentActivity = data?.recentActivity ?? [];

  // Tenant-only focused stats
  const tenantStats = {
    myProperty: "Sunset Apartments, Unit 4B",
    rentAmount: 2450,
    rentDue: "June 30, 2026",
    rentStatus: "paid" as const,
    maintenanceCount: 2,
    openRequests: 1,
    upcomingBookings: 1,
    totalBookings: 3,
    notifications: 4,
  };

  const rentStatusConfig = {
    paid: { label: "Paid", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    pending: { label: "Pending", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
    overdue: { label: "Overdue", color: "text-red-500 bg-red-500/10 border-red-500/20" },
  };

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <motion.div {...fadeUp} className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-background border border-violet-500/20 p-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
              <Home className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Welcome home, {session?.user?.name || "Tenant"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {tenantStats.myProperty} · Lease active
              </p>
              <div className="flex items-center gap-3 mt-3">
                <Badge variant="default" className="bg-violet-500/15 text-violet-500 border-violet-500/20 gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  Tenant
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-violet-500" />
                  Building access active
                </span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="flex-shrink-0">
            Sign Out
          </Button>
        </div>
      </motion.div>

      {/* Tenant-specific KPI Cards */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard title="Monthly Rent" value={tenantStats.rentAmount} prefix="$" decimals={0} icon={DollarSign} variant="revenue" isLoading={isLoading} />
        <KPICard title="Maintenance" value={tenantStats.maintenanceCount} icon={Wrench} variant="maintenance" isLoading={isLoading} change={-50} changeLabel="from last month" />
        <KPICard title="Bookings" value={tenantStats.totalBookings} icon={CalendarDays} variant="bookings" isLoading={isLoading} change={1} changeLabel="upcoming" />
        <KPICard title="Notifications" value={tenantStats.notifications} icon={Bell} variant="tenants" isLoading={isLoading} />
      </motion.div>

      {/* My Property + Rent Status Row */}
      <motion.div {...fadeUp} transition={{ delay: 0.08 }} className="grid gap-4 lg:grid-cols-3">
        {/* My Property */}
        <div className="lg:col-span-2">
          <DashboardWidget title="My Property" description={tenantStats.myProperty} isLoading={isLoading} delay={0}>
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-violet-500/5 to-transparent border border-violet-500/10 p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/10">
                  <Home className="h-7 w-7 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base">{tenantStats.myProperty}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">123 Main Street, Apt 4B, New York, NY 10001</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-500 bg-emerald-500/10 rounded-full px-2 py-0.5">
                      <CheckCircle2 className="h-3 w-3" /> Lease Active
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-blue-500 bg-blue-500/10 rounded-full px-2 py-0.5">
                      <Clock className="h-3 w-3" /> 11 months remaining
                    </span>
                  </div>
                </div>
                <Link
                  href="/properties"
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors flex-shrink-0"
                >
                  View details
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </DashboardWidget>
        </div>

        {/* Rent Status */}
        <div>
          <DashboardWidget title="My Payments" description="Current month rent" isLoading={isLoading} delay={0}>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Rent Status</p>
                    <p className="text-[11px] text-muted-foreground">Due: {tenantStats.rentDue}</p>
                  </div>
                </div>
                <div className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border", rentStatusConfig[tenantStats.rentStatus].color)}>
                  {tenantStats.rentStatus === "paid" ? "Paid" : tenantStats.rentStatus === "pending" ? "Pending" : "Overdue"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/payments"
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50"
                >
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Pay Rent</span>
                </Link>
                <Link
                  href="/payments"
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">History</span>
                </Link>
              </div>
            </div>
          </DashboardWidget>
        </div>
      </motion.div>

      {/* My Maintenance + My Bookings Row */}
      <motion.div {...fadeUp} transition={{ delay: 0.12 }} className="grid gap-4 lg:grid-cols-2">
        <DashboardWidget title="My Maintenance Requests" description={`${tenantStats.openRequests} open request${tenantStats.openRequests !== 1 ? 's' : ''}`} isLoading={isLoading} delay={0}
          actions={
            <Link href="/maintenance/create">
              <Button variant="outline" size="sm" className="text-xs h-8">
                <Wrench className="h-3 w-3 mr-1" />New Request
              </Button>
            </Link>
          }>
          <div className="space-y-2">
            <Link
              href="/maintenance"
              className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-colors group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10">
                <Wrench className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium group-hover:text-amber-500 transition-colors">Leaking faucet - Kitchen</p>
                <p className="text-[11px] text-muted-foreground">Reported 2 days ago · Medium priority</p>
              </div>
              <Badge variant="warning" className="text-[10px] px-1.5 py-0.5">Open</Badge>
            </Link>
            <Link
              href="/maintenance"
              className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-colors group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                <Wrench className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium group-hover:text-blue-500 transition-colors">AC not cooling properly</p>
                <p className="text-[11px] text-muted-foreground">Reported 1 week ago · High priority</p>
              </div>
              <Badge variant="default" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] px-1.5 py-0.5">In Progress</Badge>
            </Link>
            <Link
              href="/maintenance"
              className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
            >
              View all requests <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </DashboardWidget>

        <DashboardWidget title="My Bookings" description="Your amenity reservations" isLoading={isLoading} delay={0}
          actions={
            <Link href="/amenities">
              <Button variant="outline" size="sm" className="text-xs h-8">
                <CalendarDays className="h-3 w-3 mr-1" />Book Now
              </Button>
            </Link>
          }>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10">
                <CalendarDays className="h-4 w-4 text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Gym - Morning Session</p>
                <p className="text-[11px] text-muted-foreground">Tomorrow, 7:00 AM · 1 hour</p>
              </div>
              <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] px-1.5 py-0.5">Confirmed</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10">
                <CalendarDays className="h-4 w-4 text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Pool - Weekend Reservation</p>
                <p className="text-[11px] text-muted-foreground">Saturday, 2:00 PM · 2 hours</p>
              </div>
              <Badge variant="default" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] px-1.5 py-0.5">Pending</Badge>
            </div>
            <Link
              href="/amenities/bookings"
              className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
            >
              View all bookings <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </DashboardWidget>
      </motion.div>

      {/* Notifications Section */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <DashboardWidget title="Notifications" description={`${tenantStats.notifications} unread updates`} isLoading={isLoading} delay={0}
          actions={
            <Link href="/notifications">
              <Button variant="ghost" size="sm" className="text-xs h-8">
                View all
              </Button>
            </Link>
          }>
          <div className="space-y-1">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="mt-0.5 h-2 w-2 rounded-full flex-shrink-0 bg-destructive" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Rent Reminder</p>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">2 days ago</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Your rent payment of $2,450 is due in 5 days.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="mt-0.5 h-2 w-2 rounded-full flex-shrink-0 bg-warning" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Maintenance Update</p>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">1 week ago</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Your AC repair request has been assigned to a technician.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="mt-0.5 h-2 w-2 rounded-full flex-shrink-0 bg-success" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Booking Confirmed</p>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">2 weeks ago</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Your gym reservation for tomorrow has been confirmed.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="mt-0.5 h-2 w-2 rounded-full flex-shrink-0 bg-info" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Building Notice</p>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">2 weeks ago</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Elevator maintenance scheduled for June 20th, 9AM-5PM.</p>
              </div>
            </div>
          </div>
        </DashboardWidget>
      </motion.div>

      {/* Quick Actions */}
      <motion.div {...fadeUp} transition={{ delay: 0.18 }}>
        <QuickActionsPanel
          actions={[
            { id: "pay-rent", title: "Pay Rent", description: "Make your monthly rent payment", icon: CreditCard, href: "/payments" },
            { id: "book-amenity", title: "Book Amenity", description: "Reserve gym, pool, or clubhouse", icon: CalendarDays, href: "/amenities" },
            { id: "report-issue", title: "Report Issue", description: "Submit a maintenance request", icon: Wrench, href: "/maintenance/create" },
          ]}
          isLoading={isLoading} delay={0}
        />
      </motion.div>
    </div>
  );
}