import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera, Footprints, ImageIcon, MapPin, FolderTree, Video as VideoIcon, Building2 } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { METRO_MANILA_CITIES } from "@/lib/types";
import { CountUp } from "@/components/motion/count-up";
import { CityMarquee } from "@/components/layout/city-marquee";

/** Stylised street map of the bay area with a walking route that draws itself. */
function RouteMap() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" aria-hidden focusable="false">
      <rect width={400} height={300} fill="var(--map-land)" />
      {/* city blocks */}
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 10 }).map((_, col) => (
          <rect
            key={`${row}-${col}`}
            x={8 + col * 40 + (row % 2) * 8}
            y={8 + row * 38}
            width={30}
            height={28}
            rx={5}
            fill="var(--map-block)"
          />
        ))
      )}
      {/* Manila Bay */}
      <path d="M0 0 H70 C60 60 40 110 55 170 C70 230 40 270 0 300Z" fill="var(--map-water)" />
      {/* Pasig River */}
      <path
        d="M58 120 C110 110 140 150 190 140 S 270 90 320 110 S 380 150 400 140"
        fill="none"
        stroke="var(--map-water)"
        strokeWidth={14}
        strokeLinecap="round"
      />
      {/* parks */}
      <rect x={88} y={200} width={62} height={44} rx={10} fill="var(--map-park)" />
      <circle cx={318} cy={228} r={26} fill="var(--map-park)" />
      {/* main roads */}
      <path d="M60 60 H400 M80 262 H400 M240 0 V300" stroke="var(--color-surface)" strokeWidth={7} opacity={0.9} />

      {/* route: ghost track + animated drawing + moving dashes */}
      <path
        id="walk-route"
        d="M96 70 C 140 70 150 100 180 104 S 230 170 250 188 S 300 214 318 228"
        fill="none"
        stroke="var(--color-primary)"
        strokeOpacity={0.18}
        strokeWidth={10}
        strokeLinecap="round"
      />
      <path
        d="M96 70 C 140 70 150 100 180 104 S 230 170 250 188 S 300 214 318 228"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={4}
        strokeLinecap="round"
        pathLength={1}
        className="draw-path"
      />
      <path
        d="M96 70 C 140 70 150 100 180 104 S 230 170 250 188 S 300 214 318 228"
        fill="none"
        stroke="var(--color-surface)"
        strokeWidth={1.5}
        strokeLinecap="round"
        className="route-dash"
        opacity={0.9}
      />

      {/* walker dot travelling along the route */}
      <circle r={6} fill="var(--color-primary-2)" stroke="var(--color-surface)" strokeWidth={2.5}>
        <animateMotion dur="7s" repeatCount="indefinite" rotate="auto" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
          <mpath href="#walk-route" />
        </animateMotion>
      </circle>

      {/* start + end pins */}
      <g transform="translate(96 70)">
        <circle r={9} fill="var(--color-primary)" opacity={0.35} className="ping-ring" />
        <circle r={6} fill="var(--color-surface)" stroke="var(--color-primary)" strokeWidth={3} />
      </g>
      <g transform="translate(318 228)">
        <circle r={10} fill="var(--color-primary-2)" opacity={0.35} className="ping-ring" style={{ animationDelay: "1s" }} />
        <path d="M0 4 C-10 -6 -10 -22 0 -22 S 10 -6 0 4Z" fill="var(--color-primary-2)" transform="translate(0 -4)" />
        <circle cy={-17} r={3.5} fill="var(--color-surface)" />
      </g>

      {/* labels */}
      <g fontFamily="var(--font-sans), sans-serif" fontWeight={700} fontSize={11}>
        <rect x={104} y={40} width={78} height={20} rx={10} fill="var(--color-surface)" opacity={0.95} />
        <text x={143} y={54} textAnchor="middle" fill="var(--color-foreground)">Intramuros</text>
        <rect x={262} y={250} width={64} height={20} rx={10} fill="var(--color-surface)" opacity={0.95} />
        <text x={294} y={264} textAnchor="middle" fill="var(--color-foreground)">Makati</text>
        <text x={22} y={220} fill="var(--color-bay)" opacity={0.9} fontSize={10} transform="rotate(-80 22 220)">
          MANILA BAY
        </text>
      </g>
    </svg>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-[6/5] w-full max-w-xl lg:max-w-none">
      {/* Map card */}
      <div
        data-reveal
        style={{ ["--reveal-delay" as string]: "200ms" }}
        className="absolute right-0 top-0 w-[74%]"
      >
        <div className="animate-float rotate-3 overflow-hidden rounded-[1.75rem] border border-border/80 bg-surface p-2 shadow-2xl shadow-primary/15" style={{ animationDuration: "8s" }}>
          <div className="aspect-[4/3] overflow-hidden rounded-[1.35rem]">
            <RouteMap />
          </div>
          <div className="flex items-center justify-between px-2 pb-1 pt-2.5 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-foreground">
              <Footprints className="h-3.5 w-3.5 text-primary" />
              Intramuros → Makati
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">6.2 km</span>
          </div>
        </div>
      </div>

      {/* Photo card */}
      <div
        data-reveal
        style={{ ["--reveal-delay" as string]: "380ms" }}
        className="absolute bottom-0 left-0 w-[70%]"
      >
        <div className="animate-float -rotate-3 overflow-hidden rounded-[1.75rem] border border-white/40 bg-surface p-2 shadow-2xl shadow-black/25" style={{ animationDelay: "-3s", animationDuration: "9s" }}>
          <div className="relative aspect-video overflow-hidden rounded-[1.35rem]">
            <Image
              src="/images/hero-metro-manila.png"
              alt="Makati skyline at golden hour"
              fill
              priority
              sizes="(max-width: 1024px) 70vw, 420px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[11px] font-semibold text-white backdrop-blur-md">
              <span className="animate-blink h-2 w-2 rounded-full bg-red-500" />
              REC 00:12:48
            </span>
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 text-sm font-bold text-white drop-shadow">
              <MapPin className="h-4 w-4 text-amber-300" />
              Ayala Ave, Makati
            </span>
          </div>
        </div>
      </div>

      {/* Floating chips */}
      <div
        data-reveal
        style={{ ["--reveal-delay" as string]: "650ms" }}
        className="absolute left-[4%] top-[14%] hidden sm:block"
      >
        <div className="animate-float glass flex items-center gap-2.5 rounded-2xl border border-border/80 px-3.5 py-2.5 shadow-xl shadow-black/10" style={{ animationDelay: "-1.5s" }}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white dark:text-primary-foreground">
            <Camera className="h-4.5 w-4.5" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-extrabold">4K body-cam</span>
            <span className="text-xs font-semibold text-foreground/70">Real street level</span>
          </span>
        </div>
      </div>
      <div
        data-reveal
        style={{ ["--reveal-delay" as string]: "800ms" }}
        className="absolute bottom-[8%] right-[2%] hidden sm:block"
      >
        <div className="animate-float glass flex items-center gap-2 rounded-2xl border border-border/80 px-3.5 py-2.5 shadow-xl shadow-black/10" style={{ animationDelay: "-4s", animationDuration: "7s" }}>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
          </span>
          <span className="text-sm font-bold">New walks every week</span>
        </div>
      </div>
    </div>
  );
}

