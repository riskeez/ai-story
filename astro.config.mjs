// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

// Деплой — GitHub Pages, проектная страница: https://riskeez.github.io/ai-story/
export default defineConfig({
  site: "https://riskeez.github.io",
  base: "/ai-story",
  integrations: [mdx()],
  build: {
    inlineStylesheets: "always",
    // /stories/<slug>/index.html — сохраняем URL со слешем на конце
    format: "directory",
  },
});
