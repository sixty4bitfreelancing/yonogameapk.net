// IndexNow notifications for yonogameapk.net. Dry-run unless --submit is given.
// Run through npm so the TypeScript loader is registered:
//   npm run indexnow -- --help

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const { publishedUrls } = await import("@/lib/published-urls");
const { site } = await import("@/lib/site");
const { deploymentEnv } = await import("@/lib/env");
const { buildPayloads, indexNowKeyLocation, submitPayload, validateSubmissionUrls } = await import("@/lib/indexnow");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HELP = `
Usage: npm run indexnow -- [mode] [options]

Modes (choose one):
  --all                  Every currently published URL (initial submission).
  --changes              New or materially changed published URLs since the last recorded
                         submission, plus published URLs that have since been removed.
  --url <url>            A changed/new published URL (repeatable).
  --urls-file <file>     File with one changed/new URL per line.
  --deleted <url>        A removed, previously published URL (repeatable). Must no longer be
                         published and should return 404/410 on the live site.
  --deleted-file <file>  File with one removed URL per line.
  --baseline             Record the current published URLs as already submitted, without sending.

Options:
  --submit               Actually send to ${"https://api.indexnow.org/indexnow"}. Without it, nothing is sent.
  --force                Skip the live 200/404 checks of individual URLs (the key file check always runs).
  --state <file>         Submission record (default scripts/indexnow-state.json).
  --help                 Show this help.
`;

const { values } = parseArgs({
  options: {
    all: { type: "boolean", default: false },
    changes: { type: "boolean", default: false },
    url: { type: "string", multiple: true, default: [] },
    "urls-file": { type: "string" },
    deleted: { type: "string", multiple: true, default: [] },
    "deleted-file": { type: "string" },
    baseline: { type: "boolean", default: false },
    submit: { type: "boolean", default: false },
    force: { type: "boolean", default: false },
    state: { type: "string", default: path.join(ROOT, "scripts", "indexnow-state.json") },
    help: { type: "boolean", default: false },
  },
});

if (values.help) {
  console.log(HELP);
  process.exit(0);
}

