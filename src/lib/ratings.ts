import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_PUBLISHABLE_KEY,
} from "astro:env/client";

export interface RatingStat {
  story_slug: string;
  avg_score: number;
  votes: number;
}

// Публичные агрегаты читаем прямым запросом к PostgREST — без тяжёлого
// supabase-js. RLS-политика "stats are public" открывает select для anon.
async function restGet(query: string): Promise<RatingStat[]> {
  const res = await fetch(
    `${PUBLIC_SUPABASE_URL}/rest/v1/story_rating_stats?${query}`,
    {
      headers: {
        apikey: PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
      },
    }
  );
  if (!res.ok) return [];
  const rows = (await res.json()) as Record<string, unknown>[];
  return rows.map((r) => ({
    story_slug: String(r.story_slug),
    avg_score: Number(r.avg_score), // numeric отдаётся строкой
    votes: Number(r.votes),
  }));
}

export function fetchAllStats(): Promise<RatingStat[]> {
  return restGet("select=story_slug,avg_score,votes");
}

export async function fetchStats(slug: string): Promise<RatingStat | null> {
  const rows = await restGet(
    `select=story_slug,avg_score,votes&story_slug=eq.${encodeURIComponent(slug)}`
  );
  return rows[0] ?? null;
}
