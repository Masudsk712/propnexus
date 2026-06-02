"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Fragment, useMemo } from "react";

// Map path segments to human-readable labels
const PATH_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Admin",
  manager: "Manager",
  tenant: "Tenant",
  properties: "Properties",
  add: "Add New",
  edit: "Edit",
  new: "New",
  tenants: "Tenants",
  payments: "Payments",
  maintenance: "Maintenance",
  create: "Create",
  amenities: "Amenities",
  bookings: "Bookings",
  notifications: "Notifications",
  settings: "Settings",
  analytics: "Analytics",
  activity: "Activity",
  overview: "Overview",
  profile: "Profile",
  reports: "Reports",
  import: "Import",
  export: "Export",
  archive: "Archive",
  history: "History",
};

/** Labels for breadcrumb when a dynamic ID segment is the last part */
const DYNAMIC_LABELS: Record<string, string> = {
  properties: "Property Details",
  tenants: "Tenant Details",
  payments: "Payment Details",
  maintenance: "Request Details",
  amenities: "Amenity Details",
  bookings: "Booking Details",
  notifications: "Notification Details",
  settings: "Settings Details",
  default: "Details",
};

export function Breadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs: { label: string; href: string; isLast: boolean }[] = [];

    // Always add home
    crumbs.push({ label: "Home", href: "/dashboard", isLast: segments.length === 0 });

    segments.forEach((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      const isLast = index === segments.length - 1;

      // Check if segment is a dynamic route (MongoDB ObjectId format: 24 hex chars)
      if (/^[a-f0-9]{24}$/i.test(segment)) {
        if (isLast && index > 0) {
          // Use context-aware label based on the parent segment
          const parentSegment = segments[index - 1] || "";
          const detailLabel = DYNAMIC_LABELS[parentSegment] ?? DYNAMIC_LABELS.default;
          crumbs.push({ label: detailLabel, href, isLast });
        }
        return;
      }

      const label = PATH_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      crumbs.push({ label, href, isLast });
    });

    return crumbs;
  }, [pathname]);

  // Don't show breadcrumbs on root dashboard (just home)
  if (breadcrumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      <ol className="flex items-center gap-1 flex-wrap">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
            )}
            {crumb.isLast ? (
              <span className="font-medium text-foreground truncate max-w-[200px]">
                {index === 0 ? (
                  <Home className="h-4 w-4 inline-block mr-1 -mt-0.5" />
                ) : null}
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className={cn(
                  "text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1 py-0.5"
                )}
              >
                {index === 0 ? (
                  <span className="flex items-center gap-1">
                    <Home className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{crumb.label}</span>
                  </span>
                ) : (
                  crumb.label
                )}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}