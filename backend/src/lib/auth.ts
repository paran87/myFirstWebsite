import "server-only";
import { cookies, headers } from "next/headers";
import { verifyAccessJwt } from "@/lib/access";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/admin-session";
import { setting, settingList } from "@/lib/cf";
import type { Profile } from "@/lib/types";

export class UnauthorizedError extends Error {
  status = 401;
}
export class ForbiddenError extends Error {
  status = 403;
}

type AdminSession = { userId: string; profile: Profile };

function profileFor(email: string): Profile {
  const now = new Date().toISOString();
  return {
    // There is no user table: Cloudflare Access is the identity provider, so
    // the email address is the user id (and is stored in `created_by`).
    id: email,
    email,
    full_name: null,
    role: "admin",
    created_at: now,
    updated_at: now,
  };
}

/**
 * A browser request that comes from another origin must never act with the
 * admin's cookie (CSRF). Same-origin and non-browser requests have no
 * mismatching Origin header.
 */
export function isCrossOrigin(headerList: Headers): boolean {
  const origin = headerList.get("origin");
  if (!origin) return false;
  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

/**
 * Local-only shortcut for `next dev`, where there is no Cloudflare Access in
 * front of the app. Never active in a production build.
 *
 * It only applies to requests that come from a browser on this same origin
 * (the admin pages and their XHRs). Server-to-server calls, such as the
 * public site fetching the API, send no Sec-Fetch-Site header and stay
 * anonymous, so the public API behaves in dev exactly as it does in
 * production. (curl as admin: add `-H "Sec-Fetch-Site: same-origin"`.)
 */
function devBypassEmail(headerList: Headers): string {
  if (process.env.NODE_ENV === "production") return "";
  const site = headerList.get("sec-fetch-site");
  if (site !== "same-origin" && site !== "none") return "";
  return setting("DEV_ADMIN_EMAIL");
}

/**
 * Verifies the caller is signed in to the admin: either with the built-in
 * password login (signed session cookie) or through Cloudflare Access. Throws
 * `UnauthorizedError` (no valid session) or `ForbiddenError` (valid Access
 * token, but the email is not on ADMIN_EMAILS).
 *
 * Every admin-only API route must call this: `/api/*` also serves the public
 * site, so it cannot be fenced off by Access (or any proxy) as a whole.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const headerList = await headers();
  if (isCrossOrigin(headerList)) {
    throw new ForbiddenError("Cross-origin requests are not allowed.");
  }

  const bypass = devBypassEmail(headerList);
  if (bypass) return { userId: bypass, profile: profileFor(bypass) };

  const cookieStore = await cookies();

  // Built-in password login (signed session cookie).
  if (await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value)) {
    return { userId: "admin", profile: profileFor("admin") };
  }

  // Cloudflare Access (when the site sits behind it).
  const token = headerList.get("cf-access-jwt-assertion") || cookieStore.get("CF_Authorization")?.value;
  if (!token) {
    throw new UnauthorizedError("You must be signed in to perform this action.");
  }

  const payload = await verifyAccessJwt(token, {
    teamDomain: setting("ACCESS_TEAM_DOMAIN"),
    audience: setting("ACCESS_AUD"),
  });
  const email = payload?.email?.trim().toLowerCase();
  if (!payload || !email) {
    throw new UnauthorizedError("Your Cloudflare Access session is missing or expired.");
  }

  const allowList = settingList("ADMIN_EMAILS").map((item) => item.toLowerCase());
  if (allowList.length > 0 && !allowList.includes(email)) {
    throw new ForbiddenError("This account does not have admin access.");
  }

  return { userId: email, profile: profileFor(email) };
}

/**
 * Same check as `requireAdmin`, but resolves to `null` instead of
 * throwing. Useful for endpoints that behave differently for anonymous
 * visitors vs. admins (e.g. `GET /api/videos` exposes more fields/filters
 * to admins) without forcing every visitor to be logged in.
 */
export async function tryGetAdmin(): Promise<AdminSession | null> {
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}
