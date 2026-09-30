import { getCategories, getVideos } from "@/lib/api";
import { CatalogBrowser } from "@/components/layout/catalog-browser";
import { Hero } from "@/components/layout/hero";
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
        <div className="mb-10">
          <Hero totalVideos={result?.total} totalCategories={categories.length} />
        </div>
      )}

      <section id="catalog" data-reveal className="page-shell p-5 sm:p-6 lg:p-8">
        <CatalogBrowser
          key={gridKey}
          initialKind="video"
          initialVideos={result ?? null}
          loadError={loadError}
          categories={categories}
          params={params}
        />
      </section>
    </main>
  );
}
