import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { TelegramIcon } from "@/components/TelegramCta";
import { helpGuide, telegramCopy } from "@/content/copy";
import { pageTrail } from "@/lib/breadcrumbs";
import { breadcrumbNode, graph, webPageNode } from "@/lib/jsonld";
import { siteLinks } from "@/lib/links";
import { pageMetadata } from "@/lib/metadata";
import { staticPages } from "@/lib/pages";
import { site } from "@/lib/site";

const page = staticPages.telegram;
const BANNER = { path: "/images/telegram/yonogames-telegram-e572e07a.webp", width: 1672, height: 941 };

export const metadata = pageMetadata({
  title: telegramCopy.title,
  description: telegramCopy.description,
  path: page.path,
  image: { ...BANNER, alt: "Yono Games — join us on Telegram" },
});

export default function TelegramPage() {
  const trail = pageTrail(page.label, page.path);
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode({
            path: page.path,
            name: telegramCopy.title,
            description: telegramCopy.description,
            dateModified: page.lastModified,
          }),
          breadcrumbNode(page.path, trail),
        )}
      />
      <div className="mx-auto max-w-6xl px-4 py-3">
        <Breadcrumbs items={trail} />
      </div>

      <section className="relative isolate overflow-hidden bg-emerald-950">
        <Image
          src={BANNER.path}
          alt=""
          fill
          quality={70}
          sizes="640px"
          className="-z-20 scale-110 object-cover object-center blur-2xl"
        />
        <div className="absolute inset-0 -z-10 bg-emerald-950/70" />
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 pt-6 pb-10 text-center sm:pt-8 sm:pb-12">
          <Image
            src={BANNER.path}
            alt="Yono Games — join us on Telegram for game updates, gift codes and announcements"
            width={BANNER.width}
            height={BANNER.height}
            preload
            quality={75}
            sizes="(max-width: 896px) 100vw, 864px"
            className="h-auto w-full rounded-2xl shadow-2xl ring-1 ring-white/20"
          />
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{telegramCopy.heading}</h1>
          <p className="mt-2 max-w-xl text-base text-emerald-50/90">
            Join the {site.name} Telegram channel for free gift codes, new Yono game listings, app guides and
            announcements.
          </p>
          <div className="mt-6">
            {siteLinks.telegram ? (
              <a
                href={siteLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#229ED9] px-6 text-base font-bold text-white shadow-lg ring-1 ring-white/30 hover:bg-[#1b8cc2]"
              >
                <TelegramIcon />
                Join on Telegram<span className="sr-only"> (opens Telegram in a new tab)</span>
              </a>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex min-h-12 cursor-not-allowed items-center gap-2 rounded-xl bg-white/20 px-6 text-base font-bold text-white/80"
              >
                <TelegramIcon />
                Telegram link coming soon
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4">
        <div className="prose-basic mt-8 text-[15px]">
          <h2>What we post</h2>
          <ul>
            <li>
              <strong>Gift codes</strong> for Yono games, shared free in the channel as we get them. A genuine gift code
              never costs money — don’t pay anyone for one.
            </li>
            <li>New Yono games as we add them to the directory, with a link to each app’s page.</li>
            <li>New and updated app guides, such as installing an APK or fixing login and OTP problems.</li>
            <li>Site announcements, like changes to listings or download links.</li>
          </ul>

          <h2>How to spot fake Yono Games Telegram groups</h2>
          <ul>
            <li>
              Our only official channel is the one linked from this page. Groups using our name or logo anywhere else
              aren’t run by us.
            </li>
            <li>We never message you first, and we never ask for money, deposits, OTPs, UPI PINs or passwords.</li>
            <li>
              We don’t sell “hacks”, “prediction tricks”, mod APKs or guaranteed-win tips — anyone offering them is
              running a scam.
            </li>
            <li>Install apps only from their official source, never from files sent in a chat.</li>
          </ul>

          <h2>More from {site.name}</h2>
          <p>
            Browse the <Link href="/">full Yono games list</Link>, read the{" "}
            <Link href={staticPages.installGuide.path}>APK install guide</Link>, or see{" "}
            <Link href={helpGuide("withdrawal").path}>understanding withdrawal conditions</Link> before you deposit
            anywhere. Telegram is a separate service with its own privacy policy.
          </p>
        </div>
      </div>
    </>
  );
}
