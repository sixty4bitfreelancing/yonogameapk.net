import type { Metadata } from "next";
import Link from "next/link";
import { staticPages } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 text-gray-700">
        This page doesn’t exist or hasn’t been published. Every listed app has a page linked from the directory.
      </p>
      <ul className="mt-4 space-y-1 text-sm">
        <li>
          <Link href="/#directory" className="text-blue-700 underline">
            Browse all Yono games
          </Link>
        </li>
        <li>
          <Link href={staticPages.installGuide.path} className="text-blue-700 underline">
            Read the APK install guide
          </Link>
        </li>
      </ul>
    </div>
  );
}
