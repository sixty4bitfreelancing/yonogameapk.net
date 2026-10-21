import Link from "next/link";
import type { ReactNode } from "react";
import { categoryPath, isChecked } from "@/data/apps";
import { categories } from "@/data/categories";
import type { AppRecord } from "@/data/types";
import { formatDate, hostname } from "@/lib/format";

/** The app's identity, plus developer and official website once they have been recorded. */
export function AppInfoTable({ app }: { app: AppRecord }) {
  const catPath = categoryPath(app.category);
  const external = (url: string) => (
    <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-700 hover:underline">
      {hostname(url)}
    </a>
  );
  const rows: [string, ReactNode][] = [
    ["App name", app.name],
    ...(app.aliases.length ? [["Also listed as", app.aliases.join(", ")] as [string, ReactNode]] : []),
    [
      "Category (by name)",
      catPath ? (
        <Link href={catPath} className="text-blue-700 hover:underline">
          {categories[app.category].label}
        </Link>
      ) : (
        categories[app.category].label
      ),
    ],
    ...(app.developer && isChecked(app) ? [["Developer", app.developer] as [string, ReactNode]] : []),
    ...(app.sourceUrl ? [["Official website", external(app.sourceUrl)] as [string, ReactNode]] : []),
    ...(app.addedAt ? [["Added to directory", formatDate(app.addedAt)] as [string, ReactNode]] : []),
  ];

  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">Identity and sources for {app.name}</caption>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-gray-200 last:border-0">
            <th scope="row" className="w-44 py-2 pr-4 text-left align-top font-medium text-gray-600">
              {label}
            </th>
            <td className="py-2 text-gray-900">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
