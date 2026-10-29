"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Sun, Moon, LogOut } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminTopbar({
  email,
  onMenuClick,
}: {
  email: string;
  onMenuClick: () => void;
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  // True only after hydration, so the theme icon never mismatches the server render.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const isDark = mounted && resolvedTheme === "dark";

  async function handleLogout() {
    await fetch("/api/auth/dev-logout", { method: "POST" }).catch(() => {});
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    toast.success("Signed out.");
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/85 px-4 backdrop-blur-lg lg:px-6">
      <button type="button" onClick={onMenuClick} className="rounded-md p-2 text-muted hover:bg-border lg:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition hover:border-primary/40 hover:text-primary"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        {email && (
          <div className="hidden items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 sm:flex">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold uppercase text-white dark:text-primary-foreground"
              aria-hidden
            >
              {email.charAt(0)}
            </span>
            <span className="max-w-48 truncate text-sm font-semibold">{email}</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted transition hover:bg-danger/10 hover:text-danger"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
