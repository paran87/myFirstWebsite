"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { AlertTriangle, ArrowDownUp, Footprints, Car, Loader2, Undo2, Waves, X } from "lucide-react";
import { METRO_MANILA_CENTER, buildRoute, formatDistance, isLatLng, roundCoord } from "@/lib/geo";
import type { LatLng, VideoRoute, VideoRouteMode } from "@/lib/types";
import { TILE_ATTRIBUTION, TILE_URL, pinIcon } from "./pins";

const MODES: { value: VideoRouteMode; label: string; hint: string; icon: typeof Footprints }[] = [
  { value: "walking", label: "Walking", hint: "Follows streets, alleys and footpaths", icon: Footprints },
  { value: "driving", label: "Road", hint: "Follows roads open to vehicles", icon: Car },
  { value: "straight", label: "Waterway / free", hint: "Straight lines between your points — add points along a river, ferry route or anywhere roads don't go", icon: Waves },
];

export const ROUTE_COLORS: Record<VideoRouteMode, string> = {
  walking: "#0d9488",
  driving: "#ea580c",
  straight: "#2563eb",
};

/** Keeps what the user typed ("14.", "14.50") unless the number itself changed. */
function syncText(current: string, next: number | undefined): string {
  if (next === undefined) return "";
  return current.trim() !== "" && Number(current) === next ? current : String(next);
}

function ClickToAdd({ onAdd }: { onAdd: (point: LatLng) => void }) {
  useMapEvents({
    click(event) {
      onAdd([roundCoord(event.latlng.lat), roundCoord(event.latlng.lng)]);
    },
  });
  return null;
}

function FitToRoute({ points, path }: { points: LatLng[]; path: LatLng[] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    // Fit once for an existing route; afterwards leave the view to the user.
    if (fitted.current) return;
    const all = path.length ? path : points;
    if (all.length >= 2) {
      map.fitBounds(L.latLngBounds(all), { padding: [40, 40], maxZoom: 17 });
      fitted.current = true;
    } else if (all.length === 1) {
      map.setView(all[0], 16);
    }
  }, [map, points, path]);
  return null;
}

function PointInputs({
  point,
  onCommit,
}: {
  point: LatLng;
  onCommit: (point: LatLng) => void;
}) {
  const [lat, setLat] = useState(String(point[0]));
  const [lng, setLng] = useState(String(point[1]));
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirror dragged/clicked point into inputs
    setLat((current) => syncText(current, point[0]));
    setLng((current) => syncText(current, point[1]));
  }, [point]);
  const commit = (latText = lat, lngText = lng) => {
    if (latText.trim() === "" || lngText.trim() === "") return;
    const a = Number(latText);
    const b = Number(lngText);
    if (isLatLng(a, b) && (a !== point[0] || b !== point[1])) onCommit([roundCoord(a), roundCoord(b)]);
  };
  const cls =
    "w-full min-w-0 rounded-md border border-border bg-background px-2 py-1.5 text-xs tabular-nums outline-none ring-primary/40 focus:ring-2";
  return (
    <>
      <input
        aria-label="Latitude"
        type="number"
        step="any"
        value={lat}
        onChange={(e) => {
          setLat(e.target.value);
          commit(e.target.value, lng);
        }}
        onBlur={() => commit()}
        className={cls}
      />
      <input
        aria-label="Longitude"
        type="number"
        step="any"
        value={lng}
        onChange={(e) => {
          setLng(e.target.value);
          commit(lat, e.target.value);
        }}
        onBlur={() => commit()}
        className={cls}
      />
    </>
  );
}

/**
 * Start/end coordinates for a video plus the route between them. The first
 * click sets the start, the next the end; further clicks extend the route
 * (the previous end becomes a stop). Pins can be dragged or typed in.
 *
 * `onChange` receives the route (null until there are two points) and the
 * start point on its own, so a video with just one known location still
 * gets saved. `initialPoint` seeds the start for videos that only have a
 * latitude/longitude from before routes existed.
 */
