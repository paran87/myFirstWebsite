import { getCategories, getVideos } from "@/lib/api";
import { FiltersBar } from "@/components/video/filters-bar";
import { VideoGrid } from "@/components/video/video-grid";
import { ErrorState } from "@/components/ui/states";
import { siteConfig } from "@/lib/config";
import type { VideoListParams } from "@/lib/api";

export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;

  const params: VideoListParams = {
    page: 1,
    limit: 24,
    search: typeof sp.search === "string" ? sp.search : undefined,
    city: typeof sp.city === "string" ? sp.city : undefined,
    category: typeof sp.category === "string" ? sp.category : undefined,
    year: typeof sp.year === "string" ? Number(sp.year) : undefined,
    sort: (typeof sp.sort === "string" ? sp.sort : "newest") as VideoListParams["sort"],
  };

  const categories = await getCategories().catch(() => []);

  let result;
  let loadError: string | null = null;
  try {
    result = await getVideos(params);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Unable to load videos.";
  }

  const gridKey = JSON.stringify(params);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {params.search ? `Search results for "${params.search}"` : "Street-Level Video Documentation"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Body-camera footage of streets and areas across Metro Manila, organized for mapping,
          presentation, and reference. Currently showing {siteConfig.name}&rsquo;s public catalog.
        </p>
      </div>

      <div className="mb-6">
        <FiltersBar categories={categories} />
      </div>

      {loadError ? (
        <ErrorState message={loadError} />
      ) : (
        result && <VideoGrid key={gridKey} initialResult={result} params={params} />
      )}
    </main>
  );
}
