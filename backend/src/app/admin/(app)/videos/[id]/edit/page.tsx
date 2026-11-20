import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getContent } from "@/lib/db";
import { VideoForm } from "@/components/admin/video-form";
import type { Video } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVideoPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;

  const video = await getContent<Video>("videos", id, true);

  if (!video) notFound();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Edit Video</h1>
        <p className="text-sm text-muted">Update documentation metadata for &ldquo;{video.title}&rdquo;.</p>
      </div>
      <VideoForm mode="edit" initialVideo={video} />
    </div>
  );
}
