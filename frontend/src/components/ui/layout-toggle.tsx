"use client";

import { LayoutGrid, List } from "lucide-react";
import type { CatalogLayout } from "@/lib/catalog-layout";

export function LayoutToggle({
  layout,
  onChange,
}: {
  layout: CatalogLayout;
  onChange: (layout: CatalogLayout) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-border bg-surface/80 p-1 shadow-sm" role="group" aria-label="Catalog layout">
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={layout === "grid"}
        aria-label="Grid view"
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
          layout === "grid" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/80 hover:bg-surface-2"
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Grid</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={layout === "list"}
        aria-label="List view"
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
          layout === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/80 hover:bg-surface-2"
        }`}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">List</span>
      </button>
    </div>
  );
}
