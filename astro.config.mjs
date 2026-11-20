import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://gustavvising.se',
  output: 'static',
  build: { format: 'file', inlineStylesheets: 'never' },
  trailingSlash: 'never',
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 } },
  markdown: {
    shikiConfig: { theme: 'vitesse-dark', wrap: true },
  },
});