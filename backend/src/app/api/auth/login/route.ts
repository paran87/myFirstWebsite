import { NextRequest, NextResponse } from "next/server";
import { isCrossOrigin } from "@/lib/auth";
import {
  SESSION_COOKIE,
  createSessionToken,
  isPasswordLongEnough,
  isPasswordLoginConfigured,
  MIN_PASSWORD_LENGTH,
  passwordMatches,
  sessionCookieOptions,
} from "@/lib/admin-session";
import { clearLoginFailures, countRecentLoginFailures, recordLoginFailure } from "@/lib/db";
import { jsonError, handleApiError } from "@/lib/api-response";
import { getClientIp } from "@/lib/rate-limit";

/** After this many wrong passwords from one IP, further tries are refused for the window. */
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

/** The lockout must never lock the admin out because of a database problem. */
async function safely<T>(work: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await work();
  } catch (error) {
    console.error("[login] attempt tracking failed", error);
    return fallback;
  }
}

/**
 * POST /api/auth/login  { password }
 *
 * Checks the single shared admin password (secret ADMIN_PASSWORD) and, if it
 * matches, sets a signed session cookie. Repeated wrong passwords from one IP
 * are locked out for 15 minutes.
 */
export async function POST(request: NextRequest) {
  try {
    if (isCrossOrigin(request.headers)) return jsonError("Cross-origin requests are not allowed.", 403);

    if (!isPasswordLoginConfigured()) {
      return jsonError("Password login is not enabled. Set the ADMIN_PASSWORD secret on the Worker.", 503);
    }
    if (!isPasswordLongEnough()) {
      return jsonError(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters. Choose a longer one.`, 503);
    }

    const ip = getClientIp(request);
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const failures = await safely(() => countRecentLoginFailures(ip, since), 0);
    if (failures >= MAX_FAILURES) {
      return NextResponse.json(
        { error: "Too many failed attempts. Try again in 15 minutes." },
        { status: 429, headers: { "Retry-After": String(WINDOW_MS / 1000) } }
      );
    }

    const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
    const password = typeof body?.password === "string" ? body.password : "";

    if (!password || !(await passwordMatches(password))) {
      await safely(() => recordLoginFailure(ip), undefined);
      // A short pause makes each guess slower even before the lockout kicks in.
      await new Promise((resolve) => setTimeout(resolve, 400));
      return jsonError("Incorrect password.", 401);
    }

    await safely(() => clearLoginFailures(ip), undefined);
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions());
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
