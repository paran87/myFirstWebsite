"use client";

import { useEffect, useRef } from "react";
import { Marker, Polyline, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import type { LatLng, VideoRoute } from "@/lib/types";
import { ROUTE_COLORS, pinIcon } from "./pins";
import { takeFirstFrame } from "./fit-state";

/** Frames the route: instantly the first time, gliding afterwards. */
function FitTo({ positions }: { positions: LatLng[] }) {
  const map = useMap();
  const key = positions.map((p) => p.join(",")).join("|");
  useEffect(() => {
    if (positions.length === 0) return;
    const animate = !takeFirstFrame(map);
    if (positions.length === 1) {
      if (animate) map.flyTo(positions[0], 16, { duration: 0.8 });
      else map.setView(positions[0], 16);
    } else {
      const bounds = L.latLngBounds(positions);
      if (animate) map.flyToBounds(bounds, { padding: [36, 36], maxZoom: 17, duration: 0.8 });
      else map.fitBounds(bounds, { padding: [36, 36], maxZoom: 17 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refit only when the positions change
  }, [map, key]);

  // Keep the route framed when the map area changes size (e.g. the phone
  // bottom sheet opening or closing).
  const latest = useRef(positions);
  useEffect(() => {
    latest.current = positions;
  });
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refit = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const current = latest.current;
        if (current.length === 1) map.setView(current[0], map.getZoom());
        else if (current.length > 1) map.fitBounds(L.latLngBounds(current), { padding: [36, 36], maxZoom: 17 });
      }, 120);
    };
    map.on("resize", refit);
    return () => {
      clearTimeout(timer);
      map.off("resize", refit);
    };
  }, [map]);
  return null;
}

/**
 * A video's walked route, highlighted along the streets/waterway, with
 * start/end pins — or a single pin for older videos with only a
 * latitude/longitude. Renders nothing when there is no location.
 */
export function VideoRouteLayers({
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
    <>
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
    </>
  );
}
