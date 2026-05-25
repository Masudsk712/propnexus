"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Building2, Mail, Lock, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Minimum 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 gradient-bg relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-black/20" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 text-center px-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mx-auto mb-8">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Get Started</h1>
          <p className="text-lg text-white/80 max-w-md mx-auto">
            Join thousands of property managers who trust PropertyPro to manage their portfolio.
          </p>
        </motion.div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary lg:hidden mb-4">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Create account</h2>
            <p className="text-muted-foreground mt-2">Enter your details to get started</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" placeholder="John Doe" icon={<User className="h-4 w-4" />} error={errors.name?.message} {...register("name")} />
            <Input label="Email" type="email" placeholder="john@propertypro.com" icon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register("email")} />
            <Input label="Password" type="password" placeholder="Min. 8 characters" error={errors.password?.message} {...register("password")} />
            <Input label="Confirm Password" type="password" placeholder="Re-enter password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Create Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}