import "server-only";
import { getSupabaseServiceRoleKey } from "@/lib/supabase/env";

export function assertServiceRoleKeyConfigured(): void {
  const key = getSupabaseServiceRoleKey();
  if (!key || key.startsWith("replace-with")) {
    throw new Error(
      "Supabase service role key is not configured. Open Supabase Dashboard → Project Settings → API, copy the service_role secret into backend/.env.local as SUPABASE_SERVICE_ROLE_KEY, then restart the backend (npm run dev)."
    );
  }
}

export function isServiceRoleKeyConfigured(): boolean {
  const key = getSupabaseServiceRoleKey();
  return Boolean(key && !key.startsWith("replace-with"));
}
