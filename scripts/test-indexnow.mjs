// Unit tests for src/lib/indexnow.ts. No network access: fetch is stubbed.
// Run: npm run test:indexnow

import assert from "node:assert/strict";
import { test } from "node:test";

const {
  INDEXNOW_ENDPOINT,
  buildPayloads,
  indexNowKeyLocation,
  submitPayload,
  submitUrls,
  validateSubmissionUrls,
} = await import("@/lib/indexnow");
const { site } = await import("@/lib/site");

const quiet = { log: () => {}, sleep: async () => {} };

function stubFetch(responses) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return new Response(next.body ?? "", { status: next.status, headers: next.headers ?? {} });
  };
  return { fetchImpl, calls };
}

test("accepts canonical same-origin URLs and removes duplicates", () => {
  const { accepted, rejected } = validateSubmissionUrls([
    "https://yonogameapk.net/",
    "https://yonogameapk.net/rummy-apps/",
    "https://yonogameapk.net/rummy-apps/",
  ]);
  assert.deepEqual(accepted, ["https://yonogameapk.net/", "https://yonogameapk.net/rummy-apps/"]);
  assert.equal(rejected.length, 0);
});

test("rejects foreign hosts and non-canonical forms", () => {
  const bad = [
    "https://example.com/",
    "https://www.yonogameapk.net/",
    "https://yonogameapk.net.evil.com/",
    "http://yonogameapk.net/",
    "https://yonogameapk.net/rummy-apps",
    "https://yonogameapk.net/?q=jaiho",
    "https://yonogameapk.net/#directory",
    "https://yonogameapk.net:8443/",
    "https://user:pass@yonogameapk.net/",
    "https://YONOGAMEAPK.NET/",
    "/rummy-apps/",
  ];
  const { accepted, rejected } = validateSubmissionUrls(bad);
  assert.deepEqual(accepted, []);
  assert.equal(rejected.length, bad.length);
  assert.match(rejected[0].reason, /foreign host/);
  assert.match(rejected[1].reason, /foreign host/);
});

test("builds payloads with host, key and keyLocation, max 10,000 URLs each", () => {
  const urls = Array.from({ length: 10_001 }, (_, i) => `https://yonogameapk.net/apps/app-${i}/`);
  const payloads = buildPayloads(urls);
  assert.equal(payloads.length, 2);
  assert.equal(payloads[0].urlList.length, 10_000);
  assert.equal(payloads[1].urlList.length, 1);
  assert.deepEqual(Object.keys(payloads[0]), ["host", "key", "keyLocation", "urlList"]);
  assert.equal(payloads[0].host, "yonogameapk.net");
  assert.equal(payloads[0].key, site.indexNowKey);
  assert.equal(payloads[0].keyLocation, `https://yonogameapk.net/${site.indexNowKey}.txt`);
  assert.equal(indexNowKeyLocation, payloads[0].keyLocation);
  assert.match(site.indexNowKey, /^[0-9a-f]{32}$/);
});

test("200 and 202 are treated as received on the first attempt", async () => {
  for (const status of [200, 202]) {
    const { fetchImpl, calls } = stubFetch([{ status }]);
    const result = await submitPayload(buildPayloads(["https://yonogameapk.net/"])[0], { ...quiet, fetchImpl });
    assert.equal(result.ok, true);
    assert.equal(result.attempts, 1);
    assert.equal(calls[0].url, INDEXNOW_ENDPOINT);
  }
});

test("retries 429 and 5xx with bounded attempts, honouring Retry-After", async () => {
  const delays = [];
  const { fetchImpl, calls } = stubFetch([
    { status: 429, headers: { "Retry-After": "7" } },
    { status: 503 },
    { status: 200 },
  ]);
  const result = await submitPayload(buildPayloads(["https://yonogameapk.net/"])[0], {
    fetchImpl,
    log: () => {},
    sleep: async (ms) => void delays.push(ms),
  });
  assert.equal(result.ok, true);
  assert.equal(calls.length, 3);
  assert.equal(delays[0], 7_000);
});

test("gives up after maxRetries on persistent transient failures", async () => {
  const { fetchImpl, calls } = stubFetch([{ status: 500 }, { status: 500 }, { status: 500 }, { status: 500 }, { status: 500 }]);
  const result = await submitPayload(buildPayloads(["https://yonogameapk.net/"])[0], { ...quiet, fetchImpl, maxRetries: 3 });
  assert.equal(result.ok, false);
  assert.equal(calls.length, 4);
});

test("does not retry permanent errors such as 403 and 422", async () => {
  for (const status of [400, 403, 422]) {
    const { fetchImpl, calls } = stubFetch([{ status, body: "nope" }]);
    const result = await submitPayload(buildPayloads(["https://yonogameapk.net/"])[0], { ...quiet, fetchImpl });
    assert.equal(result.ok, false);
    assert.equal(result.status, status);
    assert.equal(calls.length, 1);
  }
});

test("retries network errors and timeouts", async () => {
  const timeout = new Error("The operation was aborted due to timeout");
  timeout.name = "TimeoutError";
  const { fetchImpl, calls } = stubFetch([timeout, { status: 200 }]);
  const result = await submitPayload(buildPayloads(["https://yonogameapk.net/"])[0], { ...quiet, fetchImpl });
  assert.equal(result.ok, true);
  assert.equal(calls.length, 2);
});

test("submitUrls refuses foreign hosts before any request", async () => {
  const { fetchImpl, calls } = stubFetch([{ status: 200 }]);
  await assert.rejects(
    submitUrls(["https://yonogameapk.net/", "https://other-site.com/"], { ...quiet, fetchImpl }),
    /foreign host/,
  );
  assert.equal(calls.length, 0);
});
