import { Suspense } from "react";
import { VideoWatchFrame } from "@/components/video/video-watch-frame";
import { getCategories, getVideos } from "@/lib/api";

/** Keeps the filters, map and "More videos" mounted between videos. */
export default async function VideoLayout({ children }: LayoutProps<"/video">) {
  const [catalog, categories] = await Promise.all([
    getVideos({ page: 1, limit: 24, sort: "newest" }).catch(() => null),
    getCategories().catch(() => []),
  ]);

  return (
    <Suspense>
      <VideoWatchFrame initialVideos={catalog?.data ?? []} categories={categories}>
        {children}
      </VideoWatchFrame>
    </Suspense>
  );
}
