import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

/**
 * CI-specific Vitest configuration for plugin-dom-renderer
 * Stable single-thread execution for CI environment
 */
export default mergeConfig(baseConfig, defineConfig({
  test: {
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      }
    }
  }
}));
