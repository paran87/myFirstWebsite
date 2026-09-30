"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` on import, so the maps only render in the browser.
const loading = () => <div className="skeleton h-[320px] w-full rounded-xl" />;

export const PhotoLocationPicker = dynamic(
  () => import("./photo-location-picker").then((m) => m.PhotoLocationPicker),
  { ssr: false, loading }
);

export const RoutePicker = dynamic(() => import("./route-picker").then((m) => m.RoutePicker), {
  ssr: false,
  loading,
});
