// Lists visitor problem reports. Usage: npm run reports
// Reads Upstash Redis when UPSTASH_REDIS_REST_URL/TOKEN are set, otherwise .data/reports.jsonl.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let reports = [];

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const res = await fetch(process.env.UPSTASH_REDIS_REST_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(["LRANGE", "reports", 0, -1]),
  });
  reports = ((await res.json()).result ?? []).map((line) => JSON.parse(line));
} else {
  const file = path.join(root, ".data", "reports.jsonl");
  if (existsSync(file)) {
    reports = readFileSync(file, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line));
  }
}

if (!reports.length) {
  console.log("No reports yet.");
} else {
  for (const r of reports.reverse()) {
    console.log(`${r.receivedAt}  ${r.slug}  [${r.kind}]${r.url ? `  ${r.url}` : ""}\n    ${r.message.replace(/\s+/g, " ")}\n`);
  }
  console.log(`${reports.length} report(s).`);
}
