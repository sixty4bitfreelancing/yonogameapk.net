import Link from "next/link";
import { appPath, confusableApps } from "@/data/apps";
import { categories } from "@/data/categories";
import type { AppRecord } from "@/data/types";
import { formatDate } from "@/lib/format";
import type { RatingSummary } from "@/lib/ratings-store";
import { AppIcon } from "./AppIcon";
import { EditorScore } from "./EditorScore";
import { RatingBadge } from "./RatingBadge";

interface AppCardProps {
  app: AppRecord;
  eager?: boolean;
  showCategory?: boolean;
  /** Visitor rating summary; null or missing shows "Not rated yet". */
  rating?: RatingSummary | null;
}

export function AppCard({ app, eager = false, showCategory = true, rating = null }: AppCardProps) {
  const href = appPath(app);
  const confusable = confusableApps(app);
  return (
    <article className="relative flex h-full items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 active:bg-gray-50">
      <AppIcon app={app} eager={eager} />
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold leading-snug break-words text-gray-900">{app.name}</h3>
        <p className="mt-0.5">
          {app.editorScore !== null ? <EditorScore score={app.editorScore} /> : <RatingBadge rating={rating} />}
        </p>
        {showCategory ? <p className="mt-0.5 text-xs text-gray-600">{categories[app.category].label}</p> : null}
        {confusable.length ? (
          <p className="mt-0.5 text-xs text-amber-800">Not {confusable.map((a) => a.name).join(" or ")}</p>
        ) : null}
        {app.summary ? <p className="mt-1.5 text-xs leading-relaxed text-gray-700">{app.summary}</p> : null}
        {app.checkedAt ? (
          <p className="mt-1 text-xs text-gray-500">Checked {formatDate(app.checkedAt)}</p>
        ) : null}
        {href ? (
          <Link
            href={href}
            prefetch={false}
            className="mt-1 inline-block py-1 text-xs font-medium text-blue-700 underline-offset-2 after:absolute after:inset-0 after:rounded-lg hover:underline"
          >
            View details<span className="sr-only"> for {app.name}</span>
          </Link>
        ) : null}
      </div>
    </article>
  );
}
