# Architecture

"Silver Rabbit / AI Stories" is an anthology of short stories built with **Astro**.
The content is static; interactivity lives in small client-side islands, and
authentication and ratings run through Supabase.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Astro (`output: "static"`, `@astrojs/vercel` adapter) |
| Content | Content Collections + MDX (`@astrojs/mdx`) |
| Data / auth | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) |
| Hosting | Vercel |
| Package manager | pnpm |

## Rendering model

**Fully static** (`output: "static"`): every page is compiled to HTML at build
time and served from Vercel's CDN — no serverless functions are deployed.

Dynamic data arrives **on the client**: ratings and sign-in state are fetched from
Supabase after the page loads, which lets the HTML be cached as static output.

`build.format: "directory"` produces trailing-slash URLs (`/stories/<slug>/`).

## Directory layout

```
src/
├─ pages/                 routes (all static)
│  ├─ index.astro         gallery: card grid + tag filter
│  ├─ stories/[...slug].astro   story page (getStaticPaths over the collection)
│  └─ auth/callback.astro OAuth redirect: exchanges the code for a session
├─ layouts/
│  └─ BaseLayout.astro    <html>/<head>/<body> shell; "head" slot, htmlAttrs
├─ components/
│  ├─ StoryCard.astro     story card on the gallery
│  ├─ StoryRating.astro   ★ rating island (story splash screen)
│  ├─ AccountButton.astro sign-in / profile island
│  └─ Emblem.astro        SVG emblem
├─ content/               stories (*.md) + content.config.ts (Zod schema)
├─ lib/                   all non-UI logic
│  ├─ site.ts             collection metadata + url()/storyAsset() helpers
│  ├─ plural.ts           Russian number pluralization
│  ├─ auth.ts             providers, signInWith/signOut, login menu
│  └─ supabase.ts         browser Supabase client
├─ scripts/               client entry scripts (loaded via <script src>)
│  ├─ gallery.ts          gallery filter + sticky toolbar
│  └─ reader.ts           theme, font size, starfield, music, splash screen
├─ styles/                gallery.css · reader.css · auth.css
└─ assets/                static assets processed by the build
```

Astro-required files at the `src/` root: `content.config.ts` (collection schema)
and `env.d.ts` (ambient types).

## Content

Each story is `src/content/stories/<slug>.md`; the collection `id` equals the file
name, which equals the `slug`. The frontmatter schema lives in
[`src/content.config.ts`](../src/content.config.ts) and is validated with Zod:
`number`, `world`, `title`, `date`, and `hero` are required; everything else
(theme, music, decor, emblem, footer, …) is optional.

Story assets live in `public/stories/<slug>/…`; frontmatter paths are relative to
that folder, and `storyAsset()` in `lib/site.ts` builds the full URL (accounting
for `BASE_URL`).

## Client islands

Markup is rendered on the server; JavaScript only "hydrates" the existing DOM:

- **Gallery** (`scripts/gallery.ts`) — tag filter via event delegation over
  server-rendered `data-tags`; sticky-filter background via `IntersectionObserver`.
- **Reader** (`scripts/reader.ts`) — theme (persisted in `localStorage`), font size,
  starfield generation, background music, splash screen, reveal animation.
- **Rating** (`StoryRating.astro`) and **account** (`AccountButton.astro`) — inline
  `<script>` inside the component, talking to Supabase from the client.

## Auth and ratings

Entirely client-side through Supabase. The client is `supabase` from
[`src/lib/supabase.ts`](../src/lib/supabase.ts); sign-in actions and
the provider menu live in [`src/lib/auth.ts`](../src/lib/auth.ts). The database
schema, RLS policies, OAuth flow, and every query are documented in
[`supabase.md`](./supabase.md).

Key design point: private ratings (`story_ratings`, RLS scoped to the owning user)
and public aggregates (`story_rating_stats`) are split into separate tables — an
anonymous visitor sees the average score without ever gaining access to other
users' rows.

## Styling

Plain CSS, no preprocessor, one file per area: `gallery.css`, `reader.css`,
`auth.css`. Design tokens are CSS custom properties in `:root` (`--accent`, fonts,
`oklch` palette). A story's look is switched via attributes on `<html>`
(`data-theme` / `data-accent` / `data-bg` / `data-treatment`) set from frontmatter
in `stories/[...slug].astro`. `inlineStylesheets: "always"` inlines CSS into the
HTML to avoid an extra request.

## Environment variables

Declared and validated through **`astro:env`** — the schema lives in
[`astro.config.mjs`](../astro.config.mjs) and generates types automatically, so
`env.d.ts` needs no manual entries. Both variables are public and safe for the
browser (access is restricted by RLS policies):

| Variable | Purpose |
| --- | --- |
| `PUBLIC_SUPABASE_URL` | Supabase project URL |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key (`sb_publishable_…`) |

They are imported from `astro:env/client` (see `lib/supabase.ts`). Values go
in `.env` locally and in Vercel **Project → Settings → Environment Variables**; a
template is in `.env.example`.
