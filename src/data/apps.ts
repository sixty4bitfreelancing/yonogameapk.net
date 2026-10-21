import { appContent } from "./app-content.generated";
import { appOverrides } from "./app-overrides";
import { bonusData } from "./bonuses.generated";
import { siteLinks } from "@/lib/links";
import { editorRatings } from "./editor-ratings";
import { LISTED_STATS_CHECKED, listedAppStats, listedNameMap, listedNotInDirectory } from "./listed-app-stats";
import { categories, categoryOrder, MIN_CATEGORY_PAGE_LISTINGS, nameCollections, type CategoryInfo } from "./categories";
import { importedApps } from "./imported-apps.generated";
import type { AppCategory, AppDocContent, AppRecord, ImportedApp } from "./types";

const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

/** Bonus and withdrawal figures from the imported spreadsheet: another website's claims, labelled as such. */
function bonusStats(id: string): AppRecord["stats"] {
  const entry = bonusData.apps[id];
  if (!entry) return {};
  const claim = { source: bonusData.source, checkedAt: bonusData.checkedAt, claim: "third-party" as const };
  return {
    ...(entry.signupBonus !== null ? { signupBonus: { value: rupees(entry.signupBonus), ...claim } } : {}),
    ...(entry.minWithdrawal !== null ? { minWithdrawal: { value: rupees(entry.minWithdrawal), ...claim } } : {}),
  };
}

const nameKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/** APK size and downloads from listed-app-stats.ts, keyed by app id. */
const listedStatsById = new Map<string, { size: string | null; downloads: string | null }>();
for (const [name, size, downloads] of listedAppStats) {
  if (listedNotInDirectory.has(name)) continue;
  const target = nameKey(listedNameMap[name] ?? name);
  const app = importedApps.find((a) => nameKey(a.name) === target || a.aliases.some((alias) => nameKey(alias) === target));
  if (!app) throw new Error(`listed-app-stats.ts: "${name}" doesn't match any app in the directory`);
  listedStatsById.set(app.id, { size, downloads });
}

/** "59" → "59 MB"; "55 MB" stays; ranges such as "78-53" aren't a usable size, so they're left out. */
function listedSize(value: string | null): string | null {
  const match = value?.trim().match(/^(\d+(?:\.\d+)?)\s*(MB)?$/i);
  return match ? `${match[1]} MB` : null;
}

function listedStats(id: string): AppRecord["stats"] {
  const entry = listedStatsById.get(id);
  if (!entry) return {};
  const claim = { source: bonusData.source, checkedAt: LISTED_STATS_CHECKED, claim: "third-party" as const };
  const size = listedSize(entry.size);
  return {
    ...(size ? { apkSize: { value: size, ...claim } } : {}),
    ...(entry.downloads ? { downloads: { value: entry.downloads, ...claim } } : {}),
  };
}

function importedRating(id: string): AppRecord["externalRating"] {
  const rating = bonusData.apps[id]?.rating;
  return rating ? { ...rating, checkedAt: bonusData.checkedAt } : null;
}

function applyOverride(app: ImportedApp): AppRecord {
  const sharedDownload = !app.downloadUrl && siteLinks.download;
  const base: AppRecord = {
    ...app,
    // DOWNLOAD_URL gives every game the same Download button; an app's own downloadUrl wins.
    downloadUrl: app.downloadUrl ?? siteLinks.download,
    downloadIsAffiliate: sharedDownload ? siteLinks.downloadSponsored : false,
    stats: { ...listedStats(app.id), ...bonusStats(app.id) },
    externalRating: importedRating(app.id),
    editorScore: editorRatings[app.name] ?? null,
    appUpdate: null,
    knownIssues: [],
    verificationLog: [],
    bonusTerms: [],
  };
  const override = appOverrides[app.id];
  if (!override) return base;
  const { provenance, stats, ...fields } = override;
  return {
    ...base,
    ...(override.downloadUrl ? { downloadIsAffiliate: false } : {}),
    ...fields,
    stats: { ...base.stats, ...stats },
    provenance: { ...app.provenance, ...provenance },
  };
}

for (const [name, score] of Object.entries(editorRatings)) {
  if (!importedApps.some((app) => app.name === name)) {
    throw new Error(`editor-ratings.ts lists "${name}", which isn't an app name in the directory`);
  }
  if (score !== null && !(score >= 0 && score <= 5)) {
    throw new Error(`editor-ratings.ts: score for "${name}" must be from 0 to 5 (got ${score})`);
  }
}

for (const id of Object.keys(appOverrides)) {
  if (!importedApps.some((app) => app.id === id)) {
    throw new Error(`app-overrides.ts has an entry for unknown app id "${id}"`);
  }
}

/** Every imported entry, including excluded inventory records. */
export const allApps: AppRecord[] = importedApps.map(applyOverride);

/** Every listed (non-excluded) entry has its own page. */
export function hasDetailPage(app: AppRecord): boolean {
  return app.publicationStatus !== "excluded";
}

