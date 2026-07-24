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

Ratings are read from Supabase **at build time** and baked into the HTML, then
refreshed in the background on the client to pick up votes cast since the last
deploy. Sign-in state is resolved on the client. The pages stay cacheable as
static output, and the displayed ratings never depend on a request finishing
after load.

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
│  ├─ ratings.ts          public rating aggregates via PostgREST fetch (no supabase-js)
│  └─ supabase.ts         browser Supabase client (loaded lazily)
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
  `<script>` per component. Rating values are pre-rendered at build time and only
  refreshed here; the Supabase client is loaded lazily for sign-in and for
  submitting a vote.

## Auth and ratings

**Ratings are read at build time.** Public aggregates (`story_rating_stats`) are
fetched during the build and rendered into the static HTML, so the gallery badges
and the story summary are present on first paint. A background refresh on the
client then updates them with any votes cast since the last deploy. This was a
deliberate move away from a client-only fetch: the displayed values no longer
depend on a request completing after load — nothing on the critical path, no
layout shift — while liveness is kept by the refresh. Reads use a plain `fetch()`
to PostgREST ([`src/lib/ratings.ts`](../src/lib/ratings.ts)), so the display path
never loads `supabase-js`.

The full Supabase client ([`src/lib/supabase.ts`](../src/lib/supabase.ts)) is
loaded lazily and only when actually needed — signing in/out and submitting a
vote — and only for visitors who already have a session. Sign-in actions and the
provider menu live in [`src/lib/auth.ts`](../src/lib/auth.ts). The database schema,
RLS policies, OAuth flow, and every query are documented in
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
