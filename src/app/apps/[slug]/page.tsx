import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AppCard } from "@/components/AppCard";
import { AppIcon } from "@/components/AppIcon";
import { AppInfoTable } from "@/components/AppInfoTable";
import { AppQuickStats } from "@/components/AppQuickStats";
import { DownloadCard } from "@/components/DownloadCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FAQ } from "@/components/FAQ";
import { JsonLd } from "@/components/JsonLd";
import { EditorScore } from "@/components/EditorScore";
import { RatingBadge } from "@/components/RatingBadge";
import { ReportProblem } from "@/components/ReportProblem";
import { SourceNote } from "@/components/SourceNote";
import { TelegramCta } from "@/components/TelegramCta";
import {
  androidInstallSteps,
  appPageDescription,
  appPageUpdated,
  appPageTitle,
  editorialize,
  hasCustomAppMeta,
  helpGuide,
} from "@/content/copy";
import {
  allApps,
  appPath,
  categoryPath,
  collectionsFor,
  confusableApps,
  getDocContent,
  getPublishedApp,
  isChecked,
  publishedApps,
  relatedApps,
} from "@/data/apps";
import { categories } from "@/data/categories";
import bannerPlaceholders from "@/data/image-placeholders.generated.json";
import { appTrail } from "@/lib/breadcrumbs";
import { formatDate, hostname } from "@/lib/format";
import { isLocalFile } from "@/lib/links";
import { breadcrumbNode, faqPageNode, graph, howToNode, ids, softwareApplicationNode, webPageNode } from "@/lib/jsonld";
import { ratingStore, ratingSummaries } from "@/lib/ratings-store";
import { pageMetadata } from "@/lib/metadata";
import { staticPages } from "@/lib/pages";
export const dynamicParams = false;
/** Re-render hourly so the visitor rating in the page and its markup stays current. */
export const revalidate = 3600;

