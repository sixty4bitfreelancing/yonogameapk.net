import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SimplePage } from "@/components/SimplePage";
import { termsCopy } from "@/content/copy";
import { pageTrail } from "@/lib/breadcrumbs";
import { formatDate } from "@/lib/format";
import { breadcrumbNode, graph, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";
import { staticPages } from "@/lib/pages";
import { site } from "@/lib/site";

const page = staticPages.terms;

export const metadata = pageMetadata({
  title: termsCopy.title,
  description: termsCopy.description,
  path: page.path,
});

export default function TermsPage() {
  const trail = pageTrail(page.label, page.path);
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode({ path: page.path, name: termsCopy.title, description: termsCopy.description, dateModified: page.lastModified }),
          breadcrumbNode(page.path, trail),
        )}
      />
      <SimplePage trail={trail} heading="Terms of Use">
        <p className="text-sm text-gray-600">Last updated {formatDate(page.lastModified)}</p>
        <p>By using {site.name} you agree to these terms. If you don’t agree, please don’t use the site.</p>

        <h2>What this site is</h2>
        <p>
          {site.name} is an information directory. It doesn’t host, sell, distribute or operate any app or game, doesn’t
          accept payments, and isn’t affiliated with the developers of the apps listed. See the{" "}
          <Link href={staticPages.disclaimer.path}>disclaimer</Link> for details.
        </p>

        <h2>Information on the site</h2>
        <ul>
          <li>
            Content is provided for general information only. Listings may be incomplete, out of date or wrong, and
            each app page states whether it has been independently checked.
          </li>
          <li>Nothing on the site is financial, legal or professional advice.</li>
          <li>
            The site is provided “as is”, without warranties of any kind. To the extent permitted by law, {site.name} is
            not liable for losses arising from your use of the site or of any app or website it mentions.
          </li>
        </ul>

        <h2>Your responsibilities</h2>
        <ul>
          <li>
            You are responsible for checking that installing and using any app is lawful where you live. India’s
            Promotion and Regulation of Online Gaming Act, 2025 prohibits offering online money games.
          </li>
          <li>You must meet any minimum age set by an app or by law before using it.</li>
          <li>Don’t use the site for anything unlawful, or try to disrupt or overload it.</li>
        </ul>

        <h2>External links</h2>
        <p>
          Links to other websites are provided for convenience. We don’t control those sites, and their own terms and
          policies apply when you use them.
        </p>

        <h2>Names, icons and content</h2>
        <p>
          App names, logos and icons belong to their respective owners and are shown only to identify the apps. Text
          and design created for this site may not be copied in bulk without permission.
        </p>

        <h2>Changes</h2>
        <p>
          These terms may change. The date above shows the latest version; continuing to use the site means you accept
          the updated terms.
        </p>
      </SimplePage>
    </>
  );
}