/**
 * Independently checked: a check date plus a developer or primary source. Only checked
 * apps show developer details, a summary, download links and SoftwareApplication markup.
 */
export function isChecked(app: AppRecord): boolean {
  return Boolean(app.checkedAt) && Boolean(app.developer || app.sourceUrl);
}

/** Entries shown in the public directory, in source-document order. */
export const directoryApps: AppRecord[] = allApps.filter((app) => app.publicationStatus !== "excluded");

export const publishedApps: AppRecord[] = directoryApps.filter(hasDetailPage);

export function getPublishedApp(slug: string): AppRecord | undefined {
  return publishedApps.find((app) => app.slug === slug);
}

export function appPath(app: AppRecord): string | null {
  return hasDetailPage(app) ? `/apps/${app.slug}/` : null;
}

export function getDocContent(app: AppRecord): AppDocContent | null {
  return appContent[app.id] ?? null;
}

/** Listed apps whose names differ from this one by a single letter, e.g. IND Rummy and INR Rummy. */
export function confusableApps(app: AppRecord): AppRecord[] {
  const similar = appContent[app.id]?.similarNames ?? [];
  return similar
    .filter((s) => s.reason === "differs by one letter")
    .map((s) => allApps.find((a) => a.slug === s.slug))
    .filter((a): a is AppRecord => Boolean(a && a.publicationStatus !== "excluded"));
}

export function appsInCategory(category: AppCategory): AppRecord[] {
  return directoryApps.filter((app) => app.category === category);
}

export function isCategoryPagePublished(category: AppCategory): boolean {
  return categories[category].path !== null && appsInCategory(category).length >= MIN_CATEGORY_PAGE_LISTINGS;
}

export const publishedCategories: CategoryInfo[] = categoryOrder
  .filter(isCategoryPagePublished)
  .map((id) => categories[id]);

export function categoryPath(category: AppCategory): string | null {
  return isCategoryPagePublished(category) ? categories[category].path : null;
}

/** A browsable listing page: a category page or a name collection. */
export interface Listing {
  id: string;
  kind: "category" | "collection";
  label: string;
  path: string;
  pageTitle: string;
  basis: string;
  apps: AppRecord[];
}

export const publishedListings: Listing[] = [
  ...publishedCategories.map((c) => ({
    id: c.id,
    kind: "category" as const,
    label: c.label,
    path: c.path as string,
    pageTitle: c.pageTitle as string,
    basis: c.basis,
    apps: appsInCategory(c.id),
  })),
  ...nameCollections
    .map((c) => ({
      id: c.id,
      kind: "collection" as const,
      label: c.label,
      path: c.path,
      pageTitle: c.pageTitle,
      basis: c.basis,
      apps: directoryApps.filter((app) => c.pattern.test(app.name)),
    }))
    .filter((listing) => listing.apps.length >= MIN_CATEGORY_PAGE_LISTINGS),
];

export function getListing(id: string): Listing | undefined {
  return publishedListings.find((listing) => listing.id === id);
}

/** Collections an app belongs to (beyond its category), for cross-links on its page. */
export function collectionsFor(app: AppRecord): Listing[] {
  return publishedListings.filter((l) => l.kind === "collection" && l.apps.some((a) => a.id === app.id));
}

/**
 * Neighbours in the same category, in directory order, wrapping around. Spreads internal
 * links evenly instead of every page pointing at the same first few apps.
 */
export function relatedApps(app: AppRecord, limit = 4): AppRecord[] {
  const peers = publishedApps.filter((other) => other.category === app.category);
  const index = peers.findIndex((other) => other.id === app.id);
  if (index < 0 || peers.length < 2) return [];
  const result: AppRecord[] = [];
  for (let step = 1; step < peers.length && result.length < limit; step++) {
    result.push(peers[(index + step) % peers.length]);
  }
  return result;
}

export const RECENT_ON_HOMEPAGE = 6;

/** Entries with a genuine addition date, newest first. */
export const datedApps: AppRecord[] = directoryApps
  .filter((app) => app.addedAt)
  .sort((a, b) => (b.addedAt ?? "").localeCompare(a.addedAt ?? ""));

/** The dated archive is only worth a page when it holds more than the homepage shows. */
export const isNewAppsPagePublished = datedApps.length > RECENT_ON_HOMEPAGE;

export function normalizeSearch(value: string): string {
  return value.toLowerCase().replace(/[\s_\-]+/g, "");
}

export function searchKey(app: AppRecord): string {
  return [app.name, ...app.aliases].map(normalizeSearch).join("|");
}

export const directoryStats = {
  listed: directoryApps.length,
  withIcon: directoryApps.filter((app) => app.image).length,
  checked: directoryApps.filter(isChecked).length,
  detailPages: publishedApps.length,
  withDownload: directoryApps.filter((app) => app.downloadUrl).length,
  /** Download links only render on app pages, so only listed apps count as live. */
  liveAffiliateLinks: publishedApps.filter((app) => app.downloadUrl && app.downloadIsAffiliate).length,
  excluded: allApps.length - directoryApps.length,
  imported: allApps.length,
};
