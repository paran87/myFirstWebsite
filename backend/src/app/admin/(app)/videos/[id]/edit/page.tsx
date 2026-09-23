import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { VideoForm } from "@/components/admin/video-form";
import type { Video } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVideoPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;

  const admin = createSupabaseAdminClient();
  const { data: video } = await admin.from("videos").select("*").eq("id", id).maybeSingle();

  if (!video) notFound();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Edit Video</h1>
        <p className="text-sm text-muted">Update documentation metadata for &ldquo;{video.title}&rdquo;.</p>
      </div>
      <VideoForm mode="edit" initialVideo={video as unknown as Video} />
    </div>
  );
}
