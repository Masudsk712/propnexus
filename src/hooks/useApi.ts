// ============================================================================
// Reusable Data-Fetching Hooks — TanStack Query wrappers for all entities
// Supports pagination through query params.
// ============================================================================

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Property,
  Tenant,
  MaintenanceRequest,
  Amenity,
  Booking,
  Payment,
  Notification,
  ActivityLog,
  DashboardStats,
  ApiResponse,
} from "@/types";

// ── Generic fetcher ───────────────────────────────────────────────────────
async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json: ApiResponse<T> = await res.json();
  if (!json.success || !res.ok) throw new Error(json.error ?? "Request failed");
  return json.data as T;
}

// ── Pagination helper ─────────────────────────────────────────────────────
function paginationParams(page?: number, limit?: number): string {
  const params = new URLSearchParams();
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// ── Properties ────────────────────────────────────────────────────────────
export function useProperties(page?: number, limit?: number) {
  return useQuery({
    queryKey: ["properties", page, limit],
    queryFn: () => fetcher<Property[]>(`/api/properties${paginationParams(page, limit)}`),
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ["properties", id],
    queryFn: () => fetcher<Property>(`/api/properties/${id}`),
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetcher("/api/properties", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}

// ── Tenants ───────────────────────────────────────────────────────────────
export function useTenants(page?: number, limit?: number) {
  return useQuery({
    queryKey: ["tenants", page, limit],
    queryFn: () => fetcher<Tenant[]>(`/api/tenants${paginationParams(page, limit)}`),
  });
}

// ── Maintenance ───────────────────────────────────────────────────────────
export function useMaintenanceRequests(page?: number, limit?: number) {
  return useQuery({
    queryKey: ["maintenance", page, limit],
    queryFn: () => fetcher<MaintenanceRequest[]>(`/api/maintenance${paginationParams(page, limit)}`),
  });
}

export function useCreateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetcher("/api/maintenance", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ── Amenities ─────────────────────────────────────────────────────────────
export function useAmenities(page?: number, limit?: number) {
  return useQuery({
    queryKey: ["amenities", page, limit],
    queryFn: () => fetcher<Amenity[]>(`/api/amenities${paginationParams(page, limit)}`),
  });
}

// ── Bookings ──────────────────────────────────────────────────────────────
export function useBookings(page?: number, limit?: number) {
  return useQuery({
    queryKey: ["bookings", page, limit],
    queryFn: () => fetcher<Booking[]>(`/api/bookings${paginationParams(page, limit)}`),
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetcher("/api/bookings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ── Payments ──────────────────────────────────────────────────────────────
export function usePayments(page?: number, limit?: number) {
  return useQuery({
    queryKey: ["payments", page, limit],
    queryFn: () => fetcher<Payment[]>(`/api/payments${paginationParams(page, limit)}`),
  });
}

// ── Notifications ─────────────────────────────────────────────────────────
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetcher<Notification[]>("/api/notifications"),
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────
export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () =>
      fetcher<{
        stats: DashboardStats;
        recentActivity: ActivityLog[];
      }>("/api/dashboard/stats"),
  });
}