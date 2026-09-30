"use client";

import { useEffect, useRef } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import type { LatLng, VideoRoute } from "@/lib/types";
import { METRO_MANILA_CENTER, ROUTE_COLORS, TILE_ATTRIBUTION, TILE_URL, pinIcon } from "./pins";

/** Frames the route; after the first video it glides to the next one. */
function FitTo({ positions }: { positions: LatLng[] }) {
  const map = useMap();
  const first = useRef(true);
  const key = positions.map((p) => p.join(",")).join("|");
  useEffect(() => {
    const animate = !first.current;
    first.current = false;
    if (positions.length === 1) {
      if (animate) map.flyTo(positions[0], 16, { duration: 0.8 });
      else map.setView(positions[0], 16);
    } else if (positions.length > 1) {
      const bounds = L.latLngBounds(positions);
      if (animate) map.flyToBounds(bounds, { padding: [36, 36], maxZoom: 17, duration: 0.8 });
      else map.fitBounds(bounds, { padding: [36, 36], maxZoom: 17 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refit only when the positions change
  }, [map, key]);
  return null;
}

/** Keeps Leaflet's size in sync when the panel is resized (layout changes). */
function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

/**
 * The walked route for a video, highlighted along the streets/waterway, with
 * start/end pins. Falls back to a single pin (older videos with only a
 * latitude/longitude) or, with no location at all, a plain Metro Manila map.
 */
export function VideoRouteMap({
  route,
  point,
  title,
}: {
  route: VideoRoute | null;
  point: LatLng | null;
  title: string;
}) {
  const path = route && route.path.length >= 2 ? route.path : route?.points ?? [];
  const color = ROUTE_COLORS[route?.mode ?? "walking"];
  const fit: LatLng[] = path.length >= 2 ? path : point ? [point] : [];

  return (
    <MapContainer
      center={fit[0] ?? METRO_MANILA_CENTER}
      zoom={fit.length ? 15 : 11}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <AutoResize />
      <FitTo positions={fit} />

      {route && path.length >= 2 && (
        <>
          <Polyline positions={path} pathOptions={{ color, weight: 14, opacity: 0.22, lineCap: "round" }} />
          <Polyline
            positions={path}
            pathOptions={{
              color,
              weight: 5,
              opacity: 0.95,
              lineCap: "round",
              dashArray: route.mode === "straight" ? "10 9" : undefined,
            }}
          />
          {route.points.slice(1, -1).map((stop, i) => (
            <Marker key={`stop-${i}`} position={stop} icon={pinIcon("stop")} />
          ))}
          <Marker position={route.points[0]} icon={pinIcon("start", "S")}>
            <Tooltip direction="top">Start</Tooltip>
          </Marker>
          <Marker position={route.points[route.points.length - 1]} icon={pinIcon("end", "E")}>
            <Tooltip direction="top">End</Tooltip>
          </Marker>
        </>
      )}

      {!route && point && (
        <Marker position={point} icon={pinIcon("active")}>
          <Tooltip direction="top" permanent className="map-label">
            {title}
          </Tooltip>
        </Marker>
      )}
    </MapContainer>
  );
}
