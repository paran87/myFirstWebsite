"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Opens the phone's share sheet where available; otherwise copies the
 * page's link (without the catalog filters) to the clipboard.
 */
export function ShareButton({ title, path }: { title: string; path: string }) {
  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // Dismissing the share sheet is not an error worth reporting.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy the link");
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 text-sm font-bold text-foreground transition hover:border-primary/50 hover:text-primary sm:px-3.5"
    >
      <Share2 className="h-4 w-4" />
      <span className="max-sm:sr-only">Share</span>
    </button>
  );
}
