"use client";

import { LayersControl, TileLayer, useMapEvents } from "react-leaflet";
import { TILE_ATTRIBUTION, TILE_URL } from "./pins";

const STORAGE_KEY = "wmm-map-layer";
const SATELLITE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_ATTRIBUTION = "Imagery &copy; Esri, Maxar, Earthstar Geographics";

function readSavedLayer(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function RememberLayer() {
  useMapEvents({
    baselayerchange(event) {
      try {
        window.localStorage.setItem(STORAGE_KEY, event.name);
      } catch {
        // storage unavailable (private mode) — the choice just isn't remembered
      }
    },
  });
  return null;
}

/** Streets / Satellite switch (top-right); remembers the last choice. */
export function BaseLayers() {
  const satellite = readSavedLayer() === "Satellite";
  return (
    <>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked={!satellite} name="Streets">
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} className="map-tiles-streets" />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer checked={satellite} name="Satellite">
          <TileLayer url={SATELLITE_URL} attribution={SATELLITE_ATTRIBUTION} maxNativeZoom={19} maxZoom={20} />
        </LayersControl.BaseLayer>
      </LayersControl>
      <RememberLayer />
    </>
  );
}
