"use client";

import { MapPin, Calendar, Eye, Tag as TagIcon, UploadCloud } from "lucide-react";
import { PhotoViewer } from "@/components/photo/photo-viewer";
import { usePhotoCatalog } from "@/components/photo/photo-catalog-context";
import { formatDate, formatViews } from "@/lib/format";
import type { Photo } from "@/lib/types";

export function PhotoStage({ photo }: { photo: Photo }) {
  const { photos, query } = usePhotoCatalog();

  const locationLine = [photo.street, photo.barangay, photo.city, photo.province]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <PhotoViewer photo={photo} photos={photos} query={query} />

      <div className="page-shell space-y-2.5 p-3 sm:p-3.5">
        <div>
          <h1 className="text-base font-bold leading-snug tracking-tight sm:text-lg">{photo.title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-foreground/80">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatViews(photo.views)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(photo.recorded_at)}
            </span>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {locationLine && (
            <div className="rounded-lg border border-border bg-surface px-2.5 py-2">
              <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
                <MapPin className="h-3 w-3 text-primary" />
                Location
              </p>
              <p className="mt-0.5 text-xs font-medium leading-snug text-foreground/85">{locationLine}</p>
            </div>
          )}

          <div className="rounded-lg border border-border bg-surface px-2.5 py-2">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/70">Details</p>
            <dl className="space-y-0.5 text-xs text-muted">
              {photo.category?.name && (
                <div className="flex justify-between gap-3">
                  <dt>Category</dt>
                  <dd className="text-foreground">{photo.category.name}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-1">
                  <UploadCloud className="h-3 w-3" /> Uploaded
                </dt>
                <dd className="text-foreground">{formatDate(photo.uploaded_at ?? photo.created_at)}</dd>
              </div>
            </dl>
          </div>

          {photo.description && (
            <div className="rounded-lg border border-border bg-surface px-2.5 py-2 sm:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">Description</p>
              <p className="mt-0.5 line-clamp-3 text-xs font-medium leading-snug text-foreground/85">{photo.description}</p>
            </div>
          )}

          {photo.tags?.length > 0 && (
            <div className="rounded-lg border border-border bg-surface px-2.5 py-2 sm:col-span-2">
              <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
                <TagIcon className="h-3 w-3 text-primary" />
                Tags
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {photo.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
