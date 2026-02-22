import type { SiteConfig, NavItem } from '../types';

export const siteConfig: SiteConfig = {
  name: 'David Tofan',
  title: 'David Tofan - Solutions Engineer & Digital Consultant',
  description:
    'Personal website of David Tofan, Solutions Engineer at Cloudflare. Passionate about Cloud, Data Science, and Cybersecurity.',
  url: 'https://davidtofan.com',
  author: {
    name: 'David Tofan',
    email: 'hello@davidtofan.com',
    twitter: '@davidjktofan',
    github: 'DavidJKTofan',
    linkedin: 'davidtofan',
  },
  ogImage: '/og-image.png',
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
    href: 'https://linkedin.com/in/davidtofan',
    icon: 'linkedin',
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com/davidjktofan',
    icon: 'twitter',
  },
];
