const CAPTURE_TIMEOUT_MS = 8_000;
const MAX_WIDTH = 640;

/**
 * Browser-only: captures a JPEG still from a local video file.
 * Times out quickly so a large upload is never blocked by thumbnail work.
 */
export async function captureVideoThumbnailFile(file: File): Promise<File | null> {
  if (typeof document === "undefined") return null;

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");

    let settled = false;
    const finish = (result: File | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
      resolve(result);
    };

    const timer = window.setTimeout(() => finish(null), CAPTURE_TIMEOUT_MS);

    const paintFrame = () => {
      try {
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (!width || !height) {
          finish(null);
          return;
        }
        const scale = width > MAX_WIDTH ? MAX_WIDTH / width : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          finish(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) finish(null);
            else finish(new File([blob], "thumbnail.jpg", { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.72
        );
      } catch {
        finish(null);
      }
    };

    const seekToFrame = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const target = duration > 1 ? 0.35 : 0;
      if (target === 0 || video.currentTime >= target) {
        paintFrame();
        return;
      }
      try {
        video.currentTime = target;
      } catch {
        paintFrame();
      }
    };

    video.addEventListener("seeked", paintFrame, { once: true });
    video.addEventListener("loadeddata", seekToFrame, { once: true });
    video.addEventListener("error", () => finish(null), { once: true });
    video.src = objectUrl;
  });
}
