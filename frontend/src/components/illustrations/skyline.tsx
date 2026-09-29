import { Jeepney } from "@/components/illustrations/jeepney";

/**
 * Hand-tuned, procedurally laid-out Metro Manila skyline: hazy far towers,
 * a Makati-style CBD cluster with lit windows, and a street-level layer with
 * a church dome, palm trees, lamp posts and a jeepney driving past.
 *
 * Uses a seeded PRNG so server and client render identical markup. Colours
 * come from CSS variables (`--city-*`) so it re-themes for dark mode.
 */

const WIDTH = 1600;
const HEIGHT = 360;
const GROUND = 318;

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Tower {
  x: number;
  w: number;
  h: number;
  spire?: boolean;
  crown?: "flat" | "step" | "slant";
}

function buildTowers(seed: number, minH: number, maxH: number, minW: number, maxW: number, centerBias = 0) {
  const rand = rng(seed);
  const towers: Tower[] = [];
  let x = -20;
  while (x < WIDTH + 20) {
    const w = minW + rand() * (maxW - minW);
    // Taller towers cluster around the middle of the skyline (the "CBD").
    const distance = Math.abs(x + w / 2 - WIDTH * 0.55) / (WIDTH / 2);
    const bias = 1 - centerBias * Math.min(distance, 1);
    const h = (minH + rand() * (maxH - minH)) * bias;
    const r = rand();
    towers.push({
      x,
      w,
      h: Math.max(h, minH * 0.6),
      spire: r > 0.86,
      crown: r > 0.7 ? "step" : r > 0.55 ? "slant" : "flat",
    });
    x += w + 2 + rand() * 10;
  }
  return towers;
}

function towerPath({ x, w, h, crown }: Tower, base: number) {
  const top = base - h;
  if (crown === "step") {
    const inset = w * 0.18;
    return `M${x} ${base}V${top + 14}H${x + inset}V${top}H${x + w - inset}V${top + 14}H${x + w}V${base}Z`;
  }
  if (crown === "slant") {
    return `M${x} ${base}V${top + 12}L${x + w} ${top}V${base}Z`;
  }
  return `M${x} ${base}V${top}H${x + w}V${base}Z`;
}

const farTowers = buildTowers(7, 50, 150, 26, 64, 0.4);
const midTowers = buildTowers(21, 70, 245, 30, 58, 0.75);

/** Windows for the mid layer; a small subset flicker so it feels alive. */
function buildWindows() {
  const rand = rng(99);
  const windows: { x: number; y: number; lit: boolean; delay: number }[] = [];
  for (const t of midTowers) {
    if (t.h < 90 || t.w < 34) continue;
    const cols = Math.floor((t.w - 10) / 9);
    const rows = Math.floor((t.h - 36) / 13);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const roll = rand();
        if (roll < 0.55) continue;
        windows.push({
          x: t.x + 6 + c * 9,
          y: GROUND - 20 - t.h + 32 + r * 13,
          lit: roll > 0.965,
          delay: Math.round(rand() * 7000),
        });
      }
    }
  }
  return windows;
}
const windows = buildWindows();

function buildHouses() {
  const rand = rng(314);
  const houses: string[] = [];
  let x = -10;
  while (x < WIDTH) {
    const w = 34 + rand() * 46;
    const h = 22 + rand() * 30;
    const top = GROUND - h;
    const roof = 10 + rand() * 10;
    if (rand() > 0.45) {
      houses.push(`M${x} ${GROUND}V${top}L${x + w / 2} ${top - roof}L${x + w} ${top}V${GROUND}Z`);
    } else {
      houses.push(`M${x} ${GROUND}V${top}H${x + w}V${GROUND}Z`);
    }
    x += w + rand() * 4;
  }
  return houses;
}
const houses = buildHouses();

