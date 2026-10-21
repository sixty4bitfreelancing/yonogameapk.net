import { createHash } from "node:crypto";
import { getPublishedApp } from "@/data/apps";
import { ratingStore } from "@/lib/ratings-store";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ slug: string }> };

const VOTER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_VOTES_PER_WINDOW = 20;
const recentVotes = new Map<string, { count: number; resetAt: number }>();

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}

/** Keyed by a salted hash so raw IP addresses are never held, even in memory. */
function rateLimited(request: Request): boolean {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  const key = createHash("sha256").update(`${process.env.RATINGS_SALT ?? site.url}:${ip}`).digest("hex");
  const now = Date.now();
  const entry = recentVotes.get(key);
  if (!entry || entry.resetAt < now) {
    recentVotes.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (recentVotes.size > 10_000) {
      for (const [k, v] of recentVotes) if (v.resetAt < now) recentVotes.delete(k);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_VOTES_PER_WINDOW;
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin === new URL(request.url).origin || origin === site.url;
}

export async function GET(_request: Request, { params }: Context) {
  const { slug } = await params;
  if (!getPublishedApp(slug)) return json({ error: "Unknown app" }, 404);
  try {
    return json(await ratingStore().summary(slug));
  } catch {
    return json({ error: "Ratings are unavailable right now" }, 503);
  }
}

export async function POST(request: Request, { params }: Context) {
  const { slug } = await params;
  if (!getPublishedApp(slug)) return json({ error: "Unknown app" }, 404);
  if (!sameOrigin(request)) return json({ error: "Cross-site request rejected" }, 403);
  if (rateLimited(request)) return json({ error: "Too many ratings from this network. Try again later." }, 429);

  let body: { stars?: unknown; voterId?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const { stars, voterId } = body;
  if (typeof stars !== "number" || !Number.isInteger(stars) || stars < 1 || stars > 5) {
    return json({ error: "stars must be a whole number from 1 to 5" }, 400);
  }
  if (typeof voterId !== "string" || !VOTER_ID.test(voterId)) {
    return json({ error: "Invalid voter id" }, 400);
  }
  try {
    await ratingStore().set(slug, voterId, stars);
    return json(await ratingStore().summary(slug));
  } catch {
    return json({ error: "Your rating couldn't be saved. Try again later." }, 503);
  }
}
