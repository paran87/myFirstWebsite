/**
 * Side-view illustration of a classic Manila jeepney — chrome body, painted
 * stripes, banderitas on the roof and the signature horse on the hood.
 * Renders as a nested <svg>, so it can sit inside another SVG or on its own.
 */
export function Jeepney({
  width = 220,
  className = "",
  sign = "MAKATI · QUIAPO",
  x,
  y,
}: {
  width?: number;
  className?: string;
  sign?: string;
  x?: number;
  y?: number;
}) {
  const flags = ["#ef4444", "#facc15", "#3b82f6", "#22c55e", "#ec4899", "#f97316", "#a855f7"];
  return (
    <svg
      viewBox="0 0 230 110"
      width={width}
      height={(width * 110) / 230}
      x={x}
      y={y}
      aria-hidden
      focusable="false"
      overflow="visible"
    >
      <g className={className}>
      {/* ground shadow */}
      <ellipse cx={116} cy={100} rx={104} ry={5} fill="#000" opacity={0.18} />

      {/* roof + sign board */}
      <rect x={16} y={16} width={176} height={9} rx={4} fill="#d4d4d8" />
      <rect x={16} y={16} width={176} height={3} rx={1.5} fill="#f4f4f5" />
      <rect x={122} y={3} width={66} height={13} rx={3} fill="#fefce8" stroke="#a16207" strokeWidth={1} />
      <text
        x={155}
        y={12.6}
        textAnchor="middle"
        fontSize={7}
        fontWeight={800}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fill="#991b1b"
        letterSpacing={0.3}
      >
        {sign}
      </text>

      {/* banderitas along the roof edge */}
      {flags.map((color, i) => (
        <path key={i} d={`M${24 + i * 14} 25 l6 0 l-3 6Z`} fill={color} />
      ))}

      {/* body */}
      <path d="M12 30 Q12 25 18 25 H190 Q194 25 194 30 V80 H12Z" fill="#f5f0e6" />
      <path d="M194 46 H210 Q220 46 220 56 V80 H194Z" fill="#f5f0e6" />
      {/* chrome highlights */}
      <rect x={12} y={51} width={208} height={2} fill="#ffffff" opacity={0.9} />

      {/* painted stripes */}
      <rect x={12} y={56} width={208} height={6} fill="#dc2626" />
      <rect x={12} y={62} width={208} height={4} fill="#facc15" />
      <rect x={12} y={66} width={208} height={4} fill="#2563eb" />
      <text
        x={92}
        y={77.5}
        textAnchor="middle"
        fontSize={7}
        fontWeight={800}
        fontStyle="italic"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fill="#1e3a8a"
        letterSpacing={0.6}
      >
        WALK METRO MANILA
      </text>

      {/* passenger windows */}
      {Array.from({ length: 7 }).map((_, i) => (
        <g key={i}>
          <rect x={20 + i * 21} y={32} width={17} height={16} rx={3} fill="#1f2937" />
          <path d={`M${22 + i * 21} 46 L${31 + i * 21} 34 H${34 + i * 21} L${25 + i * 21} 46Z`} fill="#fff" opacity={0.18} />
        </g>
      ))}
      {/* windshield */}
      <path d="M170 32 H186 Q190 32 190 36 V48 H170Z" fill="#1f2937" />
      <path d="M174 46 L182 34 H185 L177 46Z" fill="#fff" opacity={0.22} />
      {/* side mirror */}
      <rect x={191} y={34} width={2} height={10} fill="#71717a" />
      <rect x={192} y={32} width={6} height={5} rx={1.5} fill="#a1a1aa" />

      {/* hood horse ornament */}
      <path
        d="M205 46 l1 -7 l3 -3 l2 1 l-1 3 l4 -1 l1 2 l-4 2 l-1 3 Z"
        fill="#e4e4e7"
        stroke="#71717a"
        strokeWidth={0.6}
      />

      {/* headlight + grille */}
      <circle cx={216} cy={60} r={3.4} fill="#fde68a" stroke="#a16207" strokeWidth={0.8} />
      <rect x={210} y={66} width={10} height={10} rx={1.5} fill="#a1a1aa" />
      <path d="M211 68 H219 M211 71 H219 M211 74 H219" stroke="#52525b" strokeWidth={0.8} />

      {/* bumpers + rear step */}
      <rect x={190} y={80} width={34} height={5} rx={2} fill="#d4d4d8" />
      <rect x={4} y={78} width={14} height={4} rx={1.5} fill="#a1a1aa" />

      {/* wheels */}
      {[54, 180].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={86} r={14} fill="#18181b" />
          <g className="jeepney-wheel">
            <circle cx={cx} cy={86} r={7.5} fill="#d4d4d8" />
            <path
              d={`M${cx - 7} 86 H${cx + 7} M${cx} 79 V93 M${cx - 5} 81 L${cx + 5} 91 M${cx + 5} 81 L${cx - 5} 91`}
              stroke="#52525b"
              strokeWidth={1.2}
            />
            <circle cx={cx} cy={86} r={2.2} fill="#71717a" />
          </g>
        </g>
      ))}
      </g>
    </svg>
  );
}
