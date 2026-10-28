import { directoryStats, getListing, isChecked } from "@/data/apps";
import { categories } from "@/data/categories";
import type { AppRecord } from "@/data/types";
import { site } from "@/lib/site";

/**
 * Page titles, descriptions and short plain-text copy shared by the HTML pages, the
 * Markdown versions, llms.txt and the sitemap/IndexNow manifest. Keep this file free of
 * JSX and Next.js imports: scripts load it directly with Node.
 */

export const homeCopy = {
  title: "Yono Games List 2026 – All Yono Apps APK Download",
  h1: "Yono Games — All Yono Games List",
  description: `All ${directoryStats.listed} Yono games in one list – rummy, slots, spin & 777 apps with sign-up bonus, ₹100 min. withdrawal and one-tap APK download for Android.`,
  intro: `An independent directory of ${directoryStats.listed} Yono-related gaming apps. Browse the list by category, and use our guide to download and install an APK safely. We don’t work for any app operator.`,
};

export function directoryStatusSentence(): string {
  return directoryStats.checked === 0
    ? "None of these listings has been independently checked yet. Each one links to its own page explaining what the app is, how to play, and how to install it safely."
    : `${directoryStats.checked} of ${directoryStats.listed} listings have been independently checked.`;
}

/** Plain-language provenance summary used by llms.txt and the Markdown pages. */
export function sourcesSummary(): string {
  return (
    `Listing names come from a collection document supplied to ${site.name}, and icons from a supplied image set; ` +
    "categories are inferred from the words in each name, not from a confirmed catalogue. " +
    `${directoryStats.checked} of ${directoryStats.listed} listings have been independently checked. ` +
    "Every listing has its own page; developer, version and download details appear only for checked listings. Bonus and minimum-withdrawal figures are another website's claims and are labelled as such; the site makes no safety claims."
  );
}

export function categoryStatusSentence(): string {
  return directoryStats.checked === 0
    ? "These listings haven’t been independently checked yet; each app page explains what is and isn’t known."
    : `${directoryStats.checked} listings in the directory have been independently checked.`;
}

export interface CategoryCopy {
  title: string;
  description: string;
  heading: string;
  intro: string;
  /** Date the category page's own copy last changed significantly. */
  contentUpdated: string;
}

const listingCount = (id: string) => getListing(id)?.apps.length ?? 0;

/** Keyed by listing id: category ids plus name-collection ids such as "777". */
export const categoryCopy: Record<string, CategoryCopy> = {
  rummy: {
    title: "Yono Rummy Apps List 2026 – Rummy APK Download",
    description: `All ${listingCount("rummy")} Yono rummy apps in one list with sign-up bonus, minimum withdrawal and APK download for Android. Compare rummy games and install safely.`,
    heading: "Yono Rummy Apps",
    intro: `These ${listingCount("rummy")} listings have “Rummy” in their name. The category comes from the name alone: we haven’t confirmed which rummy formats, if any, each app actually offers, or who publishes it.`,
    contentUpdated: "2026-10-21",
  },
  slots: {
    title: "Yono Slots Apps — List of Slots Games",
    description: `${listingCount("slots")} Yono slots apps listed by name, with what to check in a slots game before you play. Independent directory.`,
    heading: "Yono Slots Apps",
    intro: `These ${listingCount("slots")} listings have “Slots” in their name. A slots name can belong to a single reel game, a lobby of several games or just a download page; we haven’t confirmed which applies to each listing.`,
    contentUpdated: "2026-10-21",
  },
  spin: {
    title: "Yono Spin Games — List of Spin Apps",
    description: `${listingCount("spin")} Yono spin games listed by name, with what “spin” can mean and what to check before you play. Independent directory.`,
    heading: "Yono Spin Games",
    intro: `These ${listingCount("spin")} listings have “Spin” in their name. “Spin” can describe slot reels, a prize wheel or just branding, so the name alone doesn’t tell you which kind of game each one is.`,
    contentUpdated: "2026-10-21",
  },
  "777": {
    title: "Yono 777 Games — List of 777 Apps",
    description: `${listingCount("777")} Yono 777 games listed by name across categories, with what the “777” label does and doesn’t tell you. Independent directory.`,
    heading: "Yono 777 Games",
    intro: `These ${listingCount("777")} listings have “777” in their name. “777” is a common slot-machine symbol, but here it is only part of each name; it doesn’t confirm a game type, a publisher or any link between these apps.`,
    contentUpdated: "2026-10-21",
  },
};

export const guideCopy = {
  metaTitle: "How to Install an APK on Android — Yono Games Guide",
  headline: "How to Download and Install an APK File on Android",
  description:
    "Step-by-step guide to downloading and installing Yono game APK files on Android: checking the source, allowing installs, and fixing common errors.",
  datePublished: "2026-10-21",
};

export interface HelpGuide {
  key: "install" | "login" | "otp" | "update" | "withdrawal";
  path: string;
  /** Short label for navigation and link lists. */
  label: string;
  headline: string;
  metaTitle: string;
  description: string;
  datePublished: string;
  dateModified: string;
}

