"use client";

import type { ReactNode } from "react";

export const DIRECTORY_FILTER_EVENT = "directory:filter";

/** Jumps to the directory and applies a category filter there. Without JavaScript it is a plain jump link. */
export function FilterLink({ category, children }: { category: string; children: ReactNode }) {
  return (
    <a
      href="#directory"
      onClick={() => window.dispatchEvent(new CustomEvent(DIRECTORY_FILTER_EVENT, { detail: category }))}
      className="text-blue-700 underline-offset-2 hover:underline"
    >
      {children}
    </a>
  );
}
