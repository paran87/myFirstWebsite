import clsx from "clsx";
import type { VideoStatus } from "@/lib/types";

const STYLES: Record<VideoStatus, string> = {
  draft: "bg-warning/10 text-warning",
  published: "bg-success/10 text-success",
  private: "bg-muted/10 text-muted",
  deleted: "bg-danger/10 text-danger",
};

export function StatusBadge({ status }: { status: VideoStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        STYLES[status]
      )}
    >
      {status}
    </span>
  );
}