export const helpGuides: HelpGuide[] = [
  {
    key: "install",
    path: "/guides/install-apk/",
    label: "Installation problems",
    headline: guideCopy.headline,
    metaTitle: guideCopy.metaTitle,
    description: guideCopy.description,
    datePublished: guideCopy.datePublished,
    dateModified: "2026-10-21",
  },
  {
    key: "login",
    path: "/guides/login-problems/",
    label: "Login problems",
    headline: "Can’t Log In to a Yono Game App? Fixes to Try",
    metaTitle: "Yono Game App Login Problems — What to Check",
    description:
      "Why a Yono game app may not let you log in, and what to check: connection, app version, phone number, password reset, cache and account blocks.",
    datePublished: "2026-10-21",
    dateModified: "2026-10-21",
  },
  {
    key: "otp",
    path: "/guides/otp-not-received/",
    label: "OTP delays",
    headline: "OTP Not Received or Delayed: What to Check",
    metaTitle: "OTP Not Received in a Yono Game App — Fixes",
    description:
      "What to check when a login or verification OTP is late or never arrives, from signal and SMS filters to resend limits, and how to keep OTPs safe.",
    datePublished: "2026-10-21",
    dateModified: "2026-10-21",
  },
  {
    key: "update",
    path: "/guides/update-app/",
    label: "Updating an app",
    headline: "How to Update an App Installed from an APK",
    metaTitle: "How to Update a Yono Game APK Safely",
    description:
      "How apps installed from APK files get updated, how to check your current version, and how to install an update without losing your data.",
    datePublished: "2026-10-21",
    dateModified: "2026-10-21",
  },
  {
    key: "withdrawal",
    path: "/guides/withdrawal-conditions/",
    label: "Withdrawal conditions",
    headline: "Understanding Bonus and Withdrawal Conditions",
    metaTitle: "Bonus & Withdrawal Conditions Explained — Yono Games",
    description:
      "What minimum withdrawals, bonus balances, wagering requirements, KYC and tax deductions mean, and the warning signs of a withdrawal scam.",
    datePublished: "2026-10-21",
    dateModified: "2026-10-21",
  },
];

export const guidesHubCopy = {
  title: "Help Guides for Yono Game Apps",
  heading: "Help Guides",
  description:
    "Practical guides for Yono game apps: installing APK files, login problems, OTP delays, updating apps and understanding withdrawal conditions.",
};

export function helpGuide(key: HelpGuide["key"]): HelpGuide {
  return helpGuides.find((guide) => guide.key === key) as HelpGuide;
}

export const aboutCopy = {
  title: `About ${site.name}`,
  description: `What ${site.name} is, how the Yono games directory is put together, and what it does not do.`,
};

export const editorialCopy = {
  title: "Editorial Policy and Research Method",
  description: `How ${site.name} researches app listings, what “checked” means, how dates, ratings and claims are shown, who edits the directory, and how corrections work.`,
};

export const contactCopy = {
  title: `Contact ${site.name}`,
  description: `How to contact ${site.name} about directory listings and corrections.`,
};

export const telegramCopy = {
  title: "Yono Games Telegram Channel — Join for Updates",
  heading: "Yono Games Telegram",
  description: `Join the ${site.name} Yono Games Telegram channel for free gift codes, new Yono game listings, app guides and announcements, plus how to spot fake Yono Telegram groups.`,
};

export const privacyCopy = {
  title: "Privacy Policy",
  description: `How ${site.name} handles your data: no accounts or tracking scripts, what problem reports store, and how hosting logs and external links work.`,
};
export const termsCopy = {
  title: "Terms of Use",
  description: `Terms for using ${site.name}, an independent Yono games directory: information is general guidance, downloads are at your own risk, and external sites have their own terms.`,
};

export const newAppsCopy = {
  title: "New Yono Games — Recently Added Apps",
  description: "Yono-related apps in the order they were added to the directory, with the date each one was added.",
};

/** Date the app page template and its general guidance last changed significantly. */
export const APP_PAGE_CONTENT_UPDATED = "2026-10-21";

/**
 * When an app's page last changed: the template date, or a later check, verification note,
 * known issue or bonus-terms entry recorded for that app. Used for the visible "Last updated"
 * date, the page's dateModified markup and the sitemap lastmod, so all three always agree.
 */
export function appPageUpdated(app: AppRecord): string {
  const dates = [
    APP_PAGE_CONTENT_UPDATED,
    app.checkedAt,
    ...app.verificationLog.map((note) => note.date),
    ...app.knownIssues.map((note) => note.date),
    ...app.bonusTerms.map((note) => note.date),
  ]
    .filter((date): date is string => typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date))
    .map((date) => date.slice(0, 10));
  return dates.sort().at(-1) as string;
}

