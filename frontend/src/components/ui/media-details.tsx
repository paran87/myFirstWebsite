import type { ReactNode } from "react";
import Link from "next/link";
import { Calendar, Clock, Eye, FolderTree, MapPin, Tag as TagIcon, UploadCloud } from "lucide-react";
import { ShareButton } from "@/components/ui/share-button";
import { formatDate, formatDuration, formatViews } from "@/lib/format";
import type { Photo, Video } from "@/lib/types";

function Meta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-foreground/55">
      {icon}
      {children}
    </span>
  );
}

function Label({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/60 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-primary">
      {icon}
      {children}
    </p>
  );
}

/**
 * Title, stats and details card under the player / photo on the explorer
 * pages. Shared by videos and photos so both read the same way.
 */
export function MediaDetails({ item, kind }: { item: Video | Photo; kind: "video" | "photo" }) {
  const locationLine = [item.street, item.barangay, item.city, item.province].filter(Boolean).join(", ");
  const duration = "duration_seconds" in item ? item.duration_seconds : null;
  const catalogBase = kind === "video" ? "/videos" : "/photos";

  return (
    <div className="page-shell space-y-4 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">{item.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-foreground/75">
            <Meta icon={<Eye />}>{formatViews(item.views)}</Meta>
            <Meta icon={<Calendar />}>
              <time dateTime={item.recorded_at ?? undefined}>{formatDate(item.recorded_at)}</time>
            </Meta>
            {kind === "video" && <Meta icon={<Clock />}>{formatDuration(duration)}</Meta>}
          </div>
        </div>
        <ShareButton title={item.title} path={`/${kind}/${item.id}`} />
      </div>

      {item.description && (
        <p className="text-[15px] font-medium leading-relaxed text-foreground/85">{item.description}</p>
      )}

      <dl className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
        {locationLine && (
          <div className="bg-surface px-3.5 py-3 sm:col-span-2">
            <dt>
              <Label icon={<MapPin />}>Location</Label>
            </dt>
            <dd className="mt-1 text-sm font-semibold leading-snug">{locationLine}</dd>
          </div>
        )}
        {item.category && (
          <div className="bg-surface px-3.5 py-3">
            <dt>
              <Label icon={<FolderTree />}>Category</Label>
            </dt>
            <dd className="mt-1 text-sm font-semibold">
              <Link
                href={`${catalogBase}?category=${item.category.id}`}
                className="underline-offset-4 transition hover:text-primary hover:underline"
              >
                {item.category.name}
              </Link>
            </dd>
          </div>
        )}
        <div className={`bg-surface px-3.5 py-3 ${item.category ? "" : "sm:col-span-2"}`}>
          <dt>
            <Label icon={<UploadCloud />}>Uploaded</Label>
          </dt>
          <dd className="mt-1 text-sm font-semibold">{formatDate(item.uploaded_at ?? item.created_at)}</dd>
        </div>
      </dl>

      {item.tags?.length > 0 && (
        <div>
          <Label icon={<TagIcon />}>Tags</Label>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={`${catalogBase}?search=${encodeURIComponent(tag)}`}
                  className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
                >
                  #{tag}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
