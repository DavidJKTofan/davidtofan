// @ts-check
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import rehypeExternalLinks from 'rehype-external-links';
import { unified } from '@astrojs/markdown-remark';
import { buildSitemapLastmodMap, noIndexRoutes } from './src/lib/contentMetadata.js';

/**
 * Feature flag: geolocation-based personalization.
 * ---------------------------------------------------------------------------
 * Declared as a Workers variable in `wrangler.jsonc` under `vars`, so it is a
 * real environment variable you can see and edit in the Cloudflare dashboard.
 * It is read HERE, at build time, because the thing it controls —
 * `export const prerender` on `src/pages/index.astro` — is resolved when the
 * site is built, not when a request arrives. A runtime `env.X` lookup inside
 * the Worker could never turn `/` back into a static file.
 *
 * TRUE  -> `/` is rendered on demand. It reads `request.cf`, detects the
 *          visitor's country and language, and offers a language switch.
 *          Costs one Worker invocation per homepage view.
 * other -> `/` is prerendered to a static file. Zero Worker invocations, and
 *          the deploy goes back to being assets-only. The localized routes,
 *          the language picker and the hreflang graph all remain: they are
 *          static files and cost nothing.
 *
 * `process.env` wins over the wrangler value so a build can be checked both
 * ways without editing committed config:
 *   GEO_PERSONALIZATION=FALSE npm run build
 */
function readWranglerVar(name) {
  const override = process.env[name];
  if (override !== undefined) return override;

  const raw = readFileSync(new URL('./wrangler.jsonc', import.meta.url), 'utf8');
  return JSON.parse(stripJsonComments(raw))?.vars?.[name];
}

/**
 * Strip // and /* *\/ comments from JSONC while respecting string literals, so
 * a `//` inside a URL in a comment — or inside a real value — is not mangled.
 */
function stripJsonComments(input) {
  let out = '';
  let inString = false;
  let inLine = false;
  let inBlock = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const next = input[i + 1];

    if (inLine) {
      if (char === '\n') { inLine = false; out += char; }
      continue;
    }
    if (inBlock) {
      if (char === '*' && next === '/') { inBlock = false; i++; }
      continue;
    }
    if (inString) {
      out += char;
      if (char === '\\') { out += next; i++; continue; }
      if (char === '"') inString = false;
      continue;
    }
    if (char === '"') { inString = true; out += char; continue; }
    if (char === '/' && next === '/') { inLine = true; i++; continue; }
    if (char === '/' && next === '*') { inBlock = true; i++; continue; }
    out += char;
  }
  return out;
}

const GEO_PERSONALIZATION = String(readWranglerVar('GEO_PERSONALIZATION')).toUpperCase() === 'TRUE';

/**
 * The two settings must move together, so a mismatch fails the build loudly
 * instead of shipping a homepage that 404s only in a browser.
 *
 * `run_worker_first` is the documented opt-out of asset-first routing, so it
 * stays commented out while the site is assets-only — the config should
 * describe what actually deploys. But with `/` on-demand it is mandatory:
 * without it, navigation requests are served `404.html` before the Worker runs
 * (curl still succeeds, which is what makes the bug so easy to miss).
 *
 * Wrangler enforces the other direction itself, rejecting `run_worker_first`
 * when no Worker script exists, so only this case needs checking here.
 */
function assertRunWorkerFirstMatchesFlag() {
  if (!GEO_PERSONALIZATION) return;

  const assets = JSON.parse(stripJsonComments(readFileSync(new URL('./wrangler.jsonc', import.meta.url), 'utf8')))?.assets;
  if (assets?.run_worker_first?.includes('/')) return;

  throw new Error(
    'GEO_PERSONALIZATION is enabled, but assets.run_worker_first is not set to ["/"] in wrangler.jsonc.\n\n' +
      '  With `/` rendered on demand there is no index.html for it, and navigation requests\n' +
      '  (Sec-Fetch-Mode: navigate) are served 404.html before the Worker runs. The homepage\n' +
      '  would 404 on a hard refresh while curl still returned 200.\n\n' +
      '  Fix: uncomment this line in wrangler.jsonc, inside "assets":\n\n' +
      '      "run_worker_first": ["/"]\n\n' +
      '  Remember the comma on the preceding "not_found_handling" line.\n' +
      '  To go back to the free assets-only deploy instead, set GEO_PERSONALIZATION to "FALSE".',
  );
}

