# David Tofan - Personal Website

Personal website built with [Astro](https://astro.build) and deployed on [Cloudflare Workers](https://workers.cloudflare.com).

## Tech Stack

- **Framework**: [Astro 5](https://astro.build) with TypeScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com) with Typography plugin
- **Deployment**: [Cloudflare Workers](https://workers.cloudflare.com)
- **Content**: Markdown with Zod validation (Content Collections)
- **Fonts**: System font stack (no external CDN dependencies)

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
npm run preview  # Build + run with Wrangler locally
npm run deploy   # Build + deploy to Cloudflare Workers
```

### Development Workflow

1. **Local development** (fast refresh, no Workers):
   ```bash
   npm run dev
   ```

2. **Test with Workers locally** (full production simulation):
   ```bash
   npm run preview
   ```

3. **Deploy to production**:
   ```bash
   npm run deploy
   ```

> **Note**: `npm run build` automatically runs `wrangler types` first to ensure TypeScript types are up-to-date with your `wrangler.jsonc` configuration.

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
| `status`      | enum     | No       | `active`, `completed`, `archived`   |
| `featured`    | boolean  | No       | Show on homepage                    |

## Features

- Dark/Light mode with system detection
- Reading progress bar on articles
- Table of contents with scroll highlighting
- Tag filtering on articles
- Responsive mobile-first design
- SEO optimized (Open Graph, Twitter Cards)
- Image optimization (local compile mode for dev, Cloudflare in production)
- Custom 404 page with site branding
- Orange accent borders on article images

## License

MIT
