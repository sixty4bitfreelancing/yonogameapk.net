import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { guidesHubCopy, helpGuides } from "@/content/copy";
import { pageTrail } from "@/lib/breadcrumbs";
import { breadcrumbNode, graph, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";
import { staticPages } from "@/lib/pages";

const page = staticPages.guidesHub;

export const metadata = pageMetadata({ title: guidesHubCopy.title, description: guidesHubCopy.description, path: page.path });

export default function GuidesHub() {
  const trail = pageTrail(page.label, page.path);
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode({
            type: "CollectionPage",
            path: page.path,
            name: guidesHubCopy.title,
            description: guidesHubCopy.description,
            dateModified: page.lastModified,
          }),
          breadcrumbNode(page.path, trail),
        )}
      />
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <Breadcrumbs items={trail} />
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{guidesHubCopy.heading}</h1>
        <ul className="mt-6 divide-y divide-gray-200 border-y border-gray-200">
          {helpGuides.map((guide) => (
            <li key={guide.key} className="py-4">
              <Link href={guide.path} className="font-semibold text-blue-700 underline-offset-2 hover:underline">
                {guide.headline}
              </Link>
              <p className="mt-1 text-sm text-gray-700">{guide.description}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-gray-700">
          Every app page links to these guides. Browse{" "}
          <Link href="/#directory" className="text-blue-700 underline">
            all Yono games
          </Link>{" "}
          to find a specific app.
        </p>
      </div>
    </>
  );
}
