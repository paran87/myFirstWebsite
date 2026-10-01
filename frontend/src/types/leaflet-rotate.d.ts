// Type augmentation for the "leaflet-rotate" plugin (see rotate-setup.ts),
// which has no types of its own.
import "leaflet";

declare module "leaflet" {
  interface MapOptions {
    /** Enables the rotation engine (bearing/setBearing/getBearing). */
    rotate?: boolean;
    /** Initial bearing in degrees, clockwise from north. */
    bearing?: number;
    /** Two-finger touch rotate gesture (in addition to pinch-zoom). */
    touchRotate?: boolean;
    /** Shift + mouse-wheel rotate (desktop). Defaults to true. */
    shiftKeyRotate?: boolean;
    /** The plugin's own tri-state rotate control; we build our own instead. */
    rotateControl?: boolean | Record<string, unknown>;
  }

  interface Map {
    /** Rotate the map to `theta` degrees, clockwise from north. */
    setBearing(theta: number): void;
    /** Current bearing in degrees, clockwise from north. */
    getBearing(): number;
  }
}
