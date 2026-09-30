"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ExternalLink, Images } from "lucide-react";
import { PhotoLocationsMap } from "@/components/map";
import type { PhotoPin } from "@/components/map/photo-locations-map";
import { CoordRow, LocationPanel, formatLatLng } from "@/components/map/location-panel";
import { usePhotoCatalog } from "@/components/photo/photo-catalog-context";
import type { LatLng, Photo } from "@/lib/types";

function positionOf(photo: Pick<Photo, "latitude" | "longitude">): LatLng | null {
  const lat = Number(photo.latitude);
  const lng = Number(photo.longitude);
  if (photo.latitude == null || photo.longitude == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

export function PhotoMapPanel() {
  const { photos, query, activePhoto } = usePhotoCatalog();
  const router = useRouter();
  const params = useParams();
  const activeId = String(params.id ?? "");

  // Prefer the photo page's own data: the gallery list can be older (e.g. a
  // location just added in the admin), and may not contain this photo at all.
  const inList = photos.find((photo) => photo.id === activeId) ?? null;
  const active = activePhoto?.id === activeId ? activePhoto : inList;

  const pins = useMemo<PhotoPin[]>(() => {
    const list = photos.map((photo) => (active && photo.id === active.id ? active : photo));
    if (active && !photos.some((photo) => photo.id === active.id)) list.push(active);
    return list.flatMap((photo) => {
      const position = positionOf(photo);
      return position ? [{ id: photo.id, title: photo.title, position }] : [];
    });
  }, [photos, active]);
  const activePosition = active ? positionOf(active) : null;
  const place = active ? [active.street, active.barangay, active.city].filter(Boolean).join(", ") : "";

  return (
    <LocationPanel
      icon={<Images className="h-4.5 w-4.5" />}
      title="Photo location"
      subtitle={place || `${pins.length} geotagged photo${pins.length === 1 ? "" : "s"} on this map`}
      map={
        <PhotoLocationsMap
          pins={pins}
          activeId={activePosition ? activeId : null}
          onSelect={(id) => router.push(query ? `/photo/${id}?${query}` : `/photo/${id}`, { scroll: false })}
        />
      }
      empty={
        active && !activePosition
          ? {
              title: "Can't find the location",
              message: "This photo has no coordinates set up yet, so it can't be pinned on the map.",
            }
          : null
      }
    >
      {activePosition && (
        <>
          <CoordRow label="Coordinates" value={formatLatLng(activePosition)} />
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${activePosition.join(",")}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold transition hover:border-primary/50 hover:text-primary"
          >
            <ExternalLink className="h-4 w-4" />
            Open in Google Maps
          </a>
        </>
      )}
      <p className="text-xs font-medium text-foreground/60">
        {pins.length} geotagged photo{pins.length === 1 ? "" : "s"} · click a pin to open it
      </p>
    </LocationPanel>
  );
}
