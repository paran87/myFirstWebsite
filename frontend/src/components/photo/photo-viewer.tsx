"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { getImageProps } from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, Maximize2, X } from "lucide-react";
import { usePhotoCatalog } from "@/components/photo/photo-catalog-context";
import { downloadImage } from "@/lib/download";
import { canOptimizeImage } from "@/lib/image";
import type { Photo } from "@/lib/types";

function photoHref(photo: Photo, query: string) {
  return query ? `/photo/${photo.id}?${query}` : `/photo/${photo.id}`;
}

const PREVIEW_SIZES = "(min-width: 1280px) 780px, 100vw";
const FULLSCREEN_SIZES = "100vw";

/**
 * Responsive, resized WebP `<img>` props for a photo of unknown dimensions.
 * The intrinsic width/height are dropped so the photo keeps its own aspect
 * ratio; `srcSet` + `sizes` still pick a screen-appropriate file.
 */
function responsivePhotoProps(src: string, sizes: string, quality: 75 | 85) {
  if (!canOptimizeImage(src)) return { src };
  const { props } = getImageProps({ src, alt: "", width: 1920, height: 1080, sizes, quality });
  return { src: props.src, srcSet: props.srcSet, sizes: props.sizes };
}

function PhotoImage({
  src,
  alt,
  sizes,
  quality,
  className,
  hidden = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  quality: 75 | 85;
  className?: string;
  hidden?: boolean;
}) {
  const [useOriginal, setUseOriginal] = useState(false);
  const imgProps = useOriginal ? { src } : responsivePhotoProps(src, sizes, quality);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={useOriginal ? "original" : "optimized"}
      {...imgProps}
      alt={alt}
      aria-hidden={hidden || undefined}
      decoding="async"
      className={className}
      onError={() => setUseOriginal(true)}
    />
  );
}

function ControlButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/80 disabled:opacity-60 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function PhotoViewer({
  photo,
  photos,
  query = "",
}: {
  photo: Photo;
  photos: Photo[];
  query?: string;
}) {
  const router = useRouter();
  const { fullscreen, setFullscreen } = usePhotoCatalog();
  const [downloading, setDownloading] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const gallery = photos.some((item) => item.id === photo.id) ? photos : [photo, ...photos];
  const index = gallery.findIndex((item) => item.id === photo.id);
  const previous = gallery.length > 1 ? gallery[(index - 1 + gallery.length) % gallery.length] : null;
  const next = gallery.length > 1 ? gallery[(index + 1) % gallery.length] : null;

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [fullscreen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && fullscreen) {
        event.preventDefault();
        setFullscreen(false);
        return;
      }
      if (event.key === "ArrowLeft" && previous) router.push(photoHref(previous, query), { scroll: false });
      if (event.key === "ArrowRight" && next) router.push(photoHref(next, query), { scroll: false });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreen, next, previous, query, router, setFullscreen]);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadImage(photo.image_url, photo.title);
    } finally {
      setDownloading(false);
    }
  }

  const previewImage = (
    <PhotoImage
      src={photo.image_url}
      alt={photo.title}
      sizes={PREVIEW_SIZES}
      quality={75}
      className="max-h-[70vh] w-full object-contain"
    />
  );
  const fullImage = (
    <PhotoImage
      src={photo.image_url}
      alt={photo.title}
      sizes={FULLSCREEN_SIZES}
      quality={85}
      className="max-h-full max-w-full object-contain"
    />
  );

  const navButtons = (
    <>
      {previous && (
        <Link
          href={photoHref(previous, query)}
          scroll={false}
          prefetch
          aria-label={`Previous photo: ${previous.title}`}
          className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/80 sm:left-3 sm:h-11 sm:w-11"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
      )}
      {next && (
        <Link
          href={photoHref(next, query)}
          scroll={false}
          prefetch
          aria-label={`Next photo: ${next.title}`}
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/80 sm:right-3 sm:h-11 sm:w-11"
        >
          <ChevronRight className="h-6 w-6" />
        </Link>
      )}
    </>
  );

  return (
    <>
      {/* Warm the cache for the neighbours at the same (resized) size. */}
      {previous && (
        <PhotoImage src={previous.image_url} alt="" sizes={PREVIEW_SIZES} quality={75} className="hidden" hidden />
      )}
      {next && <PhotoImage src={next.image_url} alt="" sizes={PREVIEW_SIZES} quality={75} className="hidden" hidden />}

      <div className="relative overflow-hidden rounded-xl border border-border bg-black/5 shadow-xl shadow-black/10">
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="block w-full cursor-zoom-in"
          aria-label="Open full screen view"
        >
          {previewImage}
        </button>

        <ControlButton
          onClick={() => setFullscreen(true)}
          aria-label="Open full screen view"
          className="absolute right-2 top-2 h-9 w-9 sm:right-3 sm:top-3"
        >
          <Maximize2 className="h-4 w-4" />
        </ControlButton>

        {navButtons}

        {gallery.length > 1 && (
          <p className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {index + 1} / {gallery.length}
          </p>
        )}
      </div>

      {portalReady &&
        fullscreen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Full screen photo"
            className="fixed inset-0 z-[80] flex flex-col bg-black"
          >
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
              <p className="min-w-0 truncate text-sm font-semibold text-white">{photo.title}</p>
              <div className="flex shrink-0 items-center gap-2">
                <ControlButton
                  onClick={handleDownload}
                  disabled={downloading}
                  aria-label="Download photo"
                  className="h-9 px-3 text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">{downloading ? "Downloading..." : "Download"}</span>
                </ControlButton>
                <ControlButton
                  onClick={() => setFullscreen(false)}
                  aria-label="Close full screen view"
                  className="h-9 px-3 text-sm font-medium"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Close</span>
                </ControlButton>
              </div>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-12 pb-6 sm:px-16">
              {fullImage}
              {navButtons}
              {gallery.length > 1 && (
                <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                  {index + 1} / {gallery.length}
                </p>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
