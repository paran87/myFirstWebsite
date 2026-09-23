import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Supabase client bound to the current request's cookies. Used for
 * everything that should respect the logged-in admin's session and RLS
 * policies (e.g. reading `profiles`, most reads/writes that RLS already
 * protects). Uses the public anon key — safe to use server-side, this is
 * NOT the service role client.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
