"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Menu,
  X,
  Sun,
  Moon,
  ShieldCheck,
  ChevronDown,
  MapPin,
} from "lucide-react";
import { siteConfig } from "@/lib/config";
import type { Category } from "@/lib/types";

export function Header({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("search") ?? "");

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    const base = pathname.startsWith("/photo") ? "/photos" : "/";
    router.push(`${base}${params.toString() ? `?${params}` : ""}`);
    setMobileOpen(false);
  }

  function categoryHref(categoryId: string) {
    const base = pathname.startsWith("/photo") ? "/photos" : "/";
    return `${base}?category=${categoryId}`;
  }

  return (
    <header className="glass sticky top-0 z-30 border-b border-border/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 lg:px-6">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-foreground lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/" className="group flex items-center gap-2.5 font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-2 text-white shadow-md shadow-primary/25 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
            <MapPin className="h-5 w-5" />
          </div>
          <span className="hidden text-lg font-extrabold leading-tight sm:block">
            <span className="text-gradient">{siteConfig.name}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <Link href="/" className="rounded-lg px-3 py-2 text-base font-semibold text-foreground transition hover:bg-surface-2 hover:text-primary">
            Videos
          </Link>
          <Link href="/photos" className="rounded-lg px-3 py-2 text-base font-semibold text-foreground transition hover:bg-surface-2 hover:text-primary">
            Photos
          </Link>
          <div className="relative" onMouseLeave={() => setCategoriesOpen(false)}>
            <button
              onClick={() => setCategoriesOpen((v) => !v)}
              onMouseEnter={() => setCategoriesOpen(true)}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-base font-semibold text-foreground transition hover:bg-surface-2 hover:text-primary"
            >
              Categories
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${categoriesOpen ? "rotate-180" : ""}`} />
            </button>
            {categoriesOpen && (
              <div className="animate-fade-up absolute left-0 top-full w-56 rounded-2xl border border-border bg-surface p-2 shadow-xl shadow-black/10">
                {categories.length === 0 && (
                  <p className="px-3 py-2 text-base text-foreground/80">No categories yet.</p>
                )}
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={categoryHref(c.id)}
                    className="block rounded-lg px-3 py-2 text-base font-medium text-foreground transition hover:bg-surface-2 hover:text-primary"
                    onClick={() => setCategoriesOpen(false)}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <form onSubmit={handleSearchSubmit} className="ml-auto hidden max-w-md flex-1 lg:block">
          <div className="group relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition group-focus-within:text-primary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, street, barangay, city..."
              className="w-full rounded-full border border-border bg-surface-2/80 py-2.5 pl-10 pr-4 text-base text-foreground placeholder:text-foreground/55 outline-none transition focus:border-primary/50 focus:bg-surface focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <a
            href={`${siteConfig.adminUrl}/admin/login?from=site`}
            className="hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary-2 px-4 py-2 text-base font-semibold text-white shadow-md shadow-primary/25 transition hover:shadow-lg hover:shadow-primary/30 sm:flex"
          >
            <ShieldCheck className="h-4 w-4" />
            Admin
          </a>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="animate-fade-up border-t border-border bg-surface px-4 py-4 lg:hidden">
          <form onSubmit={handleSearchSubmit} className="mb-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full rounded-full border border-border bg-background py-2.5 pl-9 pr-4 text-sm outline-none ring-primary/40 focus:ring-2"
              />
            </div>
          </form>
          <nav className="flex flex-col gap-1">
            <Link href="/" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-border">
              Videos
            </Link>
            <Link href="/photos" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-border">
              Photos
            </Link>
            <p className="mt-2 px-3 text-xs font-semibold uppercase text-muted">Categories</p>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={categoryHref(c.id)}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm hover:bg-border"
              >
                {c.name}
              </Link>
            ))}
            <a
              href={`${siteConfig.adminUrl}/admin/login?from=site`}
              className="mt-3 flex items-center gap-1.5 rounded-md border border-border px-3 py-2.5 text-sm font-medium"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin Login
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
