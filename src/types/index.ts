export interface SiteConfig {
  name: string;
  title: string;
  description: string;
  url: string;
  author: {
    name: string;
    // email: string;
    twitter: string;
    github: string;
    linkedin: string;
  };
  ogImage: string;
  locale: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

export interface TOCHeading {
  depth: number;
  slug: string;
  text: string;
}

export interface Certificate {
  name: string;
  organization: string;
  link: string;
  icon?: string;
  date: string;
  category?: string;
}
