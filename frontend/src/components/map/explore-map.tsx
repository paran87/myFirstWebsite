"use client";

import { useEffect } from "react";
import { MapContainer, useMap } from "react-leaflet";
import type { LatLng, VideoRoute } from "@/lib/types";
import { METRO_MANILA_CENTER } from "./pins";
import { BaseLayers } from "./base-layers";
import { VideoRouteLayers } from "./video-route-map";
import { PhotoPinLayers, type PhotoPin } from "./photo-locations-map";

export type ExploreMapProps =
  | { mode: "video"; route: VideoRoute | null; point: LatLng | null; title: string }
  | { mode: "photo"; pins: PhotoPin[]; activeId: string | null; onSelect: (id: string) => void }
  | { mode: "idle" };

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
 * The one map shared by the video and photo pages. It stays mounted while
 * you move between videos and photos; only its layers change, and the view
 * glides to whatever is selected.
 */
export function ExploreMap(props: ExploreMapProps) {
  return (
    <MapContainer center={METRO_MANILA_CENTER} zoom={11} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
      <BaseLayers />
      <AutoResize />
      {props.mode === "video" && <VideoRouteLayers route={props.route} point={props.point} title={props.title} />}
      {props.mode === "photo" && (
        <PhotoPinLayers pins={props.pins} activeId={props.activeId} onSelect={props.onSelect} />
      )}
    </MapContainer>
  );
}
