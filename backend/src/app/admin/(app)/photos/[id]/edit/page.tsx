import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PhotoForm } from "@/components/admin/photo-form";
import type { Photo } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPhotoPage({ params }: PageProps) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("photos").select("*").eq("id", id).maybeSingle();

  if (error || !data) notFound();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Edit Photo</h1>
        <p className="text-sm text-muted">Update metadata or replace the image file.</p>
      </div>
      <PhotoForm mode="edit" initialPhoto={data as unknown as Photo} />
    </div>
  );
}
