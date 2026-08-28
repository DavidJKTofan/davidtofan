// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import rehypeExternalLinks from 'rehype-external-links';
import { unified } from '@astrojs/markdown-remark';
import { buildSitemapLastmodMap, noIndexRoutes } from './src/lib/contentMetadata.js';

const siteUrl = 'https://davidtofan.com';
const sitemapLastmodMap = await buildSitemapLastmodMap(siteUrl);

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  // Prefetch configuration for View Transitions
  // Links are prefetched on hover/focus for faster navigation
  prefetch: {
    prefetchAll: false, // Only prefetch links with data-astro-prefetch or on hover
    defaultStrategy: 'hover', // Prefetch on hover (good balance of speed vs bandwidth)
  },
  // Redirects for content aliases (Hugo compatibility)
  redirects: {
    // Projects aliases
    '/world': '/projects/world-of-opportunities',
    '/travel': '/projects/google-travel-lists',
    '/webinars': '/projects/webinars',
    '/referrals': '/projects/referrals',
    '/promotions': '/projects/referrals',
    '/perks': '/projects/referrals',
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
    sitemap({
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
  },
});
