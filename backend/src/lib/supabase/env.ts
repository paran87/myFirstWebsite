/**
 * Resolves Supabase env vars across legacy and newer Supabase dashboard names.
 * Next.js only exposes `NEXT_PUBLIC_*` to the browser; server code can read all.
 */

export function getSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    ""
  );
}

/** Public / publishable key (safe for browser + SSR cookie client). */
export function getSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    ""
  );
}

/** Service role / secret key — server-only, never expose to the client. */
export function getSupabaseServiceRoleKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    ""
  );
}

export function hasSupabasePublicConfig(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}
