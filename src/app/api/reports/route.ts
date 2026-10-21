import { createHash, randomUUID } from "node:crypto";
import { getPublishedApp } from "@/data/apps";
import { REPORT_KINDS, saveReport, type ReportKind } from "@/lib/reports-store";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, { count: number; resetAt: number }>();

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}

function rateLimited(request: Request): boolean {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  const key = createHash("sha256").update(`${process.env.RATINGS_SALT ?? site.url}:report:${ip}`).digest("hex");
  const now = Date.now();
  const entry = recent.get(key);
  if (!entry || entry.resetAt < now) {
    recent.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || (origin !== new URL(request.url).origin && origin !== site.url)) {
    return json({ error: "Cross-site request rejected" }, 403);
  }
  if (rateLimited(request)) return json({ error: "Too many reports from this network. Try again later." }, 429);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  // Honeypot field: real visitors never fill it.
  if (typeof body.website === "string" && body.website.trim()) return json({ ok: true }, 201);

  const slug = typeof body.slug === "string" ? body.slug : "";
  if (!getPublishedApp(slug)) return json({ error: "Unknown app" }, 400);
  const kind = body.kind as ReportKind;
  if (!(kind in REPORT_KINDS)) return json({ error: "Choose what kind of problem it is" }, 400);
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length < 5 || message.length > 1000) return json({ error: "Describe the problem in 5 to 1,000 characters" }, 400);
  let url: string | null = null;
  if (typeof body.url === "string" && body.url.trim()) {
    try {
      const parsed = new URL(body.url.trim());
      if (!/^https?:$/.test(parsed.protocol) || parsed.href.length > 500) throw new Error();
      url = parsed.href;
    } catch {
      return json({ error: "The link must be a full http(s) address" }, 400);
    }
  }

  try {
    await saveReport({ id: randomUUID(), receivedAt: new Date().toISOString(), slug, kind, url, message });
    return json({ ok: true }, 201);
  } catch {
    return json({ error: "Your report couldn't be saved. Try again later." }, 503);
  }
}
