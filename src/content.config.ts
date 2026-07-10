import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const writing = defineCollection({
  loader: glob({ base: './src/content/writing', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    kind: z.enum(['essay', 'note', 'workshop']),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    readingMinutes: z.number().int().positive(),
    externalUrl: z.url().optional(),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    year: z.number().int(),
    status: z.enum(['active', 'released', 'research', 'archive']),
    tags: z.array(z.string()).default([]),
    githubUrl: z.url().optional(),
    demoUrl: z.url().optional(),
    featured: z.boolean().default(false),
    order: z.number().int().default(99),
  }),
});

export const collections = { writing, projects };
