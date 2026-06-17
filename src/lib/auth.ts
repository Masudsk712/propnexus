// ============================================================================
// NextAuth v5 (Auth.js) Configuration
// MongoDB Adapter + Credentials Provider with role-based auth
// ============================================================================

import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { CredentialsSignin } from "next-auth";
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
  debug: true, // Always enable debug — logs to console on Vercel
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

        authLog("info", `authorize() called for email="${email}"`);

        if (!email.includes("@")) {
          const msg = `[AUTH] Invalid email format: "${email}"`;
          authLog("warn", msg);
          throw new CredentialsSignin(msg);
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
          authLog("info", `User lookup for "${email}": ${user ? "FOUND" : "NOT FOUND"}`);
        } catch (dbError) {
          const msg = `[AUTH] Prisma user lookup FAILED for "${email}": ${dbError instanceof Error ? dbError.message : String(dbError)}`;
          authLog("error", msg, dbError);
          throw new CredentialsSignin(msg);
        }

        if (!user) {
          const msg = `[AUTH] No user found for email: "${email}"`;
          authLog("warn", msg);
          throw new CredentialsSignin(msg);
        }

        if (!user.password) {
          const msg = `[AUTH] User "${email}" has no password set (OAuth account?)`;
          authLog("warn", msg);
          throw new CredentialsSignin(msg);
        }

        // ── 4. Compare password ────────────────────────────────────────────
        let isValid: boolean;
        try {
          isValid = await bcrypt.compare(password, user.password);
          authLog("info", `bcrypt.compare result for "${email}": ${isValid ? "MATCH" : "MISMATCH"}`);
        } catch (bcryptError) {
          const msg = `[AUTH] bcrypt.compare threw for "${email}": ${bcryptError instanceof Error ? bcryptError.message : String(bcryptError)}`;
          authLog("error", msg, bcryptError);
          throw new CredentialsSignin(msg);
        }

        if (!isValid) {
          const msg = `[AUTH] Invalid password for "${email}"`;
          authLog("warn", msg);
          throw new CredentialsSignin(msg);
        }

        // ── 5. Success — return user ───────────────────────────────────────
        authLog("info", `Authorization SUCCESS for "${email}" (role: ${user.role})`);
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
        token.sub = user.id as string; // ← CRITICAL: set sub for NextAuth internals
        token.role = (user as any).role ?? "tenant";
        console.log("[JWT_CALLBACK] user set:", JSON.stringify({ sub: token.sub, id: token.id, role: token.role, email: user.email }));
        authLog("info", `JWT created for user "${user.email}" id="${user.id}" role="${token.role}"`);
      }
      if (trigger === "update" && session) {
        token.role = (session as any).role ?? token.role;
        console.log("[JWT_CALLBACK] update:", JSON.stringify({ role: token.role }));
        authLog("info", `JWT updated — role="${token.role}"`);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role ?? "tenant";
        console.log("[SESSION_CALLBACK] session populated:", JSON.stringify({ userId: session.user.id, role: (session.user as any).role, tokenSub: token.sub, tokenId: token.id }));
        authLog("info", `Session created for userId="${session.user.id}" role="${(session.user as any).role}"`);
      }
      return session;
    },
  },
});