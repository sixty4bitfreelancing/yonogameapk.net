import type { MetadataRoute } from "next";
import { publishedUrls } from "@/lib/published-urls";

export default function sitemap(): MetadataRoute.Sitemap {
  return publishedUrls().map((entry) => ({
    url: entry.url,
    ...(entry.lastModified ? { lastModified: entry.lastModified } : {}),
  }));
}
