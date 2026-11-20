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

  function handleLogout() {
    // Cloudflare Access owns the session: its logout endpoint clears the
    // cookie and returns to the Access login screen. It does not exist on
    // localhost, where there is nothing to sign out of.
    const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (isLocal) {
      router.push("/admin/login");
      router.refresh();
      return;
    }
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Cloudflare path, not a Next.js page
    window.location.href = "/cdn-cgi/access/logout";
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
