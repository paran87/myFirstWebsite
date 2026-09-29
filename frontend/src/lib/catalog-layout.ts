"use client";

import { useEffect, useState } from "react";

export type CatalogLayout = "grid" | "list";

const STORAGE_KEY = "wmm-catalog-layout";

export function useCatalogLayout() {
  const [layout, setLayout] = useState<CatalogLayout>("grid");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "grid" || saved === "list") setLayout(saved);
  }, []);

  function updateLayout(next: CatalogLayout) {
    setLayout(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return [layout, updateLayout] as const;
}
