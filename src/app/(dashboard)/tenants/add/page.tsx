"use client";

import { motion } from "framer-motion";
import { TenantForm } from "@/components/tenants/tenant-form";
import type { CreateTenantInput } from "@/validations";

export default function AddTenantPage() {
  const handleSubmit = async (data: CreateTenantInput) => {
    const response = await fetch("/api/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error ?? "Failed to create tenant");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Add New Tenant</h1>
        <p className="text-muted-foreground mt-1">
          Add a new tenant and assign them to a property
        </p>
      </div>
      <TenantForm onSubmit={handleSubmit} submitLabel="Create Tenant" />
    </motion.div>
  );
}