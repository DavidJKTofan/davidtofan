// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import rehypeExternalLinks from 'rehype-external-links';

// https://astro.build/config
export default defineConfig({
  site: 'https://davidtofan.com',
  // Redirects for content aliases (Hugo compatibility)
  redirects: {
    // Projects aliases
    '/world': '/projects/world-of-opportunities',
    '/travel': '/projects/google-travel-lists',
    '/webinars': '/projects/webinars',
    '/referrals': '/projects/referrals',
    '/promotions': '/projects/referrals',
    '/perks': '/projects/referrals',
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
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap(),
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
    build: {
      cssMinify: 'lightningcss',
    },
  },
});
