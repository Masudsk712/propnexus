"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Wrench,
  DollarSign,
  Sparkles,
  FileText,
  Building2,
  MapPin,
  Bed,
  Bath,
  Ruler,
  Calendar,
  TrendingUp,
  Check,
  Shield,
  Wifi,
  Car,
  Wind,
  Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PropertyDetailsTabsProps {
  property: {
    id: string;
    title: string;
    name: string;
    description?: string | null;
    type: string;
    status: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    rent: number;
    securityDeposit: number;
    bedrooms?: number | null;
    bathrooms?: number | null;
    area?: number | null;
    squareFeet?: number | null;
    amenities?: string[];
    images?: string[];
    image?: string | null;
    units?: number;
    occupiedUnits?: number;
    monthlyRevenue?: number;
    yearBuilt?: number | null;
    createdAt?: string;
    updatedAt?: string;
  };
  className?: string;
}

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tenants", label: "Tenants", icon: Users },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "financials", label: "Financials", icon: DollarSign },
  { id: "amenities", label: "Amenities", icon: Sparkles },
  { id: "documents", label: "Documents", icon: FileText },
] as const;

type TabId = (typeof tabs)[number]["id"];

const amenityIcons: Record<string, React.ElementType> = {
  "Air Conditioning": Wind,
  Parking: Car,
  "Covered Parking": Car,
  Gym: TrendingUp,
  Pool: Sparkles,
  "Swimming Pool": Sparkles,
  WiFi: Wifi,
  "Security Guard": Shield,
  "Gated Community": Shield,
  CCTV: Shield,
};

export function PropertyDetailsTabs({
  property,
  className,
}: PropertyDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const occupancyRate =
    property.units && property.units > 0
      ? Math.round(((property.occupiedUnits ?? 0) / property.units) * 100)
      : 0;

  const isUnitProperty =
    property.units && property.units > 1;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Tab Navigation */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Description & Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Description */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  About This Property
                </h3>
                {property.description ? (
                  <p className="text-muted-foreground leading-relaxed">
                    {property.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    No description provided.
                  </p>
                )}
              </div>

              {/* Quick Details */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  Quick Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      icon: Bed,
                      label: "Bedrooms",
                      value: property.bedrooms ?? "-",
                    },
                    {
                      icon: Bath,
                      label: "Bathrooms",
                      value: property.bathrooms ?? "-",
                    },
                    {
                      icon: Ruler,
                      label: "Area",
                      value: property.area
                        ? `${property.area} ft²`
                        : "-",
                    },
                    {
                      icon: Calendar,
                      label: "Year Built",
                      value: property.yearBuilt ?? "-",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-xl bg-muted/50 p-3"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="text-sm font-semibold">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Occupancy Section */}
            {property.units && property.units > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-primary" />
                  Occupancy
                </h3>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {property.occupiedUnits ?? 0} of {property.units} units
                      occupied
                    </p>
                  </div>
                  <span className="text-2xl font-bold">{occupancyRate}%</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${occupancyRate}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      occupancyRate > 80
                        ? "bg-emerald-500"
                        : occupancyRate > 40
                          ? "bg-amber-500"
                          : "bg-red-500",
                    )}
                  />
                </div>
              </div>
            )}

            {/* Location */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-primary" />
                Location
              </h3>
              <p className="text-muted-foreground">
                {property.address}, {property.city}, {property.state}{" "}
                {property.zipCode}
              </p>
            </div>
          </div>
        )}

        {/* Tenants Tab - Placeholder (not in scope) */}
        {activeTab === "tenants" && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tenant Management</h3>
            <p className="text-muted-foreground">
              Tenant management will be available in a future update.
            </p>
          </div>
        )}

        {/* Maintenance Tab - Placeholder */}
        {activeTab === "maintenance" && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-4">
              <Wrench className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Maintenance Requests
            </h3>
            <p className="text-muted-foreground">
              Maintenance tracking will be available in a future update.
            </p>
          </div>
        )}

        {/* Financials Tab */}
        {activeTab === "financials" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-primary" />
                Financial Overview
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-4">
                  <p className="text-xs text-muted-foreground">Monthly Rent</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(property.rent)}
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4">
                  <p className="text-xs text-muted-foreground">
                    Security Deposit
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(property.securityDeposit)}
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-600/5 p-4">
                  <p className="text-xs text-muted-foreground">
                    Monthly Revenue
                  </p>
                  <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                    {formatCurrency(property.monthlyRevenue ?? 0)}
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-4">
                  <p className="text-xs text-muted-foreground">Units</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {property.units ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Amenities Tab */}
        {activeTab === "amenities" && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Amenities
            </h3>
            {property.amenities && property.amenities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {property.amenities.map((amenity: string) => {
                  const Icon = amenityIcons[amenity] ?? Check;
                  return (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm hover:border-primary/30 hover:bg-muted/30 transition-all"
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      <span>{amenity}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                No amenities listed for this property.
              </p>
            )}
          </div>
        )}

        {/* Documents Tab - Placeholder */}
        {activeTab === "documents" && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Property Documents
            </h3>
            <p className="text-muted-foreground">
              Document management will be available in a future update.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}