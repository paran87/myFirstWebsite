"use client";

import dynamic from "next/dynamic";

// Leaflet needs `window`, so maps only ever render in the browser.
const loading = () => <div className="skeleton h-full min-h-[18rem] w-full rounded-xl" />;

export const VideoRouteMap = dynamic(() => import("./video-route-map").then((m) => m.VideoRouteMap), {
  ssr: false,
  loading,
});

export const PhotoLocationsMap = dynamic(
  () => import("./photo-locations-map").then((m) => m.PhotoLocationsMap),
  { ssr: false, loading }
);