assertRunWorkerFirstMatchesFlag();

console.log(
  `[geo] personalization ${GEO_PERSONALIZATION ? 'ENABLED  — / renders on demand (billed Worker invocations)' : 'DISABLED — / is prerendered (no Worker invocations)'}`,
);

/**
 * Rehype plugin: wrap every Markdown table in a horizontally scrollable region.
 *
 * Several articles have tables wider than a phone's reading column. Without a
 * wrapper they either get clipped by the page's overflow clip or push the
 * mobile layout viewport wider than the screen. The wrapper scrolls on its
 * own instead, and is a focusable, named region so keyboard users can scroll
 * it (styled by .table-scroll in src/styles/global.css). Tables keep their
 * native table semantics — only the wrapper changes, never the <table>.
 *
 * Written against the hast tree directly so it needs no extra dependency.
 */
function rehypeScrollableTables() {
  const wrapTables = (node) => {
    if (!Array.isArray(node.children)) return;
    node.children = node.children.map((child) => {
      if (child.type === 'element' && child.tagName === 'table') {
        return {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-scroll'], tabIndex: 0, role: 'region', ariaLabel: 'Table' },
          children: [child],
        };
      }
      wrapTables(child);
      return child;
    });
  };
  return (tree) => wrapTables(tree);
}

