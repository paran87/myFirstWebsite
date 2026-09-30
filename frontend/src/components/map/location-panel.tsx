import type { ReactNode } from "react";
import { MapPinOff } from "lucide-react";
import type { ExploreMapProps } from "./explore-map";

/** Everything the shared map panel shows for the selected video or photo. */
export interface LocationPanelContent {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  map: ExploreMapProps;
  empty?: { title: string; message: string } | null;
  info?: ReactNode;
}

/**
 * Left-hand map column on the video/photo pages. Fills the viewport height
 * beside the media on wide screens; a fixed-height card when stacked.
 */
export function LocationPanel({
  icon,
  title,
  subtitle,
  map,
  empty,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  map: ReactNode;
  /** When set, the map is dimmed and this message is shown over it. */
  empty?: { title: string; message: string } | null;
  children?: ReactNode;
}) {
  return (
    <aside className="page-shell flex min-h-0 flex-col gap-3 p-3 sm:p-4 xl:sticky xl:top-20 xl:h-[calc(100vh-6rem)] xl:max-h-[calc(100vh-6rem)]">
      <div className="explorer-hide-mobile flex items-center gap-2.5 px-1">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span>
        <div className="min-w-0">
          <h2 className="text-base font-extrabold leading-tight tracking-tight">{title}</h2>
          {subtitle && <p className="truncate text-xs font-medium text-foreground/70">{subtitle}</p>}
        </div>
      </div>

      <div className="explorer-map-box relative h-[26rem] min-h-[18rem] overflow-hidden rounded-lg border border-border sm:h-[34rem] xl:h-auto xl:flex-1">
        {map}
        {empty && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-surface/70 p-5 backdrop-blur-[2px]">
            <div className="max-w-xs rounded-2xl border border-border bg-surface/95 p-5 text-center shadow-xl">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10 text-warning">
                <MapPinOff className="h-6 w-6" />
              </span>
              <p className="mt-3 font-display text-base font-extrabold">{empty.title}</p>
              <p className="mt-1 text-sm font-medium leading-snug text-foreground/75">{empty.message}</p>
            </div>
          </div>
        )}
      </div>

      {children && <div className="explorer-hide-mobile space-y-2 px-1 text-sm">{children}</div>}
    </aside>
  );
}

export function CoordRow({ label, value, tone }: { label: string; value: string; tone?: "start" | "end" }) {
  const dot = tone === "start" ? "bg-green-600" : tone === "end" ? "bg-red-600" : "bg-primary";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex shrink-0 items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-foreground/65">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {label}
      </span>
      <span className="whitespace-nowrap font-mono text-[11px] font-medium tabular-nums text-foreground/85">{value}</span>
    </div>
  );
}

export function formatLatLng([lat, lng]: [number, number]) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function formatDistance(meters: number | null | undefined) {
  if (!meters) return null;
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}
