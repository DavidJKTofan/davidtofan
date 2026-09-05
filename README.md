# David Tofan - Personal Website

Personal website built with [Astro](https://astro.build) and deployed on [Cloudflare Workers](https://workers.cloudflare.com).

## Tech Stack

- **Framework**: [Astro 7](https://astro.build) with TypeScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com) via `@tailwindcss/vite` with the Typography plugin
- **Deployment**: [Cloudflare Workers](https://workers.cloudflare.com) with the official `@astrojs/cloudflare` adapter
- **Search**: [Cloudflare AI Search](https://developers.cloudflare.com/ai-search/) modal via Web Components
- **Analytics**: [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/) — cookieless; enabled via dashboard *automatic setup*, so the beacon is injected at the edge and does **not** appear anywhere in this repo
- **Content**: Markdown with Zod validation (Content Collections), rendered through the `unified()` pipeline (`@astrojs/markdown-remark`)
- **Fonts**: System font stack (no external CDN dependencies)
- **Design**: [Canva](https://www.canva.com)
- **Stock Images**: [Unsplash](https://unsplash.com) (Travel project)
- **AI Coding**: [Anthropic Claude](https://anthropic.com)

## Project Structure

```
src/
├── assets/img/           # Optimized images (logo, profile)
├── components/           # Reusable UI components
│   ├── ArticleCard.astro
│   ├── CertificateCard.astro
│   ├── Footer.astro
│   ├── Header.astro
│   ├── ProjectCard.astro
│   ├── ReadingProgress.astro
│   ├── ScrollToTop.astro
│   ├── TableOfContents.astro
│   └── agent-ready-guide/  # Interactive components for the AI-agent-ready guide
├── config/
│   └── site.ts           # Site config (name, URLs, nav, AI Search)
├── content/              # Markdown content
│   ├── articles/         # Blog articles
│   │   └── [slug]/
│   │       ├── index.md
│   │       ├── featured.png
│   │       └── img/      # Article images
│   └── projects/
│       └── [slug]/
│           └── index.md
├── data/
│   └── certificates.json # Certificates data
├── layouts/
│   └── BaseLayout.astro  # Main layout with SEO
├── lib/
│   ├── certificates.ts     # Certificate utilities
│   ├── contentMetadata.js  # Sitemap lastmod map, static page metadata, noindex routes
│   └── readingTime.ts      # Reading time estimation
├── pages/
│   ├── 404.astro
│   ├── index.astro
│   ├── certificates.astro
│   ├── ai-licensing-terms.astro  # Legal — AI/crawler licensing (noindex)
│   ├── disclaimer.astro          # Legal — disclaimer (noindex)
│   ├── imprint.astro             # Legal — site identification (noindex)
│   ├── articles/
│   │   ├── index.astro
│   │   ├── [...slug].astro
│   │   └── ai-agent-ready-website-cloudflare-guide/
│   │       └── index.astro       # Custom-designed landing page for that guide
│   └── projects/
│       ├── index.astro
│       └── [...slug].astro
├── styles/
│   └── global.css
├── types/
│   └── index.ts          # Shared TypeScript types
├── env.d.ts
└── content.config.ts     # Content collection schemas
```

`src/config/site.ts` also contains the AI Search feature flag and endpoint configuration.

Notable files outside `src/`:

| Path | Purpose |
|:--|:--|
| `public/robots.txt` | Crawl rules, IETF AIPREF Content Signals, `License:` directive, sitemaps |
| `public/rsl.xml` | RSL 1.0 machine-readable license document |
| `public/_headers` | Cache, security, `Link`, and `X-Robots-Tag` headers for Static Assets |
| `scripts/copy-featured-images.mjs` | `prebuild` — copies `featured.png` into `public/` |
| `scripts/update-deps.sh` | Dependency upgrade + verification harness |

## Commands

```bash
npm install      # Install dependencies
npm run dev      # Start Astro dev server (localhost:4321)
npm run build    # Generate types + build for production
npm run preview  # Build + run Astro preview locally
npm run deploy   # Build + deploy to Cloudflare Workers
```

### Verifying a Build Before Deploying

Run these after `npm run build` — none of them deploy anything:

```bash
npx wrangler dev              # Serve the built site on localhost:8787 via workerd
```

```bash
npx wrangler deploy --dry-run # Resolve config + bundle without uploading
```

```bash
npx wrangler check startup    # Report bundle size and Worker startup CPU time
```

`wrangler check startup` writes a `worker-startup.cpuprofile` flamegraph to the repo root
(gitignored) that can be opened in Chrome DevTools or VS Code.

`wrangler dev` serves the real build output, so it is the closest local check to production.
Two expected differences from production:

- **Article images 404.** They are emitted as `/cdn-cgi/image/...` URLs, which only
  Cloudflare's edge can serve; the local asset router cannot match that path. Images render
  normally under `npm run dev` (served via `/_image`) and in production. See the image service
  note below.
- **Cloudflare AI Search** calls the live endpoint, so it needs network access.

### Updating Dependencies

Use the helper script — it upgrades, verifies the result end to end, and rolls back if
anything breaks.

```bash
npm run deps:check
```

Reports what is outdated and whether `compatibility_date` is behind. **Writes nothing.**

```bash
npm run deps:update
```

Applies updates *within* the `^` ranges in `package.json`, then runs the full verification
chain. To include major version bumps:

```bash
./scripts/update-deps.sh --apply --latest
```

Other flags: `--force` (allow a dirty `package.json`/`package-lock.json`), `--help`.

**What it verifies**, in order — any failure stops the run:

1. `npm run build` completes and produces `dist/client`
2. `npx wrangler deploy --dry-run` resolves the config and bundles
3. `npx wrangler check startup` reports bundle size and startup CPU
4. `npx wrangler dev` boots and serves 10 routes (pages, a 301, a 307, a 404)
5. `/_astro/*` assets return exactly one `Cache-Control` — guards against the overlapping
   `_headers` rules described under [Splats vs. placeholders](#splats-vs-placeholders-avoid-duplicate-headers)

**What it will never do:** deploy (only ever `--dry-run`), touch the Cloudflare API, run any
`git` write command, edit `wrangler.jsonc` / `astro.config.mjs` / `public/_headers` / `src/`,
delete `.wrangler/` (local KV and deploy state), or kill a dev server it did not start.

On failure it restores `package.json` + `package-lock.json` from its snapshot, reinstalls with
`npm ci`, and exits non-zero. Logs and snapshots land in `.deps-update/` (gitignored).

It deliberately **reports** a suggested `compatibility_date` rather than editing it, because
that changes runtime behavior — see [Compatibility date](#compatibility-date) below.

#### Compatibility date

`compatibility_date` in `wrangler.jsonc` is pinned to the date implemented by the installed
`workerd` (the version string `1.20260826.1` maps to `2026-08-26`), so `wrangler dev` and the
deployed Worker agree. `npm run deps:check` prints both values when they drift.

Bump it deliberately, not automatically: read the
[compatibility flags](https://developers.cloudflare.com/workers/configuration/compatibility-flags/)
that became default in between, then edit `wrangler.jsonc` and re-run `npm run deps:check`.

Two flags matter here:

- `nodejs_compat` — **redundant** for compatibility dates ≥ `2026-08-04`, where Workers enables
  it (and `nodejs_compat_v2`) by default. Kept in the config so Node APIs stay available if the
  date is ever lowered; the tooling ignores it.
- `global_fetch_strictly_public` — has **no** "default as of" date, so it only ever applies
  while listed explicitly. Do not remove it.

#### Manual upgrades

The commands below are what the script automates; use them for one-off bumps.

##### Wrangler CLI

Wrangler is installed locally as a dev dependency (not globally), so updates are per-project.

```bash
npx wrangler --version        # Check the current version
npm i -D wrangler@latest      # Update to the latest version
```

`@astrojs/cloudflare` v14 declares a peer dependency on `wrangler ^4.125.0`, so keep Wrangler
at or above that when upgrading the adapter.

##### Astro

Use the official upgrade CLI, which upgrades `astro` together with the official integrations (`@astrojs/cloudflare`, `@astrojs/sitemap`) to compatible versions:

```bash
npx @astrojs/upgrade          # Recommended: upgrade Astro + official integrations
```

To update just the core `astro` package manually:

```bash
npm install astro@latest
```

After updating, run `npm run build` to regenerate types and confirm the build still passes.

##### Approving install scripts (npm 11+)

npm 11 blocks lifecycle scripts until they are approved. A fresh `npm install` will report that
`esbuild` (Astro's bundler) and `workerd` (the Workers runtime behind `wrangler dev`) have
pending install scripts, and **both are required** — without them the native binaries are never
placed and `astro build` / `wrangler dev` fail:

```bash
npm install-scripts ls        # Review what is pending
```

```bash
npm install-scripts approve esbuild workerd
```

Approvals are recorded per exact version in the `allowScripts` field of `package.json`, so they
need re-approving after a version bump of either package.

### Development Workflow

1. **Local development** (Astro dev with Cloudflare's local runtime):
   ```bash
   npm run dev
   ```

2. **Preview the production build locally**:
   ```bash
   npm run preview
   ```

3. **Deploy to production**:
   ```bash
   npm run deploy
   ```

## AI Search Configuration

Cloudflare AI Search is configured in `src/config/site.ts` through the exported `aiSearchConfig` object.

The current implementation follows Cloudflare's `search-modal-snippet` Component API Reference, especially the common props (`api-url`, `placeholder`, `theme`, `hide-branding`) and the modal-specific props (`max-results`, `show-url`, `show-date`, `shortcut`).

```ts
export const aiSearchConfig = {
  enabled: true,
  apiUrl: 'https://<id>.search.ai.cloudflare.com/',
  snippetVersion: 'v0.0.36',
  placeholder: "Search David's articles, projects, certificates, and Cloudflare guides...",
  shortcut: 'k',
  maxResults: 5,
  showUrl: true,
  showDate: true,
  hideBranding: false,
};
```

- **Enable / disable the feature**: set `enabled` to `true` or `false`.
- **Change the Cloudflare AI Search ID**: update the `apiUrl` value. The current ID is the UUID in `https://<id>.search.ai.cloudflare.com/`.
- **Change the search prompt text**: update `placeholder` to better match the site's content focus.
- **Change result count**: update `maxResults`.
- **Show content dates**: set `showDate` to `true` or `false`.
- **Show Cloudflare branding**: keep `hideBranding: false` if you want the default “Powered by Cloudflare” attribution visible.
- **Change snippet version**: update `snippetVersion` if Cloudflare releases a newer embed asset version.

The search button, modal markup, and snippet loader all read from this config, so no edits are needed in the header or layout when toggling the feature or changing the AI Search endpoint.

> **Note**: `npm run build` automatically runs `wrangler types` first to ensure TypeScript types are up-to-date with your `wrangler.jsonc` configuration.
>
> **Note**: On the first `npm run dev` after dependency or config changes, Vite may re-optimize dependencies and trigger a couple of automatic reloads. That is expected — if the CLI reports `Dev server process exited before becoming ready`, simply run it again.
>
> **Note**: Astro 7 can run the dev server as a background daemon (it does this automatically in non-interactive shells, and on demand with `astro dev --background`). Manage it with `npx astro dev status`, `npx astro dev logs`, and `npx astro dev stop`; the daemon writes its own log to `.astro/dev.log`.

## Adding Content

### Article

Create `src/content/articles/my-article/index.md`:

```md
---
title: Article Title
date: 2024-01-15
modified: 2024-01-16
description: Brief description for SEO.
tags: ["tag1", "tag2"]
---

Content here...
```

Omit `modified` on a brand-new article; add it on the first substantive edit — see
[Updating existing content](#updating-existing-content).

Add images to the same folder and reference with `![Alt](img/image.png)`. Add `featured.png` beside `index.md` when you want an automatic og:image / twitter:image fallback.

### Project

Create `src/content/projects/my-project/index.md`:

```md
---
title: Project Name
date: 2024-01-01
description: Project description.
website: https://example.com
github: https://github.com/user/repo
tags: ["tech1", "tech2"]
status: active
featured: false
---

Details here...
```

### Certificate

Add to `src/data/certificates.json`:

```json
{
  "name": "Certificate Name",
  "organization": "Issuing Org",
  "link": "https://credential-url",
  "icon": "https://icon-url.png",
  "date": "Jan 2024"
}
```

### Updating Existing Content

**Convention: never change `date` on a published article or project — add or bump `modified`
instead.** `date` is the publication date and is what readers and `datePublished` refer to;
rewriting it makes an old post look new and loses the original timeline.

When making a substantive edit — new sections, corrected guidance, added references, anything a
returning reader would want to know changed — set `modified` to the date of the edit:

```md
---
title: Article Title
date: 2024-01-15
modified: 2026-09-01
---
```

Skip it for typo fixes, formatting, and link repairs; `modified` signals meaningful change, and
bumping it for trivia trains crawlers to ignore it.

Setting `modified` updates three things at once, with no other file to touch:

| Surface | Where it comes from |
|:--|:--|
| `<meta property="article:modified_time">` | `getEffectiveModifiedTime()` → `BaseLayout.astro` |
| JSON-LD `BlogPosting.dateModified` | same helper, via `src/pages/articles/[...slug].astro` |
| Sitemap `<lastmod>` | `buildLastmodMap()` in `src/lib/contentMetadata.js` |

When `modified` is absent, all three fall back to `date`, so leaving it off is safe — just less
accurate. Because listing pages derive their own `lastmod` from the newest entry they list, a
bumped `modified` also refreshes `/`, `/articles/`, and `/projects/`.

> **Write the date bare — no inline comment.** The sitemap reads frontmatter with its own regex
> (`parseFrontmatterDate` in `src/lib/contentMetadata.js`), which captures the rest of the line,
> so `modified: 2026-09-01 # updated refs` parses as an invalid date and silently falls back to
> `date`. Astro's Zod schema still accepts it — YAML strips the comment — so the two disagree
> and only the sitemap is wrong. Use `YYYY-MM-DD` and nothing else.

Static pages under `src/pages/` have no frontmatter; bump their `lastModified` in
`sitePageMetadata` (`src/lib/contentMetadata.js`) by hand instead — see
[Editing the legal pages](#editing-the-legal-pages).

## Frontmatter Reference

### Articles

| Field         | Type     | Required | Description              |
|:--------------|:---------|:---------|:-------------------------|
| `title`       | string   | Yes      | Article title            |
| `date`        | date     | Yes      | Publication date         |
| `modified`    | date     | No       | Last substantial update; used for `dateModified` and sitemap freshness |
| `description` | string   | Yes      | SEO description          |
| `tags`        | string[] | No       | Topic tags               |
| `draft`       | boolean  | No       | Hide from production     |
| `featured`    | boolean  | No       | Show on homepage         |
| `image`       | string   | No       | Explicit social/share image override |
| `imageAlt`    | string   | No       | Share image alt text     |
| `readingTime` | number   | No       | Manual override for reading time |
| `type`        | string   | No       | Hugo compatibility field |
| `showTableOfContents` | boolean | No | Toggle article TOC       |

### Projects

| Field         | Type     | Required | Description                         |
|:--------------|:---------|:---------|:------------------------------------|
| `title`       | string   | Yes      | Project name                        |
| `date`        | date     | Yes      | Start date                          |
| `modified`    | date     | No       | Last substantial update; used for `dateModified` and sitemap freshness |
| `description` | string   | Yes      | Brief description                   |
| `website`     | string   | No       | Live URL                            |
| `github`      | string   | No       | Repository URL                      |
| `image`       | string   | No       | Explicit social/share image override |
| `imageAlt`    | string   | No       | Share image alt text                |
| `tags`        | string[] | No       | Technologies                        |
| `draft`       | boolean  | No       | Hide from production                |
| `status`      | enum     | No       | `active`, `completed`, `archived`   |
| `featured`    | boolean  | No       | Show on homepage                    |

## Features

### UI/UX
- **Fixed header**: Always visible navigation bar on all devices
- **Dark/Light mode**: System detection with manual toggle, persists across page navigations
- **AI Search modal**: Cloudflare AI Search button in the header with Cmd/Ctrl+K shortcut support
- **Theme-aware browser chrome**: `html`-level `color-scheme` and custom scrollbar variables keep the right-edge gutter aligned with light/dark mode
- **View Transitions**: Smooth page navigation with Astro's ClientRouter
- **Link Prefetching**: Hover-based prefetch for faster perceived navigation
- **Mobile scroll-to-top button**: Floating button on articles/projects (hidden on desktop)
- **Responsive design**: Mobile-first with optimized text sizes (`prose-base` on mobile, `prose-lg` on desktop)

### Articles
- Reading progress bar
- Dynamic reading time calculation
- Sticky table of contents with scroll highlighting (desktop)
- Tag filtering

### Content
- External links open in new tab with proper rel attributes
- URL aliases with automatic redirects (Hugo compatibility)
- Image optimization via Cloudflare's edge (`imageService: 'cloudflare'`): images use `/cdn-cgi/image/onerror=redirect,.../_astro/*` URLs, optimized at the edge when [Image Transformations](https://developers.cloudflare.com/images/transform-images/) are enabled on the zone, and transparently falling back to the original image when they are not
- Custom 404 page with site branding
- Dark blue accent color (#1e3a8a) with accent borders on article images

## SEO & Performance

### Metatags

All pages include comprehensive SEO metatags via `BaseLayout.astro`:

- **Primary**: `<title>`, `<meta name="description">`, canonical URL
- **Open Graph**: `og:type`, `og:title`, `og:description`, `og:image`, `og:site_name`, `og:locale`
- **Twitter Cards**: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`, `twitter:creator`
- **Article-specific**: `article:published_time`, `article:modified_time`, `article:tag`
- **Keywords**: Generated from article tags

### Structured Data (JSON-LD)

- **Articles**: `BlogPosting` schema with headline, description, author, mainEntityOfPage, datePublished, and dateModified
- **Listings and special pages**: page-specific JSON-LD where needed (`Blog`, `CollectionPage`, `BreadcrumbList`, `WebPage`, etc.)
- **Fallback**: `BaseLayout.astro` can emit a default `Person` schema, or accept page-specific `structuredData` payloads when a route needs more precise semantics

### Sitemap & Robots

- **Sitemap**: Auto-generated via `@astrojs/sitemap` integration (`/sitemap-index.xml`)
- **Freshness**: every URL in the sitemap carries a `lastmod`, resolved in `src/lib/contentMetadata.js`:
  - **Articles / projects** — frontmatter `modified` when set, otherwise the original `date`
  - **Listing pages** (`/`, `/articles/`, `/projects/`, `/certificates/`) — derived from the newest entry each one lists, so they stay fresh automatically as content is added
  - **Static pages** — the explicit `lastModified` in `sitePageMetadata`; bump it by hand when editing one
- **Exclusions**: the `filter` in `astro.config.mjs` drops every route in `noIndexRoutes` (the legal pages), so the sitemap never advertises a URL that is served `noindex`
- **robots.txt**: `public/robots.txt` — carries the crawl rules, the IETF AIPREF **Content Signals** declaration, the `License:` directive pointing at `/rsl.xml`, and the sitemap references
- **Sitemap link**: Added to `<head>` for discovery

### Featured Thumbnail Images

Articles and projects can have a `featured.png` image in their folder for SEO link previews (og:image, twitter:image):

```
src/content/articles/my-article/
├── index.md
├── featured.png    # Used for og:image, twitter:image
└── img/            # Other article images

src/content/projects/my-project/
├── index.md
└── featured.png    # Used for og:image, twitter:image
```

The `prebuild` script (`scripts/copy-featured-images.mjs`) copies these to `public/articles/` and `public/projects/` during build. These folders are gitignored since the images are regenerated.

### Code Syntax Highlighting

- **Engine**: Shiki with `github-dark-default` theme
- **Config**: Word wrap enabled, language identifiers on all code blocks
- All markdown code blocks use explicit supported language identifiers (e.g., `bash`, `javascript`, `html`, `text`)
- For plain ASCII diagrams, prefer `text` instead of unsupported fence labels so Shiki does not warn and fall back to plaintext

### Cloudflare Workers Static Assets

This site uses [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) for optimal cost and performance.

#### Routing & Billing

These are assumptions:

| Request Type | Served By | Cost |
|:-------------|:----------|:-----|
| HTML pages (`/`, `/articles/*`, etc.) | Static Assets | **FREE** |
| Astro assets (`/_astro/*.js`, `*.css`) | Static Assets | **FREE** |
| Images, fonts, favicons | Static Assets | **FREE** |
| 404 errors | Static Assets (`404.html`) | **FREE** |
| Redirects (`/world` → `/projects/...`) | Static Assets (`_redirects`) | **FREE** |

**Key points:**
- All prerendered pages are served as static files (free, unlimited)
- Astro's configured `redirects` are compiled to a `_redirects` file and served by Static Assets — no Worker invocation. `wrangler dev` reports `Parsed 14 valid redirect rules`
- The deployed Worker is Wrangler's `no-op-worker.js`; it exists only so the assets router has something to fall back to
- No `run_worker_first` = assets served directly without Worker overhead
- File storage is free; only Worker invocations are billed

#### Configuration (`wrangler.jsonc`)

Since `@astrojs/cloudflare` v14 this file only declares **custom** settings. The adapter
resolves `main` and `assets.directory` itself and writes a deploy-ready config to
`dist/client/wrangler.json`; Wrangler picks that up automatically via the redirect in
`.wrangler/deploy/config.json`.

```jsonc
{
  "name": "davidtofan-astro",
  "assets": {
    "binding": "ASSETS",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page"  // Serves nearest 404.html
  }
  // plus: compatibility_date, compatibility_flags, kv_namespaces, observability, routes
}
```

#### Astro 7 / Cloudflare Notes

- Astro 7 requires Node `22.12.0+` and builds on Vite 8
- **Build output is split**: `astro build` now emits `dist/client` (all static assets) and `dist/server`. Because every page is prerendered, `dist/server` is empty and the site deploys as an **assets-only Worker** — Wrangler uploads a `no-op-worker.js` (0.31 KiB) that never runs in practice
- **`wrangler.jsonc` no longer needs `main` or `assets.directory`.** The adapter (via `@cloudflare/vite-plugin`) resolves both and writes `dist/client/wrangler.json`; `.wrangler/deploy/config.json` redirects Wrangler to it. Wrangler prints `Using redirected Wrangler configuration` to confirm
- **Markdown**: Astro 7 makes [Sätteri](https://satteri.bruits.org/) the default processor and no longer bundles `@astrojs/markdown-remark`. This site keeps the `unified()` pipeline for `rehype-external-links`, so `@astrojs/markdown-remark` is now an **explicit dependency** in `package.json`
- The adapter's `platformProxy` option no longer exists in v14 (the Cloudflare Vite plugin provides the real `workerd` runtime in dev) and has been removed from `astro.config.mjs`
- `astro.config.mjs` imports `ChangeFreqEnum` from `@astrojs/sitemap` rather than reaching into the transitive `sitemap` package, so every import resolves to a declared dependency
- `npm run dev` runs against Cloudflare's local `workerd` runtime, so development behavior is closer to production than in older Astro versions
- Tailwind is wired through the `@tailwindcss/vite` plugin in `astro.config.mjs`; this project no longer uses the deprecated `@astrojs/tailwind` integration
- Tailwind's CSS entrypoint is `src/styles/global.css`, which uses `@import "tailwindcss"` and explicitly loads `tailwind.config.mjs` with `@config`
- The old `postcss.config.cjs` file was removed as part of the Tailwind v4 migration
- Astro-scoped `<style>` blocks that use Tailwind utilities via `@apply` should add an `@reference` to `src/styles/global.css`
- **Image service**: this site uses `imageService: 'cloudflare'` in the adapter config. Build-time `imageService: 'compile'` (sharp) was used previously but broke for prerendered sites (build fails with `ENOENT … dist/_astro/*` during image generation). Note that `@astrojs/cloudflare` v14 changed the *default* to `cloudflare-binding`, which transforms at runtime and would invoke the Worker; this site pins `'cloudflare'`, which keeps the build fully static and relies on Cloudflare edge Image Transformations, with `onerror=redirect` falling back to the original image when Transformations are not enabled. Because `/cdn-cgi/image/` only exists at the edge, these images 404 under `npx wrangler dev` but render normally under `npm run dev` and in production. If you prefer no optimization and no Cloudflare dependency, set `imageService: 'passthrough'` — but note that on a fully prerendered site `passthrough` emits `/_image` URLs that require a runtime endpoint.

### Static Asset Headers (`public/_headers`)

Custom headers for Cloudflare Workers Static Assets:

- **Fingerprinted assets** (`/_astro/*`): `Cache-Control: public, max-age=31536000, immutable` (1 year)
- **Images & static files**: `Cache-Control: public, max-age=36000` (10 hours)
- **Security headers** (all HTML pages):
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **Preview protection**: *not currently enabled* — see the note in `public/_headers`. `_headers` supports host matching (`https://<worker>.<account>.workers.dev/*`), but it cannot be verified with `wrangler dev`, and an over-matching rule would `noindex` the production domain. Setting `"workers_dev": false` in `wrangler.jsonc` is the safer way to remove the preview URL.

#### Splats vs. placeholders (avoid duplicate headers)

Every rule that matches a request is applied, and duplicate header names are **joined with a
comma** — there is no "most specific rule wins". Two patterns behave very differently:

| Pattern | Matches | Use for |
|:--|:--|:--|
| `*` (splat) | greedily, **including `/`** | whole subtrees (`/_astro/*`, `/img/*.webp`) |
| `:name` (placeholder) | everything **except `/`** | a single segment (`/:file.png` = root level only) |

So `/*.png` does **not** mean "root-level PNGs" — it also matches `/_astro/<name>.<hash>.png`
and `/img/<dir>/<name>.png`. That previously produced conflicting values like:

```text
Cache-Control: public, max-age=31536000, immutable, public, max-age=36000
Content-Type: image/webp, image/webp, image/webp
```

Root-level rules therefore use `/:file.<ext>`, and each nested location has exactly one rule per
extension. When adding a rule, check it does not overlap an existing one, then verify with:

```bash
curl -sI http://localhost:8787/_astro/<some-fingerprinted-file>.png
```

Each of `Cache-Control`, `Content-Type`, and `X-Content-Type-Options` should appear once, with a
single value.

> **Note**: All pages are prerendered (no SSR), so security headers are applied via `_headers` file, not middleware. For additional headers, use Cloudflare [Transform Rules](https://developers.cloudflare.com/rules/transform/).

### Robots & Indexing

- **Default**: All pages have `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">` for full search engine indexing
- **noIndex option**: Pages passing `noIndex={true}` to `BaseLayout` get `noindex, nofollow` instead
- **Legal pages**: `/ai-licensing-terms/`, `/disclaimer/`, and `/imprint/` are kept out of search results by three agreeing mechanisms — the `noIndex` prop, an `X-Robots-Tag: noindex, nofollow` header in `public/_headers`, and exclusion from the sitemap
- **Preview URLs**: no `X-Robots-Tag` rule is active; see **Static Asset Headers** above for why, and for the two ways to close it

> **Why not `Disallow:` in robots.txt?** Disallowing a path stops crawlers from *fetching* it, which
> means they never read the `noindex` directive — so a linked URL can still end up in the index,
> listed without a description. Keeping these pages crawlable while serving `noindex` is what
> actually removes them from search results.

### Early Hints

Enable in Cloudflare Dashboard: **Speed > Optimization > Content Optimization > Early Hints**. Cloudflare automatically caches and sends 103 Early Hints based on Link headers.

## Legal & AI Licensing

Three standalone pages carry the site's legal and machine-readable licensing layer. All three are
served `noindex, nofollow` and excluded from the sitemap — they exist to be *read*, not ranked.

| Route | Source | Purpose |
|:--|:--|:--|
| `/disclaimer/` | `src/pages/disclaimer.astro` | Personal opinions, no professional advice, no warranty, limitation of liability, third-party and referral links |
| `/imprint/` | `src/pages/imprint.astro` | Site owner, contact, referral-link disclosure, and the GDPR Art. 13 privacy notice |
| `/ai-licensing-terms/` | `src/pages/ai-licensing-terms.astro` | Prose terms for AI crawlers, retrieval, and training |

`/disclaimer/` and `/imprint/` are linked from the footer. `/ai-licensing-terms/` is discovered by
machines instead, through three channels that all point at the same terms:

- `Link: <…>; rel="describedby"` and `rel="license"` response headers (`public/_headers`), mirrored
  as `<link>` tags in `BaseLayout.astro`
- the `License:` directive and `Content-Signal: search=yes, ai-input=yes, ai-train=no` declaration in
  `public/robots.txt`
- `public/rsl.xml` — the [RSL 1.0](https://rslstandard.org/rsl) machine-readable license document

### Editing the legal pages

1. Edit the `.astro` page.
2. Bump `lastModified` for that route in `sitePageMetadata` (`src/lib/contentMetadata.js`) — it feeds
   the "Last updated" line and the page's JSON-LD `dateModified`.
3. If the licensing *stance* changed, update `public/robots.txt` and `public/rsl.xml` to match, since
   they restate the same terms for machines.

Adding another legal page means: create the page with `noIndex={true}`, add it to `sitePageMetadata`
and `noIndexRoutes` in `src/lib/contentMetadata.js`, and add an `X-Robots-Tag` block for it in
`public/_headers`.

> **Note**: The jurisdiction in `/disclaimer/` is deliberately kept generic ("the author's country of
> residence in the European Union") rather than naming a country. The imprint likewise gives a name
> and a LinkedIn contact only, with no postal address.

The GDPR Art. 13 privacy notice lives in `/imprint/` under the `#privacy` anchor rather than on its
own page — Art. 12(1) requires it to be "easily accessible", not separately hosted, and the imprint
already carries the controller identity and contact that Art. 13(1)(a) asks for. If the site ever
gains a contact form, newsletter, account system, or third-party analytics, split it into its own
`/privacy` page: the notice will grow past what belongs inside an imprint.

* * * *

## Disclaimer

All trademarks, logos and brand names are the property of their respective owners. All company, product and service names used in this website are for identification and/or educational purposes only. Use of these names, trademarks and brands does not imply endorsement. 📚
