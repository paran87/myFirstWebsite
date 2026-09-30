import L from "leaflet";

/** CSS teardrop pin (see `.map-pin` in globals.css), tip anchored on the point. */
export function pinIcon(variant: "start" | "end" | "stop" | "photo" | "muted", label = "") {
  const size = variant === "muted" ? 20 : variant === "stop" ? 24 : 30;
  // Rotated square: the tip sits at the bottom-left corner, ~0.7 * size below centre.
  return L.divIcon({
    className: "",
    html: `<div class="map-pin map-pin--${variant}"><span>${label}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size * 1.2],
    popupAnchor: [0, -size * 1.1],
  });
}

export const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
