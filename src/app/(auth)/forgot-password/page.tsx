"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Building2, Mail, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold">Check your email</h2>
          <p className="text-muted-foreground mt-2">We've sent a password reset link to your email address.</p>
          <Link href="/login" className="mt-8 inline-block">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 gradient-bg relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-black/20" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 text-center px-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mx-auto mb-8">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Reset Password</h1>
          <p className="text-lg text-white/80">No worries, we'll get you back in quickly.</p>
        </motion.div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to login
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Forgot password?</h2>
          <p className="text-muted-foreground mt-2">Enter your email and we'll send you a reset link.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Input label="Email" type="email" placeholder="alex@propertypro.com" icon={<Mail className="h-4 w-4" />} required />
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Send Reset Link <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}