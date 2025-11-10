import { defineConfig } from 'vite';
import yaml from '@rollup/plugin-yaml';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  // Plugin per supportare l'import di file YAML (come config.yaml)
  plugins: [
    yaml(),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],

  // Base path per GitHub Pages
  // Se il repository si chiama "navigator", il sito sarà su username.github.io/navigator
  // Modifica questo valore se necessario
  base: '/navigator/',

  // Configurazione del build
  build: {
    // Output della build nella cartella dist/ (il workflow CD la copierà in docs/)
    outDir: 'dist',
    // Pulisce la directory dist/ prima di ogni build
    emptyOutDir: true,
    // Source maps per debugging in produzione
    sourcemap: true,
    // Ottimizzazioni
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Mantieni i console.log per debugging
        drop_debugger: true
      }
    },
    // Rollup options
    rollupOptions: {
      output: {
        // Chunk splitting per ottimizzare il caricamento
        manualChunks: {
          // MediaPipe hands viene caricato separatamente
          'vendor': [
            // Aggiungi qui eventuali dipendenze NPM pesanti
          ]
        }
      }
    },
    // Asset inline threshold (file sotto 4kb diventano data URLs)
    assetsInlineLimit: 4096,
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000
  },

  // Configurazione del dev server
  server: {
    port: 3000,
    open: true, // Apre automaticamente il browser
    cors: true,
    // Configurazione per supportare HTTPS (utile per MediaPipe/Camera)
    https: false, // Cambia a true se necessario con certificato self-signed
    // Hot Module Replacement
    hmr: {
      overlay: true
    }
  },

  // Preview server (per testare la build di produzione localmente)
  preview: {
    port: 4173,
    open: true
  },

  // Ottimizzazioni per le dipendenze
  optimizeDeps: {
    include: ['js-yaml'],
    // Escludi dipendenze esterne come MediaPipe CDN
    exclude: []
  },

  // Resolve configuration
  resolve: {
    alias: {
      // Aggiungi alias per facilitare gli import
      '@': '/js',
      '@css': '/css',
      '@config': '/config.yaml'
    }
  },

  // Asset handling
  assetsInclude: ['**/*.yaml', '**/*.yml'],

  // CSS configuration
  css: {
    devSourcemap: true
  }
});
