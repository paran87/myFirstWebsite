import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapPin, Calendar, Clock, Eye, Tag as TagIcon, UploadCloud } from "lucide-react";
import { getVideo } from "@/lib/api";
import { VideoPlayer } from "@/components/video/video-player";
import { MapViewLoader } from "@/components/video/map-view-loader";
import { formatDate, formatDuration, formatViews } from "@/lib/format";
import { siteConfig } from "@/lib/config";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function loadVideo(id: string) {
  try {
    return await getVideo(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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

export default async function VideoPage({ params }: PageProps) {
  const { id } = await params;
  const video = await loadVideo(id);

  if (!video) notFound();

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
    <main className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <VideoPlayer videoId={video.id} videoUrl={video.video_url} thumbnailUrl={video.thumbnail_url} title={video.title} />

      <div className="mt-5 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h1 className="text-xl font-semibold leading-tight">{video.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {formatViews(video.views)}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Recorded {formatDate(video.recorded_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatDuration(video.duration_seconds)}
            </span>
          </div>

          {locationLine && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <MapPin className="h-4 w-4 text-primary" />
                Location
              </p>
              <p className="mt-1 text-sm text-muted">{locationLine}</p>
            </div>
          )}

          {video.description && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-sm font-medium">Description</p>
              <p className="mt-1 whitespace-pre-line text-sm text-muted">{video.description}</p>
            </div>
          )}

          {video.tags?.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <TagIcon className="h-4 w-4 text-primary" />
                Tags
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {video.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          {hasCoordinates && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <MapPin className="h-4 w-4 text-primary" />
                Recording Location
              </p>
              <MapViewLoader
                latitude={video.latitude as number}
                longitude={video.longitude as number}
                label={video.title}
              />
              <p className="mt-2 text-xs text-muted">
                {video.latitude?.toFixed(5)}, {video.longitude?.toFixed(5)}
              </p>
            </div>
          )}

          <div className="rounded-xl border border-border bg-surface p-4 text-sm">
            <p className="mb-2 font-medium">Details</p>
            <dl className="space-y-1.5 text-muted">
              {video.category?.name && (
                <div className="flex justify-between">
                  <dt>Category</dt>
                  <dd className="text-foreground">{video.category.name}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1"><UploadCloud className="h-3.5 w-3.5" /> Uploaded</dt>
                <dd className="text-foreground">{formatDate(video.uploaded_at ?? video.created_at)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </main>
  );
}
