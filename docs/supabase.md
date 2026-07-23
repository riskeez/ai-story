# Supabase — schema and calls

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PUBLIC_SUPABASE_URL` | Supabase project URL |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key (`sb_publishable_…`) |

Both keys are safe to expose in the browser: data access is restricted by RLS
policies. They are declared and validated via `astro:env` (schema in
[`astro.config.mjs`](../astro.config.mjs)) and imported from `astro:env/client`.
Set them in `.env` locally and, on Vercel, under
**Project → Settings → Environment Variables**.

## Authentication

- Provider: Google OAuth (dashboard **Authentication → Providers → Google**).
- Client — `@supabase/ssr` (`createBrowserClient`); the session is stored in
  cookies.
- Flow: `signInWithOAuth` → Google → redirect to `/auth/callback?next=…` → the
  client exchanges the code for a session (`detectSessionInUrl`) and returns to `next`.
- Allowed redirects (**Authentication → URL Configuration**):
  `http://localhost:4321/**`, `https://silver-rabbit.vercel.app/**`.
- Add a provider: enable it in the dashboard + one line in `PROVIDERS`
  ([`src/lib/auth.ts`](../src/lib/auth.ts)).

## Table `story_ratings`

One rating (1–5) per user and story; editable.

| Column | Type | Note |
| --- | --- | --- |
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `story_slug` | `text` | story id (the `.md` file name) |
| `user_id` | `uuid` | FK → `auth.users(id)`, cascade delete |
| `score` | `smallint` | `check (score between 1 and 5)` |
| `created_at` | `timestamptz` | `now()` |
| `updated_at` | `timestamptz` | `now()`, updated by a trigger |

`unique (story_slug, user_id)` — the basis for `upsert` with `onConflict`.

### RLS (enabled)

| Policy | Operation | Condition |
| --- | --- | --- |
| read own rating | select | `auth.uid() = user_id` |
| insert own rating | insert | `auth.uid() = user_id` |
| update own rating | update | `auth.uid() = user_id` |
| delete own rating | delete | `auth.uid() = user_id` |

A user can see and change only their own rows. Other users' ratings are not
reachable through the API.

## Aggregates table `story_rating_stats`

Public per-story aggregates — average score and vote count only, without any
individual user rows.

| Column | Type | Note |
| --- | --- | --- |
| `story_slug` | `text` | PK |
| `avg_score` | `numeric(3,2)` | average score |
| `votes` | `int` | number of votes |

RLS is enabled with policy `stats are public` (select for `anon` and
`authenticated`). The table is recomputed by trigger `trg_refresh_stats` on
`story_ratings` (after insert/update/delete). This makes aggregates available to
anonymous visitors without loosening RLS on the ratings themselves (there used to
be a `SECURITY DEFINER` view here — it was replaced to silence a linter warning).

## Calls from the app

Client — `supabase` from [`src/lib/supabase.ts`](../src/lib/supabase.ts).

**Average score of a story** — splash screen ([`StoryRating.astro`](../src/components/StoryRating.astro)):

```ts
supabase.from("story_rating_stats")
  .select("avg_score, votes")
  .eq("story_slug", slug)
  .maybeSingle();
```

**All aggregates for the gallery** — cards ([`index.astro`](../src/pages/index.astro)):

```ts
supabase.from("story_rating_stats").select("story_slug, avg_score, votes");
```

**The user's own rating** (requires sign-in):

```ts
supabase.from("story_ratings")
  .select("score")
  .eq("story_slug", slug)
  .maybeSingle();
```

**Set / change a rating**:

```ts
supabase.from("story_ratings").upsert(
  { story_slug, user_id, score },
  { onConflict: "story_slug,user_id" }
);
```

**Authentication**:

```ts
supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
supabase.auth.signOut();
supabase.auth.getUser();
supabase.auth.onAuthStateChange((event, session) => { /* … */ });
```

## DDL (recreate the schema)

```sql
create table if not exists public.story_ratings (
  id uuid primary key default gen_random_uuid(),
  story_slug text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  score smallint not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_slug, user_id)
);

alter table public.story_ratings enable row level security;

create policy "read own rating"   on public.story_ratings
  for select to authenticated using (auth.uid() = user_id);
create policy "insert own rating" on public.story_ratings
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update own rating" on public.story_ratings
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own rating" on public.story_ratings
  for delete to authenticated using (auth.uid() = user_id);

-- aggregates (public), recomputed by a trigger
create table if not exists public.story_rating_stats (
  story_slug text primary key,
  avg_score numeric(3,2) not null default 0,
  votes int not null default 0
);

alter table public.story_rating_stats enable row level security;

create policy "stats are public" on public.story_rating_stats
  for select to anon, authenticated using (true);

grant select on public.story_rating_stats to anon, authenticated;

create or replace function public.refresh_story_rating_stats()
returns trigger language plpgsql security definer set search_path = '' as $$
declare s text := coalesce(new.story_slug, old.story_slug);
begin
  insert into public.story_rating_stats (story_slug, avg_score, votes)
  select s, coalesce(round(avg(score)::numeric, 2), 0), count(*)
  from public.story_ratings where story_slug = s
  on conflict (story_slug) do update
    set avg_score = excluded.avg_score, votes = excluded.votes;
  return null;
end;
$$;

create trigger trg_refresh_stats
  after insert or update or delete on public.story_ratings
  for each row execute function public.refresh_story_rating_stats();

-- updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_touch_ratings before update on public.story_ratings
  for each row execute function public.touch_updated_at();
```
