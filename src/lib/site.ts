export const site = {
  url: "https://yonogameapk.net",
  name: "Yono Game APK",
  language: "en",
  locale: "en_IN",
  tagline: "Independent directory of Yono-related apps and APK install guides",
  /** Public contact address. Contact and policy pages stay unpublished drafts until this is set. */
  contactEmail: null as string | null,
  /** Legal name of the operator, if one exists. Never shown or marked up while null. */
  operatorLegalName: null as string | null,
  /**
   * Real people who research and edit the directory. Shown on About, the editorial policy and
   * guide bylines. While empty, content is credited to the editorial team. Never add placeholder people.
   */
  editors: [] as { name: string; role: string; bio: string }[],
  /** Public IndexNow key; must match public/<key>.txt. Generated once; changing it requires a new key file. */
  indexNowKey: "6e8b715593bc803ae6c732afcc4f6cc5",
  logo: { path: "/brand/logo.webp", width: 1254, height: 1254 },
  ogImage: {
    path: "/brand/og-default.jpg",
    width: 1200,
    height: 630,
    alt: "Yono Game APK logo with yonogameapk.net",
  },
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}
