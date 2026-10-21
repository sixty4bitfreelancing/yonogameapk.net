import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SimplePage } from "@/components/SimplePage";
import { contactCopy } from "@/content/copy";
import { pageTrail } from "@/lib/breadcrumbs";
import { breadcrumbNode, graph, ids, organizationNode, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";
import { staticPages } from "@/lib/pages";
import { site } from "@/lib/site";

const page = staticPages.contact;
const TITLE = contactCopy.title;
const DESCRIPTION = contactCopy.description;

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: page.path });

export default function ContactPage() {
  const trail = pageTrail(page.label, page.path);
  return (
    <>
      <JsonLd
        data={graph(
          organizationNode(),
          webPageNode({
            type: "ContactPage",
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
        {site.contactEmail ? (
          <p>
            Email <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> with corrections to a listing, or if
            you are an app developer and want to confirm details about your app.
          </p>
        ) : (
          <p>
            {site.name} doesn’t offer a public contact channel at the moment. This page will list one as soon as it is
            available.
          </p>
        )}

        <h2>What we can and can’t help with</h2>
        <ul>
          <li>We can correct mistakes in a listing, such as a wrong name, icon or category.</li>
          <li>
            We can’t help with app accounts, deposits, withdrawals, bonuses or login problems. We don’t operate any app,
            so contact the app’s own support team, using the details shown inside the app.
          </li>
          <li>We never ask for passwords, OTPs, UPI PINs or payment details.</li>
        </ul>

        <h2>Before you get in touch</h2>
        <p>
          The <Link href={staticPages.editorialPolicy.path}>editorial policy</Link> explains how listings are sourced and
          checked, and the <Link href={staticPages.installGuide.path}>APK install guide</Link> covers common installation
          problems.
        </p>
      </SimplePage>
    </>
  );
}
