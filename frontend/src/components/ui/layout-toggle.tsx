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
    <div className="inline-flex rounded-full border border-border bg-surface/80 p-1 shadow-sm backdrop-blur-md" role="group" aria-label="Catalog layout">
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={layout === "grid"}
        aria-label="Grid view"
        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition-all duration-300 ${
          layout === "grid" ? "bg-foreground text-background shadow-sm" : "text-foreground/75 hover:text-primary"
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
        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition-all duration-300 ${
          layout === "list" ? "bg-foreground text-background shadow-sm" : "text-foreground/75 hover:text-primary"
        }`}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">List</span>
      </button>
    </div>
  );
}
