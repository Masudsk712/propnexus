// ============================================================================
// Service Layer — Business logic between repositories and API routes
// ============================================================================

import {
  propertyRepo,
  tenantRepo,
  maintenanceRepo,
  amenityRepo,
  bookingRepo,
  paymentRepo,
  invoiceRepo,
  notificationRepo,
  activityLogRepo,
  dashboardRepo,
} from "@/repositories";
import { ApiResponse } from "@/types";
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
} from "@/validations";

// ── Pagination type ────────────────────────────────────────────────────────
export type Pagination = { page?: number; limit?: number };

// ── Generic error wrapper ─────────────────────────────────────────────────
async function wrap<T>(fn: () => Promise<T>): Promise<ApiResponse<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return { success: false, error: message };
  }
}

// ── Properties ────────────────────────────────────────────────────────────
export const propertyService = {
  async getAll(pagination?: Pagination): Promise<ApiResponse<unknown>> {
    return wrap(() => propertyRepo.findAll(pagination));
  },
  async getById(id: string): Promise<ApiResponse<unknown>> {
    return wrap(async () => {
      const prop = await propertyRepo.findById(id);
      if (!prop) throw new Error("Property not found");
      return prop;
    });
  },
  async getAnalytics(): Promise<ApiResponse<unknown>> {
    return wrap(() => propertyRepo.getAnalytics());
  },
  async create(input: CreatePropertyInput): Promise<ApiResponse<unknown>> {
    return wrap(() => propertyRepo.create(input));
  },
  async update(id: string, input: UpdatePropertyInput): Promise<ApiResponse<unknown>> {
    return wrap(() => propertyRepo.update(id, input));
  },
  async delete(id: string): Promise<ApiResponse<unknown>> {
    return wrap(() => propertyRepo.delete(id));
  },
};

// ── Tenants ───────────────────────────────────────────────────────────────
export const tenantService = {
  async getAll(pagination?: Pagination): Promise<ApiResponse<unknown>> {
    return wrap(() => tenantRepo.findAll(pagination));
  },
  async getById(id: string): Promise<ApiResponse<unknown>> {
    return wrap(async () => {
      const t = await tenantRepo.findById(id);
      if (!t) throw new Error("Tenant not found");
      return t;
    });
  },
  async create(input: CreateTenantInput): Promise<ApiResponse<unknown>> {
    return wrap(() => tenantRepo.create(input));
  },
  async update(id: string, data: Partial<CreateTenantInput>): Promise<ApiResponse<unknown>> {
    return wrap(() => tenantRepo.update(id, data));
  },
  async delete(id: string): Promise<ApiResponse<unknown>> {
    return wrap(() => tenantRepo.delete(id));
  },
};

// ── Maintenance ───────────────────────────────────────────────────────────
export const maintenanceService = {
  async getAll(pagination?: Pagination): Promise<ApiResponse<unknown>> {
    return wrap(() => maintenanceRepo.findAll(pagination));
  },
  async getById(id: string): Promise<ApiResponse<unknown>> {
    return wrap(async () => {
      const m = await maintenanceRepo.findById(id);
      if (!m) throw new Error("Maintenance request not found");
      return m;
    });
  },
  async create(input: CreateMaintenanceInput): Promise<ApiResponse<unknown>> {
    return wrap(() => maintenanceRepo.create(input));
  },
  async update(
    id: string,
    data: Partial<CreateMaintenanceInput> & { resolvedAt?: Date }
  ): Promise<ApiResponse<unknown>> {
    return wrap(() => maintenanceRepo.update(id, data));
  },
  async delete(id: string): Promise<ApiResponse<unknown>> {
    return wrap(() => maintenanceRepo.delete(id));
  },
};

