// ============================================================================
// NextAuth v5 (Auth.js) Configuration
// MongoDB Adapter + Credentials Provider with role-based auth
// ============================================================================

import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

// Extend the built-in session types to include role
declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}

const isProduction = process.env.NODE_ENV === "production";

// Validate required environment variables
function validateEnv() {
  if (!process.env.AUTH_SECRET) {
    throw new Error(
      "AUTH_SECRET is not defined. Generate one with: openssl rand -base64 32"
    );
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }
}
validateEnv();

// Re-export for convenience throughout the app
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: !isProduction,
  useSecureCookies: isProduction,
  cookies: {
    sessionToken: {
      name: isProduction ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("[AUTH] Missing email or password");
          return null;
        }
        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        if (!email.includes("@")) {
          console.error("[AUTH] Invalid email format");
          return null;
        }

        try {
          const user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            console.warn(`[AUTH] No user found for: ${email}`);
            return null;
          }

          if (!user.password) {
            console.warn(`[AUTH] User ${email} has no password set (OAuth account?)`);
            return null;
          }

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            console.warn(`[AUTH] Invalid password for: ${email}`);
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          console.error("[AUTH] authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as any).role ?? "tenant";
      }
      if (trigger === "update" && session) {
        token.role = (session as any).role ?? token.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role ?? "tenant";
      }
      return session;
    },
  },
});