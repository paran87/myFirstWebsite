import Link from "next/link";
import { MapPin, Eye, Play, Clock } from "lucide-react";
import { VideoThumbnail } from "@/components/video/video-thumbnail";
import { formatDuration, formatViews, formatDate } from "@/lib/format";
import type { CatalogLayout } from "@/lib/catalog-layout";
import type { Video } from "@/lib/types";

export function VideoCard({
  video,
  index = 0,
  layout = "grid",
  compact = false,
  query = "",
}: {
  video: Video;
  index?: number;
  layout?: CatalogLayout;
  compact?: boolean;
  query?: string;
}) {
  const locationLabel = [video.city, video.barangay].filter(Boolean).join(", ") || video.location;
  const isList = layout === "list";

  return (
    <Link
      href={query ? `/video/${video.id}?${query}` : `/video/${video.id}`}
      style={{ animationDelay: `${Math.min(index, 11) * 60}ms` }}
      className={`card-hover animate-fade-up group overflow-hidden rounded-2xl border border-border/80 bg-surface/90 shadow-sm backdrop-blur-md ${
        isList ? "flex flex-row items-stretch" : "flex h-full flex-col"
      }`}
    >
      <div
        className={`relative overflow-hidden bg-surface-2 ${
          isList
            ? compact
              ? "aspect-video w-28 shrink-0 sm:w-36"
              : "aspect-video w-36 shrink-0 sm:w-56"
            : "aspect-video w-full"
        }`}
      >
        <VideoThumbnail
          title={video.title}
          thumbnailUrl={video.thumbnail_url}
          videoUrl={video.video_url}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 scale-75 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-lg backdrop-blur transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
            <Play className="h-6 w-6 translate-x-0.5 fill-current" />
          </span>
        </div>

        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur">
          <Clock className="h-3 w-3" />
          {formatDuration(video.duration_seconds)}
        </span>
        {video.category?.name && (
          <span className="absolute left-2 top-2 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm backdrop-blur">
            {video.category.name}
          </span>
        )}
      </div>

      <div className={`flex min-w-0 flex-1 flex-col gap-1.5 ${isList ? "justify-center p-3 sm:p-4" : "p-3.5"} ${compact ? "!p-2.5" : ""}`}>
        <h3 className={`line-clamp-2 font-bold leading-snug transition-colors group-hover:text-primary ${compact ? "min-h-9 text-sm" : "min-h-12 text-base"}`}>
          {video.title}
        </h3>
        {isList ? (
          locationLabel ? (
            <p className={`flex items-center gap-1 font-medium text-foreground/80 ${compact ? "text-xs" : "text-sm"}`}>
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
              <span className="truncate">{locationLabel}</span>
            </p>
          ) : null
        ) : (
          <p className={`flex min-h-5 items-center gap-1 font-medium text-foreground/80 ${compact ? "text-xs" : "text-sm"}`}>
            {locationLabel ? (
              <>
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                <span className="truncate">{locationLabel}</span>
              </>
            ) : (
              <span className="invisible">Location</span>
            )}
          </p>
        )}
        {video.description && isList && !compact && (
          <p className="line-clamp-1 text-sm font-medium text-foreground/75">
            {video.description}
          </p>
        )}
        <div className={`flex items-center justify-between text-sm font-medium text-foreground/75 ${isList ? "pt-1" : "mt-auto border-t border-border/60 pt-2"}`}>
          <span>{formatDate(video.recorded_at)}</span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatViews(video.views)}
          </span>
        </div>
      </div>
    </Link>
  );
}
