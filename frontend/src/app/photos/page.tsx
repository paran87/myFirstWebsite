import { Camera } from "lucide-react";
import { getCategories, getPhotos } from "@/lib/api";
import { FiltersBar } from "@/components/video/filters-bar";
import { PhotoGrid } from "@/components/photo/photo-grid";
import { CatalogTabs } from "@/components/layout/catalog-tabs";
import { ErrorState } from "@/components/ui/states";
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
      <section data-reveal className="page-shell p-5 sm:p-6 lg:p-8">
      <CatalogTabs />

      <div className="mb-6 mt-2 flex flex-col gap-1.5">
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-primary">
          <Camera className="h-4 w-4" />
          The photo archive
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {params.search ? (
            <>
              Photo results for <span className="text-gradient">&ldquo;{params.search}&rdquo;</span>
            </>
          ) : (
            "Street Photo Gallery"
          )}
        </h1>
        <p className="text-base font-medium text-foreground/75 sm:text-lg">
          {result ? `${result.total.toLocaleString()} photo${result.total === 1 ? "" : "s"} available` : "Browse documentation photos"}
        </p>
      </div>

      <div className="mb-6">
        <FiltersBar categories={categories} />
      </div>

      {loadError ? (
        <ErrorState message={loadError} />
      ) : (
        result && <PhotoGrid key={JSON.stringify(params)} initialResult={result} params={params} />
      )}
      </section>
    </main>
  );
}