// ── Amenities ─────────────────────────────────────────────────────────────
export const amenityService = {
  async getAll(pagination?: Pagination): Promise<ApiResponse<unknown>> {
    return wrap(() => amenityRepo.findAll(pagination));
  },
  async getById(id: string): Promise<ApiResponse<unknown>> {
    return wrap(async () => {
      const a = await amenityRepo.findById(id);
      if (!a) throw new Error("Amenity not found");
      return a;
    });
  },
  async create(input: CreateAmenityInput): Promise<ApiResponse<unknown>> {
    return wrap(() => amenityRepo.create(input));
  },
  async update(id: string, data: Partial<CreateAmenityInput>): Promise<ApiResponse<unknown>> {
    return wrap(() => amenityRepo.update(id, data));
  },
  async delete(id: string): Promise<ApiResponse<unknown>> {
    return wrap(() => amenityRepo.delete(id));
  },
};

// ── Bookings ──────────────────────────────────────────────────────────────
export const bookingService = {
  async getAll(pagination?: Pagination): Promise<ApiResponse<unknown>> {
    return wrap(() => bookingRepo.findAll(pagination));
  },
  async getById(id: string): Promise<ApiResponse<unknown>> {
    return wrap(async () => {
      const b = await bookingRepo.findById(id);
      if (!b) throw new Error("Booking not found");
      return b;
    });
  },
  async create(input: CreateBookingInput): Promise<ApiResponse<unknown>> {
    return wrap(() => bookingRepo.create(input));
  },
  async update(id: string, data: Partial<CreateBookingInput>): Promise<ApiResponse<unknown>> {
    return wrap(() => bookingRepo.update(id, data));
  },
  async delete(id: string): Promise<ApiResponse<unknown>> {
    return wrap(() => bookingRepo.delete(id));
  },
};

// ── Payments ──────────────────────────────────────────────────────────────
export const paymentService = {
  async getAll(pagination?: Pagination): Promise<ApiResponse<unknown>> {
    return wrap(() => paymentRepo.findAll(pagination));
  },
  async getById(id: string): Promise<ApiResponse<unknown>> {
    return wrap(async () => {
      const p = await paymentRepo.findById(id);
      if (!p) throw new Error("Payment not found");
      return p;
    });
  },
  async create(input: CreatePaymentInput): Promise<ApiResponse<unknown>> {
    return wrap(() => paymentRepo.create(input));
  },
};

// ── Notifications ─────────────────────────────────────────────────────────
export const notificationService = {
  async getByUser(userId: string): Promise<ApiResponse<unknown>> {
    return wrap(() => notificationRepo.findByUser(userId));
  },
  async create(input: CreateNotificationInput): Promise<ApiResponse<unknown>> {
    return wrap(() => notificationRepo.create(input));
  },
  async markRead(id: string): Promise<ApiResponse<unknown>> {
    return wrap(() => notificationRepo.markRead(id));
  },
  async markAllRead(userId: string): Promise<ApiResponse<unknown>> {
    return wrap(() => notificationRepo.markAllRead(userId));
  },
  async unreadCount(userId: string): Promise<ApiResponse<unknown>> {
    return wrap(() => notificationRepo.countUnread(userId));
  },
};

// ── Activity ──────────────────────────────────────────────────────────────
export const activityService = {
  async getAll(limit?: number): Promise<ApiResponse<unknown>> {
    return wrap(() => activityLogRepo.findAll(limit));
  },
  async create(input: CreateActivityLogInput): Promise<ApiResponse<unknown>> {
    return wrap(() => activityLogRepo.create(input));
  },
};

