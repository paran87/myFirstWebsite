import { getCategories, getPhotos } from "@/lib/api";
import { CatalogBrowser } from "@/components/layout/catalog-browser";
import type { PhotoListParams } from "@/lib/api";

export default async function PhotosPage({ searchParams }: PageProps<"/photos">) {
  const sp = await searchParams;

  const params: PhotoListParams = {
    page: 1,
    limit: 24,
    search: typeof sp.search === "string" ? sp.search : undefined,
    city: typeof sp.city === "string" ? sp.city : undefined,
    category: typeof sp.category === "string" ? sp.category : undefined,
    year: typeof sp.year === "string" ? Number(sp.year) : undefined,
    sort: (typeof sp.sort === "string" ? sp.sort : "newest") as PhotoListParams["sort"],
  };

  const categories = await getCategories().catch(() => []);

  let result;
  let loadError: string | null = null;
  try {
    result = await getPhotos(params);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Unable to load photos.";
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <section id="catalog" data-reveal className="page-shell p-5 sm:p-6 lg:p-8">
        <CatalogBrowser
          key={JSON.stringify(params)}
          initialKind="photo"
          initialPhotos={result ?? null}
          loadError={loadError}
          categories={categories}
          params={params}
          titleAs="h1"
        />
      </section>
    </main>
  );
}
