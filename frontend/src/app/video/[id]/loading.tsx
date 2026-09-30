/** Only the player/details column shows this; the map and list stay in place. */
export default function Loading() {
  return (
    <>
      <div className="skeleton aspect-video w-full rounded-xl" />
      <div className="page-shell space-y-3 p-3.5">
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-3.5 w-1/2 rounded" />
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="skeleton h-16 w-full rounded-lg" />
          <div className="skeleton h-16 w-full rounded-lg" />
        </div>
      </div>
    </>
  );
}
