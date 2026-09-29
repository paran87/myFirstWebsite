/** Folded street map with a wandering route and a "?" pin — for empty/404 states. */
export function LostMap({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 180" className={className} aria-hidden focusable="false">
      <ellipse cx={120} cy={166} rx={84} ry={7} fill="currentColor" opacity={0.08} />
      {/* folded map panels */}
      <path d="M30 40 L90 24 L90 150 L30 164Z" fill="var(--map-block)" />
      <path d="M90 24 L150 40 L150 164 L90 150Z" fill="var(--map-land)" />
      <path d="M150 40 L210 24 L210 150 L150 164Z" fill="var(--map-block)" />
      <path d="M30 40 L90 24 L150 40 L210 24" fill="none" stroke="var(--color-border)" strokeWidth={2} />
      {/* river */}
      <path d="M30 118 C60 104 80 128 110 116 S 170 96 210 108" fill="none" stroke="var(--map-water)" strokeWidth={9} strokeLinecap="round" />
      {/* park */}
      <rect x={160} y={56} width={34} height={26} rx={7} fill="var(--map-park)" />
      {/* wandering route */}
      <path
        d="M48 140 C 60 110 44 84 70 70 S 120 96 112 64 S 150 50 160 96"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={3.5}
        strokeLinecap="round"
        className="route-dash"
      />
      <circle cx={48} cy={140} r={5} fill="var(--color-surface)" stroke="var(--color-primary)" strokeWidth={3} />
      {/* question pin */}
      <g className="animate-float" style={{ animationDuration: "3.5s" }}>
        <path d="M160 96 C140 74 140 44 160 44 S 180 74 160 96Z" fill="var(--color-primary-2)" />
        <text x={160} y={70} textAnchor="middle" fontSize={20} fontWeight={800} fill="#fff" fontFamily="var(--font-display), sans-serif">
          ?
        </text>
      </g>
    </svg>
  );
}
