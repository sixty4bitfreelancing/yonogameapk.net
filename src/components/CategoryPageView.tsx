import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { categoryCopy, helpGuides } from "@/content/copy";
import { appPath, getListing } from "@/data/apps";
import { listingTrail } from "@/lib/breadcrumbs";
import { breadcrumbNode, graph, ids, itemListNode, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";
import { markdownPathFor } from "@/lib/published-urls";
import { AppGrid } from "./AppGrid";
import { Breadcrumbs } from "./Breadcrumbs";
import { JsonLd } from "./JsonLd";

interface CategoryPageViewProps {
  /** Category id or name-collection id, e.g. "rummy" or "777". */
  listingId: string;
  guidanceHeading: string;
  guidance: ReactNode;
}

function requireCopy(id: string) {
  const copy = categoryCopy[id];
  if (!copy) throw new Error(`No page copy for listing "${id}" in src/content/copy.ts`);
  return copy;
}

export function categoryPageMetadata(listingId: string): Metadata {
  const listing = getListing(listingId);
  if (!listing) return {};
  const copy = requireCopy(listingId);
  return pageMetadata({
    title: copy.title,
    description: copy.description,
    path: listing.path,
    markdownPath: markdownPathFor(listing.path),
  });
}

export function CategoryPageView({ listingId, guidanceHeading, guidance }: CategoryPageViewProps) {
  const listing = getListing(listingId);
  if (!listing) notFound();
  const { path, apps } = listing;
  const { title, description, heading } = requireCopy(listingId);
  const trail = listingTrail(listing);

  return (
    <>
      <JsonLd
        data={graph(
          webPageNode({
            type: "CollectionPage",
            path,
            name: title,
            description,
            mainEntity: { "@id": ids.itemList(path) },
          }),
          breadcrumbNode(path, trail),
          itemListNode(path, heading, apps, appPath),
        )}
      />
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <Breadcrumbs items={trail} />
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{heading}</h1>

        <section aria-labelledby="listings-heading" className="py-6">
          <h2 id="listings-heading" className="sr-only">
            {apps.length} {listing.label} app listings
          </h2>
          <AppGrid apps={apps} eagerCount={8} showCategory={listing.kind === "collection"} />
        </section>

        <section aria-labelledby="guidance-heading" className="max-w-3xl py-6">
          <h2 id="guidance-heading" className="text-xl font-semibold text-gray-900">
            {guidanceHeading}
          </h2>
          <div className="prose-basic mt-2 text-sm">{guidance}</div>
        </section>

        <section aria-labelledby="help-heading" className="max-w-3xl py-6">
          <h2 id="help-heading" className="text-xl font-semibold text-gray-900">
            Help with these apps
          </h2>
          <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {helpGuides.map((guide) => (
              <li key={guide.key}>
                <Link href={guide.path} className="text-blue-700 underline-offset-2 hover:underline">
                  {guide.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-gray-700">
            Looking for a different app? Browse{" "}
            <Link href="/#directory" className="text-blue-700 underline">
              all Yono games
            </Link>
            .
          </p>
        </section>
      </div>
    </>
  );
}
