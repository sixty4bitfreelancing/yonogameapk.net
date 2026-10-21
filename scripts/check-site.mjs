// Crawls a running build (`npm run build && npm start`) and checks SEO, crawler files and link integrity.
// Usage: npm run check:site -- [baseUrl] [--preview]   (default http://localhost:3000)
//   --preview  the build was made with SITE_ENV=preview; checks that everything is noindexed instead.

const { publishedUrls } = await import("@/lib/published-urls");
const { site } = await import("@/lib/site");

const args = process.argv.slice(2);
const PREVIEW = args.includes("--preview");
const BASE = (args.find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, "");
const PROD = site.url;
const failures = [];
const notes = [];
const fail = (msg) => failures.push(msg);

const toPath = (url) => new URL(url, BASE).pathname;

async function get(path) {
  const res = await fetch(BASE + path, { redirect: "manual" });
  const body = /text|xml|markdown/.test(res.headers.get("content-type") ?? "") ? await res.text() : "";
  return {
    status: res.status,
    type: res.headers.get("content-type") ?? "",
    body,
    location: res.headers.get("location"),
    robotsHeader: res.headers.get("x-robots-tag") ?? "",
    link: res.headers.get("link") ?? "",
  };
}

function finish() {
  console.log(notes.join("\n"));
  if (failures.length) {
    console.error(`\n${failures.length} problem(s):\n- ${failures.join("\n- ")}`);
    process.exit(1);
  }
  console.log("\nAll checks passed.");
  process.exit(0);
}

const manifest = publishedUrls();

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]?.replace(/&amp;/g, "&");
const metaContent = (html, key, value) => {
  const tag = html.match(new RegExp(`<meta[^>]*${key}="${value}"[^>]*>`))?.[0];
  return tag ? attr(tag, "content") : undefined;
};

function collectIds(node, out) {
  if (Array.isArray(node)) node.forEach((n) => collectIds(n, out));
  else if (node && typeof node === "object") {
    if (node["@id"]) (node["@type"] ? out.ids : out.urls).push(node["@id"]);
    for (const [k, v] of Object.entries(node)) {
      // sameAs points at the app's own external source by design.
      if (typeof v === "string" && /^https?:\/\//.test(v) && !["@context", "itemListOrder", "sameAs"].includes(k)) out.urls.push(v);
      else collectIds(v, out);
    }
  }
}

// ---------------------------------------------------------------- robots.txt
const robots = await get("/robots.txt");
if (robots.status !== 200) fail(`robots.txt returned ${robots.status}`);
if (!robots.type.startsWith("text/plain")) fail(`robots.txt content type is ${robots.type}`);
const robotsLines = robots.body.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const expectedRobots = ["User-Agent: *", "Allow: /", "Disallow: /api/", `Sitemap: ${PROD}/sitemap.xml`];
if (JSON.stringify(robotsLines) !== JSON.stringify(expectedRobots)) {
  fail(`robots.txt content unexpected:\n${robots.body}`);
}
for (const line of robotsLines) {
  if (!/^(User-Agent|Allow|Disallow|Sitemap):/i.test(line)) fail(`robots.txt has unsupported directive: ${line}`);
}

// ---------------------------------------------------------------- sitemap.xml
const sitemapRes = await get("/sitemap.xml");
const xml = sitemapRes.body;
if (sitemapRes.status !== 200 || !/xml/.test(sitemapRes.type)) fail(`sitemap.xml: ${sitemapRes.status} ${sitemapRes.type}`);
if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) fail("sitemap.xml missing XML declaration");
if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) fail("sitemap.xml missing urlset namespace");
const urlBlocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
const sitemapEntries = urlBlocks.map((block) => ({
  loc: block.match(/<loc>([^<]+)<\/loc>/)?.[1],
  lastmod: block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? null,
  extra: block.replace(/<loc>[^<]*<\/loc>|<lastmod>[^<]*<\/lastmod>/g, "").trim(),
}));
const sitemapUrls = sitemapEntries.map((e) => e.loc);
if (!sitemapUrls.length) fail("sitemap.xml has no URLs");
if (sitemapUrls.length > 50_000 || Buffer.byteLength(xml) > 50 * 1024 * 1024) fail("sitemap.xml exceeds sitemap limits");
if (new Set(sitemapUrls).size !== sitemapUrls.length) fail("sitemap.xml contains duplicate URLs");
for (const entry of sitemapEntries) {
  if (!entry.loc?.startsWith(PROD + "/") || !entry.loc.endsWith("/")) fail(`sitemap URL not canonical form: ${entry.loc}`);
  if (entry.extra) fail(`sitemap entry for ${entry.loc} has unexpected elements: ${entry.extra}`);
  if (entry.lastmod !== null && !/^\d{4}-\d{2}-\d{2}$/.test(entry.lastmod)) fail(`sitemap lastmod not a date: ${entry.lastmod}`);
}
const expectedSitemap = manifest.map((e) => `${e.url}|${e.lastModified ?? ""}`);
const actualSitemap = sitemapEntries.map((e) => `${e.loc}|${e.lastmod ?? ""}`);
if (JSON.stringify(expectedSitemap) !== JSON.stringify(actualSitemap)) {
  fail(`sitemap.xml does not match published-url data:\n  expected ${expectedSitemap.join(", ")}\n  actual   ${actualSitemap.join(", ")}`);
}
const today = new Date().toISOString().slice(0, 10);
const lastmods = sitemapEntries.map((e) => e.lastmod).filter(Boolean);
if (lastmods.some((d) => d > today)) fail("sitemap has lastmod dates in the future");
const sitemapPaths = new Set(sitemapUrls.map((u) => new URL(u).pathname));

