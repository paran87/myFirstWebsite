import { VideoForm } from "@/components/admin/video-form";

export default function NewVideoPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Add Video</h1>
        <p className="text-sm text-muted">Upload footage and fill in its documentation metadata.</p>
      </div>
      <VideoForm mode="create" />
    </div>
  );
}
