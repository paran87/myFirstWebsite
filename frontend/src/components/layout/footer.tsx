import Link from "next/link";
import { MapPin } from "lucide-react";
import { siteConfig } from "@/lib/config";

export function Footer() {
  return (
    <footer className="glass mt-12 border-t border-border/80">
      <div className="mx-auto max-w-7xl px-4 py-10 text-base text-foreground lg:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-2 text-white">
                <MapPin className="h-4 w-4" />
              </div>
              <p className="font-display text-lg font-extrabold text-foreground">{siteConfig.name}</p>
            </div>
            <p className="mt-3 font-medium leading-relaxed text-foreground/85">{siteConfig.description}</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold uppercase tracking-wider text-foreground">Explore</span>
            <Link href="/" className="font-semibold transition hover:text-primary">
              Videos
            </Link>
            <Link href="/photos" className="font-semibold transition hover:text-primary">
              Photos
            </Link>
            <Link href="/sitemap.xml" className="font-semibold transition hover:text-primary">
              Sitemap
            </Link>
          </div>
        </div>
        <div className="mt-8 border-t border-border/60 pt-6 text-sm font-medium text-foreground/80">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All footage captured for documentation, mapping, and
          reference purposes.
        </div>
      </div>
    </footer>
  );
}
