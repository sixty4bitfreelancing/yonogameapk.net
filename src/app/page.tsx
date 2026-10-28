import Link from "next/link";
import { AppList } from "@/components/AppList";
import { DirectoryFilters } from "@/components/DirectoryFilters";
import { FAQ, faqPlainText, type FaqItem } from "@/components/FAQ";
import { FilterLink } from "@/components/FilterLink";
import { JsonLd } from "@/components/JsonLd";
import {
  appPath,
  appsInCategory,
  categoryPath,
  datedApps,
  directoryApps,
  directoryStats,
  getListing,
  getPublishedApp,
  publishedListings,
  RECENT_ON_HOMEPAGE,
} from "@/data/apps";
import { bonusData } from "@/data/bonuses.generated";
import { categories, categoryOrder } from "@/data/categories";
import { helpGuide, helpGuides, homeCopy } from "@/content/copy";
import { formatDate } from "@/lib/format";
import { faqPageNode, graph, howToNode, ids, itemListNode, organizationNode, webPageNode, websiteNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";
import { NEW_APPS_PATH, staticPages } from "@/lib/pages";
import { HOME_MARKDOWN_PATH } from "@/lib/published-urls";
import { site } from "@/lib/site";

const PATH = "/";
const TITLE = homeCopy.title;
const DESCRIPTION = homeCopy.description;
const GRID_ID = "directory-list";

const homeInstallSteps = [
  "Find the app’s own download page and check that the app name and developer match what you expect.",
  "Download the APK, then allow your browser or file manager to install unknown apps when Android asks.",
  "Open the downloaded file and tap Install. If Google Play Protect warns that the app is harmful, stop.",
  "Review the permissions the app asks for, then switch the “Install unknown apps” setting off again.",
];

/** Re-render hourly so visitor ratings on the app cards stay current. */
export const revalidate = 3600;

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  absoluteTitle: true,
  markdownPath: HOME_MARKDOWN_PATH,
});

const categoryCountSentence = categoryOrder
  .map((id) => ({ label: categories[id].label.toLowerCase(), count: appsInCategory(id).length }))
  .filter((row) => row.count > 0)
  .map((row, i, rows) => `${i === rows.length - 1 && rows.length > 1 ? "and " : ""}${row.count} ${row.label}`)
  .join(", ");

