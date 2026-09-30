import type { LatLng, VideoRoute, VideoRouteMode } from "@/lib/types";

/** Default map view: central Metro Manila. */
export const METRO_MANILA_CENTER: LatLng = [14.5995, 120.9842];

export function isLatLng(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

/** Rounds to 6 decimals (~10 cm) — plenty for street-level locations. */
export function roundCoord(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

function haversineMeters([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function pathLengthMeters(path: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += haversineMeters(path[i - 1], path[i]);
  return Math.round(total);
}

export function formatDistance(meters: number | null | undefined): string {
  if (!meters) return "—";
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}

// OpenStreetMap's public OSRM servers (the same ones openstreetmap.org uses
// for directions). Free for light use; failures fall back to straight lines.
const OSRM_PROFILES: Record<Exclude<VideoRouteMode, "straight">, string> = {
  walking: "https://routing.openstreetmap.de/routed-foot/route/v1/driving/",
  driving: "https://routing.openstreetmap.de/routed-car/route/v1/driving/",
};

/**
 * Builds the line to draw through `points`: along streets/footpaths for
 * walking/driving, or point-to-point for "straight" (waterways, ferries,
 * places the road network doesn't cover — add points along the river).
 * `fellBack` is true when street routing failed and straight lines were used.
 */
export async function buildRoute(
  points: LatLng[],
  mode: VideoRouteMode,
  signal?: AbortSignal
): Promise<{ route: VideoRoute; fellBack: boolean }> {
  const straight = (fellBack: boolean) => ({
    route: { mode, points, path: points, distance_m: pathLengthMeters(points) },
    fellBack,
  });

  if (mode === "straight" || points.length < 2) return straight(false);

  try {
    const coords = points.map(([lat, lng]) => `${lng},${lat}`).join(";");
    const response = await fetch(`${OSRM_PROFILES[mode]}${coords}?overview=full&geometries=geojson`, { signal });
    if (!response.ok) throw new Error(`Routing failed (${response.status})`);
    const body = (await response.json()) as {
      code?: string;
      routes?: { distance: number; geometry: { coordinates: [number, number][] } }[];
    };
    const best = body.routes?.[0];
    if (body.code !== "Ok" || !best || best.geometry.coordinates.length < 2) throw new Error("No route found");
    const path = best.geometry.coordinates.map(([lng, lat]) => [roundCoord(lat), roundCoord(lng)] as LatLng);
    return { route: { mode, points, path, distance_m: Math.round(best.distance) }, fellBack: false };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return straight(true);
  }
}

/** Reads the GPS position stored in a photo's EXIF data (null if none). */
export async function readPhotoGps(source: File | Blob | ArrayBuffer | string): Promise<LatLng | null> {
  try {
    const exifr = (await import("exifr")).default;
    const gps = await exifr.gps(source);
    if (!gps || !isLatLng(gps.latitude, gps.longitude)) return null;
    // Some cameras write 0,0 when they have no fix.
    if (gps.latitude === 0 && gps.longitude === 0) return null;
    return [roundCoord(gps.latitude), roundCoord(gps.longitude)];
  } catch {
    return null;
  }
}
