import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export interface RatingSummary {
  average: number | null;
  count: number;
}

interface RatingStore {
  /** Records or replaces one voter's rating for an app. */
  set(slug: string, voterId: string, stars: number): Promise<void>;
  summary(slug: string): Promise<RatingSummary>;
}

function summarise(values: number[]): RatingSummary {
  if (!values.length) return { average: null, count: 0 };
  const total = values.reduce((sum, value) => sum + value, 0);
  return { average: Math.round((total / values.length) * 10) / 10, count: values.length };
}

/**
 * Upstash Redis over its REST API (no SDK). Used when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set, e.g. on serverless hosts without a persistent disk.
 */
function upstashStore(url: string, token: string): RatingStore {
  async function command(args: (string | number)[]): Promise<unknown> {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`Ratings store responded ${response.status}`);
    return ((await response.json()) as { result: unknown }).result;
  }
  return {
    async set(slug, voterId, stars) {
      await command(["HSET", `ratings:${slug}`, voterId, stars]);
    },
    async summary(slug) {
      const values = ((await command(["HVALS", `ratings:${slug}`])) as string[]) ?? [];
      return summarise(values.map(Number).filter((n) => n >= 1 && n <= 5));
    },
  };
}

/** JSON file on local disk, for a single self-hosted Node server (`next start`). */
function fileStore(file: string): RatingStore {
  type Data = Record<string, Record<string, number>>;
  let queue: Promise<unknown> = Promise.resolve();

  async function load(): Promise<Data> {
    try {
      return JSON.parse(await readFile(file, "utf8")) as Data;
    } catch {
      return {};
    }
  }

  function exclusive<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
  }

  return {
    set(slug, voterId, stars) {
      return exclusive(async () => {
        const data = await load();
        data[slug] = { ...(data[slug] ?? {}), [voterId]: stars };
        await mkdir(path.dirname(file), { recursive: true });
        const temp = `${file}.tmp`;
        await writeFile(temp, JSON.stringify(data));
        await rename(temp, file);
      });
    },
    async summary(slug) {
      const data = await load();
      return summarise(Object.values(data[slug] ?? {}));
    },
  };
}

let store: RatingStore | null = null;

export function ratingStore(): RatingStore {
  if (!store) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    store = url && token ? upstashStore(url, token) : fileStore(path.join(process.cwd(), ".data", "ratings.json"));
  }
  return store;
}

/** Visitor rating summaries for several apps; an app whose lookup fails is simply left out. */
export async function ratingSummaries(slugs: string[]): Promise<Map<string, RatingSummary>> {
  const entries = await Promise.all(
    slugs.map(async (slug) => [slug, await ratingStore().summary(slug).catch(() => null)] as const),
  );
  return new Map(entries.filter((entry): entry is [string, RatingSummary] => entry[1] !== null));
}
