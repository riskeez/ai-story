# ИИ-стории · Антология

Статичная витрина рассказов на [Astro](https://astro.build), деплой на GitHub Pages.
Контент — коллекция `src/content/stories/` (Markdown + frontmatter); страницы
рендерятся на сборке, интерактив — небольшие ванильные острова.

## Локальный запуск
- `pnpm install`
- `pnpm dev` — дев-сервер с hot-reload (`http://localhost:4321/ai-story/`).
- `pnpm build` — продакшн-сборка в `dist/`.
- `pnpm preview` — локальный предпросмотр собранного `dist/`.

## Деплой

GitHub Pages через GitHub Actions (`.github/workflows/deploy.yml` — сборка Astro и
публикация на каждый push в `main`).

- Разовая настройка: **Settings → Pages → Source: GitHub Actions**.
- Дальше деплой автоматический; `dist/` не коммитится.
- Сайт живёт на `/ai-story/` (`base` в `astro.config.mjs`). 

## Добавить рассказ

1. Создайте `src/content/stories/YYYY-MM-DD-slug.md`: frontmatter (см. схему в
   [`src/content.config.ts`](src/content.config.ts)) + текст рассказа в Markdown.
   Заголовок берётся из поля `title`, в теле первый `# H1` не нужен.
2. Ассеты (обложки, музыка) положите в `public/stories/YYYY-MM-DD-slug/assets/…`.
   В frontmatter пути указываются относительно папки рассказа
   (`hero: "assets/img/cover.webp"`).
3. Обложка — WebP; уменьшённая копия для карточки (`thumb`):
   `ffmpeg -i ИСХОДНИК.webp -vf scale=760:-2 -c:v libwebp -quality 65 -compression_level 6 НАЗВАНИЕ-thumb.webp`.
4. `pnpm build` для проверки → `git push` (Actions опубликует).
