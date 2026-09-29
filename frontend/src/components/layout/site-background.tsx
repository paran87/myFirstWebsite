import { Skyline } from "@/components/illustrations/skyline";

/**
 * Full-page illustrated background: a golden-hour sky over the Metro Manila
 * skyline by day, and a starry, moonlit city (with lit windows) in dark mode.
 * Everything is pure SVG/CSS — no external images to fail or slow the page.
 */

// Deterministic star field so server and client markup match.
const STARS = Array.from({ length: 70 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453;
  const b = Math.sin(i * 78.233) * 12345.6789;
  const c = Math.sin(i * 39.425) * 24634.6345;
  return {
    x: (a - Math.floor(a)) * 100,
    y: (b - Math.floor(b)) * 100,
    r: 0.6 + (c - Math.floor(c)) * 1.3,
    delay: ((c - Math.floor(c)) * 5).toFixed(2),
  };
});

const CLOUDS = [
  { top: "9vh", width: 180, duration: 140, delay: -20 },
  { top: "21vh", width: 120, duration: 110, delay: -75 },
  { top: "33vh", width: 220, duration: 170, delay: -120 },
  { top: "14vh", width: 90, duration: 95, delay: -50 },
];

export function SiteBackground() {
  return (
    <div className="site-bg" aria-hidden>
      <div className="site-bg__dots" />

      <svg className="site-bg__stars" preserveAspectRatio="none">
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={`${s.x}%`}
            cy={`${s.y}%`}
            r={s.r}
            className="star"
            style={{ animationDelay: `${s.delay}s` }}
          />
        ))}
      </svg>
      <div className="site-bg__moon" />

      <div className="site-bg__clouds">
        {CLOUDS.map((c, i) => (
          <span
            key={i}
            className="cloud"
            style={{
              top: c.top,
              left: 0,
              width: c.width,
              animationDuration: `${c.duration}s`,
              animationDelay: `${c.delay}s`,
            }}
          />
        ))}
      </div>

      <svg className="site-bg__birds" viewBox="0 0 90 40" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <path className="bird" d="M4 14 q6 -7 12 0 q6 -7 12 0" />
        <path className="bird" style={{ animationDelay: "0.2s" }} d="M34 6 q5 -6 10 0 q5 -6 10 0" />
        <path className="bird" style={{ animationDelay: "0.4s" }} d="M52 24 q4 -5 8 0 q4 -5 8 0" />
      </svg>

      <div className="site-bg__glow" />
      <div className="site-bg__sun" />

      <div className="site-bg__skyline">
        <Skyline />
      </div>

      <div className="site-bg__grain" />
    </div>
  );
}
