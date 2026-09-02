import { defineConfig } from 'vite';

export default defineConfig({
  // Relative, so the build works wherever it is mounted.
  base: './',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