// ---------------------------------------------------------------- preview mode
if (PREVIEW) {
  for (const path of ["/", ...sitemapPaths, "/llms.txt", `/${site.indexNowKey}.txt`]) {
    const res = await get(path);
    if (!/noindex/.test(res.robotsHeader)) fail(`preview: ${path} lacks X-Robots-Tag noindex`);
    if (res.type.includes("text/html")) {
      const meta = res.body.match(/<meta[^>]*name="robots"[^>]*>/)?.[0] ?? "";
      if (!/noindex/.test(meta)) fail(`preview: ${path} lacks robots noindex meta`);
    }
  }
  notes.push(`preview build: checked ${sitemapPaths.size + 3} URLs for noindex`);
  finish();
}

// ---------------------------------------------------------------- crawl
const queue = ["/", ...sitemapPaths];
const seen = new Map();
const incoming = new Map();
const titles = new Map();
const descriptions = new Map();

while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  const res = await get(path);
  seen.set(path, res.status);
  if (res.status !== 200 || !res.type.includes("text/html")) continue;
  const html = res.body;

  if (html.includes("yonogame.live")) fail(`${path}: references yonogame.live`);

  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*>/)?.[0];
  const canonicalHref = canonical && attr(canonical, "href");
  if (canonicalHref !== PROD + path) fail(`${path}: canonical is ${canonicalHref ?? "missing"}`);
  const robotsMeta = metaContent(html, "name", "robots") ?? "";
  const noindex = robotsMeta.includes("noindex");
  if (sitemapPaths.has(path) && noindex) fail(`${path}: in sitemap but noindex`);
  if (res.robotsHeader) fail(`${path}: unexpected X-Robots-Tag header "${res.robotsHeader}" on a production page`);
  if (!sitemapPaths.has(path) && !noindex) fail(`${path}: indexable but missing from sitemap`);

  if (metaContent(html, "property", "og:url") !== PROD + path) fail(`${path}: og:url mismatch`);
  const ogImage = metaContent(html, "property", "og:image");
  if (!ogImage?.startsWith(PROD + "/")) fail(`${path}: og:image not absolute production URL (${ogImage})`);
  if (metaContent(html, "name", "twitter:card") !== "summary_large_image") fail(`${path}: twitter:card missing`);
  if (metaContent(html, "property", "og:site_name") !== "Yono Game APK") fail(`${path}: og:site_name mismatch`);

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  const description = metaContent(html, "name", "description");
  if (!noindex) {
    if (titles.has(title)) fail(`${path}: duplicate title with ${titles.get(title)}`);
    if (descriptions.has(description)) fail(`${path}: duplicate description with ${descriptions.get(description)}`);
    titles.set(title, path);
    descriptions.set(description, path);
  }
  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) fail(`${path}: expected exactly one <h1>`);

  // JSON-LD
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const pageIds = [];
  for (const raw of blocks) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      fail(`${path}: JSON-LD does not parse (${e.message})`);
      continue;
    }
    const found = { ids: [], urls: [] };
    collectIds(data, found);
    pageIds.push(...found.ids);
    for (const u of [...found.ids, ...found.urls]) if (!u.startsWith(PROD)) fail(`${path}: JSON-LD URL off-domain: ${u}`);
    const visibleText = html
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ");
    const squash = (s) => String(s).replace(/\s+/g, " ").trim();
    const isVisible = (s) => visibleText.includes(squash(s));
    for (const node of data["@graph"] ?? []) {
      const types = [node["@type"]].flat();
      if (types.some((t) => ["Review", "AggregateRating", "SearchAction"].includes(t))) {
        fail(`${path}: disallowed top-level schema type ${types}`);
      }
      if (node["@type"] === "FAQPage") {
        for (const q of node.mainEntity) {
          if (!isVisible(q.name)) fail(`${path}: FAQ question not visible: ${q.name}`);
          if (!isVisible(q.acceptedAnswer.text)) fail(`${path}: FAQ answer not visible: ${q.acceptedAnswer.text.slice(0, 60)}`);
        }
      }
      if (node["@type"] === "HowTo") {
        for (const step of node.step) if (!isVisible(step.text)) fail(`${path}: HowTo step not visible: ${step.text.slice(0, 60)}`);
      }
      if (node["@type"] === "SoftwareApplication" && node.aggregateRating) {
        const r = node.aggregateRating;
        if (!isVisible(`${Number(r.ratingValue).toFixed(1)} out of 5 from ${r.ratingCount} visitor`)) {
          fail(`${path}: aggregateRating ${r.ratingValue}/${r.ratingCount} not shown on the page`);
        }
      }
      if (node["@type"] === "SoftwareApplication") {
        for (const key of ["offers", "review"]) if (node[key]) fail(`${path}: SoftwareApplication has unsupported ${key}`);
      }
      if (node["@type"] === "BreadcrumbList") {
        for (const item of node.itemListElement) {
          const s = (await get(toPath(item.item))).status;
          if (s !== 200) fail(`${path}: breadcrumb ${item.item} returns ${s}`);
        }
      }
      if (node["@type"] === "ItemList") {
        const visible = (html.match(/<li[^>]*id="app-[^"]+"/g) ?? []).length;
        if (node.numberOfItems !== visible || node.itemListElement.length !== visible) {
          fail(`${path}: ItemList has ${node.numberOfItems} items but page shows ${visible}`);
        }
        for (const el of node.itemListElement) {
          const escaped = el.name.replace(/&/g, "&amp;");
          if (!html.includes(`>${escaped}</h3>`)) fail(`${path}: ItemList name "${el.name}" not visible`);
        }
      }
    }
  }
  if (new Set(pageIds).size !== pageIds.length) fail(`${path}: duplicate @id within page`);
  if (!noindex && !blocks.length) fail(`${path}: no JSON-LD`);

  // links
  for (const tag of html.match(/<a\s[^>]*>/g) ?? []) {
    const href = attr(tag, "href");
    if (!href || href === "#") {
      fail(`${path}: link with empty or "#" href`);
      continue;
    }
    if (attr(tag, "target") === "_blank" && !(attr(tag, "rel") ?? "").includes("noopener")) {
      fail(`${path}: target=_blank link without noopener: ${href}`);
    }
    if (href.startsWith("#") || href.startsWith("mailto:")) continue;
    const url = new URL(href, BASE + path);
    if (url.origin !== new URL(BASE).origin) continue;
    const target = url.pathname;
    if (target !== path) {
      if (!incoming.has(target)) incoming.set(target, new Set());
      incoming.get(target).add(path);
    }
    if (!seen.has(target)) queue.push(target);
  }

  // images
  for (const tag of html.match(/<img\s[^>]*>/g) ?? []) {
    if (!attr(tag, "alt") && attr(tag, "alt") !== "") fail(`${path}: <img> without alt`);
    const filled = attr(tag, "data-nimg") === "fill";
    if (!filled && (!attr(tag, "width") || !attr(tag, "height"))) fail(`${path}: <img> without dimensions`);
  }
}

