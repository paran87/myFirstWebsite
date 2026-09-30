"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { X } from "lucide-react";
import { METRO_MANILA_CENTER, isLatLng, roundCoord } from "@/lib/geo";
import type { LatLng } from "@/lib/types";
import { TILE_ATTRIBUTION, TILE_URL, pinIcon } from "./pins";

export interface ExtraMarker {
  id: string;
  label: string;
  position: LatLng;
}

/** Keeps what the user typed ("14.", "14.50") unless the number itself changed. */
function syncText(current: string, next: number | undefined): string {
  if (next === undefined) return "";
  return current.trim() !== "" && Number(current) === next ? current : String(next);
}

function ClickToPlace({ onPick }: { onPick: (value: LatLng) => void }) {
  useMapEvents({
    click(event) {
      onPick([roundCoord(event.latlng.lat), roundCoord(event.latlng.lng)]);
    },
  });
  return null;
}

/** Re-centres when the pin or the set of file markers changes. */
function FitView({ value, extras }: { value: LatLng | null; extras: ExtraMarker[] }) {
  const map = useMap();
  const extrasKey = extras.map((e) => e.position.join(",")).join("|");
  useEffect(() => {
    const points = [...(value ? [value] : []), ...extras.map((e) => e.position)];
    if (points.length === 1) map.setView(points[0], Math.max(map.getZoom(), 16));
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 17 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when positions change
  }, [value?.[0], value?.[1], extrasKey]);
  return null;
}

/**
 * Coordinates input for a photo: click the map (or drag the pin) to set the
 * point, or type latitude/longitude. `extras` shows other points for
 * context, e.g. the GPS read from each file in a multi-photo upload.
 */
export function PhotoLocationPicker({
  value,
  onChange,
  extras = [],
  height = 320,
}: {
  value: LatLng | null;
  onChange: (value: LatLng | null) => void;
  extras?: ExtraMarker[];
  height?: number;
}) {
  const [latText, setLatText] = useState(value ? String(value[0]) : "");
  const [lngText, setLngText] = useState(value ? String(value[1]) : "");

  // Keep the text boxes in sync when the pin moves on the map.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirror external value into inputs
    setLatText((current) => syncText(current, value?.[0]));
    setLngText((current) => syncText(current, value?.[1]));
  }, [value]);

  // Applied as you type (once both numbers are valid), not only on blur, so
  // pressing Enter to save never drops a typed coordinate.
  function commitText(lat: string, lng: string) {
    if (lat.trim() === "" && lng.trim() === "") {
      if (value) onChange(null);
      return;
    }
    const a = Number(lat);
    const b = Number(lng);
    if (lat.trim() !== "" && lng.trim() !== "" && isLatLng(a, b) && (a !== value?.[0] || b !== value?.[1])) {
      onChange([roundCoord(a), roundCoord(b)]);
    }
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border" style={{ height }}>
        <MapContainer
          center={value ?? extras[0]?.position ?? METRO_MANILA_CENTER}
          zoom={value || extras.length ? 16 : 12}
          scrollWheelZoom
          style={{ height: "100%", width: "100%", cursor: "crosshair" }}
        >
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
          <ClickToPlace onPick={onChange} />
          <FitView value={value} extras={extras} />
          {extras.map((extra) => (
            <Marker key={extra.id} position={extra.position} icon={pinIcon("muted")}>
              <Tooltip direction="top" offset={[0, -18]}>
                {extra.label}
              </Tooltip>
            </Marker>
          ))}
          {value && (
            <Marker
              position={value}
              icon={pinIcon("photo")}
              draggable
              eventHandlers={{
                dragend(event) {
                  const p = (event.target as L.Marker).getLatLng();
                  onChange([roundCoord(p.lat), roundCoord(p.lng)]);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Latitude</span>
          <input
            type="number"
            step="any"
            value={latText}
            placeholder="14.5995"
            onChange={(e) => {
              setLatText(e.target.value);
              commitText(e.target.value, lngText);
            }}
            onBlur={() => commitText(latText, lngText)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Longitude</span>
          <input
            type="number"
            step="any"
            value={lngText}
            placeholder="120.9842"
            onChange={(e) => {
              setLngText(e.target.value);
              commitText(latText, e.target.value);
            }}
            onBlur={() => commitText(latText, lngText)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
          />
        </label>
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={!value}
          className="inline-flex items-center justify-center gap-1.5 self-end rounded-lg border border-border px-3 py-2 text-sm hover:bg-border disabled:opacity-40"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      </div>
    </div>
  );
}
