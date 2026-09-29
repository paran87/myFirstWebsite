import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Calendar, Clock, Eye, Tag as TagIcon, UploadCloud, ArrowLeft } from "lucide-react";
import { getCategories, getVideo, getVideos } from "@/lib/api";
import { VideoPlayer } from "@/components/video/video-player";
import { RelatedVideos } from "@/components/video/related-videos";
import { FiltersBar } from "@/components/video/filters-bar";
import { MapViewLoader } from "@/components/video/map-view-loader";
import { formatDate, formatDuration, formatViews } from "@/lib/format";
import { siteConfig } from "@/lib/config";
import type { VideoListParams } from "@/lib/api";

async function loadVideo(id: string) {
  try {
    return await getVideo(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps<"/video/[id]">): Promise<Metadata> {
  const { id } = await params;
  const video = await loadVideo(id);
  if (!video) return { title: "Video not found" };

  const description =
    video.description?.slice(0, 160) ||
    `Street documentation footage${video.city ? ` from ${video.city}` : ""}, ${siteConfig.name}.`;

  return {
    title: video.title,
    description,
    alternates: { canonical: `/video/${video.id}` },
    openGraph: {
      title: video.title,
      description,
      type: "video.other",
      images: video.thumbnail_url ? [{ url: video.thumbnail_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: video.title,
      description,
      images: video.thumbnail_url ? [video.thumbnail_url] : undefined,
    },
  };
}

export default async function VideoPage({ params, searchParams }: PageProps<"/video/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const video = await loadVideo(id);

  if (!video) notFound();

  const listParams: VideoListParams = {
    page: 1,
    limit: 24,
    search: typeof sp.search === "string" ? sp.search : undefined,
    city: typeof sp.city === "string" ? sp.city : undefined,
    category: typeof sp.category === "string" ? sp.category : undefined,
    year: typeof sp.year === "string" ? Number(sp.year) : undefined,
    sort: (typeof sp.sort === "string" ? sp.sort : "newest") as VideoListParams["sort"],
  };

  const [catalog, categories] = await Promise.all([
    getVideos(listParams).catch(() => null),
    getCategories().catch(() => []),
  ]);

  const locationLine = [video.street, video.barangay, video.city, video.province]
    .filter(Boolean)
    .join(", ");

  const hasCoordinates =
    typeof video.latitude === "number" &&
    typeof video.longitude === "number" &&
    !Number.isNaN(video.latitude) &&
    !Number.isNaN(video.longitude);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description ?? video.title,
    thumbnailUrl: video.thumbnail_url ?? undefined,
    uploadDate: video.uploaded_at ?? video.created_at,
    contentUrl: video.video_url,
    duration: video.duration_seconds ? `PT${video.duration_seconds}S` : undefined,
  };

  return (
    <main className="animate-fade-in mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1.5 text-base font-semibold text-foreground shadow-sm backdrop-blur-md transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to catalog
      </Link>

      <div className="sticky top-16 z-20 mb-4">
        <FiltersBar categories={categories} />
      </div>

      <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(26rem,1fr)]">
        <div className="flex min-h-0 flex-col gap-3">
          <div className="overflow-hidden rounded-2xl shadow-xl shadow-black/20">
            <VideoPlayer videoId={video.id} videoUrl={video.video_url} thumbnailUrl={video.thumbnail_url} title={video.title} />
          </div>

          <div className="page-shell space-y-2.5 p-3 sm:p-3.5">
            <div>
              <h1 className="text-base font-bold leading-snug tracking-tight sm:text-lg">{video.title}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-foreground/80">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {formatViews(video.views)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(video.recorded_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(video.duration_seconds)}
                </span>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {locationLine && (
                <div className="rounded-lg border border-border bg-surface px-2.5 py-2">
                  <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
                    <MapPin className="h-3 w-3 text-primary" />
                    Location
                  </p>
                  <p className="mt-0.5 text-xs font-medium leading-snug text-foreground/85">{locationLine}</p>
                </div>
              )}

              <div className="rounded-lg border border-border bg-surface px-2.5 py-2">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/70">Details</p>
                <dl className="space-y-0.5 text-xs text-muted">
                  {video.category?.name && (
                    <div className="flex justify-between gap-3">
                      <dt>Category</dt>
                      <dd className="text-foreground">{video.category.name}</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-1"><UploadCloud className="h-3 w-3" /> Uploaded</dt>
                    <dd className="text-foreground">{formatDate(video.uploaded_at ?? video.created_at)}</dd>
                  </div>
                </dl>
              </div>

              {video.description && (
                <div className="rounded-lg border border-border bg-surface px-2.5 py-2 sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">Description</p>
                  <p className="mt-0.5 line-clamp-3 text-xs font-medium leading-snug text-foreground/85">{video.description}</p>
                </div>
              )}

              {video.tags?.length > 0 && (
                <div className="rounded-lg border border-border bg-surface px-2.5 py-2 sm:col-span-2">
                  <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
                    <TagIcon className="h-3 w-3 text-primary" />
                    Tags
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {video.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {hasCoordinates && (
                <div className="rounded-lg border border-border bg-surface px-2.5 py-2 sm:col-span-2">
                  <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
                    <MapPin className="h-3 w-3 text-primary" />
                    Recording Location
                  </p>
                  <MapViewLoader
                    latitude={video.latitude as number}
                    longitude={video.longitude as number}
                    label={video.title}
                  />
                  <p className="mt-1 text-[10px] text-muted">
                    {video.latitude?.toFixed(5)}, {video.longitude?.toFixed(5)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <RelatedVideos current={video} videos={catalog?.data ?? []} />
      </div>
    </main>
  );
}
