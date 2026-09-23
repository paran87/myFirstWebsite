import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth";

export function jsonOk<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/**
 * Centralized error → HTTP response mapping so every route handler can
 * just `try { ... } catch (e) { return handleApiError(e); }`.
 */
export function handleApiError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return jsonError(error.message, error.status);
  }
  if (error instanceof ForbiddenError) {
    return jsonError(error.message, error.status);
  }
  if (error instanceof ZodError) {
    return jsonError("Validation failed.", 422, {
      issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  if (error instanceof Error) {
    console.error("[API ERROR]", error);
    return jsonError(error.message || "Internal server error.", 500);
  }
  console.error("[API ERROR] Unknown error shape", error);
  return jsonError("Internal server error.", 500);
}
