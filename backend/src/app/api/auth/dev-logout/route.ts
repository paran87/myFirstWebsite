import { cookies } from "next/headers";
import { jsonOk } from "@/lib/api-response";
import { DEV_ADMIN_COOKIE } from "@/lib/dev-auth";

/** POST /api/auth/dev-logout — clears the local dev admin cookie. */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(DEV_ADMIN_COOKIE);
  return jsonOk({ success: true });
}
