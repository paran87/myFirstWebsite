import type L from "leaflet";

/**
 * Maps that have already been framed once. Layers mounting on such a map
 * (e.g. switching from a photo to a video) fly to their target instead of
 * jumping, so the one shared map feels continuous.
 */
const framedMaps = new WeakSet<L.Map>();

export function takeFirstFrame(map: L.Map): boolean {
  const first = !framedMaps.has(map);
  framedMaps.add(map);
  return first;
}
