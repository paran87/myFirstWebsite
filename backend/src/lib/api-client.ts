"use client";

/**
 * Thin fetch wrapper for admin dashboard client components calling this
 * app's own `/api/*` routes (same-origin, session cookie sent
 * automatically). Throws an `Error` with the server-provided message so
 * callers can show it directly in a toast.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new Error((body && (body.error as string)) || `Request failed (${response.status}).`);
  }

  return body as T;
}
