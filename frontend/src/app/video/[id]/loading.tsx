export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      <div className="skeleton aspect-video w-full rounded-2xl" />
      <div className="mt-5 grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="skeleton h-6 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
          <div className="skeleton h-24 w-full rounded-xl" />
        </div>
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>
    </main>
  );
}
