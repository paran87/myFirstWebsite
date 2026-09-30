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
      className={`card-hover group overflow-hidden rounded-xl border bg-surface/90 shadow-sm shadow-black/5 backdrop-blur-md ${
        active ? "border-primary ring-2 ring-primary/40" : "border-border/80"
      } ${isList ? "flex flex-row items-stretch" : "flex flex-col"}`}
    >
      <div
        className={`relative shrink-0 overflow-hidden bg-surface-2 ${
          isList ? (compact ? "w-24 sm:w-32" : "w-32 sm:w-48") : "w-full"
        }`}
      >
        {/* Padding creates the box from the width (16:10 on phones and small cards,
            4:3 on larger grid cards), so flex/grid cannot collapse it. */}
        <span className={`block w-full ${compact || isList ? "pt-[62.5%]" : "pt-[62.5%] sm:pt-[75%]"}`} aria-hidden />
        <OptimizedImage
          src={photo.image_url}
          alt={photo.title}
          sizes={isList ? "(min-width: 640px) 192px, 128px" : compact ? "(min-width: 1280px) 200px, 50vw" : "(min-width: 1280px) 620px, 50vw"}
          quality={60}
          eager={index < 3 && !compact}
          className="object-cover transition duration-700 ease-[var(--ease-out)] group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        {!isList && (
          <span
            className={`absolute rounded-full bg-black/65 text-[9px] font-semibold text-white backdrop-blur-md ${compact ? "bottom-1 left-1 px-1 py-px" : "bottom-1.5 left-1.5 px-1.5 py-0.5 sm:hidden"}`}
          >
            {formatShortDate(photo.recorded_at, true)}
          </span>
        )}
        {photo.category?.name && !compact && (
          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md sm:left-2 sm:top-2 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {photo.category.name}
          </span>
        )}
      </div>
      <div className={`flex min-w-0 flex-1 flex-col ${isList ? "justify-center gap-1 p-3 sm:p-4" : "gap-0.5 px-2 py-1.5 sm:gap-1 sm:px-3 sm:py-2.5"} ${compact ? "!gap-0.5 !px-2 !py-1.5" : ""}`}>
        <h3 className={`font-bold leading-tight tracking-tight transition-colors group-hover:text-primary ${compact ? "line-clamp-1 text-[11px] sm:text-xs" : isList ? "line-clamp-2 text-sm sm:text-base" : "line-clamp-1 text-[13px] sm:line-clamp-2 sm:min-h-10 sm:text-[15px]"}`}>
          {photo.title}
        </h3>
        {isList ? (
          locationLabel ? (
            <p className={`flex items-center gap-0.5 font-medium leading-tight text-foreground/80 ${compact ? "text-[10px]" : "text-[10.5px] sm:text-xs"}`}>
              <MapPin className="h-2.5 w-2.5 shrink-0 text-primary sm:h-3 sm:w-3" />
              <span className="truncate">{locationLabel}</span>
            </p>
          ) : null
        ) : (
          <p className={`flex min-h-3.5 items-center gap-0.5 font-medium leading-tight text-foreground/80 ${compact ? "text-[10px]" : "text-[10.5px] sm:text-xs"}`}>
            {locationLabel ? (
              <>
                <MapPin className="h-2.5 w-2.5 shrink-0 text-primary sm:h-3 sm:w-3" />
                <span className="min-w-0 flex-1 truncate">{locationLabel}</span>
              </>
            ) : (
              <span className="invisible flex-1">Location</span>
            )}
            {/* On phones / small cards the date sits on the image, so views join this line. */}
            <span
              className={`ml-1 shrink-0 items-center gap-0.5 whitespace-nowrap text-foreground/65 ${compact ? "flex" : "flex sm:hidden"}`}
              title={formatViews(photo.views)}
            >
              <Eye className="h-2.5 w-2.5" />
              {formatViewCount(photo.views)}
            </span>
          </p>
        )}
        <div className={`items-center justify-between font-medium leading-tight ${isList ? "flex" : compact ? "hidden" : "hidden sm:flex"} ${compact ? "gap-1" : "gap-2"} text-foreground/65 ${compact ? "text-[10px]" : "text-[10.5px] sm:text-xs"} ${isList ? "pt-0.5" : "mt-auto border-t border-border/50 pt-1 sm:pt-1.5"}`}>
          <span className="truncate">{formatShortDate(photo.recorded_at, compact)}</span>
          <span className={`flex shrink-0 items-center whitespace-nowrap ${compact ? "gap-0.5" : "gap-1"}`} title={formatViews(photo.views)}>
            <Eye className={compact ? "h-2.5 w-2.5" : "h-2.5 w-2.5 sm:h-3 sm:w-3"} />
            {formatViewCount(photo.views)}
          </span>
        </div>
      </div>
    </Link>
  );
}
