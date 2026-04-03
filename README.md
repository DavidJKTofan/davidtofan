# David Tofan - Personal Website

Personal website built with [Astro](https://astro.build) and deployed on [Cloudflare Workers](https://workers.cloudflare.com).

## Tech Stack

- **Framework**: [Astro 6](https://astro.build) with TypeScript
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com) with PostCSS and Typography plugin
- **Deployment**: [Cloudflare Workers](https://workers.cloudflare.com) with the official `@astrojs/cloudflare` adapter
- **Content**: Markdown with Zod validation (Content Collections)
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
│   └── TableOfContents.astro
├── config/
│   └── site.ts           # Site config (name, URLs, nav)
├── content/              # Markdown content
│   ├── articles/         # Blog articles
│   │   └── [slug]/
│   │       ├── index.md
│   │       └── img/      # Article images
│   └── projects/
│       └── [slug]/
│           └── index.md
├── data/
│   └── certificates.json # Certificates data
├── layouts/
│   └── BaseLayout.astro  # Main layout with SEO
├── lib/
│   └── certificates.ts   # Certificate utilities
├── pages/
│   ├── 404.astro
│   ├── index.astro
│   ├── certificates.astro
│   ├── articles/
│   │   ├── index.astro
│   │   └── [...slug].astro
│   └── projects/
│       ├── index.astro
│       └── [...slug].astro
├── styles/
│   └── global.css
├── types/
│   └── index.ts          # Shared TypeScript types
└── content.config.ts     # Content collection schemas
```

## Commands

```bash
npm install      # Install dependencies
npm run dev      # Start Astro dev server (localhost:4321)
npm run build    # Generate types + build for production
npm run preview  # Build + run Astro preview locally
npm run deploy   # Build + deploy to Cloudflare Workers
```

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

> **Note**: `npm run build` automatically runs `wrangler types` first to ensure TypeScript types are up-to-date with your `wrangler.jsonc` configuration.
>
> **Note**: On the first `npm run dev` after dependency or config changes, Vite may re-optimize dependencies and trigger a couple of automatic reloads. That is expected.

## Adding Content

### Article

Create `src/content/articles/my-article/index.md`:

```md
---
title: Article Title
date: 2024-01-15
description: Brief description for SEO.
tags: ["tag1", "tag2"]
---

Content here...
```

Add images to the same folder and reference with `![Alt](img/image.png)`.

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

## Frontmatter Reference

### Articles

| Field         | Type     | Required | Description              |
|:--------------|:---------|:---------|:-------------------------|
| `title`       | string   | Yes      | Article title            |
| `date`        | date     | Yes      | Publication date         |
| `description` | string   | Yes      | SEO description          |
| `tags`        | string[] | No       | Topic tags               |
| `draft`       | boolean  | No       | Hide from production     |
| `featured`    | boolean  | No       | Show on homepage         |

### Projects

| Field         | Type     | Required | Description                         |
|:--------------|:---------|:---------|:------------------------------------|
| `title`       | string   | Yes      | Project name                        |
| `date`        | date     | Yes      | Start date                          |
| `description` | string   | Yes      | Brief description                   |
| `website`     | string   | No       | Live URL                            |
| `github`      | string   | No       | Repository URL                      |
| `tags`        | string[] | No       | Technologies                        |
| `draft`       | boolean  | No       | Hide from production                |
| `status`      | enum     | No       | `active`, `completed`, `archived`   |
| `featured`    | boolean  | No       | Show on homepage                    |

## Features

### UI/UX
- **Fixed header**: Always visible navigation bar on all devices
- **Dark/Light mode**: System detection with manual toggle, persists across page navigations
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
- Image optimization (compile mode for dev, Cloudflare in production)
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

- **Articles**: `Article` schema with headline, description, author, publisher, datePublished, dateModified
- **Other pages**: `WebSite` schema with author `Person` and social `sameAs` links

### Sitemap & Robots

- **Sitemap**: Auto-generated via `@astrojs/sitemap` integration (`/sitemap-index.xml`)
- **robots.txt**: Located at `public/robots.txt` with sitemap reference
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
| Redirects (`/world` → `/projects/...`) | Worker | Paid (minimal) |

**Key points:**
- All prerendered pages are served as static files (free, unlimited)
- Worker is only invoked for redirects and unmatched requests
- No `run_worker_first` = assets served directly without Worker overhead
- File storage is free; only Worker invocations are billed

#### Configuration (`wrangler.jsonc`)

```jsonc
{
  "main": "@astrojs/cloudflare/entrypoints/server",
  "assets": {
    "directory": "./dist",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page"  // Serves nearest 404.html
  }
}
```

#### Astro 6 / Cloudflare Notes

- Astro 6 requires Node `22.12.0+`
- The Cloudflare adapter now uses the unified Worker entrypoint `@astrojs/cloudflare/entrypoints/server`
- `npm run dev` runs against Cloudflare's local runtime, so development behavior is closer to production than in older Astro versions
- Tailwind is wired through the `@tailwindcss/vite` plugin in `astro.config.mjs`; this project no longer uses the deprecated `@astrojs/tailwind` integration

### Static Asset Headers (`public/_headers`)

Custom headers for Cloudflare Workers Static Assets:

- **Fingerprinted assets** (`/_astro/*`): `Cache-Control: public, max-age=31536000, immutable` (1 year)
- **Images & static files**: `Cache-Control: public, max-age=36000` (10 hours)
- **Security headers** (all HTML pages):
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **Preview protection**: `X-Robots-Tag: noindex` for workers.dev URLs

> **Note**: All pages are prerendered (no SSR), so security headers are applied via `_headers` file, not middleware. For additional headers, use Cloudflare [Transform Rules](https://developers.cloudflare.com/rules/transform/).

### Robots & Indexing

- **Default**: All pages have `<meta name="robots" content="index, follow, max-image-preview:large">` for full search engine indexing
- **noIndex option**: Pages with `noIndex: true` prop get `noindex, nofollow`
- **Preview URLs**: workers.dev URLs have `X-Robots-Tag: noindex` header

### Early Hints

Enable in Cloudflare Dashboard: **Speed > Optimization > Content Optimization > Early Hints**. Cloudflare automatically caches and sends 103 Early Hints based on Link headers.

* * * *

## Disclaimer

All trademarks, logos and brand names are the property of their respective owners. All company, product and service names used in this website are for identification and/or educational purposes only. Use of these names, trademarks and brands does not imply endorsement. 📚