function PalmTree({ x, scale = 1 }: { x: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${GROUND}) scale(${scale})`} className="sk-near">
      <path d="M-2 0 C-1 -30 4 -55 2 -78 L5 -78 C8 -55 3 -30 3 0Z" />
      <path d="M3 -78 C-14 -86 -30 -80 -38 -66 C-24 -76 -10 -76 3 -74Z" />
      <path d="M3 -78 C18 -88 34 -82 42 -68 C28 -78 14 -77 3 -74Z" />
      <path d="M3 -79 C-6 -96 -22 -100 -32 -94 C-18 -93 -6 -88 3 -76Z" />
      <path d="M3 -79 C12 -97 28 -100 38 -92 C24 -92 12 -88 3 -76Z" />
      <path d="M3 -80 C2 -94 6 -104 14 -108 C8 -98 6 -90 5 -78Z" />
    </g>
  );
}

function LampPost({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} ${GROUND})`}>
      <rect x={-1.2} y={-46} width={2.4} height={46} className="sk-near" />
      <path d="M0 -46 q0 -6 8 -6 h4" fill="none" strokeWidth={2.4} className="stroke-[var(--city-near)]" />
      <circle cx={13} cy={-50} r={2.6} className="sk-window--lit" />
    </g>
  );
}

/** Manila Cathedral–inspired church with a dome and bell tower. */
function Church({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} ${GROUND})`} className="sk-near">
      <rect x={0} y={-58} width={70} height={58} />
      <path d="M8 -58 Q35 -104 62 -58Z" />
      <rect x={32} y={-114} width={6} height={18} />
      <rect x={29} y={-108} width={12} height={2.5} />
      <rect x={76} y={-96} width={22} height={96} />
      <path d="M74 -96 L87 -118 L100 -96Z" />
      <rect x={85.5} y={-128} width={3} height={12} />
      <rect x={82} y={-124} width={10} height={2.5} />
      <path d="M28 0 V-24 Q35 -34 42 -24 V0Z" className="sk-window" />
      <circle cx={35} cy={-42} r={6} className="sk-window" />
    </g>
  );
}

export function Skyline({
  className = "",
  showJeepney = true,
}: {
  className?: string;
  showJeepney?: boolean;
}) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden
      focusable="false"
    >
      {/* Sierra Madre haze */}
      <path
        className="sk-far"
        opacity={0.55}
        d={`M0 ${GROUND - 70} C 160 ${GROUND - 120}, 320 ${GROUND - 95}, 470 ${GROUND - 110} S 780 ${GROUND - 150}, 980 ${GROUND - 118} S 1300 ${GROUND - 135}, 1600 ${GROUND - 95} V ${HEIGHT} H0Z`}
      />

      {/* Far towers */}
      <g className="sk-far">
        {farTowers.map((t, i) => (
          <path key={i} d={towerPath(t, GROUND - 16)} />
        ))}
      </g>

      {/* Mid towers (CBD) */}
      <g className="sk-mid">
        {midTowers.map((t, i) => (
          <g key={i}>
            <path d={towerPath(t, GROUND - 20)} />
            {t.spire && <rect x={t.x + t.w / 2 - 1.2} y={GROUND - 20 - t.h - 26} width={2.4} height={28} />}
          </g>
        ))}
      </g>
      <g>
        {windows.map((w, i) => (
          <rect
            key={i}
            x={w.x}
            y={w.y}
            width={4}
            height={6}
            rx={0.8}
            className={w.lit ? "sk-window--lit" : "sk-window"}
            style={w.lit ? { animationDelay: `${w.delay}ms` } : undefined}
          />
        ))}
      </g>

      {/* Street level */}
      <g className="sk-near">
        {houses.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <Church x={250} />
      <PalmTree x={120} scale={0.9} />
      <PalmTree x={420} scale={1.1} />
      <PalmTree x={1130} />
      <PalmTree x={1490} scale={0.85} />
      <LampPost x={560} />
      <LampPost x={820} />
      <LampPost x={1080} />
      <LampPost x={1340} />

      {/* Road */}
      <rect x={0} y={GROUND} width={WIDTH} height={HEIGHT - GROUND} className="sk-ground" />
      <line x1={0} x2={WIDTH} y1={GROUND + 22} y2={GROUND + 22} className="sk-lane" />

      {showJeepney && (
        <g transform={`translate(0 ${GROUND - 50})`}>
          <g className="jeepney-drive">
            <Jeepney width={150} className="jeepney-bob" />
          </g>
        </g>
      )}
    </svg>
  );
}
