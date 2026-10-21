import Link from "next/link";
import type { Crumb } from "@/lib/breadcrumbs";

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-600">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="text-gray-900">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link href={item.path} className="inline-block py-1.5 hover:text-gray-900 hover:underline">
                    {item.name}
                  </Link>
                  <span aria-hidden="true" className="text-gray-400">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