/** Android install steps shown on every app page; also used verbatim in its HowTo markup. */
export function androidInstallSteps(name: string): string[] {
  return [
    `Get ${name} only from its confirmed official source (see above). If it’s on Google Play, tap Install there and skip the remaining steps.`,
    "Open the downloaded APK file. If Android asks, allow your browser or file manager to install unknown apps (Settings → Apps → Special app access → Install unknown apps; menu names vary by phone).",
    "Tap Install. If Google Play Protect warns that the app is harmful, stop.",
    `Open ${name}, review the permissions it requests, and switch Install unknown apps off again.`,
  ];
}

/**
 * Hand-written meta title and description for the highest-traffic app pages, keyed by slug.
 * Titles are used as-is (no " | Yono Game APK" suffix) to stay within ~60 characters.
 */
export const appMetaOverrides: Record<string, { title: string; description: string }> = {
  "inr-slots": {
    title: "INR Slots APK Download – ₹410 Bonus | Latest 2026",
    description:
      "INR Slots APK download for Android: ₹410 sign-up bonus, ₹100 minimum withdrawal, how to play slots and a step-by-step install guide. Download INR Slots now.",
  },
  "yes-spin": {
    title: "Yes Spin APK Download – ₹33 Bonus | Latest 2026",
    description:
      "Download Yes Spin APK for Android: ₹33 sign-up bonus, ₹100 minimum withdrawal, how the spin games work and how to install the app safely in a few taps.",
  },
  "yono-app": {
    title: "Yono App Download APK – ₹500 Bonus | Yono Games 2026",
    description:
      "Yono App APK download for Android: ₹500 sign-up bonus, ₹100 minimum withdrawal, how to play and a simple step-by-step install and login guide.",
  },
  "ever-777": {
    title: "Ever 777 APK Download – ₹38 Bonus | Latest 2026",
    description:
      "Download Ever 777 APK for Android: ₹38 sign-up bonus, ₹100 minimum withdrawal, how to play 777 games and a quick step-by-step install guide.",
  },
  "mdm-bet-app": {
    title: "MDM Bet App Download APK – ₹39 Bonus | 2026",
    description:
      "MDM Bet App APK download for Android: ₹39 sign-up bonus, ₹100 minimum withdrawal, games inside the app, and how to install and log in safely.",
  },
  "101z-app": {
    title: "101Z App Download APK – ₹45 Bonus | Latest 2026",
    description:
      "Download 101Z App APK for Android: ₹45 sign-up bonus, ₹100 minimum withdrawal, how to play and a step-by-step guide to install 101Z App safely.",
  },
  "my-777-apk": {
    title: "My 777 APK Download – ₹46 Bonus | Latest 2026",
    description:
      "My 777 APK download for Android: ₹46 sign-up bonus, ₹100 minimum withdrawal, how to play 777 slots and how to install My 777 in a few steps.",
  },
  "567-slots": {
    title: "567 Slots APK Download – ₹44 Bonus | Latest 2026",
    description:
      "Download 567 Slots APK for Android: ₹44 sign-up bonus, ₹100 minimum withdrawal, how the slot games work and a quick, safe install guide.",
  },
};

export function hasCustomAppMeta(app: AppRecord): boolean {
  return app.slug in appMetaOverrides;
}

/** Says "Download" only when the page has a real download link. */
export function appPageTitle(app: AppRecord): string {
  const custom = appMetaOverrides[app.slug];
  if (custom) return custom.title;
  return `${app.name} APK${app.downloadUrl ? " Download" : ""} — What It Is, How to Play & Install`;
}

export function appPageDescription(app: AppRecord): string {
  const custom = appMetaOverrides[app.slug];
  if (custom) return custom.description;
  if (app.summary && isChecked(app)) return app.summary.slice(0, 160);
  const kind = app.category === "general" || app.category === "collection" ? "Yono-related" : `${categories[app.category].label.toLowerCase()}-named`;
  return `${app.name}: what this ${kind} app is, how to play, where to get it, whether it’s safe, and how to install it on Android or iPhone. Independent, unverified listing.`;
}

const editorialReplacements: [RegExp, string][] = [
  [/ is a game or app label supplied for this collection\./g, " is a game or app name listed in our directory."],
  [/ (?:in|from) the supplied collection/g, " in our directory"],
  [/ from the supplied list/g, " in our directory"],
  [/ in the collection\b/g, " in our directory"],
  [/is asserted in this entry/g, "is claimed on this page"],
  [/has been verified for this entry/g, "has been verified for this app"],
  [/This entry explains/g, "This page explains"],
  [/this entry/g, "this page"],
];

/** Adapts supplied-document wording (written about "entries" in a "collection") for a public page. */
export function editorialize(text: string): string {
  return editorialReplacements.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text);
}

export const disclaimerCopy = {
  title: "Disclaimer",
  description: `${site.name} is an independent information directory: no affiliation with app operators or banks, downloads at your own risk, and no verified claims.`,
};

export const responsibleGamingCopy = {
  title: "Responsible Gaming",
  description: "Practical limits, warning signs and where to find help if gaming apps stop being fun, plus the legal position on online money games in India.",
};
