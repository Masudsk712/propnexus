"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MAINTENANCE_CATEGORIES, MAINTENANCE_PRIORITIES } from "@/constants";
import { properties } from "@/data/mock";
import { ArrowLeft, Wrench, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const schema = z.object({
  propertyId: z.string().min(1, "Select a property"),
  unit: z.string().min(1, "Unit is required"),
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Select a category"),
  priority: z.string().min(1, "Select priority"),
});

type FormData = z.infer<typeof schema>;

export default function CreateMaintenancePage() {
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
        <h2 className="text-2xl font-bold">Request Submitted</h2>
        <p className="text-muted-foreground mt-2">Your maintenance request has been created successfully.</p>
        <Link href="/maintenance" className="mt-6"><Button>View All Requests</Button></Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/maintenance"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold tracking-tight">Create Maintenance Request</h1><p className="text-muted-foreground mt-1">Submit a new maintenance request</p></div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-xl border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Property</label>
            <select {...register("propertyId")} className="mt-2 h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm">
              <option value="">Select property...</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {errors.propertyId && <p className="text-sm text-destructive mt-1">{errors.propertyId.message}</p>}
          </div>
          <Input label="Unit" placeholder="e.g. 12A" error={errors.unit?.message} {...register("unit")} />
        </div>

        <Input label="Title" placeholder="Brief description of the issue" error={errors.title?.message} {...register("title")} />

        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea {...register("description")} placeholder="Detailed description of the issue..." rows={4} className="mt-2 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Category</label>
            <select {...register("category")} className="mt-2 h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm">
              <option value="">Select category...</option>
              {MAINTENANCE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Priority</label>
            <select {...register("priority")} className="mt-2 h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm">
              <option value="">Select priority...</option>
              {MAINTENANCE_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            {errors.priority && <p className="text-sm text-destructive mt-1">{errors.priority.message}</p>}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}><Wrench className="mr-2 h-4 w-4" /> Submit Request</Button>
          <Link href="/maintenance"><Button variant="outline" type="button">Cancel</Button></Link>
        </div>
      </form>
    </motion.div>
  );
}