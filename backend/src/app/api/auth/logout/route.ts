import { NextRequest, NextResponse } from "next/server";
import { isCrossOrigin } from "@/lib/auth";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/admin-session";
import { setting } from "@/lib/cf";
import { jsonError } from "@/lib/api-response";

/**
 * POST /api/auth/logout — clears the password-login session cookie. When the
 * site is behind Cloudflare Access (and has no admin password), the response
 * points at Access's own logout endpoint instead.
 */
export async function POST(request: NextRequest) {
  if (isCrossOrigin(request.headers)) return jsonError("Cross-origin requests are not allowed.", 403);

  const usesAccessOnly = Boolean(setting("ACCESS_AUD")) && !setting("ADMIN_PASSWORD");
  const response = NextResponse.json({
    redirect: usesAccessOnly ? "/cdn-cgi/access/logout" : "/admin/login",
  });
  response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return response;
}
