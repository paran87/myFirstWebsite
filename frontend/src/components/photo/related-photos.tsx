"use client";

import { useParams, useSearchParams } from "next/navigation";
import { PhotoCard } from "@/components/photo/photo-card";
import { LayoutToggle } from "@/components/ui/layout-toggle";
import { usePhotoCatalog } from "@/components/photo/photo-catalog-context";
import { useCatalogLayout } from "@/lib/catalog-layout";
import type { Photo } from "@/lib/types";

export function RelatedPhotos({ photos }: { photos: Photo[] }) {
  const { setFullscreen } = usePhotoCatalog();
  const [layout, setLayout] = useCatalogLayout();
  const searchParams = useSearchParams();
  const params = useParams();
  const currentId = String(params.id ?? "");
  const query = searchParams.toString();
  const hasFilters = Boolean(
    searchParams.get("city") ||
      searchParams.get("category") ||
      searchParams.get("year") ||
      searchParams.get("search")
  );

  return (
    <aside className="page-shell flex min-h-0 flex-col p-4 sm:p-5 xl:sticky xl:top-20 xl:h-[calc(100vh-6rem)] xl:max-h-[calc(100vh-6rem)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold tracking-tight">More photos</h2>
          <p className="text-sm font-medium text-foreground/80">Keep browsing the gallery</p>
        </div>
        <LayoutToggle layout={layout} onChange={setLayout} />
      </div>

      {photos.length === 0 ? (
        <p className="text-sm font-medium text-foreground/75">
          {hasFilters ? "No photos match these filters." : "No photos are available yet."}
        </p>
      ) : (
        <div
          className={
            layout === "list"
              ? "flex min-h-0 flex-col gap-2 overflow-y-auto pr-1"
              : "grid min-h-0 auto-rows-max grid-cols-1 content-start items-start gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-1 min-[1800px]:grid-cols-2"
          }
        >
          {photos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={index}
              layout={layout}
              compact
              query={query}
              active={photo.id === currentId}
              animate={false}
              scroll={false}
              onNavigate={() => setFullscreen(false)}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
