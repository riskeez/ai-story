// @ts-check
import { defineConfig, envField } from "astro/config";
import mdx from "@astrojs/mdx";
import vercel from "@astrojs/vercel";

// Деплой — Vercel. Сайт полностью статичен (SSR не используется).
export default defineConfig({
  site: "https://silver-rabbit.vercel.app",
  output: "static",
  adapter: vercel(),
  integrations: [mdx()],
  // Типизированные и валидируемые переменные окружения (astro:env).
  env: {
    schema: {
      PUBLIC_SUPABASE_URL: envField.string({ context: "client", access: "public" }),
      PUBLIC_SUPABASE_PUBLISHABLE_KEY: envField.string({ context: "client", access: "public" }),
    },
  },
  build: {
    inlineStylesheets: "always",
    // /stories/<slug>/index.html — сохраняем URL со слешем на конце
    format: "directory",
  },
});
