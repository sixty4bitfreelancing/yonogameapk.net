import { appPageUpdated } from "@/content/copy";
import type { AppRecord } from "@/data/types";
import { RECOMMENDED_DEVICE } from "./AppQuickStats";
import { formatDate, hostname } from "@/lib/format";
import type { VisitorRating } from "@/lib/jsonld";
import { AppIcon } from "./AppIcon";
import { RatingWidget } from "./RatingWidget";

/** APK download panel. The button is live only when a real download URL has been added for the app. */
export function DownloadCard({ app, rating }: { app: AppRecord; rating: VisitorRating | null }) {
  const details: [string, string][] = [
    ["APK size", app.stats.apkSize?.value ?? "Not confirmed"],
    ["Downloads", app.stats.downloads?.value ?? "Not confirmed"],
    ["Android", app.stats.os?.value ?? RECOMMENDED_DEVICE.os?.replace(/^Android /, "") ?? "Not confirmed"],
    ["Last updated", formatDate(app.appUpdate?.date ?? appPageUpdated(app))],
  ];
  const downloadCheckedAt = app.provenance.downloadUrl?.checkedAt ?? null;
  const rel = app.downloadIsAffiliate ? "sponsored noopener noreferrer" : "noopener noreferrer";

  return (
    <section id="download" aria-labelledby="download-heading" className="mt-6 scroll-mt-4 rounded-xl border border-gray-200 p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <AppIcon app={app} size={64} />
        <div className="min-w-0 flex-1">
          <h2 id="download-heading" className="text-lg font-semibold text-gray-900">
            Download {app.name} APK
          </h2>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className={value === "Not confirmed" ? "text-gray-500" : "font-medium text-gray-900"}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {app.editorScore === null ? (
      <div className="mt-4 border-t border-gray-100 pt-4">
        {app.externalRating ? (
          <p className="mb-3 text-sm text-gray-700">
            <span className="font-semibold text-gray-900">{app.externalRating.value.toFixed(1)}</span> out of 5 on{" "}
            <a href={app.externalRating.source} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-700 underline">
              {hostname(app.externalRating.source)}
            </a>
            {app.externalRating.count !== null
              ? ` (${app.externalRating.count.toLocaleString("en-IN")} ratings)`
              : ""}
            <span className="text-xs text-gray-500"> · checked {formatDate(app.externalRating.checkedAt)}</span>
          </p>
        ) : null}
        <RatingWidget slug={app.slug} name={app.name} initial={rating} />
      </div>
      ) : null}

      <div className="mt-4 border-t border-gray-100 pt-4">
        {app.downloadUrl ? (
          <>
            <a
              href={app.downloadUrl}
              target="_blank"
              rel={rel}
              className="inline-flex w-full items-center justify-center rounded-lg bg-blue-700 px-5 py-3 text-base font-semibold text-white hover:bg-blue-800 sm:w-auto"
            >
              Download {app.name} APK<span className="sr-only"> (opens {hostname(app.downloadUrl)} in a new tab)</span>
            </a>
            <p className="mt-2 text-xs text-gray-600">
              Opens {hostname(app.downloadUrl)}. We don’t host the file.{" "}
              {downloadCheckedAt ? `Link checked ${formatDate(downloadCheckedAt)}.` : "This link hasn’t been checked yet."}
              {app.downloadIsAffiliate ? " Affiliate link: we may earn a commission." : ""}
            </p>
          </>
        ) : (
          <>
            <span
              aria-disabled="true"
              className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-lg bg-gray-200 px-5 py-3 text-base font-semibold text-gray-500 sm:w-auto"
            >
              Download not available yet
            </span>
          </>
        )}
        {app.editorScore === null ? (
          <p className="mt-2 text-xs text-gray-500">Ratings are visitors’ opinions, not our verdict on the app.</p>
        ) : null}
      </div>
    </section>
  );
}
