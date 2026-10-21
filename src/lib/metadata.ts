import type { Metadata } from "next";
import { isProductionDeployment } from "./env";
import { site } from "./site";

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  /** Use the title as-is instead of appending the site name. */
  absoluteTitle?: boolean;
  noindex?: boolean;
  /** Path of a Markdown version of this page, advertised as rel="alternate". */
  markdownPath?: string | null;
  article?: { publishedTime: string; modifiedTime: string };
  /** Page-specific social preview image; defaults to the site image. */
  image?: { path: string; width: number; height: number; alt: string } | null;
}

/** Preview and development builds are never indexable, whatever the page says. */
export const nonProductionRobots: Metadata["robots"] = { index: false, follow: false };

export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle,
  noindex,
  markdownPath,
  article,
  image: pageImage,
}: PageMetadataInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${site.name}`;
  const source = pageImage ?? site.ogImage;
  const image = { url: source.path, width: source.width, height: source.height, alt: source.alt };
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: path,
      ...(markdownPath ? { types: { "text/markdown": markdownPath } } : {}),
    },
    robots: !isProductionDeployment ? nonProductionRobots : noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: article ? "article" : "website",
      url: path,
      siteName: site.name,
      locale: site.locale,
      title: fullTitle,
      description,
      images: [image],
      ...(article ? { publishedTime: article.publishedTime, modifiedTime: article.modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}
