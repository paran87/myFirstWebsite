import "server-only";
import crypto from "node:crypto";
import type { Profile } from "@/lib/types";

export const DEV_ADMIN_COOKIE = "wmm_dev_admin";

/** Temporary local login — never enable in production deployments. */
export function isDevAdminLoginEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.DEV_ADMIN_LOGIN_ENABLED === "true";
}

export function getDevAdminCredentials() {
  return {
    email: process.env.DEV_ADMIN_EMAIL || "jener",
    password: process.env.DEV_ADMIN_PASSWORD || "123",
  };
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function devAdminCredentialsMatch(email: string, password: string): boolean {
  if (!isDevAdminLoginEnabled()) return false;
  const expected = getDevAdminCredentials();
  return safeEqual(email.trim(), expected.email) && safeEqual(password, expected.password);
}

function sessionSecret(): string {
  return process.env.DEV_ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

/** Signed, expiring session value. A plain cookie like "1" is not accepted. */
export function createDevAdminSessionValue(): string {
  const secret = sessionSecret();
  if (!secret) throw new Error("Admin session secret is not configured.");
  const exp = String(Date.now() + devAdminCookieOptions.maxAge * 1000);
  const sig = crypto.createHmac("sha256", secret).update(exp).digest("base64url");
  return `${exp}.${sig}`;
}

export function hasDevAdminSession(cookieValue: string | undefined): boolean {
  if (!isDevAdminLoginEnabled() || !cookieValue) return false;
  const secret = sessionSecret();
  if (!secret) return false;

  const dot = cookieValue.indexOf(".");
  if (dot <= 0) return false;
  const exp = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);
  const expected = crypto.createHmac("sha256", secret).update(exp).digest("base64url");
  if (!safeEqual(sig, expected)) return false;

  const expiresAt = Number(exp);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function getDevAdminProfile(): Profile {
  const { email } = getDevAdminCredentials();
  const now = new Date().toISOString();
  return {
    id: "00000000-0000-4000-a800-000000000001",
    email,
    full_name: "Jener (dev admin)",
    role: "admin",
    created_at: now,
    updated_at: now,
  };
}

export const devAdminCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
