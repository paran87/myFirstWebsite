"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
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
  Footprints,
  Film,
  ImageIcon,
} from "lucide-react";
import { siteConfig } from "@/lib/config";
import type { Category } from "@/lib/types";

export function Header({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { resolvedTheme, setTheme } = useTheme();
  // True only after hydration, so the theme icon never mismatches the server render.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [scrolled, setScrolled] = useState(false);
  const isDark = mounted && resolvedTheme === "dark";
  const onPhotos = pathname.startsWith("/photo");
  const onVideos = pathname === "/" || pathname.startsWith("/video");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("search") ?? "");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <header
      className={`sticky top-0 z-30 border-b transition-[background-color,box-shadow,border-color] duration-500 ${
        scrolled || mobileOpen
          ? "glass border-border/70 shadow-lg shadow-black/5"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1920px] items-center gap-4 px-4 lg:px-6 2xl:px-8">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-foreground lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/" className="group flex items-center gap-2.5 font-semibold">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg shadow-primary/30 transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-rotate-6 group-hover:scale-110 dark:text-primary-foreground">
            <Footprints className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-surface bg-accent" />
          </div>
          <span className="font-display text-lg font-extrabold leading-tight tracking-tight sm:text-xl">
            {siteConfig.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <Link
            href="/"
            aria-current={onVideos ? "page" : undefined}
            className="nav-link rounded-lg px-3 py-2 text-base font-semibold text-foreground transition hover:text-primary aria-[current=page]:text-primary"
          >
            Videos
          </Link>
          <Link
            href="/photos"
            aria-current={onPhotos ? "page" : undefined}
            className="nav-link rounded-lg px-3 py-2 text-base font-semibold text-foreground transition hover:text-primary aria-[current=page]:text-primary"
          >
            Photos
          </Link>
          <div className="relative" onMouseLeave={() => setCategoriesOpen(false)}>
            <button
              onClick={() => setCategoriesOpen((v) => !v)}
              onMouseEnter={() => setCategoriesOpen(true)}
              aria-expanded={categoriesOpen}
              className="nav-link flex items-center gap-1 rounded-lg px-3 py-2 text-base font-semibold text-foreground transition hover:text-primary"
            >
              Categories
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${categoriesOpen ? "rotate-180" : ""}`} />
            </button>
            {categoriesOpen && (
              <div className="animate-fade-up absolute left-0 top-full w-60 rounded-2xl border border-border bg-surface p-2 shadow-2xl shadow-black/15">
                {categories.length === 0 && (
                  <p className="px-3 py-2 text-base text-foreground/80">No categories yet.</p>
                )}
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={categoryHref(c.id)}
                    className="block rounded-xl px-3 py-2 text-base font-medium text-foreground transition hover:translate-x-1 hover:bg-surface-2 hover:text-primary"
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
            <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted transition group-focus-within:text-primary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, street, barangay, city..."
              className="w-full rounded-full border border-border bg-surface/70 py-2.5 pl-10 pr-4 text-base text-foreground shadow-sm backdrop-blur-md placeholder:text-foreground/55 outline-none transition focus:border-primary/50 focus:bg-surface focus:ring-4 focus:ring-primary/15"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-surface/70 text-foreground shadow-sm backdrop-blur-md transition hover:border-primary/40 hover:text-primary"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <Sun className="h-4.5 w-4.5 transition-transform duration-500 group-hover:rotate-90" />
            ) : (
              <Moon className="h-4.5 w-4.5 transition-transform duration-500 group-hover:-rotate-12" />
            )}
          </button>
          <a
            href={`${siteConfig.adminUrl}/admin/login?from=site`}
            className="hidden items-center gap-1.5 rounded-full bg-brand-gradient px-4.5 py-2 text-base font-bold text-white shadow-md shadow-primary/25 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/35 sm:flex dark:text-primary-foreground"
          >
            <ShieldCheck className="h-4 w-4" />
            Admin
          </a>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="animate-fade-up border-t border-border px-4 py-4 lg:hidden">
          <form onSubmit={handleSearchSubmit} className="mb-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full rounded-full border border-border bg-surface py-3 pl-9 pr-4 text-base outline-none ring-primary/40 focus:ring-2"
              />
            </div>
          </form>
          <nav className="flex flex-col gap-1">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-3 text-base font-bold transition ${onVideos ? "bg-primary/10 text-primary" : "hover:bg-surface-2"}`}
            >
              <Film className="h-4.5 w-4.5" />
              Videos
            </Link>
            <Link
              href="/photos"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-3 text-base font-bold transition ${onPhotos ? "bg-primary/10 text-primary" : "hover:bg-surface-2"}`}
            >
              <ImageIcon className="h-4.5 w-4.5" />
              Photos
            </Link>
            <p className="mt-3 px-3 text-xs font-bold uppercase tracking-[0.18em] text-foreground/60">Categories</p>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={categoryHref(c.id)}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-base font-medium hover:bg-surface-2 hover:text-primary"
              >
                {c.name}
              </Link>
            ))}
            <a
              href={`${siteConfig.adminUrl}/admin/login?from=site`}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-brand-gradient px-3 py-3 text-base font-bold text-white dark:text-primary-foreground"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin Login
            </a>
          </nav>
        </div>
      )}
      <span className="scroll-progress" aria-hidden />
    </header>
  );
}
