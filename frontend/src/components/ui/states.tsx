import { AlertTriangle, RefreshCcw } from "lucide-react";
import { LostMap } from "@/components/illustrations/lost-map";

export function EmptyState({
  title = "No videos found.",
  description = "Try changing your search or filters.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="animate-fade-up col-span-full flex flex-col items-center justify-center gap-2 rounded-[1.75rem] border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
      <LostMap className="h-40 w-auto text-foreground" />
      <p className="mt-2 font-display text-2xl font-extrabold tracking-tight">{title}</p>
      <p className="max-w-sm text-base font-medium text-foreground/70">{description}</p>
    </div>
  );
}

export function ErrorState({
  message = "Unable to load videos.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-dashed border-danger/30 bg-danger/5 py-20 text-center">
      <span className="animate-wiggle flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10">
        <AlertTriangle className="h-8 w-8 text-danger" />
      </span>
      <p className="font-medium text-danger">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 flex items-center gap-1.5 rounded-full bg-danger px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-danger/25 transition hover:-translate-y-0.5"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-border bg-surface/80">
      <div className="skeleton aspect-video w-full rounded-none" />
      <div className="space-y-2 p-3">
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}
