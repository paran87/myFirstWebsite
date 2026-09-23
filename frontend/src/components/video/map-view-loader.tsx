"use client";

import dynamic from "next/dynamic";

// react-leaflet needs `window`, so it must never render during SSR.
export const MapViewLoader = dynamic(() => import("./map-view").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="skeleton h-[280px] w-full" />,
});
