import Link from "next/link";
import { MapPin, Eye, Play, Clock } from "lucide-react";
import { VideoThumbnail } from "@/components/video/video-thumbnail";
import { formatDuration, formatShortDate, formatViewCount, formatViews } from "@/lib/format";
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

        <span className={`absolute flex items-center gap-1 rounded-full bg-black/65 font-mono font-semibold text-white backdrop-blur-md ${compact ? "bottom-1 right-1 gap-0.5 px-1 py-px text-[9px]" : "bottom-1.5 right-1.5 px-1.5 py-0.5 text-[10px] sm:bottom-2 sm:right-2 sm:px-2 sm:text-xs"}`}>
          <Clock className={compact ? "h-2.5 w-2.5" : "h-2.5 w-2.5 sm:h-3 sm:w-3"} />
          {formatDuration(video.duration_seconds)}
        </span>
        {!isList && (
          <span
            className={`absolute rounded-full bg-black/65 text-[9px] font-semibold text-white backdrop-blur-md ${compact ? "bottom-1 left-1 px-1 py-px" : "bottom-1.5 left-1.5 px-1.5 py-0.5 sm:hidden"}`}
          >
            {formatShortDate(video.recorded_at, true)}
          </span>
        )}
        {video.category?.name && !compact && (
          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md sm:left-2 sm:top-2 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {video.category.name}
          </span>
        )}
      </div>

      <div className={`flex min-w-0 flex-1 flex-col ${isList ? "justify-center gap-1 p-3 sm:p-4" : "gap-0.5 px-2 py-1.5 sm:gap-1 sm:px-3 sm:py-2.5"} ${compact ? "!gap-0.5 !px-2 !py-1.5" : ""}`}>
        <h3 className={`font-bold leading-tight tracking-tight transition-colors group-hover:text-primary ${compact ? "line-clamp-1 text-[11px] sm:text-xs" : isList ? "line-clamp-2 text-sm sm:text-base" : "line-clamp-1 text-[13px] sm:line-clamp-2 sm:min-h-10 sm:text-[15px]"}`}>
          {video.title}
        </h3>
        {isList ? (
          locationLabel ? (
            <p className={`flex items-center gap-0.5 font-medium leading-tight text-foreground/80 ${compact ? "text-[10px]" : "text-[10.5px] sm:text-xs"}`}>
              <MapPin className="h-2.5 w-2.5 flex-shrink-0 text-primary sm:h-3 sm:w-3" />
              <span className="truncate">{locationLabel}</span>
            </p>
          ) : null
        ) : (
          <p className={`flex min-h-3.5 items-center gap-0.5 font-medium leading-tight text-foreground/80 ${compact ? "text-[10px]" : "text-[10.5px] sm:text-xs"}`}>
            {locationLabel ? (
              <>
                <MapPin className="h-2.5 w-2.5 flex-shrink-0 text-primary sm:h-3 sm:w-3" />
                <span className="min-w-0 flex-1 truncate">{locationLabel}</span>
              </>
            ) : (
              <span className="invisible flex-1">Location</span>
            )}
            {/* On phones / small cards the date sits on the image, so views join this line. */}
            <span
              className={`ml-1 shrink-0 items-center gap-0.5 whitespace-nowrap text-foreground/65 ${compact ? "flex" : "flex sm:hidden"}`}
              title={formatViews(video.views)}
            >
              <Eye className="h-2.5 w-2.5" />
              {formatViewCount(video.views)}
            </span>
          </p>
        )}
        {video.description && isList && !compact && (
          <p className="line-clamp-1 text-sm font-medium text-foreground/75">
            {video.description}
          </p>
        )}
        <div className={`items-center justify-between font-medium leading-tight ${isList ? "flex" : compact ? "hidden" : "hidden sm:flex"} ${compact ? "gap-1" : "gap-2"} text-foreground/65 ${compact ? "text-[10px]" : "text-[10.5px] sm:text-xs"} ${isList ? "pt-0.5" : "mt-auto border-t border-border/50 pt-1 sm:pt-1.5"}`}>
          <span className="truncate">{formatShortDate(video.recorded_at, compact)}</span>
          <span className={`flex shrink-0 items-center whitespace-nowrap ${compact ? "gap-0.5" : "gap-1"}`} title={formatViews(video.views)}>
            <Eye className={compact ? "h-2.5 w-2.5" : "h-2.5 w-2.5 sm:h-3 sm:w-3"} />
            {formatViewCount(video.views)}
          </span>
        </div>
      </div>
    </Link>
  );
}
