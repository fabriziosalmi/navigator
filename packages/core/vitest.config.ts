import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom', // Changed from 'node' to 'jsdom' for DOM APIs
    // Don't use fake timers by default - let tests opt-in explicitly
    fakeTimers: {
      toFake: [] // Empty array = no fake timers
    },
    // CI-friendly teardown configuration
    teardownTimeout: 30000, // Give 30s for cleanup instead of 10s
    hookTimeout: 30000, // Increase hook timeout for CI
    // Use default thread pool but with better isolation
    isolate: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Measure source only, as the sibling packages do. Without this,
      // vitest 3 also counts tsup.config.ts and the vitest configs, which
      // no test can execute, and core fell under the 80% threshold.
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/types.ts'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
});
