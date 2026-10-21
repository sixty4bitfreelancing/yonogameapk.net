import type { AppRecord, SourcedStat, StatKey } from "@/data/types";
import { formatDate, hostname } from "@/lib/format";

const groups: { title: string; fields: [StatKey, string][] }[] = [
  {
    title: "Quick stats",
    fields: [
      ["apkSize", "APK size"],
      ["downloads", "Downloads"],
      ["rating", "Rating"],
      ["support", "Support"],
      ["signupBonus", "Sign-up bonus"],
      ["minWithdrawal", "Minimum withdrawal"],
    ],
  },
  {
    title: "Security and compliance",
    fields: [
      ["encryption", "SSL encryption"],
      ["paymentPartners", "Payment partners"],
      ["rngCertification", "RNG certification"],
      ["dataPrivacy", "Data privacy"],
    ],
  },
  {
    title: "Supported devices and requirements",
    fields: [
      ["os", "Operating system"],
      ["ram", "Minimum RAM"],
      ["storage", "Storage space"],
      ["internet", "Internet"],
      ["screen", "Screen size"],
    ],
  },
];

/** Our general device recommendation for Yono games, shown where an app has no published requirement of its own. */
const RECOMMENDED_DEVICE: Partial<Record<StatKey, string>> = {
  os: "Android 5.0 or higher",
  ram: "2 GB",
  storage: "100 MB free",
  internet: "Wi-Fi or 4G/5G",
  screen: "4.5 inches or larger",
};

/** What a visitor can check themselves for each security item that hasn't been confirmed for the app. */
const SECURITY_CHECKS: Partial<Record<StatKey, string>> = {
  encryption:
    "The app’s website and payment pages open over https:// with a padlock, and the app doesn’t send you to unsecured pages to pay.",
  paymentPartners:
    "Deposits go through a recognised UPI or bank payment page that shows a business name. Never pay to a personal UPI ID or someone’s phone number.",
  rngCertification:
    "For slots and spin games, look for a certificate from a named testing lab, then check that certificate on the lab’s own website.",
  dataPrivacy:
    "A privacy policy names the company, explains what data is collected and tells you how to delete your account. Be wary of apps that ask for SMS or contacts access.",
};

function RecommendedValue({ value }: { value: string }) {
  return (
    <>
      <span className="font-medium text-gray-900">{value}</span>
      <span className="block text-xs text-gray-500">Recommended</span>
    </>
  );
}

function sourceLabel(source: string): string {
  return /^https?:\/\//.test(source) ? hostname(source) : source;
}

function StatValue({ stat }: { stat: SourcedStat | undefined }) {
  if (!stat) return <span className="text-gray-500">Not yet verified</span>;
  return (
    <>
      <span className="font-medium text-gray-900">{stat.value}</span>
      <span className="block text-xs text-gray-500">
        {stat.claim === "operator"
          ? "Operator’s claim, not confirmed · "
          : stat.claim === "third-party"
            ? "Listed claim, not confirmed · "
            : `Source: ${sourceLabel(stat.source)} · `}
        checked {formatDate(stat.checkedAt)}
      </span>
    </>
  );
}

export function AppQuickStats({ app }: { app: AppRecord }) {
  const external = app.externalRating;
  const stats: AppRecord["stats"] =
    external && !app.stats.rating
      ? {
          ...app.stats,
          rating: {
            value: `${external.value.toFixed(1)} out of 5${external.count !== null ? ` (${external.count.toLocaleString("en-IN")} ratings)` : ""}`,
            source: external.source,
            checkedAt: external.checkedAt,
            claim: "none",
          },
        }
      : app.stats;
  const filled = Object.keys(stats).length;
  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-700">
        {filled === 0
          ? `None of these details have been verified for ${app.name} yet. We only show a figure once we’ve found it in a named source, so treat claims elsewhere with care.`
          : `Figures are shown with the date they were checked. Listed claims haven’t been confirmed by us or the operator; bonuses usually carry conditions, so read ${app.name}’s own terms before depositing.`}
      </p>
      {groups.map((group) => {
        const checks = group.fields.filter(([key]) => !stats[key] && SECURITY_CHECKS[key]);
        const rows = group.fields.filter(([key]) => !(!stats[key] && SECURITY_CHECKS[key]));
        return (
        <div key={group.title}>
          <h3 className="text-base font-semibold text-gray-900">{group.title}</h3>
          {rows.length ? (
          <table className="mt-2 w-full border-collapse text-sm">
            <caption className="sr-only">
              {group.title} for {app.name}
            </caption>
            <tbody>
              {rows
                .filter(([key]) => !(key === "rating" && app.editorScore !== null && !stats.rating))
                .map(([key, label]) => (
                <tr key={key} className="border-b border-gray-200 last:border-0">
                  <th scope="row" className="w-44 py-2 pr-4 text-left align-top font-medium text-gray-600">
                    {label}
                  </th>
                  <td className="py-2 align-top">
                    {!stats[key] && RECOMMENDED_DEVICE[key] ? (
                      <RecommendedValue value={RECOMMENDED_DEVICE[key]} />
                    ) : (
                      <StatValue stat={stats[key]} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          ) : null}
          {checks.length ? (
            <div className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 text-sm">
              <p className="font-medium text-gray-900">What to check before you deposit in {app.name}</p>
              <ul className="mt-2 space-y-1.5">
                {checks.map(([key, label]) => (
                  <li key={key} className="flex gap-2 text-gray-700">
                    <span aria-hidden="true" className="mt-0.5 text-emerald-700">
                      ✓
                    </span>
                    <span>
                      <strong className="font-medium text-gray-900">{label}:</strong> {SECURITY_CHECKS[key]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {group.fields.some(([key]) => !stats[key] && RECOMMENDED_DEVICE[key]) ? (
            <p className="mt-2 text-xs text-gray-500">
              Recommended values are our general guidance for running Yono games smoothly, not requirements published by{" "}
              {app.name}.
            </p>
          ) : null}
        </div>
        );
      })}
    </div>
  );
}
