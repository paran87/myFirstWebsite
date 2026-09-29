"use client";

import { useEffect, useRef, useState } from "react";
import { Film } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { resolveVideoPosterUrl } from "@/lib/thumbnail";

const GRID_SIZES = "(min-width: 1280px) 400px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

/**
 * Fallback still for videos without a thumbnail: grabs an early frame from
 * the video itself. The <video> is only mounted once the card is near the
 * viewport and uses preload="metadata", so a grid of cards doesn't start
 * downloading every video file at once.
 */
function VideoFrameStill({
  videoUrl,
  title,
  className,
}: {
  videoUrl: string;
  title: string;
  className: string;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(holder);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const seekToPreview = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const target = duration > 0 ? Math.min(1, Math.max(duration * 0.08, 0.1)) : 0.5;
      if (Math.abs(video.currentTime - target) > 0.05) {
        video.currentTime = target;
      }
    };

    video.addEventListener("loadedmetadata", seekToPreview);
    return () => video.removeEventListener("loadedmetadata", seekToPreview);
  }, [videoUrl, visible]);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-surface-2 text-muted ${className}`}>
        <Film className="h-9 w-9" aria-hidden />
        <span className="sr-only">{title}</span>
      </div>
    );
  }

  return (
    <div ref={holderRef} className="absolute inset-0 bg-surface-2">
      {visible && (
        <video
          ref={videoRef}
          src={`${videoUrl}#t=0.5`}
          muted
          playsInline
          preload="metadata"
          aria-label={title}
          onError={() => setFailed(true)}
          className={`pointer-events-none ${className}`}
        />
      )}
    </div>
  );
}

export function VideoThumbnail({
  title,
  thumbnailUrl,
  videoUrl,
  imageClassName = "object-cover transition duration-500 group-hover:scale-110",
  eager = false,
  sizes = GRID_SIZES,
}: {
  title: string;
  thumbnailUrl: string | null;
  videoUrl: string;
  imageClassName?: string;
  eager?: boolean;
  sizes?: string;
}) {
  const { useVideoFrame, imageUrl } = resolveVideoPosterUrl(thumbnailUrl, videoUrl);
  const [imageFailed, setImageFailed] = useState(false);

  if (!useVideoFrame && imageUrl && !imageFailed) {
    return (
      <OptimizedImage
        src={imageUrl}
        alt={title}
        sizes={sizes}
        quality={60}
        eager={eager}
        onError={() => setImageFailed(true)}
        className={imageClassName}
      />
    );
  }

  return (
    <VideoFrameStill
      videoUrl={videoUrl}
      title={title}
      className={`absolute inset-0 h-full w-full ${imageClassName}`}
    />
  );
}
