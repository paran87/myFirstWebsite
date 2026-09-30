"use client";

import dynamic from "next/dynamic";

// Leaflet needs `window`, so maps only ever render in the browser.
const loading = () => <div className="skeleton h-full min-h-[18rem] w-full rounded-xl" />;

export const ExploreMap = dynamic(() => import("./explore-map").then((m) => m.ExploreMap), {
  ssr: false,
  loading,
});
