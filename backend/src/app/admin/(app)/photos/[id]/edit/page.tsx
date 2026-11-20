import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getContent } from "@/lib/db";
import { PhotoForm } from "@/components/admin/photo-form";
import type { Photo } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPhotoPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const photo = await getContent<Photo>("photos", id, true);

  if (!photo) notFound();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Edit Photo</h1>
        <p className="text-sm text-muted">Update metadata or replace the image file.</p>
      </div>
      <PhotoForm mode="edit" initialPhoto={photo} />
    </div>
  );
}
