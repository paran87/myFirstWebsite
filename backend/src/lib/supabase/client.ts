"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Browser-side Supabase client used by the admin login form and any
 * client components that need the current session. Uses the public
 * anon key only — safe to ship to the browser. Session cookies are
 * shared with the server via `@supabase/ssr`, so the server middleware
 * and route handlers see the same session immediately after login.
 */
export function createSupabaseBrowserClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase URL or public key in backend/.env.local (NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
