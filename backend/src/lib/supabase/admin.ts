import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { assertServiceRoleKeyConfigured } from "@/lib/supabase/env-check";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Service-role Supabase client. Bypasses Row Level Security entirely.
 *
 * SECURITY: This file must NEVER be imported from a Client Component or
 * any code that ships to the browser. It is only safe inside:
 *   - Route Handlers (app/api/**\/route.ts)
 *   - Server Components / Server Actions
 *   - Middleware (avoid if possible; prefer route handlers)
 *
 * `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix, so Next.js
 * will not inline it into any client bundle.
 */
let cachedAdminClient: ReturnType<typeof createClient<Database>> | null = null;

export function createSupabaseAdminClient() {
  if (cachedAdminClient) return cachedAdminClient;

  const url = getSupabaseUrl();
  assertServiceRoleKeyConfigured();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in backend/.env.local.");
  }

  cachedAdminClient = createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return cachedAdminClient;
}
