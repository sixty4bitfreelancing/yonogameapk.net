import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SimplePage } from "@/components/SimplePage";
import { disclaimerCopy } from "@/content/copy";
import { directoryStats } from "@/data/apps";
import { pageTrail } from "@/lib/breadcrumbs";
import { formatDate } from "@/lib/format";
import { breadcrumbNode, graph, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";
import { staticPages } from "@/lib/pages";
import { site } from "@/lib/site";

const page = staticPages.disclaimer;

export const metadata = pageMetadata({ title: disclaimerCopy.title, description: disclaimerCopy.description, path: page.path });

export default function DisclaimerPage() {
  const trail = pageTrail(page.label, page.path);
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode({ path: page.path, name: disclaimerCopy.title, description: disclaimerCopy.description, dateModified: page.lastModified }),
          breadcrumbNode(page.path, trail),
        )}
      />
      <SimplePage trail={trail} heading="Disclaimer">
        <p className="text-sm text-gray-600">Last updated {formatDate(page.lastModified)}</p>

        <h2>Independent directory</h2>
        <p>
          {site.name} is not operated by, endorsed by or affiliated with the developers or operators of any app listed
          here. It has no connection to State Bank of India, its YONO banking app, or any other bank or financial
          service that uses the YONO name.
        </p>

        <h2>No downloads or games hosted</h2>
        <p>
          We don’t host APK files, run games, hold balances or process payments. Any download link on the site points
          to an external website that we don’t control.
        </p>

        <h2>Accuracy of information</h2>
        <p>
          App listings start from material supplied to us and are marked as unchecked until we verify them. Currently{" "}
          {directoryStats.checked} of {directoryStats.listed} listings have been independently checked. Apps change
          their names, rules and terms without notice, so always rely on the app’s own rules and terms. See our{" "}
          <Link href={staticPages.editorialPolicy.path}>editorial policy</Link>.
        </p>

        <h2>Bonus and withdrawal figures</h2>
        <p>
          Sign-up bonus and minimum-withdrawal figures on app pages are claims published by another website, shown
          with the date they were checked. We haven’t confirmed them with the operators; bonuses usually
          carry conditions, and the app’s own terms always apply.
        </p>

        <h2>Visitor ratings</h2>
        <p>
          Star ratings on app pages are submitted anonymously by visitors and reflect their opinions only. They aren’t
          verified and aren’t a recommendation from {site.name}.
        </p>

        <h2>Editor Score</h2>
        <p>
          An Editor Score is {site.name}’s own opinion of an app, out of 5. It isn’t a test result, a safety rating or
          a promise about bonuses or withdrawals, and it isn’t based on visitor votes.
        </p>

        <h2>No guarantees about apps</h2>
        <p>
          A listing is not a recommendation. We don’t guarantee that any app is safe, lawful where you live, fair, or that
          it pays out bonuses or withdrawals. Games involving money carry a real risk of loss.
        </p>

        <h2>Legal status</h2>
        <p>
          India’s Promotion and Regulation of Online Gaming Act, 2025 prohibits offering online money games. You are
          responsible for checking the law that applies to you before installing or using any app.
        </p>

        <h2>Trademarks</h2>
        <p>
          App names, logos and icons belong to their respective owners and are used only to identify the apps being
          described.
        </p>

        <h2>Affiliate links</h2>
        <p>
          {directoryStats.liveAffiliateLinks > 0
            ? "Some download links are affiliate links. They are labelled on the page and we may earn a commission when you use them."
            : "The site currently contains no affiliate or sponsored links. If that changes, such links will be labelled."}
        </p>
      </SimplePage>
    </>
  );
}
