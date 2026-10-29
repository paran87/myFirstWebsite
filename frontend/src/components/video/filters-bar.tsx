"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown, Search, X } from "lucide-react";
import { METRO_MANILA_CITIES } from "@/lib/types";
import type { Category } from "@/lib/types";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

/** Native select (keeps the phone pickers) styled as a pill with its own chevron. */
function FilterSelect({
  label,
  value,
  onChange,
  className = "",
  highlight = !!value,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={`h-10 w-full min-w-0 cursor-pointer appearance-none rounded-full border py-0 pl-4 pr-9 text-sm font-semibold outline-none transition hover:border-primary/40 focus:border-primary/50 focus:ring-4 focus:ring-primary/15 sm:w-auto ${
          highlight
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border bg-surface/90 text-foreground"
        }`}
      >
        {children}
      </select>
      <ChevronDown
        className={`pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${highlight ? "text-primary" : "text-foreground/60"}`}
        aria-hidden
      />
    </div>
  );
}

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
  // Follow the URL when the search changes elsewhere (header search, back button).
  const [syncedSearch, setSyncedSearch] = useState(search);
  if (syncedSearch !== search) {
    setSyncedSearch(search);
    setQuery(search);
  }

  const hasActiveFilters = !!(city || category || year || search);

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
    <div
      role="search"
      className="glass grid grid-cols-2 items-center gap-2 rounded-2xl border border-border/80 p-2 shadow-sm sm:flex sm:flex-wrap"
    >
      <form onSubmit={handleSearchSubmit} className="relative col-span-2 min-w-0 sm:max-w-xs sm:flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/55" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, street, city…"
          aria-label="Search catalog"
          className="h-10 w-full rounded-full border border-border bg-surface/90 pl-10 pr-9 text-sm font-semibold text-foreground placeholder:font-medium placeholder:text-foreground/50 outline-none transition hover:border-primary/40 focus:border-primary/50 focus:ring-4 focus:ring-primary/15 [&::-webkit-search-cancel-button]:hidden"
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

      <FilterSelect label="City" value={city} onChange={(v) => updateParam("city", v)}>
        <option value="">All cities</option>
        {METRO_MANILA_CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect label="Category" value={category} onChange={(v) => updateParam("category", v)}>
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect label="Year" value={year} onChange={(v) => updateParam("year", v)}>
        <option value="">All years</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="Sort by"
        value={sort}
        onChange={(v) => updateParam("sort", v)}
        highlight={false}
        className="sm:ml-auto"
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="most_viewed">Most viewed</option>
      </FilterSelect>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="col-span-2 flex h-10 items-center justify-center gap-1 rounded-full px-3.5 text-sm font-bold text-foreground/80 transition hover:bg-danger/10 hover:text-danger sm:col-span-1"
        >
          <X className="h-3.5 w-3.5" />
          Clear all
        </button>
      )}
    </div>
  );
}
