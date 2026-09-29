"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  ImageIcon,
  FolderTree,
  Trash2,
  X,
} from "lucide-react";
import { siteConfig } from "@/lib/config";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/videos", label: "Videos", icon: Video },
  { href: "/admin/photos", label: "Photos", icon: ImageIcon },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/recycle-bin", label: "Recycle Bin", icon: Trash2 },
];

export function AdminSidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  const content = (
    <>
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Video className="h-4 w-4" />
          </div>
          <span className="text-sm leading-tight">
            {siteConfig.name}
            <br />
            <span className="text-xs font-normal text-muted">Admin</span>
          </span>
        </Link>
        <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-border lg:hidden" aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-border hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-5 py-4 text-xs text-muted">
        Walk Metro Manila &copy; {new Date().getFullYear()}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-surface">
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-surface shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
