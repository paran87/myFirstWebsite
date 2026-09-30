"use client";

import { useEffect, useRef } from "react";
import { MapContainer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import type { LatLng } from "@/lib/types";
import { METRO_MANILA_CENTER, pinIcon } from "./pins";
import { BaseLayers } from "./base-layers";

export interface PhotoPin {
  id: string;
  title: string;
  position: LatLng;
}

/** Flies to the selected photo; with none selected, shows every pin. */
function FollowActive({ active, pins }: { active: PhotoPin | null; pins: PhotoPin[] }) {
  const map = useMap();
  const first = useRef(true);
  const activeKey = active ? `${active.id}:${active.position.join(",")}` : "";
  useEffect(() => {
    const animate = !first.current;
    first.current = false;
    if (active) {
      const zoom = Math.max(map.getZoom(), 15);
      if (animate) map.flyTo(active.position, zoom, { duration: 0.9 });
      else map.setView(active.position, zoom);
    } else if (pins.length > 1) {
      map.fitBounds(L.latLngBounds(pins.map((p) => p.position)), { padding: [36, 36], maxZoom: 16 });
    } else if (pins.length === 1) {
      map.setView(pins[0].position, 15);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- follow the selection only
  }, [map, activeKey]);

  // Keep the selected photo centred when the map area changes size (e.g.
  // the phone bottom sheet opening or closing).
  const latest = useRef(active);
  useEffect(() => {
    latest.current = active;
  });
  useEffect(() => {
    const recenter = () => {
      if (latest.current) map.setView(latest.current.position, map.getZoom());
    };
    map.on("resize", recenter);
    return () => {
      map.off("resize", recenter);
    };
  }, [map]);
  return null;
}

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
 * Every geotagged photo in the current gallery as a pin; the photo being
 * viewed is highlighted and labelled, and the map follows it as you browse.
 * Clicking another pin opens that photo.
 */
export function PhotoLocationsMap({
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
    <MapContainer
      center={active?.position ?? pins[0]?.position ?? METRO_MANILA_CENTER}
      zoom={active ? 15 : pins.length ? 14 : 11}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <BaseLayers />
      <AutoResize />
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
    </MapContainer>
  );
}
