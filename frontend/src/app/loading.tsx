import { VideoCardSkeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <div className="mb-6 space-y-2">
        <div className="skeleton h-7 w-72 rounded" />
        <div className="skeleton h-4 w-96 rounded" />
      </div>
      <div className="skeleton mb-6 h-12 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <VideoCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
