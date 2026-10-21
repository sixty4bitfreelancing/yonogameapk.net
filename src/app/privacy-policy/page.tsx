import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SimplePage } from "@/components/SimplePage";
import { privacyCopy } from "@/content/copy";
import { pageTrail } from "@/lib/breadcrumbs";
import { formatDate } from "@/lib/format";
import { breadcrumbNode, graph, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";
import { staticPages } from "@/lib/pages";
import { site } from "@/lib/site";

const page = staticPages.privacy;

export const metadata = pageMetadata({
  title: privacyCopy.title,
  description: privacyCopy.description,
  path: page.path,
});

export default function PrivacyPolicyPage() {
  const trail = pageTrail(page.label, page.path);
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode({ path: page.path, name: privacyCopy.title, description: privacyCopy.description, dateModified: page.lastModified }),
          breadcrumbNode(page.path, trail),
        )}
      />
      <SimplePage trail={trail} heading="Privacy Policy">
        <p className="text-sm text-gray-600">Last updated {formatDate(page.lastModified)}</p>
        <p>
          This policy explains what information is handled when you visit {site.name} ({site.url.replace("https://", "")}),
          an independent directory of Yono-related gaming apps.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>The site has no accounts, sign-up forms, comments, newsletters or payments, so we don’t ask you for personal information.</li>
          <li>The site doesn’t use analytics, advertising or tracking scripts, and doesn’t set cookies of its own.</li>
          <li>The category filters run entirely in your browser. Nothing you choose there is sent to us.</li>
        </ul>

        <h2>Problem reports</h2>
        <p>
          If you report a broken link or wrong information, we store what you type in the form (the problem type, an
          optional link and your description) with the date it was received. We don’t store your IP address with a
          report. Please don’t include personal details.
        </p>

        <h2>App ratings</h2>
        <p>
          Where an app page offers visitor star ratings, you can rate it without an account. When you do, we store the star rating with a random identifier that
          your browser creates and keeps in its local storage, so you can change your rating later instead of adding a
          second one. Your browser also remembers which rating you gave. We don’t store your IP address with ratings; a
          one-way hash of it is held briefly in server memory to limit how many ratings one network can send.
        </p>
        <p>
          Clearing your browser’s site data removes the identifier and your saved rating from your device; the rating
          itself stays in the app’s average.
        </p>

        <h2>Server logs</h2>
        <p>
          Like most websites, the service that hosts this site may automatically record technical information about
          requests, such as IP address, browser type, the page requested and the time of the request. These logs are
          used to keep the site running and secure, and are handled under the hosting provider’s own policies.
        </p>

        <h2>External links</h2>
        <p>
          Pages may link to other websites, including app download pages. Those sites have their own privacy practices,
          which this policy doesn’t cover. Apps you install collect information under their own terms; read their
          privacy policies before installing or registering.
        </p>

        <h2>Children</h2>
        <p>
          This site is not directed at children. Many apps listed in the directory are intended for adults only.
        </p>

        <h2>Your rights</h2>
        <p>
          Ratings aren’t linked to your name, account or IP address, so we can’t identify which rating is yours apart
          from the random identifier stored in your browser. Data protection laws, including India’s Digital Personal Data Protection Act, 2023, may
          give you rights over information held by the hosting provider or by apps you use.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          If the site starts collecting more information, for example through analytics or a contact form, this policy
          will be updated before that happens and the date above will change.
        </p>

        <h2>Contact</h2>
        <p>
          See the <Link href={staticPages.contact.path}>contact page</Link> for the current contact options.
        </p>
      </SimplePage>
    </>
  );
}
