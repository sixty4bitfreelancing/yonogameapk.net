import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { helpGuides, type HelpGuide } from "@/content/copy";
import { guideTrail } from "@/lib/breadcrumbs";
import { formatDate } from "@/lib/format";
import { articleNode, breadcrumbNode, graph, howToNode, ids, organizationNode, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";
import { Breadcrumbs } from "./Breadcrumbs";
import { JsonLd } from "./JsonLd";

export function guideMetadata(guide: HelpGuide): Metadata {
  return pageMetadata({
    title: guide.metaTitle,
    description: guide.description,
    path: guide.path,
    article: { publishedTime: guide.datePublished, modifiedTime: guide.dateModified },
  });
}

export function byline(): string {
  return site.editors.length
    ? `By ${site.editors.map((e) => e.name).join(" and ")}`
    : `By the ${site.name} editorial team`;
}

interface GuideArticleProps {
  guide: HelpGuide;
  /** Steps rendered as the page's main ordered list and marked up as HowTo, word for word. */
  steps?: { heading: string; items: string[] };
  intro: ReactNode;
  children?: ReactNode;
}

export function GuideArticle({ guide, steps, intro, children }: GuideArticleProps) {
  const trail = guideTrail(guide);
  const others = helpGuides.filter((g) => g.key !== guide.key);
  return (
    <>
      <JsonLd
        data={graph(
          organizationNode(),
          webPageNode({
            path: guide.path,
            name: guide.headline,
            description: guide.description,
            mainEntity: { "@id": ids.article(guide.path) },
            dateModified: guide.dateModified,
          }),
          breadcrumbNode(guide.path, trail),
          articleNode({
            path: guide.path,
            headline: guide.headline,
            description: guide.description,
            datePublished: guide.datePublished,
            dateModified: guide.dateModified,
          }),
          steps ? howToNode(guide.path, "steps", steps.heading, steps.items) : null,
        )}
      />
      <article className="mx-auto max-w-3xl px-4 pt-4">
        <Breadcrumbs items={trail} />
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{guide.headline}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {byline()} · Published {formatDate(guide.datePublished)}
          {guide.dateModified !== guide.datePublished ? ` · Updated ${formatDate(guide.dateModified)}` : ""}
        </p>
        <div className="prose-basic mt-6">
          {intro}
          {steps ? (
            <>
              <h2>{steps.heading}</h2>
              <ol id="steps">
                {steps.items.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </>
          ) : null}
          {children}
          <h2>Related help</h2>
          <ul>
            {others.map((g) => (
              <li key={g.key}>
                <Link href={g.path}>{g.label}</Link>
              </li>
            ))}
          </ul>
          <p>
            Looking for a specific app? Browse <Link href="/#directory">all Yono games</Link>; each app page links to
            the guides that apply to it.
          </p>
        </div>
      </article>
    </>
  );
}