for (const [path, status] of seen) {
  if (status !== 200 && status !== 308) fail(`internal link target ${path} returns ${status} (linked from ${[...(incoming.get(path) ?? [])].join(", ")})`);
}
for (const path of sitemapPaths) {
  if (path !== "/" && !(incoming.get(path)?.size)) fail(`orphan: ${path} has no internal links pointing to it`);
}

// ---------------------------------------------------------------- explicit checks
const listedSlugs = [...((await get("/")).body.matchAll(/<li[^>]*id="app-([^"]+)"/g))].map((m) => m[1]);
const unpublishedApps = listedSlugs.map((s) => `/apps/${s}/`).filter((p) => !sitemapPaths.has(p));
notes.push(`listings without a detail page (each must 404): ${unpublishedApps.length}`);
const expect404 = [
  ...unpublishedApps,
  "/apps/does-not-exist/",
  "/apps/all-rummy-apps/",
  "/all-yono-games/",
  ...(sitemapPaths.has("/new-yono-games/") ? [] : ["/new-yono-games/"]),
];
for (const p of expect404) {
  const s = (await get(p)).status;
  if (s !== 404) fail(`${p} should be 404, got ${s}`);
}
for (const p of ["/contact/", "/privacy-policy/", "/terms/"]) {
  if (sitemapPaths.has(p)) continue;
  if (incoming.has(p)) fail(`draft page ${p} is linked from ${[...incoming.get(p)].join(", ")}`);
  const draft = await get(p);
  if (!(metaContent(draft.body, "name", "robots") ?? "").includes("noindex")) fail(`draft page ${p} is not noindex`);
}
const assets = [
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  site.logo.path,
  site.ogImage.path,
];
for (const p of assets) {
  const res = await fetch(BASE + p);
  if (res.status !== 200 || !(res.headers.get("content-type") ?? "").startsWith("image/")) fail(`${p}: ${res.status} ${res.headers.get("content-type")}`);
}
const home = (await get("/")).body;
for (const icon of ["/favicon.ico", "/favicon-32x32.png", "/favicon-16x16.png", "/apple-touch-icon.png", "/site.webmanifest"]) {
  if (!home.includes(`href="${icon}"`)) fail(`homepage head missing icon/manifest link ${icon}`);
}
const manifestRes = await fetch(BASE + "/site.webmanifest");
try {
  const webManifest = JSON.parse(await manifestRes.text());
  if (webManifest.name !== site.name) fail(`site.webmanifest name is "${webManifest.name}"`);
  for (const icon of webManifest.icons ?? []) {
    if ((await fetch(BASE + icon.src)).status !== 200) fail(`site.webmanifest icon ${icon.src} is missing`);
  }
} catch (error) {
  fail(`site.webmanifest is not valid JSON (${error.message})`);
}
const imageUrls = [...home.matchAll(/<img[^>]*src="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
let brokenImages = 0;
for (const src of imageUrls) {
  const res = await fetch(new URL(src, BASE));
  if (res.status !== 200) brokenImages++;
}
if (brokenImages) fail(`${brokenImages} homepage images failed to load`);
const noSlash = await get("/rummy-apps");
if (noSlash.status !== 308 || !noSlash.location?.endsWith("/rummy-apps/")) fail("/rummy-apps does not redirect to trailing slash");

// ---------------------------------------------------------------- ratings API (read-only and rejected writes only)
const firstApp = manifest.find((e) => e.kind === "app");
if (firstApp) {
  const apiPath = `/api/ratings${firstApp.path.replace("/apps", "")}`;
  const read = await fetch(BASE + apiPath);
  const readBody = await read.json().catch(() => null);
  if (read.status !== 200 || typeof readBody?.count !== "number") fail(`${apiPath} GET returned ${read.status}`);
  if (!/noindex/.test(read.headers.get("x-robots-tag") ?? "")) fail(`${apiPath} lacks X-Robots-Tag noindex`);
  const post = (body, origin) =>
    fetch(BASE + apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}) },
      body: JSON.stringify(body),
    });
  const voter = "00000000-0000-4000-8000-000000000000";
  if ((await post({ stars: 5, voterId: voter }, "https://evil.example")).status !== 403) fail("ratings API accepted a cross-site vote");
  if ((await post({ stars: 9, voterId: voter }, BASE)).status !== 400) fail("ratings API accepted stars outside 1-5");
  if ((await post({ stars: 3, voterId: "not-a-uuid" }, BASE)).status !== 400) fail("ratings API accepted an invalid voter id");
  if ((await fetch(BASE + "/api/ratings/does-not-exist/")).status !== 404) fail("ratings API answered for an unknown app");

  const report = (body, origin) =>
    fetch(BASE + "/api/reports/", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}) },
      body: JSON.stringify(body),
    });
  const slug = firstApp.path.split("/")[2];
  const valid = { slug, kind: "broken-link", message: "check-site test" };
  if ((await report(valid, "https://evil.example")).status !== 403) fail("reports API accepted a cross-site report");
  if ((await report({ ...valid, kind: "nope" }, BASE)).status !== 400) fail("reports API accepted an unknown kind");
  if ((await report({ ...valid, slug: "does-not-exist" }, BASE)).status !== 400) fail("reports API accepted an unknown app");
  if ((await report({ ...valid, url: "javascript:alert(1)" }, BASE)).status !== 400) fail("reports API accepted a non-http link");
}

