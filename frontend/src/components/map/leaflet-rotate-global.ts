import L from "leaflet";

/**
 * "leaflet-rotate" is distributed as a script that patches a *global* `L`
 * (as if Leaflet were loaded via <script>), not the local binding bundlers
 * give an `import`. This file's whole job is to publish that global before
 * "leaflet-rotate" is imported — see rotate-setup.ts for the required
 * import order.
 */
(window as unknown as { L: typeof L }).L = L;