const readList = (file) =>
  file
    ? readFileSync(file, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
    : [];

const explicitChanged = [...values.url, ...readList(values["urls-file"])];
const explicitDeleted = [...values.deleted, ...readList(values["deleted-file"])];
const modes = [values.all, values.changes, values.baseline, explicitChanged.length + explicitDeleted.length > 0].filter(Boolean);
if (modes.length !== 1) {
  console.error("Choose exactly one of --all, --changes, --baseline, or explicit --url/--deleted lists.\n" + HELP);
  process.exit(1);
}

const manifest = publishedUrls();
const current = new Map(manifest.map((entry) => [entry.url, entry.fingerprint]));
const homeUrl = manifest.find((entry) => entry.kind === "home").url;

function loadState() {
  if (!existsSync(values.state)) return null;
  return JSON.parse(readFileSync(values.state, "utf8"));
}

function saveState(urls) {
  const sorted = Object.fromEntries(Object.entries(urls).sort(([a], [b]) => a.localeCompare(b)));
  const state = {
    $comment: "Written by scripts/indexnow.mjs after successful submissions. URL -> content fingerprint last notified.",
    updatedAt: new Date().toISOString(),
    urls: sorted,
  };
  writeFileSync(values.state, `${JSON.stringify(state, null, 2)}\n`);
  console.log(`Recorded ${Object.keys(sorted).length} URLs in ${path.relative(ROOT, values.state)}`);
}

const state = loadState();
const notes = [];
let changed = [];
let deleted = [];

if (values.baseline) {
  saveState(Object.fromEntries(current));
  process.exit(0);
} else if (values.all) {
  changed = [...current.keys()];
} else if (values.changes) {
  if (!state) {
    console.error(
      `No submission record at ${path.relative(ROOT, values.state)}. Run the initial submission (--all --submit) or --baseline first.`,
    );
    process.exit(1);
  }
  changed = [...current].filter(([url, fp]) => state.urls[url] !== fp).map(([url]) => url);
  deleted = Object.keys(state.urls).filter((url) => !current.has(url));
} else {
  changed = explicitChanged;
  deleted = explicitDeleted;
  if (state && state.urls[homeUrl] !== current.get(homeUrl) && !changed.includes(homeUrl)) {
    changed.push(homeUrl);
    notes.push("Added the homepage because its visible directory changed since the last recorded submission.");
  } else if (!state) {
    notes.push("No submission record: include the homepage yourself if its directory changed.");
  }
}

// ---- validation
const errors = [];
const changedCheck = validateSubmissionUrls(changed);
const deletedCheck = validateSubmissionUrls(deleted);
for (const r of [...changedCheck.rejected, ...deletedCheck.rejected]) errors.push(`${r.url}: ${r.reason}`);
for (const url of changedCheck.accepted) {
  if (!current.has(url)) errors.push(`${url}: not a currently published canonical URL (use --deleted for removed pages)`);
}
for (const url of deletedCheck.accepted) {
  if (current.has(url)) errors.push(`${url}: still published; it cannot be notified as deleted`);
}
if (errors.length) {
  console.error(`Rejected ${errors.length} URL(s):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

const urlList = [...new Set([...changedCheck.accepted, ...deletedCheck.accepted])];
if (!urlList.length) {
  console.log("Nothing to notify: no new, changed or deleted published URLs.");
  process.exit(0);
}

const payloads = buildPayloads(urlList);
console.log(`Changed/new: ${changedCheck.accepted.length}  Deleted: ${deletedCheck.accepted.length}  Requests: ${payloads.length}`);
for (const note of notes) console.log(`Note: ${note}`);
for (const [i, payload] of payloads.entries()) {
  const shown = payload.urlList.length > 50 ? { ...payload, urlList: [...payload.urlList.slice(0, 50), `… ${payload.urlList.length - 50} more`] } : payload;
  console.log(`\nPayload ${i + 1}/${payloads.length}:\n${JSON.stringify(shown, null, 2)}`);
}

if (!values.submit) {
  console.log("\nDry run: nothing was sent. Add --submit to notify IndexNow.");
  process.exit(0);
}

// ---- submission guards
const env = deploymentEnv();
if (env !== "production") {
  console.error(`Refusing to submit from a ${env} environment (SITE_ENV/VERCEL_ENV/CONTEXT/NODE_ENV).`);
  process.exit(1);
}

async function live(url) {
  try {
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15_000) });
    return { status: res.status, type: res.headers.get("content-type") ?? "", body: await res.text() };
  } catch (error) {
    return { status: null, type: "", body: "", error: error.message };
  }
}

const keyFile = await live(indexNowKeyLocation);
if (keyFile.status !== 200 || keyFile.body.trim() !== site.indexNowKey || keyFile.type.includes("html")) {
  console.error(
    `Live key file check failed for ${indexNowKeyLocation}: ` +
      (keyFile.status === null ? keyFile.error : `HTTP ${keyFile.status}, ${keyFile.type || "no content type"}`) +
      ". Deploy the site first; live submission remains pending.",
  );
  process.exit(2);
}
console.log(`\nKey file verified at ${indexNowKeyLocation}`);

if (!values.force) {
  const problems = [];
  for (const url of changedCheck.accepted) {
    const { status } = await live(url);
    if (status !== 200) problems.push(`${url} returned ${status ?? "no response"} (expected 200)`);
  }
  for (const url of deletedCheck.accepted) {
    const { status } = await live(url);
    if (status !== 404 && status !== 410) problems.push(`${url} returned ${status ?? "no response"} (expected 404 or 410)`);
  }
  if (problems.length) {
    console.error(`Live URL checks failed (deploy first, or use --force):\n- ${problems.join("\n- ")}`);
    process.exit(2);
  }
}

const results = [];
for (const [i, payload] of payloads.entries()) {
  if (i > 0) await new Promise((resolve) => setTimeout(resolve, 1_000));
  results.push(await submitPayload(payload));
}
for (const [i, r] of results.entries()) {
  console.log(`Request ${i + 1}: ${r.ok ? "received" : "FAILED"}, status ${r.status ?? "none"}, ${r.urls} URLs, ${r.attempts} attempt(s): ${r.message}`);
}
if (!results.every((r) => r.ok)) {
  console.error("Not all requests were accepted; the submission record was not updated.");
  process.exit(1);
}
console.log("IndexNow received the notification. This confirms receipt only, not crawling or indexing.");

const next = values.all ? {} : { ...(state?.urls ?? {}) };
for (const url of changedCheck.accepted) next[url] = current.get(url);
for (const url of deletedCheck.accepted) delete next[url];
saveState(next);
