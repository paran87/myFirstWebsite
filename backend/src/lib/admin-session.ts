import "server-only";
import { setting } from "@/lib/cf";

/**
 * Built-in admin login: one shared password (secret ADMIN_PASSWORD) and a
 * signed, expiring session cookie. Used when the site has no Cloudflare Access
 * in front of it (for example on a workers.dev address).
 */

export const SESSION_COOKIE = "wmm_admin";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const MIN_PASSWORD_LENGTH = 12;

const encoder = new TextEncoder();

export function isPasswordLoginConfigured(): boolean {
  return setting("ADMIN_PASSWORD").length > 0;
}

export function isPasswordLongEnough(): boolean {
  return setting("ADMIN_PASSWORD").length >= MIN_PASSWORD_LENGTH;
}

/** Cookie attributes. SameSite=Strict keeps the cookie off cross-site requests. */
export function sessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Compares without stopping at the first difference. */
function safeEqual(a: string, b: string): boolean {
  const x = encoder.encode(a);
  const y = encoder.encode(b);
  let diff = x.length ^ y.length;
  const length = Math.max(x.length, y.length);
  for (let i = 0; i < length; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

/** Hashing both sides first makes the compared strings equal length. */
export async function passwordMatches(candidate: string): Promise<boolean> {
  const expected = setting("ADMIN_PASSWORD");
  if (!expected) return false;
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(candidate)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  return safeEqual(toHex(a), toHex(b));
}

/** ADMIN_SESSION_SECRET if set, otherwise the password itself (so changing it signs everyone out). */
function signingSecret(): string {
  return setting("ADMIN_SESSION_SECRET") || setting("ADMIN_PASSWORD");
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

/** `<expiry-seconds>.<signature>` */
export async function createSessionToken(): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  return `${expires}.${await sign(`wmm-admin-session:${expires}`)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token || !signingSecret()) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;

  const expires = Number(token.slice(0, dot));
  if (!Number.isInteger(expires) || expires <= Math.floor(Date.now() / 1000)) return false;

  return safeEqual(token.slice(dot + 1), await sign(`wmm-admin-session:${expires}`));
}
