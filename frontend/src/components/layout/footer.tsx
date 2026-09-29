import Link from "next/link";
import { ArrowRight, ArrowUp, Camera, Film, Footprints, Map as MapIcon } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { Jeepney } from "@/components/illustrations/jeepney";

/** Deterministic rooftop silhouette that forms the footer's top edge. */
function rooftops() {
  let d = "M0 120 V96";
  let x = 0;
  let i = 0;
  while (x < 1600) {
    const w = 28 + ((i * 37) % 44);
    const h = 30 + Math.abs(Math.sin(i * 1.7) * 62) + (i % 5 === 2 ? 26 : 0);
    const top = 120 - h;
    if (i % 7 === 3) {
      d += ` H${x} V${top + 10} L${x + w / 2} ${top - 8} L${x + w} ${top + 10}`;
    } else if (i % 9 === 4) {
      // tower with an antenna
      d += ` H${x} V${top} H${x + w / 2 - 1.5} V${top - 22} H${x + w / 2 + 1.5} V${top} H${x + w}`;
    } else {
      d += ` H${x} V${top} H${x + w}`;
    }
    d += ` V${120 - 18}`;
    x += w + 6;
    i++;
  }
  return `${d} H1600 V120 Z`;
}

const ROOFTOPS = rooftops();

const footerBg = "bg-[#1a1326] dark:bg-[#05051a]";
const footerFill = "fill-[#1a1326] dark:fill-[#05051a]";

export function Footer() {
  return (
    <footer className="relative mt-24 text-white">
      {/* Skyline edge with a jeepney driving past */}
      <div className="pointer-events-none relative h-28 overflow-hidden sm:h-32" aria-hidden>
        <svg viewBox="0 0 1600 120" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-full w-full">
          <path d={ROOFTOPS} className={footerFill} />
        </svg>
        <div className="jeepney-drive-screen absolute bottom-0 left-0">
          <Jeepney width={128} className="jeepney-bob" sign="QUIAPO · CUBAO" />
        </div>
      </div>

      <div className={footerBg}>
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 lg:px-6">
          {/* CTA */}
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 sm:p-10">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/40 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-primary-2/30 blur-3xl" aria-hidden />
            <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Lakad tayo</p>
                <h2 className="mt-2 max-w-xl text-3xl font-extrabold leading-tight sm:text-4xl">
                  Every street has a story. Come walk it with us.
                </h2>
              </div>
              <Link
                href="/#catalog"
                className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-bold text-[#1a1326] shadow-xl shadow-black/30 transition hover:-translate-y-0.5"
              >
                Browse the archive
                <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
            <div className="max-w-md">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient text-white">
                  <Footprints className="h-5 w-5" />
                </div>
                <p className="font-display text-xl font-extrabold">{siteConfig.name}</p>
              </div>
              <p className="mt-4 font-medium leading-relaxed text-white/75">{siteConfig.description}</p>
            </div>

            <nav aria-label="Footer" className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Explore</span>
              {[
                { href: "/", label: "Videos", icon: Film },
                { href: "/photos", label: "Photos", icon: Camera },
                { href: "/sitemap.xml", label: "Sitemap", icon: MapIcon },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group inline-flex w-fit items-center gap-2 font-semibold text-white/85 transition hover:text-amber-300"
                >
                  <Icon className="h-4 w-4 text-white/50 transition group-hover:text-amber-300" />
                  <span className="transition-transform duration-300 group-hover:translate-x-1">{label}</span>
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">About the footage</span>
              <p className="text-sm font-medium leading-relaxed text-white/70">
                Recorded on foot with a body camera across the 17 cities and towns of the National Capital Region —
                for mapping, presentation, and reference.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm font-medium text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <p>
              &copy; {new Date().getFullYear()} {siteConfig.name}. All footage captured for documentation, mapping,
              and reference purposes.
            </p>
            <a
              href="#top"
              className="group inline-flex w-fit items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 font-semibold text-white/85 transition hover:border-amber-300/60 hover:text-amber-300"
            >
              <ArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
              Back to top
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
