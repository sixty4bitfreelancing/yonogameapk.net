import { helpGuides } from "@/content/copy";
import { isNewAppsPagePublished, publishedListings } from "@/data/apps";

export type PageStatus = "published" | "draft";

export interface StaticPage {
  path: string;
  label: string;
  status: PageStatus;
  /** Date the page content last changed. Update by hand when editing the page. */
  lastModified: string;
}

export const staticPages = {
  home: { path: "/", label: "Home", status: "published", lastModified: "2026-10-21" },
  guidesHub: { path: "/guides/", label: "Help guides", status: "published", lastModified: "2026-10-21" },
  installGuide: {
    path: "/guides/install-apk/",
    label: "APK install guide",
    status: "published",
    lastModified: "2026-10-21",
  },
  about: { path: "/about/", label: "About", status: "published", lastModified: "2026-10-21" },
  editorialPolicy: {
    path: "/editorial-policy/",
    label: "Editorial policy & research method",
    status: "published",
    lastModified: "2026-10-21",
  },
  contact: { path: "/contact/", label: "Contact", status: "published", lastModified: "2026-10-21" },
  telegram: { path: "/telegram/", label: "Telegram", status: "published", lastModified: "2026-10-21" },
  disclaimer: { path: "/disclaimer/", label: "Disclaimer", status: "published", lastModified: "2026-10-21" },
  responsibleGaming: {
    path: "/responsible-gaming/",
    label: "Responsible gaming",
    status: "published",
    lastModified: "2026-10-21",
  },
  privacy: { path: "/privacy-policy/", label: "Privacy policy", status: "published", lastModified: "2026-10-21" },
  terms: { path: "/terms/", label: "Terms of use", status: "published", lastModified: "2026-10-21" },
} satisfies Record<string, StaticPage>;

export const NEW_APPS_PATH = "/new-yono-games/";

export interface NavLink {
  href: string;
  label: string;
}

const published = (page: StaticPage) => page.status === "published";

export function primaryNav(): NavLink[] {
  return [
    { href: "/", label: "Home" },
    ...publishedListings.map((l) => ({ href: l.path, label: l.pageTitle })),
    ...(isNewAppsPagePublished ? [{ href: NEW_APPS_PATH, label: "New apps" }] : []),
    { href: staticPages.guidesHub.path, label: "Help guides" },
    { href: staticPages.telegram.path, label: "Telegram" },
    { href: staticPages.about.path, label: "About" },
  ];
}

export function footerNav(): { heading: string; links: NavLink[] }[] {
  const links = (pages: StaticPage[]) => pages.filter(published).map((p) => ({ href: p.path, label: p.label }));
  return [
    {
      heading: "Directory",
      links: [
        { href: "/", label: "All Yono games" },
        ...publishedListings.map((l) => ({ href: l.path, label: l.pageTitle })),
        ...(isNewAppsPagePublished ? [{ href: NEW_APPS_PATH, label: "New Yono games" }] : []),
      ],
    },
    {
      heading: "Help guides",
      links: [
        { href: staticPages.guidesHub.path, label: "All help guides" },
        ...helpGuides.map((g) => ({ href: g.path, label: g.label })),
      ],
    },
    {
      heading: "About this site",
      links: links([staticPages.about, staticPages.telegram, staticPages.contact, staticPages.editorialPolicy]),
    },
    {
      heading: "Legal",
      links: links([staticPages.disclaimer, staticPages.responsibleGaming, staticPages.privacy, staticPages.terms]),
    },
  ];
}
