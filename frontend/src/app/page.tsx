import { getCategories, getVideos } from "@/lib/api";
import { CatalogTabs } from "@/components/layout/catalog-tabs";
import { FiltersBar } from "@/components/video/filters-bar";
import { VideoGrid } from "@/components/video/video-grid";
import { Hero } from "@/components/layout/hero";
import { ErrorState } from "@/components/ui/states";
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

  const isFiltering = !!(params.search || params.city || params.category || params.year);

  const categories = await getCategories().catch(() => []);

  let result;
  let loadError: string | null = null;
  try {
    result = await getVideos(params);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Unable to load videos.";
    result = undefined;
  }

  const gridKey = JSON.stringify(params);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      {!isFiltering && (
        <div className="mb-8">
          <Hero totalVideos={result?.total} totalCategories={categories.length} />
        </div>
      )}

      <div className="page-shell p-5 sm:p-6 lg:p-8">
      <CatalogTabs />

      <div className="mb-6 mt-2 flex flex-col gap-1">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {params.search ? (
            <>
              Results for <span className="text-gradient">&ldquo;{params.search}&rdquo;</span>
            </>
          ) : (
            "Latest Documentation"
          )}
        </h2>
        <p className="text-base font-medium text-foreground/80">
          {result ? `${result.total.toLocaleString()} video${result.total === 1 ? "" : "s"} available` : "Browse the public catalog"}
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
      </div>
    </main>
  );
}
