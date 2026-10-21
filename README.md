# Yono Game APK — yonogameapk.net

Independent directory of Yono-related gaming apps with APK install guidance. Next.js 16 (App Router),
TypeScript and Tailwind CSS 4. Every page is statically rendered.

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint
npm run typecheck
npm run build && npm start
npm run check:site   # crawls the running build: links, canonicals, JSON-LD, sitemap, 404s
```

Production URL and brand live in `src/lib/site.ts`. Published/draft status of static pages lives in
`src/lib/pages.ts`; navigation, footer and `sitemap.xml` all read from it.

## Where app data lives

| File | Purpose |
| --- | --- |
| `complete_game_app_collection.docx` | Original document input, kept unchanged. |
| `source-assets/app-images/` | Current app tile originals (1254×1254 WebP, named like the DOCX entries). Add or replace tiles here, not in `public/`. |
| `source-assets/app-banners/` | 1920×1080 page banners named like the tiles; each becomes the hero background and social preview image of its app page. |
| `allnewyonoapps-images/` | Earlier third-party icon set, kept for reference only. |
| `scripts/import_collection.py` | Parses the DOCX and image set into site data. |
| `scripts/import-rules.json` | Manual reconciliation decisions (name fixes, rejected icons, utility assets). |
| `src/data/imported-apps.generated.ts` | Generated records. Don't edit by hand. |
| `src/data/image-map.json` | Generated mapping: slug → source file, hash, output path, size. |
| `public/images/apps/` | Generated icons, 256 px WebP named `<slug>-<content hash>.webp` so replaced images get new URLs. The importer deletes anything else in this folder. |
| `public/images/banners/` | Generated banners, 1600 px wide WebP, also content-hashed and pruned by the importer. |
| `src/data/app-overrides.ts` | **Your manual research.** Never touched by the importer. |
| `src/data/apps.ts` | Merges imported data with overrides and decides what is published. |
| `docs/import-report.md`, `docs/app-inventory.csv` | Reconciliation report and full inventory. |

## Re-running the import

```bash
python scripts/import_collection.py                       # defaults to the files in the repo root
python scripts/import_collection.py --docx path/to.docx --images path/to/images-or.zip
```

Needs Python 3.10+; Pillow (`pip install pillow`) resizes icons, otherwise they are copied as-is. Output is
deterministic and keyed by slug, so re-running never duplicates entries, and stale icons are removed. To fix a
name, reject a wrong icon or map an icon manually, edit `scripts/import-rules.json` and re-run.

## Updating an app record

Add an entry to `src/data/app-overrides.ts`, keyed by the app id (its slug, see `docs/app-inventory.csv`):

```ts
export const appOverrides: Record<string, AppOverride> = {
  "rummy-91": {
    summary: "One or two factual sentences you have confirmed.",
    developer: "Developer name as shown on the official source",
    sourceUrl: "https://developer-site.example/",
    downloadUrl: "https://developer-site.example/download", // only a real, relevant destination
    downloadIsAffiliate: false,                              // true renders rel="sponsored" and a disclosure
    checkedAt: "2026-11-02",                                 // the date you actually checked
    publicationStatus: "published",
    provenance: {
      developer: { origin: "independent-check", reference: "https://developer-site.example/about", checkedAt: "2026-11-02" },
      downloadUrl: { origin: "independent-check", reference: "Visited and matched app name and icon", checkedAt: "2026-11-02" },
    },
  },
};
```

Every listed app has an indexable page at `/apps/<slug>/` (excluded inventory entries return 404). The page is built
from that app's DOCX entry (`src/data/app-content.generated.ts`: what it is, how to play, features, FAQs, similar
names) plus general where-to-get, safety, Android and iOS guidance. An app counts as **independently checked**
(`isChecked` in `src/data/apps.ts`) once it has a `checkedAt` date and a `developer` or `sourceUrl`. Checked apps
show their summary, developer, check date and `SoftwareApplication` markup; any app with a `downloadUrl` shows a
labelled external download button.

### Evidence fields for app pages

Each app page has slots for first-hand evidence. They stay empty (and say "Not confirmed" / "None recorded") until
you add them in `src/data/app-overrides.ts`. Never fill them with estimates.

```ts
"ind-rummy": {
  sourceUrl: "https://official-site.example/",          // official website or store listing
  developer: "Developer Ltd",                            // shown once checkedAt is set
  checkedAt: "2026-11-02",                               // when WE last checked the page's facts
  appUpdate: { date: "2026-10-30", source: "https://play.google.com/store/apps/details?id=…" }, // app's own release date
  screenshots: [{ src: "/images/screens/ind-rummy-1.webp", width: 720, height: 1600, alt: "IND Rummy lobby, 2 Nov 2026" }],
  knownIssues: [{ date: "2026-11-02", text: "Login OTP took several minutes to arrive.", source: "our test on Android 14" }],
  verificationLog: [{ date: "2026-11-02", text: "Confirmed developer and official site; download link points to the same site.", source: null }],
  bonusTerms: [{ date: "2026-11-02", text: "Bonus is credited as non-withdrawable bonus balance…", source: "https://official-site.example/terms" }],
  stats: { os: { value: "Android 8.0 or later", source: "https://…", checkedAt: "2026-11-02", claim: "none" } },
},
```

"Page last updated", "page last checked" (`checkedAt`) and "app last updated" (`appUpdate`) are always shown
separately. Put your own screenshots in `public/images/screens/` (WebP, ~720px wide); next/image serves them as
AVIF/WebP at responsive sizes.

### Listing pages, help guides and editors

- Category pages come from `src/data/categories.ts` (rummy, slots, spin); name collections such as `/777-games/`
  from `nameCollections` in the same file. A page publishes when it has at least 3 apps; its copy lives in
  `categoryCopy` in `src/content/copy.ts`, and a page file under `src/app/<path>/page.tsx` plus its
  `index.html.md/route.ts`.
- Help guides are registered in `helpGuides` (`src/content/copy.ts`) and rendered with `GuideArticle`.
- Real author/editor details go in `editors` in `src/lib/site.ts`; About, the editorial policy and guide bylines use
  them. Until then content is credited to the editorial team.

### Mobile, old browsers and speed

- `browserslist` in `package.json` compiles for Chrome/Android 80+, Safari/iOS 14+ and Samsung Internet 13+.
  `@csstools/postcss-cascade-layers` (in `postcss.config.mjs`) flattens Tailwind's `@layer` blocks, which older
  WebViews would otherwise ignore entirely. Every page is server-rendered HTML, so content and links still work
  where JavaScript fails; only the category filter, ratings and reports need it.
- Off-screen app cards use `content-visibility: auto` (`.card-deferred` in `globals.css`); card and footer links
  don't prefetch.
- Images: next/image serves AVIF/WebP at `deviceSizes` up to 1536px, cached for a year (filenames are
  content-hashed). Banners show a tiny blurred preview while loading; after changing banners run
  `npm run images:placeholders`.
- Form fields are 16px on phones so iOS doesn't zoom on focus; touch targets are at least 40px.

### Directory tools

- The homepage category chips filter the list in the browser and never change the URL, so filtered views can't
  create indexable duplicate pages.
- Every app page has a "Report a broken link, changed link or wrong information" form posting to `/api/reports/`
  (same-origin, rate-limited, honeypot). Reports are stored in `.data/reports.jsonl` or the Upstash list `reports`;
  read them with `npm run reports`. When you confirm a fix, update the override and add a `verificationLog` entry.

### Download link and Telegram (environment variables)

Set these in `.env.local` locally (see `.env.example`) or in your host's environment settings, then rebuild:

- `DOWNLOAD_URL` — one link used by every game's Download button (homepage list and app pages). An app with its own
  `downloadUrl` in `src/data/app-overrides.ts` keeps that instead. Empty = "Download not available yet".
- `DOWNLOAD_URL_SPONSORED=true` — mark that link as affiliate/referral: buttons get `rel="sponsored"` and the site
  shows an affiliate disclosure on app pages and in the footer.
- `TELEGRAM_URL` — your channel (e.g. `https://t.me/yourchannel`) for the Join button on `/telegram/`. Empty shows
  "Telegram link coming soon". The page banner is `public/images/telegram/yonogames-telegram-e572e07a.webp`
  (original in `source-assets/brand/`).

