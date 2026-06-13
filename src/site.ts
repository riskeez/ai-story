// Метаданные коллекции (прежний src/collection.json).
export const collection = {
  kicker: "Антология · AI миры",
  title: "ИИ-стории",
  tagline:
    "Все миры вымышлены, а любые совпадения с реальными людьми и событиями — случайны.",
  source: {
    label: "https://riskeez.github.io/ai-story/",
    href: "https://riskeez.github.io/ai-story/",
  },
};

// Полный URL ассета рассказа: пути в frontmatter — относительно папки рассказа,
// сами файлы лежат в public/stories/<slug>/…  (база сайта учитывается).
export function storyAsset(slug: string, rel: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/stories/${slug}/${rel}`;
}

// Ссылка на витрину / страницу рассказа с учётом base.
export function url(path = ""): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/${path}`.replace(/\/{2,}/g, "/").replace(":/", "://");
}
