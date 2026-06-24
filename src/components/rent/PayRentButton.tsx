"use client";

// ============================================================================
// Pay Rent Button — Launches Stripe Checkout for rent payment
// ============================================================================

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface PayRentButtonProps {
  invoiceId: string;
  tenantId: string;
  amount: number;
  propertyName: string;
  description?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  disabled?: boolean;
}

export function PayRentButton({
  invoiceId,
  tenantId,
  amount,
  propertyName,
  description,
  variant = "default",
  size = "default",
  className,
  disabled,
}: PayRentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rent/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          tenantId,
          amount,
          propertyName,
          description,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        toast.error(json.error || "Failed to initiate payment");
        return;
      }

      // Redirect to Stripe Checkout
      if (json.data?.url) {
        window.location.href = json.data.url;
      } else {
        toast.error("No checkout URL returned");
      }
    } catch (error) {
      console.error("[PAY_RENT]", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePay}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirecting...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Pay Now
        </>
      )}
    </Button>
  );
}