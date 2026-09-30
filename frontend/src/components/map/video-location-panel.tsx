import { ExternalLink, Footprints, Car, Waves, MapPin } from "lucide-react";
import { CoordRow, formatDistance, formatLatLng, type LocationPanelContent } from "@/components/map/location-panel";
import type { LatLng, Video, VideoRouteMode } from "@/lib/types";

const MODE_LABEL: Record<VideoRouteMode, { label: string; icon: typeof Footprints; travel: string }> = {
  walking: { label: "Walking route", icon: Footprints, travel: "walking" },
  driving: { label: "Road route", icon: Car, travel: "driving" },
  straight: { label: "Waterway / free route", icon: Waves, travel: "walking" },
};

function asPoint(lat: unknown, lng: unknown): LatLng | null {
  const a = Number(lat);
  const b = Number(lng);
  return lat != null && lng != null && Number.isFinite(a) && Number.isFinite(b) ? [a, b] : null;
}

/** Map panel contents for a video: its route (or single pin) and details. */
export function videoPanelContent(video: Video | null): LocationPanelContent {
  if (!video) {
    return { icon: <MapPin className="h-4.5 w-4.5" />, title: "Recording location", map: { mode: "idle" } };
  }

  const route = video.route && video.route.points?.length >= 2 ? video.route : null;
  const point = route ? route.points[0] : asPoint(video.latitude, video.longitude);
  const mode = route ? MODE_LABEL[route.mode] ?? MODE_LABEL.walking : null;
  const place = [video.street, video.barangay, video.city].filter(Boolean).join(", ");

  const start = route?.points[0];
  const end = route?.points[route.points.length - 1];
  const mapsHref = route
    ? `https://www.google.com/maps/dir/?api=1&origin=${start!.join(",")}&destination=${end!.join(",")}&travelmode=${mode!.travel}`
    : point
      ? `https://www.google.com/maps/search/?api=1&query=${point.join(",")}`
      : null;

  const Icon = mode?.icon ?? MapPin;

  return {
    icon: <Icon className="h-4.5 w-4.5" />,
    title: route ? mode!.label : "Recording location",
    subtitle: place || (point ? undefined : "No coordinates set"),
    map: { mode: "video", route, point, title: video.title },
    empty: point
      ? null
      : {
          title: "Can't find the location",
          message: "This video has no coordinates set up yet, so its location can't be shown on the map.",
        },
    info: (
      <>
        {route && start && end && (
          <>
            <CoordRow label="Start" value={formatLatLng(start)} tone="start" />
            <CoordRow label="End" value={formatLatLng(end)} tone="end" />
            {formatDistance(route.distance_m) && <CoordRow label="Distance" value={formatDistance(route.distance_m)!} />}
          </>
        )}
        {!route && point && <CoordRow label="Coordinates" value={formatLatLng(point)} />}
        {mapsHref && (
          <a
            href={mapsHref}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold transition hover:border-primary/50 hover:text-primary"
          >
            <ExternalLink className="h-4 w-4" />
            {route ? "Open route in Google Maps" : "Open in Google Maps"}
          </a>
        )}
      </>
    ),
  };
}
