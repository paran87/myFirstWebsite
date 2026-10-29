"use client";

import { useSyncExternalStore } from "react";

export type CatalogLayout = "grid" | "list";

const STORAGE_KEY = "wmm-catalog-layout";

/**
 * Grid/list preference shared by every catalog on the page (and saved for
 * the next visit), so switching it in one place updates the others too.
 */
const listeners = new Set<() => void>();
let current: CatalogLayout | null = null;

function read(): CatalogLayout {
  if (current) return current;
  try {
    current = window.localStorage.getItem(STORAGE_KEY) === "list" ? "list" : "grid";
  } catch {
    current = "grid";
  }
  return current;
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  current = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function updateLayout(next: CatalogLayout) {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Private mode / blocked storage: the choice just isn't remembered.
  }
  listeners.forEach((listener) => listener());
}

export function useCatalogLayout() {
  const layout = useSyncExternalStore(subscribe, read, () => "grid" as CatalogLayout);
  return [layout, updateLayout] as const;
}
