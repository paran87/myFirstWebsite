"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { METRO_MANILA_CITIES } from "@/lib/types";
import type { Category } from "@/lib/types";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

export function FiltersBar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const city = searchParams.get("city") ?? "";
  const category = searchParams.get("category") ?? "";
  const year = searchParams.get("year") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const search = searchParams.get("search") ?? "";

  const hasActiveFilters = !!(city || category || year);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}${params.toString() ? `?${params}` : ""}`);
  }

  function clearFilters() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    router.push(`${pathname}${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3">
      <span className="flex items-center gap-1.5 text-sm font-medium text-muted">
        <SlidersHorizontal className="h-4 w-4" />
        Filters:
      </span>

      <select
        value={city}
        onChange={(e) => updateParam("city", e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none"
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
        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none"
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
        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none"
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
        className="ml-auto rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="most_viewed">Most Viewed</option>
      </select>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-muted hover:bg-border hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
