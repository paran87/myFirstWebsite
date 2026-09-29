import { Suspense } from "react";
import { PhotoWatchFrame } from "@/components/photo/photo-watch-frame";
import { getCategories, getPhotos } from "@/lib/api";

export default async function PhotoLayout({ children }: LayoutProps<"/photo">) {
  const [catalog, categories] = await Promise.all([
    getPhotos({ page: 1, limit: 24, sort: "newest" }).catch(() => null),
    getCategories().catch(() => []),
  ]);

  return (
    <Suspense>
      <PhotoWatchFrame initialPhotos={catalog?.data ?? []} categories={categories}>
        {children}
      </PhotoWatchFrame>
    </Suspense>
  );
}
