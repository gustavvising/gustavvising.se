import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import sri from './integrations/sri.mjs';

export default defineConfig({
  site: 'https://gustavvising.se',
  output: 'static',
  build: { format: 'file', inlineStylesheets: 'never' },
  trailingSlash: 'never',
  integrations: [sitemap(), sri()],
  vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 } },
  markdown: {
  shikiConfig: {
    theme: 'vitesse-dark',
    transformers: [{ pre(node) { delete node.properties.style; } }],
  },
},
});