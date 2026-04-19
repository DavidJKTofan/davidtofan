import type { SiteConfig, NavItem } from '../types';

export const aiSearchConfig: NonNullable<SiteConfig['aiSearch']> = {
  enabled: true,
  apiUrl: 'https://3d7010fa-2045-4b76-80b0-afa8d1c1ba76.search.ai.cloudflare.com/',
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
  title: 'David Tofan - Solutions Engineer & Digital Consultant',
  description:
    'Personal website of David Tofan, Solutions Engineer at Cloudflare. Passionate about Cloud, Data Science, and Cybersecurity.',
  url: 'https://davidtofan.com',
  aiSearch: aiSearchConfig,
  author: {
    name: 'David Tofan',
    twitter: '@davidjktofan',
    github: 'DavidJKTofan',
    linkedin: 'davidtofan',
  },
  ogImage: '/website-thumbnail.png',
  locale: 'en-US',
};

export const navigation: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Articles', href: '/articles' },
  { label: 'Projects', href: '/projects' },
  { label: 'Certificates', href: '/certificates' },
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
