import { NextRequest, NextResponse } from "next/server";

/**
 * Small CORS helper for the handful of PUBLIC read endpoints that the
 * frontend app calls directly from the browser (video list/detail,
 * categories, view increments). Only origins listed in
 * `ALLOWED_FRONTEND_ORIGINS` (comma-separated) are allowed; everything
 * else (including admin write endpoints, which are same-origin to the
 * admin dashboard) is left untouched.
 */
function getAllowedOrigins(): string[] {
  const configured = process.env.ALLOWED_FRONTEND_ORIGINS || process.env.NEXT_PUBLIC_SITE_URL || "";
  return configured
    .split(",")
    // Tolerate "https://site.app/" as well as "https://site.app".
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

export function corsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin");
  const allowed = getAllowedOrigins();

  if (!origin || (allowed.length > 0 && !allowed.includes(origin))) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": allowed.length > 0 ? origin : "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

export function corsPreflight(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}
