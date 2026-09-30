import type { MetadataRoute } from "next";
import { getVideos } from "@/lib/api";
import { siteConfig } from "@/lib/config";

/**
 * Generates /sitemap.xml. Pulls a bounded number of the most recent
 * published videos rather than the entire catalog to keep this fast;
 * for very large catalogs, split into multiple sitemap files.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteConfig.url, changeFrequency: "daily", priority: 1 },
    { url: `${siteConfig.url}/videos`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteConfig.url}/photos`, changeFrequency: "daily", priority: 0.9 },
  ];

  try {
    const result = await getVideos({ page: 1, limit: 100, sort: "newest" });
    const videoEntries: MetadataRoute.Sitemap = result.data.map((video) => ({
      url: `${siteConfig.url}/video/${video.id}`,
      lastModified: video.created_at,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
    return [...staticEntries, ...videoEntries];
  } catch {
    return staticEntries;
  }
}
