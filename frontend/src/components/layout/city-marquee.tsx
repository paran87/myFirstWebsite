import Link from "next/link";
import { MapPin } from "lucide-react";
import { METRO_MANILA_CITIES } from "@/lib/types";

/** Endless ticker of the 17 Metro Manila LGUs; each links to a filtered catalog. */
export function CityMarquee() {
  const cities = [...METRO_MANILA_CITIES, ...METRO_MANILA_CITIES];
  return (
    <div className="marquee-mask overflow-hidden py-1" aria-label="Browse by city">
      <ul className="animate-marquee flex w-max gap-3">
        {cities.map((city, i) => (
          <li key={`${city}-${i}`} aria-hidden={i >= METRO_MANILA_CITIES.length || undefined}>
            <Link
              href={`/?city=${encodeURIComponent(city)}#catalog`}
              tabIndex={i >= METRO_MANILA_CITIES.length ? -1 : undefined}
              className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border/80 bg-surface/70 px-4 py-2 text-sm font-semibold text-foreground/85 shadow-sm backdrop-blur-md transition hover:border-primary/50 hover:bg-surface hover:text-primary"
            >
              <MapPin className="h-3.5 w-3.5 text-primary transition-transform duration-300 group-hover:-translate-y-0.5" />
              {city}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
