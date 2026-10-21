import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { guideCopy, helpGuide } from "@/content/copy";
import { byline } from "@/components/GuideArticle";
import { publishedListings } from "@/data/apps";
import { guideTrail } from "@/lib/breadcrumbs";
import { formatDate } from "@/lib/format";
import { articleNode, breadcrumbNode, graph, howToNode, ids, organizationNode, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";
import { staticPages } from "@/lib/pages";
const page = staticPages.installGuide;
const PUBLISHED = guideCopy.datePublished;
const HEADLINE = guideCopy.headline;
const DESCRIPTION = guideCopy.description;

const INSTALL_STEPS = [
  "Download the APK file in your browser. Android may warn that the file type can be harmful.",
  "Open the file from the download notification or from the Downloads folder in your file manager.",
  "If Android says your browser or file manager isn’t allowed to install unknown apps, tap Settings and turn on Allow from this source. On Android 8.0 and later this permission is given to one app at a time. You can also find it under Settings → Apps → Special app access → Install unknown apps; exact menu names vary by phone maker. Older Android versions use a single Unknown sources switch under Security settings.",
  "Go back and tap Install.",
  "If Google Play Protect warns that the app is harmful, don’t install it. A Play Protect warning about an unknown developer is different: it means Google hasn’t seen the app before, not that it is safe or unsafe.",
];

export const metadata = pageMetadata({
  title: guideCopy.metaTitle,
  description: DESCRIPTION,
  path: page.path,
  article: { publishedTime: PUBLISHED, modifiedTime: page.lastModified },
});

export default function InstallApkGuidePage() {
  const trail = guideTrail(helpGuide("install"));
  return (
    <>
      <JsonLd
        data={graph(
          organizationNode(),
          webPageNode({
            path: page.path,
            name: HEADLINE,
            description: DESCRIPTION,
            mainEntity: { "@id": ids.article(page.path) },
            dateModified: page.lastModified,
          }),
          breadcrumbNode(page.path, trail),
          articleNode({
            path: page.path,
            headline: HEADLINE,
            description: DESCRIPTION,
            datePublished: PUBLISHED,
            dateModified: page.lastModified,
          }),
          howToNode(page.path, "install-steps", "How to install an APK file on Android", INSTALL_STEPS),
        )}
      />
      <article className="mx-auto max-w-3xl px-4 pt-4">
        <Breadcrumbs items={trail} />
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{HEADLINE}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {byline()} · Published {formatDate(PUBLISHED)}
          {page.lastModified !== PUBLISHED ? ` · Updated ${formatDate(page.lastModified)}` : ""}
        </p>

        <div className="prose-basic mt-6">
          <p>
            An APK is the file format Android uses to install apps. When an app isn’t available from an app store, it
            is installed from an APK file instead. If you are installing an app from our{" "}
            <Link href="/#directory">Yono games directory</Link> this way, this guide covers doing it carefully and
            fixing the errors people run into most often. APK files only work on Android; an iPhone or iPad can’t
            install them.
          </p>

          <nav aria-label="In this guide" className="rounded-lg border border-gray-200 p-4 text-sm">
            <p className="font-medium text-gray-900">In this guide</p>
            <ol>
              <li><a href="#before">Before you download</a></li>
              <li><a href="#install">Install the APK</a></li>
              <li><a href="#after">After installing</a></li>
              <li><a href="#troubleshooting">Troubleshooting install errors</a></li>
              <li><a href="#updates">Updates and uninstalling</a></li>
            </ol>
          </nav>

          <h2 id="before">1. Before you download</h2>
          <ul>
            <li>
              <strong>Use the developer’s own download page.</strong> Check that the app name, icon and developer on
              the page match the app you want. Similar names often belong to unrelated apps.
            </li>
            <li>
              <strong>Avoid “modded” or re-uploaded files.</strong> A modified APK can contain code the original
              developer never shipped.
            </li>
            <li>
              <strong>Check the law where you live.</strong> India’s Promotion and Regulation of Online Gaming Act,
              2025 prohibits offering online money games. If an app involves deposits or cash prizes, make sure you
              understand the rules that apply to you first.
            </li>
            <li>
              <strong>Free up storage.</strong> Installing needs space for both the APK and the installed app.
            </li>
          </ul>

          <h2 id="install">2. Install the APK</h2>
          <ol id="install-steps">
            {INSTALL_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <h2 id="after">3. After installing</h2>
          <ul>
            <li>
              Review the permissions the app requests. Be cautious with access to SMS messages, contacts, accessibility
              services or the ability to display over other apps when the app has no obvious need for them.
            </li>
            <li>
              Turn <strong>Install unknown apps</strong> off again for the browser or file manager you used.
            </li>
            <li>Delete the downloaded APK file if you no longer need it.</li>
          </ul>

          <h2 id="troubleshooting">4. Troubleshooting install errors</h2>
          <h3>“App not installed” or “package appears to be invalid”</h3>
          <ul>
            <li>The download may be incomplete. Delete it and download it again from the same page.</li>
            <li>
              A version of the app from a different source may already be installed. Android only installs an update
              signed with the same key, so uninstall the existing app first (this removes its data).
            </li>
            <li>The app may not support your Android version or your phone’s processor type.</li>
            <li>Your phone may be short of storage.</li>
          </ul>
          <h3>“There was a problem parsing the package”</h3>
          <p>
            The file is damaged or needs a newer Android version than your phone runs. Re-download it, and check the
            minimum Android version on the developer’s page.
          </p>
          <h3>The file ends in .apks, .xapk or .apkm</h3>
          <p>
            These are bundles of several APK files. Android’s built-in installer can’t open them directly; look for a
            single APK on the developer’s page instead.
          </p>
          <h3>“Restricted setting” when enabling a permission</h3>
          <p>
            From Android 13, apps installed from files can’t be given some sensitive permissions, such as accessibility
            access, without an extra confirmation in the app’s settings. Treat a request for those permissions with
            care.
          </p>
          <h3>“Blocked by Play Protect”</h3>
          <p>Play Protect has identified the app as potentially harmful. Don’t try to work around this.</p>

          <h2 id="updates">5. Updates and uninstalling</h2>
          <p>
            Apps installed from an APK don’t update through the Play Store. Get updates from the same developer page
            you used originally; an update from a different source may fail to install because it is signed with a
            different key. To remove an app, open <strong>Settings → Apps</strong>, choose the app and tap{" "}
            <strong>Uninstall</strong>.
          </p>

          <h2>Find an app</h2>
          <p>
            Browse the <Link href="/#directory">full list of Yono games</Link>
            {publishedListings.length ? (
              <>
                {" "}or go straight to{" "}
                {publishedListings.map((c, i) => (
                  <span key={c.id}>
                    {i > 0 ? (i === publishedListings.length - 1 ? " or " : ", ") : ""}
                    <Link href={c.path}>{c.pageTitle.toLowerCase()}</Link>
                  </span>
                ))}
              </>
            ) : null}
            . Listings link to a download page only once we have checked that the page belongs to the app.
          </p>
        </div>
      </article>
    </>
  );
}
