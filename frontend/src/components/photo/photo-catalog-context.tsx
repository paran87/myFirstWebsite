"use client";

import { createContext, useContext } from "react";
import type { Photo } from "@/lib/types";

export const PhotoCatalogContext = createContext<{
  photos: Photo[];
  query: string;
  fullscreen: boolean;
  setFullscreen: (open: boolean) => void;
  /** The photo being viewed, as loaded by its own page (freshest data). */
  activePhoto: Photo | null;
  setActivePhoto: (photo: Photo) => void;
}>({
  photos: [],
  query: "",
  fullscreen: false,
  setFullscreen: () => {},
  activePhoto: null,
  setActivePhoto: () => {},
});

export function usePhotoCatalog() {
  return useContext(PhotoCatalogContext);
}
