"use client";

import { createContext, useContext } from "react";
import type { Photo } from "@/lib/types";

export const PhotoCatalogContext = createContext<{
  photos: Photo[];
  query: string;
  fullscreen: boolean;
  setFullscreen: (open: boolean) => void;
}>({
  photos: [],
  query: "",
  fullscreen: false,
  setFullscreen: () => {},
});

export function usePhotoCatalog() {
  return useContext(PhotoCatalogContext);
}
