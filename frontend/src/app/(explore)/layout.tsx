import { Suspense } from "react";
import { ExploreFrame } from "@/components/map/explore-frame";
import { getCategories, getPhotos, getVideos } from "@/lib/api";

/**
 * Shared by the video and photo pages, so the filters, map and list stay
 * mounted while moving between videos and photos.
 */
export default async function ExploreLayout({ children }: { children: React.ReactNode }) {
  const [videos, photos, categories] = await Promise.all([
    getVideos({ page: 1, limit: 24, sort: "newest" }).catch(() => null),
    getPhotos({ page: 1, limit: 24, sort: "newest" }).catch(() => null),
    getCategories().catch(() => []),
  ]);

  return (
    <Suspense>
      <ExploreFrame initialVideos={videos?.data ?? []} initialPhotos={photos?.data ?? []} categories={categories}>
        {children}
      </ExploreFrame>
    </Suspense>
  );
}
