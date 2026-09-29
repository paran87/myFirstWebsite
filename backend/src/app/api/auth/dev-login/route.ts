import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import {
  DEV_ADMIN_COOKIE,
  createDevAdminSessionValue,
  devAdminCookieOptions,
  devAdminCredentialsMatch,
  isDevAdminLoginEnabled,
} from "@/lib/dev-auth";

/** POST /api/auth/dev-login — local-only admin session (no Supabase). */
export async function POST(request: NextRequest) {
  try {
    if (!isDevAdminLoginEnabled()) {
      return jsonError("Dev login is disabled.", 403);
    }

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!devAdminCredentialsMatch(email, password)) {
      return jsonError("Incorrect email or password.", 401);
    }

    const cookieStore = await cookies();
    cookieStore.set(DEV_ADMIN_COOKIE, createDevAdminSessionValue(), devAdminCookieOptions);

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
