// ============================================================================
// NextAuth v5 (Auth.js) Configuration
// MongoDB Adapter + Credentials Provider with role-based auth
// ============================================================================

import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

import { setSentryUser, clearSentryUser } from "@/lib/sentry";

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

/**
 * Structured auth logger — writes to both console and a log array
 * so debug endpoint can return recent history.
 */
const authLogs: Array<{ level: string; message: string; time: string }> = [];
const MAX_LOGS = 200;

function authLog(level: "info" | "warn" | "error", message: string, meta?: unknown) {
  const entry = { level, message, time: new Date().toISOString() };
  authLogs.push(entry);
  if (authLogs.length > MAX_LOGS) authLogs.shift();

  const prefix = `[AUTH]`;
  if (level === "error") {
    console.error(prefix, message, meta ?? "");
  } else if (level === "warn") {
    console.warn(prefix, message, meta ?? "");
  } else {
    console.log(prefix, message, meta ?? "");
  }
}

export { authLogs, authLog };

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
  debug: process.env.NODE_ENV !== "production",
  events: {
    async signOut(message) {
      const token = (message as any).token as JWT | undefined;
      if (token?.sub) {
        clearSentryUser();
        authLog("info", "User signed out, Sentry context cleared");
      }
    },
  },
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
        // ── 1. Validate input ──────────────────────────────────────────────
        if (!credentials?.email || !credentials?.password) {
          const msg = "[AUTH] Missing email or password in authorize()";
          authLog("warn", msg);
          throw new CredentialsSignin(msg);
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        authLog("info", "authorize() called");

        if (!email.includes("@")) {
          authLog("warn", "[AUTH] Invalid email format");
          throw new CredentialsSignin("[AUTH] Invalid email format");
        }

        // ── 2. Verify DATABASE_URL is set ─────────────────────────────────
        if (!process.env.DATABASE_URL) {
          const msg = "[AUTH] DATABASE_URL is not defined in environment";
          authLog("error", msg);
          throw new CredentialsSignin(msg);
        }
        authLog("info", "DATABASE_URL is present");

        // ── 3. Look up user ────────────────────────────────────────────────
        let user;
        try {
          user = await prisma.user.findUnique({ where: { email } });
          authLog("info", `User lookup: ${user ? "FOUND" : "NOT FOUND"}`);
        } catch (dbError) {
          const msg = `[AUTH] Prisma user lookup FAILED: ${dbError instanceof Error ? dbError.message : String(dbError)}`;
          authLog("error", msg, dbError);
          throw new CredentialsSignin(msg);
        }

        if (!user) {
          authLog("warn", "[AUTH] No user found for email");
          throw new CredentialsSignin("[AUTH] No user found for email");
        }

        if (!user.password) {
          authLog("warn", "[AUTH] User has no password set (OAuth account?)");
          throw new CredentialsSignin("[AUTH] User has no password set");
        }

        // ── 4. Compare password ────────────────────────────────────────────
        let isValid: boolean;
        try {
          isValid = await bcrypt.compare(password, user.password);
          authLog("info", `bcrypt.compare: ${isValid ? "MATCH" : "MISMATCH"}`);
        } catch (bcryptError) {
          const msg = `[AUTH] bcrypt.compare threw: ${bcryptError instanceof Error ? bcryptError.message : String(bcryptError)}`;
          authLog("error", msg, bcryptError);
          throw new CredentialsSignin(msg);
        }

        if (!isValid) {
          authLog("warn", "[AUTH] Invalid password");
          throw new CredentialsSignin("[AUTH] Invalid password");
        }

        // ── 5. Success — return user ───────────────────────────────────────
        authLog("info", `Authorization SUCCESS (role: ${user.role})`);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.sub = user.id as string;
        token.role = user.role ?? "tenant";
        // Set Sentry user context on login
        setSentryUser({
          id: user.id as string,
          email: user.email ?? undefined,
          role: user.role ?? "tenant",
        });
        authLog("info", `JWT created for user id="${user.id}" role="${token.role}"`);
      }
      if (trigger === "update" && session) {
        token.role = (session as any).role ?? token.role;
        authLog("info", `JWT updated — role="${token.role}"`);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role ?? "tenant";
        authLog("info", `Session created for userId="${session.user.id}" role="${(session.user as any).role}"`);
      }
      return session;
    },
  },
});