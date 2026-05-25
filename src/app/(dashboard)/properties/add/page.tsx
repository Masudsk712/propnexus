"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PROPERTY_TYPES, PROPERTY_STATUSES } from "@/constants";
import { ArrowLeft, Building2, CheckCircle2, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "ZIP code is required"),
  type: z.string().min(1, "Select type"),
  units: z.string().min(1, "Number of units is required"),
  description: z.string().optional(),
  yearBuilt: z.string().optional(),
  squareFeet: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AddPropertyPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 mb-6"><CheckCircle2 className="h-8 w-8 text-success" /></div>
        <h2 className="text-2xl font-bold">Property Added</h2>
        <p className="text-muted-foreground mt-2">The property has been added to your portfolio.</p>
        <Link href="/properties" className="mt-6"><Button>View All Properties</Button></Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/properties"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold tracking-tight">Add New Property</h1><p className="text-muted-foreground mt-1">Add a new property to your portfolio</p></div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-xl border border-border bg-card p-6">
        <Input label="Property Name" placeholder="e.g. Skyline Towers" error={errors.name?.message} {...register("name")} />
        <Input label="Address" placeholder="Street address" error={errors.address?.message} {...register("address")} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="City" placeholder="City" error={errors.city?.message} {...register("city")} />
          <Input label="State" placeholder="e.g. CA" error={errors.state?.message} {...register("state")} />
          <Input label="ZIP Code" placeholder="e.g. 90210" error={errors.zipCode?.message} {...register("zipCode")} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium">Property Type</label>
            <select {...register("type")} className="mt-2 h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm">
              <option value="">Select type...</option>
              {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {errors.type && <p className="text-sm text-destructive mt-1">{errors.type.message}</p>}
          </div>
          <Input label="Total Units" type="number" placeholder="e.g. 120" error={errors.units?.message} {...register("units")} />
          <Input label="Year Built" type="number" placeholder="e.g. 2019" error={errors.yearBuilt?.message} {...register("yearBuilt")} />
        </div>

        <Input label="Square Feet" type="number" placeholder="e.g. 250000" {...register("squareFeet")} />

        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea {...register("description")} placeholder="Describe the property..." rows={3} className="mt-2 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}><Plus className="mr-2 h-4 w-4" /> Add Property</Button>
          <Link href="/properties"><Button variant="outline" type="button">Cancel</Button></Link>
        </div>
      </form>
    </motion.div>
  );
}