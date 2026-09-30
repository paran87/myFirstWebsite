"use client";

import { createContext, useContext, useEffect } from "react";
import type { Video } from "@/lib/types";

/**
 * Shared by the persistent video frame (map + "More videos") and the video
 * page inside it, so switching videos only swaps the player and details.
 */
export const VideoCatalogContext = createContext<{
  videos: Video[];
  /** The video being watched, as loaded by its own page. */
  activeVideo: Video | null;
  setActiveVideo: (video: Video) => void;
}>({
  videos: [],
  activeVideo: null,
  setActiveVideo: () => {},
});

export function useVideoCatalog() {
  return useContext(VideoCatalogContext);
}

/** Rendered by the video page to tell the frame which video is showing. */
export function RegisterActiveVideo({ video }: { video: Video }) {
  const { setActiveVideo } = useVideoCatalog();
  useEffect(() => {
    setActiveVideo(video);
  }, [video, setActiveVideo]);
  return null;
}
