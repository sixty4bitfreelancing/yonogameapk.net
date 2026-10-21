import type { ReactNode } from "react";
import type { Crumb } from "@/lib/breadcrumbs";
import { Breadcrumbs } from "./Breadcrumbs";

interface SimplePageProps {
  trail: Crumb[];
  heading: string;
  draft?: boolean;
  children: ReactNode;
}

export function SimplePage({ trail, heading, draft = false, children }: SimplePageProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 pt-4">
      <Breadcrumbs items={trail} />
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{heading}</h1>
      {draft ? (
        <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Draft — this page is incomplete and is not published or indexed. It lists what is still needed below.
        </p>
      ) : null}
      <div className="prose-basic mt-6">{children}</div>
    </article>
  );
}
