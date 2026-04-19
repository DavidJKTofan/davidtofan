// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import { EnumChangefreq } from 'sitemap';
import tailwindcss from '@tailwindcss/vite';
import rehypeExternalLinks from 'rehype-external-links';
import { buildSitemapLastmodMap } from './src/lib/contentMetadata.js';

const siteUrl = 'https://davidtofan.com';
const sitemapLastmodMap = await buildSitemapLastmodMap(siteUrl);
const cloudflareAdapterOptions = /** @type {import('@astrojs/cloudflare').Options & { platformProxy?: { enabled: boolean } }} */ ({
  platformProxy: {
    enabled: true,
  },
  // Use 'compile' for local dev compatibility (sharp at build time)
  // Images are optimized at build, works both locally and in production
  imageService: 'compile',
});

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
  adapter: cloudflare(cloudflareAdapterOptions),
  integrations: [
    sitemap({
      // Default change frequency for all pages
      changefreq: EnumChangefreq.MONTHLY,
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
          item.changefreq = EnumChangefreq.YEARLY;
          item.priority = 1.0;
        }
        // Articles section
        if (itemUrl.includes('/articles/') && itemUrl !== `${siteUrl}/articles/`) {
          item.changefreq = EnumChangefreq.MONTHLY;
          item.priority = 0.8;
        }
        // Projects section
        if (itemUrl.includes('/projects/') && itemUrl !== `${siteUrl}/projects/`) {
          item.changefreq = EnumChangefreq.YEARLY;
          item.priority = 0.6;
        }
        // Index pages
        if (itemUrl === `${siteUrl}/articles/` || 
            itemUrl === `${siteUrl}/projects/` ||
            itemUrl === `${siteUrl}/certificates/`) {
          item.changefreq = EnumChangefreq.YEARLY;
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
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: '_blank',
          rel: ['nofollow', 'noopener', 'external'],
        },
      ],
    ],
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
