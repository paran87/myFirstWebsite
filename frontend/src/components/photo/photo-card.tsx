import Link from "next/link";
import { MapPin, Eye } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { formatShortDate, formatViewCount, formatViews } from "@/lib/format";
import type { CatalogLayout } from "@/lib/catalog-layout";
import type { Photo } from "@/lib/types";

export function PhotoCard({
  photo,
  index = 0,
  layout = "grid",
  compact = false,
  query = "",
  active = false,
  animate = true,
  scroll = true,
  onNavigate,
}: {
  photo: Photo;
  index?: number;
  layout?: CatalogLayout;
  compact?: boolean;
  query?: string;
  active?: boolean;
  animate?: boolean;
  scroll?: boolean;
  onNavigate?: () => void;
}) {
  const locationLabel = [photo.city, photo.barangay].filter(Boolean).join(", ") || photo.location;
  const isList = layout === "list";

  return (
    <Link
      href={query ? `/photo/${photo.id}?${query}` : `/photo/${photo.id}`}
      scroll={scroll}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      data-reveal={animate || undefined}
      style={animate ? { ["--reveal-delay" as string]: `${(index % 3) * 90}ms` } : undefined}
      className={`card-hover group overflow-hidden rounded-[1.35rem] border bg-surface/90 shadow-sm shadow-black/5 backdrop-blur-md ${
        active ? "border-primary ring-2 ring-primary/40" : "border-border/80"
      } ${isList ? "flex flex-row items-stretch" : "flex flex-col"}`}
    >
      <div
        className={`relative shrink-0 overflow-hidden bg-surface-2 ${
          isList ? (compact ? "w-24 sm:w-32" : "w-32 sm:w-48") : "w-full"
        }`}
      >
        {/* Padding creates a 4:3 box from width, so flex/grid cannot collapse it. */}
        <span className="block w-full pt-[75%]" aria-hidden />
        <OptimizedImage
          src={photo.image_url}
          alt={photo.title}
          sizes={isList ? "(min-width: 640px) 192px, 128px" : compact ? "(min-width: 1280px) 200px, 50vw" : "(min-width: 1280px) 620px, 50vw"}
          quality={60}
          eager={index < 3 && !compact}
          className="object-cover transition duration-700 ease-[var(--ease-out)] group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        {photo.category?.name && !compact && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {photo.category.name}
          </span>
        )}
      </div>
      <div className={`flex min-w-0 flex-1 flex-col gap-1 ${isList ? "justify-center p-3 sm:p-4" : "p-2.5 sm:p-3"} ${compact ? "!p-2" : ""}`}>
        <h3 className={`line-clamp-2 font-bold leading-snug tracking-tight transition-colors group-hover:text-primary ${compact ? "min-h-8 text-xs leading-tight sm:text-[13px]" : "min-h-10 text-sm sm:min-h-12 sm:text-base"}`}>
          {photo.title}
        </h3>
        {isList ? (
          locationLabel ? (
            <p className={`flex items-center gap-1 font-medium text-foreground/80 ${compact ? "text-[10px] sm:text-[11px]" : "text-[11px] sm:text-[13px]"}`}>
              <MapPin className="h-3 w-3 shrink-0 text-primary" />
              <span className="truncate">{locationLabel}</span>
            </p>
          ) : null
        ) : (
          <p className={`flex min-h-4 items-center gap-1 font-medium text-foreground/80 ${compact ? "text-[10px] sm:text-[11px]" : "text-[11px] sm:text-[13px]"}`}>
            {locationLabel ? (
              <>
                <MapPin className="h-3 w-3 shrink-0 text-primary" />
                <span className="truncate">{locationLabel}</span>
              </>
            ) : (
              <span className="invisible">Location</span>
            )}
          </p>
        )}
        <div className={`flex items-center justify-between font-medium leading-tight ${compact ? "gap-1" : "gap-2"} text-foreground/65 ${compact ? "text-[10px] sm:text-[11px]" : "text-[11px] sm:text-xs"} ${isList ? "pt-0.5" : "mt-auto border-t border-border/60 pt-1.5"}`}>
          <span className="truncate">{formatShortDate(photo.recorded_at, compact)}</span>
          <span className={`flex shrink-0 items-center whitespace-nowrap ${compact ? "gap-0.5" : "gap-1"}`} title={formatViews(photo.views)}>
            <Eye className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
            {formatViewCount(photo.views)}
          </span>
        </div>
      </div>
    </Link>
  );
}
