"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { METRO_MANILA_CITIES } from "@/lib/types";
import type { Category } from "@/lib/types";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

const controlClass =
  "w-full min-w-0 cursor-pointer rounded-full border border-border bg-surface/90 px-3.5 py-2 text-sm font-semibold text-foreground outline-none transition hover:border-primary/40 focus:border-primary/50 focus:ring-4 focus:ring-primary/15 sm:w-auto";

export function FiltersBar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const city = searchParams.get("city") ?? "";
  const category = searchParams.get("category") ?? "";
  const year = searchParams.get("year") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const search = searchParams.get("search") ?? "";
  const [query, setQuery] = useState(search);

  const hasActiveFilters = !!(city || category || year || search);

  useEffect(() => {
    setQuery(search);
  }, [search]);

  useEffect(() => {
    const next = query.trim();
    if (next === search) return;
    const timer = window.setTimeout(() => updateParam("search", next), 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce local query only
  }, [query]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}${params.toString() ? `?${params}` : ""}`);
  }

  function clearFilters() {
    setQuery("");
    router.push(pathname);
  }

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    updateParam("search", query.trim());
  }

  return (
    <div className="glass grid grid-cols-2 items-center gap-2 rounded-xl border border-border/80 p-2 shadow-sm sm:flex sm:flex-wrap">
      <form onSubmit={handleSearchSubmit} className="relative col-span-2 min-w-0 sm:max-w-xs sm:flex-1">
        <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, street, city..."
          aria-label="Search catalog"
          className="w-full rounded-full border border-border bg-surface/90 py-2 pl-10 pr-9 text-sm font-semibold text-foreground placeholder:font-medium placeholder:text-foreground/50 outline-none transition hover:border-primary/40 focus:border-primary/50 focus:ring-4 focus:ring-primary/15"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              updateParam("search", "");
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted transition hover:bg-border hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      <select
        value={city}
        onChange={(e) => updateParam("city", e.target.value)}
        className={controlClass}
      >
        <option value="">All Cities</option>
        {METRO_MANILA_CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        value={category}
        onChange={(e) => updateParam("category", e.target.value)}
        className={controlClass}
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={year}
        onChange={(e) => updateParam("year", e.target.value)}
        className={controlClass}
      >
        <option value="">All Years</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <select
        value={sort}
        onChange={(e) => updateParam("sort", e.target.value)}
        className={`${controlClass} sm:ml-auto`}
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="most_viewed">Most Viewed</option>
      </select>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="col-span-2 flex items-center justify-center gap-1 rounded-full px-3.5 py-2 text-sm font-bold text-foreground transition hover:bg-danger/10 hover:text-danger sm:col-span-1"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
