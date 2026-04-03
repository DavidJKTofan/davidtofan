// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import rehypeExternalLinks from 'rehype-external-links';

// https://astro.build/config
export default defineConfig({
  site: 'https://davidtofan.com',
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
    platformProxy: {
      enabled: true,
    },
    // Use 'compile' for local dev compatibility (sharp at build time)
    // Images are optimized at build, works both locally and in production
    imageService: 'compile',
  }),
  integrations: [
    sitemap({
      // Default change frequency for all pages
      changefreq: 'monthly',
      // Default priority
      priority: 0.7,
      // Set lastmod to current build time as baseline
      lastmod: new Date(),
      // Customize individual pages
      serialize(item) {
        // Higher priority for main pages
        if (item.url === 'https://davidtofan.com/') {
          item.changefreq = 'yearly';
          item.priority = 1.0;
        }
        // Articles section
        if (item.url.includes('/articles/') && item.url !== 'https://davidtofan.com/articles/') {
          item.changefreq = 'monthly';
          item.priority = 0.8;
        }
        // Projects section
        if (item.url.includes('/projects/') && item.url !== 'https://davidtofan.com/projects/') {
          item.changefreq = 'yearly';
          item.priority = 0.6;
        }
        // Index pages
        if (item.url === 'https://davidtofan.com/articles/' || 
            item.url === 'https://davidtofan.com/projects/' ||
            item.url === 'https://davidtofan.com/certificates/') {
          item.changefreq = 'yearly';
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
});
