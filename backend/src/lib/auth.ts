import "server-only";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  DEV_ADMIN_COOKIE,
  getDevAdminProfile,
  hasDevAdminSession,
  isDevAdminLoginEnabled,
} from "@/lib/dev-auth";
import type { Profile } from "@/lib/types";

export class UnauthorizedError extends Error {
  status = 401;
}
export class ForbiddenError extends Error {
  status = 403;
}

/**
 * Verifies the caller has an authenticated Supabase session AND a
 * `profiles` row with role `admin`/`editor`. Throws `UnauthorizedError`
 * (no session) or `ForbiddenError` (session but not an admin) — route
 * handlers should catch these via `handleApiError`.
 *
 * This is the server-side authorization check required by every
 * admin-only API route; the middleware redirect alone is NOT sufficient
 * protection for API routes (which don't get redirected, they must
 * return proper 401/403 responses).
 */
async function getDevAdminSessionIfValid(): Promise<{ userId: string; profile: Profile } | null> {
  if (!isDevAdminLoginEnabled()) return null;
  const cookieStore = await cookies();
  const value = cookieStore.get(DEV_ADMIN_COOKIE)?.value;
  if (!hasDevAdminSession(value)) return null;

  // The dev login has no auth.users row, so videos.created_by must be null
  // (the column references profiles, which references auth.users).
  const profile = getDevAdminProfile();
  return { userId: "", profile };
}

export async function requireAdmin(): Promise<{ userId: string; profile: Profile }> {
  const devSession = await getDevAdminSessionIfValid();
  if (devSession) return devSession;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new UnauthorizedError("You must be signed in to perform this action.");
  }

  // Use the admin client for the profile lookup so this works even before
  // RLS-visible session propagation edge cases; it's a read-only lookup
  // scoped to a single known id.
  const admin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new ForbiddenError("No admin profile found for this account.");
  }

  if (profile.role !== "admin" && profile.role !== "editor") {
    throw new ForbiddenError("This account does not have admin access.");
  }

  return { userId: data.user.id, profile: profile as Profile };
}

/**
 * Same check as `requireAdmin`, but resolves to `null` instead of
 * throwing. Useful for endpoints that behave differently for anonymous
 * visitors vs. admins (e.g. `GET /api/videos` exposes more fields/filters
 * to admins) without forcing every visitor to be logged in.
 */
export async function tryGetAdmin(): Promise<{ userId: string; profile: Profile } | null> {
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}
