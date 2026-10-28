import Image from "next/image";
import Link from "next/link";
import { directoryStats } from "@/data/apps";
import { footerNav } from "@/lib/pages";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 rounded font-semibold text-gray-900">
              <Image
                src={site.logo.path}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-lg ring-2 ring-amber-400/70"
              />
              <span>{site.name}</span>
            </Link>
            <p className="mt-2 text-sm text-gray-600">{site.tagline}.</p>
          </div>
          {footerNav().map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <p className="text-sm font-semibold text-gray-900">{group.heading}</p>
              <ul className="mt-1">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      prefetch={false}
                      className="inline-block py-2 text-sm text-gray-700 hover:text-gray-900 hover:underline sm:py-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-8 space-y-2 border-t border-gray-200 pt-6 text-xs leading-relaxed text-gray-600">
          <p>
            {site.name} is an independent directory. It is not operated by, endorsed by or affiliated with the
            developers of any app listed here, or with any bank or banking app that uses the YONO name. App names
            belong to their respective owners. App tiles and banners are {site.name} illustrations, not official app
            icons or artwork.
          </p>
          <p>
            {directoryStats.liveAffiliateLinks > 0
              ? "Some download links are affiliate links and are marked as sponsored; we may earn a commission when you use them."
              : "This site currently contains no affiliate or sponsored links."}
          </p>
        </div>
      </div>
    </footer>
  );
}
