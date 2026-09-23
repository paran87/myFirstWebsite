import Link from "next/link";
import { siteConfig } from "@/lib/config";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted lg:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-foreground">{siteConfig.name}</p>
            <p className="mt-1 max-w-md">{siteConfig.description}</p>
          </div>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <Link href="/sitemap.xml" className="hover:text-foreground">
              Sitemap
            </Link>
          </div>
        </div>
        <p className="mt-6 text-xs">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All footage captured for documentation, mapping, and
          reference purposes.
        </p>
      </div>
    </footer>
  );
}
