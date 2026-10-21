import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const REPORT_KINDS = {
  "broken-link": "Broken link",
  "changed-link": "Link now points somewhere else",
  "wrong-info": "Wrong or outdated information",
  other: "Something else",
} as const;

export type ReportKind = keyof typeof REPORT_KINDS;

export interface ProblemReport {
  id: string;
  receivedAt: string;
  slug: string;
  kind: ReportKind;
  url: string | null;
  message: string;
}

/**
 * Appends a visitor report. Upstash Redis list "reports" when configured (serverless hosts),
 * otherwise one JSON line per report in .data/reports.jsonl. Read them with `npm run reports`.
 */
export async function saveReport(report: ProblemReport): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["RPUSH", "reports", JSON.stringify(report)]),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`Reports store responded ${response.status}`);
    return;
  }
  const file = path.join(process.cwd(), ".data", "reports.jsonl");
  await mkdir(path.dirname(file), { recursive: true });
  await appendFile(file, `${JSON.stringify(report)}\n`);
}
