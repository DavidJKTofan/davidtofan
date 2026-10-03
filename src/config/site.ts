import type { SiteConfig, NavItem } from '../types';

export const aiSearchConfig: NonNullable<SiteConfig['aiSearch']> = {
  enabled: true,
  // Custom domain: a proxied CNAME to the instance's public endpoint
  // (<id>.search.ai.cloudflare.com), so the zone's WAF and rate limiting apply.
  // The same host serves /mcp, which BaseLayout's agent note advertises.
  apiUrl: 'https://ai-search.davidtofan.com/',
  snippetVersion: 'v0.0.36',
  placeholder: "Search David's articles, projects, certificates, and Cloudflare guides...",
  shortcut: 'k',
  maxResults: 5,
  showUrl: true,
  showDate: true,
  hideBranding: false,
};

export const siteConfig: SiteConfig = {
  name: 'David Tofan',
  title: 'David Tofan - Senior Customer Engineer & Digital Consultant',
  description:
    'Personal website of David Tofan, Senior Customer Engineer at Cloudflare. Passionate about Cloud, Data Science, and Cybersecurity.',
  url: 'https://davidtofan.com',
  aiSearch: aiSearchConfig,
  author: {
    name: 'David Tofan',
    // Contact address published on the legal pages (imprint, disclaimer,
    // AI licensing terms). Not rendered anywhere else on the site.
    email: 'personal.implicit244@passmail.net',
    twitter: '@davidjktofan',
    github: 'DavidJKTofan',
    linkedin: 'davidtofan',
  },
  ogImage: '/website-thumbnail.png',
  locale: 'en-US',
};

export const navigation: NavItem[] = [
  { labelKey: 'nav.home', href: '/' },
  { labelKey: 'nav.articles', href: '/articles' },
  { labelKey: 'nav.projects', href: '/projects' },
  { labelKey: 'nav.certificates', href: '/certificates' },
];

export const socialLinks = [
  {
    name: 'GitHub',
    href: 'https://github.com/DavidJKTofan',
    icon: 'github',
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/davidtofan/',
    icon: 'linkedin',
  },
  {
    name: 'Twitter',
    href: 'https://x.com/davidjktofan',
    icon: 'twitter',
  },
];
