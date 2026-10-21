import type { AppRecord } from "@/data/types";
import { ratingSummaries } from "@/lib/ratings-store";
import { AppCard } from "./AppCard";

interface AppGridProps {
  apps: AppRecord[];
  id?: string;
  /** Cards rendered with eager image loading (those likely above the fold). */
  eagerCount?: number;
  showCategory?: boolean;
}

export async function AppGrid({ apps, id, eagerCount = 0, showCategory = true }: AppGridProps) {
  const ratings = await ratingSummaries(apps.map((app) => app.slug));
  return (
    <ul id={id} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {apps.map((app, index) => (
        <li
          key={app.id}
          id={`app-${app.slug}`}
          data-category={app.category}
          className={index < eagerCount ? undefined : "card-deferred"}
        >
          <AppCard app={app} eager={index < eagerCount} showCategory={showCategory} rating={ratings.get(app.slug)} />
        </li>
      ))}
    </ul>
  );
}
