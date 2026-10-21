import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SimplePage } from "@/components/SimplePage";
import { editorialCopy, helpGuide } from "@/content/copy";
import { directoryStats } from "@/data/apps";
import { pageTrail } from "@/lib/breadcrumbs";
import { breadcrumbNode, graph, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";
import { staticPages } from "@/lib/pages";
import { site } from "@/lib/site";

const page = staticPages.editorialPolicy;
const TITLE = editorialCopy.title;
const DESCRIPTION = editorialCopy.description;

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: page.path });

export default function EditorialPolicyPage() {
  const trail = pageTrail(page.label, page.path);
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode({ path: page.path, name: TITLE, description: DESCRIPTION, dateModified: page.lastModified }),
          breadcrumbNode(page.path, trail),
        )}
      />
      <SimplePage trail={trail} heading={TITLE}>
        <h2 id="research-method">Research method</h2>
        <ol>
          <li>
            <strong>Import.</strong> Listings start from material supplied to us: a collection document of app names.
            Importing a name doesn’t make anything about it accurate, so every field records where it came from.
          </li>
          <li>
            <strong>Categorise by name.</strong> Rummy, slots, spin and bingo categories, and collections such as “777
            games”, are based only on the words in the app’s name.
          </li>
          <li>
            <strong>Separate similar names.</strong> Names that are near-identical, or differ by one letter (such as IND
            Rummy and INR Rummy), are kept as separate listings and cross-labelled, because nothing shows they are the
            same app.
          </li>
          <li>
            <strong>Check independently.</strong> A check means we confirm the developer and official website or store
            listing ourselves, look at the download source, and record what we saw with the date. Only then do developer
            details, a factual summary and a download link appear.
          </li>
          <li>
            <strong>Record third-party claims as claims.</strong> Bonus and minimum-withdrawal figures come from another
            website and are shown with that source and the date it was checked. Store ratings are shown only with the
            store page they came from.
          </li>
        </ol>
        <p>
          Currently {directoryStats.checked} of {directoryStats.listed} listings have been independently checked. Each
          app page says which of its details are confirmed and which are not.
        </p>

        <h2 id="dates">How dates are shown</h2>
        <ul>
          <li><strong>Page last updated</strong> — when we last changed the page’s content.</li>
          <li><strong>Page last checked</strong> — when we last independently checked the app’s details.</li>
          <li>
            <strong>App last updated</strong> — the app’s own release or update date, shown only when a source
            publishes it. We have not found one for any app yet, and we never estimate it.
          </li>
        </ul>

        <h2 id="who">Who researches and edits the directory</h2>
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
            Listings and guides are prepared by the {site.name} editorial team. Individual editor profiles will be listed
            here once they are published.
          </p>
        )}

        <h2 id="what-we-publish">What we publish and what we don’t</h2>
        <ul>
          <li>
            <strong>Ratings:</strong> visitor ratings given on this site, labelled as visitors’ opinions, and store
            ratings shown with a link to the store page and the date checked. Only visitor ratings are used in search
            markup, and we never add votes of our own.
          </li>
          <li>
            <strong>Editor Score:</strong> our own overall score out of 5 for some apps, set by our editors. It is
            always labelled “Editor Score”, shown separately from visitor ratings, and is an opinion rather than a
            measurement or a test result.
          </li>
          <li>
            <strong>Bonus and withdrawal details:</strong> attributed claims, plus an app’s actual conditions only when
            we can cite its terms. See{" "}
            <Link href={helpGuide("withdrawal").path}>understanding withdrawal conditions</Link>.
          </li>
          <li>No “official”, “safe”, “trusted” or “verified” labels without evidence.</li>
          <li>No promises of winnings or guaranteed results.</li>
          <li>No invented dates, versions, screenshots, file sizes or download counts.</li>
        </ul>

        <h2 id="illustrations">Illustrations</h2>
        <p>
          App tiles and page banners are illustrations made by {site.name} to identify each listing. They show the
          app’s name, but they are not the apps’ official icons or artwork, and they are labelled that way.
        </p>

        <h2 id="affiliate">Download and affiliate links</h2>
        <p>
          We don’t host APK files. A download button appears only when a real destination for that app has been
          supplied, and it says whether we have checked that the destination belongs to the app. Guessed URLs are never
          used, and external links are labelled as external.
        </p>
        <p>
          {directoryStats.liveAffiliateLinks > 0
            ? "Some download links are affiliate links. They are labelled on the page, marked rel=\"sponsored\", and we may earn a commission when you use them. Affiliate status doesn’t affect whether or how an app is listed."
            : "At present the site contains no affiliate or sponsored links. If that changes, affiliate links will be labelled on the page and marked rel=\"sponsored\", and this policy will be updated."}
        </p>

        <h2 id="corrections">Corrections and reports</h2>
        <p>
          Every app page has a form for reporting a broken link, a link that now points somewhere else, or wrong
          information. We review each report and check the claim. When a correction is confirmed, we update the page and
          record the change with its date in the page’s verification notes.
        </p>
        <p>
          Reports contain only what you type and the date; see the <Link href={staticPages.privacy.path}>privacy policy</Link>.
        </p>
      </SimplePage>
    </>
  );
}