export function RoutePicker({
  value,
  initialPoint = null,
  onChange,
  height = 420,
}: {
  value: VideoRoute | null;
  initialPoint?: LatLng | null;
  onChange: (route: VideoRoute | null, start: LatLng | null) => void;
  height?: number;
}) {
  const [mode, setMode] = useState<VideoRouteMode>(value?.mode ?? "walking");
  const [points, setPoints] = useState<LatLng[]>(value?.points ?? (initialPoint ? [initialPoint] : []));
  const [path, setPath] = useState<LatLng[]>(value?.path ?? []);
  const [distance, setDistance] = useState<number | null>(value?.distance_m ?? null);
  const [routing, setRouting] = useState(false);
  const [fellBack, setFellBack] = useState(false);
  const isFirstRun = useRef(true);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Recompute the drawn line whenever the points or mode change.
  useEffect(() => {
    // Don't re-route an existing saved route just because the form opened.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      if (value && value.path.length >= 2) return;
    }
    if (points.length < 2) {
      onChangeRef.current(null, points[0] ?? null);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setRouting(true);
      try {
        const result = await buildRoute(points, mode, controller.signal);
        setPath(result.route.path);
        setDistance(result.route.distance_m ?? null);
        setFellBack(result.fellBack);
        onChangeRef.current(result.route, points[0]);
      } catch {
        // aborted by a newer change
      } finally {
        if (!controller.signal.aborted) setRouting(false);
      }
    }, 400);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `value` only seeds the first run
  }, [points, mode]);

  // With fewer than two points there is no route, whatever was computed before.
  const hasRoute = points.length >= 2;
  const shownPath = hasRoute ? path : [];
  const shownDistance = hasRoute ? distance : null;
  const showFallbackWarning = hasRoute && fellBack;
  const color = ROUTE_COLORS[mode];
  const drawn = shownPath.length >= 2 ? shownPath : hasRoute ? points : [];

  function updatePoint(index: number, point: LatLng) {
    setPoints((current) => current.map((p, i) => (i === index ? point : p)));
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {MODES.map(({ value: m, label, hint, icon: Icon }) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            title={hint}
            className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
              mode === m ? "border-primary bg-primary/10" : "border-border hover:bg-background"
            }`}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ROUTE_COLORS[m] }} />
            <span>
              <span className="block font-medium">{label}</span>
              <span className="block text-xs text-muted">{hint}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border" style={{ height }}>
        <MapContainer
          center={points[0] ?? METRO_MANILA_CENTER}
          zoom={points.length ? 15 : 12}
          scrollWheelZoom
          style={{ height: "100%", width: "100%", cursor: "crosshair" }}
        >
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
          <ClickToAdd onAdd={(point) => setPoints((current) => [...current, point])} />
          <FitToRoute points={points} path={shownPath} />
          {drawn.length >= 2 && (
            <>
              <Polyline positions={drawn} pathOptions={{ color, weight: 12, opacity: 0.25 }} />
              <Polyline
                positions={drawn}
                pathOptions={{ color, weight: 5, opacity: 0.95, dashArray: mode === "straight" ? "10 8" : undefined }}
              />
            </>
          )}
          {points.map((point, index) => {
            const isStart = index === 0;
            const isEnd = index === points.length - 1 && points.length > 1;
            const variant = isStart ? "start" : isEnd ? "end" : "stop";
            const label = isStart ? "S" : isEnd ? "E" : String(index);
            return (
              <Marker
                key={index}
                position={point}
                icon={pinIcon(variant, label)}
                draggable
                eventHandlers={{
                  dragend(event) {
                    const p = (event.target as L.Marker).getLatLng();
                    updatePoint(index, [roundCoord(p.lat), roundCoord(p.lng)]);
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -30]}>
                  {isStart ? "Start" : isEnd ? "End" : `Stop ${index}`}
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>

        <div className="pointer-events-none absolute right-3 top-3 z-[400] rounded-lg bg-surface/95 px-3 py-1.5 text-xs font-medium shadow">
          {points.length === 0
            ? "Click the map to set the START point"
            : points.length === 1
              ? "Click to set the END point (or save with just this location)"
              : "Click to extend the route · drag pins to adjust"}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium">
          {routing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          {routing ? "Finding route…" : `Route length: ${formatDistance(shownDistance)}`}
        </span>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => setPoints((current) => current.slice(0, -1))}
            disabled={points.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 hover:bg-border disabled:opacity-40"
          >
            <Undo2 className="h-4 w-4" /> Undo
          </button>
          <button
            type="button"
            onClick={() => setPoints((current) => [...current].reverse())}
            disabled={points.length < 2}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 hover:bg-border disabled:opacity-40"
          >
            <ArrowDownUp className="h-4 w-4" /> Reverse
          </button>
          <button
            type="button"
            onClick={() => setPoints([])}
            disabled={points.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 hover:bg-border disabled:opacity-40"
          >
            <X className="h-4 w-4" /> Clear
          </button>
        </div>
      </div>

      {showFallbackWarning && (
        <p className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-xs text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Couldn&rsquo;t reach the street-routing service, so straight lines are shown between your points. You can
          save as is, add more points to trace the street, or try again later.
        </p>
      )}

      {points.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-[4.5rem_1fr_1fr_2rem] gap-2 border-b border-border bg-background/60 px-3 py-2 text-xs font-medium text-muted">
            <span>Point</span>
            <span>Latitude</span>
            <span>Longitude</span>
            <span />
          </div>
          {points.map((point, index) => {
            const isStart = index === 0;
            const isEnd = index === points.length - 1 && points.length > 1;
            return (
              <div key={index} className="grid grid-cols-[4.5rem_1fr_1fr_2rem] items-center gap-2 px-3 py-1.5">
                <span className={`text-xs font-semibold ${isStart ? "text-success" : isEnd ? "text-danger" : "text-muted"}`}>
                  {isStart ? "Start" : isEnd ? "End" : `Stop ${index}`}
                </span>
                <PointInputs point={point} onCommit={(p) => updatePoint(index, p)} />
                <button
                  type="button"
                  onClick={() => setPoints((current) => current.filter((_, i) => i !== index))}
                  className="rounded-md p-1 text-muted hover:bg-border hover:text-danger"
                  aria-label="Remove point"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
