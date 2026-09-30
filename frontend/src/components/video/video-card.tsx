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
      data-reveal
      style={{ ["--reveal-delay" as string]: `${(index % 3) * 90}ms` }}
      className={`card-hover group overflow-hidden rounded-[1.35rem] border border-border/80 bg-surface/90 shadow-sm shadow-black/5 backdrop-blur-md ${
        isList ? "flex flex-row items-stretch" : "flex h-full flex-col"
      }`}
    >
      <div
        className={`relative overflow-hidden bg-surface-2 ${
          isList
            ? compact
              ? "aspect-video w-28 shrink-0 sm:w-36"
              : "aspect-video w-36 shrink-0 sm:w-56"
            : "aspect-video w-full shrink-0"
        }`}
      >
        <VideoThumbnail
          title={video.title}
          thumbnailUrl={video.thumbnail_url}
          videoUrl={video.video_url}
          eager={index < 3 && !compact}
          sizes={
            isList
              ? compact
                ? "(min-width: 640px) 144px, 112px"
                : "(min-width: 640px) 224px, 144px"
              : compact
                ? "(min-width: 1280px) 200px, 50vw"
                : undefined
          }
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-40 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`play-ring relative flex scale-75 items-center justify-center rounded-full bg-brand-gradient text-white opacity-0 shadow-xl shadow-black/30 transition-all duration-500 ease-[var(--ease-spring)] group-hover:scale-100 group-hover:opacity-100 dark:text-primary-foreground ${
              compact ? "h-10 w-10" : "h-14 w-14"
            }`}
          >
            <Play className={`translate-x-0.5 fill-current ${compact ? "h-4 w-4" : "h-6 w-6"}`} />
          </span>
        </div>

        <span className={`absolute flex items-center gap-1 rounded-full bg-black/65 font-mono font-semibold text-white backdrop-blur-md ${compact ? "bottom-1.5 right-1.5 px-1.5 py-0.5 text-[10px]" : "bottom-2 right-2 px-2 py-0.5 text-xs"}`}>
          <Clock className="h-3 w-3" />
          {formatDuration(video.duration_seconds)}
        </span>
        {video.category?.name && !compact && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {video.category.name}
          </span>
        )}
      </div>

      <div className={`flex min-w-0 flex-1 flex-col gap-1.5 ${isList ? "justify-center p-3 sm:p-4" : "p-2.5 sm:p-3.5"} ${compact ? "!p-2.5" : ""}`}>
        <h3 className={`line-clamp-2 font-bold leading-snug tracking-tight transition-colors group-hover:text-primary ${compact ? "min-h-9 text-xs sm:text-sm" : "min-h-10 text-sm sm:min-h-13 sm:text-[1.05rem]"}`}>
          {video.title}
        </h3>
        {isList ? (
          locationLabel ? (
            <p className={`flex items-center gap-1 font-medium text-foreground/80 ${compact ? "text-xs" : "text-xs sm:text-sm"}`}>
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
              <span className="truncate">{locationLabel}</span>
            </p>
          ) : null
        ) : (
          <p className={`flex min-h-5 items-center gap-1 font-medium text-foreground/80 ${compact ? "text-xs" : "text-xs sm:text-sm"}`}>
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
        <div className={`flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 font-medium text-foreground/75 ${compact ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm"} ${isList ? "pt-1" : "mt-auto border-t border-border/60 pt-2"}`}>
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
