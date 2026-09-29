import { PhotoForm } from "@/components/admin/photo-form";

export default function NewPhotoPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Add Photos</h1>
        <p className="text-sm text-muted">Upload one or more still images and add shared location metadata.</p>
      </div>
      <PhotoForm mode="create" />
    </div>
  );
}
