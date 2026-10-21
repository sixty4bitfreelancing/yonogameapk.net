import {
  aboutCopy,
  APP_PAGE_CONTENT_UPDATED,
  appPageDescription,
  appPageUpdated,
  appPageTitle,
  categoryCopy,
  contactCopy,
  telegramCopy,
  disclaimerCopy,
  editorialCopy,
  guidesHubCopy,
  helpGuides,
  homeCopy,
  newAppsCopy,
  privacyCopy,
  responsibleGamingCopy,
  termsCopy,
} from "@/content/copy";
import {
  appPath,
  datedApps,
  directoryApps,
  getDocContent,
  isNewAppsPagePublished,
  publishedApps,
  publishedListings,
  relatedApps,
} from "@/data/apps";
import type { AppRecord } from "@/data/types";
import { NEW_APPS_PATH, staticPages, type StaticPage } from "./pages";
import { absoluteUrl } from "./site";

export type PublishedKind = "home" | "category" | "app" | "archive" | "guide" | "page";

export interface PublishedUrl {
  kind: PublishedKind;
  path: string;
  url: string;
  title: string;
  description: string;
  /** Latest significant content change (YYYY-MM-DD), or null when no reliable date exists. */
  lastModified: string | null;
  /** Changes whenever the page's visible data changes; used to detect IndexNow updates. */
  fingerprint: string;
  /** Path of the Markdown version of the page, when one exists. */
  markdownPath: string | null;
}

export const HOME_MARKDOWN_PATH = "/index.html.md";
export const markdownPathFor = (path: string) => `${path}index.html.md`;

function latest(...dates: (string | null | undefined)[]): string | null {
  const valid = dates.filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d));
  return valid.length ? valid.sort().at(-1)!.slice(0, 10) : null;
}

/** cyrb53: small, stable, non-cryptographic hash. */
function hash(value: unknown): string {
  const text = JSON.stringify(value);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, "0");
}

function listingSignature(apps: AppRecord[]) {
  return apps.map((app) => [
    app.id,
    app.name,
    app.aliases,
    app.category,
    app.image?.src ?? null,
    app.summary,
    app.checkedAt,
    app.addedAt,
    appPath(app),
  ]);
}

const appDates = (apps: AppRecord[]) => apps.flatMap((app) => [app.addedAt, app.checkedAt]);

function staticEntry(kind: PublishedKind, page: StaticPage, title: string, description: string): PublishedUrl {
  return {
    kind,
    path: page.path,
    url: absoluteUrl(page.path),
    title,
    description,
    lastModified: latest(page.lastModified),
    fingerprint: hash([page.path, page.lastModified, title, description]),
    markdownPath: null,
  };
}

/** Every published, canonical, indexable URL, in a stable order. The single source for sitemap, llms.txt and IndexNow. */
export function publishedUrls(): PublishedUrl[] {
  const entries: PublishedUrl[] = [];

  entries.push({
    kind: "home",
    path: "/",
    url: absoluteUrl("/"),
    title: homeCopy.title,
    description: homeCopy.description,
    lastModified: latest(staticPages.home.lastModified, ...appDates(directoryApps)),
    fingerprint: hash([homeCopy, staticPages.home.lastModified, listingSignature(directoryApps)]),
    markdownPath: HOME_MARKDOWN_PATH,
  });

  for (const listing of publishedListings) {
    const copy = categoryCopy[listing.id];
    const { path, apps } = listing;
    if (!copy) throw new Error(`Published listing "${listing.id}" has no page copy in src/content/copy.ts`);
    entries.push({
      kind: "category",
      path,
      url: absoluteUrl(path),
      title: copy.title,
      description: copy.description,
      lastModified: latest(copy.contentUpdated, ...appDates(apps)),
      fingerprint: hash([copy, listingSignature(apps)]),
      markdownPath: markdownPathFor(path),
    });
  }

  if (isNewAppsPagePublished) {
    entries.push({
      kind: "archive",
      path: NEW_APPS_PATH,
      url: absoluteUrl(NEW_APPS_PATH),
      title: newAppsCopy.title,
      description: newAppsCopy.description,
      lastModified: latest(datedApps[0]?.addedAt),
      fingerprint: hash([newAppsCopy, listingSignature(datedApps)]),
      markdownPath: null,
    });
  }

  for (const app of publishedApps) {
    const path = appPath(app) as string;
    entries.push({
      kind: "app",
      path,
      url: absoluteUrl(path),
      title: appPageTitle(app),
      description: appPageDescription(app),
      lastModified: appPageUpdated(app),
      fingerprint: hash([APP_PAGE_CONTENT_UPDATED, app, getDocContent(app), relatedApps(app).map((a) => a.id)]),
      markdownPath: null,
    });
  }

  entries.push(staticEntry("guide", staticPages.guidesHub, guidesHubCopy.title, guidesHubCopy.description));
  for (const guide of helpGuides) {
    entries.push({
      kind: "guide",
      path: guide.path,
      url: absoluteUrl(guide.path),
      title: guide.headline,
      description: guide.description,
      lastModified: latest(guide.dateModified),
      fingerprint: hash([guide]),
      markdownPath: null,
    });
  }
  entries.push(staticEntry("page", staticPages.about, aboutCopy.title, aboutCopy.description));
  entries.push(staticEntry("page", staticPages.editorialPolicy, editorialCopy.title, editorialCopy.description));
  const optional: [StaticPage, { title: string; description: string }][] = [
    [staticPages.contact, contactCopy],
    [staticPages.telegram, telegramCopy],
    [staticPages.disclaimer, disclaimerCopy],
    [staticPages.responsibleGaming, responsibleGamingCopy],
    [staticPages.privacy, privacyCopy],
    [staticPages.terms, termsCopy],
  ];
  for (const [page, copy] of optional) {
    if (page.status === "published") entries.push(staticEntry("page", page, copy.title, copy.description));
  }

  const seen = new Set<string>();
  return entries.filter((entry) => (seen.has(entry.url) ? false : (seen.add(entry.url), true)));
}
