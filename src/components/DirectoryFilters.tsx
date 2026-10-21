"use client";

import { useCallback, useEffect, useState } from "react";
import { DIRECTORY_FILTER_EVENT } from "./FilterLink";

export interface CategoryOption {
  id: string;
  label: string;
  count: number;
}

interface DirectoryFiltersProps {
  /** id of the server-rendered list whose items are shown or hidden. */
  gridId: string;
  total: number;
  categoryOptions: CategoryOption[];
}

/** Shows or hides the list items (by their data-category attribute) and returns how many are visible. */
function applyCategory(gridId: string, category: string): number {
  const grid = document.getElementById(gridId);
  if (!grid) return 0;
  let shown = 0;
  grid.querySelectorAll<HTMLLIElement>(":scope > li").forEach((li) => {
    const match = category === "all" || li.dataset.category === category;
    li.hidden = !match;
    if (match) shown += 1;
  });
  return shown;
}

/** Filter state lives only in the browser, so filtered views never become crawlable URLs. */
export function DirectoryFilters({ gridId, total, categoryOptions }: DirectoryFiltersProps) {
  const [category, setCategory] = useState("all");
  const [visible, setVisible] = useState(total);

  const select = useCallback(
    (next: string) => {
      setCategory(next);
      setVisible(applyCategory(gridId, next));
    },
    [gridId],
  );

  useEffect(() => {
    const onFilter = (event: Event) => select((event as CustomEvent<string>).detail);
    window.addEventListener(DIRECTORY_FILTER_EVENT, onFilter);
    return () => window.removeEventListener(DIRECTORY_FILTER_EVENT, onFilter);
  }, [select]);

  const options: CategoryOption[] = [{ id: "all", label: "All", count: total }, ...categoryOptions];

  return (
    <div className="mb-4 space-y-3">
      <div
        role="group"
        aria-label="Filter by category"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {options.map((option) => {
          const active = category === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              aria-controls={gridId}
              onClick={() => select(option.id)}
              className={
                "min-h-10 shrink-0 rounded-xl border px-4 text-sm font-medium whitespace-nowrap transition-colors " +
                (active
                  ? "border-emerald-800 bg-emerald-800 text-white shadow-sm"
                  : "border-gray-200 bg-white text-gray-800 hover:border-emerald-300 hover:bg-emerald-50")
              }
            >
              {option.label}{" "}
              <span
                className={
                  "ml-0.5 rounded-md px-1.5 py-0.5 text-xs " +
                  (active ? "bg-amber-400 font-semibold text-emerald-950" : "bg-gray-100 text-gray-600")
                }
              >
                {option.count}
              </span>
            </button>
          );
        })}
      </div>
      <p role="status" aria-live="polite" className="text-sm text-gray-700">
        Showing {visible} of {total} listings
      </p>
      <noscript>
        <p className="text-sm text-gray-600">Category filters need JavaScript. The full list is shown below.</p>
      </noscript>
    </div>
  );
}
