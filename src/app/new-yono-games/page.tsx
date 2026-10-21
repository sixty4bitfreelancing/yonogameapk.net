import Link from "next/link";
import { notFound } from "next/navigation";
import { AppGrid } from "@/components/AppGrid";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { newAppsCopy } from "@/content/copy";
import { appPath, datedApps, isNewAppsPagePublished } from "@/data/apps";
import type { AppRecord } from "@/data/types";
import { pageTrail } from "@/lib/breadcrumbs";
import { breadcrumbNode, graph, ids, itemListNode, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";
import { NEW_APPS_PATH } from "@/lib/pages";

const TITLE = newAppsCopy.title;
const DESCRIPTION = newAppsCopy.description;

/** Re-render hourly so visitor ratings on the app cards stay current. */
export const revalidate = 3600;

export const metadata = isNewAppsPagePublished
  ? pageMetadata({ title: TITLE, description: DESCRIPTION, path: NEW_APPS_PATH })
  : {};

function groupByMonth(apps: AppRecord[]): [string, AppRecord[]][] {
  const groups = new Map<string, AppRecord[]>();
  for (const app of apps) {
    const key = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(
      new Date(app.addedAt as string),
    );
    groups.set(key, [...(groups.get(key) ?? []), app]);
  }
  return [...groups.entries()];
}

export default function NewYonoGamesPage() {
  if (!isNewAppsPagePublished) notFound();
  const trail = pageTrail("New Yono games", NEW_APPS_PATH);
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode({
            type: "CollectionPage",
            path: NEW_APPS_PATH,
            name: TITLE,
            description: DESCRIPTION,
            mainEntity: { "@id": ids.itemList(NEW_APPS_PATH) },
          }),
          breadcrumbNode(NEW_APPS_PATH, trail),
          itemListNode(NEW_APPS_PATH, "Recently added Yono games", datedApps, appPath),
        )}
      />
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <Breadcrumbs items={trail} />
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">New Yono Games</h1>
        <p className="mt-2 max-w-3xl text-gray-700">
          Apps listed by the date they were added to the directory. For every app, see the{" "}
          <Link href="/#directory" className="text-blue-700 underline">
            full Yono games list
          </Link>
          .
        </p>
        {groupByMonth(datedApps).map(([month, apps]) => (
          <section key={month} className="py-6">
            <h2 className="text-xl font-semibold text-gray-900">Added in {month}</h2>
            <div className="mt-3">
              <AppGrid apps={apps} />
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
