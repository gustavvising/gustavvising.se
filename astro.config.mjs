import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import sri from './integrations/sri.mjs';
import imgDimensions from './integrations/img-dimensions.mjs';

export default defineConfig({
  site: 'https://gustavvising.se',
  output: 'static',
  build: { format: 'file', inlineStylesheets: 'never' },
  trailingSlash: 'never',
  integrations: [sitemap(), imgDimensions(), sri()],
  vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 } },
  markdown: {
  shikiConfig: {
    theme: 'vitesse-dark',
    transformers: [{ pre(node) { delete node.properties.style; } }],
  },
},
});