import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DEV_ADMIN_COOKIE, devAdminCookieOptions, hasDevAdminSession, isDevAdminLoginEnabled } from "@/lib/dev-auth";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabasePublicConfig } from "@/lib/supabase/env";

/**
 * Protects every `/admin/*` page. Unauthenticated visitors are redirected
 * to `/admin/login`. This runs on the edge before any admin page renders,
 * so there is no flash of protected content.
 *
 * API route authorization (including checking the `role` in `profiles`)
 * happens separately inside each route handler via `requireAdmin()` —
 * the proxy only handles the "is there a session at all" check plus
 * refreshing the Supabase auth cookie.
 *
 * (Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`;
 * the runtime behavior is the same.)
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  let supabaseUser = false;
  if (hasSupabasePublicConfig()) {
    const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    supabaseUser = !!data.user;
  }

  const devLoggedIn =
    isDevAdminLoginEnabled() &&
    hasDevAdminSession(request.cookies.get(DEV_ADMIN_COOKIE)?.value);
  const isLoggedIn = supabaseUser || devLoggedIn;

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/admin/login";
  const isAdminPage = pathname.startsWith("/admin");
  // The public site's Admin button always starts a fresh login.
  const requireFreshLogin = isLoginPage && request.nextUrl.searchParams.get("from") === "site";

  if (requireFreshLogin) {
    response.cookies.set(DEV_ADMIN_COOKIE, "", { ...devAdminCookieOptions, maxAge: 0 });
  }

  if (isAdminPage && !isLoginPage && !isLoggedIn) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && isLoggedIn && !requireFreshLogin) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