// ---------------------------------------------------------------- help guides and listings
for (const entry of manifest.filter((e) => e.kind === "guide" && e.path !== "/guides/")) {
  const html = (await get(entry.path)).body;
  if (!html.includes('href="/guides/"')) fail(`${entry.path}: no link back to the help guides hub`);
}
for (const entry of manifest.filter((e) => e.kind === "app").slice(0, 5)) {
  const html = (await get(entry.path)).body;
  for (const guidePath of ["/guides/install-apk/", "/guides/login-problems/", "/guides/otp-not-received/", "/guides/update-app/", "/guides/withdrawal-conditions/"]) {
    if (!html.includes(`href="${guidePath}"`)) fail(`${entry.path}: no link to ${guidePath}`);
  }
}

// ---------------------------------------------------------------- IndexNow key file
const keyFile = await get(`/${site.indexNowKey}.txt`);
if (keyFile.status !== 200) fail(`IndexNow key file returned ${keyFile.status}`);
if (!keyFile.type.startsWith("text/plain")) fail(`IndexNow key file content type is ${keyFile.type}`);
if (keyFile.body !== site.indexNowKey) fail("IndexNow key file content does not match the configured key");
if (!/noindex/.test(keyFile.robotsHeader)) fail("IndexNow key file should carry X-Robots-Tag: noindex");
if (!/^[0-9a-f]{32}$/.test(site.indexNowKey)) fail("IndexNow key is not 32 hex characters");

