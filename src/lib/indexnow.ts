import { site } from "./site";

/**
 * IndexNow notifies participating search engines (such as Bing and Yandex) that URLs changed.
 * A 200/202 response means the notification was received, not that anything was indexed.
 * It is not a Google API.
 */
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const INDEXNOW_MAX_URLS_PER_REQUEST = 10_000;

export const indexNowHost = new URL(site.url).host;
export const indexNowKeyLocation = `${site.url}/${site.indexNowKey}.txt`;

export interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

export interface UrlRejection {
  url: string;
  reason: string;
}

export function isValidIndexNowKey(key: string): boolean {
  return /^[A-Za-z0-9-]{8,128}$/.test(key);
}

/**
 * Accepts only canonical URLs on the site origin: https, exact host, no credentials, port,
 * query or fragment, and the trailing-slash path convention. Duplicates are removed.
 */
export function validateSubmissionUrls(
  urls: string[],
  origin: string = site.url,
): { accepted: string[]; rejected: UrlRejection[] } {
  const expected = new URL(origin);
  const accepted: string[] = [];
  const rejected: UrlRejection[] = [];
  const seen = new Set<string>();

  for (const raw of urls) {
    const value = raw.trim();
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      rejected.push({ url: raw, reason: "not an absolute URL" });
      continue;
    }
    const reason =
      url.protocol !== "https:"
        ? "must use https"
        : url.host !== expected.host
          ? `foreign host (${url.host}); only ${expected.host} is allowed`
          : url.username || url.password
            ? "must not contain credentials"
            : url.port
              ? "must not include a port"
              : url.search || value.includes("?")
                ? "must not include a query string"
                : url.hash || value.includes("#")
                  ? "must not include a fragment"
                  : !url.pathname.endsWith("/")
                    ? "not canonical: paths end with a trailing slash"
                    : url.pathname.includes("//")
                      ? "not canonical: empty path segment"
                      : url.href !== value
                        ? `not canonical: expected ${url.href}`
                        : null;
    if (reason) {
      rejected.push({ url: raw, reason });
    } else if (!seen.has(url.href)) {
      seen.add(url.href);
      accepted.push(url.href);
    }
  }
  return { accepted, rejected };
}

export function buildPayloads(urls: string[], batchSize: number = INDEXNOW_MAX_URLS_PER_REQUEST): IndexNowPayload[] {
  if (!isValidIndexNowKey(site.indexNowKey)) throw new Error("Configured IndexNow key is invalid");
  const size = Math.min(Math.max(1, batchSize), INDEXNOW_MAX_URLS_PER_REQUEST);
  const payloads: IndexNowPayload[] = [];
  for (let i = 0; i < urls.length; i += size) {
    payloads.push({
      host: indexNowHost,
      key: site.indexNowKey,
      keyLocation: indexNowKeyLocation,
      urlList: urls.slice(i, i + size),
    });
  }
  return payloads;
}

export const indexNowStatusMeaning: Record<number, string> = {
  200: "OK: URLs received",
  202: "Accepted: URLs received, key validation pending",
  400: "Bad request: invalid format",
  403: "Forbidden: key not valid or key file not reachable",
  422: "Unprocessable: URLs don't belong to the host or don't match the key",
  429: "Too many requests: rate limited",
};

export interface SubmitOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  batchDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
  log?: (message: string) => void;
}

export interface BatchResult {
  urls: number;
  ok: boolean;
  status: number | null;
  attempts: number;
  message: string;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function retryAfterMs(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(header);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

/** Sends one payload. Retries network errors, timeouts, 429 and 5xx with bounded backoff; never retries other 4xx. */
export async function submitPayload(payload: IndexNowPayload, options: SubmitOptions = {}): Promise<BatchResult> {
  const {
    fetchImpl = fetch,
    timeoutMs = 15_000,
    maxRetries = 3,
    baseDelayMs = 2_000,
    maxDelayMs = 60_000,
    sleep = defaultSleep,
    log = console.log,
  } = options;

  let lastMessage = "not attempted";
  let lastStatus: number | null = null;
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    let delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
    try {
      const response = await fetchImpl(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });
      lastStatus = response.status;
      lastMessage = indexNowStatusMeaning[response.status] ?? `HTTP ${response.status}`;
      log(`IndexNow attempt ${attempt}: ${response.status} ${lastMessage} (${payload.urlList.length} URLs)`);
      if (response.status === 200 || response.status === 202) {
        return { urls: payload.urlList.length, ok: true, status: response.status, attempts: attempt, message: lastMessage };
      }
      const transient = response.status === 429 || response.status >= 500;
      if (!transient) {
        const detail = (await response.text().catch(() => "")).slice(0, 300);
        return {
          urls: payload.urlList.length,
          ok: false,
          status: response.status,
          attempts: attempt,
          message: detail ? `${lastMessage}: ${detail}` : lastMessage,
        };
      }
      const hinted = retryAfterMs(response.headers.get("retry-after"));
      if (hinted !== null) delay = Math.min(hinted, maxDelayMs);
    } catch (error) {
      lastStatus = null;
      lastMessage = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      log(`IndexNow attempt ${attempt}: request failed (${lastMessage})`);
    }
    if (attempt <= maxRetries) {
      log(`Retrying in ${Math.round(delay / 1000)}s`);
      await sleep(delay);
    }
  }
  return { urls: payload.urlList.length, ok: false, status: lastStatus, attempts: maxRetries + 1, message: lastMessage };
}

/** Validates, deduplicates, batches and submits URLs sequentially. Throws if any URL is rejected. */
export async function submitUrls(urls: string[], options: SubmitOptions = {}): Promise<BatchResult[]> {
  const { accepted, rejected } = validateSubmissionUrls(urls);
  if (rejected.length) {
    throw new Error(`Refusing to submit: ${rejected.map((r) => `${r.url} (${r.reason})`).join("; ")}`);
  }
  const sleep = options.sleep ?? defaultSleep;
  const results: BatchResult[] = [];
  const payloads = buildPayloads(accepted);
  for (const [index, payload] of payloads.entries()) {
    if (index > 0) await sleep(options.batchDelayMs ?? 1_000);
    results.push(await submitPayload(payload, options));
  }
  return results;
}
