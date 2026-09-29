import Image from "next/image";
import { FolderTree, Video as VideoIcon, Sparkles } from "lucide-react";
import { siteConfig } from "@/lib/config";

export function Hero({
  totalVideos,
  totalCategories,
}: {
  totalVideos?: number;
  totalCategories?: number;
}) {
  return (
    <section className="relative min-h-[22rem] overflow-hidden rounded-3xl border border-border sm:min-h-[26rem]">
      <Image
        src="https://images.unsplash.com/photo-1652432155524-bd2c5c444ce6?auto=format&fit=crop&w=1920&h=1080&q=80"
        alt="Metro Manila skyline at night"
        fill
        priority
        unoptimized
        sizes="(max-width: 1280px) 100vw, 1280px"
        className="object-cover object-center"
      />

      {/* Readability overlays */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"
        aria-hidden
      />

      <div className="relative z-10 p-8 sm:p-12">
        <div className="max-w-2xl">
          <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/50 px-3 py-1.5 text-sm font-semibold text-white shadow-sm backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Street-level documentation of Metro Manila
          </span>

          <h1
            className="animate-fade-up mt-5 text-4xl font-black leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)] sm:text-5xl lg:text-7xl"
            style={{ animationDelay: "80ms" }}
          >
            Explore the streets of{" "}
            <span className="bg-gradient-to-r from-sky-200 via-white to-teal-200 bg-clip-text text-transparent">
              Metro Manila
            </span>
            , one walk at a time.
          </h1>

          <p
            className="animate-fade-up mt-4 max-w-xl text-lg font-medium text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] sm:text-xl"
            style={{ animationDelay: "160ms" }}
          >
            {siteConfig.name} is a growing archive of body-camera footage capturing real streets,
            barangays, and neighborhoods — organized for mapping, presentation, and reference.
          </p>

          <div
            className="animate-fade-up mt-7 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "240ms" }}
          >
            {typeof totalVideos === "number" && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-black/35 px-4 py-2.5 backdrop-blur-md">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/25 text-sky-100">
                  <VideoIcon className="h-4.5 w-4.5" />
                </span>
                <span className="text-white">
                  <span className="block text-xl font-extrabold leading-none">{totalVideos.toLocaleString()}</span>
                  <span className="text-sm font-medium text-white">videos documented</span>
                </span>
              </div>
            )}
            {typeof totalCategories === "number" && totalCategories > 0 && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-black/35 px-4 py-2.5 backdrop-blur-md">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-2/25 text-teal-100">
                  <FolderTree className="h-4.5 w-4.5" />
                </span>
                <span className="text-white">
                  <span className="block text-xl font-extrabold leading-none">{totalCategories}</span>
                  <span className="text-sm font-medium text-white">categories</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
