"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, ImageIcon } from "lucide-react";

export function CatalogTabs() {
  const pathname = usePathname();
  const onPhotos = pathname.startsWith("/photo");

  return (
    <div className="mb-8 flex w-full gap-1.5 rounded-full border border-border/80 bg-surface-2/70 p-1.5 shadow-inner sm:w-fit">
      <Link
        href="/"
        className={`flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-bold transition-all duration-300 sm:flex-none ${
          !onPhotos ? "bg-brand-gradient text-white shadow-lg shadow-primary/25 dark:text-primary-foreground" : "text-foreground/80 hover:bg-surface hover:text-primary"
        }`}
      >
        <Film className="h-4 w-4" />
        Videos
      </Link>
      <Link
        href="/photos"
        className={`flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-bold transition-all duration-300 sm:flex-none ${
          onPhotos ? "bg-brand-gradient text-white shadow-lg shadow-primary/25 dark:text-primary-foreground" : "text-foreground/80 hover:bg-surface hover:text-primary"
        }`}
      >
        <ImageIcon className="h-4 w-4" />
        Photos
      </Link>
    </div>
  );
}
