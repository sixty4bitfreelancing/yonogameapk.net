import type { AppRecord } from "@/data/types";
import type { Crumb } from "./breadcrumbs";
import { absoluteUrl, site } from "./site";

export interface IdRef {
  "@id": string;
}

export interface JsonLdNode {
  "@type": string;
  "@id"?: string;
  [key: string]: unknown;
}

export interface JsonLdGraph {
  "@context": "https://schema.org";
  "@graph": JsonLdNode[];
}

export const ids = {
  website: `${site.url}/#website`,
  organization: `${site.url}/#organization`,
  logo: `${site.url}/#logo`,
  webpage: (path: string) => `${absoluteUrl(path)}#webpage`,
  breadcrumb: (path: string) => `${absoluteUrl(path)}#breadcrumb`,
  itemList: (path: string) => `${absoluteUrl(path)}#list`,
  article: (path: string) => `${absoluteUrl(path)}#article`,
  app: (path: string) => `${absoluteUrl(path)}#app`,
};

const ref = (id: string): IdRef => ({ "@id": id });

export function graph(...nodes: (JsonLdNode | null | undefined | false)[]): JsonLdGraph {
  return { "@context": "https://schema.org", "@graph": nodes.filter(Boolean) as JsonLdNode[] };
}

/** The public website brand. No legal entity, address or contact details unless configured. */
export function organizationNode(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": ids.organization,
    name: site.name,
    url: absoluteUrl("/"),
    logo: {
      "@type": "ImageObject",
      "@id": ids.logo,
      url: absoluteUrl(site.logo.path),
      contentUrl: absoluteUrl(site.logo.path),
      width: site.logo.width,
      height: site.logo.height,
    },
    ...(site.operatorLegalName ? { legalName: site.operatorLegalName } : {}),
    ...(site.contactEmail ? { email: site.contactEmail } : {}),
  };
}

export function websiteNode(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": ids.website,
    url: absoluteUrl("/"),
    name: site.name,
    description: site.tagline,
    inLanguage: site.language,
    publisher: ref(ids.organization),
  };
}

interface WebPageInput {
  type?: "WebPage" | "CollectionPage" | "AboutPage" | "ContactPage";
  path: string;
  name: string;
  description: string;
  hasBreadcrumb?: boolean;
  mainEntity?: IdRef;
  about?: IdRef;
  dateModified?: string;
}

export function webPageNode({
  type = "WebPage",
  path,
  name,
  description,
  hasBreadcrumb = true,
  mainEntity,
  about,
  dateModified,
}: WebPageInput): JsonLdNode {
  return {
    "@type": type,
    "@id": ids.webpage(path),
    url: absoluteUrl(path),
    name,
    description,
    inLanguage: site.language,
    isPartOf: ref(ids.website),
    ...(hasBreadcrumb ? { breadcrumb: ref(ids.breadcrumb(path)) } : {}),
    ...(mainEntity ? { mainEntity } : {}),
    ...(about ? { about } : {}),
    ...(dateModified ? { dateModified } : {}),
  };
}

export function breadcrumbNode(path: string, crumbs: Crumb[]): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    "@id": ids.breadcrumb(path),
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** Mirrors the visible list: every displayed entry, in display order, linked when it has an app page. */
export function itemListNode(
  path: string,
  name: string,
  apps: AppRecord[],
  detailPath: (app: AppRecord) => string | null,
): JsonLdNode {
  return {
    "@type": "ItemList",
    "@id": ids.itemList(path),
    name,
    numberOfItems: apps.length,
    itemListOrder: "https://schema.org/ItemListUnordered",
    itemListElement: apps.map((app, index) => {
      const href = detailPath(app);
      return {
        "@type": "ListItem",
        position: index + 1,
        name: app.name,
        ...(href ? { url: absoluteUrl(href) } : {}),
      };
    }),
  };
}

interface ArticleInput {
  path: string;
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
}

export function articleNode({ path, headline, description, datePublished, dateModified }: ArticleInput): JsonLdNode {
  return {
    "@type": "Article",
    "@id": ids.article(path),
    headline,
    description,
    datePublished,
    dateModified,
    inLanguage: site.language,
    author: ref(ids.organization),
    publisher: ref(ids.organization),
    mainEntityOfPage: ref(ids.webpage(path)),
    image: absoluteUrl(site.ogImage.path),
  };
}

export interface VisitorRating {
  average: number | null;
  count: number;
}

/**
 * The app as the page's main entity. Every property mirrors something visible on the page:
 * download, version, size and OS only when entered for the app; the developer only when
 * checked (so the directory is never presented as the app's maker); the rating only when
 * visitors have actually rated it. No offers or prices are invented.
 */
export function softwareApplicationNode(path: string, app: AppRecord, rating?: VisitorRating | null): JsonLdNode {
  const hasRating = rating && rating.count > 0 && rating.average !== null;
  return {
    "@type": "SoftwareApplication",
    "@id": ids.app(path),
    name: app.name,
    url: absoluteUrl(path),
    applicationCategory: "GameApplication",
    ...(app.summary ? { description: app.summary } : {}),
    ...(app.image ? { image: absoluteUrl(app.image.src) } : {}),
    ...(app.aliases.length ? { alternateName: app.aliases } : {}),
    ...(app.developer && app.checkedAt ? { author: { "@type": "Organization", name: app.developer } } : {}),
    ...(app.stats.os ? { operatingSystem: app.stats.os.value } : {}),
    ...(app.version ? { softwareVersion: app.version } : {}),
    ...(app.stats.apkSize && app.stats.apkSize.claim === "none" ? { fileSize: app.stats.apkSize.value } : {}),
    ...(app.downloadUrl ? { downloadUrl: app.downloadUrl } : {}),
    ...(app.sourceUrl ? { sameAs: app.sourceUrl } : {}),
    ...(hasRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.average,
            ratingCount: rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

/** Questions and answers exactly as shown on the page. */
export function faqPageNode(path: string, items: { question: string; answer: string }[]): JsonLdNode | null {
  if (!items.length) return null;
  return {
    "@type": "FAQPage",
    "@id": `${absoluteUrl(path)}#faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/** Steps exactly as shown on the page; `anchor` is the id of the visible step list. */
export function howToNode(path: string, anchor: string, name: string, steps: string[]): JsonLdNode | null {
  if (!steps.length) return null;
  return {
    "@type": "HowTo",
    "@id": `${absoluteUrl(path)}#${anchor}`,
    name,
    step: steps.map((text, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      text,
      url: `${absoluteUrl(path)}#${anchor}`,
    })),
  };
}

/** Safe for inline <script>: escapes characters that could close the tag or break parsing. */
export function serializeJsonLd(data: JsonLdGraph): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
