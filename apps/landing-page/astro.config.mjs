// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Served from the project's Pages site, which lives under /navigator/.
  base: '/navigator/',
  vite: {
    plugins: [tailwindcss()]
  }
});