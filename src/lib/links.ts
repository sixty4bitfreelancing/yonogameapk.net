/**
 * Site-wide outbound links, set as environment variables (.env.local locally, or the host's
 * environment settings) and read at build time. Rebuild after changing them.
 *
 *   DOWNLOAD_URL            one destination for every Download button (full URL or a /path to a file in public/)
 *   DOWNLOAD_URL_SPONSORED  "true" if DOWNLOAD_URL is an affiliate/referral link (adds rel="sponsored" and a disclosure)
 *   TELEGRAM_URL            the Yono Games Telegram channel, used on /telegram/
 */

function httpUrl(name: string): string | null {
  const raw = process.env[name]?.trim();
  if (!raw) return null;
  // A root-relative path such as "/downloads/maanwin.apk" points to a file served from public/.
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  // Accept a bare domain such as "example.com/download" by assuming https.
  const value = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw.replace(/^\/+/, "")}`;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a full http(s) URL, got "${raw}"`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`${name} must start with https:// or http://, got "${value}"`);
  }
  return url.href;
}

export const siteLinks = {
  download: httpUrl("DOWNLOAD_URL"),
  downloadSponsored: process.env.DOWNLOAD_URL_SPONSORED?.trim() === "true",
  telegram: httpUrl("TELEGRAM_URL"),
};

/** True when a link points to a file on this site (e.g. /downloads/maanwin.apk) rather than an external page. */
export function isLocalFile(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}
