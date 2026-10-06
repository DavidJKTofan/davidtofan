import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// Article topics: the "Filter by topic" buttons on /articles/. A closed list so
// the filter stays short; the build fails on any other tag. Reuse one before
// adding a topic, and add one only when several articles would share it.
const ARTICLE_TOPICS = [
  'application security',
  'artificial intelligence',
  'cloudflare',
  'developers',
  'email security',
  'observability',
  'opportunities',
  'performance',
  'privacy',
  'travel & hospitality',
  'zero trust',
] as const;

// Articles collection schema
// Supports Hugo-style frontmatter with optional 'type' field
const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    // Optional last-modified date; fed to <meta article:modified_time> and
    // BlogPosting.dateModified. When absent, `date` is used as the fallback.
    modified: z.coerce.date().optional(),
    // Most specific topic first, `cloudflare` last: cards show the first three
    // tags and the article header the first four.
    tags: z.array(z.enum(ARTICLE_TOPICS)).default([]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    // Override computed reading time (used when the body is a stub and the full
    // article lives in a custom .astro page)
    readingTime: z.number().int().positive().optional(),
    // Hugo compatibility fields (optional)
    type: z.string().optional(),
    showTableOfContents: z.boolean().optional(),
  }),
});

// Projects collection schema
const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    // Optional last-modified date (see articles schema above).
    modified: z.coerce.date().optional(),
    // Allow empty string or valid URL (Hugo compatibility)
    website: z.string().optional().transform(val => val === '' ? undefined : val),
    github: z.string().optional().transform(val => val === '' ? undefined : val),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    status: z.enum(['active', 'completed', 'archived']).default('active'),
    // Hugo compatibility fields (optional)
    showTableOfContents: z.boolean().optional(),
    aliases: z.array(z.string()).optional(),
  }),
});

export const collections = {
  articles,
  projects,
};