// ── Invoices / Rent Collection ────────────────────────────────────────────
export const rentalPaymentService = {
  async getInvoices(pagination?: Pagination): Promise<ApiResponse<unknown>> {
    return wrap(() => invoiceRepo.findAll(pagination));
  },
  async getInvoiceById(id: string): Promise<ApiResponse<unknown>> {
    return wrap(async () => {
      const inv = await invoiceRepo.findById(id);
      if (!inv) throw new Error("Invoice not found");
      return inv;
    });
  },
  async getUserInvoices(userId: string): Promise<ApiResponse<unknown>> {
    return wrap(() => invoiceRepo.findByUserId(userId));
  },
  async getActiveInvoices(userId: string): Promise<ApiResponse<unknown>> {
    return wrap(() => invoiceRepo.findActiveByUserId(userId));
  },
  async getCurrentForTenant(tenantId: string): Promise<ApiResponse<unknown>> {
    return wrap(() => invoiceRepo.findCurrentForTenant(tenantId));
  },
  async createInvoice(input: CreateInvoiceInput): Promise<ApiResponse<unknown>> {
    return wrap(() => invoiceRepo.create(input));
  },
  /** Create Stripe Checkout session for rent payment */
  async createCheckoutSession(input: {
    invoiceId: string;
    tenantId: string;
    userId: string;
    amount: number;
    propertyName: string;
    description?: string;
  }): Promise<ApiResponse<unknown>> {
    return wrap(async () => {
      const stripe = (await import("@/lib/stripe")).stripe;
      const isConfigured = (await import("@/lib/stripe")).isStripeConfigured;
      if (!isConfigured()) throw new Error("Stripe is not configured");

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Rent - ${input.propertyName}`,
                description: input.description ?? `Monthly rent payment for ${input.propertyName}`,
              },
              unit_amount: Math.round(input.amount * 100), // cents
            },
            quantity: 1,
          },
        ],
        metadata: {
          invoiceId: input.invoiceId,
          tenantId: input.tenantId,
          userId: input.userId,
          type: "rent",
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/payments?success=true&invoice=${input.invoiceId}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/payments?cancelled=true`,
      });

      // Update invoice with session ID
      await invoiceRepo.update(input.invoiceId, { stripeSessionId: session.id });

      return { url: session.url, sessionId: session.id };
    });
  },
  /** Handle Stripe webhook for rent payment completion */
  async handlePaymentSuccess(invoiceId: string, session: {
    id: string;
    payment_intent?: string;
    payment_status: string;
    amount_total?: number;
  }): Promise<ApiResponse<unknown>> {
    return wrap(async () => {
      const invoice = await invoiceRepo.findById(invoiceId);
      if (!invoice) throw new Error("Invoice not found");
      if (invoice.status === "paid") return invoice; // Already paid

      const now = new Date();
      const paymentIntentId = typeof session.payment_intent === "string"
        ? session.payment_intent
        : undefined;

      // Create the payment record
      const payment = await paymentRepo.create({
        tenantId: invoice.tenantId,
        propertyId: invoice.propertyId,
        userId: invoice.userId,
        amount: invoice.amount,
        type: "rent",
        status: "completed",
        method: "credit_card",
        paidAt: now,
        description: invoice.description ?? `Rent payment for ${(invoice as any).property?.name ?? "property"}`,
      });

      // Update payment with Stripe details
      const paymentUpdate: any = {
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        receiptUrl: paymentIntentId
          ? `https://dashboard.stripe.com/payments/${paymentIntentId}`
          : undefined,
      };

      const updatedPayment = await paymentRepo.update(payment.id as any, paymentUpdate as any);

      // Mark invoice as paid
      await invoiceRepo.markPaid(
        invoiceId,
        updatedPayment.id,
        now,
        paymentUpdate.receiptUrl,
      );

      return updatedPayment;
    });
  },
  async getPaymentHistory(userId: string): Promise<ApiResponse<unknown>> {
    return wrap(() => paymentRepo.findByUser(userId));
  },
  /** Admin: total rent collected */
  async totalCollected(): Promise<ApiResponse<unknown>> {
    return wrap(() => invoiceRepo.totalCollected());
  },
  /** Admin: total pending rent */
  async totalPending(): Promise<ApiResponse<unknown>> {
    return wrap(() => invoiceRepo.totalPending());
  },
  /** Admin/Manager: collections by property */
  async collectionsByProperty(): Promise<ApiResponse<unknown>> {
    return wrap(() => invoiceRepo.collectionsByProperty());
  },
  /** Monthly revenue from rent */
  async monthlyRevenue(): Promise<ApiResponse<unknown>> {
    return wrap(() => invoiceRepo.monthlyRevenue());
  },
};

// ── Dashboard ─────────────────────────────────────────────────────────────
export const dashboardService = {
  async getStats(): Promise<ApiResponse<unknown>> {
    return wrap(() => dashboardRepo.getStats());
  },
};
