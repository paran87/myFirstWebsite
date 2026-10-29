"use client";

import { useEffect } from "react";
import { PhotoViewer } from "@/components/photo/photo-viewer";
import { usePhotoCatalog } from "@/components/photo/photo-catalog-context";
import { MediaDetails } from "@/components/ui/media-details";
import type { Photo } from "@/lib/types";

export function PhotoStage({ photo }: { photo: Photo }) {
  const { photos, query, setActivePhoto } = usePhotoCatalog();

  // Share this page's copy of the photo (with its latest coordinates) with the map.
  useEffect(() => {
    setActivePhoto(photo);
  }, [photo, setActivePhoto]);

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <PhotoViewer photo={photo} photos={photos} query={query} />

      <MediaDetails item={photo} kind="photo" />
    </div>
  );
}
