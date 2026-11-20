"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Sun, Moon, LogOut } from "lucide-react";

export function AdminTopbar({
  email,
  onMenuClick,
}: {
  email: string;
  onMenuClick: () => void;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  async function handleLogout() {
    // Clears the password-login cookie. Behind Cloudflare Access (no admin
    // password) the response sends us to Access's own logout instead.
    const response = await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as { redirect?: string } | null;
    const target = body?.redirect ?? "/admin/login";

    if (target.startsWith("/cdn-cgi/")) {
      window.location.href = target;
      return;
    }
    router.push(target);
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
      <button onClick={onMenuClick} className="rounded-md p-2 text-muted hover:bg-border lg:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-md p-2 text-muted hover:bg-border"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <div className="hidden text-sm text-muted sm:block">{email}</div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-border hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
