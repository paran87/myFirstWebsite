import { Inbox, AlertTriangle, RefreshCcw } from "lucide-react";

export function EmptyState({
  title = "No videos found.",
  description = "Try changing your search or filters.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-surface/40 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary-2/15 text-primary">
        <Inbox className="h-8 w-8" />
      </div>
      <div>
        <p className="text-lg font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
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
    <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-danger/30 bg-danger/5 py-20 text-center">
      <AlertTriangle className="h-9 w-9 text-danger" />
      <p className="font-medium text-danger">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 flex items-center gap-1.5 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
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
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="skeleton aspect-video w-full rounded-none" />
      <div className="space-y-2 p-3">
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}