const siteUrl = 'https://davidtofan.com';
const sitemapLastmodMap = await buildSitemapLastmodMap(siteUrl);

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  // Trailing slashes: every page is built as <route>/index.html, and Workers
  // Static Assets (html_handling: 'auto-trailing-slash') answers the slash-less
  // form with a 307. Internal links and redirect targets therefore always carry
  // the trailing slash; scripts/update-deps.sh checks the build for any that
  // don't.
  //
  // `trailingSlash` itself is deliberately left at its default ('ignore').
  // With 'always', the Cloudflare adapter writes only slashed redirect sources
  // to _redirects (`/world/`, `/sitemap.xml/`), so the bare `/world` and
  // `/sitemap.xml` that people and crawlers actually request would 404.
  // Language layer. Regional *styling* deliberately does NOT live in the URL —
  // it is an <html data-region> attribute, so Madrid and Mexico City share the
  // /es/ routes but not the palette. See src/i18n/regions.ts.
  //
  // `fallback` is intentionally unset: with fallbackType 'rewrite' it would
  // generate a localized copy of every article and project route in all seven
  // locales. The localized surface is the five landing routes, by design.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'de', 'it', 'zh'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // Prefetch every same-origin link on hover/focus. This is what <ClientRouter />
  // enables by default; `prefetchAll: false` (the previous value) turned it off
  // entirely, because no link carries `data-astro-prefetch`. Astro skips external
  // links and falls back to `tap` under Save-Data or slow connections. Every
  // page is a free static asset, so prefetches cost nothing.
  // https://docs.astro.build/en/guides/prefetch/#using-with-view-transitions
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  // Redirects for content aliases (Hugo compatibility). Destinations carry the
  // trailing slash so each alias is a single 301, not a 301 followed by the
  // platform's 307 to the slashed URL.
  redirects: {
    // Projects aliases
    '/world': '/projects/world-of-opportunities/',
    '/travel': '/projects/google-travel-lists/',
    '/webinars': '/projects/webinars/',
    '/referrals': '/projects/referrals/',
    '/promotions': '/projects/referrals/',
    '/perks': '/projects/referrals/',
    // Sitemap redirect (Astro generates sitemap-index.xml, but crawlers may look for sitemap.xml)
    '/sitemap.xml': '/sitemap-index.xml',
  },
  adapter: cloudflare({
    // Build-time 'compile' (sharp) is broken for this prerendered site, so
    // optimization is offloaded to Cloudflare's edge. This emits
    // /cdn-cgi/image/onerror=redirect,.../_astro/* URLs handled at the edge (no
    // Worker invocation). If Image Transformations are enabled on the zone, images
    // are optimized; if not, onerror=redirect transparently serves the original.
    imageService: 'cloudflare',
  }),
  integrations: [
    /**
     * Flips `/` between prerendered and on-demand.
     *
     * `astro:route:setup` runs immediately after Astro parses the `prerender`
     * export and can override it, which is the only supported way to make this
     * decision dynamic — the export itself must be a literal `true`/`false`,
     * because Astro reads it with a regex over the raw file.
     */
    {
      name: 'geo-personalization-flag',
      hooks: {
        'astro:route:setup': ({ route }) => {
          if (route.component === 'src/pages/index.astro') {
            route.prerender = !GEO_PERSONALIZATION;
          }
        },
      },
    },
    sitemap({
      // Emits xhtml:link hreflang alternates for the localized routes. These
      // values MUST match HTML_LANG in src/i18n/utils.ts, which drives <html lang>
      // and the <link rel="alternate" hreflang> graph in BaseLayout — Google
      // treats sitemap and HTML hreflang as equivalent signals, so the two must
      // not disagree (this previously said en-US while the HTML said en).
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', es: 'es', de: 'de', it: 'it', zh: 'zh-Hans' },
      },
      // Legal pages are served with `noindex, nofollow` (meta tag + X-Robots-Tag),
      // so listing them here would tell crawlers to index what the page itself
      // forbids. Keep the sitemap and the robots directives in agreement.
      filter: (page) => !noIndexRoutes.has(new URL(page).pathname),
      // Default change frequency for all pages
      changefreq: ChangeFreqEnum.MONTHLY,
      // Default priority
      priority: 0.7,
      // Customize individual pages
      serialize(item) {
        const itemUrl = item.url.toString();
        const lastmod = sitemapLastmodMap.get(itemUrl);
        if (lastmod) {
          item.lastmod = lastmod;
        }

        // Higher priority for main pages
        if (itemUrl === `${siteUrl}/`) {
          item.changefreq = ChangeFreqEnum.YEARLY;
          item.priority = 1.0;
        }
        // Articles section
        if (itemUrl.includes('/articles/') && itemUrl !== `${siteUrl}/articles/`) {
          item.changefreq = ChangeFreqEnum.MONTHLY;
          item.priority = 0.8;
        }
        // Projects section
        if (itemUrl.includes('/projects/') && itemUrl !== `${siteUrl}/projects/`) {
          item.changefreq = ChangeFreqEnum.YEARLY;
          item.priority = 0.6;
        }
        // Index pages
        if (itemUrl === `${siteUrl}/articles/` || 
            itemUrl === `${siteUrl}/projects/` ||
            itemUrl === `${siteUrl}/certificates/`) {
          item.changefreq = ChangeFreqEnum.YEARLY;
          item.priority = 0.9;
        }
        return item;
      },
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: true,
    },
    // Astro 7 renders Markdown with Sätteri by default. This site stays on the
    // unified() pipeline (via @astrojs/markdown-remark, which Astro 7 no longer
    // bundles) because it relies on the rehype-external-links plugin. gfm and
    // smartypants are set explicitly to preserve Astro's previous defaults.
    processor: unified({
      gfm: true,
      smartypants: true,
      rehypePlugins: [
        [
          rehypeExternalLinks,
          {
            target: '_blank',
            rel: ['nofollow', 'noopener', 'external'],
          },
        ],
        rehypeScrollableTables,
      ],
    }),
  },
  // Optimize for Core Web Vitals
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    plugins: [tailwindcss()],
    define: {
      // Substituted as a literal, so `export const prerender = !__GEO_PERSONALIZATION__`
      // is statically analyzable and the unused branch is dropped from the bundle.
      __GEO_PERSONALIZATION__: JSON.stringify(GEO_PERSONALIZATION),
    },
  },
});
