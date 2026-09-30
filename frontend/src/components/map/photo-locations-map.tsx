"use client";

import { useEffect, useRef } from "react";
import { Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import type { LatLng } from "@/lib/types";
import { pinIcon } from "./pins";
import { takeFirstFrame } from "./fit-state";

export interface PhotoPin {
  id: string;
  title: string;
  position: LatLng;
}

/** Flies to the selected photo; with none selected, shows every pin. */
function FollowActive({ active, pins }: { active: PhotoPin | null; pins: PhotoPin[] }) {
  const map = useMap();
  const activeKey = active ? `${active.id}:${active.position.join(",")}` : "";
  const pinsKey = active ? "" : String(pins.length);
  useEffect(() => {
    if (!active && pins.length === 0) return;
    const animate = !takeFirstFrame(map);
    if (active) {
      const zoom = Math.max(map.getZoom(), 15);
      if (animate) map.flyTo(active.position, zoom, { duration: 0.9 });
      else map.setView(active.position, zoom);
    } else if (pins.length > 1) {
      const bounds = L.latLngBounds(pins.map((p) => p.position));
      if (animate) map.flyToBounds(bounds, { padding: [36, 36], maxZoom: 16, duration: 0.8 });
      else map.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 });
    } else {
      if (animate) map.flyTo(pins[0].position, 15, { duration: 0.8 });
      else map.setView(pins[0].position, 15);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- follow the selection only
  }, [map, activeKey, pinsKey]);

  // Keep the selected photo centred when the map area changes size (e.g.
  // the phone bottom sheet opening or closing).
  const latest = useRef(active);
  useEffect(() => {
    latest.current = active;
  });
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const recenter = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (latest.current) map.setView(latest.current.position, map.getZoom());
      }, 120);
    };
    map.on("resize", recenter);
    return () => {
      clearTimeout(timer);
      map.off("resize", recenter);
    };
  }, [map]);
  return null;
}

/**
 * Every geotagged photo in the current gallery as a pin; the photo being
 * viewed is highlighted and labelled, and the map follows it as you browse.
 * Clicking another pin opens that photo.
 */
export function PhotoPinLayers({
  pins,
  activeId,
  onSelect,
}: {
  pins: PhotoPin[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const active = pins.find((pin) => pin.id === activeId) ?? null;

  return (
    <>
      <FollowActive active={active} pins={pins} />

      {pins
        .filter((pin) => pin.id !== activeId)
        .map((pin) => (
          <Marker
            key={pin.id}
            position={pin.position}
            icon={pinIcon("other")}
            eventHandlers={{ click: () => onSelect(pin.id) }}
          >
            <Tooltip direction="top">{pin.title}</Tooltip>
          </Marker>
        ))}

      {active && (
        <Marker key={`active-${active.id}`} position={active.position} icon={pinIcon("active")} zIndexOffset={1000}>
          <Tooltip direction="top" permanent className="map-label">
            {active.title}
          </Tooltip>
        </Marker>
      )}
    </>
  );
}
