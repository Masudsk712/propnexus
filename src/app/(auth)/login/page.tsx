"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-bg relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-black/20" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-12"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mx-auto mb-8">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            PropertyPro
          </h1>
          <p className="text-lg text-white/80 max-w-md mx-auto">
            The unified platform for modern property management. Streamline operations, boost efficiency, and grow your portfolio.
          </p>
          <div className="grid grid-cols-3 gap-6 mt-12">
            {[
              { value: "99.9%", label: "Uptime" },
              { value: "10k+", label: "Properties" },
              { value: "24/7", label: "Support" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right - Form Panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary lg:hidden mb-4">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-2">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Input
                label="Email"
                type="email"
                placeholder="alex@propertypro.com"
                icon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register("email")}
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                error={errors.password?.message}
                {...register("password")}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {["Google", "GitHub", "SSO"].map((provider) => (
              <Button
                key={provider}
                variant="outline"
                className="w-full"
                type="button"
              >
                {provider}
              </Button>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}