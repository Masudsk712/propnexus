// ============================================================================
// useAuth Hook — Client-side authentication operations
// Wraps NextAuth signIn/signOut with toast notifications & redirects
// ============================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, getCsrfToken } from "next-auth/react";
import { toast } from "sonner";
import type { UserRole } from "@/types";

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: "/dashboard/admin",
  manager: "/dashboard/manager",
  tenant: "/dashboard/tenant",
};

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // ── Login ──────────────────────────────────────────────────────────────

  async function login(credentials: LoginCredentials) {
    setIsLoading(true);
    try {
      // Ensure CSRF token is primed before signIn call
      await getCsrfToken();

      const result = await signIn("credentials", {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (result?.error) {
        // Differentiate between known errors and generic ones
        if (result.error === "CredentialsSignin" || result.code === "credentials") {
          toast.error("Invalid email or password");
        } else {
          console.error("[LOGIN] signIn error:", result.error, result.code);
          toast.error(result.error || "Invalid email or password");
        }
        return { success: false, error: result.error };
      }

      if (!result?.ok) {
        console.error("[LOGIN] signIn not ok", result);
        toast.error("Authentication failed. Please try again.");
        return { success: false, error: "Authentication failed" };
      }

      // Fetch session to get role
      const sessionRes = await fetch("/api/auth/session");
      if (!sessionRes.ok) {
        console.error("[LOGIN] Session fetch failed:", sessionRes.status);
        toast.error("Failed to verify session. Please try again.");
        return { success: false, error: "Session fetch failed" };
      }

      const session = await sessionRes.json();
      const role: UserRole = session?.user?.role ?? "tenant";

      toast.success("Welcome back!");
      const redirectUrl = ROLE_REDIRECTS[role] || "/dashboard/tenant";
      router.push(redirectUrl);
      router.refresh();

      return { success: true };
    } catch (error) {
      console.error("[LOGIN] Error:", error);
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error("Network error. Please check your connection.");
      } else if (error instanceof Error) {
        toast.error(`Login error: ${error.message}`);
      } else {
        toast.error("Login failed. Check console for details.");
      }
      return { success: false, error: error instanceof Error ? error.message : "Login failed" };
    } finally {
      setIsLoading(false);
    }
  }

  // ── Register ───────────────────────────────────────────────────────────

  async function register(credentials: RegisterCredentials) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        console.error("[REGISTER] Failed to parse response:", response.status, response.statusText);
        toast.error("Server error. Please try again.");
        return { success: false, error: "Invalid server response" };
      }

      if (!response.ok || !data.success) {
        toast.error(data.error || "Registration failed");
        return { success: false, error: data.error };
      }

      // Auto-login after successful registration
      try {
        await getCsrfToken();
        const signInResult = await signIn("credentials", {
          email: credentials.email,
          password: credentials.password,
          redirect: false,
        });

        if (signInResult?.ok) {
          toast.success("Account created! Welcome aboard.");
          const role: UserRole = data.data?.role ?? "tenant";
          const redirectUrl = ROLE_REDIRECTS[role] || "/dashboard/tenant";
          router.push(redirectUrl);
          router.refresh();
          return { success: true };
        }
      } catch {
        // Auto-login failed; redirect to login page
        console.warn("[REGISTER] Auto-login failed, redirecting to login");
      }

      toast.success("Account created! Please log in.");
      router.push("/login");

      return { success: true };
    } catch (error) {
      console.error("[REGISTER] Error:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
      return { success: false, error: "Registration failed" };
    } finally {
      setIsLoading(false);
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────

  async function logout() {
    setIsLoading(true);
    try {
      await signOut({ redirect: false });
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("[LOGOUT] Error:", error);
      toast.error("Failed to log out");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Forgot Password ────────────────────────────────────────────────────

  async function forgotPassword(email: string) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        toast.error("Server error. Please try again.");
        return { success: false, error: "Invalid server response" };
      }

      if (!response.ok || !data.success) {
        toast.error(data.error || "Failed to send reset link");
        return { success: false, error: data.error };
      }

      toast.success(data.message);
      return { success: true };
    } catch (error) {
      console.error("[FORGOT-PASSWORD] Error:", error);
      toast.error("Something went wrong. Please try again.");
      return { success: false, error: "Request failed" };
    } finally {
      setIsLoading(false);
    }
  }

  // ── Reset Password ─────────────────────────────────────────────────────

  async function resetPassword(token: string, password: string) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        toast.error("Server error. Please try again.");
        return { success: false, error: "Invalid server response" };
      }

      if (!response.ok || !data.success) {
        toast.error(data.error || "Failed to reset password");
        return { success: false, error: data.error };
      }

      toast.success(data.message);
      router.push("/login");

      return { success: true };
    } catch (error) {
      console.error("[RESET-PASSWORD] Error:", error);
      toast.error("Something went wrong. Please try again.");
      return { success: false, error: "Reset failed" };
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    ROLE_REDIRECTS,
  };
}