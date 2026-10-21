import Link from "next/link";
import { siteLinks } from "@/lib/links";
import { staticPages } from "@/lib/pages";

export function TelegramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M21.9 4.3c.3-1.2-.9-2.2-2-1.7L2.8 9.2c-1.2.5-1.1 2.2.1 2.6l4.3 1.4 1.7 5.3c.3 1 1.6 1.3 2.3.6l2.5-2.4 4.5 3.3c.9.7 2.2.2 2.5-.9l3.2-14.2zM9.6 14.3l-.5 3.5-1.3-4.2 9.9-6.3-8.1 7z"
      />
    </svg>
  );
}

const buttonClass =
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#1b8cc2] shadow-sm hover:bg-sky-50";

/** Telegram channel call-to-action: opens TELEGRAM_URL when set, otherwise the site's /telegram/ page. */
export function TelegramCta() {
  return (
    <aside
      aria-label="Yono Games Telegram"
      className="mt-4 flex flex-col gap-3 rounded-xl bg-linear-to-r from-[#229ED9] to-[#1b8cc2] p-4 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
          <TelegramIcon className="h-6 w-6" />
        </span>
        <div>
          <p className="font-bold">Join Yono Games on Telegram</p>
          <p className="text-sm text-sky-50/90">Free gift codes, new games and app updates.</p>
        </div>
      </div>
      {siteLinks.telegram ? (
        <a href={siteLinks.telegram} target="_blank" rel="noopener noreferrer" className={buttonClass}>
          <TelegramIcon className="h-4 w-4" />
          Join on Telegram<span className="sr-only"> (opens Telegram in a new tab)</span>
        </a>
      ) : (
        <Link href={staticPages.telegram.path} className={buttonClass}>
          <TelegramIcon className="h-4 w-4" />
          Join on Telegram
        </Link>
      )}
    </aside>
  );
}
