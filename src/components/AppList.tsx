import Link from "next/link";
import { appPath, confusableApps } from "@/data/apps";
import { categories } from "@/data/categories";
import type { AppRecord } from "@/data/types";
import { ratingSummaries, type RatingSummary } from "@/lib/ratings-store";
import { AppIcon } from "./AppIcon";
import { EditorScore } from "./EditorScore";
import { RatingBadge } from "./RatingBadge";

function GiftIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" aria-hidden="true" focusable="false">
      <path
        d="M3 8h14v3H3zM4.5 11h11v6h-11zM10 8v9M10 8c-1.5 0-4-.5-4-2.3C6 4 8.5 4.5 10 8zm0 0c1.5 0 4-.5 4-2.3C14 4 11.5 4.5 10 8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" aria-hidden="true" focusable="false">
      <path
        d="M3.5 6.5h12a1 1 0 011 1v8a1 1 0 01-1 1h-12a1 1 0 01-1-1v-10a1.5 1.5 0 011.5-1.5H14v2M13 11.5h3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" focusable="false">
      <path
        d="M10 3v9m0 0l-3.5-3.5M10 12l3.5-3.5M4 15.5h12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const downloadButton =
  "relative z-10 inline-flex min-h-10 shrink-0 items-center gap-1 rounded-xl bg-linear-to-b from-amber-300 to-amber-500 px-2.5 text-sm font-bold text-emerald-950 shadow-sm ring-1 ring-amber-600/30 hover:from-amber-200 hover:to-amber-400 sm:gap-1.5 sm:px-4";

function AppRow({ app, eager, rating }: { app: AppRecord; eager: boolean; rating: RatingSummary | undefined }) {
  const href = appPath(app) as string;
  const confusable = confusableApps(app);
  const bonus = app.stats.signupBonus?.value;
  const withdrawal = app.stats.minWithdrawal?.value;
  return (
    <article className="relative flex h-full items-center gap-2.5 rounded-2xl border border-gray-200 bg-white p-2.5 shadow-sm transition-shadow hover:border-emerald-200 hover:shadow-md sm:gap-4 sm:p-4">
      <AppIcon app={app} size={52} eager={eager} />
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-semibold leading-snug break-words text-gray-900">{app.name}</h3>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {app.editorScore !== null ? <EditorScore score={app.editorScore} /> : <RatingBadge rating={rating} />}
          <span className="rounded bg-emerald-50 px-1.5 text-[11px] font-medium text-emerald-800">
            {categories[app.category].label}
          </span>
        </p>
        {bonus || withdrawal ? (
          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
            {bonus ? (
              <li className="flex items-center gap-1 font-medium whitespace-nowrap text-rose-600">
                <GiftIcon />
                <span className="sm:hidden">Bonus</span>
                <span className="hidden sm:inline">Sign-up bonus</span> {bonus}
              </li>
            ) : null}
            {withdrawal ? (
              <li className="flex items-center gap-1 whitespace-nowrap text-gray-600">
                <WalletIcon />
                <span className="sm:hidden">Withdraw</span>
                <span className="hidden sm:inline">Min. withdraw</span> {withdrawal}
              </li>
            ) : null}
          </ul>
        ) : null}
        {confusable.length ? (
          <p className="mt-0.5 text-xs text-amber-800">Not {confusable.map((a) => a.name).join(" or ")}</p>
        ) : null}
        <Link href={href} prefetch={false} className="after:absolute after:inset-0 after:rounded-2xl">
          <span className="sr-only">View details for {app.name}</span>
        </Link>
      </div>
      <Link href={href} prefetch={false} className={downloadButton}>
        <DownloadIcon />
        Download<span className="sr-only"> {app.name} APK</span>
      </Link>
    </article>
  );
}

/** Full-width app rows for the homepage directory; items carry data-category for the category tabs. */
export async function AppList({ apps, id, eagerCount = 0 }: { apps: AppRecord[]; id: string; eagerCount?: number }) {
  const ratings = await ratingSummaries(apps.map((app) => app.slug));
  return (
    <ul id={id} className="grid gap-2.5 lg:grid-cols-2">
      {apps.map((app, index) => (
        <li
          key={app.id}
          id={`app-${app.slug}`}
          data-category={app.category}
          className={index < eagerCount ? undefined : "row-deferred"}
        >
          <AppRow app={app} eager={index < eagerCount} rating={ratings.get(app.slug)} />
        </li>
      ))}
    </ul>
  );
}
