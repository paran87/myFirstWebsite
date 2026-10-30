"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Footprints, Loader2, AlertCircle, LockKeyhole } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { siteConfig } from "@/lib/config";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const devLogin = await fetch("/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (devLogin.ok) {
      setLoading(false);
      router.push(redirectedFrom);
      router.refresh();
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const loginEmail = email.includes("@") ? email : `${email}@admin.local`;
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    setLoading(false);

    if (signInError) {
      // A 403 only means the dev shortcut is switched off; the Supabase
      // result is the one that matters then.
      const devBody = devLogin.status === 403 ? null : await devLogin.json().catch(() => null);
      setError(
        (devBody && (devBody.error as string)) ||
          (signInError.message === "Invalid login credentials"
            ? "Incorrect email or password."
            : signInError.message)
      );
      return;
    }

    router.push(redirectedFrom);
    router.refresh();
  }

  return (
    <main className="relative isolate flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-background p-4">
      {/* Golden-hour glow, matching the public site */}
      <div
        className="pointer-events-none absolute left-1/2 top-[-18rem] -z-10 h-[36rem] w-[56rem] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl dark:bg-primary/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[-14rem] right-[-8rem] -z-10 h-[28rem] w-[28rem] rounded-full bg-primary-2/15 blur-3xl"
        aria-hidden
      />
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg shadow-primary/30 dark:text-primary-foreground">
            <Footprints className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Admin dashboard</p>
            <h1 className="mt-1">{siteConfig.name}</h1>
            <p className="mt-1 text-sm text-muted">Sign in to manage videos, photos and categories.</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-border bg-surface/90 p-6 shadow-xl shadow-black/5 backdrop-blur-md"
        >
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-danger/10 p-3 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-semibold">
              Email / username
            </label>
            <input
              id="email"
              type="text"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[15px] outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/15"
              placeholder="Username"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-semibold">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[15px] outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/15"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-gradient px-4 py-3 text-[15px] font-bold text-white shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 disabled:translate-y-0 disabled:opacity-60 dark:text-primary-foreground"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          Only authorized administrators may access this dashboard.
        </p>
      </div>
    </main>
  );
}