/** Apps whose listed sign-up bonus is ₹500–₹1,500 (searched as "all yono games 500 to 1500"). */
const midBonusApps = directoryApps
  .filter((app) => {
    const bonus = bonusData.apps[app.id]?.signupBonus;
    return bonus !== null && bonus !== undefined && bonus >= 500 && bonus <= 1500;
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const faqs: FaqItem[] = [
  {
    question: "What are Yono games?",
    answer: `“Yono games” is the popular name for a group of Android gaming apps — rummy, slots, spin, bingo and other card and casino-style games — that are often shared as APK files rather than through Google Play. ${site.name} lists ${directoryStats.listed} of them in one place, sorted by category, with a page for each app.`,
  },
  {
    question: "Is Yono Game APK the official Yono games website?",
    answer: `No. ${site.name} is an independent directory. It isn’t run by or affiliated with the developers of the apps listed here, and it has no connection to SBI’s YONO banking app or any other bank.`,
  },
  {
    question: "How do I download a Yono game?",
    answer:
      "Open the app’s page from the list above and use its Download button. Tap Download next to any app in the list to get the APK, then follow the install steps for Android.",
  },
  {
    question: "How do I install a Yono game APK on Android?",
    answer: (
      <>
        Download the APK from the app’s official source, open the file and allow your browser or file manager to install
        unknown apps when Android asks. Tap Install, then switch that permission off again. If Google Play Protect warns
        that an app is harmful, don’t install it. Our{" "}
        <Link href={staticPages.installGuide.path} className="text-blue-700 underline">
          APK install guide
        </Link>{" "}
        covers each step and common errors such as “App not installed”.
      </>
    ),
    text: "Download the APK from the app’s official source, open the file and allow your browser or file manager to install unknown apps when Android asks. Tap Install, then switch that permission off again. If Google Play Protect warns that an app is harmful, don’t install it. Our APK install guide covers each step and common errors such as “App not installed”.",
  },
  {
    question: "How to download Yono games on iPhone?",
    answer:
      "APK files only work on Android, so they can’t be installed on an iPhone or iPad. If an app has an App Store version, install it from the App Store. Never install a configuration profile or trust an unknown “enterprise” certificate to get an app — that can give a stranger control over your phone.",
  },
  {
    question: "How many Yono games are there?",
    answer: `Our list currently has ${directoryStats.listed} Yono games: ${categoryCountSentence}. New titles appear regularly, so the total changes as we add them.`,
  },
  {
    question: "Yono Games: which country is it from?",
    answer:
      "The apps listed here are aimed at players in India and show amounts in Indian rupees. Each app is run separately, and we haven’t confirmed which company or country is behind each one — check the developer name, address and contact details inside the app or on its store listing.",
  },
  {
    question: "Is Yono Games real or fake?",
    answer:
      "Each Yono game is a real app you can install, but being installable doesn’t make an app trustworthy. Before depositing, look for a named developer, working support, a privacy policy and written withdrawal terms, and search for recent user complaints. We haven’t tested these apps and can’t confirm their payouts.",
  },
  {
    question: "Is Yono Games safe?",
    answer:
      "Check every app before you install it or add money: install only from its official source, don’t ignore Google Play Protect warnings, be wary of apps that ask for SMS, contacts or accessibility access, and never share an OTP or UPI PIN. Bonus figures shown on app pages are listed claims, so read each app’s own terms before depositing.",
  },
  {
    question: "Is Yono Games legal in India, or is it banned?",
    answer:
      "India’s Promotion and Regulation of Online Gaming Act, 2025 prohibits offering and advertising online money games and bars banks and payment services from processing payments for them — whether the game is based on skill, chance or both, so real-money rummy is included. Apps that take deposits or pay cash prizes fall under that ban. Free games played without money aren’t affected. Check the rules that apply to you before depositing anywhere.",
  },
  {
    question: "How to win Yono games?",
    answer:
      "Slot and spin results are random, so no method makes you win more often; rummy depends partly on skill. Learn each game’s rules in practice mode, set a spending limit before you start, never chase losses, and treat money you play with as money you can afford to lose. Our responsible gaming page has more tips.",
  },
  {
    question: "How to hack Yono games?",
    answer:
      "There is no hack. Websites, Telegram channels and apps offering Yono hacks, mod APKs, “winning tricks” or prediction tools are a common scam: they can steal your account, your money or the data on your phone. Install games only from their official source and never pay for a “hack”.",
  },
  {
    question: "How to delete a Yono Games account?",
    answer:
      "Each Yono game has its own account. Withdraw any balance first, then look for Delete account or Close account in the app’s profile or settings. If there isn’t one, ask the app’s support in writing and keep a copy of your request. Uninstalling the app doesn’t delete the account, so also remove any UPI AutoPay mandate you set up for it.",
  },
  {
    question: "Is Yono Games connected to LSGD Kerala or ap.gov.in?",
    answer:
      "No. LSGD is Kerala’s Local Self Government Department, and ap.gov.in websites belong to the Andhra Pradesh government. Neither has anything to do with Yono games. Don’t enter government login details, Aadhaar numbers or OTPs into any game app or website that claims such a link.",
  },
  {
    question: "How do the star ratings work?",
    answer:
      "The star score shown for each app, such as ★ 4.2/5, is our Editor Score: our own overall opinion of the app out of 5, set by our editors. It isn’t a count of user votes, a test result or a safety rating, and we update it when our view of an app changes.",
  },
  {
    question: "How are the apps sorted into categories?",
    answer:
      "By the words in each app’s name — for example, “Rummy 91” is listed under rummy apps. Use the category buttons above the list, or open a category page such as Yono rummy apps or Yono slots apps.",
  },
];

export default function HomePage() {
  const categoryRows = categoryOrder
    .map((id) => ({ info: categories[id], count: appsInCategory(id).length, path: categoryPath(id) }))
    .filter((row) => row.count > 0);
  const recent = datedApps.slice(0, RECENT_ON_HOMEPAGE);
  const heldBackIcons = directoryStats.listed - directoryStats.withIcon;
  const listing777 = getListing("777");
  const spinListing = getListing("spin");
  const spinCrush = getPublishedApp("spin-crush");

  return (
    <>
      <JsonLd
        data={graph(
          organizationNode(),
          websiteNode(),
          webPageNode({
            type: "CollectionPage",
            path: PATH,
            name: TITLE,
            description: DESCRIPTION,
            hasBreadcrumb: false,
            mainEntity: { "@id": ids.itemList(PATH) },
            dateModified: staticPages.home.lastModified,
          }),
          faqPageNode(PATH, faqPlainText(faqs)),
          howToNode(PATH, "install-steps", "How to download and install a Yono game APK", homeInstallSteps),
          itemListNode(PATH, "All Yono games list", directoryApps, appPath),
        )}
      />

      <div className="mx-auto max-w-6xl px-4">
        <section className="relative mt-4 overflow-hidden rounded-2xl bg-linear-to-br from-emerald-700 via-emerald-800 to-emerald-950 px-5 py-6 text-white shadow-md sm:px-8 sm:py-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-amber-400/20 blur-2xl"
          />
          <h1 className="relative text-2xl font-extrabold tracking-tight sm:text-3xl">{homeCopy.h1}</h1>
          <p className="relative mt-2 max-w-2xl text-sm text-emerald-50/90 sm:text-base">
            All Yono games and Yono games apps in one list: sign-up bonuses, minimum withdrawals and ratings for{" "}
            {directoryApps.length} apps. Tap Download for the Yono games APK download and install details.
          </p>
          <p className="relative mt-3 max-w-2xl text-sm leading-relaxed text-emerald-100/80">
            {site.name} is an independent guide to Yono games. Every rummy, slots, spin, bingo and 777 app in our list has
            its own page explaining what it is, how to play, how to install it on Android, its listed bonus and withdrawal
            amounts, and what to check before you deposit. We keep the list up to date as new Yono games appear, and we
            don’t work for any app.
          </p>
        </section>

        <section id="directory" aria-labelledby="directory-heading" className="scroll-mt-4 py-5">
          <h2 id="directory-heading" className="mb-3 text-lg font-bold text-gray-900">
            Download Yono games
          </h2>
          <DirectoryFilters
            gridId={GRID_ID}
            total={directoryApps.length}
            categoryOptions={categoryRows.map((row) => ({ id: row.info.id, label: row.info.label, count: row.count }))}
          />
          <AppList apps={directoryApps} id={GRID_ID} eagerCount={6} />
        </section>

        <section id="yono-games-guide" aria-labelledby="guide-heading" className="scroll-mt-4 py-8">
          <h2 id="guide-heading" className="text-xl font-semibold text-gray-900">
            Yono games guide: download, APK and what to know
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="font-semibold text-gray-900">What are Yono games and the Yono games app?</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                “Yono games” is the name people use for a family of Android gaming apps — rummy, slots, spin, bingo, 777
                and arcade titles such as JaiHo Rummy, DIWA 777, Boss Rummy, Yono 777 and Rummy 888. In our list each
                title is a separate app with its own download, account and terms, so “all Yono games” means all of these
                apps together. This page lists all Yono games we know of — {directoryApps.length} so far.
              </p>
            </article>
            <article className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="font-semibold text-gray-900">Yono games download and Yono games APK</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                Tap Download next to any app above to open its download section. APK files install only on Android. If
                an app is on Google Play, installing it from the Play Store is the safer choice; many Yono titles are
                shared only as APK files, so check the source before you install. Our{" "}
                <Link href={staticPages.installGuide.path} className="text-blue-700 underline">
                  Yono games APK install guide
                </Link>{" "}
                explains each step.
              </p>
            </article>
            <article className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="font-semibold text-gray-900">Yono games APK download old version</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                Old versions miss security fixes, and sites offering “old” or “mod” Yono APKs often bundle malware. If the
                current version gives you trouble, uninstall it and reinstall the latest version from the app’s official
                source. See{" "}
                <Link href={helpGuide("update").path} className="text-blue-700 underline">
                  how to update an app safely
                </Link>
                .
              </p>
            </article>
            <article className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="font-semibold text-gray-900">New Yono games and all new 2026 APKs</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                New Yono titles appear often. We add each new Yono game to the list above as we find it, with its own
                page, download section and install steps, and every app page shows when it was last updated.
              </p>
            </article>
            {listing777 ? (
              <article className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="font-semibold text-gray-900">Yono games 777</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-700">
                  {listing777.apps.length} Yono apps have “777” in their name, including{" "}
                  {listing777.apps
                    .slice(0, 4)
                    .map((a) => a.name)
                    .join(", ")}
                  . See them all on our{" "}
                  <Link href={listing777.path} className="text-blue-700 underline">
                    Yono 777 games
                  </Link>{" "}
                  page.
                </p>
              </article>
            ) : null}
            {spinListing ? (
              <article className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="font-semibold text-gray-900">All Yono games Spin Crush APK and spin games</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-700">
                  {spinCrush ? (
                    <>
                      <Link href={appPath(spinCrush) as string} className="text-blue-700 underline">
                        Spin Crush
                      </Link>{" "}
                      is one of{" "}
                    </>
                  ) : (
                    "There are "
                  )}
                  {spinListing.apps.length} Yono spin games in our list, alongside Spin Gold, Spin Lucky and Spin
                  Winner. Browse every title on the{" "}
                  <Link href={spinListing.path} className="text-blue-700 underline">
                    Yono spin games
                  </Link>{" "}
                  page.
                </p>
              </article>
            ) : null}
            {midBonusApps.length ? (
              <article className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="font-semibold text-gray-900">All Yono games with a ₹500 to ₹1,500 bonus</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-700">
                  {midBonusApps.length} apps list a sign-up bonus between ₹500 and ₹1,500. These are listed claims — read
                  each app’s terms before depositing:
                </p>
                <p className="mt-2 text-sm leading-relaxed">
                  {midBonusApps.map((app, i) => (
                    <span key={app.id}>
                      {i > 0 ? ", " : ""}
                      <Link href={appPath(app) as string} className="text-blue-700 underline-offset-2 hover:underline">
                        {app.name}
                      </Link>{" "}
                      <span className="text-gray-500">({app.stats.signupBonus?.value})</span>
                    </span>
                  ))}
                </p>
              </article>
            ) : null}
            <article className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="font-semibold text-gray-900">All Yono games LSGD Kerala and ap.gov.in login</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                Yono games have no link to government websites. LSGD is Kerala’s Local Self Government Department, and
                ap.gov.in sites belong to the Andhra Pradesh government. Never enter government login details, Aadhaar
                numbers or OTPs into a game app or a site that claims such a connection.
              </p>
            </article>
          </div>
        </section>

        <section id="categories" aria-labelledby="categories-heading" className="scroll-mt-4 py-8">
          <h2 id="categories-heading" className="text-xl font-semibold text-gray-900">
            Yono games by category
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-700">
            Categories come from the words in each app’s name. They describe what a listing is called, not a confirmed
            list of the games inside it.
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <caption className="sr-only">Directory listings by category</caption>
              <thead className="bg-gray-50 text-left text-gray-700">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Category</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Listings</th>
                  <th scope="col" className="px-3 py-2 font-medium">How the category is assigned</th>
                  <th scope="col" className="px-3 py-2 font-medium">Browse</th>
                </tr>
              </thead>
              <tbody>
                {categoryRows.map((row) => (
                  <tr key={row.info.id} className="border-t border-gray-200">
                    <th scope="row" className="px-3 py-2 text-left font-medium text-gray-900">{row.info.label}</th>
                    <td className="px-3 py-2 text-right tabular-nums">{row.count}</td>
                    <td className="px-3 py-2 text-gray-700">{row.info.basis}</td>
                    <td className="px-3 py-2">
                      {row.path ? (
                        <Link href={row.path} className="text-blue-700 underline-offset-2 hover:underline">
                          Browse Yono {(row.info.pageTitle ?? row.info.label).toLowerCase()}
                        </Link>
                      ) : (
                        <FilterLink category={row.info.id}>Show {row.info.label.toLowerCase()} apps</FilterLink>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {publishedListings.some((l) => l.kind === "collection") ? (
            <p className="mt-3 text-sm text-gray-700">
              Collections across categories:{" "}
              {publishedListings
                .filter((l) => l.kind === "collection")
                .map((l, i) => (
                  <span key={l.id}>
                    {i > 0 ? ", " : ""}
                    <Link href={l.path} className="text-blue-700 underline-offset-2 hover:underline">
                      Yono {l.pageTitle.toLowerCase()}
                    </Link>{" "}
                    ({l.apps.length}, {l.basis.charAt(0).toLowerCase() + l.basis.slice(1)})
                  </span>
                ))}
            </p>
          ) : null}
        </section>

        {recent.length ? (
          <section id="new-apps" aria-labelledby="new-apps-heading" className="scroll-mt-4 py-8">
            <h2 id="new-apps-heading" className="text-xl font-semibold text-gray-900">
              Recently added
            </h2>
            <ul className="mt-3 space-y-1 text-sm">
              {recent.map((app) => (
                <li key={app.id}>
                  {app.name} <span className="text-gray-500">— added {formatDate(app.addedAt as string)}</span>
                </li>
              ))}
            </ul>
            <Link href={NEW_APPS_PATH} className="mt-3 inline-block text-sm text-blue-700 hover:underline">
              See all recently added Yono games
            </Link>
          </section>
        ) : null}

        <section id="install-guide" aria-labelledby="install-heading" className="scroll-mt-4 py-8">
          <h2 id="install-heading" className="text-xl font-semibold text-gray-900">
            How to download and install a Yono game APK
          </h2>
          <ol id="install-steps" className="mt-3 max-w-3xl list-decimal space-y-2 pl-5 text-sm text-gray-800">
            {homeInstallSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <Link
            href={staticPages.installGuide.path}
            className="mt-4 inline-block text-sm font-medium text-blue-700 underline-offset-2 hover:underline"
          >
            Read the full APK installation and troubleshooting guide
          </Link>
          <p className="mt-3 text-sm text-gray-700">
            More help:{" "}
            {helpGuides
              .filter((g) => g.key !== "install")
              .map((g, i) => (
                <span key={g.key}>
                  {i > 0 ? " · " : ""}
                  <Link href={g.path} className="text-blue-700 underline-offset-2 hover:underline">
                    {g.label}
                  </Link>
                </span>
              ))}
          </p>
        </section>

        <section id="how-we-check" aria-labelledby="sources-heading" className="scroll-mt-4 py-8">
          <h2 id="sources-heading" className="text-xl font-semibold text-gray-900">
            Where this information comes from
          </h2>
          <div className="mt-2 max-w-3xl space-y-3 text-sm leading-relaxed text-gray-700">
            <p>
              The directory starts from a collection document supplied to us, together with a set of app icons. The
              document itself says it does not confirm who publishes each app, where to download it or what it offers,
              so we treat it as a list of names to research rather than as facts.
            </p>
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-3">
                <dt className="font-medium text-gray-900">Imported from the document</dt>
                <dd className="mt-1">
                  {directoryStats.listed} listings: the name and a category based on it.
                  {directoryStats.excluded > 0
                    ? ` ${directoryStats.excluded} names that describe directories rather than single apps are left out.`
                    : ""}
                </dd>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <dt className="font-medium text-gray-900">Illustrated</dt>
                <dd className="mt-1">
                  {directoryStats.withIcon} listings have a tile and banner illustration made for this directory. They
                  show the app’s name and are not official app icons.
                  {heldBackIcons > 0 ? ` ${heldBackIcons} listings don’t have one yet.` : ""}
                </dd>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <dt className="font-medium text-gray-900">Independently checked</dt>
                <dd className="mt-1">
                  {directoryStats.checked} listings. A check means confirming the developer and official source
                  ourselves and recording the date.
                </dd>
              </div>
            </dl>
            <p>
              Developer details and download links are added only after a check. Bonus and withdrawal figures are shown
              only as another website’s dated claims, and we don’t use “official” or “safe” labels we can’t support. Read
              our{" "}
              <Link href={staticPages.editorialPolicy.path} className="text-blue-700 underline">
                editorial policy and research method
              </Link>{" "}
              for the full process, including how to report a broken or changed link.
            </p>
          </div>
        </section>

        <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-4 py-8">
          <h2 id="faq-heading" className="mb-3 text-xl font-semibold text-gray-900">
            Frequently asked questions
          </h2>
          <FAQ items={faqs} />
        </section>
      </div>
    </>
  );
}
