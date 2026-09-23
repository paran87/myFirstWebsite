import { Inbox, AlertTriangle, RefreshCcw } from "lucide-react";

export function EmptyState({
  title = "No results found.",
  description = "Try changing your search or filters.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface/50 py-16 text-center">
      <Inbox className="h-8 w-8 text-muted" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted">{description}</p>
      </div>
    </div>
  );
}

export function ErrorState({
  message = "Unable to load data.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-danger/30 bg-danger/5 py-16 text-center">
      <AlertTriangle className="h-8 w-8 text-danger" />
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

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="skeleton aspect-video w-full rounded-none" />
      <div className="space-y-2 p-3">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
      </div>
    </div>
  );
}