An invalid URL stops the build with a clear error.

### Editor Score

Your own scores live in `src/data/editor-ratings.ts`, one line per app keyed by its exact name:

```ts
export const editorRatings: Record<string, number | null> = {
  "Joy Rummy": 4.2,
  "101Z App": null, // shows "Not rated yet"
};
```

Change a number and rebuild (`npm run build`; `npm run dev` picks it up immediately). The score is shown as
"★ 4.2/5 Editor Score" next to the app name on cards and at the top of the app page, separately from visitor ratings,
and it is not added to search markup. The build fails if a name doesn't match an app or a score is outside 0–5.
The spreadsheet's "Editor Score" column is no longer read.

### Download card and visitor ratings

The visitor rating (average and count, or "Not rated yet") is also shown under the app name at the top of each app
page and on every app card in the homepage, category and related-app lists (`RatingBadge`). Those pages re-render
hourly, so new ratings appear within an hour.


Every app page opens with a "Download <app> APK" card. Its button links to `downloadUrl` when you set one in the
override (with `downloadIsAffiliate: true` for affiliate links, rendered `rel="sponsored"`); otherwise it reads
"Download not available yet". The page title only says "APK Download" for apps with a link. APK size comes from
`stats.apkSize`, the Android requirement from `stats.os`, and the version from `version`.

