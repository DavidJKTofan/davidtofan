import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

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
    tags: z.array(z.string()).default([]),
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
