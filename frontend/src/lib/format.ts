export function formatDuration(totalSeconds: number | null | undefined): string {
  if (!totalSeconds || totalSeconds <= 0) return "--:--";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`;
  return `${views.toLocaleString()} ${views === 1 ? "view" : "views"}`;
}

/** Bare count for tight spots next to an eye icon: "0", "950", "1.2K", "3.4M". */
export function formatViewCount(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return views.toLocaleString();
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "Unknown date";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Short date for cards: "Sep 17, 2026", or "Sep 17 ’26" when space is tight. */
export function formatShortDate(dateString: string | null | undefined, tight = false): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (tight) {
    const monthDay = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${monthDay} ’${String(date.getFullYear()).slice(-2)}`;
  }
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
