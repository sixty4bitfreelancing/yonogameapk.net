/**
 * Site-wide outbound links, set as environment variables (.env.local locally, or the host's
 * environment settings) and read at build time. Rebuild after changing them.
 *
 *   DOWNLOAD_URL            one destination for every game's Download button
 *   DOWNLOAD_URL_SPONSORED  "true" if DOWNLOAD_URL is an affiliate/referral link (adds rel="sponsored" and a disclosure)
 *   TELEGRAM_URL            the Yono Games Telegram channel, used on /telegram/
 */

function httpUrl(name: string): string | null {
  const value = process.env[name]?.trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a full http(s) URL, got "${value}"`);
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
