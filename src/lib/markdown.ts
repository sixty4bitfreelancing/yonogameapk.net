import { categoryCopy, homeCopy, sourcesSummary } from "@/content/copy";
import { appPath, categoryPath, directoryApps, directoryStats, getListing } from "@/data/apps";
import { categories, categoryOrder } from "@/data/categories";
import type { AppRecord } from "@/data/types";
import { staticPages } from "./pages";
import { publishedUrls, type PublishedUrl } from "./published-urls";
import { absoluteUrl, site } from "./site";

function escapeText(value: string): string {
  return value.replace(/([\\`*_[\]<>#|])/g, "\\$1");
}

const link = (text: string, url: string) => `[${escapeText(text)}](${url})`;

function listingLine(app: AppRecord): string {
  const path = appPath(app);
  const name = path ? link(app.name, absoluteUrl(path)) : escapeText(app.name);
  return `- ${name}${app.summary ? `: ${escapeText(app.summary)}` : ""}`;
}

function entryLine(entry: PublishedUrl, title = entry.title): string {
  return `- ${link(title, entry.url)}${entry.description ? `: ${entry.description}` : ""}`;
}

/** Markdown version of the homepage directory. */
export function homeMarkdown(): string {
  const home = publishedUrls().find((entry) => entry.kind === "home") as PublishedUrl;
  const lines = [
    `# ${homeCopy.h1}`,
    "",
    `Canonical page: ${home.url}`,
    ...(home.lastModified ? [`Last updated: ${home.lastModified}`] : []),
    "",
  ];
  for (const id of categoryOrder) {
    const apps = directoryApps.filter((app) => app.category === id);
    if (!apps.length) continue;
    const path = categoryPath(id);
    lines.push(`## ${categories[id].label} (${apps.length})`, "");
    if (path) lines.push(`Category page: ${link(categories[id].pageTitle as string, absoluteUrl(path))}`, "");
    lines.push(...apps.map(listingLine), "");
  }
  lines.push(
    "## Sources and limitations",
    "",
    sourcesSummary(),
    "",
    `Installation help: ${link("How to download and install an APK file on Android", absoluteUrl(staticPages.installGuide.path))}`,
    "",
  );
  return lines.join("\n");
}

/** Markdown version of a category or collection page. */
export function categoryMarkdown(listingId: string): string | null {
  const listing = getListing(listingId);
  const copy = categoryCopy[listingId];
  if (!listing || !copy) return null;
  const { path, apps } = listing;
  return [
    `# ${copy.heading}`,
    "",
    `Canonical page: ${absoluteUrl(path)}`,
    "",
    `## ${apps.length} ${listing.label} app listings`,
    "",
    ...apps.map(listingLine),
    "",
    "## See also",
    "",
    `- ${link("Full Yono games directory", absoluteUrl("/"))}`,
    `- ${link("How to download and install an APK file on Android", absoluteUrl(staticPages.installGuide.path))}`,
    "",
  ].join("\n");
}

/** /llms.txt following the llmstxt.org proposal: H1, blockquote summary, context, then H2 link lists. */
export function llmsTxt(): string {
  const entries = publishedUrls();
  const byKind = (kind: PublishedUrl["kind"]) => entries.filter((entry) => entry.kind === kind);
  const home = byKind("home")[0];

  const sections: [string, string[]][] = [
    [
      "Directory",
      [
        entryLine(home, "All Yono games list"),
        ...byKind("category").map((entry) => entryLine(entry)),
        ...byKind("archive").map((entry) => entryLine(entry)),
      ],
    ],
    ["Guides", byKind("guide").map((entry) => entryLine(entry))],
    ["About", byKind("page").map((entry) => entryLine(entry))],
    [
      "Optional",
      entries
        .filter((entry) => entry.markdownPath)
        .map((entry) => `- ${link(`${entry.kind === "home" ? "Full directory" : entry.title} (Markdown)`, absoluteUrl(entry.markdownPath as string))}: Plain Markdown version of ${entry.url}`),
    ],
  ];

  const lines = [
    `# ${site.name}`,
    "",
    `> Independent directory of Yono-related gaming apps, with a guide to installing APK files on Android. ${site.name} is not run by or affiliated with any app developer or with any bank's YONO app, and it does not host APK files.`,
    "",
    `The directory currently lists ${directoryStats.listed} apps. ${sourcesSummary()}`,
    "",
    `Each listed app has its own page under ${absoluteUrl("/apps/")} covering what it is, how to play, safety checks and Android/iPhone installation; all ${byKind("app").length} are linked from the directory and its Markdown version below.`,
    "",
  ];
  for (const [heading, items] of sections) {
    if (!items.length) continue;
    lines.push(`## ${heading}`, "", ...items, "");
  }
  return lines.join("\n");
}

export function markdownResponse(body: string, canonicalUrl: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Robots-Tag": "noindex",
      Link: `<${canonicalUrl}>; rel="canonical"`,
    },
  });
}
