"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, ImageIcon } from "lucide-react";

export function CatalogTabs() {
  const pathname = usePathname();
  const onPhotos = pathname.startsWith("/photo");

  return (
    <div className="mb-6 flex gap-2 rounded-2xl border border-border/80 bg-surface/75 p-1.5 shadow-sm backdrop-blur-md">
      <Link
        href="/"
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-base font-bold transition sm:flex-none ${
          !onPhotos ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-foreground hover:bg-surface-2"
        }`}
      >
        <Film className="h-4 w-4" />
        Videos
      </Link>
      <Link
        href="/photos"
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-base font-bold transition sm:flex-none ${
          onPhotos ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-foreground hover:bg-surface-2"
        }`}
      >
        <ImageIcon className="h-4 w-4" />
        Photos
      </Link>
    </div>
  );
}
