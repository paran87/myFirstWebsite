"use client";

import { useEffect, useRef, useState } from "react";
import { Film } from "lucide-react";
import { resolveVideoPosterUrl } from "@/lib/thumbnail";

function VideoFrameStill({
  videoUrl,
  title,
  className,
}: {
  videoUrl: string;
  title: string;
  className: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

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

    video.addEventListener("loadeddata", seekToPreview);
    return () => video.removeEventListener("loadeddata", seekToPreview);
  }, [videoUrl]);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-surface-2 text-muted ${className}`}>
        <Film className="h-9 w-9" aria-hidden />
        <span className="sr-only">{title}</span>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={`${videoUrl}#t=0.5`}
      muted
      playsInline
      preload="auto"
      aria-label={title}
      onError={() => setFailed(true)}
      className={`pointer-events-none ${className}`}
    />
  );
}

export function VideoThumbnail({
  title,
  thumbnailUrl,
  videoUrl,
  imageClassName = "object-cover transition duration-500 group-hover:scale-110",
  priority = false,
}: {
  title: string;
  thumbnailUrl: string | null;
  videoUrl: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  const { useVideoFrame, imageUrl } = resolveVideoPosterUrl(thumbnailUrl, videoUrl);
  const [imageFailed, setImageFailed] = useState(false);

  if (!useVideoFrame && imageUrl && !imageFailed) {
    return (
      // Loaded directly so a thumbnail still shows when the Next.js image
      // optimizer cannot fetch Supabase (common TLS failure on Windows).
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={title}
        loading={priority ? "eager" : "lazy"}
        onError={() => setImageFailed(true)}
        className={`absolute inset-0 h-full w-full ${imageClassName}`}
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
