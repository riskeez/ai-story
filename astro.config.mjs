// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

// Деплой — Vercel: https://silver-rabbit.vercel.app/
export default defineConfig({
  site: "https://silver-rabbit.vercel.app",
  integrations: [mdx()],
  build: {
    inlineStylesheets: "always",
    // /stories/<slug>/index.html — сохраняем URL со слешем на конце
    format: "directory",
  },
});
