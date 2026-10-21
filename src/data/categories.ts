import type { AppCategory } from "./types";

export interface CategoryInfo {
  id: AppCategory;
  label: string;
  /** Route of the category page, or null when the category is filter-only. */
  path: string | null;
  pageTitle: string | null;
  basis: string;
}

export const categories: Record<AppCategory, CategoryInfo> = {
  rummy: {
    id: "rummy",
    label: "Rummy",
    path: "/rummy-apps/",
    pageTitle: "Rummy apps",
    basis: "Name includes “Rummy”",
  },
  slots: {
    id: "slots",
    label: "Slots",
    path: "/slots-apps/",
    pageTitle: "Slots apps",
    basis: "Name includes “Slots”",
  },
  spin: {
    id: "spin",
    label: "Spin",
    path: "/spin-games/",
    pageTitle: "Spin games",
    basis: "Name includes “Spin” (could mean reels, a wheel or just branding)",
  },
  bingo: {
    id: "bingo",
    label: "Bingo",
    path: null,
    pageTitle: null,
    basis: "Name includes “Bingo”",
  },
  general: {
    id: "general",
    label: "Other",
    path: null,
    pageTitle: null,
    basis: "Name does not indicate a game type",
  },
  collection: {
    id: "collection",
    label: "Collection label",
    path: null,
    pageTitle: null,
    basis: "Names a directory or collection, not one app",
  },
};

/** Display order for filters and the overview table. */
export const categoryOrder: AppCategory[] = ["rummy", "slots", "spin", "bingo", "general"];

/** A category page is published only when it has enough listings to be worth browsing. */
export const MIN_CATEGORY_PAGE_LISTINGS = 3;

/**
 * Cross-category listing pages selected by a word in the app name. An app keeps its single
 * category; collections only group apps that share a naming pattern.
 */
export interface NameCollection {
  id: string;
  label: string;
  path: string;
  pageTitle: string;
  basis: string;
  pattern: RegExp;
}

export const nameCollections: NameCollection[] = [
  {
    id: "777",
    label: "777",
    path: "/777-games/",
    pageTitle: "777 games",
    basis: "Name includes “777”",
    pattern: /777/,
  },
];