Visitors can rate apps with one click, no account. Votes go to `POST /api/ratings/<slug>/` (same-origin only, 1–5
stars, a random per-browser id so a browser's vote is replaced, not stacked; 20 votes per network per 10 minutes).
Storage:

- **Self-hosted (`npm start` on one server):** votes are saved in `.data/ratings.json` (git-ignored; back it up).
- **Serverless hosts (Vercel, Netlify, etc.):** set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
  (Upstash Redis, free tier is enough); the local file would not persist there.
- Optional: set `RATINGS_SALT` to a random string for the in-memory rate-limit hashing.

Ratings are shown as visitor opinions and are deliberately not added to structured data.

### Quick stats, security and system requirements

Every app page shows this section; each field reads "Not yet verified" until you add it under `stats` in the app's
override. Every value needs a source and the date you checked it, and a `claim` type: `"none"` for something you
confirmed, `"operator"` for the operator's own statement (bonus terms, "RNG certified"), `"third-party"` for another
website's claim. Claims are labelled as unconfirmed on the page:

```ts
"rummy-91": {
  stats: {
    downloads: { value: "1M+", source: "https://play.google.com/store/apps/details?id=…", checkedAt: "2026-11-02", claim: "none" },
    minWithdrawal: { value: "₹100", source: "https://example-operator.com/terms", checkedAt: "2026-11-02", claim: "operator" },
    os: { value: "Android 7.0 or later", source: "https://play.google.com/store/apps/details?id=…", checkedAt: "2026-11-02", claim: "none" },
  },
},
```

Sign-up bonus and minimum-withdrawal figures are imported from `game-bonuses.xlsx` (allnewyonoapps.com claims) by
`python scripts/import_bonuses.py` (needs `pip install openpyxl`) into `src/data/bonuses.generated.ts`; name
mappings live in `scripts/bonus-rules.json` and results in `docs/bonus-import-report.md`. A value you set in an
app's override `stats` replaces the imported one.

### Ratings from other sources

To show a rating published elsewhere (for example on a Google Play listing), add three columns to
`game-bonuses.xlsx` next to the bonus columns: **Rating** (0–5), **Rating count** (optional) and **Rating source**
(URL of the page showing the rating), then re-run `python scripts/import_bonuses.py`. Rows with a rating but no
source URL are skipped and listed in the report. Or set it per app in `src/data/app-overrides.ts`:

```ts
"rummy-91": {
  externalRating: { value: 4.3, count: 12345, source: "https://play.google.com/store/apps/details?id=…", checkedAt: "2026-11-02" },
},
```

The page shows it as "4.3 out of 5 on play.google.com (12,345 ratings) · checked …" in the download card and the
Quick stats table. Ratings from other sites are never put in structured data: Google only allows ratings that
visitors give on this site there, which the visitor rating widget provides.

Keys: `downloads`, `rating`, `support`, `minWithdrawal`, `encryption`, `paymentPartners`, `rngCertification`,
`dataPrivacy`, `os`, `ram`, `storage`, `internet`, `screen`. Ratings are shown as text only, never as review markup.

Rules of thumb: never set `checkedAt` just because you imported something, never guess a download URL, and
don't add ratings, bonus amounts or "official/safe" labels without evidence.

## Crawling, sitemap, IndexNow and llms.txt

All of these read the published-URL manifest in `src/lib/published-urls.ts`, which is built from the same data as
the pages. Page titles and short copy shared with the Markdown files live in `src/content/copy.ts`.

| Endpoint | Source | Notes |
| --- | --- | --- |
| `/robots.txt` | `src/app/robots.ts` | `User-agent: *` / `Allow: /` plus the sitemap URL. No named bot groups. |
| `/sitemap.xml` | `src/app/sitemap.ts` | Single sitemap of published canonical URLs; `lastmod` is the real content date, omitted when unknown. |
| `/llms.txt` | `src/app/llms.txt/route.ts` | llmstxt.org format, generated from the manifest. Served with `X-Robots-Tag: noindex`. |
| `/index.html.md`, `/rummy-apps/index.html.md`, `/slots-apps/index.html.md` | `src/lib/markdown.ts` | Markdown versions of the directory pages, advertised with `rel="alternate" type="text/markdown"`; `noindex` with a `Link: rel="canonical"` header to the HTML page. |
| `/6e8b715593bc803ae6c732afcc4f6cc5.txt` | `public/` | IndexNow ownership file; must match `indexNowKey` in `src/lib/site.ts`. |

**Environments.** `src/lib/env.ts` decides production vs preview at build time: `SITE_ENV` (production / preview /
development) wins, then Vercel's `VERCEL_ENV`, then Netlify's `CONTEXT`; a build with none of these is treated as
production. Preview and development builds add `<meta name="robots" content="noindex, nofollow">` to every page and
an `X-Robots-Tag: noindex, nofollow` header to every response, while robots.txt keeps allowing crawling so the noindex
can be seen. **Any staging host other than Vercel/Netlify previews must build with `SITE_ENV=preview`.**

### IndexNow

IndexNow notifies participating engines (Bing, Yandex and others) about changed URLs. It is not a Google API, and an
accepted request means the notification was received, not that anything was crawled or indexed. Nothing is sent
during builds, page views or development; only these explicit commands submit, and only with `--submit`:

```bash
npm run indexnow:dry-run                       # payload for every published URL; sends nothing
npm run indexnow:initial                       # first live submission of every published URL
npm run indexnow:changes                       # dry-run of new/changed/removed URLs since the last submission
npm run indexnow -- --changes --submit         # send them
npm run indexnow -- --url https://yonogameapk.net/rummy-apps/ --deleted https://yonogameapk.net/apps/old-app/ --submit
npm run indexnow -- --urls-file changed.txt --deleted-file deleted.txt --submit
npm run indexnow -- --help
npm run test:indexnow                          # unit tests with a stubbed network
```

Before sending, the tool checks that the live key file returns the key, that changed URLs return 200 and that deleted
URLs return 404/410 (`--force` skips the per-URL checks, never the key check). Only same-origin canonical URLs are
accepted; deleted URLs may be ones that are no longer in the sitemap. Requests are capped at 10,000 URLs, time out
after 15 s and retry 429/5xx/network errors up to three times with backoff (honouring `Retry-After`). After a fully
accepted submission, `scripts/indexnow-state.json` records each URL's content fingerprint; `--changes` compares
against it, so the homepage is re-notified whenever its visible directory changes. Commit that file.

**Deployment integration.** No hosting configuration exists in this repository yet. After each production deploy
that changes content, run `npm run indexnow -- --changes --submit` from a machine or CI job with network access
(for example, a post-deploy step in your pipeline). Don't run it from preview deployments; it refuses to submit
when the environment resolves to preview or development. No public submission endpoint exists; if you later add a
webhook, protect it with its own server-side secret, not the public IndexNow key.

### Manual steps after the first production deploy

1. Confirm `https://yonogameapk.net/robots.txt`, `/sitemap.xml`, `/llms.txt` and `/6e8b715593bc803ae6c732afcc4f6cc5.txt` load publicly.
2. Google Search Console: add the `yonogameapk.net` domain property (DNS TXT verification), then submit
   `https://yonogameapk.net/sitemap.xml` under *Sitemaps*. Google retired sitemap "ping" requests; submission is
   done in Search Console or through the robots.txt `Sitemap:` line.
3. Bing Webmaster Tools: add the site (it can import from Search Console), then submit the same sitemap URL.
4. Run `npm run indexnow:initial`.
5. Check the host/CDN for bot controls that override robots.txt, such as Cloudflare *Block AI bots* /
   *AI Scrapers and Crawlers* / *Bot Fight Mode*, Vercel Firewall bot or AI-crawler rules, or any WAF challenge on
   `/robots.txt`, `/sitemap.xml`, `/llms.txt`, the key file, `/_next/` assets or images. Leave security protections
   on, and only relax rules that specifically block verified search or AI crawlers.

Allowing crawling doesn't guarantee visits, indexing, rankings, AI citations or training inclusion.

## Other switches

- `addedAt` dates: once more than six listings have a genuine `addedAt`, `/new-yono-games/` publishes itself and
  joins the navigation and sitemap; the homepage shows a "Recently added" section as soon as one exists.
- Category pages (`/rummy-apps/`, `/slots-apps/`) publish when a category has at least three listings.
- Contact page publishes when `contactEmail` is set in `src/lib/site.ts`. Privacy and terms stay noindex drafts
  until you complete them and set their status to `"published"` in `src/lib/pages.ts`.
- Brand assets: the logo is `public/brand/logo.webp` (header and Organization markup; path and size in
  `src/lib/site.ts`). Favicons, the Apple touch icon, Android icons and `public/site.webmanifest` are used as
  supplied. The social preview image `public/brand/og-default.jpg` (1200×630) is cropped from
  `source-assets/brand/og-banner.png` by `python scripts/generate_brand_assets.py`. Originals are kept in
  `source-assets/brand/`.
