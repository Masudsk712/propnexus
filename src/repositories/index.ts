// ============================================================================
// Repository Layer — Optimized Data-Access Wrappers over Prisma
// Uses selective field projection, pagination, and minimal includes.
// ============================================================================

import prisma from "@/lib/prisma";
import type {
  CreatePropertyInput,
  UpdatePropertyInput,
  CreateTenantInput,
  CreateMaintenanceInput,
  CreateAmenityInput,
  CreateBookingInput,
  CreatePaymentInput,
  CreateInvoiceInput,
  CreateNotificationInput,
  CreateActivityLogInput,
  CreateLateFeeConfigInput,
  CreateRazorpayOrderInput,
  VerifyRazorpayPaymentInput,
  UpdateInvoiceInput,
} from "@/validations";

// ── Helpers ────────────────────────────────────────────────────────────────

type Pagination = { page?: number; limit?: number };
type PaginatedResult<T> = { data: T[]; total: number; page: number; limit: number; totalPages: number };

async function paginate<T>(
  queryFn: () => Promise<T[]>,
  countFn: () => Promise<number>,
  { page = 1, limit = 20 }: Pagination
): Promise<PaginatedResult<T>> {
  const [data, total] = await Promise.all([queryFn(), countFn()]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ────────────────────────────────────────────────────────────────────────────
// Properties
// ────────────────────────────────────────────────────────────────────────────
export const propertyRepo = {
  /** Lightweight list — only fields needed for cards/lists */
  findAll(pagination?: Pagination) {
    const { page = 1, limit = 20 } = pagination ?? {};
    const select = {
      id: true, title: true, name: true, type: true, status: true,
      city: true, state: true, rent: true, bedrooms: true, bathrooms: true,
      area: true, image: true, images: true, units: true, occupiedUnits: true,
      monthlyRevenue: true, createdAt: true,
    } as const;
    const query = () =>
      prisma.property.findMany({
        select,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });
    const count = () => prisma.property.count();
    return paginate(query, count, { page, limit });
  },

  /** Full detail with relations */
  findById(id: string) {
    return prisma.property.findUnique({
      where: { id },
      include: {
        tenants: { select: { id: true, unit: true, status: true, user: { select: { name: true, email: true } } } },
        maintenanceRequests: { select: { id: true, title: true, status: true, priority: true, createdAt: true }, take: 5, orderBy: { createdAt: "desc" } },
      },
    });
  },

  create(input: CreatePropertyInput) {
    return prisma.property.create({ data: input as any });
  },

  update(id: string, input: UpdatePropertyInput) {
    return prisma.property.update({ where: { id }, data: input as any });
  },

  delete(id: string) {
    return prisma.property.delete({ where: { id } });
  },

  count() {
    return prisma.property.count();
  },

  countByStatus() {
    return prisma.property.groupBy({ by: ["status"], _count: true });
  },

  countByType() {
    return prisma.property.groupBy({ by: ["type"], _count: true });
  },

  /** Optimized analytics — single aggregate query */
  async getAnalytics() {
    const [total, statusBreakdown, typeBreakdown, aggregates] = await Promise.all([
      prisma.property.count(),
      prisma.property.groupBy({ by: ["status"], _count: true, _sum: { rent: true } }),
      prisma.property.groupBy({ by: ["type"], _count: true }),
      // Use aggregate to avoid fetching all records
      prisma.property.aggregate({
        _sum: { rent: true, monthlyRevenue: true, units: true, occupiedUnits: true },
      }),
    ]);

    // City breakdown via lightweight groupBy
    const cityBreakdown = await prisma.property.groupBy({
      by: ["city"],
      _count: true,
    });

    const totalRent = aggregates._sum.rent ?? 0;
    const totalRevenue = aggregates._sum.monthlyRevenue ?? 0;
    const totalUnits = aggregates._sum.units ?? 0;
    const occupiedUnits = aggregates._sum.occupiedUnits ?? 0;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    return {
      total,
      totalRent,
      totalRevenue,
      totalUnits,
      occupiedUnits,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      statusBreakdown: statusBreakdown.map(s => ({ status: s.status, count: s._count, totalRent: s._sum.rent ?? 0 })),
      typeBreakdown: typeBreakdown.map(t => ({ type: t.type, count: t._count })),
      cityBreakdown: cityBreakdown.map(({ city, _count }) => ({ city, count: _count })),
    };
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Tenants
// ────────────────────────────────────────────────────────────────────────────
export const tenantRepo = {
  findAll(pagination?: Pagination) {
    const { page = 1, limit = 20 } = pagination ?? {};
    const select = {
      id: true, unit: true, status: true, leaseStart: true, leaseEnd: true,
      rentAmount: true, securityDeposit: true, createdAt: true,
      user: { select: { id: true, name: true, email: true, phone: true } },
      property: { select: { id: true, name: true, address: true, city: true } },
    } as const;
    const query = () =>
      prisma.tenant.findMany({
        select,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });
    const count = () => prisma.tenant.count();
    return paginate(query, count, { page, limit });
  },

  findByProperty(propertyId: string) {
    return prisma.tenant.findMany({
      where: { propertyId },
      select: { id: true, unit: true, status: true, rentAmount: true, leaseEnd: true, user: { select: { name: true, email: true } } },
    });
  },

  findByUser(userId: string) {
    return prisma.tenant.findMany({
      where: { userId },
      select: { id: true, unit: true, status: true, rentAmount: true, leaseEnd: true, property: { select: { name: true, address: true } } },
    });
  },

  findById(id: string) {
    return prisma.tenant.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, image: true } },
        property: { select: { id: true, name: true, address: true, city: true, state: true } },
      },
    });
  },

  create(input: CreateTenantInput) {
    return prisma.tenant.create({ data: input as any });
  },

  update(id: string, data: Partial<CreateTenantInput>) {
    return prisma.tenant.update({ where: { id }, data: data as any });
  },

  delete(id: string) {
    return prisma.tenant.delete({ where: { id } });
  },

  count() {
    return prisma.tenant.count();
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Maintenance
// ────────────────────────────────────────────────────────────────────────────
export const maintenanceRepo = {
  findAll(pagination?: Pagination) {
    const { page = 1, limit = 20 } = pagination ?? {};
    const select = {
      id: true, title: true, category: true, priority: true, status: true,
      unit: true, propertyName: true, createdAt: true, updatedAt: true,
      property: { select: { id: true, name: true } },
      assignedUser: { select: { id: true, name: true } },
    } as const;
    const query = () =>
      prisma.maintenanceRequest.findMany({
        select,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });
    const count = () => prisma.maintenanceRequest.count();
    return paginate(query, count, { page, limit });
  },

  findByProperty(propertyId: string) {
    return prisma.maintenanceRequest.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true, priority: true, createdAt: true, assignedUser: { select: { name: true } } },
    });
  },

  findById(id: string) {
    return prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, name: true, address: true } },
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    });
  },

  create(input: CreateMaintenanceInput) {
    return prisma.maintenanceRequest.create({ data: input as any });
  },

  update(id: string, data: Partial<CreateMaintenanceInput> & { resolvedAt?: Date }) {
    return prisma.maintenanceRequest.update({ where: { id }, data: data as any });
  },

  delete(id: string) {
    return prisma.maintenanceRequest.delete({ where: { id } });
  },

  countByStatus() {
    return prisma.maintenanceRequest.groupBy({ by: ["status"], _count: true });
  },

  countByCategory() {
    return prisma.maintenanceRequest.groupBy({ by: ["category"], _count: true });
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Amenities
// ────────────────────────────────────────────────────────────────────────────
export const amenityRepo = {
  findAll(pagination?: Pagination) {
    const { page = 1, limit = 20 } = pagination ?? {};
    const select = {
      id: true, name: true, type: true, status: true, capacity: true,
      openTime: true, closeTime: true, requiresBooking: true, image: true,
      property: { select: { id: true, name: true } },
    } as const;
    const query = () =>
      prisma.amenity.findMany({
        select,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });
    const count = () => prisma.amenity.count();
    return paginate(query, count, { page, limit });
  },

  findByProperty(propertyId: string) {
    return prisma.amenity.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, type: true, status: true },
    });
  },

  findById(id: string) {
    return prisma.amenity.findUnique({
      where: { id },
      include: { property: { select: { id: true, name: true } } },
    });
  },

  create(input: CreateAmenityInput) {
    return prisma.amenity.create({ data: input as any });
  },

  update(id: string, data: Partial<CreateAmenityInput>) {
    return prisma.amenity.update({ where: { id }, data: data as any });
  },

  delete(id: string) {
    return prisma.amenity.delete({ where: { id } });
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Bookings
// ────────────────────────────────────────────────────────────────────────────
export const bookingRepo = {
  findAll(pagination?: Pagination) {
    const { page = 1, limit = 20 } = pagination ?? {};
    const select = {
      id: true, date: true, startTime: true, endTime: true, status: true,
      guestCount: true, propertyName: true, amenityName: true,
      property: { select: { id: true, name: true } },
      amenity: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    } as const;
    const query = () =>
      prisma.booking.findMany({
        select,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });
    const count = () => prisma.booking.count();
    return paginate(query, count, { page, limit });
  },

  findByProperty(propertyId: string) {
    return prisma.booking.findMany({
      where: { propertyId },
      orderBy: { date: "desc" },
      select: { id: true, date: true, status: true, amenityName: true, user: { select: { name: true } } },
    });
  },

  findByUser(userId: string) {
    return prisma.booking.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      select: { id: true, date: true, status: true, propertyName: true, amenityName: true },
    });
  },

  findById(id: string) {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, name: true } },
        amenity: { select: { id: true, name: true, type: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  },

  create(input: CreateBookingInput) {
    return prisma.booking.create({ data: input as any });
  },

  update(id: string, data: Partial<CreateBookingInput>) {
    return prisma.booking.update({ where: { id }, data: data as any });
  },

  delete(id: string) {
    return prisma.booking.delete({ where: { id } });
  },

  count() {
    return prisma.booking.count();
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Payments
// ────────────────────────────────────────────────────────────────────────────
export const paymentRepo = {
  findAll(pagination?: Pagination) {
    const { page = 1, limit = 20 } = pagination ?? {};
    const select = {
      id: true, amount: true, type: true, status: true, method: true,
      dueDate: true, paidAt: true, createdAt: true, stripeSessionId: true,
      stripePaymentIntentId: true, receiptUrl: true,
      tenant: { select: { id: true, unit: true } },
      property: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
    } as const;
    const query = () =>
      prisma.payment.findMany({
        select,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });
    const count = () => prisma.payment.count();
    return paginate(query, count, { page, limit });
  },

  findById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, unit: true } },
        property: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  },

  findByStripeSession(sessionId: string) {
    return prisma.payment.findFirst({ where: { stripeSessionId: sessionId } });
  },

  create(input: CreatePaymentInput) {
    return prisma.payment.create({ data: input as any });
  },

  update(id: string, data: Partial<CreatePaymentInput>) {
    return prisma.payment.update({ where: { id }, data: data as any });
  },

  /** Get all payments for a specific user (as tenant) */
  findByUser(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { id: true, name: true } },
        tenant: { select: { id: true, unit: true } },
      },
    });
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Invoices (Rent Collection)
// ────────────────────────────────────────────────────────────────────────────
export const invoiceRepo = {
  async findAll(pagination?: Pagination) {
    const { page = 1, limit = 20 } = pagination ?? {};
    const select = {
      id: true, amount: true, dueDate: true, status: true,
      periodStart: true, periodEnd: true, description: true,
      paidAt: true, stripeSessionId: true, receiptUrl: true,
      createdAt: true, updatedAt: true, amountPaid: true, lateFee: true,
      lateFeeStatus: true, invoiceNumber: true, paymentGateway: true,
      reminderCount: true, isRecurring: true, retryCount: true,
      tenant: { select: { id: true, unit: true } },
      property: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
    } as const;
    const query = () =>
      prisma.invoice.findMany({
        select,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });
    const count = () => prisma.invoice.count();
    return paginate(query, count, { page, limit });
  },

  findById(id: string) {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, unit: true, userId: true } },
        property: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        payment: true,
        razorpayOrder: true,
      },
    });
  },

  /** Get invoices scoped to a specific tenant (user-level security) */
  findByTenantId(tenantId: string) {
    return prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { dueDate: "desc" },
      include: {
        property: { select: { id: true, name: true } },
        payment: { select: { id: true, status: true, receiptUrl: true, paidAt: true } },
      },
    });
  },

  /** Get invoices scoped to a specific user */
  findByUserId(userId: string) {
    return prisma.invoice.findMany({
      where: { userId },
      orderBy: { dueDate: "desc" },
      include: {
        property: { select: { id: true, name: true } },
        tenant: { select: { id: true, unit: true } },
        payment: { select: { id: true, status: true, receiptUrl: true, paidAt: true } },
      },
    });
  },

  /** Get active (unpaid) invoices for a user */
  findActiveByUserId(userId: string) {
    return prisma.invoice.findMany({
      where: { userId, status: { in: ["pending", "past_due"] } },
      orderBy: { dueDate: "asc" },
      include: {
        property: { select: { id: true, name: true } },
        tenant: { select: { id: true, unit: true } },
      },
    });
  },

  /** Get the current pending invoice for a tenant */
  findCurrentForTenant(tenantId: string) {
    return prisma.invoice.findFirst({
      where: { tenantId, status: { in: ["pending", "past_due"] } },
      orderBy: { dueDate: "asc" },
      include: {
        property: { select: { id: true, name: true, address: true } },
      },
    });
  },

  create(input: CreateInvoiceInput) {
    return prisma.invoice.create({ data: input as any });
  },

  update(id: string, data: UpdateInvoiceInput) {
    return prisma.invoice.update({ where: { id }, data: data as any });
  },

  /** Mark invoice as paid and link to payment */
  async markPaid(id: string, paymentId: string, paidAt: Date, receiptUrl?: string) {
    return prisma.invoice.update({
      where: { id },
      data: {
        status: "paid",
        paidAt,
        paymentId,
        receiptUrl,
      },
    });
  },

  /** Aggregate rent collected (completed rent payments) */
  async totalCollected() {
    const result = await prisma.payment.aggregate({
      where: { type: "rent", status: "completed" },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  },

  /** Aggregate pending rent (unpaid invoices) */
  async totalPending() {
    const result = await prisma.invoice.aggregate({
      where: { status: { in: ["pending", "past_due"] } },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  },

  /** Property-wise collection summary */
  async collectionsByProperty() {
    const completed = await prisma.payment.groupBy({
      by: ["propertyId"],
      where: { type: "rent", status: "completed" },
      _sum: { amount: true },
      _count: true,
    });

    const properties = await prisma.property.findMany({
      select: { id: true, name: true },
    });

    const propertyMap = new Map(properties.map(p => [p.id, p.name]));

    return completed.map(c => ({
      propertyId: c.propertyId,
      propertyName: propertyMap.get(c.propertyId) ?? "Unknown",
      collected: c._sum.amount ?? 0,
      transactionCount: c._count,
    }));
  },

  /** Monthly revenue from rent collections */
  async monthlyRevenue() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const result = await prisma.payment.aggregate({
      where: {
        type: "rent",
        status: "completed",
        paidAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  },
}

// ────────────────────────────────────────────────────────────────────────────
// Razorpay Orders
// ────────────────────────────────────────────────────────────────────────────
export const razorpayOrderRepo = {
  async create(input: CreateRazorpayOrderInput) {
    return prisma.razorpayOrder.create({ data: input as any });
  },

  async findByOrderId(orderId: string) {
    return prisma.razorpayOrder.findUnique({ where: { orderId } });
  },

  async update(orderId: string, data: Partial<CreateRazorpayOrderInput & { status: string; paymentId?: string }>) {
    return prisma.razorpayOrder.update({ where: { orderId }, data: data as any });
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Webhook Events
// ────────────────────────────────────────────────────────────────────────────
export const webhookEventRepo = {
  async create(input: { eventId: string; source: string; type: string; payload: string; userId?: string }) {
    return prisma.webhookEvent.create({ data: input });
  },

  async findByEventId(eventId: string) {
    return prisma.webhookEvent.findUnique({ where: { eventId } });
  },

  async markProcessed(eventId: string) {
    return prisma.webhookEvent.update({
      where: { eventId },
      data: { status: "processed", processedAt: new Date() },
    });
  },

  async markFailed(eventId: string, error: string) {
    return prisma.webhookEvent.update({
      where: { eventId },
      data: { status: "failed", error },
    });
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Late Fee Config
// ────────────────────────────────────────────────────────────────────────────
export const lateFeeConfigRepo = {
  async create(input: CreateLateFeeConfigInput & { userId: string }) {
    return prisma.lateFeeConfig.create({ data: input as any });
  },

  async findByUser(userId: string) {
    return prisma.lateFeeConfig.findMany({
      where: { userId },
      include: { property: { select: { id: true, name: true } } },
    });
  },

  async findActive(propertyId?: string) {
    return prisma.lateFeeConfig.findFirst({
      where: {
        isActive: true,
        OR: [
          { propertyId: propertyId ?? undefined },
          { propertyId: null },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Notifications
// ────────────────────────────────────────────────────────────────────────────
export const notificationRepo = {
  findByUser(userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, title: true, message: true, type: true, read: true, link: true, createdAt: true },
    });
  },

  create(input: CreateNotificationInput) {
    return prisma.notification.create({ data: input as any });
  },

  markRead(id: string) {
    return prisma.notification.update({ where: { id }, data: { read: true } });
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  countUnread(userId: string) {
    return prisma.notification.count({ where: { userId, read: false } });
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Activity Log
// ────────────────────────────────────────────────────────────────────────────
export const activityLogRepo = {
  findAll(limit = 20) {
    return prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, userId: true, userName: true, userAvatar: true, action: true, target: true, type: true, createdAt: true },
    });
  },

  create(input: CreateActivityLogInput) {
    return prisma.activityLog.create({ data: input as any });
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Dashboard Aggregate (fully optimized)
// ────────────────────────────────────────────────────────────────────────────
export const dashboardRepo = {
  async getStats() {
    const [
      propertyCount,
      aggregates,
      tenantCount,
      maintenanceCount,
      bookingCount,
      maintenanceByCategory,
      revenueByProperty,
    ] = await Promise.all([
      prisma.property.count(),
      prisma.property.aggregate({
        _sum: { units: true, occupiedUnits: true, monthlyRevenue: true },
      }),
      prisma.tenant.count(),
      prisma.maintenanceRequest.count({
        where: { status: { in: ["open", "in-progress"] } },
      }),
      prisma.booking.count(),
      prisma.maintenanceRequest.groupBy({
        by: ["category"],
        _count: true,
      }),
      prisma.property.findMany({
        select: { name: true, monthlyRevenue: true },
        orderBy: { monthlyRevenue: "desc" },
      }),
    ]);

    const totalUnits = aggregates._sum.units ?? 0;
    const occupiedUnits = aggregates._sum.occupiedUnits ?? 0;
    const totalRevenue = aggregates._sum.monthlyRevenue ?? 0;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 1000) / 10 : 0;

    // Build maintenance by category
    const categories = maintenanceByCategory.map((c) => ({
      category: c.category.charAt(0).toUpperCase() + c.category.slice(1),
      count: c._count,
    }));

    // Build revenue by property
    const properties = revenueByProperty.map((p) => ({
      property: p.name,
      revenue: p.monthlyRevenue,
    }));

    return {
      totalProperties: propertyCount,
      totalUnits,
      occupiedUnits,
      occupancyRate,
      totalRevenue,
      totalTenants: tenantCount,
      activeMaintenance: maintenanceCount,
      totalBookings: bookingCount,
      maintenanceByCategory: categories.length > 0 ? categories : [],
      revenueByProperty: properties.length > 0 ? properties : [],
    };
  },
};
