import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SimplePage } from "@/components/SimplePage";
import { aboutCopy } from "@/content/copy";
import { directoryStats } from "@/data/apps";
import { pageTrail } from "@/lib/breadcrumbs";
import { breadcrumbNode, graph, ids, organizationNode, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";
import { staticPages } from "@/lib/pages";
import { site } from "@/lib/site";

const page = staticPages.about;
const TITLE = aboutCopy.title;
const DESCRIPTION = aboutCopy.description;

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: page.path });

export default function AboutPage() {
  const trail = pageTrail(page.label, page.path);
  return (
    <>
      <JsonLd
        data={graph(
          organizationNode(),
          webPageNode({
            type: "AboutPage",
            path: page.path,
            name: TITLE,
            description: DESCRIPTION,
            about: { "@id": ids.organization },
            dateModified: page.lastModified,
          }),
          breadcrumbNode(page.path, trail),
        )}
      />
      <SimplePage trail={trail} heading={TITLE}>
        <p>
          {site.name} is an independent directory of Yono-related gaming apps. It brings the scattered app names into
          one list, sorts them by category and explains how to install an APK file carefully.
        </p>
        <h2>What we are not</h2>
        <ul>
          <li>We are not the developer or operator of any app listed here, and we are not affiliated with them.</li>
          <li>We have no connection to any bank or banking app that uses the YONO name.</li>
          <li>We don’t host APK files, take payments or run games.</li>
        </ul>
        <h2>How the directory is built</h2>
        <p>
          The current {directoryStats.listed} listings come from a collection document supplied to us. That document
          doesn’t confirm who publishes each app or where to download it. Every listing has its own page explaining
          what is known, how to play and how to install safely, and each page says whether it has been independently
          checked. Developer details and download links are added only after a check. App tiles and banners are our own
          illustrations, not official app icons.
        </p>
        <h2>Who we are</h2>
        {site.editors.length ? (
          <ul>
            {site.editors.map((editor) => (
              <li key={editor.name}>
                <strong>{editor.name}</strong>, {editor.role}. {editor.bio}
              </li>
            ))}
          </ul>
        ) : (
          <p>
            {site.name} is run by a small editorial team. Individual editor profiles will be published here; until then,
            content is credited to the team.
          </p>
        )}
        <p>
          The <Link href={staticPages.editorialPolicy.path}>editorial policy and research method</Link> explains how
          listings are checked, what we publish, how affiliate links are handled and how to report a correction. For
          help with an app, see the <Link href={staticPages.guidesHub.path}>help guides</Link>, or browse the{" "}
          <Link href="/#directory">full list of Yono games</Link>.
        </p>
      </SimplePage>
    </>
  );
}
