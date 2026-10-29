import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getVideo } from "@/lib/api";
import { VideoPlayer } from "@/components/video/video-player";
import { RegisterActiveVideo } from "@/components/video/video-catalog-context";
import { MediaDetails } from "@/components/ui/media-details";
import { siteConfig } from "@/lib/config";

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

export default async function VideoPage({ params }: PageProps<"/video/[id]">) {
  const { id } = await params;
  const video = await loadVideo(id);

  if (!video) notFound();

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
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <RegisterActiveVideo video={video} />

      <div className="overflow-hidden rounded-2xl shadow-xl shadow-black/20">
        <VideoPlayer videoId={video.id} videoUrl={video.video_url} thumbnailUrl={video.thumbnail_url} title={video.title} />
      </div>

      <MediaDetails item={video} kind="video" />
    </>
  );
}
