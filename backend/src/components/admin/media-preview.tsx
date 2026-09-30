"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink, Pencil, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { VideoStatus } from "@/lib/types";

export interface PreviewItem {
  id: string;
  kind: "video" | "photo";
  title: string;
  /** Video file or full-size photo URL. */
  src: string;
  poster?: string | null;
  status: VideoStatus;
  details: string;
  editHref: string;
}

/**
 * In-page viewer for the admin lists: plays videos and shows photos in an
 * overlay instead of opening the raw file in a new tab. Arrow keys / buttons
 * step through the items on the current page; Esc or the backdrop closes it.
 */
export function MediaPreview({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: PreviewItem[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const item = index === null ? null : items[index];
  const hasPrev = index !== null && index > 0;
  const hasNext = index !== null && index < items.length - 1;

  useEffect(() => {
    if (index === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      // Leave arrow keys to the video controls when they have focus.
      if (event.target instanceof HTMLVideoElement) return;
      if (event.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
      if (event.key === "ArrowRight" && index < items.length - 1) onIndexChange(index + 1);
    };
    window.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [index, items.length, onClose, onIndexChange]);

  useEffect(() => {
    if (index !== null) closeRef.current?.focus();
  }, [index]);

  if (!item || index === null) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${item.title}`}
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 border-b border-white/10 px-4 py-3 text-white sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold">{item.title}</h2>
            <StatusBadge status={item.status} />
          </div>
          <p className="truncate text-xs text-white/60">
            {item.details} &middot; {index + 1} of {items.length}
          </p>
        </div>
        <Link
          href={item.editHref}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"
        >
          <Pencil className="h-4 w-4" />
          <span className="hidden sm:inline">Edit</span>
        </Link>
        <a
          href={item.src}
          target="_blank"
          rel="noreferrer"
          title="Open original file in a new tab"
          className="hidden rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white sm:inline-flex"
        >
          <ExternalLink className="h-4 w-4" />
          <span className="sr-only">Open original file</span>
        </a>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close preview</span>
        </button>
      </div>

      {/* Media */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 sm:px-20 sm:py-6">
        <div className="flex max-h-full max-w-full items-center justify-center" onClick={(e) => e.stopPropagation()}>
          {item.kind === "video" ? (
            <video
              key={item.id}
              src={item.src}
              poster={item.poster ?? undefined}
              controls
              autoPlay
              playsInline
              className="max-h-[calc(100vh-9rem)] max-w-full rounded-lg bg-black shadow-2xl"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={item.id}
              src={item.src}
              alt={item.title}
              className="max-h-[calc(100vh-9rem)] max-w-full rounded-lg object-contain shadow-2xl"
            />
          )}
        </div>

        {hasPrev && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange(index - 1);
            }}
            className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-5"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Previous</span>
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange(index + 1);
            }}
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-5"
          >
            <ChevronRight className="h-6 w-6" />
            <span className="sr-only">Next</span>
          </button>
        )}
      </div>
    </div>
  );
}
