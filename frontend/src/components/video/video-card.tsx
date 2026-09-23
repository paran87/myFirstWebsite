import Link from "next/link";
import Image from "next/image";
import { MapPin, Eye, Film } from "lucide-react";
import { formatDuration, formatViews, formatDate } from "@/lib/format";
import type { Video } from "@/lib/types";

export function VideoCard({ video }: { video: Video }) {
  const locationLabel = [video.city, video.barangay].filter(Boolean).join(", ") || video.location;

  return (
    <Link
      href={`/video/${video.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition hover:shadow-lg"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-border">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <Film className="h-8 w-8" />
          </div>
        )}
        <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">
          {formatDuration(video.duration_seconds)}
        </span>
        {video.category?.name && (
          <span className="absolute left-2 top-2 rounded-full bg-primary/90 px-2 py-1 text-[10px] font-medium text-primary-foreground">
            {video.category.name}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{video.title}</h3>
        {locationLabel && (
          <p className="flex items-center gap-1 text-xs text-muted">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{locationLabel}</span>
          </p>
        )}
        {video.description && (
          <p className="line-clamp-2 text-xs text-muted">{video.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-1 text-xs text-muted">
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
