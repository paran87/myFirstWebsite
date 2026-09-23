"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("search") ?? "");

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    router.push(`/${params.toString() ? `?${params}` : ""}`);
    setMobileOpen(false);
  }

  function categoryHref(categoryId: string) {
    return `/?category=${categoryId}`;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 lg:px-6">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-md p-2 text-muted hover:bg-border lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MapPin className="h-5 w-5" />
          </div>
          <span className="hidden text-base leading-tight sm:block">{siteConfig.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <Link href="/" className="rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-border hover:text-foreground">
            Home
          </Link>
          <div className="relative" onMouseLeave={() => setCategoriesOpen(false)}>
            <button
              onClick={() => setCategoriesOpen((v) => !v)}
              onMouseEnter={() => setCategoriesOpen(true)}
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-border hover:text-foreground"
            >
              Categories
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {categoriesOpen && (
              <div className="absolute left-0 top-full w-56 rounded-xl border border-border bg-surface p-2 shadow-lg">
                {categories.length === 0 && (
                  <p className="px-3 py-2 text-sm text-muted">No categories yet.</p>
                )}
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={categoryHref(c.id)}
                    className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-border"
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
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, street, barangay, city..."
              className="w-full rounded-full border border-border bg-background py-2.5 pl-9 pr-4 text-sm outline-none ring-primary/40 focus:ring-2"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-md p-2 text-muted hover:bg-border"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <a
            href={`${siteConfig.adminUrl}/admin/login`}
            className="hidden items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-border sm:flex"
          >
            <ShieldCheck className="h-4 w-4" />
            Admin
          </a>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-border bg-surface px-4 py-4 lg:hidden">
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
              Home
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
              href={`${siteConfig.adminUrl}/admin/login`}
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