export function Hero({
  totalVideos,
  totalCategories,
}: {
  totalVideos?: number;
  totalCategories?: number;
}) {
  const stats = [
    typeof totalVideos === "number" && { icon: VideoIcon, value: totalVideos, label: "videos documented" },
    typeof totalCategories === "number" && totalCategories > 0 && { icon: FolderTree, value: totalCategories, label: "categories" },
    { icon: Building2, value: METRO_MANILA_CITIES.length, label: "cities & towns" },
  ].filter(Boolean) as { icon: typeof VideoIcon; value: number; label: string }[];

  return (
    <section className="relative isolate">
      <div className="aurora -z-10" aria-hidden>
        <span />
        <span />
        <span />
      </div>

      <div className="grid items-center gap-12 py-6 sm:py-10 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:py-14">
        <div>
          <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-primary/25 bg-surface/80 py-1.5 pl-1.5 pr-4 text-sm font-bold text-foreground shadow-sm backdrop-blur-md">
            <span className="rounded-full bg-brand-gradient px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider text-white dark:text-primary-foreground">
              Live archive
            </span>
            <span className="sm:hidden">Metro Manila, PH</span>
            <span className="hidden sm:inline">Street-level documentation of Metro Manila</span>
          </span>

          <h1
            className="animate-fade-up mt-6 text-[2.75rem] font-extrabold leading-[1.02] tracking-tight text-foreground sm:text-6xl xl:text-7xl"
            style={{ animationDelay: "90ms", fontStretch: "92%" }}
          >
            Explore the streets of{" "}
            <span className="relative inline-block whitespace-nowrap">
              <span className="text-gradient">Metro Manila</span>
              <svg
                viewBox="0 0 300 20"
                preserveAspectRatio="none"
                className="absolute -bottom-2 left-0 h-3 w-full sm:-bottom-3 sm:h-4"
                aria-hidden
              >
                <path
                  d="M4 14 C 60 4, 120 4, 170 10 S 260 16, 296 6"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth={5}
                  strokeLinecap="round"
                  pathLength={1}
                  className="draw-path"
                />
              </svg>
            </span>
            , one walk at a time.
          </h1>

          <p
            className="animate-fade-up mt-7 max-w-xl text-lg font-medium leading-relaxed text-foreground/80 sm:text-xl"
            style={{ animationDelay: "180ms" }}
          >
            {siteConfig.name} is a growing archive of body-camera footage capturing real streets,
            barangays, and neighborhoods — organized for mapping, presentation, and reference.
          </p>

          <div className="animate-fade-up mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "260ms" }}>
            <a
              href="#catalog"
              className="group inline-flex items-center gap-2 rounded-full bg-brand-gradient px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 dark:text-primary-foreground"
            >
              Start exploring
              <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <Link
              href="/photos"
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-6 py-3.5 text-base font-bold text-foreground shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
            >
              <ImageIcon className="h-4.5 w-4.5 transition-transform duration-300 group-hover:rotate-6" />
              Photo gallery
            </Link>
          </div>

          <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
            {stats.map(({ icon: Icon, value, label }, i) => (
              <div
                key={label}
                data-reveal
                style={{ ["--reveal-delay" as string]: `${300 + i * 110}ms` }}
                className="rounded-2xl border border-border/80 bg-surface/75 p-3.5 shadow-sm backdrop-blur-md sm:p-4"
              >
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-2 font-display text-2xl font-extrabold leading-none sm:text-3xl">
                  <CountUp value={value} />
                </p>
                <p className="mt-1 text-xs font-semibold text-foreground/70 sm:text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <HeroVisual />
      </div>

      <div className="mt-4">
        <CityMarquee />
      </div>
    </section>
  );
}
