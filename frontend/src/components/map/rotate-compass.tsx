"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/**
 * A small compass button that only appears once the map has been rotated
 * (by a two-finger twist on touch, or Shift + scroll on desktop); tapping
 * it glides the map back to north-up. Mirrors the compass affordance in
 * Google Maps rather than the plugin's own tri-state rotate control.
 */
export function RotateCompass() {
  const map = useMap();

  useEffect(() => {
    const container = L.DomUtil.create("div", "leaflet-bar leaflet-control explorer-compass");
    container.style.display = "none";
    const link = L.DomUtil.create("a", "", container) as HTMLAnchorElement;
    link.href = "#";
    link.setAttribute("role", "button");
    link.title = "Reset north";
    link.setAttribute("aria-label", "Reset north");
    link.innerHTML =
      '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" class="explorer-compass-needle">' +
      '<path d="M12 2 L15 12 L12 10.5 L9 12 Z" fill="#dc2626"/>' +
      '<path d="M12 22 L9 12 L12 13.5 L15 12 Z" fill="#94a3b8"/>' +
      "</svg>";
    const needle = link.querySelector<SVGElement>(".explorer-compass-needle")!;

    function update() {
      const bearing = map.getBearing();
      container.style.display = bearing ? "block" : "none";
      needle.style.transform = `rotate(${-bearing}deg)`;
    }

    L.DomEvent.on(link, "click", (event) => {
      L.DomEvent.preventDefault(event);
      L.DomEvent.stopPropagation(event);
      map.setBearing(0);
    });
    L.DomEvent.disableClickPropagation(container);

    map.on("rotate", update);
    update();

    const Control = L.Control.extend({ onAdd: () => container });
    const control = new Control({ position: "bottomright" });
    control.addTo(map);

    return () => {
      map.off("rotate", update);
      control.remove();
    };
  }, [map]);

  return null;
}
