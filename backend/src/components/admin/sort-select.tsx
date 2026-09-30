"use client";

import { ArrowUpDown, ChevronDown } from "lucide-react";
import { ADMIN_SORT_OPTIONS, type ListSort } from "@/lib/sort";

export function SortSelect({ value, onChange }: { value: ListSort; onChange: (sort: ListSort) => void }) {
  return (
    <label className="relative inline-flex shrink-0 items-center">
      <span className="sr-only">Sort by</span>
      <ArrowUpDown className="pointer-events-none absolute left-3 h-4 w-4 text-muted" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ListSort)}
        className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-surface py-2.5 pl-9 pr-9 text-sm font-medium outline-none ring-primary/40 focus:ring-2 sm:w-auto"
      >
        {ADMIN_SORT_OPTIONS.map((group) => (
          <optgroup key={group.group} label={group.group}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-muted" />
    </label>
  );
}
