import L from "leaflet";

export type PinVariant = "start" | "end" | "stop" | "active" | "other";

const SIZES: Record<PinVariant, number> = { start: 32, end: 32, active: 32, stop: 22, other: 20 };

/** CSS teardrop pin (see `.map-pin` in globals.css) with its tip on the point. */
export function pinIcon(variant: PinVariant, label = "") {
  const size = SIZES[variant];
  const pulse = variant === "active" ? '<span class="map-pin-pulse"></span>' : "";
  return L.divIcon({
    className: "",
    html: `<div style="position:relative">${pulse}<div class="map-pin map-pin--${variant}"><span>${label}</span></div></div>`,
    iconSize: [size, size],
    // The rotated square's tip sits ~0.7 × size below its centre.
    iconAnchor: [size / 2, size * 1.2],
    tooltipAnchor: [0, -size * 1.2],
  });
}

export const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Central Metro Manila — the default view when there is nothing to show. */
export const METRO_MANILA_CENTER: [number, number] = [14.5995, 121.0];

export const ROUTE_COLORS = {
  walking: "#0d9488",
  driving: "#ea580c",
  straight: "#2563eb",
} as const;
