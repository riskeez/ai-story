import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Каждый рассказ — src/content/stories/<slug>.md (id = <slug>).
const stories = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/stories" }),
  schema: z.object({
    number: z.number(),
    world: z.string(),
    title: z.string(),
    author: z.string().optional(),
    date: z.object({ iso: z.string(), label: z.string() }),
    minutes: z.number().optional(),
    hero: z.string(),
    thumb: z.string().optional(),
    excerpt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    status: z.string().default(""),

    theme: z
      .object({
        mode: z.string().default("night"),
        treatment: z.string().optional(),
        accent: z.string().optional(),
        bg: z.string().optional(),
      })
      .default({}),
    description: z.string().optional(),
    ogDescription: z.string().optional(),

    heroCredit: z.object({ text: z.string(), href: z.string() }).optional(),
    music: z.object({ src: z.string(), label: z.string().optional() }).optional(),
    decor: z
      .object({ stars: z.boolean().optional(), earthStar: z.string().optional() })
      .optional(),
    intro: z.object({ sub: z.string().optional(), note: z.string().optional() }).optional(),
    emblem: z.string().optional(),
    footer: z
      .object({
        title: z.string().optional(),
        sub: z.string().optional(),
        source: z.object({ label: z.string(), href: z.string() }).optional(),
      })
      .optional(),
    kicker: z.string().optional(),
  }),
});

export const collections = { stories };
