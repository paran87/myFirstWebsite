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
      video.currentTime =
        duration > 0 ? Math.min(1, Math.max(duration * 0.08, 0.1)) : 0.5;
    };

    video.addEventListener("loadedmetadata", seekToPreview);
    return () => video.removeEventListener("loadedmetadata", seekToPreview);
  }, [videoUrl]);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-border text-muted ${className}`}>
        <Film className="h-4 w-4" aria-hidden />
        <span className="sr-only">{title}</span>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      muted
      playsInline
      preload="metadata"
      aria-label={title}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

/** Thumbnail cell for admin tables and previews — uses stored image or a frame from the video. */
export function AdminVideoThumbnail({
  title,
  thumbnailUrl,
  videoUrl,
  className = "relative h-12 w-20 overflow-hidden rounded-lg bg-border",
  imageClassName = "object-cover",
}: {
  title: string;
  thumbnailUrl: string | null;
  videoUrl: string;
  className?: string;
  imageClassName?: string;
}) {
  const { useVideoFrame, imageUrl } = resolveVideoPosterUrl(thumbnailUrl, videoUrl);
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className={className}>
      {!useVideoFrame && imageUrl && !imageFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={title}
          onError={() => setImageFailed(true)}
          className={`absolute inset-0 h-full w-full ${imageClassName}`}
        />
      ) : (
        <VideoFrameStill
          videoUrl={videoUrl}
          title={title}
          className={`absolute inset-0 h-full w-full ${imageClassName}`}
        />
      )}
    </div>
  );
}
