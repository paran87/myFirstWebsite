// Side-effect only: patches Leaflet's Map/Marker/Icon classes with rotation
// support (bearing, setBearing/getBearing, touch two-finger rotate...).
// Import order matters — "./leaflet-rotate-global" must finish publishing
// `window.L` before "leaflet-rotate" runs and reads it.
import "./leaflet-rotate-global";
import "leaflet-rotate";
