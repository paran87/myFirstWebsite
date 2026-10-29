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
  Footprints,
  ExternalLink,
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
  siteUrl,
}: {
  mobileOpen: boolean;
  onClose: () => void;
  /** Public site, for the "View site" link; hidden when not configured. */
  siteUrl?: string;
}) {
  const pathname = usePathname();

  const content = (
    <>
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/admin/dashboard" className="group flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-md shadow-primary/25 transition-transform duration-300 group-hover:-rotate-6 dark:text-primary-foreground">
            <Footprints className="h-5 w-5" />
          </div>
          <span className="leading-tight">
            <span className="block font-display text-lg font-extrabold">{siteConfig.name}</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Admin</span>
          </span>
        </Link>
        <button type="button" onClick={onClose} className="rounded-md p-1 text-muted hover:bg-border lg:hidden" aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      <p className="px-6 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">Manage</p>
      <nav className="flex-1 space-y-1 px-3" aria-label="Admin">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition",
                active
                  ? "bg-primary/10 text-primary before:absolute before:inset-y-2 before:-left-3 before:w-1 before:rounded-r-full before:bg-primary"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-border px-5 py-4">
        {siteUrl && (
          <a
            href={siteUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:text-primary"
          >
            <ExternalLink className="h-4 w-4" />
            View public site
          </a>
        )}
        <p className="text-xs text-muted">
          {siteConfig.name} &copy; {new Date().getFullYear()}
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-border lg:bg-surface">
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-surface shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
