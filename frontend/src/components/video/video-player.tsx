"use client";

import { useEffect, useRef, useState } from "react";
import { PictureInPicture2, Gauge } from "lucide-react";
import { registerVideoView } from "@/lib/api";

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
        poster={thumbnailUrl ?? undefined}
        controls
        playsInline
        preload="metadata"
        onPlay={handlePlay}
        aria-label={title}
        className="aspect-video w-full bg-black"
      >
        <track kind="captions" />
      </video>

      <div className="flex flex-wrap items-center gap-3 border-t border-border bg-surface px-3 py-2 text-sm">
        <div className="flex items-center gap-1.5 text-muted">
          <Gauge className="h-4 w-4" />
          Speed:
        </div>
        <div className="flex gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`rounded-md px-2 py-1 text-xs font-medium ${
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
            className="ml-auto flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted hover:bg-border hover:text-foreground"
          >
            <PictureInPicture2 className="h-4 w-4" />
            Picture-in-Picture
          </button>
        )}
      </div>
    </div>
  );
}
