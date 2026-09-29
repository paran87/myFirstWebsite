import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Supabase client bound to the current request's cookies. Used for
 * everything that should respect the logged-in admin's session and RLS
 * policies (e.g. reading `profiles`, most reads/writes that RLS already
 * protects). Uses the public anon key — safe to use server-side, this is
 * NOT the service role client.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase URL or public key. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY) in backend/.env.local."
    );
  }

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // `setAll` is called from a Server Component in some cases,
            // which cannot set cookies. Middleware refreshes the session
            // cookie instead, so this can be safely ignored here.
          }
        },
      },
    }
  );
}