// ---------------------------------------------------------------- Markdown versions
const markdownPaths = manifest.filter((e) => e.markdownPath).map((e) => [e.markdownPath, e]);
for (const [mdPath, entry] of markdownPaths) {
  const md = await get(mdPath);
  if (md.status !== 200 || !md.type.startsWith("text/markdown")) fail(`${mdPath}: ${md.status} ${md.type}`);
  if (!/noindex/.test(md.robotsHeader)) fail(`${mdPath}: missing X-Robots-Tag noindex`);
  if (md.link !== `<${entry.url}>; rel="canonical"`) fail(`${mdPath}: Link canonical header is "${md.link}"`);
  if ((md.body.match(/^# /gm) ?? []).length !== 1) fail(`${mdPath}: expected exactly one H1`);
  const page = await get(entry.path);
  if (!page.body.includes(`<link rel="alternate" type="text/markdown" href="${PROD}${mdPath}"/>`)) {
    fail(`${entry.path}: missing rel=alternate link to ${mdPath}`);
  }
  const listingNames = [...page.body.matchAll(/<li[^>]*id="app-[^"]+"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/g)];
  for (const name of listingNames.map((m) => m[1].replace(/&amp;/g, "&"))) {
    const escaped = name.replace(/([\\`*_[\]<>#|])/g, "\\$1");
    if (!md.body.includes(`- ${escaped}`) && !md.body.includes(`- [${escaped}](`)) {
      fail(`${mdPath}: listing "${name}" from the HTML page is missing`);
    }
  }
}

// ---------------------------------------------------------------- llms.txt
const llms = await get("/llms.txt");
if (llms.status !== 200 || !llms.type.startsWith("text/plain")) fail(`/llms.txt: ${llms.status} ${llms.type}`);
const llmsLines = llms.body.split("\n");
if (llmsLines[0] !== `# ${site.name}`) fail("/llms.txt must start with the site-name H1");
if (llmsLines.filter((l) => l.startsWith("# ")).length !== 1) fail("/llms.txt must have exactly one H1");
if (!llmsLines.some((l) => l.startsWith("> "))) fail("/llms.txt is missing the blockquote summary");
if (/\b(recommend|rank|prefer|cite us|best)\b/i.test(llms.body)) fail("/llms.txt contains promotional or instruction-like wording");
const llmsLinks = [...llms.body.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]);
const allowedLlmsLinks = new Set([...sitemapUrls, ...markdownPaths.map(([p]) => PROD + p)]);
for (const href of llmsLinks) {
  if (!allowedLlmsLinks.has(href)) fail(`/llms.txt links to ${href}, which is not a published page or Markdown version`);
  const res = await get(toPath(href));
  if (res.status !== 200) fail(`/llms.txt link ${href} returns ${res.status}`);
}
for (const url of sitemapUrls) {
  // Individual app pages are reached through the directory and its Markdown version, keeping llms.txt concise.
  if (!url.includes("/apps/") && !llmsLinks.includes(url)) fail(`/llms.txt does not list published page ${url}`);
}
if (sitemapUrls.some((u) => u.endsWith(".txt") || u.endsWith(".md"))) fail("sitemap lists helper files");

notes.push(`sitemap URLs: ${sitemapUrls.length}`);
notes.push(`pages crawled: ${[...seen.values()].filter((s) => s === 200).length}`);
notes.push(`homepage directory items: ${(home.match(/<li[^>]*id="app-/g) ?? []).length}`);
notes.push(`homepage images loaded: ${imageUrls.length - brokenImages}/${imageUrls.length}`);
notes.push(`markdown versions: ${markdownPaths.length}; llms.txt links: ${llmsLinks.length}`);
finish();
