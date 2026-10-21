import type { HelpGuide } from "@/content/copy";
import { appPath, categoryPath, type Listing } from "@/data/apps";
import { categories } from "@/data/categories";
import type { AppCategory, AppRecord } from "@/data/types";

export interface Crumb {
  name: string;
  path: string;
}

export const homeCrumb: Crumb = { name: "Home", path: "/" };
export const guidesCrumb: Crumb = { name: "Help guides", path: "/guides/" };

export function pageTrail(name: string, path: string): Crumb[] {
  return [homeCrumb, { name, path }];
}

export function listingTrail(listing: Listing): Crumb[] {
  return [homeCrumb, { name: listing.pageTitle, path: listing.path }];
}

export function categoryTrail(category: AppCategory): Crumb[] {
  const path = categoryPath(category);
  const title = categories[category].pageTitle;
  return path && title ? [homeCrumb, { name: title, path }] : [homeCrumb];
}

export function appTrail(app: AppRecord): Crumb[] {
  const path = appPath(app);
  return path ? [...categoryTrail(app.category), { name: app.name, path }] : [homeCrumb];
}

export function guideTrail(guide: HelpGuide): Crumb[] {
  return [homeCrumb, guidesCrumb, { name: guide.label, path: guide.path }];
}
