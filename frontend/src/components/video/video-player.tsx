"use client";

import { useEffect, useRef, useState } from "react";
import { PictureInPicture2, Gauge } from "lucide-react";
import { registerVideoView } from "@/lib/api";
import { resolveVideoPosterUrl } from "@/lib/thumbnail";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function VideoPlayer({
  videoId,
  videoUrl,
  thumbnailUrl,
  title,
}: {
  videoId: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState(1);
  const [pipSupported, setPipSupported] = useState(false);
  const hasCountedView = useRef(false);

  useEffect(() => {
    // Feature-detected after mount (not during SSR) to avoid a
    // server/client hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPipSupported(typeof document !== "undefined" && "pictureInPictureEnabled" in document);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
  }, [speed]);

  const { useVideoFrame, imageUrl: posterUrl } = resolveVideoPosterUrl(thumbnailUrl, videoUrl);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !useVideoFrame) return;

    const seekToPreview = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      video.currentTime =
        duration > 0 ? Math.min(1, Math.max(duration * 0.08, 0.1)) : 0.5;
    };

    video.addEventListener("loadedmetadata", seekToPreview);
    return () => video.removeEventListener("loadedmetadata", seekToPreview);
  }, [useVideoFrame, videoUrl]);

  function handlePlay() {
    if (hasCountedView.current) return;
    hasCountedView.current = true;
    registerVideoView(videoId);
  }

  async function togglePip() {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      // PiP can fail (e.g. unsupported browser) — non-critical, ignore.
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl ?? undefined}
        controls
        playsInline
        preload="metadata"
        onPlay={handlePlay}
        aria-label={title}
        className="aspect-video w-full bg-black"
      >
        <track kind="captions" />
      </video>

      <div className="flex items-center gap-1 border-t border-border bg-surface px-2 py-1 text-[10px] sm:gap-3 sm:px-3 sm:py-2 sm:text-sm">
        <div className="flex items-center gap-1 text-muted sm:gap-1.5">
          <Gauge className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Speed:</span>
        </div>
        <div className="flex gap-0.5 sm:gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:py-1 sm:text-xs ${
                speed === s ? "bg-primary text-primary-foreground" : "text-muted hover:bg-border"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {pipSupported && (
          <button
            onClick={togglePip}
            className="ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted hover:bg-border hover:text-foreground sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs"
          >
            <PictureInPicture2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="sm:hidden">PiP</span>
            <span className="hidden sm:inline">Picture-in-Picture</span>
          </button>
        )}
      </div>
    </div>
  );
}
