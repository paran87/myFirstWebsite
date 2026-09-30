import { VideoCardSkeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <div className="skeleton mb-8 h-56 w-full rounded-xl" />
      <div className="mb-6 space-y-2">
        <div className="skeleton h-7 w-64 rounded-lg" />
        <div className="skeleton h-4 w-40 rounded-lg" />
      </div>
      <div className="skeleton mb-6 h-14 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <VideoCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