export function generateStaticParams() {
  return publishedApps.map((app) => ({ slug: app.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const app = getPublishedApp(slug);
  if (!app) return {};
  return pageMetadata({
    title: appPageTitle(app),
    description: appPageDescription(app),
    absoluteTitle: hasCustomAppMeta(app),
    path: `/apps/${app.slug}/`,
    image: app.banner
      ? { path: app.banner.src, width: app.banner.width, height: app.banner.height, alt: app.banner.alt }
      : null,
  });
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="mt-10 scroll-mt-4">
      <h2 id={`${id}-heading`} className="text-xl font-semibold text-gray-900">
        {title}
      </h2>
      <div className="prose-basic mt-3 text-[15px]">{children}</div>
    </section>
  );
}

export default async function AppDetailPage({ params }: Props) {
  const { slug } = await params;
  const app = getPublishedApp(slug);
  if (!app) notFound();

  const name = app.name;
  const path = `/apps/${app.slug}/`;
  const trail = appTrail(app);
  const catPath = categoryPath(app.category);
  const catLabel = categories[app.category].label.toLowerCase();
  const doc = getDocContent(app);
  const checked = isChecked(app);
  const related = relatedApps(app);
  const [rating, relatedRatings] = await Promise.all([
    ratingStore()
      .summary(app.slug)
      .catch(() => null),
    ratingSummaries(related.map((other) => other.slug)),
  ]);
  // Visitor votes are only shown (and so only marked up) for apps without an Editor Score.
  const appNode = softwareApplicationNode(path, app, app.editorScore === null ? rating : null);
  const installSteps = androidInstallSteps(name);
  const faqs = (doc?.faqs ?? []).map((f) => ({ question: editorialize(f.question), answer: editorialize(f.answer) }));
  const title = appPageTitle(app);
  const description = appPageDescription(app);
  const similar = (doc?.similarNames ?? []).map((s) => ({ ...s, app: allApps.find((a) => a.slug === s.slug) }));
  const confusable = confusableApps(app);
  const updated = appPageUpdated(app);
  const bannerBlur = app.banner ? (bannerPlaceholders as Record<string, string>)[app.banner.src] : undefined;
  const collections = collectionsFor(app);
  const guide = staticPages.installGuide.path;
  const claimSource = app.stats.signupBonus ?? app.stats.minWithdrawal;

  const toc = [
    { id: "download", label: `Download ${name} APK` },
    { id: "what-is", label: `What is ${name}?` },
    { id: "quick-stats", label: "Quick stats and requirements" },
    { id: "how-to-play", label: "How to play" },
    { id: "bonus-conditions", label: "Bonus and withdrawal conditions" },
    { id: "where-to-play", label: "Where to play and install" },
    { id: "safety", label: "Is it safe?" },
    { id: "install-android", label: "Install on Android" },
    { id: "install-ios", label: "Install on iPhone (iOS)" },
    { id: "known-issues", label: "Known issues" },
    { id: "help", label: "Help guides" },
    ...(doc?.faqs.length ? [{ id: "faq", label: "FAQs" }] : []),
    { id: "verification", label: "Verification notes" },
  ];

  return (
    <>
      <JsonLd
        data={graph(
          webPageNode({
            path,
            name: title,
            description,
            mainEntity: { "@id": ids.app(path) },
            dateModified: updated,
          }),
          breadcrumbNode(path, trail),
          appNode,
          faqPageNode(path, faqs),
          howToNode(path, "install-android-steps", `How to install ${name} on Android`, installSteps),
        )}
      />
      <div className="mx-auto max-w-3xl px-4 py-3">
        <Breadcrumbs items={trail} />
      </div>
      <header className="bg-gray-950">
        <div className="mx-auto max-w-3xl">
          {app.banner ? (
            <div className="relative aspect-video sm:aspect-2/1">
              <Image
                src={app.banner.src}
                alt=""
                fill
                preload
                quality={70}
                sizes="(max-width: 768px) 100vw, 768px"
                placeholder={bannerBlur ? "blur" : "empty"}
                blurDataURL={bannerBlur}
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-950/10 to-transparent" />
            </div>
          ) : null}
          <div className={`relative flex items-end gap-4 px-4 pb-6 ${app.banner ? "-mt-12 sm:-mt-16" : "pt-10"}`}>
            <AppIcon app={app} size={72} eager />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow sm:text-3xl">{name}</h1>
              <p className="mt-2 text-sm text-gray-300">What It Is, How to Play &amp; Install</p>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                {app.editorScore !== null ? (
                  <EditorScore score={app.editorScore} tone="dark" size="md" />
                ) : (
                  <>
                    <RatingBadge rating={rating} size="md" tone="dark" />
                    <a href="#download" className="text-sm font-medium text-amber-300 underline-offset-2 hover:underline">
                      Rate it
                    </a>
                  </>
                )}
              </p>
              <p className="mt-1.5 text-xs text-gray-400">
                Last updated <time dateTime={updated}>{formatDate(updated)}</time>
              </p>
            </div>
          </div>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-4 pt-2">
        {checked && app.summary ? <p className="mt-4 text-gray-800">{app.summary}</p> : null}

        <DownloadCard app={app} rating={rating} />
        <TelegramCta />

        {confusable.length ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>Not to be confused with </strong>
            {confusable.map((other, i) => (
              <span key={other.id}>
                {i > 0 ? " or " : ""}
                <Link href={appPath(other) as string} className="font-medium underline">
                  {other.name}
                </Link>
              </span>
            ))}
            . The names differ by one letter, and nothing we have shows they are the same app or operator. Check the
            exact name inside the app before you install or pay.
          </p>
        ) : null}

        <nav aria-label="On this page" className="mt-6 rounded-lg border border-gray-200 p-4 text-sm">
          <p className="font-medium text-gray-900">On this page</p>
          <ol className="mt-2 grid gap-1 sm:grid-cols-2">
            {toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-blue-700 underline-offset-2 hover:underline">
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <Section id="what-is" title={`What is ${name}?`}>
          {doc?.whatIsIt ? <p>{editorialize(doc.whatIsIt)}</p> : null}
          {doc?.clarification ? <p>{editorialize(doc.clarification)}</p> : null}
          <div className="not-prose mt-4">
            <AppInfoTable app={app} />
          </div>
        </Section>

        <section id="quick-stats" aria-labelledby="quick-stats-heading" className="mt-10 scroll-mt-4">
          <h2 id="quick-stats-heading" className="text-xl font-semibold text-gray-900">
            {name} quick stats, security and system requirements
          </h2>
          <div className="mt-3">
            <AppQuickStats app={app} />
          </div>
        </section>

        {app.screenshots.length ? (
          <section aria-labelledby="screens-heading" className="mt-10">
            <h2 id="screens-heading" className="text-xl font-semibold text-gray-900">
              {name} screenshots
            </h2>
            <ul className="mt-3 flex gap-3 overflow-x-auto pb-2">
              {app.screenshots.map((shot) => (
                <li key={shot.src} className="shrink-0">
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    width={shot.width}
                    height={shot.height}
                    sizes="(max-width: 640px) 60vw, 240px"
                    className="h-auto w-48 rounded-lg border border-gray-200"
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Section id="how-to-play" title={`How to play ${name}`}>
          {doc?.howTo ? <p>{editorialize(doc.howTo)}</p> : null}
          {doc?.understanding ? <p>{editorialize(doc.understanding)}</p> : null}
          {doc?.features ? (
            <>
              <h3>Features to check in {name}</h3>
              <p>{editorialize(doc.features)}</p>
            </>
          ) : null}
          {catPath ? (
            <p>
              More on this game type: <Link href={catPath}>what to check in {catLabel} apps</Link>.
            </p>
          ) : null}
        </Section>

        <Section id="bonus-conditions" title={`${name} bonus and withdrawal conditions`}>
          {app.bonusTerms.length ? (
            <ul>
              {app.bonusTerms.map((term) => (
                <li key={term.text}>
                  {term.text}{" "}
                  <span className="text-sm text-gray-500">
                    (from {term.source ? hostname(term.source) : "the app’s terms"}, checked {formatDate(term.date)})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              We haven’t found {name}’s own terms for its bonus or withdrawals yet, so we can’t say who qualifies for a
              bonus, how it is credited or what has to happen before money can be withdrawn.
            </p>
          )}
          {claimSource ? (
            <p>
              Listed figures (checked {formatDate(claimSource.checkedAt)}):
              {app.stats.signupBonus ? ` a sign-up bonus of ${app.stats.signupBonus.value}` : ""}
              {app.stats.signupBonus && app.stats.minWithdrawal ? " and" : ""}
              {app.stats.minWithdrawal ? ` a minimum withdrawal of ${app.stats.minWithdrawal.value}` : ""}. These are
              claims, not confirmed terms.
            </p>
          ) : null}
          <p>
            Before depositing, read the app’s own terms for KYC, bonus balances, wagering requirements and withdrawal
            limits. Our guide to{" "}
            <Link href={helpGuide("withdrawal").path}>understanding withdrawal conditions</Link> explains each one.
          </p>
        </Section>

        <Section id="where-to-play" title={`Where to play and install ${name}`}>
          {app.downloadUrl ? (
            <>
              {isLocalFile(app.downloadUrl) ? (
                <p>
                  {name} is played inside its own app once installed. Use the{" "}
                  <a href="#download">download button above</a> to get the APK file, then follow the Android install
                  steps below.
                </p>
              ) : (
                <p>
                  {name} is played inside its own app once installed. Its download page is on an external site (
                  {hostname(app.downloadUrl)}); use the <a href="#download">download button above</a>. We don’t host the
                  APK file.
                </p>
              )}
            </>
          ) : (
            <>
              <p>
                {name} is played inside its own app once installed; this site doesn’t run any games. We haven’t
                confirmed an official website, Google Play listing or App Store listing for {name}, so this page
                doesn’t link to a download. Files using this name may be offered on different websites, and without a
                confirmed developer we can’t tell which, if any, is genuine.
              </p>
              <p>To find the genuine source:</p>
              <ul>
                <li>
                  Search Google Play for the exact name “{name}” and compare the developer name, contact details and
                  privacy policy on the listing. If it’s there, install it from Google Play; no APK file is needed.
                </li>
                <li>
                  If there’s no store listing, look for the developer’s own website and check that it names the same
                  company shown inside the app.
                </li>
                <li>
                  Avoid pages that only show a download button, ask you to turn off security protections, or promise
                  guaranteed earnings.
                </li>
              </ul>
            </>
          )}
        </Section>

        <Section id="safety" title={`Is ${name} safe to play?`}>
          {checked ? (
            <p>
              We checked {name}’s developer and official source on {formatDate(app.checkedAt as string)}. That confirms
              who publishes it, not that every feature, payment or withdrawal works as advertised.
            </p>
          ) : (
            <p>
              We can’t tell you that {name} is safe. We haven’t tested it, and its developer isn’t confirmed. Use these
              checks before installing it or depositing any money:
            </p>
          )}
          <ul>
            <li>
              <strong>Who runs it:</strong> a named company or developer, with a working support contact and a privacy
              policy.
            </li>
            <li>
              <strong>What it asks for:</strong> access to SMS, contacts, accessibility services or drawing over other
              apps is a warning sign when a game has no clear need for it.
            </li>
            <li>
              <strong>Google Play Protect:</strong> if it flags {name} as harmful, don’t install it.
            </li>
            <li>
              <strong>Money terms:</strong> find out whether balances are play credits or real money, and read the full
              bonus and withdrawal terms before depositing. Guaranteed earnings are a warning sign.
            </li>
            <li>
              <strong>Payments:</strong> never share an OTP, UPI PIN or card details with anyone who contacts you about
              the app.
            </li>
          </ul>
          <h3>Is {name} legal in India?</h3>
          <p>
            India’s Promotion and Regulation of Online Gaming Act, 2025 prohibits offering online money games. If{" "}
            {name} involves deposits or cash prizes, check the rules that apply to you before using it, and see our{" "}
            <Link href={staticPages.responsibleGaming.path}>responsible gaming page</Link>.
          </p>
        </Section>

        <Section id="install-android" title={`How to install ${name} on Android`}>
          <ol id="install-android-steps">
            {installSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p>
            Seeing “App not installed” or a parsing error? Our <Link href={guide}>APK install guide</Link> covers the
            usual causes and fixes.
          </p>
        </Section>

        <Section id="install-ios" title={`How to install ${name} on iPhone and iPad (iOS)`}>
          <p>
            We haven’t found a confirmed App Store listing for {name}. APK files only work on Android, so an iPhone or
            iPad can’t install them.
          </p>
          <ul>
            <li>In India, iPhone and iPad apps are installed from the App Store.</li>
            <li>
              If a website offers {name} for iPhone by asking you to install a configuration profile or trust an
              “enterprise developer” certificate, don’t. That can give the website’s owner extensive control over your
              device.
            </li>
            <li>
              If {name} appears on the App Store later, check that its developer name matches the Android version before
              installing.
            </li>
          </ul>
        </Section>

        <Section id="known-issues" title={`Known issues with ${name}`}>
          {app.knownIssues.length ? (
            <ul>
              {app.knownIssues.map((issue) => (
                <li key={`${issue.date}-${issue.text}`}>
                  <strong>{formatDate(issue.date)}:</strong> {issue.text}
                  {issue.source ? <span className="text-sm text-gray-500"> (source: {issue.source})</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p>
              No issues have been recorded for {name} yet. If you find a broken or changed link or wrong information,
              use the report form at the end of this page.
            </p>
          )}
        </Section>

        <Section id="help" title={`Having trouble with ${name}?`}>
          <ul>
            <li>
              Won’t install or shows “App not installed”? See <Link href={helpGuide("install").path}>installation problems</Link>.
            </li>
            <li>
              Can’t sign in? See <Link href={helpGuide("login").path}>login problems</Link>.
            </li>
            <li>
              Login or verification code not arriving? See <Link href={helpGuide("otp").path}>OTP delays</Link>.
            </li>
            <li>
              New version available? See <Link href={helpGuide("update").path}>how to update an app safely</Link>.
            </li>
            <li>
              Questions about bonuses or cashing out? See{" "}
              <Link href={helpGuide("withdrawal").path}>understanding withdrawal conditions</Link>.
            </li>
          </ul>
        </Section>

        {doc?.faqs.length ? (
          <section id="faq" aria-labelledby="faq-heading" className="mt-10 scroll-mt-4">
            <h2 id="faq-heading" className="mb-3 text-xl font-semibold text-gray-900">
              {name} FAQs
            </h2>
            <FAQ items={faqs} />
          </section>
        ) : null}

        {similar.length ? (
          <section aria-labelledby="similar-heading" className="mt-10">
            <h2 id="similar-heading" className="text-xl font-semibold text-gray-900">
              Not to be confused with
            </h2>
            <p className="mt-2 text-sm text-gray-700">
              These names are similar to {name}, but nothing we have shows they are the same app or operator.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {similar.map((s) => {
                const href = s.app ? appPath(s.app) : null;
                return (
                  <li key={s.slug}>
                    {href ? (
                      <Link href={href} className="text-blue-700 underline">
                        {s.app?.name ?? s.name}
                      </Link>
                    ) : (
                      (s.app?.name ?? s.name)
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {related.length ? (
          <section aria-labelledby="related-heading" className="mt-10">
            <h2 id="related-heading" className="text-xl font-semibold text-gray-900">
              Other {catLabel === "other" ? "Yono" : catLabel} apps
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {related.map((other) => (
                <li key={other.id}>
                  <AppCard app={other} rating={relatedRatings.get(other.slug)} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {collections.length ? (
          <p className="mt-6 text-sm text-gray-700">
            Also listed in:{" "}
            {collections.map((c, i) => (
              <span key={c.id}>
                {i > 0 ? ", " : ""}
                <Link href={c.path} className="text-blue-700 underline">
                  Yono {c.pageTitle.toLowerCase()}
                </Link>
              </span>
            ))}
          </p>
        ) : null}

        <section id="verification" aria-labelledby="verification-heading" className="mt-10 scroll-mt-4">
          <h2 id="verification-heading" className="text-xl font-semibold text-gray-900">
            Verification notes and sources
          </h2>
          <dl className={`mt-3 grid gap-3 text-sm ${checked ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            <div className="rounded-lg border border-gray-200 p-3">
              <dt className="text-gray-600">This page last updated</dt>
              <dd className="mt-1 font-medium text-gray-900">{formatDate(updated)}</dd>
            </div>
            {checked ? (
              <div className="rounded-lg border border-gray-200 p-3">
                <dt className="text-gray-600">Page last independently checked</dt>
                <dd className="mt-1 font-medium text-gray-900">{formatDate(app.checkedAt as string)}</dd>
              </div>
            ) : null}
            <div className="rounded-lg border border-gray-200 p-3">
              <dt className="text-gray-600">App last updated (per source)</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {app.appUpdate ? (
                  <>
                    {formatDate(app.appUpdate.date)}{" "}
                    <span className="font-normal text-gray-500">({hostname(app.appUpdate.source)})</span>
                  </>
                ) : (
                  "Not confirmed"
                )}
              </dd>
            </div>
          </dl>
          {app.verificationLog.length ? (
            <ul className="mt-4 space-y-1 text-sm text-gray-700">
              {app.verificationLog.map((entry) => (
                <li key={`${entry.date}-${entry.text}`}>
                  <strong>{formatDate(entry.date)}:</strong> {entry.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-gray-700">
              The app-specific text on this page comes from entry {app.importRecord.documentEntry} of a collection
              document supplied to us. It describes the app conditionally and hasn’t been independently checked; the
              installation and safety advice is our general guidance. No release version or update date for {name} has
              been found.
            </p>
          )}
          <div className="mt-4">
            <SourceNote provenance={app.provenance} />
          </div>
          <div className="mt-6">
            <ReportProblem slug={app.slug} name={name} />
          </div>
        </section>

        <p className="mt-10 text-sm text-gray-700">
          {catPath ? (
            <>
              Browse more{" "}
              <Link href={catPath} className="text-blue-700 underline">
                {catLabel} apps
              </Link>{" "}
              or the{" "}
            </>
          ) : (
            "Browse the "
          )}
          <Link href="/#directory" className="text-blue-700 underline">
            full Yono games directory
          </Link>
          .
        </p>
      </article>
    </>
  );
}
